# LAPORAN SIMULASI UX — DESA BACA

Tanggal audit: 10 Oktober 2026 · Mode: AUDIT (tidak ada file proyek yang diubah; hanya file laporan ini yang dibuat)

## Catatan metode (baca dulu)

| Yang dilakukan | Yang TIDAK dilakukan |
|---|---|
| Membaca seluruh kode: 5 HTML, 8 JS, 4 CSS, 6 PHP, 2 SQL (~4.800 baris). | Tidak membuka browser, jadi **tidak ada screenshot, tidak ada ukur kecepatan nyata, tidak ada uji sentuh pada perangkat**. Semua temuan tampilan/CSS adalah **analisis kode**. |
| Memastikan server Laragon hidup (`index.html` → 200, `backend/books.php` → JSON 3 buku). | Tidak membuat akun mockup lewat `register` karena itu menulis ke database asli. Alur login/bookmark/progres dinilai dari kode. |
| Autentikasi diabaikan sesuai instruksi (keamanan login/OAuth/password tidak dinilai). | Rasio kontras warna adalah **perkiraan hitung manual**, bukan hasil alat ukur. |

**Asumsi vs kenyataan kode.** Anda meminta konten dianggap lengkap. Kode tidak sejalan: hanya **3 buku asli** (`js/store.js:24-28`) dan **44 "buku contoh"** (`js/catalog.js:105-117`). Lebih mendasar lagi, **teks bacaan tidak ada di sistem**: `baca.html:93-99` berisi paragraf yang sama untuk semua buku dan semua bab. Karena itu saya menilai kondisi ini sebagai produk jadi, dan hasilnya masuk kategori Kritis. Kalau isi buku memang menyusul, mekanisme untuk menampungnya tetap harus dibangun (lihat D-01 dan E-1).

---

## A. RINGKASAN

**Kesan umum.** Dari luar, tampilannya rapi dan serius. Ada tema gelap/terang yang matang, dashboard statistik, layout bottom-bar di HP, dan katalog berkategori. Begitu pengguna benar-benar mencoba membaca, pengalaman jatuh: halaman baca menampilkan teks sambutan yang sama untuk setiap buku. Pencarian di beranda palsu (tidak menyaring apa pun). Banyak tombol berujung ke pop-up login atau toast "buku contoh". Fondasinya bagus, tetapi inti produk ("baca buku") belum ada.

| Aspek | Skor (1-10) | Alasan singkat |
|---|---|---|
| Kemudahan | **5** | Navigasi jelas di dashboard, tetapi beranda membingungkan: pencarian palsu, "Lihat Semua" membuka login (bahkan saat sudah login), katalog tidak ditautkan dari beranda. |
| Kenyamanan membaca | **3** | Tanpa pengatur ukuran font, teks 14-15px, isi bacaan placeholder, tombol navigasi tidak menempel di layar HP, posisi gulir tidak tersimpan. Nilai plus: mode gelap bawaan dan lebar teks 768px. |
| Tampilan | **7** | Gaya konsisten, kartu rapi, dark/light matang. Dikurangi teks terlalu kecil (9-12px), kontras teks sekunder rendah, sisa copy dari situs lain. |
| Kecepatan | **5** | Berkas lokal ringan. Namun ikon (Font Awesome penuh) dan font bergantung CDN. Skrip Google dimuat padahal fiturnya mati. Gambar tanpa dimensi dan tanpa kompresi. Tanpa dukungan offline. |
| Kelengkapan fitur | **3** | Tidak ada pencarian nyata, pengurutan, teks bacaan, pengaturan font, catatan/sorotan, atau unduh/offline. Leaderboard memakai nama palsu. |

---

## B. HASIL SIMULASI PER PERSONA

| Persona | Tujuan | Berhasil? | Titik masalah | Saran |
|---|---|---|---|---|
| **1. Mahasiswa** | Cari buku untuk tugas tentang kebiasaan/psikologi, lalu baca dan catat. | **Tidak** | Ketik di kotak cari beranda, hanya muncul "Hasil pencarian untuk: X" dan layar menggulir; **tidak ada yang tersaring** (`app.js:214-226`). Katalog tidak punya pencarian. Info buku minim (tanpa tahun, penerbit, jumlah halaman, daftar isi). Tidak ada salin kutipan, sorotan, atau catatan. Bab hanya "Bab 1-6", semua berjudul sama (`baca.js:46`). | Pencarian sungguhan (judul, penulis, kategori) di beranda dan katalog. Halaman detail buku dengan metadata dan daftar isi. Sorotan dan catatan. |
| **2. Pembaca santai malam hari (HP)** | Baca nyaman di tempat tidur. | **Sebagian** | Mode gelap bawaan (bagus). Tidak ada pengatur font, tidak ada mode sepia/redup. Teks 14px di HP (`panel.css:307`). Tombol Sebelumnya/Selesai/Berikutnya ada di **ujung teks**, bukan menempel di bawah layar (`panel.css:317`, <1280px). Navigasi bawah hanya ikon. Teks bacaan placeholder. | Panel pengaturan baca (font A-/A+, jarak baris, latar). Bar navigasi bab yang menempel. Ingat posisi gulir. |
| **3. Orang tua mencari bacaan anak** | Temukan bacaan aman sesuai usia anak. | **Tidak** | Kategori "Keluarga & Anak" hanya berisi 6 buku contoh (`catalog.js:47`). Tidak ada rentang usia, penanda "ramah anak", atau rekomendasi. Kategori beranda (Novel, Biografi, Keluarga, Teknologi) tidak sama dengan katalog (8 kategori). Ada "DONGENG & CERITA RAKYAT" di daftar samping, tetapi tautannya mati (`app.js:126`). | Kategori/filter usia, label "ramah anak", dan dongeng sebagai kategori nyata. |
| **4. Pengguna baru, gaptek** | Paham situs ini apa, lalu mulai membaca satu buku. | **Sebagian, dengan hambatan besar** | Badge hero berbunyi "Platform Belajar **Coding** Bahasa Indonesia" (`index.html:114`), dan teks bagian E-Book bicara "Full-Stack Developer Expert" (`:144`). Kartu buku tidak punya tombol "Baca" (hanya kursor tangan; `app.js:81`). Pop-up login langsung muncul dari banyak tombol. Menu "DEVELOPER" dan "Tech Stack" tidak relevan. Navigasi panel hanya ikon tanpa label di HP. | Satu kalimat nilai yang jelas di hero. Tombol "Baca sekarang" di tiap kartu. Hapus unsur developer dari area pengguna. Label teks di navigasi bawah. |
| **5. Koneksi lambat / HP murah** | Buka situs dan mulai baca tanpa menunggu lama. | **Sebagian** | Ikon memakai Font Awesome penuh dari CDN, di `<head>` dan memblokir render (`index.html:12`); jika CDN lambat, **ikon navigasi bawah kosong**. Dua keluarga font Google. Skrip Google Sign-In dimuat walau `CLIENT_ID` kosong (`index.html:20`, `app.js:547`). Gambar 338 KB untuk sampul kecil (`images/v259_153.png`). Marquee tak berhenti dan blur kaca (`backdrop-filter`) membebani HP lemah. Tanpa service worker. | Host ikon sendiri (hanya ±40 ikon) atau pakai SVG inline. Buang skrip Google selama belum aktif. Kompres gambar ke WebP dan beri `width`/`height`. Tambah mode hemat data dan cache offline. |

---

## C. PETA PERJALANAN PENGGUNA

Legenda: 😕 bingung · 😊 senang · 🚪 bisa pergi

**Perjalanan utama (pengguna baru, belum login):**

1. Buka `index.html`. Hero tampil dengan tema gelap, judul besar, kotak cari. 😊 Kesan pertama rapi.
2. Baca badge "Platform Belajar Coding…" dan "Full-Stack Developer Expert". 😕 *"Ini situs coding atau buku?"* 🚪 Sebagian pengguna keluar di sini.
3. Ketik judul buku di kotak cari lalu Enter. 😕 Hanya muncul "Hasil pencarian untuk: …" dan halaman bergeser; daftar tidak berubah. *"Rusak?"* 🚪
4. Klik pil genre yang berjalan (marquee). 😕 Hal yang sama; pil terus bergerak sehingga susah diketuk di HP.
5. Gulir ke "E-Book Populer": 3 kartu buku. 😊 Sampul dan sinopsis bagus. 😕 Tidak ada tombol baca; kartu dikira sekadar gambar.
6. Klik kartu → `baca.html?book=…`. Langsung terbuka walau belum login. 😊 Cepat.
7. Baca. 😕 Teks sambutan "Selamat datang di ruang baca…" (bukan isi buku). Bab 2, 3, … sama persis. 🚪 **Titik keluar terbesar.**
8. Tekan panah kembali / ikon di sisi. 😕 Semua mengarah ke Dashboard, yang memaksa login (`baca.js:119-126`). 🚪
9. Klik "Lihat Semua" di beranda. 😕 Muncul pop-up login, bukan daftar buku (`index.html:149`).
10. Daftar (hanya nama dan sandi). 😊 Cepat, tanpa verifikasi email.
11. Setelah masuk, langsung ke Dashboard (angka nol). 😕 *"Lalu saya harus apa?"* Tidak ada ajakan "Mulai membaca" di tampilan utama; yang ada baru tombol "Isi data contoh" di halaman Riwayat (`dashboard.html:172`).
12. Buka Katalog (hanya dari sidebar panel). 😊 Chip kategori dan kartu rapi. 😕 40+ kartu bertanda "Contoh"; klik hanya memunculkan toast merah "belum bisa dibaca" (`katalog.js:157`). 🚪

**Perjalanan "kembali lagi":**

1. Buka situs → beranda, tidak ada "Lanjutkan membaca".
2. Login → Dashboard menampilkan statistik. Tombol "Lanjutkan" hanya ada di tab Riwayat (`dashboard.html:177`). 😕
3. Klik "Progres Baca" di sidebar → membuka `baca.html` tanpa `?book`, yaitu **Atomic Habits** (bukan buku terakhir yang dibaca) (`baca.js:16-17`). 😕
4. Posisi gulir dalam bab tidak tersimpan; hanya nomor bab yang ingat. 😕

**Kondisi buruk:**
- URL buku salah (`baca.html?book=xyz`) → **diam-diam menampilkan Atomic Habits** (`baca.js:17`). 😕 Tidak ada pesan "buku tidak ditemukan".
- Halaman tidak ada (404) → halaman bawaan server, tanpa tautan balik (tidak ada halaman 404 sendiri).
- Kategori salah → pesan ramah "Kategori tidak ditemukan" (`katalog.js:114-118`). 😊 Contoh yang benar.
- Internet putus saat baca → teks tetap tampil (lokal), tetapi ikon/font CDN hilang. Simpan bookmark gagal diam-diam lalu **tertimpa data server saat sinkron berikutnya** (`store.js:116-127` lalu `:326`).
- Gambar sampul gagal → tidak ada `onerror`/cadangan; muncul ikon gambar rusak.

---

## D. DAFTAR YANG HARUS DIPERBAIKI

| No | Prioritas | Bagian / File:baris | Masalah | Dampak ke pengguna | Cara memperbaiki |
|---|---|---|---|---|---|
| D-01 | **Kritis** | `baca.html:93-99`, `baca.js:46` | Isi bacaan statis dan sama untuk semua buku/bab. Judul bab selalu "Memulai Kebiasaan Membaca". Database tidak punya tabel isi bab (`database.sql`). | Produk inti tidak berfungsi: pengguna tidak bisa membaca buku. | Buat tabel `chapters` (book_id, no, judul, isi) atau berkas per bab. Tambah `backend/chapter.php` dan render di `baca.js`. Ganti judul bab dari data. |
| D-02 | **Kritis** | `app.js:214-226`, `index.html:120-129` | Pencarian palsu: hanya menampilkan "Hasil pencarian untuk X" dan menggulir. Pil genre memanggil fungsi yang sama (`app.js:68`). | Pengguna mengira situs rusak; persona 1 dan 4 gagal. | Saring `Catalog.BOOKS` (judul/penulis/kategori) dan tampilkan hasil + pesan kosong ("Tidak ada hasil untuk 'X'. Coba kata lain"). |
| D-03 | **Kritis** | `catalog.js:105-117`, `katalog.js:137-142,157` | 44 buku contoh vs 3 buku asli; klik berujung toast error. Deskripsi: "…akan tampil di sini setelah data buku asli ditambahkan." | Katalog tampak 93% kosong/palsu; merusak kepercayaan. | Isi data buku asli, atau sembunyikan buku contoh di produksi. Pindahkan data ke DB lewat `books.php` (sudah ada, tidak dipakai; `catalog.js:9`). |
| D-04 | **Kritis** | `baca.js:136-146` + `store.js:357` | Pembaca yang belum login: setelah halaman termuat, `syncFromDatabase()` mendeteksi "tidak login" lalu **`clearUserData()` menghapus progres lokal**. Bab terakhir kembali ke 1 setiap muat ulang. | Refresh di tengah baca = progres hilang (untuk pembaca tamu). | Jangan hapus data lokal untuk tamu. Simpan progres tamu terpisah dan gabungkan setelah login. |
| D-05 | **Tinggi** | `index.html:149,158,177,183`, `app.js:119,624-626` | Semua "Lihat Semua" / "Mulai Membaca" memakai `data-action="open-auth"`. Pengguna yang **sudah login** pun melihat form login. | Membingungkan dan terasa rusak. | Arahkan ke `katalog.html` (atau `?kategori=`). Buka login hanya bila belum masuk. |
| D-06 | **Tinggi** | `index.html` (tanpa tautan), `katalog.js:216-220` | Katalog tidak ditautkan dari beranda dan wajib login (redirect ke `index.html?auth=login`). | Pengunjung baru tidak bisa menjelajah isi sebelum mendaftar. | Buka katalog untuk umum, minta login hanya saat simpan/lanjut. Tambah "Katalog" di navbar beranda. |
| D-07 | **Tinggi** | `index.html:114,144`, `:59-65`, `:190-203` | Salinan dari situs coding: badge "Belajar Coding", "Full-Stack Developer Expert", menu "DEVELOPER", seksi Tech Stack. | Pengguna salah paham tujuan situs; terasa belum selesai. | Ganti copy: "Baca buku apa saja dalam 15 menit." Pindahkan kredit teknologi ke footer kecil. |
| D-08 | **Tinggi** | `app.js:81-97` | Kartu buku tidak punya tombol "Baca"; `<article>` dapat diklik tanpa `tabindex`/`role`, jadi **tidak bisa dijangkau keyboard** (bandingkan `katalog.js:33` yang benar). | Pengguna gaptek tidak tahu kartu bisa diklik; pengguna keyboard tidak bisa membuka buku. | Tambah tombol/tautan "Baca sekarang" sungguhan di kartu. |
| D-09 | **Tinggi** | `panel.css:307-309`, `baca.html` (tanpa kontrol) | Tidak ada pengatur ukuran font/jarak/latar. Font 14px (HP) dan 15px, `line-height: 2`. | Sulit dibaca lama, terutama usia lanjut atau malam hari. | Panel "Aa": ukuran (3-5 pilihan), jarak baris, tema Terang/Sepia/Gelap. Simpan di `localStorage`. |
| D-10 | **Tinggi** | `panel.css:317` (`.reader-foot`), `panel.css:282` | Di bawah 1280px tombol Sebelumnya/Selesai/Berikutnya ada di ujung konten; teks panjang membuat tombol jauh. | Pembaca HP harus menggulir sampai bawah hanya untuk pindah bab. | Jadikan `position: sticky; bottom: 0` atau bar mengambang. Tambah geser kiri/kanan. |
| D-11 | **Tinggi** | `baca.js:16-17` | `?book=` tidak valid diam-diam jatuh ke Atomic Habits. | Pengguna membaca buku yang salah tanpa sadar; tautan rusak tak terdeteksi. | Tampilkan halaman "Buku tidak ditemukan" + tautan ke katalog. |
| D-12 | **Tinggi** | `baca.js:119-126`, `baca.html:27,48-51,63-67` | Pembaca tamu: semua tautan sisi (dashboard/riwayat/bookmark) dialihkan ke login; tombol panah kembali di topbar selalu ke dashboard. | Pengguna "terkunci" di halaman baca. | Tombol kembali pakai `history.back()` atau ke katalog. Sembunyikan tautan khusus anggota untuk tamu. |
| D-13 | **Tinggi** | `config.php` (tanpa `date_default_timezone_set`), `progress.php:64,81`, `stats.php:135,153` | PHP mencatat waktu dengan zona server (kemungkinan UTC), MySQL `NOW()` dipakai untuk dedupe; browser menampilkan lokal WIB. *Analisis kode; belum diuji.* | Jam di Riwayat bisa bergeser 7 jam; streak/"hari ini" meleset sekitar tengah malam. | Set `date_default_timezone_set('Asia/Jakarta')` dan `SET time_zone` MySQL. Kirim waktu ISO-8601 dengan zona. |
| D-14 | **Tinggi** | `index.html:12`, `landing.css` (FA all.min.css) | Font Awesome penuh dari CDN, memblokir render; ikon-saja pada navigasi bawah di HP. | Di jaringan lambat, navigasi tampak kosong sampai CDN selesai. | Pakai SVG inline atau subset lokal (±40 ikon). Beri label teks pada navigasi bawah. |
| D-15 | **Sedang** | `app.js:722`, `app.js:371,405,494` | Pesan setelah redirect login selalu "…mengakses Dashboard", walau asalnya dari Katalog. Setelah login selalu ke dashboard. | Pesan salah; pengguna kehilangan konteks. | Sertakan parameter `next` dan kembalikan ke halaman asal. Sesuaikan pesan. |
| D-16 | **Sedang** | `dashboard.html:172,203`, `dashboard.js:289`, `store.js:366-387` | Tombol "Isi data contoh" (alat developer) tampil untuk pengguna; menulis data palsu ke penyimpanan lokal akun. | Statistik palsu; membingungkan. | Hapus dari produksi atau tampilkan hanya jika `?debug=1`. |
| D-17 | **Sedang** | `dashboard.html:151`, `store.js:272-276` | Leaderboard: nama warga palsu dan catatan "(mockup)" terlihat pengguna. | Terasa menipu/belum jadi. | Ambil dari DB sungguhan atau sembunyikan sampai ada data. |
| D-18 | **Sedang** | `store.js:195` | "Waktu membaca" = jumlah bab × 15 menit, bukan waktu nyata. Streak ikut menghitung sekadar membuka (`store.js:253`). | Statistik tidak mencerminkan kebiasaan nyata. | Catat durasi aktif per sesi (heartbeat) dan hitung streak dari "bab selesai". |
| D-19 | **Sedang** | `dashboard.html:89,80,118,82,91` | Salah ketik "Buku **Selsai**"; label ganda "Progres Belajar" di dua kartu; "Buku Terbaca" dipakai untuk dua angka berbeda. | Salah baca angka; terkesan belum dirapikan. | Perbaiki: "Buku Selesai", "Sedang Dibaca", "Buku Dibuka". |
| D-20 | **Sedang** | `dashboard.html:39,55`, `baca.html:49,64` | "Progres Baca" mengarah ke `baca.html` generik (Atomic Habits), bukan buku terakhir. Subnav di katalog bertuliskan "Dashboard". | Pengguna kembali ke buku yang salah. | Arahkan ke `baca.html?book=<slug terakhir>`; tampilkan "Lanjutkan membaca" di Dashboard utama. |
| D-21 | **Sedang** | `app.js:41-44,126,131`, `index.html:177-183`, `catalog.js:17-26`, `store.js:25-27` | Empat daftar kategori berbeda (kartu beranda, daftar samping, chip, katalog) + kategori buku di store ("Fiksi") berbeda dari katalog ("Novel"). Item daftar `href="#"` dan chip tanpa aksi. | Tautan mati; taksonomi membingungkan. | Satu sumber kategori (`catalog.js`/DB); semua daftar ditautkan ke `katalog.html?kategori=`. |
| D-22 | **Sedang** | `catalog.js:32,35`, `app.js:17` | Atomic Habits bertag "Novel"; Hujan masuk "Pengembangan Diri" dan "Novel". | Salah kategori. | Koreksi tag dan `cats`. |
| D-23 | **Sedang** | `app.js:27-37` | Statistik kategori seragam dan palsu ("9 Modul, 204 Pembelajar" untuk keempatnya); `readers` statis (44/95/99). | Angka tidak dipercaya. | Hitung dari data, atau hapus. |
| D-24 | **Sedang** | `index.html:156-161` | Subjudul "E-BOOK BARU" + "Lihat Semua" tanpa isi di bawahnya. | Tampak setengah jadi. | Isi daftar buku baru atau hapus subjudul. |
| D-25 | **Sedang** | `index.html:263`, `app.js:316` | Janji "Akses **ribuan** ringkasan buku", padahal 3 buku. Juga `index.html:298` "Tersimpan permanen di database MySQL" (istilah teknis). | Klaim berlebihan dan jargon. | Pakai klaim yang benar dan bahasa awam. |
| D-26 | **Sedang** | `app.js:632`, `index.html:281-283` | Tombol Facebook tampil tetapi hanya menampilkan toast "belum aktif". | Tombol mati. | Sembunyikan sampai aktif. |
| D-27 | **Sedang** | `landing.css:200-205`, `app.js:66-73` | Marquee genre bergerak terus (sentuh tidak menjeda), isi digandakan di DOM (10 tombol, 5 duplikat bisa difokuskan). | Susah diketuk; pembaca layar membaca dua kali. | Jadikan baris statis yang bisa digeser, atau jeda saat disentuh/fokus; duplikat `aria-hidden` dan `tabindex=-1`. |
| D-28 | **Sedang** | `main.css:167-169` | `prefers-reduced-motion` hanya mengubah durasi menjadi `.01ms` tanpa membatasi iterasi. Marquee berulang tanpa henti. | Bisa berkedip cepat bagi pengguna sensitif gerak. | Tambah `animation: none` pada `.marquee-track` untuk reduced-motion. |
| D-29 | **Sedang** | `landing.css:369-375`, `index.html:250` | Modal login yang tertutup hanya `opacity:0; pointer-events:none`; kolom isian tetap bisa di-Tab. Tidak ada focus trap. | Pengguna keyboard menabrak form tak terlihat. | Pakai `hidden`/`inert` saat tertutup, dan jebak fokus saat terbuka. |
| D-30 | **Sedang** | `landing.css:256`, `katalog.css:89`, `panel.css:348,355`, `landing.css:438` | Target sentuh kecil: bookmark 32 px (landing) dan 28 px (katalog), tombol simpan/tema 32 px, ikon mata 32 px. Rekomendasi ≥44 px. | Salah ketuk, terutama jari besar atau pengguna lanjut usia. | Perbesar area ketuk dengan padding/pseudo-element. |
| D-31 | **Sedang** | `panel.css:293,296,329`, `katalog.css:100`, `main.css` (26 aturan font 9-10px) | Banyak teks 9-12px; `--faint` (#8B8174 di #F8F3EA, ±3,5:1) dan versi gelap (#737885 di #181922, ±3,6:1) di bawah 4,5:1 *(perkiraan)*. | Sulit dibaca, terutama pengguna lebih tua. | Minimal 12-13px untuk teks bermakna; gelapkan `--faint`/`--muted`. |
| D-32 | **Sedang** | `baca.js:96,100`, `dashboard.js:282-287` | "Tandai selesai" tanpa umpan balik, apalagi di bab terakhir (tidak ada selebrasi/langkah berikut). Memakai `alert()` bawaan browser. Hapus bookmark tanpa konfirmasi/undo. `toast` tidak ada di `baca.html`/`dashboard.html`. | Tidak yakin aksi berhasil; terasa kasar. | Pakai toast di semua halaman, layar "Selesai 🎉 + rekomendasi buku berikut", dan opsi "Urungkan". |
| D-33 | **Sedang** | `store.js:116-127` vs `:326`, `baca.js:136-146` | Bookmark offline disimpan lokal lalu **tertimpa** data server saat sinkron. Sinkron progres bisa menimpa perubahan yang belum terkirim (balapan). | Data hilang diam-diam. | Antrean perubahan offline lalu kirim ulang. Gabungkan berdasar waktu. |
| D-34 | **Sedang** | `store.js:343-349`, `dashboard.js:37-52` | Waktu server berformat `YYYY-MM-DD HH:MM:SS` (spasi) diurai `new Date()`. Safari/iOS lama dapat menghasilkan "Invalid Date". *Perlu uji di iPhone.* | Jam/“x jam lalu” tampil `NaN` di sebagian iPhone. | Kirim ISO-8601 (`T` dan `Z`) dari PHP. |
| D-35 | **Sedang** | Semua `<img>` (`app.js:83,109`, `katalog.js:35`, `dashboard.js:146`) | Tidak ada `width`/`height` dan tidak ada `onerror`; gambar PNG besar (`v259_153.png` 338 KB, `atomic_habits.jpg` 167 KB). Beberapa `v259_*` berukuran <1,5 KB (kemungkinan ikon, bukan sampul). | Layout melompat; gambar rusak tanpa cadangan; boros data. | Konversi ke WebP ±60-80 KB, beri dimensi, tambahkan sampul cadangan. |
| D-36 | **Rendah** | `index.html:20`, `app.js:545-572,740` | Skrip Google Sign-In dimuat dan diinisialisasi setelah 1 detik walau `CLIENT_ID = ''`. Form "Google" meminta nama + email manual, bukan Google asli. | Permintaan jaringan sia-sia; label "Masuk dengan Google" menyesatkan. | Muat skrip hanya jika `CLIENT_ID` terisi; ganti label atau sembunyikan. |
| D-37 | **Rendah** | semua `<head>` | Tidak ada `favicon`, `manifest`, tag Open Graph; `Inter` dimuat tetapi hampir tak dipakai (`index.html:11`, `katalog.html:11`). | Tab tanpa ikon; tautan dibagikan tanpa pratinjau; font ekstra. | Tambah favicon + OG; hapus Inter bila tak perlu. |
| D-38 | **Rendah** | `index.html:69`, `theme-init.js:3` | Tema selalu mulai gelap, tidak mengikuti `prefers-color-scheme`; nama mode "Putih Warm" (bahasa internal). | Pengguna terang dihadapkan latar gelap pertama. | Ikuti preferensi sistem saat pertama; ganti nama jadi "Mode Terang". |
| D-39 | **Rendah** | `app.js:88`, `katalog.js:40` | `aria-label` bookmark generik ("Bookmark"/"Simpan ke bookmark") tanpa nama buku; sampul di `baca.html:115` beralt judul padahal judul ada di sebelahnya. | Pembaca layar tidak tahu buku mana. | `aria-label="Simpan Hujan ke daftar bacaan"`; alt kosong untuk sampul dekoratif. |
| D-40 | **Rendah** | `app.js:94`, `katalog.js:46` | Angka pembaca (mis. "44") dengan ikon orang tanpa keterangan. | Tidak jelas artinya. | Tulis "44 pembaca" atau tooltip. |
| D-41 | **Rendah** | `dashboard.js:319-320,336-337` | `refresh()` dipanggil dua kali saat muat (init + `pageshow`), tiap kali memanggil `stats.php`. Hal serupa di `katalog.js:206-223` (3× render). | Beban dan kedipan tidak perlu. | Debounce/hapus pemanggilan ganda. |
| D-42 | **Rendah** | `database_update.sql:10-18`, `backend/README.txt` | `database_update.sql` menambah kolom yang sudah ada di `database.sql` (error jika dijalankan). README menyebut folder `desa-baca-n` dan XAMPP. | Pemasangan membingungkan bagi tim. | Satu skema final + README sesuai folder aktual. |
| D-43 | **Rendah** | tidak ada | Tidak ada halaman 404 sendiri; tidak ada "lupa kata sandi" (hanya catatan fitur, bukan penilaian keamanan). | Jalan buntu saat salah URL. | Tambah `404.html` dan arahkan di server. |

---

## E. FITUR YANG SEBAIKNYA DITAMBAHKAN

Pembandingan dengan Gramedia Digital, Wattpad, iPusnas, dan Google Play Books (berdasarkan pengetahuan umum tentang aplikasi tersebut, bukan hasil uji ulang hari ini).

### Wajib

| # | Fitur | Alasan | Kesulitan |
|---|---|---|---|
| E-1 | **Isi bacaan nyata per bab** (tabel `chapters`, halaman baca dinamis) | Tanpa ini produk tidak berfungsi (D-01). | Sedang |
| E-2 | **Pencarian sungguhan** (judul/penulis/kategori) + pesan hasil kosong | Dasar semua perpustakaan digital (D-02). | Mudah-Sedang |
| E-3 | **Halaman detail buku** (sinopsis, penulis, jumlah bab, estimasi waktu, tombol "Baca"/"Lanjutkan"/"Simpan") | Info cukup sebelum memutuskan membaca; CTA jelas. | Sedang |
| E-4 | **Pengaturan baca**: ukuran font, jarak baris, latar terang/sepia/gelap | Kenyamanan baca; ada di semua aplikasi pembanding. | Mudah-Sedang |
| E-5 | **Lanjutkan membaca** di beranda dan dashboard + simpan posisi gulir | Alur "berhenti lalu kembali". | Mudah-Sedang |
| E-6 | **Katalog terbuka untuk umum** + pengurutan (terbaru/populer/A-Z) + filter | Pengunjung bisa menjelajah sebelum daftar. | Sedang |
| E-7 | **Penanganan error**: 404 buku/halaman, gambar gagal, offline | Kondisi tidak ideal (bagian C). | Mudah |

### Sangat disarankan

| # | Fitur | Alasan | Kesulitan |
|---|---|---|---|
| E-8 | Navigasi bab menempel + geser kiri/kanan di HP | Kenyamanan one-hand (D-10). | Mudah |
| E-9 | Sorotan teks, catatan, salin kutipan | Kebutuhan mahasiswa (persona 1). | Sedang-Sulit |
| E-10 | Mode offline (PWA: service worker + manifest, bab disimpan di perangkat) | Koneksi lambat/putus; mirip iPusnas. | Sedang-Sulit |
| E-11 | Filter usia / label "ramah anak" + profil anak | Persona orang tua. | Sedang |
| E-12 | Rekomendasi "buku serupa" dan "berikutnya" di akhir buku | Retensi; Wattpad/Gramedia melakukan ini. | Sedang |
| E-13 | Target baca harian + pengingat (streak yang bermakna) | Mendukung kebiasaan 15 menit. | Sedang |
| E-14 | Penilaian dan ulasan singkat | Sinyal kualitas bagi pengguna baru. | Sedang |
| E-15 | Navigasi bawah berlabel + onboarding 3 langkah untuk pengguna baru | Persona gaptek. | Mudah |

### Nice to have

| # | Fitur | Alasan | Kesulitan |
|---|---|---|---|
| E-16 | Baca keras (text-to-speech bahasa Indonesia) | Aksesibilitas, baca sambil beraktivitas. | Sedang |
| E-17 | Font ramah disleksia | Aksesibilitas. | Mudah |
| E-18 | Daftar bacaan/koleksi buatan pengguna | Pengorganisasian. | Sedang |
| E-19 | Bagikan kutipan/buku ke WhatsApp | Pertumbuhan lewat mulut ke mulut. | Mudah |
| E-20 | Leaderboard desa dengan data nyata + lencana | Gamifikasi (sekarang palsu). | Sedang |
| E-21 | Timer baca 15 menit dengan notifikasi lembut | Selaras dengan merek "15 menit". | Mudah-Sedang |
| E-22 | Redup layar/`prefers-reduced-data` | Hemat baterai dan data. | Mudah |

---

## F. QUICK WINS (masing-masing < 1 jam)

| # | Perbaikan | File | Dampak |
|---|---|---|---|
| 1 | Ganti copy hero & intro: hapus "Belajar Coding" dan "Full-Stack Developer Expert". | `index.html:114,144` | Pengunjung paham tujuan situs. |
| 2 | Perbaiki typo "Buku Selsai" dan label ganda. | `dashboard.html:80,89,118` | Terlihat rapi dan dapat dipercaya. |
| 3 | "Lihat Semua"/"Mulai Membaca" → `katalog.html` (bukan modal login). | `index.html:149,158,177,183`, `app.js:119` | Hilangkan jalan buntu terbesar di beranda. |
| 4 | Tambah tautan "Katalog" di navbar beranda dan menu HP. | `index.html:42-66,97-100` | Katalog bisa ditemukan. |
| 5 | Sembunyikan tombol "Isi data contoh" dan tombol Facebook. | `dashboard.html:172,203`, `index.html:281` | Hilangkan sisa pengembangan. |
| 6 | Hapus subjudul "E-BOOK BARU" kosong dan menu "DEVELOPER". | `index.html:156-161,59-65` | Terasa selesai. |
| 7 | Tampilkan "Buku tidak ditemukan" saat `?book=` salah. | `baca.js:16-17` | Tidak ada baca buku salah. |
| 8 | Tombol navigasi bab `position: sticky; bottom: 0`. | `panel.css:317` | Baca di HP jauh lebih nyaman. |
| 9 | Perbesar font prose ke 16-17px di HP dan gelapkan `--faint`. | `panel.css:307-309`, `main.css:25,70` | Keterbacaan naik. |
| 10 | Beri teks "Baca sekarang" pada kartu buku + `aria-label` bookmark memuat judul. | `app.js:81-97` | CTA jelas, bisa diakses keyboard. |

Tambahan cepat: hapus skrip Google (`index.html:20`) dan font Inter yang tak dipakai, serta tambahkan favicon.

---

## G. RENCANA PRIORITAS (urutan pengerjaan)

| Tahap | Isi | Item |
|---|---|---|
| **1. Minggu 1 — Buat produk bisa dipakai** | Isi bacaan nyata; bug progres tamu; pencarian nyata; penanganan buku tidak ditemukan. | D-01, D-04, D-02, D-11, E-1, E-2 |
| **2. Minggu 2 — Hilangkan jalan buntu** | Perbaiki alur beranda → katalog → baca; hapus sisa copy/dev; satukan kategori. | D-05, D-06, D-07, D-08, D-12, D-16, D-17, D-21, D-24, D-26, quick wins 1-7 |
| **3. Minggu 3 — Kenyamanan membaca** | Pengaturan font/tema; navigasi bab menempel; lanjutkan membaca; simpan posisi gulir. | D-09, D-10, D-20, E-4, E-5, E-8 |
| **4. Minggu 4 — Kecepatan & aksesibilitas** | Ikon SVG/lokal; kompres gambar; target sentuh; kontras; modal/keyboard; reduced-motion. | D-14, D-35, D-36, D-27-D-31, D-39 |
| **5. Setelah itu — Data & keandalan** | Zona waktu; sinkron offline; format tanggal; statistik nyata. | D-13, D-18, D-33, D-34, E-10 |
| **6. Pengembangan lanjut** | Detail buku, catatan/sorotan, ramah anak, rekomendasi, TTS. | E-3, E-9, E-11, E-12, E-16 |

---

### Batas laporan (jujur)
- Tidak ada uji di browser/perangkat nyata; angka kecepatan dan kontras hanya perkiraan dari kode.
- D-13 (zona waktu) dan D-34 (Safari) adalah **risiko dari kode**, belum direproduksi.
- Alur akun nyata (login → bookmark → progres tersinkron ke MySQL) tidak dijalankan agar database asli tidak terisi data uji.
