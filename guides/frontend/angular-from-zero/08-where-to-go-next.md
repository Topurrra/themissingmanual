---
title: "Where to Go Next"
guide: "angular-from-zero"
phase: 8
summary: "The Router and reactive forms are the two in-box systems worth learning next; RxJS depth, NgRx, and SSR wait for their pains - and Angular Material is the default UI answer most teams take."
tags: [angular, router, reactive-forms, ecosystem, learning-path]
difficulty: intermediate
synonyms: ["what to learn after angular basics", "angular router basics", "reactive forms vs template forms", "do i need ngrx", "angular material worth it"]
updated: 2026-07-18
---

# Where to Go Next

Because Angular ships whole, "where to go next" means something different here than in the React
and Vue guides: less shopping, more unboxing. The tools below are mostly already installed - the
question is which parts of the box to open, in what order, and which to leave shrink-wrapped until
a real need shows up.

## What you can already build

Components, signals, inputs/outputs, services, HTTP - that's a working application skillset.
Build something real with only this before unboxing further: a small inventory app, a dashboard
over a public API. One deliberate gap you'll feel immediately - multiple pages - is the first
unboxing below.

## First unboxing: the Router

The Router is in the box and its shape will feel familiar after phase 5 - it's configuration plus
DI:

```ts
// app.routes.ts
import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', component: HomePage },
  { path: 'products/:id', component: ProductPage },
  { path: '**', component: NotFoundPage },
];
```

```ts
// product-page.ts - reading the :id, the signal way
import { input } from '@angular/core';

export class ProductPage {
  id = input.required<string>();   // with withComponentInputBinding(), route params bind to inputs
}
```

*What just happened:* routes map URL patterns to components; `<router-outlet />` in the root
template marks where they render; `routerLink` replaces `href` for no-reload navigation. The
`withComponentInputBinding()` bootstrap option makes route parameters arrive as ordinary
`input()`s - the phase 4 machinery, reused. Guards (can this user enter?), lazy loading (load
this route's code on demand), and nested routes are the depth - a follow-up guide's worth - but
the basics above carry you far.

## Second unboxing: reactive forms

Phase 2's `[(ngModel)]` handles the contact form. The moment forms grow validation rules,
dynamic fields, or cross-field logic, Angular's **reactive forms** are the in-box answer: the
form's structure lives in TypeScript as a `FormGroup` of `FormControl`s, with validators
attached, and the template binds to it. Testable without a DOM, composable, verbose - very
Angular. The decision line: `ngModel` for simple capture, reactive forms once validation logic
becomes real logic. (A follow-up guide will do them properly; the official guide covers the
mechanics well.)

## The map: pain → unboxing

| When you feel this | Reach for | In the box? |
|---|---|---|
| Multiple pages, URLs, back button | **Router** | ✓ |
| Forms with real validation logic | **Reactive forms** | ✓ |
| Repetitive async choreography beyond phase 6's five operators | **More RxJS** - learn per problem | ✓ |
| Ready-made accessible UI components | **Angular Material / CDK** | official add-on |
| Cross-app state with audit/history needs | **NgRx (or the lighter SignalStore)** | third-party |
| SEO or first-paint pressure on public pages | **Angular SSR** (`ng add @angular/ssr`) | official add-on |

Sizing notes, plainly:

- **Angular Material** is the closest thing to a default UI kit in any framework's ecosystem -
  official, accessible, themeable, and visually opinionated (Material Design, unless you invest
  in theming). Its underlying **CDK** (overlays, focus management, drag-drop) is valuable even if
  you skin your own components.
- **NgRx** is the Redux tradition in Angular: actions, reducers, effects, real ceremony. Phase 5
  already gave you the pattern that makes most apps not need it - a signal service *is* a store.
  NgRx earns its cost when state changes need auditability (devtools time-travel, event logs) or
  when many teams share one large state surface. Its newer **SignalStore** is the lighter middle
  path. Adopt on pain, never on résumé pressure.
- **SSR**: the server-in-front decision - our
  [Next.js guide's phase 1](../nextjs-from-zero/01-what-nextjs-actually-is.md) explains the
  reasoning framework-independently. Angular's version (`ng add @angular/ssr`, hydration
  included) is real and improving; it's also the least-traveled of the big frameworks' SSR paths.
  For SEO-critical greenfield work, weigh whether a meta-framework-first stack fits the job
  better; for adding SSR to an existing Angular app, the official path is the path.

## Additional resources

- [angular.dev](https://angular.dev) - the modern docs site; the tutorial track and the
  errors reference (phase 7's habit) are the two most-used sections.
- [angular.dev/guide/forms](https://angular.dev/guide/forms) - the reactive-forms guide, best
  read with a real form of yours open in the editor.
- [RxJS docs' operator decision tree](https://rxjs.dev/operator-decision-tree) - the sane way to
  find an operator when a problem appears, instead of memorizing the catalog.

## Recap

1. Unbox the Router first (routes + outlet + `routerLink`, params as inputs), reactive forms
   second (when validation becomes logic).
2. RxJS depth comes per-problem via the decision tree - phase 6's five operators remain the daily
   core.
3. Material/CDK is the default UI answer; NgRx waits for auditability pain (SignalStore as the
   middle path); SSR is the server-in-front decision in Angular clothing.
4. The box is big - open it pain by pain, and let angular.dev's errors reference stay within
   reach.

```quiz
[
  {
    "q": "A team of four builds an internal tool: phase-5-style signal services hold the state, and it works fine. A colleague insists NgRx is required for \"proper\" Angular. Per this guide, what's the sound response?",
    "choices": [
      "Adopt NgRx - it's the official state solution",
      "Signal services already are a store pattern; NgRx earns its ceremony when auditability or many-team state surfaces demand it - adopt on pain",
      "Replace services with component state to avoid the debate",
      "Use NgRx for new features and services for old ones"
    ],
    "answer": 1,
    "why": [
      "NgRx is third-party and situational - nothing about it is required or default.",
      null,
      "Shared state belongs in services - retreating to component state recreates the sharing problem.",
      "Two state architectures in one app is the worst of both - pick by need, not by feature age."
    ],
    "explain": "A providedIn-root service with signals is a store: single instance, reactive reads, controlled mutations. NgRx adds action logs, time travel, and structure for many hands - costs that need their pains present."
  },
  {
    "q": "With withComponentInputBinding() enabled, how does a routed component receive the :id from /products/:id?",
    "choices": [
      "Via a global RouteParams service it must poll",
      "As a normal input() - route params bind to component inputs",
      "Through a constructor string parameter named id",
      "By parsing window.location in ngOnInit"
    ],
    "answer": 1,
    "why": [
      "There's an ActivatedRoute service (the older way) - but nothing is polled, and the modern binding skips it.",
      null,
      "Constructors receive injected dependencies, not route strings.",
      "Reading location by hand bypasses the router entirely - and breaks on client-side navigation."
    ],
    "explain": "Route parameters arrive through the same input() machinery as parent-to-child props - one component interface, whether the caller is a template or the router."
  }
]
```

---

[← Phase 7: When Angular Breaks](07-when-it-breaks.md) · [Guide overview](_guide.md)
