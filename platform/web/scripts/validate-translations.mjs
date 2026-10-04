// Validate human translations under translations/<locale>/ against the English guides.
// Usage (from platform/web): node scripts/validate-translations.mjs [--locale pt-br] [--root <dir>]
// <dir> holds guides/ and translations/ (default: the repo root). Exit 1 on errors.
import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, dirname, resolve, relative, sep } from 'path';
import { fileURLToPath } from 'url';

const args = process.argv.slice(2);
const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null; };
const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const ROOT = resolve(opt('--root') || REPO);
const GUIDES = join(ROOT, 'guides');
const TRANS = join(ROOT, 'translations');

function registeredLocales() {
  const only = opt('--locale');
  if (only) return [only];
  const f = join(REPO, 'platform/web/src/lib/i18n/locales.js');
  if (existsSync(f)) {
    const codes = [...readFileSync(f, 'utf8').matchAll(/code:\s*'([^']+)'/g)].map((m) => m[1]);
    if (codes.length) return codes;
  }
  return ['pt-br'];
}

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (e.endsWith('.md')) out.push(p);
  }
  return out;
}

// Minimal YAML: `key: value`, quoted strings, inline [a, "b"] lists, block "- x" lists.
function scalar(s) {
  s = s.trim();
  if (s.length > 1 && ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'")))) {
    const q = s[0];
    s = s.slice(1, -1);
    return q === '"' ? s.replace(/\\"/g, '"').replace(/\\\\/g, '\\') : s.replace(/''/g, "'");
  }
  return s;
}
function inlineList(s) {
  const out = [];
  let cur = '', q = null;
  for (const ch of s.slice(1, -1)) {
    if (q) { cur += ch; if (ch === q) q = null; }
    else if (ch === '"' || ch === "'") { q = ch; cur += ch; }
    else if (ch === ',') { out.push(scalar(cur)); cur = ''; }
    else cur += ch;
  }
  if (cur.trim()) out.push(scalar(cur));
  return out;
}
function parseFrontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return null;
  const fm = {};
  let key = null;
  for (const line of m[1].split(/\r?\n/)) {
    const item = line.match(/^\s+-\s+(.*)$/);
    if (item && key && Array.isArray(fm[key])) { fm[key].push(scalar(item[1])); continue; }
    const kv = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (!kv) continue;
    key = kv[1];
    const v = kv[2].trim();
    if (v === '') fm[key] = [];
    else if (v.startsWith('[') && v.endsWith(']')) fm[key] = inlineList(v);
    else fm[key] = scalar(v);
  }
  return { fm, body: text.slice(m[0].length), raw: m[1] };
}

// The server parses frontmatter with a real YAML parser, which the minimal reader above
// does not mirror. Flag the shapes it would reject or misread, so a file that passes here
// cannot still keep its guide from publishing.
const PLAIN_UNSAFE = /^[[\]{}&*!|>%@`#,?"'-]|: |:$| #/;
function yamlProblems(raw) {
  const out = [];
  const check = (key, v) => {
    if (v && !/^(["']).*\1$/.test(v) && PLAIN_UNSAFE.test(v)) {
      out.push(`frontmatter: ${key} value ${v} must be double-quoted (it contains ": ", " #" or starts with a YAML symbol)`);
    }
  };
  let key = null;
  for (const line of raw.split(/\r?\n/)) {
    const item = line.match(/^\s+-\s+(.*)$/);
    if (item && key) { check(key, item[1].trim()); continue; }
    const kv = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (!kv) continue;
    key = kv[1];
    const v = kv[2].trim();
    if (key === 'phase') {
      if (!/^\d+$/.test(v)) out.push(`frontmatter: phase must be a plain unquoted integer, got ${v}`);
    } else if (key === 'synonyms' || key === 'translators') {
      if (v !== '' && !(v.startsWith('[') && v.endsWith(']'))) out.push(`frontmatter: ${key} must be a list, e.g. ["a", "b"]`);
      else if (v) {
        let cur = '', q = null;
        for (const ch of v.slice(1, -1) + ',') {
          if (q) { cur += ch; if (ch === q) q = null; }
          else if (ch === '"' || ch === "'") { q = ch; cur += ch; }
          else if (ch === ',') { check(key, cur.trim()); cur = ''; }
          else cur += ch;
        }
      }
    } else if (['guide', 'title', 'summary', 'source_updated'].includes(key)) check(key, v);
  }
  return out;
}

// Split a body into code fences ({info, code}) and the prose outside them.
function scan(body) {
  const fences = [];
  const prose = [];
  let open = null;
  for (const line of body.split(/\r?\n/)) {
    const m = line.match(/^\s*(`{3,}|~{3,})(.*)$/);
    if (open) {
      if (m && m[1][0] === open.ch && m[1].length >= open.len && m[2].trim() === '') {
        fences.push({ info: open.info, code: open.lines.join('\n') });
        open = null;
      } else open.lines.push(line);
    } else if (m) open = { ch: m[1][0], len: m[1].length, info: m[2].trim(), lines: [] };
    else prose.push(line);
  }
  if (open) fences.push({ info: open.info, code: open.lines.join('\n'), unclosed: true });
  return { fences, prose: prose.join('\n') };
}

const linkSet = (prose) =>
  new Set([...prose.matchAll(/\]\((\/guides\/[^)\s#?]*)/g)].map((m) => m[1].replace(/\/$/, '')));

function parseQuiz(code) {
  try { const q = JSON.parse(code); return Array.isArray(q) ? q : null; } catch { return null; }
}

function checkFile(file, enFile, errors, warnings) {
  const text = readFileSync(file, 'utf8');
  if (text.includes('\r')) errors.push('file has CRLF line endings; use LF only');
  if (text.includes(String.fromCharCode(0x2014))) errors.push('contains an em dash (U+2014); use " - " instead');
  if (/honest/i.test(text)) warnings.push('contains "honest...": the project avoids that word and its translations');

  const tr = parseFrontmatter(text);
  if (!tr) { errors.push('missing or malformed frontmatter'); return null; }
  const en = parseFrontmatter(readFileSync(enFile, 'utf8').replace(/\r\n/g, '\n'));
  const { fm } = tr;
  errors.push(...yamlProblems(tr.raw));

  for (const k of ['guide', 'phase', 'title', 'summary', 'synonyms', 'source_updated']) {
    if (fm[k] === undefined || fm[k] === '' || (k === 'synonyms' && Array.isArray(fm[k]) && !fm[k].length)) {
      errors.push(`frontmatter: missing required "${k}"`);
    }
  }
  if (fm.guide && fm.guide !== en.fm.guide) errors.push(`frontmatter: guide "${fm.guide}" != English "${en.fm.guide}"`);
  const enPhase = en.fm.phase === undefined ? 0 : Number(en.fm.phase);
  if (fm.phase !== undefined && Number(fm.phase) !== enPhase) errors.push(`frontmatter: phase ${fm.phase} != English ${enPhase}`);
  if (fm.translators !== undefined) {
    if (enPhase !== 0) warnings.push('frontmatter: "translators" is only read on phase 0 (_guide.md)');
    else if (!Array.isArray(fm.translators)) errors.push('frontmatter: translators must be a list of GitHub handles');
  }
  if (fm.source_updated) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fm.source_updated) || isNaN(Date.parse(fm.source_updated))) {
      errors.push(`frontmatter: source_updated "${fm.source_updated}" is not a valid YYYY-MM-DD date`);
    } else if (en.fm.updated && fm.source_updated > String(en.fm.updated)) {
      errors.push(`frontmatter: source_updated ${fm.source_updated} is after the English updated date ${en.fm.updated}`);
    }
  }

  const t = scan(tr.body), e = scan(en.body);
  const h1 = t.prose.match(/^# (.+)$/m);
  if (!h1) errors.push('body has no H1 heading');
  else if (fm.title && h1[1].trim() !== fm.title) errors.push(`H1 "${h1[1].trim()}" != frontmatter title "${fm.title}"`);

  for (const f of t.fences) if (f.unclosed) errors.push(`unclosed code fence (${f.info || 'no info'})`);
  const ti = t.fences.map((f) => f.info), ei = e.fences.map((f) => f.info);
  if (ti.length !== ei.length) errors.push(`code fences: ${ti.length} vs ${ei.length} in English`);
  else {
    ti.forEach((info, i) => { if (info !== ei[i]) errors.push(`code fence #${i + 1}: info "${info}" != English "${ei[i]}"`); });
    t.fences.forEach((f, i) => {
      if (f.info === e.fences[i].info && !/^(quiz|mermaid)\b/.test(f.info) && f.code !== e.fences[i].code) {
        warnings.push(`code fence #${i + 1} (${f.info || 'plain'}) differs from English (fine if only comments were translated)`);
      }
    });
  }

  const tq = t.fences.filter((f) => f.info === 'quiz'), eq = e.fences.filter((f) => f.info === 'quiz');
  tq.forEach((f, i) => {
    const q = parseQuiz(f.code);
    if (!q) { errors.push(`quiz block #${i + 1}: invalid JSON (must be an array)`); return; }
    const eqq = eq[i] && parseQuiz(eq[i].code);
    if (!eqq) return;
    if (q.length !== eqq.length) { errors.push(`quiz block #${i + 1}: ${q.length} questions vs ${eqq.length} in English`); return; }
    q.forEach((item, j) => {
      const n = `quiz block #${i + 1}, question ${j + 1}`;
      const got = (item.choices || []).length;
      if (got !== eqq[j].choices.length) errors.push(`${n}: ${got} choices vs ${eqq[j].choices.length} in English`);
      if (item.answer !== eqq[j].answer) errors.push(`${n}: answer index ${item.answer} != English ${eqq[j].answer}`);
    });
  });

  const tm = ti.filter((i) => i === 'mermaid').length, em = ei.filter((i) => i === 'mermaid').length;
  if (tm !== em) errors.push(`mermaid blocks: ${tm} vs ${em} in English`);

  const tl = linkSet(t.prose), el = linkSet(e.prose);
  for (const l of el) if (!tl.has(l)) errors.push(`missing link to ${l} (present in English)`);
  for (const l of tl) if (!el.has(l)) errors.push(`extra link to ${l} (not in English)`);
  return { phase: enPhase };
}

let totalErrors = 0, totalWarnings = 0, totalFiles = 0;
for (const locale of registeredLocales()) {
  const dir = join(TRANS, locale);
  const files = walk(dir);
  if (!files.length) { console.log(`[${locale}] no translations yet`); continue; }
  const present = new Map(); // "category/slug" -> Set of phase numbers
  for (const file of files.sort()) {
    totalFiles++;
    const rel = relative(dir, file).split(sep).join('/');
    const errors = [], warnings = [];
    const enFile = join(GUIDES, rel);
    if (rel.split('/').length !== 3) errors.push('path must be <category>/<slug>/<file>.md');
    else if (!existsSync(enFile)) errors.push(`no English file at guides/${rel}`);
    else {
      const r = checkFile(file, enFile, errors, warnings);
      if (r) {
        const key = rel.split('/').slice(0, 2).join('/');
        if (!present.has(key)) present.set(key, new Set());
        present.get(key).add(r.phase);
      }
    }
    totalErrors += errors.length;
    totalWarnings += warnings.length;
    if (errors.length || warnings.length) {
      console.log(`\n${locale}/${rel}`);
      errors.forEach((m) => console.log(`  ERROR   ${m}`));
      warnings.forEach((m) => console.log(`  warning ${m}`));
    }
  }
  console.log(`\n[${locale}] completeness`);
  for (const [key, have] of present) {
    const enDir = join(GUIDES, key);
    const need = new Set();
    for (const f of readdirSync(enDir).filter((x) => x.endsWith('.md'))) {
      const p = parseFrontmatter(readFileSync(join(enDir, f), 'utf8'));
      need.add(p && p.fm.phase !== undefined ? Number(p.fm.phase) : 0);
    }
    const missing = [...need].filter((n) => !have.has(n)).sort((a, b) => a - b);
    if (missing.length) {
      totalWarnings++;
      console.log(`  warning ${key}: missing phases ${missing.join(', ')} - guide will not publish`);
    } else console.log(`  ok      ${key}: all ${need.size} phases translated`);
  }
}
console.log(`\n${totalFiles} file(s), ${totalErrors} error(s), ${totalWarnings} warning(s)`);
process.exit(totalErrors ? 1 : 0);
