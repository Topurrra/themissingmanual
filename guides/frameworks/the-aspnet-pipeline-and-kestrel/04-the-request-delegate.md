---
title: "The RequestDelegate"
guide: "the-aspnet-pipeline-and-kestrel"
phase: 4
summary: "Strip away the sugar and a whole ASP.NET Core app is one RequestDelegate. Middleware is a function that wraps the next delegate to make a new one — here's what that means."
tags: [aspnet-core, csharp, request-delegate, middleware, internals]
difficulty: advanced
synonyms: ["request delegate", "what is middleware really", "RequestDelegate func", "middleware class invokeasync", "aspnet middleware internals", "func requestdelegate requestdelegate"]
updated: 2026-07-10
---

# The RequestDelegate

There is exactly **one type** at the bottom of the whole pipeline, and once you see it, every
`app.Use(...)`, every middleware class, every `MapGet` stops being a separate concept and becomes
the same shape wearing different clothes.

The shape is this:

- A **`RequestDelegate`** is **a function from `HttpContext` to a `Task`** — "give me a
  request, I'll handle it and hand you back a `Task` for when I'm done."
- A **middleware** is **a function that takes the *next* `RequestDelegate` and returns a *new*
  `RequestDelegate`** — it wraps the rest of the pipeline so it can do work before and after.

And the punchline: **your entire app is ultimately one `RequestDelegate`.** All your middleware,
composed together, collapse into a single function that Kestrel hands each `HttpContext` to.
Hold those two sentences and the rest of this phase is detail.

> 📝 This is the deepest phase in the guide. It assumes you're comfortable with C# delegates,
> `async`/`await`, and the DI container ([C# From Zero](/guides/csharp-from-zero) and the
> previous two phases of this guide cover the ground you need). If `Use`/`Run`/`Map` aren't
> familiar yet, read [Phase 3](03-the-middleware-pipeline.md) first.

## The atom: `RequestDelegate`

The type itself is almost anticlimactic:

```csharp
public delegate Task RequestDelegate(HttpContext context);
```

*What just happened:* We named a delegate type. A `RequestDelegate` is any method (or lambda)
that takes one `HttpContext` and returns a `Task`. That's the entire contract — no return value
beyond the `Task`, because the "response" isn't returned, it's written *into* `context.Response`.
Your endpoint handler is a `RequestDelegate`. The thing Kestrel invokes per request is a
`RequestDelegate`. It is the atom the whole pipeline is built from.

## `app.Use` is sugar for `Func<RequestDelegate, RequestDelegate>`

Now the second half. When you write inline middleware with `app.Use`, what you're really
describing is a **function that wraps the next delegate** — conceptually a
`Func<RequestDelegate, RequestDelegate>`. It receives `next` (everything registered after it,
already composed into one delegate) and returns a brand-new `RequestDelegate` that does some
work, calls `next`, and does more work on the way back.

Written out without the `app.Use` sugar, a logging middleware looks like this:

```csharp
// app.Use(...) is sugar for composing RequestDelegates. Conceptually:
RequestDelegate Logging(RequestDelegate next) => async context =>
{
    var start = DateTime.UtcNow;
    await next(context);                 // call the rest of the pipeline
    var ms = (DateTime.UtcNow - start).TotalMilliseconds;
    context.RequestServices.GetRequiredService<ILogger<Program>>()
        .LogInformation("{Path} {Status} {Ms}ms", context.Request.Path, context.Response.StatusCode, ms);
};
```

*What just happened:* `Logging` is a function that takes `next` (a `RequestDelegate`) and
returns a new `RequestDelegate` — the `async context => { ... }` lambda. Inside that lambda we
do work *before* (`start`), then `await next(context)` to run the rest of the pipeline, then do
work *after* (compute `ms`, log). The "before" and "after" sit on either side of the one
`await next` call. That symmetry — code before, call `next`, code after — is the whole story of
middleware, and it's exactly what `app.Use(async (context, next) => { ... await next(context); ... })`
compiles down to. The framework just spares you from naming the wrapping function.

> 💡 Notice where `next` comes from: it's already the *rest* of the pipeline, pre-composed into
> a single `RequestDelegate`. Each middleware only ever sees "me and everything after me as one
> function." It never needs to know how many middlewares follow or what they are.

## Convention-based middleware classes

Inline lambdas are fine for two-line concerns, but real middleware usually wants a class — its
own file, constructor, testability. ASP.NET Core supports a **convention-based** class: no
interface to implement, no base class to inherit. You just follow a shape:

```csharp
public class LoggingMiddleware
{
    private readonly RequestDelegate _next;

    public LoggingMiddleware(RequestDelegate next)   // the "next" delegate, captured once
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, ILogger<LoggingMiddleware> logger)
    {
        var start = DateTime.UtcNow;
        await _next(context);
        var ms = (DateTime.UtcNow - start).TotalMilliseconds;
        logger.LogInformation("{Path} {Status} {Ms}ms",
            context.Request.Path, context.Response.StatusCode, ms);
    }
}

// register it:
app.UseMiddleware<LoggingMiddleware>();
```

*What just happened:* This is the same logging middleware as before, restructured. The
constructor takes `RequestDelegate next` and stashes it — that's the "wrap the next delegate"
part. The `InvokeAsync` method is the new `RequestDelegate` body: it gets the `HttpContext`,
does before/after work around `await _next(context)`. `app.UseMiddleware<LoggingMiddleware>()`
recognizes the convention (constructor-takes-`next`, has `InvokeAsync(HttpContext, ...)`) and
slots it into the pipeline. Note `ILogger` arrives as a *parameter of `InvokeAsync`*, not the
constructor — and that detail is not cosmetic.

> ⚠️ **The captive-dependency trap.** A convention-based middleware instance is constructed
> **once**, for the lifetime of the app — effectively a singleton. So anything you inject into
> the **constructor** is also captured once and reused for every request forever. If you inject
> a **Scoped** service (a `DbContext`, a per-request unit-of-work) into the constructor, you've
> captured one request's instance and frozen it across all future requests — a "captive
> dependency," and a genuinely nasty bug (stale data, cross-request leakage, disposed-object
> exceptions). The fix is the rule above: **inject per-request (Scoped) services as parameters
> of `InvokeAsync`**, which the framework resolves fresh from the request's scope on every call.
> Constructor injection is only safe for **Singleton** services. (More on service lifetimes in
> [Phase 5](05-host-di-configuration.md).)

## Composition order: last registered is innermost

So how do the pieces become one function? When the app builds, the framework composes the
middlewares **from the last registered to the first**. Each one's `Func<RequestDelegate, RequestDelegate>`
is handed the already-composed delegate of everything after it. The result: the **first** `Use`
you wrote becomes the **outermost** wrapper, and the last becomes the innermost (sitting right
next to your endpoint).

```csharp
app.Use(/* A */ ...);   // outermost: runs first on the way in, last on the way out
app.Use(/* B */ ...);
app.Use(/* C */ ...);   // innermost: closest to the endpoint
app.Run(/* endpoint */);
```

*What just happened:* Reading top-to-bottom is the order requests *enter*: A, then B, then C,
then the endpoint. Because each middleware does work *after* `await next`, the way *out* is the
mirror image: endpoint, then C, then B, then A. Composition built this nesting by wrapping
inside-out — `A(B(C(endpoint)))` — which is why registration order is the single most important
thing about a pipeline (exactly the lesson from [Phase 3](03-the-middleware-pipeline.md), now
explained from the inside).

> 💡 If this "a function that takes `next` and returns a new function" shape feels familiar,
> it's because it's the *universal* pattern for middleware, not a .NET invention. Go's idiom is
> literally `func(next http.Handler) http.Handler` — same signature, same wrapping. And Rust's
> tower expresses it as a `Layer` that wraps a `Service` to produce a new `Service` — the
> parallel is exact, down to "compose inside-out so the first layer is outermost." If you've
> internalized one, you've internalized all three. See
> [hyper & tower](/guides/hyper-and-tower) for the Rust telling of the very same idea.

## Recap

- A **`RequestDelegate`** is `Task RequestDelegate(HttpContext context)` — a function from a
  request to a `Task`. Your endpoint is one; the whole pipeline collapses into one.
- A **middleware** is a function that takes the **next** `RequestDelegate` and returns a **new**
  one — work before, `await next(context)`, work after. `app.Use` is sugar for exactly this
  (`Func<RequestDelegate, RequestDelegate>`).
- **Convention-based middleware classes** take `RequestDelegate next` in the constructor and
  expose `public async Task InvokeAsync(HttpContext context, ...)`, registered with
  `app.UseMiddleware<T>()`.
- ⚠️ The instance is created **once**. Inject **Scoped** services as `InvokeAsync` parameters,
  never the constructor — constructor injection of Scoped services is the **captive-dependency**
  bug.
- The pipeline composes **last-registered-innermost**, so the **first** `Use` is the
  **outermost** call — which is why ordering decides everything.
- It's the same middleware shape as Go's `func(next) handler` and Rust tower's `Layer`/`Service`.

## Quick check

```quiz
[
  {
    "q": "What is a RequestDelegate?",
    "choices": ["A class you inherit from to make middleware", "A function from HttpContext to a Task — the atom the pipeline is built from", "A DI lifetime like Scoped or Singleton", "The Kestrel socket listener"],
    "answer": 1,
    "explain": "RequestDelegate is `Task RequestDelegate(HttpContext context)` — a function that handles a request and returns a Task. Middleware and endpoints are all this shape, and the whole app composes into one."
  },
  {
    "q": "Conceptually, what is a middleware?",
    "choices": ["A function that takes the next RequestDelegate and returns a new RequestDelegate", "A subclass of HttpContext", "A method that returns the response object directly", "A configuration source"],
    "answer": 0,
    "explain": "Middleware is a Func<RequestDelegate, RequestDelegate>: it receives `next` (the rest of the pipeline) and returns a new delegate that does work, awaits next, and does more work on the way out. app.Use is sugar for this."
  },
  {
    "q": "Why inject a Scoped service into InvokeAsync rather than the middleware constructor?",
    "choices": ["Constructor injection is slower", "The middleware instance is created once, so a constructor-injected Scoped service becomes a captive dependency reused across all requests", "InvokeAsync can't access the constructor", "Scoped services aren't registered until InvokeAsync runs"],
    "answer": 1,
    "explain": "A convention-based middleware is instantiated once (singleton-like). A Scoped service captured in its constructor is frozen for the app's lifetime — the captive-dependency bug. InvokeAsync parameters are resolved fresh from each request's scope."
  }
]
```

[← Phase 3: The Middleware Pipeline](03-the-middleware-pipeline.md) · [Guide overview](_guide.md) · [Phase 5: The Host, DI & Configuration →](05-host-di-configuration.md)
