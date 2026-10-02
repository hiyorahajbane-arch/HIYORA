<?php
/**
 * YAKOUTE FASHION - language linking / repair.
 *
 *  - gives the original (Arabic) products and categories their `ar` language
 *  - rebuilds the Polylang translation groups ar/fr/en
 *  - rebuilds variable-product copies (sizes + prices) for FR/EN
 *  - keeps the front page shared by the three languages
 *
 * Idempotent. Run: tools\bin\wp.cmd eval-file setup/link-languages.php --user=1
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! function_exists( 'pll_set_post_language' ) ) {
	WP_CLI::error( 'Polylang API not available.' );
}

$json = json_decode( file_get_contents( dirname( __DIR__ ) . '/setup/products.json' ), true );
$langs = array( 'fr', 'en' );

/* ================================================================== categories */
WP_CLI::log( '--- categories ---' );

$cat_links = array();

foreach ( $json['categories'] as $cat ) {
	$ar = get_term_by( 'slug', $cat['slug'], 'product_cat' );
	if ( ! $ar ) {
		WP_CLI::warning( 'Missing AR category: ' . $cat['slug'] );
		continue;
	}

	pll_set_term_language( $ar->term_id, 'ar' );
	$row = array( 'ar' => $ar->term_id );

	foreach ( $langs as $lang ) {
		if ( empty( $cat[ $lang ] ) ) {
			continue;
		}
		$copy = get_term_by( 'slug', $cat['slug'] . '-' . $lang, 'product_cat' );
		if ( ! $copy ) {
			$copy = get_term_by( 'name', $cat[ $lang ], 'product_cat' );
		}
		if ( ! $copy ) {
			WP_CLI::warning( 'Missing ' . $lang . ' category: ' . $cat['slug'] );
			continue;
		}
		pll_set_term_language( $copy->term_id, $lang );
		$row[ $lang ] = $copy->term_id;
	}

	$cat_links[ $ar->term_id ] = $row;
}

if ( $cat_links ) {
	// pll_save_term_translations() takes ONE group per call, keyed by language.
	foreach ( $cat_links as $row ) {
		pll_save_term_translations( $row );
	}
}

// Parents, now that all three languages exist.
foreach ( $json['categories'] as $cat ) {
	if ( empty( $cat['parent'] ) ) {
		continue;
	}
	$child  = get_term_by( 'slug', $cat['slug'], 'product_cat' );
	$parent = get_term_by( 'slug', $cat['parent'], 'product_cat' );
	if ( ! $child || ! $parent ) {
		continue;
	}
	wp_update_term( $child->term_id, 'product_cat', array( 'parent' => $parent->term_id ) );

	foreach ( $langs as $lang ) {
		$c = get_term_by( 'slug', $cat['slug'] . '-' . $lang, 'product_cat' );
		$p = get_term_by( 'slug', $cat['parent'] . '-' . $lang, 'product_cat' );
		if ( $c && $p ) {
			wp_update_term( $c->term_id, 'product_cat', array( 'parent' => $p->term_id ) );
		}
	}
}

WP_CLI::log( 'Categories linked: ' . count( $cat_links ) );

/* ================================================================== products */
WP_CLI::log( '--- products ---' );

$product_links = array();
$rebuilt       = 0;

foreach ( $json['products'] as $p ) {
	$ar_post = get_page_by_path( $p['slug'], OBJECT, 'product' );
	if ( ! $ar_post ) {
		WP_CLI::warning( 'Missing product: ' . $p['slug'] );
		continue;
	}

	$ar_product = wc_get_product( $ar_post->ID );
	if ( ! $ar_product ) {
		continue;
	}

	pll_set_post_language( $ar_post->ID, 'ar' );
	$row = array( 'ar' => $ar_post->ID );

	// Translated category ids.
	$cat_ids_by_lang = array( 'ar' => $ar_product->get_category_ids() );
	foreach ( $langs as $lang ) {
		$ids = array();
		foreach ( $ar_product->get_category_ids() as $cid ) {
			$copy = get_term_by( 'slug', null, 'product_cat' );
			$trans = pll_get_term_translations( $cid );
			if ( isset( $trans[ $lang ] ) ) {
				$ids[] = $trans[ $lang ];
			}
		}
		$cat_ids_by_lang[ $lang ] = $ids;
	}

	foreach ( $langs as $lang ) {
		$existing = get_page_by_path( $p['slug'] . '-' . $lang, OBJECT, 'product' );

		// Rebuild the copy when the type no longer matches (variable -> simple).
		if ( $existing ) {
			$copy = wc_get_product( $existing->ID );
			$type_mismatch = ( $ar_product->is_type( 'variable' ) && ! $copy->is_type( 'variable' ) )
				|| ( ! $ar_product->is_type( 'variable' ) && $copy->is_type( 'variable' ) );
			if ( $type_mismatch ) {
				wp_delete_post( $existing->ID, true );
				$existing = null;
			}
		}

		if ( $existing ) {
			$copy = wc_get_product( $existing->ID );
			$copy->set_name( $p[ $lang ]['name'] );
			$copy->set_description( $p[ $lang ]['desc'] );
			$copy->set_short_description( $p[ $lang ]['desc'] );
			$copy->set_category_ids( $cat_ids_by_lang[ $lang ] );
			$copy->set_status( 'publish' );
			$copy->set_catalog_visibility( 'visible' );
			$copy_id = $copy->save();
		} else {
			$is_var  = $ar_product->is_type( 'variable' );
			$product = $is_var ? new WC_Product_Variable() : new WC_Product_Simple();
			$product->set_name( $p[ $lang ]['name'] );
			$product->set_slug( $p['slug'] . '-' . $lang );
			$product->set_status( 'publish' );
			$product->set_catalog_visibility( 'visible' );
			$product->set_description( $p[ $lang ]['desc'] );
			$product->set_short_description( $p[ $lang ]['desc'] );
			$product->set_sku( strtoupper( $p['slug'] ) . '-' . strtoupper( $lang ) );
			$product->set_featured( $ar_product->get_featured() );
			$product->set_category_ids( $cat_ids_by_lang[ $lang ] );
			$product->set_image_id( $ar_product->get_image_id() );
			$product->set_gallery_image_ids( $ar_product->get_gallery_image_ids() );
			// A variable product is never purchasable on its own: its stock lives
			// on the variations, so managing it on the parent makes WooCommerce
			// report the whole product as out of stock.
			$product->set_manage_stock( ! $is_var );
			$product->set_stock_quantity( $is_var ? null : $ar_product->get_stock_quantity() );
			$product->set_stock_status( 'instock' );
			$product->set_regular_price( $ar_product->get_regular_price() );
			$product->set_sale_price( $ar_product->get_sale_price() );
			$product->set_weight( $ar_product->get_weight() );
			$product->set_attributes( $ar_product->get_attributes() );
			$copy_id = $product->save();

			if ( $is_var ) {
				// Rebuild the same sizes with the same prices.
				$ar_children = $ar_product->get_children();
				foreach ( $ar_children as $i => $ar_variation_id ) {
					$ar_v = wc_get_product( $ar_variation_id );
					$v    = new WC_Product_Variation();
					$v->set_parent_id( $copy_id );
					$v->set_attributes( $ar_v->get_attributes() );
					$v->set_regular_price( $ar_v->get_regular_price() );
					$v->set_sale_price( $ar_v->get_sale_price() );
					$v->set_manage_stock( true );
					$v->set_stock_quantity( $ar_v->get_stock_quantity() );
					$v->set_stock_status( $ar_v->get_stock_status() );
					$v->set_menu_order( $i );
					$v->set_image_id( $ar_v->get_image_id() );
					$v->save();
				}
				WC_Product_Variable::sync( $copy_id );
			}
			++$rebuilt;
		}

		pll_set_post_language( $copy_id, $lang );
		$row[ $lang ] = $copy_id;
	}

	$product_links[ $ar_post->ID ] = $row;
}

if ( $product_links ) {
	// pll_save_post_translations() takes ONE group per call, keyed by language.
	foreach ( $product_links as $row ) {
		pll_save_post_translations( $row );
	}
}

WP_CLI::success( 'Products linked: ' . count( $product_links ) . ' groups, ' . $rebuilt . ' copies rebuilt.' );

/* ================================================================== shared pages */
WP_CLI::log( '--- front page ---' );

// Only the front page is shared by the three languages. The WooCommerce pages
// have one page per language and are handled by setup/link-shop-pages.php.
$front = (int) get_option( 'page_on_front' );

if ( $front > 0 ) {
	if ( ! function_exists( 'yakoute_set_page_languages' ) ) {
		WP_CLI::error( 'yakoute-multilingual.php mu-plugin is not loaded.' );
	}
	yakoute_set_page_languages( $front );
	WP_CLI::log( '  page ' . $front . ' (' . get_post_field( 'post_name', $front ) . '): ' . implode( ',', (array) wp_get_post_terms( $front, 'language', array( 'fields' => 'slugs' ) ) ) );
}

WP_CLI::success( 'Front page set to AR/FR/EN.' );
