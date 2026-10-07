<?php
/**
 * Template Name: YAKOUTE Front Page
 * Template Post Type: page
 *
 * Home page: hero + category cards + new arrivals + promo + perks.
 */

defined( 'ABSPATH' ) || exit;

get_header();

$yak_lang = function_exists( 'pll_current_language' ) ? pll_current_language( 'slug' ) : 'ar';

$yak_strings = array(
	'ar' => array(
		'eyebrow'   => 'مجموعة ياكوت',
		'title'     => 'اكتشفي عالمك الخاص بالموضة',
		'subtitle'  => 'أنيق، بسيط، لا يُقاوم — ملابس وأحذية وحقائب وإكسسوارات للنساء والرجال والأطفال.',
		'cta'       => 'تسوقي الآن',
		'cta_alt'   => 'اكتشفي المجموعة',
		'new_title' => 'وصل حديثاً',
		'new_sub'   => 'أحدث القطع اللي وصلات للمتجر',
		'cats_title' => 'تسوقي حسب الفئة',
		'cats_sub'   => 'نساء، رجال، وأطفال — كلشي فبلاصة وحدة',
		'promo_title' => 'تخفيضات حتى 50% على تشكيلة الصيف',
		'promo_sub'   => 'العرض ساري حتى نفاد الكمية — توصيل مجاني لجميع المدن والدفع عند الاستلام',
		'promo_cta'   => 'شوف التخفيضات',
		'perks'      => array(
			array( 'icon' => '🚚', 'title' => 'توصيل مجاني', 'text' => 'لجميع مدن المغرب' ),
			array( 'icon' => '💵', 'title' => 'الدفع عند الاستلام', 'text' => 'ادفعي بعد ما توصلك الطرد' ),
			array( 'icon' => '✨', 'title' => 'جودة مضمونة', 'text' => 'منتجات مختارة بعناية' ),
		),
		'all' => 'شاهد الكل',
	),
	'fr' => array(
		'eyebrow'   => 'COLLECTION YAKOUTE',
		'title'     => 'Découvrez votre univers mode',
		'subtitle'  => 'Chic, simple, irrésistible — vêtements, chaussures, sacs et accessoires pour femmes, hommes et enfants.',
		'cta'       => 'Acheter maintenant',
		'cta_alt'   => 'Voir la collection',
		'new_title' => 'Nouveautés',
		'new_sub'   => 'Les dernières pièces arrivées en boutique',
		'cats_title' => 'Achetez par catégorie',
		'cats_sub'   => 'Femmes, hommes et enfants — tout au même endroit',
		'promo_title' => "Jusqu'à -50% sur la collection d'été",
		'promo_sub'   => "Offre valable jusqu'à épuisement — livraison gratuite partout au Maroc, paiement à la livraison",
		'promo_cta'   => 'Voir les offres',
		'perks'      => array(
			array( 'icon' => '🚚', 'title' => 'Livraison gratuite', 'text' => 'Partout au Maroc' ),
			array( 'icon' => '💵', 'title' => 'Paiement à la livraison', 'text' => 'Payez à la réception' ),
			array( 'icon' => '✨', 'title' => 'Qualité garantie', 'text' => 'Produits sélectionnés avec soin' ),
		),
		'all' => 'Voir tout',
	),
	'en' => array(
		'eyebrow'   => 'YAKOUTE COLLECTION',
		'title'     => 'Discover your fashion universe',
		'subtitle'  => 'Chic, simple, irresistible — clothes, shoes, bags and accessories for women, men and kids.',
		'cta'       => 'Shop now',
		'cta_alt'   => 'Explore the collection',
		'new_title' => 'New arrivals',
		'new_sub'   => 'The latest pieces that just landed',
		'cats_title' => 'Shop by category',
		'cats_sub'   => 'Women, men and kids — all in one place',
		'promo_title' => 'Up to 50% off the summer collection',
		'promo_sub'   => 'Offer valid while stocks last — free shipping everywhere in Morocco, cash on delivery',
		'promo_cta'   => 'Shop the sale',
		'perks'      => array(
			array( 'icon' => '🚚', 'title' => 'Free shipping', 'text' => 'All Moroccan cities' ),
			array( 'icon' => '💵', 'title' => 'Cash on delivery', 'text' => 'Pay when you receive' ),
			array( 'icon' => '✨', 'title' => 'Quality guaranteed', 'text' => 'Carefully selected products' ),
		),
		'all' => 'View all',
	),
);

$t = isset( $yak_strings[ $yak_lang ] ) ? $yak_strings[ $yak_lang ] : $yak_strings['ar'];

/** Helper: get an image URL stored in an option. */
function yakoute_img( $key, $size = 'full' ) {
	$id = get_option( 'yakoute_image_' . $key );
	return $id ? wp_get_attachment_image_url( $id, $size ) : '';
}

$shop_url = function_exists( 'yakoute_wc_url' ) ? yakoute_wc_url( 'shop' ) : home_url( '/shop/' );
?>

<main class="yak-main">

	<!-- ================= HERO ================= -->
	<?php $hero_bg = yakoute_img( 'hero_home', 'full' ); ?>
	<section class="yak-hero"<?php echo $hero_bg ? ' style="background-image:url(\'' . esc_url( $hero_bg ) . '\')"' : ''; ?>>
		<div class="yak-hero-inner">
			<div class="eyebrow"><?php echo esc_html( $t['eyebrow'] ); ?></div>
			<h1><?php echo esc_html( $t['title'] ); ?></h1>
			<p><?php echo esc_html( $t['subtitle'] ); ?></p>
			<a href="<?php echo esc_url( $shop_url ); ?>" class="yak-btn"><?php echo esc_html( $t['cta'] ); ?></a>
		</div>
	</section>

	<!-- ================= CATEGORY CARDS ================= -->
	<section class="yak-section">
		<div class="yak-section-head">
			<div class="eyebrow"><?php echo esc_html( $t['eyebrow'] ); ?></div>
			<h2><?php echo esc_html( $t['cats_title'] ); ?></h2>
			<p><?php echo esc_html( $t['cats_sub'] ); ?></p>
		</div>

		<div class="yak-cat-grid">
			<?php
			$cats = array(
				'women' => array( 'hero' => 'hero_women' ),
				'men'   => array( 'hero' => 'hero_men' ),
				'kids'  => array( 'hero' => 'hero_kids' ),
			);
			foreach ( $cats as $slug => $conf ) :
				$term = get_term_by( 'slug', $slug, 'product_cat' );
				if ( ! $term ) {
					continue;
				}
				$img = yakoute_img( $conf['hero'], 'large' );
				?>
				<a class="yak-cat-card theme-<?php echo esc_attr( $slug ); ?>" href="<?php echo esc_url( get_term_link( $term ) ); ?>">
					<?php if ( $img ) : ?>
						<img src="<?php echo esc_url( $img ); ?>" alt="<?php echo esc_attr( $term->name ); ?>" loading="lazy">
					<?php endif; ?>
					<div class="yak-cat-body">
						<h3><?php echo esc_html( $term->name ); ?></h3>
						<span class="more"><?php echo esc_html( $t['all'] ); ?> →</span>
					</div>
				</a>
			<?php endforeach; ?>
		</div>
	</section>

	<!-- ================= NEW ARRIVALS ================= -->
	<section class="yak-section">
		<div class="yak-section-head">
			<div class="eyebrow"><?php echo esc_html( $t['eyebrow'] ); ?></div>
			<h2><?php echo esc_html( $t['new_title'] ); ?></h2>
			<p><?php echo esc_html( $t['new_sub'] ); ?></p>
		</div>

		<?php
		$yak_products = wc_get_products( array(
			'limit'   => 8,
			'orderby' => 'date',
			'order'   => 'DESC',
			'status'  => 'publish',
		) );
		?>
		<div class="yak-products-grid">
			<?php if ( $yak_products ) : ?>
				<ul class="products columns-4">
					<?php
					foreach ( $yak_products as $yak_product ) {
						$GLOBALS['post']    = get_post( $yak_product->get_id() ); // phpcs:ignore WordPress.WP.GlobalVariablesOverride
						$GLOBALS['product'] = $yak_product; // phpcs:ignore WordPress.WP.GlobalVariablesOverride
						setup_postdata( $GLOBALS['post'] );
						wc_get_template_part( 'content', 'product' );
					}
					wp_reset_postdata();
					?>
				</ul>
			<?php else : ?>
				<p style="text-align:center"><?php esc_html_e( 'لا توجد منتجات بعد.', 'yakoute' ); ?></p>
			<?php endif; ?>
		</div>
	</section>

	<!-- ================= PROMO ================= -->
	<?php $promo = yakoute_img( 'promo', 'medium' ); ?>
	<?php if ( $promo ) : ?>
		<section class="yak-promo" style="background-image:url('<?php echo esc_url( $promo ); ?>'); background-size:cover; background-position:center;">
			<div style="background:rgba(243,232,207,.92); border-radius:12px; padding:36px 24px; max-width:760px; margin:0 auto;">
				<h2><?php echo esc_html( $t['promo_title'] ); ?></h2>
				<p><?php echo esc_html( $t['promo_sub'] ); ?></p>
				<a href="<?php echo esc_url( $shop_url ); ?>" class="yak-btn"><?php echo esc_html( $t['promo_cta'] ); ?></a>
			</div>
		</section>
	<?php endif; ?>

	<!-- ================= PERKS ================= -->
	<section class="yak-section">
		<div class="yak-perks">
			<?php foreach ( $t['perks'] as $perk ) : ?>
				<div class="yak-perk">
					<div class="icon"><?php echo esc_html( $perk['icon'] ); ?></div>
					<h3><?php echo esc_html( $perk['title'] ); ?></h3>
					<p><?php echo esc_html( $perk['text'] ); ?></p>
				</div>
			<?php endforeach; ?>
		</div>
	</section>

</main>

<?php
get_footer();
