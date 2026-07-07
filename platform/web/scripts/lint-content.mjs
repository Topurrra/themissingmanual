import { readFileSync, readdirSync, statSync } from 'fs';
import { join, dirname, resolve, relative } from 'path';
import { fileURLToPath } from 'url';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const GUIDES = join(REPO, 'guides');

const REQUIRED_GUIDE = ['title', 'guide', 'summary', 'category', 'difficulty'];
const REQUIRED_PHASE = ['title', 'guide', 'phase', 'summary', 'difficulty'];

// Phrases that almost never belong in plain, honest technical writing.
const FLUFF = [
  'leverage', 'seamless', 'seamlessly', 'game-changer', 'game changer', 'revolutionary',
  'cutting-edge', 'cutting edge', 'unlock the power', 'supercharge', 'delve', 'dive deep',
  'in today’s world', "in today's world", 'in the world of', 'at the end of the day',
  'needless to say', 'it’s important to note', "it's important to note", 'simply put',
  'paradigm', 'synergy', 'best-in-class', 'effortless', 'elevate your', 'harness the power',
  'when it comes to', 'the fact of the matter', 'rest assured', 'look no further'
];

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
  if (!m) return { fm, body: text };
  for (const line of m[1].split('\n')) {
    const mm = line.match(/^(\w+):\s*(.*)$/);
    if (mm) fm[mm[1]] = mm[2].trim();
  }
  return { fm, body: text.slice(m[0].length) };
}
// Strip fenced code + inline code so we don't flag words inside examples.
function prose(body) {
  return body.replace(/```[\s\S]*?```/g, ' ').replace(/`[^`]*`/g, ' ');
}

const files = walk(GUIDES);
let errors = 0, warnings = 0;
const warnByPhrase = {};

for (const f of files) {
  const rel = relative(REPO, f);
  const text = readFileSync(f, 'utf8');
  const { fm, body } = frontmatter(text);
  const isGuide = f.endsWith('_guide.md');
  const required = isGuide ? REQUIRED_GUIDE : REQUIRED_PHASE;
  for (const key of required) {
    if (!fm[key]) { console.log(`ERROR  ${rel}: missing frontmatter "${key}"`); errors++; }
  }
  const text2 = prose(body).toLowerCase();
  for (const phrase of FLUFF) {
    let idx = text2.indexOf(phrase);
    while (idx !== -1) {
      warnings++;
      warnByPhrase[phrase] = (warnByPhrase[phrase] || 0) + 1;
      console.log(`WARN   ${rel}: fluff "${phrase}"`);
      idx = text2.indexOf(phrase, idx + phrase.length);
    }
  }
}

console.log('\n- Summary -');
console.log(`Files scanned: ${files.length}`);
console.log(`Errors:   ${errors}`);
console.log(`Warnings: ${warnings}`);
if (warnings) {
  console.log('Top fluff phrases:');
  Object.entries(warnByPhrase).sort((a, b) => b[1] - a[1]).slice(0, 12)
    .forEach(([p, n]) => console.log(`  ${n.toString().padStart(3)}  ${p}`));
}
process.exit(errors ? 1 : 0);
