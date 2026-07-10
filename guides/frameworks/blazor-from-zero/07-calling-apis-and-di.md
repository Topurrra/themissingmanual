---
title: "Calling APIs & Dependency Injection"
guide: "blazor-from-zero"
phase: 7
summary: "Inject collaborators into components with @inject, register services in Program.cs, and load data from a backend with HttpClient and the System.Net.Http.Json helpers — building a real products UI."
tags: [blazor, csharp, dependency-injection, httpclient, api]
difficulty: advanced
synonyms: ["blazor inject", "blazor httpclient", "blazor call api", "GetFromJsonAsync", "blazor dependency injection", "blazor http service"]
updated: 2026-07-10
---

# Calling APIs & Dependency Injection

Up to now your components have been self-contained: they held their own state and
re-rendered when it changed. Real apps aren't like that. A component needs *collaborators* —
something that fetches data, talks to a backend, logs an error. This phase is about how a
component **gets** those collaborators and how it **reaches a server** to load real data.

Here's the whole chapter in one mental model — the rest is detail:

- **Components don't build their own dependencies — they ask for them.** A component declares
  "I need a data service" and Blazor hands it one. That's **dependency injection (DI)**, and
  it's the *exact same* DI container as ASP.NET Core — you've met it already if you've done
  [ASP.NET Core](/guides/aspnet-core-from-zero).
- **To reach a backend, you inject an `HttpClient`** (or, better, a service that wraps one)
  and call JSON helpers like `GetFromJsonAsync`. The backend is a normal ASP.NET Core API.

Hold those two sentences. Everything below hangs off them.

> 📝 We'll keep building the **products** UI: this time it loads the product list from a real
> API and lets the reader create a new product that gets POSTed to the backend. The API itself
> is an ASP.NET Core service — see [ASP.NET Core From Zero](/guides/aspnet-core-from-zero) for
> the other side of the wire.

## The mental model: injected collaborators

Imagine a component that needs to fetch products. The naive instinct is to have the component
`new` up whatever it needs:

```csharp
// The instinct we're going to NOT follow.
var http = new HttpClient();
var service = new ProductService(http);
```

The problem: the component is now welded to those concrete types. You can't swap the service
for a fake one in a test, can't configure the `HttpClient` in one place, and every component
that needs products repeats this wiring.

DI flips it. You register your services **once**, centrally, and components *ask* for
what they need. Blazor's container constructs them, wires up their own dependencies, and hands
the finished object over. The component never says `new` — it says "give me one."

This is the same `IServiceProvider` container ASP.NET Core uses, with the same lifetimes
(`Scoped`, `Singleton`, `Transient`). If DI in ASP.NET Core already clicked for you, you
already understand Blazor's.

## Registering services and injecting them

Registration happens in `Program.cs`, where the app is wired up:

```csharp
// Program.cs
builder.Services.AddScoped<IProductService, ProductService>();
```

*What just happened:* you told the container "whenever something asks for an `IProductService`,
build a `ProductService` and reuse it for the lifetime of this scope." Registering against the
**interface** is the move that makes the component swappable later — it depends on the
contract, not the concrete class.

Now a component asks for it with the **`@inject`** directive at the top of the `.razor` file:

```razor
@inject IProductService Products

<ul>
    @if (products is not null)
    {
        @foreach (var p in products)
        {
            <li>@p.Name — $@p.Price</li>
        }
    }
</ul>

@code {
    private List<Product>? products;

    protected override async Task OnInitializedAsync()
    {
        products = await Products.GetAllAsync();
    }
}
```

*What just happened:* `@inject IProductService Products` declares a property named `Products`
that Blazor fills in before the component renders. By the time `OnInitializedAsync` runs (the
load-your-data hook from [Phase 4](04-events-and-lifecycle.md)), `Products` is ready to use. The
component calls `Products.GetAllAsync()` — it has no idea there's an `HttpClient` behind it,
which is the whole point.

If you prefer attributes over the directive (handy in a code-behind file or a base class), the
equivalent inside `@code` is:

```csharp
[Inject]
public IProductService Products { get; set; } = default!;
```

*What just happened:* `[Inject]` does the same job as `@inject` — Blazor sets this property
after constructing the component. `= default!` quiets the nullable-reference compiler warning,
since DI assigns it before any of your code runs.

> 💡 `@inject` is the directive form (top of the markup); `[Inject]` is the attribute form
> (inside `@code`). Same mechanism, no behavioral difference — pick whichever reads better.

## Calling an API with HttpClient

Now the part where data actually crosses the network. Blazor uses the standard .NET
**`HttpClient`**, paired with the JSON helper extension methods in **`System.Net.Http.Json`**.
These helpers serialize and deserialize JSON for you, so you work in typed objects, not raw
strings.

The four you'll use constantly:

| Method | What it does |
|--------|--------------|
| `GetFromJsonAsync<T>(url)` | GET, deserialize the JSON response into a `T` |
| `PostAsJsonAsync(url, obj)` | POST `obj` as JSON in the body |
| `PutAsJsonAsync(url, obj)` | PUT `obj` as JSON (update) |
| `DeleteAsync(url)` | DELETE the resource at the URL |

Here's the products list loading from the API directly (we'll improve on the raw-HttpClient
approach in a moment), with the loading state from [Phase 4](04-events-and-lifecycle.md):

```razor
@inject HttpClient Http

@if (products is null)
{
    <p>Loading products...</p>
}
else
{
    <ul>
        @foreach (var p in products)
        {
            <li>@p.Name — $@p.Price</li>
        }
    </ul>
}

@code {
    private List<Product>? products;

    protected override async Task OnInitializedAsync()
    {
        products = await Http.GetFromJsonAsync<List<Product>>("api/products");
    }
}
```

*What just happened:* `GetFromJsonAsync<List<Product>>("api/products")` fires a GET to
`api/products`, reads the JSON array, and deserializes it into a `List<Product>`. Because the
call is `await`ed inside `OnInitializedAsync`, the component renders **once before** the data
arrives (`products` is still `null`, so the reader sees "Loading products..."), then re-renders
when it lands — the same `null`-as-loading-state pattern from the lifecycle phase.

Creating a product is the write side. A small form POSTs a new product, then refreshes the list:

```razor
@inject HttpClient Http

<input @bind="newName" placeholder="Product name" />
<input @bind="newPrice" type="number" placeholder="Price" />
<button @onclick="Create" disabled="@isSaving">
    @(isSaving ? "Saving..." : "Add product")
</button>

@code {
    private string newName = "";
    private decimal newPrice;
    private bool isSaving;
    private List<Product>? products;

    private async Task Create()
    {
        isSaving = true;
        var newProduct = new Product { Name = newName, Price = newPrice };
        await Http.PostAsJsonAsync("api/products", newProduct);
        products = await Http.GetFromJsonAsync<List<Product>>("api/products");
        newName = "";
        newPrice = 0;
        isSaving = false;
    }
}
```

*What just happened:* `PostAsJsonAsync("api/products", newProduct)` serializes `newProduct`
to JSON and POSTs it. After it returns, we re-fetch the list so the new item shows up, then
clear the inputs. Setting `isSaving` around the `await` gives the reader feedback and disables
the button so a double-click can't double-submit — Blazor re-renders before the `await` (button
shows "Saving...") and again after it resumes (re-enabled, list refreshed).

## ⚠️ WebAssembly vs Server: where the HttpClient call comes from

This is the gotcha that bites people, so let's be precise. **How you register the `HttpClient`
differs between the two hosting models** (Phase 1), because the code runs in different places.

**Blazor WebAssembly** — the C# runs *in the browser*. So the HTTP call leaves the browser,
just like a `fetch()` would. You register an `HttpClient` with a `BaseAddress`:

```csharp
// Program.cs (Blazor WebAssembly)
builder.Services.AddScoped(sp => new HttpClient
{
    BaseAddress = new Uri(builder.HostEnvironment.BaseAddress)
});
```

*What just happened:* every component that injects `HttpClient` gets one pointed at your app's
base URL, and requests originate from the user's browser. ⚠️ Because it's a real browser
request to (potentially) a different origin, **CORS applies** — if your API is on a different
domain/port, it must send the right CORS headers or the browser blocks the call. That's a
server-side configuration on the API, not something the Blazor component can fix.

**Blazor Server** — the C# runs *on the server*. There's no browser making the request, so
there's **no browser-CORS issue**. The idiomatic approach here is a typed client registered via
`IHttpClientFactory`, which manages connection pooling and lets you configure the client in one
place:

```csharp
// Program.cs (Blazor Server)
builder.Services.AddHttpClient<IProductService, ProductService>(client =>
{
    client.BaseAddress = new Uri("https://localhost:5001/");
});
```

*What just happened:* `AddHttpClient<IProductService, ProductService>` registers
`ProductService` **and** injects a properly-configured `HttpClient` into its constructor — one
call wires up both. Because the request runs server-to-server, browser CORS policy never enters
the picture.

> ⚠️ The trap is copying a WASM `HttpClient` registration into a Server app (or vice versa) and
> being surprised. The rule of thumb: **WASM** = `HttpClient` with `BaseAddress`, mind CORS;
> **Server** = typed client / `IHttpClientFactory`, no browser CORS.

## 💡 The clean pattern: wrap HttpClient in a typed service

You saw components inject `HttpClient` directly above. That works, but it scatters URLs and
HTTP details across your UI. The pattern that scales: **wrap `HttpClient` in a typed service**
and inject *that* into components.

```csharp
public interface IProductService
{
    Task<List<Product>> GetAllAsync();
    Task CreateAsync(Product product);
}

public class ProductService : IProductService
{
    private readonly HttpClient _http;

    public ProductService(HttpClient http) => _http = http;

    public async Task<List<Product>> GetAllAsync() =>
        await _http.GetFromJsonAsync<List<Product>>("api/products") ?? new();

    public async Task CreateAsync(Product product) =>
        await _http.PostAsJsonAsync("api/products", product);
}
```

*What just happened:* the `HttpClient` and the API URLs now live in exactly one place. The
constructor takes an `HttpClient`, which DI injects automatically because you registered the
client alongside the service. Components go back to the clean form from earlier: inject
`IProductService`, call `Products.GetAllAsync()`, and stay unaware of HTTP.

Why this is worth the extra interface:

- **Testable.** A test can supply a fake `IProductService` that returns canned products — no
  network, no server, instant.
- **Swappable.** Move from one API to another, add caching, or add retry logic in *one* class;
  no component changes.
- **Honest boundaries.** Components do UI; the service does data. Each stays small.

This is the same dependency-inversion idea ASP.NET Core leans on everywhere — your components
depend on the `IProductService` *contract*, and DI decides which concrete implementation
satisfies it. If you haven't built the API side, [ASP.NET Core From Zero](/guides/aspnet-core-from-zero) is its companion guide.

## Recap

- **Components ask for collaborators; they don't build them.** Register services in
  `Program.cs` (`builder.Services.AddScoped<IProductService, ProductService>()`), then pull them
  in with `@inject IProductService Products` (or `[Inject]` inside `@code`). It's the same DI
  container as ASP.NET Core.
- **Reach a backend with `HttpClient`** plus the `System.Net.Http.Json` helpers:
  `GetFromJsonAsync<T>`, `PostAsJsonAsync`, `PutAsJsonAsync`, `DeleteAsync` — you work in typed
  objects, not raw JSON strings.
- **Load data in `OnInitializedAsync`** with a `null` loading state; set a saving flag around
  writes so the UI gives feedback and can't double-submit.
- **WASM vs Server registration differs:** WASM registers an `HttpClient` with a `BaseAddress`
  and the call leaves the browser (mind **CORS**); Server uses a typed client /
  `IHttpClientFactory` and runs server-to-server (no browser CORS).
- **Wrap `HttpClient` in a typed `IProductService`** and inject that — it keeps URLs in one
  place and makes the component testable and swappable.

## Quick check

```quiz
[
  {
    "q": "How does a Blazor component get a service it depends on, like IProductService?",
    "choices": ["It calls new ProductService() in OnInitialized", "It declares it with @inject (or [Inject]); Blazor's DI container supplies it", "It reads it from a global static field", "It passes it in as a [Parameter] from the parent"],
    "answer": 1,
    "explain": "Components ask for dependencies via @inject or [Inject], and the DI container — the same one ASP.NET Core uses — constructs and supplies them. The component never news up its own collaborators."
  },
  {
    "q": "In Blazor WebAssembly, the HTTP call to your API runs in the browser and your API is on a different origin. What must be configured for the call to succeed?",
    "choices": ["Nothing — WASM bypasses browser security", "CORS headers on the API, because the request is a real cross-origin browser request", "A typed client via IHttpClientFactory only", "StateHasChanged() after the call"],
    "answer": 1,
    "explain": "WASM runs in the browser, so the request is subject to CORS. If the API is a different origin it must send the right CORS headers. Blazor Server runs server-side and doesn't hit this — that's the key WASM-vs-Server difference."
  },
  {
    "q": "Why wrap HttpClient inside a typed IProductService instead of injecting HttpClient straight into components?",
    "choices": ["It's required — components can't inject HttpClient", "It centralizes URLs and HTTP details, and lets you swap in a fake service for testing", "It makes the HTTP calls run faster", "It avoids needing Program.cs registration"],
    "answer": 1,
    "explain": "A typed service keeps URLs and HTTP details in one place and lets components depend on the IProductService contract — so tests can supply a fake, and you can change the backend without touching the UI."
  }
]
```

[← Phase 6: Component Communication & State](06-communication-and-state.md) · [Guide overview](_guide.md) · [Phase 8: Where to Go Next →](08-where-to-go-next.md)