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
    $pwHash     = null;   // diisi hanya pada login lewat form (nama + email + kata sandi)

    if ($credential !== '') {
        // Token resmi Google (GIS): wajib lolos verifikasi ke server Google.
        $ctx  = stream_context_create(['http' => ['timeout' => 5, 'ignore_errors' => true]]);
        $json = GOOGLE_CLIENT_ID === '' ? null
              : @file_get_contents('https://oauth2.googleapis.com/tokeninfo?id_token=' . urlencode($credential), false, $ctx);
        $payload = $json ? json_decode($json, true) : null;
        if (empty($payload['sub']) || ($payload['aud'] ?? '') !== GOOGLE_CLIENT_ID) {
            jsonResponse(['success' => false, 'message' => 'Token Google tidak valid.'], 401);
        }
        $googleId = $payload['sub'];
        $email    = $payload['email'] ?? '';
        $name     = $payload['name'] ?? '';
        $picture  = $payload['picture'] ?? '';
    } else {
        // Form nama + email + kata sandi. Kata sandi wajib, supaya email orang lain tidak bisa dipakai masuk.
        $name     = trim($data['name'] ?? '');
        $email    = trim($data['email'] ?? '');
        $password = $data['password'] ?? '';
        $picture  = '';
        if ($name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($password) < 6) {
            jsonResponse(['success' => false, 'message' => 'Nama, email valid, dan kata sandi minimal 6 karakter diperlukan.'], 422);
        }
        $googleId = 'g_' . substr(md5(strtolower($email)), 0, 16);
        $pwHash   = password_hash($password, PASSWORD_DEFAULT);
    }

    if (empty($name)) {
        $name = !empty($email) ? explode('@', $email)[0] : 'Pengguna Google';
    }

    if (empty($picture)) {
        $picture = 'https://ui-avatars.com/api/?name=' . urlencode($name) . '&background=ea4335&color=fff&bold=true&size=128';
    }

    // Cek apakah user sudah terdaftar berdasarkan google_id atau email
    $stmt = $conn->prepare("SELECT id, username, display_name, avatar, email, password FROM users WHERE (google_id IS NOT NULL AND google_id = ?) OR (email IS NOT NULL AND email = ?) LIMIT 1");
    $stmt->bind_param('ss', $googleId, $email);
    $stmt->execute();
    $existing = $stmt->get_result()->fetch_assoc();

    if ($existing) {
        // Mode form: kata sandi harus cocok. Akun lama tanpa kata sandi memakai kata sandi ini sebagai kata sandinya.
        if ($pwHash !== null) {
            if (!empty($existing['password'])) {
                if (!password_verify($password, $existing['password'])) {
                    jsonResponse(['success' => false, 'message' => 'Kata sandi salah untuk email ini.'], 401);
                }
            } else {
                $sp = $conn->prepare("UPDATE users SET password = ? WHERE id = ?");
                $sp->bind_param('si', $pwHash, $existing['id']);
                $sp->execute();
            }
        }
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
        $ins = $conn->prepare("INSERT INTO users (username, display_name, email, google_id, avatar, password) VALUES (?, ?, ?, ?, ?, ?)");
        $ins->bind_param('ssssss', $username, $displayName, $cleanEmail, $googleId, $picture, $pwHash);
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