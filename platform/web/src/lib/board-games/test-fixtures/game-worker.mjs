import { parentPort } from 'node:worker_threads';
import { handleJob } from '../worker.js';

parentPort.on('message', (job) => {
  try {
    parentPort.postMessage({ id: job?.id, revision: job?.revision, result: handleJob(job) });
  } catch (error) {
    parentPort.postMessage({ id: job?.id, revision: job?.revision, error: { message: error.message } });
  }
});
