---
title: "JavaScript From Zero"
guide: "javascript-from-zero"
phase: 0
summary: "Learn JavaScript from nothing: where it runs, its values and types, collections, control flow and functions, modules, async and the DOM, errors and I/O, the ecosystem, and the idioms that separate fluent from fumbling."
tags: [javascript, js, node, beginner, web, programming-language]
category: programming-languages
order: 2
difficulty: beginner
synonyms: ["learn javascript from scratch", "javascript for beginners", "how to start with javascript", "javascript tutorial a to z", "is javascript hard to learn", "javascript node and browser"]
updated: 2026-06-19
---

# JavaScript From Zero

JavaScript is the one language you can't avoid. It runs every website on Earth, it runs on servers
through Node.js, it powers desktop apps and phone apps and build tools. That ubiquity is a blessing and a
curse: there's a *lot* of it, and most tutorials drop you straight into a framework without ever
explaining what the language actually is or how it thinks.

This guide does the opposite. We build your mental model first — what a value is, how types behave, why
`let` and `const` replaced `var`, what "asynchronous" really means — and only then reach for the tools.
By the end you'll be able to *reason* about JavaScript instead of pasting snippets and praying.

> 📝 This guide teaches the **language**. If you've never programmed at all, start with
> [Programming From Zero](/guides/programming-from-zero) first — it covers the universal ideas (what a
> program is, variables, loops) that every language shares. Then come back here.

## How to read this

- **Brand new to JavaScript?** Read in order, top to bottom. Each phase assumes the one before it. Type
  the examples out yourself — running code in your own terminal teaches more than reading it five times.
- **Already know another language?** Skim phases 1–5 for the JavaScript-specific details (loose typing,
  `===`, ES modules, `package.json`), then slow down at phase 6 — the asynchronous model and the
  event loop are where JavaScript genuinely differs from most languages, and where smart people get
  burned.

## The phases

1. **[Install & Your First Program](01-install-and-first-program.md)** — JavaScript runs in two places
   (the browser and Node.js); install Node, run a file, and use the browser console.
2. **[Syntax, Values & Types](02-syntax-values-and-types.md)** — `let`/`const`, the primitive types,
   template literals, and the quirks of a dynamically, loosely typed language.
3. **[Collections](03-collections.md)** — arrays and objects, the methods you'll use daily, and the
   reference-vs-value trap that bites everyone.
4. **[Control Flow & Functions](04-control-flow-and-functions.md)** — `if`/`else`, loops, functions,
   arrow functions, and treating functions as values you can pass around.
5. **[Modules & Project Layout](05-modules-and-project-layout.md)** — splitting code across files with
   `import`/`export`, what `package.json` and `node_modules` are, and a sane small project shape.
6. **[Async & the DOM](06-async-and-the-dom.md)** — the event loop, callbacks, promises, `async`/`await`,
   and reaching into a web page from JavaScript.
7. **[Errors & I/O](07-errors-and-io.md)** — `try`/`catch`, reading and writing files in Node, and
   talking to the network without your program falling over.
8. **[Ecosystem & Tooling](08-ecosystem-and-tooling.md)** — npm, linters, formatters, bundlers, and
   TypeScript: what each tool is *for* so the landscape stops being noise.
9. **[Idioms & Gotchas](09-idioms-and-gotchas.md)** — the patterns fluent JavaScript developers reach
   for, and the famous footguns (`this`, hoisting, equality) explained once, properly.
10. **[Where to Go Next](10-where-to-go-next.md)** — frameworks, runtimes, and the honest map of where
    JavaScript can take you from here.

> Phases 6–10 build on the foundation in 1–5. We deliberately defer deep async, framework choices, and
> TypeScript so each phase stays a focused read, not a doorstop.
