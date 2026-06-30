// Pure question generators + scoring for the brain-training games (/train).
// Each generator returns a question object the page renders:
//   { prompt?, promptSvg?, choices:[…], answer:int, big?, mono?, cols?, svg?, hint? }
// Kept framework-free so the logic is testable on its own (see games.test.mjs).

export const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
export const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = rand(0, i); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};

// ---- SVG helpers (patterns + rotation) ----
const DOTPOS = [[15,15],[30,15],[45,15],[15,30],[30,30],[45,30],[15,45],[30,45],[45,45]];
const dotsSvg = (n) => {
  let s = '';
  for (let i = 0; i < n; i++) s += `<circle cx="${DOTPOS[i][0]}" cy="${DOTPOS[i][1]}" r="4.2" fill="currentColor"/>`;
  return `<svg viewBox="0 0 60 60" class="tr-svg" aria-hidden="true">${s}</svg>`;
};
const arrowSvg = (deg) =>
  `<svg viewBox="0 0 60 60" class="tr-svg" aria-hidden="true"><g transform="rotate(${deg} 30 30)"><line x1="30" y1="46" x2="30" y2="18" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><path d="M22 24 L30 12 L38 24 Z" fill="currentColor"/></g></svg>`;
const glyphSvg = (ch, deg, mirror) =>
  `<svg viewBox="-30 -30 60 60" class="tr-svg" aria-hidden="true"><text text-anchor="middle" dominant-baseline="central" font-family="var(--font-display)" font-size="40" font-weight="700" fill="currentColor" transform="rotate(${deg}) scale(${mirror ? -1 : 1} 1)">${ch}</text></svg>`;
const matrixSvg = (grid, render) => {
  let html = '';
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
    const last = r === 2 && c === 2;
    html += `<div class="tr-mx-cell">${last ? '<span class="tr-mx-q">?</span>' : render(grid[r][c])}</div>`;
  }
  return `<div class="tr-mx">${html}</div>`;
};
const GLYPHS = ['F', 'R', 'G', 'J', 'L', 'P', 'Q', '7', 'E', 'h'];

// ---- Generators ----
export function makeMath(diff) {
  const cfg = { easy: { add: 20, mul: 5 }, medium: { add: 50, mul: 12 }, hard: { add: 99, mul: 20 } }[diff];
  const ops = diff === 'easy' ? ['+', '−', '×'] : ['+', '−', '×', '×'];
  const op = ops[rand(0, ops.length - 1)];
  let a, b, ans;
  if (op === '×') { a = rand(2, cfg.mul); b = rand(2, cfg.mul); ans = a * b; }
  else if (op === '+') { a = rand(2, cfg.add); b = rand(2, cfg.add); ans = a + b; }
  else { a = rand(Math.floor(cfg.add / 3), cfg.add); b = rand(2, a - 1); ans = a - b; }
  const set = new Set([ans]);
  while (set.size < 4) { const d = ans + rand(-9, 9); if (d >= 0) set.add(d); }
  const choices = shuffle([...set]).map(String);
  return { prompt: `${a} ${op} ${b}`, choices, answer: choices.indexOf(String(ans)), big: true, cols: true };
}

export function makeSequence(level) {
  const rules = [
    () => { const a = rand(1, 9), d = rand(2, 6); const t = [a, a + d, a + 2 * d, a + 3 * d]; return { t, next: a + 4 * d }; },
    () => { const a = rand(2, 4), r = rand(2, 3); const t = [a, a * r, a * r * r, a * r * r * r]; return { t, next: a * r * r * r * r }; },
    () => { let a = rand(1, 5), inc = rand(1, 3); const t = [a]; for (let i = 0; i < 3; i++) { a += inc; t.push(a); inc++; } return { t, next: a + inc }; },
    () => { const s = rand(0, 2); const t = [1, 2, 3, 4].map((n) => (n + s) * (n + s)); return { t, next: (5 + s) * (5 + s) }; },
    () => { let x = rand(1, 4), y = rand(2, 5); const t = [x, y]; for (let i = 0; i < 2; i++) { const z = x + y; t.push(z); x = y; y = z; } return { t, next: x + y }; },
    () => { let a = rand(1, 4); const t = [a]; for (let i = 0; i < 3; i++) { a = a * 2 + 1; t.push(a); } return { t, next: a * 2 + 1 }; }
  ];
  const maxRule = Math.min(rules.length, 2 + Math.floor(level / 1.5));
  const r = rules[rand(0, maxRule - 1)]();
  const ans = r.next;
  const set = new Set([ans]);
  const jit = [ans + 1, ans - 1, ans + 2, ans - 2, r.t[3] + (r.t[3] - r.t[2]), ans + rand(3, 8), ans - rand(3, 8)];
  for (const d of shuffle(jit)) { if (set.size >= 4) break; if (Number.isFinite(d) && d > 0 && d !== ans) set.add(d); }
  while (set.size < 4) set.add(ans + rand(5, 15));
  const choices = shuffle([...set]).map(String);
  return { prompt: r.t.join(',   ') + ',   ?', choices, answer: choices.indexOf(String(ans)), mono: true, cols: true };
}

export function makePattern(level) {
  const useArrows = level >= 3 && Math.random() < 0.5;
  if (useArrows) {
    const start = rand(0, 7) * 45, step = (rand(0, 1) ? 45 : 90);
    const grid = []; for (let r = 0; r < 3; r++) { const row = []; for (let c = 0; c < 3; c++) row.push((start + c * step + r * step) % 360); grid.push(row); }
    const render = (v) => arrowSvg(v);
    const ans = grid[2][2];
    const set = new Set([ans]);
    for (const d of shuffle([45, 90, 135, 180, 225, 270, 315].map((x) => (ans + x) % 360))) { if (set.size >= 4) break; set.add(d); }
    const choices = shuffle([...set]).map(render);
    return { promptSvg: matrixSvg(grid, render), choices, answer: choices.indexOf(render(ans)), svg: true };
  }
  const base = rand(1, 2), rowStep = rand(1, 2);
  const grid = []; for (let r = 0; r < 3; r++) { const row = []; for (let c = 0; c < 3; c++) row.push(base + c + r * rowStep); grid.push(row); }
  const render = (v) => dotsSvg(v);
  const ans = grid[2][2];
  const set = new Set([ans]);
  for (const d of shuffle([ans + 1, ans - 1, ans + 2, ans - 2, grid[2][1], grid[1][2]])) { if (set.size >= 4) break; if (d >= 1 && d <= 9 && d !== ans) set.add(d); }
  while (set.size < 4) { const d = rand(1, 9); if (d !== ans) set.add(d); }
  const choices = shuffle([...set]).map(render);
  return { promptSvg: matrixSvg(grid, render), choices, answer: choices.indexOf(render(ans)), svg: true };
}

export function makeRotation(level) {
  const ch = GLYPHS[rand(0, GLYPHS.length - 1)];
  const angles = shuffle([45, 90, 135, 180, 225, 270, 315]);
  const ansSvg = glyphSvg(ch, angles[0], false);
  const distract = [];
  let i = 1;
  while (distract.length < 3) { distract.push(glyphSvg(ch, angles[i % angles.length], true)); i++; }
  const choices = shuffle([ansSvg, ...distract]);
  return { promptSvg: `<div class="tr-rot-target">${glyphSvg(ch, 0, false)}</div>`, choices, answer: choices.indexOf(ansSvg), svg: true, hint: 'One choice is the target simply rotated. The others are mirror images.' };
}

// Honest composite for the Brain Challenge: mostly accuracy, small capped speed bonus.
// NOT a clinical IQ - see the disclaimer shown on the results screen.
export function challengeScore(results) {
  const total = results.length || 1;
  const right = results.filter((r) => r.ok).length;
  const acc = right / total;
  const avgMs = results.reduce((s, r) => s + r.ms, 0) / total;
  const speedBonus = Math.max(0, Math.min(8, Math.round((6000 - avgMs) / 600)));
  const score = Math.min(100, Math.round(acc * 92) + (acc > 0 ? speedBonus : 0));
  const band = score >= 85 ? 'Razor sharp' : score >= 70 ? 'Strong' : score >= 50 ? 'Solid' : score >= 30 ? 'Warming up' : 'Keep training';
  return { score, band };
}
