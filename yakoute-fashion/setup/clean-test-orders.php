<?php
/**
 * YAKOUTE FASHION - remove the throwaway orders created by the checkout tests
 * and put the stock back the way products.json describes it.
 *
 * The stock is released by moving each order to "cancelled" before it is
 * deleted, because that is what triggers WooCommerce to increase the stock of
 * the ordered variations and to drop the stock hold.
 *
 * Idempotent. Run after the checkout tests:
 *   tools\bin\wp.cmd eval-file setup\clean-test-orders.php --user=1
 *   tools\bin\wp.cmd eval-file setup\fix-stock.php --user=1
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Guest orders placed by the test script.
 *
 * The script sends the same e-mail, phone and street for every run, so the
 * orders are found by the address instead of by id.
 */
$test_orders = wc_get_orders(
	array(
		'billing_email' => 'test@example.com',
		'limit'         => 200,
		'orderby'       => 'id',
		'order'         => 'ASC',
	)
);

if ( ! $test_orders ) {
	WP_CLI::log( 'No test orders found.' );
} else {
	foreach ( $test_orders as $order ) {
		$id = $order->get_id();

		if ( 'cancelled' !== $order->get_status() ) {
			$order->update_status( 'cancelled', __( 'Cleaned up by the setup test cleanup.', 'yakoute' ) );
			$order->save();
		}

		// Drops the stock hold that the checkout created.
		if ( function_exists( 'wc_release_stock_for_order' ) ) {
			wc_release_stock_for_order( $order );
		}

		$order->delete( true );
		WP_CLI::log( 'deleted order ' . $id );
	}
}

WC_Cache_Helper::invalidate_cache_group( 'orders' );

WP_CLI::success( 'Test orders removed.' );
