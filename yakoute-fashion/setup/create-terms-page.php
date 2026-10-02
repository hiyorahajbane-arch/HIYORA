<?php
/**
 * YAKOUTE FASHION - create the Terms & Conditions page in ar / fr / en and
 * attach it to WooCommerce.
 *
 * WooCommerce refuses to complete checkout when a terms page is required but
 * the field is missing, so the page has to exist and be linked.
 *
 * Idempotent. Run: tools\bin\wp.cmd eval-file setup\create-terms-page.php
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$yak_text = array(
	'ar' => array(
		'title' => 'الشروط والأحكام',
		'body'  => "<h2>الشروط والأحكام</h2>\n<p>باستخدامك لهذا المتجر، فإنك توافق على الشروط والأحكام الموضحة أدناه.</p>\n<h3>1. الطلبات</h3>\n<p>تُقبل الطلبات عبر الموقع فقط. يتم تأكيد الطلب هاتفياً قبل الشحن.</p>\n<h3>2. الدفع</h3>\n<p>الدفع متاح عند الاستلام نقداً. لا يتم تحصيل أي مبلغ قبل استلام الطلب.</p>\n<h3>3. التوصيل</h3>\n<p>التوصيل مجاني لجميع مدن المغرب. يتم التوصيل خلال 2 إلى 5 أيام عمل.</p>\n<h3>4. الإرجاع</h3>\n<p>يمكن طلب الإرجاع خلال 48 ساعة من الاستلام، شريطة أن يكون المنتج بحالته الأصلية وبغلافه.</p>\n<h3>5. الخصوصية</h3>\n<p>تُستعمل معلوماتك الشخصية لمعالجة طلبك والتواصل معك فقط.</p>",
	),
	'fr' => array(
		'title' => 'Conditions générales',
		'body'  => "<h2>Conditions générales</h2>\n<p>En utilisant cette boutique, vous acceptez les conditions générales suivantes.</p>\n<h3>1. Commandes</h3>\n<p>Les commandes sont passées uniquement via le site. Chaque commande est confirmée par téléphone avant l'expédition.</p>\n<h3>2. Paiement</h3>\n<p>Le paiement se fait à la livraison, en espèces. Aucune somme n'est encaissée avant la réception de votre commande.</p>\n<h3>3. Livraison</h3>\n<p>La livraison est gratuite dans toutes les villes du Maroc, sous 2 à 5 jours ouvrables.</p>\n<h3>4. Retours</h3>\n<p>Un retour peut être demandé dans les 48 heures suivant la réception, à condition que le produit soit dans son état d'origine et emballé.</p>\n<h3>5. Confidentialité</h3>\n<p>Vos informations personnelles servent uniquement au traitement de votre commande et à vous contacter.</p>",
	),
	'en' => array(
		'title' => 'Terms and Conditions',
		'body'  => "<h2>Terms and Conditions</h2>\n<p>By using this store you agree to the terms and conditions below.</p>\n<h3>1. Orders</h3>\n<p>Orders are placed through this website only. Every order is confirmed by phone before shipping.</p>\n<h3>2. Payment</h3>\n<p>Cash on delivery is available. No amount is collected before you receive your order.</p>\n<h3>3. Shipping</h3>\n<p>Shipping is free to all cities in Morocco, within 2 to 5 business days.</p>\n<h3>4. Returns</h3>\n<p>Returns can be requested within 48 hours of delivery, provided the item is in its original condition and packaging.</p>\n<h3>5. Privacy</h3>\n<p>Your personal information is used only to process your order and to contact you.</p>",
	),
);

$slugs = array(
	'ar' => 'terms',
	'fr' => 'terms-fr',
	'en' => 'terms-en',
);

$ids = array();

foreach ( $yak_text as $lang => $data ) {
	$existing = get_page_by_path( $slugs[ $lang ], OBJECT, 'page' );

	if ( $existing ) {
		wp_update_post(
			array(
				'ID'           => $existing->ID,
				'post_title'   => $data['title'],
				'post_content' => $data['body'],
				'post_status'  => 'publish',
			)
		);
		$id = (int) $existing->ID;
		WP_CLI::log( "  $lang: updated page $id" );
	} else {
		$id = wp_insert_post(
			array(
				'post_type'    => 'page',
				'post_title'   => $data['title'],
				'post_name'    => $slugs[ $lang ],
				'post_content' => $data['body'],
				'post_status'  => 'publish',
			)
		);
		WP_CLI::log( "  $lang: created page $id" );
	}

	$ids[ $lang ] = $id;
}

// Link the three translations together.
if ( function_exists( 'pll_set_post_language' ) && function_exists( 'pll_save_post_translations' ) ) {
	pll_set_post_language( $ids['ar'], 'ar' );
	pll_set_post_language( $ids['fr'], 'fr' );
	pll_set_post_language( $ids['en'], 'en' );

	pll_save_post_translations(
		array(
			'ar' => $ids['ar'],
			'fr' => $ids['fr'],
			'en' => $ids['en'],
		)
	);

	WP_CLI::log( '  linked translations: ' . wp_json_encode( pll_get_post_translations( $ids['ar'] ) ) );
}

update_option( 'woocommerce_terms_page_id', $ids['ar'] );

WP_CLI::success( 'Terms & Conditions page created in ar/fr/en (AR id ' . $ids['ar'] . ').' );
