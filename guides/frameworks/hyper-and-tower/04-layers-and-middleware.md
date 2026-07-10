---
title: "Layers & Middleware"
guide: "hyper-and-tower"
phase: 4
summary: "Middleware is a Service that wraps another Service; a tower::Layer is the factory that does the wrapping. Compose layers cleanly with ServiceBuilder, and learn the ordering rule that trips everyone up."
tags: [tower, rust, layer, middleware, servicebuilder]
difficulty: advanced
synonyms: ["tower layer", "tower middleware", "tower servicebuilder", "tower compose middleware", "tower layer trait", "wrap a service"]
updated: 2026-07-10
---

# Layers & Middleware

In [the last phase](03-the-service-trait.md) you saw the one trait the whole tower world stands on: a
**`Service`** is "an async function from a request to a response," with a readiness check bolted on the
front. Once everything is a `Service`, a beautiful thing falls out of the shape — the whole reason tower
exists.

Here is the mental model, and it's the only thing you need to carry through this phase:

> 💡 **Middleware is a `Service` that wraps another `Service`. A `Layer` is the factory that does the
> wrapping.**

That's it. A piece of middleware (logging, auth, timeouts, compression) is not a special kind of object
with its own special trait. It's a plain `Service` that happens to hold *another* `Service` inside it —
the `inner` one — and in its `call`, it does a little work *before* handing the request down to `inner`,
and a little more work *after* `inner` hands the response back up. Request goes down through the layers,
response comes back up through them. Like an onion, or nesting dolls, or — the metaphor that'll actually
stick — a stack of `try/finally` blocks wrapped around your real handler.

The `Layer` is the small companion piece: a factory whose only job is "given an inner service, build the
wrapper around it." You need both because the wrapping has to happen *for every service you apply it to*,
and a factory is how you make that reusable.

Let's look at all three pieces: the `Layer` trait, the wrapper service, and `ServiceBuilder` (which makes
stacking them readable).

## The `Layer` trait

The trait is almost insultingly small. It has one associated type and one method:

```rust
pub trait Layer<S> {
    type Service;
    fn layer(&self, inner: S) -> Self::Service;
}
```

*What just happened:* `S` is the type of the service being wrapped (the `inner`). `layer` takes that
inner service and returns a new one — `Self::Service` — which is the wrapper. Read it as a function:
"give me a service, I'll give you back a bigger service with my behavior bolted around it." That's the
entire contract. A `Layer` doesn't handle requests itself; it only *constructs* the thing that does.

> 📝 Notice `layer` takes `&self`, not `self`. The same `Layer` value can wrap many services — which is
> exactly what `ServiceBuilder` relies on below, and what makes a layer reusable across a whole app.

## The wrapper service: before and after `inner.call`

The wrapper is where the actual behavior lives, and it's just a `Service`. The pattern is always the
same: hold the `inner` service in a field, and in `call`, do your work around `inner.call(req)`. Here's
the heart of a logging middleware:

```rust
// shape of a logging middleware service's call:
fn call(&mut self, req: Request) -> Self::Future {
    let start = Instant::now();
    let fut = self.inner.call(req);     // delegate to the wrapped service
    async move {
        let res = fut.await;
        log::info!("took {:?}", start.elapsed());
        res
    }
}
```

*What just happened:* before delegating, we grab a timestamp (the "on the way in" work). Then we call
`self.inner.call(req)` to get the inner service's future — note we don't `.await` it yet, we just hold
the future. Inside the returned `async move` block we `await` it to get the real response, do our "on the
way out" work (logging the elapsed time), and pass the response back up. The middleware sandwiches the
inner service: code before the delegate runs on the way down, code after the `await` runs on the way back
up. Swap the logging for "check an auth header before, add a CORS header after" and you've got auth or
CORS — the *shape* never changes.

> ⚠️ The "before" work runs at `call` time, but the "after" work only runs when the returned future is
> awaited. That's why we capture `start` outside the `async move` block (so it measures the real call
> start) but read `start.elapsed()` inside it (so it measures completion). Mixing those up is the classic
> first-middleware bug — you end up timing how long it took to *create* the future, which is roughly zero.

This is two pieces working together: the **wrapper service** above (does the work) and a small **`Layer`
struct** (a factory whose `layer()` produces that wrapper, plugging in whatever `inner` it's handed).
You'll see those two pieces spelled out at the end of this phase.

## `ServiceBuilder`: composing layers readably

You rarely apply one layer. A real app wants tracing *and* a timeout *and* compression *and* auth — a
stack of them. You *can* wrap by hand (`Timeout::new(Compression::new(Trace::new(app))))`), but that
nests inside-out and reads backwards. tower gives you **`ServiceBuilder`** to write the stack the way you
think about it, top to bottom:

```rust
use tower::ServiceBuilder;

let service = ServiceBuilder::new()
    .layer(trace_layer)        // outermost
    .layer(timeout_layer)
    .layer(compression_layer)  // innermost
    .service(app);             // your real service at the bottom
```

*What just happened:* each `.layer(...)` adds one piece of middleware to the stack, and `.service(app)`
caps it off with the actual service everything wraps. The result is a single `Service` you can hand to
hyper (or that *is* your axum app) — the layers are baked in. It reads as a list instead of a pile of
nested constructors, which matters a lot once you have five of them.

Now the rule everyone gets wrong exactly once:

> ⚠️ **With `ServiceBuilder`, layers wrap top-to-bottom: the FIRST `.layer` is the OUTERMOST.** It runs
> *first* on the way in and *last* on the way out. The last `.layer` is the innermost, closest to your
> real service. In the example above, a request hits `trace_layer` first, then `timeout_layer`, then
> `compression_layer`, then `app` — and the response travels back out in reverse.

This is the *opposite* of what happens when you call `.layer()` repeatedly on a bare service directly: in
that case each new `.layer()` wraps *around* the previous result, so the last one you add ends up
outermost. `ServiceBuilder` deliberately flips this so the reading order (top = first to see the request)
matches the execution order. Pick one mental model — almost everyone uses `ServiceBuilder`, so anchor on
"first `.layer` = outermost = first to touch the request," and you'll be right.

## Why this matters: a Layer works on *any* Service

Here's the payoff, and the reason the next phase exists at all.

> 💡 Because middleware is "a `Service` wrapping a `Service`," a `Layer` doesn't care *what* it's
> wrapping. The same timeout layer works on an axum app, a [tonic](/guides/axum-from-zero) gRPC server,
> or an HTTP *client*. Write the layer once; reuse it everywhere a tower `Service` shows up.

Think about how unusual that is. In most frameworks, "middleware" is a framework-specific concept —
Express middleware doesn't run on your database client, Django middleware doesn't wrap your gRPC server.
In tower, because the `Service` abstraction is universal, your middleware is universal too. A retry layer
you wrote for outbound HTTP calls can wrap your inbound server. A rate limiter can sit in front of *any*
service. This is the single biggest idea in tower, and it's why a whole crate of ready-made layers can
exist and Just Work across the ecosystem — which is exactly [the tower-http
toolbox](05-tower-http.md), the next phase.

## Do you ever write one by hand?

Mostly, no — and that's the good news. Hand-writing a layer means building **two pieces**: a small
`Layer` struct (the factory) and a wrapper `Service` (the behavior), wired together so the struct's
`layer()` produces the service. It's a fair bit of boilerplate for the type plumbing, and the futures get
fiddly.

The happy path is: **reach for a ready-made layer** from `tower` or `tower-http` (timeouts, tracing,
CORS, compression, concurrency limits — covered next phase), and only hand-write a layer when you need
behavior nobody has packaged for you. When that day comes, you now know the shape: a `Layer` struct whose
`layer()` returns a wrapper `Service` that does work around `inner.call`. Everything else is filling in
types.

## Recap

- **Middleware = a `Service` that wraps another `Service`.** It holds the `inner` service and, in `call`,
  does work before and after delegating to `inner.call(req)`.
- A **`Layer`** is the small factory that does the wrapping: `fn layer(&self, inner: S) -> Self::Service`.
  It builds the wrapper; it doesn't handle requests itself.
- In the wrapper's `call`, "before" work runs immediately; "after" work runs when the returned future is
  awaited. Capture state before, read it after.
- **`ServiceBuilder`** stacks layers readably: `.layer(...).layer(...).service(inner)`. The first
  `.layer` is the **outermost** — first in, last out. (This is the reverse of calling `.layer()` on a
  bare service repeatedly.)
- Because a `Service` is universal, a `Layer` works on **any** service — app, server, or client. Write
  once, reuse everywhere. That's why `tower-http` exists.
- Hand-writing a layer means two pieces (a `Layer` struct + a wrapper `Service`); most of the time you
  use ready-made ones.

## Quick check

```quiz
[
  {
    "q": "What is a piece of tower middleware, structurally?",
    "choices": ["A special trait separate from Service", "A Service that wraps another Service and delegates to inner.call", "A function hyper calls before any Service", "A configuration struct read at startup"],
    "answer": 1,
    "explain": "Middleware is just a Service that holds an inner Service and does work before/after calling inner.call(req). A Layer is the factory that builds it."
  },
  {
    "q": "Given ServiceBuilder::new().layer(a).layer(b).service(app), which layer touches an incoming request first?",
    "choices": ["app", "b, because it was added last", "a, because the first .layer is the outermost", "They run concurrently"],
    "answer": 2,
    "explain": "With ServiceBuilder, the first .layer is the outermost: it runs first on the way in and last on the way out. So 'a' sees the request first, then 'b', then 'app'."
  },
  {
    "q": "Why can the same tower Layer wrap an axum app, a tonic server, and an HTTP client?",
    "choices": ["Because tower copies the layer's code into each framework", "Because every Layer is generated at compile time per framework", "Because all of them are tower Services, and a Layer just wraps a Service", "Because hyper rewrites the layer for each target"],
    "answer": 2,
    "explain": "A Layer only knows it's wrapping some Service. Since app, server, and client are all Services, the same layer composes with any of them — write once, reuse everywhere. That's the basis for tower-http."
  }
]
```

[← Phase 3: The Service Trait](03-the-service-trait.md) · [Guide overview](_guide.md) · [Phase 5: The tower-http Toolbox →](05-tower-http.md)