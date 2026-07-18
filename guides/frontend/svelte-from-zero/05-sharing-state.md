---
title: "Sharing State"
guide: "svelte-from-zero"
phase: 5
summary: "Lift state to the common parent first; share app-wide state as $state in a .svelte.js module - with the export gotcha that comes with it - and use context for per-tree instances."
tags: [svelte, shared-state, svelte-js-modules, context, stores]
difficulty: intermediate
synonyms: ["svelte share state between components", "svelte.js file shared state", "svelte context api", "svelte 5 stores vs runes", "global state svelte"]
updated: 2026-07-18
---

# Sharing State

Two components need the same data: the search box and the results list, the cart icon and the cart
page. Svelte's answers are ranked like every framework's - keep it local, lift it, then reach for
the shared mechanisms - but the shared tier has a distinctly Svelte flavor: **state lives in
compiled modules**, not in a bolted-on store library. That's a genuine convenience with one sharp
edge, and this phase covers both.

## First resort: lift it

```html
<!-- SearchPage.svelte -->
<script>
  import SearchBox from '$lib/SearchBox.svelte';
  import ResultsList from '$lib/ResultsList.svelte';

  let query = $state('');
</script>

<SearchBox bind:value={query} />
<ResultsList {query} />
```

*What just happened:* the state lives in the closest common parent; one child binds it (a
`$bindable` input component, phase 4), the other reads it as a prop. One source of truth, and the
two can never disagree. (`{query}` is shorthand for `query={query}` - you'll see it everywhere.)
When two components with *separate copies* of "the same" state drift apart, this is the refactor:
move it up, pass it down, delete the copies.

## The Svelte move: state in a .svelte.js module

For state whose readers are scattered across the app - the cart, the session, preferences -
phase 2's compiled-module trick becomes the architecture:

```js
// src/lib/cart.svelte.js
export const cart = $state({ items: [] });

export function addItem(product, qty = 1) {
  const line = cart.items.find(i => i.product.id === product.id);
  if (line) line.qty += qty;
  else cart.items.push({ product, qty });
}

export function itemCount() {
  return cart.items.reduce((n, i) => n + i.qty, 0);
}
```

```html
<!-- any component, anywhere -->
<script>
  import { cart, addItem, itemCount } from '$lib/cart.svelte.js';
</script>

<span>Cart ({itemCount()})</span>
```

*What just happened:* a plain module exports a `$state` object and the functions that mutate it.
Every importer sees the same object; a mutation from the product page updates the header's badge,
because the badge's markup reads through the same proxy. State plus its update logic in one
importable file - most of what a store library exists for, in vanilla Svelte. (If you've read the
Vue guide: this is a Pinia store's shape, without Pinia.)

⚠️ **Gotcha - the export rule.** Notice the module exports an *object* and mutates its
properties. Export a reassignable primitive instead and you hit a wall:

```js
// counter.svelte.js
export let count = $state(0);        // compile error: cannot export reassigned state
export function increment() { count++; }
```

Why the compiler refuses: importers of a rebound `let` would capture a stale binding - the exact
dead-snapshot problem from phase 2, at module scale - so Svelte makes it a build error instead of
a silent bug. Two clean shapes exist: **wrap in an object and mutate properties**
(`export const counter = $state({ value: 0 })`), or **keep state private and export accessor
functions**. Either way, reads go through something the proxy can intercept.

## Context: per-tree state without prop threading

Module state is app-global - one cart for everyone. Sometimes you want one instance *per subtree*:
this form's state shared by its field components, this accordion group's open-item tracker. That's
the context API:

```html
<!-- Accordion.svelte -->
<script>
  import { setContext } from 'svelte';

  const state = $state({ openId: null });
  setContext('accordion', state);
</script>

{@render children()}
```

```html
<!-- AccordionItem.svelte, any depth below -->
<script>
  import { getContext } from 'svelte';

  let { id, children } = $props();
  const accordion = getContext('accordion');
</script>

<button onclick={() => accordion.openId = accordion.openId === id ? null : id}>
  {@render children()}
</button>
```

*What just happened:* the parent placed a reactive object into context; descendants at any depth
retrieved *the same object* - no prop threading through layers that don't care. Two accordions on
one page each provide their own context, so their states don't collide - the thing module state
can't do. Rules worth knowing: `setContext`/`getContext` run during component setup only (not in
handlers or effects), and lookups walk *up* the tree - siblings can't see each other's context.

## What about stores?

Pre-runes Svelte shared state through **stores** - `writable(0)`, subscribed with a `$store`
prefix in markup. They still work, they're all over existing codebases (including this site's),
and a few niches still want them (interop with libraries built on the store contract). But for new
code, module `$state` plus context covers the territory with fewer concepts. Translation for
reading legacy: `writable(x)` ≈ module `$state`, `$storeName` in markup ≈ reading the state
object, `derived(...)` ≈ `$derived`.

## Choosing, in one table

| Situation | Reach for |
|---|---|
| One component cares | `$state` right there |
| Siblings need it | Lift to the common parent |
| A widget tree needs its own instance | Context |
| The whole app shares one instance | `.svelte.js` module state |
| Legacy code / store-based libraries | Stores - read fluently, write runes |

## Recap

1. Lift first: closest common parent, props/bindings down. Two copies of one truth always drift.
2. `.svelte.js` modules hold app-wide state as `$state` + mutation functions - store-library
   ergonomics, zero dependencies.
3. Never export reassignable state - export an object you mutate, or accessor functions; the
   compiler enforces it.
4. Context = per-subtree instances, set during component setup, visible only downward.
5. Stores are the legacy tier: recognize `writable`/`$store` on sight, prefer runes for new code.

```quiz
[
  {
    "q": "export let count = $state(0) in a .svelte.js module fails to compile. What's the compiler protecting you from?",
    "choices": [
      "Primitives can't be reactive in modules - only objects can",
      "Importers would capture a stale binding when count is reassigned - the dead-snapshot bug, promoted to module scale",
      "Module state must be read-only by design",
      "$state is not allowed in .svelte.js files"
    ],
    "answer": 1,
    "why": [
      "A primitive is fine as long as nothing reassigns the exported binding - the object wrapper exists to give mutations an interceptable home.",
      null,
      "Module state is meant to be mutated - through object properties or exported functions.",
      ".svelte.js files exist precisely to host runes."
    ],
    "explain": "Reassigning an exported let would leave importers holding yesterday's value with no proxy in the path. The build error replaces what would otherwise be phase 2's silent disconnection."
  },
  {
    "q": "Two independent Wizard components on one page each need their own shared step-state for their child panels. Module state or context?",
    "choices": [
      "Module state - it's the modern Svelte way to share",
      "Context - each Wizard provides its own instance to its own subtree",
      "Either works identically",
      "Neither - the panels should use $bindable props"
    ],
    "answer": 1,
    "why": [
      "One module = one instance app-wide: both wizards would fight over the same step counter.",
      null,
      "They differ exactly here - global singleton versus per-tree instance.",
      "Bindable props work for direct parent-child pairs, but threading through every panel layer is the problem context removes."
    ],
    "explain": "Module state is a singleton; context is scoped to the providing component's subtree. Multiple instances of a widget each needing private shared state is the context case."
  }
]
```

---

[← Phase 4: Components: Props, Callbacks, and Snippets](04-components-props-snippets.md) · [Guide overview](_guide.md) · [Phase 6: Effects, Lifecycle, and Fetching →](06-effects-lifecycle-fetching.md)
