import { gameIds } from './registry.js';
import { restoreSession, validateSession } from './session.js';
import { getTheme, getPieceSets } from './themes.js';

const VERSION = 1;
const preferenceKey = 'tmm-game-preferences';
const stateKey = (game) => `tmm-game-state:${game}`;

function currentStorage(storage) {
  return storage ?? globalThis.localStorage;
}

function normalizePreferences(record = {}) {
  const mode = record.mode === 'coach' ? 'coach' : 'focus';
  const themes = Object.fromEntries(gameIds.map((game) => [game, getTheme(game, record.themes?.[game]).id]));
  const pieceSets = {};
  for (const game of gameIds) {
    const sets = getPieceSets(game);
    if (sets.length) pieceSets[game] = sets.some((set) => set.id === record.pieceSets?.[game]) ? record.pieceSets[game] : sets[0].id;
  }
  return { mode, themes, pieceSets };
}

export function loadSession(game, storage) {
  if (!gameIds.includes(game)) return { session: null, status: 'invalid', message: `Unknown game: ${game}` };
  let raw;
  try { raw = currentStorage(storage).getItem(stateKey(game)); }
  catch (error) { return { session: null, status: 'unavailable', message: `Could not read saved game: ${error.message}` }; }
  if (raw === null) return { session: null, status: 'empty' };
  try {
    const envelope = JSON.parse(raw);
    if (envelope?.version !== VERSION) return { session: null, status: 'unsupported', message: 'Saved game uses an unsupported version' };
    const session = restoreSession(envelope.session);
    if (session.game !== game) throw new Error('Game ID mismatch');
    return { session, status: 'loaded' };
  } catch (error) {
    return { session: null, status: 'invalid', message: `Saved game is invalid: ${error.message}` };
  }
}

export function saveSession(session, storage) {
  let valid;
  try { valid = validateSession(session); }
  catch (error) { return { ok: false, status: 'invalid', message: `Could not save game: ${error.message}` }; }
  try {
    currentStorage(storage).setItem(stateKey(valid.game), JSON.stringify({ version: VERSION, session: valid }));
    return { ok: true, status: 'saved' };
  } catch (error) {
    return { ok: false, status: 'unavailable', message: `Could not save game: ${error.message}` };
  }
}

export function loadPreferences(storage) {
  let raw;
  try { raw = currentStorage(storage).getItem(preferenceKey); }
  catch (error) { return { preferences: normalizePreferences(), status: 'unavailable', message: `Could not read preferences: ${error.message}` }; }
  if (raw === null) return { preferences: normalizePreferences(), status: 'empty' };
  try {
    const envelope = JSON.parse(raw);
    if (envelope?.version !== VERSION) return { preferences: normalizePreferences(), status: 'unsupported', message: 'Preferences use an unsupported version' };
    return { preferences: normalizePreferences(envelope.preferences), status: 'loaded' };
  } catch (error) {
    return { preferences: normalizePreferences(), status: 'invalid', message: `Preferences are invalid: ${error.message}` };
  }
}

export function savePreferences(preferences, storage) {
  const normalized = normalizePreferences(preferences);
  try {
    currentStorage(storage).setItem(preferenceKey, JSON.stringify({ version: VERSION, preferences: normalized }));
    return { ok: true, status: 'saved' };
  } catch (error) {
    return { ok: false, status: 'unavailable', message: `Could not save preferences: ${error.message}` };
  }
}
