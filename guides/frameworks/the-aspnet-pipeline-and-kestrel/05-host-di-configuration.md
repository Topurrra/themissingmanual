---
title: "The Host, DI & Configuration"
guide: "the-aspnet-pipeline-and-kestrel"
phase: 5
summary: "How WebApplicationBuilder wires up the DI container, layered configuration, logging, and Kestrel before your app exists — plus the options pattern, environments, and the generic host running background work."
tags: [aspnet-core, csharp, host, dependency-injection, configuration]
difficulty: advanced
synonyms: ["aspnet host", "webapplication builder", "generic host", "aspnet di container", "iconfiguration", "options pattern", "ihostedservice"]
updated: 2026-06-23
---

# The Host, DI & Configuration

Here's the mental model to hold the whole way through: **before your app exists, something has to assemble configuration, the DI container, logging, and Kestrel — and that something is the host.** You've spent four phases watching a request flow through Kestrel and the pipeline. This phase is about the machinery that *stands all of that up* in the first place, then owns its lifecycle from start to shutdown.

The shape of every ASP.NET Core program is the same three-beat rhythm: `CreateBuilder` → configure the builder → `Build()` → `Run()`. Once you see those four lines as "set up the wiring, then run the machine," the top of `Program.cs` stops being boilerplate you copy and becomes a place you actually understand.

```csharp
var builder = WebApplication.CreateBuilder(args);  // 1. set up config, DI, logging, Kestrel
builder.Services.AddScoped<IProductRepository, ProductRepository>();  // 2. register
var app = builder.Build();  // 3. produce the running app (the host)
// ... configure the pipeline ...
app.Run();  // 4. start Kestrel and block until shutdown
```

*What just happened:* `CreateBuilder` returned a **`WebApplicationBuilder`** — a setup object that has *already* prepared four things before you touch it: configuration, the DI container, logging, and Kestrel. You then add to that setup (registering services, reading config). `Build()` turns the builder into a **`WebApplication`** — the host, the thing that runs. `Run()` starts Kestrel listening and blocks the main thread until the app is told to shut down. Builder phase, then run phase. Nothing happens to requests until `Run()`.

> 📝 "The host" is just the name for the object that builds, owns, and runs your app. The `WebApplication` you get from `Build()` is unusually multi-talented: it implements the **host lifecycle** (start/stop), the **pipeline builder** (`app.Use(...)` from Phase 3), and the **endpoint route builder** (`app.MapGet(...)`, coming in Phase 6) all in one. That's why a single `app` variable does so much.

## The DI container: `builder.Services`

The first of the three things the builder sets up is the **DI container**. `builder.Services` is an `IServiceCollection` — a registration sheet. You add rules to it ("when something asks for `IProductRepository`, give it a `ProductRepository`"), and after `Build()`, the finished container is what resolves your middleware and your endpoints.

```csharp
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddScoped<IProductRepository, ProductRepository>();
builder.Services.AddSingleton<IClock, SystemClock>();

var app = builder.Build();   // the registration sheet becomes a real container here
```

*What just happened:* Every `builder.Services.Add...` call writes one line onto the registration sheet. Those calls do nothing on their own — `Build()` is the moment the sheet is "frozen" into an actual service provider that can construct objects. After that point, when Kestrel hands a request to the pipeline, the container is what builds the middleware and the endpoint handlers, supplying each its declared dependencies.

The detail that ties this phase to request handling is **scopes**. The container creates a fresh **scope** for each incoming request, and `HttpContext.RequestServices` *is* that per-request provider. This is the actual mechanism behind "Scoped = one instance per request": a scoped service is cached inside the request's scope and disposed when the request ends.

```csharp
app.Use(async (context, next) =>
{
    // This resolves from the CURRENT request's scope, not a global one.
    var repo = context.RequestServices.GetRequiredService<IProductRepository>();
    // ... do something with repo for just this request ...
    await next(context);
});
```

*What just happened:* `context.RequestServices` is the scope the container opened for *this* request. Resolving `IProductRepository` from it gives you the one instance shared across this request and no other. Two simultaneous requests get two separate scopes, hence two separate scoped repositories — which is exactly why scoped is the right default for a `DbContext`. The full treatment of lifetimes, constructor injection, and the captive-dependency trap lives in [Dependency Injection](/guides/aspnet-core-from-zero) from the ASP.NET Core guide; here the point is *where* the container comes from and *when* the scope is created.

## Configuration: layered providers

The second thing the builder sets up is **configuration**. `builder.Configuration` is an **`IConfiguration`** — a single read-through view assembled from several **providers** stacked in order, where **later providers override earlier ones** for the same key. The default stack, from lowest to highest priority:

1. `appsettings.json`
2. `appsettings.{Environment}.json` (e.g. `appsettings.Production.json`)
3. User secrets (development only)
4. Environment variables
5. Command-line args

```csharp
var builder = WebApplication.CreateBuilder(args);

string greeting = builder.Configuration["Greeting"]
                  ?? "Hello";
string? connString = builder.Configuration.GetConnectionString("Default");
```

*What just happened:* `builder.Configuration["Greeting"]` walks the merged view and returns whatever the *highest-priority* provider set for `"Greeting"`. If `appsettings.json` says `"Hello"` but an environment variable `Greeting=Hi` is present, you get `"Hi"` — the env var won because it sits higher in the stack. `GetConnectionString("Default")` is sugar for reading `ConnectionStrings:Default`. The colon `:` is how you reach into nested JSON sections.

The override order is the whole point. It's what lets you commit safe defaults to `appsettings.json`, layer environment-specific values in `appsettings.Production.json`, keep real secrets out of source control via user secrets locally, and override anything at deploy time with an environment variable — without changing code.

> ⚠️ Reading config by raw string key everywhere (`Configuration["Smtp:Host"]` scattered across ten files) gets fragile fast: typos fail silently, returning `null`, and there's no one place that documents what settings exist. The fix is the options pattern, next.

### The options pattern: bind a section to a typed class

Instead of reading loose strings, bind a configuration **section** to a strongly-typed class once, then inject that class wherever you need it.

Given this in `appsettings.json`:

```json
{
  "Smtp": {
    "Host": "mail.example.com",
    "Port": 587
  }
}
```

You define a matching class, bind it during setup, and inject `IOptions<T>`:

```csharp
public class SmtpSettings
{
    public string Host { get; set; } = "";
    public int Port { get; set; }
}

// In Program.cs, before Build():
builder.Services.Configure<SmtpSettings>(
    builder.Configuration.GetSection("Smtp"));

// Anywhere a service is constructed:
public class EmailSender
{
    private readonly SmtpSettings _settings;
    public EmailSender(IOptions<SmtpSettings> options)
    {
        _settings = options.Value;   // .Value unwraps the bound settings
    }
}
```

*What just happened:* `Configure<SmtpSettings>` tells the container to read the `"Smtp"` section and map its keys onto the properties of `SmtpSettings` by name (`Host` → `Smtp:Host`, `Port` → `Smtp:Port`). Then any class can declare `IOptions<SmtpSettings>` in its constructor and the container supplies it, fully populated. You read typed, documented properties (`_settings.Port` is an `int`, not a string you have to parse) instead of stringly-typed keys, and the *names* of your settings now live in one C# class. Cleaner, type-safe, and discoverable.

## Environments: dev vs. prod

The builder also exposes the **environment** — which named environment the app is running as. `builder.Environment` is an `IHostEnvironment`, and its value comes from the **`ASPNETCORE_ENVIRONMENT`** environment variable (defaulting to `Production` if unset). This is the same name that selects `appsettings.{Environment}.json` above.

```csharp
var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();   // detailed errors — dev only
}
else
{
    app.UseExceptionHandler("/error"); // friendly page in production
}
```

*What just happened:* `IsDevelopment()` checks whether `ASPNETCORE_ENVIRONMENT` is `"Development"`. Setting that variable to `Development` on your machine and leaving it as `Production` on the server lets the *same code* show stack traces locally and a clean error page in production. `IsProduction()` and the generic `IsEnvironment("Staging")` work the same way. The environment is a deploy-time switch, not a code change — exactly like configuration.

## The generic host runs more than web apps

> 📝 Underneath `WebApplication` sits the **generic host**, and it isn't web-specific. It can run non-web apps too — and even in a web app, you can register background work that runs *alongside* Kestrel. You do that with an `IHostedService` (or the simpler `BackgroundService` base class), and the host starts it on startup and stops it on shutdown.

```csharp
public class QueueCleaner : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            // ... drain a queue, run a timer, sweep stale data ...
            await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
        }
    }
}

// Register it like any other service:
builder.Services.AddHostedService<QueueCleaner>();
```

*What just happened:* `BackgroundService` is a hosted service with one method to fill in, `ExecuteAsync`. The host calls it once at startup and passes a `CancellationToken` that trips when the app is shutting down — so your loop exits cleanly. Registered via `AddHostedService`, `QueueCleaner` now runs for the life of the app, in parallel with request handling, sharing the same DI container and configuration. Timers, queue consumers, periodic cleanup — this is where they live. (Drop the web parts entirely and the generic host happily runs a console worker service with no Kestrel at all.)

## Recap

- **The host wires up four things before your app runs** — configuration, the DI container, logging, and Kestrel — then owns the lifecycle. The rhythm is `CreateBuilder` → configure → `Build()` → `Run()`.
- **`CreateBuilder` returns a `WebApplicationBuilder`; `Build()` returns a `WebApplication`** that is the host, the pipeline builder, and the endpoint route builder in one object.
- **The DI container** is `builder.Services` (an `IServiceCollection`); after `Build()` it resolves middleware and endpoints, opening a fresh **scope** per request — `HttpContext.RequestServices` is that per-request provider.
- **Configuration** is layered: `appsettings.json` → `appsettings.{Environment}.json` → user secrets → environment variables → command-line args, later overriding earlier. Read with `Configuration["Key"]` / `GetConnectionString(...)`, or bind a section with the **options pattern** (`Configure<T>` + `IOptions<T>`).
- **The environment** comes from `ASPNETCORE_ENVIRONMENT` and is exposed via `builder.Environment` (`IsDevelopment()` / `IsProduction()`) — a deploy-time switch, not a code change.
- **The generic host underneath also runs non-web work**: register an `IHostedService` / `BackgroundService` for timers, queue consumers, and other background tasks that run alongside (or without) the web server.

## Quick check

```quiz
[
  {
    "q": "What does WebApplicationBuilder set up before your app exists?",
    "choices": ["Only the middleware pipeline", "Configuration, the DI container, logging, and Kestrel", "Only the routing table", "Just the connection string"],
    "answer": 1,
    "explain": "CreateBuilder returns a WebApplicationBuilder that has already prepared configuration, the DI container, logging, and Kestrel before you add anything to it."
  },
  {
    "q": "Two configuration providers both set the key \"Greeting\". Which value wins?",
    "choices": ["The one from the provider added earliest", "The one from the provider higher in the stack (added later)", "It throws because of the conflict", "appsettings.json always wins"],
    "answer": 1,
    "explain": "Providers are layered and later ones override earlier ones. With the default stack, an environment variable beats appsettings.json for the same key."
  },
  {
    "q": "You need a timer that drains a queue every five minutes alongside your web app. What do you register?",
    "choices": ["A Singleton middleware", "An IOptions<T> binding", "An IHostedService / BackgroundService via AddHostedService", "A new Kestrel listener"],
    "answer": 2,
    "explain": "The generic host runs background work registered as an IHostedService (or BackgroundService) with AddHostedService — it starts on startup and stops cleanly on shutdown."
  }
]
```

---

[← Phase 4: The RequestDelegate](04-the-request-delegate.md) · [Guide overview](_guide.md) · [Phase 6: How Minimal APIs & MVC Sit on Top →](06-how-minimal-apis-and-mvc-sit-on-top.md)
