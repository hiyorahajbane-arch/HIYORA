<?php
/**
 * YAKOUTE FASHION - give every translation its own slug (Polylang standard):
 *
 *   /product/robe-ete-fleurie/                 (Arabic)
 *   /fr/product/robe-ete-fleurie-fr/            (French)
 *   /en/product/robe-ete-fleurie-en/            (English)
 *
 * This is what the Polylang language switcher links to, and it keeps WordPress
 * able to resolve a single post from its name.
 *
 * Run: tools\bin\wp.cmd eval-file setup\distinct-slugs.php --user=1
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
		$trs = pll_get_post_translations( $ar->ID );
		$id  = $trs[ $lang ] ?? 0;
		if ( ! $id ) {
			continue;
		}
		$wanted = $p['slug'] . '-' . $lang;
		$copy   = get_post( $id );
		if ( $copy->post_name === $wanted ) {
			continue;
		}
		$wpdb->update( $wpdb->posts, array( 'post_name' => $wanted ), array( 'ID' => $id ) );
		clean_post_cache( $id );
		++$changed;
	}
}

/* ------------------------------------------------------------------ categories */
foreach ( $json['categories'] as $cat ) {
	$ar = get_term_by( 'slug', $cat['slug'], 'product_cat' );
	if ( ! $ar ) {
		continue;
	}
	$trs = pll_get_term_translations( $ar->term_id );
	foreach ( array( 'fr', 'en' ) as $lang ) {
		$id = $trs[ $lang ] ?? 0;
		if ( ! $id ) {
			continue;
		}
		$wanted = $cat['slug'] . '-' . $lang;
		$copy   = get_term( $id, 'product_cat' );
		if ( $copy->slug === $wanted ) {
			continue;
		}
		$wpdb->update( $wpdb->terms, array( 'slug' => $wanted ), array( 'term_id' => $id ) );
		clean_term_cache( $id, 'product_cat' );
		++$changed;
	}
}

flush_rewrite_rules( false );

WP_CLI::success( 'Restored distinct slugs on ' . $changed . ' translations.' );
