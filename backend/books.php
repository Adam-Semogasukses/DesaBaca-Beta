<?php
// GET backend/books.php
//   ?kategori=<slug>   saring per kategori (slug kategori, mis. personal-growth)
//   ?q=<kata>          cari di judul/penulis
//   ?sort=title|author|duration   (default title)
//   ?page=1&per_page=24           (per_page maks 100)
// Respons: { success, source, total, page, per_page, has_more, category?, books:[...] }
// Catatan: versi lama endpoint ini mengembalikan isi tabel books mentah; tidak ada
// kode front-end yang memakainya, jadi bentuknya diganti mengikuti katalog baru.
require 'config.php';
require 'catalog_lib.php';

$cat = catalogLoad($conn);
$books = $cat['books'];

$kategori = trim($_GET['kategori'] ?? '');
$category = null;
if ($kategori !== '') {
    foreach ($cat['categories'] as $c) {
        if ($c['slug'] === $kategori) {
            $category = $c;
        }
    }
    if (!$category) {
        jsonResponse(['success' => false, 'message' => 'Kategori tidak ditemukan.'], 404);
    }
    $books = array_values(array_filter($books, fn($b) => in_array($kategori, $b['categories'], true)));
}

$q = trim($_GET['q'] ?? '');
if ($q !== '') {
    $books = array_values(array_filter($books, fn($b) =>
        mb_stripos($b['title'], $q) !== false || mb_stripos((string)$b['author'], $q) !== false));
}

switch ($_GET['sort'] ?? 'title') {
    case 'author':
        usort($books, fn($a, $b) => strnatcasecmp((string)$a['author'], (string)$b['author']) ?: strnatcasecmp($a['title'], $b['title']));
        break;
    case 'duration':
        usort($books, fn($a, $b) => ($a['duration_minutes'] ?? 999) <=> ($b['duration_minutes'] ?? 999) ?: strnatcasecmp($a['title'], $b['title']));
        break;
    default:
        usort($books, fn($a, $b) => strnatcasecmp($a['title'], $b['title']));
}

$total   = count($books);
$perPage = max(1, min(100, (int)($_GET['per_page'] ?? 24)));
$page    = max(1, (int)($_GET['page'] ?? 1));
$slice   = array_slice($books, ($page - 1) * $perPage, $perPage);

$resp = [
    'success'  => true,
    'source'   => $cat['source'],
    'total'    => $total,
    'page'     => $page,
    'per_page' => $perPage,
    'has_more' => $page * $perPage < $total,
    'books'    => $slice,
];
if ($category) {
    $resp['category'] = $category;
}
jsonResponse($resp);
