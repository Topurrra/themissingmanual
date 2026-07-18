---
title: "When Vue Breaks"
guide: "vue-from-zero"
phase: 7
summary: "The classic Vue failures - reactivity that silently stops, forgotten .value, mutated props, index keys, v-if fighting v-for - each traced back to the mechanism and calmly fixed."
tags: [vue, errors, debugging, reactivity-loss, devtools]
difficulty: intermediate
synonyms: ["vue reactivity not working", "vue ref not updating", "vue mutate prop warning", "vue v-for not updating", "vue template not rerendering"]
updated: 2026-07-18
---

# When Vue Breaks

Vue fails quieter than most frameworks. Where React throws red error walls, Vue often just...
stops updating, leaving you staring at a screen that disagrees with your data and a console that
says nothing. The good news: nearly every silent failure is the *same* failure - something got
disconnected from the reactivity system - and phase 3 gave you the mechanism to reason about it.
This phase is the field guide.

## The cheat-card

| Symptom | Almost always means | Fix |
|---|---|---|
| UI ignores updates; console shows data changing | A value got disconnected: destructured `reactive`, spread copy, or an overwritten ref | Access through the proxy/ref; `toRefs` for handing pieces around (phase 3) |
| A ref "doesn't update" in script, works in template | Missing `.value` in script code | Templates auto-unwrap; scripts never do |
| `[Vue warn]: Set operation on key "x" failed: target is readonly` / prop warning | Assigning to a prop | Emit the change to the parent (phase 4) |
| Rows show the wrong state after delete/reorder | `v-for` with index keys | Stable `:key="item.id"` (phase 2) |
| `Property "x" was accessed during render but is not defined` | Typo, or the variable isn't top-level in `<script setup>` | Declare/rename it; everything the template uses must be top-level |
| `v-if`/`v-for` on one element behaving strangely | `v-if` evaluates first, can't see the loop variable | Computed filter, or `<template v-for>` wrapping the `v-if` (phase 2) |
| Watcher never fires | Source is a plain value (`props.x`) or nested mutation without `deep` | Getter source; targeted getter or `deep: true` (phase 6) |
| Timer/listener keeps running after component is gone | Started in `onMounted`, no `onUnmounted` | Pair every start with a stop (phase 6) |

## The silent one, step by step

The signature Vue mystery deserves the full treatment, because no error will ever point at it:

```html
<script setup>
import { reactive } from 'vue';

const state = reactive({ filters: { category: 'all', inStock: false } });
let { filters } = state;          // step 1: looks harmless

function reset() {
  filters = { category: 'all', inStock: false };   // step 2: updates nothing, forever
}
</script>
```

Walk it with the phase 3 mechanism: `state` is a proxy; reads through it are tracked. Step 1
copies the *current* `filters` object into a local variable. That object is itself reactive
(nested objects get proxied too), so mutations like `filters.category = 'x'` would still work -
which makes the bug even sneakier, because the code *half works*. Step 2 is the killer: it
reassigns the **local variable** to a brand-new plain object. `state.filters` never changed; the
template (subscribed to `state.filters`) has no reason to update; your local `filters` now points
at an object nothing renders.

The debugging heuristic that finds this class in minutes instead of hours:

💡 **Key point:** when the console shows correct data but the screen disagrees, don't debug your
logic - **audit the path between the reactive source and the code that changed it.** Every
destructure, spread, function argument, and reassignment along that path is a suspect. The question
is always "did this write go *through* the proxy/ref, or past it?"

## The half-forgotten .value

```js
const items = ref([]);

async function load() {
  items = await fetchItems();          // ✗ replaced the ref itself (TypeError with const)
  items.value = await fetchItems();    // ✓ wrote through the container
}

if (items.length === 0) { ... }        // ✗ silently wrong: refs have no .length
if (items.value.length === 0) { ... }  // ✓
```

The assignment version at least crashes when the ref is `const`. The *read* version is nastier:
`items.length` is `undefined`, `undefined === 0` is `false`, and your "empty state" logic just
never runs - no error anywhere. In templates none of this exists (auto-unwrap); in script, `.value`
every time. If you use TypeScript, both mistakes become squiggles - a real argument for it beyond
fashion.

## The prop mutation warning

```text
[Vue warn]: Set operation on key "status" failed: target is readonly.
```

Vue catches direct prop assignment (`props.status = 'done'`) with that warning. The subtler
version it *can't* fully protect: props holding objects. `props.user.name = 'x'` mutates the
parent's object through the reference - it may even appear to work - but now a child is editing
state it doesn't own, invisibly to anyone reading the parent. Either way the answer is phase 4's
contract: children `emit`, parents change.

## Actually look at it: Vue DevTools

Silent failures need visibility, and the browser extension provides exactly the view you need:
component tree, each component's live refs/computeds/props, and a timeline of emitted events. The
two moves that resolve most mysteries:

- Select the component and **compare its state panel to the screen.** State right + screen wrong =
  rendering/keys problem. State wrong = the write never landed (disconnection, `.value`, wrong
  copy) - and now you know which half of the app to search.
- **Watch the events tab** while reproducing. An emit that never appears means the child never
  sent it; one that appears with nothing changing means the parent isn't listening (typo'd event
  name, kebab/camel mismatch).

## Recap

1. Vue's classic failure is silent: a write that went *past* the tracking instead of through it.
   Audit the path, not the logic.
2. `.value` in script, never in templates; misreads (`ref.length`) fail quieter than miswrites.
3. Props: direct assignment warns, nested mutation corrupts silently - emit instead.
4. Index keys, `v-if`+`v-for`, undead timers: phase 2 and 6 rules, now as symptoms.
5. Vue DevTools turns "the screen is wrong" into "this specific state is (or isn't) wrong" - use
   it before guessing.

```quiz
[
  {
    "q": "let { user } = reactive(store); user = await fetchUser(). The template keeps showing the old user with no warning. What happened?",
    "choices": [
      "fetchUser returned a non-reactive object, which templates can't display",
      "The reassignment changed only the local variable - store.user was never written, so subscribers were never notified",
      "await broke the reactivity chain",
      "The template needed a deep watcher on user"
    ],
    "answer": 1,
    "why": [
      "Templates display plain objects fine - the problem is nobody told the template anything changed.",
      null,
      "await is irrelevant - a synchronous reassignment fails identically.",
      "Watchers are for side effects; the template's own subscription was pointed at store.user all along - which didn't change."
    ],
    "explain": "Destructuring made a local pointer; reassigning it re-aims the pointer, not the store. Write through the source (store.user = ...) so the proxy can notify its subscribers."
  },
  {
    "q": "In script, if (results.length > 0) never runs even though the ref clearly holds items. Why?",
    "choices": [
      "Arrays inside refs need reactive() instead",
      "results is the ref container - it has no .length; the check reads undefined and is silently false. It needed results.value.length",
      "Script code runs before the items arrive",
      "length isn't reactive in Vue"
    ],
    "answer": 1,
    "why": [
      "ref holds arrays happily - accessed through .value.",
      null,
      "Timing could cause one false check, not a permanently dead branch.",
      "Through .value, length is fully tracked."
    ],
    "explain": "Auto-unwrap is a template luxury. In script the ref is a container object; forgetting .value on a read produces undefined and comparisons that quietly do the wrong thing."
  },
  {
    "q": "The console shows your data updating correctly but the screen never changes. Per this phase, what's the highest-value first step?",
    "choices": [
      "Add a key to force re-rendering",
      "Trace the path between the reactive source and the write - looking for destructures, spreads, and reassignments that bypassed tracking",
      "Rewrite the component with the Options API",
      "Wrap the data in an extra ref"
    ],
    "answer": 1,
    "why": [
      "A forced re-render would still read the unchanged source - repainting the same wrong answer.",
      null,
      "Both APIs sit on the same reactivity system and share the same disconnection bugs.",
      "Another layer of wrapping changes nothing about writes that go around the wrapper."
    ],
    "explain": "Data-right-screen-wrong means the write went past the tracking system. The bug lives on the path between source and write site - audit every hop for a copy or bypass."
  }
]
```

---

[← Phase 6: Watchers, Lifecycle, and Fetching](06-watchers-lifecycle-fetching.md) · [Guide overview](_guide.md) · [Phase 8: Where to Go Next →](08-where-to-go-next.md)
