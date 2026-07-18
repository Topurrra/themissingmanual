import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
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

  // Quiz/exercise JSON is reader-facing despite living in code fences - scan it
  // for the hard-rule words the prose pass can't see (it strips all fences).
  const widgetText = [...body.matchAll(/```(?:quiz|exercise)\s*\n([\s\S]*?)```/g)]
    .map((m) => m[1]).join(' ');
  if (widgetText.includes('—')) { console.log(`ERROR  ${rel}: em dash in quiz/exercise JSON`); errors++; }
  const wHonest = widgetText.match(/\bhonest(ly|y)?\b/i);
  if (wHonest) { console.log(`ERROR  ${rel}: banned word "${wHonest[0]}" in quiz/exercise JSON`); errors++; }

  // HARD RULES (see MEMORY / WRITERMANUAL): these are errors, not style nits.
  // CRLF anywhere silently breaks ingest (the frontmatter parser needs "---\n").
  if (text.includes('\r')) { console.log(`ERROR  ${rel}: CRLF line endings (breaks ingest)`); errors++; }
  const proseText = prose(body);
  if (proseText.includes('—')) {
    const n = proseText.split('—').length - 1;
    console.log(`ERROR  ${rel}: em dash in prose (${n}x) - banned reader-facing`);
    errors++;
  }
  const honest = proseText.match(/\bhonest(ly|y)?\b/gi);
  if (honest) { console.log(`ERROR  ${rel}: banned word "${honest[0]}" (${honest.length}x)`); errors++; }

  // Broken intra-guide links: [text](NN-foo.md) or ../other-guide/NN-foo.md must
  // resolve to a real file (the slug-truncation artifact class of bug).
  for (const m of proseText.matchAll(/\]\((\.{0,2}\/?[^)#\s]+\.md)(#[^)]*)?\)/g)) {
    const target = resolve(dirname(f), m[1]);
    if (!existsSync(target)) { console.log(`ERROR  ${rel}: broken link "${m[1]}"`); errors++; }
  }

  // Stale count-claims: "_guide.md says N phases" vs the actual NN-*.md files.
  if (isGuide) {
    const claim = proseText.match(/\b(\d+)\s+phases\b/i);
    if (claim) {
      const actual = readdirSync(dirname(f)).filter((e) => /^\d+-.*\.md$/.test(e)).length;
      if (Number(claim[1]) !== actual) {
        console.log(`WARN   ${rel}: claims ${claim[1]} phases, folder has ${actual}`);
        warnings++;
      }
    }
  }

  // Fact freshness: a confidently stale year is worse than a broken link for a
  // beginner. Flag "as of <year>" / "latest ... <year>" / "currently ... <year>"
  // for any year before this one - review the claim, not necessarily the year.
  const THIS_YEAR = new Date().getFullYear();
  for (const m of proseText.matchAll(/\b(as of|latest|current(?:ly)?)\b[^.\n]{0,50}?\b(20[12]\d)\b/gi)) {
    if (Number(m[2]) < THIS_YEAR) {
      console.log(`WARN   ${rel}: freshness - "${m[0].trim().slice(0, 60)}"`);
      warnings++;
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
