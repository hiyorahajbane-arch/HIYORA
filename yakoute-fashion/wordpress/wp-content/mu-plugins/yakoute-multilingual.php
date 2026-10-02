<?php
/**
 * Plugin Name: YAKOUTE - WooCommerce multilingual support
 * Description: Adds products, product categories and product tags to Polylang's translated object types (Polylang free does not ship its WooCommerce integration), prevents the site-root redirect loop, and keeps the front page shared by the three languages.
 * Version: 1.0.0
 * Author: Yakoute Fashion
 */

defined( 'ABSPATH' ) || exit;

if ( ! defined( 'YAKOUTE_ML_VERSION' ) ) {
	define( 'YAKOUTE_ML_VERSION', '1.0.0' );
}

/* ---------------------------------------------------------- language context */
/**
 * Remember the language of a checkout submission.
 *
 * Placing an order posts to /?wc-ajax=checkout, which carries no language in
 * the URL, so Polylang falls back to the default language and every generated
 * link (the order-received URL above all) points back to Arabic. The hidden
 * _wp_http_referer field of the checkout form still holds the language of the
 * page the customer came from, which is what the rest of the request must use.
 */
function yakoute_checkout_language() {
	$lang = '';

	if ( isset( $_REQUEST['_wp_http_referer'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification
		$path = (string) wp_parse_url( wp_unslash( $_REQUEST['_wp_http_referer'] ), PHP_URL_PATH ); // phpcs:ignore WordPress.Security
		if ( preg_match( '#^/(fr|en)(/|$)#', $path, $m ) ) {
			$lang = $m[1];
		}
	}

	return $lang;
}

add_filter(
	'pll_current_language',
	function ( $lang ) {
		if ( ! is_admin() && empty( $lang ) ) {
			$from_checkout = yakoute_checkout_language();
			if ( $from_checkout ) {
				return $from_checkout;
			}
		}
		return $lang;
	},
	5
);

/* ------------------------------------------------------------------ products */
/**
 * Unconditional: Polylang builds this list before WooCommerce registers the
 * `product` post type, so post_type_exists() is not reliable at filter time.
 */
add_filter(
	'pll_get_post_types',
	function ( $post_types ) {
		$post_types['product'] = 'product';
		return $post_types;
	},
	5
);

/* ------------------------------------------------------------------ taxonomies */
add_filter(
	'pll_get_taxonomies',
	function ( $taxonomies ) {
		$taxonomies['product_cat'] = 'product_cat';
		$taxonomies['product_tag'] = 'product_tag';
		return $taxonomies;
	},
	5
);

/* ------------------------------------------------------------------ Woo pages */
/**
 * WooCommerce pages (shop, cart, checkout, my account) get one page per
 * language so each language keeps a clean URL:
 *
 *   /shop/          /fr/shop/          /en/shop/
 *   /cart/          /fr/cart/          /en/cart/
 *   /checkout/      /fr/checkout/      /en/checkout/
 *   /my-account/    /fr/my-account/    /en/my-account/
 *
 * WordPress resolves `pagename` without taking the language into account, so
 * /fr/cart/ would always find the Arabic page: a translation cannot reuse the
 * Arabic slug. The French and English pages therefore keep a `-fr` / `-en`
 * suffix (setup/link-shop-pages.php), and the rewrite rules below map the clean
 * URLs onto them:
 *
 *   /fr/cart/       -> page cart-fr     (page_id)
 *   /en/cart/       -> page cart-en
 *   /fr/checkout/   -> page checkout-fr
 *   /en/my-account/ -> page my-account-en
 *
 * `post_type=product` (the shop archive) is already handled by Polylang.
 *
 * @return array WooCommerce page slug => Arabic page id.
 */
function yakoute_woo_page_ids() {
	if ( ! function_exists( 'wc_get_page_id' ) ) {
		return array();
	}

	$ids = array();

	// The raw options are read on purpose: wc_get_page_id() is filtered below to
	// return the page of the current language, and this map must always be keyed
	// by the Arabic pages so the slugs stay language independent.
	foreach ( array( 'shop', 'cart', 'checkout', 'myaccount' ) as $slug ) {
		$id = (int) get_option( 'woocommerce_' . $slug . '_page_id' );
		if ( $id <= 0 ) {
			$id = (int) wc_get_page_id( $slug );
		}
		if ( $id > 0 ) {
			$ids[ $slug ] = $id;
		}
	}

	return $ids;
}

/**
 * Every page id used by a WooCommerce page in any language, keyed by slug.
 *
 * WooCommerce only ever knows the default-language page ids, so its own
 * page-level logic (the empty-cart redirect below being the first to break)
 * silently skips the French and English pages.
 *
 * @return array<string,int[]>
 */
function yakoute_woo_page_ids_all() {
	$map   = get_option( 'yakoute_woo_page_map', array() );
	$pages = is_array( $map ) ? $map : array();
	$ids   = array();

	foreach ( $pages as $lang => $slugs ) {
		if ( ! is_array( $slugs ) ) {
			continue;
		}
		foreach ( $slugs as $slug => $id ) {
			$ids[ $slug ][] = (int) $id;
		}
	}

	// The WooCommerce options are the source of truth for the Arabic pages.
	foreach ( array( 'cart', 'checkout', 'myaccount' ) as $slug ) {
		$id = (int) wc_get_page_id( $slug );
		if ( $id > 0 ) {
			$ids[ $slug ][] = $id;
		}
	}

	foreach ( $ids as $slug => $list ) {
		$ids[ $slug ] = array_values( array_unique( $list ) );
	}

	return $ids;
}

/**
 * Is the currently rendered page the checkout page of any language?
 *
 * @return bool
 */
function yakoute_is_checkout_page() {
	global $wp;

	$ids = yakoute_woo_page_ids_all();
	if ( empty( $ids['checkout'] ) || ! is_page( $ids['checkout'] ) ) {
		return false;
	}

	// The order-received and order-pay endpoints own their own flow.
	return empty( $wp->query_vars['order-pay'] ) && ! isset( $wp->query_vars['order-received'] );
}

/**
 * Stop WooCommerce from redirecting only the Arabic checkout, and redirect the
 * French and English ones to the cart of their own language instead.
 *
 * @param bool $redirect Whether to redirect.
 * @return bool
 */
add_filter(
	'woocommerce_checkout_redirect_empty_cart',
	function ( $redirect ) {
		if ( ! yakoute_is_checkout_page() || ! function_exists( 'WC' ) ) {
			return $redirect;
		}

		// WC() already tried to redirect the Arabic page; this keeps it.
		if ( is_page( (int) wc_get_page_id( 'checkout' ) ) ) {
			return $redirect;
		}

		return false;
	}
);

add_action(
	'template_redirect',
	function () {
		if ( ! yakoute_is_checkout_page() || ! function_exists( 'WC' ) ) {
			return;
		}

		if ( ! WC()->cart->is_empty() || is_customize_preview() ) {
			return;
		}

		$cart = get_option( 'yakoute_woo_page_map', array() );
		$lang = function_exists( 'pll_current_language' ) ? pll_current_language( 'slug' ) : 'ar';
		$id   = (int) ( $cart[ $lang ]['cart'] ?? 0 );

		if ( $id ) {
			$url = get_permalink( $id );
		} else {
			$url = wc_get_cart_url();
		}

		if ( $url ) {
			wp_safe_redirect( $url );
			exit;
		}
	},
	5
);

add_filter(
	'query_vars',
	function ( $vars ) {
		$vars[] = 'yakoute_lang';
		$vars[] = 'yakoute_page';
		$vars[] = 'yakoute_endpoint';
		return $vars;
	}
);

add_action(
	'init',
	function () {
		$pages = yakoute_woo_page_ids();
		unset( $pages['shop'] ); // The shop archive is post_type=product.

		if ( ! $pages || ! function_exists( 'pll_get_post_translations' ) ) {
			return;
		}

		$map = array();
		$names = array();
		foreach ( $pages as $ar_id ) {
			$slug = get_post_field( 'post_name', $ar_id );
			$names[] = $slug;

			// Arabic is the default language and lives at the site root, but
			// Polylang with hide_default=0 still redirects /cart/ to /ar/cart/.
			// Listing the Arabic page here keeps /cart/ on the root.
			$map['ar'][ $slug ] = (int) $ar_id;

			$translations = pll_get_post_translations( $ar_id );
			foreach ( array( 'fr', 'en' ) as $lang ) {
				if ( ! empty( $translations[ $lang ] ) ) {
					$map[ $lang ][ $slug ] = (int) $translations[ $lang ];
				}
			}
		}

		if ( ! $map ) {
			return;
		}

		// Only persist a map that resolved every language: a partial map would
		// replace a good one and silently break /fr/ and /en/ forever.
		if ( ! $map['fr'] || ! $map['en'] ) {
			return;
		}

		$langs = implode( '|', array_map( 'preg_quote', array_keys( $map ) ) );
		$names = implode( '|', array_map( 'preg_quote', array_unique( $names ) ) );

		// /fr/cart/, /en/cart/, ... and, with hide_default=0, also /ar/cart/.
		// WooCommerce endpoints hang off these pages (order-received, order-pay,
		// order-pay, thank-you), so the path is left open after the page slug.
		add_rewrite_rule(
			"($langs)/($names)(/(.*))?$",
			'index.php?yakoute_lang=$matches[1]&yakoute_page=$matches[2]&yakoute_endpoint=$matches[4]',
			'top'
		);

		// ... but Arabic must also answer on /cart/ (no /ar/ prefix).
		add_rewrite_rule(
			"($names)(/(.*))?$",
			'index.php?yakoute_lang=ar&yakoute_page=$matches[1]&yakoute_endpoint=$matches[3]',
			'top'
		);

		// The Terms page follows the same clean pattern: /terms/, /fr/terms/,
		// /en/terms/ instead of the stored terms-fr / terms-en slugs.
		$terms_id = (int) get_option( 'woocommerce_terms_page_id' );
		if ( $terms_id && function_exists( 'pll_get_post_translations' ) ) {
			$map['ar']['terms'] = $terms_id;

			$translations = pll_get_post_translations( $terms_id );
			foreach ( array( 'fr', 'en' ) as $lang ) {
				if ( ! empty( $translations[ $lang ] ) ) {
					$map[ $lang ]['terms'] = (int) $translations[ $lang ];
				}
			}

			$term_langs = implode( '|', array_map( 'preg_quote', array_keys( $map ) ) );
			add_rewrite_rule( "($term_langs)/terms/?$", 'index.php?yakoute_lang=$matches[1]&yakoute_page=terms', 'top' );
			add_rewrite_rule( 'terms/?$', 'index.php?yakoute_lang=ar&yakoute_page=terms', 'top' );
		}

		update_option( 'yakoute_woo_page_map', $map );
	},
	20
);

/**
 * Turn yakoute_lang=fr & yakoute_page=cart-fr into the real page id.
 */
add_action(
	'parse_request',
	function ( $wp ) {
		$lang = $wp->query_vars['yakoute_lang'] ?? '';
		$slug = $wp->query_vars['yakoute_page'] ?? '';

		if ( ! $lang || ! $slug ) {
			return;
		}

		$map = get_option( 'yakoute_woo_page_map', array() );
		$id  = is_array( $map ) ? (int) ( $map[ $lang ][ $slug ] ?? 0 ) : 0;

		if ( ! $id ) {
			return;
		}

		$wp->query_vars['page_id']   = $id;
		$wp->query_vars['pagename']  = '';
		$wp->query_vars['name']      = '';
		$wp->query_vars['post_type'] = 'page';
		$wp->query_vars['lang']      = $lang;

		// Hand the rest of the path back to WooCommerce (order-received, ...).
		$endpoint = trim( (string) ( $wp->query_vars['yakoute_endpoint'] ?? '' ), '/' );

		// Remove the custom vars instead of blanking them: a leftover empty
		// query var makes WooCommerce treat the request as the front page.
		unset( $wp->query_vars['yakoute_lang'], $wp->query_vars['yakoute_page'], $wp->query_vars['yakoute_endpoint'] );

		if ( $endpoint ) {
			$parts = explode( '/', $endpoint );
			$wp->query_vars[ $parts[0] ] = count( $parts ) > 1 ? $parts[1] : '';
		}
	},
	1
);

/**
 * Point WooCommerce at the page of the current language, so wc_get_cart_url(),
 * wc_get_checkout_url(), the "proceed to checkout" button and the add-to-cart
 * redirect all stay inside /fr/ or /en/.
 *
 * wc_get_page_id() applies a per-page filter name, so every WooCommerce page
 * needs its own hook: there is no generic `woocommerce_get_page_id`.
 */
add_filter(
	'woocommerce_get_page_id',
	function ( $page_id ) {
		return $page_id;
	}
);

foreach ( array( 'shop', 'cart', 'checkout', 'myaccount', 'terms' ) as $yakoute_woo_page ) {
	add_filter(
		'woocommerce_get_' . $yakoute_woo_page . '_page_id',
		function ( $page_id ) use ( $yakoute_woo_page ) {
			if ( is_admin() || ! $page_id || ! function_exists( 'pll_current_language' ) || ! function_exists( 'pll_get_post_translations' ) ) {
				return $page_id;
			}

			$lang = pll_current_language( 'slug' );
			if ( ! $lang || 'ar' === $lang ) {
				return $page_id;
			}

			$translations = pll_get_post_translations( (int) $page_id );
			if ( ! $translations || empty( $translations[ $lang ] ) ) {
				return $page_id;
			}

			$translated = (int) $translations[ $lang ];
			unset( $yakoute_woo_page );

			return $translated;
		},
		10,
		1
	);
}

/**
 * Same clean permalinks for the translated Terms page: /fr/terms-fr/ becomes
 * /fr/terms/ and the Arabic one drops the /ar/ prefix.
 *
 * @param string  $permalink Permalink.
 * @param WP_Post $post      Page object.
 * @return string
 */
add_filter(
	'page_link',
	function ( $permalink, $post ) {
		$post_id = $post instanceof WP_Post ? $post->ID : (int) $post;
		$terms   = (int) get_option( 'woocommerce_terms_page_id' );

		if ( ! $terms || ! function_exists( 'pll_get_post_translations' ) ) {
			return $permalink;
		}

		$translations = pll_get_post_translations( $terms );
		if ( ! $translations || ! in_array( $post_id, array_map( 'intval', $translations ), true ) ) {
			return $permalink;
		}

		$path = (string) wp_parse_url( $permalink, PHP_URL_PATH );

		foreach ( $translations as $lang => $id ) {
			if ( (int) $id !== $post_id ) {
				continue;
			}
			$clean = 'ar' === $lang
				? preg_replace( '#^/ar/terms/?$#', '/terms/', $path )
				: preg_replace( '#^/[a-z]{2}/terms-[a-z]{2}/?$#', '/' . $lang . '/terms/', $path );

			return $clean ? str_replace( $path, $clean, $permalink ) : $permalink;
		}

		return $permalink;
	},
	20,
	2
);

/**
 * Return the clean URL of a translated WooCommerce page: /fr/cart-fr/ becomes
 * /fr/cart/, so the language suffix never shows up in a link.
 *
 * @param string  $permalink Permalink of the page.
 * @param WP_Post $post      Page object.
 * @return string
 */
add_filter(
	'page_link',
	function ( $permalink, $post ) {
		$post_id = $post instanceof WP_Post ? $post->ID : (int) $post;
		$map     = get_option( 'yakoute_woo_page_map', array() );

		if ( ! is_array( $map ) || ! $map ) {
			return $permalink;
		}

		$clean_slug = '';
		$lang       = '';
		foreach ( $map as $page_lang => $by_slug ) {
			foreach ( $by_slug as $slug => $id ) {
				if ( (int) $id === $post_id ) {
					$clean_slug = $slug;
					$lang       = $page_lang;
					break 2;
				}
			}
		}

		if ( ! $clean_slug ) {
			return $permalink;
		}

		$path = wp_parse_url( $permalink, PHP_URL_PATH );

		// Arabic is the default language and lives at the site root, so its
		// permalink drops the /ar/ prefix Polylang adds (hide_default=0).
		if ( 'ar' === $lang ) {
			$clean = preg_replace( '#^/ar/#', '/', $path );
			return $clean ? str_replace( $path, $clean, $permalink ) : $permalink;
		}

		$stored = get_post_field( 'post_name', $post_id );
		$clean  = preg_replace( '#/' . preg_quote( $stored, '#' ) . '/?$#', '/' . $clean_slug . '/', $path );

		if ( ! $clean ) {
			return $permalink;
		}

		return str_replace( $path, $clean, $permalink );
	},
	10,
	2
);

/**
 * Keep Polylang from redirecting /cart/ to /ar/cart/ and /fr/cart-fr/ to
 * /fr/cart-fr/: those are the URLs the rewrite rules above already serve.
 *
 * @param string|false $redirect_url Canonical URL detected by Polylang.
 * @return string|false
 */
add_filter(
	'pll_check_canonical_url',
	function ( $redirect_url ) {
		$uri = isset( $_SERVER['REQUEST_URI'] ) ? wp_unslash( $_SERVER['REQUEST_URI'] ) : '';
		$map = get_option( 'yakoute_woo_page_map', array() );

		if ( ! $redirect_url || ! is_array( $map ) || ! $map ) {
			return $redirect_url;
		}

		$path = trim( (string) wp_parse_url( $uri, PHP_URL_PATH ), '/' );
		if ( ! $path ) {
			return $redirect_url;
		}

		$segments = explode( '/', $path );
		$slug     = array_pop( $segments );
		$lang     = $segments ? array_pop( $segments ) : 'ar';

		// A language directory that is not one of ours: leave Polylang alone.
		if ( $segments || ! isset( $map[ $lang ][ $slug ] ) ) {
			return $redirect_url;
		}

		return false;
	},
	10,
	1
);

/**
 * Keep the "order received" and "order pay" URLs inside the language the
 * customer checked out in. WooCommerce builds them from wc_get_checkout_url(),
 * which resolves to the current language, and the language context is restored
 * by yakoute_checkout_language() above.
 *
 * @param string $url  Order URL.
 * @param mixed  $order Order object.
 * @return string
 */
add_filter(
	'woocommerce_get_checkout_order_received_url',
	function ( $url, $order = null ) {
		return yakoute_localise_woo_url( $url );
	},
	10,
	2
);

add_filter(
	'woocommerce_get_checkout_order_pay_url',
	function ( $url, $order = null ) {
		return yakoute_localise_woo_url( $url );
	},
	10,
	2
);

/**
 * Rewrite a WooCommerce URL that points at the Arabic root into the URL of the
 * active language: /checkout/order-received/12/ becomes /fr/checkout/...
 *
 * @param string $url WooCommerce URL.
 * @return string
 */
function yakoute_localise_woo_url( $url ) {
	$lang = function_exists( 'pll_current_language' ) ? pll_current_language( 'slug' ) : '';

	if ( ! $lang || 'ar' === $lang || ! $url ) {
		return $url;
	}

	$path = (string) wp_parse_url( $url, PHP_URL_PATH );

	// Only the Arabic root URLs need the language directory added back.
	if ( 0 !== strpos( $path, '/' ) || preg_match( '#^/(ar|fr|en)/#', $path ) ) {
		return $url;
	}

	$new = '/' . $lang . $path;
	return str_replace( $path, $new, $url );
}

/* ------------------------------------------------------------------ home URL */
/**
 * Polylang redirects the site root to the home page of the current language.
 * Because the front page is shared by the three languages, the target URL is
 * the same as the requested one, which creates a 302 loop. Nothing to redirect
 * in that case.
 */
add_filter(
	'pll_redirect_home',
	function ( $redirect ) {
		if ( ! $redirect || ! function_exists( 'pll_get_requested_url' ) ) {
			return $redirect;
		}
		$requested = pll_get_requested_url();
		if ( untrailingslashit( $redirect ) === untrailingslashit( $requested ) ) {
			return false;
		}
		return $redirect;
	},
	10,
	1
);

/* ------------------------------------------------------------------ shop pages */
/**
 * Make a page belong to every language.
 *
 * wp_set_post_terms() cannot be used here: Polylang owns the `language`
 * taxonomy and a shared page needs all three terms at once, so the term
 * relationships are written directly.
 *
 * @param int $post_id Page ID.
 * @param array $langs Language slugs.
 * @return void
 */
function yakoute_set_page_languages( $post_id, $langs = array( 'ar', 'fr', 'en' ) ) {
	global $wpdb;

	$post_id = (int) $post_id;
	if ( $post_id <= 0 ) {
		return;
	}

	$tt_ids = array();

	foreach ( $langs as $lang ) {
		$term = get_term_by( 'slug', $lang, 'language' );
		if ( ! $term ) {
			continue;
		}
		$tt_id = (int) $term->term_taxonomy_id;
		$tt_ids[ $tt_id ] = (int) $term->term_id;

		$exists = $wpdb->get_var(
			$wpdb->prepare(
				"SELECT term_taxonomy_id FROM $wpdb->term_relationships WHERE object_id = %d AND term_taxonomy_id = %d",
				$post_id,
				$tt_id
			)
		);

		if ( ! $exists ) {
			$wpdb->insert(
				$wpdb->term_relationships,
				array(
					'object_id'        => $post_id,
					'term_taxonomy_id' => $tt_id,
				)
			);
		}
	}

	foreach ( $tt_ids as $tt_id => $term_id ) {
		$count = (int) $wpdb->get_var(
			$wpdb->prepare( "SELECT COUNT(*) FROM $wpdb->term_relationships WHERE term_taxonomy_id = %d", $tt_id )
		);
		$wpdb->update( $wpdb->term_taxonomy, array( 'count' => $count ), array( 'term_taxonomy_id' => $tt_id ) );
		clean_term_cache( $term_id, 'language', false );
	}

	wp_cache_delete( $post_id, 'term' );
}

/**
 * The home page is shared by the three languages: its template is language
 * aware, so one page object is enough and keeps the site root working.
 * The WooCommerce pages (shop, cart, checkout, account) have their own page per
 * language instead, so WooCommerce and Polylang never disagree on which
 * language is being displayed.
 */
add_action(
	'wp',
	function () {
		if ( is_admin() || ! function_exists( 'pll_current_language' ) ) {
			return;
		}

		$front = (int) get_option( 'page_on_front' );
		if ( $front > 0 ) {
			$langs = wp_get_post_terms( $front, 'language', array( 'fields' => 'slugs' ) );
			if ( ! is_array( $langs ) || count( array_intersect( array( 'ar', 'fr', 'en' ), $langs ) ) < 3 ) {
				yakoute_set_page_languages( $front );
			}
		}
	},
	5
);
