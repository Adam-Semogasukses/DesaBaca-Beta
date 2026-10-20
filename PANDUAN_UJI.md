# PANDUAN UJI — Katalog F15 di Desa Baca

Panduan ini untuk Anda sebagai penguji. Ada dua tahap: **Tahap 1** tanpa menyentuh database (cukup menyalakan Laragon), **Tahap 2** setelah Anda menjalankan `import_sample.sql`.

## 0. Persiapan

| Langkah | Detail |
|---|---|
| 1 | Buka **Laragon → Start All** (Apache + MySQL harus hijau). Saat saya menguji, keduanya mati. |
| 2 | Alamat dasar: `http://localhost/desabacav5/` (selanjutnya ditulis `{BASE}`) |
| 3 | Buka browser dengan DevTools (F12): tab **Console** (cari error merah) dan **Network** (cari request merah). |
| 4 | Untuk uji HP: F12 → ikon perangkat (Ctrl+Shift+M), pilih lebar **390px**. |
| 5 | Akun uji: daftar lewat form **Daftar Baru** dengan nama misalnya `penguji01` (akan tercatat di database asli Anda). |

## 1. Alamat yang diuji (path)

| Apa | Alamat | Yang diharapkan |
|---|---|---|
| Beranda | `{BASE}/index.html` | Kartu kategori, daftar kategori, dan pil yang berjalan berisi nama kategori F15 |
| Katalog (semua) | `{BASE}/katalog.html` | Bagian per kategori yang sudah berisi buku, lalu daftar "Segera datang" |
| Katalog per kategori | `{BASE}/katalog.html?kategori=world-culture` | 7 buku (Dunia & Budaya) |
| Kategori kosong | `{BASE}/katalog.html?kategori=dongeng-cerita-rakyat` | Panel **Segera datang** |
| Kategori tak dikenal | `{BASE}/katalog.html?kategori=xyz` | "Kategori tidak ditemukan" |
| API kategori | `{BASE}/backend/categories.php?preview=2` | JSON, 15 kategori |
| API buku | `{BASE}/backend/books.php?kategori=personal-growth` | JSON, 1 buku (Atomic Habits) |
| API cari | `{BASE}/backend/books.php?q=orwell` | JSON, 2 buku |
| API urut | `{BASE}/backend/books.php?kategori=world-culture&sort=author&per_page=3&page=2` | `has_more: true`, 3 buku |
| API salah | `{BASE}/backend/books.php?kategori=xyz` | `{"success":false,...}` status 404 |
| Pembaca | `{BASE}/baca.html?book=atomic-habits` | Pembaca Atomic Habits (isi masih placeholder) |
| Tautan lama | `{BASE}/baca.html?book=atomic_habits` | Tetap membuka Atomic Habits (alias) |

Periksa juga field `"source"` di respons API: `json:f15_books_sample.json` berarti membaca JSON (Tahap 1), `db` berarti membaca MySQL (Tahap 2).

## 2. Tahap 1 — tanpa import (database tidak disentuh)

### Alur A — Pengunjung baru menjelajah
1. Buka `{BASE}/index.html`. Gulir ke bagian **KATEGORI**.
   - ✅ 2 kartu (Kepemimpinan, Cerita Inspiratif) dengan sampul asli, tulisan "Contoh buku: …", jumlah buku (6 dan 7).
   - ✅ Daftar di kanan: 15 kategori bernomor. Yang kosong ditandai **SEGERA**. Tidak ada widget kategori kedua.
   - ✅ Pil yang berjalan di bawah hero hanya berisi kategori yang sudah ada bukunya.
2. Klik **Mulai Membaca** di kartu Kepemimpinan → masuk ke `katalog.html?kategori=business-leadership`.
3. Karena belum login, Anda dialihkan ke beranda dengan form login (**perilaku lama yang belum diubah**). Daftar akun uji, lalu kembali ke langkah 2.

### Alur B — Menjelajah katalog
1. Dari beranda klik menu **BELAJAR → Katalog Buku** (di HP: menu ☰ → **KATALOG**).
2. Di `katalog.html` periksa:
   - ✅ Baris chip kategori: 15 chip + "Semua". Chip kosong bergaris putus-putus dan bertuliskan "segera".
   - ✅ Bagian Kepemimpinan (6 buku), Cerita Inspiratif (7), Pengembangan Diri (1), Dunia & Budaya (7), masing-masing maksimal 3 kartu + **Lihat Semua**.
   - ✅ Di bawah: bagian **Segera datang** berisi 11 kategori.
   - ✅ Kartu: sampul, judul, penulis, tag kategori, label "Baca di F15" (Atomic Habits, 100M Leads, Alcohol Explained memakai ikon bookmark).
3. Klik **Lihat Semua** di Dunia & Budaya → 7 buku, tombol "Semua Kategori" muncul, tombol "Muat lebih banyak" **tidak** muncul (7 < 24).
4. Klik kartu **1984** (atau judulnya) → F15 Library terbuka di **tab baru**, katalog tetap di tempatnya.
5. Tekan **Tab** berulang kali sampai kartu terfokus, lalu **Enter** → hasilnya sama dengan klik.

### Alur C — Kategori "Segera datang" (Dongeng)
1. Di daftar **Segera datang**, atau di chip, klik **Dongeng & Cerita Rakyat**.
   - ✅ Panel dengan ikon jam pasir, judul "Segera datang", teks khusus dongeng, tombol **Lihat kategori lain**.
   - ✅ Chip "Dongeng…" aktif, tombol "Semua Kategori" muncul di kanan atas.
2. Klik **Lihat kategori lain** → kembali ke `katalog.html`.
3. Coba kategori kosong lain, mis. `?kategori=wealth-finance` → panel yang sama dengan teks generik.
4. Coba `?kategori=xyz` → "Kategori tidak ditemukan" dan tombol "Lihat semua kategori".

### Alur D — Satu Atomic Habits saja
1. Di `katalog.html?kategori=personal-growth` hanya ada **satu** Atomic Habits, sampulnya sampul F15 (bukan `images/atomic_habits.jpg`).
2. Di beranda, bagian **E-BOOK POPULER**, ada satu Atomic Habits dengan sampul F15 (tag hanya "Pengembangan Diri").
3. Klik kartunya → `baca.html?book=atomic-habits`. Buka juga `baca.html?book=atomic_habits` → halaman yang sama.
4. Cari "atomic" di seluruh `katalog.html` (Ctrl+F): tidak ada kartu kedua.

### Alur E — Uji API langsung
Buka alamat-alamat di tabel §1 satu per satu di tab browser. Cocokkan `total`, `has_more`, dan kode status.

### Alur F — Kondisi tidak ideal
| Skenario | Cara | Yang diharapkan |
|---|---|---|
| Katalog gagal dimuat | Di Laragon, **Stop** Apache lalu muat ulang katalog; atau di DevTools Network pilih **Offline** lalu muat ulang | Panel "Katalog belum bisa dimuat" + tombol **Coba lagi** (jangan blank) |
| Sampul gagal | DevTools → Network → klik kanan satu sampul → **Block request URL**, muat ulang | Diganti ikon buku, layout tidak rusak |
| Tema | Klik ikon bulan/matahari di rail kiri | Panel "Segera datang" dan kartu tetap terbaca di terang & gelap |
| HP 390px | Mode perangkat | Kartu 1 kolom, chip bisa digeser, navigasi bawah muncul |

## 3. Tahap 2 — setelah import (database terisi)

> **Cadangkan dulu**: phpMyAdmin → database `desabaca` → Export. File SQL sampel tidak menghapus apa pun (`INSERT IGNORE`, `CREATE TABLE IF NOT EXISTS`), tetapi cadangan tetap disarankan.

1. phpMyAdmin → database `desabaca` → tab **Import** → pilih `data-import/import_sample.sql` → Go.
2. Cek tabel baru ada isinya: `categories` (15 baris), `book_categories` (21 baris), `book_sources` (21 baris), dan di `books` slug `atomic-habits` (bukan `atomic_habits`, kalau sebelumnya sudah ada).
3. Buka `{BASE}/backend/categories.php` → `"source":"db"`.
4. Ulangi Alur B dan C: tampilan harus **sama persis** dengan Tahap 1.
5. **Bookmark & progres Atomic Habits**: login, buka `katalog.html?kategori=personal-growth`, klik ikon bookmark pada Atomic Habits → toast "Buku disimpan"; buka `dashboard.html#bookmarks` → bukunya ada. Muat ulang → tetap ada.
6. Buka `baca.html?book=atomic-habits`, tekan **Tandai selesai** → `dashboard.html#riwayat` mencatatnya.

⚠️ **Sebelum import**, bookmark dan progres untuk `atomic-habits` tidak tersimpan di server (bukunya belum ada di tabel `books`, server menjawab 404 "Buku tidak ditemukan"), sehingga data lokal bisa terhapus saat sinkron. Itu sebab uji bookmark baru bermakna di Tahap 2.

## 4. User flow (diagram)

```
                 ┌────────────────────────┐
                 │  index.html (Beranda)  │
                 └───────────┬────────────┘
     ┌──────────────┬────────┼────────────┬─────────────────┐
     ▼              ▼        ▼            ▼                 ▼
 Pil kategori   Kartu     Daftar      "Lihat Semua"     Menu Katalog
 (marquee)      kategori  kategori 1-15 (E-Book)
     └──────────────┴────────┴────────────┴─────────────────┘
                              │
                     (belum login?) ──► form login/daftar ──► kembali
                              │
                              ▼
                 ┌────────────────────────┐
                 │ katalog.html (semua)   │◄─────────────────────┐
                 └───────────┬────────────┘                      │
          ┌──────────────────┼───────────────────┐               │
          ▼                  ▼                   ▼               │
   "Lihat Semua"        Chip kategori      Daftar "Segera datang"│
          │                  │                   │               │
          ▼                  ▼                   ▼               │
 katalog.html?kategori=X     ├── ada buku ──► daftar buku (24/halaman, "Muat lebih banyak")
                             └── kosong ────► panel "Segera datang" ─► "Lihat kategori lain" ─┘
                                                   │
                                   klik kartu buku ▼
                       ┌───────────────┴────────────────┐
                       ▼                                ▼
          Atomic Habits (dikenal Desa Baca)     Buku F15 lain
          baca.html?book=atomic-habits          tab baru: f15library.com/books/<slug>
          + bookmark ★ (Tahap 2)                (ikon ↗, tanpa bookmark)
                       │
                       ▼
          Tandai selesai → dashboard (Riwayat / Buku Tersimpan)
```

## 5. Daftar centang cepat

- [ ] Beranda: 15 kategori, tidak ada "Novel/Teknologi" lama
- [ ] Katalog semua: 4 bagian berisi + daftar "Segera datang" (11)
- [ ] `?kategori=world-culture`: 7 buku, tidak ada tombol "Muat lebih banyak"
- [ ] `?kategori=dongeng-cerita-rakyat`: panel "Segera datang"
- [ ] `?kategori=xyz`: "Kategori tidak ditemukan"
- [ ] Hanya 1 Atomic Habits; `?book=atomic_habits` tetap jalan
- [ ] Klik buku F15 → tab baru; Enter pada kartu terfokus bekerja
- [ ] Apache dimatikan → pesan error + "Coba lagi"
- [ ] Console tanpa error merah (abaikan peringatan pihak ketiga)
- [ ] HP 390px: kartu tidak terpotong *(belum dipastikan; screenshot saya terpotong, kemungkinan akibat batas lebar Edge headless)*
- [ ] Tahap 2: `"source":"db"`, bookmark dan progres Atomic Habits tersimpan

## 6. Yang SENGAJA belum ada (jangan dicatat sebagai bug)

- Pencarian di beranda masih palsu; `?q=` hanya ada di API.
- Katalog masih wajib login (pengunjung dialihkan ke form login).
- Heading "E-BOOK BARU" di beranda masih kosong.
- Isi bacaan Atomic Habits di `baca.html` masih placeholder.
- 11 kategori kosong sampai pengambilan penuh F15 disetujui.
- Bookmark untuk buku F15 selain Atomic Habits belum ada.

Catat temuan Anda dengan format: **Alur · langkah · yang diharapkan · yang terjadi · screenshot/Console**.
