---
title: "When You Don't Need a Framework Yet"
guide: "choosing-your-first-framework"
phase: 3
summary: "Sometimes the standard library is enough for what you're building - the plain alternative to picking a framework, and why knowing that boundary matters more than picking fast."
tags: [frameworks, standard-library, node-http, net-http, beginner]
difficulty: beginner
synonyms: ["do i need a framework", "build a server without a framework", "net http vs framework", "node http vs express", "when to skip a framework"]
updated: 2026-07-11
---

# When You Don't Need a Framework Yet

Phase 2 gave a starting framework for every major language. Here's the plain exception: for some
of what you're building, you don't need any of them yet.

## The standard library already does a lot

Most languages ship an HTTP server in the box. Python has `http.server`, Go and C# both have
production-usable HTTP stacks in their standard libraries, Node has the `http` module underneath
every framework built on it. None of these are toys - they can route a request, read a body, and
send a response with no framework at all.

Two guides in this library build a real server directly on the standard library, no framework in
sight: [Build a Server with Node's http Module](/guides/build-a-server-with-node-http) and
[Web Services with Only net/http](/guides/web-services-with-only-net-http). Both are worth doing
even if you already picked a framework in Phase 2 - they show you what the framework is actually
doing underneath.

## Where the line actually sits

A framework earns its cost when the app is big enough, long-lived enough, or team-shaped enough
that its conventions save more time than they take to learn. Below that line, the standard library
alone is the better call:

- **A single-endpoint tool** - a webhook receiver, a health-check ping, a small script that needs
  one route. A framework's routing, middleware stack, and config system solve a problem you don't
  have yet.
- **Learning what's underneath a framework you already use.** Building the same small server twice
  - once raw, once in your Phase 2 framework - is the fastest way to see exactly what the framework
  buys you, instead of taking it on faith.
- **A throwaway or short-lived project.** If it won't outlive the afternoon, the framework's setup
  cost outweighs anything it would have saved you.

Outside those cases, a framework usually wins - once real routes, real middleware needs, and a real
team show up, hand-rolling the same things a framework gives you for free stops being a good trade.

## Why the boundary matters more than the pick

[What a Framework Even Is](/guides/what-a-framework-even-is) covers this cost directly in its
["Price of Magic"](/guides/what-a-framework-even-is/5) material - every convenience a framework
adds is also a thing you now depend on and don't fully see. That's a fair trade for a real
application. It's a bad trade for a script that needed ten lines.

Knowing when to skip a framework is not a lesser skill than knowing which one to pick. It's the
same judgment pointed the other way - it separates someone who reaches for a framework by reflex
from someone who reaches for the right tool for the job.

## Where this leaves you

Pick your language, pick the framework from Phase 2, build something real in it, and finish it.
If what you're building is small enough that a framework feels like more setup than the problem
deserves, reach for the standard library instead. Either way, the roots guide for your stack shows
you what the code is actually doing when nobody's watching.

```quiz
[
  {
    "q": "What do the 'roots' guides in this library (build-a-server-with-node-http, web-services-with-only-net-http) demonstrate?",
    "choices": [
      "That standard libraries can't handle real HTTP traffic",
      "That a real server can be built directly on the standard library, with no framework at all",
      "That every framework is built on Node specifically",
      "That frameworks are always faster than the standard library"
    ],
    "answer": 1,
    "explain": "Both guides build a working server using only the language's standard library - proof that a framework is a choice, not a requirement, for getting an HTTP server running."
  },
  {
    "q": "According to this phase, when does skipping a framework make the most sense?",
    "choices": [
      "Never - always use a framework regardless of project size",
      "For a single-endpoint tool, a throwaway script, or when you want to see what a framework is doing underneath",
      "Only when the language has no framework ecosystem at all",
      "Only for enterprise-scale applications"
    ],
    "answer": 1,
    "explain": "Small, short-lived, or single-route projects rarely earn back a framework's setup cost. The standard library also makes a good teaching tool for seeing what a framework abstracts away."
  },
  {
    "q": "Why does this guide say knowing when to SKIP a framework matters as much as knowing which one to pick?",
    "choices": [
      "Because frameworks are being deprecated industry-wide",
      "Because it's the same judgment about cost versus benefit, just pointed the other way - reaching for the right tool instead of reaching by reflex",
      "Because standard libraries are always faster than frameworks",
      "Because most professional applications are built without frameworks"
    ],
    "answer": 1,
    "explain": "Every framework convenience is also a dependency you don't fully see (the 'Price of Magic'). That's worth it for a real, long-lived app and not worth it for a ten-line script - recognizing which situation you're in is the actual skill."
  }
]
```

---

[← Phase 2: A Starting Point, Language by Language](02-a-starting-point-language-by-language.md) · [Guide overview](_guide.md)
