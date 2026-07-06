---
title: "Model Binding & Validation"
guide: "aspnet-core-from-zero"
phase: 3
summary: "How ASP.NET Core turns a raw HTTP request into typed C# parameters, and how to check those values with data annotations — including the honest minimal-API gotcha that validation isn't automatic."
tags: [aspnet-core, csharp, model-binding, validation, data-annotations]
difficulty: intermediate
synonyms: ["aspnet model binding", "aspnet frombody fromroute fromquery", "aspnet validation data annotations", "minimal api validation", "aspnet modelstate", "aspnet bind json"]
updated: 2026-06-23
---

# Model Binding & Validation

Here's the mental model: **a raw HTTP request is just bytes — a URL, some headers, maybe a blob of JSON. Model binding turns those bytes into typed C# parameters your handler can use. Validation then checks that those typed values are actually sane before your real logic runs.** Two steps, in that order: shape the data, then trust the data.

In [Routing & Minimal APIs](02-routing-and-minimal-apis.md) you saw handlers take parameters and ASP.NET Core somehow filled them in. This phase is the "somehow." We'll keep growing the **products API** and be honest about a sharp edge that trips up nearly everyone moving from controllers to minimal APIs.

## Where does each parameter come from?

For each parameter in a minimal API handler, ASP.NET Core decides *which part of the request* fills it using a small set of inference rules:

- A parameter whose name matches a **route placeholder** binds from the route.
- A **simple type** (string, int, `Guid`, etc.) that isn't in the route binds from the **query string**.
- A **complex type** (your own class or record) binds from the **JSON body**.
- Known framework types (like a `CancellationToken` or a registered service) are supplied by the framework.

Most of the time you don't annotate anything — inference just works.

```csharp
// GET /products/42?fields=name
app.MapGet("/products/{id:int}", (int id, string? fields) =>
{
    // id  ← from the route ("{id:int}")
    // fields ← from the query string ("?fields=name")
    return Results.Ok(new { id, fields });
});
```

*What just happened:* `id` matched the route placeholder, so it bound from the path. `fields` is a simple type with no matching route segment, so ASP.NET Core looked in the query string. Nothing was annotated — names and types told the framework everything.

### When you need to be explicit

Inference is a default, not a law. To override it, or just make the source obvious to the next reader, reach for the `[From*]` attributes:

| Attribute | Binds from |
|-----------|------------|
| `[FromBody]` | the request body (JSON) |
| `[FromRoute]` | a route placeholder |
| `[FromQuery]` | the query string |
| `[FromHeader]` | a request header |
| `[FromServices]` | the dependency-injection container (more on this in [Dependency Injection](04-dependency-injection.md)) |

> 💡 You rarely *need* `[FromBody]` for a complex type — it's already inferred. But you can only have **one** body-bound parameter per handler (a request has one body), and that's a common source of "why is this null?" confusion when you accidentally mark two parameters to read the body.

## Binding the body to a record

The bread-and-butter case: a POST that creates a product. The client sends JSON, landed in a `CreateProduct` record.

```csharp
app.MapPost("/products", (CreateProduct input) =>
{
    var id = Guid.NewGuid();
    var product = new Product(id, input.Name, input.Price);
    // (save it somewhere — that's Phase 6's job)
    return Results.Created($"/products/{id}", product);
});

public record CreateProduct(string Name, decimal Price);
```

*What just happened:* `CreateProduct` is a complex type, so ASP.NET Core deserialized the JSON body into it — matching `Name` and `Price` by property name (case-insensitive by default). If the client POSTs `{ "name": "Keyboard", "price": 49.99 }`, your `input` arrives fully populated. You return `201 Created` with a `Location` header pointing at the new resource.

📝 If the JSON is *malformed* (not valid JSON at all), binding fails before your handler runs and the client gets a `400`. But if the JSON is well-formed yet *nonsense for your domain* — an empty name, a negative price — binding happily succeeds. The bytes parsed fine; they're just bad data. Catching that is validation's job.

## Validation with data annotations

ASP.NET Core's built-in validation is **DataAnnotations**: attributes on the properties of your bound type that declare the rules. The common ones:

```csharp
using System.ComponentModel.DataAnnotations;

public class CreateProduct
{
    [Required]
    [StringLength(120, MinimumLength = 1)]
    public string Name { get; set; } = "";

    [Range(0, 100000)]
    public decimal Price { get; set; }
}
```

*What just happened:* we declared, right next to the data, what "valid" means — `Name` must be present and at most 120 characters, `Price` must sit between 0 and 100,000. (We switched from a `record` to a `class` with settable properties; annotations work on both, but a mutable class is the more common shape for a validated input model. For email fields you'd add `[EmailAddress]`.) These attributes are pure declarations — they don't *do* anything on their own. Something has to read them and act, and that's the part that surprises people.

## ⚠️ The honest minimal-API gotcha

Here's the thing nobody warns you about until it bites: **minimal APIs do not automatically run DataAnnotations validation.** Decorate every property with `[Required]` and `[Range]` you like — a minimal API handler will run anyway, with an empty name and a price of -5, because nothing in the default pipeline ever checked.

This catches experienced ASP.NET developers especially hard, because in **MVC controllers** it *does* happen automatically (more below). In a minimal API, the rules are documentation until you wire up an enforcer. Three honest options:

1. **Validate manually** in the handler.
2. **Add an endpoint filter** that validates every request to that endpoint.
3. **Use a library** — `MinimalApis.Extensions` / `MiniValidation` (a tiny helper that runs DataAnnotations for you) or **FluentValidation** (rules in separate validator classes, popular on bigger teams).

Let's do option 1 so you can *see* the machinery — then you'll appreciate why the others exist.

```csharp
using System.ComponentModel.DataAnnotations;

app.MapPost("/products", (CreateProduct input) =>
{
    var context = new ValidationContext(input);
    var results = new List<ValidationResult>();

    if (!Validator.TryValidateObject(input, context, results, validateAllProperties: true))
    {
        // turn failures into the shape ValidationProblem wants:
        // { "Name": ["The Name field is required."], ... }
        var errors = results
            .SelectMany(r => r.MemberNames.Select(name => (name, r.ErrorMessage)))
            .GroupBy(x => x.name, x => x.ErrorMessage ?? "Invalid")
            .ToDictionary(g => g.Key, g => g.ToArray());

        return Results.ValidationProblem(errors);
    }

    var product = new Product(Guid.NewGuid(), input.Name, input.Price);
    return Results.Created($"/products/{product.Id}", product);
});
```

*What just happened:* `Validator.TryValidateObject` is the engine that reads the annotations and runs them (`validateAllProperties: true` checks every property instead of stopping at the first). On failure we reshape the results into a dictionary of field → messages and hand it to `Results.ValidationProblem`, which returns a `400` with a standard **ProblemDetails** body — the same JSON shape clients expect from any well-behaved ASP.NET API. On success we proceed to create the product. Validation runs *before* the create logic — that ordering is the whole point.

> 💡 In real projects you'd lift that block into an **endpoint filter** (so it runs without cluttering the handler) or let **MiniValidation** do the `TryValidateObject` dance for you. The manual version above is here so the magic isn't magic — every "automatic" validation tool is doing roughly this underneath.

## Why some teams still reach for controllers

📝 If validation being automatic sounds appealing, you're not alone — that's one real reason teams pick MVC **controllers** over minimal APIs. A controller marked `[ApiController]` validates the bound model *for you*: it runs the DataAnnotations, populates an object called `ModelState`, and if anything failed it short-circuits with a `400` and a ProblemDetails body **before your action method ever runs**.

```csharp
[ApiController]
[Route("products")]
public class ProductsController : ControllerBase
{
    [HttpPost]
    public IActionResult Create(CreateProduct input)
    {
        // If we got here, input is already valid.
        // [ApiController] auto-returned 400 otherwise — ModelState was checked for us.
        var product = new Product(Guid.NewGuid(), input.Name, input.Price);
        return Created($"/products/{product.Id}", product);
    }
}
```

*What just happened:* the `[ApiController]` attribute opted this class into a bundle of conventions, one of which is automatic model validation. By the time `Create` runs, the framework has already inspected `ModelState`, and if `Name` was empty it never called your method — the client already got a `400`. You write less plumbing; you give up a little of the explicitness and lightweight feel of minimal APIs. Neither choice is wrong — it's a trade, and now you know what's being traded.

Pick whichever fits the project. This guide stays on minimal APIs and wires validation in deliberately — it keeps the "request flows in, gets shaped, gets checked" model visible instead of hidden behind a convention.

## Recap

- **Binding turns the request into typed C# parameters; validation checks those values** — always in that order, before your logic runs.
- In minimal APIs the source is **inferred**: route placeholders by name, simple types from the query string, a **complex type from the JSON body**. Override with `[FromBody]`, `[FromRoute]`, `[FromQuery]`, `[FromHeader]`, `[FromServices]`.
- **DataAnnotations** (`[Required]`, `[StringLength]`, `[Range]`, `[EmailAddress]`) declare validity right on the model — but they're inert until something runs them.
- ⚠️ **Minimal APIs do NOT auto-validate.** Validate manually, add an endpoint filter, or use MiniValidation / FluentValidation. On failure return `Results.ValidationProblem(errors)` for a standard `400`.
- 💡 **`[ApiController]` controllers DO auto-validate** via `ModelState` and return `400` automatically — a real reason some teams still choose controllers.

## Quick check

```quiz
[
  {
    "q": "In a minimal API, where does a complex type (like CreateProduct) bind from by default?",
    "choices": ["The route values", "The query string", "The JSON request body", "Request headers"],
    "answer": 2,
    "explain": "Inference binds simple types from the query and route, and a complex type from the JSON body. Override with [From*] attributes if needed."
  },
  {
    "q": "You decorated CreateProduct with [Required] and [Range], but your minimal API handler still runs with bad data. Why?",
    "choices": ["The attributes are spelled wrong", "Minimal APIs don't run DataAnnotations validation automatically", "You forgot [FromBody]", "DataAnnotations only work on GET requests"],
    "answer": 1,
    "explain": "Minimal APIs don't auto-validate. You must validate manually, add an endpoint filter, or use a library like MiniValidation or FluentValidation."
  },
  {
    "q": "What does a controller marked with [ApiController] do that a plain minimal API does not?",
    "choices": ["Binds the JSON body", "Automatically validates the model and returns 400 before your method runs", "Generates routes from the method name", "Runs faster"],
    "answer": 1,
    "explain": "[ApiController] auto-runs DataAnnotations, populates ModelState, and short-circuits with a 400 + ProblemDetails when validation fails — before your action executes."
  }
]
```

---

[← Phase 2: Routing & Minimal APIs](02-routing-and-minimal-apis.md) · [Guide overview](_guide.md) · [Phase 4: Dependency Injection →](04-dependency-injection.md)
