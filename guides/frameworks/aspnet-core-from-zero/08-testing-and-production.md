---
title: "Testing & Production"
guide: "aspnet-core-from-zero"
phase: 8
summary: "Test the whole app in memory with WebApplicationFactory and HttpClient, override services for fakes, layer configuration with appsettings and ASPNETCORE_ENVIRONMENT, then publish and ship behind Kestrel in a small Docker image."
tags: [aspnet-core, csharp, testing, production, deployment]
difficulty: intermediate
synonyms: ["aspnet testing", "WebApplicationFactory", "aspnet integration tests", "aspnet appsettings environment", "dotnet publish", "aspnet production deploy", "aspnet docker"]
updated: 2026-06-23
---

# Testing & Production

You've grown the products API from a single endpoint into a real REST service with validation, dependency injection, a middleware pipeline, and JWT auth. Now comes the part that decides whether anyone trusts it: proving it works, and running it somewhere real without it falling over at 3am. Both turn out to be small once you see the one fact that makes them small.

## The mental model: integration testing runs the whole app in memory

Here's the thing that makes ASP.NET Core genuinely pleasant to test. There's a class - `WebApplicationFactory<TEntryPoint>`, from the `Microsoft.AspNetCore.Mvc.Testing` package - whose entire job is to **start your real application in memory** and hand you an `HttpClient` wired straight into it.

> 💡 An integration test is nothing more than: spin up your app in-process, ask the factory for an `HttpClient`, and make requests as if you were a caller out on the network. Except there *is* no network - no real socket, no port, no Kestrel listening, no `dotnet run` in another terminal. The request travels the **entire pipeline** - middleware, routing, model binding, your endpoint, the lot - exactly as it would in production, but never leaves the process. It runs in milliseconds.

That's the whole idea: you're not mocking the framework or testing one method in isolation, you're exercising the assembled app the way a real client would, and reading back what it returns.

xUnit is the common test framework in .NET (`dotnet new xunit` scaffolds a project), and `WebApplicationFactory` plugs into it through `IClassFixture<T>` - xUnit's way of building one expensive thing once and sharing it across the tests in a class. Here's a test against the products API:

```csharp
public class ProductsApiTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;
    public ProductsApiTests(WebApplicationFactory<Program> factory) => _client = factory.CreateClient();

    [Fact]
    public async Task Get_products_returns_ok()
    {
        var res = await _client.GetAsync("/api/v1/products");
        Assert.True(res.IsSuccessStatusCode);
    }
}
```

*What just happened:* `IClassFixture<WebApplicationFactory<Program>>` tells xUnit to construct the factory once and inject it into the constructor. `factory.CreateClient()` boots the app in memory and gives back an `HttpClient` pointed at it. The `[Fact]` is one test; inside it we `GET /api/v1/products` and assert a success status. That single `GetAsync` ran the whole app - middleware pipeline, routing, the handler pulling products out of DI - and came back, all without a port ever opening. To check the body too, add `var products = await res.Content.ReadFromJsonAsync<List<Product>>();` and assert on the shape.

> ⚠️ For the test project to reference `Program`, your minimal-API `Program.cs` needs one extra line at the very end:
>
> ```csharp
> public partial class Program { }
> ```
>
> Top-level statements (the `var builder = WebApplication.CreateBuilder(args);` style you've used all guide) compile into an `internal` class named `Program` by default - which a separate test project can't see. Adding `public partial class Program { }` makes it `public` so `WebApplicationFactory<Program>` can find your entry point. Forget this and you get a confusing "`Program` is inaccessible due to its protection level" error; this is the fix.

This is the heart of testing an ASP.NET Core app. Wiring it into CI so it runs on every push - and the general discipline of test layers, fixtures, and pipelines - is covered in [testing in CI](/guides/testing-in-ci).

## Overriding services: swap in a fake repository for tests

The test above hit the real DI container, using whatever `Program.cs` registered for the product store. For a fast, deterministic test you usually don't want the real database - you want a fake or in-memory implementation instead. `WebApplicationFactory` lets you reconfigure the container before the app starts, through `WithWebHostBuilder`:

```csharp
[Fact]
public async Task Get_products_uses_the_fake_store()
{
    var client = _factory.WithWebHostBuilder(builder =>
    {
        builder.ConfigureServices(services =>
        {
            services.RemoveAll<IProductRepository>();
            services.AddSingleton<IProductRepository, FakeProductRepository>();
        });
    }).CreateClient();

    var res = await client.GetAsync("/api/v1/products");
    var products = await res.Content.ReadFromJsonAsync<List<Product>>();

    Assert.Single(products);
}
```

*What just happened:* `WithWebHostBuilder` gives you a chance to run extra configuration *after* `Program.cs` has registered everything but *before* the app starts handling requests. We `RemoveAll<IProductRepository>()` to drop whatever the real app registered, then `AddSingleton` a `FakeProductRepository` we control - perhaps seeded with a single known product. Now the endpoint, routing, and pipeline are all real, but the data source is a fake we can make assertions against. Because the override happens last, it wins - the standard trick for testing against an in-memory store instead of a live database.

> 📝 Not every test needs the factory. A `WebApplicationFactory` test is an *integration* test - it runs the HTTP pipeline. If you only want to test the logic inside one service or repository - say, a `ProductService` method that calculates a discount - that's a plain **unit test**: `new` up the class (passing a fake repository to its constructor), call the method, assert the result. No factory, no `HttpClient`, no pipeline. Reach for the factory when testing *the app*; reach for a unit test when testing *a piece*.

## Configuration: appsettings, environments, and `IConfiguration`

A test database is one example of "this differs between environments." Configuration is how ASP.NET Core handles all of them, as a stack of layers that override each other.

When your app starts, the builder reads configuration from several sources and merges them, with later sources winning over earlier ones:

1. `appsettings.json` - base settings, committed to the repo.
2. `appsettings.{Environment}.json` - environment-specific overrides, e.g. `appsettings.Development.json` or `appsettings.Production.json`.
3. **Environment variables** - what the host or container injects.
4. **User secrets** - local-only secrets in development (never committed), for things like a JWT signing key you don't want in source control.

The "{Environment}" piece is driven by one environment variable: **`ASPNETCORE_ENVIRONMENT`**, conventionally `Development`, `Staging`, or `Production`. Set it to `Production` and ASP.NET Core layers `appsettings.Production.json` on top of `appsettings.json`; leave it at `Development` and you get `appsettings.Development.json` instead. That's how the *same build* picks up different settings in different places.

You read merged values through `IConfiguration`, which the builder exposes as `builder.Configuration`:

```csharp
var builder = WebApplication.CreateBuilder(args);

// A single value, by key (":" walks into nested JSON):
var connectionString = builder.Configuration["ConnectionStrings:Products"];

// Or bind a whole section to a typed options object:
builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection("Jwt"));

var app = builder.Build();
```

*What just happened:* `builder.Configuration["ConnectionStrings:Products"]` pulls one value out of the merged configuration - the colon walks into nested JSON, so it reads `{ "ConnectionStrings": { "Products": "..." } }`. The value comes from *whichever layer set it last*: it might live in `appsettings.json` for local dev but be overridden by an environment variable in production, and your code doesn't change either way. `Configure<JwtOptions>(...GetSection("Jwt"))` binds the whole `"Jwt"` block to a strongly-typed `JwtOptions` class, injectable anywhere via `IOptions<JwtOptions>` - the same JWT settings from the auth phase, now sourced from config instead of hardcoded. The rule that makes this all work: **base file for defaults, environment file for per-environment overrides, environment variables and secrets for the things that change per deploy or must stay out of source control.**

## Production: publish, Kestrel, and a small Docker image

You've been running with `dotnet run`, which compiles and launches in one step - perfect for development, not production. For a real deploy, produce an optimized build with `dotnet publish`:

```bash
dotnet publish -c Release -o ./publish
```

*What just happened:* `-c Release` builds in **Release** configuration - optimizations on, debug symbols and dev-time checks off - instead of the default `Debug`. `-o ./publish` drops the result, your DLLs plus everything needed to run, into a `publish` folder. Launch it with `dotnet ./publish/ProductsApi.dll`. This is the artifact you ship, not your source tree.

Inside that artifact runs **Kestrel** - the cross-platform, high-performance web server built into ASP.NET Core. It's already what served your requests during `dotnet run`; in production it's the thing actually listening for connections. Kestrel is fast and perfectly capable of facing the internet, but the common, recommended shape is to put a **reverse proxy** in front of it - nginx, IIS, or YARP. The proxy terminates TLS (handles HTTPS), can load-balance across multiple instances of your app, and shields Kestrel from the rough edges of the public internet. Your app speaks plain HTTP to the proxy; the proxy speaks HTTPS to the world.

The cleanest way to package all of this is a **multi-stage Docker image**: one stage with the full .NET SDK to build and publish, a second tiny stage with only the runtime to run.

```bash
# Build stage - has the full SDK
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY . .
RUN dotnet publish -c Release -o /app

# Run stage - just the runtime, much smaller
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app .
ENV ASPNETCORE_ENVIRONMENT=Production
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "ProductsApi.dll"]
```

*What just happened:* the first stage uses the `sdk` image - the whole toolchain - to `dotnet publish` your Release build into `/app`. The second stage starts from the much smaller `aspnet` runtime image (it has the .NET runtime but not the compilers and build tools you no longer need), and copies *only* the published output from the build stage with `COPY --from=build`. The result is a leaner image with a smaller attack surface - you're not shipping the SDK to production. `ASPNETCORE_ENVIRONMENT=Production` makes the app layer in `appsettings.Production.json` and turn off developer conveniences like the detailed exception page; `ASPNETCORE_URLS` tells Kestrel which address and port to bind. Configuration that differs per environment - connection strings, the JWT key, the real database URL - comes in as environment variables, the same layering from the previous section, so the *image stays identical* across staging and production.

That's the full deploy shape: publish a Release build, run it on Kestrel inside a small multi-stage container, configure it through environment variables, and put a TLS-terminating reverse proxy in front. Taking it the rest of the way to a live URL - host, CI, domain and certificate specifics - is covered in [ship your side project](/guides/ship-your-side-project).

## Recap

- **Integration tests run the whole app in memory.** `WebApplicationFactory<Program>` from `Microsoft.AspNetCore.Mvc.Testing` boots your real app in-process and gives you an `HttpClient` via `CreateClient()` - full pipeline, no network, no port. Use it with xUnit's `IClassFixture<T>`.
- Your minimal-API `Program.cs` must end with `public partial class Program { }` so the test project can reference the entry point - otherwise `Program` is `internal` and inaccessible.
- **Override services for tests** with `factory.WithWebHostBuilder(b => b.ConfigureServices(...))` - `RemoveAll<T>()` the real registration and add a fake/in-memory one. Unit tests of a single service or repository need no factory; just `new` it up with a fake dependency.
- **Configuration layers**: `appsettings.json` → `appsettings.{Environment}.json` → environment variables → user secrets, later sources winning. The environment comes from `ASPNETCORE_ENVIRONMENT`. Read values with `builder.Configuration["Key"]` or bind a section to typed options.
- **Production**: `dotnet publish -c Release`, run on **Kestrel** behind a reverse proxy (nginx/IIS/YARP) that terminates TLS, packaged as a **multi-stage Docker image** (`sdk` to build, `aspnet` runtime to run), with config supplied via environment variables.

## Quick check

Lock in the core fact (in-memory testing) and the two production must-knows:

```quiz
[
  {
    "q": "How does WebApplicationFactory<Program> let you test an ASP.NET Core app without a real port?",
    "choices": ["It mocks every endpoint so no real code runs", "It starts your real app in memory and gives you an HttpClient wired straight into the full pipeline", "It launches Kestrel on a random free port in the background", "It only works for unit tests of individual services"],
    "answer": 1,
    "explain": "The factory boots the actual application in-process and hands back an HttpClient. Requests travel the entire pipeline - middleware, routing, binding, your endpoint - but never leave the process, so there's no socket or port involved."
  },
  {
    "q": "Why must a minimal-API Program.cs end with `public partial class Program { }` for integration tests?",
    "choices": ["It registers the test framework", "Top-level statements compile to an internal Program class, so the test project can't reference it until you make it public", "It enables Release-mode optimizations", "It starts the Kestrel server"],
    "answer": 1,
    "explain": "Top-level statements generate an internal Program by default. WebApplicationFactory<Program> needs to reference that type from a separate project, so you add `public partial class Program { }` to make it public."
  },
  {
    "q": "Which environment variable selects which appsettings.{Environment}.json file is layered on top of appsettings.json?",
    "choices": ["DOTNET_ENV", "ASPNETCORE_URLS", "ASPNETCORE_ENVIRONMENT", "NODE_ENV"],
    "answer": 2,
    "explain": "ASPNETCORE_ENVIRONMENT (Development/Staging/Production) drives which environment-specific appsettings file is merged in. ASPNETCORE_URLS sets the bind address, not the environment."
  }
]
```

[← Phase 7: Authentication & Authorization](07-auth.md) · [Guide overview](_guide.md) · [Phase 9: Where to Go Next →](09-where-to-go-next.md)
