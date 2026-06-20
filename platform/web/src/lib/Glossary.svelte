<script>
  import { onMount, tick } from 'svelte';
  import glossary from '$lib/glossary.json';

  // Hover/focus definitions inside the current guide's .reader. Wraps the FIRST
  // occurrence of each known term (skipping code, links and headings) and shows a
  // shared tooltip. All DOM is created on mount and torn down on destroy, so it
  // re-runs cleanly on each phase (the page mounts this inside a {#key} block).
  onMount(() => {
    let destroyed = false;
    const cleanup = [];
    const on = (t, ev, fn, o) => { t.addEventListener(ev, fn, o); cleanup.push(() => t.removeEventListener(ev, fn, o)); };

    const init = async () => {
      await tick();
      if (destroyed) return;
      const reader = document.querySelector('.reader');
      if (!reader || !glossary.length) return;

      // Inject styling once (kept simple + global so dynamically-created nodes match).
      if (!document.getElementById('gloss-style')) {
        const st = document.createElement('style');
        st.id = 'gloss-style';
        st.textContent = `
          .gloss { border-bottom: 1px dotted var(--accent); cursor: help; }
          .gloss:hover, .gloss:focus { background: var(--accent-tint); outline: none; border-radius: 3px; }
          .gloss-tip { position: fixed; z-index: 60; max-width: 320px; background: var(--raise);
            border: 1px solid var(--line); border-radius: 12px; padding: 0.8rem 0.9rem;
            box-shadow: var(--shadow-pop); font-size: 0.9rem; line-height: 1.55; }
          .gloss-tip[hidden] { display: none; }
          .gloss-tip strong { display: block; font-family: var(--font-display); color: var(--ink); margin-bottom: 0.3rem; }
          .gloss-tip p { margin: 0 0 0.5rem; color: var(--body); }
          .gloss-tip a { font-family: var(--font-mono); font-size: 0.72rem; color: var(--accent); }`;
        document.head.appendChild(st);
      }

      const byLc = new Map(glossary.map((e) => [e.term.toLowerCase(), e]));
      const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const terms = glossary.map((e) => e.term).sort((a, b) => b.length - a.length);
      let re;
      try {
        re = new RegExp('(?<![\\w-])(' + terms.map(esc).join('|') + ')(?![\\w-])', 'gi');
      } catch (e) {
        re = new RegExp('\\b(' + terms.map(esc).join('|') + ')\\b', 'gi'); // older engines: no lookbehind
      }

      const SKIP = new Set(['CODE', 'PRE', 'A', 'H1', 'H2', 'H3', 'H4', 'BUTTON']);
      const walker = document.createTreeWalker(reader, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
          if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
          let p = node.parentElement;
          while (p && p !== reader) {
            if (SKIP.has(p.tagName) || p.classList.contains('phasenav') || p.classList.contains('gloss'))
              return NodeFilter.FILTER_REJECT;
            p = p.parentElement;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      });
      const nodes = [];
      while (walker.nextNode()) nodes.push(walker.currentNode);

      const used = new Set();
      for (const node of nodes) {
        let cur = node;
        let text = cur.nodeValue;
        re.lastIndex = 0;
        let m;
        while ((m = re.exec(text)) !== null) {
          const lc = m[1].toLowerCase();
          if (used.has(lc) || !byLc.has(lc)) continue;
          used.add(lc);
          const after = cur.splitText(m.index);
          const tail = after.splitText(m[1].length);
          const span = document.createElement('span');
          span.className = 'gloss';
          span.tabIndex = 0;
          span.dataset.term = lc;
          span.textContent = after.nodeValue;
          after.parentNode.replaceChild(span, after);
          cur = tail;
          text = cur.nodeValue;
          re.lastIndex = 0;
        }
      }

      // Shared tooltip.
      const tip = document.createElement('div');
      tip.className = 'gloss-tip';
      tip.hidden = true;
      document.body.appendChild(tip);
      cleanup.push(() => tip.remove());
      let hideTimer = null;
      const clearHide = () => { if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; } };
      const hide = () => { clearHide(); tip.hidden = true; };
      const scheduleHide = () => { clearHide(); hideTimer = setTimeout(() => (tip.hidden = true), 180); };

      const show = (span) => {
        const e = byLc.get(span.dataset.term);
        if (!e) return;
        clearHide();
        tip.innerHTML = '';
        const h = document.createElement('strong'); h.textContent = e.term;
        const p = document.createElement('p'); p.textContent = e.def;
        const a = document.createElement('a'); a.href = '/glossary#' + e.slug; a.textContent = 'Open in glossary →';
        tip.append(h, p, a);
        tip.hidden = false;
        const r = span.getBoundingClientRect();
        const tr = tip.getBoundingClientRect();
        let left = r.left;
        let top = r.bottom + 8;
        if (left + tr.width > window.innerWidth - 12) left = window.innerWidth - 12 - tr.width;
        if (top + tr.height > window.innerHeight - 12) top = r.top - 8 - tr.height;
        tip.style.left = Math.max(12, left) + 'px';
        tip.style.top = Math.max(12, top) + 'px';
      };

      on(reader, 'mouseover', (ev) => { const g = ev.target.closest && ev.target.closest('.gloss'); if (g) show(g); });
      on(reader, 'mouseout', (ev) => { if (ev.target.closest && ev.target.closest('.gloss')) scheduleHide(); });
      on(reader, 'focusin', (ev) => { const g = ev.target.closest && ev.target.closest('.gloss'); if (g) show(g); });
      on(reader, 'focusout', (ev) => { if (ev.target.closest && ev.target.closest('.gloss')) scheduleHide(); });
      on(tip, 'mouseenter', clearHide);
      on(tip, 'mouseleave', hide);
      on(window, 'scroll', hide, { passive: true });
    };

    init();
    return () => { destroyed = true; cleanup.forEach((fn) => fn()); };
  });
</script>
