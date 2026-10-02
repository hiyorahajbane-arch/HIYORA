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
	if ( function_exists( 'wc_get_page_permalink' ) ) {
		return wc_get_page_permalink( $page );
	}
	if ( 'cart' === $page ) {
		return home_url( '/cart/' );
	}
	if ( 'checkout' === $page ) {
		return home_url( '/checkout/' );
	}
	if ( 'myaccount' === $page ) {
		return home_url( '/my-account/' );
	}
	return home_url( '/shop/' );
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
	if ( function_exists( 'pll_languages_list' ) && function_exists( 'pll_home_url' ) ) {
		$out = array();
		foreach ( pll_languages_list() as $lang ) {
			$out[] = array(
				'locale' => $lang->slug,
				'label'  => strtoupper( $lang->slug ),
				'url'    => pll_home_url( $lang->slug ),
				'active' => pll_current_language( 'slug' ) === $lang->slug,
			);
		}
		return $out;
	}
	return array();
}

/**
 * Announcement bar + sticky header.
 */
function yakoute_header() {
	$announcement = apply_filters(
		'yakoute_announcement',
		__( 'توصيل مجاني لجميع المدن — الدفع عند الاستلام', 'yakoute' )
	);
	$logo_id  = get_theme_mod( 'custom_logo' );
	$logo_url = $logo_id ? wp_get_attachment_image_url( $logo_id, 'full' ) : '';
	$home     = function_exists( 'pll_home_url' ) ? pll_home_url() : home_url( '/' );
	?>
	<div class="yak-announcement"><?php echo esc_html( $announcement ); ?></div>

	<div class="yak-sticky-header">
		<nav class="yak-navbar">
			<div class="yak-brand">
				<a href="<?php echo esc_url( $home ); ?>">
					<?php if ( $logo_url ) : ?>
						<img src="<?php echo esc_url( $logo_url ); ?>" alt="<?php echo esc_attr( get_bloginfo( 'name' ) ); ?>">
					<?php else : ?>
						<strong style="font-family:var(--yak-serif);font-size:22px;color:var(--yak-primary)"><?php bloginfo( 'name' ); ?></strong>
					<?php endif; ?>
				</a>
			</div>

			<?php
			wp_nav_menu(
				array(
					'theme_location' => 'primary',
					'container'      => false,
					'menu_class'     => 'yak-menu',
					'depth'          => 2,
					'fallback_cb'    => false,
				)
			);
			?>

			<div class="yak-actions">
				<?php $langs = yakoute_languages(); ?>
				<?php if ( $langs ) : ?>
					<div class="yak-lang-switch">
						<?php foreach ( $langs as $l ) : ?>
							<a href="<?php echo esc_url( $l['url'] ); ?>" class="<?php echo $l['active'] ? 'active' : ''; ?>" hreflang="<?php echo esc_attr( $l['locale'] ); ?>"><?php echo esc_html( $l['label'] ); ?></a>
						<?php endforeach; ?>
					</div>
				<?php endif; ?>

				<a href="<?php echo esc_url( yakoute_wc_url( 'cart' ) ); ?>" class="yak-cart-link" aria-label="<?php esc_attr_e( 'السلة', 'yakoute' ); ?>">
					🛒
					<span class="yak-cart-count"><?php echo function_exists( 'WC' ) && WC()->cart ? WC()->cart->get_cart_contents_count() : 0; ?></span>
				</a>
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
	echo '<p class="yak-order-meta">' . esc_html__( 'اختر المقاس قبل الإضافة إلى السلة', 'yakoute' ) . '</p>';
}
