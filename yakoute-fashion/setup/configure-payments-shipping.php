<?php
/**
 * YAKOUTE FASHION - Payments (COD only) + Free shipping to all Morocco
 * Run with:  tools\bin\wp.cmd eval-file setup/configure-payments-shipping.php
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// ------------------------------------------------------- payment gateways
$gateways = WC()->payment_gateways()->payment_gateways();

foreach ( $gateways as $id => $gateway ) {
	if ( 'cod' !== $id ) {
		update_option( $gateway->get_option_key(), 'no' );
	}
}

$cod_option                = (array) get_option( 'woocommerce_cod_settings', array() );
$cod_option['enabled']     = 'yes';
$cod_option['title']       = 'الدفع عند الاستلام';
$cod_option['description'] = 'ادفع نقداً عند استلام طلبك في باب المنزل. التوصيل لجميع مدن المغرب.';
$cod_option['instructions'] = 'سيتواصل معك فريقنا هاتفياً قبل التوصيل لتأكيد الطلب.';
update_option( 'woocommerce_cod_settings', $cod_option );

WP_CLI::log( 'Enabled gateways: ' . implode( ', ', array_keys( array_filter( $gateways, function ( $g ) { return 'yes' === $g->enabled; } ) ) ) );

// ------------------------------------------------------- shipping: free for Morocco
//
// WC_Shipping_Zone::add_shipping_method() takes the method *id* as a string
// (e.g. 'free_shipping'). Passing a WC_Shipping_Free_Shipping object fails the
// in_array() check silently and no method is ever created.
$yak_free_id = 'free_shipping';

$zone = null;
foreach ( WC_Shipping_Zones::get_zones() as $data ) {
	if ( 'Morocco' === $data['zone_name'] ) {
		$zone = new WC_Shipping_Zone( $data['zone_id'] );
		break;
	}
}
if ( ! $zone ) {
	$zone = new WC_Shipping_Zone();
	$zone->set_zone_name( 'Morocco' );
	$zone->set_locations( array( array( 'type' => 'country', 'code' => 'MA' ) ) );
	$zone->save();
	WP_CLI::log( 'Created shipping zone: Morocco' );
}

if ( ! $zone->get_zone_locations() ) {
	$zone->set_locations( array( array( 'type' => 'country', 'code' => 'MA' ) ) );
}

foreach ( $zone->get_shipping_methods() as $method ) {
	$zone->delete_shipping_method( $method->instance_id );
}
$zone->add_shipping_method( $yak_free_id );
$zone->save();

$free_option                = (array) get_option( 'woocommerce_free_shipping_settings', array() );
$free_option['title']       = 'التوصيل مجاني';
$free_option['requires']    = '';
$free_option['min_amount']  = '';
$free_option['ignore_areas'] = '';
update_option( 'woocommerce_free_shipping_settings', $free_option );

// Zone 0 is the "Locations not covered by your other zones" fallback. It needs
// a method too, otherwise checkout refuses to complete for any address that is
// not matched to the Morocco zone.
$rest = new WC_Shipping_Zone( 0 );
foreach ( $rest->get_shipping_methods() as $method ) {
	$rest->delete_shipping_method( $method->instance_id );
}
$rest->add_shipping_method( $yak_free_id );
$rest->save();

// Remove the stray "Rest of the World" zone: zone 0 already is that fallback.
foreach ( WC_Shipping_Zones::get_zones() as $data ) {
	if ( 'Rest of the World' === $data['zone_name'] ) {
		$stray = new WC_Shipping_Zone( $data['zone_id'] );
		$stray->delete();
		WP_CLI::log( 'Deleted redundant zone: Rest of the World' );
	}
}

update_option( 'woocommerce_ship_to_destination', 'shipping' );
update_option( 'woocommerce_shipping_debug_mode', 'no' );
update_option( 'woocommerce_allowed_countries', 'specific' );
update_option( 'woocommerce_specific_allowed_countries', array( 'MA' ) );
update_option( 'woocommerce_specific_ship_to_countries', array( 'MA' ) );
update_option( 'woocommerce_default_country', 'MA:10' );

// Drop the cached shipping data.
WC_Cache_Helper::get_transient_version( 'shipping', true );

$count = wc_get_shipping_method_count( true );
WP_CLI::success( sprintf( 'Payments (COD only) and shipping (free, Morocco only) configured. Active methods: %d', $count ) );
