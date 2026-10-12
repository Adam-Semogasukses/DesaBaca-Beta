<?php
// GET backend/categories.php            -> daftar kategori + jumlah buku
// GET backend/categories.php?preview=3  -> sertakan hingga N buku pertama (data lengkap) per kategori, maks 4
require 'config.php';
require 'catalog_lib.php';

$cat = catalogLoad($conn);
$preview = max(0, min(4, (int)($_GET['preview'] ?? 0)));

$out = [];
foreach ($cat['categories'] as $c) {
    if ($preview > 0) {
        $c['preview'] = [];
        foreach ($cat['books'] as $b) {
            if (in_array($c['slug'], $b['categories'], true)) {
                $c['preview'][] = $b;
                if (count($c['preview']) >= $preview) {
                    break;
                }
            }
        }
    }
    $out[] = $c;
}

jsonResponse(['success' => true, 'source' => $cat['source'], 'categories' => $out]);
