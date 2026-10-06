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
