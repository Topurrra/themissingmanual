---
title: "Dependency Injection"
guide: "aspnet-core-from-zero"
phase: 4
summary: "Register services against interfaces in one place and let the framework construct and supply them. Covers the three lifetimes, constructor and handler injection, and the captive-dependency trap."
tags: [aspnet-core, csharp, dependency-injection, services, lifetimes]
difficulty: intermediate
synonyms: ["aspnet dependency injection", "addscoped addsingleton addtransient", "aspnet service lifetimes", "constructor injection", "aspnet di container", "register services"]
updated: 2026-07-10
---

# Dependency Injection

Here's the mental model: **you register services in one place, and the framework constructs them and hands them to whatever asks.** You stop writing `new ProductRepository()` scattered through your code. Instead you say, once, "when something needs an `IProductRepository`, give it a `ProductRepository`," and the framework does the wiring - code against interfaces, not `new`.

> 📝 The container that does this wiring is built into ASP.NET Core - nothing to install, no third-party library to bolt on. The moment you call `WebApplication.CreateBuilder(args)`, you already have a dependency-injection container sitting on `builder.Services`, waiting for you to register things.

## Why bother - the problem DI solves

Imagine the products endpoint reaches straight for the data layer:

```csharp
app.MapGet("/products", () =>
{
    var repo = new ProductRepository();   // hard-wired to one concrete class
    return repo.All();
});
```

*What just happened:* the endpoint creates its own repository with `new`. It works, but is welded to that exact class. To test it, you'd hit the real data store; to swap implementations (in-memory for tests, cached in production), you'd edit every place that calls `new`. The endpoint knows *too much* about how a repository gets built.

Dependency injection flips this: the endpoint declares *what it needs* (an `IProductRepository`) and lets the framework decide *what to hand over* and *how to build it*, so it stops caring about construction entirely.

## Step 1: program to an interface

DI works best when you depend on an interface, not a concrete class. Define the contract first, then an implementation:

```csharp
public interface IProductRepository
{
    IEnumerable<Product> All();
    Product? Find(int id);
}

public class ProductRepository : IProductRepository
{
    private readonly List<Product> _products =
    [
        new(1, "Keyboard", 49.99m),
        new(2, "Mouse", 24.99m),
    ];

    public IEnumerable<Product> All() => _products;
    public Product? Find(int id) => _products.FirstOrDefault(p => p.Id == id);
}

public record Product(int Id, string Name, decimal Price);
```

*What just happened:* `IProductRepository` is the contract - the *what*. `ProductRepository` is one *how*. Endpoints depend only on the interface, so the concrete class becomes a swappable detail. (This is the in-memory list from earlier phases, now hidden behind an interface.)

## Step 2: register the service

Now tell the container about the mapping, on `builder.Services`, before `builder.Build()`:

```csharp
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddScoped<IProductRepository, ProductRepository>();

var app = builder.Build();
```

*What just happened:* You registered a rule: "whenever someone asks for `IProductRepository`, construct a `ProductRepository` and supply it." The two type arguments are the contract and the implementation, in that order. `AddScoped` is *one* of three lifetimes, which control *how often* the framework builds a fresh instance - the next thing to understand.

## Step 3: the three lifetimes

Registering a service answers one question: **how long should a single instance live before the framework throws it away and builds a new one?** Three answers:

| Method | One instance per… | Reach for it when… |
|--------|-------------------|--------------------|
| `AddSingleton` | the whole app | the service is stateless or holds shared, long-lived state (config, an in-memory cache, a clock) |
| `AddScoped` | one HTTP request | the service should be fresh per request - the **default** for data access like a `DbContext` or repository |
| `AddTransient` | every single resolution | the service is lightweight and you want a brand-new one each time it's asked for |

```csharp
builder.Services.AddSingleton<IClock, SystemClock>();           // one forever
builder.Services.AddScoped<IProductRepository, ProductRepository>(); // one per request
builder.Services.AddTransient<IPriceFormatter, PriceFormatter>();    // one each time
```

*What just happened:* three registrations, three lifecycles. `IClock` is built once and shared for the life of the app. The repository is built once *per incoming HTTP request* - two simultaneous requests get two separate repositories, but within one request everyone shares the same one. The formatter is built fresh every time anything asks for it.

> 💡 When in doubt, **`AddScoped` is the sensible default** for application services and anything touching data - it gives each request its own clean instance and lets the framework dispose it when the request ends. Reach for `Singleton` only for genuinely shared state, and `Transient` for cheap, stateless helpers.

## Step 4: consume the service

You registered it - now use it. In a minimal API, you don't fetch the service, you **declare it as a handler parameter** and the framework supplies it:

```csharp
app.MapGet("/products", (IProductRepository repo) => repo.All());

app.MapGet("/products/{id:int}", (int id, IProductRepository repo) =>
    repo.Find(id) is { } product
        ? Results.Ok(product)
        : Results.NotFound());
```

*What just happened:* the handler asks for an `IProductRepository` in its parameter list. The framework recognizes it as a registered service, builds one per its lifetime, and passes it in. You never wrote `new` - swap the registration and every handler quietly gets the new implementation.

In classes - controllers, your own services, background workers - injection happens through the **constructor** instead:

```csharp
public class ProductService
{
    private readonly IProductRepository _repo;

    public ProductService(IProductRepository repo)   // framework supplies this
    {
        _repo = repo;
    }

    public decimal TotalCatalogValue() => _repo.All().Sum(p => p.Price);
}
```

*What just happened:* `ProductService` declares its dependency as a constructor parameter and stashes it in a `readonly` field. When something asks the container for a `ProductService`, the framework sees the constructor needs an `IProductRepository`, builds that too, and passes it in - a chain of construction you never manage by hand.

> 💡 Most minimal-API handlers can tell your services from your bound data by their types. If the framework can't tell whether a parameter is a service or request data, mark it with `[FromServices]`: `app.MapGet("/total", ([FromServices] ProductService svc) => svc.TotalCatalogValue());`.

## The trap: captive dependencies

The pitfall that bites everyone eventually. Lifetimes have a rule: **a service can safely depend on others of the same lifetime or longer-lived ones - but not shorter-lived ones.**

The classic violation is injecting a **Scoped** service into a **Singleton**:

```csharp
// ⚠️ DON'T do this
public class ProductCache
{
    private readonly IProductRepository _repo;   // Scoped...
    public ProductCache(IProductRepository repo) // ...captured by a Singleton
    {
        _repo = repo;
    }
}

builder.Services.AddSingleton<ProductCache>();   // lives for the whole app
```

*What just happened:* `ProductCache` is a singleton - built once, kept forever. But it grabs a `ProductRepository`, which is *scoped* - meant to live for one request and then be disposed. Because the singleton holds onto it, that repository never gets released: it's been **captured**, and every request unknowingly shares the same stale instance. EF Core's `DbContext` - scoped by default - is the textbook casualty; a singleton clutching one surfaces as bizarre data corruption under load.

> ⚠️ Rule of thumb: **never inject something shorter-lived into something longer-lived.** Scoped-into-singleton and transient-into-singleton are the dangerous pairs. The fix is usually to make the outer service scoped too, or - when a singleton genuinely needs per-request work - inject an `IServiceScopeFactory` and create a scope on demand. The built-in container even has a "scope validation" check that throws on these mistakes in development, so it often catches you before production does.

## Why this is the backbone of testable code

Notice what DI bought you. Your endpoints and services depend on `IProductRepository`, never on `ProductRepository`. In a test, you register a fake - an in-memory or stubbed implementation of the same interface - and *every* consumer transparently uses it, no production code changed. The framework also owns the lifecycle: it builds your services, hands them around, and disposes them at the right moment.

That's the payoff: **decoupling** plus **managed lifetimes** - what makes ASP.NET Core code straightforward to test, the muscle you'll flex in [Phase 8: Testing & Production](08-testing-and-production.md).

## Recap

- **The model:** register services in one place; the framework constructs them and supplies them to whatever asks. You code against interfaces, not `new`.
- **Register** on `builder.Services` against an interface, e.g. `AddScoped<IProductRepository, ProductRepository>()` - contract first, implementation second.
- **Three lifetimes:** `AddSingleton` (one per app), `AddScoped` (one per HTTP request - the default for data access like a `DbContext`), `AddTransient` (a new one every resolution).
- **Consume** via handler parameters in minimal APIs and via the **constructor** in classes; use `[FromServices]` to disambiguate when needed.
- **Captive dependency:** never inject a shorter-lived service into a longer-lived one - a Scoped (or Transient) thing captured by a Singleton outlives its scope and breaks under load.
- **Payoff:** decoupling plus framework-managed lifetimes, which is what makes your code testable.

## Quick check

```quiz
[
  {
    "q": "Which lifetime gives you one instance per HTTP request and is the sensible default for a repository or DbContext?",
    "choices": ["AddSingleton", "AddScoped", "AddTransient", "AddRequest"],
    "answer": 1,
    "explain": "AddScoped builds one instance per HTTP request, shared within that request and disposed when it ends - ideal for data access like a DbContext."
  },
  {
    "q": "In a minimal API, how does a handler receive a registered service?",
    "choices": ["By calling new on the concrete class", "By declaring it as a handler parameter, which the framework supplies", "By reading it from a global static field", "By passing it in the route template"],
    "answer": 1,
    "explain": "You declare the service as a handler parameter (e.g. (IProductRepository repo)); the framework recognizes the registered type and injects it."
  },
  {
    "q": "Why is injecting a Scoped service into a Singleton a bug?",
    "choices": ["Singletons can't take constructor parameters", "The Scoped service gets captured and outlives its scope, so every request shares one stale instance", "Scoped services are slower than Singletons", "The container refuses to register any Singleton"],
    "answer": 1,
    "explain": "The singleton holds the scoped instance forever - a captive dependency. It never gets disposed and is shared across all requests, causing hard-to-reproduce bugs under load (classic with EF Core's DbContext)."
  }
]
```

---

[← Phase 3: Model Binding & Validation](03-model-binding-and-validation.md) · [Guide overview](_guide.md) · [Phase 5: The Middleware Pipeline →](05-middleware-pipeline.md)
