import { parentPort } from 'node:worker_threads';
parentPort.on('message', job => {
  if (!job.kind.startsWith('loading')) parentPort.postMessage({id:job.id,revision:job.revision,stage:'ready'});
  if (job.kind === 'hang') { while (true) {} }
  if (job.kind === 'loading-hang') return;
  if (job.kind === 'loading') { setTimeout(()=>{parentPort.postMessage({id:job.id,revision:job.revision,stage:'ready'});setTimeout(()=>parentPort.postMessage({id:job.id,revision:job.revision,result:{echoed:true}}),10);},100);return; }
  if (job.kind === 'crash') throw new Error('Worker crashed');
  const reply = () => parentPort.postMessage({ id: job.id, revision:job.revision, result: { echoed:true } });
  if (job.kind === 'delay') setTimeout(reply, 100);
  else reply();
});
