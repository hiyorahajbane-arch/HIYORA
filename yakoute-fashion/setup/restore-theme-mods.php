<?php
/**
 * YAKOUTE FASHION - restore the child-theme mods lost in the crash
 * (custom logo + favicon).
 *
 * Idempotent. Run: tools\bin\wp.cmd eval-file setup\restore-theme-mods.php --user=1
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$mods = get_option( 'theme_mods_yakoute', array() );
if ( ! is_array( $mods ) ) {
	$mods = array();
}

$logo = get_page_by_title( 'Yakoute Fashion Logo', OBJECT, 'attachment' );
if ( $logo ) {
	$mods['custom_logo'] = (int) $logo->ID;
	WP_CLI::log( 'custom_logo -> ' . $logo->ID );
} else {
	WP_CLI::warning( 'Logo attachment not found.' );
}

$favicon = get_page_by_title( 'Yakoute Fashion Favicon', OBJECT, 'attachment' );
if ( $favicon ) {
	$mods['site_icon'] = (int) $favicon->ID;
	WP_CLI::log( 'site_icon -> ' . $favicon->ID );
}

update_option( 'theme_mods_yakoute', $mods );

WP_CLI::success( 'Theme mods restored.' );
