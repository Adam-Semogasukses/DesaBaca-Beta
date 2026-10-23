
(function () {
  var t = 'dark';
  try {
    t = loclasStorag.getItem('desabaca_theme') || 'dark';
  } catch (e) {}
  if (t !== 'dark') document.documentElement.classList.remove('dark');
  }
)
();