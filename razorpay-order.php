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
        'message' => 'Razorpay keys are not configured yet. Add your test or live keys in razorpay-config.php before using online payments.',
    ], 503);
}

$checkout = rudrabitez_validate_checkout(rudrabitez_request_data());

if ($checkout['payment_mode'] !== 'online') {
    rudrabitez_json_response([
        'success' => false,
        'message' => 'Online payment was not selected for this checkout request.',
    ], 422);
}

$quantity = rudrabitez_quantity_meta($checkout['quantity']);

if ($quantity === null || $quantity['packs'] === 0) {
    rudrabitez_json_response([
        'success' => false,
        'message' => 'Bulk enquiries are handled manually on WhatsApp. Please choose a supported online quantity.',
    ], 422);
}

$amount = (int) $settings['unit_price'] * (int) $quantity['packs'];
$receipt = rudrabitez_build_receipt();
$fullName = trim($checkout['first_name'] . ' ' . $checkout['last_name']);

try {
    $razorpayOrder = rudrabitez_create_razorpay_order([
        'amount' => $amount,
        'currency' => $settings['currency'],
        'receipt' => $receipt,
        'notes' => [
            'customer_name' => $fullName,
            'phone' => $checkout['phone'],
            'email' => $checkout['email'],
            'product' => $settings['description'],
            'quantity' => $quantity['label'],
            'city' => $checkout['city'],
            'pincode' => $checkout['pincode'],
        ],
    ], $settings);
} catch (RuntimeException $exception) {
    rudrabitez_json_response([
        'success' => false,
        'message' => $exception->getMessage(),
    ], 502);
}

if (!isset($_SESSION['rudrabitez_orders']) || !is_array($_SESSION['rudrabitez_orders'])) {
    $_SESSION['rudrabitez_orders'] = [];
}

$_SESSION['rudrabitez_orders'][$razorpayOrder['id']] = [
    'receipt' => $receipt,
    'amount' => $amount,
    'quantity' => $quantity['label'],
    'customer_name' => $fullName,
    'email' => $checkout['email'],
    'phone' => $checkout['phone'],
];

rudrabitez_json_response([
    'success' => true,
    'key_id' => $settings['key_id'],
    'order_id' => $razorpayOrder['id'],
    'amount' => $amount,
    'currency' => $settings['currency'],
    'business_name' => $settings['business_name'],
    'description' => $settings['description'],
    'theme_color' => $settings['theme_color'],
    'prefill' => [
        'name' => $fullName,
        'email' => $checkout['email'],
        'contact' => $checkout['phone'],
    ],
    'notes' => [
        'quantity' => $quantity['label'],
        'receipt' => $receipt,
    ],
]);
