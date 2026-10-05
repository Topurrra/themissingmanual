// Warm WASM workers serialize runs so interpreter/database state and stdout
// cannot overlap. A failed/terminated worker is rebuilt for the next request.
export class RuntimeAdapter {
  timeoutMs = 5000;
  loadingTimeoutMs = 60000;
  #worker = null;
  #queue = [];
  #active = null;
  #seq = 0;

  constructor(language, createWorker) {
    this.language = language;
    this.label = { python: 'Python', sql: 'SQL', postgres: 'PostgreSQL' }[language];
    this.createWorker = createWorker;
  }

  async cmLang() {
    if (this.language === 'python') {
      const { python } = await import('@codemirror/lang-python');
      return python();
    }
    const { sql, PostgreSQL } = await import('@codemirror/lang-sql');
    return this.language === 'postgres' ? sql({ dialect: PostgreSQL }) : sql();
  }

  async load(onStatus, { signal } = {}) {
    const res = await this.#request('load', { onStatus, signal });
    if (res.error) throw new Error(res.error);
  }

  run(code, opts = {}) { return this.#request('run', { ...opts, code }); }

  #status(job, text) {
    try { job.opts.onStatus?.(text); } catch (e) { /* consumer callbacks do not own worker lifecycle */ }
  }

  #request(action, opts) {
    return new Promise((resolve) => {
      const job = { id: ++this.#seq, action, opts, resolve, done: false };
      job.cancel = () => {
        if (job.done) return;
        if (this.#active === job) this.#reset();
        this.#queue = this.#queue.filter((queued) => queued !== job);
        this.#finish(job, this.#failure('Execution cancelled.'));
      };
      if (opts.signal?.aborted) return job.cancel();
      opts.signal?.addEventListener('abort', job.cancel, { once: true });
      this.#queue.push(job);
      if (this.#active) this.#status(job, 'Waiting for the current run…');
      this.#pump();
    });
  }

  #failure(text) { return { error: text, errorMessage: text }; }

  #reset() {
    if (this.#worker) {
      this.#worker.onerror = this.#worker.onmessageerror = null;
      this.#worker.terminate();
      this.#worker = null;
    }
  }

  #finish(job, result) {
    if (job.done) return;
    job.done = true;
    clearTimeout(job.timer);
    job.opts.signal?.removeEventListener('abort', job.cancel);
    if (job.channel) job.channel.port1.onmessage = job.channel.port1.onmessageerror = null;
    job.channel?.port1.close();
    job.channel?.port2.close();
    if (this.#active === job) this.#active = null;
    this.#status(job, '');
    job.resolve(result);
    queueMicrotask(() => this.#pump());
  }

  #pump() {
    if (this.#active || !this.#queue.length) return;
    const job = this.#active = this.#queue.shift();
    const fail = (text) => {
      if (job.done) return;
      this.#reset();
      this.#finish(job, this.#failure(text));
    };
    const deadline = (ms, phase) => {
      clearTimeout(job.timer);
      job.timer = setTimeout(() => fail(`${phase} timed out after ${ms / 1000}s (terminated).`), ms);
    };
    try {
      if (!this.#worker) {
        const worker = this.#worker = this.createWorker();
        const workerFailure = (text) => {
          if (this.#worker !== worker) return;
          const active = this.#active;
          this.#reset();
          if (active) this.#finish(active, this.#failure(text));
        };
        // This handler belongs to the worker, not its last completed job. It
        // also discards idle crashes without retaining a widget's callbacks.
        worker.onerror = (e) => { e.preventDefault?.(); workerFailure(e.message || 'Runtime worker error.'); };
        worker.onmessageerror = () => workerFailure('Could not read runtime worker message.');
      }
      const channel = job.channel = new MessageChannel();
      deadline(this.loadingTimeoutMs, 'Runtime/package loading');
      channel.port1.onmessageerror = () => fail('Could not read runtime worker message.');
      channel.port1.onmessage = ({ data }) => {
        if (job.done || !data || data.id !== job.id) return;
        if (data.type === 'status' && typeof data.text === 'string') {
          this.#status(job, data.text);
        } else if (data.type === 'execute' && job.action === 'run' && !job.executing) {
          job.executing = true;
          deadline(this.timeoutMs, 'Execution');
        } else if (data.type === 'result' && data.result && typeof data.result === 'object') {
          // Failed startup/package loading can leave partial runtime state or a
          // cached rejected import. Recreate the worker before a later retry.
          if (data.result.error && !job.executing) this.#reset();
          this.#finish(job, data.result);
        } else {
          fail('Invalid runtime worker response.');
        }
      };
      this.#worker.postMessage({
        id: job.id, action: job.action, language: this.language,
        code: job.opts.code, seed: job.opts.seed, fresh: job.opts.fresh
      }, [channel.port2]);
    } catch (err) { fail(String(err.message || err)); }
  }

  dispose() {
    const jobs = [...this.#queue];
    this.#queue = [];
    if (this.#active) jobs.unshift(this.#active);
    this.#reset();
    for (const job of jobs) this.#finish(job, this.#failure('Execution cancelled.'));
  }
}
