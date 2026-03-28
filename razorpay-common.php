<?php
declare(strict_types=1);

function rudrabitez_settings(): array
{
    static $settings;

    if ($settings === null) {
        $settings = require __DIR__ . '/razorpay-config.php';
    }

    return $settings;
}

function rudrabitez_json_response(array $payload, int $status = 200)
{
    http_response_code($status);
    header('Content-Type: application/json; charset=UTF-8');
    echo json_encode($payload, JSON_UNESCAPED_SLASHES);
    exit;
}

function rudrabitez_request_data(): array
{
    $raw = file_get_contents('php://input');

    if ($raw === false || trim($raw) === '') {
        return [];
    }

    $decoded = json_decode($raw, true);

    return is_array($decoded) ? $decoded : [];
}

function rudrabitez_clean_string($value): string
{
    return trim((string) ($value ?? ''));
}

function rudrabitez_normalize_whitespace(string $value): string
{
    $normalized = preg_replace('/\s+/', ' ', trim($value));

    return $normalized === null ? trim($value) : $normalized;
}

function rudrabitez_digits_only(string $value): string
{
    $digits = preg_replace('/\D+/', '', $value);

    return $digits === null ? '' : $digits;
}

function rudrabitez_fail_validation(string $message, int $status = 422)
{
    rudrabitez_json_response([
        'success' => false,
        'message' => $message,
    ], $status);
}

function rudrabitez_quantity_options(): array
{
    return [
        '1' => ['packs' => 1, 'label' => '1 Pack'],
        '2' => ['packs' => 2, 'label' => '2 Packs'],
        '3' => ['packs' => 3, 'label' => '3 Packs'],
        '5' => ['packs' => 5, 'label' => '5 Packs'],
        'bulk' => ['packs' => 0, 'label' => 'Bulk enquiry'],
    ];
}

function rudrabitez_quantity_meta(string $quantity): ?array
{
    $options = rudrabitez_quantity_options();

    return $options[$quantity] ?? null;
}

function rudrabitez_has_payment_keys(array $settings): bool
{
    $keyId = rudrabitez_clean_string($settings['key_id'] ?? '');
    $keySecret = rudrabitez_clean_string($settings['key_secret'] ?? '');

    if ($keyId === '' || $keySecret === '') {
        return false;
    }

    if (strpos($keyId, 'your_key_id') !== false || strpos($keySecret, 'your_test_or_live_key_secret') !== false) {
        return false;
    }

    return true;
}

function rudrabitez_validate_checkout(array $payload): array
{
    $data = [
        'first_name' => rudrabitez_normalize_whitespace(rudrabitez_clean_string($payload['first_name'] ?? '')),
        'last_name' => rudrabitez_normalize_whitespace(rudrabitez_clean_string($payload['last_name'] ?? '')),
        'email' => strtolower(rudrabitez_normalize_whitespace(rudrabitez_clean_string($payload['email'] ?? ''))),
        'phone' => rudrabitez_normalize_whitespace(rudrabitez_clean_string($payload['phone'] ?? '')),
        'address' => rudrabitez_normalize_whitespace(rudrabitez_clean_string($payload['address'] ?? '')),
        'city' => rudrabitez_normalize_whitespace(rudrabitez_clean_string($payload['city'] ?? '')),
        'state' => rudrabitez_normalize_whitespace(rudrabitez_clean_string($payload['state'] ?? '')),
        'pincode' => rudrabitez_digits_only(rudrabitez_clean_string($payload['pincode'] ?? '')),
        'note' => rudrabitez_normalize_whitespace(rudrabitez_clean_string($payload['note'] ?? '')),
        'quantity' => rudrabitez_clean_string($payload['quantity'] ?? '1'),
        'payment_mode' => rudrabitez_clean_string($payload['payment_mode'] ?? 'online'),
        'consent' => !empty($payload['consent']),
    ];

    foreach (['first_name', 'last_name', 'email', 'phone', 'address', 'city', 'state', 'pincode'] as $field) {
        if ($data[$field] === '') {
            rudrabitez_fail_validation('Please complete all required checkout details before continuing.');
        }
    }

    if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
        rudrabitez_fail_validation('Please enter a valid email address.');
    }

    if (strlen($data['first_name']) < 2 || strlen($data['first_name']) > 30) {
        rudrabitez_fail_validation('First name should stay between 2 and 30 characters.');
    }

    if (!preg_match('/^[A-Za-z][A-Za-z\s\'-]*$/', $data['first_name'])) {
        rudrabitez_fail_validation('First name contains unsupported characters.');
    }

    if (strlen($data['last_name']) < 2 || strlen($data['last_name']) > 30) {
        rudrabitez_fail_validation('Last name should stay between 2 and 30 characters.');
    }

    if (!preg_match('/^[A-Za-z][A-Za-z\s\'-]*$/', $data['last_name'])) {
        rudrabitez_fail_validation('Last name contains unsupported characters.');
    }

    $phoneDigits = rudrabitez_digits_only($data['phone']);

    if (strlen($phoneDigits) === 10) {
        $data['phone'] = '+91' . $phoneDigits;
    } elseif (strlen($phoneDigits) === 12 && substr($phoneDigits, 0, 2) === '91') {
        $data['phone'] = '+' . $phoneDigits;
    } else {
        rudrabitez_fail_validation('Please enter a valid Indian mobile number.');
    }

    if (strlen($data['address']) < 10 || strlen($data['address']) > 180) {
        rudrabitez_fail_validation('Address should stay between 10 and 180 characters.');
    }

    if (strlen($data['city']) < 2 || strlen($data['city']) > 40) {
        rudrabitez_fail_validation('City should stay between 2 and 40 characters.');
    }

    if (!preg_match('/^[A-Za-z][A-Za-z\s.\'-]*$/', $data['city'])) {
        rudrabitez_fail_validation('City contains unsupported characters.');
    }

    if (strlen($data['state']) < 2 || strlen($data['state']) > 40) {
        rudrabitez_fail_validation('State should stay between 2 and 40 characters.');
    }

    if (!preg_match('/^[A-Za-z][A-Za-z\s.\'-]*$/', $data['state'])) {
        rudrabitez_fail_validation('State contains unsupported characters.');
    }

    if (!preg_match('/^[0-9]{6}$/', $data['pincode'])) {
        rudrabitez_fail_validation('Please enter a valid 6-digit PIN code.');
    }

    if (strlen($data['note']) > 160) {
        rudrabitez_fail_validation('Delivery note should stay within 160 characters.');
    }

    if (rudrabitez_quantity_meta($data['quantity']) === null) {
        rudrabitez_fail_validation('Selected quantity is not supported.');
    }

    if (!in_array($data['payment_mode'], ['online', 'cod', 'whatsapp'], true)) {
        rudrabitez_fail_validation('Selected payment mode is not supported.');
    }

    if ($data['consent'] !== true) {
        rudrabitez_fail_validation('Please confirm that the delivery and customer details are correct.');
    }

    return $data;
}

function rudrabitez_build_receipt(): string
{
    return 'rbz_' . date('YmdHis') . '_' . bin2hex(random_bytes(3));
}

function rudrabitez_create_razorpay_order(array $payload, array $settings): array
{
    if (!function_exists('curl_init')) {
        throw new RuntimeException('The server does not have cURL enabled for Razorpay API requests.');
    }

    $curl = curl_init('https://api.razorpay.com/v1/orders');

    if ($curl === false) {
        throw new RuntimeException('Unable to initialize the Razorpay request.');
    }

    curl_setopt_array($curl, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 20,
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        CURLOPT_USERPWD => $settings['key_id'] . ':' . $settings['key_secret'],
        CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_SLASHES),
    ]);

    $response = curl_exec($curl);
    $status = (int) curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
    $error = curl_error($curl);
    curl_close($curl);

    if ($response === false) {
        throw new RuntimeException('Unable to reach Razorpay right now. ' . $error);
    }

    $decoded = json_decode($response, true);

    if ($status >= 400) {
        $message = $decoded['error']['description'] ?? 'Razorpay order creation failed.';
        throw new RuntimeException($message);
    }

    if (!is_array($decoded) || !isset($decoded['id'])) {
        throw new RuntimeException('Unexpected response received from Razorpay.');
    }

    return $decoded;
}
