---
title: "The DOM Is Not the HTML"
guide: "the-dom-explained"
phase: 1
summary: "The browser parses HTML into a live tree of objects called the DOM. JavaScript reads and changes that tree, not the original HTML text - which is why View Source and devtools can show two different pages."
tags: [dom, javascript, web-fundamentals, html-parsing]
difficulty: intermediate
synonyms: ["dom vs html source", "what is the document object model", "why does view source differ from devtools", "is the dom the same as html"]
updated: 2026-07-06
---

# The DOM Is Not the HTML

When a browser loads a page, it reads the HTML text once, parses it, and throws the text away. What's
left is the **DOM** - the Document Object Model - a tree of JavaScript objects sitting in memory. Every
tag becomes a node. Every attribute becomes a property. That tree is the page, as far as the browser
and JavaScript are concerned. The original HTML string is gone.

This distinction matters because two browser tools show two different things, and mixing them up leads
to real confusion when debugging.

## View Source vs. the Elements panel

**View Source** (`Ctrl+U` or `view-source:` in the address bar) shows the raw HTML the server sent, as
plain text. It never changes, no matter what JavaScript does afterward. It's a network response, frozen.

**The Elements panel** in devtools (right-click → Inspect) shows the live DOM tree - the current state
of the page, including anything JavaScript has added, removed, or changed since load. Open it on a page
with an infinite-scroll feed, a modal that just opened, or a shopping cart counter, and you'll see
elements that never existed in the original HTML at all.

Say a page's server-rendered HTML looks like this:

```html
<body>
  <ul id="cart"></ul>
</body>
```

An empty cart. Now a script runs on load:

```js
const cart = document.getElementById('cart');
const item = document.createElement('li');
item.textContent = 'Wireless Mouse - $24.99';
cart.appendChild(item);
```

Reload the page and check View Source: still an empty `<ul id="cart"></ul>`. That's the text the server
sent - `createElement` never touched it. Now open the Elements panel: it shows `<ul id="cart"><li>Wireless
Mouse - $24.99</li></ul>`. The tree grew a new node; the source text didn't move.

This is the single most common source of "but the HTML says X" bug reports. The HTML said X. The DOM,
which is what the user actually sees, says Y, because a script ran after the page loaded.

## The DOM is a tree, and it's an API

Parsing turns nested tags into a parent-child tree. `<body>` is the parent of `<ul>`, `<ul>` is the
parent of each `<li>`, and so on. Every node in that tree is an object with properties and methods:
`.textContent`, `.children`, `.parentElement`, `.appendChild()`, `.remove()`. JavaScript doesn't edit
text - it calls methods on tree nodes, and the browser re-renders whatever changed.

That's also why the DOM is described as **live**: hold a reference to a node in a variable, mutate the
page around it, and the variable still points at the same object, wherever it ends up. Nodes don't get
recreated on every change - they're mutated in place.

## Why this trips people up

A few consequences follow directly from "DOM is live, HTML is static text":

- **"View source shows different HTML than the inspector."** Expected. View Source is the original
  response; the inspector is the current tree. A single-page app that renders everything with JavaScript
  might show almost nothing in View Source and a full page in the Elements panel.
- **Search engines and scrapers that only fetch raw HTML miss anything JavaScript adds.** This is why
  some sites need server-side rendering - crawlers that don't execute JavaScript only ever see the View
  Source version.
- **`Ctrl+F` in View Source won't find text that JavaScript injected.** Search the Elements panel
  instead, or use devtools' own search (`Ctrl+Shift+F` in Chrome DevTools) which searches the live DOM.
- **Editing the Elements panel directly** (double-click any text or attribute in devtools) changes the
  live DOM immediately, visible on screen - but it never touches the server's HTML file, and it's gone
  on refresh.

None of this requires new syntax yet - just the mental model. The next phase covers the actual methods
for finding and changing DOM nodes from a script.

Check that this landed:

```quiz
[
  {
    "q": "You run JavaScript that adds a new <li> to a list. What does View Source show afterward?",
    "choices": ["The new <li>, added to the text", "The original HTML, unchanged", "An error, because View Source updates automatically"],
    "answer": 1,
    "explain": "View Source is the raw response text from the server. It's frozen at load time - only the live DOM (visible in devtools' Elements panel) reflects JavaScript changes."
  },
  {
    "q": "What does the browser do with the original HTML text after parsing it?",
    "choices": ["Keeps it in sync with the DOM forever", "Discards it - the DOM tree is what remains", "Re-downloads it on every DOM change"],
    "answer": 1,
    "explain": "Parsing builds the DOM tree in memory; the source text isn't kept around or updated."
  },
  {
    "q": "Why might a search engine crawler miss content that's visible in the browser?",
    "choices": ["The content is hidden with CSS", "The crawler only reads the raw HTML and doesn't run the JavaScript that adds the content to the DOM", "The content is too far down the page"],
    "answer": 1,
    "explain": "A crawler that doesn't execute JavaScript only sees the View Source version - anything added to the DOM afterward is invisible to it."
  }
]
```

---

[Guide overview](_guide.md) · [Phase 2: Selecting and Modifying Elements →](02-selecting-and-modifying-elements.md)
