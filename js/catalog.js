/* =============================================================================
 * DESA BACA — catalog.js : klien API katalog (backend/categories.php, backend/books.php)
 *
 * Data kategori & buku berasal dari server (tabel MySQL setelah import.sql dijalankan,
 * atau berkas JSON data-import selagi masih mode sampel). Tidak ada lagi buku contoh.
 * ========================================================================== */
(function (global) {
  'use strict';

  const ICONS = {
    'biography-memoir': 'fa-user-pen', 'business-leadership': 'fa-briefcase',
    'communication-skills': 'fa-comments', 'editorial-picks': 'fa-award',
    'future-innovation': 'fa-rocket', 'health-wellbeing': 'fa-heart-pulse',
    'high-performance': 'fa-bolt', 'meaningful-stories': 'fa-feather',
    'mind-behavior': 'fa-brain', 'mindfulness-wisdom': 'fa-spa',
    'personal-growth': 'fa-seedling', 'relationships-parenting': 'fa-people-roof',
    'wealth-finance': 'fa-sack-dollar', 'world-culture': 'fa-earth-asia',
    'dongeng-cerita-rakyat': 'fa-book-open-reader',
  };

  const SOON_TEXT = {
    'dongeng-cerita-rakyat': 'Kumpulan dongeng dan cerita rakyat nusantara sedang kami siapkan. Cocok untuk dibacakan sebelum tidur atau dibaca bersama keluarga.',
  };
  const SOON_DEFAULT = 'Buku untuk kategori ini sedang kami siapkan. Sementara itu, jelajahi kategori lain yang sudah tersedia.';

  const icon = (slug) => ICONS[slug] || 'fa-book';
  const soonText = (slug) => SOON_TEXT[slug] || SOON_DEFAULT;

  /** @returns {Promise<{success:boolean, categories?:Array}>} preview = jumlah buku contoh per kategori (maks 4) */
  const categories = (preview) => global.DesaBaca.api('backend/categories.php' + (preview ? '?preview=' + preview : ''));

  /** params: { kategori, q, sort, page, per_page } */
  const books = (params) => global.DesaBaca.api('backend/books.php?' + new URLSearchParams(params).toString());

  global.DesaBacaCatalog = { icon, soonText, categories, books };
})(window);
