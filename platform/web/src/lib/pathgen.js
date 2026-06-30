// Client-side learning-path generator.
//
// A path is *generated* from the guide metadata the site already has
// (category + difficulty), never hand-maintained. That means new guides slot
// into existing paths automatically, with zero upkeep. Pure + deterministic:
// same inputs → same path, no server, no AI.

// Foundations → advanced. The one ordering the whole generator hangs off of.
// A "newbie" path starts at the top; every level walks the same spine, just
// with a higher difficulty ceiling. Categories not listed here are appended at
// the end (so adding a new category never silently drops its guides).
export const CATEGORY_ORDER = [
  'hardware',
  'operating-systems',
  'programming-concepts',
  'programming-languages',
  'version-control',
  'networking',
  'apis',
  'databases',
  'data-analytics',
  'debugging',
  'testing',
  'security',
  'performance',
  'architecture',
  'devops',
  'infrastructure',
  'ai-ml'
];

// The three doors into a path. `allow` is the set of difficulties included.
export const LEVELS = [
  {
    id: 'newbie',
    label: 'Total beginner',
    blurb: "I don't really know how any of this works. Start me from the ground up.",
    allow: ['beginner']
  },
  {
    id: 'basics',
    label: 'I know the basics',
    blurb: 'I can find my way around. Take me from the fundamentals into the real stuff.',
    allow: ['beginner', 'intermediate']
  },
  {
    id: 'comfortable',
    label: "I'm comfortable",
    blurb: 'I want the deep end too - include the advanced material.',
    allow: ['beginner', 'intermediate', 'advanced']
  }
];

const DIFF_RANK = { beginner: 0, intermediate: 1, advanced: 2 };

export function levelById(id) {
  return LEVELS.find((l) => l.id === id) || LEVELS[0];
}

// categories: [{slug, name, icon, ...}] · guides: [{slug, title, summary, category, difficulty}]
// interests: array of category slugs (empty = everything).
// Returns ordered steps: [{slug, title, summary, category, categoryName, difficulty}].
export function generatePath({ level, interests = [] }, categories, guides) {
  const allow = new Set(levelById(level).allow);
  const nameOf = Object.fromEntries((categories || []).map((c) => [c.slug, c.name]));

  // Canonical order first, then any stragglers not in the list.
  const known = CATEGORY_ORDER.filter((c) => (categories || []).some((x) => x.slug === c));
  const extra = (categories || []).map((c) => c.slug).filter((s) => !CATEGORY_ORDER.includes(s));
  let order = [...known, ...extra];

  const want = new Set(interests || []);
  if (want.size) order = order.filter((c) => want.has(c));

  const steps = [];
  for (const cat of order) {
    const inCat = (guides || [])
      .filter((g) => g.category === cat && allow.has(g.difficulty))
      .sort((a, b) => (DIFF_RANK[a.difficulty] ?? 9) - (DIFF_RANK[b.difficulty] ?? 9) || a.title.localeCompare(b.title));
    for (const g of inCat) {
      steps.push({
        slug: g.slug,
        title: g.title,
        summary: g.summary,
        category: cat,
        categoryName: nameOf[cat] || cat.replace(/-/g, ' '),
        difficulty: g.difficulty
      });
    }
  }
  return steps;
}
