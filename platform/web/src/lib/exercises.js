// Practice exercises authored directly in a phase's Markdown via an ```exercise fenced
// block holding a JSON array. Two item shapes:
//   { type: 'predict', task, accept: ['exact answer', '/regex/i', ...], hint? }
//     Deterministic: the reader types an answer, checked against `accept` (trim +
//     case-insensitive; an entry wrapped in /../flags is treated as a regex).
//   { type: 'task', task, reveal, checklist: ['did X', 'did Y', ...] }
//     Open-ended: the reader can reveal a reference approach, then self-ticks a
//     checklist. No right/wrong grading - self-assessment only.
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
