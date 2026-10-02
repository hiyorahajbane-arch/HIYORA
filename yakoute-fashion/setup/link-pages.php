<?php
/**
 * YAKOUTE FASHION - keep the front page shared by the three languages.
 *
 * Only the front page is shared. The WooCommerce pages (shop, cart, checkout,
 * my account) have one page per language, created by setup/link-shop-pages.php;
 * giving them all three languages at once makes Polylang and WooCommerce
 * disagree on which language is being displayed.
 *
 * Run: tools\bin\wp.cmd eval-file setup/link-pages.php --user=1
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! function_exists( 'yakoute_set_page_languages' ) ) {
	WP_CLI::error( 'yakoute-multilingual.php mu-plugin is not loaded.' );
}

$pages = array( (int) get_option( 'page_on_front' ) );

foreach ( array_unique( array_filter( $pages ) ) as $pid ) {
	yakoute_set_page_languages( $pid );
	$langs = wp_get_post_terms( $pid, 'language', array( 'fields' => 'slugs' ) );
	WP_CLI::log( sprintf(
		'page %-5s %-14s languages: %s',
		$pid,
		get_post_field( 'post_name', $pid ),
		implode( ',', (array) $langs )
	) );
}

WP_CLI::success( 'Front page available in AR/FR/EN (Woo pages are per language).' );
