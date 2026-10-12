/* Jalankan di <head> sebelum render supaya tidak ada kilatan tema. */
(function () {
  var t = 'dark';
  try { t = localStorage.getItem('desabaca_theme') || 'dark'; } catch (e) { /* storage diblokir */ }
  if (t !== 'dark') document.documentElement.classList.remove('dark');
})();
