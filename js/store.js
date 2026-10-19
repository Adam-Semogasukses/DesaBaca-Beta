/* =============================================================================
 * DESA BACA — DATA LAYER (HYBRID: API Backend PHP/MySQL + Client Cache)
 * file: js/store.js
 * ============================================================================= */
(function (global) {
  'use strict';

  const KEYS = {
    bookmarks: 'desabaca_bookmarks_v1',
    progress: 'desabaca_progress_v1',
    history: 'desabaca_history_v1',
    user: 'desabaca_user',
    userProfile: 'desabaca_user_profile'
  };

  const VILLAGE_NAME = 'bacaMaju';
  const HISTORY_LIMIT = 500;
  const DEDUPE_OPEN_MS = 30 * 60 * 1000;

  /* ---------------------------------------------------------------------------
   * BOOK CATALOG
   * ------------------------------------------------------------------------- */
  // Demo baca: hanya 3 buku (isi bacaan = placeholder). Buku lain di katalog membuka halaman F15 Library.
  const BOOKS = [
    { slug: 'atomic-habits', title: 'Atomic Habits', author: 'James Clear', category: 'Pengembangan Diri', cover: 'https://covers.openlibrary.org/b/id/12539702-M.jpg', cover_fallback: 'https://f15-api.imajikreasi.com/assets/covers/83cf990e0373464d.avif', chapters: 6 },
    { slug: '100m-leads', title: '$100M Leads', author: 'Alex Hormozi', category: 'Kepemimpinan', cover: 'https://covers.openlibrary.org/b/id/14796132-M.jpg', cover_fallback: 'https://f15-api.imajikreasi.com/assets/covers/43e097d5cf2a5fba.avif', chapters: 6 },
    { slug: 'alcohol-explained', title: 'Alcohol Explained', author: 'William Porter', category: 'Kesehatan & Kesejahteraan', cover: 'https://covers.openlibrary.org/b/id/10832409-M.jpg', cover_fallback: 'https://f15-api.imajikreasi.com/assets/covers/ee450c506582ab74.avif', chapters: 6 },
  ];
  const getBooks = () => BOOKS.slice();
  // slug lama -> slug F15 (tautan/bookmark lama tetap terbuka)
  const LEGACY_SLUGS = { atomic_habits: 'atomic-habits' };
  const getBook = (slug) => BOOKS.find((b) => b.slug === (LEGACY_SLUGS[slug] || slug)) || null;

  /* ---------------------------------------------------------------------------
   * Storage helpers (localStorage fallback)
   * ------------------------------------------------------------------------- */
  const memoryFallback = {};
  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return key in memoryFallback ? memoryFallback[key] : fallback;
    }
  }
  function write(key, value) {
    memoryFallback[key] = value;
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* ignore */ }
  }

  /* ---------------------------------------------------------------------------
   * Date helpers
   * ------------------------------------------------------------------------- */
  const pad = (n) => String(n).padStart(2, '0');
  const dayKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  function weekStart(date) {
    const d = new Date(date || Date.now());
    d.setHours(0, 0, 0, 0);
    const diff = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - diff);
    return d;
  }

  // Gabung progres lokal & server: jangan sampai data server yang lebih lama/kosong
  // menimpa bab yang sudah ditandai selesai di browser.
  function mergeProgress(local, server) {
    const out = { ...server };
    Object.keys(local || {}).forEach((slug) => {
      const l = local[slug], s = server[slug];
      if (!s) { out[slug] = l; return; }
      const ld = (l.done || []).length, sd = (s.done || []).length;
      const base = (l.status === 'completed' && s.status !== 'completed') || ld > sd ? l : s;
      out[slug] = { ...base, seconds: Math.max(l.seconds || 0, s.seconds || 0) };
      out[slug].minutes = Math.floor(out[slug].seconds / 60);
    });
    return out;
  }

  /* ---------------------------------------------------------------------------
   * USER & AUTH HELPERS
   * ------------------------------------------------------------------------- */
  function getCurrentUser() {
    try {
      const raw = localStorage.getItem(KEYS.userProfile);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    const name = localStorage.getItem(KEYS.user);
    return name ? { username: name, display_name: name } : null;
  }

  function setCurrentUser(user) {
    if (!user) {
      localStorage.removeItem(KEYS.user);
      localStorage.removeItem(KEYS.userProfile);
    } else {
      localStorage.setItem(KEYS.user, user.display_name || user.username || '');
      localStorage.setItem(KEYS.userProfile, JSON.stringify(user));
    }
  }

  function clearUserData() {
    write(KEYS.bookmarks, []);
    write(KEYS.progress, {});
    write(KEYS.history, []);
    setCurrentUser(null);
  }

  const isLoggedIn = () => !!getCurrentUser();

  /* ===========================================================================
   * BOOKMARKS
   * ========================================================================= */
  function getBookmarks() {
    return read(KEYS.bookmarks, []).slice().sort((a, b) => (b.saved_at || '').localeCompare(a.saved_at || ''));
  }
  const isBookmarked = (slug) => read(KEYS.bookmarks, []).some((x) => x.slug === slug);

  async function toggleBookmark(slug) {
    if (!getBook(slug)) return false;
    const user = getCurrentUser();

    // Jika user login, sinkronkan langsung ke backend MySQL
    if (user && window.DesaBaca && window.DesaBaca.api) {
      try {
        const res = await window.DesaBaca.api('backend/bookmarks.php', {
          method: 'POST',
          body: JSON.stringify({ slug })
        });
        if (res && res.success && Array.isArray(res.bookmarks)) {
          write(KEYS.bookmarks, res.bookmarks);
          return res.bookmarked;
        }
      } catch (err) {
        console.warn('Gagal sinkron bookmark ke server:', err);
      }
    }

    // Fallback lokal (jika belum login atau offline)
    const list = read(KEYS.bookmarks, []);
    const exists = list.some((x) => x.slug === slug);
    const updated = exists ? list.filter((x) => x.slug !== slug)
                           : [...list, { slug, saved_at: new Date().toISOString() }];
    write(KEYS.bookmarks, updated);
    return !exists;
  }

  /* ===========================================================================
   * PROGRESS & HISTORY
   * ========================================================================= */
  function emptyProgress(book) {
    return { chapter: 1, done: [], progress: 0, status: 'reading', minutes: 0, seconds: 0,
             first_read_at: null, last_read_at: null, chapters: book.chapters };
  }

  function getProgress(slug) {
    const book = getBook(slug);
    if (!book) return null;
    const p = { ...emptyProgress(book), ...(read(KEYS.progress, {})[slug] || {}), chapters: book.chapters };
    // Bar progres ikut maju sesuai posisi bab yang sedang dibaca (bab sebelumnya sudah dilewati),
    // tidak hanya menunggu tombol "tandai selesai".
    if (p.status !== 'completed') {
      const byPosition = Math.round(((Math.max(1, p.chapter) - 1) / book.chapters) * 100);
      p.progress = Math.min(99, Math.max(p.progress || 0, byPosition));
    }
    return p;
  }

  function getAllProgress() {
    const all = read(KEYS.progress, {});
    return Object.keys(all)
      .filter(getBook)
      .map((slug) => ({ slug, book: getBook(slug), ...getProgress(slug) }))
      .sort((a, b) => (b.last_read_at || '').localeCompare(a.last_read_at || ''));
  }

  function saveProgress(slug, p) {
    const all = read(KEYS.progress, {});
    all[slug] = p;
    write(KEYS.progress, all);
  }

  function pushHistory(slug, type, chapter, atIso) {
    const list = read(KEYS.history, []);
    list.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
                slug, type, chapter, at: atIso || new Date().toISOString() });
    write(KEYS.history, list.slice(-HISTORY_LIMIT));
  }

  function recordOpen(slug, chapter) {
    const book = getBook(slug);
    if (!book) return;
    const now = new Date();
    const p = getProgress(slug);
    p.chapter = Math.max(1, Math.min(book.chapters, chapter || p.chapter));
    p.first_read_at = p.first_read_at || now.toISOString();
    p.last_read_at = now.toISOString();
    saveProgress(slug, p);

    const last = read(KEYS.history, []).filter((h) => h.slug === slug && h.type === 'open').pop();
    const dupe = last && last.chapter === p.chapter && now - new Date(last.at) < DEDUPE_OPEN_MS;
    if (!dupe) pushHistory(slug, 'open', p.chapter);

    // Sync ke DB
    if (window.DesaBaca && window.DesaBaca.api) {
      window.DesaBaca.api('backend/progress.php', {
        method: 'POST',
        body: JSON.stringify({ slug, chapter: p.chapter, action: 'open' })
      }).catch(() => {});
    }
  }

  // Tambah waktu baca (detik) ke cache lokal. Sinkron ke server dilakukan oleh pemanggil.
  function addReadingTime(slug, secs) {
    const book = getBook(slug);
    if (!book || !(secs > 0)) return;
    const p = getProgress(slug);
    p.seconds = (p.seconds || 0) + secs;
    p.minutes = Math.floor(p.seconds / 60);
    p.first_read_at = p.first_read_at || new Date().toISOString();
    saveProgress(slug, p);
  }

  function sendReadingTime(slug, secs, useBeacon) {
    if (!getCurrentUser() || !(secs > 0)) return;
    const url = 'backend/progress.php';
    const body = JSON.stringify({ slug, action: 'time', seconds: secs });
    if (useBeacon && navigator.sendBeacon) {
      navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }));
    } else if (window.DesaBaca && window.DesaBaca.api) {
      window.DesaBaca.api(url, { method: 'POST', body }).catch(() => {});
    }
  }

  function completeChapter(slug, chapter) {
    const book = getBook(slug);
    if (!book) return { finished: false, progress: 0, synced: Promise.resolve() };
    const p = getProgress(slug);
    const now = new Date().toISOString();
    if (!p.done.includes(chapter)) p.done = [...p.done, chapter].sort((a, b) => a - b);
    // Menandai bab terakhir = buku selesai dibaca (semua bab dianggap tuntas)
    if (chapter >= book.chapters) p.done = Array.from({ length: book.chapters }, (_, i) => i + 1);
    p.progress = Math.round((p.done.length / book.chapters) * 100);
    p.first_read_at = p.first_read_at || now;
    p.last_read_at = now;
    const finished = p.done.length >= book.chapters;
    p.status = finished ? 'completed' : 'reading';
    p.chapter = finished ? chapter : Math.min(book.chapters, chapter + 1);
    saveProgress(slug, p);

    pushHistory(slug, 'chapter_done', chapter);
    if (finished) pushHistory(slug, 'finish', chapter);

    // Sync ke DB (promise dikembalikan agar pemanggil bisa menunggu sebelum pindah halaman)
    let synced = Promise.resolve();
    if (window.DesaBaca && window.DesaBaca.api) {
      synced = window.DesaBaca.api('backend/progress.php', {
        method: 'POST',
        body: JSON.stringify({ slug, chapter, action: 'chapter_done', total: book.chapters })
      }).catch(() => {});
    }

    return { finished, progress: p.progress, synced };
  }

  function getHistory(limit) {
    const items = read(KEYS.history, [])
      .filter((h) => getBook(h.slug))
      .map((h) => ({ ...h, book: getBook(h.slug) }))
      .reverse();
    return limit ? items.slice(0, limit) : items;
  }

  function clearHistory() {
    write(KEYS.history, []);
    write(KEYS.progress, {});
    if (window.DesaBaca && window.DesaBaca.api) {
      window.DesaBaca.api('backend/history.php', { method: 'DELETE' }).catch(() => {});
    }
  }

  /* ===========================================================================
   * STATS
   * ========================================================================= */
  function getStats() {
    const all = getAllProgress();
    const completed = all.filter((p) => p.status === 'completed' || p.progress >= 100).length;
    const seconds = all.reduce((s, p) => s + (p.seconds || 0), 0);
    const minutes = Math.floor(seconds / 60);
    return {
      opened: all.length,
      completed,
      in_progress: Math.max(0, all.length - completed),
      minutes,
      seconds,
      hours: Math.round((seconds / 3600) * 10) / 10,
      streak: computeStreak(),
      bookmarks: read(KEYS.bookmarks, []).length,
      completion_pct: all.length ? Math.round((completed / all.length) * 100) : 0,
      week_books: weekBooks(),
    };
  }

  function computeStreak() {
    const days = new Set(read(KEYS.history, []).map((h) => dayKey(new Date(h.at))));
    const d = new Date();
    if (!days.has(dayKey(d))) d.setDate(d.getDate() - 1);
    let n = 0;
    while (days.has(dayKey(d))) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }

  function weekBooks() {
    const start = weekStart();
    return new Set(read(KEYS.history, [])
      .filter((h) => new Date(h.at) >= start && getBook(h.slug))
      .map((h) => h.slug)).size;
  }

  /* ===========================================================================
   * LEADERBOARD
   * ========================================================================= */
  // Data dari backend/leaderboard.php (semua pengguna terdaftar). Jika offline / belum
  // ada server, hanya user yang sedang login yang ditampilkan.
  async function getLeaderboard() {
    const start = weekStart();
    const user = getCurrentUser();
    let entries = [];

    try {
      if (window.DesaBaca && window.DesaBaca.api) {
        const res = await window.DesaBaca.api('backend/leaderboard.php');
        if (res && res.success && Array.isArray(res.entries)) entries = res.entries;
      }
    } catch (e) { /* fallback di bawah */ }

    if (!entries.length && user) {
      entries = [{ name: user.display_name || user.username, books: weekBooks(), isMe: true }];
    }

    entries.sort((a, b) => b.books - a.books || a.name.localeCompare(b.name));
    entries.forEach((e, i) => { e.rank = i > 0 && e.books === entries[i - 1].books ? entries[i - 1].rank : i + 1; });
    return { village: VILLAGE_NAME, week_start: start.toISOString(), entries };
  }

  /* ===========================================================================
   * SINKRONISASI ONLINE KE DATABASE
   * ========================================================================= */
  async function syncFromDatabase() {
    if (!window.DesaBaca || !window.DesaBaca.api) return;
    try {
      // 1. Cek User Session
      const meRes = await window.DesaBaca.api('backend/auth.php?action=me');
      if (meRes.logged_in && meRes.user) {
        setCurrentUser(meRes.user);

        // 2. Sync Bookmarks
        try {
          const bmRes = await window.DesaBaca.api('backend/bookmarks.php');
          if (bmRes.success && Array.isArray(bmRes.bookmarks)) {
            write(KEYS.bookmarks, bmRes.bookmarks);
          }
        } catch (e) {}

        // 3. Sync Progress
        try {
          const prRes = await window.DesaBaca.api('backend/progress.php');
          if (prRes.success && prRes.progress) {
            const local = read(KEYS.progress, {});
            write(KEYS.progress, mergeProgress(local, prRes.progress));
            // Buku yang sudah selesai di browser tapi belum selesai di server: kirim ulang
            Object.keys(local).forEach((slug) => {
              const book = getBook(slug), s = prRes.progress[slug];
              if (book && local[slug].status === 'completed' && (!s || s.status !== 'completed')) {
                window.DesaBaca.api('backend/progress.php', {
                  method: 'POST',
                  body: JSON.stringify({ slug, chapter: book.chapters, action: 'chapter_done', total: book.chapters })
                }).catch(() => {});
              }
            });
          }
        } catch (e) {}

        // 4. Sync History
        try {
          const hRes = await window.DesaBaca.api('backend/history.php');
          if (hRes.success && Array.isArray(hRes.history)) {
            const hist = hRes.history.map(item => ({
              id: item.id,
              slug: item.slug,
              type: item.type,
              chapter: item.chapter,
              at: item.at
            })).reverse();
            write(KEYS.history, hist);
          }
        } catch (e) {}

        return true;
      } else {
        // Jika server menyatakan tidak login, bersihkan user di client
        clearUserData();
        return false;
      }
    } catch (err) {
      console.warn('Sync from database failed or offline', err);
    }
    return false;
  }

  function seedDemo() {
    const now = Date.now();
    const H = 3600 * 1000;
    const plan = [
      [70, 'atomic-habits', 'open', 1], [69, 'atomic-habits', 'chapter_done', 1],
      [46, 'atomic-habits', 'open', 2], [45, 'atomic-habits', 'chapter_done', 2],
      [26, '100m-leads', 'open', 1], [25, '100m-leads', 'chapter_done', 1],
      [3, 'alcohol-explained', 'open', 1],
    ];
    write(KEYS.history, plan.map(([h, slug, type, chapter], i) =>
      ({ id: 'demo' + i, slug, type, chapter, at: new Date(now - h * H).toISOString() })));
    const iso = (h) => new Date(now - h * H).toISOString();
    write(KEYS.progress, {
      'atomic-habits': { chapter: 3, done: [1, 2], progress: 33, status: 'reading', minutes: 30, seconds: 1800, first_read_at: iso(70), last_read_at: iso(45) },
      '100m-leads': { chapter: 2, done: [1], progress: 17, status: 'reading', minutes: 15, seconds: 900, first_read_at: iso(26), last_read_at: iso(25) },
      'alcohol-explained': { chapter: 1, done: [], progress: 0, status: 'reading', minutes: 0, first_read_at: iso(3), last_read_at: iso(3) },
    });
    write(KEYS.bookmarks, [
      { slug: 'alcohol-explained', saved_at: iso(5) },
      { slug: '100m-leads', saved_at: iso(30) },
    ]);
  }

  global.DesaBacaStore = {
    VILLAGE_NAME,
    getBooks, getBook,
    getBookmarks, isBookmarked, toggleBookmark,
    getProgress, getAllProgress, recordOpen, completeChapter, addReadingTime, sendReadingTime,
    getHistory, clearHistory,
    getStats, getLeaderboard,
    getCurrentUser, setCurrentUser, clearUserData, isLoggedIn,
    syncFromDatabase,
    seedDemo,
  };
})(window);
