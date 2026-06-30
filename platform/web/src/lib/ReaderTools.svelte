<script>
  import { onMount, tick } from 'svelte';

  // Reading-progress hairline + "save my place" resume-reading, scoped to the
  // .reader article on the current page. Anchors the mark to a content block so
  // it survives font/zoom changes. All DOM is created on mount (client only).
  // Keyed on phase identity by the page, so this re-mounts on each navigation;
  // tick() ensures the new {@html phase.html} is in the DOM before we snapshot.
  onMount(() => {
    // Cleanup state lives out here so the synchronous destroy callback below can
    // tear down everything init() creates - even though init() runs after tick().
    // (onMount only registers a destroy callback when it returns one synchronously;
    // an async onMount returns a Promise and its cleanup would be silently ignored.)
    let destroyed = false;
    const cleanup = [];
    const made = [];

    const init = async () => {
    await tick();
    if (destroyed) return;
    const reader = document.querySelector('.reader');
    if (!reader) return;
    reader.style.position = 'relative';

    const KEY = 'tmm-place:' + location.pathname;
    const TOP = 80;
    const on = (t, ev, fn, o) => { t.addEventListener(ev, fn, o); cleanup.push(() => t.removeEventListener(ev, fn, o)); };
    const make = (tag, cls, parent) => { const e = document.createElement(tag); if (cls) e.className = cls; (parent || document.body).appendChild(e); made.push(e); return e; };

    const blocks = [...reader.querySelectorAll(':scope > p, :scope > h1, :scope > h2, :scope > h3, :scope > pre, :scope > ul, :scope > ol, :scope > blockquote')];

    // progress bar
    const bar = make('div', 'progress');
    const onScroll = () => {
      const h = document.documentElement, max = h.scrollHeight - h.clientHeight;
      bar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + '%';
    };
    on(window, 'scroll', onScroll, { passive: true });
    onScroll();

    if (!blocks.length) return;

    const read = () => { try { const v = localStorage.getItem(KEY); return v ? JSON.parse(v) : null; } catch (e) { return null; } };
    const write = (m) => { try { m ? localStorage.setItem(KEY, JSON.stringify(m)) : localStorage.removeItem(KEY); } catch (e) {} };
    const topIndex = () => { for (let i = 0; i < blocks.length; i++) if (blocks[i].getBoundingClientRect().bottom > TOP + 4) return i; return blocks.length - 1; };
    const labelFor = (i) => { for (let j = i; j >= 0; j--) { const t = blocks[j].tagName; if (t === 'H1' || t === 'H2' || t === 'H3') return blocks[j].textContent.trim(); } return 'the beginning'; };

    const fab = make('button', 'read-fab');
    fab.type = 'button';
    fab.innerHTML = '<i class="ti ti-bookmark"></i><span class="rf-label">Save my place</span>';

    const ribbon = make('div', 'read-ribbon', reader);
    ribbon.hidden = true;
    ribbon.innerHTML = '<span class="rr-tab"><i class="ti ti-bookmark"></i></span>';

    const pill = make('div', 'resume-pill');
    pill.hidden = true;

    const toast = make('div', 'read-toast');
    toast.hidden = true;
    let toastT;
    const showToast = (msg) => {
      toast.textContent = msg; toast.hidden = false;
      requestAnimationFrame(() => toast.classList.add('show'));
      clearTimeout(toastT);
      toastT = setTimeout(() => { toast.classList.remove('show'); setTimeout(() => (toast.hidden = true), 250); }, 1900);
    };
    const setMarked = (v) => {
      fab.classList.toggle('marked', v);
      fab.querySelector('.rf-label').textContent = v ? 'Your place is saved' : 'Save my place';
      fab.setAttribute('aria-label', v ? 'Update or clear your saved place' : 'Save your reading place');
    };
    const placeRibbon = (i) => { const el = blocks[i]; if (!el) { ribbon.hidden = true; return; } ribbon.style.top = (el.offsetTop - 6) + 'px'; ribbon.hidden = false; };
    const hidePill = () => { pill.classList.remove('show'); setTimeout(() => (pill.hidden = true), 250); };
    const resumeTo = (i) => { const el = blocks[i]; if (!el) return; const y = el.getBoundingClientRect().top + window.scrollY - TOP; window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' }); hidePill(); };
    const clearMark = () => { write(null); ribbon.hidden = true; setMarked(false); hidePill(); showToast('Place cleared'); };
    const showPill = (m) => {
      pill.innerHTML =
        '<i class="ti ti-bookmark"></i><div class="rp-body"><span class="rp-k">Continue reading</span>' +
        '<span class="rp-l"></span></div><button class="rp-go" type="button">Resume</button>' +
        '<button class="rp-x" type="button" aria-label="Clear saved place">&times;</button>';
      pill.querySelector('.rp-l').textContent = m.label;
      pill.hidden = false;
      requestAnimationFrame(() => pill.classList.add('show'));
      on(pill.querySelector('.rp-go'), 'click', () => resumeTo(m.i));
      on(pill.querySelector('.rp-x'), 'click', clearMark);
    };

    on(fab, 'click', () => {
      const i = topIndex();
      const cur = read();
      if (cur && cur.i === i) { clearMark(); return; }
      const m = { i, label: labelFor(i) };
      write(m); placeRibbon(i); setMarked(true); hidePill();
      showToast(cur ? 'Place updated - resume here next time' : 'Place saved - resume here next time');
    });

    const saved = read();
    if (saved && saved.i < blocks.length) {
      setMarked(true); placeRibbon(saved.i);
      const r = blocks[saved.i].getBoundingClientRect();
      if (r.top > window.innerHeight * 0.6 || r.top < -20) showPill(saved);
      setTimeout(() => { if (!pill.hidden) hidePill(); }, 9000);
    }
    if (window.ResizeObserver) {
      const ro = new ResizeObserver(() => { const m = read(); if (m && !ribbon.hidden) placeRibbon(m.i); });
      ro.observe(reader);
      cleanup.push(() => ro.disconnect());
    }
    };

    init();

    // Synchronous destroy callback: runs on the {#key} swap, tearing down
    // listeners/observers and removing the FAB/ribbon/pill so each navigation
    // leaves exactly one set of tools.
    return () => {
      destroyed = true;
      cleanup.forEach((f) => f());
      made.forEach((e) => e.remove());
    };
  });
</script>
