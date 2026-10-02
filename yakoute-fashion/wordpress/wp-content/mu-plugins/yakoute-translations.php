<?php
/**
 * Plugin Name: YAKOUTE - WooCommerce translations
 * Description: Loads the French, English and Arabic WooCommerce / Storefront / theme translation packs and falls back to French and Arabic strings for the handful of labels WooCommerce and Storefront do not translate.
 * Version: 1.0.0
 * Author: Yakoute Fashion
 */

defined( 'ABSPATH' ) || exit;

/**
 * Slug => WP locale used by the store.
 *
 * @return array<string,string>
 */
function yakoute_locale_map() {
	return array(
		'ar' => 'ar',
		'fr' => 'fr_FR',
		'en' => 'en_GB',
	);
}

/**
 * Resolve the active language slug, falling back to the default language.
 *
 * @return string
 */
function yakoute_language_slug() {
	if ( function_exists( 'pll_current_language' ) ) {
		$lang = pll_current_language( 'slug' );
		if ( $lang ) {
			return $lang;
		}
	}

	return defined( 'WPLANG' ) && WPLANG ? 'ar' : 'ar';
}

/**
 * The locale for the active language.
 *
 * @return string
 */
function yakoute_current_locale() {
	$map = yakoute_locale_map();
	$lang = yakoute_language_slug();

	return $map[ $lang ] ?? 'ar';
}

/**
 * Load one .mo file for a text domain, ignoring a missing pack.
 *
 * @param string $domain  Text domain.
 * @param string $path    Absolute path to the .mo file.
 * @param string $locale  Locale.
 * @return bool
 */
function yakoute_load_mo( $domain, $path, $locale ) {
	if ( ! file_exists( $path ) ) {
		return false;
	}

	unload_textdomain( $domain );
	load_textdomain( $domain, $path, $locale );

	return is_textdomain_loaded( $domain );
}

/**
 * Load every pack for the active language.
 *
 * @return void
 */
function yakoute_load_translations() {
	$locale = yakoute_current_locale();

	// Core.
	load_textdomain( 'default', WP_LANG_DIR . '/default-' . $locale . '.mo', $locale );

	// WooCommerce: installed next to the plugin by the language packs.
	$woo = WP_CONTENT_DIR . '/plugins/woocommerce/i18n/languages/woocommerce-' . $locale . '.mo';
	if ( ! file_exists( $woo ) ) {
		$woo = WP_PLUGIN_DIR . '/woocommerce/i18n/languages/woocommerce-' . $locale . '.mo';
	}
	yakoute_load_mo( 'woocommerce', $woo, $locale );

	// Storefront parent theme.
	$storefront = WP_CONTENT_DIR . '/themes/storefront/languages/storefront-' . $locale . '.mo';
	yakoute_load_mo( 'storefront', $storefront, $locale );

	// Yakoute child theme.
	$child = get_stylesheet_directory() . '/languages/yakoute-' . $locale . '.mo';
	yakoute_load_mo( 'yakoute', $child, $locale );
}

add_action( 'after_setup_theme', 'yakoute_load_translations', 20 );

/**
 * WooCommerce loads its own strings on init, which can overwrite the pack above.
 *
 * @return void
 */
function yakoute_reload_woocommerce_translations() {
	$locale = yakoute_current_locale();
	$woo    = WP_PLUGIN_DIR . '/woocommerce/i18n/languages/woocommerce-' . $locale . '.mo';

	yakoute_load_mo( 'woocommerce', $woo, $locale );
}
add_action( 'init', 'yakoute_reload_woocommerce_translations', 1 );

/**
 * Add a filter so a pack can be registered even when the .mo file is missing,
 * which is the case for the Arabic Storefront strings.
 *
 * @return void
 */
function yakoute_register_fallback_translations() {
	$locale = yakoute_current_locale();

	load_textdomain( 'storefront', WP_CONTENT_DIR . '/themes/storefront/languages/storefront-' . $locale . '.mo', $locale );
}
add_action( 'init', 'yakoute_register_fallback_translations', 2 );

/* ---------------------------------------------------------------- overrides */
/**
 * Labels that WooCommerce or Storefront leave in English on the French and
 * English pages of this store.
 *
 * @return array<string,array<string,string>>
 */
function yakoute_string_overrides() {
	return array(
		'fr' => array(
			'Checkout'                       => 'Paiement',
			'Order received'                 => 'Commande reçue',
			'Order details'                  => 'Détails de la commande',
			'Billing address'                => 'Adresse de facturation',
			'Shipping address'               => 'Adresse de livraison',
			'Proceed to checkout'            => 'Passer la commande',
			'Update cart'                    => 'Mettre à jour le panier',
			'View cart'                      => 'Voir le panier',
			'Cart'                           => 'Panier',
			'Continue shopping'              => 'Continuer mes achats',
			'Your cart is currently empty.'  => 'Votre panier est actuellement vide.',
			'Return to shop'                 => 'Retour à la boutique',
			'Place order'                    => 'Commander',
			'Cash on delivery'               => 'Paiement à la livraison',
			'Pay upon cash delivery'         => 'Payez à la réception de votre colis',
			'Free shipping'                  => 'Livraison gratuite',
			'Total'                          => 'Total',
			'Subtotal'                       => 'Sous-total',
			'Quantity'                       => 'Quantité',
			'Product'                        => 'Produit',
			'Price'                          => 'Prix',
			'Remove'                         => 'Supprimer',
			'Terms and conditions'           => 'Conditions générales',
			'Privacy policy'                 => 'Politique de confidentialité',
			'My account'                     => 'Mon compte',
			'Coupon'                         => 'Code promo',
			'Apply'                          => 'Appliquer',
			'Proceed to payment'             => 'Procéder au paiement',
			'Thank you. Your order has been received.' => 'Merci. Votre commande a bien été reçue.',
			'Apologies: it seems that there are no available payment methods. Please contact us if you need assistance or wish to make alternate arrangements.' => 'Désolé : aucun moyen de paiement n’est disponible. Contactez-nous pour de l’aide ou pour convenir d’une autre solution.',
		),
		'en' => array(
			'Place order'                    => 'Place order',
			'Terms and conditions'           => 'Terms and conditions',
		),
	);
}

/**
 * Replace the English labels listed above for the current language.
 *
 * @param string $text   Translated text.
 * @param string $domain Text domain.
 * @return string
 */
function yakoute_translate_override( $text, $domain ) {
	static $cache = null;

	if ( ! in_array( $domain, array( 'woocommerce', 'storefront', 'yakoute', 'default' ), true ) ) {
		return $text;
	}

	if ( null === $cache ) {
		$lang   = yakoute_language_slug();
		$map    = yakoute_string_overrides();
		$cache  = $map[ $lang ] ?? array();
	}

	// Only override the untranslated English source, never a real translation.
	return $cache[ $text ] ?? $text;
}
add_filter( 'gettext', 'yakoute_translate_override', 10, 2 );
add_filter( 'gettext_with_context', 'yakoute_translate_override', 10, 2 );

/* ---------------------------------------------------------------- payments */
/**
 * Cash on delivery and free shipping are single global WooCommerce objects, so
 * their labels have to be swapped at render time for each language.
 *
 * @return array<string,array<string,string>>
 */
function yakoute_payment_strings() {
	return array(
		'cod' => array(
			'title'       => array( 'ar' => 'الدفع عند الاستلام', 'fr' => 'Paiement à la livraison', 'en' => 'Cash on delivery' ),
			'description' => array(
				'ar' => 'ادفع نقداً عند استلام طلبك في باب المنزل. التوصيل لجميع مدن المغرب.',
				'fr' => 'Payez en espèces à la réception de votre colis. Livraison dans toutes les villes du Maroc.',
				'en' => 'Pay in cash when your order is delivered to your door. Delivery in all Moroccan cities.',
			),
			'instruction' => array(
				'ar' => 'الدفع عند الاستلام',
				'fr' => 'Paiement à la livraison',
				'en' => 'Cash on delivery',
			),
		),
	);
}

/**
 * @param string      $title Gateway title.
 * @param string      $id    Gateway id.
 * @return string
 */
add_filter(
	'woocommerce_gateway_title',
	function ( $title, $id ) {
		$strings = yakoute_payment_strings();
		if ( 'cod' === $id && isset( $strings['cod']['title'][ yakoute_language_slug() ] ) ) {
			return $strings['cod']['title'][ yakoute_language_slug() ];
		}
		return $title;
	},
	10,
	2
);

add_filter(
	'woocommerce_gateway_description',
	function ( $description, $id ) {
		$strings = yakoute_payment_strings();
		if ( 'cod' === $id && isset( $strings['cod']['description'][ yakoute_language_slug() ] ) ) {
			return '<p>' . esc_html( $strings['cod']['description'][ yakoute_language_slug() ] ) . '</p>';
		}
		return $description;
	},
	10,
	2
);

add_filter(
	'woocommerce_gateway_icon',
	function ( $icon, $id ) {
		return 'cod' === $id ? '' : $icon;
	},
	10,
	2
);

/* ---------------------------------------------------------------- shipping */
/**
 * The free shipping method keeps its title in the instance options, which are
 * shared by the three languages, so the label is replaced when it is rendered.
 *
 * @param string         $label Rate label.
 * @param WC_Shipping_Rate $rate Rate object.
 * @return string
 */
add_filter(
	'woocommerce_shipping_rate_label',
	function ( $label, $rate = null ) {
		if ( ! $rate || 'free_shipping' !== $rate->get_method_id() ) {
			return $label;
		}

		$titles = array(
			'ar' => 'الشحن مجاني',
			'fr' => 'Livraison gratuite',
			'en' => 'Free shipping',
		);

		return $titles[ yakoute_language_slug() ] ?? $label;
	},
	10,
	2
);

add_filter(
	'woocommerce_shipping_rate_description',
	function ( $description, $rate = null ) {
		if ( $rate && 'free_shipping' === $rate->get_method_id() ) {
			$notes = array(
				'ar' => 'التوصيل لجميع مدن المغرب.',
				'fr' => 'Livraison dans toutes les villes du Maroc.',
				'en' => 'Delivery in all Moroccan cities.',
			);
			return $notes[ yakoute_language_slug() ] ?? $description;
		}
		return $description;
	},
	10,
	2
);

/* -------------------------------------------------------------- order meta */
/**
 * Remember the language an order was placed in. The checkout posts to
 * /?wc-ajax=checkout, which carries no language, so the order would otherwise
 * be untraceable in the admin list.
 */
add_action(
	'woocommerce_checkout_create_order',
	function ( $order ) {
		$lang = yakoute_checkout_language();

		if ( $lang ) {
			$order->update_meta_data( '_order_lang', $lang );
		}
	}
);

/**
 * Show the order language in the admin order list and on the order screen.
 *
 * @param WC_Order $order Order object.
 */
add_action(
	'woocommerce_admin_order_data_after_billing_address',
	function ( $order ) {
		if ( ! $order instanceof WC_Order ) {
			return;
		}

		$lang = $order->get_meta( '_order_lang' );
		if ( ! $lang ) {
			return;
		}

		$names = array( 'ar' => 'العربية', 'fr' => 'Français', 'en' => 'English' );
		echo '<p><strong>' . esc_html__( 'Language', 'yakoute' ) . ':</strong> ' . esc_html( $names[ $lang ] ?? $lang ) . '</p>';
	}
);
