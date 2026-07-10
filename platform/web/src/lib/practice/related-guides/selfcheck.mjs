// ponytail: no test framework wired up for platform/web - this is the one
// runnable check for index.js's non-trivial bit (the reverse-map derivation).
// Run: node src/lib/practice/related-guides/selfcheck.mjs
import { relatedGuideFor, practiceLessonFor } from './index.js';

function assert(cond, msg) {
  if (!cond) throw new Error('FAIL: ' + msg);
}

assert(relatedGuideFor('sql', 1) === 'querying-basics-select-where#1', 'sql lesson 1 forward lookup');
assert(relatedGuideFor('sql', 4) === null, 'unmapped sql lesson returns null, not a forced guess');
assert(relatedGuideFor('nope', 1) === null, 'unknown module returns null instead of throwing');

const rev = practiceLessonFor('querying-basics-select-where', 1);
assert(rev && rev.module === 'sql' && rev.phaseNo === 1, 'reverse lookup derives {module, phaseNo} from the same map');
assert(practiceLessonFor('some-guide-with-no-lesson', 9) === null, 'reverse lookup of an unmapped guide phase returns null');

console.log('related-guides/selfcheck: all assertions passed');
