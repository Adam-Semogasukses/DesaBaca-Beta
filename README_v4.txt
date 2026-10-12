DESA BACA v4
============
Perubahan dari v3:
- Layout responsif & fleksibel (mobile / tablet / desktop):
    * Mobile (<768px): navigasi ikon ada di bawah layar (bottom bar), konten di atas.
    * Tablet (>=768px): rail ikon di kiri.
    * Desktop (>=1024px): sub-sidebar (Dashboard, Progres, Riwayat, Buku Tersimpan) muncul.
    * baca.html: <1280px teks di atas + Detail Buku di bawah; >=1280px dua kolom.
- Sidebar tidak ikut scroll: tinggi layout dikunci setinggi layar (h-[100dvh]) dan
  hanya <main> yang scroll (pola: root h-screen overflow-hidden + wrapper min-h-0 + main overflow-y-auto).
- Halaman Riwayat Baca, Buku Tersimpan, dan Leaderboard lokal (desa bacaMaju).
- Data masih MOCKUP di localStorage lewat js/store.js. Baca header file itu: berisi
  rencana migrasi ke database (endpoint, tabel, query SQL). Semua halaman harus
  mengakses data lewat window.DesaBacaStore saja.

NATIVE (v4-native)
==================
- Vue 3 dan Tailwind CDN dihapus. Sekarang HTML + CSS + JavaScript murni.
- folder components/ dihapus; semua section ada langsung di index.html.
- CSS: css/main.css (token tema + komponen bersama), css/landing.css (index),
  css/panel.css (dashboard + baca). Tema: class "dark" di <html>.
- JS: js/theme-init.js (di <head>), js/common.js (tema, toast, helper),
  js/app.js (index), js/dashboard.js, js/baca.js. js/store.js TIDAK diubah.
- backend/ dan database.sql TIDAK diubah.
- Dashboard memakai hash: dashboard.html#dashboard | #riwayat | #bookmarks.

KATALOG (ditambahkan)
=====================
- katalog.html  : satu halaman, dua tampilan.
    katalog.html                     -> semua kategori (3 buku per kategori + "Lihat Semua")
    katalog.html?kategori=<slug>     -> semua buku di satu kategori
  Slug: pengembangan-diri, kisah-inspiratif, novel, biografi, keluarga, teknologi,
        ide-usaha-keuangan, kesehatan
- css/katalog.css, js/katalog.js, js/catalog.js (data kategori + buku contoh).
- Buku contoh (placeholder:true) punya sampul SVG buatan sendiri dan belum bisa dibuka/disimpan.
- Link "Katalog Buku" ditambahkan ke rail + sub-nav di dashboard.html dan baca.html.
