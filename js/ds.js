/* Desktop Design System — shared docs behaviour.
   Loaded with `defer` on every page. No dependencies. */
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

  // ---- Combobox / styled select ----
  function closeCombos() {
    document.querySelectorAll('.ds-combo.is-open').forEach(function (c) {
      c.classList.remove('is-open');
      c.querySelector('.ds-combo-menu').hidden = true;
      c.querySelector('.ds-combo-btn').setAttribute('aria-expanded', 'false');
    });
  }
  document.querySelectorAll('.ds-combo').forEach(function (combo) {
    var btn = combo.querySelector('.ds-combo-btn');
    var menu = combo.querySelector('.ds-combo-menu');
    var value = combo.querySelector('.ds-combo-value');
    if (!btn || !menu) return;
    var multi = combo.classList.contains('is-multi');
    var checklist = combo.classList.contains('is-checklist');
    var filterable = combo.classList.contains('is-filterable');
    var options = Array.prototype.slice.call(menu.querySelectorAll('.ds-combo-option'));

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = combo.classList.contains('is-open');
      closeCombos();
      if (!open) {
        combo.classList.add('is-open');
        menu.hidden = false;
        btn.setAttribute('aria-expanded', 'true');
        var f = menu.querySelector('.ds-combo-filter');
        if (f) { f.value = ''; applyFilter(''); f.focus(); }
      }
    });

    function applyFilter(q) {
      var needle = q.trim().toLowerCase();
      options.forEach(function (opt) {
        var label = (opt.dataset.label || opt.textContent).trim();
        var match = !needle || label.toLowerCase().indexOf(needle) >= 0;
        opt.hidden = !match;
      });
    }
    var filterInput = menu.querySelector('.ds-combo-filter');
    if (filterable && filterInput) {
      filterInput.addEventListener('input', function () { applyFilter(filterInput.value); });
      filterInput.addEventListener('click', function (e) { e.stopPropagation(); });
    }

    function renderChips() {
      // remove existing chips, keep the chevron
      combo.querySelectorAll('.ds-chip').forEach(function (c) { c.remove(); });
      var chev = btn.querySelector('.ds-combo-chev');
      options.filter(function (o) { return o.classList.contains('is-selected'); })
        .forEach(function (o) {
          var chip = document.createElement('span');
          chip.className = 'ds-chip';
          chip.textContent = (o.dataset.label || o.firstChild.textContent).trim();
          var x = document.createElement('span');
          x.className = 'ds-chip-x'; x.textContent = '×';
          x.addEventListener('click', function (e) {
            e.stopPropagation(); o.classList.remove('is-selected'); syncAria(o); sync();
          });
          chip.appendChild(x);
          btn.insertBefore(chip, chev);
        });
    }
    function sync() {
      var selected = options.filter(function (o) { return o.classList.contains('is-selected'); });
      if (multi && !checklist) { renderChips(); }
      else if (checklist) {
        if (value) value.textContent = selected.length
          ? selected.length + ' selected' : (value.dataset.placeholder || 'Select…');
      }
    }

    function syncAria(opt) { opt.setAttribute('aria-selected', opt.classList.contains('is-selected') ? 'true' : 'false'); }

    options.forEach(function (opt) {
      opt.addEventListener('click', function (e) {
        e.stopPropagation();
        if (multi || checklist) {
          opt.classList.toggle('is-selected');
          syncAria(opt);
          sync();
        } else {
          options.forEach(function (o) { o.classList.remove('is-selected'); });
          opt.classList.add('is-selected');
          options.forEach(function (o) { syncAria(o); });
          if (value) {
            value.textContent = opt.dataset.label || opt.firstChild.textContent.trim();
            value.classList.remove('is-placeholder');
          }
          closeCombos();
        }
      });
    });
    if (multi || checklist) sync();
    options.forEach(function (opt) { syncAria(opt); });
  });
  document.addEventListener('click', closeCombos);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeCombos(); });

  // ---- Live-region announcer ----
  function ensureLiveRegion(assertive) {
    var id = assertive ? 'ds-live-assertive' : 'ds-live-polite';
    var el = document.getElementById(id);
    if (!el) {
      el = document.createElement('div');
      el.id = id;
      el.className = 'ds-live';
      el.setAttribute('aria-live', assertive ? 'assertive' : 'polite');
      el.setAttribute('aria-atomic', 'true');
      document.body.appendChild(el);
    }
    return el;
  }
  window.dsAnnounce = function (message, opts) {
    var assertive = !!(opts && opts.assertive);
    var el = ensureLiveRegion(assertive);
    el.textContent = '';
    // Force a re-announce even for identical text.
    window.setTimeout(function () { el.textContent = message; }, 30);
  };

  // ---- Focus management primitives ----
  var FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),' +
    'select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

  window.dsFocusTrap = function (container) {
    var prev = document.activeElement;
    function onKey(e) {
      if (e.key !== 'Tab') return;
      var nodes = Array.prototype.filter.call(
        container.querySelectorAll(FOCUSABLE),
        function (n) {
          return !n.hidden && n.offsetWidth > 0 && n.offsetHeight > 0 &&
            getComputedStyle(n).visibility !== 'hidden';
        });
      if (!nodes.length) return;
      var first = nodes[0], last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    container.addEventListener('keydown', onKey);
    return { release: function () {
      container.removeEventListener('keydown', onKey);
      if (prev && prev.focus) prev.focus();
    }};
  };

  window.dsRovingTabindex = function (container, opts) {
    opts = opts || {};
    var sel = opts.selector || '[role="menuitem"],[role="treeitem"],[role="option"]';
    var orient = opts.orientation || 'vertical';
    function items() {
      return Array.prototype.filter.call(container.querySelectorAll(sel),
        function (n) { return n.offsetParent !== null && n.getAttribute('aria-disabled') !== 'true'; });
    }
    function setActive(list, idx) {
      list.forEach(function (n, i) { n.tabIndex = i === idx ? 0 : -1; });
      if (list[idx]) list[idx].focus();
    }
    function init() {
      var list = items();
      list.forEach(function (n, i) { n.tabIndex = i === 0 ? 0 : -1; });
    }
    function onKey(e) {
      var list = items();
      var idx = list.indexOf(document.activeElement);
      if (idx < 0) return;
      var next;
      if (orient === 'horizontal') {
        next = { 'ArrowLeft': idx - 1, 'ArrowRight': idx + 1 };
      } else if (orient === 'vertical') {
        next = { 'ArrowUp': idx - 1, 'ArrowDown': idx + 1 };
      } else {
        // 'both' = accept either axis on a linear list (not 2D grid navigation)
        next = { 'ArrowLeft': idx-1, 'ArrowRight': idx+1, 'ArrowUp': idx-1, 'ArrowDown': idx+1 };
      }
      if (next[e.key] != null) {
        e.preventDefault();
        var ni = (next[e.key] + list.length) % list.length;
        setActive(list, ni);
      } else if (e.key === 'Home') { e.preventDefault(); setActive(list, 0); }
      else if (e.key === 'End') { e.preventDefault(); setActive(list, list.length - 1); }
      else if ((e.key === 'Enter' || e.key === ' ') && opts.onActivate) {
        e.preventDefault(); opts.onActivate(list[idx]);
      }
    }
    container.addEventListener('keydown', onKey);
    init();
    return {
      destroy: function () { container.removeEventListener('keydown', onKey); },
      focusFirst: function () { var l = items(); if (l[0]) { setActive(l, 0); } }
    };
  };
})();

// ---- Context menu ----
(function () {
  var openMenu = null, trap = null;
  function closeContext() {
    if (!openMenu) return;
    openMenu.remove();
    if (trap) { trap.release(); trap = null; }
    openMenu = null;
  }
  function place(menu, x, y) {
    menu.style.left = '0px'; menu.style.top = '0px';
    document.body.appendChild(menu);
    var r = menu.getBoundingClientRect();
    var px = (x + r.width > window.innerWidth) ? x - r.width : x;
    var py = (y + r.height > window.innerHeight) ? y - r.height : y;
    menu.style.left = Math.max(4, px) + 'px';
    menu.style.top = Math.max(4, py) + 'px';
  }
  function wireSubmenus(menu) {
    menu.querySelectorAll('.ds-menu-item.has-submenu').forEach(function (item) {
      item.addEventListener('mouseenter', function () {
        item.classList.add('is-open');
        var sub = item.querySelector('.ds-menu');
        if (sub) {
          var sr = sub.getBoundingClientRect();
          if (sr.right > window.innerWidth) item.classList.add('is-flip');
          else item.classList.remove('is-flip');
        }
      });
      item.addEventListener('mouseleave', function () { item.classList.remove('is-open'); });
      item.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          item.classList.add('is-open');
          var sub = item.querySelector('.ds-menu');
          if (sub) {
            var sr = sub.getBoundingClientRect();
            if (sr.right > window.innerWidth) item.classList.add('is-flip');
            else item.classList.remove('is-flip');
          }
          var first = item.querySelector('.ds-menu .ds-menu-item'); if (first) first.focus();
        }
        if (e.key === 'ArrowLeft') { e.preventDefault(); item.classList.remove('is-open'); item.focus(); }
      });
    });
  }
  document.addEventListener('contextmenu', function (e) {
    var trigger = e.target.closest('[data-ds-context]');
    if (!trigger) return;
    var tmpl = document.getElementById(trigger.getAttribute('data-ds-context'));
    if (!tmpl) return;
    e.preventDefault();
    closeContext();
    var menu = tmpl.cloneNode(true);
    menu.removeAttribute('id');
    menu.hidden = false;
    menu.classList.add('ds-context-menu');
    place(menu, e.clientX, e.clientY);
    openMenu = menu;
    wireSubmenus(menu);
    window.dsRovingTabindex(menu, { selector: ':scope > .ds-menu-item', onActivate: function (el) {
      if (!el.classList.contains('has-submenu')) closeContext();
    }});
    trap = window.dsFocusTrap(menu);
    var firstItem = menu.querySelector('.ds-menu-item');
    if (firstItem) firstItem.focus();
  });
  document.addEventListener('click', function (e) {
    if (openMenu && !openMenu.contains(e.target)) closeContext();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeContext(); });
})();

// ---- Tree view ----
document.querySelectorAll('.ds-tree').forEach(function (tree) {
  function rows() {
    return Array.prototype.filter.call(tree.querySelectorAll('.ds-tree-row'),
      function (r) { return r.offsetParent !== null; });
  }
  function setTab(active) {
    var list = rows();
    list.forEach(function (r) { r.tabIndex = r === active ? 0 : -1; });
  }
  tree.querySelectorAll('.ds-tree-item').forEach(function (item) {
    if (!item.querySelector(':scope > ul')) item.classList.add('is-leaf');
    var row = item.querySelector(':scope > .ds-tree-row');
    if (!row) return;
    row.setAttribute('role', 'treeitem');
    if (!item.classList.contains('is-leaf')) {
      row.setAttribute('aria-expanded', item.classList.contains('is-expanded') ? 'true' : 'false');
    }
    row.addEventListener('click', function () {
      tree.querySelectorAll('.ds-tree-item.is-selected').forEach(function (s) { s.classList.remove('is-selected'); });
      item.classList.add('is-selected');
      setTab(row); row.focus();
    });
    var twisty = row.querySelector('.ds-tree-twisty');
    if (twisty) twisty.addEventListener('click', function (e) { e.stopPropagation(); toggle(item, row); });
  });
  function toggle(item, row) {
    if (item.classList.contains('is-leaf')) return;
    var open = item.classList.toggle('is-expanded');
    row.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  tree.addEventListener('keydown', function (e) {
    var list = rows();
    var row = e.target.closest('.ds-tree-row');
    if (!row) return;
    var idx = list.indexOf(row);
    var item = row.parentNode;
    if (e.key === 'ArrowDown') { e.preventDefault(); var n = list[idx + 1]; if (n) { setTab(n); n.focus(); } }
    else if (e.key === 'ArrowUp') { e.preventDefault(); var p = list[idx - 1]; if (p) { setTab(p); p.focus(); } }
    else if (e.key === 'ArrowRight') { e.preventDefault();
      if (!item.classList.contains('is-leaf') && !item.classList.contains('is-expanded')) toggle(item, row);
      else { var c = list[idx + 1]; if (c) { setTab(c); c.focus(); } } }
    else if (e.key === 'ArrowLeft') { e.preventDefault();
      if (!item.classList.contains('is-leaf') && item.classList.contains('is-expanded')) toggle(item, row);
      else { var parentItem = item.parentNode.closest('.ds-tree-item');
        if (parentItem) { var pr = parentItem.querySelector(':scope > .ds-tree-row'); setTab(pr); pr.focus(); } } }
    else if (e.key === 'Home') { e.preventDefault(); setTab(list[0]); list[0].focus(); }
    else if (e.key === 'End') { e.preventDefault(); setTab(list[list.length-1]); list[list.length-1].focus(); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); row.click(); }
  });
  tree.setAttribute('role', 'tree');
  var first = tree.querySelector('.ds-tree-row');
  if (first) first.tabIndex = 0;
});

// ---- Drag-and-drop reordering (SortableJS) ----
if (window.Sortable) {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('[data-ds-sortable]').forEach(function (list) {
    var handleSel = list.getAttribute('data-ds-sortable-handle') || null;
    window.Sortable.create(list, {
      animation: reduce ? 0 : 150,
      handle: handleSel || undefined,
      ghostClass: 'ds-drop-placeholder',
      chosenClass: 'is-dragging',
      dragClass: 'is-dragging'
    });
  });
}

// ---- Resizable split panes ----
document.querySelectorAll('[data-ds-splitter]').forEach(function (splitter) {
  var wrap = splitter.closest('.ds-resizable');
  if (!wrap) return;
  var first = wrap.querySelector('.ds-pane-first');
  if (!first) return;
  var horiz = wrap.classList.contains('is-horizontal');
  splitter.setAttribute('role', 'separator');
  splitter.setAttribute('tabindex', '0');
  splitter.setAttribute('aria-orientation', horiz ? 'horizontal' : 'vertical');
  var _setupMin = parseInt(getComputedStyle(first)[horiz ? 'minHeight' : 'minWidth'], 10) || 0;
  splitter.setAttribute('aria-valuemin', String(_setupMin));

  function setSize(px) {
    var min = parseInt(getComputedStyle(first)[horiz ? 'minHeight' : 'minWidth'], 10) || 0;
    px = Math.max(min, px);
    var maxRaw = parseInt(getComputedStyle(first)[horiz ? 'maxHeight' : 'maxWidth'], 10);
    if (isFinite(maxRaw) && maxRaw > 0) {
      px = Math.min(maxRaw, px);
      splitter.setAttribute('aria-valuemax', String(maxRaw));
    }
    first.style.flexBasis = px + 'px';
    splitter.setAttribute('aria-valuenow', String(Math.round(px)));
    wrap.dispatchEvent(new CustomEvent('ds:resize', { detail: { size: px } }));
  }
  function curSize() {
    var r = first.getBoundingClientRect();
    return horiz ? r.height : r.width;
  }
  var startPos = 0, startSize = 0;
  function onMove(e) {
    var p = horiz ? e.clientY : e.clientX;
    setSize(startSize + (p - startPos));
  }
  function onUp() {
    splitter.classList.remove('is-dragging');
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
    document.body.style.userSelect = '';
  }
  splitter.addEventListener('mousedown', function (e) {
    e.preventDefault();
    startPos = horiz ? e.clientY : e.clientX;
    startSize = curSize();
    splitter.classList.add('is-dragging');
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });
  splitter.addEventListener('dblclick', function () { first.style.flexBasis = ''; });
  splitter.addEventListener('keydown', function (e) {
    var step = 16;
    if ((horiz && e.key === 'ArrowUp') || (!horiz && e.key === 'ArrowLeft')) { e.preventDefault(); setSize(curSize() - step); }
    else if ((horiz && e.key === 'ArrowDown') || (!horiz && e.key === 'ArrowRight')) { e.preventDefault(); setSize(curSize() + step); }
  });
});
