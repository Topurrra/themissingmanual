<script>
  import { onMount, tick } from 'svelte';

  // Turns ingest-marked code blocks into interactive run widgets.
  //
  // The backend emits  <pre data-runnable="<lang>"><code class="language-<lang>">
  // …tok-* highlighted source…</code></pre>  for fences flagged ` ```lang runnable `.
  // We find those after mount, read the language from the attribute and the code
  // from the block's textContent (the <code> contains tok-* highlight spans, so
  // innerHTML would be wrong), and replace each <pre> with a CodeMirror editor +
  // Run button + output panel + Reset.
  //
  // Lifecycle mirrors Mermaid.svelte: this component is mounted INSIDE the phase
  // page's {#key} block, so it re-mounts on every phase navigation. We register a
  // SYNCHRONOUS destroy callback (onMount must return one directly — an async
  // onMount's cleanup is ignored), so each nav tears down all editors, workers and
  // runtime handles, leaving no leaks and no duplicate widgets.
  //
  // Coexistence: Mermaid targets `code.language-mermaid`; we target `[data-runnable]`
  // (mermaid is never marked runnable, so no overlap). ReaderTools snapshots
  // `.reader > *` blocks for the bookmark — we replace each <pre> with a
  // `figure.run-widget`, which is a fine block-level anchor for that.
  //
  // Everything heavy (CodeMirror, Pyodide, sql.js) is lazy-loaded: the editor
  // module is dynamically imported only if a runnable block exists; each runtime
  // only when its language's block is Run.

  onMount(() => {
    let destroyed = false;
    const widgets = []; // { editor, runtime cleanup handled via disposeAll }
    let disposeAll = null; // adapters.disposeAll, loaded with the editor
    let themeObserver = null;
    let createEditor = null;
    let getAdapter = null;
    let pendingTheme = null;

    const refreshThemes = () => {
      for (const w of widgets) {
        try {
          w.editor.refreshTheme();
        } catch (e) {
          /* editor may not be built yet */
        }
      }
    };
    const onThemeChange = () => {
      if (pendingTheme) return;
      pendingTheme = requestAnimationFrame(() => {
        pendingTheme = null;
        refreshThemes();
      });
    };

    // Build the widget DOM for one block and wire up Run / Reset / Copy.
    const mountWidget = async (pre) => {
      const lang = pre.getAttribute('data-runnable') || 'unknown';
      const code = pre.querySelector('code');
      // textContent is entity-decoded and strips the tok-* highlight spans.
      const original = (code ? code.textContent : pre.textContent).replace(/\n$/, '');

      const adapter = getAdapter(lang);

      // --- scaffold ---------------------------------------------------------
      const fig = document.createElement('figure');
      fig.className = 'run-widget';
      fig.setAttribute('role', 'group');
      fig.setAttribute('aria-label', `Runnable ${adapter.label} example`);

      const bar = document.createElement('div');
      bar.className = 'rw-bar';
      const langTag = document.createElement('span');
      langTag.className = 'rw-lang';
      langTag.textContent = adapter.label;
      bar.appendChild(langTag);

      const actions = document.createElement('div');
      actions.className = 'rw-actions';

      const runBtn = document.createElement('button');
      runBtn.type = 'button';
      runBtn.className = 'rw-btn rw-run';
      runBtn.innerHTML = '<i class="ti ti-player-play"></i><span>Run</span>';

      const resetBtn = document.createElement('button');
      resetBtn.type = 'button';
      resetBtn.className = 'rw-btn rw-reset';
      resetBtn.title = 'Reset to original';
      resetBtn.setAttribute('aria-label', 'Reset code to original');
      resetBtn.innerHTML = '<i class="ti ti-rotate"></i>';

      const copyBtn = document.createElement('button');
      copyBtn.type = 'button';
      copyBtn.className = 'rw-btn rw-copy';
      copyBtn.title = 'Copy code';
      copyBtn.setAttribute('aria-label', 'Copy code');
      copyBtn.innerHTML = '<i class="ti ti-copy"></i>';

      actions.append(resetBtn, copyBtn, runBtn);
      bar.appendChild(actions);

      const editorHost = document.createElement('div');
      editorHost.className = 'rw-editor';

      const output = document.createElement('div');
      output.className = 'rw-output';
      output.hidden = true;

      fig.append(bar, editorHost, output);

      // Swap the static <pre> for our widget, keeping the original for restore().
      const parent = pre.parentNode;
      if (!parent) return;
      parent.replaceChild(fig, pre);

      // --- editor (lazy CM6) ------------------------------------------------
      let editor;
      try {
        editor = createEditor({ parent: editorHost, doc: original, langExtension: null });
      } catch (e) {
        // CM failed to build — restore the original block so code stays visible.
        if (fig.parentNode) fig.parentNode.replaceChild(pre, fig);
        return;
      }
      const widget = { editor };
      widgets.push(widget);

      // Load the language mode in the background (highlighting is non-blocking).
      adapter
        .cmLang()
        .then((ext) => {
          if (!destroyed && ext) editor.setLanguage(ext);
        })
        .catch(() => {});

      // --- output rendering -------------------------------------------------
      const renderOutput = (res, { loading } = {}) => {
        output.hidden = false;
        output.innerHTML = '';
        if (loading) {
          const l = document.createElement('div');
          l.className = 'rw-loading';
          l.innerHTML = '<span class="rw-spinner"></span><span></span>';
          l.querySelector('span:last-child').textContent = loading;
          output.appendChild(l);
          return;
        }
        const add = (cls, text) => {
          if (text == null || text === '') return;
          const block = document.createElement('pre');
          block.className = 'rw-out ' + cls;
          block.textContent = text;
          output.appendChild(block);
        };
        if (res.table) {
          output.appendChild(buildTable(res.table));
        }
        add('rw-stdout', res.logs);
        if (res.result !== undefined && res.result !== null && res.result !== '') {
          add('rw-result', '⇒ ' + res.result);
        }
        add('rw-stderr', res.error);
        if (!output.childElementCount) add('rw-stdout', '(no output)');
      };

      const buildTable = (t) => {
        const wrap = document.createElement('div');
        wrap.className = 'rw-table-wrap';
        const table = document.createElement('table');
        table.className = 'rw-table';
        const thead = document.createElement('thead');
        const htr = document.createElement('tr');
        for (const c of t.columns) {
          const th = document.createElement('th');
          th.textContent = c;
          htr.appendChild(th);
        }
        thead.appendChild(htr);
        const tbody = document.createElement('tbody');
        for (const row of t.rows) {
          const tr = document.createElement('tr');
          for (const cell of row) {
            const td = document.createElement('td');
            td.textContent = cell === null ? 'NULL' : String(cell);
            if (cell === null) td.className = 'rw-null';
            tr.appendChild(td);
          }
          tbody.appendChild(tr);
        }
        table.append(thead, tbody);
        wrap.appendChild(table);
        return wrap;
      };

      // --- run --------------------------------------------------------------
      let running = false;
      const setRunning = (on) => {
        running = on;
        runBtn.disabled = on;
        runBtn.classList.toggle('is-running', on);
        runBtn.querySelector('span').textContent = on ? 'Running…' : 'Run';
      };

      const run = async () => {
        if (running) return;
        if (adapter.unsupported) return; // shouldn't fire — button is disabled
        setRunning(true);
        try {
          // First-run load shows a status line (Pyodide/sql.js take a few seconds).
          await adapter.load((status) => {
            if (!destroyed) renderOutput({}, { loading: status });
          });
          renderOutput({}, { loading: 'Running…' });
          // onStatus lets a runtime report mid-run progress (e.g. Pyodide loading
          // imported packages on first use); fall back to "Running…" when cleared.
          const res = await adapter.run(editor.getValue(), {
            onStatus: (status) => {
              if (!destroyed) renderOutput({}, { loading: status || 'Running…' });
            }
          });
          if (!destroyed) renderOutput(res);
        } catch (e) {
          if (!destroyed)
            renderOutput({ error: 'Runtime failed to load: ' + (e.message || e) });
        } finally {
          if (!destroyed) setRunning(false);
        }
      };

      runBtn.addEventListener('click', run);
      resetBtn.addEventListener('click', () => {
        editor.setValue(original);
        output.hidden = true;
        output.innerHTML = '';
      });
      copyBtn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(editor.getValue());
          copyBtn.classList.add('copied');
          setTimeout(() => copyBtn.classList.remove('copied'), 1200);
        } catch (e) {
          /* clipboard blocked — no-op */
        }
      });

      // Unsupported language: keep the editor, disable Run, show a note.
      if (adapter.unsupported) {
        runBtn.disabled = true;
        runBtn.title = `Running ${adapter.label} isn't supported yet`;
        const note = document.createElement('div');
        note.className = 'rw-note';
        note.textContent = `Running ${adapter.label} isn't supported yet — the editor is read-along only.`;
        fig.appendChild(note);
      }
    };

    const init = async () => {
      await tick(); // wait for {@html phase.html} to be in the DOM
      if (destroyed) return;

      const reader = document.querySelector('.reader');
      if (!reader) return;

      const blocks = [...reader.querySelectorAll('pre[data-runnable]')];
      if (!blocks.length) return; // nothing runnable — never load CodeMirror

      // Lazy-load the editor factory + adapter registry (code-split chunks).
      let mod, adapters;
      try {
        [mod, adapters] = await Promise.all([
          import('./runnable/editor.js'),
          import('./runnable/adapters.js')
        ]);
      } catch (e) {
        return; // couldn't load the editor — leave the static blocks untouched
      }
      if (destroyed) return;
      createEditor = mod.createEditor;
      getAdapter = adapters.getAdapter;
      disposeAll = adapters.disposeAll;

      for (const pre of blocks) {
        if (destroyed) break;
        await mountWidget(pre);
      }

      // Re-theme editors when the site theme flips (Appearance.svelte sets data-theme).
      themeObserver = new MutationObserver((muts) => {
        if (muts.some((m) => m.attributeName === 'data-theme')) onThemeChange();
      });
      themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme']
      });
    };

    init();

    // Synchronous destroy: tear down on every phase nav so editors, workers and
    // WASM runtime handles don't leak and widgets never duplicate.
    return () => {
      destroyed = true;
      if (themeObserver) themeObserver.disconnect();
      if (pendingTheme) cancelAnimationFrame(pendingTheme);
      for (const w of widgets) {
        try {
          w.editor.destroy();
        } catch (e) {
          /* ignore */
        }
      }
      widgets.length = 0;
      if (disposeAll) disposeAll(); // terminate JS worker, drop Pyodide/sql.js
    };
  });
</script>

<!-- Styles are global-on-purpose: the .run-widget figures live inside {@html}
     content in .reader (built imperatively above), not in this component's
     markup. Svelte :global() keeps them scoped to this file, off app.css. -->
<style>
  :global(figure.run-widget) {
    margin: 1.6rem 0;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--code-bg);
    overflow: hidden;
  }

  /* toolbar */
  :global(.run-widget .rw-bar) {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.5rem 0.65rem 0.5rem 0.9rem;
    border-bottom: 1px solid var(--line);
    background: color-mix(in srgb, var(--code-bg) 70%, var(--surface));
  }
  :global(.run-widget .rw-lang) {
    font-family: var(--font-mono);
    font-size: 0.66rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--faint);
  }
  :global(.run-widget .rw-actions) {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }
  :global(.run-widget .rw-btn) {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    font-family: var(--font-body);
    font-size: 0.82rem;
    font-weight: 500;
    color: var(--body);
    background: var(--raise);
    border: 1px solid var(--line);
    border-radius: 9px;
    padding: 0.32rem 0.55rem;
    cursor: pointer;
    transition: border-color 0.15s var(--ease), color 0.15s var(--ease),
      background 0.15s var(--ease);
  }
  :global(.run-widget .rw-btn i) {
    font-size: 1rem;
    line-height: 1;
  }
  :global(.run-widget .rw-btn:hover) {
    border-color: var(--accent);
    color: var(--accent);
  }
  :global(.run-widget .rw-btn:focus-visible) {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
  :global(.run-widget .rw-run) {
    color: #fff;
    background: var(--accent);
    border-color: var(--accent);
    padding: 0.32rem 0.8rem;
  }
  :global(.run-widget .rw-run:hover:not(:disabled)) {
    background: var(--accent-strong);
    border-color: var(--accent-strong);
    color: #fff;
  }
  :global(.run-widget .rw-run:disabled) {
    opacity: 0.6;
    cursor: default;
  }
  :global(.run-widget .rw-copy.copied) {
    border-color: var(--accent);
    color: var(--accent);
  }

  /* editor host — CodeMirror renders inside */
  :global(.run-widget .rw-editor) {
    max-height: 460px;
    overflow: auto;
  }
  :global(.run-widget .cm-editor) {
    background: var(--code-bg);
  }

  /* output panel */
  :global(.run-widget .rw-output) {
    border-top: 1px solid var(--line);
    background: color-mix(in srgb, var(--code-bg) 88%, var(--surface));
    padding: 0.6rem 0.9rem;
    max-height: 360px;
    overflow: auto;
  }
  :global(.run-widget .rw-out) {
    font-family: var(--font-mono);
    font-size: 0.8rem;
    line-height: 1.6;
    margin: 0;
    padding: 0.15rem 0;
    white-space: pre-wrap;
    word-break: break-word;
    background: none;
    border: none;
  }
  :global(.run-widget .rw-stdout) {
    color: var(--code-fg);
  }
  :global(.run-widget .rw-result) {
    color: var(--accent-strong);
  }
  :global(.run-widget .rw-stderr) {
    color: var(--danger-strong);
  }
  :global(.run-widget .rw-note) {
    font-size: 0.82rem;
    color: var(--muted);
    padding: 0.55rem 0.9rem;
    border-top: 1px solid var(--line);
  }

  /* loading state */
  :global(.run-widget .rw-loading) {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    font-size: 0.82rem;
    color: var(--muted);
    font-family: var(--font-body);
  }
  :global(.run-widget .rw-spinner) {
    width: 13px;
    height: 13px;
    border: 2px solid var(--line);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: rw-spin 0.7s linear infinite;
    flex: none;
  }
  @keyframes rw-spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* SQL result table */
  :global(.run-widget .rw-table-wrap) {
    overflow-x: auto;
    margin: 0.2rem 0 0.4rem;
  }
  :global(.run-widget .rw-table) {
    border-collapse: collapse;
    font-family: var(--font-mono);
    font-size: 0.78rem;
    width: auto;
  }
  :global(.run-widget .rw-table th),
  :global(.run-widget .rw-table td) {
    border: 1px solid var(--line);
    padding: 0.3rem 0.6rem;
    text-align: left;
    color: var(--code-fg);
  }
  :global(.run-widget .rw-table th) {
    background: color-mix(in srgb, var(--code-bg) 60%, var(--surface));
    color: var(--ink);
    font-weight: 600;
  }
  :global(.run-widget .rw-table .rw-null) {
    color: var(--faint);
    font-style: italic;
  }

  @media (prefers-reduced-motion: reduce) {
    :global(.run-widget .rw-spinner) {
      animation-duration: 1.6s;
    }
  }
</style>
