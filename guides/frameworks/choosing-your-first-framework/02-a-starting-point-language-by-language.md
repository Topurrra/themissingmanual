---
title: "A Starting Point, Language by Language"
guide: "choosing-your-first-framework"
phase: 2
summary: "One opinionated framework recommendation per language - Flask for Python, Express for JavaScript/Node, Gin for Go, Axum for Rust, Spring Boot for Java, ASP.NET Core for C# - with the reason each beats the flashier alternative for a first project."
tags: [frameworks, flask, express, gin, axum, spring-boot, aspnet-core, beginner]
difficulty: beginner
synonyms: ["best python framework for beginners", "flask vs django vs fastapi", "express vs nestjs for beginners", "gin vs echo go framework", "axum vs actix rust", "spring boot for beginners", "aspnet core vs other dotnet frameworks"]
updated: 2026-07-06
---

# A Starting Point, Language by Language

Find your language below. Each one gets a direct recommendation, the reason it beats the more
hyped alternative for a *first* framework, and links to both the framework and the language guide
it assumes.

## Python: start with Flask

[Flask](/guides/flask-from-zero) before [FastAPI](/guides/fastapi-from-zero) or
[Django](/guides/django-from-zero). Flask hands you a handful of decorators and gets out of the
way - you see every request and response with nothing hidden. FastAPI adds type hints, async, and
automatic docs generation, all genuinely useful, but they're a second layer of concepts stacked on
top of "how does a web framework work" - learn that first, in Flask, then FastAPI's extra features
read as additions instead of a wall. Django is a different animal entirely: an ORM, an admin
panel, a templating engine, and a project structure it insists on, all before you've written your
first route. That's real power for a full application, and overkill for learning what a web
framework even does.

Needs [Python](/guides/python-from-zero) first.

## JavaScript / Node: start with Express

[Express](/guides/express-from-zero) before [NestJS](/guides/nestjs-from-zero). Express is close
to raw Node - you define a route, you get a request and response object, you send something back.
Nest wraps that in decorators, dependency injection, and an Angular-style module system, which pays
off on a large team codebase but adds an architecture to learn before you've learned what the
underlying requests even look like. Start with Express, feel the raw shape of a request-response
cycle, then Nest's structure makes sense as a solution to a problem you've actually felt.

Needs [JavaScript](/guides/javascript-from-zero) (or [TypeScript](/guides/typescript-from-zero))
first.

## Go: start with Gin

[Gin](/guides/gin-from-zero) is the default choice in Go's web space - a thin, fast router with
middleware support and clean error handling, without reinventing how Go itself works. Go's standard
library already handles HTTP well (`net/http` is genuinely usable on its own - see Phase 3), so Go
frameworks stay intentionally light. Gin is the least ceremony you can add on top while still
getting route params, grouping, and middleware for free.

Needs [Go](/guides/go-from-zero) first.

## Rust: start with Axum

[Axum](/guides/axum-from-zero) is the natural first pick because it's built by the same team behind
Tokio, Rust's async runtime, so it fits the rest of the async ecosystem without fighting it.
Extractors (pulling a JSON body or a path param into a typed argument) map directly onto ideas
you'll already have from Rust's type system, instead of introducing a parallel mental model. It's
also the framework most new Rust web content assumes, so tutorials and examples line up with what
you're using.

Needs [Rust](/guides/rust-from-zero) first.

## Java: start with Spring Boot

[Spring Boot](/guides/spring-boot-from-zero) isn't the minimal choice, but it's the standard one -
the framework the majority of Java backend jobs actually run on. Fighting that and hand-rolling
servlets first buys you little: Java's ecosystem has settled on Spring so thoroughly that "learning
Java web development" and "learning Spring Boot" are close to the same task in practice. Boot's
auto-configuration removes most of classic Spring's XML-and-ceremony reputation - you annotate a
class and it wires itself up.

Needs [Java](/guides/java-from-zero) first.

## C#: start with ASP.NET Core

[ASP.NET Core](/guides/aspnet-core-from-zero) is the only serious option and that's a feature, not
a gap - Microsoft ships it as part of the .NET platform itself, so there's no "which framework"
debate to have. It covers minimal APIs (a few lines to a working JSON endpoint) up through full
MVC apps, so you can start as small as you want and grow into more structure only when you need it.

Needs [C#](/guides/csharp-from-zero) first.

## The pattern across all of them

Every recommendation above follows the same logic: start with the option that shows you the most
of what's actually happening, not the one with the most features bolted on. Fewer moving parts
means fewer things standing between you and understanding your own code. Add DI containers, ORMs,
and code generation once you've felt the problem they solve - not before.

```quiz
[
  {
    "q": "Why start with Flask instead of Django for a first Python web framework?",
    "choices": [
      "Django doesn't support REST APIs",
      "Flask has a simpler mental model with fewer moving parts, while Django bundles an ORM, admin panel, and enforced project structure before you've written a route",
      "Flask is faster at runtime than Django",
      "Django is no longer maintained"
    ],
    "answer": 1,
    "explain": "Django is real power for a full application, but that power arrives before you've learned what a web framework does at all. Flask shows you the request/response cycle directly."
  },
  {
    "q": "Why is Axum a natural first pick for Rust specifically?",
    "choices": [
      "It has no dependencies at all",
      "It's built by the Tokio team, so it fits Rust's async ecosystem, and its extractors map onto Rust's type system you already know",
      "It doesn't require an async runtime",
      "It is the only web framework available in Rust"
    ],
    "answer": 1,
    "explain": "Axum lines up with Tokio (Rust's async runtime) rather than fighting it, and its typed extractors build on ideas already familiar from Rust's type system."
  },
  {
    "q": "Why is ASP.NET Core recommended for C# without much debate?",
    "choices": [
      "It's the only web framework that supports HTTPS",
      "It ships as part of the .NET platform itself, covering everything from minimal APIs to full MVC apps, so there's no competing ecosystem choice to make",
      "It requires no knowledge of C#",
      "It was only released this year"
    ],
    "answer": 1,
    "explain": "Unlike Python or JavaScript, C# doesn't have a fragmented web framework landscape - ASP.NET Core is shipped by Microsoft as part of .NET and scales from a few lines to a full app."
  }
]
```

---

[← Phase 1: You Don't Need to Learn Ten Frameworks](01-you-dont-need-to-learn-ten-frameworks.md) · [Guide overview](_guide.md) · [Phase 3: When You Don't Need a Framework Yet →](03-when-you-dont-need-a-framework-yet.md)
