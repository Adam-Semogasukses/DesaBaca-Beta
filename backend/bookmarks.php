<?php
require 'config.php';
requireLogin();

$method = $_SERVER['REQUEST_METHOD'];
$data   = json_decode(file_get_contents('php://input'), true) ?? [];
$userId = $_SESSION['user_id'];

if ($method === 'GET') {
    $stmt = $conn->prepare(
        "SELECT b.slug, bm.created_at AS saved_at 
         FROM bookmarks bm 
         JOIN books b ON b.id = bm.book_id 
         WHERE bm.user_id = ? 
         ORDER BY bm.created_at DESC"
    );
    $stmt->bind_param('i', $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    $items  = [];
    while ($r = $result->fetch_assoc()) {
        $items[] = [
            'slug'     => $r['slug'],
            'saved_at' => $r['saved_at']
        ];
    }
    jsonResponse(['success' => true, 'bookmarks' => $items]);
}

$slug = trim($data['slug'] ?? '');
if (!$slug) {
    jsonResponse(['success' => false, 'message' => 'Slug buku diperlukan.'], 400);
}

$stmt = $conn->prepare("SELECT id FROM books WHERE slug=? LIMIT 1");
$stmt->bind_param('s', $slug);
$stmt->execute();
$book = $stmt->get_result()->fetch_assoc();
if (!$book) {
    jsonResponse(['success' => false, 'message' => 'Buku tidak ditemukan.'], 404);
}

$check = $conn->prepare("SELECT id FROM bookmarks WHERE user_id=? AND book_id=?");
$check->bind_param('ii', $userId, $book['id']);
$check->execute();

if ($check->get_result()->num_rows) {
    $del = $conn->prepare("DELETE FROM bookmarks WHERE user_id=? AND book_id=?");
    $del->bind_param('ii', $userId, $book['id']);
    $del->execute();
    $bookmarked = false;
} else {
    $ins = $conn->prepare("INSERT INTO bookmarks (user_id, book_id) VALUES (?, ?)");
    $ins->bind_param('ii', $userId, $book['id']);
    $ins->execute();
    $bookmarked = true;
}

// Kembalikan daftar bookmark terbaru agar frontend bisa sinkronisasi
$allStmt = $conn->prepare(
    "SELECT b.slug, bm.created_at AS saved_at 
     FROM bookmarks bm 
     JOIN books b ON b.id = bm.book_id 
     WHERE bm.user_id = ? 
     ORDER BY bm.created_at DESC"
);
$allStmt->bind_param('i', $userId);
$allStmt->execute();
$allResult = $allStmt->get_result();
$allBookmarks = [];
while ($row = $allResult->fetch_assoc()) {
    $allBookmarks[] = ['slug' => $row['slug'], 'saved_at' => $row['saved_at']];
}

jsonResponse(['success' => true, 'bookmarked' => $bookmarked, 'bookmarks' => $allBookmarks]);
?>