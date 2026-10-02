<?php
/**
 * YAKOUTE FASHION - apply correct regular/sale prices to already-imported products.
 * products.json: "sale" = original price, "price" = current (discounted) price.
 * Run:  tools\bin\wp.cmd eval-file setup/fix-sale-prices.php --user=1
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$json = json_decode( file_get_contents( dirname( __DIR__ ) . '/setup/products.json' ), true );
if ( ! $json || empty( $json['products'] ) ) {
	WP_CLI::error( 'Could not read setup/products.json' );
}

$fixed = 0;

foreach ( $json['products'] as $p ) {
	$id = get_page_by_path( $p['slug'], OBJECT, 'product' );
	if ( ! $id ) {
		continue;
	}

	$regular   = ! empty( $p['sale'] ) ? (string) $p['sale'] : (string) $p['price'];
	$on_sale   = ! empty( $p['sale'] ) && (float) $p['sale'] > (float) $p['price'];
	$sale      = $on_sale ? (string) $p['price'] : '';

	$product = wc_get_product( $id->ID );
	if ( ! $product ) {
		continue;
	}

	if ( $product->is_type( 'variable' ) ) {
		foreach ( $product->get_children() as $vid ) {
			$v = wc_get_product( $vid );
			$v->set_regular_price( $regular );
			$v->set_sale_price( $sale );
			$v->save();
		}
		WC_Product_Variable::sync( $product->get_id() );
	} else {
		$product->set_regular_price( $regular );
		$product->set_sale_price( $sale );
		$product->save();
	}

	++$fixed;
	WP_CLI::log( $p['slug'] . ': ' . ( $on_sale ? $regular . ' -> ' . $sale : $regular . ' (no sale)' ) );
}

WP_CLI::success( 'Prices updated for ' . $fixed . ' products.' );
