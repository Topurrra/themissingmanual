---
title: "Slots and Composition"
guide: "vue-from-zero"
phase: 5
summary: "Slots let a component own the frame while callers own the contents; composables package reactive logic into reusable functions; provide/inject carries values past intermediate layers."
tags: [vue, slots, composables, provide-inject, composition]
difficulty: intermediate
synonyms: ["vue slots explained", "named slots vue", "what is a composable vue", "provide inject vue", "reusable logic vue composition api"]
updated: 2026-07-18
---

# Slots and Composition

Props carry *data* into a component. But some components need to receive *markup* - a Card that
frames whatever you put in it, a Modal that wraps any content. And some logic - "track the mouse,"
"fetch with loading state" - wants to be reused across components that share no markup at all. Vue
has one tool for each: slots for markup, composables for logic. Together they're how Vue codebases
stay DRY without inheritance trees.

## Slots: the component owns the frame, you own the contents

```html
<!-- Card.vue -->
<script setup>
defineProps({ title: String });
</script>

<template>
  <section class="card">
    <h2>{{ title }}</h2>
    <slot>Nothing here yet.</slot>   <!-- caller's content lands here; text = fallback -->
  </section>
</template>
```

```html
<!-- caller -->
<Card title="Danger zone">
  <p>Deleting your account is permanent.</p>
  <button @click="confirmDelete">Delete</button>
</Card>
```

*What just happened:* everything between `<Card>` and `</Card>` replaced the `<slot>` outlet. The
Card controls structure and styling; the caller controls contents - including live, reactive
contents with their own handlers. Text inside `<slot>` is the fallback when a caller passes
nothing.

**Named slots** give a component several outlets:

```html
<!-- PageLayout.vue -->
<template>
  <header><slot name="header" /></header>
  <main><slot /></main>                    <!-- the unnamed one is "default" -->
  <footer><slot name="footer" /></footer>
</template>
```

```html
<PageLayout>
  <template #header><h1>Orders</h1></template>
  Order list goes here.
  <template #footer><small>Updated hourly.</small></template>
</PageLayout>
```

The `#header` syntax (short for `v-slot:header`) targets a `<template>` block at a named outlet.
One layout component, every page slotting its parts in - this is the pattern Vue Router's layouts
and every component library's dialogs are built from.

⚠️ **Gotcha:** slot content is compiled in the **parent's** scope. Inside
`<template #header>` you can read the parent's state, but *not* the child's - a slot is a window
into the child's markup, not its data. When the child must share data back into the slot (a list
component handing each item to caller-provided markup), that's **scoped slots**:
`<slot :item="item" />` in the child, `<template #default="{ item }">` in the parent. Worth
recognizing on sight; a follow-up guide gives it a full treatment.

## Composables: logic as a function

The Composition API's payoff beyond organization: **reactive logic can live in a plain function.**
Convention: name starts with `use`, lives in `src/composables/`.

```js
// composables/useFetch.js
import { ref } from 'vue';

export function useFetch(getUrl) {
  const data = ref(null);
  const error = ref(null);
  const loading = ref(false);

  async function load() {
    loading.value = true;
    error.value = null;
    try {
      const res = await fetch(getUrl());
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      data.value = await res.json();
    } catch (e) {
      error.value = e;
    } finally {
      loading.value = false;
    }
  }

  return { data, error, loading, load };
}
```

```html
<!-- any component -->
<script setup>
import { useFetch } from '@/composables/useFetch';
const { data: orders, loading, error, load } = useFetch(() => '/api/orders');
load();
</script>

<template>
  <p v-if="loading">Loading…</p>
  <p v-else-if="error">Couldn't load orders.</p>
  <ul v-else><li v-for="o in orders" :key="o.id">{{ o.ref }}</li></ul>
</template>
```

*What just happened:* the fetch machinery - three refs and their choreography - moved into a
function any component can call. Each call creates *fresh* refs (no shared state between callers,
unless you deliberately hoist refs to module scope). The component keeps only what's unique to it:
which URL, and what the states look like.

💡 **Key point:** a composable is not a framework feature - it's a plain function that happens to
create refs and computeds. That's the Composition API's whole design: because reactivity lives in
importable functions (`ref`, `computed`, `watch`) rather than in component options, *your* logic
can be an importable function too. Notice the destructuring is safe here: `data` and `loading` are
refs - containers, per phase 3 - so handing them out preserves reactivity.

## provide / inject: skipping the middle layers

Props work level to level. For values needed across many levels - theme, current user, locale -
threading a prop through five components that don't use it gets old. A parent can **provide**;
any descendant can **inject**:

```js
// App.vue (or any ancestor)
import { provide, ref } from 'vue';
const theme = ref('dark');
provide('theme', theme);       // provide the ref itself, not theme.value
```

```js
// any component, any depth below
import { inject } from 'vue';
const theme = inject('theme', ref('light'));   // second arg: default if nobody provided
```

*What just happened:* the descendant received the *same ref* the ancestor provided - reactive, so
theme changes propagate to every injector. Provide the ref, not its unwrapped value: `provide('theme',
theme.value)` hands out a frozen string, and phase 3 told you why that's dead on arrival.

The judgment call is the same as any broadcast mechanism: `provide`/`inject` shines for
widely-read, rarely-changed app context, and turns into hide-and-seek if you route everyday
parent-child data through it. Props are greppable; injections need the reader to know the key
exists. Default to props; inject for genuine cross-cutting context.

## Recap

1. Slots receive markup: default slot for one outlet, named slots (`#header`) for several,
   fallback content inside `<slot>`.
2. Slot content sees the parent's scope; scoped slots are the child-hands-data-back variant.
3. Composables = reactive logic in plain `use*` functions; fresh refs per call, importable
   anywhere, safely destructurable because refs are containers.
4. `provide`/`inject` carries reactive context past intermediate layers - provide the ref itself.
5. Props for everyday flow; injection for app-wide context; slots whenever a component should
   frame content it doesn't own.

```quiz
[
  {
    "q": "Inside <template #header> passed to a layout component, you reference one of the layout's internal refs and get undefined. Why?",
    "choices": [
      "Named slot templates can only contain static HTML",
      "Slot content compiles in the parent's scope - the child's data isn't visible unless the child exposes it via a scoped slot",
      "The ref needed .value in the template",
      "provide/inject is required to use data inside slots"
    ],
    "answer": 1,
    "why": [
      "Slot templates are fully dynamic - handlers, bindings, all of it; the constraint is whose data they see.",
      null,
      "Templates auto-unwrap refs - and no unwrapping trick grants access to another component's scope.",
      "Injection shares app context; the standard channel for child-to-slot data is the scoped slot."
    ],
    "explain": "A slot is the caller's markup shown inside the child's frame - it evaluates against the caller's scope. Children share data into slots explicitly: <slot :item=\"item\">."
  },
  {
    "q": "Two components both call useFetch(). Do they share the data ref?",
    "choices": [
      "Yes - composables create module-level state shared by all callers",
      "No - each call runs the function fresh and creates its own refs",
      "Only if both components are children of the same parent",
      "Yes, unless the composable is marked as scoped"
    ],
    "answer": 1,
    "why": [
      "Refs created inside the function body are per-call; sharing happens only when refs are deliberately hoisted to module scope outside the function.",
      null,
      "The component tree has no bearing on it - function-call semantics do.",
      "There's no scoped marker - the function's own structure decides what's shared."
    ],
    "explain": "A composable is a plain function. Each call executes its body and makes fresh refs - isolation by default, shared state only if you hoist refs outside the function on purpose."
  }
]
```

---

[← Phase 4: Components: Props, Events, and v-model](04-components-props-events.md) · [Guide overview](_guide.md) · [Phase 6: Watchers, Lifecycle, and Fetching →](06-watchers-lifecycle-fetching.md)
