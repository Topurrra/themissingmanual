import test from 'node:test';
import assert from 'node:assert/strict';
import { StockfishTransport } from './stockfish-client.js';
import * as chess from './chess.js';

function fakeEngine() {
  const listeners = new Map(); const commands=[]; let stopped=false;
  return {
    commands, get stopped(){return stopped;},
    addEventListener(type,handler){listeners.set(type,handler);},
    removeEventListener(type){listeners.delete(type);},
    postMessage(command){commands.push(command);},
    terminate(){stopped=true;},
    emit(line){listeners.get('message')?.({data:line});}
  };
}
function setup(job) {
  const engine=fakeEngine();
  const transport=new StockfishTransport({createWorker:()=>engine});
  const messages=[];
  transport.addEventListener('message',event=>messages.push(event.data));
  transport.postMessage({id:4,revision:9,game:'chess',kind:'move',difficulty:'hard',budgetMs:1000,state:chess.createState(),...job});
  return {engine,transport,messages};
}
test('engine handshake precedes search and carries full replay history', () => {
  let state=chess.applyMove(chess.createState(),{from:'e2',to:'e4'});
  state=chess.applyMove(state,{from:'e7',to:'e5'});
  const {engine,transport,messages}=setup({state});
  assert.deepEqual(engine.commands,['uci']);
  engine.emit('uciok');engine.emit('readyok');
  assert.ok(engine.commands.includes('setoption name Skill Level value 20'));
  assert.ok(engine.commands.some(command=>command.endsWith(' moves e2e4 e7e5')));
  assert.equal(messages[0].stage,'ready');
  assert.match(engine.commands.at(-1),/^go movetime 1000/);
  engine.emit('bestmove g1f3');
  assert.deepEqual(messages.at(-1).result.action,{from:'g1',to:'f3'});
  transport.terminate();assert.equal(engine.stopped,true);
});
test('selected square hints restrict engine search and use full strength', () => {
  const {engine,transport}=setup({kind:'hint',difficulty:'easy',selection:52});
  engine.emit('uciok');engine.emit('readyok');
  assert.ok(engine.commands.includes('setoption name Skill Level value 20'));
  assert.match(engine.commands.at(-1),/searchmoves e2e3 e2e4/);
  transport.terminate();
});
test('an illegal engine reply is rejected instead of applying an unchecked move', () => {
  const {engine,transport,messages}=setup({});
  engine.emit('uciok');engine.emit('readyok');engine.emit('bestmove e2e5');
  assert.match(messages.at(-1).error.message,/illegal/i);
  transport.terminate();
});
test('skill levels differ while hints keep the strongest setting', () => {
  for(const [difficulty,skill] of [['easy',0],['medium',8],['hard',20]]) {
    const {engine,transport}=setup({difficulty});
    engine.emit('uciok');
    assert.ok(engine.commands.includes('setoption name Skill Level value '+skill));
    transport.terminate();
  }
});

test('real Stockfish WASM finds mate and returns a rule-validated move', async () => {
  const {nativeStockfish}=await import('./test-fixtures/native-stockfish.mjs');
  let state=chess.createState();
  for(const move of [{from:'f2',to:'f3'},{from:'e7',to:'e5'},{from:'g2',to:'g4'}])state=chess.applyMove(state,move);
  const transport=new StockfishTransport({createWorker:nativeStockfish});
  try {
    const reply=await new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>reject(new Error('Native Stockfish timed out')),5000);
      transport.addEventListener('error',event=>{clearTimeout(timer);reject(new Error(event.message));});
      transport.addEventListener('message',({data})=>{if(data.stage)return;clearTimeout(timer);if(data.error)reject(new Error(data.error.message));else resolve(data);});
      transport.postMessage({id:1,revision:1,game:'chess',kind:'move',difficulty:'hard',budgetMs:250,state});
    });
    assert.deepEqual(reply.result.action,{from:'d8',to:'h4'});
    assert.equal(chess.getStatus(chess.applyMove(state,reply.result.action)).winner,'b');
    assert.equal(reply.result.engine,'Stockfish 19 lite');
  } finally {transport.terminate();}
});
test('real Stockfish hints obey selected-square restrictions', async () => {
  const {nativeStockfish}=await import('./test-fixtures/native-stockfish.mjs');
  const transport=new StockfishTransport({createWorker:nativeStockfish});
  try {
    const reply=await new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>reject(new Error('Native Stockfish timed out')),5000);
      transport.addEventListener('error',event=>{clearTimeout(timer);reject(new Error(event.message));});
      transport.addEventListener('message',({data})=>{if(data.stage)return;clearTimeout(timer);if(data.error)reject(new Error(data.error.message));else resolve(data);});
      transport.postMessage({id:1,revision:1,game:'chess',kind:'hint',difficulty:'easy',selection:52,budgetMs:100,state:chess.createState()});
    });
    assert.equal(reply.result.action.from,'e2');
    assert.doesNotThrow(()=>chess.applyMove(chess.createState(),reply.result.action));
  } finally {transport.terminate();}
});

test('analyze jobs search at full strength and report the latest exact score', () => {
  const {engine,messages}=setup({kind:'analyze',difficulty:'easy',budgetMs:300});
  engine.emit('uciok');
  assert.ok(engine.commands.includes('setoption name Skill Level value 20'));
  engine.emit('readyok');
  assert.equal(engine.commands.at(-1),'go movetime 300');
  engine.emit('info depth 8 score cp 34 nodes 100 pv e2e4');
  engine.emit('info depth 9 score cp 51 upperbound nodes 200 pv e2e4');
  engine.emit('info depth 9 score cp 29 nodes 300 pv e2e4');
  engine.emit('bestmove e2e4');
  const result=messages.find(message=>message.result)?.result;
  assert.deepEqual(result.score,{cp:29});
  assert.deepEqual(result.action,{from:'e2',to:'e4'});
});
test('mate scores are kept as mate distances', () => {
  const {engine,messages}=setup({kind:'analyze'});
  engine.emit('uciok');engine.emit('readyok');
  engine.emit('info depth 12 score mate -3 nodes 900 pv e2e4');
  engine.emit('bestmove e2e4');
  assert.deepEqual(messages.find(message=>message.result).result.score,{mate:-3});
});
