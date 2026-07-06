---
title: "Choosing the Right Storage for the Job"
guide: "browser-storage-and-cookies"
phase: 3
summary: "A decision guide for picking cookies, localStorage, sessionStorage, or IndexedDB based on what the data is and who needs to see it - worked through with a complete dark mode example."
tags: [cookies, localstorage, decision-guide, web-fundamentals, capstone]
difficulty: intermediate
synonyms: ["where should i store auth token", "localstorage vs cookie for jwt", "dark mode preference localstorage example", "browser storage decision guide"]
updated: 2026-07-06
---

# Choosing the Right Storage for the Job

Four storage options, one question to ask of each piece of data: **does the server need to see this
automatically, and can JavaScript be trusted with it?** Answer that and the right mechanism falls out.

## The decision guide

**Auth token → `HttpOnly` cookie.** The server needs it on every request, and if an attacker ever gets
a `<script>` running on your page (XSS), you don't want that script able to read the token and ship it
off to an attacker's server. `HttpOnly` cookies are invisible to JavaScript but still sent
automatically - the server gets what it needs, malicious scripts get nothing. Pair with `Secure` and
`SameSite=Lax` (or `Strict`) as covered in Phase 1.

**UI preference (dark mode, sidebar collapsed, language) → `localStorage`.** Purely client-side,
doesn't need to touch the server, should persist across visits. No reason to pay the cost of sending
it on every request like a cookie would.

**In-progress form state, one-time-per-visit flags → `sessionStorage`.** Should vanish when the tab
closes rather than sticking around forever.

**Large or structured data (offline article cache, downloaded dataset, file blobs) → IndexedDB.**
Anything past a few hundred KB, or anything that's genuinely a collection of records rather than a
handful of flags.

The rule underneath all four: never put anything sensitive in `localStorage` or `sessionStorage`.
Both are plain JavaScript-readable strings with zero protection against XSS - a single injected script
can call `localStorage.getItem` and exfiltrate whatever's there. That's exactly the attack `HttpOnly`
cookies exist to prevent, which is why auth tokens don't belong in `localStorage` even though it's the
more convenient API.

## Worked example: remembering dark mode

The full flow, end to end, for "remember the user's theme choice across visits."

**1. Read the saved preference on load, falling back to system preference:**

```js
function getInitialTheme() {
  const saved = localStorage.getItem("theme");
  if (saved === "dark" || saved === "light") return saved;

  // No saved choice yet - respect the OS-level setting
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

document.documentElement.dataset.theme = getInitialTheme();
```

**2. Apply it with CSS** (see [CSS Without Tears](/guides/css-without-tears) for selector basics):

```css
[data-theme="dark"] {
  --bg: #16181d;
  --text: #e8e8e8;
}
[data-theme="light"] {
  --bg: #ffffff;
  --text: #16181d;
}
body {
  background: var(--bg);
  color: var(--text);
}
```

**3. Wire up a toggle button and persist the choice:**

```js
const toggle = document.querySelector("#theme-toggle");

toggle.addEventListener("click", () => {
  const current = document.documentElement.dataset.theme;
  const next = current === "dark" ? "light" : "dark";

  document.documentElement.dataset.theme = next;
  localStorage.setItem("theme", next);
});
```

That's it - three small pieces, no server round trip, no cookie overhead on every request. The choice
survives closing the browser entirely, because `localStorage` doesn't expire. If this were instead
"remember whether the user dismissed today's announcement banner," swap `localStorage` for
`sessionStorage` and the rest of the pattern is identical.

## Where you've been, where to go next

Zoom out and this closes the loop the whole Web Fundamentals category opened: [client-server
communication](/guides/what-the-web-actually-is) delivers [HTML](/guides/html-from-zero) that
[CSS](/guides/css-without-tears) and [layout](/guides/flexbox-and-grid) turn into a page, the
[DOM](/guides/the-dom-explained) and [forms](/guides/forms-that-work) make it interactive, the
[browser renders](/guides/how-the-browser-renders-a-page) it and adapts it
[responsively](/guides/responsive-design) and [accessibly](/guides/accessibility-from-day-one), and
now you know how it remembers you between visits.

That's the full page lifecycle, client-side. From here, the natural next step is the language driving
all of it in depth: [JavaScript From Zero](/guides/javascript-from-zero) if you want to go deeper on
the language itself, or a framework once you're ready to build something bigger than plain DOM
manipulation comfortably supports.

## Try it

```exercise
[
  {
    "type": "predict",
    "task": "A site stores a user's shopping cart JSON in localStorage under the key \"cart\". The user closes the tab and reopens the site an hour later. Is the cart still there?",
    "accept": ["yes", "/yes.*persist/i"],
    "hint": "localStorage has no expiry - it only clears when something explicitly removes it."
  },
  {
    "type": "task",
    "task": "You're building a \"remember me\" checkbox for a login form. Decide where the session token goes and where the checkbox's own on/off state goes, and why they're different.",
    "reveal": "The session token goes in an HttpOnly, Secure, SameSite cookie set by the server - it must ride along automatically and must stay out of reach of any injected script. The checkbox state itself (a UI flag, not a secret) can live in localStorage if you want to pre-check it next visit.",
    "checklist": ["Token isn't readable from JavaScript", "Token attributes include Secure and SameSite", "UI-only state isn't over-engineered into a cookie"]
  }
]
```

Quick check before you go:

```quiz
[
  {
    "q": "Where should an auth token live, and why?",
    "choices": ["localStorage, because it persists across visits", "An HttpOnly cookie, because JavaScript can't read it even though the server still receives it automatically", "sessionStorage, because it clears when the tab closes"],
    "answer": 1,
    "explain": "HttpOnly keeps the token out of reach of any injected script while still letting the browser send it automatically to the server."
  },
  {
    "q": "A dark mode toggle's current setting - where does it belong?",
    "choices": ["HttpOnly cookie", "localStorage", "IndexedDB"],
    "answer": 1,
    "explain": "It's a non-sensitive UI preference that only the client needs - no reason to send it to the server on every request or reach for a database."
  },
  {
    "q": "Why shouldn't you store a session token in localStorage?",
    "choices": ["It's too small to hold a token", "Any script running on the page (e.g. via XSS) can read localStorage directly", "localStorage doesn't support strings"],
    "answer": 1
  }
]
```

---

[← Phase 2: localStorage, sessionStorage, and IndexedDB](02-storage-apis.md) · [Guide overview](_guide.md)
