// Dependency-free Markdown -> HTML renderer for AI chat responses, ported
// from a companion project (js/markdown.js there). Escapes all input first,
// so it's safe to use with {@html} even on untrusted (model-generated) text.
//
// One thing fixed versus the original while porting: its autolink
// substitution inserted the URL into href="..." without escaping quotes -
// escapeHtml() only neutralizes &/</>, so a response containing
// `[x](http://a" onmouseover="...)` could break out of the attribute.
// escapeAttr() below closes that - worth actually fixing here since this is
// a public multi-user surface, unlike the original's single-user local app.
//
// Placeholder tokens for extracted code/inline-code use the NUL character
// (built at runtime, never written as a literal escape here - avoids any
// ambiguity) as the delimiter, not plain text: a real response can
// plausibly contain "F1" or "I2C" as literal text, which a plain-text
// delimiter would collide with. NUL never appears in normal model output,
// and every placeholder is consumed by the final substitution before this
// ever reaches {@html} - it never appears in the rendered output.
const NUL = String.fromCharCode(0);
const FENCE_RE = new RegExp(NUL + 'F(\\d+)' + NUL, 'g');
const INLINE_RE = new RegExp(NUL + 'I(\\d+)' + NUL, 'g');
const FENCE_LINE_RE = new RegExp('^' + NUL + 'F\\d+' + NUL + '$');

export function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function escapeAttr(s) {
  return escapeHtml(s).replace(/"/g, '&quot;');
}

export function renderMarkdown(src) {
  src = (src || '').replace(/\r\n?/g, '\n');
  const fences = [], inlines = [];
  src = src.replace(/```([^\n`]*)\n([\s\S]*?)(?:```|$)/g, (_, lang, code) => { fences.push({ lang: lang.trim(), code }); return NUL + 'F' + (fences.length - 1) + NUL; });
  src = src.replace(/`([^`\n]+)`/g, (_, c) => { inlines.push(c); return NUL + 'I' + (inlines.length - 1) + NUL; });
  let h = escapeHtml(src);
  h = h.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (_, t, u) => `<a href="${escapeAttr(u)}" target="_blank" rel="noopener noreferrer">${t}</a>`);
  h = h.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/__([^_]+)__/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>').replace(/(^|[^_])_([^_\n]+)_/g, '$1<em>$2</em>')
    .replace(/~~([^~]+)~~/g, '<del>$1</del>');
  h = h.replace(/&lt;br\s*\/?&gt;/gi, '<br>'); // allow a literal <br> from model output (safe - fixed tag, not attacker-controlled)
  const out = [];
  let list = null, quote = false, para = [];
  const flushPara = () => { if (para.length) { out.push('<p>' + para.join('<br>') + '</p>'); para = []; } };
  const closeList = () => { if (list) { out.push(list === 'ul' ? '</ul>' : '</ol>'); list = null; } };
  const closeQuote = () => { if (quote) { out.push('</blockquote>'); quote = false; } };
  const isTableSep = (s) => s.includes('-') && /^\s*\|?\s*:?-{1,}:?\s*(\|\s*:?-{1,}:?\s*)*\|?\s*$/.test(s);
  const rowCells = (s) => s.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
  const lines = h.split('\n');
  for (let li = 0; li < lines.length; li++) {
    const line = lines[li];
    let m;
    if (line.includes('|') && li + 1 < lines.length && lines[li + 1].includes('|') && isTableSep(lines[li + 1])) {
      flushPara(); closeList(); closeQuote();
      const headers = rowCells(line);
      const aligns = rowCells(lines[li + 1]).map((c) => { const l = c.startsWith(':'), r = c.endsWith(':'); return l && r ? 'center' : r ? 'right' : l ? 'left' : ''; });
      let t = '<table><thead><tr>' + headers.map((c, i) => `<th${aligns[i] ? ` style="text-align:${aligns[i]}"` : ''}>${c}</th>`).join('') + '</tr></thead><tbody>';
      li += 2;
      for (; li < lines.length && lines[li].trim() && lines[li].includes('|'); li++) {
        const cells = rowCells(lines[li]);
        t += '<tr>' + headers.map((_, i) => `<td${aligns[i] ? ` style="text-align:${aligns[i]}"` : ''}>${cells[i] != null ? cells[i] : ''}</td>`).join('') + '</tr>';
      }
      li--;
      out.push(t + '</tbody></table>');
      continue;
    }
    if (FENCE_LINE_RE.test(line.trim())) { flushPara(); closeList(); closeQuote(); out.push(line.trim()); continue; }
    if (/^\s*$/.test(line)) { flushPara(); closeList(); closeQuote(); continue; }
    if ((m = line.match(/^(#{1,6})\s+(.*)$/))) { flushPara(); closeList(); closeQuote(); const n = m[1].length; out.push(`<h${n}>${m[2]}</h${n}>`); continue; }
    if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(line)) { flushPara(); closeList(); closeQuote(); out.push('<hr>'); continue; }
    if ((m = line.match(/^\s*&gt;\s?(.*)$/))) { flushPara(); closeList(); if (!quote) { out.push('<blockquote>'); quote = true; } para.push(m[1]); continue; }
    if ((m = line.match(/^\s*[-*+]\s+(.*)$/))) { flushPara(); closeQuote(); if (list !== 'ul') { closeList(); out.push('<ul>'); list = 'ul'; } out.push(`<li>${m[1]}</li>`); continue; }
    if ((m = line.match(/^\s*\d+[.)]\s+(.*)$/))) { flushPara(); closeQuote(); if (list !== 'ol') { closeList(); out.push('<ol>'); list = 'ol'; } out.push(`<li>${m[1]}</li>`); continue; }
    closeList(); para.push(line);
  }
  flushPara(); closeList(); closeQuote();
  h = out.join('\n');
  h = h.replace(INLINE_RE, (_, i) => `<code class="ins-code-inline">${escapeHtml(inlines[+i])}</code>`);
  h = h.replace(FENCE_RE, (_, i) => {
    const { lang, code } = fences[+i];
    const safeLang = (lang || '').toLowerCase().replace(/[^a-z0-9+#-]/g, '');
    return `<div class="code-wrap"><div class="code-head"><span class="code-lang">${escapeHtml(lang || 'code')}</span><button class="copy-btn" type="button">Copy</button></div><pre><code class="language-${safeLang}">${escapeHtml(code.replace(/\n$/, ''))}</code></pre></div>`;
  });
  return h;
}
