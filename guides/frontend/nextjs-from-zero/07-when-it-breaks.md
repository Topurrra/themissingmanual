---
title: "When Next.js Breaks"
guide: "nextjs-from-zero"
phase: 7
summary: "Hydration mismatches, 'use client' demands, serialization walls, window is not defined, and stale pages - the five Next.js failures everyone hits, decoded back to the server/client split."
tags: [nextjs, errors, debugging, hydration-mismatch, window-is-not-defined]
difficulty: intermediate
synonyms: ["nextjs hydration error fix", "text content does not match server rendered html", "window is not defined nextjs", "functions cannot be passed to client components", "nextjs page shows old data"]
updated: 2026-07-18
---

# When Next.js Breaks

Every classic Next.js error is the server/client split from phase 3 poking through the floor. That's
genuinely good news: one mental model explains all five of the messages below, so this phase is
shorter than it looks - it's the same lesson wearing five costumes.

## The cheat-card

| Symptom / message | Almost always means | Fix |
|---|---|---|
| **"Hydration failed" / "text content does not match"** | Server HTML ≠ first client render | Find the nondeterminism: dates, random, locale, browser-only branches; render them after mount |
| **"useState/useEffect only works in a Client Component"** | Hook in a server component | `'use client'` on the *smallest* interactive subtree - not the page |
| **"window is not defined"** | Browser API running during server render | Move into `useEffect`; or `next/dynamic` with `ssr: false` |
| **"Functions cannot be passed directly to Client Components"** | Non-serializable prop crossing the boundary | Pass data, not functions - or make it a server action (phase 5) |
| **Page shows old data after a write** | Missing revalidation | `revalidatePath`/`revalidateTag` in the action (phase 5/6) |
| **Stale in prod, fine in dev** | Static route without a freshness story | `revalidate`, or revalidate-on-write (phase 6) |
| **`useRouter` throws immediately** | Imported from `next/router` in an `app/` project | Import from `next/navigation` (phase 2) |

Three of these deserve the full walk-through.

## Hydration mismatch: the flagship error

The message is alarming and the cause is almost always mundane:

```text
Error: Text content does not match server-rendered HTML.
Server: "Order placed 11/17/2026, 10:03 PM"
Client: "Order placed 17/11/2026, 22:03"
```

Remember hydration (phase 1): the browser re-renders your components and *attaches* to the
server's HTML, trusting they'll produce identical output. Anything that renders differently in the
two environments breaks that trust. The usual suspects:

- **Locale-formatted dates and numbers** - `toLocaleString()` used the server's locale, then the
  user's. (The transcript above: US server, European visitor.)
- **`Date.now()` / `Math.random()`** in render - by definition different on every run.
- **Browser-only branching** - `typeof window !== 'undefined' ? <A/> : <B/>` renders `<B/>` on the
  server and `<A/>` on the client. The check *prevents* the crash and *causes* the mismatch.
- **Invalid HTML nesting** - `<p>` inside `<p>`, `<div>` inside `<p>`: the browser's parser
  silently rearranges the server HTML, and then React's render doesn't match the rearranged DOM.

The standard fix pattern for values only the client can know correctly:

```tsx
'use client';
function LocalTime({ iso }) {
  const [text, setText] = useState(null);            // server and first client render agree: nothing
  useEffect(() => {
    setText(new Date(iso).toLocaleString());         // after mount, browser-only, no mismatch
  }, [iso]);
  return <span>{text ?? '…'}</span>;
}
```

*What just happened:* both environments render the placeholder identically, hydration succeeds,
*then* the effect fills in the locale-correct value. You'll see this pattern (or the
`suppressHydrationWarning` attribute for single unavoidable nodes, like a timestamp in a `<time>`
tag) throughout production Next codebases.

## "window is not defined"

A library (a chart, a map, an editor) reaches for `window` the moment it's imported - and phase 3
told you client components *also* render once on the server. Node has no `window`; the render
crashes before the browser ever gets a chance.

Two fixes, by scope:

```tsx
// Code you control: touch the browser only after mount
useEffect(() => {
  const saved = localStorage.getItem('draft');   // effects never run on the server
  ...
}, []);

// A whole component you don't control: skip its server render entirely
import dynamic from 'next/dynamic';
const Chart = dynamic(() => import('./Chart'), { ssr: false });
```

*What just happened:* `next/dynamic` with `ssr: false` renders nothing for that component on the
server and mounts it client-side only - the escape hatch for browser-bound libraries. Use it
per-component, not per-page; everything around the chart still gets server-rendered HTML.

## The serialization wall

```text
Error: Functions cannot be passed directly to Client Components
unless you explicitly expose it by marking it with "use server".
```

This one's error text is a complete diagnosis: a server component passed `onDelete={someFunction}`
to a client island. Props cross the boundary as *data over the wire* (phase 3), and a closure over
server scope can't be serialized into a browser. The error even names your two options:

- The child needs to trigger *server work* → make the function a **server action** (`'use server'`)
  and pass that - actions are the one function-shaped thing designed to cross (phase 5).
- The child needs *client behavior* → define the handler inside the client component and pass
  plain data (`productId`, not `deleteProduct`) down to it.

## Debugging Next: two habits

- **Ask "where did this code run?" first.** Server terminal log vs browser console log - a
  `console.log` in a server component appears in the terminal where `npm run dev` runs, not in
  DevTools. Knowing which log a line lands in *is* knowing which side of the split it's on, which is
  half of every diagnosis in this phase.
- **Reproduce cache issues in a production build.** Phase 6's rule bears repeating as a debugging
  habit: `npm run build && npm start`. The dev server's always-fresh rendering *cannot* reproduce
  staleness bugs, and DevTools' "Disable cache" checkbox doesn't touch Next's server-side caches.

## Recap

1. Hydration mismatch = server HTML and first client render disagree - hunt locale, time,
   randomness, browser-branches, and invalid nesting; render client-only truths after mount.
2. `window is not defined` = browser API at server-render time - effects for your code,
   `dynamic(..., { ssr: false })` for libraries.
3. Functions don't cross the boundary - server actions or client-local handlers do.
4. Old data after writes = missing revalidation, not a mysterious cache bug.
5. First question, always: which side of the split did this code run on?

```quiz
[
  {
    "q": "A page crashes with a hydration mismatch only for European users. The component renders new Date(order.date).toLocaleString(). What's happening?",
    "choices": [
      "European browsers parse dates differently and throw",
      "The server rendered the date in its own locale; the user's browser re-rendered it in theirs, and the outputs differ",
      "The date arrives as undefined for non-US timezones",
      "toLocaleString is not supported during server rendering"
    ],
    "answer": 1,
    "why": [
      "No browser throws on toLocaleString - the crash is React refusing mismatched HTML, not a parse error.",
      null,
      "The value arrives fine everywhere; it's the formatting of the same value that differs.",
      "It runs fine on the server - using the server's locale, which is precisely the problem."
    ],
    "explain": "Hydration requires identical output in both environments. Locale formatting is environment-dependent, so format after mount (or suppress the warning on that one node)."
  },
  {
    "q": "A server component wants a client-side DeleteButton to remove an item. Passing onDelete={() => db.items.delete(id)} throws a serialization error. The right fix?",
    "choices": [
      "Mark the DeleteButton file 'use server' so the function is allowed",
      "Make the delete a server action and pass that to the button",
      "Stringify the function and eval it client-side",
      "Move the database call into the DeleteButton's onClick"
    ],
    "answer": 1,
    "why": [
      "'use server' marks functions as remotely callable, not components - and the button is client by necessity (it has onClick).",
      null,
      "Eval'ing serialized closures is a security hole and the closure's server scope still wouldn't exist in the browser.",
      "That imports database code into the client bundle - the build fails, and it would expose credentials if it didn't."
    ],
    "explain": "Server actions are the one function-shaped thing designed to cross the boundary: the client gets a reference, invocation runs on the server."
  }
]
```

---

[← Phase 6: Static, Dynamic, and the Cache](06-static-dynamic-and-the-cache.md) · [Guide overview](_guide.md) · [Phase 8: Where to Go Next →](08-where-to-go-next.md)
