<?php
/**
 * YAKOUTE FASHION - import categories, size attribute and demo products.
 * Run with:  tools\bin\wp.cmd eval-file setup/import-products.php --user=1
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'WooCommerce' ) ) {
	WP_CLI::error( 'WooCommerce not active.' );
}

$data_file = __DIR__ . '/products.json';
$assets    = dirname( __DIR__ ) . '/assets/products';
$data      = json_decode( file_get_contents( $data_file ), true );

if ( ! $data ) {
	WP_CLI::error( 'Cannot read products.json' );
}

require_once ABSPATH . 'wp-admin/includes/taxonomy.php';
require_once ABSPATH . 'wp-admin/includes/plugin.php';

/**
 * Sideload a local image into the media library and return the attachment id.
 */
function yakoute_sideload( $filepath, $title ) {
	require_once ABSPATH . 'wp-admin/includes/file.php';
	require_once ABSPATH . 'wp-admin/includes/media.php';
	require_once ABSPATH . 'wp-admin/includes/image.php';

	$tmp = wp_tempnam( $filepath );
	copy( $filepath, $tmp );

	$file_array = array(
		'name'     => sanitize_file_name( basename( $filepath ) ),
		'tmp_name' => $tmp,
	);

	$id = media_handle_sideload( $file_array, 0, $title );

	if ( is_wp_error( $id ) ) {
		WP_CLI::warning( 'Image failed: ' . $filepath . ' - ' . $id->get_error_message() );
		return 0;
	}
	return $id;
}

// ------------------------------------------------------------------ categories
$cat_ids = array();

foreach ( $data['categories'] as $cat ) {
	$parent_id = 0;
	if ( ! empty( $cat['parent'] ) && isset( $cat_ids[ $cat['parent'] ] ) ) {
		$parent_id = $cat_ids[ $cat['parent'] ];
	}

	$term = term_exists( $cat['slug'], 'product_cat' );
	if ( $term ) {
		$term_id = is_array( $term ) ? $term['term_id'] : $term;
		wp_update_term(
			$term_id,
			'product_cat',
			array(
				'name'     => $cat['ar'],
				'slug'     => $cat['slug'],
				'parent'   => $parent_id,
				'description' => $cat['ar'] . ' — ' . $cat['fr'] . ' — ' . $cat['en'],
			)
		);
	} else {
		$created  = wp_insert_term( $cat['ar'], 'product_cat', array(
			'slug'   => $cat['slug'],
			'parent' => $parent_id,
		) );
		$term_id = is_wp_error( $created ) ? 0 : $created['term_id'];
		if ( $term_id ) {
			wp_update_term(
				$term_id,
				'product_cat',
				array( 'description' => $cat['ar'] . ' — ' . $cat['fr'] . ' — ' . $cat['en'] )
			);
		}
	}

	if ( $term_id ) {
		$cat_ids[ $cat['slug'] ] = $term_id;
		WP_CLI::log( 'Category: ' . $cat['ar'] . ' (' . $cat['slug'] . ')' );
	}
}

WP_CLI::log( 'Categories: ' . count( $cat_ids ) );

// ------------------------------------------------------------------ size attribute
$size_values = array();
foreach ( $data['sizes'] as $group => $sizes ) {
	foreach ( $sizes as $s ) {
		$size_values[ $s ] = $s;
	}
}
ksort( $size_values );

// Make sure every size value exists as a taxonomy term.
foreach ( $size_values as $size => $label ) {
	if ( ! term_exists( $size, 'pa_size' ) ) {
		wp_insert_term( $label, 'pa_size', array( 'slug' => sanitize_title( $size ) ) );
	}
}

if ( ! wc_attribute_taxonomy_id_by_name( 'size' ) ) {
	$created = wc_create_attribute(
		array(
			'name'         => __( 'المقاس', 'yakoute' ),
			'slug'         => 'size',
			'type'         => 'select',
			'order_by'     => 'menu_order',
			'has_archives' => false,
		)
	);
	if ( is_wp_error( $created ) ) {
		WP_CLI::warning( 'Could not create size attribute: ' . $created->get_error_message() );
	} else {
		WP_CLI::log( 'Created global attribute: size (id ' . $created . ')' );
	}
}

// Build the attribute object used by every product.
$size_attr = new WC_Product_Attribute();
$size_attr->set_id( wc_attribute_taxonomy_id_by_name( 'size' ) );
$size_attr->set_name( 'size' );
$size_attr->set_options( array_values( $size_values ) );
$size_attr->set_position( 0 );
$size_attr->set_visible( true );
$size_attr->set_variation( true );

$gender_attr = new WC_Product_Attribute();
$gender_attr->set_id( 0 );
$gender_attr->set_name( 'الجنس' );
$gender_attr->set_options( array( 'نساء', 'رجال', 'أطفال' ) );
$gender_attr->set_position( 1 );
$gender_attr->set_visible( false );
$gender_attr->set_variation( false );

// ------------------------------------------------------------------ products
$count = 0;

foreach ( $data['products'] as $p ) {
	$existing = get_page_by_path( $p['slug'], OBJECT, 'product' );
	if ( $existing ) {
		WP_CLI::log( 'Skipping (exists): ' . $p['ar']['name'] );
		continue;
	}

	$sizes    = $data['sizes'][ $p['sizes'] ];
	$is_var   = count( $sizes ) > 1 || 'clothes' === $p['sizes'] || 'shoes' === $p['sizes'];

	$product = $is_var ? new WC_Product_Variable() : new WC_Product_Simple();
	$product->set_name( $p['ar']['name'] );
	$product->set_slug( $p['slug'] );
	$product->set_status( 'publish' );
	$product->set_catalog_visibility( 'visible' );
	$product->set_description( $p['ar']['desc'] );
	$product->set_short_description( $p['ar']['desc'] );
	$product->set_sku( strtoupper( $p['slug'] ) );
	$product->set_featured( in_array( $p['slug'], array( 'robe-ete-fleurie', 'caftan-marocain', 'chemise-homme', 'tenue-ete-enfant' ), true ) );
	$product->set_category_ids( array( $cat_ids[ $p['cat'] ], $cat_ids[ $p['gender'] ] ) );
	$product->set_attributes( array( $size_attr, $gender_attr ) );

	// Translations kept in meta for the language switcher.
	$product->update_meta_data( '_yakoute_i18n', array(
		'ar' => array( 'name' => $p['ar']['name'], 'desc' => $p['ar']['desc'] ),
		'fr' => array( 'name' => $p['fr']['name'], 'desc' => $p['fr']['desc'] ),
		'en' => array( 'name' => $p['en']['name'], 'desc' => $p['en']['desc'] ),
	) );

	// image
	$img_path = $assets . '/' . $p['image'];
	if ( file_exists( $img_path ) ) {
		$att_id = yakoute_sideload( $img_path, $p['ar']['name'] );
		if ( $att_id ) {
			$product->set_image_id( $att_id );
		}
	}

	// NOTE: in products.json "sale" holds the ORIGINAL price (before discount),
	// "price" holds the current discounted price.
	$yak_regular = ! empty( $p['sale'] ) ? (string) $p['sale'] : (string) $p['price'];
	$yak_on_sale = ! empty( $p['sale'] ) && (float) $p['sale'] > (float) $p['price'];

	if ( $is_var ) {
		// Stock lives on the variations. A variable parent must not manage
		// stock itself, otherwise WooCommerce never derives its status from
		// the children and the product ends up stuck on "out of stock".
		$product->set_manage_stock( false );
		$product->set_stock_status( 'instock' );
		$product_id = $product->save();

		foreach ( $sizes as $i => $size ) {
			$variation = new WC_Product_Variation();
			$variation->set_parent_id( $product_id );
			$variation->set_attributes( array( 'size' => $size ) );
			$variation->set_regular_price( $yak_regular );
			if ( $yak_on_sale ) {
				$variation->set_sale_price( (string) $p['price'] );
			}
			$variation->set_manage_stock( true );
			$variation->set_stock_quantity( (int) $p['stock'] );
			$variation->set_stock_status( 'instock' );
			$variation->set_menu_order( $i );
			$variation->set_image_id( $product->get_image_id() );
			$variation->save();
		}
		WC_Product_Variable::sync( $product_id );
	} else {
		$product->set_manage_stock( true );
		$product->set_stock_quantity( (int) $p['stock'] );
		$product->set_stock_status( 'instock' );
		$product->set_regular_price( $yak_regular );
		if ( $yak_on_sale ) {
			$product->set_sale_price( (string) $p['price'] );
		}
		$product_id = $product->save();
	}

	$count++;
	WP_CLI::log( 'Product: ' . $p['ar']['name'] );
}

WP_CLI::success( 'Imported ' . $count . ' products and ' . count( $cat_ids ) . ' categories.' );
