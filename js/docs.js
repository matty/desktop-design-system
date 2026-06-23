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

  // ---- Example code tabs + copy (progressive enhancement) ----
  document.addEventListener("click", function (e) {
    var tab = e.target.closest && e.target.closest(".example-tab");
    if (tab) {
      var ex = tab.closest(".example");
      if (!ex) return;
      var panel = tab.getAttribute("data-panel");
      ex.querySelectorAll(".example-tab").forEach(function (t) {
        t.classList.toggle("is-active", t === tab);
      });
      ex.querySelectorAll(".example-panel").forEach(function (p) {
        p.classList.toggle("is-active", p.getAttribute("data-panel") === panel);
      });
      return;
    }
    var copy = e.target.closest && e.target.closest(".example-copy");
    if (copy) {
      var pre = copy.parentElement.querySelector("code");
      if (!pre || !navigator.clipboard) return;
      navigator.clipboard.writeText(pre.textContent).then(function () {
        var prev = copy.textContent;
        copy.textContent = "Copied";
        setTimeout(function () { copy.textContent = prev; }, 1200);
      }).catch(function () {});
    }
  });
})();
