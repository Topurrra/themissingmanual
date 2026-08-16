// Curated "What's new" - newest first. Each release is { date: 'YYYY-MM', items: [...] }.
// Each item is { tag: 'New' | 'Improved', text, href? }. Keep text short and link the
// feature with href instead of writing out a path. Add a line to the latest month when
// you ship something worth telling readers about.
export const CHANGELOG = [
  {
    date: '2026-08',
    items: [
      { tag: 'New', text: 'Embedded C From Zero: program a real microcontroller (the AVR ATmega328P) in bare-metal C - GPIO, registers, interrupts, timers, PWM, and serial - and run every example in your browser with Wokwi, no board needed.', href: '/guides/embedded-c-from-zero/1' },
      { tag: 'New', text: 'New Algorithms category: search, sort, recursion, trees, and graphs, each shown across seven languages and runnable in the browser.', href: '/categories/algorithms' },
    ],
  },
  {
    date: '2026-07',
    items: [
      { tag: 'New', text: 'Sixteen new practice lessons across Postgres, TypeScript, Math, and Physics.', href: '/practice' },
      { tag: 'New', text: 'Seven new cheat sheets: JavaScript, CSS, TypeScript, React Hooks, grep, systemctl, and nginx.', href: '/cheat-sheet?tool=javascript' },
      { tag: 'New', text: 'Build a Mini UI Framework: reactivity, a virtual DOM, and the keys bug in ~120 lines of runnable JS.', href: '/guides/mini-framework-js/1' },
      { tag: 'New', text: 'Angular from Zero: standalone components, signals, DI, and just enough RxJS.', href: '/guides/angular-from-zero/1' },
      { tag: 'New', text: 'Svelte from Zero: runes, snippets, and why there is no virtual DOM.', href: '/guides/svelte-from-zero/1' },
      { tag: 'New', text: 'Vue from Zero: the reactivity model, and the destructuring trap that breaks it.', href: '/guides/vue-from-zero/1' },
      { tag: 'New', text: 'Next.js from Zero: server vs client components, and data without an API layer.', href: '/guides/nextjs-from-zero/1' },
      { tag: 'New', text: 'New Frontend category, opening with React from Zero.', href: '/guides/react-from-zero/1' },
      { tag: 'New', text: 'Every guide phase now ends with four related guides.' },
      { tag: 'Improved', text: 'Review now uses FSRS spaced repetition and mixes cards across guides.', href: '/review' },
      { tag: 'Improved', text: 'Quizzes: retry just the ones you missed, with per-option explanations.' },
      { tag: 'New', text: 'A quick-recall step before each quiz: recall first, then check.' },
      { tag: 'Improved', text: 'The tutor now teaches from your answer and points back to the root concept.' },
      { tag: 'Improved', text: 'Better keyboard and screen-reader support, with readable text in every theme.' },
      { tag: 'Improved', text: 'Fonts now load from this site, not Google: faster and more private.' },
      { tag: 'Improved', text: 'Broken links now land on a real page with ways back.' },
      { tag: 'New', text: 'Two new CSS deep-dives: margin collapse, and when a flex item will not shrink.', href: '/guides/css-without-tears/3' },
      { tag: 'New', text: 'Practice: HTML and CSS with a live preview, twelve lessons.', href: '/practice/html-css/1' },
      { tag: 'New', text: 'Practice: twelve advanced Python and JavaScript bug-hunt lessons.', href: '/practice' },
      { tag: 'New', text: 'Practice: six advanced SQL lessons for queries that run clean but are wrong.', href: '/practice/sql' },
      { tag: 'Improved', text: 'Practice: a SQL query matching no rows now shows an empty table.', href: '/practice/sql' },
      { tag: 'New', text: 'Decision scenarios: work a live outage or a 3am page and see what each choice costs.', href: '/guides/when-prod-is-down/1' },
      { tag: 'Improved', text: 'Build-along projects now let you write the key function and check it.', href: '/categories/projects' },
      { tag: 'New', text: 'Practice: fix-the-bug lessons across Python, JS, TS, SQL, Postgres, git, and regex.', href: '/practice' },
      { tag: 'Improved', text: 'Practice: the sidebar now shows just the module you picked.', href: '/practice' },
      { tag: 'Improved', text: 'Diagrams now render instantly with no JavaScript, matching your theme.' },
      { tag: 'New', text: 'C and C++ from zero: two deep from-scratch courses.', href: '/categories/programming-languages' },
      { tag: 'New', text: 'Power BI from zero, plus a DAX deep dive.', href: '/categories/data-analytics' },
      { tag: 'New', text: 'Empty searches can now add the topic to the writing queue.', href: '/request' },
      { tag: 'Improved', text: 'A changelog shortcut in the header, and a recently-added strip on the home page.' },
      { tag: 'New', text: 'Every guide page now links to the GitHub editor for that file.' },
      { tag: 'New', text: 'Practice: hands-on SQL, JavaScript, and Python in a three-panel playground.', href: '/practice' },
      { tag: 'Improved', text: 'Practice: each module now has its own overview page and lesson sidebar.', href: '/practice' },
      { tag: 'New', text: 'Highlight any passage in a guide and add a private note.' },
      { tag: 'Improved', text: 'The lofi player is much better on mobile, with a full player sheet.' },
      { tag: 'Improved', text: 'Word Search now has 22 topic packs plus a general mix.', href: '/train' },
      { tag: 'New', text: 'A public backlog: vote on what we write next.', href: '/backlog' },
      { tag: 'New', text: 'Optional review reminders and a practice streak.', href: '/review' },
      { tag: 'New', text: 'New Working as a Developer category: code review, legacy code, on-call, and interviews.', href: '/categories/working-as-a-developer' },
      { tag: 'New', text: 'Advanced capstone guides across Logic, Physics, Security, No-Code, and more.' },
      { tag: 'New', text: 'Front-door guides for the Tools and Frameworks shelves.' },
      { tag: 'New', text: 'Web Fundamentals: ten new guides on HTML, CSS, the DOM, forms, and more.', href: '/categories/web-fundamentals' },
      { tag: 'New', text: 'Download any guide as an EPUB.' },
      { tag: 'New', text: 'The AI tutor now shows its sources and answers why on wrong quiz answers.' },
      { tag: 'New', text: 'A live-radio mode for the lofi player.' },
      { tag: 'New', text: 'Read offline: pages you have visited stay readable.' },
      { tag: 'New', text: 'Translate any page into 8 languages from the header.' },
      { tag: 'New', text: 'Request a guide: tell us what you wish existed.', href: '/request' },
      { tag: 'New', text: 'Eleven more cheat sheets: sed, awk, ffmpeg, terraform, and psql.', href: '/cheat-sheet' },
      { tag: 'New', text: 'Three bigger build-along projects: a blog generator, a Go CLI, and a key-value database.', href: '/categories/projects' },
      { tag: 'New', text: 'High-contrast dark theme.' },
      { tag: 'New', text: 'Cheat sheets now appear in search and the command palette.', href: '/cheat-sheet' },
      { tag: 'New', text: 'Built for AI assistants: sitemap, structured data, and a machine-readable server.' },
      { tag: 'New', text: 'AI tutor: ask about the phase you are reading, right from the guide.' },
      { tag: 'New', text: 'Animated click-through explainers for core concepts.', href: '/explainers/Home.dc.html' },
      { tag: 'New', text: 'A first-visit question sets beginner-friendly defaults.' },
      { tag: 'Improved', text: 'Listen and feedback now sit inside the reader.' },
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

// Stable signature of the newest changelog state - changes whenever an item is added
// to the top month or a new month lands. Stored in localStorage to flag "new since
// your last visit" (the header sparkle dot) without needing per-item ids.
export function changelogSignature() {
  const top = CHANGELOG[0];
  return top ? `${top.date}:${top.items.length}` : '';
}

// The most recent N changelog items, newest first - for the homepage "recently added" strip.
export function recentItems(n = 4) {
  const out = [];

  // 1. Collect up to 'n' items
  outerLoop: for (const rel of CHANGELOG) {
    for (const it of rel.items) {
      out.push(it);
      if (out.length >= n) {
        break outerLoop;
      }
    }
  }

  // 2. Sort the collected items: 'new' first, everything else second
  return out.sort((a, b) => {
    const aIsNew = a.tag === "New" ? 1 : 0;
    const bIsNew = b.tag === "New" ? 1 : 0;

    // Sorts descending (1 comes before 0)
    return bIsNew - aIsNew;
  });
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// 'YYYY-MM' -> 'Month YYYY' (no date lib, no timezone surprises).
export function formatMonth(ym) {
  const [y, m] = String(ym).split('-').map(Number);
  return `${MONTHS[(m || 1) - 1]} ${y}`;
}
