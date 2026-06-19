// Dependency-free line-level diff (LCS over lines).
//
// diffLines(oldText, newText) -> [{ type: 'add' | 'del' | 'same', text }]
//
// Reads as "what it takes to turn oldText into newText": 'del' lines exist in
// oldText only, 'add' lines exist in newText only, 'same' lines are unchanged.
// Classic O(n*m) LCS DP + backtrack. Inputs are guide phases (hundreds of lines
// at most), so the quadratic table is fine.

export function diffLines(oldText, newText) {
  const a = splitLines(oldText);
  const b = splitLines(newText);

  // LCS length table: lcs[i][j] = length of LCS of a[i..] and b[j..].
  const n = a.length;
  const m = b.length;
  const lcs = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }

  // Backtrack to produce the merged sequence, preferring 'same' on a match.
  const out = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      out.push({ type: 'same', text: a[i] });
      i++;
      j++;
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      out.push({ type: 'del', text: a[i] });
      i++;
    } else {
      out.push({ type: 'add', text: b[j] });
      j++;
    }
  }
  while (i < n) out.push({ type: 'del', text: a[i++] });
  while (j < m) out.push({ type: 'add', text: b[j++] });
  return out;
}

// Normalise line endings, then split. A trailing newline would otherwise add a
// spurious empty last line; trim only that single trailing separator.
function splitLines(text) {
  const s = (text ?? '').replace(/\r\n?/g, '\n');
  const lines = s.split('\n');
  if (lines.length > 1 && lines[lines.length - 1] === '') lines.pop();
  return lines;
}
