<?php
declare(strict_types=1);

session_start();

require __DIR__ . '/razorpay-common.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    rudrabitez_json_response([
        'success' => false,
        'message' => 'Only POST requests are allowed.',
    ], 405);
}

$settings = rudrabitez_settings();

if (!rudrabitez_has_payment_keys($settings)) {
    rudrabitez_json_response([
        'success' => false,
        'message' => 'Razorpay keys are not configured yet.',
    ], 503);
}

$payload = rudrabitez_request_data();
$orderId = rudrabitez_clean_string($payload['razorpay_order_id'] ?? '');
$paymentId = rudrabitez_clean_string($payload['razorpay_payment_id'] ?? '');
$signature = rudrabitez_clean_string($payload['razorpay_signature'] ?? '');

if ($orderId === '' || $paymentId === '' || $signature === '') {
    rudrabitez_json_response([
        'success' => false,
        'message' => 'Payment verification payload is incomplete.',
    ], 422);
}

if (!preg_match('/^order_[A-Za-z0-9]+$/', $orderId)) {
    rudrabitez_json_response([
        'success' => false,
        'message' => 'Order reference is invalid.',
    ], 422);
}

if (!preg_match('/^pay_[A-Za-z0-9]+$/', $paymentId)) {
    rudrabitez_json_response([
        'success' => false,
        'message' => 'Payment reference is invalid.',
    ], 422);
}

if (!preg_match('/^[a-f0-9]{64}$/i', $signature)) {
    rudrabitez_json_response([
        'success' => false,
        'message' => 'Payment signature format is invalid.',
    ], 422);
}

$orders = $_SESSION['rudrabitez_orders'] ?? [];

if (!isset($orders[$orderId])) {
    rudrabitez_json_response([
        'success' => false,
        'message' => 'This payment order could not be matched to the current session.',
    ], 409);
}

$expectedSignature = hash_hmac('sha256', $orderId . '|' . $paymentId, $settings['key_secret']);

if (!hash_equals($expectedSignature, $signature)) {
    rudrabitez_json_response([
        'success' => false,
        'message' => 'Payment signature verification failed. Please contact support before dispatch.',
    ], 400);
}

$verifiedOrder = $orders[$orderId];
$_SESSION['rudrabitez_last_payment'] = [
    'order_id' => $orderId,
    'payment_id' => $paymentId,
    'amount' => $verifiedOrder['amount'],
    'quantity' => $verifiedOrder['quantity'],
    'verified_at' => date(DATE_ATOM),
];
unset($_SESSION['rudrabitez_orders'][$orderId]);

rudrabitez_json_response([
    'success' => true,
    'message' => 'Payment verified successfully. Reference: ' . $paymentId,
    'order_id' => $orderId,
    'payment_id' => $paymentId,
    'amount' => $verifiedOrder['amount'],
    'quantity' => $verifiedOrder['quantity'],
]);
