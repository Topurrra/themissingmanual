---
title: "Where to Go Next"
guide: "nextjs-from-zero"
phase: 8
summary: "Deployment options weighed plainly, the built-in metadata/image/font optimizations worth switching on, and which parts of the Next ecosystem to defer until a real need shows up."
tags: [nextjs, deployment, metadata, seo, learning-path]
difficulty: intermediate
synonyms: ["deploy nextjs app", "nextjs metadata api", "nextjs self hosting vs vercel", "next image optimization", "what to learn after nextjs basics"]
updated: 2026-07-18
---

# Where to Go Next

You have the whole load-bearing structure now: a server in front of React, files as routes, the
server/client split, data reads that await, writes that revalidate, and a cache you can reason
about. What's left is the supporting cast - deployment, the built-in optimizations, and a short
list of things you're allowed to ignore until they're needed.

## Shipping it

`next build` produces an app that needs Node to run (`next start`) - unless every route came out
static, this isn't a folder of files you can drop on any static host. The options, plainly:

| Option | The deal |
|---|---|
| **Vercel** | Zero-config, made by the Next team, generous free tier. The trade: pricing at scale and platform coupling are the things to keep an eye on. |
| **Your own server / container** | `output: 'standalone'` in the config produces a self-contained build; run it with Node or Docker anywhere. All features work - you own scaling, caching infrastructure, and updates. |
| **Static export** | `output: 'export'` emits plain HTML/CSS/JS for static hosts - and disables everything requiring the server: actions, dynamic rendering, revalidation, image optimization. Only fits fully-static sites, at which point plain React + Vite deserved a second look. |

No righteous answer: a side project's calculus differs from a company's. The one non-negotiable is
knowing *which* features your deployment target supports before you build around them.

## Metadata: the SEO layer

Phase 1 promised crawlers real HTML; metadata is the other half of being findable. In the App
Router it's an export, not a component:

```tsx
// static pages: an object
export const metadata = {
  title: 'Handmade kettles - TeaWorks',
  description: 'Small-batch kettles, shipped worldwide.',
};

// dynamic pages: a function that can await the same data as the page
export async function generateMetadata({ params }) {
  const { id } = await params;
  const product = await db.product(id);       // deduplicated with the page's own fetch
  return { title: `${product.name} - TeaWorks`, description: product.blurb };
}
```

*What just happened:* Next renders these into `<head>` - title, description, and (via the
`openGraph` field) the social-share card data. `generateMetadata` runs server-side with full data
access, so every product page gets a real title without client tricks. Titles compose through
layouts too - a `template: '%s - TeaWorks'` in the root layout suffixes every child page.

## The built-in optimizations worth adopting early

- **`next/image`** - the `<Image>` component resizes, converts to modern formats, lazy-loads, and
  (the quietly important part) reserves layout space so images don't shove the page around while
  loading. Requires `width`/`height` (or `fill`) for exactly that reason.
- **`next/font`** - self-hosts fonts at build time: no request to a fonts CDN, no layout shift from
  late-arriving type, fonts served from your own origin.
- **`next/script`** - the `strategy` prop (`lazyOnload`, `afterInteractive`) keeps third-party
  scripts from blocking your page.

None of these is conceptually deep - they're defaults-done-right wrappers. Adopting them early
costs minutes; retrofitting them across a grown codebase costs a sprint.

## Ignorable until proven necessary

The remaining surface of Next, ranked by how safely you can defer it:

- **Middleware** - code that runs before routing on every request (auth gates, redirects, A/B
  splits). Powerful, easy to overuse; wait for a cross-cutting request-level need.
- **Parallel & intercepting routes** - advanced routing for split-pane and modal-over-page UIs.
  Genuinely clever; genuinely rare.
- **Edge runtime** - running routes on CDN-edge workers with a restricted API. A latency
  optimization with real constraints; measure before adopting.
- **Turbopack, PPR, and whatever this year's acronym is** - build-pipeline and rendering
  refinements arrive constantly. Your mental model from phases 1-7 is the durable part; let release
  notes be release notes.

## Additional resources

- [nextjs.org/docs](https://nextjs.org/docs) - the official docs; the "App Router" section maps
  one-to-one onto this guide's phases and goes deeper on each.
- [nextjs.org/learn](https://nextjs.org/learn) - the official hands-on course; a good next week of
  practice.
- [React from Zero, phase 9](../react-from-zero/09-where-to-go-next.md) - the client-side ecosystem
  map (TanStack Query, state stores) applies unchanged inside Next's client components.

## Recap

1. Deployment is a real decision: Vercel for zero-config, `standalone` for own-infrastructure,
   `export` only for fully-static sites.
2. The `metadata` export / `generateMetadata` function is the SEO layer - server-rendered, with
   data access, composed through layouts.
3. Adopt `next/image` and `next/font` from day one; they're cheap now and expensive later.
4. Middleware, parallel routes, edge, and the acronym-of-the-year can all wait for a demonstrated
   need.

```quiz
[
  {
    "q": "A team picks output: 'export' for static hosting, then finds their contact form's server action doesn't run. Why?",
    "choices": [
      "Static exports require forms to use route handlers instead",
      "Static export produces only files - there is no server, and actions need one",
      "The action was missing revalidatePath",
      "Server actions require Vercel"
    ],
    "answer": 1,
    "why": [
      "Route handlers are server code too - they're equally absent from a static export.",
      null,
      "revalidatePath governs cache freshness after a write; here the write can't execute at all.",
      "Actions run on any Node host - the constraint is having a server, not a vendor."
    ],
    "explain": "Everything from phases 4-6 that involved 'the server' - actions, dynamic rendering, revalidation - requires one to exist. output: 'export' trades all of it for static-host simplicity."
  },
  {
    "q": "Product pages need correct titles and social-share cards per product. Where does that belong?",
    "choices": [
      "A useEffect setting document.title after mount",
      "A generateMetadata function on the product page, fetching the product server-side",
      "A Head component rendered inside each page's JSX",
      "meta tags hardcoded in the root layout"
    ],
    "answer": 1,
    "why": [
      "Effects run after hydration in the browser - social-card scrapers and many crawlers never see the result.",
      null,
      "That's the Pages Router pattern (next/head); the App Router replaced it with the metadata exports.",
      "The root layout can only hold site-wide defaults - per-product values need per-page generation."
    ],
    "explain": "generateMetadata runs on the server with data access, so the title and OG tags are in the HTML itself - which is the only place scrapers reliably look."
  }
]
```

---

[← Phase 7: When Next.js Breaks](07-when-it-breaks.md) · [Guide overview](_guide.md)
