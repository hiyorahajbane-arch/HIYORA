<?php
/**
 * YAKOUTE FASHION - give every translation the same slug as the Arabic version,
 * so the URL of a product or a category only depends on the language directory.
 *
 * Run: tools\bin\wp.cmd eval-file setup\share-slugs.php --user=1
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

global $wpdb;

$json = json_decode( file_get_contents( dirname( __DIR__ ) . '/setup/products.json' ), true );
if ( ! $json ) {
	WP_CLI::error( 'Could not read setup/products.json' );
}

$changed = 0;

/* ------------------------------------------------------------------ products */
foreach ( $json['products'] as $p ) {
	$ar = get_page_by_path( $p['slug'], OBJECT, 'product' );
	if ( ! $ar ) {
		continue;
	}
	foreach ( array( 'fr', 'en' ) as $lang ) {
		$copy = get_page_by_path( $p['slug'] . '-' . $lang, OBJECT, 'product' );
		if ( ! $copy ) {
			continue;
		}
		if ( $copy->post_name === $ar->post_name ) {
			continue;
		}
		$wpdb->update( $wpdb->posts, array( 'post_name' => $ar->post_name ), array( 'ID' => $copy->ID ) );
		clean_post_cache( $copy->ID );
		++$changed;
	}
}

/* ------------------------------------------------------------------ categories */
foreach ( $json['categories'] as $cat ) {
	$ar = get_term_by( 'slug', $cat['slug'], 'product_cat' );
	if ( ! $ar ) {
		continue;
	}
	foreach ( array( 'fr', 'en' ) as $lang ) {
		$copy = get_term_by( 'slug', $cat['slug'] . '-' . $lang, 'product_cat' );
		if ( ! $copy || $copy->slug === $ar->slug ) {
			continue;
		}
		$wpdb->update( $wpdb->terms, array( 'slug' => $ar->slug ), array( 'term_id' => $copy->term_id ) );
		clean_term_cache( $copy->term_id, 'product_cat' );
		++$changed;
	}
}

WP_CLI::success( 'Slugs aligned on ' . $changed . ' translations.' );
