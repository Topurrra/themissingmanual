<script>
  // Explicit "Ask the guides" panel — only rendered when AI Search is configured.
  // Calls /ask.json ONCE per button press (never on keystroke), so it can't drain
  // the query budget. Keyword (Tantivy) results stay on the page as the fallback.
  export let query = '';

  let q = query;
  $: q = query;
  let state = 'idle'; // idle | loading | done | error
  let mode = 'search'; // 'search' (passages) | 'answer' (generated)
  let answer = '';
  let results = [];
  let sources = [];
  let message = '';

  // Minimal, safe Markdown -> HTML for the AI answer. Escapes HTML first, then
  // applies a small subset (headings, bold/italic, code, lists, links). Links are
  // restricted to http(s)/root-relative so a model can't inject javascript: URIs.
  function render(src) {
    if (!src) return '';
    const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const inline = (s) =>
      esc(s)
        .replace(/`([^`]+)`/g, (_, c) => `<code>${c}</code>`)
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, t, u) => {
          const url = u.trim();
          const safe = /^(https?:\/\/|\/)/.test(url) ? url : '#';
          return `<a href="${safe}">${t}</a>`;
        });
    const lines = String(src).replace(/\r\n/g, '\n').split('\n');
    let html = '';
    let list = null;
    let code = false;
    let buf = [];
    const closeList = () => {
      if (list) {
        html += `</${list}>`;
        list = null;
      }
    };
    for (const raw of lines) {
      if (raw.trim().startsWith('```')) {
        if (code) {
          html += `<pre><code>${esc(buf.join('\n'))}</code></pre>`;
          buf = [];
          code = false;
        } else {
          closeList();
          code = true;
        }
        continue;
      }
      if (code) {
        buf.push(raw);
        continue;
      }
      const line = raw.trim();
      if (!line) {
        closeList();
        continue;
      }
      let m;
      if ((m = line.match(/^(#{1,6})\s+(.*)$/))) {
        closeList();
        const l = Math.min(6, m[1].length);
        html += `<h${l}>${inline(m[2])}</h${l}>`;
      } else if ((m = line.match(/^[-*+]\s+(.*)$/))) {
        if (list !== 'ul') {
          closeList();
          list = 'ul';
          html += '<ul>';
        }
        html += `<li>${inline(m[1])}</li>`;
      } else if ((m = line.match(/^\d+\.\s+(.*)$/))) {
        if (list !== 'ol') {
          closeList();
          list = 'ol';
          html += '<ol>';
        }
        html += `<li>${inline(m[1])}</li>`;
      } else {
        closeList();
        html += `<p>${inline(line)}</p>`;
      }
    }
    if (code) html += `<pre><code>${esc(buf.join('\n'))}</code></pre>`;
    closeList();
    return html;
  }

  async function run() {
    const text = (q || '').trim();
    if (!text || state === 'loading') return;
    state = 'loading';
    answer = '';
    sources = [];
    message = '';
    try {
      const res = await fetch(`/ask.json?q=${encodeURIComponent(text)}`);
      const data = await res.json();
      if (!data.enabled) { message = 'AI answers are not enabled.'; state = 'error'; return; }
      if (data.capReached) { message = 'AI answers have hit this month’s limit — keyword results are below.'; state = 'error'; return; }
      if (data.error) { message = 'AI answer is unavailable right now — see keyword results below.'; state = 'error'; return; }
      mode = data.mode || (data.answer ? 'answer' : 'search');
      answer = data.answer || '';
      results = data.results || [];
      sources = data.sources || [];
      state = 'done';
    } catch (e) {
      message = 'AI answer is unavailable right now — see keyword results below.';
      state = 'error';
    }
  }
</script>

<section class="ask">
  <div class="ask-head">
    <span class="ask-title"><i class="ti ti-sparkles" aria-hidden="true"></i> Ask the guides</span>
    <button class="ask-btn" on:click={run} disabled={state === 'loading' || !q.trim()}>
      {#if state === 'loading'}<i class="ti ti-loader-2 spin" aria-hidden="true"></i> Thinking…{:else}Ask AI{/if}
    </button>
  </div>
  <p class="ask-hint">Semantic search across the guides — finds the right passages even when the words don't match. One query per ask; keyword results below are instant.</p>

  {#if state === 'done'}
    {#if mode === 'answer'}
      <div class="ask-answer">{@html render(answer)}</div>
      {#if sources.length}
        <div class="ask-sources">
          <span class="ask-src-label">Sources</span>
          <ul>
            {#each sources as s}
              <li><a href={s.url}>{s.title}{#if s.phase} · Phase {s.phase}{/if}</a></li>
            {/each}
          </ul>
        </div>
      {/if}
    {:else if results.length}
      <ul class="ask-results">
        {#each results as r}
          <li>
            <a class="ask-result" href={r.url}>
              <span class="ask-result-text">{r.text}</span>
              <span class="ask-result-src">{r.title}{#if r.phase} · Phase {r.phase}{/if} →</span>
            </a>
          </li>
        {/each}
      </ul>
    {:else}
      <p class="ask-msg">No close matches — see the keyword results below.</p>
    {/if}
  {:else if state === 'error'}
    <p class="ask-msg">{message}</p>
  {/if}
</section>

<style>
  .ask { border: 1px solid var(--line); border-radius: 12px; background: var(--raise); padding: 0.9rem 1rem; margin: 0.6rem 0 1.2rem; }
  .ask-head { display: flex; align-items: center; gap: 0.6rem; }
  .ask-title { display: inline-flex; align-items: center; gap: 0.4rem; font-family: var(--font-display); font-weight: 600; color: var(--ink); }
  .ask-title .ti { color: var(--accent); }
  .ask-btn { margin-left: auto; cursor: pointer; font: inherit; font-size: 0.88rem; font-weight: 600; display: inline-flex; align-items: center; gap: 0.35rem; background: var(--accent); color: #fff; border: 1px solid var(--accent); border-radius: 9px; padding: 0.4rem 0.9rem; }
  .ask-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .ask-hint { font-size: 0.82rem; color: var(--muted); margin: 0.5rem 0 0; line-height: 1.5; }

  .ask-answer { margin-top: 0.8rem; padding-top: 0.8rem; border-top: 1px solid var(--line); color: var(--body); line-height: 1.6; }
  .ask-answer :global(h1), .ask-answer :global(h2), .ask-answer :global(h3),
  .ask-answer :global(h4), .ask-answer :global(h5), .ask-answer :global(h6) {
    font-family: var(--font-display); color: var(--ink); line-height: 1.3; margin: 1.1rem 0 0.4rem;
  }
  .ask-answer :global(h1) { font-size: 1.3rem; }
  .ask-answer :global(h2) { font-size: 1.12rem; }
  .ask-answer :global(h3) { font-size: 1rem; }
  .ask-answer :global(h4), .ask-answer :global(h5), .ask-answer :global(h6) { font-size: 0.92rem; }
  .ask-answer :global(> :first-child) { margin-top: 0; }
  .ask-answer :global(p) { margin: 0.55rem 0; }
  .ask-answer :global(ul), .ask-answer :global(ol) { margin: 0.5rem 0; padding-left: 1.4rem; }
  .ask-answer :global(li) { margin: 0.2rem 0; }
  .ask-answer :global(a) { color: var(--accent); text-decoration: underline; text-underline-offset: 2px; }
  .ask-answer :global(code) { font-family: var(--font-mono); font-size: 0.86em; background: var(--surface); border: 1px solid var(--line); border-radius: 5px; padding: 0.05rem 0.35rem; }
  .ask-answer :global(pre) { background: var(--bg); border: 1px solid var(--line); border-radius: 9px; padding: 0.7rem 0.8rem; overflow-x: auto; margin: 0.7rem 0; }
  .ask-answer :global(pre code) { background: none; border: 0; padding: 0; font-size: 0.82rem; }

  .ask-sources { margin-top: 1rem; }
  .ask-src-label { font-family: var(--font-mono); font-size: 0.64rem; letter-spacing: 0.06em; text-transform: uppercase; color: var(--faint); }
  .ask-sources ul { list-style: none; margin: 0.35rem 0 0; padding: 0; display: flex; flex-direction: column; gap: 0.2rem; }
  .ask-sources a { font-size: 0.9rem; color: var(--accent); }
  .ask-results { list-style: none; margin: 0.8rem 0 0; padding-top: 0.8rem; border-top: 1px solid var(--line); display: flex; flex-direction: column; gap: 0.5rem; }
  .ask-result { display: block; border: 1px solid var(--line); border-radius: 9px; padding: 0.6rem 0.75rem; background: var(--bg); }
  .ask-result:hover { border-color: var(--accent); text-decoration: none; }
  .ask-result-text { display: block; color: var(--body); font-size: 0.9rem; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
  .ask-result-src { display: block; margin-top: 0.35rem; font-size: 0.8rem; color: var(--accent); font-weight: 500; }
  .ask-msg { margin-top: 0.7rem; font-size: 0.88rem; color: var(--muted); }
  .spin { animation: ask-spin 0.8s linear infinite; }
  @keyframes ask-spin { to { transform: rotate(360deg); } }
</style>
