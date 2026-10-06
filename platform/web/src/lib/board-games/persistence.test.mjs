import assert from 'node:assert/strict';
import test from 'node:test';
import { createSession, applySessionMove } from './session.js';
import { loadSession, saveSession, loadPreferences, savePreferences } from './persistence.js';

function storage() {
  const data = new Map();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
    data
  };
}

test('a chess session saves and restores history, side and difficulty', () => {
  const disk = storage();
  let session = createSession('chess', { humanSide: 'b', difficulty: 'hard' });
  session = applySessionMove(session, { from: 'e2', to: 'e4' });
  session = applySessionMove(session, { from: 'e7', to: 'e5' });
  assert.equal(saveSession(session, disk).ok, true);
  const result = loadSession('chess', disk);
  assert.equal(result.status, 'loaded');
  assert.equal(result.session.humanSide, 'b');
  assert.equal(result.session.difficulty, 'hard');
  assert.deepEqual(result.session.ruleState, session.ruleState);
  assert.equal(result.session.ruleState.history.length, 2);
  assert.equal(JSON.parse(disk.data.get('tmm-game-state:chess')).version, 1);
  assert.equal(JSON.parse(disk.data.get('tmm-game-state:chess')).session.revision, session.revision);
});

test('corrupt, future-version and invalid rule saves are rejected', () => {
  const disk = storage();
  disk.setItem('tmm-game-state:chess', '{broken');
  assert.equal(loadSession('chess', disk).status, 'invalid');
  disk.setItem('tmm-game-state:chess', JSON.stringify({ version: 2, session: {} }));
  assert.equal(loadSession('chess', disk).status, 'unsupported');
  disk.setItem('tmm-game-state:chess', JSON.stringify({ version: 1, session: { game: 'chess', ruleState: {}, humanSide: 'w', difficulty: 'medium', revision: 0 } }));
  assert.equal(loadSession('chess', disk).status, 'invalid');
  disk.setItem('tmm-game-state:chess', JSON.stringify({ version: 1, session: { game: 'chess', ruleState: {}, humanSide: 'w', difficulty: 'medium', revision: Number.MAX_SAFE_INTEGER } }));
  assert.equal(loadSession('chess', disk).status, 'invalid');
  assert.ok(Number.isSafeInteger(createSession('chess').revision));
  const nearLimit = createSession('chess');
  disk.setItem('tmm-game-state:chess', JSON.stringify({ version: 1, session: { ...nearLimit, revision: Number.MAX_SAFE_INTEGER - 1 } }));
  assert.equal(loadSession('chess', disk).status, 'invalid');
  assert.ok(Number.isSafeInteger(createSession('chess').revision));
});

test('storage failures report unavailable and do not mutate the live session', () => {
  const live = createSession('chess');
  const before = structuredClone(live);
  const blocked = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };
  assert.equal(saveSession(live, blocked).ok, false);
  assert.equal(loadSession('chess', blocked).status, 'unavailable');
  assert.deepEqual(live, before);
});

test('preferences use an independent key and normalize unknown presentation IDs', () => {
  const disk = storage();
  const session = createSession('chess');
  assert.equal(saveSession(session, disk).ok, true);
  assert.equal(savePreferences({ mode: 'coach', themes: { chess: 'slate' }, pieceSets: { chess: 'chessnut' } }, disk).ok, true);
  assert.equal(disk.data.has('tmm-game-preferences'), true);
  assert.deepEqual(loadPreferences(disk).preferences, {
    mode: 'coach', themes: { chess: 'slate', checkers: 'classic', sudoku: 'classic', go: 'classic' }, pieceSets: { chess: 'chessnut' }
  });
  assert.deepEqual(loadSession('chess', disk).session.ruleState, session.ruleState);
  disk.setItem('tmm-game-preferences', JSON.stringify({ version: 1, preferences: { mode: 'bad', themes: { chess: 'missing' }, pieceSets: { chess: 'missing' } } }));
  const fallback = loadPreferences(disk);
  assert.equal(fallback.preferences.mode, 'focus');
  assert.equal(fallback.preferences.themes.chess, 'classic');
  assert.equal(fallback.preferences.pieceSets.chess, 'chessnut');
});

test('invalid preferences and unavailable storage fall back to usable defaults', () => {
  const disk = storage();
  disk.setItem('tmm-game-preferences', '{broken');
  assert.equal(loadPreferences(disk).status, 'invalid');
  disk.setItem('tmm-game-preferences', JSON.stringify({ version: 3, preferences: {} }));
  assert.equal(loadPreferences(disk).status, 'unsupported');
  const blocked = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };
  assert.equal(loadPreferences(blocked).status, 'unavailable');
  assert.equal(savePreferences({ mode: 'coach' }, blocked).status, 'unavailable');
  assert.equal(loadPreferences(blocked).preferences.mode, 'focus');
});

test('a saved revision at the accepted limit rebases on load and remains savable after a move', () => {
  const disk = storage();
  const saved = createSession('chess');
  disk.setItem('tmm-game-state:chess', JSON.stringify({ version: 1, session: { ...saved, revision: 1_000_000_000 } }));
  const loaded = loadSession('chess', disk);
  assert.equal(loaded.status, 'loaded');
  assert.notEqual(loaded.session.revision, 1_000_000_000);
  const moved = applySessionMove(loaded.session, { from: 'e2', to: 'e4' });
  assert.equal(saveSession(moved, disk).ok, true);
  assert.equal(loadSession('chess', disk).status, 'loaded');
});
