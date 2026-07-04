---
title: "The tradeoff"
guide: lazy-loading-explained
phase: 3
summary: "Why deferring work until it's actually needed is one of the cheapest performance wins available, and where it stops paying off."
tags: [performance, lazy-loading, images, code-splitting, frontend]
difficulty: beginner
synonyms:
  - what is lazy loading
  - lazy loading vs eager loading
  - 'loading="lazy" images'
  - code splitting explained
  - defer loading until needed
  - infinite scroll performance
updated: 2026-07-04
---

# The tradeoff

Lazy loading isn't a free performance upgrade you apply everywhere and walk away from. Deferring work means there's a gap between "the page exists" and "this particular piece of it is ready," and that gap is where things go visibly wrong if you're not careful.

## Layout shift: the space where content isn't yet

Imagine a page with lazy-loaded images. Before an image has loaded, the browser doesn't know its dimensions yet — unless you told it. If you didn't, the browser renders the page with zero height where the image will go, and the instant the image arrives, everything below it gets shoved down.

```text
1. Page renders. Image not loaded yet — its <img> tag takes up 0px of height.
2. User starts reading the paragraph that follows.
3. Image finishes loading, snaps in at 400px tall.
4. Everything below jumps down 400px. The paragraph the user was
   reading is now somewhere else on the screen.
```

*What just happened:* the user experienced **layout shift** — content moving after they've already started interacting with the page. This is jarring on a good day and genuinely harmful on a bad one: a shift at the exact moment someone taps a button can make them tap the wrong thing entirely, because whatever was under their finger moved.

The fix is straightforward: reserve the space up front. Set `width` and `height` attributes (or a CSS aspect-ratio) on lazy-loaded images, so the browser blocks out the right amount of space before the image arrives — even though the pixels themselves aren't there yet.

```html
<img src="diagram-12.jpg" alt="Architecture diagram"
     loading="lazy" width="800" height="450">
```

*What just happened:* the browser now knows this image will be 800 by 450, so it reserves that box immediately, before a single byte of the image has downloaded. When the image does arrive, it fills a space that was already there. Nothing else on the page has to move.

> Lazy loading defers the content. It should never defer the space the content will occupy.

## Flash of missing content

A related problem shows up with lazy-loaded code and data rather than images. If a dashboard tab lazy-loads its code, there's a moment between "user clicked the tab" and "the tab's content is ready to show." Handle that moment badly and the user sees a blank panel, or worse, a flash of an error state, before the real content pops in.

```text
bad:   click tab -> blank white panel -> content suddenly appears
better: click tab -> a placeholder that matches the content's shape
                      (a skeleton, a spinner sized to fit) -> content
                      replaces the placeholder in the same spot
```

*What just happened:* the "better" version doesn't make the fetch any faster — it's the same lazy load, the same wait. What changes is that the user isn't staring at an unexplained blank space wondering if something broke. A placeholder that already occupies the right amount of room solves both problems at once: no layout shift when the real content lands, and no confusing gap while it's in flight.

## When eager beats lazy

None of this means "lazy load everything except add a placeholder." Sometimes the right call is to skip lazy loading entirely.

- **Small content.** If an image is a 2 KB icon, the overhead of setting up a scroll observer to decide *when* to load it can cost more than downloading the icon outright would have. Lazy loading pays off when the deferred thing is expensive enough that skipping it (for users who never trigger it) actually matters.
- **Critical above-the-fold content.** Anything the user needs the instant the page appears — the main headline image, the primary call-to-action button's icon, the first few rows of a table they came to read — should load eagerly. Deferring something the user is guaranteed to need immediately only adds a delay with no corresponding benefit, since there was never a chance they wouldn't need it.
- **Content you can't cheaply reserve space for.** If you genuinely cannot predict a lazy-loaded element's size ahead of time (dynamic-height content, for instance), you're trading a slow load for a layout-shift risk. Sometimes eager loading that content — even at the cost of a slightly heavier initial load — is the safer choice than a shift that annoys or misdirects every visitor.

The underlying question is always the same one from Phase 1, asked in the other direction: is there a real chance this won't be needed? If the answer is "no, everyone who loads this page needs this immediately," lazy loading has nothing to offer you — you're adding a deferral mechanism to something that was never optional in the first place.

[← Phase 2: Where you'll actually use it](02-where-youll-use-it.md) | [Overview](_guide.md)
