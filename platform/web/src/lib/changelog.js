// Curated "What's new" - newest first. Each release is { date: 'YYYY-MM', items: [...] }.
// Each item is { tag: 'New' | 'Improved', text, href? }. Keep text short and link the
// feature with href instead of writing out a path. Add a line to the latest month when
// you ship something worth telling readers about.
export const CHANGELOG = [
  {
    date: '2026-07',
    items: [
      { tag: 'New', text: 'Spotted a typo or a gap? Every guide page now links straight to GitHub\'s editor for that exact file.' },
      { tag: 'New', text: 'Practice: hands-on coding lessons in a three-panel playground - write real SQL, JavaScript, or Python and get checked instantly, right in your browser.', href: '/practice' },
      { tag: 'Improved', text: 'Practice: each module (SQL, JavaScript, Python) now has its own overview page and a lesson sidebar, so it\'s easy to see what\'s left and jump straight to any lesson.', href: '/practice' },
      { tag: 'New', text: 'Highlight any passage in a guide and add a private note to it - only you can see them.' },
      { tag: 'Improved', text: 'The lofi player is much more usable on mobile: a full player sheet with volume, shuffle, repeat, and the track/station list, instead of a cramped row.' },
      { tag: 'Improved', text: 'Word Search now has 22 topic packs (was 6), plus a general mix - pick from Networking, Databases, Math, Physics, and more.', href: '/train' },
      { tag: 'New', text: 'A public backlog: vote on what we should write next, fed by real reader searches and requests.', href: '/backlog' },
      { tag: 'New', text: 'Optional review reminders - opt in and we\'ll nudge you when cards are due - plus a practice streak on the Review page.', href: '/review' },
      { tag: 'New', text: 'Working as a Developer: a new category on the human side of the job - code review, legacy code, asking questions, your first on-call, and interviews.', href: '/categories/working-as-a-developer' },
      { tag: 'New', text: 'Advanced capstone guides added to Logic, Physics, Security, No-Code, Web Fundamentals, Working with AI, and Programming Concepts.' },
      { tag: 'New', text: 'Front-door guides for the Tools & Frameworks shelves: what tooling even is, and choosing your first framework.' },
      { tag: 'New', text: 'Web Fundamentals: ten new guides on HTML, CSS, layout, the DOM, forms, rendering, responsive design, accessibility, and browser storage.', href: '/categories/web-fundamentals' },
      { tag: 'New', text: 'Download any guide as an EPUB for your e-reader.' },
      { tag: 'New', text: 'The AI tutor now shows which guides it drew on, and can be asked "why?" straight from a wrong quiz answer.' },
      { tag: 'New', text: 'A live-radio mode for the lofi player, alongside the loop.' },
      { tag: 'New', text: 'Read offline: pages you visit stay readable without a connection.' },
      { tag: 'New', text: 'Translate any page into 8 languages from the header.' },
      { tag: 'New', text: 'Request a guide: tell us what you wish existed.', href: '/request' },
      { tag: 'New', text: 'Eleven more cheat sheets - sed, awk, ffmpeg, terraform, psql, and friends.', href: '/cheat-sheet' },
      { tag: 'New', text: 'Three bigger build-along projects: a static blog generator, a Go CLI tool, and your own key-value database.', href: '/categories/projects' },
      { tag: 'New', text: 'High-contrast dark theme.' },
      { tag: 'New', text: 'Cheat sheets now appear in instant search and the command palette.', href: '/cheat-sheet' },
      { tag: 'New', text: 'Built for AI assistants: a sitemap, structured data, and a server that tools like Claude and Cursor can read directly.' },
      { tag: 'New', text: 'AI tutor: ask questions about the phase you’re reading, right from the guide.' },
      { tag: 'New', text: 'Animated, click-through explainers for core concepts across every topic.', href: '/explainers/Home.dc.html' },
      { tag: 'New', text: 'A quick first-visit question sets beginner-friendly defaults automatically.' },
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
