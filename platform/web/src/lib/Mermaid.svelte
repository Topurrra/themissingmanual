<script>
  import { onMount, tick } from 'svelte';

  // Renders fenced ```mermaid code blocks inside the .reader article as themed SVG.
  //
  // comrak passes mermaid blocks through untouched as
  //   <pre><code class="language-mermaid">…source…</code></pre>
  // We find those after mount, lazy-load mermaid@11 (only when a diagram is on the
  // page, so it stays out of the main bundle), and swap each <pre> for a themed,
  // responsive, tap-to-zoom SVG figure.
  //
  // This component is mounted INSIDE the phase page's {#key …} block, so it
  // re-mounts (and re-renders diagrams) on every phase navigation. tick() ensures
  // the new {@html phase.html} is in the DOM before we look for blocks.
  //
  // Theme: mermaid needs concrete colors, so we read the COMPUTED design tokens at
  // render time and re-render on data-theme changes (owned by Appearance.svelte).

  onMount(() => {
    let destroyed = false;
    let mermaid = null;
    let renderSeq = 0; // bumps on each (re)render pass so stale async work no-ops
    // One record per diagram: the <figure> we own + its original source + a
    // restore() that puts the original <pre> back (used as the error fallback).
    let diagrams = [];
    let themeObserver = null;
    let pendingTheme = null;

    const readTokens = () => {
      const cs = getComputedStyle(document.documentElement);
      const v = (name, fallback) => (cs.getPropertyValue(name).trim() || fallback);
      return {
        bg: v('--bg', '#ffffff'),
        surface: v('--surface', '#f4f4f5'),
        raise: v('--raise', '#ffffff'),
        ink: v('--ink', '#131316'),
        body: v('--body', '#2c2c33'),
        line: v('--line', '#e8e8ec'),
        accent: v('--accent', '#0e7c86'),
        accentStrong: v('--accent-strong', '#0a5f67')
      };
    };

    const themeVariablesFor = (t) => ({
      fontFamily: 'IBM Plex Sans, system-ui, -apple-system, "Segoe UI", sans-serif',
      // Nodes
      primaryColor: t.raise,
      primaryBorderColor: t.accent,
      primaryTextColor: t.ink,
      secondaryColor: t.surface,
      secondaryBorderColor: t.line,
      secondaryTextColor: t.ink,
      tertiaryColor: t.surface,
      tertiaryBorderColor: t.line,
      tertiaryTextColor: t.ink,
      // Edges / arrows / labels
      lineColor: t.accentStrong,
      textColor: t.body,
      // Clusters / subgraphs
      clusterBkg: t.surface,
      clusterBorder: t.line,
      // Notes (sequence/etc.)
      noteBkgColor: t.surface,
      noteBorderColor: t.line,
      noteTextColor: t.ink,
      // General surfaces
      mainBkg: t.raise,
      background: t.bg,
      titleColor: t.ink,
      edgeLabelBackground: t.bg
    });

    const initMermaid = (t) => {
      mermaid.initialize({
        startOnLoad: false,
        theme: 'base',
        securityLevel: 'strict',
        fontFamily: 'IBM Plex Sans, system-ui, -apple-system, "Segoe UI", sans-serif',
        themeVariables: themeVariablesFor(t)
      });
    };

    // Render (or re-render) all collected diagram sources with the current theme.
    const renderAll = async () => {
      if (!mermaid || !diagrams.length) return;
      const seq = ++renderSeq;
      initMermaid(readTokens());

      for (let i = 0; i < diagrams.length; i++) {
        const d = diagrams[i];
        const id = `mmd-${Date.now().toString(36)}-${i}-${seq}`;
        try {
          const { svg } = await mermaid.render(id, d.source);
          if (destroyed || seq !== renderSeq) return; // superseded or torn down
          d.figure.innerHTML = svg;
          const el = d.figure.querySelector('svg');
          if (el) {
            // Responsive: let CSS cap the width; drop hardcoded px width/height.
            el.removeAttribute('width');
            el.removeAttribute('height');
            el.style.maxWidth = '100%';
            el.style.height = 'auto';
          }
          d.figure.dataset.ready = 'true';
        } catch (e) {
          if (destroyed || seq !== renderSeq) return;
          // Fallback: restore the original ```mermaid source block, don't blank it.
          d.restore();
          d.failed = true;
        }
      }
    };

    const onThemeChange = () => {
      // Re-render with the new palette. Coalesce rapid toggles via rAF.
      if (pendingTheme) return;
      pendingTheme = requestAnimationFrame(() => {
        pendingTheme = null;
        renderAll();
      });
    };

    const init = async () => {
      await tick(); // wait for {@html phase.html} to be in the DOM
      if (destroyed) return;

      const reader = document.querySelector('.reader');
      if (!reader) return;

      const codes = [...reader.querySelectorAll('code.language-mermaid')];
      if (!codes.length) return; // nothing to render — never load mermaid

      // Replace each <pre> with a hidden figure placeholder up front so the raw
      // source never flashes. Keep the original source + a restore() for fallback.
      for (const code of codes) {
        const pre = code.closest('pre');
        if (!pre || !pre.parentNode) continue;
        const source = code.textContent; // .textContent is entity-decoded already

        const figure = document.createElement('figure');
        figure.className = 'mmd';
        figure.setAttribute('role', 'img');
        figure.setAttribute('aria-label', 'Diagram');

        const original = pre; // keep the node so restore() can re-insert it
        const parent = pre.parentNode;
        const next = pre.nextSibling;
        parent.replaceChild(figure, pre);

        diagrams.push({
          figure,
          source,
          failed: false,
          restore: () => {
            if (figure.parentNode) {
              figure.parentNode.replaceChild(original, figure);
            } else if (parent) {
              parent.insertBefore(original, next);
            }
          }
        });
      }

      if (!diagrams.length) return;

      try {
        mermaid = (await import('mermaid')).default;
      } catch (e) {
        // Couldn't load the library at all — restore every original block.
        diagrams.forEach((d) => d.restore());
        diagrams = [];
        return;
      }
      if (destroyed) return;

      await renderAll();
      if (destroyed) return;

      // Re-theme when the site theme flips (Appearance.svelte sets data-theme).
      themeObserver = new MutationObserver((muts) => {
        if (muts.some((m) => m.attributeName === 'data-theme')) onThemeChange();
      });
      themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme']
      });

      // Tap/click any diagram to open a zoom lightbox (wide flowcharts on mobile).
      reader.addEventListener('click', onFigureClick);
    };

    // --- zoom lightbox -------------------------------------------------------
    let lightbox = null;
    const openLightbox = (figure) => {
      const svg = figure.querySelector('svg');
      if (!svg) return;
      closeLightbox();
      lightbox = document.createElement('div');
      lightbox.className = 'mmd-lightbox';
      lightbox.setAttribute('role', 'dialog');
      lightbox.setAttribute('aria-label', 'Diagram zoom');
      const inner = document.createElement('div');
      inner.className = 'mmd-lightbox-inner';
      inner.innerHTML = svg.outerHTML;
      const close = document.createElement('button');
      close.type = 'button';
      close.className = 'mmd-lightbox-close';
      close.setAttribute('aria-label', 'Close');
      close.innerHTML = '&times;';
      lightbox.appendChild(close);
      lightbox.appendChild(inner);
      document.body.appendChild(lightbox);
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(() => lightbox && lightbox.classList.add('show'));
    };
    const closeLightbox = () => {
      if (!lightbox) return;
      lightbox.remove();
      lightbox = null;
      document.body.style.overflow = '';
    };
    const onFigureClick = (e) => {
      const fig = e.target.closest && e.target.closest('figure.mmd[data-ready="true"]');
      if (fig) openLightbox(fig);
    };
    const onLightboxClickOrKey = (e) => {
      if (!lightbox) return;
      if (e.type === 'keydown' && e.key === 'Escape') { closeLightbox(); return; }
      if (e.type !== 'click') return;
      // Close on the X button or on a backdrop click (outside the inner panel).
      if (e.target.closest && e.target.closest('.mmd-lightbox-close')) { closeLightbox(); return; }
      if (e.target === lightbox) closeLightbox();
    };
    window.addEventListener('keydown', onLightboxClickOrKey);
    document.addEventListener('click', onLightboxClickOrKey);

    init();

    return () => {
      destroyed = true;
      renderSeq++;
      if (themeObserver) themeObserver.disconnect();
      if (pendingTheme) cancelAnimationFrame(pendingTheme);
      window.removeEventListener('keydown', onLightboxClickOrKey);
      document.removeEventListener('click', onLightboxClickOrKey);
      const reader = document.querySelector('.reader');
      if (reader) reader.removeEventListener('click', onFigureClick);
      closeLightbox();
      // Leave rendered figures in place; the {#key} swap rebuilds .reader anyway.
      diagrams = [];
    };
  });
</script>

<!-- Styles are global-on-purpose: the .mmd figures live inside {@html} content in
     .reader (not in this component's markup), and the lightbox is appended to
     <body>. Svelte :global() keeps them in this component file, off app.css. -->
<style>
  :global(figure.mmd) {
    margin: 1.6rem 0;
    /* No-flash: stay invisible (but laid out) until the SVG is ready. */
    visibility: hidden;
    display: flex;
    justify-content: center;
    /* Wide diagrams: scroll horizontally instead of overflowing the column. */
    overflow-x: auto;
    background: var(--raise);
    border: 1px solid var(--line);
    border-radius: 12px;
    padding: 1.2rem 1rem;
  }
  :global(figure.mmd[data-ready="true"]) {
    visibility: visible;
    cursor: zoom-in;
  }
  :global(figure.mmd svg) {
    max-width: 100%;
    height: auto;
    display: block;
  }

  /* Zoom lightbox — appended to <body>. */
  :global(.mmd-lightbox) {
    position: fixed;
    inset: 0;
    z-index: 200;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
    background: color-mix(in srgb, var(--bg) 78%, transparent);
    backdrop-filter: blur(4px);
    opacity: 0;
    transition: opacity 0.18s var(--ease, ease);
  }
  :global(.mmd-lightbox.show) { opacity: 1; }
  :global(.mmd-lightbox-inner) {
    max-width: 96vw;
    max-height: 90vh;
    overflow: auto;
    background: var(--raise);
    border: 1px solid var(--line);
    border-radius: 14px;
    padding: 1.5rem;
    box-shadow: var(--shadow-pop, 0 16px 48px -12px rgba(0, 0, 0, 0.4));
  }
  :global(.mmd-lightbox-inner svg) {
    /* In the lightbox let the diagram render at full natural size so wide
       flowcharts are legible; the container scrolls. */
    width: auto;
    height: auto;
    max-width: none;
    display: block;
  }
  :global(.mmd-lightbox-close) {
    position: absolute;
    top: 1rem;
    right: 1.1rem;
    width: 40px;
    height: 40px;
    font-size: 1.6rem;
    line-height: 1;
    border-radius: 10px;
    border: 1px solid var(--line);
    background: var(--raise);
    color: var(--ink);
    cursor: pointer;
  }
  :global(.mmd-lightbox-close:hover) { border-color: var(--accent); color: var(--accent); }
</style>
