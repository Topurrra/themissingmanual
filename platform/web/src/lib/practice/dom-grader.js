// Renders a learner's HTML offscreen and reads back ONLY the facts a lesson's
// `checks` ask about. Checks are declarative data, never code, and that isn't a
// style preference - it's forced by two walls that meet here:
//
//   - This site's CSP has no 'unsafe-eval' on the main thread, so evaluating a
//     test *string* throws a violation (gradeWat's note in runners.js hit this
//     first, and confirmed it in a real browser).
//   - The one place eval IS allowed - the JS Web Worker - has no DOM, so it
//     cannot inspect a rendered page at all.
//
// So there is nowhere to run DOM assertion code. Declarative checks need no eval:
// this module does the querying, and runners.js compares the results.
//
// The frame is sandboxed WITHOUT allow-scripts, so nothing in the learner's HTML
// executes - verified live: a <script> and an inline onerror both stayed inert and
// the parent was unreachable. `allow-same-origin` is only what lets us read
// contentDocument/getComputedStyle back out; with no scripts able to run inside,
// it grants the page nothing.
//
// srcdoc needs no CSP change: it loads no URL, so `frame-src` never gates it
// (verified against the live header, which allows only translate.google.com).

// Fixed size so layout-dependent values (widths, wrapping, flex behaviour) are
// deterministic - the visible preview panel is whatever width the reader dragged
// it to, which must never change whether a lesson passes.
const GRADE_WIDTH = 800;
const GRADE_HEIGHT = 600;
const RENDER_TIMEOUT_MS = 3000;

// Collapse whitespace the way a reader perceives text, so an author isn't grading
// the learner's indentation.
const norm = (s) => (s || '').trim().replace(/\s+/g, ' ');

// compareCheck(check, mine, ref) -> { name, passed, message? }
//
// Pure: takes the two probe facts and decides, with no DOM and no imports, which
// is what makes it the one thing here that a plain `node` selfcheck can cover
// (dom-grader.selfcheck.mjs). Lives beside probe() rather than in runners.js so
// this module owns the whole grading semantics: what to read, and what it means.
export function compareCheck(check, mine, ref) {
  const name = check.name;
  const fail = (message) => ({ name, passed: false, message });
  if (mine.selectorError || ref.selectorError) {
    return fail(`This check's selector is invalid (${check.selector}) - report it as a bug.`);
  }
  if (check.count && mine.count !== ref.count) {
    const plural = ref.count === 1 ? '' : 's';
    return fail(`Expected ${ref.count} element${plural} matching ${check.selector}, found ${mine.count}.`);
  }
  if (!mine.count) return fail(`Nothing matches ${check.selector} yet.`);
  if (check.text && mine.text !== ref.text) {
    return fail(`Expected ${check.selector} to read "${ref.text}", got "${mine.text}".`);
  }
  for (const prop of check.styles || []) {
    if (mine.styles?.[prop] !== ref.styles?.[prop]) {
      return fail(`Expected ${check.selector} ${prop} to be ${ref.styles?.[prop]}, got ${mine.styles?.[prop]}.`);
    }
  }
  return { name, passed: true };
}

// probe(html, checks) -> [{ count, text?, styles? }] aligned with `checks`, or
// null if the page could not be rendered.
export async function probe(html, checks) {
  if (typeof document === 'undefined') return null;
  const frame = document.createElement('iframe');
  frame.setAttribute('sandbox', 'allow-same-origin');
  frame.setAttribute('aria-hidden', 'true');
  frame.setAttribute('tabindex', '-1');
  frame.style.cssText =
    `position:fixed;left:-10000px;top:0;visibility:hidden;border:0;` +
    `width:${GRADE_WIDTH}px;height:${GRADE_HEIGHT}px`;

  try {
    const loaded = new Promise((resolve) => {
      frame.addEventListener('load', resolve, { once: true });
      // A page that never fires load (a stalled image, say) must not hang grading.
      setTimeout(resolve, RENDER_TIMEOUT_MS);
    });
    frame.srcdoc = html;
    document.body.appendChild(frame);
    await loaded;

    const doc = frame.contentDocument;
    const win = frame.contentWindow;
    if (!doc || !win) return null;

    return checks.map((check) => {
      let els;
      try {
        els = doc.querySelectorAll(check.selector);
      } catch (e) {
        // An invalid selector is an authoring bug, not a learner mistake.
        return { count: 0, selectorError: String(e.message || e) };
      }
      const fact = { count: els.length };
      const first = els[0];
      if (!first) return fact;
      if (check.text) fact.text = norm(first.textContent);
      if (check.styles?.length) {
        const cs = win.getComputedStyle(first);
        fact.styles = {};
        for (const prop of check.styles) fact.styles[prop] = cs.getPropertyValue(prop);
      }
      return fact;
    });
  } catch (e) {
    return null;
  } finally {
    frame.remove();
  }
}
