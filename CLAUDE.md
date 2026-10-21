# CLAUDE.md

Panduan untuk Claude Code saat bekerja di repo ini. Bahasa komunikasi dan teks UI: **Bahasa Indonesia**.

## Gambaran proyek

**Desa Baca** (beta) — platform baca buku untuk desa (nama desa di kode: `bacaMaju`). Pengguna bisa mendaftar/login, menjelajah katalog, membaca, menyimpan bookmark, melihat progres, riwayat, dan leaderboard mingguan.

Stack: **HTML + CSS + JavaScript murni** (tanpa framework, tanpa build step) di frontend; **PHP native + MySQL + session** di backend. Tidak ada npm/composer.

Dijalankan lewat Laragon (Apache + MySQL). URL lokal: `http://localhost/desabaca-beta/`.

## Menjalankan

1. Laragon → Start All (Apache + MySQL).
2. Buat database `desabaca`: import `database.sql`, lalu `database_update.sql` bila perlu (kolom `seconds_read` juga dibuat otomatis oleh `ensureSecondsColumn()` di `backend/config.php`).
3. Koneksi DB ada di `backend/config.php` (`root`, tanpa password).
4. Katalog F15 (dry run, 20 buku: judul, penulis, sampul): import `data-import/import_sample.sql`. Selama belum diimpor, `backend/books.php` / `categories.php` jatuh ke `f15_books_sample.json` di `data-import/`. Mode `--full` (±3.982 buku) sudah dihapus dari `scrape_f15.py`; skrip kini hanya dry run 20 buku. Skrip/data lengkap bisa dipulihkan dari riwayat git.
5. Panduan uji manual: `PANDUAN_UJI.md`. Tidak ada test otomatis.

> `backend/README.txt` dan `README_v4.txt` sebagian sudah usang (menyebut folder `desa-baca-n`, XAMPP, dan data mockup). Anggap CLAUDE.md ini yang terbaru.

## Struktur

```
index.html        landing + login/register/Google Sign-In   (js/app.js, css/landing.css)
katalog.html      katalog: ?kategori=<slug> untuk satu kategori (js/katalog.js, css/katalog.css)
dashboard.html    hash: #dashboard | #riwayat | #bookmarks    (js/dashboard.js, css/panel.css)
baca.html         halaman baca                                (js/baca.js, reader-tools.js, content.js)
developer.html    kartu profil developer (data di array DEVS di dalam file)

js/theme-init.js  di <head>, set kelas "dark" sebelum render (cegah kedip)
js/common.js      window.DesaBaca: tema, toast, esc(), $/$$, api(), helper localStorage aman
js/store.js       window.DesaBacaStore: SATU-SATUNYA lapisan data (lihat di bawah)
js/catalog.js     klien API katalog (categories.php, books.php) + ikon kategori
js/rail.js        navigasi rail/bottom bar bersama
js/content.js     konten bacaan

css/main.css      token tema + komponen bersama
css/landing.css · katalog.css · panel.css   per halaman

backend/          auth, books, categories, bookmarks, progress, history, stats, leaderboard
                  config.php (koneksi, session, jsonResponse, requireLogin), catalog_lib.php
data-import/      scraper F15 (scrape_f15.py), JSON, SQL import, LAPORAN_IMPORT.md
images/           aset; adampfp.jpg = foto Frontend Developer
```

Urutan `<script>` per halaman penting: `theme-init.js` di head; lalu `store.js` → `common.js` → (catalog/rail/content) → skrip halaman.

## Konvensi & aturan penting

- **Akses data hanya lewat `window.DesaBacaStore`** (bookmark, progres, riwayat, user, leaderboard). Jangan panggil `localStorage` atau endpoint `backend/*.php` langsung dari skrip halaman.
- `store.js` bersifat **hibrid**: localStorage sebagai cache klien + sinkron ke API PHP saat login (`auth.php?action=me` → tarik bookmark/progres/riwayat). Penggabungan progres lokal vs server dijaga agar data server yang lebih lama/kosong tidak menimpa data baru.
- Panggilan API lewat `DesaBaca.api(url, {method, body})` (di `common.js`). Semua endpoint membalas JSON `{success, message, ...}` via `jsonResponse()`; endpoint yang butuh login memanggil `requireLogin()` (401 bila belum).
- Selalu **escape** teks pengguna/data sebelum masuk `innerHTML` dengan `esc()`.
- Akses `localStorage` selalu dibungkus try/catch (mode privat bisa melempar error) — pakai helper yang ada.
- Query SQL memakai **prepared statement** (`mysqli`); pertahankan.
- Tema gelap/terang: kelas `dark` pada `<html>`, kunci `desabaca_theme`. Pakai token CSS di `main.css`, jangan hardcode warna.
- Layout responsif: mobile (<768px) bottom bar; tablet rail ikon; desktop (≥1024px) + sub-sidebar. Tinggi layout dikunci `100dvh`, hanya `<main>` yang scroll — jangan merusak pola ini.
- Gaya kode: IIFE `(function (global) { 'use strict'; ... })(window)`, komentar Bahasa Indonesia, banner komentar di atas tiap berkas. Ikuti gaya sekitarnya.
- Waktu baca dicatat **per detik** (`seconds_read`); leaderboard = jumlah buku berbeda yang dibuka sejak Senin minggu berjalan, dari semua pengguna terdaftar.
- Login: username/password (`password_hash`) dan Google Sign-In (`auth.php?action=google`). Login Facebook sudah dihapus — jangan dimunculkan lagi.
- Buku bacaan "asli" saat ini hanya 3 (`BOOKS` di `store.js`: atomic-habits, 100m-leads, alcohol-explained; isi bacaan masih placeholder). Buku lain di katalog membuka halaman F15 Library. Slug lama `atomic_habits` dipetakan lewat `LEGACY_SLUGS`.
- `developer.html`: data developer ada di array `DEVS`; `foto` harus berupa **string path** (mis. `'images/adampfp.jpg'`), bukan tag `<img>` — tag dirender oleh template.

## Git

- Branch `main`, remote `origin` (GitHub: Adam-Semogasukses/DesaBaca-Beta).
- Commit hanya bila diminta. Pesan commit dalam Bahasa Indonesia, singkat.
- Catatan lingkungan: Windows, git mengubah LF↔CRLF (peringatan itu normal).

## Dokumen lain

- `LAPORAN_SIMULASI_UX.md` — audit UX (temuan: pencarian beranda palsu, isi bacaan placeholder, dll.).
- `data-import/LAPORAN_IMPORT.md` — laporan impor katalog F15.
- `PANDUAN_UJI.md` — daftar URL dan hasil yang diharapkan untuk uji manual.
