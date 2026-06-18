/* Shared behaviour for the design mock:
   theme · font picker · sidebar collapse · ⌘K command palette · header search.
   Mirrors the intended logic of platform/web, with the desktop collapse actually
   wired up and a few mock-only conveniences. */

(function () {
  var isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

  // ===========================================================================
  //  YOUR PROFILES — edit these two URLs and the footer icons point at you.
  // ===========================================================================
  var SOCIAL = {
    github:   'https://github.com/your-username',
    linkedin: 'https://www.linkedin.com/in/your-handle'
  };

  // ---- theme (light / dark / system) ----------------------------------------
  function systemTheme() { return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; }
  function readTheme() {
    try { var t = localStorage.getItem('mock-theme'); return t === 'dark' || t === 'light' ? t : 'system'; }
    catch (e) { return 'system'; }
  }
  function applyTheme(pref) {
    document.documentElement.dataset.theme = pref === 'system' ? systemTheme() : pref;
    try { pref === 'system' ? localStorage.removeItem('mock-theme') : localStorage.setItem('mock-theme', pref); } catch (e) {}
    document.querySelectorAll('[data-theme-opt]').forEach(function (b) { b.classList.toggle('on', b.dataset.themeOpt === pref); });
  }
  applyTheme(readTheme());

  // ---- font picker ----------------------------------------------------------
  var FONTS = [
    { id: 'IBM Plex Sans',     name: 'IBM Plex',          vibe: 'Technical · default' },
    { id: 'Inter',             name: 'Inter',             vibe: 'Clean, neutral · ★★★★★' },
    { id: 'Geist',             name: 'Geist',             vibe: 'Modern, precise · ★★★★★' },
    { id: 'Sora',              name: 'Sora',              vibe: 'Friendly, distinct · ★★★★☆' },
    { id: 'DM Sans',           name: 'DM Sans',           vibe: 'Elegant, soft · ★★★★☆' },
    { id: 'Plus Jakarta Sans', name: 'Plus Jakarta Sans', vibe: 'Premium, editorial · ★★★★☆' }
  ];
  var FALLBACK = ', system-ui, -apple-system, "Segoe UI", sans-serif';
  function readFont() { try { return localStorage.getItem('mock-font') || 'IBM Plex Sans'; } catch (e) { return 'IBM Plex Sans'; } }
  function applyFont(id) {
    var stack = '"' + id + '"' + FALLBACK;
    document.documentElement.style.setProperty('--font-display', stack);
    document.documentElement.style.setProperty('--font-body', stack);
    try { localStorage.setItem('mock-font', id); } catch (e) {}
    document.querySelectorAll('[data-font-opt]').forEach(function (b) { b.classList.toggle('on', b.dataset.fontOpt === id); });
  }
  applyFont(readFont());

  // inject the picker fonts once
  (function injectFonts() {
    var l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Geist:wght@400;500;600&family=Sora:wght@400;500;600&family=DM+Sans:wght@400;500;600&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap';
    document.head.appendChild(l);
  })();

  window.MockUI = {
    applyTheme: applyTheme,
    setTheme: applyTheme,
    quickToggle: function () {
      var cur = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
      applyTheme(cur === 'dark' ? 'light' : 'dark');
    },
    setFont: applyFont
  };

  document.addEventListener('DOMContentLoaded', function () {
    // ---- footer: wire page links, drop the tagline, add social icons ---------
    document.querySelectorAll('.colophon nav').forEach(function (nav) {
      nav.querySelectorAll('a').forEach(function (a) {
        var t = a.textContent.trim();
        if (t === 'About') a.setAttribute('href', 'about.html');
        else if (t === 'Contribute') a.setAttribute('href', 'contribute.html');
        else if (t === 'RSS') a.setAttribute('href', 'rss.html');
        else if (t === 'GitHub') a.remove();   // replaced by the icon below
      });
      if (nav.querySelector('.co-social')) return;
      var s = document.createElement('span');
      s.className = 'co-social';
      s.innerHTML =
        '<a href="' + SOCIAL.github + '" target="_blank" rel="noopener" aria-label="GitHub" title="GitHub"><i class="ti ti-brand-github"></i></a>' +
        '<a href="' + SOCIAL.linkedin + '" target="_blank" rel="noopener" aria-label="LinkedIn" title="LinkedIn"><i class="ti ti-brand-linkedin"></i></a>';
      nav.appendChild(s);
    });
    document.querySelectorAll('.colophon .co-line').forEach(function (e) { e.textContent = 'Free forever.'; });

    // ---- settings popover: build the font picker into it ---------------------
    var pop = document.querySelector('[data-settings-pop]');
    if (pop && !pop.querySelector('.font-list')) {
      var soon = pop.querySelector('.settings-soon');
      var wrap = document.createElement('div');
      wrap.innerHTML =
        '<p class="settings-label" style="margin-top:0.9rem">Font</p>' +
        '<div class="font-list">' +
        FONTS.map(function (f) {
          return '<button class="font-opt" data-font-opt="' + f.id + '" style="font-family:\'' + f.id + '\',sans-serif">' +
                 '<span class="fo-name">' + f.name + '</span><span class="fo-vibe">' + f.vibe + '</span></button>';
        }).join('') +
        '</div>';
      while (wrap.firstChild) pop.insertBefore(wrap.firstChild, soon);
      if (soon) soon.textContent = 'Theme & font are saved on this device.';
      pop.querySelectorAll('[data-font-opt]').forEach(function (b) {
        b.addEventListener('click', function () { applyFont(b.dataset.fontOpt); });
      });
    }

    var settingsBtn = document.querySelector('[data-settings-btn]');
    if (settingsBtn && pop) {
      settingsBtn.addEventListener('click', function (e) { e.stopPropagation(); pop.hidden = !pop.hidden; });
      document.addEventListener('click', function (e) { if (!pop.hidden && !pop.contains(e.target) && e.target !== settingsBtn) pop.hidden = true; });
    }
    document.querySelectorAll('[data-theme-opt]').forEach(function (b) { b.addEventListener('click', function () { applyTheme(b.dataset.themeOpt); }); });
    var quick = document.querySelector('[data-theme-quick]');
    if (quick) quick.addEventListener('click', window.MockUI.quickToggle);
    applyTheme(readTheme());
    applyFont(readFont());

    // ---- header search → redirect to the search page (its real behaviour) ----
    document.querySelectorAll('.header-search, form.page-search').forEach(function (f) {
      f.addEventListener('submit', function (e) { e.preventDefault(); location.href = 'search.html'; });
    });

    // ---- sidebar collapse ----------------------------------------------------
    var shell = document.querySelector('.shell');
    var expand = document.querySelector('.sidebar-expand');
    if (shell) {
      var collapsed = false;
      try { collapsed = localStorage.getItem('mock-sidebar') === 'collapsed'; } catch (e) {}
      function setCollapsed(v) {
        collapsed = v;
        shell.classList.toggle('collapsed', v);
        if (expand) expand.classList.toggle('show', v);
        try { localStorage.setItem('mock-sidebar', v ? 'collapsed' : 'open'); } catch (e) {}
      }
      setCollapsed(collapsed);
      document.querySelectorAll('[data-sidebar-toggle]').forEach(function (b) { b.addEventListener('click', function () { setCollapsed(!collapsed); }); });
    }

    // ---- command palette (⌘K / Ctrl-K) --------------------------------------
    var INDEX = [
      { t: "Git, Explained Like You're a Human", type: 'Guide', icon: 'ti-book-2', url: 'guide.html', g: 'Guides', kw: 'git version control branches commit push pull' },
      { t: 'The Mental Model — What Git Actually Is', type: 'Phase · Git', icon: 'ti-file-text', url: 'reader.html', g: 'Guides', kw: 'commit snapshot branch sticky note head staging remote origin what is a git commit detached head' },
      { t: 'The Everyday Commands — What Each One Really Does', type: 'Phase · Git', icon: 'ti-file-text', url: 'reader.html', g: 'Guides', kw: 'status add commit log diff branch switch merge fetch pull push stash difference between fetch and pull what does git add do' },
      { t: "When It Breaks — Common 'Oh No' Moments, Calmly Fixed", type: 'Phase · Git', icon: 'ti-file-text', url: 'reader.html', g: 'Guides', kw: 'revert undo commit wrong branch merge conflict amend unstage how to revert a commit undo last git commit fix merge conflict change last commit message' },
      { t: 'Version Control', type: 'Topic', icon: 'ti-git-branch', url: 'category.html', g: 'Topics', kw: 'git version control' },
      { t: 'Programming Languages', type: 'Topic', icon: 'ti-code', url: '#', soon: 1, g: 'Topics', kw: 'languages rust go python node' },
      { t: 'DevOps & Infra', type: 'Topic', icon: 'ti-server', url: '#', soon: 1, g: 'Topics', kw: 'containers ci cd docker kubernetes deploy' },
      { t: 'Databases', type: 'Topic', icon: 'ti-database', url: '#', soon: 1, g: 'Topics', kw: 'sql postgres mysql mongodb sqlite schema query' },
      { t: 'Architecture', type: 'Topic', icon: 'ti-sitemap', url: '#', soon: 1, g: 'Topics', kw: 'systems design api rest graphql grpc' },
      { t: 'Performance', type: 'Topic', icon: 'ti-gauge', url: '#', soon: 1, g: 'Topics', kw: 'performance profiling slow latency' },
      { t: 'Security', type: 'Topic', icon: 'ti-shield-lock', url: '#', soon: 1, g: 'Topics', kw: 'security threats auth secrets' },
      { t: 'Backend Developer', type: 'Learning path · 6 steps', icon: 'ti-route', url: '#', soon: 1, g: 'Learning paths', kw: 'backend developer path language database api deployment testing' },
      { t: 'DevOps Engineer', type: 'Learning path · 4 steps', icon: 'ti-route', url: '#', soon: 1, g: 'Learning paths', kw: 'devops engineer path containers pipelines observability' },
      { t: 'About', type: 'Page', icon: 'ti-info-circle', url: 'about.html', g: 'Pages', kw: 'about mission who is this for free' },
      { t: 'Contribute', type: 'Page', icon: 'ti-pencil', url: 'contribute.html', g: 'Pages', kw: 'contribute write a guide pull request markdown help' },
      { t: 'Subscribe via RSS', type: 'Page', icon: 'ti-rss', url: 'rss.html', g: 'Pages', kw: 'rss feed subscribe follow new guides' }
    ];

    var back = document.createElement('div');
    back.className = 'cmdk-backdrop';
    back.hidden = true;
    back.innerHTML =
      '<div class="cmdk" role="dialog" aria-label="Search">' +
        '<div class="cmdk-top"><i class="ti ti-search"></i>' +
          '<input class="cmdk-input" type="text" placeholder="Search guides, topics, paths…" aria-label="Search" />' +
          '<span class="cmdk-esc">esc</span></div>' +
        '<div class="cmdk-list"></div>' +
        '<div class="cmdk-foot"><span><span class="k">↑</span><span class="k">↓</span> navigate</span>' +
          '<span><span class="k">↵</span> open</span><span><span class="k">esc</span> close</span></div>' +
      '</div>';
    document.body.appendChild(back);
    var input = back.querySelector('.cmdk-input');
    var list = back.querySelector('.cmdk-list');
    var results = [];
    var active = 0;

    function score(item, q) {
      if (!q) return 1;
      var hay = (item.t + ' ' + item.kw).toLowerCase();
      var terms = q.toLowerCase().split(/\s+/).filter(Boolean);
      return terms.every(function (term) { return hay.indexOf(term) > -1; }) ? 1 : 0;
    }
    function render(q) {
      results = INDEX.filter(function (it) { return score(it, q); });
      active = 0;
      if (!results.length) { list.innerHTML = '<div class="cmdk-empty">No matches for “' + q + '”.</div>'; return; }
      var groups = {};
      results.forEach(function (it) { (groups[it.g] = groups[it.g] || []).push(it); });
      var html = '', idx = 0;
      Object.keys(groups).forEach(function (gname) {
        html += '<div class="cmdk-group">' + gname + '</div>';
        groups[gname].forEach(function (it) {
          html += '<div class="cmdk-item' + (it.soon ? ' soon' : '') + '" data-i="' + idx + '">' +
            '<i class="ti ' + it.icon + '"></i>' +
            '<div class="ci-body"><div class="ci-title">' + it.t + '</div><div class="ci-type">' + it.type + '</div></div>' +
            (it.soon ? '<span class="cmdk-soon">soon</span>' : '') +
            '<i class="ti ti-corner-down-left ci-go"></i></div>';
          idx++;
        });
      });
      list.innerHTML = html;
      // map data-i (render order) back to results order is 1:1 since we iterate groups in order
      paintActive();
      list.querySelectorAll('.cmdk-item').forEach(function (el) {
        var i = +el.dataset.i;
        el.addEventListener('mousemove', function () { active = i; paintActive(); });
        el.addEventListener('click', function () { choose(i); });
      });
    }
    function paintActive() {
      list.querySelectorAll('.cmdk-item').forEach(function (el) { el.classList.toggle('active', +el.dataset.i === active); });
      var el = list.querySelector('.cmdk-item.active');
      if (el) el.scrollIntoView({ block: 'nearest' });
    }
    function flatResults() { // results already in group order matches data-i
      var ordered = [];
      var groups = {};
      results.forEach(function (it) { (groups[it.g] = groups[it.g] || []).push(it); });
      Object.keys(groups).forEach(function (g) { groups[g].forEach(function (it) { ordered.push(it); }); });
      return ordered;
    }
    function choose(i) {
      var it = flatResults()[i];
      if (!it) return;
      if (it.soon || it.url === '#') { close(); return; }
      location.href = it.url;
    }
    function open() { back.hidden = false; input.value = ''; render(''); setTimeout(function () { input.focus(); }, 10); }
    function close() { back.hidden = true; }

    input.addEventListener('input', function () { render(input.value.trim()); });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); active = Math.min(active + 1, results.length - 1); paintActive(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); active = Math.max(active - 1, 0); paintActive(); }
      else if (e.key === 'Enter') { e.preventDefault(); choose(active); }
      else if (e.key === 'Escape') { close(); }
    });
    back.addEventListener('click', function (e) { if (e.target === back) close(); });

    // global hotkeys
    document.addEventListener('keydown', function (e) {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); back.hidden ? open() : close(); return; }
      if (e.key === 'Escape' && !back.hidden) { close(); return; }
      if (e.key === '/' && back.hidden && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) { e.preventDefault(); open(); }
    });

    // header search hint chip → opens the palette; label reflects the platform
    document.querySelectorAll('.header-search .kbd').forEach(function (k) {
      k.textContent = isMac ? '⌘K' : 'Ctrl K';
      k.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); open(); });
    });

    // ---- reading progress bar ------------------------------------------------
    var bar = document.querySelector('.progress');
    if (bar) {
      var onScroll = function () {
        var h = document.documentElement, max = h.scrollHeight - h.clientHeight;
        bar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + '%';
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }

    // ---- resume reading: save-your-place bookmark (guide reader only) --------
    var reader = document.querySelector('.reader[data-resume]');
    if (reader) {
      var KEY = 'mock-place:' + location.pathname.split('/').pop();
      var TOP = 80; // sticky header + breathing room
      // anchor to content blocks (robust to font changes / resizing — far better
      // than a raw pixel offset, which drifts the moment the layout reflows)
      var blocks = [].slice.call(reader.querySelectorAll(':scope > p, :scope > h1, :scope > h2, :scope > h3, :scope > pre, :scope > ul, :scope > ol, :scope > blockquote'));

      function read() { try { var v = localStorage.getItem(KEY); return v ? JSON.parse(v) : null; } catch (e) { return null; } }
      function write(m) { try { m ? localStorage.setItem(KEY, JSON.stringify(m)) : localStorage.removeItem(KEY); } catch (e) {} }
      function topIndex() {
        for (var i = 0; i < blocks.length; i++) { if (blocks[i].getBoundingClientRect().bottom > TOP + 4) return i; }
        return blocks.length - 1;
      }
      function labelFor(i) {
        for (var j = i; j >= 0; j--) { var t = blocks[j].tagName; if (t === 'H1' || t === 'H2' || t === 'H3') return blocks[j].textContent.trim(); }
        return 'the beginning';
      }

      var fab = document.createElement('button');
      fab.className = 'read-fab';
      fab.type = 'button';
      fab.innerHTML = '<i class="ti ti-bookmark"></i><span class="rf-label">Save my place</span>';
      document.body.appendChild(fab);

      var ribbon = document.createElement('div');
      ribbon.className = 'read-ribbon';
      ribbon.hidden = true;
      ribbon.innerHTML = '<span class="rr-tab"><i class="ti ti-bookmark"></i></span>';
      reader.appendChild(ribbon);

      var pill = document.createElement('div');
      pill.className = 'resume-pill';
      pill.hidden = true;
      document.body.appendChild(pill);

      var toast = document.createElement('div');
      toast.className = 'read-toast';
      toast.hidden = true;
      document.body.appendChild(toast);
      var toastT;
      function showToast(msg) {
        toast.textContent = msg; toast.hidden = false;
        requestAnimationFrame(function () { toast.classList.add('show'); });
        clearTimeout(toastT);
        toastT = setTimeout(function () { toast.classList.remove('show'); setTimeout(function () { toast.hidden = true; }, 250); }, 1900);
      }
      function setMarked(on) {
        fab.classList.toggle('marked', on);
        fab.querySelector('.rf-label').textContent = on ? 'Your place is saved' : 'Save my place';
        fab.setAttribute('aria-label', on ? 'Update or clear your saved place' : 'Save your reading place');
      }
      function placeRibbon(i) {
        var el = blocks[i];
        if (!el) { ribbon.hidden = true; return; }
        ribbon.style.top = (el.offsetTop - 6) + 'px';
        ribbon.hidden = false;
      }
      function hidePill() { pill.classList.remove('show'); setTimeout(function () { pill.hidden = true; }, 250); }
      function showPill(m) {
        pill.innerHTML =
          '<i class="ti ti-bookmark"></i><div class="rp-body"><span class="rp-k">Continue reading</span>' +
          '<span class="rp-l">' + m.label + '</span></div>' +
          '<button class="rp-go" type="button">Resume</button>' +
          '<button class="rp-x" type="button" aria-label="Clear saved place">&times;</button>';
        pill.hidden = false;
        requestAnimationFrame(function () { pill.classList.add('show'); });
        pill.querySelector('.rp-go').addEventListener('click', function () { resumeTo(m.i); });
        pill.querySelector('.rp-x').addEventListener('click', clearMark);
      }
      function resumeTo(i) {
        var el = blocks[i]; if (!el) return;
        var y = el.getBoundingClientRect().top + window.scrollY - TOP;
        window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
        hidePill();
      }
      function clearMark() { write(null); ribbon.hidden = true; setMarked(false); hidePill(); showToast('Place cleared'); }

      fab.addEventListener('click', function () {
        var i = topIndex();
        var cur = read();
        if (cur && cur.i === i) { clearMark(); return; }       // tap again at the same line → clear
        var m = { i: i, label: labelFor(i) };
        write(m); placeRibbon(i); setMarked(true); hidePill();
        showToast(cur ? 'Place updated — resume here next time' : 'Place saved — resume here next time');
      });

      var saved = read();
      if (saved && saved.i < blocks.length) {
        setMarked(true); placeRibbon(saved.i);
        var r = blocks[saved.i].getBoundingClientRect();
        if (r.top > window.innerHeight * 0.6 || r.top < -20) showPill(saved); // only nudge if you'd have to scroll to reach it
        setTimeout(function () { if (!pill.hidden) hidePill(); }, 9000);
      }
      if (window.ResizeObserver) new ResizeObserver(function () { var m = read(); if (m && !ribbon.hidden) placeRibbon(m.i); }).observe(reader);
    }
  });
})();
