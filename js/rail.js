(function () {
  'use strict';
  const ws = document.querySelector('.workspace');
  const rail = document.querySelector('.rail');
  if (!ws || !rail) return;

  const { lsGet, lsSet } = window.DesaBaca;
  const KEY = 'desabaca_rail_collapsed';
  const isReader = !!document.querySelector('.reader');

  const colBtn = document.createElement('button');
  colBtn.type = 'button';
  colBtn.className = 'rail-collapse';
  colBtn.setAttribute('aria-label', 'Sembunyikan menu');
  colBtn.title = 'Sembunyikan menu';
  colBtn.innerHTML = '<i class="fa-solid fa-angles-left"></i>';
  const group = rail.querySelector('.rail-group') || rail;
  group.insertBefore(colBtn, group.firstChild);

  const openBtn = document.createElement('button');
  openBtn.type = 'button';
  openBtn.className = 'rail-open';
  openBtn.setAttribute('aria-label', 'Buka menu');
  openBtn.title = 'Buka menu';
  openBtn.innerHTML = '<i class="fa-solid fa-angles-right"></i>';
  ws.appendChild(openBtn);

  function set(collapsed, save) {
    ws.classList.toggle('rail-collapsed', collapsed);
    openBtn.setAttribute('aria-expanded', String(!collapsed));
    if (save) lsSet(KEY, collapsed ? '1' : '0');
  }

  const saved = lsGet(KEY);
  set(saved === null ? isReader : saved === '1', false);

  colBtn.addEventListener('click', () => set(true, true));
  openBtn.addEventListener('click', () => set(false, true));
})();
