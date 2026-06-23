---
title: "Building a REST API"
guide: "aspnet-core-from-zero"
phase: 6
summary: "Assemble routing, model binding, validation, and DI into a full CRUD products API — five endpoints over one collection, backed by a thread-safe in-memory repository and returning typed Results."
tags: [aspnet-core, csharp, rest, api, crud]
difficulty: intermediate
synonyms: ["aspnet rest api", "minimal api crud", "aspnet products api", "aspnet results created notfound", "dotnet web api example", "aspnet mapgroup crud"]
updated: 2026-06-23
---

# Building a REST API

Here's the mental model that turns five separate phases into one coherent thing: **a REST resource is five endpoints over one collection.** List them all, fetch one, create one, replace one, delete one. That's it. Every framework you'll ever touch — Express, Rails, Django, Spring — expresses this same five-fingered shape. In ASP.NET Core you express it with minimal APIs: each endpoint wired through **dependency injection** to a repository, returning a **typed `Results`** that says exactly what HTTP status it means.

So this phase isn't new material. It's the payoff. You already have the pieces: routing and route groups ([Phase 2](02-routing-and-minimal-apis.md)), binding the request body into a type and validating it ([Phase 3](03-model-binding-and-validation.md)), and the injected `IProductRepository` ([Phase 4](04-dependency-injection.md)). We're going to snap them together into a real, working `/api/v1/products` API.

> 📝 The thing to hold onto: each of the five endpoints is just *bind the input → call the repository → return a `Results` with the right status code*. Once you see that one pattern, all five are variations on it.

## The repository, with a real store behind it

In Phase 4 the `IProductRepository` only knew how to read — `All()` and `Find(id)`. A CRUD API needs to write too, so let's widen the contract and give it a store that can actually hold new products:

```csharp
public interface IProductRepository
{
    IEnumerable<Product> All();
    Product? Find(int id);
    Product Add(string name, decimal price);
    Product? Update(int id, string name, decimal price);
    bool Delete(int id);
}

public record Product(int Id, string Name, decimal Price);
```

*What just happened:* The interface grew three write methods. `Add` returns the created `Product` (so the caller learns the new `Id`), `Update` returns `Product?` — `null` means "no such id" — and `Delete` returns a bool for found-or-not. The endpoints will lean on those return shapes to choose their status codes.

Now the implementation. The earlier phases used a plain `List<Product>`, which was fine for reads. But a CRUD API mutates shared state, and **incoming requests run concurrently** — ASP.NET Core handles many at once on different threads. Two simultaneous `POST`s racing on a `List` and an `int` counter will corrupt it or hand out duplicate ids. So the store has to be thread-safe:

```csharp
using System.Collections.Concurrent;

public class ProductRepository : IProductRepository
{
    private readonly ConcurrentDictionary<int, Product> _products = new();
    private int _nextId = 0;

    public ProductRepository()
    {
        Add("Keyboard", 49.99m);
        Add("Mouse", 24.99m);
    }

    public IEnumerable<Product> All() => _products.Values;

    public Product? Find(int id) =>
        _products.TryGetValue(id, out var product) ? product : null;

    public Product Add(string name, decimal price)
    {
        var id = Interlocked.Increment(ref _nextId);
        var product = new Product(id, name, price);
        _products[id] = product;
        return product;
    }

    public Product? Update(int id, string name, decimal price)
    {
        if (!_products.ContainsKey(id)) return null;
        var updated = new Product(id, name, price);
        _products[id] = updated;
        return updated;
    }

    public bool Delete(int id) => _products.TryRemove(id, out _);
}
```

*What just happened:* `ConcurrentDictionary<int, Product>` gives us thread-safe reads, writes, and removes without us hand-rolling locks. `Interlocked.Increment` bumps the id counter atomically, so two racing `Add`s can never collide on the same id. The constructor seeds a couple of products so the API isn't empty on first run. This is the same idea as before — an in-memory store hidden behind the interface — hardened for the fact that real requests overlap.

> ⚠️ The trap here is subtle because it doesn't show up until *load*. A plain `List` and `count++` work perfectly when you test by hand, one request at a time — then fall over in production when traffic overlaps. If a collection is shared across requests and gets written to, reach for a concurrent collection (or a lock). Don't wait for the heisenbug.

Register it exactly as in Phase 4 — contract first, implementation second. We'll use `AddSingleton` here so the in-memory store survives across requests (a `Scoped` repository would build a fresh, empty dictionary every request and "forget" everything):

```csharp
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddSingleton<IProductRepository, ProductRepository>();
var app = builder.Build();
```

*What just happened:* One registration, and every endpoint that declares an `IProductRepository` parameter now gets the same shared instance. The singleton lifetime is deliberate: it's an in-memory store, so it *needs* to outlive a single request to remember the products you've added. (When you move to a real database, that flips back to `Scoped` — more on that at the end.)

## The five endpoints, grouped

Rather than scatter `MapGet`/`MapPost` calls with the same `/api/v1/products` prefix repeated five times, group them. A `MapGroup` declares the shared path once and hangs the endpoints off it:

```csharp
var products = app.MapGroup("/api/v1/products");

// GET /api/v1/products  → list all
products.MapGet("/", (IProductRepository repo) =>
    Results.Ok(repo.All()));

// GET /api/v1/products/{id}  → one, or 404
products.MapGet("/{id:int}", (int id, IProductRepository repo) =>
    repo.Find(id) is { } product
        ? Results.Ok(product)
        : Results.NotFound());

// POST /api/v1/products  → create, 201 with Location
products.MapPost("/", (CreateProduct input, IProductRepository repo) =>
{
    var product = repo.Add(input.Name, input.Price);
    return Results.Created($"/api/v1/products/{product.Id}", product);
});

// PUT /api/v1/products/{id}  → replace, or 404
products.MapPut("/{id:int}", (int id, CreateProduct input, IProductRepository repo) =>
    repo.Update(id, input.Name, input.Price) is { } updated
        ? Results.Ok(updated)
        : Results.NotFound());

// DELETE /api/v1/products/{id}  → 204, or 404
products.MapDelete("/{id:int}", (int id, IProductRepository repo) =>
    repo.Delete(id) ? Results.NoContent() : Results.NotFound());

app.Run();
```

*What just happened:* Five endpoints, one shared prefix. Look at how each handler follows the same rhythm — pull the inputs (route values, bound body, injected repo), call one repository method, return a `Results` matching the outcome:

- **List** — always `Results.Ok` with the collection. `200 OK`.
- **Get one** — the `is { } product` pattern means "if `Find` returned non-null, bind it to `product`." Found → `200 OK`; otherwise `Results.NotFound()` → `404`.
- **Create** — `CreateProduct` is the input record from Phase 3; the framework binds it from the JSON body. `Results.Created(location, body)` returns `201 Created` *and* a `Location` header pointing at the new resource — the correct, polite REST answer to a successful POST.
- **Replace** — same null-check pattern: `200 OK` with the updated product, or `404` if that id never existed.
- **Delete** — `204 No Content` (success, nothing to return in the body) or `404`.

> 💡 `Results.X` and `TypedResults.X` are siblings: `Results.Ok(x)` and `TypedResults.Ok(x)` do the same thing at runtime. The difference is that `TypedResults` returns a *concrete, typed* result (`Ok<Product>` rather than the generic `IResult`), which makes endpoints easier to unit-test and lets the framework infer your response types for OpenAPI. When you start writing tests in [Phase 8](08-testing-and-production.md), prefer `TypedResults`.

### What about validation?

You don't repeat the validation logic here — it rides along from Phase 3. If `CreateProduct` carries data annotations (e.g. `[Required]` on `Name`, `[Range]` on `Price`) and you've wired up validation, a bad body is rejected with a `400` *before* your handler ever runs. The endpoint stays clean: by the time `repo.Add(input.Name, input.Price)` executes, you already know the input is valid. That's the whole point of doing binding and validation as their own phase — every endpoint inherits it for free.

## Driving it from the command line

Let's exercise all five with `curl`. Start the app, then in another terminal:

```bash
# List the seeded products
curl http://localhost:5000/api/v1/products
# → 200
# [{"id":1,"name":"Keyboard","price":49.99},{"id":2,"name":"Mouse","price":24.99}]

# Fetch one that exists
curl http://localhost:5000/api/v1/products/1
# → 200
# {"id":1,"name":"Keyboard","price":49.99}

# Fetch one that doesn't
curl -i http://localhost:5000/api/v1/products/999
# → HTTP/1.1 404 Not Found

# Create a new product
curl -i -X POST http://localhost:5000/api/v1/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Monitor","price":199.99}'
# → HTTP/1.1 201 Created
# → Location: /api/v1/products/3
# {"id":3,"name":"Monitor","price":199.99}

# Replace it
curl -X PUT http://localhost:5000/api/v1/products/3 \
  -H "Content-Type: application/json" \
  -d '{"name":"Monitor 4K","price":249.99}'
# → 200
# {"id":3,"name":"Monitor 4K","price":249.99}

# Delete it
curl -i -X DELETE http://localhost:5000/api/v1/products/3
# → HTTP/1.1 204 No Content
```

*What just happened:* You walked the full lifecycle of a resource — create, read, update, delete — and each response carried a status code that *means something*. `200` for "here it is," `201 Created` plus a `Location` header for "made it, find it here," `204` for "done, nothing to say," `404` for "no such thing." A well-behaved REST client reads those codes; getting them right is most of what separates a real API from one that just happens to return JSON. (The `-i` flag tells `curl` to print the response headers so you can see the status line and `Location`.)

## You just built the shape every framework shares

Step back. The endpoints you wrote contain almost no logic — they bind input, call one repository method, and pick a status code. **All the actual work lives behind the `IProductRepository` interface**, and the endpoints don't know or care what's behind it. Right now it's a `ConcurrentDictionary`. Tomorrow it's a database.

> 💡 That's the seam that makes this worth the ceremony. When you swap the in-memory store for an [EF Core](/guides/efcore-from-zero)-backed `ProductRepository` that talks to a real SQL database, **not one line of these five endpoints changes.** You write a new class implementing the same interface, change the one registration line, and the API keeps behaving identically — now with persistence. The endpoints were always coding against the contract, never the implementation. That's dependency injection earning its keep.

## Recap

- **A REST resource is five endpoints over one collection:** list, get-one, create, replace, delete — the same shape in every framework, expressed here with minimal APIs.
- **Group the resource** with `app.MapGroup("/api/v1/products")`, then hang `MapGet`/`MapPost`/`MapPut`/`MapDelete` off it so the path prefix is declared once.
- **Back it with a thread-safe store:** requests run concurrently, so use a `ConcurrentDictionary` + `Interlocked.Increment` (or a lock), not a plain `List` and `count++` — the bug only shows up under load.
- **Return typed `Results`/`TypedResults`** that carry meaning: `Ok` (200), `Created(location, body)` (201 with a `Location` header), `NoContent` (204), `NotFound` (404). Status codes are the contract.
- **Binding, validation, and DI come for free** from earlier phases — each handler just binds input, calls the repository, and picks a status. A bad body is rejected before your code runs.
- **The interface is the seam:** swap the in-memory repository for an EF Core one ([EF Core From Zero](/guides/efcore-from-zero)) and the endpoints don't change — only the registration line does.

## Quick check

```quiz
[
  {
    "q": "Why use a ConcurrentDictionary plus Interlocked.Increment for the in-memory store instead of a List and an int counter?",
    "choices": ["A List can't hold records", "Incoming requests run concurrently, so a non-thread-safe collection and counter can corrupt or hand out duplicate ids under load", "ConcurrentDictionary is required by MapGroup", "It makes the JSON serialize faster"],
    "answer": 1,
    "explain": "ASP.NET Core serves requests concurrently on multiple threads. A plain List and count++ work in single-request hand-testing but race and corrupt under real overlapping traffic — so the shared, mutated store must be thread-safe."
  },
  {
    "q": "What should a successful POST that creates a product return?",
    "choices": ["Results.Ok(product) — 200", "Results.NoContent() — 204", "Results.Created($\"/api/v1/products/{id}\", product) — 201 with a Location header", "Results.NotFound() — 404"],
    "answer": 2,
    "explain": "A create returns 201 Created with a Location header pointing at the new resource. Results.Created(location, body) sets both the status and the header — the correct REST response to a successful POST."
  },
  {
    "q": "You swap the in-memory ProductRepository for an EF Core-backed one. What has to change in the five endpoints?",
    "choices": ["Every handler must be rewritten to call the DbContext", "Nothing — the endpoints depend on IProductRepository, so only the new class and the registration line change", "MapGroup must be replaced with controllers", "The route templates must include the table name"],
    "answer": 1,
    "explain": "The endpoints code against the IProductRepository interface, never the concrete class. A new implementation plus changing the one registration line is all it takes — the handlers are untouched. That's the payoff of DI."
  }
]
```

---

[← Phase 5: The Middleware Pipeline](05-middleware-pipeline.md) · [Guide overview](_guide.md) · [Phase 7: Authentication & Authorization →](07-auth.md)
