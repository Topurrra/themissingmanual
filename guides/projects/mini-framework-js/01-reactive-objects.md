---
title: "Reactive Objects"
guide: "mini-framework-js"
phase: 1
summary: "Build the atom of reactivity: a JavaScript Proxy that intercepts every property read and write, so your data can announce its own changes."
tags: [javascript, proxy, reactivity, get-set-traps]
difficulty: intermediate
synonyms: ["javascript proxy tutorial", "how vue reactivity works internally", "intercept property access javascript", "proxy get set trap example"]
updated: 2026-07-18
---

# Reactive Objects

Every reactivity system - Vue's, Svelte's, the one you're about to write - rests on one
capability: **knowing when data is read and when it's written.** Plain JavaScript objects don't
report either. But the language ships a tool that wraps any object and intercepts everything done
to it: the `Proxy`. Today you build with it.

## Meet the Proxy

A `Proxy` wraps a target object and routes operations through *traps* - functions you supply.
Two traps carry this whole project: `get` (a property was read) and `set` (a property was
written). Run it:

```js runnable
const user = { name: 'Ada', plan: 'pro' };

const spied = new Proxy(user, {
  get(target, key) {
    console.log(`READ  ${String(key)}`);
    return target[key];
  },
  set(target, key, value) {
    console.log(`WRITE ${String(key)} = ${value}`);
    target[key] = value;
    return true; // set traps must return true on success
  },
});

// Use it like a normal object - the traps fire invisibly:
const n = spied.name;
spied.plan = 'enterprise';
console.log('Reads and writes went through, value is:', spied.plan);
```

*What just happened:* `spied` behaves exactly like `user` - same properties, same values - but
every access ran through your traps first. The object can now *announce* its own reads and
writes. That announcement is the entire foundation: a framework that hears "someone read `name`"
and later "someone wrote `name`" knows exactly which screen updates matter.

## From spy to subscription ledger

Logging is a demo; a framework needs bookkeeping. The plan: when a property is read, remember
*who was asking* (we'll wire that up properly in phase 2 - for now, a placeholder). When it's
written, look up everyone who asked and notify them. The ledger:

```js runnable
// A two-level map: object -> (key -> Set of subscribers)
const ledger = new WeakMap();

function subscribe(target, key, fn) {
  let keyMap = ledger.get(target);
  if (!keyMap) ledger.set(target, (keyMap = new Map()));
  let subs = keyMap.get(key);
  if (!subs) keyMap.set(key, (subs = new Set()));
  subs.add(fn);
}

function notify(target, key) {
  const subs = ledger.get(target)?.get(key);
  if (subs) for (const fn of subs) fn();
}

// Try the ledger on its own:
const state = { count: 0 };
subscribe(state, 'count', () => console.log('count changed!'));
subscribe(state, 'count', () => console.log('me too!'));
notify(state, 'count');
```

*What just happened:* `subscribe` files a function under (object, property); `notify` runs
everything filed there. A `WeakMap` keyed by the object means the bookkeeping disappears when the
object does - no leak. A `Set` per property means the same subscriber can't be filed twice.

## reactive(): the two pieces joined

Now the move that makes it automatic - the proxy's traps *call* the ledger:

```js runnable
const ledger = new WeakMap();

function subscribe(target, key, fn) {
  let keyMap = ledger.get(target);
  if (!keyMap) ledger.set(target, (keyMap = new Map()));
  let subs = keyMap.get(key);
  if (!subs) keyMap.set(key, (subs = new Set()));
  subs.add(fn);
}

function notify(target, key) {
  const subs = ledger.get(target)?.get(key);
  if (subs) for (const fn of subs) fn();
}

function reactive(obj) {
  return new Proxy(obj, {
    get(target, key) {
      // Phase 2 will subscribe the *current effect* here automatically.
      return target[key];
    },
    set(target, key, value) {
      if (target[key] === value) return true;  // no change, no noise
      target[key] = value;
      notify(target, key);                     // announce to subscribers
      return true;
    },
  });
}

// Demo: manual subscription, automatic notification.
// Note we subscribe on the RAW object: the traps file their bookkeeping under it
// (the `target` they receive), so lookups must use the same key. Phase 2's
// automatic tracking happens inside the traps, which makes this seam invisible.
const rawCart = { items: 0, total: 0 };
const cart = reactive(rawCart);

subscribe(rawCart, 'items', () => console.log(`UI update: badge shows ${cart.items}`));
subscribe(rawCart, 'total', () => console.log(`UI update: total shows ${cart.total}`));

cart.items = 1;      // only the badge subscriber fires
cart.total = 1900;   // only the total subscriber fires
cart.items = 1;      // same value: nothing fires (check the guard in set)
cart.items = 2;
```

*What just happened:* writes now notify precisely the subscribers of *that property* - update
`items` and the total subscriber stays quiet. The `target[key] === value` guard skips no-op
writes, which real frameworks also do (you met it as "signals compare by reference" if you've
read the Angular guide). Two loose ends remain, both deliberate: the subscribing is still manual,
and you had to know about the raw-vs-proxy seam to file subscriptions under the right key. Phase 2
fixes both at once - automatic tracking lives *inside* the traps, where `target` is always the raw
object - and it's the best trick in frontend engineering.

## Your turn

Extend `reactive`'s `set` trap so it also logs a warning - without notifying - when code tries to
write a property that didn't exist on the original object (a typo catcher: `cart.tota = 5`
should warn, not silently create a property). `Object.hasOwn(target, key)` tells you if the key
existed. Then prove it works:

```js runnable
function reactive(obj) {
  return new Proxy(obj, {
    get(target, key) {
      return target[key];
    },
    set(target, key, value) {
      // YOUR CODE: if the key is NOT already on target, console.log a warning
      // like `unknown property "tota" - typo?` and return true WITHOUT writing.
      // Otherwise write and return true (skip notify - no ledger in this block).
      target[key] = value;
      return true;
    },
  });
}

const cart = reactive({ items: 0, total: 0 });
cart.items = 3;      // should write silently
cart.tota = 99;      // should WARN and not create the property
console.log('items:', cart.items, '| tota exists:', 'tota' in cart); // 3, false
```

## Recap

1. A `Proxy` wraps an object and intercepts reads (`get`) and writes (`set`) - data that can
   announce itself.
2. The ledger is a `WeakMap(object → Map(key → Set(subscriber)))` - per-property precision,
   leak-free by construction.
3. `reactive()` = proxy + ledger: writes notify exactly the right subscribers, no-op writes are
   filtered.
4. Reads are the missing half - automating "who was asking" is phase 2.

---

[← Guide overview](_guide.md) · [Phase 2: Effects and Computed →](02-effects-and-computed.md)
