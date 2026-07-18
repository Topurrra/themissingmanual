---
title: "Effects, Lifecycle, and Fetching"
guide: "svelte-from-zero"
phase: 6
summary: "$effect runs side effects when the state it reads changes and cleans up via its return function - used for the outside world only, never for deriving state; onMount still marks DOM arrival."
tags: [svelte, effect, onmount, lifecycle, fetching, cleanup]
difficulty: intermediate
synonyms: ["svelte effect rune explained", "svelte 5 effect vs onmount", "svelte effect cleanup", "svelte fetch data on mount", "svelte effect infinite loop"]
updated: 2026-07-18
---

# Effects, Lifecycle, and Fetching

Everything so far - state, derivations, templates - lives inside Svelte's world, where the
compiler wires changes to updates. But apps have to talk to the world outside: timers, network,
`localStorage`, chart libraries, the document title. `$effect` is that bridge, and it comes with
the same warning label as its cousins in React and Vue: **the moment you use an effect to manage
your own state instead of the outside world, you've built a bug.** This phase draws the line
precisely.

## $effect: the shape

```html
<script>
  let query = $state('');

  $effect(() => {
    document.title = query ? `Results for "${query}"` : 'Search';
  });
</script>
```

*What just happened:* the effect ran after the component mounted, and re-runs whenever `query`
changes. Which state it depends on is discovered the Svelte way - **by what the function actually
reads** - no dependency array to maintain, same auto-tracking as `$derived`, applied to actions
instead of values.

Cleanup is the return value:

```html
<script>
  let seconds = $state(0);

  $effect(() => {
    const id = setInterval(() => seconds++, 1000);
    return () => clearInterval(id);      // runs before re-run, and at unmount
  });
</script>
```

The returned function runs before the effect re-runs, and when the component unmounts - one
mechanism, both moments. Whatever an effect starts, its cleanup stops: intervals, listeners,
subscriptions, observers. An effect with a start and no stop is a leak with a delay on it.

## The rule: effects face outward

The most common misuse, in every framework, is the same:

```html
<script>
  let items = $state([]);

  // ✗ deriving state with an effect - and Svelte will throw at you
  let total = $state(0);
  $effect(() => {
    total = items.reduce((s, i) => s + i.price, 0);
  });

  // ✓ deriving state with a derivation
  let total = $derived(items.reduce((s, i) => s + i.price, 0));
</script>
```

Svelte is unusually opinionated here: writing to state that the same effect also (transitively)
depends on raises `state_unsafe_mutation` errors or effect-loop warnings, and even when it runs,
you've created a second source of truth that updates a beat late. The line to internalize:

💡 **Key point:** `$derived` answers "what *is* this value?" - `$effect` answers "what should
*happen* when this changes?" If the sentence ends in a value, derive. If it ends in an action on
the outside world (the DOM directly, a timer, the network, storage, a library), effect. Svelte's
docs say it plainly: if you're synchronizing state inside an effect, you almost always want
`$derived` instead.

## onMount and DOM-dependent setup

`$effect` doesn't run during server-side rendering (there's no browser to affect), and it first
runs after the component is in the DOM - so for most "when the component appears" work, `$effect`
*is* the mount hook. The older `onMount` import still exists and still matters in one common case:
it can be `async` (an effect's function can't be, since its return value must be the cleanup):

```html
<script>
  import { onMount } from 'svelte';

  let orders = $state(null);
  let error = $state(null);

  onMount(async () => {
    try {
      const res = await fetch('/api/orders');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      orders = await res.json();
    } catch (e) {
      error = e;
    }
  });
</script>

{#if error}<p>Couldn't load orders.</p>
{:else if !orders}<p>Loading…</p>
{:else}<ul>{#each orders as o (o.id)}<li>{o.ref}</li>{/each}</ul>{/if}
```

(Or skip the flags entirely: assign the promise to state and let phase 3's `{#await}` render the
three states. Both are idiomatic; `{#await}` is less code, explicit flags give you more control
over layout.)

## Refetch-on-change, with the race handled

Fetching *again* when a value changes is effect territory - an outside-world action triggered by
state. The out-of-order response race comes along, and cleanup is the fix:

```html
<script>
  let selectedId = $state(1);
  let product = $state(null);

  $effect(() => {
    const id = selectedId;               // read it: this effect now tracks selectedId
    let cancelled = false;

    fetch(`/api/products/${id}`)
      .then(r => r.json())
      .then(data => { if (!cancelled) product = data; });

    return () => { cancelled = true; };  // stale responses get ignored
  });
</script>
```

*What just happened:* switching `selectedId` from 1 to 2 runs the cleanup (cancelling 1's
in-flight interest) before re-running the effect for 2 - so if 1's response arrives late, it finds
`cancelled` true and touches nothing. Same pattern as React's effect flag and Vue's `onCleanup`,
wearing Svelte's return-function syntax.

⚠️ **Gotcha:** auto-tracking only registers what the effect reads **synchronously**. Reads inside
`.then` callbacks, `await` continuations, or `setTimeout` happen after tracking closed - they
don't subscribe the effect to anything. The `const id = selectedId` line isn't decoration: it's
the synchronous read that puts `selectedId` on the effect's dependency list. Read your triggers at
the top, then go async.

## Recap

1. `$effect` = auto-tracked side effects; dependencies are what it reads synchronously; the
   returned function is cleanup (pre-re-run and unmount).
2. Effects face outward - deriving state in an effect earns you `state_unsafe_mutation` and a
   stale copy. Values are `$derived`'s job.
3. `$effect` already covers "on mount" for browser work; `onMount` remains the async-friendly
   spelling for load-once fetches ({#await} being the low-ceremony alternative).
4. Refetch effects: read triggers at the top, cancel via cleanup, ignore stale responses.
5. Every start needs a stop - intervals and listeners without cleanup outlive their component.

```quiz
[
  {
    "q": "An effect fetches a product and reads selectedId only inside the .then callback. Changing selectedId doesn't refetch. Why?",
    "choices": [
      "Effects only run once unless given a dependency array",
      "Dependencies are tracked from synchronous reads - a read inside .then happens after tracking has closed, so the effect never subscribed to selectedId",
      "fetch calls can't be tracked by the compiler",
      "The effect needs to be marked async"
    ],
    "answer": 1,
    "why": [
      "Svelte effects have no dependency arrays - tracking is automatic, but only over synchronous reads.",
      null,
      "The fetch itself is irrelevant to tracking - what matters is when state is read.",
      "Effect functions can't be async at all (the return value must be the cleanup) - and that wouldn't fix the tracking window."
    ],
    "explain": "Auto-tracking records reads made while the effect body runs synchronously. Read your trigger at the top (const id = selectedId), then use it in async code freely."
  },
  {
    "q": "let total = $state(0) kept in sync by an $effect that reads items and writes total. Svelte complains, and the docs agree. What's the right shape?",
    "choices": [
      "Move the write into a setTimeout so it runs outside tracking",
      "let total = $derived(items.reduce(...)) - it's a value, not an action",
      "Split it into two effects, one reading and one writing",
      "Mark total as $bindable"
    ],
    "answer": 1,
    "why": [
      "Deferring the write dodges the error and keeps the stale-copy design - worse, not better.",
      null,
      "However you slice the effects, state-syncing-state remains a second source of truth.",
      "$bindable is a component-prop contract - unrelated to derivation."
    ],
    "explain": "The question 'what is total?' has an answer expressible from existing state - that's a derivation. Effects are for actions on the world outside Svelte's state graph."
  },
  {
    "q": "A component's effect starts a WebSocket connection. What must the effect also do?",
    "choices": [
      "Nothing - Svelte closes connections when components unmount",
      "Return a cleanup function that closes the socket",
      "Wrap the connection in onMount instead",
      "Store the socket in $state so it's tracked"
    ],
    "answer": 1,
    "why": [
      "Svelte tears down its own wiring - browser resources you open are yours to close.",
      null,
      "onMount changes when it starts, not who stops it - a cleanup is needed there too.",
      "Tracking a socket object does nothing; sockets aren't state, they're resources."
    ],
    "explain": "Effects that acquire resources return the release: the cleanup runs on re-run and unmount, so the socket's lifetime matches the component's."
  }
]
```

---

[← Phase 5: Sharing State](05-sharing-state.md) · [Guide overview](_guide.md) · [Phase 7: When Svelte Breaks →](07-when-it-breaks.md)
