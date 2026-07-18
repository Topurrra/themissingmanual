---
title: "Template Logic"
guide: "svelte-from-zero"
phase: 3
summary: "Svelte templates branch with {#if}, repeat with {#each} plus a key expression, unwrap promises with {#await}, and bind form inputs both ways with bind:value."
tags: [svelte, templates, each, if, await, bind]
difficulty: beginner
synonyms: ["svelte each block key", "svelte if else template", "svelte await block", "svelte bind value", "svelte template syntax"]
updated: 2026-07-18
---

# Template Logic

Svelte markup is HTML plus a small set of block tags - `{#if}`, `{#each}`, `{#await}` - and the
`bind:` directive. Where React uses JavaScript expressions (`map`, ternaries) and Vue uses
attributes (`v-if`, `v-for`), Svelte gives control flow its own syntax, opened with `{#...}` and
closed with `{/...}`. Five minutes of syntax, then the gotchas that actually matter.

## Branching: {#if}

```html
<script>
  let cart = $state([]);
</script>

{#if cart.length === 0}
  <p>Your cart is empty.</p>
{:else if cart.length < 10}
  <p>{cart.length} items.</p>
{:else}
  <p>Bulk order!</p>
{/if}
```

A false branch **unmounts** its contents - DOM removed, component state inside destroyed, same
semantics as conditional rendering everywhere. There's no built-in "hide with CSS instead"
directive (Vue's `v-show`); when you need state to survive a frequent toggle, keep the element and
toggle a class: `<div class:hidden={!open}>` (that `class:` shorthand toggles a class by boolean -
you'll use it constantly).

## Repeating: {#each} and the key

```html
<script>
  let todos = $state([
    { id: 1, text: 'Learn each blocks' },
    { id: 2, text: 'Remember the key' },
  ]);
</script>

<ul>
  {#each todos as todo (todo.id)}
    <li>{todo.text}</li>
  {:else}
    <li>Nothing to do. Suspicious.</li>
  {/each}
</ul>
```

*What just happened:* one `<li>` per item, with two pieces of syntax worth naming. The
parenthesized `(todo.id)` is the **key expression** - the same identity contract as every
framework: it's how Svelte matches old items to new ones when the array changes, so a reorder
*moves* DOM instead of rewriting every row. And `{:else}` inside an each block renders when the
array is empty - the empty-state pattern built into the syntax.

⚠️ **Gotcha:** the key is *syntactically optional*, and that's a trap: without it, Svelte updates
each-block rows **by position**. Delete the first todo and every row's DOM shifts contents up one -
fine for pure text, state-corrupting the moment rows hold inputs, checkboxes, or component state
(the typed text stays in row one while the labels shift). If the list can ever reorder, insert, or
delete: key it with a stable id. `(index)` as the key is the same bug with extra steps.

## Promises in markup: {#await}

The block with no direct equivalent in React or Vue:

```html
<script>
  let productPromise = $state(fetchProduct(42));
</script>

{#await productPromise}
  <p>Loading…</p>
{:then product}
  <h2>{product.name}</h2>
{:catch error}
  <p>Couldn't load: {error.message}</p>
{/await}
```

*What just happened:* the three states of a promise - pending, resolved, rejected - each get a
branch, right in the markup. No loading flag, no error state variable, no effect: hand the block a
promise and it renders the appropriate branch as the promise settles. Refetching is reassigning:
`productPromise = fetchProduct(newId)` swaps in a new promise and the block starts over at
pending. (For fetch-on-navigation, SvelteKit's load functions - phase 8 - are the fuller answer;
`{#await}` covers the in-component cases.)

## Two-way forms: bind:

```html
<script>
  let email = $state('');
  let agreed = $state(false);
  let plan = $state('free');
</script>

<input type="email" bind:value={email} placeholder="you@example.com" />
<label><input type="checkbox" bind:checked={agreed} /> I agree</label>
<select bind:value={plan}>
  <option value="free">Free</option>
  <option value="pro">Pro</option>
</select>

<p>Signing up {email || '…'} for the {plan} plan.</p>
<button disabled={!agreed || !email.includes('@')}>Sign up</button>
```

*What just happened:* `bind:value` wires the input to the state variable in both directions -
value in, keystrokes back. Checkboxes bind `checked`, selects bind `value`, and
`<input type="number">` binds through `bind:value` with the string-to-number coercion handled.
Validation is then just expressions over state, as the disabled button shows.

`bind:` reaches beyond forms, worth knowing exists: `bind:this={el}` gives you the DOM element
itself (Svelte's ref mechanism, for focus management or third-party libraries), and read-only
bindings like `bind:clientWidth` observe layout without a ResizeObserver in sight.

Events, for completeness, are plain attributes in the runes dialect: `onclick={handler}`,
`onsubmit={save}`. One habit transfers from every framework: pass the function. To preventDefault,
wrap it - `onsubmit={e => { e.preventDefault(); save(); }}` (the old dialect's `|preventDefault`
modifier is gone).

## Recap

1. `{#if}` unmounts on false; for state-preserving toggles use `class:` and CSS.
2. `{#each list as item (item.id)}` - the key is optional syntax but mandatory practice for any
   list that changes shape; `{:else}` handles empty.
3. `{#await}` renders a promise's three states declaratively; reassign the promise to restart.
4. `bind:value` / `bind:checked` are two-way form wiring; `bind:this` is the element ref.
5. Events are attributes (`onclick`); no modifiers - call `preventDefault` yourself.

```quiz
[
  {
    "q": "A todo list's rows contain checkboxes. Deleting the first todo makes the wrong rows show as checked. The each block has no key expression. What happened?",
    "choices": [
      "The delete handler mutated the array, which Svelte doesn't track",
      "Without a key, rows update by position - the DOM (and its checkbox state) stayed put while item contents shifted up",
      "Checkbox state needs bind:checked to survive deletions",
      "The {:else} branch interfered with row matching"
    ],
    "answer": 1,
    "why": [
      "Mutation is fine in Svelte - $state proxies track push/splice; the update happened, just positionally.",
      null,
      "bind:checked wires state to a row - but without keys, the row itself is reassigned to a different item.",
      "{:else} only renders when the list is empty; it plays no role in matching."
    ],
    "explain": "Unkeyed each blocks match old and new items by index. Row DOM gets reused for whatever item now sits at that index - add (todo.id) so identity follows the item."
  },
  {
    "q": "What does the {#await} block replace from the classic client-side fetch pattern?",
    "choices": [
      "The fetch call itself",
      "The loading flag, error state, and the conditional rendering between them",
      "The need for async functions",
      "Request cancellation"
    ],
    "answer": 1,
    "why": [
      "You still create the promise - the block consumes it.",
      null,
      "Async code is still async - the block just renders its states.",
      "Cancellation still needs your own handling (or a data layer) - the block renders whatever promise it's given."
    ],
    "explain": "Pending, resolved, and rejected each get a markup branch, so the three state variables and their if/else chain disappear. The promise is the state."
  }
]
```

---

[← Phase 2: Runes: State That Compiles](02-runes-state-that-compiles.md) · [Guide overview](_guide.md) · [Phase 4: Components: Props, Callbacks, and Snippets →](04-components-props-snippets.md)
