<?php
// Desa Baca - Database configuration
session_start();

$host    = 'localhost';
$db      = 'desabaca';
$user    = 'root';
$pass    = '';
$charset = 'utf8mb4';

// Client ID Google OAuth (samakan dengan CLIENT_ID di js/app.js). Kosong = login Google nonaktif.
define('GOOGLE_CLIENT_ID', '');

$conn = new mysqli($host, $user, $pass, $db);
if ($conn->connect_error) {
    http_response_code(500);
    die(json_encode(['success'=>false,'message'=>'Database connection failed']));
}
$conn->set_charset($charset);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Credentials: true');

function jsonResponse($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data);
    exit;
}

// Pastikan kolom waktu baca (detik) ada; dibuat otomatis kalau database belum di-update.
function ensureSecondsColumn($conn) {
    $r = $conn->query("SHOW COLUMNS FROM reading_progress LIKE 'seconds_read'");
    if ($r && $r->num_rows === 0) {
        $conn->query("ALTER TABLE reading_progress ADD COLUMN seconds_read INT UNSIGNED NOT NULL DEFAULT 0");
    }
}

function requireLogin() {
    if (empty($_SESSION['user_id'])) {
        jsonResponse(['success'=>false,'message'=>'Silakan login terlebih dahulu.'], 401);
    }
}
?>