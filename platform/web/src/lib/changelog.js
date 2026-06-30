// Curated "What's new" - newest first. Each release is { date: 'YYYY-MM', items: [string] }.
// Hand-maintained: when you ship something worth telling readers about, add a line to the
// latest month (or start a new one). Rendered at /changelog. Dates are by month on purpose -
// readers care about roughly when, not the exact day.
export const CHANGELOG = [
  {
    date: '2026-07',
    items: [
      'Faster page loads on mobile - fonts and icons no longer block the first paint.',
      'New high-contrast dark theme, alongside the existing high-contrast light.',
      'Cheat sheets now show up in instant search and the ⌘K command palette, with a shortcut on the homepage.',
      'Built for AI assistants: a complete sitemap, structured data for the glossary, an llms.txt index, and a Model Context Protocol server at /mcp so tools like Claude and Cursor can search and read the guides directly.',
      'Listen (text-to-speech) and page feedback now live inline in the reader instead of floating over the footer.'
    ]
  },
  {
    date: '2026-06',
    items: [
      'New themes - Sepia, Nord, Dracula, and high-contrast - plus a font picker in Settings.',
      'The lofi player moved into the header, with clearer volume controls and a scrolling track title.',
      'Brain games at /train.',
      'New guides on no-code / low-code tools and working with AI.',
      'New Math, Physics, and Logic topics.'
    ]
  },
  {
    date: '2026-05',
    items: [
      'In-depth programming-language guides, including new Java and C# tracks.',
      'A Frameworks learning path.',
      'The Cheat Sheet reference at /cheat-sheet and the Glossary.'
    ]
  }
];

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// 'YYYY-MM' → 'Month YYYY' (no date lib, no timezone surprises).
export function formatMonth(ym) {
  const [y, m] = String(ym).split('-').map(Number);
  return `${MONTHS[(m || 1) - 1]} ${y}`;
}
