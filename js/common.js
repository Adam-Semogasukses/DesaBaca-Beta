/* =============================================================================
 * DESA BACA — common.js : helper bersama semua halaman (tema, toast, escape, api)
 * Tidak menyentuh data buku/riwayat/bookmark: itu tetap lewat DesaBacaStore.
 * ========================================================================== */
(function (global) {
  'use strict';

  const THEME_KEY = 'desabaca_theme';
  const USER_KEY = 'desabaca_user';

  /* localStorage bisa melempar error (mode privat / diblokir) -> selalu try/catch */
  function lsGet(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
  function lsSet(key, val) { try { localStorage.setItem(key, val); } catch (e) { /* abaikan */ } }
  function lsRemove(key) { try { localStorage.removeItem(key); } catch (e) { /* abaikan */ } }

  /** Escape teks sebelum disisipkan ke innerHTML. */
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));

  /** Shortcut: $('#id'), $$('.class') */
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  /* ---------- Tema ---------- */
  const isDark = () => document.documentElement.classList.contains('dark');
  function setTheme(dark) {
    document.documentElement.classList.toggle('dark', dark);
    lsSet(THEME_KEY, dark ? 'dark' : 'light');
    document.dispatchEvent(new CustomEvent('themechange', { detail: { dark } }));
  }
  function toggleTheme() { setTheme(!isDark()); return isDark(); }

  /* ---------- Toast ---------- */
  let toastTimer;
  function showToast(message, type) {
    const el = document.getElementById('toast');
    if (!el) return;
    type = type || 'success';
    el.className = 'toast ' + type;
    el.querySelector('i').className = type === 'error' ? 'fa-solid fa-circle-xmark' : 'fa-solid fa-circle-check';
    el.querySelector('span').textContent = message;
    // paksa reflow supaya transisi jalan lagi saat toast dipanggil berurutan
    void el.offsetWidth;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 3500);
  }

  /* ---------- API backend PHP (tidak diubah) ---------- */
  async function api(url, options) {
    options = options || {};
    const res = await fetch(url, Object.assign({
      credentials: 'same-origin',
    }, options, {
      headers: Object.assign({ 'Content-Type': 'application/json' }, options.headers || {}),
    }));
    return res.json();
  }

  global.DesaBaca = { THEME_KEY, USER_KEY, lsGet, lsSet, lsRemove, esc, $, $$, isDark, setTheme, toggleTheme, showToast, api };
})(window);
