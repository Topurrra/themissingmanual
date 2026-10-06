import { getGame } from './registry.js';

const difficulties = ['easy', 'medium', 'hard'];
const defaultHumanSide = { chess: 'w', checkers: 'b', sudoku: 'player', go: 'b' };
const MAX_RESTORED_REVISION = 1_000_000_000;
let latestRevision = 0;
function nextRevision(previous = 0) {
  latestRevision = Math.max(latestRevision, previous) + 1;
  return latestRevision;
}

function requireGame(game) {
  const entry = getGame(game);
  if (!entry) throw new Error(`Unknown game: ${game}`);
  return entry;
}

function validateSettings(game, humanSide, difficulty) {
  const sides = game === 'sudoku' ? ['player'] : ['w', 'b'];
  if (!sides.includes(humanSide)) throw new Error('Invalid human side');
  if (!difficulties.includes(difficulty)) throw new Error('Invalid difficulty');
}

export function createSession(game, options = {}) {
  const entry = requireGame(game);
  const humanSide = options.humanSide ?? defaultHumanSide[game];
  const difficulty = options.difficulty ?? 'medium';
  validateSettings(game, humanSide, difficulty);
  const ruleState = options.ruleState === undefined
    ? entry.rules.createState(game === 'sudoku' ? { difficulty } : {})
    : entry.rules.restoreState(options.ruleState);
  return { game, ruleState, humanSide, difficulty, revision: nextRevision() };
}

export function validateSession(record) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) throw new Error('Invalid session');
  const entry = requireGame(record.game);
  validateSettings(record.game, record.humanSide, record.difficulty);
  if (!Number.isSafeInteger(record.revision) || record.revision < 0 || record.revision > MAX_RESTORED_REVISION) throw new Error('Invalid session revision');
  const ruleState = entry.rules.restoreState(record.ruleState);
  return { game: record.game, ruleState, humanSide: record.humanSide, difficulty: record.difficulty, revision: record.revision };
}

export function restoreSession(record) {
  return { ...validateSession(record), revision: nextRevision() };
}

export function applySessionMove(session, action, expectedRevision = session.revision) {
  if (expectedRevision !== session.revision) return session;
  const entry = requireGame(session.game);
  const ruleState = entry.rules.applyMove(session.ruleState, action);
  return { ...session, ruleState, revision: nextRevision(session.revision) };
}

export function undoSession(session) {
  const entry = requireGame(session.game);
  let ruleState = entry.rules.undo(session.ruleState);
  if (JSON.stringify(ruleState) === JSON.stringify(session.ruleState)) return session;
  if (session.game !== 'sudoku') {
    while (entry.rules.getStatus(ruleState).turn !== session.humanSide) {
      const previous = entry.rules.undo(ruleState);
      if (JSON.stringify(previous) === JSON.stringify(ruleState)) break;
      ruleState = previous;
    }
  }
  return { ...session, ruleState, revision: nextRevision(session.revision) };
}

export function withSessionSettings(session, changes) {
  const humanSide = changes.humanSide ?? session.humanSide;
  const difficulty = changes.difficulty ?? session.difficulty;
  validateSettings(session.game, humanSide, difficulty);
  return { ...session, humanSide, difficulty };
}
