// Curated "What's new" - newest first. Each release is { date: 'YYYY-MM', items: [...] }.
// Each item is { tag: 'New' | 'Improved', text, href? }. Keep text short and link the
// feature with href instead of writing out a path. Add a line to the latest month when
// you ship something worth telling readers about.
export const CHANGELOG = [
  {
    date: '2026-07',
    items: [
      { tag: 'New', text: 'Build a Mini UI Framework: the frontend wave\'s capstone project. In about 120 lines of runnable JavaScript you build the machinery inside React, Vue, and Svelte yourself - a proxy reactivity system, automatic dependency tracking, a virtual DOM, and a diff - then trigger the famous keys bug on purpose and fix it. The magic box, emptied.', href: '/guides/mini-framework-js/1' },
      { tag: 'New', text: 'Angular from Zero rounds out the big four: the full-framework deal explained through its modern core - standalone components, signals, dependency injection demystified, and just enough RxJS to be productive without drowning. The NG-numbered errors get their own decoder.', href: '/guides/angular-from-zero/1' },
      { tag: 'New', text: 'Svelte from Zero: the framework this site is built with, explained from the compiler up - runes, dead-snapshot debugging, snippets, and why there is no virtual DOM to diff. Eight phases, including a translation table for the older syntax you will meet in the wild.', href: '/guides/svelte-from-zero/1' },
      { tag: 'New', text: 'Vue from Zero completes the Frontend trio-in-progress: eight phases built around the reactivity model - proxies that track who read what, why mutation is the intended API here, and the destructuring trap that silently disconnects your data from the screen.', href: '/guides/vue-from-zero/1' },
      { tag: 'New', text: 'Next.js from Zero joins the Frontend shelf: eight phases that explain the framework from the request up - why a server in front of React changes everything, the server/client component split, data and mutations without an API layer, and why your page was stale in production but fine in dev.', href: '/guides/nextjs-from-zero/1' },
      { tag: 'New', text: 'A new Frontend category opens with React from Zero: nine phases that start from the one idea the whole library is built on (your UI is a function of your data) and end with the classic errors decoded. Next, Vue, Svelte, and Angular follow.', href: '/guides/react-from-zero/1' },
      { tag: 'New', text: 'Every guide phase now ends with related guides: the four most relevant pages elsewhere in the library, picked by the same search engine that powers the palette. Finish a page and the next thread is already waiting.' },
      { tag: 'Improved', text: 'Review now schedules with FSRS, the modern spaced-repetition model: each card tracks how stable that memory actually is and comes back right before you would forget it, instead of on a fixed ladder. Sessions also mix cards from different guides, which sticks better than drilling one topic at a time.', href: '/review' },
      { tag: 'Improved', text: 'Quizzes push toward real mastery: a new button retries just the questions you missed, and wrong options can now explain why that specific choice fails instead of one generic correction.' },
      { tag: 'New', text: 'A quick-recall step before each quiz: state the idea from memory first, then check yourself against the summary. Pulling it out of your head is what makes it stay.' },
      { tag: 'Improved', text: 'The tutor teaches instead of telling: get something wrong and it starts from your actual answer with a pointed question, and when a mistake traces back to an earlier concept it says so and points at the guide that covers it.' },
      { tag: 'Improved', text: 'The site is friendlier to keyboards and screen readers: a skip-to-content link, dialogs that keep focus where you are working and hand it back when they close, announced status messages, and faint text that meets WCAG contrast in every theme. Selecting text with the keyboard now surfaces the "ask the tutor" pill too.' },
      { tag: 'Improved', text: 'Fonts now load from this site instead of a Google server: faster on repeat visits, and no third party watching you read.' },
      { tag: 'Improved', text: 'A wrong link now lands on a real page with ways back in, instead of a dead end.' },
      { tag: 'New', text: 'Two new CSS deep-dives for the bugs that have no error message: why a margin escapes its parent and pushes the whole box down (Margin Collapse, in CSS Without Tears), and why one long token tears a flex row apart while flex: 1 watches (When a Flex Item Won\'t Shrink, in Flexbox and Grid).', href: '/guides/css-without-tears/3' },
      { tag: 'New', text: 'Practice: HTML & CSS, with a live preview. Write real markup and styles, press Run, and watch the page redraw beside you. Twelve lessons from your first heading up to the layouts that quietly break: padding that overflows a box, a colour that loses to a more specific selector, and a card one long word tears open.', href: '/practice/html-css/1' },
      { tag: 'New', text: 'Practice: twelve advanced Python and JavaScript lessons for code that runs clean and is still wrong. A default argument that remembers the last shopper, a copy that was never a copy, sort() putting 10 before 9, and an API that sends some amounts as numbers and some as strings.', href: '/practice' },
      { tag: 'New', text: 'Practice: six advanced SQL lessons for the queries that run clean and are still wrong. One NULL that empties a NOT IN, a join that quietly doubles your revenue, a typo that splits one company into three, and two capstones where the hard part is deciding what the question even means.', href: '/practice/sql' },
      { tag: 'Improved', text: 'Practice: a SQL query that correctly matches no rows now shows an empty result table, instead of asking whether you wrote a SELECT and reporting a row count that was never yours.', href: '/practice/sql' },
      { tag: 'New', text: 'Decision scenarios: a symptom, a running clock, and no obviously right answer. Work a live outage, a lost commit, or a 3am page and watch what each choice actually costs you.', href: '/guides/when-prod-is-down/1' },
      { tag: 'Improved', text: 'Build-along projects now hand you the keyboard: write the key function yourself and run it against real checks, then compare it with ours.', href: '/categories/projects' },
      { tag: 'New', text: 'Practice: "fix the bug" lessons - someone else\'s broken code, and your job is to repair it. In Python, JavaScript, TypeScript, SQL, Postgres, git and regex.', href: '/practice' },
      { tag: 'Improved', text: 'Practice: once you pick a module, the sidebar shows just that module\'s lessons instead of all ten.', href: '/practice' },
      { tag: 'Improved', text: 'Diagrams now appear instantly, with no JavaScript to download, and follow whichever theme you are reading in.' },
      { tag: 'New', text: 'C and C++ from zero: two deep, from-scratch courses - pointers, memory, RAII, templates, the STL, and the ideas that separate writing code from understanding it.', href: '/categories/programming-languages' },
      { tag: 'New', text: 'Power BI from zero, plus a DAX deep dive - from a spreadsheet to a live, trustworthy report, and the row-vs-filter-context reasoning behind DAX.', href: '/categories/data-analytics' },
      { tag: 'New', text: 'Searches that turn up nothing now offer to add the topic straight to the writing queue.', href: '/request' },
      { tag: 'Improved', text: 'A "What\'s new" shortcut in the header (with a dot when there\'s something new), and a recently-added strip on the home page.' },
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
