
(function () {
  'use strict';

  var grid = document.getElementById('commandGrid');
  if (!grid) return;

  var pillBar = document.getElementById('pillBar');
  var pillRow = document.getElementById('pillRow');
  var pillPrev = document.getElementById('pillPrev');
  var pillNext = document.getElementById('pillNext');
  var searchWrap = document.getElementById('searchWrap');
  var searchInput = document.getElementById('commandSearch');
  var searchToggle = document.getElementById('searchToggle');
  var sortSelect = document.getElementById('sortSelect');
  var resultMeta = document.getElementById('resultMeta');
  var emptyState = document.getElementById('emptyState');
  var loadMoreWrap = document.getElementById('loadMoreWrap');
  var loadMoreBtn = document.getElementById('loadMore');
  var modalOverlay = document.getElementById('modalOverlay');
  var modalBody = document.getElementById('modalBody');
  var modalClose = document.getElementById('modalClose');

  var PAGE_SIZE = 60;

  var allCommands = [];
  var activeCategory = 'all';
  var searchTerm = '';
  var sortMode = 'az';
  var shown = PAGE_SIZE;
  var lastFocusedCard = null;

  var ICONS = {
    all: '<rect x="3" y="3" width="7" height="7" rx="1.6"/><rect x="14" y="3" width="7" height="7" rx="1.6"/><rect x="3" y="14" width="7" height="7" rx="1.6"/><rect x="14" y="14" width="7" height="7" rx="1.6"/>',
    server: '<rect x="3" y="4" width="18" height="7" rx="2"/><rect x="3" y="13" width="18" height="7" rx="2"/><path d="M7 7.5h.01M7 16.5h.01"/>',
    shield: '<path d="M12 3l8 3v6c0 5-3.4 8.6-8 10-4.6-1.4-8-5-8-10V6l8-3z"/><path d="M9.2 12.2l2 2 3.6-3.8"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11.2V16M12 8h.01"/>',
    users: '<path d="M16 19v-1.4a4 4 0 00-4-4H7a4 4 0 00-4 4V19"/><circle cx="9.5" cy="7.6" r="3.4"/><path d="M17.2 11.2A3.4 3.4 0 0017 4.5"/><path d="M21 19v-1.4a4 4 0 00-3-3.8"/>',
    zap: '<path d="M13.2 2.5L4.5 14H11l-.7 7.5L19.5 10H13l.2-7.5z"/>',
    gear: '<circle cx="12" cy="12" r="3.1"/><path d="M19.2 14.6a1.5 1.5 0 00.3 1.7l.1.1a1.9 1.9 0 11-2.7 2.7l-.1-.1a1.5 1.5 0 00-2.6 1v.2a1.9 1.9 0 11-3.8 0V20a1.5 1.5 0 00-2.6-1l-.1.1a1.9 1.9 0 11-2.7-2.7l.1-.1a1.5 1.5 0 00-1-2.6H4a1.9 1.9 0 110-3.8h.1a1.5 1.5 0 001-2.6l-.1-.1a1.9 1.9 0 112.7-2.7l.1.1a1.5 1.5 0 002.6-1V4a1.9 1.9 0 113.8 0v.1a1.5 1.5 0 002.6 1l.1-.1a1.9 1.9 0 112.7 2.7l-.1.1a1.5 1.5 0 001 2.6h.2a1.9 1.9 0 110 3.8H20a1.5 1.5 0 00-.8.3z"/>',
    lock: '<rect x="4" y="10" width="16" height="11" rx="2.2"/><path d="M8 10V7a4 4 0 018 0v3"/>',
    sparkles: '<path d="M11 3.2l1.7 4.3 4.3 1.7-4.3 1.7L11 15.2 9.3 10.9 5 9.2l4.3-1.7L11 3.2z"/><path d="M18 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2z"/>',
    music: '<path d="M9 17.5V5.5l10-2v12"/><circle cx="6.6" cy="17.6" r="2.6"/><circle cx="16.6" cy="15.6" r="2.6"/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0013 0M12 18v3"/>',
    box: '<path d="M21 8l-9-5-9 5v8l9 5 9-5V8z"/><path d="M3 8l9 5 9-5M12 13v8"/>'
  };

  var CATEGORY_ICON_KEYS = {
    server: 'server',
    moderation: 'shield',
    ban: 'shield',
    information: 'info',
    info: 'info',
    roleplay: 'users',
    engagement: 'users',
    social: 'users',
    automation: 'zap',
    config: 'gear',
    configuration: 'gear',
    settings: 'gear',
    security: 'lock',
    fun: 'sparkles',
    music: 'music',
    voicemaster: 'mic',
    voice: 'mic',
    lastfm: 'music'
  };

  function categoryIconKey(category) {
    var key = String(category || '').toLowerCase().trim();
    if (CATEGORY_ICON_KEYS[key]) return CATEGORY_ICON_KEYS[key];
    if (key.indexOf('mod') === 0 || key.indexOf('ban') === 0) return 'shield';
    if (key.indexOf('music') !== -1 || key.indexOf('last') !== -1) return 'music';
    if (key.indexOf('voice') !== -1) return 'mic';
    if (key.indexOf('config') !== -1 || key.indexOf('setting') !== -1) return 'gear';
    return 'box';
  }

  function icon(key) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      (ICONS[key] || ICONS.box) + '</svg>';
  }

  function capitalize(value) {
    value = String(value || '');
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function fetchWithTimeout(url, ms) {
    var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timer = controller ? setTimeout(function () { controller.abort(); }, ms) : null;
    return fetch(url, controller ? { signal: controller.signal } : undefined)
      .then(function (res) {
        if (timer) clearTimeout(timer);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .catch(function (err) {
        if (timer) clearTimeout(timer);
        throw err;
      });
  }

  function normalise(data) {
    var list = Array.isArray(data) ? data : (data && data.commands) || [];
    return list.filter(function (cmd) { return cmd && cmd.name; }).map(function (cmd) {
      return {
        name: cmd.name,
        category: cmd.category || 'other',
        description: cmd.description || '',
        arguments: Array.isArray(cmd.arguments) ? cmd.arguments : [],
        permissions: Array.isArray(cmd.permissions) ? cmd.permissions : [],
        usage_count: typeof cmd.usage_count === 'number' ? cmd.usage_count : null
      };
    });
  }

  function loadCommands() {
    return fetchWithTimeout('/commands', 3000)
      .catch(function () { return fetch('commands.json').then(function (r) { return r.json(); }); })
      .then(function (data) { allCommands = normalise(data); })
      .catch(function () { allCommands = []; })
      .then(function () {
        buildPills();
        render();
      });
  }

  function buildPills() {
    if (!pillRow) return;

    var counts = {};
    allCommands.forEach(function (cmd) {
      counts[cmd.category] = (counts[cmd.category] || 0) + 1;
    });

    var categories = Object.keys(counts).sort(function (a, b) {
      if (counts[b] !== counts[a]) return counts[b] - counts[a];
      return a.localeCompare(b);
    });

    var markup = ['<button class="pill active" role="tab" aria-selected="true" data-category="all" type="button">' +
      icon('all') + '<span class="pill-name">all</span><span class="count">' + allCommands.length + '</span></button>'];

    categories.forEach(function (cat) {
      markup.push('<button class="pill" role="tab" aria-selected="false" data-category="' + escapeHtml(cat) + '" type="button">' +
        icon(categoryIconKey(cat)) + '<span class="pill-name">' + escapeHtml(capitalize(cat)) + '</span>' +
        '<span class="count">' + counts[cat] + '</span></button>');
    });

    pillRow.innerHTML = markup.join('');

    pillRow.querySelectorAll('.pill').forEach(function (pill) {
      pill.addEventListener('click', function () {
        activeCategory = pill.dataset.category;
        pillRow.querySelectorAll('.pill').forEach(function (p) {
          var isActive = p === pill;
          p.classList.toggle('active', isActive);
          p.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });
        render();
        scrollPillIntoView(pill);
      });
    });

    updatePillNav();
  }

  function scrollPillIntoView(pill) {
    if (!pill || !pillRow || typeof pillRow.scrollTo !== 'function') return;
    var left = pill.offsetLeft - (pillRow.clientWidth - pill.offsetWidth) / 2;
    try {
      pillRow.scrollTo({ left: Math.max(0, left), behavior: 'smooth' });
    } catch (err) {
      pillRow.scrollLeft = Math.max(0, left);
    }
  }

  function updatePillNav() {
    if (!pillBar || !pillRow) return;
    var max = pillRow.scrollWidth - pillRow.clientWidth;
    pillBar.classList.toggle('can-left', pillRow.scrollLeft > 4);
    pillBar.classList.toggle('can-right', max > 4 && pillRow.scrollLeft < max - 4);
  }

  function scrollPills(direction) {
    if (!pillRow) return;
    var step = Math.max(220, Math.round(pillRow.clientWidth * 0.7));
    var left = pillRow.scrollLeft + step * direction;
    try {
      pillRow.scrollTo({ left: left, behavior: 'smooth' });
    } catch (err) {
      pillRow.scrollLeft = left;
    }
  }

  function filteredCommands() {
    var term = searchTerm.trim().toLowerCase();
    var list = allCommands
      .filter(function (cmd) {
        return activeCategory === 'all' || cmd.category === activeCategory;
      })
      .filter(function (cmd) {
        if (!term) return true;
        var haystack = (cmd.name + ' ' + cmd.description + ' ' + cmd.category + ' ' +
          cmd.arguments.map(function (a) { return (a.name || '') + ' ' + (a.description || ''); }).join(' ')).toLowerCase();
        return haystack.indexOf(term) !== -1;
      });

    if (sortMode === 'za') {
      list.sort(function (a, b) { return b.name.localeCompare(a.name); });
    } else if (sortMode === 'category') {
      list.sort(function (a, b) {
        if (a.category !== b.category) return a.category.localeCompare(b.category);
        return a.name.localeCompare(b.name);
      });
    } else {
      list.sort(function (a, b) { return a.name.localeCompare(b.name); });
    }
    return list;
  }

  function metaRow(label, items) {
    var row = el('div', 'meta-row');
    row.appendChild(el('span', 'meta-label', label));
    var box = el('div', 'meta-chips');
    if (items.length) {
      items.forEach(function (node) { box.appendChild(node); });
    } else {
      box.appendChild(el('span', 'meta-none', 'none'));
    }
    row.appendChild(box);
    return row;
  }

  function chip(text, className) {
    return el('span', 'chip ' + className, text);
  }

  function buildCard(cmd) {
    var card = el('article', 'cmd-card');
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', 'Details for /' + cmd.name);

    var top = el('div', 'cmd-card-top');
    var name = el('h3', 'cmd-card-name');
    name.appendChild(el('span', 'slash', '/'));
    name.appendChild(document.createTextNode(cmd.name));
    top.appendChild(name);

    if (activeCategory === 'all') {
      var cat = el('span', 'cmd-card-cat', cmd.category);
      cat.title = capitalize(cmd.category);
      top.appendChild(cat);
    }

    var copy = el('button', 'copy-btn');
    copy.type = 'button';
    copy.setAttribute('aria-label', 'Copy /' + cmd.name + ' to clipboard');
    copy.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 012-2h10"/></svg>';
    copy.addEventListener('click', function (e) {
      e.stopPropagation();
      copyCommand(copy, '/' + cmd.name);
    });
    top.appendChild(copy);
    card.appendChild(top);

    card.appendChild(el('p', 'cmd-card-desc', cmd.description));

    var meta = el('div', 'cmd-card-meta');
    meta.appendChild(metaRow('arguments', cmd.arguments.map(function (a) {
      return chip(a.name, 'chip-arg');
    })));
    meta.appendChild(metaRow('permissions', cmd.permissions.map(function (p) {
      return chip(p, 'chip-perm');
    })));
    card.appendChild(meta);

    card.addEventListener('click', function () { openModal(cmd, card); });
    card.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openModal(cmd, card);
      }
    });

    return card;
  }

  function render() {
    var matches = filteredCommands();
    shown = Math.min(PAGE_SIZE, matches.length);

    if (resultMeta) {
      resultMeta.innerHTML = matches.length === allCommands.length
        ? '<strong>' + matches.length + '</strong> commands'
        : '<strong>' + matches.length + '</strong> of <strong>' + allCommands.length + '</strong> commands';
    }

    if (matches.length === 0) {
      grid.innerHTML = '';
      if (emptyState) emptyState.classList.add('show');
      if (loadMoreWrap) loadMoreWrap.hidden = true;
      return;
    }

    if (emptyState) emptyState.classList.remove('show');

    var frag = document.createDocumentFragment();
    matches.slice(0, shown).forEach(function (cmd) { frag.appendChild(buildCard(cmd)); });
    grid.innerHTML = '';
    grid.appendChild(frag);

    updateLoadMore(matches.length);
  }

  function loadMore() {
    var matches = filteredCommands();
    var batch = matches.slice(shown, shown + PAGE_SIZE);
    if (!batch.length) return;
    var frag = document.createDocumentFragment();
    batch.forEach(function (cmd) { frag.appendChild(buildCard(cmd)); });
    grid.appendChild(frag);
    shown += batch.length;
    updateLoadMore(matches.length);
  }

  function updateLoadMore(total) {
    if (!loadMoreWrap || !loadMoreBtn) return;
    if (shown >= total) {
      loadMoreWrap.hidden = true;
      return;
    }
    loadMoreWrap.hidden = false;
    loadMoreBtn.textContent = 'Show ' + Math.min(PAGE_SIZE, total - shown) + ' more of ' + (total - shown) + ' remaining';
  }

  function copyCommand(btn, text) {
    function done() {
      btn.classList.add('copied');
      setTimeout(function () { btn.classList.remove('copied'); }, 1600);
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(function () { legacyCopy(text, done); });
    } else {
      legacyCopy(text, done);
    }
  }

  function legacyCopy(text, done) {
    var area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    try { document.execCommand('copy'); done(); } catch (err) { }
    document.body.removeChild(area);
  }

  function setSearchOpen(open) {
    if (!searchWrap) return;
    searchWrap.classList.toggle('open', open);
    if (searchToggle) searchToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) {
      if (searchInput) searchInput.focus();
    } else if (searchInput && searchInput.value) {
      searchInput.value = '';
      searchTerm = '';
      render();
    }
  }

  function openModal(cmd, card) {
    if (!modalOverlay || !modalBody || !cmd) return;
    lastFocusedCard = card || null;

    var argsHtml = cmd.arguments.length
      ? cmd.arguments.map(function (a) {
          return '<div class="arg-row">' +
            '<div>' +
              '<div class="arg-name">' + escapeHtml(a.name) + '</div>' +
              '<div class="arg-desc">' + escapeHtml(a.description) + '</div>' +
            '</div>' +
            '<span class="arg-badge ' + (a.required ? 'required' : 'optional') + '">' +
              (a.required ? 'required' : 'optional') + '</span>' +
          '</div>';
        }).join('')
      : '<p class="muted-note">This command takes no arguments.</p>';

    var permsHtml = cmd.permissions.length
      ? '<div class="perm-list">' + cmd.permissions.map(function (p) {
          return '<span class="perm-chip">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">' +
              '<path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z"/></svg>' +
            escapeHtml(p) + '</span>';
        }).join('') + '</div>'
      : '<p class="muted-note">No special permissions required — anyone can use this.</p>';

    var usageHtml = cmd.usage_count !== null && cmd.usage_count > 0
      ? '<div class="modal-section"><h4>usage</h4><p class="muted-note">' +
        cmd.usage_count.toLocaleString() + ' uses</p></div>'
      : '';

    modalBody.innerHTML =
      '<span class="cat-tag">' + escapeHtml(cmd.category) + '</span>' +
      '<div class="cmd-name" id="modalTitle"><span class="slash">/</span>' + escapeHtml(cmd.name) + '</div>' +
      '<p class="cmd-desc">' + escapeHtml(cmd.description) + '</p>' +
      usageHtml +
      '<div class="modal-section"><h4>arguments</h4>' + argsHtml + '</div>' +
      '<div class="modal-section"><h4>permissions required</h4>' + permsHtml + '</div>';

    modalOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    if (modalClose) modalClose.focus();
  }

  function closeModal() {
    if (!modalOverlay) return;
    modalOverlay.classList.remove('open');
    document.body.style.overflow = '';
    if (lastFocusedCard && document.contains(lastFocusedCard)) lastFocusedCard.focus();
  }

  if (modalClose) modalClose.addEventListener('click', closeModal);
  if (modalOverlay) modalOverlay.addEventListener('click', function (e) {
    if (e.target === modalOverlay) closeModal();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (searchWrap && searchWrap.classList.contains('open')) {
        setSearchOpen(false);
        if (searchToggle) searchToggle.focus();
        return;
      }
      closeModal();
    }
  });

  if (searchToggle) {
    searchToggle.addEventListener('click', function () {
      setSearchOpen(!searchWrap.classList.contains('open'));
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', function () {
      searchTerm = searchInput.value;
      render();
    });
    searchInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') e.preventDefault();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', function () {
      sortMode = sortSelect.value;
      render();
    });
  }

  if (loadMoreBtn) loadMoreBtn.addEventListener('click', loadMore);
  if (pillPrev) pillPrev.addEventListener('click', function () { scrollPills(-1); });
  if (pillNext) pillNext.addEventListener('click', function () { scrollPills(1); });
  if (pillRow) pillRow.addEventListener('scroll', updatePillNav, { passive: true });
  window.addEventListener('resize', updatePillNav);

  loadCommands();
})();
