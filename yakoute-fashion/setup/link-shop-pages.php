<?php
/**
 * YAKOUTE FASHION - one WooCommerce page per language.
 *
 * Polylang cannot resolve a page that belongs to several languages reliably,
 * which made /shop/ list the wrong products. Each Woo page (shop, cart,
 * checkout, my account) therefore gets a French and an English copy, linked as
 * translations of the Arabic one.
 *
 * The copies keep a `-fr` / `-en` slug because WordPress resolves `pagename`
 * without the language, so two pages cannot share a slug. The mu-plugin maps
 * the clean URLs /fr/cart/, /en/cart/, ... onto those pages, so the suffix
 * never appears in a link.
 *
 * Run: tools\bin\wp.cmd eval-file setup\link-shop-pages.php --user=1
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! function_exists( 'pll_set_post_language' ) ) {
	WP_CLI::error( 'Polylang API not available.' );
}

global $wpdb;

$langs = array( 'fr', 'en' );
$titles = array(
	'shop'      => array( 'ar' => 'المتجر', 'fr' => 'Boutique', 'en' => 'Shop' ),
	'cart'      => array( 'ar' => 'السلة', 'fr' => 'Panier', 'en' => 'Cart' ),
	'checkout'  => array( 'ar' => 'إتمام الطلب', 'fr' => 'Paiement', 'en' => 'Checkout' ),
	'myaccount' => array( 'ar' => 'حسابي', 'fr' => 'Mon compte', 'en' => 'My account' ),
);

foreach ( $titles as $slug => $names ) {
	$ar_id = wc_get_page_id( $slug );

	// The option can point at a post that no longer exists: drop it so
	// WooCommerce recreates the page instead of skipping it.
	if ( $ar_id > 0 && ! get_post( $ar_id ) ) {
		delete_option( 'woocommerce_' . $slug . '_page_id' );
		$ar_id = 0;
	}

	// The page itself was lost: let WooCommerce recreate it first.
	if ( $ar_id <= 0 ) {
		if ( class_exists( 'WC_Install' ) && method_exists( 'WC_Install', 'create_pages' ) ) {
			WC_Install::create_pages();
			$ar_id = wc_get_page_id( $slug );
		} elseif ( function_exists( 'wc_create_pages' ) ) {
			wc_create_pages();
			$ar_id = wc_get_page_id( $slug );
		}
	}

	if ( $ar_id <= 0 || ! get_post( $ar_id ) ) {
		WP_CLI::warning( 'No page for ' . $slug );
		continue;
	}

	$ar_post = get_post( $ar_id );
	$row     = array( 'ar' => $ar_id );

	pll_set_post_language( $ar_id, 'ar' );

	// The Arabic page is the one WooCommerce created with an English title.
	if ( $ar_post->post_title !== $names['ar'] ) {
		wp_update_post(
			array(
				'ID'         => $ar_id,
				'post_title' => $names['ar'],
			)
		);
		WP_CLI::log( '  ' . $slug . ': title -> ' . $names['ar'] );
	}

	$existing_translations = pll_get_post_translations( $ar_id );

	foreach ( $langs as $lang ) {
		$copy_id = isset( $existing_translations[ $lang ] ) ? (int) $existing_translations[ $lang ] : 0;

		if ( $copy_id && 'page' === get_post_type( $copy_id ) ) {
			wp_update_post(
				array(
					'ID'         => $copy_id,
					'post_title' => $names[ $lang ],
					// Repair slugs left over by the shared-slug experiment,
					// which produced cart-2 / cart-3.
					'post_name'  => $ar_post->post_name . '-' . $lang,
				)
			);
		} else {
			$copy_id = wp_insert_post(
				array(
					'post_title'   => $names[ $lang ],
					// WordPress resolves `pagename` without the language, so a
					// translation cannot reuse the Arabic slug. The mu-plugin
					// maps /fr/cart/ and /en/cart/ to these pages instead.
					'post_name'    => $ar_post->post_name . '-' . $lang,
					'post_content' => $ar_post->post_content,
					'post_status'  => 'publish',
					'post_type'    => 'page',
					'post_parent'  => $ar_post->post_parent,
				)
			);
		}

		if ( is_wp_error( $copy_id ) || ! $copy_id ) {
			WP_CLI::warning( $slug . '/' . $lang . ': could not create the page' );
			continue;
		}

		pll_set_post_language( $copy_id, $lang );
		$row[ $lang ] = $copy_id;
	}

	pll_save_post_translations( $row );
	WP_CLI::log( sprintf(
		'%-10s ar=%-4s fr=%-4s en=%-4s  slugs: %s',
		$slug,
		$ar_id,
		$row['fr'] ?? '-',
		$row['en'] ?? '-',
		implode( ',', array_map(
			function ( $id ) {
				return get_post_field( 'post_name', $id );
			},
			$row
		) )
	) );
}

// The Arabic pages must not keep the extra language terms.
foreach ( array_keys( $titles ) as $slug ) {
	$ar_id = wc_get_page_id( $slug );
	if ( $ar_id > 0 ) {
		$tt_ids = $wpdb->get_col(
			$wpdb->prepare(
				"SELECT tt.term_taxonomy_id FROM $wpdb->term_relationships tr
				 INNER JOIN $wpdb->term_taxonomy tt ON tr.term_taxonomy_id = tt.term_taxonomy_id
				 INNER JOIN $wpdb->terms t ON tt.term_id = t.term_id
				 WHERE tr.object_id = %d AND tt.taxonomy = 'language' AND t.slug <> 'ar'",
				$ar_id
			)
		);
		foreach ( $tt_ids as $tt_id ) {
			$wpdb->delete( $wpdb->term_relationships, array( 'object_id' => $ar_id, 'term_taxonomy_id' => $tt_id ) );
		}
		if ( $tt_ids ) {
			clean_term_cache( array(), 'language', false );
			wp_cache_delete( $ar_id, 'term' );
		}
	}
}

flush_rewrite_rules( false );

WP_CLI::success( 'One WooCommerce page per language.' );
