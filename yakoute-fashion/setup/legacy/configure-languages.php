<?php
/**
 * YAKOUTE FASHION - Polylang setup: Arabic (default), French, English.
 * Run with:  tools\bin\wp.cmd eval-file setup/configure-languages.php --user=1
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! defined( 'POLYLANG_VERSION' ) ) {
	WP_CLI::error( 'Polylang is not active.' );
}

$languages = array(
	array( 'name' => 'العربية', 'slug' => 'ar', 'locale' => 'ar',   'rtl' => 1, 'flag_code' => 'ma' ),
	array( 'name' => 'Français', 'slug' => 'fr', 'locale' => 'fr_FR', 'rtl' => 0, 'flag_code' => 'fr' ),
	array( 'name' => 'English',  'slug' => 'en', 'locale' => 'en_US', 'rtl' => 0, 'flag_code' => 'gb' ),
);

foreach ( $languages as $lang ) {
	$term = get_term_by( 'slug', $lang['slug'], 'language' );

	$description = array(
		'locale'    => $lang['locale'],
		'rtl'       => $lang['rtl'],
		'flag_code' => $lang['flag_code'],
		'active'    => true,
	);

	if ( ! $term ) {
		$created = wp_insert_term(
			$lang['name'],
			'language',
			array(
				'slug'        => $lang['slug'],
				'description' => maybe_serialize( $description ),
			)
		);
		if ( is_wp_error( $created ) ) {
			WP_CLI::warning( 'Could not create ' . $lang['slug'] . ': ' . $created->get_error_message() );
			continue;
		}
		$term_id = $created['term_id'];
		WP_CLI::log( 'Language created: ' . $lang['name'] );
	} else {
		$term_id = $term->term_id;
		wp_update_term(
			$term_id,
			'language',
			array( 'description' => maybe_serialize( $description ) )
		);
	}

	// Fallbacks + order.
	update_term_meta( $term_id, 'pll_order', (string) array_search( $lang, $languages, true ) );
	update_term_meta( $term_id, 'pll_fallbacks', maybe_serialize( array( $lang['locale'] ) ) );
}

update_option( 'default_language', 'ar' );
update_option( 'hide_default', 'no' );
update_option( 'force_lang', 0 );
update_option( 'url_modification', 'different' );

WP_CLI::success( 'Polylang languages configured: AR (default), FR, EN.' );
