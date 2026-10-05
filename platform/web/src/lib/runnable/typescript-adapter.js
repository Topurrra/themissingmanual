// TypeScript - strips type syntax with Sucrase, then hands the resulting
// plain JS to the exact same sandboxed JS Web Worker JsAdapter already runs
// code in (js-worker.js). Composes the registry's own 'js' adapter instance
// via getAdapter('js'), keeping execution, cancellation and timeout logic shared.
//
// Sucrase is NOT a type-checker: it deletes type annotations/interfaces/
// generics syntax and hands back plain JS. A learner's TS "bugs" that are
// actually type errors (e.g. assigning a string where a number was declared)
// will still run fine - only real syntax errors (a stray unclosed `<T>`, a
// missing `>`, etc.) are caught below.
import { getAdapter } from './adapters.js';

export class TypeScriptAdapter {
  label = 'TypeScript';
  #inner = null;

  async cmLang() {
    const { javascript } = await import('@codemirror/lang-javascript');
    return javascript({ typescript: true });
  }

  async load(onStatus) {
    if (!this.#inner) this.#inner = getAdapter('js');
    await this.#inner.load(onStatus);
  }

  async run(code, opts) {
    if (!this.#inner) this.#inner = getAdapter('js');
    let transpiled;
    try {
      const { transform } = await import('sucrase');
      transpiled = transform(code, { transforms: ['typescript'] }).code;
    } catch (err) {
      const text = `TypeScript syntax error: ${err.message || String(err)}`;
      return { error: text, errorMessage: text };
    }
    // JsAdapter owns an isolated worker for each execution, including TS runs.
    return this.#inner.run(transpiled, opts);
  }

  dispose() {
    if (this.#inner) this.#inner.dispose();
  }
}
