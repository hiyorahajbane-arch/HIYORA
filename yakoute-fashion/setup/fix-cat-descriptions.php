<?php
/**
 * YAKOUTE FASHION - give every product category the description of its own
 * language instead of the "ar - fr - en" concatenation left by the import.
 *
 * Idempotent. Run: tools\bin\wp.cmd eval-file setup\fix-cat-descriptions.php --user=1
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$json = json_decode( file_get_contents( dirname( __DIR__ ) . '/setup/products.json' ), true );
$langs = array( 'ar' => '', 'fr' => '-fr', 'en' => '-en' );
$fixed = 0;

foreach ( $json['categories'] as $cat ) {
	foreach ( $langs as $lang => $suffix ) {
		$term = get_term_by( 'slug', $cat['slug'] . $suffix, 'product_cat' );
		if ( ! $term ) {
			continue;
		}
		$want = isset( $cat[ $lang ] ) ? $cat[ $lang ] : '';
		if ( $term->description !== $want ) {
			wp_update_term(
				$term->term_id,
				'product_cat',
				array( 'description' => $want )
			);
			$fixed++;
		}
	}
}

WP_CLI::success( 'Category descriptions fixed: ' . $fixed . '.' );
