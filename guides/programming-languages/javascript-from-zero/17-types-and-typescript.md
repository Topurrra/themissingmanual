---
title: "Types & the Road to TypeScript - Catching Bugs Before They Run"
guide: "javascript-from-zero"
phase: 17
summary: "Why dynamic typing lets type bugs slip to runtime, what static typing buys you, how TypeScript layers types onto plain JS, the no-build JSDoc on-ramp, and where to go next."
tags: [javascript, typescript, types, type-safety, static-typing, jsdoc, tooling]
difficulty: intermediate
synonyms: ["should i learn typescript", "what is typescript", "javascript vs typescript", "gradual typing javascript", "jsdoc types", "typescript for javascript developers", "static vs dynamic typing"]
updated: 2026-06-19
---

# Types & the Road to TypeScript - Catching Bugs Before They Run

This final phase covers the single biggest upgrade left on the table - not a new language feature, but a different way of *checking* it before it ever runs.

**JavaScript trusts you completely**: it will happily add a number to a string, call a function with the wrong arguments, or read a property off `undefined`, complaining (if at all) only when the broken line executes. A type checker is a second pair of eyes that reads your code *without running it* and points at mistakes while you're still typing.

## The cost of dynamic typing

📝 **Dynamic typing** - the *types* of your values (number, string, object…) are tracked and checked only while the program runs. A variable can hold a string now and a number a second later, and nothing checks the pieces fit together until execution reaches them.

That flexibility is nice for sketching things out fast, but a whole category of mistakes - typos in property names, wrong-shaped objects, forgotten arguments - produce no error at all. They quietly yield `undefined` or `NaN`, which flows downstream and breaks something *far* from the actual bug.

Watch it happen:

```javascript runnable
function priceWithTax(item, rate) {
  return item.price + item.price * rate;
}

const product = { name: "Notebook", cost: 12 }; // oops: "cost", not "price"

console.log(priceWithTax(product, 0.2));
```
```console
NaN
```
*What just happened:* `product` has a `cost` field, but `priceWithTax` reads `item.price`. Reading a missing property isn't an error in JavaScript - it returns `undefined`, so `undefined + undefined * 0.2` becomes `NaN`, returned without a peep. The `NaN` lands in a cart total or a database row, and three screens later something looks wrong, with nothing pointing at the misspelled field. A type checker would have underlined `item.price` the instant you wrote it, because it knows `product` has no `price`.

⚠️ **The dangerous part isn't the crash - it's the *lack* of one.** A crash at least points at a line. A silent `undefined`/`NaN` travels far from its source before causing visible damage, which is why these bugs eat hours. Dynamic typing trades upfront freedom for this exact class of late, confusing failures.

## What static typing buys you

📝 **Static typing** - the types of your values are declared (or inferred) and checked *before* the program runs, usually right in your editor as you type. "Static" means "without running it": the check happens at rest, on the source code itself.

Flip the previous bug into a statically-typed world and it never reaches the browser:

- **Bugs caught in the editor.** The `item.price` typo gets a red underline immediately - fixed before you ever run the code.
- **Autocomplete that knows your shapes.** The editor knows `product` has `name` and `cost`, so typing `product.` offers exactly those two - no guessing field names or flipping back to the definition.
- **Types as living documentation.** A signature like `priceWithTax(item: Product, rate: number)` tells the next reader precisely what to pass - and unlike a comment, it can't drift out of date, because the checker enforces it.
- **Safer refactors.** Rename a field or change a function's arguments, and the checker flags *every* call site that no longer fits - a map instead of a flashlight.

💡 **The shift in feel.** Dynamic typing finds mistakes at runtime, scattered across a session. Static typing finds them at edit-time, all at once, before anything runs. The bugs were always there - static typing just moves discovery to the cheapest moment.

## TypeScript = JavaScript + a type layer

Getting static checking in a language that doesn't have it means adding a layer, not switching languages. That layer is **TypeScript**.

📝 **TypeScript** - a *superset* of JavaScript: every valid JavaScript program is already valid TypeScript. You optionally add type annotations on top, a checker verifies they hold together, and it compiles down to plain JavaScript that runs anywhere JS runs.

"Superset" is the key word: you don't rewrite code to adopt TypeScript, you rename a file and add types where they help. Here's the taxed-price function, annotated:

```typescript
interface Product {
  name: string;
  price: number;
}

function priceWithTax(item: Product, rate: number): number {
  return item.price + item.price * rate;
}

const product = { name: "Notebook", cost: 12 };
console.log(priceWithTax(product, 0.2)); // Error flagged here
```

*What just happened:* `interface Product` declares the shape an item must have: a `name` string and a `price` number. The function signature takes a `Product` and a `number`, returning a `number`. Passing `{ name, cost }`, the checker compares it against `Product`, sees there's no `price` (and a stray `cost`), and reports the error **in your editor, before you run anything** - something like *"Property 'price' is missing in type."* The exact bug from the runnable demo above, caught at rest. Once satisfied, TypeScript strips the annotations and emits plain JavaScript.

⚠️ **Types are erased at compile time - they don't exist at runtime.** (The most common misconception about TypeScript.) TypeScript checks your code, then deletes every annotation and produces plain JavaScript. So a type *cannot* validate data that arrives while the program runs - a JSON response from a server, user input, a value from `localStorage`. TypeScript trusts you when you say "this API returns a `Product`"; if the server lies, nothing stops the bad data. For external data you still need real runtime checks (a validation library, or hand-written guards) - types catch mistakes *you* make in code, not the outside world.

## A gentler on-ramp: JSDoc types

Not ready for a build step and a `tsconfig.json`? Get most of the benefit in plain `.js` files, zero tooling beyond your editor, using **JSDoc** comments.

📝 **JSDoc** - a structured comment format (`/** ... */`) that describes a function's parameters and return type. Modern editors (anything running the TypeScript language service, including VS Code out of the box) *read* these comments and type-check against them - in regular JavaScript, no compiler in the pipeline.

```javascript
// @ts-check
/**
 * @param {{ name: string, price: number }} item
 * @param {number} rate
 * @returns {number}
 */
function priceWithTax(item, rate) {
  return item.price + item.price * rate;
}

const product = { name: "Notebook", cost: 12 };
priceWithTax(product, 0.2); // editor underlines this - wrong shape
```

*What just happened:* The `@param` and `@returns` tags spell out the same types as the TypeScript version, but live in a comment inside an ordinary `.js` file. The `// @ts-check` line at the top is the switch that turns the error underlines on - autocomplete on `item.` works without it, but the red squiggle for the wrong-shaped `product` needs `// @ts-check` per file (or `checkJs` set once in a `jsconfig.json`). The file still runs as plain JavaScript - both the comment and the tags are invisible to the runtime, so no build, new file extension, or deploy changes.

💡 **Why this matters.** JSDoc is low-commitment: *feel* what typing does before committing to a toolchain. Many large codebases run entirely on JSDoc-typed JavaScript. If a build step feels like a big leap, start here: add types to one tricky module and watch the bugs surface.

## Where to go

You already understand the JavaScript underneath, the hard part - TypeScript is just that language plus a checker, so the leap is short.

The standout next step: [TypeScript from Zero](/guides/typescript-from-zero), picking up exactly where this leaves off - interfaces and unions, generics, narrowing, how to type real-world data safely, and how to wire the compiler into a real project.

## Recap

1. **Dynamic typing** checks types only while the program runs - so typos and wrong-shaped arguments often produce a silent `undefined`/`NaN` instead of an error, and the damage surfaces far from the cause.
2. **Static typing** checks types *before* anything runs: bugs caught in the editor, autocomplete that knows your shapes, types as self-enforcing documentation, and refactors that flag every broken call site.
3. **TypeScript is a superset of JavaScript** - valid JS is valid TS. You add annotations, a checker verifies them, and it compiles down to plain JavaScript that runs everywhere JS does.
4. ⚠️ **Types are erased at compile time** - they don't exist at runtime, so they can't validate external/network data on their own; you still need runtime checks for data from outside your code.
5. **JSDoc** gives you much of the checking in plain `.js` files with no build step - a low-commitment way to try typing in your editor today.
6. The deep next step is [TypeScript from Zero](/guides/typescript-from-zero): you already know the JavaScript, so the jump is mostly learning the type layer.

## Quick check

Lock in the core ideas - when bugs get caught, what "superset" means, and the one thing types *can't* do:

```quiz
[
  {
    "q": "Why did `priceWithTax(product, 0.2)` return `NaN` instead of throwing an error, when `product` had a `cost` field but the function read `item.price`?",
    "choices": [
      "Reading a missing property returns `undefined`, and arithmetic on `undefined` produces `NaN` - JavaScript never flags the typo at all",
      "JavaScript threw an error, but it was silently swallowed by the function",
      "The `0.2` argument was the wrong type, so the multiplication failed",
      "`NaN` is JavaScript's way of warning you about a misspelled property name"
    ],
    "answer": 0,
    "explain": "In dynamic typing, reading a property that doesn't exist yields `undefined` with no error. `undefined + undefined * 0.2` is `NaN`, returned silently - the misspelled field is never caught. A type checker would have flagged `item.price` at edit-time."
  },
  {
    "q": "What does it mean that TypeScript is a 'superset' of JavaScript?",
    "choices": [
      "Every valid JavaScript program is also valid TypeScript; TS adds an optional type layer on top",
      "TypeScript replaces JavaScript with entirely new syntax you must learn from scratch",
      "TypeScript runs in the browser directly, without compiling to JavaScript",
      "TypeScript is a faster runtime that executes JavaScript more efficiently"
    ],
    "answer": 0,
    "explain": "A superset contains everything the base has, plus more. Valid JS is already valid TS, so you adopt it incrementally by adding annotations. The checker verifies them, then TS compiles down to plain JavaScript that runs anywhere JS runs."
  },
  {
    "q": "Why can't TypeScript types, on their own, validate a JSON response coming back from a server at runtime?",
    "choices": [
      "Types are erased at compile time, so they don't exist while the program runs - you still need real runtime checks for external data",
      "TypeScript can validate server data, but only if you pay for the enterprise tier",
      "Server responses are always strings, which TypeScript refuses to type",
      "Types validate runtime data automatically, so no extra checks are ever needed"
    ],
    "answer": 0,
    "explain": "TypeScript checks your code, then strips all annotations and emits plain JavaScript. Since types don't exist at runtime, they can't police data arriving from outside - a server, user input, storage. You add runtime validation (a library or hand-written guards) for that."
  }
]
```

---

[← Phase 16: Performance & Memory](16-performance-and-memory.md) · [Guide overview](_guide.md) · [Phase 18: Where to Go Next →](18-where-to-go-next.md)
