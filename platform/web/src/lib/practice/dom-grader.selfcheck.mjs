// ponytail: no test framework wired up for platform/web (same as
// related-guides/selfcheck.mjs) - this is the one runnable check for the part of
// dom-grader that decides pass/fail. probe() needs a real browser and is verified
// live; compareCheck() is pure, so it gets covered here.
// Run: node src/lib/practice/dom-grader.selfcheck.mjs
import { compareCheck } from './dom-grader.js';

let failures = 0;
function check(name, cond) {
  if (!cond) {
    failures++;
    console.error('FAIL: ' + name);
  }
}

// A style difference is caught, and the message names both sides.
{
  const c = { name: 'the cards sit in a row', selector: '.cards', styles: ['display'] };
  const r = compareCheck(c, { count: 1, styles: { display: 'block' } }, { count: 1, styles: { display: 'flex' } });
  check('style mismatch fails', r.passed === false);
  check('style message names expected', r.message.includes('flex'));
  check('style message names actual', r.message.includes('block'));
}

// Matching styles pass.
{
  const c = { name: 'row', selector: '.cards', styles: ['display', 'gap'] };
  const same = { count: 1, styles: { display: 'flex', gap: '16px' } };
  check('identical styles pass', compareCheck(c, same, same).passed === true);
}

// The whole point of grading against the solution: a different technique that
// computes to the same value must pass (flex-flow: row vs flex-direction: row).
{
  const c = { name: 'row', selector: '.cards', styles: ['flex-direction'] };
  const viaFlexFlow = { count: 1, styles: { 'flex-direction': 'row' } };
  const viaDirection = { count: 1, styles: { 'flex-direction': 'row' } };
  check('equivalent technique passes', compareCheck(c, viaFlexFlow, viaDirection).passed === true);
}

// count is only compared when the check asks for it.
{
  const c = { name: 'three cards', selector: '.card', count: true };
  const r = compareCheck(c, { count: 2 }, { count: 3 });
  check('count mismatch fails', r.passed === false);
  check('count message pluralises', r.message.includes('3 elements'));

  const singular = compareCheck({ name: 'one h1', selector: 'h1', count: true }, { count: 0 }, { count: 1 });
  check('count message singularises', singular.message.includes('1 element matching'));

  const notAsked = { name: 'exists', selector: '.card' };
  check('count ignored when not requested', compareCheck(notAsked, { count: 2 }, { count: 3 }).passed === true);
}

// A selector matching nothing is reported as such, not as a confusing style diff.
{
  const c = { name: 'has a nav', selector: 'nav', styles: ['display'] };
  const r = compareCheck(c, { count: 0 }, { count: 1, styles: { display: 'flex' } });
  check('missing element fails', r.passed === false);
  check('missing element says so', r.message.includes('Nothing matches nav'));
}

// Text is compared only when asked, and reported readably.
{
  const c = { name: 'heading text', selector: 'h1', text: true };
  const r = compareCheck(c, { count: 1, text: 'Hi' }, { count: 1, text: 'Hello' });
  check('text mismatch fails', r.passed === false);
  check('text message shows expected', r.message.includes('"Hello"'));
  check('text match passes', compareCheck(c, { count: 1, text: 'Hello' }, { count: 1, text: 'Hello' }).passed === true);
}

// An author's broken selector must read as a bug report, not a learner failure.
{
  const c = { name: 'bad', selector: '.. nope' };
  const r = compareCheck(c, { count: 0, selectorError: 'bad selector' }, { count: 0, selectorError: 'bad selector' });
  check('invalid selector is flagged as a bug', r.passed === false && r.message.includes('report it as a bug'));
}

if (failures) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log('dom-grader selfcheck: all checks passed');
