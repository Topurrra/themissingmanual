// Curated "What's new" - newest first. Each release is { date: 'YYYY-MM', items: [...] }.
// Each item is { tag: 'New' | 'Improved', text, href? }. Keep text short and link the
// feature with href instead of writing out a path. Add a line to the latest month when
// you ship something worth telling readers about.
export const CHANGELOG = [
  {
    date: '2026-07',
    items: [
      { tag: 'New', text: 'High-contrast dark theme.' },
      { tag: 'New', text: 'Cheat sheets now appear in instant search and the command palette.', href: '/cheat-sheet' },
      { tag: 'New', text: 'Built for AI assistants: a sitemap, structured data, and a server that tools like Claude and Cursor can read directly.' },
      { tag: 'New', text: 'AI tutor: ask questions about the phase you’re reading, right from the guide.' },
      { tag: 'Improved', text: 'Listen (text-to-speech) and feedback now sit inside the reader instead of floating over the page.' },
      { tag: 'Improved', text: 'Faster page loads on mobile.' }
    ]
  },
  {
    date: '2026-06',
    items: [
      { tag: 'New', text: 'Five new themes and a font picker.' },
      { tag: 'New', text: 'Brain games to sharpen the fundamentals.', href: '/train' },
      { tag: 'New', text: 'Guides on no-code and low-code tools, and working with AI.' },
      { tag: 'New', text: 'Math, Physics, and Logic topics.' },
      { tag: 'Improved', text: 'The lofi player moved into the header with clearer controls.' }
    ]
  },
  {
    date: '2026-05',
    items: [
      { tag: 'New', text: 'In-depth language guides, including Java and C#.' },
      { tag: 'New', text: 'A Frameworks learning path.', href: '/paths' },
      { tag: 'New', text: 'Cheat sheets and a plain-language glossary.', href: '/glossary' }
    ]
  }
];

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// 'YYYY-MM' -> 'Month YYYY' (no date lib, no timezone surprises).
export function formatMonth(ym) {
  const [y, m] = String(ym).split('-').map(Number);
  return `${MONTHS[(m || 1) - 1]} ${y}`;
}
