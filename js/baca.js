/* =============================================================================
 * DESA BACA — baca.js (baca.html) — JavaScript native, tanpa Vue.
 *
 * DEMO: hanya 3 buku yang bisa dibaca di sini (lihat BOOKS di js/store.js) dan isinya
 * ringkasan orisinal (js/content.js). Buku lain di katalog berstatus "segera hadir".
 * Isi bacaan = ringkasan orisinal di js/content.js.
 *
 * Progres, riwayat, dan bookmark lewat window.DesaBacaStore (jangan akses localStorage langsung
 * untuk data itu di sini). Buku dipilih lewat ?book=<slug>.
 * ========================================================================== */
(function () {
  'use strict';

  const { $, esc, lsGet, USER_KEY, isDark, toggleTheme } = window.DesaBaca;
  const Store = window.DesaBacaStore;


  /* ---------- state ---------- */
  const requested = new URLSearchParams(location.search).get('book') || 'atomic-habits';
  const book = Store.getBook(requested);

  if (!book) {
    // Slug bukan salah satu dari 3 buku yang bisa dibaca: tampilkan pesan bersih, bukan kerangka kosong
    document.title = 'Buku belum tersedia - DESA BACA';
    const grid = $('.reader-grid');
    Array.from(grid.children).forEach((el) => { el.style.display = 'none'; });   // kerangka dibiarkan ada agar reader-tools.js tidak error
    grid.insertAdjacentHTML('beforeend', `
      <section class="reader" style="grid-column:1/-1">
        <div class="empty" style="margin:24px">
          <div class="ic"><i class="fa-solid fa-hourglass-half"></i></div>
          <p class="t">Buku ini segera hadir</p>
          <p class="d">Saat ini baru 3 buku yang bisa dibaca di Desa Baca. Buku lainnya sedang kami siapkan.</p>
          <div class="actions"><a href="katalog.html" class="btn btn-primary">Kembali ke Katalog</a></div>
        </div>
      </section>`);
    $('#themeToggle').addEventListener('click', toggleTheme);
    return;
  }

  const initial = Store.getProgress(book.slug);
  const state = { chapter: initial.chapter, done: initial.done.slice(), saved: Store.isBookmarked(book.slug) };
  const progress = () => Math.round((state.done.length / book.chapters) * 100);

  /* ---------- isi bacaan (js/content.js) ---------- */
  const content = (window.DesaBacaContent && window.DesaBacaContent.get(book.slug)) || [];
  const chapterTitle = (n) => (content[n - 1] && content[n - 1].title) || 'Bab ' + n;

  function chapterHTML(n) {
    const ch = content[n - 1];
    if (!ch) return '<p>Isi bab ini belum tersedia.</p>';
    return ch.paras.map((p) => `<p>${esc(p)}</p>`).join('')
      + `<div class="note-box"><p class="eyebrow">Poin Kunci</p><ul style="margin:0;padding-left:18px">${ch.points.map((p) => `<li>${esc(p)}</li>`).join('')}</ul></div>
      <p>Setelah selesai membaca bab ini, tekan tombol <strong>Tandai selesai</strong>. Kamu dapat melanjutkan ke bab berikutnya tanpa kehilangan posisi bacaan.</p>`;
  }

  /* ---------- render ---------- */
  function setCover() {
    const img = $('#bookCover');
    let triedFallback = false;
    img.onerror = () => {
      if (!triedFallback && book.cover_fallback && book.cover_fallback !== img.src) { triedFallback = true; img.src = book.cover_fallback; }
      else img.style.visibility = 'hidden';
    };
    img.src = book.cover;
    img.alt = book.title;
  }

  function renderStatic() {
    document.title = book.title + ' - DESA BACA';
    $('#topBookName').textContent = book.title;
    $('#bookTitle').textContent = book.title;
    $('#detailTitle').textContent = book.title;
    $('#detailAuthor').textContent = book.author;
    $('#detailChapters').textContent = book.chapters + ' bab';
    
    $('#sourceCredit').innerHTML = 'Ringkasan orisinal Desa Baca, bukan teks asli buku. Untuk isi lengkap, baca bukunya.';
    $('#sourceCredit').hidden = false;
    const curUser = Store.getCurrentUser();
    $('#userName').textContent = (curUser && (curUser.display_name || curUser.username)) || lsGet(USER_KEY) || 'Pengguna Desa Baca';
  }

  function renderChapter() {
    const pct = progress();
    const title = chapterTitle(state.chapter);
    $('#chapterChip').textContent = `Bab ${state.chapter} / ${book.chapters}`;
    $('#chapterHeading').textContent = `Bab ${state.chapter} — ${title}`;
    $('#prose').innerHTML = chapterHTML(state.chapter);
    const m = window.DesaBacaContent && window.DesaBacaContent.minutes(book.slug, state.chapter);
    $('#readMins').textContent = 'Ringkasan' + (m ? ' · ±' + m + ' menit baca' : '');
    $('#readPct').textContent = pct + '% selesai';
    $('#sidePct').textContent = pct + '%';
    $('#sideBar').style.width = pct + '%';
    $('#prevBtn').disabled = state.chapter === 1;
    $('#nextBtn').disabled = state.chapter === book.chapters;
    $('#doneBtn').disabled = false;

    let html = '';
    for (let n = 1; n <= book.chapters; n++) {
      const active = n === state.chapter;
      const done = state.done.includes(n);
      html += `<button type="button" class="chapter-item${active ? ' active' : ''}" data-chapter="${n}"${active ? ' aria-current="true"' : ''}>
        <span class="chapter-name">Bab ${n} — ${esc(chapterTitle(n))}</span>${done ? '<i class="fa-solid fa-check done"></i>' : active ? '<i class="fa-solid fa-book-open now"></i>' : ''}
      </button>`;
    }
    $('#chapterList').innerHTML = html;
  }

  function renderSave() {
    $('#saveIcon').className = (state.saved ? 'fa-solid' : 'fa-regular') + ' fa-bookmark';
    $('#saveLabel').textContent = state.saved ? 'Tersimpan' : 'Simpan';
    $('#saveBtn').title = state.saved ? 'Hapus dari bookmark' : 'Simpan ke bookmark';
    $('#saveBtn').setAttribute('aria-pressed', state.saved);
  }

  function renderTheme() {
    $('#themeIcon').className = isDark() ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
  }

  /* ---------- aksi ---------- */
  function openChapter() { Store.recordOpen(book.slug, state.chapter); }

  function goChapter(n) {
    if (n < 1 || n > book.chapters) return;
    state.chapter = n;
    openChapter();
    renderChapter();
    const scroller = document.querySelector('.reader-scroll');
    if (scroller) scroller.scrollTop = 0;
    window.scrollTo(0, 0);
    const main = document.querySelector('.reader-main');
    if (main) main.scrollTop = 0;
  }
  const nextChapter = () => { if (state.chapter < book.chapters) goChapter(state.chapter + 1); };
  const prevChapter = () => { if (state.chapter > 1) goChapter(state.chapter - 1); };

  function completeChapter() {
    const r = Store.completeChapter(book.slug, state.chapter);
    state.done = Store.getProgress(book.slug).done;
    if (!r.finished && state.chapter < book.chapters) goChapter(state.chapter + 1);
    else renderChapter();
  }

  async function toggleSave() {
    if (!Store.isLoggedIn()) {
      alert('Silakan masuk terlebih dahulu untuk menyimpan buku ke database akun Anda.');
      return;
    }
    state.saved = await Store.toggleBookmark(book.slug);
    renderSave();
  }

  /* ---------- event ---------- */
  $('#prevBtn').addEventListener('click', prevChapter);
  $('#nextBtn').addEventListener('click', nextChapter);
  $('#doneBtn').addEventListener('click', completeChapter);
  $('#saveBtn').addEventListener('click', toggleSave);
  $('#themeToggle').addEventListener('click', toggleTheme);
  document.addEventListener('themechange', renderTheme);
  $('#chapterList').addEventListener('click', (e) => {
    const b = e.target.closest('[data-chapter]');
    if (b) goChapter(Number(b.dataset.chapter));
  });

  // Intercept akses dashboard jika belum login
  document.addEventListener('click', (e) => {
    const dashLink = e.target.closest('a[href*="dashboard.html"]');
    if (dashLink && !Store.isLoggedIn()) {
      e.preventDefault();
      window.location.href = 'index.html?auth=login';
    }
  });

  /* ---------- start ---------- */
  setCover();
  renderStatic();
  renderSave();
  renderTheme();
  openChapter();
  renderChapter();

  // Sinkronisasi data user & progres terbaru dari database (tidak menahan render pertama)
  Store.syncFromDatabase().then(() => {
    const latest = Store.getProgress(book.slug);
    if (latest) {
      state.chapter = latest.chapter;
      state.done = latest.done.slice();
      state.saved = Store.isBookmarked(book.slug);
      renderStatic();
      renderSave();
      renderChapter();
    }
  });
})();
