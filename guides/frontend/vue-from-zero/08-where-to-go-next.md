---
title: "Where to Go Next"
guide: "vue-from-zero"
phase: 8
summary: "The Vue ecosystem is unusually official: Vue Router for pages, Pinia for shared state, Nuxt for the server side - each adopted when its specific pain appears, none required on day one."
tags: [vue, ecosystem, vue-router, pinia, nuxt, learning-path]
difficulty: intermediate
synonyms: ["what to learn after vue basics", "vue router or nuxt", "do i need pinia", "vue ecosystem overview", "vue roadmap"]
updated: 2026-07-18
---

# Where to Go Next

Vue's ecosystem has a property worth appreciating before you dive in: the core pieces are
*official*. Router, state management, dev tools, and the meta-framework all ship from the Vue team
or its inner orbit, documented in one voice, designed to fit together. Less decision fatigue than
some neighborhoods of the frontend world - but the same rule applies: adopt each piece when its
pain arrives, not because a list said so.

## What you can already build

Phases 1-7 cover components, reactivity, forms, composition, and data fetching - a complete
single-view application skillset. Build two or three real things with exactly this before adding
tools: a expense tracker, a recipe box, a small dashboard against a public API. The pains you hit
(or don't) are the syllabus for everything below.

## The map: pain → tool

| When you feel this | Reach for | What it is |
|---|---|---|
| "I need URLs, pages, and back-button behavior" | **Vue Router** | The official client-side router: paths mapped to components, nested layouts, guards |
| "Distant components keep needing the same changing state" | **Pinia** | The official store: reactive state + actions in one place, DevTools-integrated |
| "I need SEO, fast first paint, or a server" | **Nuxt** | The Vue meta-framework: server rendering, file-based routing, data conventions |
| "My fetch logic repeats: loading, errors, caching, refetching" | **TanStack Query (Vue)** or Nuxt's data layer | Server-data management over hand-rolled fetch effects |
| "I want ready-made accessible components" | **PrimeVue, Vuetify, or Radix Vue** | Component libraries - pick by design taste, check accessibility claims |
| "I keep re-writing the same composable" | **VueUse** | A large collection of well-tested composables (debounce, storage, sensors) |

Two notes on the big ones:

**Pinia, sized fairly.** A Pinia store is close to something you already know: a composable with
hoisted state (phase 5's "refs at module scope" aside, formalized). If `provide`/`inject` plus a
composable is holding up fine, you're not behind - Pinia earns its place when shared state grows
update logic, needs DevTools history, or is touched from many corners.

**Nuxt, sized fairly.** Nuxt is to Vue what Next is to React: rendering on a server for SEO and
first paint, file-based routing, and a data-fetching layer - plus more convention (auto-imports,
directory structure) than base Vue. The reasoning in our
[Next.js guide's opening phase](../nextjs-from-zero/01-what-nextjs-actually-is.md) - what a SPA
costs you and when a server fixes it - transfers to Nuxt nearly word for word. Same decision, Vue
vocabulary.

## Options API code in the wild

You will inherit components written in the older dialect - `data()`, `methods:`, `computed:` as
object sections, `this.count` everywhere. Translation is mechanical once you know both sides:
`data` fields are refs, `methods` are functions, `computed:` entries are `computed()`, lifecycle
options (`mounted()`) are the `on*` hooks, and `this.x` becomes the direct reference. No rewrite
crusades required - the two dialects interoperate component-by-component, and understanding old
code is cheaper than churning it.

## Additional resources

- [vuejs.org](https://vuejs.org) - the official docs, among the best-written in frontend; the
  tutorial track mirrors this guide's arc with runnable examples.
- [pinia.vuejs.org](https://pinia.vuejs.org) - short, worth reading even before you need a store,
  for its state-design opinions.
- [VueUse](https://vueuse.org) - browse it once to calibrate what composables can be; read a few
  sources - they're compact masterclasses in phase 5's pattern.

## Recap

1. Router, Pinia, Nuxt: official, documented together, adopted separately - each on its own pain.
2. Pinia ≈ composables with formal shared state; skip until sharing hurts.
3. Nuxt is the Vue answer to the SPA costs our Next guide's phase 1 lays out - same trade, same
   reasoning.
4. Options API is legacy dialect, not legacy framework: read it fluently, migrate opportunistically.

```quiz
[
  {
    "q": "An app's theme, current user, and a 40-line cart with add/remove/discount logic are all shared via provide/inject. Which piece most clearly wants a Pinia store?",
    "choices": [
      "The theme - it's read everywhere",
      "The cart - shared state with real update logic and history worth inspecting",
      "The current user - it's the most sensitive data",
      "All three equally"
    ],
    "answer": 1,
    "why": [
      "Widely-read, rarely-changed, no logic: the provide/inject sweet spot - moving it buys nothing.",
      null,
      "Sensitivity is an auth concern, not a state-tool concern - a store adds no security.",
      "Theme and user are fine where they are; migrating them is churn without payoff."
    ],
    "explain": "Stores earn their keep where shared state meets update logic - actions, DevTools history, many writers. Simple broadcast context stays happily in provide/inject."
  },
  {
    "q": "When does moving from Vue+Vite to Nuxt become the right call?",
    "choices": [
      "Once an app exceeds roughly twenty components",
      "When you need what a server adds: SEO-ready HTML, fast first paint, server-side data access",
      "Nuxt is the current default; new Vue projects should start there",
      "When you want to use composables"
    ],
    "answer": 1,
    "why": [
      "Component count measures size, not architecture - a 200-component dashboard behind a login is still a fine SPA.",
      null,
      "For public content sites that's arguable - but as a blanket rule it ignores the SPA cases where a server buys nothing.",
      "Composables are core Vue - available everywhere, framework or not."
    ],
    "explain": "Nuxt is the server-in-front decision, Vue edition: adopt it for the SPA costs it eliminates (blank first paint, crawler-invisible content, exposed data layer), not as a default."
  }
]
```

---

[← Phase 7: When Vue Breaks](07-when-it-breaks.md) · [Guide overview](_guide.md)
