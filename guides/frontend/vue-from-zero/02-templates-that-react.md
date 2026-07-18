---
title: "Templates That React"
guide: "vue-from-zero"
phase: 2
summary: "Vue's template syntax in one pass: {{ }} for text, : to bind attributes, @ to handle events, v-if/v-show to branch, v-for with :key to repeat, and v-model to bind forms both ways."
tags: [vue, templates, directives, v-for, v-model, v-if]
difficulty: beginner
synonyms: ["vue template syntax", "v-bind vs v-model", "v-if vs v-show difference", "v-for key vue", "vue event handling @click"]
updated: 2026-07-18
---

# Templates That React

Vue templates are HTML with a small set of superpowers called **directives** - attributes starting
with `v-` that tell the compiler "this part is dynamic." There are fewer than you'd think, and five
of them cover essentially all daily work. This phase is that five, plus the gotcha each one carries.

## Text and attributes: {{ }} and :

```html
<script setup>
import { ref } from 'vue';
const product = ref({ name: 'Kettle', imageUrl: '/kettle.jpg', inStock: true });
</script>

<template>
  <h2>{{ product.name }}</h2>                     <!-- text interpolation -->
  <img :src="product.imageUrl" :alt="product.name" />  <!-- attribute binding -->
  <button :disabled="!product.inStock">Buy</button>
</template>
```

*What just happened:* `{{ }}` drops a reactive expression into text. For attributes, mustaches
don't work - `src="{{ url }}"` is a beginner classic that sets the literal string. Attributes bind
with the `:` prefix (shorthand for `v-bind:`): `:src="product.imageUrl"` means "this attribute's
value is a JavaScript expression, keep it in sync."

Everything inside `{{ }}` and `:` is a real expression - `{{ price * quantity }}`,
`:class="{ active: isActive }"` (that object form toggles CSS classes by boolean, and you'll use it
weekly). Statements don't fit (`{{ if (x) ... }}` is a compile error); anything beyond a simple
expression belongs in a `computed` (phase 3).

## Events: @

```html
<button @click="count++">Add one</button>
<button @click="addToCart(product.id)">Add to cart</button>
<form @submit.prevent="save">...</form>
```

*What just happened:* `@click` (shorthand for `v-on:click`) attaches a handler - either an inline
expression or a function to call. The third line shows a **modifier**: `.prevent` is
`event.preventDefault()` as a suffix, so form-submit handlers don't start with boilerplate. The
modifiers you'll actually use: `.prevent`, `.stop` (stopPropagation), and key modifiers like
`@keyup.enter="search"`.

📝 **Terminology:** contrast note for React readers - there's no "pass a function, don't call it"
trap here. `@click="addToCart(product.id)"` compiles to a handler that runs the expression *on
click*, because templates are compiled, not evaluated inline. One classic bug that doesn't exist in
this dialect.

## Branching: v-if and v-show

```html
<p v-if="cart.length === 0">Your cart is empty.</p>
<p v-else-if="cart.length < 10">{{ cart.length }} items.</p>
<p v-else>Bulk order!</p>

<div v-show="detailsOpen">...expensive details panel...</div>
```

Two ways to hide things, with a real difference:

- **`v-if`** removes the element from the DOM entirely. False means gone - not rendered, listeners
  detached, child component state destroyed (it unmounts, same semantics as conditional rendering
  anywhere).
- **`v-show`** always renders but toggles `display: none`. The element stays alive, state intact.

The rule of thumb: `v-if` for branches that rarely change or shouldn't exist when false (auth-gated
UI, error states); `v-show` for things toggled frequently where you want the flip to be instant and
the state preserved (tabs, dropdowns).

## Lists: v-for and the :key contract

```html
<ul>
  <li v-for="todo in todos" :key="todo.id">
    {{ todo.text }}
  </li>
</ul>
```

*What just happened:* one `<li>` per array item. The `:key` is not decoration: when the array
changes, Vue matches old and new items *by key* to decide what moved versus what's new - reuse the
moved, build the new, delete the gone. Give it a stable identity (`todo.id`), never the array index
for lists that can reorder or delete: index keys make Vue reuse the wrong element's DOM (and any
state attached to it, like a checkbox or an input) for a different item.

⚠️ **Gotcha:** `v-if` and `v-for` on the *same element* is a lint error in Vue 3 - `v-if` runs
first and can't see the loop variable, which surprises everyone. Filter in a computed instead
(`doneTodos` from phase 3), or nest: `<template v-for="...">` wrapping an inner `v-if`. The
`<template>` tag renders nothing itself - it's the grouping element for exactly these cases.

## Two-way forms: v-model

The pattern every form needs - value flows into the input, keystrokes flow back into state - has a
dedicated directive:

```html
<script setup>
import { ref } from 'vue';
const email = ref('');
const agreed = ref(false);
const plan = ref('free');
</script>

<template>
  <input v-model="email" type="email" placeholder="you@example.com" />
  <label><input v-model="agreed" type="checkbox" /> I agree</label>
  <select v-model="plan">
    <option value="free">Free</option>
    <option value="pro">Pro</option>
  </select>
  <p>Signing up {{ email || '…' }} for the {{ plan }} plan.</p>
</template>
```

*What just happened:* `v-model="email"` is sugar for `:value="email"` plus `@input` writing back -
binding in both directions with one attribute. It adapts per element: checkboxes bind the boolean
`checked`, selects bind the chosen `value`. Modifiers ride along here too: `v-model.number` casts
the string input to a number, `v-model.trim` strips whitespace, `v-model.lazy` syncs on change
instead of every keystroke.

Contrast note: this is the controlled-input pattern with the wiring pre-soldered. The trade is the
usual one for sugar - less typing, and one more layer to see through when something misbehaves.
Phase 4 opens the lid and shows exactly what `v-model` expands to, because the same directive works
on your own components once you know its parts.

## Recap

1. `{{ expr }}` for text; `:attr="expr"` for attributes - mustaches never work inside attributes.
2. `@event="handler-or-expression"`, with modifiers (`.prevent`, `.stop`, `@keyup.enter`) for the
   boilerplate.
3. `v-if` unmounts (state dies); `v-show` hides with CSS (state survives). Choose by toggle
   frequency and whether state should persist.
4. `v-for` needs `:key` with stable identity - index keys corrupt row state on reorder/delete.
5. `v-model` = value-down + event-up in one attribute; `.number`, `.trim`, `.lazy` refine it.

```quiz
[
  {
    "q": "A tab panel with a search input inside it is toggled with v-if. Every time the user switches away and back, the typed search is gone. Why?",
    "choices": [
      "v-if clears form fields for security reasons",
      "False v-if unmounts the element - its state is destroyed, not hidden; v-show would preserve it",
      "The input is missing a :key attribute",
      "v-model resets refs when the template re-renders"
    ],
    "answer": 1,
    "why": [
      "There's no security policy involved - unmounting is just what v-if means.",
      null,
      ":key identifies items in lists; a lone input doesn't need one and it wouldn't prevent the unmount.",
      "v-model faithfully reflects the ref - but this input's DOM (and the component state around it) ceased to exist."
    ],
    "explain": "v-if = element removed from the DOM, state and all. For frequently-toggled UI whose state should survive, v-show hides with display:none and keeps everything alive."
  },
  {
    "q": "Why does <img src=\"{{ imageUrl }}\"> show a broken image?",
    "choices": [
      "Mustache syntax doesn't work inside attributes - the browser received the literal text as the URL; it needs :src=\"imageUrl\"",
      "The image path must be absolute in Vue templates",
      "img tags need v-model for dynamic sources",
      "The ref wasn't unwrapped with .value in the template"
    ],
    "answer": 0,
    "why": [
      null,
      "Relative paths work fine once the binding is real.",
      "v-model is for two-way form binding - an image source only flows one way, via :src.",
      "Templates auto-unwrap refs - .value is a script-side concern (phase 3)."
    ],
    "explain": "Interpolation is for text content only. Attributes bind with the : prefix, which evaluates the expression and keeps the attribute in sync."
  }
]
```

---

[← Phase 1: What Vue Actually Is](01-what-vue-actually-is.md) · [Guide overview](_guide.md) · [Phase 3: Reactivity for Real →](03-reactivity-for-real.md)
