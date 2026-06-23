---
title: "What ASP.NET Core Is & Your First Server"
guide: "aspnet-core-from-zero"
phase: 1
summary: "ASP.NET Core is Microsoft's modern, cross-platform web framework. A request flows through a middleware pipeline to your code, which gets services via dependency injection. Build and run a minimal API."
tags: [aspnet-core, csharp, dotnet, web, getting-started]
difficulty: beginner
synonyms: ["what is asp.net core", "aspnet core first app", "minimal api hello world", "WebApplication CreateBuilder", "dotnet new web", "aspnet core program.cs"]
updated: 2026-06-23
---

# What ASP.NET Core Is & Your First Server

You know [C#](/guides/csharp-from-zero) — classes, records, `async`/`await` — and now you want to put
something on the web with it. ASP.NET Core is the answer almost everyone reaches for. It's Microsoft's
modern web framework: cross-platform (it runs on Linux and macOS as happily as Windows), genuinely fast,
and open source. It sits under an enormous share of the world's enterprise backends — banks, retailers,
government systems. If you write C# on the server, this is the framework you'll meet.

The word "modern" is doing real work here. The old .NET Framework was Windows-only and ceremony-heavy.
The version you'll learn is a clean break: it runs anywhere, and since .NET 6 it offers **minimal APIs**
that let you stand up a working server in a handful of lines. No sprawling boilerplate, no XML config
files — a request comes in, your function runs, a response goes out.

> 📝 This guide teaches the **framework**, and it assumes you already know **C#**. It pairs with
> [What a Framework Even Is](/guides/what-a-framework-even-is); its data layer is
> [EF Core](/guides/efcore-from-zero); and the server and pipeline underneath it are the roots guide
> [The ASP.NET Pipeline & Kestrel](/guides/the-aspnet-pipeline-and-kestrel). The examples here are
> regular C# you compile and run — not editable in the browser — so each one comes with the commands
> to run it yourself.

## The mental model: a pipeline and an injector

Before any code, hold two ideas in your head. Everything else in ASP.NET Core — routing, validation,
auth — hangs off these two, and if you learn them now the rest reads as detail rather than magic.

📝 **First, a request flows through a middleware pipeline.** When a request arrives, it doesn't jump
straight to your code. It travels through an ordered chain of components — each one can look at the
request, do something, hand it to the next link, and then act on the response coming back. Logging,
authentication, error handling: each is a link in that chain. (Phase 5 builds the pipeline properly.)

📝 **Second, your code receives its dependencies through dependency injection.** Instead of your code
reaching out to create the things it needs — a database connection, a logger, a service — you *register*
those in one place and the framework *hands* them to whatever asks. You declare what you need; the
framework supplies it. (Phase 4 covers DI in full.)

💡 Say it once: **requests flow through a pipeline, and services are injected.** Both ideas have their
own deep dive later, and both ultimately rest on **Kestrel** — the high-performance web server ASP.NET
Core runs on — covered in [The ASP.NET Pipeline & Kestrel](/guides/the-aspnet-pipeline-and-kestrel).
For now, just plant the two pillars and let's get a server running.

## Your first server

Create a new project. From a terminal:

```bash
dotnet new web -o MyApi
cd MyApi
```

*What just happened:* `dotnet new web` scaffolded a minimal ASP.NET Core web project into a folder
called `MyApi` (the `-o` flag names the output folder). The template is deliberately tiny — no
controllers, no extra files, just a single `Program.cs` and a project file. That one `Program.cs` is
your entire application's starting point. Open it and you'll find something close to this:

```csharp
var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

app.MapGet("/", () => "Hello from ASP.NET Core");

app.Run();
```

*What just happened:* four lines, and that's a complete web server. Walking it top to bottom —
- `WebApplication.CreateBuilder(args)` creates a **builder**. This is where the framework wires up the
  essentials: configuration (reading settings and environment variables), logging, and — crucially —
  the **dependency injection container** where you'll later register services. `args` are the
  command-line arguments, passed through so flags can override config.
- `builder.Build()` takes everything the builder set up and produces the finished `app` — a
  `WebApplication` object. The builder *configures*; `Build()` *seals it* into a runnable app.
- `app.MapGet("/", () => "...")` registers an **endpoint**: when a `GET` request arrives for the path
  `/`, run this lambda. The lambda is your handler. Here it returns a string.
- `app.Run()` starts **Kestrel** (the server), which begins listening for requests. This call *blocks*
  — the program parks here, handling requests, until you stop it. Anything you want to set up has to
  happen *before* `Run()`.

Now run it:

```bash
dotnet run
```

```console
$ dotnet run
info: Microsoft.Hosting.Lifetime[14]
      Now listening on: http://localhost:5000
info: Microsoft.Hosting.Lifetime[0]
      Application started. Press Ctrl+C to shut down.
```

*What just happened:* `dotnet run` compiled your project and launched it. `app.Run()` brought Kestrel
up, and it's now listening (the exact port may differ on your machine — read it from the log). Leave it
running, and in another terminal hit the endpoint:

```console
$ curl http://localhost:5000/
Hello from ASP.NET Core
```

*What just happened:* `curl` sent a `GET /`. The request entered the pipeline, reached your `MapGet`
endpoint, the lambda ran, and its return value came back as the response body. You have a working web
server in four lines of real code. Press `Ctrl+C` in the first terminal to stop it.

## Returning text vs. returning an object

Notice the handler above returned a plain `string`, and you got plain text back. ASP.NET Core looks at
what your handler returns and does the sensible thing — and this is where it starts to feel like a real
API framework. Return a string, you get text. Return an *object*, and the framework serializes it to
**JSON** automatically.

Let's set up what the rest of this guide builds on: a small **products API**. First, a type to represent
a product — a C# `record`, which is perfect for this kind of immutable data:

```csharp
record Product(int Id, string Name, decimal Price);
```

*What just happened:* that one line declares a `Product` with three properties. A positional `record`
gives you the constructor, the properties, and value-based equality for free — exactly what you want for
a data shape that flows in and out as JSON. This `Product` is the cast member we'll spend the next eight
phases turning into a full REST API.

Now add a second endpoint that returns one:

```csharp
var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

app.MapGet("/", () => "Hello from ASP.NET Core");

app.MapGet("/products/sample", () => new Product(1, "Keyboard", 49.99m));

app.Run();

record Product(int Id, string Name, decimal Price);
```

*What just happened:* the new `MapGet` returns a `Product` object instead of a string. Because it's an
object, ASP.NET Core serializes it to JSON and sets the `Content-Type` header to `application/json` for
you — no manual serialization, no header fiddling. (The `record` declaration sits at the bottom because
in a top-level `Program.cs`, type declarations come after the executable statements.) Run it and ask for
the sample:

```console
$ curl http://localhost:5000/products/sample
{"id":1,"name":"Keyboard","price":49.99}
```

*What just happened:* the object came back as clean JSON, with the property names lower-cased the way
JSON conventionally wants them. Two endpoints, two return types, zero extra plumbing — that's the minimal
API trade you signed up for.

💡 When you need to control the *status code* too — a `200 OK` with a body, a `404 Not Found`, a
`201 Created` — you'll reach for the `Results` helpers: `Results.Ok(product)`, `Results.NotFound()`, and
friends. We lean on those heavily once we build real CRUD (Phases 2 and 6). For now, returning a value
directly is the quickest way to see data flow.

You've met the whole cast: a **builder** that sets up configuration, logging, and DI; the **`app`** it
builds; **endpoints** registered with `MapGet`; **Kestrel** started by `app.Run()`; and the **`Product`**
record we'll grow into a proper API. Next up: routing — turning one `/` endpoint into a real set of
paths with route and query parameters.

## Recap

- **ASP.NET Core is Microsoft's modern web framework** — cross-platform, fast, open source, and under a
  huge share of enterprise backends. The modern version is a clean break from old .NET Framework.
- **The mental model is two pillars:** a request **flows through a middleware pipeline** (Phase 5), and
  your code **receives services via dependency injection** (Phase 4). Both rest on Kestrel, the server.
- **A whole app starts in `Program.cs` with minimal APIs.** `WebApplication.CreateBuilder(args)` sets up
  config, logging, and the DI container; `builder.Build()` produces the `app`; `app.MapGet(...)`
  registers an endpoint; `app.Run()` starts Kestrel and blocks.
- **Create and run a project with the CLI:** `dotnet new web -o MyApi` scaffolds it, `dotnet run`
  compiles and launches it, and `curl` lets you hit your endpoints.
- **Return type decides the response:** returning a `string` sends text; returning an object
  auto-serializes to JSON. Use `Results.Ok(...)` / `Results.NotFound()` when you need explicit status.
- **The running example is a products API**, built on `record Product(int Id, string Name, decimal Price)`.

## Quick check

Three questions on the ideas that have to stick — what ASP.NET Core is, the two pillars, and how a first
server fits together:

```quiz
[
  {
    "q": "In a minimal API Program.cs, what does `WebApplication.CreateBuilder(args)` set up?",
    "choices": [
      "Configuration, logging, and the dependency injection container",
      "Only the route table for your endpoints",
      "The database schema and connection pool",
      "An HTML template engine for rendering pages"
    ],
    "answer": 0,
    "explain": "CreateBuilder produces the builder, which wires up configuration, logging, and the DI container. builder.Build() then turns that into the runnable app, and app.Run() starts Kestrel."
  },
  {
    "q": "What are the two pillars of ASP.NET Core's mental model?",
    "choices": [
      "Requests flow through a middleware pipeline, and your code receives dependencies via dependency injection",
      "A model layer and a view layer, like classic MVC only",
      "Synchronous controllers and asynchronous background jobs",
      "A compiler step and an interpreter step"
    ],
    "answer": 0,
    "explain": "Hold those two ideas and the rest is detail: a request travels an ordered middleware pipeline (Phase 5) to your endpoint, and the framework injects the services your code asks for (Phase 4)."
  },
  {
    "q": "An endpoint handler returns `new Product(1, \"Keyboard\", 49.99m)`. What does the client receive?",
    "choices": [
      "JSON, because ASP.NET Core auto-serializes returned objects and sets the Content-Type",
      "Plain text containing the object's type name",
      "An error, because handlers must return a string",
      "An empty 204 No Content response"
    ],
    "answer": 0,
    "explain": "Returning a string sends text; returning an object auto-serializes to JSON with Content-Type application/json. To control the status code explicitly, use the Results helpers like Results.Ok(...)."
  }
]
```

---

[Guide overview](_guide.md) · [Phase 2: Routing & Minimal APIs →](02-routing-and-minimal-apis.md)
