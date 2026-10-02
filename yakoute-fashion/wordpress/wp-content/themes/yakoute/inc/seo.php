<?php
/**
 * Multilingual SEO for YAKOUTE FASHION.
 *
 * The store has no SEO plugin, so this file provides the parts that matter for
 * a shop: a per-language title, a meta description, Open Graph, hreflang
 * alternates, JSON-LD and a noindex on the private WooCommerce pages.
 *
 * Loaded from functions.php.
 */

defined( 'ABSPATH' ) || exit;

/**
 * Per-language copy used to build the titles and the descriptions.
 *
 * @return array<string,array<string,string>>
 */
function yakoute_seo_strings() {
	return array(
		'ar' => array(
			'name'         => 'Yakoute Fashion',
			'tagline'      => 'متجر الأزياء والموضة — توصيل لجميع مدن المغرب والدفع عند الاستلام',
			'home_desc'    => 'اكتشفي تشكيلة YAKOUTE FASHION من الفساتين والقمصان والأغطية النسائية والبلوزات. توصيل لجميع مدن المغرب مع الدفع عند الاستلام.',
			'shop'         => 'المتجر',
			'shop_desc'    => 'تسوقي كامل تشكيلة YAKOUTE FASHION: فساتين، قمصان، أغطية، أحذية وحقائب. توصيل لجميع مدن المغرب والدفع عند الاستلام.',
			'products'     => 'المنتجات',
			'search'       => 'نتائج البحث',
			'not_found'    => 'الصفحة غير موجودة',
			'category_desc' => 'تسوقي %(category)s من YAKOUTE FASHION. توصيل لجميع مدن المغرب والدفع عند الاستلام.',
			'product_desc'  => '%(product)s — السعر %(price)s. توصيل لجميع مدن المغرب مع الدفع عند الاستلام.',
			'page_desc'     => '%(title)s — YAKOUTE FASHION, متجر الأزياء والموضة في المغرب.',
			'locale'       => 'ar_MA',
		),
		'fr' => array(
			'name'         => 'Yakoute Fashion',
			'tagline'      => 'Boutique de mode — livraison partout au Maroc et paiement à la livraison',
			'home_desc'    => 'Découvrez les collections YAKOUTE FASHION : robes, chemisiers, vestes femme, accessoires et chaussures. Livraison dans toutes les villes du Maroc, paiement à la livraison.',
			'shop'         => 'Boutique',
			'shop_desc'    => 'Achetez toute la collection YAKOUTE FASHION : robes, chemisiers, vestes, chaussures et sacs. Livraison partout au Maroc, paiement à la livraison.',
			'products'     => 'Produits',
			'search'       => 'Résultats de recherche',
			'not_found'    => 'Page introuvable',
			'category_desc' => 'Achetez %(category)s chez YAKOUTE FASHION. Livraison partout au Maroc et paiement à la livraison.',
			'product_desc'  => '%(product)s — prix %(price)s. Livraison partout au Maroc avec paiement à la livraison.',
			'page_desc'     => '%(title)s — YAKOUTE FASHION, boutique de mode au Maroc.',
			'locale'       => 'fr_MA',
		),
		'en' => array(
			'name'         => 'Yakoute Fashion',
			'tagline'      => 'Fashion store — delivery across Morocco with cash on delivery',
			'home_desc'    => 'Shop the YAKOUTE FASHION collections: dresses, blouses, women’s layers, accessories and shoes. Delivery to every Moroccan city with cash on delivery.',
			'shop'         => 'Shop',
			'shop_desc'    => 'Shop the full YAKOUTE FASHION collection: dresses, blouses, jackets, shoes and bags. Delivery across Morocco with cash on delivery.',
			'products'     => 'Products',
			'search'       => 'Search results',
			'not_found'    => 'Page not found',
			'category_desc' => 'Shop %(category)s at YAKOUTE FASHION. Delivery across Morocco with cash on delivery.',
			'product_desc'  => '%(product)s — %(price)s. Delivery across Morocco with cash on delivery.',
			'page_desc'     => '%(title)s — YAKOUTE FASHION, fashion store in Morocco.',
			'locale'       => 'en_US',
		),
	);
}

/**
 * Copy for the active language, with Arabic as the fallback.
 *
 * @return array<string,string>
 */
function yakoute_seo() {
	static $strings = null;

	if ( null === $strings ) {
		$all    = yakoute_seo_strings();
		$lang   = function_exists( 'pll_current_language' ) ? pll_current_language( 'slug' ) : 'ar';
		$strings = $all[ $lang ] ?? $all['ar'];
		$strings['lang'] = isset( $all[ $lang ] ) ? $lang : 'ar';
	}

	return $strings;
}

/**
 * The pages that must never be indexed.
 *
 * @return bool
 */
function yakoute_seo_is_private() {
	if ( is_cart() || is_checkout() || is_account_page() ) {
		return true;
	}

	global $wp;

	return isset( $wp->query_vars['order-received'] )
		|| isset( $wp->query_vars['order-pay'] )
		|| isset( $wp->query_vars['customer-logout'] );
}

/**
 * Build the description for the current view.
 *
 * @return string
 */
function yakoute_seo_description() {
	$s = yakoute_seo();

	if ( is_front_page() ) {
		return $s['home_desc'];
	}

	if ( function_exists( 'is_shop' ) && is_shop() ) {
		return $s['shop_desc'];
	}

	if ( function_exists( 'is_product_category' ) && is_product_category() ) {
		$term = get_queried_object();
		$desc = $term && ! empty( $term->description ) ? wp_strip_all_tags( $term->description ) : '';

		return $desc ? $desc : wp_strip_all_tags(
			str_replace( '%(category)s', $term instanceof WP_Term ? $term->name : '', $s['category_desc'] )
		);
	}

	if ( function_exists( 'is_product_tag' ) && is_product_tag() ) {
		$term = get_queried_object();
		return wp_strip_all_tags(
			str_replace( '%(category)s', $term instanceof WP_Term ? $term->name : '', $s['category_desc'] )
		);
	}

	if ( function_exists( 'is_product' ) && is_product() ) {
		$product = wc_get_product( get_the_ID() );
		$short   = $product ? $product->get_short_description() : '';
		$short   = wp_strip_all_tags( $short );

		if ( $short ) {
			return $short;
		}

		return wp_strip_all_tags(
			str_replace(
				array( '%(product)s', '%(price)s' ),
				array(
					get_the_title(),
					$product ? wp_strip_all_tags( $product->get_price_html() ) : '',
				),
				$s['product_desc']
			)
		);
	}

	if ( is_singular() ) {
		$excerpt = wp_strip_all_tags( get_the_excerpt() );
		if ( $excerpt ) {
			return $excerpt;
		}

		$content = wp_strip_all_tags( (string) get_the_content() );
		if ( $content ) {
			return wp_trim_words( $content, 32, '…' );
		}

		return wp_strip_all_tags( str_replace( '%(title)s', get_the_title(), $s['page_desc'] ) );
	}

	if ( is_search() ) {
		return wp_strip_all_tags( str_replace( '%(query)s', get_search_query(), $s['page_desc'] ) );
	}

	if ( is_404() ) {
		return $s['not_found'];
	}

	return $s['home_desc'];
}

/**
 * Title for the current view, before the site name is appended.
 *
 * @return string
 */
function yakoute_seo_title() {
	$s = yakoute_seo();

	if ( is_front_page() ) {
		return $s['tagline'];
	}

	if ( function_exists( 'is_shop' ) && is_shop() ) {
		return $s['shop'];
	}

	if ( is_singular() ) {
		return get_the_title();
	}

	if ( is_search() ) {
		return $s['search'] . ' : ' . get_search_query();
	}

	if ( is_404() ) {
		return $s['not_found'];
	}

	if ( function_exists( 'is_archive' ) && is_archive() ) {
		return wp_strip_all_tags( get_the_archive_title() );
	}

	return $s['name'];
}

/**
 * Replace the WordPress title with the shop format.
 *
 * @param string $title Default title.
 * @return string
 */
add_filter(
	'pre_get_document_title',
	function ( $title ) {
		$s     = yakoute_seo();
		$parts = trim( (string) $title );

		// WooCommerce already builds a good title for products and archives.
		if ( ! is_front_page() && '' !== $parts && false === strpos( $parts, $s['name'] ) ) {
			return $parts;
		}

		if ( is_front_page() ) {
			return $s['name'] . ' – ' . $s['tagline'];
		}

		$own = yakoute_seo_title();

		return $own ? $s['name'] . ' | ' . $own : $s['name'];
	},
	20
);

/**
 * Meta description, robots, Open Graph and Twitter cards.
 */
add_action(
	'wp_head',
	function () {
		$s    = yakoute_seo();
		$desc = yakoute_seo_description();
		$url  = home_url( add_query_arg( array() ) );
		$url  = $url ? preg_replace( '#/index\.php$#', '/', $url ) : home_url( '/' );
		$type = ( function_exists( 'is_product' ) && is_product() ) ? 'product' : 'website';

		if ( yakoute_seo_is_private() ) {
			echo '<meta name="robots" content="noindex, nofollow, noarchive" />' . "\n";
		}

		if ( $desc ) {
			echo '<meta name="description" content="' . esc_attr( $desc ) . '" />' . "\n";
			echo '<meta property="og:description" content="' . esc_attr( $desc ) . '" />' . "\n";
			echo '<meta name="twitter:description" content="' . esc_attr( $desc ) . '" />' . "\n";
		}

		$title = wp_get_document_title();

		echo '<meta property="og:title" content="' . esc_attr( $title ) . '" />' . "\n";
		echo '<meta name="twitter:title" content="' . esc_attr( $title ) . '" />' . "\n";
		echo '<meta property="og:type" content="' . esc_attr( $type ) . '" />' . "\n";
		echo '<meta property="og:site_name" content="' . esc_attr( $s['name'] ) . '" />' . "\n";
		echo '<meta property="og:url" content="' . esc_url( $url ) . '" />' . "\n";
		echo '<meta property="og:locale" content="' . esc_attr( $s['locale'] ) . '" />' . "\n";
		echo '<meta name="twitter:card" content="summary_large_image" />' . "\n";

		$image = yakoute_seo_image();
		if ( $image ) {
			echo '<meta property="og:image" content="' . esc_url( $image ) . '" />' . "\n";
			echo '<meta name="twitter:image" content="' . esc_url( $image ) . '" />' . "\n";
		}

		// hreflang: the home page is shared, the rest has one URL per language.
		$alternates = array();
		if ( is_front_page() ) {
			$alternates = array( 'ar' => home_url( '/' ), 'fr' => home_url( '/fr/' ), 'en' => home_url( '/en/' ) );
		} elseif ( function_exists( 'pll_alternate_languages' ) ) {
			$translations = pll_alternate_languages( array( 'hide_if_no_translation' => false ) );
			foreach ( (array) $translations as $code => $data ) {
				if ( ! empty( $data['url'] ) ) {
					$alternates[ $code ] = $data['url'];
				}
			}
		}

		foreach ( $alternates as $code => $link ) {
			echo '<link rel="alternate" hreflang="' . esc_attr( $code ) . '" href="' . esc_url( $link ) . '" />' . "\n";
		}

		$logo = get_theme_mod( 'custom_logo' );
		if ( $logo ) {
			$logo_url = wp_get_attachment_image_url( (int) $logo, 'full' );
			if ( $logo_url ) {
				echo '<link rel="icon" href="' . esc_url( $logo_url ) . '" />' . "\n";
				echo '<link rel="apple-touch-icon" href="' . esc_url( $logo_url ) . '" />' . "\n";
			}
		}

		yakoute_seo_json_ld();
	},
	2
);

/**
 * The best image available for the social card.
 *
 * @return string
 */
function yakoute_seo_image() {
	if ( function_exists( 'is_product' ) && is_product() ) {
		$product = wc_get_product( get_the_ID() );
		$id      = $product ? $product->get_image_id() : 0;
		if ( $id ) {
			return (string) wp_get_attachment_image_url( $id, 'large' );
		}
	}

	if ( has_post_thumbnail() ) {
		return (string) get_the_post_thumbnail_url( null, 'large' );
	}

	$logo = get_theme_mod( 'custom_logo' );

	return $logo ? (string) wp_get_attachment_image_url( (int) $logo, 'full' ) : '';
}

/**
 * Organization, WebSite and Product structured data.
 */
function yakoute_seo_json_ld() {
	$s   = yakoute_seo();
	$org = array(
		'@context'    => 'https://schema.org',
		'@type'       => 'Organization',
		'name'        => $s['name'],
		'url'         => home_url( '/' ),
		'description' => $s['home_desc'],
	);

	$logo = get_theme_mod( 'custom_logo' );
	if ( $logo ) {
		$logo_url = wp_get_attachment_image_url( (int) $logo, 'full' );
		if ( $logo_url ) {
			$org['logo'] = $logo_url;
		}
	}

	$graph = array( $org );

	if ( is_front_page() ) {
		$graph[] = array(
			'@context'        => 'https://schema.org',
			'@type'           => 'WebSite',
			'name'            => $s['name'],
			'url'             => home_url( '/' ),
			'description'     => $s['home_desc'],
			'inLanguage'      => $s['lang'],
			'potentialAction' => array(
				'@type'       => 'SearchAction',
				'target'      => array(
					'@type'       => 'EntryPoint',
					'urlTemplate' => home_url( '/?s={search_term_string}' ),
				),
				'query-input' => 'required name=search_term_string',
			),
		);
	}

	if ( function_exists( 'is_product' ) && is_product() ) {
		$product = wc_get_product( get_the_ID() );

		if ( $product ) {
			$data = array(
				'@context'    => 'https://schema.org',
				'@type'       => 'Product',
				'name'        => $product->get_name(),
				'description' => wp_strip_all_tags( $product->get_short_description() ?: $product->get_description() ),
				'sku'         => $product->get_sku() ? $product->get_sku() : (string) $product->get_id(),
				'url'         => get_permalink(),
			);

			$image = $product->get_image_id() ? wp_get_attachment_image_url( $product->get_image_id(), 'large' ) : '';
			if ( $image ) {
				$data['image'] = $image;
			}

			if ( $product->is_in_stock() ) {
				$data['offers'] = array(
					'@type'         => 'Offer',
					'price'         => $product->get_price(),
					'priceCurrency' => get_woocommerce_currency(),
					'availability'  => 'https://schema.org/InStock',
					'url'           => get_permalink(),
					'seller'        => array( '@type' => 'Organization', 'name' => $s['name'] ),
				);
			}

			$graph[] = $data;
		}
	}

	if ( is_singular( 'product' ) ) {
		$graph[] = array(
			'@context'        => 'https://schema.org',
			'@type'           => 'BreadcrumbList',
			'itemListElement' => yakoute_seo_breadcrumbs(),
		);
	}

	if ( $graph ) {
		echo '<script type="application/ld+json">'
			// wp_json_encode escapes what JSON needs, the slashes are not wanted.
			. wp_json_encode( array( '@context' => 'https://schema.org', '@graph' => $graph ), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE )
			. '</script>' . "\n";
	}
}

/**
 * Breadcrumb trail for a product, from the shop down to the product.
 *
 * @return array
 */
function yakoute_seo_breadcrumbs() {
	$items   = array();
	$product = function_exists( 'is_product' ) && is_product() ? wc_get_product( get_the_ID() ) : null;

	$items[] = array(
		'@type'    => 'ListItem',
		'position' => 1,
		'name'     => yakoute_seo()['shop'],
		'item'     => function_exists( 'wc_get_page_permalink' ) ? yakoute_wc_url( 'shop' ) : home_url( '/' ),
	);

	$position = 2;

	if ( $product ) {
		$terms = get_the_terms( $product->get_id(), 'product_cat' );
		if ( $terms && ! is_wp_error( $terms ) ) {
			$term = $terms[0];
			$items[] = array(
				'@type'    => 'ListItem',
				'position' => $position++,
				'name'     => $term->name,
				'item'     => get_term_link( $term ),
			);
		}
	}

	$items[] = array(
		'@type'    => 'ListItem',
		'position' => $position,
		'name'     => $product ? $product->get_name() : '',
	);

	unset( $crumbs );

	return $items;
}
