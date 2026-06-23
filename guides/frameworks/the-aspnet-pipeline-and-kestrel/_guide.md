---
title: "The ASP.NET Pipeline & Kestrel"
guide: "the-aspnet-pipeline-and-kestrel"
phase: 0
summary: "Learn what ASP.NET Core is actually built on: Kestrel the web server, the middleware pipeline and the request delegate, the host and its built-in dependency-injection container and configuration, and how minimal APIs and MVC are conveniences over endpoint routing. The plumbing under every .NET web app, made visible."
tags: [aspnet-core, csharp, dotnet, kestrel, middleware, pipeline, host, framework-internals]
category: frameworks
order: 30
group: "C#"
difficulty: advanced
synonyms: ["kestrel web server", "aspnet core middleware pipeline", "request delegate", "aspnet core host builder", "endpoint routing", "how aspnet core works", "aspnet core internals", "use run map middleware"]
updated: 2026-06-23
---

# The ASP.NET Pipeline & Kestrel

When you write `app.MapGet(...)` in ASP.NET Core, a lot happens before your code runs — and almost nobody
learns what. This is the **roots** guide for [ASP.NET Core](/guides/aspnet-core-from-zero): underneath the
minimal APIs and controllers sit a web server (**Kestrel**), a **middleware pipeline** that every request
flows through, and a **host** that wires up configuration and the dependency-injection container. Learn
these and the framework stops being a pile of conventions and becomes a small, legible machine.

The mental model is a server, a pipeline, and a host. **Kestrel** is the cross-platform web server that
actually listens on the socket and speaks HTTP. Each request it accepts runs through the **middleware
pipeline** — an ordered chain of functions, each a **`RequestDelegate`** that can do work, call the next
one, and act on the way back out (your endpoint is the end of the chain). And the **host** is the object
that builds it all: it reads configuration, sets up the DI container, and starts Kestrel. Hold "Kestrel
listens, the pipeline processes, the host wires it together," and every `app.Use(...)` and
`builder.Services...` line has an obvious home.

> 📝 This is a **roots** guide — it assumes **C#** ([C# From Zero](/guides/csharp-from-zero)) and is most
> rewarding after you've used [ASP.NET Core](/guides/aspnet-core-from-zero), so the pieces have somewhere
> to land. It's the .NET parallel to the [net/http roots guide](/guides/web-services-with-only-net-http)
> (Go) and [WSGI & ASGI](/guides/wsgi-and-asgi-explained) (Python). Examples run as .NET programs.

## How to read this

Short and foundational — read in order. It builds from "what Kestrel is" up through the pipeline, the
host, and how minimal APIs/MVC sit on top. Phases carry difficulty badges.

## The phases

1. **[What Kestrel & the Pipeline Are](01-what-kestrel-and-the-pipeline-are.md)** 🟢 — the server, the pipeline, and the host, and how a request flows.
2. **[Kestrel: The Web Server](02-kestrel-the-web-server.md)** 🟡 — the cross-platform server, the listener, and reverse proxies.
3. **[The Middleware Pipeline](03-the-middleware-pipeline.md)** 🟡 — `Use`/`Run`/`Map`, ordering, and short-circuiting.
4. **[The RequestDelegate](04-the-request-delegate.md)** 🔴 — what middleware really is: a function that wraps the next one.
5. **[The Host, DI & Configuration](05-host-di-configuration.md)** 🔴 — `WebApplication`/the generic host, the service container, and config sources.
6. **[How Minimal APIs & MVC Sit on Top](06-how-minimal-apis-and-mvc-sit-on-top.md)** 🟢 — endpoint routing, and where your handlers plug in.
7. **[Where to Go Next](07-where-to-go-next.md)** 🟢 — applying this to real apps, performance, and the ecosystem.

> The throughline: **Kestrel listens, a middleware pipeline of `RequestDelegate`s processes each request,
> and the host wires up DI + configuration + the server.** That's the machine inside every .NET web app.

---

[Phase 1: What Kestrel & the Pipeline Are →](01-what-kestrel-and-the-pipeline-are.md)
