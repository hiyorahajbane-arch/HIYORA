<?php
/**
 * YAKOUTE FASHION - switch the WooCommerce cart / checkout / my-account pages
 * from the block editor to the classic shortcodes.
 *
 * The block cart and checkout render entirely in the browser through the Store
 * API, which hides the payment methods and nonces from the server response and
 * fights with the custom multilingual WooCommerce URLs set up in
 * yakoute-multilingual.php. The classic shortcodes are server rendered, so the
 * COD gateway, the free shipping method and the checkout nonce are all present
 * in the markup and can be verified with plain HTTP requests.
 *
 * Idempotent. Run: tools\bin\wp.cmd eval-file setup\use-classic-woo-pages.php
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$yak_shortcodes = array(
	'cart'       => '<!-- wp:shortcode -->[woocommerce_cart]<!-- /wp:shortcode -->',
	'checkout'   => '<!-- wp:shortcode -->[woocommerce_checkout]<!-- /wp:shortcode -->',
	'my-account' => '<!-- wp:shortcode -->[woocommerce_my_account]<!-- /wp:shortcode -->',
);

global $wpdb;

$rows = $wpdb->get_results(
	"SELECT p.ID, p.post_name
	 FROM {$wpdb->posts} p
	 WHERE p.post_type = 'page'
	   AND p.post_status = 'publish'
	   AND ( p.post_name IN ( 'cart', 'checkout', 'my-account' )
	         OR p.post_name REGEXP '^(cart|checkout|my-account)-(ar|fr|en)$' )",
	ARRAY_A
);

if ( ! $rows ) {
	WP_CLI::error( 'No WooCommerce account pages found.' );
}

$count = 0;
foreach ( $rows as $row ) {
	$slug = $row['post_name'];

	// cart-fr => cart
	$key = preg_replace( '/-(?:ar|fr|en)$/', '', $slug );
	if ( ! isset( $yak_shortcodes[ $key ] ) ) {
		continue;
	}

	$content = $yak_shortcodes[ $key ];

	if ( get_post_field( 'post_content', $row['ID'] ) === $content ) {
		WP_CLI::log( sprintf( '  %-14s already classic', $slug ) );
		continue;
	}

	wp_update_post(
		array(
			'ID'           => (int) $row['ID'],
			'post_content' => $content,
		)
	);

	WP_CLI::log( sprintf( '  %-14s -> [%s]', $slug, $key ) );
	++$count;
}

wc_delete_product_transients();
delete_transient( 'wc_blocks_cart_hash_fragments' );

WP_CLI::success( sprintf( 'Switched %d page(s) to the classic WooCommerce shortcodes.', $count ) );
