/* =============================================================================
 * DESA BACA — content.js : isi bacaan 3 buku demo (slug harus sama dengan BOOKS di store.js)
 * Ini RINGKASAN ORISINAL yang ditulis ulang, BUKAN teks asli buku. Edit bebas:
 * tiap bab = { title, paras: [paragraf...], points: [poin kunci...] }.
 * Mau tambah buku? Tambah di BOOKS (store.js) lalu isi entri baru di sini (6 bab).
 * ========================================================================== */
(function (global) {
  'use strict';

  const C = {
    'atomic-habits': [
      { title: 'Kebiasaan Kecil, Hasil Besar',
        paras: ['Perbaikan 1% per hari terlihat sepele, tetapi menumpuk seperti bunga majemuk. Setahun kemudian, selisihnya jauh lebih besar daripada yang dibayangkan.',
                'Pada awalnya hasil nyaris tak terlihat. Banyak orang berhenti di fase ini, padahal kemajuan sedang tertimbun dan baru tampak setelah melewati titik tertentu.'],
        points: ['Kemajuan kecil yang konsisten mengalahkan lonjakan sesekali.', 'Fokus pada sistem harian, bukan hanya target akhir.'] },
      { title: 'Mulai dari Identitas',
        paras: ['Perubahan punya tiga lapisan: hasil, proses, dan identitas. Cara paling tahan lama adalah mengubah identitas: dari "ingin lari maraton" menjadi "aku seorang pelari".',
                'Setiap kali menjalankan kebiasaan, kamu memberi satu suara bagi jenis orang yang ingin kamu jadi.'],
        points: ['Tanyakan "orang seperti apa yang ingin kuwujudkan?" sebelum "apa targetku?".', 'Kumpulkan bukti kecil bahwa identitas baru itu nyata.'] },
      { title: 'Siklus Kebiasaan dan Empat Hukum',
        paras: ['Setiap kebiasaan berjalan lewat empat tahap: pemicu, keinginan, tindakan, dan hadiah. Dari sini lahir empat hukum perubahan perilaku: buat jelas, buat menarik, buat mudah, buat memuaskan.',
                'Untuk memutus kebiasaan buruk, balik arahnya: buat tak terlihat, tak menarik, sulit, dan tidak memuaskan.'],
        points: ['Tiap hukum menyasar satu tahap siklus.', 'Kebiasaan buruk dilawan dengan kebalikan hukum yang sama.'] },
      { title: 'Buat Jelas dan Menarik',
        paras: ['Niat implementasi menetapkan kapan dan di mana: "Aku akan melakukan X pada jam Y di tempat Z". Menumpuk kebiasaan berarti menempelkan kebiasaan baru pada kebiasaan yang sudah ada.',
                'Lingkungan sangat menentukan. Letakkan pemicu kebiasaan baik di tempat yang kelihatan, dan bergaullah dengan lingkungan yang menganggap perilaku itu wajar.'],
        points: ['Rancang lingkunganmu, jangan hanya mengandalkan tekad.', 'Gabungkan hal yang perlu dilakukan dengan hal yang disukai.'] },
      { title: 'Buat Mudah',
        paras: ['Semakin sedikit hambatan, semakin besar peluang kebiasaan terjadi. Fokuslah menjadi hadir dulu, sebelum menyempurnakan.',
                'Aturan dua menit: kecilkan kebiasaan baru sampai bisa dimulai dalam dua menit. "Baca satu halaman" lebih mudah dijalankan daripada "baca buku setiap hari".'],
        points: ['Kurangi langkah antara kamu dan kebiasaan baik.', 'Mulai kecil, naikkan bertahap setelah rutin.'] },
      { title: 'Buat Memuaskan dan Bertahan',
        paras: ['Otak lebih menghargai hadiah yang datang segera. Pelacak kebiasaan sederhana, seperti tanda centang harian, memberi rasa puas sekaligus bukti kemajuan.',
                'Kalau terlewat sehari, jangan lewatkan dua hari berturut-turut. Pilih tantangan yang tidak terlalu mudah dan tidak terlalu sulit supaya motivasi terjaga, lalu tinjau kebiasaanmu secara berkala.'],
        points: ['Jangan melewatkan dua kali berturut-turut.', 'Ukur, tinjau, dan sesuaikan kebiasaanmu secara berkala.'] },
    ],

    '100m-leads': [
      { title: 'Mengapa Lead Itu Penting',
        paras: ['Lead adalah orang yang menunjukkan minat pada apa yang kamu tawarkan. Tanpa arus lead yang stabil, bisnis sebagus apa pun akan tersendat.',
                'Sebelum mengejar lead, pastikan penawaranmu jelas dan menarik. Lead yang banyak untuk penawaran lemah hanya membuang tenaga.'],
        points: ['Penawaran yang kuat dulu, lead sesudahnya.', 'Kenali siapa pelanggan idealmu.'] },
      { title: 'Empat Cara Dasar Mendapat Lead',
        paras: ['Ada empat jalur utama: menghubungi orang yang sudah mengenalmu, membuat konten untuk audiens yang mengenalmu, menghubungi orang asing secara langsung, dan beriklan berbayar kepada orang asing.',
                'Keempatnya terbagi menurut dua hal: apakah orangnya sudah kenal kamu, dan apakah pesannya satu-ke-satu atau satu-ke-banyak.'],
        points: ['Mulai dari jalur yang paling dekat dengan modalmu: waktu atau uang.', 'Kuasai satu jalur sebelum menambah yang lain.'] },
      { title: 'Lead Magnet',
        paras: ['Lead magnet adalah hadiah gratis yang menyelesaikan satu bagian kecil dari masalah calon pelanggan, sehingga mereka ingin tahu langkah selanjutnya.',
                'Kuncinya spesifik dan bernilai nyata. Hadiah yang terlalu umum jarang membuat orang meninggalkan kontaknya.'],
        points: ['Selesaikan satu masalah kecil dengan tuntas.', 'Minta kontak sebagai imbalan nilai yang kamu beri.'] },
      { title: 'Naikkan Volume',
        paras: ['Cara menumbuhkan lead: lakukan lebih banyak, lakukan lebih baik, lalu coba saluran baru, dalam urutan itu.',
                'Konsistensi adalah modal utama. Buku ini mendorong ritme tindakan harian dalam jumlah besar, karena volume memberi data dan latihan yang cepat.'],
        points: ['Lebih banyak dulu, baru lebih baik.', 'Ritme harian mengalahkan semangat sesaat.'] },
      { title: 'Lead Getter',
        paras: ['Saat kamu tak bisa mengerjakan semuanya sendiri, tambahkan pihak lain yang ikut mencari lead: karyawan, agensi, afiliasi atau mitra, dan pelanggan yang merekomendasikan.',
                'Masing-masing cocok untuk tahap bisnis berbeda dan perlu insentif serta cara kerja yang jelas.'],
        points: ['Delegasikan setelah prosesnya terbukti jalan.', 'Beri insentif yang adil bagi pihak yang membantu.'] },
      { title: 'Ukur, Perbaiki, Skalakan',
        paras: ['Catat angka dasarnya: berapa orang dihubungi, berapa yang merespons, berapa yang menjadi pelanggan. Dari sini terlihat di mana hambatannya.',
                'Perbaiki titik paling lemah dulu. Setelah satu jalur menghasilkan stabil, barulah tambah jalur berikutnya.'],
        points: ['Yang tidak diukur sulit diperbaiki.', 'Skalakan setelah satu jalur terbukti berhasil.'] },
    ],

    'alcohol-explained': [
      { title: 'Mengapa Kita Minum',
        paras: ['Minum alkohol sering terasa seperti keputusan pribadi, padahal banyak dibentuk oleh kebiasaan sosial, iklan, dan anggapan bahwa alkohol adalah cara wajar untuk bersantai atau merayakan.',
                'Langkah pertama adalah menyadari alasan di balik kebiasaan itu, tanpa menghakimi diri sendiri.'],
        points: ['Kebiasaan minum dipengaruhi lingkungan dan budaya.', 'Mengenali alasan adalah awal perubahan.'] },
      { title: 'Alkohol dan Otak',
        paras: ['Alkohol adalah zat yang menekan kerja sistem saraf. Rasa rileks di awal bisa diikuti turunnya suasana hati dan rasa cemas ketika efeknya menghilang.',
                'Karena itu, perasaan "dibantu alkohol" sering hanyalah jeda singkat sebelum gelisah kembali.'],
        points: ['Rasa lega awal tidak sama dengan penyelesaian masalah.', 'Kecemasan setelah minum adalah hal yang umum dialami.'] },
      { title: 'Siklus Minum dan Gelisah',
        paras: ['Saat rasa tidak nyaman muncul setelah minum, sebagian orang minum lagi untuk meredakannya. Pola ini bisa memperkuat kebiasaan dan membuat takaran perlahan naik.',
                'Mengenali siklus ini membantu kita melihat bahwa masalahnya bukan kurang kemauan, melainkan pola yang saling mengunci.'],
        points: ['Gambarkan polamu: pemicu, minum, dampak, lalu pemicu lagi.', 'Pola bisa dipelajari, jadi bisa diubah.'] },
      { title: 'Dampak pada Tubuh dan Tidur',
        paras: ['Alkohol dapat membuat tidur terasa cepat datang tetapi kualitasnya menurun, sehingga bangun terasa kurang segar. Tubuh juga kehilangan cairan dan energi.',
                'Banyak orang yang berhenti atau mengurangi minum melaporkan tidur lebih nyenyak, mood lebih stabil, dan fokus lebih baik.'],
        points: ['Perhatikan kualitas tidur dan energi, bukan hanya jumlah jam.', 'Catat perubahan yang kamu rasakan selama beberapa minggu.'] },
      { title: 'Cerita yang Kita Ceritakan',
        paras: ['Kalimat seperti "aku butuh ini untuk rileks" atau "aku pantas mendapatkannya" sering terdengar masuk akal, tetapi layak diuji.',
                'Coba tanyakan: apa yang sebenarnya kubutuhkan saat itu? Istirahat, teman bicara, atau jeda? Sering ada cara lain untuk memenuhinya.'],
        points: ['Uji keyakinanmu dengan pertanyaan jujur.', 'Siapkan pengganti yang memenuhi kebutuhan yang sama.'] },
      { title: 'Mengubah Hubungan dengan Alkohol',
        paras: ['Perubahan bisa berupa mengurangi atau berhenti. Tetapkan alasan pribadi, siapkan pengganti kegiatan, dan beri tahu orang terdekat agar kamu tidak berjuang sendirian.',
                'Penting: jika kamu minum dalam jumlah besar atau rutin, jangan berhenti mendadak tanpa pengawasan, karena bisa berbahaya. Konsultasikan dengan dokter atau layanan kesehatan.'],
        points: ['Cari dukungan dari orang terdekat atau tenaga profesional.', 'Ringkasan ini bukan nasihat medis.'] },
    ],
  };

  const words = (s) => String(s).split(/\s+/).filter(Boolean).length;
  const get = (slug) => C[slug] || null;
  /** estimasi menit baca sebuah bab (±200 kata/menit, minimal 1) */
  const minutes = (slug, n) => {
    const ch = C[slug] && C[slug][n - 1];
    if (!ch) return null;
    return Math.max(1, Math.round((ch.paras.concat(ch.points).reduce((s, t) => s + words(t), 0)) / 200));
  };

  global.DesaBacaContent = { get, minutes };
})(window);
