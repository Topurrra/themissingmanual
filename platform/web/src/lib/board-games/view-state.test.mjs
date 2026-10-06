import test from 'node:test';
import assert from 'node:assert/strict';
import { createSession } from './session.js';
import { createView, selectCell, setDisplay, choosePromotion, advanceView, newView } from './view-state.js';
import { getGame } from './registry.js';

test('display preferences preserve selection and pending request revision', () => {
  let view = createView(createSession('chess'));
  view = selectCell(view, 52);
  const before = view;
  view = setDisplay(view, { mode:'coach', theme:'slate', pieceSet:'chessnut' });
  assert.equal(view.session, before.session);
  assert.equal(view.selection, before.selection);
  assert.equal(view.session.revision, before.session.revision);
});
test('chess selection stages promotion until a piece is chosen', () => {
  const rules = getGame('chess').rules;
  const session = createSession('chess', {ruleState:rules.createState({initialFen:'7k/P7/8/8/8/8/8/7K w - - 0 1'})});
  const before = createView(session);
  let view = selectCell(before, 8);
  view = selectCell(view, 0);
  assert.equal(view.promotion.length, 4);
  assert.equal(view.session.revision, before.session.revision);
  const styled = setDisplay(view, {mode:'focus',theme:'slate'});
  assert.equal(styled.promotion, view.promotion);
  view = choosePromotion(styled, 'n');
  assert.equal(rules.getBoard(view.session.ruleState)[0].type, 'n');
});
test('checkers stages full forced jump without advancing the session', () => {
  const rules = getGame('checkers').rules;
  const board = Array(64).fill(0); board[42] = -1; board[35] = 1; board[21] = 1;
  let view = createView(createSession('checkers', {humanSide:'w',ruleState:rules.createState({board,turn:'w'})}));
  view = selectCell(selectCell(view,42),28);
  assert.deepEqual(view.selection,[42,28]);
  assert.equal(view.session.ruleState.moves.length,0);
  const styled = setDisplay(view,{mode:'coach',theme:'classic'});
  assert.equal(styled.selection,view.selection);
  view = selectCell(styled,14);
  assert.equal(view.session.ruleState.moves.length,1);
  assert.equal(rules.getBoard(view.session.ruleState)[35],0);
});
test('old position replies and replacement revisions cannot overlap', () => {
  const initial = createView(createSession('chess'));
  const moved = advanceView(initial, {from:'e2',to:'e4'},initial.session.revision);
  assert.equal(advanceView(moved,{from:'e7',to:'e5'},initial.session.revision),moved);
  const replacement = newView(moved,createSession('chess'));
  assert.ok(replacement.session.revision > moved.session.revision);
});
test('invalid chess destinations explain the move and preserve selection', () => {
  const view = selectCell(createView(createSession('chess')), 52);
  assert.throws(() => selectCell(view, 35), /Illegal chess destination/);
  assert.equal(view.selection, 52);
  assert.equal(view.session.ruleState.history.length, 0);
  assert.equal(selectCell(view, 52).selection, null);
  assert.equal(selectCell(view, 51).selection, 51);
});
test('invalid checkers destinations explain the move and preserve route', () => {
  const view = selectCell(createView(createSession('checkers')), 17);
  assert.throws(() => selectCell(view, 35), /Illegal checkers destination/);
  assert.deepEqual(view.selection, [17]);
  assert.equal(view.session.ruleState.moves.length, 0);
  assert.equal(selectCell(view, 17).selection, null);
});
test('occupied Go points select a group without changing the session', () => {
  const board = Array(81).fill(0); board[40] = 1;
  const session = createSession('go', { ruleState: getGame('go').rules.createState({ board, turn: 'b' }) });
  const view = selectCell(createView(session), 40);
  assert.equal(view.selection, 40);
  assert.equal(view.session, session);
  assert.match(getGame('go').rules.getCoach(view.session.ruleState, view.selection).message, /liberties/);
  const placed = selectCell(view, 0);
  assert.equal(placed.session.ruleState.board[0], 1);
  assert.equal(placed.selection, null);
});
