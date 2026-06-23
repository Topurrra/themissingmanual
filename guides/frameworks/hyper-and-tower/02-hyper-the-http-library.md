---
title: "hyper: The HTTP Library"
guide: "hyper-and-tower"
phase: 2
summary: "How hyper actually speaks HTTP on a socket: the http crate's Request and Response, body types and the Body trait, and serving a connection with TokioIo and service_fn."
tags: [hyper, rust, http, server, request, response]
difficulty: intermediate
synonyms: ["hyper http library", "hyper server", "hyper request response", "hyper body", "hyper service_fn", "hyper-util TokioIo"]
updated: 2026-06-23
---

# hyper: The HTTP Library

Here's the mental model to carry through this whole phase, and honestly through the
rest of the guide: **hyper is the thing that speaks HTTP on the socket.** It reads
the raw bytes a client sent, parses them into a `Request`, hands that request to a
function you wrote, waits for you to give back a `Response`, and writes that response
back out as bytes — correctly, including all the fiddly HTTP/1 and HTTP/2 framing you
never want to implement yourself.

That's it. That's the job. hyper is the HTTP *engine*. It is not a web framework, and
the difference matters more than you'd expect — we'll get to exactly what it leaves
out, and why leaving it out is a feature, not a gap.

> 💡 If you remember one sentence: hyper takes a `Request` off the wire and calls
> your code, expecting a `Response`. Everything else in this phase is detail about
> what those two types are and how you wire the loop together.

## The types come from the `http` crate

hyper doesn't invent its own request and response types. It uses the ones from the
`http` crate — a tiny, dependency-light crate that the whole Rust HTTP ecosystem
shares. That sharing is the point: hyper, axum, reqwest, and tonic all agree on what
a `Request` is, so a request value can pass between them without conversion.

The two stars are generic over their **body**:

```rust
// from the `http` crate
struct Request<B>  { /* method, uri, headers, ... + a body of type B */ }
struct Response<B> { /* status, headers, ...           + a body of type B */ }
```

*What just happened:* `Request<B>` and `Response<B>` bundle the metadata you'd
expect — method, URI, status code, headers — with a body whose type is a parameter
`B`. The metadata is always the same shape; the body type varies depending on where
the value is in its life. An incoming request's body and an outgoing response's body
are *different* concrete types, and that's normal.

## Bodies are streams of bytes (the `Body` trait)

Why is the body a type parameter instead of, say, a `Vec<u8>`? Because an HTTP body
isn't always a finished buffer sitting in memory. It might be a 4 GB file streaming
in chunk by chunk, or a server-sent-events stream that never really ends. So hyper
abstracts "a body" behind a trait — `http_body::Body` — which describes *a thing you
can pull data frames from over time*, rather than a fixed blob.

You'll meet a few concrete body types constantly:

- **`hyper::body::Incoming`** — the body of a request that just arrived. hyper hands
  you this; you read from it. You don't construct it.
- **`http_body_util::Full<Bytes>`** — a whole buffer you already have in memory,
  presented as a (one-chunk) body. The everyday choice for a simple response.
- **`http_body_util::Empty<Bytes>`** — a body with no data at all (a `204`, say).

```rust
use http_body_util::Full;
use hyper::body::Bytes;

// A response whose body is one complete buffer:
let body = Full::new(Bytes::from("hello from hyper"));
```

*What just happened:* `Bytes` is a cheap-to-clone reference-counted byte buffer (from
the `bytes` crate). Wrapping it in `Full` says "this is the entire body, all at
once." `Full<Bytes>` implements the `Body` trait, so hyper knows how to write it to
the socket. For most handlers returning a string or a JSON blob, `Full<Bytes>` is all
you need.

> ⚠️ Don't reach for the `Body` trait's methods (`poll_frame` and friends) by hand
> unless you're building streaming machinery. Day to day you pick a ready-made body
> type and move on. The trait is there so the *plumbing* is generic, not so you write
> plumbing.

## You hand hyper a service; it calls you

hyper needs something to call for each request. That something is a **service**: in
spirit, an async function from `Request` to `Response`. (Phase 3 makes "service" a
precise trait — for now, "async fn request → response" is the right picture.)

The quickest way to make one is `service_fn`, which turns an async closure or function
into a service hyper accepts:

```rust
use http_body_util::Full;
use hyper::{body::Bytes, Request, Response, service::service_fn};

async fn handle(_req: Request<hyper::body::Incoming>)
    -> Result<Response<Full<Bytes>>, hyper::Error>
{
    Ok(Response::new(Full::new(Bytes::from("hello from hyper"))))
}

let service = service_fn(handle);
```

*What just happened:* `handle` takes a request whose body is `Incoming` (it came off
the wire) and returns a `Result` of a response whose body is `Full<Bytes>` (we built
it in memory). Notice the body types differ on the way in versus the way out —
exactly as promised. `service_fn(handle)` wraps the function into the shape hyper
wants to call. We ignore the request here (`_req`), because there's no router yet to
look at the path — every request gets the same reply.

## Serving a connection

hyper is **runtime-agnostic** in 1.x: its core doesn't know about Tokio, threads, or
sockets. That keeps the HTTP logic portable, but it means you have to bridge hyper to
whatever I/O you're actually using. With Tokio (the usual choice — see
[/guides/tokio-the-async-runtime](/guides/tokio-the-async-runtime)), that bridge is
**`hyper_util::rt::TokioIo`**, a thin adapter that wraps a Tokio TCP stream so hyper
can read and write through it.

The shape of serving one connection looks like this:

```rust
use hyper::server::conn::http1;
use hyper_util::rt::TokioIo;

// `tcp_stream` is a tokio::net::TcpStream you got from accepting a connection.
let io = TokioIo::new(tcp_stream);

http1::Builder::new()
    .serve_connection(io, service_fn(handle))
    .await?;
```

*What just happened:* `TokioIo::new` wraps the raw Tokio socket into something hyper's
runtime-agnostic core can drive. `http1::Builder::new().serve_connection(...)` then
runs the HTTP/1 protocol over that connection: it parses incoming requests, calls
your service for each one, writes the responses, and keeps the connection alive for
keep-alive requests until the client goes away. `.await` drives that to completion for
this one connection.

> 📝 This is the *shape*, not a paste-and-run server. A real program adds a
> `tokio::net::TcpListener` accept loop, spawns a task per connection, and handles
> errors — and most people reach for `hyper_util::server::conn::auto` instead of
> `http1` so a single setup serves both HTTP/1 and HTTP/2. The takeaway here is the
> three moving parts: **adapt the socket (`TokioIo`), pick a protocol builder, hand it
> a service.**

## What hyper does *not* give you

This is the part that surprises people coming from Express, Flask, or even axum. Look
again at `handle`: it received a `Request` and the only thing it could do was build a
`Response`. There was:

- **No router.** hyper does not look at the path or method for you. `GET /users/42`
  and `POST /login` arrive at the *same* function; matching them is your problem.
- **No path parameters, no query parsing helpers.** You get a `Uri`; pulling `42` out
  of `/users/42` is on you.
- **No middleware.** No built-in logging, auth, CORS, compression, or timeouts.
- **No JSON helpers.** No `req.json()`, no automatic serialization. You read raw
  bytes and call serde yourself.

```rust
// With bare hyper, you'd route by hand — something like:
match (req.method(), req.uri().path()) {
    (&hyper::Method::GET, "/")      => { /* home */ }
    (&hyper::Method::POST, "/login") => { /* login */ }
    _ => { /* 404 */ }
}
```

*What just happened:* that hand-rolled `match` is the kind of thing a framework
generates for you. With bare hyper you'd write it, and it'd get unwieldy fast as
routes multiply — which is precisely *why* frameworks exist. hyper deliberately stops
at "raw request in, raw response out."

⚠️ That bareness is the whole design philosophy, not an oversight. hyper aims to be a
small, fast, correct HTTP implementation that *everything else* can build on. Routing,
middleware, and JSON are opinions; hyper stays out of opinions so axum, tonic, and
your own code can layer theirs on top. When you understand that hyper is "just" the
HTTP engine, the rest of the stack — services, layers, axum — clicks into place,
because you can see exactly what they're adding.

## The 1.0 split: hyper-util and http-body-util

You've now seen three crates working together, and that's intentional. When hyper hit
1.0, it pushed conveniences *out* of the core into companion crates so the core itself
could stay small and promise long-term stability:

- **`hyper`** — the stable core: protocol, `Incoming`, `serve_connection`,
  `service_fn`.
- **`hyper-util`** — runtime glue and helpers that aren't part of the stable
  guarantee: `TokioIo`, the `auto` connection server, client pools.
- **`http-body-util`** — ready-made body types: `Full`, `Empty`, and combinators.

> 📝 The logic: a 1.0 means a strong backward-compatibility promise. The smaller the
> stable surface, the easier that promise is to keep. So hyper kept only the truly
> stable HTTP core under the 1.0 umbrella and parked the more-likely-to-evolve helpers
> in `-util` crates. That's why importing from three crates to write one server is
> normal here — it's a deliberate split, not boilerplate sprawl.

## Recap

- **hyper speaks HTTP on the socket:** it parses bytes into a `Request`, calls your
  service, and writes your `Response` back out. It's the HTTP engine, not a framework.
- **The types come from the `http` crate:** `Request<B>` and `Response<B>`, generic
  over a body type `B`, shared across the whole ecosystem.
- **Bodies are streams behind the `Body` trait.** You usually pick a concrete type:
  `Incoming` for arriving requests, `Full<Bytes>` for an in-memory response.
- **You hand hyper a service** (quickest: `service_fn`), and serve a connection by
  adapting the socket with `TokioIo` and running a protocol builder's
  `serve_connection`. hyper's core is runtime-agnostic; `hyper-util` bridges it to
  Tokio.
- **hyper gives you no router, middleware, or JSON** — on purpose. That bareness is
  what lets frameworks build on it.
- **hyper 1.0 split** conveniences into `hyper-util` and `http-body-util` to keep the
  stable core small.

## Quick check

```quiz
[
  {
    "q": "In hyper 1.x, what does TokioIo do?",
    "choices": [
      "Parses the HTTP request into a Request value",
      "Adapts a Tokio TCP socket so hyper's runtime-agnostic core can drive it",
      "Routes requests to the correct handler by path",
      "Serializes a struct into a JSON response body"
    ],
    "answer": 1,
    "explain": "hyper's core doesn't know about Tokio. TokioIo (from hyper-util) wraps a Tokio stream so hyper can read and write through it."
  },
  {
    "q": "Which body type would you typically use for a response that's a complete in-memory buffer?",
    "choices": [
      "hyper::body::Incoming",
      "http_body_util::Empty<Bytes>",
      "http_body_util::Full<Bytes>",
      "Vec<u8>"
    ],
    "answer": 2,
    "explain": "Full<Bytes> presents a whole buffer as a one-chunk body. Incoming is for arriving requests; Empty is for no body at all."
  },
  {
    "q": "Which of these does bare hyper give you out of the box?",
    "choices": [
      "A router that matches paths to handlers",
      "Middleware for logging and CORS",
      "JSON request/response helpers",
      "The parsed Request and the raw connection, and nothing more"
    ],
    "answer": 3,
    "explain": "hyper hands you the request and the connection and stops there. Routing, middleware, and JSON are deliberately left to frameworks built on top of it."
  }
]
```

---

[← Phase 1: What hyper & tower Are](01-what-hyper-and-tower-are.md) · [Guide overview](_guide.md) · [Phase 3: The Service Trait →](03-the-service-trait.md)
