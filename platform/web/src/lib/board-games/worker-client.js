function cancelled(message = 'Game request cancelled.') {
  const error = new Error(message);
  error.name = 'AbortError';
  return error;
}

// A fresh worker per job makes cancellation immediate, including runaway search.
export class GameWorkerClient {
  constructor({ createWorker = () => new Worker(new URL('./worker.js', import.meta.url), { type:'module' }), timeoutMs = 5000, getRevision = null } = {}) {
    this.createWorker = createWorker;
    this.timeoutMs = timeoutMs;
    this.getRevision = getRevision;
    this.active = new Set();
    this.nextId = 1;
    this.disposed = false;
  }

  request(job, { signal } = {}) {
    if (this.disposed || signal?.aborted) return Promise.reject(cancelled());
    return new Promise((resolve, reject) => {
      let worker, timer;
      const abort = () => settle(cancelled());
      const cleanup = () => {
        clearTimeout(timer);
        signal?.removeEventListener('abort', abort);
        if (worker) {
          worker.removeEventListener('message', message);
          worker.removeEventListener('error', failure);
          worker.removeEventListener('messageerror', failure);
          worker.terminate();
        }
        this.active.delete(abort);
      };
      let settled = false;
      const settle = (error, value) => {
        if (settled) return;
        settled = true;
        cleanup();
        if (error) reject(error); else resolve(value);
      };
      const id = this.nextId++;
      const message = ({ data }) => {
        if (!data || data.id !== id) return;
        if (data.revision !== job.revision || (this.getRevision && this.getRevision() !== job.revision)) {
          settle(cancelled('Position changed; old result discarded.'));
        } else if (data.error) {
          settle(new Error(data.error.message || 'Game worker failed. Retry this turn.'));
        } else {
          settle(null, { ...data.result, revision: data.revision });
        }
      };
      const failure = (event) => settle(new Error(event?.message || 'Game worker crashed. Retry this turn.'));
      try {
        worker = this.createWorker();
        this.active.add(abort);
        signal?.addEventListener('abort', abort, { once:true });
        worker.addEventListener('message', message);
        worker.addEventListener('error', failure);
        worker.addEventListener('messageerror', failure);
        timer = setTimeout(() => settle(new Error('Game worker timed out. Retry this turn.')), this.timeoutMs);
        worker.postMessage({ ...job, id });
      } catch (error) {
        settle(error);
      }
    });
  }

  dispose() {
    this.disposed = true;
    for (const abort of [...this.active]) abort();
  }
}
