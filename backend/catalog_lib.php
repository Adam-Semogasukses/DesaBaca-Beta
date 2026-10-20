<?php
// Sumber data katalog buku + kategori.
//  1) Tabel MySQL (categories, book_categories, book_sources) bila import.sql sudah dijalankan.
//  2) Kalau belum: berkas JSON hasil data-import (f15_books.json, atau f15_books_sample.json untuk mode sampel).
// Tidak pernah menulis ke database.

function catalogLoad(mysqli $conn): array
{
    $t = $conn->query("SHOW TABLES LIKE 'categories'");
    if ($t && $t->num_rows) {
        $n = $conn->query('SELECT COUNT(*) c FROM categories');
        if ($n && (int)$n->fetch_assoc()['c'] > 0) {
            return catalogWithCovers(catalogFromDb($conn));
        }
    }
    return catalogWithCovers(catalogFromJson());
}

// Sampul dari Open Library (ukuran -M, ±8 KB) bila ada di covers_ol.json; selain itu tetap sampul F15.
function catalogWithCovers(array $cat): array
{
    $file = __DIR__ . '/../data-import/covers_ol.json';
    $map  = is_file($file) ? json_decode(file_get_contents($file), true) : null;
    if (!is_array($map)) {
        return $cat;
    }
    foreach ($cat['books'] as &$b) {
        if (isset($map[$b['slug']])) {
            $b['cover_fallback'] = $b['cover'];
            $b['cover']          = $map[$b['slug']];
        }
    }
    unset($b);
    return $cat;
}

function catalogFinish(array $cats, array $books, string $source): array
{
    $byCat = [];
    foreach ($books as $b) {
        foreach ($b['categories'] as $c) {
            $byCat[$c] = ($byCat[$c] ?? 0) + 1;
        }
    }
    $names = [];
    foreach ($cats as $c) {
        $names[$c['slug']] = $c['name'];
    }
    foreach ($cats as &$c) {
        $c['book_count']  = $byCat[$c['slug']] ?? 0;
        $c['coming_soon'] = $c['status'] === 'segera_datang' || $c['book_count'] === 0;
    }
    unset($c);
    foreach ($books as &$b) {
        $b['category_names'] = array_values(array_filter(array_map(fn($s) => $names[$s] ?? null, $b['categories'])));
    }
    unset($b);
    return ['source' => $source, 'categories' => $cats, 'books' => $books];
}

function catalogFromDb(mysqli $conn): array
{
    $cats = [];
    $r = $conn->query('SELECT slug, name, status FROM categories ORDER BY sort_order, id');
    while ($row = $r->fetch_assoc()) {
        $cats[] = ['slug' => $row['slug'], 'name' => $row['name'], 'status' => $row['status']];
    }

    $rel = [];
    $r = $conn->query('SELECT bc.book_id, c.slug FROM book_categories bc JOIN categories c ON c.id = bc.category_id ORDER BY c.sort_order');
    while ($row = $r->fetch_assoc()) {
        $rel[(int)$row['book_id']][] = $row['slug'];
    }

    $books = [];
    $r = $conn->query('SELECT b.id, b.slug, b.title, b.author, b.cover, s.source_url
                       FROM books b LEFT JOIN book_sources s ON s.book_id = b.id');
    while ($row = $r->fetch_assoc()) {
        $id = (int)$row['id'];
        if (empty($rel[$id])) {
            continue; // buku tanpa kategori tidak masuk katalog
        }
        $books[] = [
            'slug'             => $row['slug'],
            'title'            => $row['title'],
            'author'           => $row['author'],
            'cover'            => $row['cover'],
            'source_url'       => $row['source_url'],
            'categories'       => $rel[$id],
        ];
    }
    return catalogFinish($cats, $books, 'db');
}

function catalogFromJson(): array
{
    $dir  = __DIR__ . '/../data-import/';
    $file = is_file($dir . 'f15_books.json') ? 'f15_books.json' : 'f15_books_sample.json';
    $raw  = is_file($dir . $file) ? json_decode(file_get_contents($dir . $file), true) : null;
    $rawCats = is_file($dir . 'categories.json') ? json_decode(file_get_contents($dir . 'categories.json'), true) : null;
    if (!$raw || !$rawCats) {
        return ['source' => 'kosong', 'categories' => [], 'books' => []];
    }
    $cats = array_map(fn($c) => ['slug' => $c['slug'], 'name' => $c['name'], 'status' => $c['status']], $rawCats);
    $books = array_map(fn($b) => [
        'slug'             => $b['slug'],
        'title'            => $b['title'],
        'author'           => $b['author'],
        'cover'            => $b['cover_url'],
        'source_url'       => $b['source_url'],
        'categories'       => $b['categories'],
    ], $raw['books']);
    return catalogFinish($cats, $books, 'json:' . $file);
}
