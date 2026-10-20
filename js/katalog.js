/* =============================================================================
 * DESA BACA — katalog.js (katalog.html) — JavaScript native.
 *
 * Dua tampilan dari satu halaman:
 *   katalog.html                  -> tiap kategori menampilkan 3 buku + "Lihat Semua"
 *   katalog.html?kategori=<slug>  -> semua buku di satu kategori (dimuat bertahap)
 * Kategori kosong / berstatus "segera datang" menampilkan panel "Segera datang".
 * Data dari js/catalog.js (API). Bookmark tetap lewat window.DesaBacaStore, hanya untuk
 * buku yang dikenal Store (bisa dibaca di baca.html). Buku lain membuka halaman F15 Library.
 * ========================================================================== */
(function () {
  'use strict';

  const { $, esc, lsRemove, USER_KEY, isDark, toggleTheme, showToast, api } = window.DesaBaca;
  const Store = window.DesaBacaStore;
  const Catalog = window.DesaBacaCatalog;

  const PREVIEW_COUNT = 3;                 // jumlah buku per kategori di tampilan "semua"
  const PER_PAGE = 24;

  const state = { cats: null, failed: false, list: [], page: 1, hasMore: false, total: 0 };

  const categoryUrl = (slug) => 'katalog.html?kategori=' + encodeURIComponent(slug);
  const bookUrl = (slug) => 'baca.html?book=' + encodeURIComponent(slug);
  const activeSlug = () => new URLSearchParams(location.search).get('kategori');
  const isLocal = (b) => !!Store.getBook(b.slug);   // bisa dibuka di pembaca Desa Baca

  /* ---------------------------------------------------------------------------
   * Render
   * ------------------------------------------------------------------------- */
  function cardHTML(b) {
    const local = isLocal(b);
    const on = local && Store.isBookmarked(b.slug);
    const names = b.category_names || [];
    const tags = names.slice(0, 2).map((t) => `<span class="kt-tag">${esc(t)}</span>`).join('')
      + (names.length > 2 ? `<span class="kt-tag">+${names.length - 2}</span>` : '');
    const title = esc(b.title);
    const action = local
      ? `<button type="button" class="kt-bookmark${on ? ' on' : ''}" data-bookmark="${esc(b.slug)}"
                 aria-label="Simpan ${esc(b.title)} ke bookmark" aria-pressed="${on}">
           <i class="${on ? 'fa-solid' : 'fa-regular'} fa-bookmark"></i>
         </button>`
      : `<span class="kt-tag" title="Dibuka di F15 Library">Baca di F15</span>`;
    const label = b.title + ' - ' + (b.author || 'Tanpa penulis') + (local ? '' : ' (dibuka di F15 Library)');
    return `
      <article class="inner-card kt-card" data-open="${esc(b.slug)}" tabindex="0" role="link" aria-label="${esc(label)}">
        <div>
          <div class="kt-cover"><img src="${esc(b.cover || '')}" alt="Sampul ${esc(b.title)}" loading="lazy" decoding="async" referrerpolicy="no-referrer" /></div>
          <h3 class="kt-title">${title}</h3>
          <p class="kt-author">${esc(b.author || 'Tanpa penulis')}</p>
        </div>
        <div class="kt-row foot">
          ${action}
        </div>
        <div class="kt-tags">${tags}</div>
      </article>`;
  }

  function renderChips(active) {
    const all = `<a href="katalog.html" class="kt-chip${active ? '' : ' active'}"${active ? '' : ' aria-current="page"'}>
        <i class="fa-solid fa-table-cells-large"></i>Semua</a>`;
    const items = (state.cats || []).map((c) => `
      <a href="${categoryUrl(c.slug)}" class="kt-chip${c.slug === active ? ' active' : ''}${c.coming_soon ? ' soon' : ''}"${c.slug === active ? ' aria-current="page"' : ''}
         ${c.coming_soon ? 'title="Segera datang"' : ''}>
        <i class="fa-solid ${Catalog.icon(c.slug)}"></i>${esc(c.name)}${c.coming_soon ? '<small>segera</small>' : ''}</a>`).join('');
    const box = $('#ktChips');
    box.innerHTML = all + items;
    // scrollbar disembunyikan: pastikan chip aktif terlihat (hanya menggeser baris chip)
    const on = box.querySelector('.active');
    if (on) box.scrollLeft = Math.max(0, on.offsetLeft - (box.clientWidth - on.offsetWidth) / 2);
  }

  // roda mouse (vertikal) ikut menggeser baris chip ke samping bila memang bisa digeser
  $('#ktChips').addEventListener('wheel', (e) => {
    const box = e.currentTarget;
    if (box.scrollWidth <= box.clientWidth || Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
    e.preventDefault();
    box.scrollLeft += e.deltaY;
  }, { passive: false });

  function setHead(sub, back) {
    $('#ktTitle').textContent = 'Katalog Buku';
    $('#ktSub').textContent = sub;
    $('#ktBack').classList.toggle('hidden', !back);
  }

  function renderLoading() {
    $('#ktBody').innerHTML = '<p class="kt-loading" role="status"><i class="fa-solid fa-circle-notch fa-spin"></i> Memuat buku…</p>';
  }

  function renderError() {
    $('#ktBody').innerHTML = `
      <div class="empty">
        <div class="ic"><i class="fa-solid fa-wifi"></i></div>
        <p class="t">Katalog belum bisa dimuat</p>
        <p class="d">Periksa koneksi internet kamu, lalu coba lagi.</p>
        <div class="actions"><button type="button" id="ktRetry" class="btn btn-primary">Coba lagi</button></div>
      </div>`;
  }

  function soonHTML(cat) {
    return `
      <div class="empty kt-soon">
        <div class="ic"><i class="fa-solid fa-hourglass-half"></i></div>
        <p class="t">Segera datang</p>
        <p class="d"><strong>${esc(cat.name)}</strong> — ${esc(Catalog.soonText(cat.slug))}</p>
        <div class="actions"><a href="katalog.html" class="btn btn-primary">Lihat kategori lain</a></div>
      </div>`;
  }

  function renderAll() {
    setHead('Telusuri buku dari semua kategori.', false);
    document.title = 'KATALOG BUKU - DESA BACA';

    const ready = state.cats.filter((c) => !c.coming_soon);
    const soon = state.cats.filter((c) => c.coming_soon);
    const readable = Store.getBooks().map((b) => ({ slug: b.slug, title: b.title, author: b.author, cover: b.cover,
      category_names: [b.category] }));
    const shelf = `
        <section aria-labelledby="sec-readable">
          <div class="kt-section-head"><h2 id="sec-readable">Bisa dibaca sekarang<span class="count">${readable.length} buku</span></h2></div>
          <div class="kt-grid">${readable.map(cardHTML).join('')}</div>
        </section>`;
    let html = '<div class="kt-sections">' + shelf + ready.map((c) => `
        <section aria-labelledby="sec-${esc(c.slug)}">
          <div class="kt-section-head">
            <h2 id="sec-${esc(c.slug)}">${esc(c.name)}<span class="count">${c.book_count} buku</span></h2>
            <a href="${categoryUrl(c.slug)}" class="kt-all"><span>Lihat Semua</span><i class="fa-solid fa-arrow-right"></i></a>
          </div>
          <div class="kt-grid">${(c.preview || []).slice(0, PREVIEW_COUNT).map(cardHTML).join('')}</div>
        </section>`).join('');

    if (soon.length) {
      html += `
        <section aria-labelledby="sec-soon">
          <div class="kt-section-head"><h2 id="sec-soon">Segera datang<span class="count">${soon.length} kategori</span></h2></div>
          <div class="kt-soon-list">${soon.map((c) => `
            <a href="${categoryUrl(c.slug)}" class="kt-soon-item"><i class="fa-solid ${Catalog.icon(c.slug)}"></i><span>${esc(c.name)}</span></a>`).join('')}
          </div>
        </section>`;
    }
    $('#ktBody').innerHTML = html + '</div>';
  }

  function moreHTML() {
    return state.hasMore
      ? `<div class="kt-more"><button type="button" id="ktMore" class="btn btn-outline">Muat lebih banyak</button></div>` : '';
  }

  function renderCategoryBody(cat) {
    $('#ktBody').innerHTML = `
      <section aria-labelledby="sec-${esc(cat.slug)}">
        <div class="kt-section-head">
          <h2 id="sec-${esc(cat.slug)}">${esc(cat.name)}<span class="count">${state.total} buku</span></h2>
        </div>
        <div class="kt-grid" id="ktGrid">${state.list.map(cardHTML).join('')}</div>
        <div id="ktMoreWrap">${moreHTML()}</div>
      </section>`;
  }

  async function renderCategory(cat) {
    document.title = cat.name + ' - KATALOG BUKU - DESA BACA';
    if (cat.coming_soon) {
      setHead(cat.name + ' — segera datang.', true);
      $('#ktBody').innerHTML = soonHTML(cat);
      return;
    }
    setHead(cat.book_count + ' buku di kategori ' + cat.name + '.', true);
    renderLoading();
    const r = await Catalog.books({ kategori: cat.slug, per_page: PER_PAGE }).catch(() => null);
    if (!r || !r.success) { renderError(); return; }
    Object.assign(state, { list: r.books, page: 1, hasMore: r.has_more, total: r.total });
    renderCategoryBody(cat);
  }

  async function loadMore() {
    const btn = $('#ktMore');
    const cat = (state.cats || []).find((c) => c.slug === activeSlug());
    if (!btn || !cat) return;
    btn.disabled = true;
    const r = await Catalog.books({ kategori: cat.slug, per_page: PER_PAGE, page: state.page + 1 }).catch(() => null);
    if (!r || !r.success) { btn.disabled = false; showToast('Gagal memuat buku berikutnya. Coba lagi.', 'error'); return; }
    state.page = r.page; state.hasMore = r.has_more; state.list = state.list.concat(r.books);
    $('#ktGrid').insertAdjacentHTML('beforeend', r.books.map(cardHTML).join(''));
    $('#ktMoreWrap').innerHTML = moreHTML();
  }

  async function render() {
    $('#ktEmpty').classList.add('hidden');
    if (searchQ) { renderChips(activeSlug()); return renderSearchView(searchQ); }
    if (state.failed || !state.cats) { renderChips(null); renderError(); return; }
    const slug = activeSlug();
    const cat = slug ? state.cats.find((c) => c.slug === slug) : null;
    renderChips(cat ? cat.slug : null);

    if (slug && !cat) {                        // ?kategori= tidak dikenal
      $('#ktBody').innerHTML = '';
      setHead('Telusuri buku dari semua kategori.', true);
      $('#ktEmpty').classList.remove('hidden');
      return;
    }
    if (cat) await renderCategory(cat); else renderAll();
  }

  async function loadCategories() {
    const r = await Catalog.categories(PREVIEW_COUNT).catch(() => null);
    state.failed = !r || !r.success;
    state.cats = state.failed ? null : r.categories;
  }

  /* ---------------------------------------------------------------------------
   * Pencarian: semua kategori & buku. Hasil menggantikan isi katalog sementara.
   * Kosongkan kotak (atau Esc) untuk kembali ke tampilan semula.
   * ------------------------------------------------------------------------- */
  const SEARCH_DELAY = 300;
  const SEARCH_PER_PAGE = 24;
  let searchQ = '';                        // kata cari aktif ('' = tidak mencari)
  let searchSeq = 0;                       // nomor permintaan; hasil lama diabaikan
  let searchTimer = null;
  let sessionReady = false;                // sesi (login) sudah dicek
  let pendingSearch = null;                // pencarian yang diketik sebelum sesi siap

  async function renderSearchView(q) {
    const seq = ++searchSeq;
    setHead('Hasil pencarian untuk "' + q + '".', !!activeSlug());
    document.title = 'Pencarian: ' + q + ' - KATALOG BUKU - DESA BACA';
    renderLoading();
    const r = await Catalog.books({ q, per_page: SEARCH_PER_PAGE }).catch(() => null);
    if (seq !== searchSeq) return;         // sudah ada pencarian/kembali yang lebih baru
    if (!r || !r.success) { renderError(); return; }

    const low = q.toLowerCase();
    const cats = (state.cats || []).filter((c) => !c.coming_soon && c.name.toLowerCase().includes(low));
    const catHtml = cats.length ? `
      <div class="kt-search-cats">${cats.map((c) => `
        <a href="${categoryUrl(c.slug)}" class="kt-chip"><i class="fa-solid ${Catalog.icon(c.slug)}"></i>${esc(c.name)}</a>`).join('')}
      </div>` : '';
    let bodyHtml;
    if (!r.books.length) {
      bodyHtml = cats.length
        ? `<p class="kt-more-note">Tidak ada buku yang cocok dengan "${esc(q)}". Pilih kategori di atas untuk menelusurinya.</p>`
        : `
        <div class="empty">
          <div class="ic"><i class="fa-solid fa-magnifying-glass"></i></div>
          <p class="t">Tidak ada hasil untuk "${esc(q)}"</p>
          <p class="d">Coba judul, nama penulis, atau nama kategori lain.</p>
        </div>`;
    } else {
      bodyHtml = `<div class="kt-grid">${r.books.map(cardHTML).join('')}</div>`
        + (r.total > r.books.length ? `<p class="kt-more-note">Menampilkan ${r.books.length} dari ${r.total} buku. Persempit kata pencarian untuk hasil lain.</p>` : '');
    }
    $('#ktBody').innerHTML = `
      <section aria-labelledby="ktSearchHead">
        <div class="kt-section-head">
          <h2 id="ktSearchHead">Hasil pencarian<span class="count">${r.total} buku</span></h2>
        </div>
        ${catHtml}${bodyHtml}
      </section>`;
  }

  function runKtSearch(raw) {
    clearTimeout(searchTimer);
    const q = String(raw || '').trim();
    if (!q) { clearKtSearch(); return; }
    if (!sessionReady) { pendingSearch = q; return; }   // dijalankan setelah sesi siap
    if (!Store.isLoggedIn()) {
      showToast('Silakan masuk terlebih dahulu untuk mencari buku.', 'error');
      return;
    }
    searchQ = q;
    render();
  }

  function clearKtSearch() {
    clearTimeout(searchTimer);
    searchQ = '';
    searchSeq++;
    $('#ktSearch').value = '';
    render();
  }

  $('#ktSearchForm').addEventListener('submit', (e) => {
    e.preventDefault();
    runKtSearch($('#ktSearch').value);
  });
  $('#ktSearch').addEventListener('input', (e) => {
    clearTimeout(searchTimer);
    const v = e.target.value.trim();
    if (!v) { clearKtSearch(); return; }
    searchTimer = setTimeout(() => runKtSearch(v), SEARCH_DELAY);
  });
  $('#ktSearch').addEventListener('keydown', (e) => { if (e.key === 'Escape') clearKtSearch(); });

  /* ---------------------------------------------------------------------------
   * Aksi kartu
   * ------------------------------------------------------------------------- */
  function paintBookmark(btn, on) {
    btn.classList.toggle('on', on);
    btn.setAttribute('aria-pressed', on);
    btn.querySelector('i').className = (on ? 'fa-solid' : 'fa-regular') + ' fa-bookmark';
  }

  async function toggleBookmark(btn) {
    const slug = btn.dataset.bookmark;
    if (!Store.getBook(slug)) return;
    if (!Store.isLoggedIn()) {
      showToast('Silakan masuk terlebih dahulu untuk menyimpan buku.', 'error');
      return;
    }
    const on = await Store.toggleBookmark(slug);
    document.querySelectorAll('[data-bookmark="' + slug + '"]').forEach((el) => paintBookmark(el, on));
    showToast(on ? 'Buku disimpan ke bookmark.' : 'Buku dihapus dari bookmark.');
  }

  function findBook(slug) {
    const pool = Store.getBooks().concat(state.list, ...(state.cats || []).map((c) => c.preview || []));
    return pool.find((b) => b.slug === slug) || null;
  }

  function openBook(slug) {
    const book = findBook(slug);
    if (!book) return;
    if (isLocal(book)) { location.href = bookUrl(book.slug); return; }
    if (book.source_url) window.open(book.source_url, '_blank', 'noopener');
  }

  $('#ktBody').addEventListener('click', (e) => {
    if (e.target.closest('#ktRetry')) { location.reload(); return; }
    if (e.target.closest('#ktMore')) { loadMore(); return; }
    const bm = e.target.closest('[data-bookmark]');
    if (bm) { e.stopPropagation(); toggleBookmark(bm); return; }
    if (e.target.closest('a')) return;                  // tautan judul sudah membuka sendiri
    const card = e.target.closest('[data-open]');
    if (card) openBook(card.dataset.open);
  });
  $('#ktBody').addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' || e.target.closest('[data-bookmark]') || e.target.closest('a')) return;
    const card = e.target.closest('[data-open]');
    if (card) openBook(card.dataset.open);
  });
  // sampul gagal dimuat -> tampilkan ikon buku sebagai cadangan
  $('#ktBody').addEventListener('error', (e) => {
    const img = e.target;
    if (img.tagName !== 'IMG') return;
    const box = img.closest('.kt-cover');
    if (box) { box.classList.add('broken'); img.remove(); box.innerHTML = '<i class="fa-solid fa-book" aria-hidden="true"></i>'; }
  }, true);

  /* ---------------------------------------------------------------------------
   * Akun, tema (sama seperti dashboard.js)
   * ------------------------------------------------------------------------- */
  function updateUserName() {
    const user = Store.getCurrentUser();
    const el = $('#userName');
    const logoutBtn = $('#dashLogoutBtn');
    if (user) {
      el.textContent = user.display_name || user.username || 'Pengguna Desa Baca';
      logoutBtn.classList.remove('hidden');
    } else {
      el.innerHTML = '<a href="index.html" style="color:var(--red);font-weight:700"><i class="fa-solid fa-arrow-right-to-bracket"></i> Masuk Akun</a>';
      logoutBtn.classList.add('hidden');
    }
  }

  function syncThemeIcon() {
    const dark = isDark();
    $('#themeIcon').className = dark ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
    $('#themeToggle').title = dark ? 'Beralih ke Mode Terang Warm' : 'Beralih ke Mode Gelap';
  }

  $('#themeToggle').addEventListener('click', toggleTheme);
  document.addEventListener('themechange', syncThemeIcon);

  $('#dashLogoutBtn').addEventListener('click', async () => {
    try { if (api) await api('backend/auth.php?action=logout'); } catch (e) { /* abaikan */ }
    Store.clearUserData();
    lsRemove(USER_KEY);
    location.href = 'index.html';
  });

  // kembali dari halaman baca: status bookmark bisa berubah (data katalog tidak diminta ulang)
  window.addEventListener('pageshow', (e) => { if (e.persisted && state.cats) render(); });

  /* ---------------------------------------------------------------------------
   * Start
   * ------------------------------------------------------------------------- */
  (async function init() {
    syncThemeIcon();
    updateUserName();
    renderLoading();
    const loading = loadCategories();

    // Wajib login, sama seperti dashboard
    const ok = await Store.syncFromDatabase();
    if (!ok && !Store.isLoggedIn()) {
      window.location.href = 'index.html?auth=login';
      return;
    }
    sessionReady = true;
    updateUserName();
    await loading;
    render();
    if (pendingSearch) { const q = pendingSearch; pendingSearch = null; runKtSearch(q); }
  })();
})();
