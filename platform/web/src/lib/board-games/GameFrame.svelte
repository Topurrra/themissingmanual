<script>
  import { onMount, onDestroy } from 'svelte';
  import { getGame } from './registry.js';
  import { createSession, applySessionMove, undoSession } from './session.js';
  import { loadSession, saveSession, loadPreferences, savePreferences } from './persistence.js';
  import { createView, setDisplay, selectCell, targets, choosePromotion } from './view-state.js';
  import { describeAction } from './action-description.js';
  import { getTheme, getThemes, getPieceSets } from './themes.js';
  import { GameWorkerClient } from './worker-client.js';
  import ChessBoard from './ChessBoard.svelte';
  import CheckersBoard from './CheckersBoard.svelte';
  import SudokuBoard from './SudokuBoard.svelte';
  import GoBoard from './GoBoard.svelte';
  import CoachPanel from './CoachPanel.svelte';
  import * as chessRules from './chess.js';
  import { fenOf, describeMove as describeChessMove, insights as chessInsights, evaluationText, rateMove, scoreToCp } from './coach-chess.js';
  import { describeMove as describeCheckersMove, insights as checkersInsights } from './coach-checkers.js';
  import { techniqueInfo } from './coach-sudoku.js';
  import './games.css';

  export let game;
  export let guides = [];

  let view = null;
  let preferences = { mode: 'focus', themes: {}, pieceSets: {} };
  let notice = '';
  let error = '';
  let hint = '';
  let busy = '';
  let pencil = false;
  let difficulty = 'medium';
  let humanSide = game === 'chess' ? 'w' : game === 'sudoku' ? 'player' : 'b';
  let suppressBot = false;
  let client;
  // Coach analysis runs on its own client: its jobs describe positions that may already be
  // in the past (reviewing your last move), so they must not be cancelled by new moves.
  let reviewClient;
  let review = null;
  let reviewToken = 0;
  let evaluation = '';
  let evaluationFen = '';
  let hintGuide = null;
  const analyses = new Map();
  let controller;

  $: entry = getGame(game);
  $: state = view?.session.ruleState;
  $: status = state && entry ? entry.rules.getStatus(state) : null;
  $: board = state && entry ? entry.rules.getBoard(state) : [];
  $: shownNotes = game === 'sudoku' && state ? state.notes.map((notes, index) => notes.filter((value) => !state.eliminations?.[index]?.includes(value))) : [];
  $: eliminatedCells = game === 'sudoku' && state ? state.eliminations?.flatMap((values, index) => values.length ? [index] : []) ?? [] : [];
  $: palette = getTheme(game, preferences.themes[game]);
  $: themeStyle = Object.entries(palette.vars).map(([key, value]) => `${key}:${value}`).join(';');
  $: selected = view?.selection ?? null;
  $: legalTargets = view ? targets(view) : [];
  $: history = state ? game === 'chess' ? state.history.map((move) => `${move.from}–${move.to}${move.promotion ? `=${move.promotion.toUpperCase()}` : ''}`) : game === 'checkers' ? state.moves.map((path) => path.join('–')) : game === 'go' ? state.past.map((step, index) => {
    const next = state.past[index + 1] ?? state;
    const point = next.board.findIndex((stone, at) => stone && !step.board[at]);
    if (point >= 0) return `Turn ${index + 1}: ${'ABCDEFGHJ'[point % 9]}${9 - Math.floor(point / 9)}`;
    return `Turn ${index + 1}: ${next.phase === 'finished' ? 'Result' : 'Pass'}`;
  }) : state.history.map((_, index) => `Step ${index + 1}`) : [];
  $: coach = state && entry?.rules.getCoach ? entry.rules.getCoach(state, selected) : null;
  $: facts = status ? [
    ['Turn', status.turn === 'player' ? 'You' : status.turn === 'w' ? 'White' : 'Black'],
    ...(game === 'sudoku' ? [['Filled cells', `${board.filter(Boolean).length} of 81`]] : []),
    ...(game === 'go' ? [['Komi', '7.5'], ['Marked dead', String(state.dead.length)]] : [])
  ] : [];
  $: coaching = preferences.mode === 'coach' && !!view && !!state && ['chess', 'checkers'].includes(game);
  $: insights = coaching ? (game === 'chess' ? chessInsights(fenOf(state), view.session.humanSide) : checkersInsights(state, view.session.humanSide)) : [];
  $: if (coaching && game === 'chess' && reviewClient && status?.phase === 'playing' && status.turn === view.session.humanSide) refreshEvaluation(state);
  $: inProgress = !!state && status?.phase !== 'finished' && (game === 'chess' ? !!state.history.length : game === 'checkers' ? !!state.moves.length : game === 'sudoku' ? !!state.history.length : !!state.past.length);

  function cancelJob() {
    controller?.abort();
    controller = null;
    busy = '';
  }

  function save() {
    const result = saveSession(view.session);
    if (!result.ok) notice = `${result.message} You can keep playing in this tab.`;
  }

  function commitSession(session, message = '') {
    view = createView(session, view?.display ?? { mode: preferences.mode });
    hint = '';
    hintGuide = null;
    hintResult = null;
    error = '';
    notice = message;
    save();
  }

  // One full-strength Stockfish look per position, shared by the evaluation and the move review.
  function analyzeChess(ruleState) {
    const fen = fenOf(ruleState);
    if (!analyses.has(fen)) {
      const job = reviewClient.request({ game: 'chess', kind: 'analyze', state: ruleState, revision: 0, budgetMs: 400 });
      job.catch(() => analyses.delete(fen));
      analyses.set(fen, job);
    }
    return analyses.get(fen);
  }

  async function refreshEvaluation(ruleState) {
    const fen = fenOf(ruleState);
    if (fen === evaluationFen) return;
    evaluationFen = fen;
    try {
      const result = await analyzeChess(ruleState);
      if (evaluationFen === fen && result.score) evaluation = evaluationText(result.score, view.session.humanSide, chessRules.getStatus(ruleState).turn);
    } catch { /* evaluation is a bonus; the game never depends on it */ }
  }

  async function reviewChessMove(before, after) {
    const action = after.history.at(-1);
    const fenBefore = fenOf(before);
    const played = describeChessMove(fenBefore, action);
    if (chessRules.getStatus(after).phase !== 'playing') {
      return { rating: 'best', text: `${played.san}${played.text ? ` ${played.text}` : ''}.`, guide: played.guide };
    }
    const [best, reply] = await Promise.all([analyzeChess(before), analyzeChess(after)]);
    if (!best.score || !reply.score) return null;
    evaluation = evaluationText(reply.score, view.session.humanSide, chessRules.getStatus(after).turn);
    evaluationFen = fenOf(after);
    const same = best.action.from === action.from && best.action.to === action.to && (best.action.promotion ?? null) === (action.promotion ?? null);
    const rating = same ? 'best' : rateMove(scoreToCp(best.score), -scoreToCp(reply.score));
    if (rating === 'best' || rating === 'good') return { rating, text: `${played.san}${played.text ? ` ${played.text}` : ''}.`, guide: played.guide };
    const allowed = describeChessMove(fenOf(after), reply.action);
    const better = describeChessMove(fenBefore, best.action);
    return {
      rating,
      text: `${played.san} allows ${allowed.san}${allowed.text ? `, which ${allowed.text}` : ''}. Better was ${better.san}${better.text ? `: it ${better.text}` : ''}.`,
      guide: better.guide ?? allowed.guide
    };
  }

  // Coach mode only: rate the move you just made, explain why, and show what was better.
  function coachReview(before) {
    if (preferences.mode !== 'coach' || !reviewClient || !['chess', 'checkers'].includes(game)) return;
    const after = view.session.ruleState;
    const token = ++reviewToken;
    review = null;
    (async () => {
      try {
        const result = game === 'chess'
          ? await reviewChessMove(before, after)
          : (await reviewClient.request({ game: 'checkers', kind: 'review', state: before, action: { path: after.moves.at(-1) }, revision: 0, budgetMs: 300 })).review;
        if (token === reviewToken && result) review = result;
      } catch { /* a missing review never blocks play */ }
    })();
  }

  function play(action) {
    const currentStatus = view && entry.rules.getStatus(view.session.ruleState);
    if (!view || busy || currentStatus.phase !== 'playing' || (game !== 'sudoku' && currentStatus.turn !== view.session.humanSide)) return;
    try {
      const next = applySessionMove(view.session, action, view.session.revision);
      if (next === view.session) return;
      const before = view.session.ruleState;
      commitSession(next, game === 'sudoku' ? '' : describeAction(game, view.session.ruleState, next.ruleState));
      coachReview(before);
      suppressBot = false;
      maybeBot();
    } catch (cause) { error = cause.message; }
  }

  function select(index) {
    if (!view || busy) return;
    if (game === 'go' && status?.phase === 'review') {
      try { changeRuleState(entry.rules.toggleDeadGroup(state, index)); } catch (cause) { error = cause.message; }
      return;
    }
    if (status?.phase !== 'playing' || (game !== 'sudoku' && status.turn !== view.session.humanSide)) return;
    if (game === 'sudoku') { view = selectCell(view, index); return; }
    const before = view.session.revision;
    const beforeState = view.session.ruleState;
    try {
      view = selectCell(view, index);
      if (view.session.revision !== before) { hint = ''; hintGuide = null; hintResult = null; notice = describeAction(game, beforeState, view.session.ruleState); save(); coachReview(beforeState); suppressBot = false; maybeBot(); }
      error = '';
    } catch (cause) { error = cause.message; }
  }

  function promote(piece) {
    try {
      const beforeState = view.session.ruleState;
      view = choosePromotion(view, piece);
      notice = describeAction(game, beforeState, view.session.ruleState);
      hint = '';
      hintGuide = null;
      hintResult = null;
      save();
      coachReview(beforeState);
      suppressBot = false;
      maybeBot();
    } catch (cause) { error = cause.message; }
  }

  function sudokuInput(index, value) {
    if (game !== 'sudoku' || state.givens[index]) return;
    if (pencil && value && state.eliminations?.[index]?.includes(value)) {
      error = `${value} was eliminated from row ${Math.floor(index / 9) + 1}, column ${index % 9 + 1}.`;
      return;
    }
    play(pencil && value ? { index, toggleNote: value } : { index, value });
  }

  function changeRuleState(ruleState, message = '') {
    cancelJob();
    commitSession({ ...view.session, ruleState, revision: view.session.revision + 1 }, message);
  }

  function undo() {
    if (!view) return;
    cancelJob();
    const next = undoSession(view.session);
    if (next === view.session) { notice = 'Nothing to undo yet.'; return; }
    suppressBot = true;
    review = null;
    reviewToken++;
    commitSession(next, 'Last turn undone.');
  }

  function updateDisplay(changes) {
    preferences = { ...preferences, ...changes };
    if (view) view = setDisplay(view, { mode: preferences.mode, theme: preferences.themes[game], pieceSet: preferences.pieceSets[game] });
    const result = savePreferences(preferences);
    if (!result.ok) notice = result.message;
  }

  function setTheme(id) { updateDisplay({ themes: { ...preferences.themes, [game]: id } }); }
  function setPieceSet(id) { updateDisplay({ pieceSets: { ...preferences.pieceSets, [game]: id } }); }

  async function maybeBot(force = false) {
    if (!view || game === 'sudoku' || busy || (suppressBot && !force)) return;
    const currentStatus = entry.rules.getStatus(view.session.ruleState);
    if (currentStatus.phase !== 'playing' || currentStatus.turn === view.session.humanSide) return;
    suppressBot = false;
    const revision = view.session.revision;
    const jobController = new AbortController();
    controller = jobController;
    busy = 'move';
    error = '';
    try {
      const result = await client.request({ game, kind: 'move', state: view.session.ruleState, difficulty: view.session.difficulty, revision, budgetMs: 1000 }, { signal: jobController.signal, onStage: (stage) => { if (controller === jobController && ['chess','checkers'].includes(game)) busy = stage === 'loading' ? 'loading' : 'move'; } });
      if (!view || view.session.revision !== revision || result.revision !== revision) return;
      const next = applySessionMove(view.session, result.action, revision);
      commitSession(next, result.explanation ?? 'Opponent moved.');
    } catch (cause) {
      if (cause.name !== 'AbortError' && view?.session.revision === revision) error = `${cause.message} Retry the opponent move.`;
    } finally { if (controller === jobController) { busy = ''; controller = null; } }
  }

  async function requestHint() {
    if (!view || busy || status?.phase !== 'playing' || (game !== 'sudoku' && status.turn !== view.session.humanSide)) return;
    const revision = view.session.revision;
    const jobController = new AbortController();
    controller = jobController;
    busy = 'hint';
    error = '';
    try {
      const selection = game === 'go' && selected !== null && state.board[selected] ? null : selected;
      const result = await client.request({ game, kind: 'hint', state, selection, difficulty: view.session.difficulty, revision, budgetMs: 1000 }, { signal: jobController.signal, onStage: (stage) => { if (controller === jobController && ['chess','checkers'].includes(game)) busy = stage === 'loading' ? 'loading' : 'hint'; } });
      if (view?.session.revision !== revision || result.revision !== revision) return;
      const action = result.action;
      const move = action?.from ? `${action.from} to ${action.to}${action.promotion ? `, promote to ${action.promotion}` : ''}` : action?.path ? action.path.join(' to ') : action?.point !== undefined ? `point ${'ABCDEFGHJ'[action.point % 9]}${9 - Math.floor(action.point / 9)}` : action?.pass ? 'pass' : '';
      hint = `${move ? `Suggested move: ${move}. ` : ''}${result.explanation ?? 'Consider your available moves.'}`;
      hintGuide = null;
      if (game === 'chess' && action) {
        const idea = describeChessMove(fenOf(state), action);
        hint = `Suggested move: ${idea.san}. ${idea.text ? `It ${idea.text}.` : 'Stockfish prefers it; no single tactic, it improves your position.'}`;
        hintGuide = idea.guide;
      } else if (game === 'checkers' && action?.path) {
        const idea = describeCheckersMove(state, action);
        hint = `Suggested move: ${idea.move}. ${idea.text ? `It ${idea.text}.` : 'It keeps your position solid.'}`;
        hintGuide = idea.guide;
      } else if (game === 'sudoku' && result.deduction) {
        const info = techniqueInfo(result.deduction.technique);
        hint = `${info.name}: ${result.explanation}`;
        hintGuide = info.guide;
      }
      if (game === 'sudoku') hintResult = result.deduction;
    } catch (cause) { if (cause.name !== 'AbortError') error = `${cause.message} Retry the hint.`; }
    finally { if (controller === jobController) { busy = ''; controller = null; } }
  }
  let hintResult = null;
  function applyHint() {
    if (!hintResult || game !== 'sudoku') return;
    try {
      if (hintResult.value) play({ index: hintResult.index, value: hintResult.value });
      else {
        const removed = hintResult.candidates.map(({ index, removed }) => `${removed.join(' and ')} from r${Math.floor(index / 9) + 1}c${index % 9 + 1}`);
        changeRuleState(entry.rules.applyDeduction(state, hintResult), `Removed ${removed.join('; ')}. These cells are highlighted.`);
      }
      hintResult = null;
    }
    catch (cause) { error = cause.message; }
  }

  async function newGame() {
    if (inProgress && !window.confirm(`Replace this ${entry.name.toLowerCase()} game? Your current progress will be lost.`)) return;
    cancelJob();
    error = '';
    review = null;
    reviewToken++;
    evaluation = '';
    if (game === 'sudoku') {
    const revision = view?.session.revision ?? 0;
      const jobController = new AbortController();
      controller = jobController;
      busy = 'puzzle';
      try {
        const result = await client.request({ game, kind: 'puzzle', difficulty, revision, seed: Date.now() }, { signal: jobController.signal, onStage: (stage) => { if (controller === jobController && ['chess','checkers'].includes(game)) busy = stage === 'loading' ? 'loading' : 'move'; } });
        if ((view?.session.revision ?? 0) !== revision || result.revision !== revision) return;
        const ruleState = entry.rules.createState({ puzzle: result.puzzle });
        commitSession(createSession(game, { difficulty, ruleState, humanSide: 'player' }), 'New puzzle ready.');
      } catch (cause) { if (cause.name !== 'AbortError') error = `${cause.message} Retry new puzzle.`; }
      finally { if (controller === jobController) { busy = ''; controller = null; } }
    } else {
      commitSession(createSession(game, { humanSide, difficulty }), 'New game ready.');
      suppressBot = false;
      maybeBot();
    }
  }

  function finish(kind) {
    if (!view || status?.phase !== 'playing') return;
    try {
      if (kind === 'resign' && !window.confirm('Resign this game?')) return;
      const ruleState = kind === 'resign' ? entry.rules.resign(state, view.session.humanSide) : entry.rules.claimDraw(state, kind);
      changeRuleState(ruleState);
    } catch (cause) { error = cause.message; }
  }

  onMount(() => {
    const loadedPreferences = loadPreferences();
    preferences = loadedPreferences.preferences;
    if (loadedPreferences.status === 'unavailable') notice = loadedPreferences.message;
    const loaded = loadSession(game);
    if (loaded.session) {
      view = createView(loaded.session, { mode: preferences.mode, theme: preferences.themes[game], pieceSet: preferences.pieceSets[game] });
      difficulty = loaded.session.difficulty;
      humanSide = loaded.session.humanSide;
      notice = 'Saved game restored.';
    } else if (loaded.status === 'invalid' || loaded.status === 'unsupported' || loaded.status === 'unavailable') {
      error = `${loaded.message}. Start a new game to reset this save.`;
    }
    client = new GameWorkerClient({ getRevision: () => view?.session.revision ?? 0 });
    reviewClient = new GameWorkerClient();
    if (!view && game !== 'sudoku' && loaded.status === 'empty') commitSession(createSession(game, { humanSide, difficulty }));
    if (view) maybeBot();
    if (!view && game === 'sudoku' && loaded.status === 'empty') newGame();
  });
  onDestroy(() => { cancelJob(); client?.dispose(); reviewClient?.dispose(); });
</script>

<section class="bg-frame" style={themeStyle} data-game={game} data-mode={preferences.mode}>
  <header class="bg-header">
    <div><a href="/games" class="bg-back">← All games</a><h1>{entry?.name}</h1><p>{game === 'go' ? '9 × 9 · Chinese area · 7.5 komi' : game === 'checkers' ? '8 × 8 · English checkers' : game === 'sudoku' ? '9 × 9 puzzle' : '8 × 8 · Chess'} · {view?.session.difficulty ?? difficulty} {game === 'sudoku' ? 'puzzle' : 'opponent'}{game === 'chess' ? ' · Stockfish' : game === 'checkers' ? ' · Marcher' : ''}</p></div>
    <div class="bg-game-top-controls">
      <div class="bg-modes" role="group" aria-label="Play mode"><button type="button" aria-pressed={preferences.mode === 'focus'} onclick={() => updateDisplay({ mode: 'focus' })}>Focus</button><button type="button" aria-pressed={preferences.mode === 'coach'} onclick={() => updateDisplay({ mode: 'coach' })}>Coach</button></div>
      <p class="bg-status" aria-live="polite">{busy === 'loading' ? 'Loading game engine…' : busy === 'move' ? 'Opponent thinking…' : busy === 'hint' ? 'Finding a hint…' : status?.message ?? 'Preparing game…'}</p>
    </div>
  </header>

  <div class="bg-layout" class:bg-focus={preferences.mode === 'focus'}>
    <div class="bg-board-area">
      {#if view && state && status}
        <div class="bg-player bg-opponent">{game === 'sudoku' ? `${state.givens.filter(Boolean).length} givens` : `Opponent · ${view.session.humanSide === 'w' ? 'Black' : 'White'}`}</div>
        {#if game === 'chess'}<ChessBoard {board} flipped={view.session.humanSide === 'b'} selection={selected} {legalTargets} disabled={!!busy || status?.phase !== 'playing' || status.turn !== view.session.humanSide || !!view.promotion} pieceSet={preferences.pieceSets[game]} onselect={select} />
        {:else if game === 'checkers'}<CheckersBoard {board} flipped={view.session.humanSide === 'b'} selection={selected} {legalTargets} disabled={!!busy || status?.phase !== 'playing' || status.turn !== view.session.humanSide} onselect={select} />
        {:else if game === 'sudoku'}<SudokuBoard {board} selection={selected} notes={shownNotes} givens={state.givens} highlighted={eliminatedCells} disabled={!!busy || status?.phase !== 'playing'} onselect={select} oninput={sudokuInput} />
        {:else}<GoBoard {board} selection={selected} dead={state.dead} lastMove={state.lastMove ?? null} legalTargets={[]} disabled={!!busy || (status?.phase === 'playing' && status.turn !== view.session.humanSide) || status?.phase === 'finished'} onselect={select} />{/if}
        {#if view.promotion}
          <div class="bg-promotion" role="group" aria-label="Choose promotion piece"><span>Promote pawn to</span>{#each [['q','Queen'],['r','Rook'],['b','Bishop'],['n','Knight']] as choice}<button type="button" onclick={() => promote(choice[0])}>{choice[1]}</button>{/each}</div>
        {/if}
        <div class="bg-player bg-player-bottom">{game === 'sudoku' ? `${board.filter(Boolean).length} of 81 filled` : `You · ${view.session.humanSide === 'w' ? 'White' : 'Black'}`}</div>
        {#if game === 'sudoku'}
          <div class="bg-digits" role="group" aria-label="Sudoku number entry">{#each [1,2,3,4,5,6,7,8,9] as digit}<button type="button" disabled={selected === null || !!state.givens[selected] || !!busy} onclick={() => sudokuInput(selected, digit)}>{digit}</button>{/each}<button type="button" disabled={selected === null || !!state.givens[selected] || !!busy} onclick={() => sudokuInput(selected, 0)}>Erase</button><button type="button" aria-pressed={pencil} onclick={() => pencil = !pencil}>Pencil marks</button></div>
        {/if}
        <div class="bg-controls">
          <button type="button" onclick={undo}>Undo</button>
          <button type="button" onclick={requestHint} disabled={!!busy || status?.phase !== 'playing' || (game !== 'sudoku' && status.turn !== view.session.humanSide)}>Hint</button>
          {#if hintResult && game === 'sudoku'}<button type="button" onclick={applyHint}>Apply hint</button>{/if}
          {#if game === 'go' && status?.phase === 'playing'}<button type="button" onclick={() => play({ pass: true })} disabled={!!busy || status.turn !== view.session.humanSide}>Pass</button>{/if}
          {#if game === 'go' && status?.phase === 'review'}<button type="button" onclick={() => { changeRuleState(entry.rules.resumePlay(state)); maybeBot(); }}>Resume play</button><button type="button" onclick={() => changeRuleState(entry.rules.acceptScore(state))}>Accept score</button>{/if}
          {#if game !== 'sudoku' && status?.phase === 'playing'}<button type="button" onclick={() => finish('resign')}>Resign</button>{#each status.claims as claim}<button type="button" onclick={() => finish(claim)}>Claim {claim.replaceAll('-', ' ')}</button>{/each}{/if}
          {#if error && status?.phase === 'playing' && status.turn !== view.session.humanSide && game !== 'sudoku'}<button type="button" onclick={() => maybeBot(true)}>Retry opponent</button>{/if}
        </div>
        {#if hint}<p class="bg-help" role="status">{hint}</p>{/if}
        {#if game === 'go' && status?.phase === 'review'}
          {@const score = entry.rules.score(state)}
          <p>Tap a group to mark it dead before accepting the area score.</p>
          <table class="bg-score"><caption>Area score</caption><thead><tr><th>Area</th><th>Black</th><th>White</th></tr></thead><tbody><tr><th>Stones</th><td>{score.blackStones}</td><td>{score.whiteStones}</td></tr><tr><th>Territory</th><td>{score.blackTerritory}</td><td>{score.whiteTerritory}</td></tr><tr><th>Komi</th><td>0</td><td>{score.komi}</td></tr><tr><th>Total</th><td>{score.blackTotal}</td><td>{score.whiteTotal}</td></tr></tbody></table>
        {/if}
        <div class="bg-settings">
          <label>Difficulty <select bind:value={difficulty}><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></label>
          {#if game !== 'sudoku'}<label>Play as <select bind:value={humanSide}><option value="w">White</option><option value="b">Black</option></select></label>{/if}
          <button type="button" class="bg-button bg-primary" onclick={newGame}>{game === 'sudoku' ? 'New puzzle' : 'New game'}</button>
          {#if getThemes(game).length > 1}<label>Board <select value={preferences.themes[game]} onchange={(event) => setTheme(event.currentTarget.value)}>{#each getThemes(game) as theme}<option value={theme.id}>{theme.label}</option>{/each}</select></label>{/if}
          {#if getPieceSets(game).length > 1}<label>Pieces <select value={preferences.pieceSets[game]} onchange={(event) => setPieceSet(event.currentTarget.value)}>{#each getPieceSets(game) as set}<option value={set.id}>{set.label}</option>{/each}</select></label>{/if}
        </div>
      {:else}
        <div class="bg-empty"><p>{game === 'sudoku' && busy === 'puzzle' ? 'Generating puzzle…' : 'Your game is ready to start.'}</p><button type="button" class="bg-button bg-primary" onclick={newGame}>Start {entry.name}</button></div>
      {/if}
      {#if notice}<p class="bg-save" role="status">{notice}</p>{/if}
      {#if error}<p class="bg-error" role="alert">{error}</p>{/if}
    </div>
    {#if preferences.mode === 'coach' && view && state && status}
      <CoachPanel {game} {status} {facts} hint={hint || coach?.message || ''} {hintGuide} {review} {evaluation} {insights} {history} {guides} />
    {/if}
  </div>
</section>
