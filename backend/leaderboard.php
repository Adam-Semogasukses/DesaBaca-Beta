<?php
// Leaderboard mingguan: semua pengguna terdaftar, diurutkan dari jumlah buku berbeda
// yang dibuka sejak Senin minggu ini.
require 'config.php';

$weekStart = date('Y-m-d 00:00:00', strtotime('monday this week'));

$stmt = $conn->prepare(
    "SELECT u.id, COALESCE(NULLIF(u.display_name,''), u.username) AS name,
            COUNT(DISTINCT h.book_id) AS books
     FROM users u
     LEFT JOIN reading_history h ON h.user_id = u.id AND h.created_at >= ?
     GROUP BY u.id, name
     ORDER BY books DESC, name ASC"
);
$stmt->bind_param('s', $weekStart);
$stmt->execute();
$res = $stmt->get_result();

$myId = $_SESSION['user_id'] ?? null;
$entries = [];
while ($r = $res->fetch_assoc()) {
    $entries[] = [
        'name'  => $r['name'],
        'books' => (int)$r['books'],
        'isMe'  => $myId !== null && (int)$r['id'] === (int)$myId,
    ];
}

jsonResponse(['success' => true, 'week_start' => date('c', strtotime($weekStart)), 'entries' => $entries]);
