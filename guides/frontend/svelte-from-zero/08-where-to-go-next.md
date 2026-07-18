---
title: "Where to Go Next"
guide: "svelte-from-zero"
phase: 8
summary: "SvelteKit is the one big next step - routing, server loading, form actions; the rest of the ecosystem is smaller than React's on purpose, and transitions are the built-in treat worth learning early."
tags: [svelte, sveltekit, ecosystem, transitions, learning-path]
difficulty: intermediate
synonyms: ["what to learn after svelte basics", "sveltekit overview", "svelte ecosystem", "svelte transitions", "svelte roadmap"]
updated: 2026-07-18
---

# Where to Go Next

Svelte's ecosystem map is shorter than React's or Vue's, and that's a feature with a reason: more
of what you need ships in the box. State management is runes and modules (phase 5). Scoped styles
are built in. Animation is built in. The one genuinely big next step is **SvelteKit** - and since
your scaffold from phase 1 was already a SvelteKit project, you're closer than you think.

## What you can already build

Phases 1-7 are a complete component-layer skillset. Before adding anything, build two or three real
things: the pains you meet are the only trustworthy tool-selection criteria - the same advice we
give in every framework guide, and it compounds here because Svelte's box already covers so much.

## SvelteKit: the server-in-front decision, Svelte edition

SvelteKit is to Svelte what Next is to React and Nuxt is to Vue: file-based routing, rendering on
a server for first paint and SEO, and a data layer. The *reasoning* for when you need one is
framework-independent - our [Next.js guide's opening phase](../nextjs-from-zero/01-what-nextjs-actually-is.md)
lays out the SPA costs and the server's answer; it transfers here wholesale. What's worth noting
is SvelteKit's own vocabulary, so the docs feel familiar when you arrive:

| Concept | SvelteKit spelling |
|---|---|
| A page | `src/routes/about/+page.svelte` |
| Its server-side data | `+page.server.js` exporting `load()` - the page receives `data` as a prop |
| Layouts | `+layout.svelte`, nested by folder like everything else |
| Form handling | **form actions** in `+page.server.js` - progressively-enhanced POST handlers |
| API endpoints | `+server.js` exporting `GET`/`POST` |
| Static/dynamic/prerender | `export const prerender = true` and friends per route |

Two connect-the-dots from what you know: `load()` is phase 4-6's fetch discipline moved
server-side (the `{#await}` machinery mostly dissolves - data arrives as a prop), and form
actions are the phase-3 form patterns with the server round-trip handled. This site serves every
guide page you've been reading through exactly this machinery - server-rendered, then hydrated.

## The built-in treat: transitions

Most frameworks outsource animation; Svelte ships it, and it's genuinely one of the nicest parts
of the box:

```html
<script>
  import { fade, fly } from 'svelte/transition';
  let visible = $state(true);
</script>

{#if visible}
  <p transition:fly={{ y: 20, duration: 200 }}>Now you see me.</p>
{/if}
```

*What just happened:* the element animates in when the `{#if}` turns true and out when it turns
false - enter and exit both, from one attribute, compiled like everything else. `fade`, `fly`,
`slide`, `scale` cover dailies; `animate:flip` smooths list reorders in keyed each blocks. A
follow-up guide could go deep; for now, know that "animate this appearing" is one directive, not a
library decision.

## The (short) map: pain → tool

| When you feel this | Reach for |
|---|---|
| URLs, SEO, server data, forms | **SvelteKit** - the one big step |
| Ready-made accessible components | **Bits UI / Melt UI** (headless), **Flowbite Svelte**, or **shadcn-svelte** |
| Repetitive fetch caching/refetching | **TanStack Query (Svelte)** - same library, Svelte adapter |
| Legacy store-based code and libraries | The `svelte/store` docs - an afternoon of reading (phase 5's table) |
| Type-checking components | TypeScript - `lang="ts"` and type `$props()`; the compiler's analysis gets even sharper |

What's deliberately absent from this table: a state-management library (runes + modules already
are one) and a CSS-in-JS pick (scoped styles are native). Smaller ecosystem, but also less
ecosystem *required* - a fair trade to weigh against React's larger job market and library
catalog, which remains the strongest argument on the other side.

## Additional resources

- [svelte.dev/docs](https://svelte.dev/docs) - official docs, runes-first; the interactive
  tutorial at [svelte.dev/tutorial](https://svelte.dev/tutorial) is among the best in the industry
  and covers transitions properly.
- [SvelteKit docs](https://svelte.dev/docs/kit) - read "Routing" and "Loading data" first; that's
  80% of daily Kit.
- [Bits UI](https://bits-ui.com) - headless accessible components; a good first dependency when
  you outgrow hand-rolled dialogs.

## Recap

1. SvelteKit is the one big next step - the server-in-front decision with Svelte vocabulary:
   `+page.svelte`, `load()`, form actions.
2. Transitions ship in the box and are worth twenty minutes early - enter/exit animation as a
   directive.
3. The ecosystem is short on purpose: state, styling, and animation are built in; add UI kits and
   a data layer when their pains arrive.
4. TypeScript sharpens an already-compiler-centric workflow - type your `$props()` at minimum.

```quiz
[
  {
    "q": "Coming from this guide, what does SvelteKit's load() function largely replace?",
    "choices": [
      "The $state rune for page-level data",
      "The component-side fetch patterns - onMount fetches and {#await} blocks - by delivering data to the page as a prop, fetched server-side",
      "The need for +page.svelte files",
      "Svelte's compiler"
    ],
    "answer": 1,
    "why": [
      "$state remains the tool for interactive state - load() feeds pages their initial data.",
      null,
      "Pages remain components - load() is the data half beside them.",
      "Kit builds on the same compiler; nothing replaces it."
    ],
    "explain": "load() moves data fetching server-side and hands the result to the page as a prop - the loading/error choreography of client-side fetching mostly dissolves, with SEO and first-paint benefits included."
  },
  {
    "q": "A designer asks for list items to animate in when added and out when removed. In Svelte, what's the realistic effort estimate?",
    "choices": [
      "A day - pick and integrate an animation library",
      "Minutes - transition: directives handle enter/exit, animate:flip smooths reorders, all built in",
      "It requires SvelteKit",
      "Only possible with CSS keyframes written by hand"
    ],
    "answer": 1,
    "why": [
      "That's the estimate in ecosystems where animation is a dependency decision - here it's shipped.",
      null,
      "Transitions are core Svelte - no Kit involved.",
      "The directives generate the CSS for you; hand-rolling remains an option, not a requirement."
    ],
    "explain": "transition:fly / fade on the element inside the keyed each block, animate:flip for reorder smoothing - enter and exit animation is a language feature here, not a library."
  }
]
```

---

[← Phase 7: When Svelte Breaks](07-when-it-breaks.md) · [Guide overview](_guide.md)
