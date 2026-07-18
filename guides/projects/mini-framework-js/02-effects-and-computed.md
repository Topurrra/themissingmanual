---
title: "Effects and Computed"
guide: "mini-framework-js"
phase: 2
summary: "Automate dependency tracking with one global variable: while an effect runs, every property it reads subscribes it - the trick behind Vue's templates, Svelte's effects, and Angular's signals."
tags: [javascript, effects, dependency-tracking, computed, reactivity]
difficulty: intermediate
synonyms: ["how automatic dependency tracking works", "activeeffect pattern explained", "build computed values javascript", "reactive effect implementation"]
updated: 2026-07-18
---

# Effects and Computed

Phase 1 left one thing manual: `subscribe(cart, 'items', fn)` - you had to *say* which properties
a function cares about. Real frameworks never ask. A Vue template, a Svelte `$effect`, an Angular
`computed` - they all figure out their own dependencies. The mechanism behind all of them fits in
one sentence, and it's the best trick in frontend engineering:

💡 **Key point:** keep a global variable pointing at *the function currently running*. While it
runs, every reactive property it reads sees that global in the `get` trap - and subscribes it.
Reading **is** subscribing.

## effect(): the trick, implemented

```js runnable
// --- the machinery from phase 1, plus the one new variable ---
const ledger = new WeakMap();
let activeEffect = null;                       // ← the whole trick

function track(target, key) {
  if (!activeEffect) return;                   // nobody's running? nothing to file.
  let keyMap = ledger.get(target);
  if (!keyMap) ledger.set(target, (keyMap = new Map()));
  let subs = keyMap.get(key);
  if (!subs) keyMap.set(key, (subs = new Set()));
  subs.add(activeEffect);
}

function notify(target, key) {
  const subs = ledger.get(target)?.get(key);
  if (subs) for (const fn of [...subs]) fn();
}

function reactive(obj) {
  return new Proxy(obj, {
    get(target, key) {
      track(target, key);                      // reads file the current effect
      return target[key];
    },
    set(target, key, value) {
      if (target[key] === value) return true;
      target[key] = value;
      notify(target, key);
      return true;
    },
  });
}

function effect(fn) {
  activeEffect = fn;                           // announce "I'm running"
  fn();                                        // reads inside subscribe fn automatically
  activeEffect = null;                         // stop announcing
}

// --- watch it work ---
const user = reactive({ first: 'Ada', last: 'Lovelace', visits: 0 });

effect(() => {
  console.log(`Hello, ${user.first} ${user.last}!`);   // reads first + last → subscribes to both
});

user.first = 'Grace';    // effect re-runs
user.last = 'Hopper';    // effect re-runs
user.visits = 41;        // effect does NOT re-run - it never read visits
```

*What just happened:* the effect ran once, and its two reads (`first`, `last`) filed it in the
ledger *because `activeEffect` was set while they happened*. Writing either re-runs it; writing
`visits` doesn't, because the effect never read it - **precision without declaration**. No
dependency array, no subscribe calls: the reads are the truth about what the function needs, so
the reads are what's tracked.

If you've read the frontend guides, name what you just built: Vue's template tracking works this
way (reads through the proxy register the template), Svelte's `$effect` auto-tracking works this
way, Angular's signal graph works this way. Different syntax, same `activeEffect` at the center.

## Your turn: the stale-subscription hunt

One subtlety separates your effect from production ones. Predict first, then run:

```js runnable
// (compact copy of the machinery)
const ledger = new WeakMap(); let activeEffect = null;
function track(t, k) { if (!activeEffect) return; let m = ledger.get(t); if (!m) ledger.set(t, m = new Map()); let s = m.get(k); if (!s) m.set(k, s = new Set()); s.add(activeEffect); }
function notify(t, k) { const s = ledger.get(t)?.get(k); if (s) for (const f of [...s]) f(); }
function reactive(o) { return new Proxy(o, { get(t, k) { track(t, k); return t[k]; }, set(t, k, v) { if (t[k] === v) return true; t[k] = v; notify(t, k); return true; } }); }
function effect(fn) { activeEffect = fn; fn(); activeEffect = null; }

const state = reactive({ loggedIn: true, name: 'Ada' });

effect(() => {
  // A branching effect: reads different properties depending on loggedIn.
  if (state.loggedIn) console.log(`Welcome, ${state.name}`);
  else console.log('Please log in');
});

state.loggedIn = false;   // effect re-runs, prints "Please log in"
state.name = 'Grace';     // QUESTION: does the effect re-run? Should it?
```

*What just happened:* it re-ran - and printed "Please log in" again, uselessly. The first run
subscribed to `name`; after `loggedIn` flipped, the effect doesn't read `name` anymore, but the
old subscription is still filed. Production frameworks fix this by **clearing an effect's old
subscriptions before every re-run**, so each run's reads define its dependencies fresh. That's
"dependencies are what you read *last time*" - a line you can now read in Vue's or Svelte's
source and nod at. (Implementing the cleanup is a great stretch exercise: give each effect a list
of the Sets it's been added to, and empty them before re-running.)

## computed(): a cached effect with a value

A derived value is an effect that *produces* something instead of doing something - plus a cache:

```js runnable
const ledger = new WeakMap(); let activeEffect = null;
function track(t, k) { if (!activeEffect) return; let m = ledger.get(t); if (!m) ledger.set(t, m = new Map()); let s = m.get(k); if (!s) m.set(k, s = new Set()); s.add(activeEffect); }
function notify(t, k) { const s = ledger.get(t)?.get(k); if (s) for (const f of [...s]) f(); }
function reactive(o) { return new Proxy(o, { get(t, k) { track(t, k); return t[k]; }, set(t, k, v) { if (t[k] === v) return true; t[k] = v; notify(t, k); return true; } }); }
function effect(fn) { activeEffect = fn; fn(); activeEffect = null; }

function computed(fn) {
  let cached;
  let dirty = true;                       // "the cache is stale"
  // An effect subscribes computed's recalculation flag to fn's dependencies:
  effect(() => {
    fn();                                 // dry run purely to register dependencies
    dirty = true;                         // any dependency change re-marks stale
  });
  return {
    get value() {
      if (dirty) {
        console.log('  (recomputing...)');
        cached = fn();
        dirty = false;
      }
      return cached;
    },
  };
}

const cart = reactive({ price: 1900, qty: 2 });
const total = computed(() => cart.price * cart.qty);

console.log('total:', total.value);   // recomputes
console.log('total:', total.value);   // cached - no recompute line
cart.qty = 3;                         // marks dirty (via the inner effect)
console.log('total:', total.value);   // recomputes once
console.log('total:', total.value);   // cached again
```

*What just happened:* the `dirty` flag is the whole idea of `computed` in every framework - **lazy
recomputation**. Reading a clean cache is free; a dependency write only flips the flag; the next
read pays the recompute once. Ten template references to a computed cost one calculation - the
exact behavior our React (`useMemo`), Vue (`computed`), Svelte (`$derived`), and Angular
(`computed`) guides described from the outside. (Production versions propagate "dirtiness"
through chains of computeds more cleverly - the flag is the real core.)

## Recap

1. The trick: a global `activeEffect` set while a function runs; `get` traps file it. Reading is
   subscribing.
2. Precision falls out: effects re-run only for properties they actually read.
3. The branching-effect exercise shows why real frameworks re-track on every run - dependencies
   are last run's reads.
4. `computed` = effect + cache + dirty flag: lazy, cached derivation.
5. You have now personally implemented the sentence "the framework tracks your dependencies."

---

[← Phase 1: Reactive Objects](01-reactive-objects.md) · [Guide overview](_guide.md) · [Phase 3: The Virtual DOM →](03-the-virtual-dom.md)
