---
title: "The Levers That Move the Numbers"
guide: "web-performance-core-web-vitals"
phase: 3
summary: "The fixes that pay: bundle size and code splitting, image optimization, caching and a CDN, killing render-blocking resources, and sizing media so the layout stops jumping."
tags: [performance, web-performance, bundle-size, code-splitting, images, caching, cdn, render-blocking, layout-shift]
difficulty: intermediate
synonyms: ["how to improve core web vitals", "reduce javascript bundle size", "fix layout shift cls", "optimize images for web", "what is a cdn for performance", "render blocking resources fix", "code splitting explained", "make website load faster fixes"]
updated: 2026-06-30
---

# The Levers That Move the Numbers

You've measured. You know which vital is red and you've seen the heavy resources in the waterfall. Now comes the part everyone wants to skip to - the fixes. The good news is there's no thousand-item checklist. A small number of levers account for the overwhelming majority of real wins, and each one maps to a vital you already understand.

The trap here is the same one from [Optimizing Real Systems](/guides/optimizing-real-systems): don't reach for a lever before you've confirmed it's the bottleneck. Shrinking a bundle that was already small, or hand-tuning an image on a page whose problem is the server, is motion without progress. Pull the lever the measurement pointed you at.

Here's the map. Each lever, and the vital it moves:

```text
   LEVER                          MOVES        WHY
   ──────────────────────────────────────────────────────────────
   1. Bundle size / code split    INP, LCP     less JS to parse & run
   2. Image optimization          LCP          the hero is usually the bottleneck
   3. Caching + a CDN             LCP, TTFB    bytes start closer & arrive cached
   4. Kill render-blocking        LCP          let the browser paint sooner
   5. Size your media             CLS          reserve space so nothing jumps
```

*What just happened:* The five levers cover all three vitals, with no overlap you have to memorize. JavaScript weight hurts responsiveness and loading; images and delivery hurt loading; unsized media hurts stability. Match the red vital to its levers and you've narrowed a vague task to one or two concrete moves.

## 1. Bundle size and code splitting

JavaScript is the most expensive kind of byte on the web. An image of the same size only gets decoded; a JavaScript bundle has to be downloaded, *parsed*, *compiled*, and *executed* - all on the main thread, the same thread that handles your user's clicks. That's why a fat bundle wrecks INP and drags LCP: while the browser chews through your JS, it can't paint and it can't respond.

The first move is to **ship less**. Audit what's in the bundle (most bundlers have an analyzer), drop dependencies you don't need, and prefer a small library over a kitchen-sink one. A surprising amount of bundle weight is a date library or a UI kit you use one function from.

The second move is **code splitting**: instead of one giant bundle the user downloads up front, break it into pieces and load each piece only when it's needed.

```text
   BEFORE: one bundle, everything up front
   app.bundle.js  ▕████████████████████████▏  480 kB  ← user waits for ALL of it

   AFTER: split by route, load on demand
   home.js        ▕████▏                         80 kB  ← only this loads on the home page
   checkout.js    ▕██████▏          (loaded later, only when they visit checkout)
   admin.js       ▕████████▏        (most users never load this at all)
```

*What just happened:* The home page now ships 80 kB instead of 480 kB, because the checkout and admin code load lazily, only when a user actually goes there. Many users never touch those routes, so that code is work you never do for them - the "do less work" principle, applied to bytes. Less JavaScript up front means faster parsing, a faster first paint (LCP), and a main thread free to handle clicks (INP).

## 2. Images - usually your LCP element

On most content pages the largest contentful element is an image: the hero, the product shot, the article header. That means image weight *is* your LCP. The fixes are well-trodden and they stack:

- **Compress and resize.** Don't ship a 3000-pixel-wide image into a 800-pixel-wide slot. Resize to the size actually displayed and compress it. This alone often cuts an image to a fraction of its weight.
- **Use a modern format.** WebP and AVIF deliver the same visual quality as JPEG/PNG at much smaller sizes. Serving AVIF or WebP with a JPEG fallback is one of the highest-leverage single changes for LCP.
- **Serve responsive sizes.** Use `srcset` so phones get a small image and big screens get a big one, instead of everyone downloading the desktop version.
- **Don't lazy-load the LCP image.** Lazy-loading is great for images *below* the fold, but lazy-loading the hero delays the very element LCP is timing. Load that one eagerly, even prioritize it.

```text
   hero.jpg  (3000px, unoptimized JPEG)   1,800 kB   ← the LCP killer from Phase 2
        │  resize to displayed size (1200px)
        │  convert to AVIF
        ▼
   hero.avif (1200px)                       110 kB   ← ~16× smaller, same apparent quality
```

*What just happened:* The same hero went from 1.8 MB to roughly 110 kB by resizing it to the size it's actually shown at and switching to a modern format. On a slow connection that's the difference between a multi-second LCP and a fast one - and it's the single change most likely to move the needle on an image-heavy page.

## 3. Caching and a CDN

Two different "where do the bytes come from" wins, and they compound.

**Caching** tells the browser to keep a copy of a resource so the *next* visit doesn't re-download it. You do this with HTTP cache headers (`Cache-Control`). For files that never change - your hashed JS and CSS bundles, images - you can cache them for a long time. The user's second visit, and every page-to-page navigation, loads those from disk instead of the network: effectively zero load time.

**A CDN** (Content Delivery Network) puts copies of your static files on servers physically close to your users, all over the world. Instead of every byte traveling from your one origin server in, say, Virginia, a user in Tokyo gets it from a Tokyo edge node. Less distance means lower latency, which improves TTFB and LCP - and CDNs cache aggressively, taking load off your origin.

```text
   WITHOUT CDN                         WITH CDN
   user (Tokyo) ───────────────▶       user (Tokyo) ──▶ edge (Tokyo)  ⚡ fast
        origin (Virginia)                                   │ (only on a miss)
        ~150 ms each way                                     ▼
                                                        origin (Virginia)
```

*What just happened:* The CDN moves the bytes geographically closer, so most requests are answered by a nearby edge node in a few milliseconds instead of crossing an ocean. Caching and a CDN are the cheapest LCP/TTFB wins for a global audience precisely because, like all caching, they delete work rather than speed it up - the request that hits a warm edge cache barely touches your servers at all.

## 4. Kill render-blocking resources

When the browser parses your HTML and hits a `<link>` to a stylesheet or a synchronous `<script>` in the `<head>`, it can stop and wait - fetching and processing that resource *before* it paints anything. A few of these stacked in the head is a blank screen the user stares at. That's render-blocking, and it's a direct hit to LCP.

The fixes:

- **Defer non-critical JavaScript.** Add `defer` (or `async`) to scripts so the browser keeps parsing and painting instead of blocking on them. Most scripts don't need to run before first paint.
- **Inline the critical CSS, defer the rest.** Ship the small amount of CSS needed to render what's visible immediately, and load the big stylesheet without blocking.
- **Trim what loads in the head at all.** Every blocking resource is a gate between the user and the first paint. Move what you can out of the way.

```html
<!-- Render-blocking: browser waits for this before painting -->
<script src="analytics.js"></script>

<!-- Non-blocking: browser keeps painting, runs the script after -->
<script src="analytics.js" defer></script>
```

*What just happened:* Adding `defer` tells the browser it doesn't need this script before showing the page, so the script downloads in the background and runs after the document is parsed. Analytics, chat widgets, and most third-party scripts have no business blocking the first paint - defer them and LCP improves with no visible downside.

## 5. Size your media - the CLS fix

CLS comes almost entirely from elements that arrive without having reserved their space, so when they appear they shove everything else. The fix is to tell the browser how big they'll be *before* they load, so it holds the space open.

- **Always set `width` and `height` on images** (or a CSS `aspect-ratio`). The browser reserves a box of the right shape immediately, and the image fills it without pushing anything.
- **Reserve space for ads, embeds, and dynamic content.** Give the slot a fixed min-height so a late-arriving banner drops into held-open space instead of inserting itself.
- **Avoid inserting content above existing content.** A cookie banner or notification that pushes the page down after the user starts reading is a classic CLS spike.

```html
<!-- No reserved space: when this loads, everything below it JUMPS down -->
<img src="hero.avif" alt="...">

<!-- Reserved space: browser holds a 1200×600 box, nothing shifts -->
<img src="hero.avif" alt="..." width="1200" height="600">
```

*What just happened:* With explicit dimensions, the browser knows the image's aspect ratio before a single byte of it arrives, so it lays out the page correctly the first time and the image simply fills its waiting box. No jump, no CLS. This one attribute is the highest-leverage CLS fix there is, and it costs nothing.

## Recap

1. **Bundle size and code splitting** - JS is the most expensive byte; ship less and load the rest on demand. Moves INP and LCP.
2. **Images** - the hero is usually the LCP element; resize, compress, use AVIF/WebP, and don't lazy-load it. Moves LCP.
3. **Caching and a CDN** - cache immutable assets and serve from edges near the user; this deletes work rather than speeding it. Moves LCP and TTFB.
4. **Kill render-blocking resources** - `defer` non-critical scripts and tame head CSS so the browser paints sooner. Moves LCP.
5. **Size your media** - set width/height and reserve space so nothing jumps. Moves CLS.

The throughline is the one from the rest of performance: **measure first, pull the lever the measurement pointed at, then confirm the win in field data.** A page that loads its main content fast, holds still while it does, and responds the instant you touch it - that's not a vibe. It's three numbers you now know how to read and move.

```quiz
[
  {
    "q": "Why is JavaScript considered the most expensive kind of byte for performance, hurting both INP and LCP?",
    "choices": [
      "It's always the largest file on the page",
      "It must be downloaded, parsed, compiled, and executed on the main thread - the same thread that paints and handles clicks",
      "Browsers refuse to cache JavaScript",
      "It can't be compressed"
    ],
    "answer": 1,
    "explain": "Unlike an image that's merely decoded, JS occupies the main thread to parse, compile, and run. While it does, the browser can't paint (LCP) or respond to input (INP)."
  },
  {
    "q": "Your LCP element is the hero image. Which change is the LEAST helpful for LCP?",
    "choices": [
      "Resizing it to the size actually displayed and converting to AVIF",
      "Adding lazy-loading to the hero image",
      "Serving it from a CDN edge near the user",
      "Removing a render-blocking script in the head"
    ],
    "answer": 1,
    "explain": "Lazy-loading is for below-the-fold images. Lazy-loading the LCP element delays the very thing LCP measures - load the hero eagerly, even prioritize it."
  },
  {
    "q": "Adding width and height attributes to your images primarily improves which vital, and why?",
    "choices": [
      "INP, because it reduces JavaScript",
      "LCP, because the image downloads faster",
      "CLS, because the browser reserves the correct space so content doesn't jump when the image loads",
      "TTFB, because the server responds sooner"
    ],
    "answer": 2,
    "explain": "Knowing the dimensions up front lets the browser hold open a correctly-shaped box, so the image fills it without shoving anything - eliminating the layout shift that drives CLS."
  }
]
```

---

[← Phase 2: Measuring What Users Feel](02-measuring-what-users-feel.md) · [Overview](_guide.md)
