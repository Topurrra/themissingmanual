import { parentPort } from 'node:worker_threads';
parentPort.on('message', job => {
  if (job.kind === 'hang') { while (true) {} }
  if (job.kind === 'crash') throw new Error('Worker crashed');
  const reply = () => parentPort.postMessage({ id: job.id, revision:job.revision, result: { echoed:true } });
  if (job.kind === 'delay') setTimeout(reply, 100);
  else reply();
});
