// Math/physics - a bare arithmetic expression, evaluated with expr-eval (not a
// WASM runtime - a small, pure-JS parser). No function stub, no variables: the
// learner types a formula (e.g. "10 + 10 / 10 * 10^2") and Run evaluates it
// directly. Grading reuses the existing `output` mode unchanged (runners.js's
// gradeOutput() trim-compares `logs` against lesson.expectedOutput) - this
// adapter's only job is to produce that `logs` string in a format lesson
// authors can predict and match byte-for-byte.
//
// Formatting rule (documented here because every lesson's `expectedOutput`
// must be written to match it exactly - see practice-math/practice-physics):
//   Math.round(value * 10000) / 10000, then String() it.
// This rounds to at most 4 decimal places, and JS's Number->String conversion
// strips trailing zeros for free (4.5000 -> "4.5", 6.000001 -> "6", 6 -> "6").
// Applied uniformly to every result, integer or not - no separate int/float
// branch needed. Verified against a real expr-eval Node spike (see the round 7
// report) before any lesson's expectedOutput was written.
function formatResult(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error('Expression did not evaluate to a number.');
  }
  const rounded = Math.round(value * 10000) / 10000;
  return Object.is(rounded, -0) ? '0' : String(rounded);
}

export class MathAdapter {
  label = 'Math';
  #Parser = null;

  async cmLang() {
    // Deliberately no syntax highlighting - this is bare arithmetic notation
    // ("10 + 10 / 10 * 10^2"), not a programming language, so a code-editor
    // mode would be visually wrong. Plain text editor.
    return null;
  }

  async load() {
    if (!this.#Parser) {
      // Dynamic import so Vite code-splits expr-eval into its own lazy chunk,
      // loaded only when a math/physics lesson actually runs.
      const { Parser } = await import('expr-eval');
      this.#Parser = Parser;
    }
  }

  async run(code) {
    if (!this.#Parser) await this.load();
    try {
      const value = this.#Parser.evaluate((code || '').trim());
      return { logs: formatResult(value) };
    } catch (err) {
      const text =
        err && /unexpected|parse error|Unknown character/i.test(err.message || '')
          ? "That's not a valid expression - check for a missing operator or parenthesis."
          : String((err && err.message) || err);
      return { error: text, errorMessage: text };
    }
  }

  dispose() {
    // No handles to release - expr-eval's Parser is a stateless class instance.
  }
}
