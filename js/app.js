(function () {
  'use strict';

  const { $, $$, esc, showToast, api, lsGet, lsSet, lsRemove, USER_KEY } = window.DesaBaca;
  const Store = window.DesaBacaStore;

  // data tampilan
  const POPULAR_BOOKS = [
    { slug: 'atomic-habits', cover: 'https://f15-api.imajikreasi.com/assets/covers/83cf990e0373464d.avif', title: 'Atomic Habits - James Clear', author: 'James Clear', readers: 44,
      desc: 'perubahan kecil yang dilakukan secara konsisten setiap hari dapat berakumulasi menghasilkan transformasi dan dampak besar dalam hidup.',
      tags: ['Pengembangan Diri'] },
    { slug: 'hujan', cover: 'images/v259_152.png', title: 'Hujan - Tere Liye', author: 'Tere Liye', readers: 95,
      desc: 'menceritakan tentang perjalanan hidup dan perjuangan seorang gadis bernama Lail dalam menghadapi kehilangan, cinta, serta kenangan pahit setelah bencana alam dahsyat di masa depan',
      tags: ['Fiksi', 'Novel'] },
    { slug: 'filosofi_teras', cover: 'images/filosofi_teras.jpg', title: 'Filosofi Teras - Henry Manampiring', author: 'Henry Manampiring', readers: 99,
      desc: 'ajaran hidup kuno yang membimbing kita untuk fokus membedakan apa yang bisa dan tidak bisa dikendalikan agar tercapai ketenangan batin',
      tags: ['Pengembangan Diri'] },
  ];

  // state
  const state = {
    bookmarks: [],
    cats: [],
    catsFailed: false,
    currentUser: null,
    authTab: 'login',
  };

  // render
  const catUrl = (slug) => 'katalog.html?kategori=' + encodeURIComponent(slug);
  const catIcon = (slug) => (window.DesaBacaCatalog ? window.DesaBacaCatalog.icon(slug) : 'fa-book');

  // marquee
  function renderGenres() {
    const track = $('#genreTrack');
    if (!track) return;
    const ready = state.cats.filter((c) => !c.coming_soon);
    if (!ready.length) { track.closest('.marquee').classList.add('hidden'); return; }
    const pill = (c, hidden) => `
      <a href="${catUrl(c.slug)}" class="filter-pill"${hidden ? ' aria-hidden="true" tabindex="-1"' : ''}>
        <i class="fa-solid ${catIcon(c.slug)}"></i>${esc(c.name)}
      </a>`;
    track.innerHTML = ready.map((c) => pill(c, false)).join('') + ready.map((c) => pill(c, true)).join('');
  }

  function renderBooks() {
    const grid = $('#bookGrid');
    if (!grid) return;
    grid.innerHTML = POPULAR_BOOKS.map((b) => {
      const on = state.bookmarks.includes(b.slug);
      return `
      <article class="hover-card book-card" data-open-book="${esc(b.slug)}">
        <div>
          <div class="book-cover"><img src="${esc(b.cover)}" alt="${esc(b.title)}" loading="lazy" /></div>
          <p class="book-desc">${esc(b.desc)}</p>
          <div class="book-row">
            <span class="book-author">${esc(b.author)}</span>
            <button type="button" class="bookmark-btn${on ? ' on' : ''}" data-bookmark="${esc(b.slug)}"
                    aria-label="Bookmark" aria-pressed="${on}">
              <i class="${on ? 'fa-solid' : 'fa-regular'} fa-bookmark"></i>
            </button>
          </div>
        </div>
        <div class="book-row" style="font-size:11px">
          <div class="readers"><i class="fa-solid fa-user-group"></i><span>${b.readers}</span></div>
          <div class="tags">${b.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>
        </div>
      </article>`;
    }).join('');
  }

  function renderCategories() {
    const catGrid = $('#catGrid');
    const catList = $('#catList');
    if (state.catsFailed) {
      const msg = '<p style="font-size:12px;color:var(--muted)">Kategori belum bisa dimuat. Muat ulang halaman untuk mencoba lagi.</p>';
      if (catGrid) catGrid.innerHTML = msg;
      if (catList) catList.innerHTML = msg;
      return;
    }

    if (catGrid) {
      catGrid.innerHTML = state.cats.filter((c) => !c.coming_soon).slice(0, 4).map((c) => {
        const books = c.preview || [];
        return `
        <article class="hover-card cat-card">
          <div>
            <h3>${esc(c.name)}</h3>
            <div class="cat-covers">
              ${books.slice(0, 2).map((b) => `<div><img src="${esc(b.cover || '')}" alt="Sampul ${esc(b.title)}" loading="lazy" referrerpolicy="no-referrer" /></div>`).join('')}
            </div>
            <p class="cat-desc">Contoh buku: ${books.map((b) => esc(b.title)).join(', ')}.</p>
            <div class="cat-stats">
              <div class="cat-stat"><span class="icon"><i class="fa-regular fa-file-lines"></i></span>
                <div><b>${c.book_count}</b><small>Buku</small></div></div>
            </div>
          </div>
          <a href="${catUrl(c.slug)}" class="btn-soft">Mulai Membaca</a>
        </article>`;
      }).join('');
    }

    if (catList) {
      catList.innerHTML = state.cats.map((c, i) =>
        `<a href="${catUrl(c.slug)}" class="cat-link"><span class="num">${i + 1}.</span><span>${esc(c.name)}</span>${c.coming_soon ? '<small class="soon">segera</small>' : ''}</a>`).join('');
    }
  }

  async function loadCategories() {
    try {
      const r = await api('backend/categories.php?preview=2');
      if (r && r.success) state.cats = r.categories; else state.catsFailed = true;
    } catch (e) {
      state.catsFailed = true;
    }
    renderGenres();
    renderCategories();
  }

  // tampilan autentikasi pengguna
  function updateAuthUI() {
    const navBtn = $('#navAuthBtn');
    const navText = $('#navAuthText');
    const userDrop = $('#userDropdown');
    const dropName = $('#dropdownUserName');
    const dropSub = $('#dropdownUserSub');
    const mobileWrap = $('#mobileAuthWrap');

    if (state.currentUser) {
      const name = state.currentUser.display_name || state.currentUser.username;
      if (navBtn) {
        navBtn.classList.add('is-logged');
        navBtn.removeAttribute('data-action');
        navBtn.setAttribute('title', 'Menu Akun: ' + name);
        if (state.currentUser.avatar) {
          navBtn.innerHTML = `<img src="${esc(state.currentUser.avatar)}" class="user-avatar" alt="Avatar" /><span>${esc(name)}</span> <i class="fa-solid fa-chevron-down" style="font-size:10px"></i>`;
        } else {
          navBtn.innerHTML = `<i class="fa-solid fa-user-check" style="color:#10b981"></i><span>${esc(name)}</span> <i class="fa-solid fa-chevron-down" style="font-size:10px"></i>`;
        }
      }

      if (dropName) dropName.textContent = name;
      if (dropSub) dropSub.textContent = state.currentUser.email ? state.currentUser.email : '@' + state.currentUser.username;

      if (mobileWrap) {
        mobileWrap.innerHTML = `
          <div style="padding:10px 0;border-top:1px solid var(--border)">
            <div style="font-size:13px;font-weight:700;color:var(--text-strong)"><i class="fa-solid fa-circle-user" style="color:var(--red)"></i> ${esc(name)}</div>
            <button type="button" class="login-link" id="mobileLogoutBtn" style="color:var(--red);padding-top:8px;background:none;border:none">
              <i class="fa-solid fa-right-from-bracket"></i> Keluar
            </button>
          </div>
        `;
        const mLogout = $('#mobileLogoutBtn');
        if (mLogout) mLogout.addEventListener('click', handleLogout);
      }
    } else {
      if (navBtn) {
        navBtn.classList.remove('is-logged');
        navBtn.setAttribute('data-action', 'open-auth');
        navBtn.setAttribute('data-tab', 'login');
        navBtn.innerHTML = `<i class="fa-solid fa-user"></i><span>Masuk</span>`;
      }
      if (userDrop) userDrop.classList.add('hidden');

      if (mobileWrap) {
        mobileWrap.innerHTML = `
          <button type="button" class="login-link" id="mobileAuthBtn" data-action="open-auth" data-tab="login">
            <i class="fa-solid fa-arrow-right-to-bracket"></i> <span>Masuk / Daftar Akun</span>
          </button>
        `;
      }
    }
  }

  function toggleUserDropdown() {
    const drop = $('#userDropdown');
    if (!drop) return;
    drop.classList.toggle('hidden');
  }

  // tema
  function syncThemeButton() {
    const dark = window.DesaBaca.isDark();
    const icon = $('#themeIcon');
    const label = $('#themeLabel');
    if (icon) icon.className = dark ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
    if (label) label.textContent = dark ? 'Mode Gelap' : 'Mode Terang';
  }

  // pencarian
  const SEARCH_LIMIT = 8;
  const SEARCH_DELAY = 300;
  let searchSeq = 0;
  let searchTimer = null;

  const searchPanel = () => $('#searchResult');
  const searchBody = () => $('#searchBody');
  const bookUrl = (slug) => 'baca.html?book=' + encodeURIComponent(slug);

  function showSearchPanel(on) {
    const res = searchPanel();
    if (res) res.classList.toggle('hidden', !on);
  }

  function setSearchTerm(q) {
    const term = $('#searchTerm');
    if (term) term.textContent = q;
  }

  function searchLoginHint(q) {
    showSearchPanel(true);
    setSearchTerm(q);
    searchBody().innerHTML = `
      <div class="sr-login">
        <p><i class="fa-solid fa-lock"></i> Masuk terlebih dahulu untuk mencari buku di semua kategori.</p>
        <a class="btn btn-primary sr-login-btn" data-action="open-auth" data-tab="login" href="#">Masuk / Daftar</a>
      </div>`;
  }

  // buku yang dikenal Desa Baca dibuka di pembaca; sisanya ke F15 Library
  const searchBookHref = (b) => (Store.getBook(b.slug) ? bookUrl(b.slug) : b.source_url);

  function renderSearchResults(q, cats, books, total) {
    const body = searchBody();
    if (!cats.length && !books.length) {
      body.innerHTML = `<p class="sr-empty">Tidak ada hasil untuk "${esc(q)}". Coba kata lain, atau <a href="katalog.html">jelajahi katalog</a>.</p>`;
      return;
    }
    const catHtml = cats.length ? `
      <div><h4 class="sr-label">Kategori</h4>
        <div class="sr-cats">${cats.map((c) =>
          `<a href="katalog.html?kategori=${encodeURIComponent(c.slug)}" class="sr-chip">${esc(c.name)}</a>`).join('')}</div>
      </div>` : '';
    const bookHtml = books.length ? `
      <div><h4 class="sr-label">Buku (${total})</h4>
        <ul class="sr-books">${books.map((b) => `
          <li><a class="sr-book" href="${esc(searchBookHref(b))}"${Store.getBook(b.slug) ? '' : ' target="_blank" rel="noopener"'}>
            <img src="${esc(b.cover || '')}" alt="" loading="lazy" referrerpolicy="no-referrer" />
            <span><b>${esc(b.title)}</b><small>${esc(b.author || 'Tanpa penulis')}${b.category_names && b.category_names.length ? ' · ' + esc(b.category_names[0]) : ''}</small></span>
          </a></li>`).join('')}</ul>
        ${total > books.length ? `<p class="sr-more">+${total - books.length} buku lain di <a href="katalog.html">katalog</a></p>` : ''}
      </div>` : '';
    body.innerHTML = catHtml + bookHtml;
  }

  async function runSearch(q) {
    const seq = ++searchSeq;
    showSearchPanel(true);
    setSearchTerm(q);
    searchBody().innerHTML = '<p class="sr-empty"><i class="fa-solid fa-circle-notch fa-spin"></i> Mencari…</p>';
    const r = await window.DesaBacaCatalog.books({ q, per_page: SEARCH_LIMIT }).catch(() => null);
    if (seq !== searchSeq) return;         // sudah ada pencarian yang lebih baru
    if (!r || !r.success) {
      searchBody().innerHTML = '<p class="sr-empty">Pencarian belum bisa dijalankan. Coba lagi sebentar.</p>';
      return;
    }
    const low = q.toLowerCase();
    const cats = (state.cats || []).filter((c) => c.name.toLowerCase().includes(low));
    renderSearchResults(q, cats, r.books, r.total);
  }

  // mengetik: cek login
  function onSearchInput() {
    const q = $('#heroBookSearch').value.trim();
    clearTimeout(searchTimer);
    if (!q) { clearSearch(); return; }
    if (!Store.isLoggedIn()) { searchLoginHint(q); return; }
    searchTimer = setTimeout(() => runSearch(q), SEARCH_DELAY);
  }

  // Enter input
  function onSearchSubmit(e) {
    e.preventDefault();
    const q = $('#heroBookSearch').value.trim();
    if (!q) return;
    if (!Store.isLoggedIn()) {
      showToast('Silakan masuk terlebih dahulu untuk mencari buku.', 'info');
      openAuth('login');
      return;
    }
    clearTimeout(searchTimer);
    runSearch(q);
  }

  function clearSearch() {
    searchSeq++;
    clearTimeout(searchTimer);
    const input = $('#heroBookSearch');
    if (input) input.value = '';
    showSearchPanel(false);
  }

  function focusSearch() {
    const el = $('#heroBookSearch');
    if (!el) return;
    el.focus();
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // bookmark
  let pendingBookmarkSlug = null;

  function loadBookmarks() {
    state.bookmarks = Store.getBookmarks().map((b) => b.slug);
    renderBooks();
  }

  async function toggleBookmark(slug) {
    if (!Store.isLoggedIn()) {
      pendingBookmarkSlug = slug;
      const b = Store.getBook(slug);
      const title = b ? b.title : 'buku';
      showToast(`Silakan masuk atau daftar untuk menyimpan "${title}" ke akun Anda.`, 'info');
      openAuth('login');
      return;
    }

    const now = await Store.toggleBookmark(slug);
    loadBookmarks();
    const b = Store.getBook(slug);
    const title = b ? b.title : 'Buku';
    showToast(now ? `"${title}" berhasil disimpan ke database!` : `"${title}" dihapus dari tersimpan.`);
  }

  async function processPendingBookmark() {
    if (pendingBookmarkSlug) {
      const slugToSave = pendingBookmarkSlug;
      pendingBookmarkSlug = null;
      await Store.toggleBookmark(slugToSave);
      loadBookmarks();
      const b = Store.getBook(slugToSave);
      if (b) showToast(`"${b.title}" otomatis tersimpan ke akun Anda!`);
    }
  }

  function openBook(slug) {
    window.location.href = 'baca.html?book=' + encodeURIComponent(slug);
  }

  // modal auth
  const modal = $('#authModal');
  let lastFocus = null;

  function setAuthTab(tab) {
    state.authTab = tab === 'register' ? 'register' : 'login';
    const login = state.authTab === 'login';
    const loginF = $('#loginForm');
    const regF = $('#registerForm');
    const googleView = $('#googleFormView');
    const socialBtns = $('#socialButtons');
    const divider = $('#authDivider');

    if (googleView) googleView.classList.add('hidden');
    if (socialBtns) socialBtns.classList.remove('hidden');
    if (divider) divider.classList.remove('hidden');

    if (loginF) loginF.classList.toggle('hidden', !login);
    if (regF) regF.classList.toggle('hidden', login);

    $$('.tabs [data-tab-btn]').forEach((b) => {
      const active = b.dataset.tabBtn === state.authTab;
      b.classList.toggle('active', active);
      b.setAttribute('aria-selected', active);
    });

    const title = $('#authTitle');
    const sub = $('#authSubtitle');
    if (title) title.textContent = login ? 'Masuk ke Desa Baca' : 'Daftar Akun Baru';
    if (sub) sub.textContent = login
      ? 'Akses ribuan ringkasan buku dan fitur eksklusif lainnya'
      : 'Daftar akun agar riwayat & buku tersimpan di database';
  }

  function openAuth(tab) {
    lastFocus = document.activeElement;
    setAuthTab(tab || 'login');
    if (modal) modal.classList.add('open');
    setTimeout(() => {
      const f = $(state.authTab === 'login' ? '#loginName' : '#regName');
      if (f) f.focus();
    }, 50);
  }

  function closeAuth() {
    if (modal) modal.classList.remove('open');
    const googleView = $('#googleFormView');
    if (googleView) googleView.classList.add('hidden');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function togglePass(btn) {
    const input = btn.parentElement.querySelector('input');
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    const eye = btn.querySelector('i');
    if (eye) eye.className = show ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye';
    btn.setAttribute('aria-label', show ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi');
  }

  async function handleLogin(e) {
    e.preventDefault();
    const btn = e.submitter || $('#loginForm [type=submit]');
    if (btn) btn.disabled = true;
    try {
      const r = await api('backend/auth.php?action=login', {
        method: 'POST',
        body: JSON.stringify({
          name: $('#loginName').value.trim(),
          password: $('#loginPass').value
        }),
      });
      if (!r.success) {
        showToast(r.message || 'Login gagal.', 'error');
        return;
      }
      state.currentUser = r.user;
      Store.setCurrentUser(r.user);
      lsSet(USER_KEY, r.user.display_name || r.user.username);
      closeAuth();
      updateAuthUI();
      await Store.syncFromDatabase();
      loadBookmarks();
      await processPendingBookmark();
      showToast(`Selamat datang kembali, ${r.user.display_name || r.user.username}! Mengarahkan ke Dashboard...`);
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 400);
    } catch (err) {
      showToast('Tidak dapat terhubung ke server.', 'error');
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    const btn = e.submitter || $('#registerForm [type=submit]');
    if (btn) btn.disabled = true;
    try {
      const name = $('#regName').value.trim();
      const password = $('#regPass').value;
      const r = await api('backend/auth.php?action=register', {
        method: 'POST',
        body: JSON.stringify({ name, password, display_name: name }),
      });
      if (!r.success) {
        showToast(r.message || 'Pendaftaran gagal.', 'error');
        return;
      }
      state.currentUser = r.user;
      Store.setCurrentUser(r.user);
      lsSet(USER_KEY, r.user.display_name || r.user.username);
      closeAuth();
      updateAuthUI();
      await Store.syncFromDatabase();
      loadBookmarks();
      await processPendingBookmark();
      showToast(`Akun berhasil dibuat! Mengarahkan ke Dashboard...`);
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 400);
    } catch (err) {
      showToast('Tidak dapat terhubung ke server.', 'error');
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  // mock login google
  function showGoogleFormView() {
    const googleView = $('#googleFormView');
    const loginF = $('#loginForm');
    const regF = $('#registerForm');
    const socialBtns = $('#socialButtons');
    const divider = $('#authDivider');

    if (loginF) loginF.classList.add('hidden');
    if (regF) regF.classList.add('hidden');
    if (socialBtns) socialBtns.classList.add('hidden');
    if (divider) divider.classList.add('hidden');

    if (googleView) {
      googleView.classList.remove('hidden');
      const nameInput = $('#googleNameInput');
      const emailInput = $('#googleEmailInput');
      
      const prevName = lsGet(USER_KEY);
      if (nameInput && !nameInput.value && prevName) {
        nameInput.value = prevName;
        if (emailInput && !emailInput.value) {
          emailInput.value = prevName.toLowerCase().replace(/\s+/g, '.') + '@gmail.com';
        }
      }
      if (nameInput) nameInput.focus();
    }

    const title = $('#authTitle');
    const sub = $('#authSubtitle');
    if (title) title.textContent = 'Masuk dengan Google';
    if (sub) sub.textContent = 'Data profil dan bacaan Anda akan tersimpan di database';
  }

  function hideGoogleFormView() {
    setAuthTab(state.authTab || 'login');
  }

  async function handleGoogleLogin() {
    // jika valid
    if (window.google && window.google.accounts && window.google.accounts.id && window.__DESABACA_GIS_READY) {
      try {
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            showGoogleFormView();
          }
        });
        return;
      } catch (err) {
        console.warn('GIS prompt error:', err);
      }
    }
    showGoogleFormView();
  }

  async function executeGoogleAuth(payload) {
    try {
      showToast('Memproses akun Google ke database...');
      const r = await api('backend/auth.php?action=google', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (!r.success) {
        showToast(r.message || 'Gagal masuk dengan Google.', 'error');
        return;
      }
      state.currentUser = r.user;
      Store.setCurrentUser(r.user);
      lsSet(USER_KEY, r.user.display_name || r.user.username);
      closeAuth();
      updateAuthUI();
      await Store.syncFromDatabase();
      loadBookmarks();
      await processPendingBookmark();
      showToast(`Berhasil masuk dengan Google! Mengarahkan ke Dashboard...`);
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 400);
    } catch (err) {
      showToast('Gagal menghubungkan dengan Google server.', 'error');
    }
  }

  async function handleLogout() {
    try {
      await api('backend/auth.php?action=logout');
    } catch (e) {}
    state.currentUser = null;
    Store.clearUserData();
    lsRemove(USER_KEY);
    const userDrop = $('#userDropdown');
    if (userDrop) userDrop.classList.add('hidden');
    updateAuthUI();
    loadBookmarks();
    showToast('Anda telah keluar dari akun.');
  }

  async function loadSession() {
    try {
      const ok = await Store.syncFromDatabase();
      const user = Store.getCurrentUser();
      if (ok && user) {
        state.currentUser = user;
      } else {
        const r = await api('backend/auth.php?action=me');
        if (r.logged_in && r.user) {
          state.currentUser = r.user;
          Store.setCurrentUser(r.user);
          lsSet(USER_KEY, r.user.display_name || r.user.username);
          await Store.syncFromDatabase();
        } else {
          state.currentUser = null;
          Store.clearUserData();
        }
      }
      updateAuthUI();
      loadBookmarks();
    } catch (err) {
      console.warn('Session check failed', err);
      updateAuthUI();
    }
  }

  // inisialisasi google GIS
  function initGoogleGIS() {
    // Client ID Google OAuth (dapat diisi jika user memiliki Client ID Google Console)
    const CLIENT_ID = '';
    if (CLIENT_ID && window.google && window.google.accounts && window.google.accounts.id) {
      try {
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: (response) => {
            if (response.credential) {
              executeGoogleAuth({ credential: response.credential });
            }
          }
        });
        window.__DESABACA_GIS_READY = true;
        const offBtn = $('#googleGisOfficialBtn');
        if (offBtn) {
          window.google.accounts.id.renderButton(offBtn, {
            theme: 'outline',
            size: 'large',
            text: 'continue_with',
            shape: 'pill'
          });
        }
      } catch (e) {
        window.__DESABACA_GIS_READY = false;
      }
    }
  }

  // Event delegation
  document.addEventListener('click', (e) => {
    const t = e.target;

    // Klik tombol nav akun saat login -> buka dropdown
    const navLogged = t.closest('.btn-auth-nav.is-logged');
    if (navLogged) {
      e.stopPropagation();
      toggleUserDropdown();
      return;
    }

    // Klik di luar dropdown -> tutup dropdown
    const drop = $('#userDropdown');
    if (drop && !drop.classList.contains('hidden') && !t.closest('.user-action-wrap')) {
      drop.classList.add('hidden');
    }

    // Bookmark
    const bm = t.closest('[data-bookmark]');
    if (bm) { e.stopPropagation(); toggleBookmark(bm.dataset.bookmark); return; }

    // Intercept akses link Dashboard jika belum login
    const dashLink = t.closest('a[href*="dashboard.html"]');
    if (dashLink && !Store.isLoggedIn()) {
      e.preventDefault();
      showToast('Silakan masuk terlebih dahulu untuk mengakses Dashboard.', 'info');
      openAuth('login');
      const mm = $('#mobileMenu');
      if (mm) mm.classList.add('hidden');
      return;
    }

    // Buka buku
    const book = t.closest('[data-open-book]');
    if (book) { openBook(book.dataset.openBook); return; }

    // Tab modal login/daftar
    const tabBtn = t.closest('[data-tab-btn]');
    if (tabBtn) { setAuthTab(tabBtn.dataset.tabBtn); return; }

    // Tombol aksi umum
    const act = t.closest('[data-action]');
    if (act) {
      switch (act.dataset.action) {
        case 'open-auth':
          openAuth(act.dataset.tab);
          const mm = $('#mobileMenu');
          if (mm) mm.classList.add('hidden');
          break;
        case 'close-auth': closeAuth(); break;
        case 'toggle-pass': togglePass(act); break;
      }
      return;
    }

    if (t === modal) closeAuth();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && modal.classList.contains('open')) closeAuth();
  });

  const themeToggle = $('#themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const dark = window.DesaBaca.toggleTheme();
      showToast(dark ? 'Beralih ke Mode Gelap' : 'Beralih ke Mode Terang');
    });
  }
  document.addEventListener('themechange', syncThemeButton);

  const menuToggle = $('#menuToggle');
  if (menuToggle) {
    menuToggle.addEventListener('click', () => {
      const menu = $('#mobileMenu');
      if (!menu) return;
      const open = menu.classList.toggle('hidden') === false;
      menuToggle.setAttribute('aria-expanded', open);
    });
  }

  const mobileMenu = $('#mobileMenu');
  if (mobileMenu) {
    mobileMenu.addEventListener('click', (e) => {
      if (e.target.closest('a')) mobileMenu.classList.add('hidden');
    });
  }

  const sForm = $('#searchForm');
  if (sForm) sForm.addEventListener('submit', onSearchSubmit);
  const sInput = $('#heroBookSearch');
  if (sInput) {
    sInput.addEventListener('input', onSearchInput);
    sInput.addEventListener('keydown', (e) => { if (e.key === 'Escape') clearSearch(); });
  }
  const sReset = $('#searchReset');
  if (sReset) sReset.addEventListener('click', clearSearch);

  const lForm = $('#loginForm');
  if (lForm) lForm.addEventListener('submit', handleLogin);
  const rForm = $('#registerForm');
  if (rForm) rForm.addEventListener('submit', handleRegister);

  const gBtn = $('#googleAuthBtn');
  if (gBtn) gBtn.addEventListener('click', handleGoogleLogin);

  const cancelGBtn = $('#cancelGoogleBtn');
  if (cancelGBtn) cancelGBtn.addEventListener('click', hideGoogleFormView);

  const gDirectForm = $('#googleDirectForm');
  if (gDirectForm) {
    gDirectForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = $('#googleNameInput').value.trim();
      const email = $('#googleEmailInput').value.trim();
      const password = $('#googlePassInput').value;
      if (!name || !email || password.length < 6) {
        showToast('Nama, email, dan kata sandi (minimal 6 karakter) harus diisi.', 'error');
        return;
      }
      const submitBtn = gDirectForm.querySelector('[type=submit]');
      if (submitBtn) submitBtn.disabled = true;
      try {
        await executeGoogleAuth({ name, email, password });
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  }

  const logoutBtn = $('#logoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

  window.showToast = showToast;
  window.focusSearch = focusSearch;

  function checkUrlAuth() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('auth')) {
      showToast('Silakan masuk terlebih dahulu untuk mengakses Dashboard.', 'info');
      openAuth(params.get('auth') || 'login');
      try {
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (e) {}
    }
  }

  // START
  loadCategories();
  syncThemeButton();
  loadBookmarks();
  loadSession().then(() => {
    checkUrlAuth();
  });
  setTimeout(initGoogleGIS, 1000);
})();

// dropdown navbar
(function () {
  'use strict';
  const items = Array.from(document.querySelectorAll('.main-nav .nav-item'));
  if (!items.length) return;
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)');
  const userDd = document.getElementById('userDropdown');
  let timer = 0;

  function setOpen(item, on) {
    item.classList.toggle('open', on);
    const t = item.querySelector('.nav-trigger');
    if (t) t.setAttribute('aria-expanded', on ? 'true' : 'false');
  }
  function closeAll(except) { items.forEach((i) => { if (i !== except) setOpen(i, false); }); }
  function open(item) {
    clearTimeout(timer);
    closeAll(item);
    setOpen(item, true);
    if (userDd) userDd.classList.add('hidden');
  }

  items.forEach((item) => {
    const trig = item.querySelector('.nav-trigger');
    if (!trig) return;
    trig.setAttribute('aria-haspopup', 'true');
    trig.setAttribute('aria-expanded', 'false');

    item.addEventListener('mouseenter', () => { if (canHover.matches) open(item); });
    item.addEventListener('mouseleave', () => {
      if (!canHover.matches) return;
      timer = setTimeout(() => setOpen(item, false), 120);
    });
    trig.addEventListener('click', (e) => {
      const isLink = trig.tagName === 'A';
      const isOpen = item.classList.contains('open');
      if (isLink) {
        if (!canHover.matches && !isOpen) { e.preventDefault(); open(item); }
        return;                                   // tautan: navigasi normal
      }
      if (canHover.matches) { open(item); return; }   // mouse: hover sudah membuka, klik tidak menutup
      if (isOpen) setOpen(item, false); else open(item);
    });
  });

  document.addEventListener('click', (e) => { if (!e.target.closest('.main-nav .nav-item')) closeAll(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAll(); });
})();
