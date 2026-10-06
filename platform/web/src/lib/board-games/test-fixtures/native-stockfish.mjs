import { spawn } from 'node:child_process';
import { mkdtempSync,copyFileSync,rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join,dirname,resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export function nativeStockfish() {
  const directory=mkdtempSync(join(tmpdir(),'tmm-stockfish-test-'));
  const assets=fileURLToPath(new URL('../../../../static/games/engines/stockfish/',import.meta.url));
  copyFileSync(join(assets,'stockfish-19-lite-single.js'),join(directory,'stockfish-19-lite-single.cjs'));
  copyFileSync(join(assets,'stockfish-19-lite-single.wasm'),join(directory,'stockfish-19-lite-single.wasm'));
  const process=spawn(globalThis.process.execPath,[join(directory,'stockfish-19-lite-single.cjs')],{stdio:['pipe','pipe','pipe']});
  const listeners=new Map();
  const emit=(type,event)=>{for(const fn of listeners.get(type)??[])fn(event);};
  let buffer='';
  process.stdout.on('data',data=>{
    buffer+=data.toString();
    let end;
    while((end=buffer.indexOf('\n'))!==-1){const line=buffer.slice(0,end).trim();buffer=buffer.slice(end+1);emit('message',{data:line});}
  });
  process.on('error',error=>emit('error',{message:error.message}));
  process.stderr.on('data',data=>emit('error',{message:data.toString()}));
  process.once('exit',()=>{
    if(dirname(resolve(directory))!==resolve(tmpdir())||!directory.includes('tmm-stockfish-test-'))throw new Error('Unsafe temporary cleanup target');
    rmSync(directory,{recursive:true,force:true,maxRetries:3,retryDelay:100});
  });
  return {
    addEventListener(type,fn){if(!listeners.has(type))listeners.set(type,new Set());listeners.get(type).add(fn);},
    removeEventListener(type,fn){listeners.get(type)?.delete(fn);},
    postMessage:line=>process.stdin.write(line+'\n'),
    terminate:()=>process.kill()
  };
}
