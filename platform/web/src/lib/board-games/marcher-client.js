import * as checkers from './checkers.js';

// One transport owns one search worker. GameWorkerClient terminates it on
// cancellation, so a synchronous WASM search cannot leave stale work running.
export class MarcherTransport {
  constructor({ WorkerClass = Worker } = {}) {
    this.worker = new WorkerClass('/games/engines/marcher/adapter-worker.js');
    this.listeners = new Map();
    this.worker.addEventListener('message', event => {
      const { data } = event;
      if (data?.result?.action) {
        try {
          const state = this.state;
          if (!state || !checkers.legalMoves(state).some(move =>
            JSON.stringify(move.path) === JSON.stringify(data.result.action.path))) {
            throw new Error('Marcher returned an illegal checkers route');
          }
        } catch (error) {
          this.emit('message', { data: { id: data.id, revision: data.revision, error: { message: error.message } } });
          return;
        }
      }
      this.emit('message', event);
    });
    for (const type of ['error', 'messageerror']) {
      this.worker.addEventListener(type, event => this.emit(type, event));
    }
  }

  emit(type, event) { for (const listener of this.listeners.get(type) ?? []) listener(event); }
  addEventListener(type, listener) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type).add(listener);
  }
  removeEventListener(type, listener) { this.listeners.get(type)?.delete(listener); }

  postMessage(job) {
    try {
      if (job?.game !== 'checkers' || !['move', 'hint'].includes(job.kind)) throw new Error('Unsupported Marcher job');
      const state = checkers.restoreState(job.state);
      if (checkers.getStatus(state).phase !== 'playing') throw new Error('Game is not in play');
      let legal = checkers.legalMoves(state);
      if (job.kind === 'hint' && job.selection != null) {
        const prefix = Number.isInteger(job.selection) ? [job.selection] :
          Array.isArray(job.selection) ? job.selection : [];
        legal = legal.filter(move => prefix.every((square, index) => move.path[index] === square));
      }
      if (!legal.length) throw new Error('No legal action for this selection');
      this.state = state;
      this.worker.postMessage({ ...job, board: state.board, turn: state.turn,
        legalPaths: legal.map(move => move.path) });
    } catch (error) {
      queueMicrotask(() => this.emit('message', { data: {
        id: job?.id, revision: job?.revision, error: { message: error.message }
      } }));
    }
  }
  terminate() { this.worker.terminate(); this.listeners.clear(); this.state = null; }
}
