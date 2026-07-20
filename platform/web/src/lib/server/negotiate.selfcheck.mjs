// ponytail: no test framework wired up for platform/web (same as related-guides/selfcheck.mjs,
// dom-grader.selfcheck.mjs, providers.selfcheck.mjs). Accept parsing is exactly the kind of
// thing that looks obvious and is wrong in production - the previous rule shipped for months
// and rejected every agent that listed an HTML fallback.
// Run: node src/lib/server/negotiate.selfcheck.mjs
import { prefersMarkdown } from './negotiate.js';

let failures = 0;
function check(name, cond) {
  if (!cond) {
    failures++;
    console.error('FAIL: ' + name);
  }
}

// --- browsers must ALWAYS keep getting HTML ---
check(
  'chrome/firefox default -> html',
  !prefersMarkdown('text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8')
);
check('plain text/html -> html', !prefersMarkdown('text/html'));
check('curl default */* -> html', !prefersMarkdown('*/*'));
check('empty accept -> html', !prefersMarkdown(''));
check('missing accept -> html', !prefersMarkdown(undefined));
check('json client -> html (no markdown wanted)', !prefersMarkdown('application/json'));

// --- agents must get markdown ---
check('markdown only', prefersMarkdown('text/markdown'));
// THE REGRESSION: this is what a real agent sends, and it used to return HTML.
check(
  'markdown with html fallback (the bug)',
  prefersMarkdown('text/markdown, text/html;q=0.9, */*;q=0.8')
);
check('explicit q ordering', prefersMarkdown('text/markdown;q=1.0, text/html;q=0.5'));
check('both listed equally -> markdown (client named it)', prefersMarkdown('text/markdown, text/html'));
check('case insensitive', prefersMarkdown('TEXT/MARKDOWN'));
check('whitespace tolerant', prefersMarkdown('  text/markdown ,  text/html;q=0.2 '));

// --- html explicitly preferred over markdown -> html ---
check('html outranks markdown', !prefersMarkdown('text/html, text/markdown;q=0.5'));
check('markdown q=0 is a refusal', !prefersMarkdown('text/markdown;q=0, text/html'));

// --- malformed input must not throw or flip the default ---
check('garbage q', prefersMarkdown('text/markdown;q=abc') === true);
check('junk accept -> html', !prefersMarkdown(';;;,,,'));

if (failures) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log('negotiate selfcheck: all checks passed');
