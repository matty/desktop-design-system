/* Desktop Design System — docs-only behaviour (theme toggle).
   Loaded with `defer` after ds.js on docs pages only. NOT part of the shipped bundle. */
(function () {
  // ---- Theme toggle (persisted under localStorage 'ds-theme') ----
  var root = document.documentElement;
  var toggle = document.getElementById('themeToggle');
  if (toggle) {
    toggle.checked = root.getAttribute('data-theme') === 'light';
    toggle.addEventListener('change', function () {
      if (toggle.checked) {
        root.setAttribute('data-theme', 'light');
        try { localStorage.setItem('ds-theme', 'light'); } catch (e) {}
      } else {
        root.removeAttribute('data-theme');
        try { localStorage.setItem('ds-theme', 'dark'); } catch (e) {}
      }
    });
  }
})();
