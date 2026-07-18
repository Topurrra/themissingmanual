---
title: "When Svelte Breaks"
guide: "svelte-from-zero"
phase: 7
summary: "Svelte's classic failures decoded: dead snapshots from destructuring, state_unsafe_mutation, effect loops, unkeyed each corruption, ownership warnings, and mixed-dialect confusion."
tags: [svelte, errors, debugging, state-unsafe-mutation, reactivity-loss]
difficulty: intermediate
synonyms: ["svelte state not updating", "state_unsafe_mutation svelte", "svelte effect infinite loop", "svelte ownership_invalid_mutation warning", "svelte 5 migration errors"]
updated: 2026-07-18
---

# When Svelte Breaks

Svelte's compiler catches at build time a lot of what other frameworks let you discover in
production - that's real. What's left over splits into two families: **silent staleness** (a
snapshot escaped the reactivity system - the same disease as everywhere, with Svelte-specific
carriers) and **loud guardrails** (runtime errors with underscored names that read as scary and
are actually the framework doing you a favor). This phase is the field guide to both.

## The cheat-card

| Symptom / message | Almost always means | Fix |
|---|---|---|
| UI ignores updates, console shows data changing | A dead snapshot: destructured `$state`, or state captured into a plain variable | Read through the object, or `$derived` a live view (phase 2) |
| **`state_unsafe_mutation`** | Writing state during rendering - often from inside a `$derived` or template expression | Derivations must be pure; move writes to handlers/effects |
| **Effect loop / `effect_update_depth_exceeded`** | An effect writes state it also reads | It's a derivation in disguise - use `$derived` (phase 6) |
| **`ownership_invalid_mutation`** warning | Child mutating a prop it doesn't own | Callback prop up, or make it `$bindable` (phase 4) |
| Rows show wrong state after delete/reorder | Unkeyed `{#each}` | `(item.id)` key expression (phase 3) |
| **`Cannot export state...reassigned`** at build | `export let x = $state(...)` in a module | Export an object you mutate, or accessor functions (phase 5) |
| `on:click` vs `onclick` behaving oddly together | Mixed dialects in one component | Pick one per component; runes components use `onclick` |
| Effect never re-fires on a value | Trigger only read inside async callback | Synchronous read at the top of the effect (phase 6) |
| `window is not defined` during `npm run build` | Browser API at SSR time (SvelteKit prerender) | `$effect`/`onMount` for browser-only code; `browser` guard from `$app/environment` |

## The silent one: dead snapshots

The disease you already met in phase 2, now with its common disguises in one place:

```js
let user = $state({ name: 'Ada', theme: 'dark' });

let { theme } = user;                    // disguise 1: destructuring
const settings = { ...user };            // disguise 2: spread copies
localStorage_theme = user.theme;         // disguise 3: parked in a plain variable
setInterval(() => console.log(theme), 1000);  // forever 'dark', whatever the user picks
```

All three copy a value *out* of the proxy at one instant; nothing re-runs that copy later. The
diagnostic question when the screen (or a callback) disagrees with your data: **"is this read
going through the `$state` object right now, or through a copy taken earlier?"** Fixes, in order:
read `user.theme` at the point of use; or declare `let theme = $derived(user.theme)` for a live
alias; or - for the interval case - read inside the callback, since the callback runs fresh each
tick even though tracking doesn't apply there.

Contrast worth naming: in the *markup*, this bug barely exists - `{user.theme}` compiles to a
tracked read. The dead-snapshot family lives almost entirely in `<script>` code and helper
functions.

## The loud one: state_unsafe_mutation

```html
<script>
  let items = $state([]);
  let renderCount = $state(0);

  let sorted = $derived.by(() => {
    renderCount++;                        // ✗ writing state inside a derivation
    return [...items].sort(byName);
  });
</script>
```

```text
Uncaught Svelte error: state_unsafe_mutation
Updating state inside `$derived(...)`, `$inspect(...)` or a template expression is forbidden
```

Why so strict: derivations and template expressions may run at any time, any number of times,
whenever the graph recalculates - a write inside one makes the answer depend on how often
questions get asked. Every framework has this rule ("rendering must be pure"); Svelte enforces it
with an error instead of letting the heisenbug ship. The fix is relocation: counters and logging
belong in handlers or effects; the derivation returns its value and touches nothing.

The sibling failure - an `$effect` that writes what it reads - manifests as the loop error, and
phase 6 already gave the verdict: that's a derivation wearing an effect's clothes.

## The migration one: two dialects in one file

Inherited codebases (again: including this site's) mix eras, and a few failure smells are pure
dialect confusion:

- `on:click` in a component that uses runes - works with a deprecation warning, but mixing
  `on:click={a}` and `onclick={b}` on one element invites ordering surprises. One dialect per
  component.
- `export let name` alongside `$props()` - the compiler rejects it; a component is either
  legacy-props or runes-props, never both.
- `$: total = ...` in a runes component - `$:` labels are inert once runes are in play; the "it
  just stopped recalculating" mystery after a partial migration is usually this.

The rule that prevents all of it: **migrate per component, completely.** The dialects interoperate
fine *across* component boundaries; they fight *within* one.

## Reading Svelte's errors

Two habits worth building:

- **The error names are documentation keys.** `state_unsafe_mutation`,
  `ownership_invalid_mutation`, `effect_update_depth_exceeded` - each has a page in the official
  docs explaining cause and fix. Ugly names, excellent lookup.
- **`$inspect` is the debugging rune:** `$inspect(cart)` logs the value now *and on every
  change*, with correct proxy unwrapping - where a stale `console.log` in an effect can itself
  fall into the snapshot traps this phase is about. It compiles away entirely in production
  builds, so it's safe to leave in during development.

## Recap

1. Silent staleness = a copy escaped the proxy: destructure, spread, or parked variable. Ask
   "does this read go through the object *now*?"
2. `state_unsafe_mutation` = a write inside pure territory (derivation/template). Relocate the
   write; keep derivations pure.
3. Effect loops are derivations in disguise; ownership warnings are the props contract enforced.
4. Mixed dialects fail in shapes all their own - migrate each component fully or not at all.
5. Error names are doc keys; `$inspect` beats `console.log` for watching state.

```quiz
[
  {
    "q": "Svelte throws state_unsafe_mutation pointing at a $derived that increments a counter while computing. Why does the framework forbid this outright?",
    "choices": [
      "Writes inside derivations are slow",
      "Derivations run whenever the graph recalculates, any number of times - a write inside makes program state depend on evaluation count",
      "Counters must always live in .svelte.js modules",
      "It's a deprecation: allowed in legacy mode, removed in runes"
    ],
    "answer": 1,
    "why": [
      "Performance isn't the issue - determinism is.",
      null,
      "Where the counter lives doesn't matter; when it's written does.",
      "Legacy $: had the same purity expectations - runes just enforce them with an error."
    ],
    "explain": "A derivation is a pure answer to 'what is this value?' If computing the answer changes other state, the app's behavior depends on how often Svelte happens to recompute - so it's an error, not a footgun."
  },
  {
    "q": "A migrated component keeps a leftover $: fullName = first + ' ' + last, and fullName silently stops updating. What happened?",
    "choices": [
      "String concatenation isn't reactive in Svelte 5",
      "Once a component uses runes, $: labels lose their reactive meaning - the line runs once and never again",
      "first and last needed to be exported",
      "The compiler removed the line as dead code"
    ],
    "answer": 1,
    "why": [
      "Concatenation is fine - inside $derived.",
      null,
      "Exports relate to module state, not local derivations.",
      "The line survives and runs - once, as plain JavaScript, which is the trap."
    ],
    "explain": "Dialects don't mix within a component: in runes mode, $: is just a JavaScript label. Finish the migration - let fullName = $derived(...) - or leave the whole component legacy."
  },
  {
    "q": "Per this phase, when your UI shows stale data but the console proves the state object is correct, what's the first question to ask?",
    "choices": [
      "Is the component missing a key prop?",
      "Is the failing read going through the $state object right now, or through a copy captured earlier?",
      "Should this component be migrated to runes?",
      "Is the effect depth limit being hit?"
    ],
    "answer": 1,
    "why": [
      "Keys matter inside each blocks - but data-right-screen-wrong is the snapshot signature first.",
      null,
      "Dialect issues have their own smells (dead $: lines); this one is about copies.",
      "Depth errors are loud - silence points at a dead snapshot."
    ],
    "explain": "Correct state + stale display means some read isn't going through the proxy anymore. Hunt the destructure, spread, or parked variable on the path between state and screen."
  }
]
```

---

[← Phase 6: Effects, Lifecycle, and Fetching](06-effects-lifecycle-fetching.md) · [Guide overview](_guide.md) · [Phase 8: Where to Go Next →](08-where-to-go-next.md)
