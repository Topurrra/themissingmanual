import assert from 'node:assert/strict';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import { createSession, applySessionMove, undoSession, restoreSession, withSessionSettings } from './session.js';

test('session move and undo increment revision and preserve settings', () => {
  const initial = createSession('chess', { humanSide: 'w', difficulty: 'easy' });
  const afterHuman = applySessionMove(initial, { from: 'e2', to: 'e4' });
  const afterBot = applySessionMove(afterHuman, { from: 'e7', to: 'e5' });
  const undone = undoSession(afterBot);
  assert.ok(initial.revision < afterHuman.revision && afterHuman.revision < afterBot.revision && afterBot.revision < undone.revision);
  assert.equal(undone.ruleState.history.length, 0);
  assert.equal(undone.humanSide, 'w');
  assert.equal(undone.difficulty, 'easy');
  assert.deepEqual(initial.ruleState.history, []);
});

test('a stale bot reply cannot change the position after undo', () => {
  const start = createSession('chess');
  const afterHuman = applySessionMove(start, { from: 'e2', to: 'e4' });
  const undone = undoSession(afterHuman);
  const stale = applySessionMove(undone, { from: 'e7', to: 'e5' }, afterHuman.revision);
  assert.equal(stale, undone);
});

test('a new game has a distinct revision from a prior pending bot turn', () => {
  const oldGame = createSession('chess', { humanSide: 'b' });
  const fresh = createSession('chess', { humanSide: 'b' });
  assert.notEqual(fresh.revision, oldGame.revision);
  assert.equal(applySessionMove(fresh, { from: 'e2', to: 'e4' }, oldGame.revision), fresh);
});

test('undo stops when the human plays black and only the bot has moved', () => {
  const script = "import {createSession,applySessionMove,undoSession} from './session.js'; const start=createSession('chess',{humanSide:'b'}); const after=applySessionMove(start,{from:'e2',to:'e4'}); const undone=undoSession(after); if(undone.ruleState.history.length!==0) process.exit(1);";
  const run = spawnSync(process.execPath, ['--input-type=module', '-e', script], { cwd: new URL('.', import.meta.url), timeout: 1500, encoding: 'utf8' });
  assert.equal(run.error, undefined, run.error?.message);
  assert.equal(run.status, 0, run.stderr);
});

test('settings preserve position and restoration validates session fields', () => {
  const start = createSession('chess');
  const changed = withSessionSettings(start, { difficulty: 'hard', humanSide: 'b' });
  assert.deepEqual(changed.ruleState, start.ruleState);
  assert.equal(changed.revision, start.revision);
  const restored = restoreSession(structuredClone(changed));
  assert.deepEqual(restored.ruleState, changed.ruleState);
  assert.equal(restored.humanSide, changed.humanSide);
  assert.equal(restored.difficulty, changed.difficulty);
  assert.notEqual(restored.revision, changed.revision);
  assert.throws(() => restoreSession({ ...changed, humanSide: 'none' }), /human side/i);
});
