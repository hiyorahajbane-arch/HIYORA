<?php
/**
 * YAKOUTE FASHION - WooCommerce store configuration
 * Run with:  tools\bin\wp.cmd eval-file setup/configure-store.php
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'WooCommerce' ) ) {
	WP_CLI::error( 'WooCommerce is not active.' );
}

wc_maybe_define_constant( 'WOOCOMMERCE_SHOW_STORE_NOTICE', false );
update_option( 'woocommerce_allow_tracking', 'no' );
update_option( 'woocommerce_show_marketplace_suggestions', 'no' );
update_option( 'woocommerce_merchant_email_notifications', 'no' );
update_option( 'woocommerce_task_list_hidden', 'yes' );
update_option( 'woocommerce_onboarding_profile', array( 'skipped' => true ) );
// New installs enable "Coming soon" which hides the whole catalog.
update_option( 'woocommerce_coming_soon', 'no' );

// ---------------------------------------------------------------- currency
update_option( 'woocommerce_currency', 'MAD' );
update_option( 'woocommerce_currency_pos', 'right_space' );
update_option( 'woocommerce_price_thousand_sep', ' ' );
update_option( 'woocommerce_price_decimal_sep', ',' );
update_option( 'woocommerce_price_num_decimals', 2 );

// ---------------------------------------------------------------- location
update_option( 'woocommerce_default_country', 'MA:10' ); // Casablanca
update_option( 'woocommerce_store_country', 'MA' );
update_option( 'woocommerce_store_city', 'الدار البيضاء' );
update_option( 'woocommerce_store_address', '', );
update_option( 'woocommerce_store_postcode', '' );
update_option( 'woocommerce_allowed_countries', 'all' ); // any Moroccan / diaspora customer
update_option( 'woocommerce_ship_to_countries', 'all' );
update_option( 'woocommerce_ship_to_destination', 'shipping' );

// ---------------------------------------------------------------- selling
update_option( 'woocommerce_enable_guest_checkout', 'yes' );
update_option( 'woocommerce_enable_checkout_login_reminder', 'no' );
update_option( 'woocommerce_enable_signup_and_login_from_checkout', 'no' );
update_option( 'woocommerce_enable_checkout_login', 'no' );
update_option( 'woocommerce_registration_generate_password', 'yes' );
update_option( 'woocommerce_cart_redirect_after_add', 'no' );
update_option( 'woocommerce_enable_ajax_add_to_cart', 'yes' );
update_option( 'woocommerce_manage_stock', 'yes' );
update_option( 'woocommerce_notify_low_stock', 'yes' );
update_option( 'woocommerce_notify_low_stock_amount', '3' );
update_option( 'woocommerce_notify_no_stock', 'yes' );
update_option( 'woocommerce_hide_out_of_stock_items', 'no' );
update_option( 'woocommerce_stock_format', '' );

// ---------------------------------------------------------------- catalog
update_option( 'woocommerce_catalog_columns', 4 );
update_option( 'woocommerce_catalog_rows', 4 );
update_option( 'woocommerce_shop_page_display', '' );
update_option( 'woocommerce_enable_reviews', 'yes' );
update_option( 'woocommerce_manage_stock', 'yes' );
update_option( 'woocommerce_weight_unit', 'kg' );
update_option( 'woocommerce_dimension_unit', 'cm' );
update_option( 'woocommerce_product_weight', '' );
update_option( 'woocommerce_product_dimensions', '' );
update_option( 'woocommerce_attribute_sorting', 'menu_order' );

// ---------------------------------------------------------------- emails
update_option( 'woocommerce_email_from_address', 'contact@yakoute.ma' );
update_option( 'woocommerce_email_from_name', 'Yakoute Fashion' );
update_option( 'woocommerce_admin_email', 'contact@yakoute.ma' );
update_option( 'woocommerce_stock_email_recipient', 'contact@yakoute.ma' );
update_option( 'woocommerce_stock_email_from_address', 'contact@yakoute.ma' );
update_option( 'woocommerce_stock_email_from_name', 'Yakoute Fashion' );

// ---------------------------------------------------------------- pages
$pages = array(
	'woocommerce_cart_page_id'      => 'cart',
	'woocommerce_checkout_page_id'  => 'checkout',
	'woocommerce_myaccount_page_id' => 'my-account',
);
foreach ( $pages as $option => $slug ) {
	$existing = get_page_by_path( $slug );
	if ( $existing ) {
		update_option( $option, $existing->ID );
	}
}

// ---------------------------------------------------------------- images
update_option( 'woocommerce_thumbnail_image_width', 600 );
update_option( 'woocommerce_single_image_width', 800 );
update_option( 'woocommerce_product_thumbnails_columns', 3 );

WP_CLI::success( 'Store base options updated.' );
