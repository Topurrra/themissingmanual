const requiredVars = [
  '--game-square-light', '--game-square-dark', '--game-grid',
  '--game-selected', '--game-legal-move', '--game-board-bg',
  '--game-piece-light', '--game-piece-dark'
];

function palette(id, label, light, dark, grid, boardBg) {
  return {
    id, label, name: label, light, dark,
    vars: {
      '--game-square-light': light,
      '--game-square-dark': dark,
      '--game-grid': grid,
      '--game-selected': '#0e7c86',
      '--game-legal-move': '#0a5f67',
      '--game-board-bg': boardBg,
      '--game-piece-light': '#f8f8f4',
      '--game-piece-dark': '#1b1b20'
    }
  };
}

const palettes = {
  chess: [
    palette('classic', 'Classic', '#f0d9b5', '#b58863', '#8a6848', '#b58863'),
    palette('slate', 'Slate', '#e7edf2', '#7992a3', '#5c7381', '#7992a3')
  ],
  checkers: [palette('classic', 'Classic', '#f0d9b5', '#b58863', '#8a6848', '#b58863')],
  sudoku: [palette('classic', 'Classic', 'var(--bg)', 'var(--surface)', 'var(--line)', 'var(--bg)')],
  go: [palette('classic', 'Wood', '#dcbf85', '#dcbf85', '#725633', '#dcbf85')]
};

const pieceSets = {
  chess: [{
    id: 'chessnut', label: 'Chessnut', name: 'Chessnut',
    assetDirectory: '/games/chess/chessnut', license: 'Apache-2.0',
    copyright: 'Alexis Luengas'
  }]
};

function themesFor(game) {
  if (!Object.hasOwn(palettes, game)) throw new Error(`Unknown game: ${game}`);
  return palettes[game];
}

const copyTheme = (theme) => ({ ...theme, vars: { ...theme.vars } });

export function getThemes(game) {
  return themesFor(game).map(copyTheme);
}

export function getTheme(game, id) {
  const themes = themesFor(game);
  return copyTheme(themes.find((theme) => theme.id === id) ?? themes[0]);
}

export function registerTheme(game, theme) {
  const themes = themesFor(game);
  if (!theme || typeof theme.id !== 'string' || !theme.id || themes.some((existing) => existing.id === theme.id)) throw new Error('Invalid or duplicate theme ID');
  const label = theme.label ?? theme.name;
  const vars = theme.vars ?? {
    '--game-square-light': theme.light,
    '--game-square-dark': theme.dark,
    '--game-grid': theme.dark,
    '--game-selected': '#0e7c86',
    '--game-legal-move': '#0a5f67',
    '--game-board-bg': theme.light,
    '--game-piece-light': '#f8f8f4',
    '--game-piece-dark': '#1b1b20'
  };
  if (typeof label !== 'string' || !label || requiredVars.some((key) => typeof vars[key] !== 'string' || !vars[key])) throw new Error('Invalid theme');
  themes.push({ id: theme.id, label, name: label, light: vars['--game-square-light'], dark: vars['--game-square-dark'], vars: { ...vars } });
}

export function getPieceSets(game) {
  themesFor(game);
  return (pieceSets[game] ?? []).map((set) => ({ ...set }));
}

export function registerPieceSet(game, set) {
  themesFor(game);
  if (game !== 'chess' || !set || typeof set.id !== 'string' || !set.id || pieceSets.chess.some((existing) => existing.id === set.id) || typeof set.label !== 'string' || !set.label || typeof set.assetDirectory !== 'string' || !set.assetDirectory.startsWith('/games/chess/') || typeof set.license !== 'string' || !set.license) throw new Error('Invalid or duplicate piece set');
  pieceSets.chess.push({ id: set.id, label: set.label, name: set.label, assetDirectory: set.assetDirectory.replace(/\/$/, ''), license: set.license, copyright: set.copyright ?? '' });
}

export function getPieceUrl(setId, colour, type) {
  const set = pieceSets.chess.find((entry) => entry.id === setId);
  if (!set || !['w', 'b'].includes(colour) || !['p', 'n', 'b', 'r', 'q', 'k'].includes(type)) return null;
  return `${set.assetDirectory}/${colour}${type.toUpperCase()}.svg`;
}
