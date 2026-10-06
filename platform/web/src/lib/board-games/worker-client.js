import { StockfishTransport } from './stockfish-client.js';

function cancelled(message = 'Game request cancelled.') {
  const error = new Error(message);
  error.name = 'AbortError';
  return error;
}
async function defaultWorker(job) {
  if(job.game==='chess')return new StockfishTransport();
  if(job.game==='checkers'&&job.kind!=='review') {
    const {MarcherTransport}=await import('./marcher-client.js');
    return new MarcherTransport();
  }
  return new Worker(new URL('./worker.js', import.meta.url), {type:'module'});
}

// Engine assets load under a separate deadline; ready arms the execution deadline.
export class GameWorkerClient {
  constructor({createWorker=defaultWorker,timeoutMs=5000,loadingTimeoutMs=60000,getRevision=null}={}) {
    this.createWorker=createWorker;
    this.timeoutMs=timeoutMs;
    this.loadingTimeoutMs=loadingTimeoutMs;
    this.getRevision=getRevision;
    this.active=new Set();
    this.nextId=1;
    this.disposed=false;
  }
  request(job,{signal,onStage}={}) {
    if(this.disposed||signal?.aborted)return Promise.reject(cancelled());
    return new Promise((resolve,reject)=>{
      let worker,timer,settled=false,ready=false;
      const id=this.nextId++;
      const abort=()=>settle(cancelled());
      const cleanup=()=>{
        clearTimeout(timer);
        signal?.removeEventListener('abort',abort);
        if(worker) {
          worker.removeEventListener('message',message);
          worker.removeEventListener('error',failure);
          worker.removeEventListener('messageerror',failure);
          worker.terminate();
        }
        this.active.delete(abort);
      };
      const settle=(error,value)=>{
        if(settled)return;
        settled=true;cleanup();
        if(error)reject(error);else resolve(value);
      };
      const deadline=(duration,label)=>{
        clearTimeout(timer);
        timer=setTimeout(()=>settle(new Error(label+' timed out. Retry this turn.')),duration);
      };
      const message=({data})=>{
        if(!data||data.id!==id)return;
        if(data.revision!==job.revision||(this.getRevision&&this.getRevision()!==job.revision)) {
          settle(cancelled('Position changed; old result discarded.'));
        } else if(data.stage==='ready') {
          if(ready)return;
          ready=true;deadline(this.timeoutMs,'Game worker');
          onStage?.('thinking');
        } else if(data.error) {
          settle(new Error(data.error.message||'Game worker failed. Retry this turn.'));
        } else {
          settle(null,{...data.result,revision:data.revision});
        }
      };
      const failure=event=>settle(new Error(event?.message||'Game worker crashed. Retry this turn.'));
      this.active.add(abort);
      signal?.addEventListener('abort',abort,{once:true});
      deadline(this.loadingTimeoutMs,'Game engine loading');
      onStage?.('loading');
      (async()=>{
        try {
          const created=await this.createWorker(job);
          if(settled){created.terminate();return;}
          worker=created;
          worker.addEventListener('message',message);
          worker.addEventListener('error',failure);
          worker.addEventListener('messageerror',failure);
          worker.postMessage({...job,id});
        } catch(error){settle(error);}
      })();
    });
  }
  dispose() {
    this.disposed=true;
    for(const abort of [...this.active])abort();
  }
}
