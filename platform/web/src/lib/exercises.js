// Practice exercises authored directly in a phase's Markdown via an ```exercise fenced
// block holding a JSON array. Four item shapes:
//   { type: 'predict', task, accept: ['exact answer', '/regex/i', ...], hint? }
//     Deterministic: the reader types an answer, checked against `accept` (trim +
//     case-insensitive; an entry wrapped in /../flags is treated as a regex).
//   { type: 'task', task, reveal, checklist: ['did X', 'did Y', ...] }
//     Open-ended: the reader can reveal a reference approach, then self-ticks a
//     checklist. No right/wrong grading - self-assessment only.
//   { type: 'regex', task, mustMatch: [...], mustNotMatch: [...], hint? }
//     The reader types a regex; it's tested against every sample (must match the
//     mustMatch ones, must not match the mustNotMatch ones).
//   { type: 'json', task, expected: <any JSON value>, hint? }
//     The reader types a JSON literal; it's deep-equal-compared to `expected`
//     (object key order doesn't matter, array order does).
// Mirrors parseQuizBlock in quizzes.js exactly (same regex-the-raw-markdown approach).
export function parseExerciseBlock(markdown) {
  if (!markdown) return null;
  const m = markdown.match(/```exercise\s*\n([\s\S]*?)```/i);
  if (!m) return null;
  try {
    const data = JSON.parse(m[1].trim());
    if (Array.isArray(data) && data.length) return data;
  } catch (e) {}
  return null;
}

// Checks a typed answer against an exercise's `accept` list. A /pattern/flags-shaped
// entry is used as a regex test; anything else is a trimmed, case-insensitive match.
export function checkAnswer(input, accept) {
  const val = String(input ?? '').trim();
  if (!val) return false;
  const lower = val.toLowerCase();
  return (accept || []).some((a) => {
    const re = String(a).match(/^\/(.*)\/([a-z]*)$/i);
    if (re) {
      try { return new RegExp(re[1], re[2]).test(val); } catch (e) { return false; }
    }
    return String(a).trim().toLowerCase() === lower;
  });
}

// Checks a learner-typed regex against sample strings: every `mustMatch` sample has to
// match, every `mustNotMatch` sample has to not match. Invalid regex syntax is reported
// as `error` instead of thrown, so a typo can't crash the component.
export function checkRegex(input, mustMatch, mustNotMatch) {
  const val = String(input ?? '').trim();
  if (!val) return { correct: false, error: null };
  let re;
  try {
    re = new RegExp(val);
  } catch (e) {
    return { correct: false, error: "That's not a valid regular expression." };
  }
  const correct =
    (mustMatch || []).every((s) => re.test(s)) && (mustNotMatch || []).every((s) => !re.test(s));
  return { correct, error: null };
}

// Checks a learner-typed JSON literal against `expected` via order-independent deep
// equality (object key order doesn't matter, array order does). Invalid JSON is
// reported as `error` instead of thrown.
export function checkJson(input, expected) {
  const val = String(input ?? '').trim();
  if (!val) return { correct: false, error: null };
  let parsed;
  try {
    parsed = JSON.parse(val);
  } catch (e) {
    return { correct: false, error: "That's not valid JSON." };
  }
  return { correct: deepEqual(parsed, expected), error: null };
}

function deepEqual(a, b) {
  if (a === b) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a)) return a.length === b.length && a.every((v, i) => deepEqual(v, b[i]));
  const ak = Object.keys(a), bk = Object.keys(b);
  return ak.length === bk.length && ak.every((k) => Object.prototype.hasOwnProperty.call(b, k) && deepEqual(a[k], b[k]));
}
