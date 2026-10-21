(function () {
  'use strict';
  const { $, lsGet, lsSet } = window.DesaBaca;
  const reader = $('.reader');
  if (!reader) return;

  const SIZES = [14, 16, 18, 20, 22];
  const SPEEDS = [{ name: 'Pelan', v: 25 }, { name: 'Sedang', v: 50 }, { name: 'Cepat', v: 90 }];
  const K_SIZE = 'desabaca_reader_size', K_SPEED = 'desabaca_reader_speed';

  function loadIdx(key, max, def) {
    const raw = lsGet(key);
    const n = raw === null ? def : parseInt(raw, 10);
    return Number.isInteger(n) && n >= 0 && n <= max ? n : def;
  }
  let si = loadIdx(K_SIZE, SIZES.length - 1, 1);
  let sp = loadIdx(K_SPEED, SPEEDS.length - 1, 1);

  const fontDown = $('#fontDown'), fontUp = $('#fontUp'), fontLabel = $('#fontLabel');
  const speedBtn = $('#scrollSpeed'), toggleBtn = $('#scrollToggle');
  const tools = $('.reader-tools');
  const foot = $('.reader-foot');

  /* ---------- ukuran teks ---------- */
  function applySize() {
    reader.style.setProperty('--prose-fs', SIZES[si] + 'px');
    fontLabel.textContent = SIZES[si] + 'px';
    fontDown.disabled = si === 0;
    fontUp.disabled = si === SIZES.length - 1;
  }
  fontDown.addEventListener('click', () => { if (si > 0) { si--; lsSet(K_SIZE, si); applySize(); } });
  fontUp.addEventListener('click', () => { if (si < SIZES.length - 1) { si++; lsSet(K_SIZE, si); applySize(); } });

  /* ---------- gulir otomatis ---------- */
  const wide = () => window.matchMedia('(min-width: 1280px)').matches;
  const scroller = () => (wide() ? document.querySelector('.reader-scroll') : document.querySelector('.reader-main'));

  let running = false, raf = 0, last = 0, pos = 0, el = null;

  function paint() {
    toggleBtn.classList.toggle('on', running);
    toggleBtn.setAttribute('aria-pressed', String(running));
    toggleBtn.querySelector('i').className = running ? 'fa-solid fa-pause' : 'fa-solid fa-play';
    const label = running ? 'Hentikan gulir otomatis' : 'Mulai gulir otomatis';
    toggleBtn.setAttribute('aria-label', label);
    toggleBtn.title = label;
    speedBtn.textContent = SPEEDS[sp].name;
  }

  function textFinished() {
    const t = document.querySelector('.reader-text');
    if (!t || !el) return true;
    const limit = wide() ? el.getBoundingClientRect().bottom : (foot ? foot.getBoundingClientRect().top : el.getBoundingClientRect().bottom);
    return t.getBoundingClientRect().bottom <= limit - 4;
  }

  function step(now) {
    if (!running) return;
    const dt = Math.min(64, now - last) / 1000;
    last = now;
    if (Math.abs(el.scrollTop - Math.round(pos)) > 3) pos = el.scrollTop;   // pengguna menggeser manual
    pos += SPEEDS[sp].v * dt;
    el.scrollTop = pos;
    if (textFinished()) { stop(); return; }
    raf = requestAnimationFrame(step);
  }

  function start() {
    el = scroller();
    if (!el || textFinished()) return;
    running = true;
    pos = el.scrollTop;
    last = performance.now();
    paint();
    raf = requestAnimationFrame(step);
  }
  function stop() {
    running = false;
    cancelAnimationFrame(raf);
    paint();
  }

  toggleBtn.addEventListener('click', () => (running ? stop() : start()));
  speedBtn.addEventListener('click', () => { sp = (sp + 1) % SPEEDS.length; lsSet(K_SPEED, sp); paint(); });

  // Berhenti jika pengguna menggulir/menyentuh teks (kecuali saat memakai toolbar)
  ['wheel', 'touchstart', 'mousedown'].forEach((ev) => {
    document.addEventListener(ev, (e) => {
      if (running && !(tools && tools.contains(e.target))) stop();
    }, { passive: true });
  });
  document.addEventListener('keydown', (e) => {
    if (running && ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ', 'Escape'].includes(e.key)) stop();
  });
  // Pindah bab -> berhenti
  document.addEventListener('click', (e) => {
    if (running && e.target.closest('#prevBtn, #nextBtn, #doneBtn, .chapter-item')) stop();
  }, true);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
  window.addEventListener('resize', () => { if (running) stop(); });

  applySize();
  paint();
})();
