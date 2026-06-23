---
title: "The Service Trait"
guide: "hyper-and-tower"
phase: 3
summary: "tower::Service is the universal async request-to-response shape: call does the work, poll_ready signals readiness for backpressure. Why it's generic, why it composes, and service_fn as the easy path."
tags: [tower, rust, service, poll-ready, async]
difficulty: advanced
synonyms: ["tower service trait", "poll_ready call", "tower service_fn", "rust async request response abstraction", "tower backpressure", "what is a tower service"]
updated: 2026-06-23
---

# The Service Trait

Here's the one idea this whole guide turns on. Strip away the type machinery and a
`tower::Service` is two things bolted together:

- **`call`** — give it a request, it hands you back a *future* of a response.
- **`poll_ready`** — ask it "are you ready to take work right now?" before you call.

That pair — *do the work* and *am I ready?* — is the universal shape every piece of
the tower ecosystem speaks. An entire axum app, one endpoint, a database client, a
rate limiter, a gRPC server: each is something you hand a request and get a response
back from, with a chance to say "hold on, I'm full." Once that clicks, the rest of the
stack stops looking like magic and starts looking like the same trait wearing different
hats.

> 📝 This is the deepest phase in the guide. It assumes you're comfortable with Rust
> traits, generics, associated types, and `async`/futures. If `Future` and
> `Poll` aren't familiar yet, the [Tokio guide](/guides/tokio-the-async-runtime) is the
> place to shore that up first.

## The trait itself

Here is `tower::Service`, simplified down to the parts that matter (the real one carries
a couple of extra bounds, but the shape is exactly this):

```rust
pub trait Service<Request> {
    type Response;
    type Error;
    type Future: Future<Output = Result<Self::Response, Self::Error>>;

    fn poll_ready(&mut self, cx: &mut Context<'_>) -> Poll<Result<(), Self::Error>>;
    fn call(&mut self, req: Request) -> Self::Future;
}
```

*What just happened:* We declared three associated types — what the service produces
(`Response`), how it fails (`Error`), and the concrete `Future` type `call` returns —
and two methods. `call` takes a `Request` and returns that future. `poll_ready` returns
`Poll<Result<(), Self::Error>>`: `Poll::Ready(Ok(()))` means "go ahead, call me,"
`Poll::Pending` means "not yet, I'll wake you," and an `Err` means the service has failed.
Notice there's no `async fn` here — `call` returns a future *value* you then await, which
is what lets these compose without boxing everything.

### `call` is the easy half

`call` is the part your intuition already had: a request goes in, a future of
`Result<Response, Error>` comes out. You await that future to get the response. If you've
written an HTTP handler, you've written the body of a `call` — this is just the formal
shape of "handle one request."

### `poll_ready` is the half nobody tells you about

`poll_ready` is the readiness and **backpressure** hook, and it's the genuinely
non-obvious part. The contract is a discipline between caller and service:

> A caller must wait until `poll_ready` returns `Poll::Ready(Ok(()))` *before* it is
> allowed to call `call`.

That single rule is what lets a service push back. Imagine a rate limiter that allows 100
requests per second. When it's used up its budget for this window, its `poll_ready`
returns `Poll::Pending` and registers to wake the caller when the next window opens — so
the caller naturally stalls instead of flooding the service. Or picture a connection pool
that's handed out every connection it has: `poll_ready` stays `Pending` until one frees
up. The service gets to say *"I'm at capacity, hold off"* through the type system, and
well-behaved callers honor it.

> ⚠️ The flip side of that contract: a `Service` may assume `poll_ready` returned `Ready`
> before `call` happens, and is allowed to reserve a resource (a permit, a pool slot)
> when it reports `Ready`. So you don't call `call` twice off one `poll_ready`, and you
> don't skip `poll_ready`. When you compose services through tower, the framework
> upholds this for you — it matters most when you're writing a `Service` by hand.

> 💡 Most simple services are *always* ready — their `poll_ready` is a one-liner that
> returns `Poll::Ready(Ok(()))`. Backpressure is opt-in. You only reach for a meaningful
> `poll_ready` when the service genuinely has a limited resource to protect.

## Why it's generic over the request

Look again at the trait header: `Service<Request>`. The request type is a generic
parameter, not baked in. That one decision is why the whole ecosystem composes.

Because the request is generic, the *same* trait describes:

- an **HTTP** service whose `Request` is `http::Request<Body>`,
- a **gRPC** service whose request is a decoded protobuf message,
- a **database** client whose request is a query,
- any **request → response** thing you can imagine.

The middleware you'll meet next phase — timeouts, retries, concurrency limits — is
written against `Service<Request>` generically, so it works on *all* of them without
caring what flows through. A timeout layer doesn't know or care whether it's wrapping an
HTTP handler or a database call; it just knows it's wrapping a `Service`. That generality
is the entire reason a timeout you learned for axum also applies to a tonic gRPC client.

## The easy way to make one: `service_fn`

Implementing `Service` by hand is honestly verbose — you have to name an associated
`Future` type, which usually means boxing the future or writing your own. For the common
case where your service is just "an async function," tower gives you a shortcut:
**`tower::service_fn`** turns an async closure into a `Service`.

```rust
use tower::{service_fn, Service, ServiceExt};
use std::convert::Infallible;

// An async closure (request -> response) becomes a full Service.
let mut svc = service_fn(|req: String| async move {
    Ok::<_, Infallible>(format!("handled: {req}"))
});

// Honor the contract: wait until ready, then call.
let ready = svc.ready().await.unwrap();      // drives poll_ready for you
let resp = ready.call("ping".to_string()).await.unwrap();
assert_eq!(resp, "handled: ping");
```

*What just happened:* `service_fn` wrapped our closure into something implementing the
full `Service` trait — `Response`, `Error`, `Future`, `poll_ready`, and `call` are all
synthesized for us, and its `poll_ready` is the always-ready one-liner. The
`ServiceExt::ready` helper drives `poll_ready` to completion and then hands back a
`&mut Service` you can `call` — so it enforces the "ready before call" contract in one
line. We get a real `Service` without naming a single associated type.

When *would* you hand-write a `Service`? When it's **stateful** — a real rate limiter
holding a token bucket, a connection pool, anything whose `poll_ready` needs to inspect
internal state and return `Pending`. A closure can't easily carry and mutate that across
`poll_ready` and `call`, so you implement the trait directly. That's the verbose path,
and it exists for exactly these cases.

## Everything is a Service

Here's the payoff, and it's worth saying plainly:

> 💡 An axum `Router` is a `Service`. A single axum handler is a `Service`. A tonic gRPC
> server is a `Service`. An HTTP *client* is a `Service`. The middleware that wraps any
> of them produces another `Service`.

Learn this one trait and the ecosystem clicks into place. The next phase shows how a
`Layer` *wraps* a `Service` to make a new one — that's all middleware is — and once both
ideas are in hand, "how does axum actually work" answers itself.

## Recap

- A `tower::Service` is **`call`** (request → future of `Result<Response, Error>`) plus
  **`poll_ready`** (am I ready to take work?).
- `poll_ready` is the **backpressure** hook: callers must wait for `Ready` before calling,
  letting a service signal "I'm at capacity" (rate limiters, full connection pools).
- Most simple services are **always ready** — a one-line `poll_ready`. Backpressure is opt-in.
- The trait is **generic over the request type**, which is why one set of middleware
  composes across HTTP, gRPC, database clients, and more.
- **`tower::service_fn`** turns an async closure into a `Service` — the easy path.
  Hand-implement the trait only for **stateful** services that need a real `poll_ready`.
- Everything in the ecosystem — `Router`, handlers, gRPC servers, HTTP clients — is a
  `Service`.

## Quick check

```quiz
[
  {
    "q": "What does a Service's call method return?",
    "choices": ["The response directly", "A future of Result<Response, Error>", "A Poll value", "Nothing; it mutates state"],
    "answer": 1,
    "explain": "call takes a request and returns a future that resolves to Result<Response, Error> — you await it to get the response."
  },
  {
    "q": "What is poll_ready for?",
    "choices": ["Parsing the request body", "Backpressure: signaling whether the service can take work before call", "Returning the response", "Logging each request"],
    "answer": 1,
    "explain": "poll_ready is the readiness/backpressure hook. A caller must see Poll::Ready(Ok(())) before calling call, so a service can say 'I'm at capacity, hold off.'"
  },
  {
    "q": "When would you hand-implement Service instead of using service_fn?",
    "choices": ["Always — service_fn is deprecated", "Never — service_fn covers every case", "For stateful services whose poll_ready must inspect state and return Pending", "Only for HTTP services"],
    "answer": 2,
    "explain": "service_fn is the easy path for stateless 'just an async function' services (always ready). You hand-write the trait for stateful services like a rate limiter or pool whose poll_ready needs real logic."
  }
]
```

[← Phase 2: hyper: The HTTP Library](02-hyper-the-http-library.md) · [Guide overview](_guide.md) · [Phase 4: Layers & Middleware →](04-layers-and-middleware.md)
