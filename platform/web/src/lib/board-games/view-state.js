import { getGame } from './registry.js';
import { applySessionMove } from './session.js';

const square = i => String.fromCharCode(97 + i % 8) + (8 - Math.floor(i / 8));
const index = s => (8 - Number(s[1])) * 8 + s.charCodeAt(0) - 97;

export function createView(session, display = {}) {
  return { session, selection:null, promotion:null, display:{mode:'coach', ...display} };
}
export function setDisplay(view, display) {
  return { ...view, display:{...view.display,...display} };
}
export function newView(view, session) {
  return createView({...session, revision:view.session.revision + 1}, view.display);
}
export function advanceView(view, action, revision = view.session.revision) {
  const session = applySessionMove(view.session,action,revision);
  return session === view.session ? view : {...view,session,selection:null,promotion:null};
}
export function targets(view) {
  const {game,ruleState} = view.session;
  const rules = getGame(game).rules;
  if (game === 'chess' && view.selection !== null) {
    return [...new Set(rules.legalMoves(ruleState).filter(m => m.from === square(view.selection)).map(m => index(m.to)))];
  }
  if (game === 'checkers' && view.selection?.length) {
    return [...new Set(rules.legalMoves(ruleState).filter(m => view.selection.every((p,i) => m.path[i] === p)).map(m => m.path[view.selection.length]).filter(p => p !== undefined))];
  }
  return [];
}
export function selectCell(view, cell) {
  const {game,ruleState} = view.session;
  const rules = getGame(game).rules;
  if (game === 'sudoku') return {...view,selection:cell};
  if (game === 'go') return ruleState.board[cell] ? {...view,selection:cell} : advanceView(view,{point:cell});
  const moves = rules.legalMoves(ruleState);
  if (game === 'chess') {
    if (view.selection === cell) return {...view,selection:null,promotion:null};
    const candidates = view.selection === null ? [] : moves.filter(m => m.from === square(view.selection) && m.to === square(cell));
    if (candidates.length) {
      if (candidates.some(m => m.promotion)) return {...view,promotion:candidates};
      return advanceView(view,candidates[0]);
    }
    if (moves.some(m => m.from === square(cell))) return {...view,selection:cell,promotion:null};
    if (view.selection !== null && view.selection !== cell) throw new Error(`Illegal chess destination ${square(cell)}. Choose a highlighted square.`);
    if (view.selection === null) throw new Error(`No legal chess move starts at ${square(cell)}.`);
    return {...view,selection:null,promotion:null};
  }
  if (view.selection?.length === 1 && view.selection[0] === cell) return {...view,selection:null};
  const prefix = view.selection ? [...view.selection,cell] : [cell];
  const matching = moves.filter(m => prefix.every((p,i) => m.path[i] === p));
  if (matching.length) {
    const complete = matching.find(m => m.path.length === prefix.length);
    return complete ? advanceView(view,complete) : {...view,selection:prefix};
  }
  if (moves.some(m => m.path[0] === cell)) return {...view,selection:[cell]};
  if (view.selection?.length && view.selection[0] !== cell) throw new Error('Illegal checkers destination. Choose a highlighted square.');
  if (!view.selection?.length) throw new Error('No legal checkers move starts there.');
  return {...view,selection:null};
}
export function choosePromotion(view,piece) {
  const action = view.promotion?.find(move => move.promotion === piece);
  if (!action) throw new Error('Choose queen, rook, bishop or knight.');
  return advanceView(view,action);
}
