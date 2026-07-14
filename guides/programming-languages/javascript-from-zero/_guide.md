---
title: "JavaScript From Zero"
guide: "javascript-from-zero"
phase: 0
summary: "Learn JavaScript from nothing to genuinely advanced: where it runs, values and types, collections, control flow, modules, async and the DOM - then the deep half: scope and closures, this and prototypes, generators, the event loop, functional JS, bundlers, performance, and the road to TypeScript. Small, runnable steps, clear explanations."
tags: [javascript, js, node, beginner, advanced, web, programming-language, closures, prototypes, event-loop, typescript]
category: programming-languages
order: 2
difficulty: beginner
synonyms: ["learn javascript from scratch", "javascript for beginners", "javascript from beginner to advanced", "advanced javascript", "how to start with javascript", "javascript tutorial a to z", "is javascript hard to learn", "javascript node and browser", "javascript closures this prototypes", "javascript event loop", "javascript to typescript"]
updated: 2026-06-22
---

# JavaScript From Zero

JavaScript is the one language you can't avoid. It runs every website on Earth, it runs on servers
through Node.js, it powers desktop apps and phone apps and build tools. That ubiquity is a blessing and a
curse: there's a *lot* of it, and most tutorials drop you straight into a framework without ever
explaining what the language actually is or how it thinks.

This guide does the opposite. We build your mental model first - what a value is, how types behave, why
`let` and `const` replaced `var`, what "asynchronous" really means - and only then reach for the tools.
By the end you'll be able to *reason* about JavaScript instead of pasting snippets and praying.

It's one zero-to-hero journey in two halves. **Phases 1–9 are the basics** - enough to write real,
well-organized programs and read any codebase. **Phases 10–17 are the deep half** - scope and closures,
`this` and prototypes, generators, the event loop's true ordering, functional JS, bundlers, performance,
and the road to TypeScript. That's the stuff that separates "writes JavaScript" from "understands
JavaScript." Each phase carries a difficulty badge so you can see the climb.

> 📝 This guide teaches the **language**. If you've never programmed at all, start with
> [Programming From Zero](/guides/programming-from-zero) first - it covers the universal ideas (what a
> program is, variables, loops) that every language shares. Then come back here.

## How to read this

- **Brand new to JavaScript?** Read 1–9 in order, top to bottom - each builds on the last. Type the
  examples out yourself (most are runnable right here); running code teaches more than reading it five
  times. Come back for 10+ when the basics feel comfortable.
- **Already know another language?** Skim phases 1–5 for the JavaScript-specific details (loose typing,
  `===`, ES modules, `package.json`), then slow down at phase 6 - the asynchronous model is where
  JavaScript genuinely differs from most languages.
- **Past the basics already?** Jump straight to the deep half - [Phase 10: Scope, Closures &
  Hoisting](10-scope-and-closures.md) onward is where JavaScript stops being "a language you can use" and
  becomes one you can reason about to the metal.

## The phases

**Part 1 - The basics (🟢 Basic → 🟡 Intermediate)**
1. **[Install & Your First Program](01-install-and-first-program.md)** 🟢 - the browser and Node.js; install Node, run a file, use the console.
2. **[Syntax, Values & Types](02-syntax-values-and-types.md)** 🟢 - `let`/`const`, the primitive types, template literals, loose typing.
3. **[Collections](03-collections.md)** 🟢 - arrays and objects, daily methods, and the reference-vs-value trap.
4. **[Control Flow & Functions](04-control-flow-and-functions.md)** 🟢 - `if`/loops/functions, arrow functions, functions as values.
5. **[Modules & Project Layout](05-modules-and-project-layout.md)** 🟢 - `import`/`export`, `package.json`, `node_modules`, a sane shape.
6. **[Async & the DOM](06-async-and-the-dom.md)** 🟡 - callbacks, promises, `async`/`await`, and reaching into a web page.
7. **[Errors & I/O](07-errors-and-io.md)** 🟡 - `try`/`catch`, files in Node, and the network without falling over.
8. **[Ecosystem & Tooling](08-ecosystem-and-tooling.md)** 🟡 - npm, linters, formatters, bundlers, and where TypeScript fits.
9. **[Idioms & Gotchas](09-idioms-and-gotchas.md)** 🟡 - the fluent patterns, and the famous footguns explained once, properly.

**Part 2 - Beyond the basics (🟡 Intermediate → 🔴 Advanced)**
10. **[Scope, Closures & Hoisting](10-scope-and-closures.md)** 🔴 - the scope chain, the TDZ, and how a function remembers where it was born.
11. **[this, Prototypes & the Object Model](11-this-prototypes-and-objects.md)** 🔴 - the four `this` rules, the prototype chain, classes as sugar.
12. **[Iterators, Generators & Symbols](12-iterators-generators-symbols.md)** 🟡 - the iterable protocol, `function*`, and values on demand.
13. **[The Event Loop, Deep](13-the-event-loop-deep.md)** 🔴 - tasks vs microtasks, and why `Promise` runs before `setTimeout`.
14. **[Functional JavaScript](14-functional-javascript.md)** 🟡 - pure functions, higher-order functions, immutability, composition.
15. **[Modules & Bundlers, Deep](15-modules-and-bundlers.md)** 🟡 - ESM vs CommonJS, tree-shaking, dynamic import, what a bundler does.
16. **[Performance & Memory](16-performance-and-memory.md)** 🔴 - how V8 runs your code, the GC, and finding the real slow thing.
17. **[Types & the Road to TypeScript](17-types-and-typescript.md)** 🟡 - what static typing buys you, and the short leap to TS.

**Finale**
18. **[Where to Go Next](18-where-to-go-next.md)** 🟢 - frameworks, backend, full-stack, and what to actually build.

> Frameworks (React, Vue, Svelte) and TypeScript are their own guides - different tools, not "more
> JavaScript." This guide makes the *language* make sense, top to bottom.
