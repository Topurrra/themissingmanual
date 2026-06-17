// Display label + ordering for guide difficulty.
export const LEVELS = ['Basic', 'Intermediate', 'Advanced'];

export function levelLabel(difficulty) {
  if (difficulty === 'intermediate') return 'Intermediate';
  if (difficulty === 'advanced') return 'Advanced';
  return 'Basic'; // beginner / unknown
}

// Group an array of guides ({difficulty}) into [{ level, guides }] in LEVELS order.
export function groupByLevel(guides) {
  return LEVELS.map((level) => ({
    level,
    guides: guides.filter((g) => levelLabel(g.difficulty) === level),
  })).filter((grp) => grp.guides.length > 0);
}
