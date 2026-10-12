<?php
require 'config.php';

$action = $_GET['action'] ?? '';
$data   = json_decode(file_get_contents('php://input'), true) ?? [];

/* ------------------------------------------------------------------ REGISTER */
if ($action === 'register') {
    $displayName = trim($data['display_name'] ?? $data['name'] ?? '');
    $username    = trim($data['name'] ?? $displayName);
    $email       = trim($data['email'] ?? '');
    $password    = $data['password'] ?? '';

    if ($displayName === '' || strlen($password) < 6) {
        jsonResponse(['success' => false, 'message' => 'Nama pengguna dan kata sandi minimal 6 karakter diperlukan.'], 422);
    }

    // Buat username unik dari nama yang diinput
    $baseUsername = strtolower(preg_replace('/\s+/', '_', $displayName));
    $baseUsername = preg_replace('/[^a-z0-9_]/', '', $baseUsername);
    if (!$baseUsername) $baseUsername = 'pembaca';

    $finalUsername = $baseUsername;
    $suffix = 1;
    while (true) {
        $check = $conn->prepare("SELECT id FROM users WHERE username=? LIMIT 1");
        $check->bind_param('s', $finalUsername);
        $check->execute();
        if (!$check->get_result()->num_rows) break;
        $finalUsername = $baseUsername . $suffix++;
    }

    $cleanEmail = !empty($email) ? $email : null;
    $hash = password_hash($password, PASSWORD_DEFAULT);
    $avatar = "https://ui-avatars.com/api/?name=" . urlencode($displayName) . "&background=dc2626&color=fff&bold=true";
    $stmt = $conn->prepare("INSERT INTO users (username, password, display_name, email, avatar) VALUES (?, ?, ?, ?, ?)");
    $stmt->bind_param('sssss', $finalUsername, $hash, $displayName, $cleanEmail, $avatar);
    
    if (!$stmt->execute()) {
        jsonResponse(['success' => false, 'message' => 'Gagal mendaftar: ' . $conn->error], 500);
    }

    $newId = $stmt->insert_id;

    $_SESSION['user_id']      = $newId;
    $_SESSION['username']     = $finalUsername;
    $_SESSION['display_name'] = $displayName;
    $_SESSION['avatar']       = $avatar;

    jsonResponse(['success' => true, 'user' => [
        'id'           => $newId,
        'username'     => $finalUsername,
        'display_name' => $displayName,
        'avatar'       => $avatar
    ]]);
}

/* --------------------------------------------------------------------- LOGIN */
if ($action === 'login') {
    $name     = trim($data['name'] ?? '');
    $password = $data['password'] ?? '';

    if ($name === '' || $password === '') {
        jsonResponse(['success' => false, 'message' => 'Nama pengguna dan kata sandi wajib diisi.'], 422);
    }

    // Coba cocokkan username, display_name, atau email
    $stmt = $conn->prepare(
        "SELECT id, username, password, display_name, email, avatar FROM users
         WHERE username=? OR display_name=? OR email=? LIMIT 1"
    );
    $stmt->bind_param('sss', $name, $name, $name);
    $stmt->execute();
    $user = $stmt->get_result()->fetch_assoc();

    if (!$user || !password_verify($password, $user['password'])) {
        jsonResponse(['success' => false, 'message' => 'Nama pengguna atau kata sandi salah.'], 401);
    }

    $displayName = $user['display_name'] ?: $user['username'];
    $avatar = !empty($user['avatar']) ? $user['avatar'] : "https://ui-avatars.com/api/?name=" . urlencode($displayName) . "&background=dc2626&color=fff&bold=true";

    $_SESSION['user_id']      = $user['id'];
    $_SESSION['username']     = $user['username'];
    $_SESSION['display_name'] = $displayName;
    $_SESSION['avatar']       = $avatar;

    jsonResponse(['success' => true, 'user' => [
        'id'           => $user['id'],
        'username'     => $user['username'],
        'display_name' => $displayName,
        'avatar'       => $avatar,
        'email'        => $user['email']
    ]]);
}

/* -------------------------------------------------------------- GOOGLE LOGIN */
if ($action === 'google') {
    $credential = $data['credential'] ?? '';
    $googleId   = '';
    $email      = '';
    $name       = '';
    $picture    = '';

    // Jika menerima id_token / credential JWT Google dari Google Identity Services
    if (!empty($credential)) {
        // Coba verifikasi via Google tokeninfo jika curl/allow_url_fopen tersedia
        $verified = false;
        if (ini_get('allow_url_fopen')) {
            $context = stream_context_create(['http' => ['timeout' => 5]]);
            $verifyJson = @file_get_contents("https://oauth2.googleapis.com/tokeninfo?id_token=" . urlencode($credential), false, $context);
            if ($verifyJson) {
                $payload = json_decode($verifyJson, true);
                if (!empty($payload['sub'])) {
                    $googleId = $payload['sub'];
                    $email    = $payload['email'] ?? '';
                    $name     = $payload['name'] ?? explode('@', $email)[0];
                    $picture  = $payload['picture'] ?? '';
                    $verified = true;
                }
            }
        }

        // Fallback: decode JWT payload secara lokal jika tokeninfo tidak bisa dijangkau
        if (!$verified) {
            $parts = explode('.', $credential);
            if (count($parts) === 3) {
                $payloadJson = base64_decode(str_replace(['-', '_'], ['+', '/'], $parts[1]));
                $payload = json_decode($payloadJson, true);
                if (!empty($payload['sub'])) {
                    $googleId = $payload['sub'];
                    $email    = $payload['email'] ?? '';
                    $name     = $payload['name'] ?? explode('@', $email)[0];
                    $picture  = $payload['picture'] ?? '';
                }
            }
        }
    } else {
        // Alternatif jika frontend meneruskan profile langsung
        $googleId = trim($data['google_id'] ?? '');
        $email    = trim($data['email'] ?? '');
        $name     = trim($data['name'] ?? '');
        $picture  = trim($data['avatar'] ?? $data['picture'] ?? '');
    }

    if (empty($googleId) && !empty($email)) {
        $googleId = 'g_' . substr(md5($email), 0, 16);
    }

    if (empty($googleId) && empty($email) && empty($name)) {
        jsonResponse(['success' => false, 'message' => 'Data Google tidak valid atau gagal diverifikasi.'], 400);
    }

    if (empty($name)) {
        $name = !empty($email) ? explode('@', $email)[0] : 'Pengguna Google';
    }

    if (empty($picture)) {
        $picture = 'https://ui-avatars.com/api/?name=' . urlencode($name) . '&background=ea4335&color=fff&bold=true&size=128';
    }

    // Cek apakah user sudah terdaftar berdasarkan google_id atau email
    $stmt = $conn->prepare("SELECT id, username, display_name, avatar, email FROM users WHERE (google_id IS NOT NULL AND google_id = ?) OR (email IS NOT NULL AND email = ?) LIMIT 1");
    $stmt->bind_param('ss', $googleId, $email);
    $stmt->execute();
    $existing = $stmt->get_result()->fetch_assoc();

    if ($existing) {
        $userId = $existing['id'];
        $displayName = $existing['display_name'] ?: $name;
        $avatar = !empty($existing['avatar']) ? $existing['avatar'] : $picture;
        
        $up = $conn->prepare("UPDATE users SET google_id = COALESCE(google_id, ?), avatar = COALESCE(avatar, ?), display_name = COALESCE(display_name, ?) WHERE id = ?");
        $up->bind_param('sssi', $googleId, $picture, $displayName, $userId);
        $up->execute();

        $username = $existing['username'];
    } else {
        $displayName = $name;
        $base = strtolower(trim($displayName));
        $base = preg_replace('/[^a-z0-9]/', '_', $base);
        $base = trim(preg_replace('/_+/', '_', $base), '_');
        if (empty($base)) $base = 'google_user';

        $username = $base;
        $suffix = 1;
        while (true) {
            $chk = $conn->prepare("SELECT id FROM users WHERE username=? LIMIT 1");
            $chk->bind_param('s', $username);
            $chk->execute();
            if (!$chk->get_result()->num_rows) break;
            $username = $base . '_' . $suffix++;
        }

        $cleanEmail = !empty($email) ? $email : null;
        $ins = $conn->prepare("INSERT INTO users (username, display_name, email, google_id, avatar) VALUES (?, ?, ?, ?, ?)");
        $ins->bind_param('sssss', $username, $displayName, $cleanEmail, $googleId, $picture);
        $ins->execute();
        $userId = $ins->insert_id;
        $avatar = $picture;
    }

    $_SESSION['user_id']      = $userId;
    $_SESSION['username']     = $username;
    $_SESSION['display_name'] = $displayName;
    $_SESSION['avatar']       = $avatar;

    jsonResponse(['success' => true, 'user' => [
        'id'           => $userId,
        'username'     => $username,
        'display_name' => $displayName,
        'avatar'       => $avatar,
        'email'        => $email
    ]]);
}

/* -------------------------------------------------------------------- LOGOUT */
if ($action === 'logout') {
    $_SESSION = [];
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $params["path"], $params["domain"],
            $params["secure"], $params["httponly"]
        );
    }
    session_destroy();
    jsonResponse(['success' => true, 'message' => 'Berhasil keluar.']);
}

/* ----------------------------------------------------------------------- ME  */
if ($action === 'me') {
    if (empty($_SESSION['user_id'])) {
        jsonResponse(['success' => true, 'logged_in' => false]);
    }
    $stmt = $conn->prepare("SELECT id, username, display_name, email, avatar FROM users WHERE id=? LIMIT 1");
    $stmt->bind_param('i', $_SESSION['user_id']);
    $stmt->execute();
    $u = $stmt->get_result()->fetch_assoc();
    if (!$u) {
        $_SESSION = [];
        jsonResponse(['success' => true, 'logged_in' => false]);
    }
    $displayName = $u['display_name'] ?: $u['username'];
    jsonResponse(['success' => true, 'logged_in' => true, 'user' => [
        'id'           => $u['id'],
        'username'     => $u['username'],
        'display_name' => $displayName,
        'email'        => $u['email'],
        'avatar'       => $u['avatar']
    ]]);
}

jsonResponse(['success' => false, 'message' => 'Action tidak ditemukan.'], 404);
?>