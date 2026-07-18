---
title: "Watchers, Lifecycle, and Fetching"
guide: "vue-from-zero"
phase: 6
summary: "watch runs code when specific data changes, onMounted marks arrival in the DOM, onUnmounted cleans up what you started - the side-effect toolkit, with computed still preferred for pure derivation."
tags: [vue, watch, watcheffect, lifecycle, onmounted, fetching]
difficulty: intermediate
synonyms: ["vue watch example", "watch vs watcheffect", "onmounted vue", "vue watcher not firing on object", "fetch data in vue component"]
updated: 2026-07-18
---

# Watchers, Lifecycle, and Fetching

Computed handles "this value follows from that value." But some reactions to change aren't values -
they're *actions*: refetch when the selected id changes, save a draft when the form changes, start a
timer when the component appears and stop it when it leaves. Actions in response to change are
**watchers**; actions tied to a component's existence are **lifecycle hooks**. Together they're
Vue's side-effect toolkit - powerful, and the part of Vue most often used where `computed` should
have been.

## watch: when this changes, do that

```js
import { ref, watch } from 'vue';

const selectedId = ref(1);
const product = ref(null);

watch(selectedId, async (newId, oldId) => {
  product.value = null;                      // show loading state
  product.value = await fetchProduct(newId);
});
```

*What just happened:* `watch` subscribes to a reactive source (here a ref) and runs the callback on
change, with new and old values. The classic use is exactly this: a *side effect* (network call) in
response to a *data change* (selection).

The source argument has a shape rule that bites everyone once:

```js
watch(selectedId, ...)          // ✓ a ref: watch the container
watch(() => props.userId, ...)  // ✓ a getter: watch an expression/property
watch(props.userId, ...)        // ✗ passes today's VALUE (a number) - nothing to subscribe to
```

Passing `props.userId` evaluates immediately to a plain number - dead, per phase 3, and Vue warns
about an invalid watch source. Anything that isn't itself a ref/reactive object gets wrapped in a
getter function.

Two options cover most real needs:

```js
watch(source, callback, { immediate: true });  // also run once right now (initial fetch + refetch in one)
watch(form, callback, { deep: true });         // fire on nested mutations inside an object
```

`deep` exists because watching a `reactive` object or a ref-of-object only fires by default when
the *identity* changes or (for `reactive`) properties are directly touched by the watcher's
tracking - mutating `form.address.city` deep inside won't trigger a shallow watcher on a ref.
`deep: true` traverses everything (at a cost proportional to the object's size); often the sharper
tool is watching the specific field: `watch(() => form.address.city, ...)`.

📝 **Terminology:** `watchEffect(fn)` is the auto-tracked sibling: it runs immediately and re-runs
whenever *anything it read* changes - no explicit source list. Convenient for "keep these things in
sync" effects; less explicit about when it fires. Reach for `watch` when you care about *which*
change triggers the action (and want old/new values); `watchEffect` for fire-and-forget syncing.

## Don't watch what you can compute

The most common watcher in beginner Vue is a hand-rolled computed:

```js
// ✗ a second source of truth, updated by machinery
const fullName = ref('');
watch([firstName, lastName], () => {
  fullName.value = `${firstName.value} ${lastName.value}`;
});

// ✓ a derivation
const fullName = computed(() => `${firstName.value} ${lastName.value}`);
```

💡 **Key point:** if the reaction to data changing is *producing another value*, that's `computed`.
If it's *doing something* - fetching, saving, logging, touching a browser API - that's `watch`. The
computed version can't be stale, can't fire in the wrong order, and deletes three lines.

## Lifecycle: onMounted and onUnmounted

A component's script runs before any DOM exists. Code that needs the real page - measuring an
element, starting an interval, third-party libraries attaching to a node - waits for **mount**:

```html
<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const seconds = ref(0);
let timer;

onMounted(() => {
  timer = setInterval(() => seconds.value++, 1000);
});

onUnmounted(() => {
  clearInterval(timer);   // whatever mount starts, unmount stops
});
</script>
```

*What just happened:* `onMounted` fired after the component's DOM landed on the page;
`onUnmounted` fired when it left (a `v-if` went false, the route changed). The pairing is the
discipline: an interval, listener, or subscription started at mount and not stopped at unmount
keeps running against a dead component - the classic leak, stacking a new timer on every remount.

The full hook family exists (`onUpdated`, `onBeforeMount`, ...) but these two carry nearly all
real usage. If you're reaching for `onUpdated`, first ask whether a `watch` on the specific data
says what you mean more precisely.

## The standard fetch shapes

Initial load - await inside `onMounted` (or just call an async function from setup):

```html
<script setup>
import { ref, onMounted } from 'vue';
const orders = ref(null);
const error = ref(null);

onMounted(async () => {
  try {
    const res = await fetch('/api/orders');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    orders.value = await res.json();
  } catch (e) {
    error.value = e;
  }
});
</script>

<template>
  <p v-if="error">Couldn't load orders.</p>
  <p v-else-if="!orders">Loading…</p>
  <ul v-else><li v-for="o in orders" :key="o.id">{{ o.ref }}</li></ul>
</template>
```

Refetch-on-change - the `watch` with `immediate` from above, which handles both first load and
every change of the source. And when the same shape repeats across components, phase 5 already
showed the endgame: fold it into a `useFetch` composable.

⚠️ **Gotcha:** the refetch watcher has the same stale-response race every framework meets: the
user flips from product 1 to product 2, responses arrive out of order, and 1 overwrites 2. The
watcher callback receives a third argument, `onCleanup`, made for exactly this:

```js
watch(selectedId, async (id, _, onCleanup) => {
  let cancelled = false;
  onCleanup(() => { cancelled = true; });   // runs before the NEXT callback fires
  const data = await fetchProduct(id);
  if (!cancelled) product.value = data;
});
```

## Recap

1. `watch(source, cb)` = side effects on specific changes; sources are refs or getters, never
   `props.x` bare.
2. `immediate` for run-now-and-on-change; `deep` (or better: a targeted getter) for nested
   mutations; `watchEffect` when auto-tracking reads is clearer.
3. Producing a value → `computed`; doing a thing → `watch`. Never maintain derived state by
   watcher.
4. `onMounted` for DOM-dependent setup; `onUnmounted` mirrors it - every start gets a stop.
5. Refetch watchers need `onCleanup` for the out-of-order response race.

```quiz
[
  {
    "q": "watch(props.userId, cb) warns about an invalid source and never fires. Why?",
    "choices": [
      "Props can't be watched, only refs can",
      "The expression evaluated to a plain number immediately - watch needs a ref or a getter like () => props.userId",
      "The callback must be async",
      "Watching props requires deep: true"
    ],
    "answer": 1,
    "why": [
      "Props watch fine - through a getter that defers the read.",
      null,
      "Sync callbacks are fine; the source, not the callback, is broken.",
      "deep governs nested objects - a primitive prop needs deferral, not depth."
    ],
    "explain": "Arguments evaluate before the call: props.userId is already just 7 by the time watch sees it. A getter hands watch the recipe instead of the result."
  },
  {
    "q": "A component starts a setInterval in onMounted with no onUnmounted. The component sits behind a v-if that toggles often. What accumulates?",
    "choices": [
      "Nothing - Vue clears intervals when components unmount",
      "A new live interval per mount, each still firing against unmounted component state",
      "Memory only, but the intervals themselves stop",
      "Duplicate DOM nodes"
    ],
    "answer": 1,
    "why": [
      "Vue tears down its own subscriptions - browser timers are yours to clear.",
      null,
      "The intervals keep firing forever - that's the leak's active half, not just retained memory.",
      "The DOM is correctly removed; the timer outliving it is the problem."
    ],
    "explain": "Whatever mount starts, unmount must stop. Each v-if cycle mounts a fresh component that starts a fresh interval; without clearInterval in onUnmounted they all keep running."
  },
  {
    "q": "You need cartTotal to always equal the sum of cart item prices. Which tool?",
    "choices": [
      "A watcher on the cart that updates a cartTotal ref",
      "A computed that reduces over the cart",
      "onUpdated recalculating the total after each render",
      "watchEffect writing into a cartTotal ref"
    ],
    "answer": 1,
    "why": [
      "It works until the day an update path skips it - a maintained copy of derivable data is the anti-pattern this phase names.",
      null,
      "onUpdated fires after every render of anything - maximum wasted work, minimum precision.",
      "Same second-source-of-truth problem in auto-tracking clothes."
    ],
    "explain": "A value that follows from other values is a derivation: computed. Watchers are for actions - fetching, saving, timing - not for maintaining data that computed can express."
  }
]
```

---

[← Phase 5: Slots and Composition](05-slots-and-composition.md) · [Guide overview](_guide.md) · [Phase 7: When Vue Breaks →](07-when-it-breaks.md)
