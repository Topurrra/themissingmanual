// Builds src/lib/glossary.json from the Terminology blocks in /guides.
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const here = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(here, '../../..');
const GUIDES = join(REPO, 'guides');
const OUT = resolve(here, '../src/lib/glossary.json');

const STOP = new Set(['all','at','is','the','a','an','this','that','these','those','it','here','now','one','two','yes','no','why','how','what','almost certainly','often','singular']);

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (e.endsWith('.md')) out.push(p);
  }
  return out;
}
function frontmatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  const fm = {};
  if (m) for (const line of m[1].split('\n')) {
    const mm = line.match(/^(\w+):\s*(.*)$/);
    if (mm) fm[mm[1]] = mm[2].replace(/^["']|["']$/g, '');
  }
  return fm;
}
function mdToText(s) {
  return s
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')   // [text](url) -> text
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/[[\]]/g, '')                       // stray brackets
    .replace(/\s+/g, ' ')
    .trim();
}
// Keep whole sentences, up to ~240 chars; never cut mid-word.
function cleanDef(body) {
  const t = mdToText(body);
  const sentences = t.split(/(?<=[.!?])\s+/);
  let out = '';
  for (const sen of sentences) {
    if (out && out.length + sen.length + 1 > 240) break;
    out = out ? out + ' ' + sen : sen;
    if (out.length >= 240) break;
  }
  if (!out) out = t;
  if (out.length > 300) {
    out = out.slice(0, 300);
    out = out.slice(0, out.lastIndexOf(' ')).trim() + '…';
  }
  return out.trim();
}

const files = walk(GUIDES);
const entries = [];
const RE = /^(?:A|An|The)?\s*\*\*?([A-Za-z][A-Za-z0-9 /+.\-]{1,28}?)\*\*?\s*(=|-|–|\bis\b|\bare\b|\bmeans\b|\bstands for\b|\brefers to\b)/u;
for (const f of files) {
  const text = readFileSync(f, 'utf8');
  const fm = frontmatter(text);
  const guideSlug = fm.guide || f.split(/[\\/]/).at(-2);
  // Terminology blocks are paragraphs that may wrap across several physical
  // lines, so split on blank lines and collapse each paragraph to one line.
  for (const para of text.split(/\n[ \t]*\n/)) {
    const line = para.replace(/\s*\n\s*/g, ' ').trim();
    if (!/^📝/.test(line) || !/Terminology/.test(line)) continue;
    const body = line.replace(/^📝\s*\*\*Terminology[^*]*\*\*[.\s--]*/u, '').trim();
    const hm = body.match(RE);
    if (!hm) continue;
    const term = hm[1].trim().replace(/[.\s]+$/, '');
    if (term.length < 3 || term.length > 30) continue;
    if (STOP.has(term.toLowerCase())) continue;
    const def = cleanDef(body);
    if (def.length < 25) continue;
    entries.push({ term, slug: term.toLowerCase(), def, guide: guideSlug });
  }
}
const byTerm = new Map();
for (const e of entries) {
  const k = e.slug;
  if (!byTerm.has(k) || e.def.length < byTerm.get(k).def.length) byTerm.set(k, e);
}
const out = [...byTerm.values()].sort((a, b) => a.term.localeCompare(b.term, undefined, { sensitivity: 'base' }));
writeFileSync(OUT, JSON.stringify(out));
console.log(`glossary: ${out.length} terms -> ${OUT}`);
