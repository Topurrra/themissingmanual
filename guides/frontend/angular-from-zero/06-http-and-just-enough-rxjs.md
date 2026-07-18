---
title: "HTTP and Just Enough RxJS"
guide: "angular-from-zero"
phase: 6
summary: "HttpClient returns observables - lazy streams you either unwrap with the async pipe, convert with toSignal, or subscribe to by hand - and the survival subset of RxJS is smaller than its reputation."
tags: [angular, httpclient, rxjs, observables, async-pipe, tosignal]
difficulty: intermediate
synonyms: ["angular httpclient tutorial", "what is an observable angular", "async pipe vs subscribe", "tosignal angular", "do i need rxjs for angular"]
updated: 2026-07-18
---

# HTTP and Just Enough RxJS

Here's the phase where Angular's reputation for difficulty actually lives. Fetch data in Angular
and you don't get a Promise - you get an **Observable**, a concept from the RxJS library that
Angular builds its async story on. The full RxJS is a deep discipline with a hundred operators.
The working subset you need to *use Angular productively* fits in this phase - and modern Angular
lets signals carry more of the weight than the old tutorials suggest.

## Setup, once

`HttpClient` arrives through DI (of course), enabled at bootstrap:

```ts
// app.config.ts
import { provideHttpClient } from '@angular/common/http';

export const appConfig = {
  providers: [provideHttpClient()],
};
```

Forget this and every injection of `HttpClient` throws a no-provider error - worth knowing before
it happens, since the error names the class, not the missing config line.

## Observable: a lazy stream you subscribe to

```ts
// products.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Product { id: string; name: string; cents: number; }

@Injectable({ providedIn: 'root' })
export class ProductsService {
  private http = inject(HttpClient);

  list(): Observable<Product[]> {
    return this.http.get<Product[]>('/api/products');
  }
}
```

**What an observable actually is.** A recipe for producing values over time. Two facts carry
everything else:

- **It's lazy.** Calling `list()` sends *no request*. An observable is inert until someone
  **subscribes** - the subscription pulls the trigger. (A Promise, by contrast, is already
  running the moment it exists.)
- **It can deliver many values.** HTTP happens to deliver one response and complete, but the same
  type models router events, form value changes, websockets - streams. That generality is *why*
  Angular chose it, and why the API feels heavier than `fetch` for the simple case.

## Consuming: three ways, ranked

**1. `toSignal` - the modern default.** Convert the stream into the reactivity you already know:

```ts
// products-page.ts
import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-products-page',
  template: `
    @if (products(); as list) {
      <ul>
        @for (p of list; track p.id) { <li>{{ p.name }}</li> }
      </ul>
    } @else {
      <p>Loading…</p>
    }
  `,
})
export class ProductsPage {
  private productsService = inject(ProductsService);
  products = toSignal(this.productsService.list());
}
```

*What just happened:* `toSignal` subscribes for you, exposes the latest value as a signal
(`undefined` until the response lands - hence the `@if` guard with its handy `as` alias), and
**unsubscribes automatically** when the component is destroyed. Everything downstream is phase 3:
computeds over it, templates tracking it.

**2. The `async` pipe - the template-side classic.** `{{ (products$ | async) }}` subscribes in
the template and cleans up on destroy. You'll see it constantly in existing code (the `$` suffix
on observable variables is convention, not syntax); it predates signals and remains fine.

**3. Manual `subscribe()` - the one with the foot-gun.**

```ts
ngOnInit() {
  this.productsService.list().subscribe(list => this.products = list);
}
```

Legal, common in older code, and the source of Angular's classic leak: **a subscription outlives
its component unless something unsubscribes.** For a single HTTP get (completes after one value)
the stakes are low; for long-lived streams (router events, form changes, intervals) an
un-unsubscribed component keeps reacting forever - the same undead-timer disease as every
framework, in observable clothing. Modern escape hatch if you must subscribe manually:
`takeUntilDestroyed()` piped in, which ties the subscription to the component's lifetime. But the
real advice is structural: **let `toSignal` or `async` own subscriptions; subscribe by hand only
when you genuinely need imperative control.**

## The operators worth knowing (all five of them)

RxJS operators transform streams, composed through `.pipe(...)`. The survival kit:

```ts
import { map, catchError, switchMap, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { of } from 'rxjs';

// transform the payload
this.http.get<Product[]>('/api/products').pipe(
  map(list => list.filter(p => p.cents > 0)),
  catchError(() => of([] as Product[])),    // error → fallback value, stream survives
);

// the search-box classic: typed input → debounced, deduped, switched requests
search$.pipe(
  debounceTime(300),                        // wait for typing to pause
  distinctUntilChanged(),                   // skip identical queries
  switchMap(q => this.http.get<Product[]>(`/api/search?q=${q}`)),
);
```

*What just happened in that last pipe:* `switchMap` maps each query to a *new* HTTP observable and
- the crucial part - **cancels the previous request when a new query arrives.** That's the
out-of-order-response race (which every guide in this category has fought by hand with cancelled
flags) solved by the operator's semantics. This is RxJS at its best, and it's the real pitch for
learning more of it eventually: entire classes of async choreography become one word.

Beyond these five, learn operators when a problem demands one, not from a list. Phase 8 points at
where to go deeper.

## Recap

1. `provideHttpClient()` at bootstrap; `HttpClient` via `inject`; typed calls like
   `http.get<Product[]>(url)`.
2. Observables are lazy streams: no subscription, no request; many values possible - that's why
   they're not Promises.
3. Consume with `toSignal` (modern default, auto-cleanup) or the `async` pipe (template classic);
   manual `subscribe` needs a lifetime plan (`takeUntilDestroyed`).
4. Survival operators: `map`, `catchError`, `debounceTime`, `distinctUntilChanged`, `switchMap` -
   the last one cancels stale requests and is worth the price of admission alone.
5. Learn more RxJS on demand, not in advance.

```quiz
[
  {
    "q": "You call productsService.list() but no network request appears in DevTools. The method returns http.get(...). What's the missing ingredient?",
    "choices": [
      "The URL must be absolute",
      "Nothing subscribed - observables are lazy, and the request fires on subscription (toSignal, async pipe, or subscribe)",
      "provideHttpClient() enables requests only in production",
      "The get() call needs an await"
    ],
    "answer": 1,
    "why": [
      "Relative URLs work fine against the serving origin.",
      null,
      "The provider works in every mode - without it you'd get a loud injection error, not silence.",
      "Observables aren't awaited - that's Promise vocabulary; subscription is the trigger here."
    ],
    "explain": "An observable is a recipe, inert until subscribed. Wrap it in toSignal, pipe it through async, or subscribe - that moment is when the request leaves."
  },
  {
    "q": "A component manually subscribes to router events in ngOnInit and is created/destroyed many times as the user navigates. What's accumulating?",
    "choices": [
      "Nothing - subscriptions die with their component",
      "Live subscriptions - each instance subscribed and nothing unsubscribed, so dead components keep reacting",
      "Router history entries",
      "Change detection cycles"
    ],
    "answer": 1,
    "why": [
      "That's exactly what does NOT happen automatically with manual subscribe - it's why toSignal and async exist.",
      null,
      "History grows with navigation regardless - the leak is the reacting dead components.",
      "Change detection isn't accumulated by subscriptions - callbacks are."
    ],
    "explain": "Manual subscriptions outlive their components unless tied to the lifetime (takeUntilDestroyed) or replaced with toSignal/async, which clean up automatically. Long-lived streams make the leak real fast."
  },
  {
    "q": "In the debounced-search pipe, what does switchMap contribute beyond map?",
    "choices": [
      "It runs the requests in parallel for speed",
      "It maps each query to a new request AND cancels the previous in-flight one - late responses from old queries can't overwrite new results",
      "It caches responses per query",
      "It retries failed requests"
    ],
    "answer": 1,
    "why": [
      "Parallelism is mergeMap's behavior - and exactly what reintroduces the race.",
      null,
      "No caching is involved - dedupe of identical consecutive queries came from distinctUntilChanged.",
      "Retry is its own operator (retry) - switchMap is about switching allegiance to the newest inner stream."
    ],
    "explain": "switchMap = 'only the latest matters': each new query unsubscribes the previous inner observable, which for HTTP means cancelling the stale request. The classic race, solved declaratively."
  }
]
```

---

[← Phase 5: Services and Dependency Injection](05-services-and-di.md) · [Guide overview](_guide.md) · [Phase 7: When Angular Breaks →](07-when-it-breaks.md)
