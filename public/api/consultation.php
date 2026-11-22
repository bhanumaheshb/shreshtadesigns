<?php
declare(strict_types=1);

const ENQUIRY_INBOX = 'info@shreshtadesigns.com';
const BRAND_NAME = 'Shreshta Designs';
const MAX_REQUEST_BYTES = 20000;
const RATE_WINDOW_SECONDS = 900;
const MAX_REQUESTS_PER_ADDRESS = 5;
const MAX_REQUESTS_PER_WINDOW = 60;
const DELIVERY_ERROR = 'We couldn’t send your enquiry. Please try again or contact us on WhatsApp.';

function respond(int $status, array $data): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=UTF-8');
    header('Cache-Control: no-store');
    echo json_encode($data);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    respond(405, ['error' => 'Submit the consultation form using POST.']);
}

if (in_array($_SERVER['HTTP_SEC_FETCH_SITE'] ?? '', ['cross-site', 'same-site'], true)) {
    respond(403, ['error' => 'Open the enquiry form on the website and try again.']);
}

$contentType = strtolower(trim(explode(';', $_SERVER['CONTENT_TYPE'] ?? '')[0]));
if ($contentType !== 'application/json') {
    respond(415, ['error' => 'Unsupported enquiry format.']);
}

$raw = file_get_contents('php://input', false, null, 0, MAX_REQUEST_BYTES + 1);
if ($raw === false || strlen($raw) > MAX_REQUEST_BYTES) {
    respond(413, ['error' => 'The enquiry is too long. Shorten your vision notes and try again.']);
}

$data = json_decode($raw, true, 8);
if (!is_array($data)) {
    respond(400, ['error' => 'The enquiry could not be read. Please try again.']);
}

if (($data['website'] ?? '') !== '') {
    respond(422, ['error' => 'The enquiry could not be accepted.']);
}

$fieldLimits = [
    'name' => 600,
    'partner_name' => 600,
    'email' => 254,
    'phone' => 40,
    'wedding_date' => 10,
    'guest_range' => 40,
    'venue' => 800,
    'vision' => 12000,
    'scope' => 80,
];

$fields = [];
foreach ($fieldLimits as $key => $limit) {
    $value = $data[$key] ?? '';
    if (!is_string($value) || strlen($value) > $limit) {
        respond(422, ['error' => 'One of the fields is too long or has an invalid format.']);
    }
    $fields[$key] = trim($value);
}

if ($fields['name'] === '' || $fields['partner_name'] === '') {
    respond(422, ['error' => 'Enter both names.']);
}

if (
    strpbrk($fields['email'], "\r\n") !== false ||
    !filter_var($fields['email'], FILTER_VALIDATE_EMAIL)
) {
    respond(422, ['error' => 'Enter a valid email address.']);
}

$digits = preg_replace('/\D/', '', $fields['phone']);
if (!preg_match('/^\+?[0-9 ().-]+$/D', $fields['phone']) || strlen($digits) < 7 || strlen($digits) > 15) {
    respond(422, ['error' => 'Enter a contact number with 7–15 digits.']);
}

if (
    !preg_match('/^(\d{4})-(\d{2})-(\d{2})$/D', $fields['wedding_date'], $date) ||
    !checkdate((int) $date[2], (int) $date[3], (int) $date[1])
) {
    respond(422, ['error' => 'Select a valid wedding date.']);
}

$guests = $fields['guest_range'];
if ($guests === 'custom') {
    $count = filter_var($data['guest_count'] ?? '', FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
    if ($count === false) {
        respond(422, ['error' => 'Enter a whole number for the expected guest count.']);
    }
    $guests = (string) $count;
} elseif (!in_array($guests, ['Under 100', '100–499', '500–999', '1,000–1,999', '2,000–2,999', '3,000–4,000', 'Over 4,000'], true)) {
    respond(422, ['error' => 'Select a guest range or enter a custom guest count.']);
}

$ceremonies = $data['ceremonies'] ?? [];
$ceremonyNames = [
    'engagement' => 'Engagement', 'sangeet' => 'Sangeet', 'haldi' => 'Haldi',
    'wedding' => 'Wedding', 'reception' => 'Reception',
];
if (!is_array($ceremonies) || count($ceremonies) > count($ceremonyNames)) {
    respond(422, ['error' => 'Select ceremonies from the available options.']);
}
$selected = [];
foreach ($ceremonies as $id) {
    if (!is_string($id) || !isset($ceremonyNames[$id])) {
        respond(422, ['error' => 'Select ceremonies from the available options.']);
    }
    $selected[$id] = $ceremonyNames[$id];
}

enforceRateLimit();

$message = implode("\r\n", [
    'New consultation request from the ' . BRAND_NAME . ' website',
    '',
    'Your name: ' . $fields['name'],
    'Partner’s name: ' . $fields['partner_name'],
    'Email address: ' . $fields['email'],
    'Contact number: ' . $fields['phone'],
    'Wedding date: ' . $fields['wedding_date'],
    'Expected guests: ' . $guests,
    'Ceremonies: ' . ($selected ? implode(', ', $selected) : 'Not provided'),
    'Dream venue or destination: ' . ($fields['venue'] !== '' ? $fields['venue'] : 'Not provided'),
    'Celebration scope: ' . ($fields['scope'] !== '' ? $fields['scope'] : 'Not provided'),
    '',
    'Wedding vision:',
    $fields['vision'] !== '' ? $fields['vision'] : 'Not provided',
]);

$headers = [
    'From' => BRAND_NAME . ' <' . ENQUIRY_INBOX . '>',
    'Reply-To' => $fields['email'],
    'MIME-Version' => '1.0',
    'Content-Type' => 'text/plain; charset=UTF-8',
    'Content-Transfer-Encoding' => 'quoted-printable',
];

if (!function_exists('mail') || !@mail(ENQUIRY_INBOX, 'New consultation request', quoted_printable_encode($message), $headers)) {
    error_log(BRAND_NAME . ' consultation email was not accepted by the host mail transport.');
    respond(503, ['error' => DELIVERY_ERROR]);
}

respond(200, ['ok' => true]);

/** Reserve an attempt in one bounded, locked file outside the document root. */
function enforceRateLimit(): void
{
    $file = rtrim(sys_get_temp_dir(), DIRECTORY_SEPARATOR)
        . DIRECTORY_SEPARATOR . 'shreshtha-enquiry-' . hash('sha256', __FILE__) . '.json';
    $oldMask = umask(0077);
    $handle = @fopen($file, 'c+');
    umask($oldMask);
    if ($handle === false || !flock($handle, LOCK_EX)) {
        error_log(BRAND_NAME . ' enquiry rate limiter is unavailable.');
        respond(503, ['error' => DELIVERY_ERROR]);
    }

    $now = time();
    $stored = stream_get_contents($handle, 16384);
    $state = json_decode($stored ?: '{}', true);
    if (!is_array($state) || ($state['until'] ?? 0) <= $now) {
        $state = ['until' => $now + RATE_WINDOW_SECONDS, 'total' => 0, 'addresses' => []];
    }

    // Use the server's client address. Forwarded headers supplied by clients are untrusted.
    $address = hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? '') . ':' . $state['until']);
    $count = $state['addresses'][$address] ?? 0;
    if ($count >= MAX_REQUESTS_PER_ADDRESS || $state['total'] >= MAX_REQUESTS_PER_WINDOW) {
        fclose($handle);
        header('Retry-After: ' . ($state['until'] - $now));
        respond(429, ['error' => 'Too many enquiries were submitted. Please try again later or contact us on WhatsApp.']);
    }

    $state['total']++;
    $state['addresses'][$address] = $count + 1;
    $next = json_encode($state);
    $saved = $next !== false && rewind($handle) && ftruncate($handle, 0)
        && fwrite($handle, $next) === strlen($next) && fflush($handle);
    fclose($handle);
    if (!$saved) {
        error_log(BRAND_NAME . ' enquiry rate limiter could not save submission state.');
        respond(503, ['error' => DELIVERY_ERROR]);
    }
}
