<?php
/**
 * YAKOUTE FASHION - rebuild the three Polylang languages from scratch with the
 * official API (the first attempt created the terms by hand, which left the
 * `term_language` side empty, so product categories could not get a language).
 *
 * Afterwards run:
 *   setup\link-languages.php
 *   setup\link-pages.php
 *
 * Run: tools\bin\wp.cmd eval-file setup\rebuild-languages.php --user=1
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$langs = PLL()->model->languages;

WP_CLI::log( '--- removing existing languages ---' );
foreach ( array( 'en', 'fr', 'ar' ) as $slug ) {
	$l = $langs->get( $slug );
	if ( ! $l ) {
		WP_CLI::log( $slug . ': nothing to remove' );
		continue;
	}
	$id = $l->get_prop( 'term_id' );
	WP_CLI::log( 'deleting ' . $slug . ' (term ' . $id . '): ' . wp_json_encode( $langs->delete( $id ) ) );
}

$langs->clean_cache();
delete_transient( 'pll_languages_list' );

WP_CLI::log( '--- adding languages ---' );
$wanted = array(
	array( 'name' => 'العربية', 'slug' => 'ar', 'locale' => 'ar',   'rtl' => true,  'term_group' => 0 ),
	array( 'name' => 'Français', 'slug' => 'fr', 'locale' => 'fr_FR', 'rtl' => false, 'term_group' => 1 ),
	array( 'name' => 'English',  'slug' => 'en', 'locale' => 'en_US', 'rtl' => false, 'term_group' => 2 ),
);

foreach ( $wanted as $data ) {
	$added = $langs->add( $data );
	WP_CLI::log( $data['slug'] . ': ' . ( is_wp_error( $added ) ? 'ERROR ' . $added->get_error_message() : 'added' ) );
}

$langs->clean_cache();

WP_CLI::log( '--- verify ---' );
foreach ( array( 'ar', 'fr', 'en' ) as $slug ) {
	$l = $langs->get( $slug );
	if ( ! $l ) {
		WP_CLI::log( $slug . ': MISSING' );
		continue;
	}
	WP_CLI::log( sprintf(
		'%s: id=%-3s locale=%-6s rtl=%-4s lang_term=%-4s term_language_term=%s',
		$slug,
		$l->get_prop( 'term_id' ),
		$l->get_locale(),
		$l->get_prop( 'rtl' ) ? 'yes' : 'no',
		$l->get_tax_prop( 'language', 'term_id' ) ?: 'NONE',
		$l->get_tax_prop( 'term_language', 'term_id' ) ?: 'NONE'
	) );
}

update_option( 'default_language', 'ar' );
update_option( 'force_lang', 1 );
update_option( 'hide_default', 'no' );
update_option( 'url_modification', 'different' );

WP_CLI::success( 'Languages rebuilt. Now run setup\link-languages.php and setup\link-pages.php.' );
