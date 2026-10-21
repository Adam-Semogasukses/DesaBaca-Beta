# LAPORAN IMPORT — F15 Library → Desa Baca

**Status: DRY RUN (sampel 20 buku). Pengambilan penuh BELUM dijalankan dan menunggu persetujuan Anda serta jawaban F15 (lihat `../email.md`).**
Tanggal: 10 Oktober 2026 · Tidak ada file proyek lama yang diubah · Tidak ada yang ditulis ke database.

## 1. Izin & etika (ringkas)
| Sumber | Isi | Sikap kami |
|---|---|---|
| `robots.txt` | Hanya `/admin`, `/login`, `/auth/`, `/my-books`, `/journal` yang diblokir. `/collections/` boleh. | Dipatuhi. |
| `/privasi` (Ketentuan) | Minta dihindari: "menyalin isi situs dalam jumlah besar untuk diterbitkan ulang" dan "pengambilan otomatis yang membebani layanan". "Ajak kami bicara." | Ambil penuh **ditahan** sampai F15 menjawab. Draf email: `../email.md`. |
| `/hak-cipta` | Sampul = sampul terbitan, sedang digambar ulang oleh F15. | URL sampul disimpan; **tidak diunduh**. Risiko hotlink dicatat di §5. |

## 2. Cara kerja yang dipilih (paling ringan)
- Halaman dirender di server, jadi **tidak perlu Playwright**. Python stdlib (`urllib` + regex) sudah cukup, dan tidak ada paket yang dipasang.
- **Hanya halaman koleksi** yang dibaca (`/collections/{slug}?sort=title&page=N`). Kartunya sudah memuat judul, penulis, durasi, dan sampul. Halaman `/books/{slug}`, yang berisi teks ringkasan, **tidak pernah dibuka**.
- `?sort=title` dipakai agar paginasi stabil walau ada buku baru yang terbit saat pengambilan berjalan. Urutan default "Terbaru" bisa menggeser isi halaman.
- Banyak-ke-banyak: buku yang muncul di beberapa koleksi digabung berdasarkan slug.
- Sopan ke server: 1 request sekaligus, jeda 1,2-2,0 detik, User-Agent `DesaBacaMetadataBot/0.1`, retry dengan jeda panjang untuk 429/5xx, dan cache di `cache/`. Kalau terputus, jalankan ulang perintah yang sama; halaman yang sudah ada di cache tidak diminta lagi.

**Perkiraan pengambilan penuh:** sitemap memuat **3.982 URL buku** dan **14 koleksi**. Dengan 24 buku per halaman dibutuhkan **±180 request**, sekitar **5-7 menit**. Bandingkan dengan ±3.983 request kalau setiap halaman buku dibuka.

## 3. Hasil dry run
Request ke situs: **3** (+1 sitemap, +3 halaman izin) · Gagal: **0** · Kartu terbaca: **72** · Dilewati: **0** · Disimpan: **20**

| Koleksi | Slug | Angka di situs | Acuan Anda | Cocok? | Sampel diambil |
|---|---|---|---|---|---|
| Dunia & Budaya | world-culture | 527 | 527 | ✅ | 7 |
| Cerita Inspiratif | meaningful-stories | 474 | 474 | ✅ | 7 |
| Kepemimpinan | business-leadership | 397 | 397 | ✅ | 6 |
| 11 koleksi lain | — | (belum diambil) | — | — | 0 |
| Dongeng & Cerita Rakyat | dongeng-cerita-rakyat | — (lokal) | — | — | status `segera_datang` |

**Sampel (20 buku):**

| Slug | Judul | Penulis | Menit | Kategori |
|---|---|---|---|---|
| 100m-leads | $100M Leads | Alex Hormozi | 12 | business-leadership |
| 100m-offers | $100M Offers | Alex Hormozi | 12 | business-leadership |
| 17-kualitas-penting-seorang-team-player | 17 Essential Qualities of a Team Player | John C. Maxwell | 15 | business-leadership |
| 7-powers-the-foundations-of-business-strategy | 7 Powers | Hamilton Helmer | 13 | business-leadership |
| 7-rules-of-power | 7 Rules of Power | Jeffrey Pfeffer | 12 | business-leadership |
| 8-pelajaran-kepemimpinan-militer-untuk-pengusaha | 8 Lessons in Military Leadership for Entrepreneurs | Robert T. Kiyosaki | 15 | business-leadership |
| 1491 | 1491 | Charles C. Mann | 14 | world-culture |
| 1493 | 1493 | Charles C. Mann | 12 | world-culture |
| 1776 | 1776 | David McCullough | 12 | world-culture |
| 1968 | 1968 | Mark Kurlansky | 12 | world-culture |
| 21-lessons-for-the-21st-century | 21 Lessons for the 21st Century | Yuval Noah Harari | 13 | world-culture |
| a-brief-history-of-indonesia | A Brief History of Indonesia | Tim Hannigan | 13 | world-culture |
| book-mediterranean-food | A Book of Mediterranean Food | Elizabeth David | 14 | world-culture |
| 1984 | 1984 | George Orwell | 13 | meaningful-stories |
| bell-adano | A Bell for Adano | John Hersey | 15 | meaningful-stories |
| boy-called-christmas | A Boy Called Christmas | Matt Haig | 13 | meaningful-stories |
| brief-history-seven-killings | A Brief History of Seven Killings | Marlon James | 13 | meaningful-stories |
| clergyman-s-daughter | A Clergyman's Daughter | George Orwell | 13 | meaningful-stories |
| clockwork-orange | A Clockwork Orange | Anthony Burgess | 11 | meaningful-stories |
| constellation-vital-phenomena | A Constellation of Vital Phenomena | Anthony Marra | 13 | meaningful-stories |

**Kelengkapan data:**
- Tanpa penulis: **0** · tanpa durasi: **0** · tanpa sampul: **0** (dari 72 kartu).
- Slug terpanjang: 48 karakter, aman untuk `VARCHAR(80)`.
- Tumpang-tindih antar-koleksi di 3 halaman pertama: **0**. Di sampel ini, relasi banyak-ke-banyak belum terlihat; baru bisa dipastikan pada pengambilan penuh.

## 4. Penyesuaian dengan skema yang ada (`database.sql`, `backend/books.php`, tidak diubah)
| Data F15 | Disimpan di | Catatan |
|---|---|---|
| slug, judul, penulis | `books.slug/title/author` | `INSERT IGNORE`: baris lama (3 buku Desa Baca) tidak tertimpa. |
| URL sampul | `books.cover` | Hanya URL. Lihat risiko §5. |
| kategori utama | `books.category` (nama Indonesia) | Kompatibel dengan `books.php` yang ada. |
| semua kategori | **tabel baru** `book_categories` | Banyak-ke-banyak. |
| 15 kategori | **tabel baru** `categories` (slug, name, status, sort_order) | `dongeng-cerita-rakyat` = `segera_datang`. |
| durasi (menit), URL sumber | **tabel baru** `book_sources` | `books` tidak punya kolom untuk keduanya, dan kita tidak mengubah tabel lama. |
| deskripsi | `books.description = NULL` | Sengaja kosong: subjudul atau isi ringkasan adalah tulisan F15. |
| bab | `books.chapters` default 6 | F15 memakai "Bagian" dengan jumlah berbeda-beda; tidak diambil. |

`import_sample.sql` dibungkus `START TRANSACTION … COMMIT` dan memakai `CREATE TABLE IF NOT EXISTS`. Hasilnya aman dijalankan ulang (idempoten). **Belum dijalankan**; saya hanya memeriksanya dengan membaca.

## 5. Masalah yang ditemukan
1. **Izin belum ada** (§1). Ini penghalang utama pengambilan penuh.
2. **Sampul format AVIF** (`f15-api.imajikreasi.com/assets/covers/*.avif`). Format ini tidak tampil di Safari < 16 dan WebView Android lama, padahal itu termasuk persona "HP spesifikasi rendah". Menampilkannya juga berarti hotlink ke server F15, dan tautannya bisa putus saat F15 mengganti sampul. Halaman buku memang punya versi `.jpg` di JSON-LD, tetapi halaman itu sengaja tidak dibuka. Saran: tunggu arahan F15 (sudah ditanyakan di email), atau pakai sampul buatan sendiri.
3. **Duplikat dengan data lama.** Desa Baca punya `atomic_habits` (garis bawah), sedangkan F15 punya `atomic-habits` (tanda hubung). Hasilnya dua baris untuk buku yang sama. Hujan dan Filosofi Teras tidak ada di F15. Perlu keputusan: gabungkan ke slug F15, atau lewati slug yang judulnya sudah ada.
4. **Kategori ganda di front-end.** `js/catalog.js:17-26` memakai slug Indonesia (`pengembangan-diri`, `kesehatan`, …), sedangkan data baru memakai slug F15 (`personal-growth`, `health-wellbeing`, …). Front-end belum membaca tabel `categories`, jadi perlu endpoint API (lihat pertanyaan di bawah).
5. **Bahasa slug campur.** Ada slug berbahasa Indonesia dengan judul berbahasa Inggris (`17-kualitas-penting-…` → "17 Essential Qualities…"). Ini tidak merusak apa pun, hanya perlu dicatat.
6. **"Pilihan Editor" adalah kurasi, bukan genre.** Kalau buku Pilihan Editor menjadi kategori utamanya (`books.category`), labelnya akan kurang informatif. Pada run penuh saya sarankan Pilihan Editor tidak dipakai sebagai kategori utama.
7. **Isi bacaan tetap kosong.** Import ini hanya katalog, sehingga tombol "Baca" di Desa Baca masih menampilkan teks placeholder (temuan D-01 di `LAPORAN_SIMULASI_UX.md`). Saran: tombol baca mengarah ke `source_url` di F15 ("Baca ringkasannya di F15").

## 6. Berkas di folder ini
| Berkas | Isi |
|---|---|
| `scrape_f15.py` | Skrip dry run 20 buku (mode `--full` sudah dihapus), hanya stdlib. |
| `f15_books_sample.json` | 20 buku sampel. |
| `categories.json` | 15 kategori (slug, nama, status, angka situs bila sudah diambil). |
| `import_sample.sql` | SQL sampel. |
| `scrape_log.txt` | Log request, jumlah sukses/gagal/dilewati. |
| `cache/` | HTML halaman koleksi + sitemap, untuk resume. |

**Untuk menjalankan ulang dry run:** `python data-import/scrape_f15.py`

---
## Pembaruan 10 Okt 2026 (setelah email dikirim ke F15)
- Sampel menjadi **21 buku**: ditambah `atomic-habits` (koleksi `personal-growth`, 16 menit) lewat 1 request halaman koleksi.
- Hanya satu Atomic Habits. Slug lama `atomic_habits` diganti `atomic-habits` di front-end; `import_sample.sql` memuat `UPDATE` agar baris lama di DB berubah jadi baris F15 (progres & bookmark ikut), bukan duplikat.
- "Pilihan Editor" tetap sebagai kategori, tetapi tidak dipakai sebagai kategori utama (`books.category`).
- Katalog Desa Baca kini membaca `backend/categories.php` dan `backend/books.php` (data JSON sampel; otomatis pindah ke tabel MySQL setelah `import.sql` dijalankan).
