<?php
require 'config.php';
requireLogin();

$userId = $_SESSION['user_id'];
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $limit = isset($_GET['limit']) ? max(1, (int)$_GET['limit']) : 100;

    $stmt = $conn->prepare(
        "SELECT h.id, h.event_type as type, h.chapter, h.created_at as at, 
                b.slug, b.title, b.author, b.cover, b.category, b.chapters
         FROM reading_history h
         JOIN books b ON b.id = h.book_id
         WHERE h.user_id = ?
         ORDER BY h.created_at DESC
         LIMIT ?"
    );
    $stmt->bind_param('ii', $userId, $limit);
    $stmt->execute();
    $res = $stmt->get_result();
    $items = [];
    while ($r = $res->fetch_assoc()) {
        $items[] = [
            'id'      => (string)$r['id'],
            'type'    => $r['type'],
            'chapter' => (int)$r['chapter'],
            'at'      => $r['at'],
            'slug'    => $r['slug'],
            'book'    => [
                'slug'     => $r['slug'],
                'title'    => $r['title'],
                'author'   => $r['author'],
                'cover'    => $r['cover'],
                'category' => $r['category'],
                'chapters' => (int)$r['chapters'],
            ]
        ];
    }
    jsonResponse(['success' => true, 'history' => $items]);
}

if ($method === 'DELETE') {
    $stmt = $conn->prepare("DELETE FROM reading_history WHERE user_id=?");
    $stmt->bind_param('i', $userId);
    $stmt->execute();

    $stmt2 = $conn->prepare("DELETE FROM reading_progress WHERE user_id=?");
    $stmt2->bind_param('i', $userId);
    $stmt2->execute();

    jsonResponse(['success' => true, 'message' => 'Riwayat berhasil dibersihkan']);
}

jsonResponse(['success' => false, 'message' => 'Method tidak didukung'], 405);
?>
