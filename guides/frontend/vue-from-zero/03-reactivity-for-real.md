---
title: "Reactivity for Real"
guide: "vue-from-zero"
phase: 3
summary: "ref wraps any value in a reactive container you access via .value; reactive proxies objects in place; computed caches derived values - and destructuring is how reactivity is silently lost."
tags: [vue, ref, reactive, computed, reactivity, composition-api]
difficulty: beginner
synonyms: ["ref vs reactive vue", "why do i need .value in vue", "vue computed explained", "vue destructuring loses reactivity", "torefs vue"]
updated: 2026-07-18
---

# Reactivity for Real

Phase 1 promised that Vue's data "knows when it's read and written." This phase is how - because
the day reactivity silently stops working (and that day comes for everyone), the difference between
a five-minute fix and a lost evening is knowing what the tracking system physically is.

## The mechanism under everything

Vue's reactivity is built on JavaScript **proxies** - objects that wrap your data and intercept
every property access. Read `state.count` and the proxy's `get` trap fires: *"the thing currently
rendering just read `count` - subscribe it."* Write `state.count = 5` and the `set` trap fires:
*"notify everyone subscribed to `count`."* That's the whole magic: interception at the property
level.

Hold that picture, because both of this phase's traps are cases where the interception gets
*bypassed*.

## ref: any value, one container

```js
import { ref } from 'vue';

const count = ref(0);
const user = ref({ name: 'Ada' });

console.log(count.value);   // 0 - in script, the value lives on .value
count.value++;              // write through .value = tracked
user.value.name = 'Grace';  // nested mutation is tracked too
```

**What it actually is.** A `ref` is a container object with a single reactive property: `.value`.
Why a container at all? Because JavaScript can't intercept a plain variable - `let count = 0` has
no property to trap. Wrapping the value in an object gives the proxy machinery something to hold
onto. `.value` is not ceremony; it *is* the reactive access point.

**In templates, `.value` disappears.** Vue auto-unwraps top-level refs in templates:
`{{ count }}`, not `{{ count.value }}`. Convenient, and the source of the most common beginner
error - in the script, forgetting `.value`:

```js
const count = ref(0);
count = count + 1;     // ✗ TypeError: Assignment to constant variable (best case)
count.value = count.value + 1;  // ✓
```

Best case, `const` saves you with a loud error. Worst case (with `let`), you've replaced the
container with a plain number, and reactivity is simply gone - no error, no updates, ever again.

## reactive: proxy an object in place

```js
import { reactive } from 'vue';

const form = reactive({ name: '', email: '', attempts: 0 });
form.attempts++;          // no .value - the object itself is the proxy
```

`reactive` wraps an object (only objects - not numbers or strings) so its properties are tracked
directly, no `.value` anywhere. Reads naturally, mutates naturally. So why doesn't everyone use it
for everything? Because of the biggest trap in Vue:

## The destructuring trap

```js
const form = reactive({ name: '', email: '' });

const { name } = form;      // ✗ name is now a plain, dead string
let email = form.email;     // ✗ same problem

// later...
name = 'Ada';               // updates nothing, tracked by nothing
```

**Why this breaks.** Destructuring *copies the value out* of the proxy. The copy is an ordinary
string with no connection to the tracking system - reading it registers nothing, and you can't even
write back through it. The proxy only intercepts access *through itself* (`form.name`); the moment
a primitive leaves the proxy, it's inert. The same applies to passing `form.name` into a function,
or spreading: `{ ...form }` produces a completely non-reactive object.

The fixes, in order of preference:

```js
// 1. Just keep the object together: form.name everywhere. Simplest, usually right.

// 2. Need to hand pieces around? toRefs converts each property into a linked ref:
import { toRefs } from 'vue';
const { name, email } = toRefs(form);   // ✓ refs, connected to form
name.value = 'Ada';                     // updates form.name, tracked
```

💡 **Key point:** this trap is why many Vue teams standardize on `ref` for everything, objects
included. Refs survive being passed around *as the container* - you hand over the box, not the
contents, and access through `.value` always goes through the tracking. The practical rule: **`ref`
by default; `reactive` for a group of fields you'll always keep together and never destructure.**
Both are correct Vue; the rule optimizes for the mistake humans actually make.

## computed: derived values with a memory

```js
import { ref, computed } from 'vue';

const todos = ref([
  { text: 'Learn reactivity', done: true },
  { text: 'Trust the proxy', done: false },
]);

const remaining = computed(() => todos.value.filter(t => !t.done).length);
```

**What it actually is.** A read-only ref whose value is computed by your function - with two
properties a plain function call doesn't have:

- **It's reactive both directions.** The computation reads `todos.value`, so `remaining` subscribes
  to `todos`; anything reading `remaining` subscribes to *it*. Change a todo and the chain
  re-evaluates: data → computed → template.
- **It caches.** The function re-runs only when a dependency changed. Ten template references to
  `{{ remaining }}` cost one computation. A method called from the template runs every render.

The smell it exists to fix: state that duplicates other state. If you're maintaining a
`remainingCount` ref by hand next to `todos`, you've created two sources of truth that *will*
disagree someday. If it can be computed, `computed` it.

⚠️ **Gotcha:** computeds are for *deriving*, not *doing*. No mutations, no fetches, no
`Math.random()` inside - the function may run at unpredictable times (or not at all, if cached), so
side effects in a computed produce heisenbugs. Side effects belong in handlers and watchers
(phase 6).

## Recap

1. Reactivity = proxies intercepting property access: reads subscribe, writes notify.
2. `ref` wraps any value; script access is `.value`, templates auto-unwrap. The container is the
   reactive unit - pass the box, not the contents.
3. `reactive` proxies objects in place - and destructuring/spreading copies dead values out.
   `toRefs` when pieces must travel.
4. Default to `ref`; use `reactive` for keep-together field groups.
5. `computed` = cached, chainable derivation. Derive, don't duplicate - and no side effects inside.

```quiz
[
  {
    "q": "const { name } = reactive({ name: 'Ada' }) - and updates to name no longer affect the UI. Why?",
    "choices": [
      "reactive only works on nested objects, not strings",
      "Destructuring copied a plain value out of the proxy - access no longer goes through the tracking system",
      "The template needs {{ name.value }} to unwrap it",
      "reactive objects are read-only outside the component that created them"
    ],
    "answer": 1,
    "why": [
      "reactive tracks properties of any type - through the proxy; the string was fine until it was copied out.",
      null,
      "There's no ref here to unwrap - the copy is a dead primitive, and no syntax revives it.",
      "reactive objects are freely writable anywhere - through the proxy."
    ],
    "explain": "The proxy can only intercept access through itself. Destructuring hands you the contents without the container - use form.name directly, or toRefs(form) to get linked refs."
  },
  {
    "q": "When does a computed re-run its function?",
    "choices": [
      "On every template render that references it",
      "Only when one of the reactive values it read last time has changed",
      "On a timer that Vue manages",
      "Every time any state anywhere in the component changes"
    ],
    "answer": 1,
    "why": [
      "That describes a method call in a template - the exact cost computed's cache avoids.",
      null,
      "Nothing is polled; the dependency graph triggers re-evaluation.",
      "Only its own dependencies matter - unrelated state changes don't touch it."
    ],
    "explain": "A computed tracks what it reads and caches its result. Its dependencies changing invalidates the cache; the next read re-computes. That's why it beats a method for anything referenced repeatedly."
  },
  {
    "q": "Why does ref exist at all - why can't Vue just track let count = 0?",
    "choices": [
      "It could, but ref makes the code more readable",
      "JavaScript offers no way to intercept reads and writes of a plain local variable - only property access on an object can be trapped",
      "Refs are needed for TypeScript support",
      "Plain variables would be too slow to track"
    ],
    "answer": 1,
    "why": [
      "It's a language constraint, not a style choice - there is no API for observing a local binding.",
      null,
      "TypeScript types refs nicely, but the container exists for the proxy machinery, not the type system.",
      "Speed isn't the issue - there's simply no interception point on a bare variable."
    ],
    "explain": "Proxies trap property access on objects. A bare variable has no properties to trap, so Vue wraps the value in a one-property container: .value is the interception point."
  }
]
```

---

[← Phase 2: Templates That React](02-templates-that-react.md) · [Guide overview](_guide.md) · [Phase 4: Components: Props, Events, and v-model →](04-components-props-events.md)
