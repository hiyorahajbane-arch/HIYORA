<?php
/**
 * YAKOUTE FASHION - stock repair.
 *
 * Variable products kept `_stock_status = outofstock` on the parent even
 * though their variations were in stock, which made WooCommerce refuse to add
 * them to the cart (`{"error":true}` from wc-ajax=add_to_cart).
 *
 * This script:
 *  - restores the stock quantity of every product and variation from
 *    setup/products.json
 *  - re-syncs the stock status of the variable parents
 *  - makes sure the shop settings allow the catalogue to be browsed
 *
 * Idempotent. Run: tools\bin\wp.cmd eval-file setup\fix-stock.php --user=1
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! function_exists( 'wc_get_product' ) ) {
	WP_CLI::error( 'WooCommerce is not active.' );
}

$json = json_decode( file_get_contents( dirname( __DIR__ ) . '/setup/products.json' ), true );
if ( ! $json || empty( $json['products'] ) ) {
	WP_CLI::error( 'Could not read setup/products.json.' );
}

/* ------------------------------------------------------------------ settings */
update_option( 'woocommerce_manage_stock', 'yes' );
update_option( 'woocommerce_catalog_visibility', 'visible' );
update_option( 'woocommerce_hide_out_of_stock_items', 'no' );
update_option( 'woocommerce_notify_no_stock', 'yes' );
update_option( 'woocommerce_stock_format', '' );

// WooCommerce decides the stock status of a variable parent by querying
// wc_product_meta_lookup. That table is regenerated asynchronously by Action
// Scheduler, so a fresh import leaves it stale. This flag makes the query read
// postmeta directly while the script runs.
update_option( 'woocommerce_product_lookup_table_is_generating', 'yes' );

WP_CLI::log( '--- products ---' );

$fixed    = 0;
$variants = 0;

foreach ( $json['products'] as $p ) {
	$stock = isset( $p['stock'] ) ? (int) $p['stock'] : 0;

	// Every language copy shares the stock of the Arabic original.
	$ids = array();
	$ar  = get_page_by_path( $p['slug'], OBJECT, 'product' );
	if ( ! $ar ) {
		WP_CLI::warning( 'Missing product: ' . $p['slug'] );
		continue;
	}
	$ids[] = $ar->ID;

	if ( function_exists( 'pll_get_post_translations' ) ) {
		foreach ( pll_get_post_translations( $ar->ID ) as $id ) {
			$ids[] = (int) $id;
		}
	}

	foreach ( array_unique( $ids ) as $id ) {
		$product = wc_get_product( $id );
		if ( ! $product ) {
			continue;
		}

		$has_stock = true;

		if ( $product->is_type( 'variable' ) ) {
			foreach ( $product->get_children() as $vid ) {
				$variation = wc_get_product( $vid );
				if ( ! $variation ) {
					continue;
				}
				$variation->set_manage_stock( true );
				$variation->set_stock_quantity( $stock );
				$variation->set_stock_status( 'instock' );
				$variation->save();
				++$variants;
			}

			// Stock is managed per variation, never on the parent. Leaving
			// manage_stock enabled on a variable parent stops WooCommerce from
			// deriving the parent status from its children, which pins the
			// product to outofstock and blocks add-to-cart.
			$product = wc_get_product( $id );
			$product->set_manage_stock( false );
			$product->set_stock_status( 'instock' );
			$product->save();

			WC_Product_Variable::sync_stock_status( $id );

			$product = wc_get_product( $id );
			$has_stock = $product->is_in_stock();
		} else {
			$product->set_manage_stock( true );
			$product->set_stock_quantity( $stock );
			$product->set_stock_status( 'instock' );
			$product->save();

			$product = wc_get_product( $id );
			$has_stock = $product->is_in_stock();
		}

		// The `outofstock` term in product_visibility hides the product from
		// the shop and makes WooCommerce refuse to add it to the cart.
		if ( $has_stock ) {
			wp_remove_object_terms( $id, 'outofstock', 'product_visibility' );
			wp_set_object_terms( $id, 'visible', 'product_visibility' );
		}

		++$fixed;
	}

	WP_CLI::log( sprintf( '  %-24s stock=%d', $p['slug'], $stock ) );
}

wc_delete_product_transients();

delete_option( 'woocommerce_product_lookup_table_is_generating' );

WP_CLI::success( sprintf( 'Stock restored: %d product copies, %d variations.', $fixed, $variants ) );
