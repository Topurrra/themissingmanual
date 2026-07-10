---
title: "Where you'll actually use it"
guide: lazy-loading-explained
phase: 2
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
updated: 2026-07-10
---

# Where you'll actually use it

The principle from Phase 1 is nice to understand, but you'll meet it in three concrete shapes almost every week: images below the fold, code that only some visitors need, and lists that never show everything at once. None of these require a library or a clever algorithm — each one is a small, standard pattern.

## Images below the fold

"Below the fold" means anything not visible without scrolling. A blog post's hero image is above the fold; the diagram in paragraph twelve is below it. Browsers now support lazy loading images natively, with one attribute:

```html
<img src="hero.jpg" alt="Product hero shot">

<!-- further down the page -->
<img src="diagram-12.jpg" alt="Architecture diagram" loading="lazy">
```

*What just happened:* the hero image loads immediately, the way it always did — it's visible right away, so eager is correct for it. The diagram gets `loading="lazy"`, which tells the browser to skip fetching it until the user scrolls close enough that it's about to become visible. No JavaScript, no library — the browser does the scroll-position tracking for you.

A rule of thumb: put `loading="lazy"` on images that start off-screen, and leave the first screenful of images without it. Lazy-loading something the user sees instantly gains you nothing and can even cost you (more on that in Phase 3).

## Route-based code-splitting

A web app with ten pages doesn't need all ten pages' JavaScript before it can show page one. **Code-splitting** breaks the app's code into chunks per route, and a dynamic `import()` fetches a chunk only when that route is visited.

```js
// eager: the settings page's code is bundled into the initial load
import SettingsPage from "./SettingsPage.js";

// lazy: the settings page's code is only fetched when this function runs
function loadSettingsPage() {
  return import("./SettingsPage.js");
}
```

*What just happened:* in the eager version, every visitor downloads `SettingsPage.js` whether they open settings or not. In the lazy version, `import("./SettingsPage.js")` is a function call that returns a promise — the browser only requests that file the first time a route or click triggers it, so a visitor who only looks at the home page never downloads it at all. Most modern frontend frameworks build this pattern in at the router level, so you often just mark a route as lazy and the framework handles the `import()` for you.

## Infinite scroll and "load more"

A feed with ten thousand posts doesn't render ten thousand posts on page load. It renders a first batch — twenty, say — and fetches the next batch only once the user is close to the bottom, or clicks "load more."

```text
1. Render posts 1-20.
2. User scrolls near the bottom of post 20.
3. Fetch posts 21-40, append them.
4. Repeat as the user keeps scrolling.
```

*What just happened:* the server and the client agreed to hand over data in small pieces instead of one enormous response. The trigger differs from images (scroll proximity to an element vs. scroll proximity to the bottom of the list), but the underlying move is identical: wait for a concrete signal, then fetch the next piece. A "load more" button is the same pattern with a click instead of a scroll position as the trigger — some products prefer it because it puts the user in control of when the next fetch happens, rather than firing it automatically.

## The common shape across all three

Each of these patterns follows the same three-part structure:

```text
1. Something visible and immediately needed loads eagerly (the hero image,
   the current route, the first batch of posts).
2. Everything else waits behind a trigger (scroll proximity, a route
   change, reaching the end of the current batch).
3. The trigger fires, the work happens, and from the user's perspective
   it should feel like it was there all along.
```

*What just happened:* that third point is doing a lot of work, and it's the subject of Phase 3. Lazy loading only feels invisible when the timing is right — trigger the fetch a little too late, and the user notices the wait. Get it wrong in a specific way, and you get a worse problem than a wait: content that jumps around after it finally arrives.

[← Phase 1: Don't do work nobody asked for yet](01-dont-do-work-nobody-asked-for.md) | [Overview](_guide.md) | [Phase 3: The tradeoff →](03-the-tradeoff.md)
