---
title: "ASP.NET Core From Zero"
guide: "aspnet-core-from-zero"
phase: 0
summary: "Learn Microsoft's modern, cross-platform web framework: minimal APIs and your first server, routing, model binding and validation, dependency injection, the middleware pipeline, building a REST API, authentication, and testing and production. The framework behind a huge share of enterprise backends, taught mental-model-first."
tags: [aspnet-core, csharp, dotnet, web, framework, rest, api, minimal-apis]
category: frameworks
order: 27
group: "C#"
difficulty: intermediate
synonyms: ["learn asp.net core", "aspnet core tutorial", "dotnet web api", "minimal apis", "aspnet core dependency injection", "aspnet core middleware", "aspnet core model binding", "csharp rest api", "aspnet core vs"]
updated: 2026-06-23
---

# ASP.NET Core From Zero

ASP.NET Core is Microsoft's modern web framework — cross-platform, fast, and open source — and it sits
under an enormous share of enterprise backends. If you write C# on the server, this is almost certainly
the framework you'll use. The modern version is a clean break from the old .NET Framework days: it runs on
Linux and macOS as happily as Windows, it's genuinely quick, and since .NET 6 it offers **minimal APIs**
that let you stand up an endpoint in a few lines — no ceremony required.

The mental model has two pillars that hold up everything else. First, a request flows through a
**middleware pipeline** — an ordered chain where each piece can act on the request, pass it along, and act
on the response coming back. Second, your code gets its dependencies through **dependency injection**: you
register services in one place, and the framework hands them to whatever needs them. Learn "requests flow
through a pipeline, and services are injected," and the rest of ASP.NET Core — routing, binding, auth — is
detail that hangs off those two ideas.

> 📝 This teaches the **framework** — it assumes you know **C#**: classes, interfaces, generics,
> `async`/`await`, and records ([C# From Zero](/guides/csharp-from-zero)). It pairs with
> [What a Framework Even Is](/guides/what-a-framework-even-is); its data layer is
> [EF Core](/guides/efcore-from-zero); and the server + pipeline beneath it are the roots guide
> [The ASP.NET Pipeline & Kestrel](/guides/the-aspnet-pipeline-and-kestrel). It compiles and runs as a
> .NET program, so examples are shown with the commands to run them.

## How to read this

Read in order — it grows one service (a small **products API**) from a single endpoint to a tested,
deployable REST API. Phases carry difficulty badges.

## The phases

**Part 1 — The core (🟢 Basic → 🟡)**
1. **[What ASP.NET Core Is & Your First Server](01-what-aspnet-core-is.md)** 🟢 — the framework, minimal APIs, and a running app in a few lines.
2. **[Routing & Minimal APIs](02-routing-and-minimal-apis.md)** 🟢 — `MapGet`/`MapPost`, route and query params, and route groups.
3. **[Model Binding & Validation](03-model-binding-and-validation.md)** 🟡 — binding the body/route/query to types, and validating with data annotations.

**Part 2 — A real app (🟡 → 🔴)**
4. **[Dependency Injection](04-dependency-injection.md)** 🟡 — registering services, lifetimes, and constructor injection.
5. **[The Middleware Pipeline](05-middleware-pipeline.md)** 🔴 — `Use`/`Run`/`Map`, ordering, and writing your own middleware.
6. **[Building a REST API](06-building-a-rest-api.md)** 🟡 — full CRUD with `Results`, DI, and a service.
7. **[Authentication & Authorization](07-auth.md)** 🔴 — JWT bearer auth, `[Authorize]`, and protecting endpoints.

**Part 3 — Ship it (🟡 → 🟢)**
8. **[Testing & Production](08-testing-and-production.md)** 🟡 — `WebApplicationFactory` integration tests, config, and deployment.
9. **[Where to Go Next](09-where-to-go-next.md)** 🟢 — minimal APIs vs controllers, EF Core, Blazor, and what to build.

> The throughline: a request travels a **middleware pipeline** to an endpoint, and your code receives its
> collaborators through **dependency injection**. Hold those two and ASP.NET Core is approachable.

---

[Phase 1: What ASP.NET Core Is & Your First Server →](01-what-aspnet-core-is.md)
