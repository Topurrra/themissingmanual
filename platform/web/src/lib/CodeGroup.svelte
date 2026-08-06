<script>
  import { onMount, tick } from 'svelte';

  // Multi-language code viewer: the SAME algorithm shown side by side across
  // languages, as tabs. Authors mark a run of ordinary fenced code blocks with
  // sentinel paragraphs:
  //
  //   [[codegroup Binary Search]]
  //
  //   ```python
  //   ...
  //   ```
  //
  //   ```javascript
  //   ...
  //   ```
  //
  //   [[/codegroup]]
  //
  // The server already highlights each fence (syntect -> tok-* spans), so we do a
  // pure DOM rewrap: find the `[[codegroup …]]` marker paragraph, gather the
  // following <pre> siblings until `[[/codegroup]]`, and move them into one tabbed
  // figure. No CodeMirror, no runtime - Python/JS/TS run via the separate runnable
  // fences above; the read-only extras (Java, C++, Go, Rust) are just highlighted.
  //
  // Mounted inside the phase page's {#key} block, so it re-scans on every phase
  // nav. It only mutates DOM that {@html phase.html} re-renders fresh per phase, so
  // no restore is needed (same contract as RunnableCode / Playgrounds).

  const LABELS = {
    python: 'Python', py: 'Python',
    javascript: 'JavaScript', js: 'JavaScript',
    typescript: 'TypeScript', ts: 'TypeScript',
    java: 'Java', kotlin: 'Kotlin',
    cpp: 'C++', 'c++': 'C++', c: 'C', csharp: 'C#', cs: 'C#',
    go: 'Go', rust: 'Rust', ruby: 'Ruby', rb: 'Ruby',
    php: 'PHP', swift: 'Swift', sql: 'SQL'
  };
  const label = (lang) => LABELS[lang] || (lang ? lang[0].toUpperCase() + lang.slice(1) : 'Code');

  const OPEN = /^\[\[\s*codegroup\b(.*?)\]\]$/i;
  const CLOSE = /^\[\[\s*\/\s*codegroup\s*\]\]$/i;

  const langOf = (pre) => {
    const code = pre.querySelector('code[class*="language-"]');
    if (!code) return '';
    const cls = [...code.classList].find((c) => c.startsWith('language-'));
    return cls ? cls.slice('language-'.length) : '';
  };

  onMount(() => {
    let destroyed = false;

    const build = (marker, title) => {
      // Gather the highlighted <pre> blocks between the open and close markers.
      const panes = [];
      let close = null;
      let el = marker.nextElementSibling;
      while (el) {
        const txt = (el.textContent || '').trim();
        if (el.tagName === 'P' && CLOSE.test(txt)) { close = el; break; }
        if (el.tagName === 'PRE') panes.push(el);
        else if (el.tagName !== 'P' || txt !== '') break; // stop at unexpected content
        el = el.nextElementSibling;
      }
      if (panes.length < 2) return; // not a real group - leave the markup as-is

      const gid = 'cg-' + Math.round(marker.getBoundingClientRect().top + panes.length * 97) + '-' + panes.length;

      const fig = document.createElement('figure');
      fig.className = 'cg-group';
      fig.setAttribute('role', 'group');
      if (title) fig.setAttribute('aria-label', `${title} across languages`);

      const bar = document.createElement('div');
      bar.className = 'cg-bar';
      const tabs = document.createElement('div');
      tabs.className = 'cg-tabs';
      tabs.setAttribute('role', 'tablist');
      if (title) tabs.setAttribute('aria-label', title);

      const copy = document.createElement('button');
      copy.type = 'button';
      copy.className = 'cg-copy';
      copy.title = 'Copy code';
      copy.setAttribute('aria-label', 'Copy code');
      copy.innerHTML = '<i class="ti ti-copy"></i>';

      bar.append(tabs, copy);

      const paneWrap = document.createElement('div');
      paneWrap.className = 'cg-panes';

      const tabEls = [];
      const paneEls = [];

      panes.forEach((pre, i) => {
        const lang = langOf(pre);
        const tabId = `${gid}-t${i}`;
        const panelId = `${gid}-p${i}`;

        const tab = document.createElement('button');
        tab.type = 'button';
        tab.className = 'cg-tab' + (i === 0 ? ' is-active' : '');
        tab.textContent = label(lang);
        tab.id = tabId;
        tab.setAttribute('role', 'tab');
        tab.setAttribute('aria-controls', panelId);
        tab.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
        tab.tabIndex = i === 0 ? 0 : -1;
        tabs.appendChild(tab);
        tabEls.push(tab);

        const pane = document.createElement('div');
        pane.className = 'cg-pane';
        pane.id = panelId;
        pane.setAttribute('role', 'tabpanel');
        pane.setAttribute('aria-labelledby', tabId);
        pane.hidden = i !== 0;
        pane.appendChild(pre); // move the already-highlighted <pre> in
        paneWrap.appendChild(pane);
        paneEls.push(pane);
      });

      let active = 0;
      const select = (i, focus) => {
        active = i;
        tabEls.forEach((t, j) => {
          const on = j === i;
          t.classList.toggle('is-active', on);
          t.setAttribute('aria-selected', on ? 'true' : 'false');
          t.tabIndex = on ? 0 : -1;
          paneEls[j].hidden = !on;
        });
        if (focus) tabEls[i].focus();
      };

      tabEls.forEach((tab, i) => {
        tab.addEventListener('click', () => select(i));
        tab.addEventListener('keydown', (e) => {
          if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
            e.preventDefault();
            const dir = e.key === 'ArrowRight' ? 1 : -1;
            select((i + dir + tabEls.length) % tabEls.length, true);
          }
        });
      });

      copy.addEventListener('click', async () => {
        const pre = paneEls[active].querySelector('pre');
        const text = (pre ? pre.textContent : '').replace(/\n$/, '');
        try {
          await navigator.clipboard.writeText(text);
          copy.classList.add('copied');
          setTimeout(() => copy.classList.remove('copied'), 1200);
        } catch (e) {
          /* clipboard blocked - no-op */
        }
      });

      fig.append(bar, paneWrap);
      marker.replaceWith(fig);
      if (close) close.remove();
    };

    const init = async () => {
      await tick(); // wait for {@html phase.html} to land
      if (destroyed) return;
      const reader = document.querySelector('.reader');
      if (!reader) return;

      // Snapshot markers first (build() mutates the sibling chain as it runs).
      const markers = [...reader.querySelectorAll('p')].filter((p) => OPEN.test((p.textContent || '').trim()));
      for (const marker of markers) {
        if (destroyed) break;
        const m = OPEN.exec((marker.textContent || '').trim());
        build(marker, m ? m[1].trim() : '');
      }
    };
    init();

    return () => { destroyed = true; };
  });
</script>

<!-- Global-on-purpose: the .cg-group figures live inside {@html} .reader content,
     built imperatively above, not in this component's own markup. -->
<style>
  :global(figure.cg-group) {
    margin: 1.6rem 0;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--code-bg);
    overflow: hidden;
  }

  /* The bar sits on the always-dark code surface, so all its chrome is keyed to
     the code palette (--code-fg on --code-bg), NOT the site-theme text vars.
     Using --faint/--muted here made the inactive tabs vanish on the dark bar in
     several themes (they are grays tuned for the light page background). */
  :global(.cg-group .cg-bar) {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.6rem;
    padding: 0.35rem 0.4rem 0 0.4rem;
    border-bottom: 1px solid color-mix(in srgb, var(--code-fg) 15%, transparent);
    background: color-mix(in srgb, var(--code-bg) 86%, var(--code-fg) 14%);
  }
  :global(.cg-group .cg-tabs) {
    display: flex;
    gap: 0.15rem;
    flex-wrap: wrap;
  }
  :global(.cg-group .cg-tab) {
    font-family: var(--font-mono);
    font-size: 0.72rem;
    letter-spacing: 0.02em;
    color: color-mix(in srgb, var(--code-fg) 60%, transparent);
    background: none;
    border: 1px solid transparent;
    border-bottom: none;
    border-radius: 8px 8px 0 0;
    padding: 0.34rem 0.7rem;
    cursor: pointer;
    transition: color 0.15s var(--ease), background 0.15s var(--ease);
  }
  :global(.cg-group .cg-tab:hover) {
    color: color-mix(in srgb, var(--code-fg) 88%, transparent);
  }
  :global(.cg-group .cg-tab.is-active) {
    color: var(--code-fg);
    background: var(--code-bg);
    border-color: color-mix(in srgb, var(--code-fg) 16%, transparent);
    /* pull the active tab down 1px so it merges into the panel below the bar */
    margin-bottom: -1px;
  }
  :global(.cg-group .cg-tab:focus-visible) {
    outline: 2px solid var(--accent);
    outline-offset: -2px;
  }

  :global(.cg-group .cg-copy) {
    display: inline-flex;
    align-items: center;
    color: color-mix(in srgb, var(--code-fg) 55%, transparent);
    background: none;
    border: none;
    border-radius: 8px;
    padding: 0.3rem 0.4rem;
    margin: 0 0.1rem 0.3rem 0;
    cursor: pointer;
    transition: color 0.15s var(--ease);
  }
  :global(.cg-group .cg-copy i) {
    font-size: 1rem;
    line-height: 1;
  }
  :global(.cg-group .cg-copy:hover) {
    color: var(--code-fg);
  }
  :global(.cg-group .cg-copy.copied) {
    color: var(--code-fg);
  }

  /* The moved-in <pre> keeps its syntect highlighting; strip the reader's own
     pre chrome so it sits flush inside the figure. */
  :global(.cg-group .cg-pane pre) {
    margin: 0;
    border: 0;
    border-radius: 0;
    background: transparent;
  }
</style>
