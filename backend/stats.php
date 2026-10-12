<?php
require 'config.php';
requireLogin();

$userId = $_SESSION['user_id'];

// 1. Buku tersimpan (bookmarks)
$q = $conn->prepare("SELECT COUNT(*) total FROM bookmarks WHERE user_id=?");
$q->bind_param('i', $userId);
$q->execute();
$bookmarks = (int)$q->get_result()->fetch_assoc()['total'];

// 2. Buku dibuka / pernah dibaca
$q = $conn->prepare("SELECT COUNT(*) total FROM reading_progress WHERE user_id=?");
$q->bind_param('i', $userId);
$q->execute();
$opened = (int)$q->get_result()->fetch_assoc()['total'];

// 3. Buku selesai dibaca (terbaca tuntas: progress = 100 atau status = 'completed')
$q = $conn->prepare("SELECT COUNT(*) total FROM reading_progress WHERE user_id=? AND (status='completed' OR progress>=100)");
$q->bind_param('i', $userId);
$q->execute();
$completed = (int)$q->get_result()->fetch_assoc()['total'];

// 4. Buku sedang dibaca
$inProgress = max(0, $opened - $completed);

// 5. Total menit membaca
$q = $conn->prepare("SELECT SUM(minutes_read) total_minutes FROM reading_progress WHERE user_id=?");
$q->bind_param('i', $userId);
$q->execute();
$minutes = (int)($q->get_result()->fetch_assoc()['total_minutes'] ?? 0);

// 6. Streak hari membaca (dari reading_history)
$q = $conn->prepare("SELECT DISTINCT DATE(created_at) as read_date FROM reading_history WHERE user_id=? ORDER BY read_date DESC");
$q->bind_param('i', $userId);
$q->execute();
$datesRes = $q->get_result();
$dates = [];
while ($row = $datesRes->fetch_assoc()) {
    $dates[] = $row['read_date'];
}

$streak = 0;
if (!empty($dates)) {
    $today = date('Y-m-d');
    $yesterday = date('Y-m-d', strtotime('-1 day'));
    $currentCheck = in_array($today, $dates) ? $today : (in_array($yesterday, $dates) ? $yesterday : null);

    if ($currentCheck) {
        $checkDate = new DateTime($currentCheck);
        foreach ($dates as $d) {
            if ($d === $checkDate->format('Y-m-d')) {
                $streak++;
                $checkDate->modify('-1 day');
            } else if ($d < $checkDate->format('Y-m-d')) {
                break;
            }
        }
    }
}

// 7. Buku dibaca minggu ini (dari hari Senin)
$monday = date('Y-m-d 00:00:00', strtotime('monday this week'));
$q = $conn->prepare("SELECT COUNT(DISTINCT book_id) total FROM reading_history WHERE user_id=? AND event_type='open' AND created_at >= ?");
$q->bind_param('is', $userId, $monday);
$q->execute();
$weekBooks = (int)$q->get_result()->fetch_assoc()['total'];

$completionPct = $opened > 0 ? round(($completed / $opened) * 100) : 0;

jsonResponse([
    'success' => true,
    'stats' => [
        'opened'         => $opened,
        'completed'      => $completed,
        'in_progress'    => $inProgress,
        'bookmarks'      => $bookmarks,
        'minutes'        => $minutes,
        'hours'          => round(($minutes / 60) * 10) / 10,
        'streak'         => $streak,
        'completion_pct' => $completionPct,
        'week_books'     => $weekBooks
    ]
]);
?>