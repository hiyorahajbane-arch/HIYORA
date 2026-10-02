<?php
/**
 * YAKOUTE FASHION - Polylang options are all stored in the single `polylang`
 * option (array), not as separate wp options. This script sets them correctly:
 *
 *   - Arabic is the default language and stays at the site root
 *   - French and English live in /fr/ and /en/
 *   - the language always comes from the URL
 *
 * Run: tools\bin\wp.cmd eval-file setup\tune-polylang.php --user=1
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$options = get_option( 'polylang', array() );
if ( ! is_array( $options ) ) {
	$options = array();
}

$options['default_lang']  = 'ar';
$options['force_lang']    = 1;
$options['hide_default']  = 0;
$options['rewrite']       = 1;
$options['redirect_lang'] = 0;
$options['browser']       = 0;
$options['media_support'] = 0;
$options['version']       = defined( 'POLYLANG_VERSION' ) ? POLYLANG_VERSION : ( $options['version'] ?? '' );

if ( empty( $options['domains'] ) || ! is_array( $options['domains'] ) ) {
	$options['domains'] = array( 'ar' => '' );
}

update_option( 'polylang', $options );

// Keep the separate wp options in sync for anything reading them.
update_option( 'default_language', 'ar' );
update_option( 'force_lang', 1 );
update_option( 'hide_default', 'no' );

flush_rewrite_rules( false );

WP_CLI::log( 'polylang options: ' . wp_json_encode( array_intersect_key( $options, array_flip( array( 'default_lang', 'force_lang', 'hide_default', 'rewrite' ) ) ) ) );
WP_CLI::success( 'Polylang configured: AR at root, FR in /fr/, EN in /en/.' );
