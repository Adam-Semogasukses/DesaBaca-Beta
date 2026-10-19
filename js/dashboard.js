/* =============================================================================
 * DESA BACA — dashboard.js (dashboard.html)
 * Mengambil nama pengguna dari database & menampilkan data buku terbaca,
 * sedang dibaca, serta tersimpan.
 * ========================================================================== */
(function () {
  'use strict';

  const { $, $$, esc, lsGet, lsSet, lsRemove, USER_KEY, isDark, toggleTheme, api } = window.DesaBaca;
  const Store = window.DesaBacaStore;

  const VIEWS = ['dashboard', 'progres', 'riwayat', 'bookmarks'];

  /* ---------------------------------------------------------------------------
   * Navigasi antar view (hash: #dashboard | #progres | #riwayat | #bookmarks)
   * ------------------------------------------------------------------------- */
  function viewFromHash() {
    const h = location.hash.replace('#', '');
    return VIEWS.includes(h) ? h : 'dashboard';
  }

  function showView(name) {
    $$('[data-view]').forEach((el) => el.classList.toggle('hidden', el.dataset.view !== name));
    $$('[data-view-link]').forEach((a) => {
      const on = a.dataset.viewLink === name;
      a.classList.toggle('active', on);
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    const main = $('#main');
    if (main) main.scrollTop = 0;
  }

  /* ---------------------------------------------------------------------------
   * Helper format
   * ------------------------------------------------------------------------- */
  const clock = (iso) => new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace(':', '.');
  function dayLabel(iso) {
    const d = new Date(iso), t = new Date(), y = new Date();
    y.setDate(t.getDate() - 1);
    if (d.toDateString() === t.toDateString()) return 'Hari ini';
    if (d.toDateString() === y.toDateString()) return 'Kemarin';
    return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' });
  }
  function ago(iso) {
    const m = Math.floor((Date.now() - new Date(iso)) / 60000);
    if (m < 1) return 'baru saja';
    if (m < 60) return `${m} menit lalu`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} jam lalu`;
    return `${Math.floor(h / 24)} hari lalu`;
  }
  const eventText = (h) => h.type === 'finish' ? 'Menamatkan buku 🎉'
    : h.type === 'chapter_done' ? `Menyelesaikan Bab ${h.chapter}`
    : `Membuka Bab ${h.chapter}`;
  const eventIcon = (t) => t === 'finish' ? 'fa-solid fa-trophy ev-finish'
    : t === 'chapter_done' ? 'fa-regular fa-circle-check ev-done'
    : 'fa-solid fa-book-open ev-open';
  const rankClass = (r) => r <= 3 ? ' r' + r : '';
  const bookUrl = (slug) => 'baca.html?book=' + encodeURIComponent(slug);

  /* ---------------------------------------------------------------------------
   * Render: statistik
   * ------------------------------------------------------------------------- */
  function renderStats(stats) {
    if ($('#sOpened')) $('#sOpened').textContent = stats.opened;
    if ($('#sCompleted')) $('#sCompleted').textContent = stats.completed;
    if ($('#sInProgress')) $('#sInProgress').textContent = stats.in_progress;
    const secs = stats.seconds != null ? stats.seconds : (stats.minutes || 0) * 60;
    // < 1 menit tampil dalam detik, selebihnya menit
    if ($('#sMinutes')) $('#sMinutes').textContent = secs < 60 ? secs : Math.floor(secs / 60);
    if ($('#sMinutesName')) $('#sMinutesName').textContent = secs < 60 ? 'Total Detik' : 'Total Menit';
    if ($('#sHours')) $('#sHours').textContent = Number((secs / 3600).toFixed(secs < 3600 ? 2 : 1));
    if ($('#sStreak')) $('#sStreak').textContent = stats.streak;
    if ($('#sPct')) $('#sPct').textContent = stats.completion_pct + '%';
    if ($('#sPctBar')) $('#sPctBar').style.width = stats.completion_pct + '%';
    if ($('#sDone')) $('#sDone').textContent = stats.completed + ' Selesai';
    if ($('#sReading')) $('#sReading').textContent = stats.in_progress + ' sedang dibaca';

    const badge = $('#bmBadge');
    if (badge) {
      badge.textContent = stats.bookmarks;
      badge.classList.toggle('hidden', !stats.bookmarks);
    }
  }

  /* ---------------------------------------------------------------------------
   * Render: leaderboard
   * ------------------------------------------------------------------------- */
  function renderBoard(board) {
    if ($('#boardVillage')) $('#boardVillage').textContent = board.village;

    if (board.week_start && $('#boardWeek')) {
      const a = new Date(board.week_start), b = new Date(a);
      b.setDate(b.getDate() + 6);
      const f = (d) => d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      $('#boardWeek').textContent = `Minggu ini: ${f(a)} – ${f(b)}`;
    } else if ($('#boardWeek')) {
      $('#boardWeek').textContent = '';
    }

    const max = Math.max(1, ...board.entries.map((e) => e.books));
    const bar = (n) => Math.max(n > 0 ? 6 : 0, Math.round((n / max) * 100));
    const html = board.entries.map((e) => `
      <li class="board-row${e.isMe ? ' me' : ''}">
        <span class="rank${rankClass(e.rank)}">${e.rank}</span>
        <div class="board-body">
          <div class="board-line">
            <span class="board-name">${esc(e.name)}${e.isMe ? '<span class="me-tag">kamu</span>' : ''}</span>
            <span class="board-count">${e.books} <small>buku</small></span>
          </div>
          <div class="progress tiny board-bar"><span style="width:${bar(e.books)}%"></span></div>
        </div>
      </li>`).join('');

    const bList = $('#boardList');
    if (bList) {
      bList.innerHTML = html || '<li class="board-gap">Belum ada pengguna terdaftar.</li>';
    }
  }

  /* ---------------------------------------------------------------------------
   * Render: lanjutkan membaca (buku terakhir yang belum selesai)
   * ------------------------------------------------------------------------- */
  function renderResume(progressList) {
    const el = $('#resumeCard');
    if (!el) return;
    const p = progressList.find((x) => x.status !== 'completed' && x.progress < 100);
    if (!p) {
      el.innerHTML = `
        <span class="stat-label">Lanjutkan Membaca</span>
        <div class="resume-empty">
          <p>Belum ada buku yang sedang dibaca.</p>
          <a href="katalog.html" class="btn btn-primary">Jelajahi katalog</a>
        </div>`;
      return;
    }
    el.innerHTML = `
      <span class="stat-label">Lanjutkan Membaca</span>
      <a href="${bookUrl(p.slug)}" class="resume-body">
        <img class="cover-sm" src="${esc(p.book.cover)}" alt="${esc(p.book.title)}" loading="lazy" />
        <div class="continue-body">
          <h3>${esc(p.book.title)}</h3>
          <p class="author">${esc(p.book.author)}</p>
          <div class="prog">
            <div class="prog-row"><span>Bab ${p.chapter} / ${p.chapters}</span><b>${p.progress}%</b></div>
            <div class="progress thin"><span style="width:${p.progress}%"></span></div>
          </div>
        </div>
        <span class="btn btn-primary resume-btn">Lanjutkan</span>
      </a>`;
  }

  /* ---------------------------------------------------------------------------
   * Render: progres membaca (semua buku yang pernah dibuka, terbaru dulu)
   * ------------------------------------------------------------------------- */
  function renderProgress(progressList) {
    const empty = !progressList.length;
    if ($('#progresEmpty')) $('#progresEmpty').classList.toggle('hidden', !empty);
    const list = $('#progresList');
    if (!list) return;
    list.classList.toggle('hidden', empty);
    list.innerHTML = progressList.map((p) => {
      const done = p.status === 'completed' || p.progress >= 100;
      return `
        <a href="${bookUrl(p.slug)}" class="inner-card continue-card">
          <img class="cover-sm" src="${esc(p.book.cover)}" alt="${esc(p.book.title)}" loading="lazy" />
          <div class="continue-body">
            <h3>${esc(p.book.title)}</h3>
            <p class="author">${esc(p.book.author)}</p>
            <p class="pg-when"><span class="pg-badge${done ? ' done' : ''}">${done ? 'Selesai' : 'Sedang dibaca'}</span>${p.last_read_at ? ' · ' + esc(ago(p.last_read_at)) : ''}</p>
            <div class="prog">
              <div class="prog-row"><span>Bab ${p.chapter} / ${p.chapters}</span><b>${p.progress}%</b></div>
              <div class="progress thin"><span style="width:${p.progress}%"></span></div>
            </div>
          </div>
        </a>`;
    }).join('');
  }

  /* ---------------------------------------------------------------------------
   * Render: riwayat
   * ------------------------------------------------------------------------- */
  function renderHistory(history, progressList) {
    const empty = !history.length;
    if ($('#historyEmpty')) $('#historyEmpty').classList.toggle('hidden', !empty);
    if ($('#historyFull')) $('#historyFull').classList.toggle('hidden', empty);
    if ($('#clearAll')) $('#clearAll').classList.toggle('hidden', empty);
    if (empty) return;

    const cont = progressList.filter((p) => p.status !== 'completed').slice(0, 3);
    if ($('#continueWrap')) $('#continueWrap').classList.toggle('hidden', !cont.length);
    if ($('#continueList')) {
      $('#continueList').innerHTML = cont.map((p) => `
        <a href="${bookUrl(p.slug)}" class="inner-card continue-card">
          <img class="cover-sm" src="${esc(p.book.cover)}" alt="${esc(p.book.title)}" loading="lazy" />
          <div class="continue-body">
            <h3>${esc(p.book.title)}</h3>
            <p class="author">${esc(p.book.author)}</p>
            <div class="prog">
              <div class="prog-row"><span>Bab ${p.chapter} / ${p.chapters}</span><b>${p.progress}%</b></div>
              <div class="progress thin"><span style="width:${p.progress}%"></span></div>
            </div>
          </div>
        </a>`).join('');
    }

    const groups = [];
    history.forEach((h) => {
      const label = dayLabel(h.at);
      let g = groups[groups.length - 1];
      if (!g || g.label !== label) { g = { label, items: [] }; groups.push(g); }
      g.items.push(h);
    });

    if ($('#timeline')) {
      $('#timeline').innerHTML = groups.map((g) => `
        <div>
          <p class="day">${esc(g.label)}</p>
          <div class="timeline-list">
            ${g.items.map((h) => `
            <a href="${bookUrl(h.slug)}" class="timeline-item">
              <img class="cover-xs" src="${esc(h.book.cover)}" alt="${esc(h.book.title)}" loading="lazy" />
              <div class="body">
                <h4>${esc(h.book.title)}</h4>
                <p>${esc(eventText(h))}</p>
              </div>
              <i class="${eventIcon(h.type)}"></i>
              <span class="time">${clock(h.at)}</span>
            </a>`).join('')}
          </div>
        </div>`).join('');
    }
  }

  /* ---------------------------------------------------------------------------
   * Render: bookmark (buku tersimpan)
   * ------------------------------------------------------------------------- */
  const bmPct = (b) => (b.progress && b.progress.progress) || 0;

  function renderBookmarks(saved) {
    if ($('#bookmarkEmpty')) $('#bookmarkEmpty').classList.toggle('hidden', saved.length > 0);
    if ($('#bookmarkList')) {
      $('#bookmarkList').classList.toggle('hidden', !saved.length);
      $('#bookmarkList').innerHTML = saved.map((b) => `
        <div class="inner-card bm-card">
          <div class="bm-top">
            <img class="cover-md" src="${esc(b.book.cover)}" alt="${esc(b.book.title)}" loading="lazy" />
            <div class="bm-info">
              <h3>${esc(b.book.title)}</h3>
              <p class="author">${esc(b.book.author)}</p>
              <span class="cat">${esc(b.book.category)}</span>
              <p class="when">Disimpan ${ago(b.saved_at)}</p>
            </div>
          </div>
          <div class="prog">
            <div class="prog-row"><span>Progres</span><b>${bmPct(b)}%</b></div>
            <div class="progress thin"><span style="width:${bmPct(b)}%"></span></div>
          </div>
          <div class="bm-actions">
            <a href="${bookUrl(b.slug)}" class="btn btn-primary">${b.progress && b.progress.progress > 0 ? 'Lanjutkan' : 'Baca sekarang'}</a>
            <button type="button" class="icon-btn" data-remove="${esc(b.slug)}" aria-label="Hapus dari bookmark" title="Hapus dari bookmark">
              <i class="fa-solid fa-bookmark"></i>
            </button>
          </div>
        </div>`).join('');
    }
  }

  /* ---------------------------------------------------------------------------
   * updateUserName: ganti mockup user dengan nama akun aktif
   * ------------------------------------------------------------------------- */
  function updateUserName() {
    const user = Store.getCurrentUser();
    const el = $('#userName');
    const logoutBtn = $('#dashLogoutBtn');

    if (user) {
      const name = user.display_name || user.username || 'Pengguna Desa Baca';
      if (el) el.textContent = name;
      if (logoutBtn) logoutBtn.classList.remove('hidden');
    } else {
      if (el) el.innerHTML = '<a href="index.html" style="color:var(--red);font-weight:700"><i class="fa-solid fa-arrow-right-to-bracket"></i> Masuk Akun</a>';
      if (logoutBtn) logoutBtn.classList.add('hidden');
    }
  }

  /* ---------------------------------------------------------------------------
   * refresh: ambil ulang semua data dari Store lalu render
   * ------------------------------------------------------------------------- */
  async function refresh() {
    updateUserName();

    // Statistik dihitung dari progres yang sudah disinkronkan (lokal + server)
    renderStats(Store.getStats());

    const history = Store.getHistory();
    const progressList = Store.getAllProgress();
    const saved = Store.getBookmarks()
      .map((b) => Object.assign({}, b, { book: Store.getBook(b.slug), progress: Store.getProgress(b.slug) }))
      .filter((b) => b.book);

    Store.getLeaderboard().then(renderBoard);
    renderResume(progressList);
    renderProgress(progressList);
    renderHistory(history, progressList);
    renderBookmarks(saved);
  }

  function syncThemeIcon() {
    const dark = isDark();
    const icon = $('#themeIcon');
    const btn = $('#themeToggle');
    if (icon) icon.className = dark ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
    if (btn) btn.title = dark ? 'Beralih ke Mode Terang Warm' : 'Beralih ke Mode Gelap';
  }

  /* ---------------------------------------------------------------------------
   * Event
   * ------------------------------------------------------------------------- */
  document.addEventListener('click', async (e) => {
    const rm = e.target.closest('[data-remove]');
    if (rm) {
      await Store.toggleBookmark(rm.dataset.remove);
      await refresh();
      return;
    }

    if (e.target.closest('[data-action="demo"]')) { Store.seedDemo(); refresh(); }
  });

  const clearBtn = $('#clearAll');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (confirm('Hapus semua riwayat dan progres membaca? Bookmark tidak ikut terhapus.')) {
        Store.clearHistory();
        refresh();
      }
    });
  }

  const logoutBtn = $('#dashLogoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        if (api) await api('backend/auth.php?action=logout');
      } catch (e) {}
      Store.clearUserData();
      lsRemove(USER_KEY);
      location.href = 'index.html';
    });
  }

  const themeBtn = $('#themeToggle');
  if (themeBtn) themeBtn.addEventListener('click', toggleTheme);
  document.addEventListener('themechange', syncThemeIcon);

  window.addEventListener('hashchange', () => showView(viewFromHash()));
  window.addEventListener('storage', refresh);
  window.addEventListener('pageshow', refresh);

  /* ---------------------------------------------------------------------------
   * Start
   * ------------------------------------------------------------------------- */
  (async function init() {
    syncThemeIcon();
    showView(viewFromHash());

    // Wajib login untuk mengakses dashboard
    const ok = await Store.syncFromDatabase();
    if (!ok && !Store.isLoggedIn()) {
      window.location.href = 'index.html?auth=login';
      return;
    }

    updateUserName();
    await refresh();
  })();
})();
