---
title: "Routing & Minimal APIs"
guide: "aspnet-core-from-zero"
phase: 2
summary: "How ASP.NET Core matches a request to your code: MapGet/MapPost and friends, binding route and query parameters, returning the right status with Results, and grouping endpoints with MapGroup."
tags: [aspnet-core, csharp, routing, minimal-apis, endpoints]
difficulty: beginner
synonyms: ["aspnet core routing", "minimal api mapget mappost", "aspnet route parameters", "aspnet query parameters", "aspnet mapgroup", "aspnet results"]
updated: 2026-06-23
---

# Routing & Minimal APIs

Here's the whole mental model: **a route is an HTTP method plus a path, pointing at a handler.** `GET /products` is one route. `POST /products` is a different route — same path, different method, different code runs. ASP.NET Core keeps a table of these, and when a request arrives it looks up the method-and-path pair, finds the matching handler, and runs it.

Minimal APIs are the leanest way to fill that table. You call `app.MapGet`, `app.MapPost`, and so on — each registers "when *this* method hits *this* path, run *this* function," usually a small lambda. The clever part: the framework looks at your handler's parameters and **fills them in for you** from the route, the query string, or the request body. You write a function that wants an `int id`, and ASP.NET Core figures out where to get an `id` from.

> 📝 You'll keep growing the **products API** from Phase 1. By the end of this phase it'll answer to a list endpoint and a by-id endpoint, return proper status codes, and live under a versioned URL prefix.

## The method maps

Every HTTP method you care about has a matching `Map` call on `app`:

```csharp
app.MapGet("/products", () => "all products");
app.MapPost("/products", () => "create a product");
app.MapPut("/products/{id}", (int id) => $"replace product {id}");
app.MapPatch("/products/{id}", (int id) => $"patch product {id}");
app.MapDelete("/products/{id}", (int id) => $"delete product {id}");
```

*What just happened:* Five routes, registered in five lines. `/products` appears twice — `MapGet` and `MapPost` to the same path are two separate routes because the method is part of the identity. The string is the path; the lambda is the handler. That's the entire shape of a minimal API endpoint, repeated.

Let's make the products list real instead of returning a string, by seeding a tiny in-memory list:

```csharp
var products = new List<Product>
{
    new(1, "Keyboard", 79.99m),
    new(2, "Mouse", 29.99m),
    new(3, "Monitor", 249.00m),
};

app.MapGet("/products", () => products);

app.Run();

record Product(int Id, string Name, decimal Price);
```

*What just happened:* The handler returns a `List<Product>`. When you return an object (or a list of them) from a minimal API handler, ASP.NET Core **serializes it to JSON automatically** and sends it back with `Content-Type: application/json`. Return a `string` and you get plain text instead — no serialization code required.

Run it and hit the endpoint:

```bash
curl http://localhost:5000/products
```

You'll get back a JSON array of the three products. So far, so good — but a real API needs to fetch *one* product, and that's where parameters come in.

## Route parameters

A path can contain a **placeholder** in curly braces. Write `{id}` in the route and an `int id` in the handler's parameter list, and ASP.NET Core matches them by name and converts the URL text into the type you asked for:

```csharp
app.MapGet("/products/{id}", (int id) =>
{
    var product = products.FirstOrDefault(p => p.Id == id);
    return product;
});
```

*What just happened:* A request to `/products/2` makes ASP.NET Core pull `"2"` out of the URL, see that your parameter is an `int`, parse it, and pass `2` into your lambda as `id`. The match is **by name** — `{id}` binds to the parameter named `id`, not by position. Rename one and not the other and the binding breaks.

That automatic conversion has a useful side effect: if someone requests `/products/banana`, `"banana"` can't become an `int`, so the route doesn't match and the framework returns a 400 — your handler never runs with bad data. Make that intent explicit with a **route constraint**, written as `{name:type}`:

```csharp
app.MapGet("/products/{id:int}", (int id) => products.FirstOrDefault(p => p.Id == id));
app.MapGet("/products/category/{slug:alpha}", (string slug) => $"category: {slug}");
```

*What just happened:* `{id:int}` tells the router "only match this route if the segment is an integer." `{slug:alpha}` matches only letters. Constraints filter *whether the route matches at all* — handy when two routes could otherwise collide, like a numeric id versus a text slug in the same position.

> ⚠️ Don't lean on route constraints for *validation*. They decide routing, not correctness — `{id:int}` happily accepts `-999` or `0`. Constraints answer "does this URL belong to this endpoint?" Real input checking is its own job — the whole of Phase 3.

## Query parameters

Route parameters live *in the path*. **Query parameters** live after the `?` — `/products?page=2&q=mouse` — the natural home for optional things like paging, filtering, and search. The binding rule is consistent: any handler parameter that **isn't** named in the route gets pulled from the query string (for simple types like `int`, `string`, `bool`, and their nullable versions).

```csharp
app.MapGet("/products", (int? page, string? q) =>
{
    var results = products.AsEnumerable();

    if (!string.IsNullOrEmpty(q))
        results = results.Where(p => p.Name.Contains(q, StringComparison.OrdinalIgnoreCase));

    var pageNumber = page ?? 1;
    return results.Skip((pageNumber - 1) * 10).Take(10);
});
```

*What just happened:* Neither `page` nor `q` appears in the `/products` path, so ASP.NET Core reads them from the query string. `/products?q=mouse` filters by name; `/products?page=2` pages; `/products` with no query gives you defaults because both are nullable (`int?`, `string?`) and come in as `null` when absent. Nullable types are how you mark a parameter optional.

When you want the source unmistakable — or the URL name differs from your parameter name — reach for `[FromQuery]`:

```csharp
app.MapGet("/search", ([FromQuery(Name = "term")] string? searchTerm) =>
    $"searching for: {searchTerm}");
```

*What just happened:* `[FromQuery(Name = "term")]` maps the URL's `?term=...` onto a parameter you've chosen to call `searchTerm`. The attribute also documents intent — a reader sees at a glance that this comes from the query string. You don't need it for the common case, since default binding already does the right thing, but it's there when you want the source spelled out.

## Returning the right status with Results

Returning a raw object is fine until you need to say something other than "200 OK." A by-id lookup that finds nothing should return **404 Not Found**, not `200` with an empty body. A create should return **201 Created**. That's the job of **`Results`** (and its typed sibling `TypedResults`):

```csharp
app.MapGet("/products/{id:int}", (int id) =>
{
    var product = products.FirstOrDefault(p => p.Id == id);
    return product is null
        ? Results.NotFound()
        : Results.Ok(product);
});

app.MapPost("/products", (Product product) =>
{
    products.Add(product);
    return Results.Created($"/products/{product.Id}", product);
});
```

*What just happened:* `Results.Ok(product)` sends the product with a `200`; `Results.NotFound()` sends a `404` with no body. `Results.Created(uri, body)` returns `201` *and* sets the `Location` header to where the new resource lives — what a well-behaved REST API does after a create. The `Results` factory has one method per common outcome: `Ok`, `NotFound`, `Created`, `BadRequest`, and more.

`TypedResults` is the same idea with the concrete return type baked in:

```csharp
app.MapGet("/products/{id:int}", (int id) =>
{
    var product = products.FirstOrDefault(p => p.Id == id);
    return product is null
        ? TypedResults.NotFound()
        : TypedResults.Ok(product);
});
```

*What just happened:* Behaviour is identical at runtime — same status codes, same bodies. The difference is the *type*: `TypedResults.Ok(product)` returns a strongly-typed `Ok<Product>` rather than a general result, which makes the endpoint easier to unit test (assert on the exact type) and lets tooling describe your API more precisely. Prefer `TypedResults` for handlers you'll test; `Results` is fine for quick work.

> 💡 A handler can return different result types down different branches. The compiler accepts the `?:` above because `Results.NotFound()` and `Results.Ok(...)` share a common interface, so both branches type-check. With `TypedResults` you'll sometimes declare the return as `Results<Ok<Product>, NotFound>` to keep both concrete types — more on that in later phases.

## Grouping endpoints with MapGroup

As the API grows, every route starts with the same prefix — `/api/v1/products`, `/api/v1/orders`, and so on. Repeating `/api/v1` in every `Map` call is noise, and typos creep in. **`MapGroup`** factors out a shared prefix once:

```csharp
var v1 = app.MapGroup("/api/v1");

v1.MapGet("/products", () => products);
v1.MapGet("/products/{id:int}", (int id) =>
{
    var product = products.FirstOrDefault(p => p.Id == id);
    return product is null ? Results.NotFound() : Results.Ok(product);
});
v1.MapPost("/products", (Product product) =>
{
    products.Add(product);
    return Results.Created($"/api/v1/products/{product.Id}", product);
});
```

*What just happened:* `MapGroup("/api/v1")` returns a group object, and every route you map *on the group* inherits the prefix. The first one becomes `GET /api/v1/products`, no repetition. The immediate payoff is versioning — when `/api/v2` arrives you spin up a second group beside the first, and the two versions live side by side without touching each other's routes.

Groups become more powerful later: the same object can attach **authentication, validation filters, and shared metadata** to everything inside it at once, so you secure or document a dozen endpoints with one line. For now, treat `MapGroup` as your tidy prefix — the rest unlocks in the auth and middleware phases.

> 📝 Everything in this phase used **minimal APIs**. ASP.NET Core has an older, more structured style too — **controllers**, classes marked `[ApiController]` with methods decorated by attribute routes like `[HttpGet("products/{id}")]`. Controllers shine in large apps with lots of shared conventions; minimal APIs win on leanness and are the modern default for new services. They're not rivals so much as two points on a spectrum, and you can even mix them. We use minimal APIs throughout this guide; Phase 9 lays the two side by side.

## Recap

- A route is an **HTTP method plus a path** pointing at a handler; `MapGet`/`MapPost`/`MapPut`/`MapPatch`/`MapDelete` register them, and the same path with two methods is two distinct routes.
- Handler parameters **bind automatically**: a name that appears in the route (`{id}` → `int id`) comes from the path; one that doesn't comes from the query string. Nullable types (`int?`, `string?`) mark a parameter optional.
- **Route constraints** like `{id:int}` and `{slug:alpha}` decide *whether a route matches* — they are routing filters, not input validation.
- Return a value for the easy case (object → JSON, string → text), or use **`Results`**/**`TypedResults`** to set status precisely: `Ok`, `NotFound`, `Created`, `BadRequest`. `TypedResults` is the testable, strongly-typed variant.
- **`MapGroup`** factors out a shared prefix once (great for `/api/v1` versioning) and later carries shared auth, filters, and metadata for every endpoint inside it.
- Minimal APIs are the modern, lean default; **controllers** are the older structured style — same framework, different ergonomics (full comparison in Phase 9).

## Quick check

```quiz
[
  {
    "q": "In app.MapGet(\"/products/{id:int}\", (int id) => ...), where does the value of id come from, and what does :int do?",
    "choices": ["From the request body; :int validates that id is positive", "From the route path; :int constrains the route to match only when the segment is an integer", "From the query string; :int converts the value to an integer", "From an HTTP header named id; :int is ignored at runtime"],
    "answer": 1,
    "explain": "{id} is a route placeholder, so id binds from the path by name. The :int constraint controls whether the route matches at all — it filters routing, it is not input validation."
  },
  {
    "q": "A handler is written as (int? page, string? q) => ... and neither name appears in the route path. Where do page and q bind from?",
    "choices": ["From the request body as JSON properties", "From the route path", "From the query string (e.g. ?page=2&q=mouse)", "They must be supplied with [FromServices] dependency injection"],
    "answer": 2,
    "explain": "A simple-typed handler parameter that is not named in the route binds from the query string. The nullable types make them optional, so they arrive as null when absent."
  },
  {
    "q": "Your by-id endpoint finds no matching product. Which return best signals that to the client?",
    "choices": ["return product; (returns 200 with an empty body)", "Results.NotFound() to return a 404", "Results.Created(...) to return a 201", "Throw an exception so the pipeline returns 500"],
    "answer": 1,
    "explain": "A missing resource is a 404. Results.NotFound() sends that status with no body; returning a null object would send a 200, which misleads the client. (TypedResults.NotFound() does the same, with a testable type.)"
  }
]
```

[← Phase 1: What ASP.NET Core Is & Your First Server](01-what-aspnet-core-is.md) · [Guide overview](_guide.md) · [Phase 3: Model Binding & Validation →](03-model-binding-and-validation.md)
