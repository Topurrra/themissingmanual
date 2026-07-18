---
title: "Angular from Zero - The Full-Framework Deal"
guide: "angular-from-zero"
phase: 0
summary: "What Angular actually is - a complete, TypeScript-first application framework - explained through its modern core: standalone components, signals, dependency injection, and just enough RxJS."
tags: [angular, frontend, signals, typescript, dependency-injection]
category: frontend
order: 5
difficulty: intermediate
synonyms: ["learn angular", "angular tutorial from scratch", "what is angular", "angular signals explained", "angular vs react", "modern angular standalone components"]
updated: 2026-07-18
---

# Angular from Zero - The Full-Framework Deal

Angular's reputation runs a decade behind its reality. The framework people warn you about -
NgModules everywhere, boilerplate for a hello world, RxJS required to display a number - is the
old Angular. The current one boots from a single standalone component, manages state with signals
that look a lot like Vue and Svelte's reactivity, and writes conditionals as readable `@if` blocks.
It's still the most opinionated of the big frameworks - that's its actual identity, not a flaw:
**Angular is the one that ships the whole application architecture in the box**, TypeScript-first,
with a CLI that generates the pieces.

This guide teaches that modern core - and, because you *will* inherit older Angular at work, flags
the legacy dialect at every point where the two differ.

## How to read this

- **In a panic right now?** Jump to [Phase 7: When Angular Breaks](07-when-it-breaks.md) - the
  cheat-card decodes the NG-numbered errors.
- **Want it to finally make sense?** Read in order. Signals (phase 3) and dependency injection
  (phase 5) are the two load-bearing ideas.

## The phases

1. **[What Angular Actually Is](01-what-angular-actually-is.md)** - a framework, not a library:
   what's in the box and what the CLI does.
2. **[Components and Templates](02-components-and-templates.md)** - `@Component`, bindings with
   `[ ]` and `( )`, and the `@if`/`@for` control flow.
3. **[Signals](03-signals.md)** - `signal`, `computed`, and how modern Angular knows what changed.
4. **[Component Inputs and Outputs](04-inputs-and-outputs.md)** - `input()`, `output()`, and
   `model()` for two-way.
5. **[Services and Dependency Injection](05-services-and-di.md)** - Angular's answer to shared
   state and shared logic.
6. **[HTTP and Just Enough RxJS](06-http-and-just-enough-rxjs.md)** - `HttpClient`, observables
   without drowning, and `toSignal`.
7. **[When Angular Breaks](07-when-it-breaks.md)** - NG-numbered errors, missing imports, and
   signal mistakes, decoded.
8. **[Where to Go Next](08-where-to-go-next.md)** - Router, forms, RxJS depth, and what to defer.

> Deliberately deferred to follow-up guides: the Router in depth, reactive forms, NgRx and signal
> stores, SSR/hydration, testing, and RxJS beyond survival level. Core model first.
