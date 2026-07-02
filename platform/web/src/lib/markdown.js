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
const LINK_RE = new RegExp(NUL + 'L(\\d+)' + NUL, 'g');
const FENCE_LINE_RE = new RegExp('^' + NUL + 'F\\d+' + NUL + '$');
// Captures: (1) leading indent, used for nesting depth, (2) the raw marker
// (used only to tell ul from ol), (3) the item's text.
const LIST_ITEM_RE = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/;

export function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function escapeAttr(s) {
  return escapeHtml(s).replace(/"/g, '&quot;');
}

// Models occasionally answer with inline LaTeX (e.g. "$\rightarrow$", "$2^{10}$")
// instead of plain text, even though nothing here renders math - left alone
// it shows the raw "$2^{10}$" to the reader. This isn't a LaTeX renderer,
// just symbol/superscript/subscript handling for the simple cases a casual
// chat answer realistically uses (arrows, exponents, Big-O notation, basic
// operators).
//
// Only spans that already look math-y get touched - MATH_SIGNAL_RE requires
// a backslash command, a caret, or an underscore immediately before a digit.
// That's deliberately narrower than "any $...$ pair": ordinary prose mentioning
// two dollar amounts ("$5 and $10", "$HOME or $PATH") has none of those, so it
// can't match. A bare "_letter" (as in "$MY_VAR$" or "$user_id$") is excluded
// on purpose too - it reads as an identifier, not a subscript, and treating it
// as one would misfire on real prose far more often than it would help.
const LATEX_SYMBOLS = {
  rightarrow: '→', to: '→', Rightarrow: '⇒',
  leftarrow: '←', Leftarrow: '⇐',
  leftrightarrow: '↔', Leftrightarrow: '⇔',
  times: '×', cdot: '·', div: '÷', pm: '±', mp: '∓',
  leq: '≤', le: '≤', geq: '≥', ge: '≥', neq: '≠', ne: '≠',
  approx: '≈', equiv: '≡', infty: '∞', sqrt: '√',
  alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', theta: 'θ', lambda: 'λ', pi: 'π', sigma: 'σ', omega: 'ω',
  ldots: '…', dots: '…', cdots: '⋯'
};
const MATH_SIGNAL_RE = /\\[a-zA-Z]|\^|_\{?\d/;
function renderInlineMath(content) {
  // Unknown commands fall back to their bare name, not the backslash form -
  // "\log" reading as "log" is more useful than a stray backslash, and covers
  // the common LaTeX operator names (log, sin, max, lim, ...) that render as
  // plain text in real LaTeX too, without needing one map entry each.
  let out = content.replace(/\\([a-zA-Z]+)/g, (m, cmd) => LATEX_SYMBOLS[cmd] ?? cmd);
  out = out.replace(/\^\{([^{}]*)\}/g, '<sup>$1</sup>').replace(/\^([a-zA-Z0-9])/g, '<sup>$1</sup>');
  out = out.replace(/_\{([^{}]*)\}/g, '<sub>$1</sub>').replace(/_([a-zA-Z0-9])/g, '<sub>$1</sub>');
  return out;
}

export function renderMarkdown(src) {
  src = (src || '').replace(/\r\n?/g, '\n');
  const fences = [], inlines = [], links = [];
  src = src.replace(/```([^\n`]*)\n([\s\S]*?)(?:```|$)/g, (_, lang, code) => { fences.push({ lang: lang.trim(), code }); return NUL + 'F' + (fences.length - 1) + NUL; });
  src = src.replace(/`([^`\n]+)`/g, (_, c) => { inlines.push(c); return NUL + 'I' + (inlines.length - 1) + NUL; });
  // Links are extracted here too - from raw src, before escapeHtml() - and not
  // rebuilt into <a> HTML until the very end (see LINK_RE below), same
  // placeholder trick as fences/inline code just above. Two reasons: (1) a
  // bare "http://a/b_c" sitting in plain text would otherwise reach the
  // bold/italic pass and get mangled by its own underscore/asterisk handling;
  // (2) building the <a> tag immediately here, on already-escaped text, is
  // what caused the pre-existing bug where a URL containing "&" (extremely
  // common in query strings) got escaped once by escapeHtml() and then AGAIN
  // by escapeAttr() - "&" to "&amp;" to "&amp;amp;". Capturing raw and
  // escaping exactly once at substitution time fixes both.
  src = src.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (_, t, u) => { links.push({ text: t, url: u }); return NUL + 'L' + (links.length - 1) + NUL; });
  src = src.replace(/https?:\/\/[^\s<>"]+/g, (u) => {
    let core = u, trail = '';
    while (core && (/[.,;:!?]$/.test(core) || (/\)$/.test(core) && !core.slice(0, -1).includes('(')))) { trail = core.slice(-1) + trail; core = core.slice(0, -1); }
    if (!core) return u;
    links.push({ text: core, url: core });
    return NUL + 'L' + (links.length - 1) + NUL + trail;
  });
  let h = escapeHtml(src);
  h = h.replace(/\$([^$\n]+)\$/g, (whole, inner) => (MATH_SIGNAL_RE.test(inner) ? renderInlineMath(inner) : whole));
  h = h.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/__([^_]+)__/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>').replace(/(^|[^_])_([^_\n]+)_/g, '$1<em>$2</em>')
    .replace(/~~([^~]+)~~/g, '<del>$1</del>');
  h = h.replace(/&lt;br\s*\/?&gt;/gi, '<br>'); // allow a literal <br> from model output (safe - fixed tag, not attacker-controlled)
  const out = [];
  let quote = false, para = [];
  const flushPara = () => { if (para.length) { out.push('<p>' + para.join('<br>') + '</p>'); para = []; } };
  const closeQuote = () => { if (quote) { out.push('</blockquote>'); quote = false; } };
  const isTableSep = (s) => s.includes('-') && /^\s*\|?\s*:?-{1,}:?\s*(\|\s*:?-{1,}:?\s*)*\|?\s*$/.test(s);
  const rowCells = (s) => s.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
  const lines = h.split('\n');
  for (let li = 0; li < lines.length; li++) {
    const line = lines[li];
    let m;
    if (line.includes('|') && li + 1 < lines.length && lines[li + 1].includes('|') && isTableSep(lines[li + 1])) {
      flushPara(); closeQuote();
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
    if (FENCE_LINE_RE.test(line.trim())) { flushPara(); closeQuote(); out.push(line.trim()); continue; }
    if (/^\s*$/.test(line)) { flushPara(); closeQuote(); continue; }
    if ((m = line.match(/^(#{1,6})\s+(.*)$/))) { flushPara(); closeQuote(); const n = m[1].length; out.push(`<h${n}>${m[2]}</h${n}>`); continue; }
    if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(line)) { flushPara(); closeQuote(); out.push('<hr>'); continue; }
    if ((m = line.match(/^\s*&gt;\s?(.*)$/))) { flushPara(); if (!quote) { out.push('<blockquote>'); quote = true; } para.push(m[1]); continue; }
    if ((m = line.match(LIST_ITEM_RE))) {
      flushPara(); closeQuote();
      // Consume the whole list block in one pass (same look-ahead technique
      // the table branch above uses), tracking a stack of {type, indent} so
      // a more-indented item nests inside the previous item's <li> instead
      // of flattening into a sibling list. <li> tags are left open when a
      // nested list might follow and closed either by the next same-level
      // item, by popping back out for a shallower one, or by the final
      // cleanup once the block ends - never anywhere else.
      const stack = [];
      for (; li < lines.length; li++) {
        const lm = lines[li].match(LIST_ITEM_RE);
        if (!lm) break;
        const indent = lm[1].length;
        const type = /\d/.test(lm[2]) ? 'ol' : 'ul';
        const top = () => stack[stack.length - 1];
        while (stack.length && (top().indent > indent || (top().indent === indent && top().type !== type))) {
          out.push('</li>', stack.pop().type === 'ul' ? '</ul>' : '</ol>');
        }
        if (!stack.length || top().indent < indent) {
          out.push(type === 'ul' ? '<ul>' : '<ol>');
          stack.push({ type, indent });
        } else {
          out.push('</li>');
        }
        out.push(`<li>${lm[3]}`);
      }
      while (stack.length) out.push('</li>', stack.pop().type === 'ul' ? '</ul>' : '</ol>');
      li--;
      continue;
    }
    para.push(line);
  }
  flushPara(); closeQuote();
  h = out.join('\n');
  h = h.replace(INLINE_RE, (_, i) => `<code class="ins-code-inline">${escapeHtml(inlines[+i])}</code>`);
  h = h.replace(LINK_RE, (_, i) => {
    const { text, url } = links[+i];
    return `<a href="${escapeAttr(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(text)}</a>`;
  });
  h = h.replace(FENCE_RE, (_, i) => {
    const { lang, code } = fences[+i];
    const safeLang = (lang || '').toLowerCase().replace(/[^a-z0-9+#-]/g, '');
    return `<div class="code-wrap"><div class="code-head"><span class="code-lang">${escapeHtml(lang || 'code')}</span><button class="copy-btn" type="button">Copy</button></div><pre><code class="language-${safeLang}">${escapeHtml(code.replace(/\n$/, ''))}</code></pre></div>`;
  });
  return h;
}
