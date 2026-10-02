<?php
/**
 * YAKOUTE FASHION - home page template + menu + logo + permalinks.
 * Run with:  tools\bin\wp.cmd eval-file setup/configure-site.php --user=1
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$root = dirname( __DIR__ );
$img  = $root . '/assets/images';

require_once ABSPATH . 'wp-admin/includes/file.php';
require_once ABSPATH . 'wp-admin/includes/media.php';
require_once ABSPATH . 'wp-admin/includes/image.php';

/**
 * Sideload a local image and return its attachment id.
 */
function yakoute_side( $filepath, $title ) {
	$tmp = wp_tempnam( $filepath );
	copy( $filepath, $tmp );
	$id = media_handle_sideload(
		array(
			'name'     => sanitize_file_name( basename( $filepath ) ),
			'tmp_name' => $tmp,
		),
		0,
		$title
	);
	return is_wp_error( $id ) ? 0 : $id;
}

// ------------------------------------------------------------------ permalinks
update_option( 'permalink_structure', '/%postname%/' );
flush_rewrite_rules( false );

// ------------------------------------------------------------------ front page
$front = get_page_by_path( 'home' );
if ( ! $front ) {
	$front_id = wp_insert_post(
		array(
			'post_title'   => 'الرئيسية',
			'post_name'    => 'home',
			'post_type'    => 'page',
			'post_status'  => 'publish',
			'post_content' => '',
		)
	);
} else {
	$front_id = $front->ID;
}

update_option( 'show_on_front', 'page' );
update_option( 'page_on_front', $front_id );
update_option( 'page_for_posts', 0 );
update_option( 'page_for_posts', 0 );

// Attach the custom template file to the front page.
$front_page = get_post( $front_id );
$front_page->page_template = 'page-templates/front-page.php';
wp_update_post( $front_page );

WP_CLI::log( 'Front page ready (ID ' . $front_id . ')' );

// ------------------------------------------------------------------ media: logo + hero
$logo_path = $root . '/assets/logo/yakoute-logo.png';
if ( file_exists( $logo_path ) ) {
	$logo_id = yakoute_side( $logo_path, 'Yakoute Fashion Logo' );
	if ( $logo_id ) {
		set_theme_mod( 'custom_logo', $logo_id );
		update_option( 'yakoute_logo_id', $logo_id );
		WP_CLI::log( 'Logo set (ID ' . $logo_id . ')' );
	}
}

$favicon_path = $root . '/assets/logo/yakoute-favicon.png';
if ( file_exists( $favicon_path ) ) {
	$fav_id = yakoute_side( $favicon_path, 'Yakoute Fashion Favicon' );
	if ( $fav_id ) {
		update_option( 'site_icon', $fav_id );
		WP_CLI::log( 'Favicon set (ID ' . $fav_id . ')' );
	}
}

$site_images = array(
	'hero_home'  => 'hero-home.jpg',
	'hero_women' => 'hero-women.jpg',
	'hero_men'   => 'hero-men.jpg',
	'hero_kids'  => 'hero-kids.jpg',
	'promo'      => 'promo.jpg',
	'cat_women'  => 'cat-women.jpg',
	'cat_men'    => 'cat-men.jpg',
	'cat_kids'   => 'cat-kids.jpg',
);
foreach ( $site_images as $key => $file ) {
	$p = $img . '/' . $file;
	if ( file_exists( $p ) ) {
		$id = yakoute_side( $p, $key );
		if ( $id ) {
			update_option( 'yakoute_image_' . $key, $id );
			WP_CLI::log( 'Image: ' . $key );
		}
	}
}

// ------------------------------------------------------------------ categories: hero image + theme
$cats = array(
	'women' => array( 'image' => 'cat_women', 'theme' => 'women' ),
	'men'   => array( 'image' => 'cat_men', 'theme' => 'men' ),
	'kids'  => array( 'image' => 'cat_kids', 'theme' => 'kids' ),
);
foreach ( $cats as $slug => $conf ) {
	$term = get_term_by( 'slug', $slug, 'product_cat' );
	if ( ! $term ) {
		continue;
	}
	$img_id = get_option( 'yakoute_image_' . $conf['image'] );
	if ( $img_id ) {
		update_term_meta( $term->term_id, 'yakoute_hero_id', $img_id );
	}
	update_term_meta( $term->term_id, 'yakoute_theme', $conf['theme'] );
}

// ------------------------------------------------------------------ menu
$menu_name = 'القائمة الرئيسية';
$menu      = wp_get_nav_menu_object( $menu_name );
if ( ! $menu ) {
	$menu_id = wp_create_nav_menu( $menu_name );
} else {
	$menu_id = $menu->term_id;
	// reset
	foreach ( wp_get_nav_menu_items( $menu_id ) as $item ) {
		wp_delete_post( $item->ID, true );
	}
}

$home_url = home_url( '/' );
$shop_id  = wc_get_page_id( 'shop' );
$cart_id  = wc_get_page_id( 'cart' );
$contact_id = wc_get_page_id( 'myaccount' );

wp_update_nav_menu_item( $menu_id, 0, array(
	'menu-item-title'  => 'الرئيسية',
	'menu-item-url'    => $home_url,
	'menu-item-status' => 'publish',
) );

if ( $shop_id > 0 ) {
	wp_update_nav_menu_item( $menu_id, 0, array(
		'menu-item-title'     => 'المتجر',
		'menu-item-object'    => 'page',
		'menu-item-object-id' => $shop_id,
		'menu-item-type'      => 'post_type',
		'menu-item-status'    => 'publish',
	) );
}

$genders = array(
	'women' => 'نساء',
	'men'   => 'رجال',
	'kids'  => 'أطفال',
);
foreach ( $genders as $slug => $label ) {
	$term = get_term_by( 'slug', $slug, 'product_cat' );
	if ( ! $term ) {
		continue;
	}
	$item_id = wp_update_nav_menu_item( $menu_id, 0, array(
		'menu-item-title'     => $label,
		'menu-item-object'    => 'product_cat',
		'menu-item-object-id' => $term->term_id,
		'menu-item-type'      => 'taxonomy',
		'menu-item-status'    => 'publish',
	) );

	// sub categories
	$children = get_terms( array(
		'taxonomy'   => 'product_cat',
		'parent'     => $term->term_id,
		'hide_empty' => false,
	) );
	foreach ( $children as $child ) {
		wp_update_nav_menu_item( $menu_id, 0, array(
			'menu-item-title'     => $child->name,
			'menu-item-object'    => 'product_cat',
			'menu-item-object-id' => $child->term_id,
			'menu-item-type'      => 'taxonomy',
			'menu-item-parent-id' => $item_id,
			'menu-item-status'    => 'publish',
		) );
	}
}

if ( $cart_id > 0 ) {
	wp_update_nav_menu_item( $menu_id, 0, array(
		'menu-item-title'     => 'السلة',
		'menu-item-object'    => 'page',
		'menu-item-object-id' => $cart_id,
		'menu-item-type'      => 'post_type',
		'menu-item-status'    => 'publish',
	) );
}

set_theme_mod( 'nav_menu_locations', array( 'primary' => $menu_id ) );
WP_CLI::log( 'Menu ready (ID ' . $menu_id . ')' );

// ------------------------------------------------------------------ misc options
update_option( 'blogname', 'Yakoute Fashion' );
update_option( 'blogdescription', 'متجر الأزياء والموضة — توصيل لجميع مدن المغرب والدفع عند الاستلام' );
update_option( 'timezone_string', 'Africa/Casablanca' );
update_option( 'date_format', 'j F Y' );
update_option( 'woocommerce_demo_store', 'no' );
update_option( 'woocommerce_allow_tracking', 'no' );

// Remove default "Hello world" content.
foreach ( array( 'hello-world' ) as $slug ) {
	$p = get_page_by_path( $slug, OBJECT, 'post' );
	if ( $p ) {
		wp_delete_post( $p->ID, true );
	}
}
$sample = get_page_by_path( 'sample-page' );
if ( $sample ) {
	wp_delete_post( $sample->ID, true );
}
$privacy = get_page_by_path( 'privacy-policy' );
if ( $privacy ) {
	wp_trash_post( $privacy->ID );
}

WP_CLI::success( 'Site configured: front page, menu, logo, images, permalinks.' );
