---
title: "Runes: State That Compiles"
guide: "svelte-from-zero"
phase: 2
summary: "$state declares reactive variables you mutate like normal JavaScript, $derived computes values that follow automatically - runes are compiler instructions, and that's why they only work where the compiler can see them."
tags: [svelte, runes, state, derived, reactivity]
difficulty: beginner
synonyms: ["svelte state rune", "svelte derived rune", "svelte 5 runes vs svelte 4", "svelte reactivity explained", "svelte dollar state"]
updated: 2026-07-18
---

# Runes: State That Compiles

Phase 1 said Svelte's trade-off out loud: for the compiler to precompute updates, it has to *see*
which variables are reactive. Runes are how you tell it. They look like function calls -
`$state()`, `$derived()` - but they're not functions you could import or reimplement: they're
**keywords for the compiler**, markers in the source that change what code gets generated.

## $state: a variable the compiler watches

```html
<script>
  let count = $state(0);

  function add() {
    count++;                    // plain mutation - the compiled code updates the DOM
  }
</script>

<button onclick={add}>Clicked {count} times</button>
```

*What just happened:* `$state(0)` declares `count` as reactive. From then on you use it like any
variable - read it bare, mutate it with `++` or `=`. The compiler saw the declaration, saw the
usage in the markup, and generated the update wiring. No setter function, no `.value`, no
container object in your way.

Objects and arrays go deeper:

```html
<script>
  let todos = $state([
    { text: 'Learn runes', done: true },
    { text: 'Ship something', done: false },
  ]);

  function addTodo(text) {
    todos.push({ text, done: false });      // push works. Mutation works.
  }
  function toggle(todo) {
    todo.done = !todo.done;                 // nested mutation works too
  }
</script>
```

📝 **Terminology:** `$state` on an object or array wraps it in a **deeply reactive proxy** - every
nested read and write is observed (the same proxy machinery Vue uses, if you've read that guide,
here in service of the compiler's wiring). That's why `push` and nested assignment update the
screen - no copy-and-replace choreography needed.

## $derived: values that follow

```html
<script>
  let todos = $state([...]);

  let remaining = $derived(todos.filter(t => !t.done).length);
  let allDone = $derived(remaining === 0);
</script>

<p>{remaining} left {allDone ? '- take a break!' : ''}</p>
```

*What just happened:* `$derived` declares a value computed *from* other reactive state. When
`todos` changes, `remaining` follows; when `remaining` changes, `allDone` follows - a chain the
compiler wires up. Derived values are read-only (assigning to one is a compile error), cached, and
recomputed only when a dependency actually changed.

For derivations too big for one expression, `$derived.by(() => { ... })` takes a function. The
discipline is the same one every framework preaches: **if a value can be computed from other
state, derive it - don't store a second copy and try to keep it in sync.**

💡 **Key point:** notice what you're *not* managing: no dependency arrays, no subscription calls,
no memoization decisions. You declare which variables are state and which are derivations; the
compiler derives the graph from your actual reads. The runtime cost of getting this wrong is
mostly replaced by compile errors - a fair summary of Svelte's whole personality.

## Why runes have rules

Because runes are compiler markers, they only exist where the Svelte compiler runs:

- **`.svelte` files** - components.
- **`.svelte.js` / `.svelte.ts` files** - plain modules *opted in* to compilation, the home of
  shared state (phase 5).

Write `$state` in a regular `.js` file and you get an error, not a quiet failure - the compiler
never ran there, so the rune is just an undefined identifier. Same reason you can't do
`const s = $state; s(0)` or pass runes around: they're syntax, not values.

⚠️ **Gotcha:** the classic reactivity leak in Svelte 5 is **destructuring state**:

```js
let user = $state({ name: 'Ada', plan: 'pro' });

let { name } = user;      // ✗ copies the current string OUT of the proxy - dead
name = 'Grace';           // updates nothing

user.name = 'Grace';      // ✓ mutate through the object
let name2 = $derived(user.name);  // ✓ or derive a live view
```

Destructuring copies the value at that instant; the copy has no connection to the proxy, and
nothing re-runs the destructuring later. Reads in markup (`{user.name}`) are safe - the compiled
code re-reads through the proxy. The rule: **access state through its object, or derive; never
park a snapshot in a plain variable and expect it to stay live.**

## Reading the old dialect

You'll meet pre-rune Svelte constantly (including, at the time of writing, parts of this site's
own codebase). The translation table:

| Legacy (Svelte 3/4) | Runes (Svelte 5) | Notes |
|---|---|---|
| `let count = 0;` | `let count = $state(0);` | top-level `let` was implicitly reactive |
| `$: doubled = count * 2;` | `let doubled = $derived(count * 2);` | `$:` labels were the derive/effect syntax |
| `$: console.log(count);` | `$effect(() => console.log(count));` | the side-effect use of `$:` (phase 6) |
| `export let name;` | `let { name } = $props();` | props (phase 4) |
| `on:click={fn}` | `onclick={fn}` | events became plain attributes |

The old dialect still compiles (Svelte 5 supports it per-component), so nothing you inherit is
broken - it's one more dialect to read, like Vue's Options API.

## Recap

1. `$state` declares reactive variables; use them like normal JavaScript - mutation included.
   Objects/arrays become deeply reactive proxies.
2. `$derived` declares computed values; chains resolve automatically; derive instead of storing
   copies.
3. Runes are compiler syntax: they work only in `.svelte` / `.svelte.js` files and can't be
   aliased or passed around.
4. Destructuring state parks a dead snapshot in a variable - go through the object, or `$derived`
   a live view.
5. Legacy dialect: `let` was state, `$:` was derived/effect, `export let` was props - read it
   fluently, write runes.

```quiz
[
  {
    "q": "Why does $state work in App.svelte and cart.svelte.js, but throw an error in utils.js?",
    "choices": [
      "utils.js is missing an import of $state from 'svelte'",
      "Runes are compiler syntax, and the compiler only processes .svelte and .svelte.js files",
      "State is only allowed inside components for architectural reasons",
      "The file needs to be renamed to utils.ts"
    ],
    "answer": 1,
    "why": [
      "There's nothing to import - runes aren't values; that's exactly what makes them file-bound.",
      null,
      ".svelte.js modules hold state outside components on purpose - the rule is about compilation, not architecture.",
      "TypeScript vs JavaScript is irrelevant - .svelte.ts works, .ts doesn't."
    ],
    "explain": "A rune is an instruction to the compiler, not a function. In files the compiler never touches, $state is just an undefined name - hence the loud error."
  },
  {
    "q": "let { name } = $state-proxied user, and later name = 'Grace' changes nothing on screen. What's the mechanism?",
    "choices": [
      "Strings are immutable in JavaScript, so the assignment fails",
      "Destructuring copied the value out of the proxy at that moment - the local variable has no connection to the tracked object",
      "The compiler only tracks variables declared with $state directly",
      "name collided with a reserved template variable"
    ],
    "answer": 1,
    "why": [
      "The assignment succeeds - to a local variable that nothing observes.",
      null,
      "Close, but the real distinction is the copy: reads through user.name stay live even in helper code the compiler processed.",
      "No such reserved names exist."
    ],
    "explain": "The proxy observes access through itself. A destructured primitive is a snapshot with no link back - mutate user.name, or declare a $derived for a live read."
  },
  {
    "q": "In legacy Svelte code you see $: total = price * qty. What is the runes translation?",
    "choices": [
      "let total = $state(price * qty)",
      "let total = $derived(price * qty)",
      "$effect(() => total = price * qty)",
      "let total = price * qty"
    ],
    "answer": 1,
    "why": [
      "$state would snapshot the product once - it wouldn't follow price or qty afterward.",
      null,
      "An effect assigning state recreates the derived behavior manually - and phase 6 explains why that pattern should be avoided (and Svelte will warn).",
      "A plain let computes once at init and never again."
    ],
    "explain": "$: with a pure computation was the old derived syntax. $derived is its direct successor: recomputed when dependencies change, cached, read-only."
  }
]
```

---

[← Phase 1: What Svelte Actually Is](01-what-svelte-actually-is.md) · [Guide overview](_guide.md) · [Phase 3: Template Logic →](03-template-logic.md)
