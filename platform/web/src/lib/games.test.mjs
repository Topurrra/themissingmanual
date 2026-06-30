// Self-check for the brain-game generators: run `node src/lib/games.test.mjs`.
// Guards the one bug that silently ruins the games - the answer index pointing
// at the wrong choice - plus the scoring formula. No framework on purpose.
import { makeMath, makeSequence, makePattern, makeRotation, challengeScore } from './games.js';
import assert from 'node:assert';

const N = 4000;

function structural(q, label) {
  assert.equal(q.choices.length, 4, `${label}: expected 4 choices`);
  assert.ok(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < 4, `${label}: answer index out of range (${q.answer})`);
  assert.equal(new Set(q.choices).size, 4, `${label}: choices must be unique (a duplicate can mis-align the answer)`);
}

// makeMath - answer is fully verifiable from the prompt.
for (const diff of ['easy', 'medium', 'hard']) {
  for (let i = 0; i < N; i++) {
    const q = makeMath(diff);
    structural(q, `math/${diff}`);
    const [a, op, b] = q.prompt.split(' ');
    const x = +a, y = +b;
    const expected = op === '×' ? x * y : op === '+' ? x + y : x - y;
    assert.equal(q.choices[q.answer], String(expected), `math/${diff}: marked choice != ${a}${op}${b}`);
  }
}

// makeSequence - structural + the marked answer is a positive integer.
for (let lvl = 1; lvl <= 8; lvl++) {
  for (let i = 0; i < N; i++) {
    const q = makeSequence(lvl);
    structural(q, `seq/${lvl}`);
    assert.ok(/^\d+$/.test(q.choices[q.answer]), `seq/${lvl}: marked answer not a positive integer`);
  }
}

// makePattern - structural; the marked answer SVG is one of the rendered choices.
for (let lvl = 1; lvl <= 8; lvl++) {
  for (let i = 0; i < N; i++) {
    const q = makePattern(lvl);
    structural(q, `pattern/${lvl}`);
    assert.ok(q.choices[q.answer].startsWith('<svg'), `pattern/${lvl}: marked answer not an svg`);
  }
}

// makeRotation - the correct choice must be the ONLY non-mirrored glyph.
for (let lvl = 1; lvl <= 8; lvl++) {
  for (let i = 0; i < N; i++) {
    const q = makeRotation(lvl);
    structural(q, `rot/${lvl}`);
    const mirrored = q.choices.map((c) => c.includes('scale(-1 1)'));
    assert.equal(mirrored.filter(Boolean).length, 3, `rot/${lvl}: expected exactly 3 mirror distractors`);
    assert.equal(mirrored[q.answer], false, `rot/${lvl}: the marked answer must be the non-mirrored glyph`);
  }
}

// challengeScore - bounds + band thresholds.
const allRightFast = challengeScore(Array.from({ length: 12 }, () => ({ ok: true, ms: 1000 })));
assert.equal(allRightFast.score, 100, 'perfect + fast should cap at 100');
const allRightSlow = challengeScore(Array.from({ length: 12 }, () => ({ ok: true, ms: 5000 })));
assert.ok(allRightSlow.score >= 92 && allRightSlow.score <= 100, `perfect run should be >=92 (got ${allRightSlow.score})`);
assert.equal(allRightSlow.band, 'Razor sharp');
const allWrong = challengeScore(Array.from({ length: 12 }, () => ({ ok: false, ms: 2000 })));
assert.equal(allWrong.score, 0);
assert.equal(allWrong.band, 'Keep training');
const half = challengeScore(Array.from({ length: 12 }, (_, i) => ({ ok: i % 2 === 0, ms: 9000 })));
assert.ok(half.score >= 40 && half.score <= 60, `half-right score out of expected band: ${half.score}`);

console.log('games.test.mjs - all checks passed');
