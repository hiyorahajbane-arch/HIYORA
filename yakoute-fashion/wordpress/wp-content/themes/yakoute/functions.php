<?php
/**
 * YAKOUTE FASHION theme functions.
 * Child theme of Storefront.
 */

defined( 'ABSPATH' ) || exit;

define( 'YAKOUTE_VERSION', '1.0.0' );

/**
 * Theme setup: supports + RTL
 */
function yakoute_setup() {
	add_theme_support( 'title-tag' );
	add_theme_support( 'post-thumbnails' );
	add_theme_support( 'custom-logo', array(
		'height'      => 90,
		'width'       => 300,
		'flex-height' => true,
		'flex-width'  => true,
	) );
	add_theme_support(
		'html5',
		array( 'search-form', 'comment-form', 'comment-list', 'gallery', 'caption', 'style', 'script' )
	);

	// WooCommerce.
	add_theme_support( 'woocommerce' );
	add_theme_support( 'wc-product-gallery-zoom' );
	add_theme_support( 'wc-product-gallery-lightbox' );
	add_theme_support( 'wc-product-gallery-slider' );

	load_child_theme_textdomain( 'yakoute', get_stylesheet_directory() . '/languages' );
}
add_action( 'after_setup_theme', 'yakoute_setup' );

/**
 * The home page is shared by the three languages, so WordPress may resolve
 * /fr/ and /en/ to the blog index. Always show the designed landing page.
 */
add_filter(
	'template_include',
	function ( $template ) {
		if ( is_home() && is_front_page() ) {
			$front = locate_template( 'page-templates/front-page.php' );
			if ( $front ) {
				return $front;
			}
		}
		return $template;
	},
	5
);

/**
 * WooCommerce page URL for the current language.
 *
 * wc_get_cart_url() and friends return the Arabic page because WooCommerce
 * stores one page id per page. The mu-plugin already filters
 * `woocommerce_get_page_id`, so the URL is resolved in the right language and
 * this helper only adds a safe fallback.
 *
 * @param string $page shop|cart|checkout|myaccount.
 * @return string
 */
function yakoute_wc_url( $page ) {
	$lang = yakoute_lang();

	// The shop is a product archive with clean URLs per language.
	if ( 'shop' === $page ) {
		$raw = untrailingslashit( (string) get_option( 'home', '' ) );
		return 'ar' === $lang ? $raw . '/shop/' : $raw . '/' . $lang . '/shop/';
	}

	if ( function_exists( 'wc_get_page_permalink' ) ) {
		$url = wc_get_page_permalink( $page );
	} elseif ( 'cart' === $page ) {
		$url = home_url( '/cart/' );
	} elseif ( 'checkout' === $page ) {
		$url = home_url( '/checkout/' );
	} elseif ( 'myaccount' === $page ) {
		$url = home_url( '/my-account/' );
	} else {
		$url = home_url( '/shop/' );
	}

	// Arabic is the default language and lives on the site root: Polylang
	// still prefixes its page permalinks with /ar/.
	if ( 'ar' === $lang ) {
		$path = (string) wp_parse_url( $url, PHP_URL_PATH );
		if ( 0 === strpos( $path, '/ar/' ) ) {
			$url = str_replace( $path, substr( $path, 3 ), $url );
		}
	}

	return $url;
}

/**
 * Home URL of the current language: the site root for Arabic.
 *
 * @return string
 */
function yakoute_home_url() {
	$raw  = untrailingslashit( (string) get_option( 'home', '' ) );
	$lang = yakoute_lang();

	return 'ar' === $lang ? $raw . '/' : $raw . '/' . $lang . '/';
}

/**
 * Enqueue parent + child styles and Google fonts.
 */
function yakoute_scripts() {
	wp_enqueue_style(
		'yakoute-fonts',
		'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&family=Playfair+Display:wght@600;700&display=swap',
		array(),
		null
	);
	wp_enqueue_style(
		'yakoute-style',
		get_stylesheet_uri(),
		array( 'storefront-style', 'yakoute-fonts' ),
		YAKOUTE_VERSION
	);
}
add_action( 'wp_enqueue_scripts', 'yakoute_scripts', 20 );

/**
 * Is the current language RTL?
 */
function yakoute_is_rtl() {
	return function_exists( 'is_rtl' ) && is_rtl();
}

/**
 * Language switcher (Polylang powered when available).
 *
 * @return array List of [ 'locale', 'label', 'url', 'active' ].
 */
function yakoute_languages() {
	$slugs = array( 'ar', 'fr', 'en' );

	if ( function_exists( 'pll_home_url' ) && function_exists( 'pll_current_language' ) ) {
		$current = pll_current_language( 'slug' );
		// Raw home without Polylang's URL filter: /fr/ is /fr/home/ otherwise.
		$raw  = untrailingslashit( (string) get_option( 'home', '' ) );
		$out  = array();
		foreach ( $slugs as $slug ) {
			$url = 'ar' === $slug ? $raw . '/' : $raw . '/' . $slug . '/';
			$out[] = array(
				'locale' => $slug,
				'label'  => strtoupper( $slug ),
				'url'    => $url,
				'active' => $current === $slug,
			);
		}
		return $out;
	}
	return array();
}

/**
 * Current store language slug.
 *
 * @return string
 */
function yakoute_lang() {
	if ( function_exists( 'pll_current_language' ) ) {
		$lang = pll_current_language( 'slug' );
		if ( $lang ) {
			return $lang;
		}
	}
	return 'ar';
}

/**
 * Link of a top-level product category in the current language.
 *
 * @param string $base Base slug: women, men or kids.
 * @return array{url: string, name: string}
 */
function yakoute_cat_link( $base ) {
	$lang = yakoute_lang();
	$slug = 'ar' === $lang ? $base : $base . '-' . $lang;
	$term = get_term_by( 'slug', $slug, 'product_cat' );

	if ( ! $term && function_exists( 'pll_get_term_translations' ) ) {
		$ar = get_term_by( 'slug', $base, 'product_cat' );
		if ( $ar ) {
			$trans = pll_get_term_translations( $ar->term_id );
			if ( ! empty( $trans[ $lang ] ) ) {
				$term = get_term( (int) $trans[ $lang ], 'product_cat' );
			}
		}
	}

	if ( ! $term || is_wp_error( $term ) ) {
		return array( 'url' => '', 'name' => '' );
	}

	$link = get_term_link( $term );
	if ( is_wp_error( $link ) ) {
		return array( 'url' => '', 'name' => '' );
	}

	// Arabic lives on the site root: drop Polylang's /ar/ prefix.
	if ( 'ar' === $lang ) {
		$path = (string) wp_parse_url( $link, PHP_URL_PATH );
		if ( 0 === strpos( $path, '/ar/' ) ) {
			$link = str_replace( $path, substr( $path, 3 ), $link );
		}
	}

	return array(
		'url'  => $link,
		'name' => $term->name,
	);
}

/**
 * Child categories of a top-level product category, in the current language.
 *
 * @param string $base Base slug: women, men or kids.
 * @return array List of [ 'url', 'name' ].
 */
function yakoute_cat_children( $base ) {
	$lang = yakoute_lang();
	$slug = 'ar' === $lang ? $base : $base . '-' . $lang;
	$parent = get_term_by( 'slug', $slug, 'product_cat' );

	if ( ! $parent ) {
		return array();
	}

	$children = get_terms(
		array(
			'taxonomy'   => 'product_cat',
			'parent'     => (int) $parent->term_id,
			'hide_empty' => false,
			'orderby'    => 'term_id',
			'order'      => 'ASC',
		)
	);

	if ( is_wp_error( $children ) || ! $children ) {
		return array();
	}

	$out = array();
	foreach ( $children as $child ) {
		$link = get_term_link( $child );
		if ( is_wp_error( $link ) ) {
			continue;
		}
		if ( 'ar' === $lang ) {
			$path = (string) wp_parse_url( $link, PHP_URL_PATH );
			if ( 0 === strpos( $path, '/ar/' ) ) {
				$link = str_replace( $path, substr( $path, 3 ), $link );
			}
		}
		$out[] = array( 'url' => $link, 'name' => $child->name );
	}

	return $out;
}
function yakoute_is_in_cat( $base ) {
	if ( ! function_exists( 'is_product_category' ) || ! is_product_category() ) {
		return false;
	}
	$term = get_queried_object();
	if ( ! $term instanceof WP_Term ) {
		return false;
	}
	if ( 0 === strpos( $term->slug, $base ) ) {
		return true;
	}
	$ancestors = get_ancestors( $term->term_id, 'product_cat', 'taxonomy' );
	foreach ( $ancestors as $ancestor_id ) {
		$ancestor = get_term( $ancestor_id, 'product_cat' );
		if ( $ancestor && 0 === strpos( $ancestor->slug, $base ) ) {
			return true;
		}
	}
	return false;
}

/**
 * Boutique category archive header: eyebrow + serif title + gold rule +
 * subcategory filter pills (Tout + branches), like the reference boutique.
 */
function yakoute_cat_header() {
	if ( ! function_exists( 'is_product_category' ) || ! is_product_category() ) {
		return;
	}

	$term = get_queried_object();
	if ( ! $term instanceof WP_Term ) {
		return;
	}

	$lang = function_exists( 'yakoute_lang' ) ? yakoute_lang() : 'ar';
	$texts = array(
		'ar' => array( 'all' => 'الكل', 'collection' => 'مجموعة' ),
		'fr' => array( 'all' => 'Tout', 'collection' => 'Collection' ),
		'en' => array( 'all' => 'All', 'collection' => 'Collection' ),
	);
	$t = $texts[ $lang ] ?? $texts['ar'];

	$parent_id = (int) $term->parent;
	if ( $parent_id ) {
		$parent   = get_term( $parent_id, 'product_cat' );
		$eyebrow  = $parent && ! is_wp_error( $parent ) ? $parent->name : $t['collection'];
		$siblings = get_terms(
			array(
				'taxonomy'   => 'product_cat',
				'parent'     => $parent_id,
				'hide_empty' => false,
				'orderby'    => 'term_id',
				'order'      => 'ASC',
			)
		);
		$all_url = $parent && ! is_wp_error( $parent ) ? get_term_link( $parent ) : '';
	} else {
		$eyebrow  = $t['collection'];
		$siblings = get_terms(
			array(
				'taxonomy'   => 'product_cat',
				'parent'     => (int) $term->term_id,
				'hide_empty' => false,
				'orderby'    => 'term_id',
				'order'      => 'ASC',
			)
		);
		$all_url = get_term_link( $term );
	}

	if ( is_wp_error( $siblings ) ) {
		$siblings = array();
	}
	if ( is_wp_error( $all_url ) ) {
		$all_url = '';
	}

	// Clean /ar/ prefix for the default language.
	$clean = function ( $url ) use ( $lang ) {
		if ( 'ar' === $lang && $url ) {
			$path = (string) wp_parse_url( $url, PHP_URL_PATH );
			if ( 0 === strpos( $path, '/ar/' ) ) {
				$url = str_replace( $path, substr( $path, 3 ), $url );
			}
		}
		return $url;
	};
	?>
	<div class="yak-cat-head">
		<div class="eyebrow"><?php echo esc_html( $eyebrow ); ?></div>
		<h1><?php echo esc_html( $term->name ); ?></h1>
		<?php if ( $siblings ) : ?>
			<ul class="yak-filter-pills">
				<li class="<?php echo $parent_id ? '' : 'active'; ?>">
					<a href="<?php echo esc_url( $clean( $all_url ) ); ?>"><?php echo esc_html( $t['all'] ); ?></a>
				</li>
				<?php foreach ( $siblings as $sib ) : ?>
					<?php $sib_link = $clean( get_term_link( $sib ) ); ?>
					<li class="<?php echo (int) $sib->term_id === (int) $term->term_id ? 'active' : ''; ?>">
						<a href="<?php echo esc_url( is_wp_error( $sib_link ) ? '' : $sib_link ); ?>"><?php echo esc_html( $sib->name ); ?></a>
					</li>
				<?php endforeach; ?>
			</ul>
		<?php endif; ?>
	</div>
	<?php
}
add_action( 'woocommerce_before_shop_loop', 'yakoute_cat_header', 5 );

/**
 * Hide WooCommerce's default archive title on category pages: the boutique
 * header above replaces it (kept as the single h1).
 *
 * @param bool $show Show the title.
 * @return bool
 */
function yakoute_hide_cat_title( $show ) {
	if ( function_exists( 'is_product_category' ) && is_product_category() ) {
		return false;
	}
	return $show;
}
add_filter( 'woocommerce_show_page_title', 'yakoute_hide_cat_title' );

/**
 * Sale badge wording per language (Promo ! / تخفيض! / Sale!).
 *
 * @param string $html Badge HTML.
 * @return string
 */
function yakoute_sale_flash( $html ) {
	$lang = function_exists( 'yakoute_lang' ) ? yakoute_lang() : 'ar';
	$words = array( 'ar' => 'تخفيض!', 'fr' => 'Promo !', 'en' => 'Sale!' );
	return '<span class="onsale">' . esc_html( $words[ $lang ] ?? $words['ar'] ) . '</span>';
}
add_filter( 'woocommerce_sale_flash', 'yakoute_sale_flash' );

/**
 * Inline SVG flag for the language switcher.
 *
 * @param string $lang Language slug.
 * @return string
 */
function yakoute_flag( $lang ) {
	if ( 'fr' === $lang ) {
		return '<svg viewBox="0 0 3 2" aria-hidden="true"><rect width="1" height="2" fill="#0055A4"/><rect x="1" width="1" height="2" fill="#ffffff"/><rect x="2" width="1" height="2" fill="#EF4135"/></svg>';
	}
	if ( 'en' === $lang ) {
		return '<svg viewBox="0 0 6 4" aria-hidden="true"><rect width="6" height="4" fill="#012169"/>'
			. '<path d="M0,0 L6,4 M6,0 L0,4" stroke="#ffffff" stroke-width="0.8"/>'
			. '<path d="M0,0 L6,4 M6,0 L0,4" stroke="#C8102E" stroke-width="0.35"/>'
			. '<path d="M3,0 V4 M0,2 H6" stroke="#ffffff" stroke-width="1.2"/>'
			. '<path d="M3,0 V4 M0,2 H6" stroke="#C8102E" stroke-width="0.7"/></svg>';
	}
	// Morocco: red field, green pentagram outline.
	return '<svg viewBox="0 0 3 2" aria-hidden="true"><rect width="3" height="2" fill="#C1272D"/>'
		. '<polygon points="1.5,0.45 1.629,0.822 2.023,0.83 1.709,1.068 1.823,1.445 1.5,1.22 1.177,1.445 1.291,1.068 0.977,0.83 1.371,0.822"'
		. ' fill="none" stroke="#006233" stroke-width="0.11"/></svg>';
}

/**
 * Announcement bar + header in the boutique style: dark bar, circular gold
 * logo, burgundy serif brand, pill navigation, cart and flag switcher.
 */
function yakoute_header() {
	$lang = yakoute_lang();

	$texts = array(
		'ar' => array(
			'announcement' => 'توصيل مجاني لجميع المدن — الدفع عند الاستلام',
			'brand'        => 'YAKOUTE FASHION',
			'tagline'      => 'كل الأنماط، في مكان واحد',
			'home'         => 'الرئيسية',
			'cart'         => 'السلة',
		),
		'fr' => array(
			'announcement' => 'Livraison gratuite — Paiement à la livraison',
			'brand'        => 'YAKOUTE FASHION',
			'tagline'      => 'Tous les styles, au même endroit',
			'home'         => 'Accueil',
			'cart'         => 'Panier',
		),
		'en' => array(
			'announcement' => 'Free shipping — Cash on delivery',
			'brand'        => 'YAKOUTE FASHION',
			'tagline'      => 'Every style, in one place',
			'home'         => 'Home',
			'cart'         => 'Cart',
		),
	);
	$t = $texts[ $lang ] ?? $texts['ar'];

	$announcement = apply_filters( 'yakoute_announcement', $t['announcement'] );
	$logo_id      = get_theme_mod( 'custom_logo' );
	$logo_url     = $logo_id ? wp_get_attachment_image_url( $logo_id, 'medium' ) : '';
	$home         = yakoute_home_url();

	$nav   = array();
	$nav[] = array(
		'label'  => $t['home'],
		'url'    => $home,
		'active' => is_front_page(),
		'children' => array(),
	);
	foreach ( array( 'women', 'men', 'kids' ) as $base ) {
		$cat = yakoute_cat_link( $base );
		if ( ! $cat['url'] ) {
			continue;
		}
		$nav[] = array(
			'label'    => $cat['name'],
			'url'      => $cat['url'],
			'active'   => yakoute_is_in_cat( $base ),
			'children' => yakoute_cat_children( $base ),
		);
	}

	$langs = yakoute_languages();
	?>
	<div class="yak-announcement"><?php echo esc_html( $announcement ); ?></div>

	<div class="yak-sticky-header">
		<nav class="yak-navbar" aria-label="Primary">
			<div class="yak-brand">
				<a href="<?php echo esc_url( $home ); ?>">
					<?php if ( $logo_url ) : ?>
						<img class="yak-logo" src="<?php echo esc_url( $logo_url ); ?>" alt="<?php echo esc_attr( $t['brand'] ); ?>">
					<?php endif; ?>
					<span class="yak-brand-text">
						<strong><?php echo esc_html( $t['brand'] ); ?></strong>
						<em><?php echo esc_html( $t['tagline'] ); ?></em>
					</span>
				</a>
			</div>

			<ul class="yak-pills">
				<?php foreach ( $nav as $item ) : ?>
					<li class="<?php echo $item['active'] ? 'active' : ''; ?><?php echo ! empty( $item['children'] ) ? ' has-children' : ''; ?>">
						<a href="<?php echo esc_url( $item['url'] ); ?>"><?php echo esc_html( $item['label'] ); ?></a>
						<?php if ( ! empty( $item['children'] ) ) : ?>
							<ul class="yak-dropdown">
								<?php foreach ( $item['children'] as $child ) : ?>
									<li><a href="<?php echo esc_url( $child['url'] ); ?>"><?php echo esc_html( $child['name'] ); ?></a></li>
								<?php endforeach; ?>
							</ul>
						<?php endif; ?>
					</li>
				<?php endforeach; ?>
			</ul>

			<div class="yak-actions">
				<?php $yak_cart_count = function_exists( 'WC' ) && WC()->cart ? WC()->cart->get_cart_contents_count() : 0; ?>
				<a href="<?php echo esc_url( yakoute_wc_url( 'cart' ) ); ?>" class="yak-cart-link" aria-label="<?php echo esc_attr( $t['cart'] ); ?>">
					<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45C4.52 15.37 5.48 17 7 17h12v-2H7l1.1-2h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1 1 0 0 0 20 4H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z" fill="currentColor"/></svg>
					<?php if ( $yak_cart_count > 0 ) : ?>
						<span class="yak-cart-count"><?php echo (int) $yak_cart_count; ?></span>
					<?php endif; ?>
				</a>

				<?php if ( $langs ) : ?>
					<div class="yak-lang-switch" role="group" aria-label="Language">
						<?php foreach ( $langs as $l ) : ?>
							<a href="<?php echo esc_url( $l['url'] ); ?>" class="<?php echo $l['active'] ? 'active' : ''; ?>" hreflang="<?php echo esc_attr( $l['locale'] ); ?>" title="<?php echo esc_attr( $l['locale'] ); ?>"><?php echo yakoute_flag( $l['locale'] ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></a>
						<?php endforeach; ?>
					</div>
				<?php endif; ?>
			</div>
		</nav>
	</div>
	<?php
}

/**
 * Footer with contact info.
 */
function yakoute_footer() {
	?>
	<footer class="yak-footer">
		<div class="yak-footer-inner">
			<div>
				<?php
				$logo_id = get_theme_mod( 'custom_logo' );
				if ( $logo_id ) :
					?>
					<img class="yak-footer-logo" src="<?php echo esc_url( wp_get_attachment_image_url( $logo_id, 'full' ) ); ?>" alt="<?php echo esc_attr( get_bloginfo( 'name' ) ); ?>">
				<?php endif; ?>
				<p><?php bloginfo( 'description' ); ?></p>
				<p>
					<?php esc_html_e( 'الهاتف / واتساب', 'yakoute' ); ?>:
					<a href="tel:+212675993497" dir="ltr">+212 675 993 497</a>
				</p>
			</div>
			<div>
				<h4><?php esc_html_e( 'تسوق', 'yakoute' ); ?></h4>
				<?php
				wp_nav_menu(
					array(
						'theme_location' => 'primary',
						'container'      => false,
						'menu_class'     => '',
						'depth'          => 1,
						'fallback_cb'    => false,
					)
				);
				?>
			</div>
			<div>
				<h4><?php esc_html_e( 'تواصل معنا', 'yakoute' ); ?></h4>
				<ul>
					<li><a href="mailto:contact@yakoute.ma">contact@yakoute.ma</a></li>
					<li><a href="tel:+212675993497" dir="ltr">+212 675 993 497</a></li>
				</ul>
			</div>
		</div>
		<div class="yak-footer-bottom">
			&copy; <?php echo esc_html( gmdate( 'Y' ) ); ?> <?php bloginfo( 'name' ); ?> — <?php esc_html_e( 'كل الحقوق محفوظة', 'yakoute' ); ?>
		</div>
	</footer>
	<?php
}

// Replace the Storefront header/footer with ours.
remove_action( 'storefront_header', 'storefront_skip_links', 0 );
remove_action( 'storefront_header', 'storefront_social_icons', 10 );
remove_action( 'storefront_header', 'storefront_site_branding', 20 );
remove_action( 'storefront_header', 'storefront_secondary_navigation', 30 );
remove_action( 'storefront_header', 'storefront_product_search', 40 );
remove_action( 'storefront_header', 'storefront_primary_navigation_wrapper', 42 );
remove_action( 'storefront_header', 'storefront_primary_navigation', 50 );
remove_action( 'storefront_header', 'storefront_header_cart', 60 );
remove_action( 'storefront_header', 'storefront_primary_navigation_wrapper_close', 68 );

remove_action( 'storefront_footer', 'storefront_footer_widgets', 10 );
remove_action( 'storefront_footer', 'storefront_credit', 20 );

add_action( 'storefront_header', 'yakoute_header', 5 );
add_action( 'storefront_footer', 'yakoute_footer', 5 );

/**
 * Register the primary menu location.
 */
function yakoute_menus() {
	register_nav_menus(
		array(
			'primary' => __( 'القائمة الرئيسية', 'yakoute' ),
		)
	);
}
add_action( 'after_setup_theme', 'yakoute_menus', 20 );

/**
 * WooCommerce: number of columns.
 */
function yakoute_loop_columns() {
	return 4;
}
add_filter( 'loop_shop_columns', 'yakoute_loop_columns' );

/**
 * WooCommerce: make sizes dropdown required-ish and helpful.
 */
function yakoute_required_size_note() {
	$notes = array(
		'ar' => 'اختر المقاس قبل الإضافة إلى السلة',
		'fr' => 'Choisissez la taille avant d’ajouter au panier',
		'en' => 'Choose a size before adding to cart',
	);
	$lang = function_exists( 'yakoute_lang' ) ? yakoute_lang() : 'ar';
	echo '<p class="yak-order-meta">' . esc_html( $notes[ $lang ] ?? $notes['ar'] ) . '</p>';
}
add_action( 'woocommerce_before_add_to_cart_button', 'yakoute_required_size_note', 5 );

/**
 * Multilingual SEO layer (titles, descriptions, Open Graph, JSON-LD).
 */
require_once get_stylesheet_directory() . '/inc/seo.php';
