<?php
/**
 * YAKOUTE FASHION - create the FR and EN translations of every product,
 * its categories, and make the front page available in all languages.
 *
 * Idempotent: re-running only fills in what is missing.
 * Run: tools\bin\wp.cmd eval-file setup/create-translations.php --user=1
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! function_exists( 'pll_set_post_language' ) ) {
	WP_CLI::error( 'Polylang API not available.' );
}

$json = json_decode( file_get_contents( dirname( __DIR__ ) . '/setup/products.json' ), true );
if ( ! $json || empty( $json['products'] ) ) {
	WP_CLI::error( 'Could not read setup/products.json' );
}

$langs = array( 'fr', 'en' );

/* ------------------------------------------------------------------ 1. categories */
$term_map = array(); // "ar_id:lang" => new term id

WP_CLI::log( '--- categories ---' );

foreach ( $json['categories'] as $cat ) {
	$ar = get_term_by( 'slug', $cat['slug'], 'product_cat' );
	if ( ! $ar ) {
		WP_CLI::warning( 'Missing AR category: ' . $cat['slug'] );
		continue;
	}

	if ( 'ar' === pll_get_term_language( $ar->term_id, 'slug' ) ) {
		// Real Arabic-only description, no more "ar — fr — en" mash.
		wp_update_term( $ar->term_id, 'product_cat', array( 'description' => '' ) );
	}

	foreach ( $langs as $lang ) {
		if ( empty( $cat[ $lang ] ) ) {
			continue;
		}
		$translations = pll_get_term_translations( $ar->term_id );
		if ( isset( $translations[ $lang ] ) ) {
			$term_map[ $ar->term_id . ':' . $lang ] = $translations[ $lang ];
			continue;
		}

		$created = pll_insert_term(
			$cat[ $lang ],
			'product_cat',
			$lang,
			array(
				'slug'   => $cat['slug'] . '-' . $lang,
				'parent' => 0, // parent linked right after
			)
		);

		if ( is_wp_error( $created ) ) {
			WP_CLI::warning( $cat['slug'] . '/' . $lang . ': ' . $created->get_error_message() );
			continue;
		}

		$term_map[ $ar->term_id . ':' . $lang ] = $created;
	}
}

// Link parent/child categories now that every translation exists.
foreach ( $json['categories'] as $cat ) {
	if ( empty( $cat['parent'] ) ) {
		continue;
	}
	$ar = get_term_by( 'slug', $cat['slug'], 'product_cat' );
	$ar_parent = get_term_by( 'slug', $cat['parent'], 'product_cat' );
	if ( ! $ar || ! $ar_parent ) {
		continue;
	}
	foreach ( array( 'ar' ) + array_combine( $langs, $langs ) as $lang ) {
		$child  = 'ar' === $lang ? $ar->term_id : ( $term_map[ $ar->term_id . ':' . $lang ] ?? 0 );
		$parent = 'ar' === $lang ? $ar_parent->term_id : ( $term_map[ $ar_parent->term_id . ':' . $lang ] ?? 0 );
		if ( $child && $parent ) {
			wp_update_term( $child, 'product_cat', array( 'parent' => $parent ) );
		}
	}
}

// Rebuild the translation links for every category at once.
$cat_links = array();
foreach ( $json['categories'] as $cat ) {
	$ar = get_term_by( 'slug', $cat['slug'], 'product_cat' );
	if ( ! $ar ) {
		continue;
	}
	$row = array( 'ar' => $ar->term_id );
	foreach ( $langs as $lang ) {
		if ( ! empty( $term_map[ $ar->term_id . ':' . $lang ] ) ) {
			$row[ $lang ] = $term_map[ $ar->term_id . ':' . $lang ];
		}
	}
	$cat_links[ $ar->term_id ] = array_filter( $row );
}
if ( $cat_links ) {
	pll_save_term_translations( $cat_links );
}
WP_CLI::log( 'Categories: ' . count( $cat_links ) . ' x ' . count( $langs ) . ' translations.' );

/* ------------------------------------------------------------------ 2. products */
WP_CLI::log( '--- products ---' );
$product_count = 0;

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

	// Categories for this product, translated.
	$ar_cat_ids = $ar_product->get_category_ids();
	$link_row   = array( 'ar' => $ar_post->ID );
	$new_ids    = array();

	foreach ( $langs as $lang ) {
		$ids = array();
		foreach ( $ar_cat_ids as $cid ) {
			if ( ! empty( $term_map[ $cid . ':' . $lang ] ) ) {
				$ids[] = $term_map[ $cid . ':' . $lang ];
			}
		}
		$new_ids[ $lang ] = $ids;
	}

	foreach ( $langs as $lang ) {
		$existing = pll_get_post_translations( $ar_post->ID );
		if ( isset( $existing[ $lang ] ) ) {
			$link_row[ $lang ] = $existing[ $lang ];
			continue;
		}

		$copy = new WC_Product_Simple();
		$copy->set_name( $p[ $lang ]['name'] );
		$copy->set_slug( $p['slug'] . '-' . $lang );
		$copy->set_status( 'publish' );
		$copy->set_catalog_visibility( 'visible' );
		$copy->set_description( $p[ $lang ]['desc'] );
		$copy->set_short_description( $p[ $lang ]['desc'] );
		$copy->set_sku( strtoupper( $p['slug'] ) . '-' . strtoupper( $lang ) );
		$copy->set_featured( $ar_product->get_featured() );
		$copy->set_category_ids( $new_ids[ $lang ] );
		$copy->set_image_id( $ar_product->get_image_id() );
		$copy->set_gallery_image_ids( $ar_product->get_gallery_image_ids() );
		$copy->set_manage_stock( true );
		$copy->set_stock_quantity( $ar_product->get_stock_quantity() );
		$copy->set_stock_status( 'instock' );
		$copy->set_regular_price( $ar_product->get_regular_price() );
		$copy->set_sale_price( $ar_product->get_sale_price() );
		$copy->set_weight( $ar_product->get_weight() );
		$new_id = $copy->save();

		pll_set_post_language( $new_id, $lang );
		$link_row[ $lang ] = $new_id;
		++$product_count;
	}

	pll_save_post_translations( array( $ar_post->ID => array_filter( $link_row ) ) );
}

WP_CLI::success( 'Created ' . $product_count . ' translated products (FR/EN).' );

/* ------------------------------------------------------------------ 3. shared pages */
WP_CLI::log( '--- pages available in all languages ---' );

$front = (int) get_option( 'page_on_front' );
if ( $front ) {
	pll_save_post_translations( array( $front => array( 'ar' => $front, 'fr' => $front, 'en' => $front ) ) );
	wp_set_post_terms( $front, 'language', array( 'ar', 'fr', 'en' ) );
	WP_CLI::log( 'Front page: all languages.' );
}

foreach ( array( 'shop', 'cart', 'checkout', 'myaccount' ) as $page ) {
	$pid = wc_get_page_id( $page );
	if ( $pid > 0 ) {
		pll_save_post_translations( array( $pid => array( 'ar' => $pid, 'fr' => $pid, 'en' => $pid ) ) );
		wp_set_post_terms( $pid, 'language', array( 'ar', 'fr', 'en' ) );
		WP_CLI::log( ucfirst( $page ) . ' page: all languages.' );
	}
}
