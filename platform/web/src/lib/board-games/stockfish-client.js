import * as chess from './chess.js';
import { describeAction } from './action-description.js';

const SKILL = {easy:0,medium:8,hard:20};
const square = index => String.fromCharCode(97 + index % 8) + (8 - Math.floor(index / 8));

// Adapts the engine's UCI strings to the shared game-worker transport.
// Search remains inside Stockfish's dedicated worker.
export class StockfishTransport {
  constructor({createWorker = () => new Worker('/games/engines/stockfish/stockfish-19-lite-single.js')} = {}) {
    this.engine=createWorker();
    this.listeners=new Map();
    this.job=null;
    this.dead=false;
    this.initialized=false;
    this.onMessage=event=>this.receive(event.data);
    this.onError=event=>this.emit('error',event);
    this.engine.addEventListener('message',this.onMessage);
    this.engine.addEventListener('error',this.onError);
    this.engine.addEventListener('messageerror',this.onError);
  }
  addEventListener(type,handler) {
    if(!this.listeners.has(type))this.listeners.set(type,new Set());
    this.listeners.get(type).add(handler);
  }
  removeEventListener(type,handler) {this.listeners.get(type)?.delete(handler);}
  emit(type,event) {for(const handler of this.listeners.get(type)??[])handler(event);}
  reply(value) {
    if(this.dead||!this.job)return;
    this.emit('message',{data:{id:this.job.id,revision:this.job.revision,...value}});
  }
  postMessage(job) {
    try {
      if(this.dead||this.job)throw new Error('Stockfish transport accepts one job.');
      this.job=job;
      if(job.game!=='chess'||!['move','hint','analyze'].includes(job.kind))throw new Error('Unsupported Stockfish job.');
      this.score=null;
      this.state=chess.restoreState(job.state);
      if(chess.getStatus(this.state).phase!=='playing')throw new Error('Chess game is finished.');
      this.moves=chess.legalMoves(this.state);
      if(job.kind==='hint'&&job.selection!==null&&job.selection!==undefined) {
        const from=Number.isInteger(job.selection)?square(job.selection):typeof job.selection==='string'?job.selection:job.selection.from;
        this.moves=this.moves.filter(move=>move.from===from);
      }
      if(!this.moves.length)throw new Error('No legal chess move for this selection.');
      this.engine.postMessage('uci');
    } catch(error) {this.reply({error:{message:error.message}});}
  }
  receive(line) {
    if(this.dead||!this.job||typeof line!=='string')return;
    try {
      if(line==='uciok') {
        this.engine.postMessage('setoption name Hash value 16');
        this.engine.postMessage('setoption name Skill Level value '+(this.job.kind==='move'?SKILL[this.job.difficulty]??8:20));
        this.engine.postMessage('ucinewgame');
        this.engine.postMessage('isready');
      } else if(line==='readyok'&&!this.initialized) {
        this.initialized=true;
        this.reply({stage:'ready'});
        const history=this.state.history.map(move=>move.from+move.to+(move.promotion??'')).join(' ');
        this.engine.postMessage('position fen '+this.state.initialFen+(history?' moves '+history:''));
        const requested=Number.isFinite(this.job.budgetMs)?this.job.budgetMs:1000;
        const budget=Math.max(1,Math.min(1000,requested));
        const selected=this.job.kind==='hint'? ' searchmoves '+this.moves.map(move=>move.from+move.to+(move.promotion??'')).join(' '):'';
        this.engine.postMessage('go movetime '+Math.round(budget)+selected);
      } else if(line.startsWith('info ')&&line.includes(' score ')) {
        // Keep the latest full-strength evaluation (side to move's point of view) for the coach.
        const found=/ score (cp|mate) (-?\d+)\b(?! (?:lower|upper)bound)/.exec(line);
        if(found)this.score=found[1]==='cp'?{cp:Number(found[2])}:{mate:Number(found[2])};
      } else if(line.startsWith('bestmove ')) {
        const match=/^bestmove ([a-h][1-8])([a-h][1-8])([qrbn])?(?:\s|$)/.exec(line);
        if(!match)throw new Error('Stockfish returned no playable move.');
        const action={from:match[1],to:match[2],...(match[3]?{promotion:match[3]}:{})};
        if(!this.moves.some(move=>move.from===action.from&&move.to===action.to&&move.promotion===action.promotion))throw new Error('Stockfish returned an illegal move.');
        const next=chess.applyMove(this.state,action);
        this.reply({result:{action,engine:'Stockfish 19 lite',score:this.score,explanation:describeAction('chess',this.state,next)+' Stockfish analysis within the current thinking budget.'}});
      }
    } catch(error){this.reply({error:{message:error.message}});}
  }
  terminate() {
    if(this.dead)return;
    this.dead=true;
    this.engine.removeEventListener('message',this.onMessage);
    this.engine.removeEventListener('error',this.onError);
    this.engine.removeEventListener('messageerror',this.onError);
    this.engine.terminate();
    this.listeners.clear();
  }
}
