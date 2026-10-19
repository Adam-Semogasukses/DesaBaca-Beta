<?php
require 'config.php';
requireLogin();

$userId = $_SESSION['user_id'];
ensureSecondsColumn($conn);
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $conn->prepare(
        "SELECT b.slug, b.title, b.chapters, r.progress, r.current_chapter, r.done_chapters, 
                r.minutes_read, r.seconds_read, r.status, r.first_read_at, r.last_read_at 
         FROM reading_progress r 
         JOIN books b ON b.id = r.book_id 
         WHERE r.user_id = ? 
         ORDER BY r.last_read_at DESC"
    );
    $stmt->bind_param('i', $userId);
    $stmt->execute();
    $res   = $stmt->get_result();
    $items = [];
    while ($r = $res->fetch_assoc()) {
        $doneArr = array_filter(array_map('intval', explode(',', $r['done_chapters'] ?? '')));
        sort($doneArr);
        $items[$r['slug']] = [
            'chapter'       => (int)($r['current_chapter'] ?? 1),
            'done'          => array_values($doneArr),
            'progress'      => (int)($r['progress'] ?? 0),
            'minutes'       => (int)floor(((int)($r['seconds_read'] ?? 0)) / 60),
            'seconds'       => (int)($r['seconds_read'] ?? 0),
            'status'        => $r['status'] ?: 'reading',
            'first_read_at' => $r['first_read_at'],
            'last_read_at'  => $r['last_read_at'],
            'chapters'      => (int)($r['chapters'] ?? 6),
        ];
    }
    jsonResponse(['success' => true, 'progress' => $items]);
}

$data    = json_decode(file_get_contents('php://input'), true) ?? [];
$slug    = trim($data['slug'] ?? '');
$action  = trim($data['action'] ?? '');
$chapter = max(1, (int)($data['chapter'] ?? 1));

if (!$slug) {
    jsonResponse(['success' => false, 'message' => 'Slug buku diperlukan.'], 400);
}

$stmt = $conn->prepare("SELECT id, chapters FROM books WHERE slug=? LIMIT 1");
$stmt->bind_param('s', $slug);
$stmt->execute();
$book = $stmt->get_result()->fetch_assoc();
if (!$book) {
    jsonResponse(['success' => false, 'message' => 'Buku tidak ditemukan.'], 404);
}

$bookId = $book['id'];
$totalChapters = (int)($book['chapters'] ?? 6);
$clientTotal = (int)($data['total'] ?? 0);
if ($clientTotal >= 1 && $clientTotal <= 100) $totalChapters = $clientTotal;

// Ambil progress saat ini
$stmt = $conn->prepare("SELECT * FROM reading_progress WHERE user_id=? AND book_id=? LIMIT 1");
$stmt->bind_param('ii', $userId, $bookId);
$stmt->execute();
$current = $stmt->get_result()->fetch_assoc();

$now = date('Y-m-d H:i:s');
$doneArr = $current ? array_filter(array_map('intval', explode(',', $current['done_chapters'] ?? ''))) : [];

if ($action === 'open') {
    $curChapter = max(1, min($totalChapters, $chapter));
    if ($current) {
        $firstRead = $current['first_read_at'] ?: $now;
        $up = $conn->prepare("UPDATE reading_progress SET current_chapter=?, last_read_at=?, first_read_at=? WHERE id=?");
        $up->bind_param('issi', $curChapter, $now, $firstRead, $current['id']);
        $up->execute();
    } else {
        $ins = $conn->prepare("INSERT INTO reading_progress (user_id, book_id, current_chapter, progress, minutes_read, status, first_read_at, last_read_at) VALUES (?, ?, ?, 0, 0, 'reading', ?, ?)");
        $ins->bind_param('iiiss', $userId, $bookId, $curChapter, $now, $now);
        $ins->execute();
    }

    // Catat ke reading_history dengan deduplikasi 30 menit
    $chkHist = $conn->prepare("SELECT id FROM reading_history WHERE user_id=? AND book_id=? AND event_type='open' AND chapter=? AND created_at >= (NOW() - INTERVAL 30 MINUTE) LIMIT 1");
    $chkHist->bind_param('iii', $userId, $bookId, $curChapter);
    $chkHist->execute();
    if (!$chkHist->get_result()->num_rows) {
        $inH = $conn->prepare("INSERT INTO reading_history (user_id, book_id, event_type, chapter, created_at) VALUES (?, ?, 'open', ?, ?)");
        $inH->bind_param('iiis', $userId, $bookId, $curChapter, $now);
        $inH->execute();
    }

    jsonResponse(['success' => true, 'message' => 'Progress dibuka']);
}

if ($action === 'time') {
    // Tambah waktu baca (detik) yang dihitung client selama halaman baca terbuka.
    $secs = max(0, min(300, (int)($data['seconds'] ?? 0)));
    if ($secs > 0) {
        if ($current) {
            $up = $conn->prepare("UPDATE reading_progress SET seconds_read = seconds_read + ?, minutes_read = FLOOR(seconds_read / 60), last_read_at=? WHERE id=?");
            $up->bind_param('isi', $secs, $now, $current['id']);
            $up->execute();
        } else {
            $m = intdiv($secs, 60);
            $ins = $conn->prepare("INSERT INTO reading_progress (user_id, book_id, current_chapter, progress, minutes_read, seconds_read, status, first_read_at, last_read_at) VALUES (?, ?, 1, 0, ?, ?, 'reading', ?, ?)");
            $ins->bind_param('iiiiss', $userId, $bookId, $m, $secs, $now, $now);
            $ins->execute();
        }
    }
    jsonResponse(['success' => true]);
}

if ($action === 'chapter_done') {
    if (!in_array($chapter, $doneArr)) {
        $doneArr[] = $chapter;
        sort($doneArr);
    }
    // Bab terakhir ditandai selesai = buku selesai dibaca (semua bab tuntas)
    if ($chapter >= $totalChapters) {
        $doneArr = range(1, $totalChapters);
    }
    $doneStr = implode(',', $doneArr);
    $pct = min(100, round((count($doneArr) / $totalChapters) * 100));
    $finished = count($doneArr) >= $totalChapters;
    $status = $finished ? 'completed' : 'reading';
    $nextChapter = $finished ? $chapter : min($totalChapters, $chapter + 1);

    if ($current) {
        $firstRead = $current['first_read_at'] ?: $now;
        $up = $conn->prepare("UPDATE reading_progress SET current_chapter=?, done_chapters=?, progress=?, status=?, last_read_at=?, first_read_at=? WHERE id=?");
        $up->bind_param('isissssi', $nextChapter, $doneStr, $pct, $status, $now, $firstRead, $current['id']);
        $up->execute();
    } else {
        $ins = $conn->prepare("INSERT INTO reading_progress (user_id, book_id, current_chapter, done_chapters, progress, status, first_read_at, last_read_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        $ins->bind_param('iiisisss', $userId, $bookId, $nextChapter, $doneStr, $pct, $status, $now, $now);
        $ins->execute();
    }

    // Catat event chapter_done
    $inH = $conn->prepare("INSERT INTO reading_history (user_id, book_id, event_type, chapter, created_at) VALUES (?, ?, 'chapter_done', ?, ?)");
    $inH->bind_param('iiis', $userId, $bookId, $chapter, $now);
    $inH->execute();

    if ($finished) {
        $inHFin = $conn->prepare("INSERT INTO reading_history (user_id, book_id, event_type, chapter, created_at) VALUES (?, ?, 'finish', ?, ?)");
        $inHFin->bind_param('iiis', $userId, $bookId, $chapter, $now);
        $inHFin->execute();
    }

    jsonResponse([
        'success'  => true,
        'finished' => $finished,
        'progress' => $pct,
        'chapter'  => $nextChapter,
        'done'     => $doneArr
    ]);
}

jsonResponse(['success' => false, 'message' => 'Action tidak didukung'], 400);
?>