---
title: "Kestrel: The Web Server"
guide: "the-aspnet-pipeline-and-kestrel"
phase: 2
summary: "Kestrel is the cross-platform server that owns the socket, speaks HTTP, and hands each request to your pipeline as an HttpContext. Configuring ports, and why a reverse proxy is a choice."
tags: [aspnet-core, csharp, kestrel, web-server, reverse-proxy]
difficulty: intermediate
synonyms: ["kestrel web server", "kestrel cross platform", "kestrel reverse proxy", "kestrel vs iis", "kestrel listen ports", "aspnet core server"]
updated: 2026-07-10
---

# Kestrel: The Web Server

**Kestrel is the program that owns the socket and speaks HTTP.** Nothing more mystical than that. When a browser opens a TCP connection to your app, Kestrel is the thing on the other end that accepts it, reads the raw bytes, figures out "this is an HTTP request for `GET /products`," and packages that up into an `HttpContext` object your code can work with. Then it hands that `HttpContext` to the pipeline (the chain you met in Phase 1) and waits for the response to come back so it can write the bytes out on the wire.

The detail that trips people up coming from the old .NET Framework world: **Kestrel runs in-process.** Your app *is* the server. There's no separate server product you install and configure that then "hosts" your DLL. You write `var app = builder.Build(); app.Run();` and that `app.Run()` call starts Kestrel right there inside your own process. The web server and your application code live in the same running program.

> 📝 If you came from ASP.NET on .NET Framework, this is the big shift. Back then **IIS** was the server — a separate Windows-only service that loaded your app. Today the server (Kestrel) is a library your app references and starts itself, and it runs on Windows, Linux, and macOS alike.

## What Kestrel actually handles

Owning the socket is a bigger job than it sounds. Kestrel is responsible for the messy, low-level networking work so your application code never has to think about it:

- **The protocols.** It speaks HTTP/1.1, HTTP/2, and HTTP/3 (QUIC). It negotiates which one to use per connection.
- **TLS.** It can terminate HTTPS — doing the certificate handshake and decrypting traffic — so by the time your code sees a request, it's already plaintext.
- **Connection management.** Keep-alives, timeouts, request size limits, concurrent connection limits, slow-client protection. Kestrel is the part that has to survive contact with the open internet.

Once all that's done, the result of each request is one tidy `HttpContext`, and that's the only thing your pipeline ever sees. Kestrel did the hard part; the pipeline does the interesting part.

```csharp
var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

app.MapGet("/", () => "Hello from inside Kestrel");

app.Run();
```

*What just happened:* `WebApplication.CreateBuilder` set up a host that already includes Kestrel as the default server. `app.Run()` started Kestrel listening on a socket, and now every HTTP request that arrives gets turned into an `HttpContext` and routed to that `MapGet` handler. You never named Kestrel anywhere — it's the default, wired in for you.

## Telling Kestrel which ports to listen on

By default Kestrel needs to know one thing from you: where to listen. The URLs and ports come from **configuration**, and there are several sources, checked in a sensible order. From most common to most explicit:

- **`launchSettings.json`** — the dev-only file Visual Studio / `dotnet run` reads. This is where your `https://localhost:7001` style dev ports come from. It is *not* deployed to production.
- **The `ASPNETCORE_URLS` environment variable** — e.g. `ASPNETCORE_URLS=http://0.0.0.0:8080`. The standard way to set the port in containers and on servers.
- **The `--urls` command-line argument** — `dotnet run --urls "http://localhost:8080"`.
- **The `Kestrel` section of `appsettings.json`** — for richer config (endpoints, certificates, protocols) declaratively.
- **Code** — `builder.WebHost.ConfigureKestrel(...)` or `builder.WebHost.UseUrls(...)` when you want full control in C#.

```bash
# Set the listen URL via environment variable (great for containers)
export ASPNETCORE_URLS="http://0.0.0.0:8080"
dotnet run

# ...or pass it as an argument
dotnet run --urls "http://localhost:8080;https://localhost:8443"
```

*What just happened:* both forms tell Kestrel to bind to specific addresses and ports instead of the `launchSettings.json` defaults. `0.0.0.0` means "listen on all network interfaces" (you want this inside a container so traffic from outside can reach it); `localhost` means "only accept connections from this machine." The semicolon lets you list more than one endpoint.

If you'd rather configure it in code — say you need to tweak limits or bind programmatically:

```csharp
var builder = WebApplication.CreateBuilder(args);

builder.WebHost.ConfigureKestrel(options =>
{
    options.ListenAnyIP(8080); // HTTP on port 8080, all interfaces
    options.Limits.MaxRequestBodySize = 10 * 1024 * 1024; // 10 MB cap
});

var app = builder.Build();
app.Run();
```

*What just happened:* `ConfigureKestrel` reached into Kestrel's own options and told it to listen on port 8080 and reject request bodies larger than 10 MB. This is the most explicit lever — useful when env vars and JSON aren't enough, but reach for it last, because hard-coding ports makes the app less portable across environments.

## In production: the reverse proxy question

In a lot of production setups, Kestrel doesn't face the internet alone. It sits behind a **reverse proxy** — nginx, Apache, IIS, YARP, or a cloud load balancer. Traffic hits the proxy first; the proxy then forwards it to Kestrel on an internal port.

Why bother? The proxy is a convenient place to put the operational concerns that aren't really your app's job: TLS termination, serving static files, load-balancing across several Kestrel instances, request buffering, and acting as a hardened front door. It shields Kestrel and lets ops teams use tooling they already know.

The catch: once a proxy sits in front, your app no longer sees the *real* client. The connection Kestrel sees comes from the proxy, so `HttpContext.Connection.RemoteIpAddress` is the proxy's IP, and the scheme might read as `http` even though the user came in over `https`. The proxy passes the originals along in `X-Forwarded-For` / `X-Forwarded-Proto` headers, and you tell ASP.NET Core to trust and apply them:

```csharp
var app = builder.Build();

app.UseForwardedHeaders(); // read X-Forwarded-* and fix up the request

app.MapGet("/whoami", (HttpContext ctx) =>
    $"You are {ctx.Connection.RemoteIpAddress}, scheme {ctx.Request.Scheme}");

app.Run();
```

*What just happened:* `UseForwardedHeaders` is middleware that reads the `X-Forwarded-For` and `X-Forwarded-Proto` headers the proxy set, then rewrites the request's remote IP and scheme to the real values. Without it, your logging, redirects, and any IP-based logic would all see the proxy instead of the actual user. (Configure which proxies you trust before enabling this in production — blindly trusting forwarded headers is a spoofing risk.)

> ⚠️ A reverse proxy is a **choice, not a rule.** Kestrel is hardened and fully supported facing the internet directly — plenty of production apps run exactly that way, especially in containerized and cloud-native setups. People put a proxy in front for TLS, static files, and operational convenience, not because Kestrel "can't handle it." Decide based on your ops needs, not folklore.

## The line Kestrel will not cross

One last thing to lock in, because it's the bridge to the next phase. 📝 **Kestrel knows nothing about routing or middleware.** It has no idea that `/products` maps to a particular handler, no concept of "authentication middleware runs before authorization." Its entire worldview is: accept a connection, parse HTTP, build an `HttpContext`, hand it off, write back the response.

Everything about *what to do* with a request — matching routes, running auth, calling your endpoint — happens in the **middleware pipeline**, which is exactly what Phase 3 is about. Kestrel is the doorman who lets the request in and shows it where the hallway starts. What happens down that hallway is someone else's job.

## Recap

- **Kestrel owns the socket and speaks HTTP** — it accepts TCP connections, parses requests, and hands each one to your pipeline as an `HttpContext`.
- It runs **in-process**: your app *is* the server, started by `app.Run()` — a deliberate break from the old IIS-hosted, Windows-only model.
- It handles the low-level work: **HTTP/1.1, HTTP/2, HTTP/3, TLS, and connection management**, so your code only ever sees a clean request.
- **Listen URLs come from configuration** — `launchSettings.json` (dev), `ASPNETCORE_URLS`, `--urls`, the `Kestrel` section of `appsettings.json`, or `ConfigureKestrel`/`UseUrls` in code.
- In production Kestrel often sits behind a **reverse proxy** (nginx/IIS/YARP/cloud LB) for TLS and ops convenience; add `UseForwardedHeaders` so the app sees the real client IP and scheme. But facing the internet directly is a fully supported choice.
- Kestrel knows **nothing about routing or middleware** — that's the pipeline's job, coming up in Phase 3.

## Quick check

```quiz
[
  {
    "q": "What does it mean that Kestrel runs 'in-process'?",
    "choices": ["A separate server product loads your compiled DLL", "Your application is the server process; app.Run() starts Kestrel inside it", "Kestrel runs as a Windows-only service", "Each request gets its own operating-system process"],
    "answer": 1,
    "explain": "Kestrel is a library your app references and starts itself with app.Run(), so the web server and your code live in the same running process."
  },
  {
    "q": "You deploy behind nginx and your app logs show every request coming from the same IP, with the scheme reading as http. What fixes it?",
    "choices": ["Switch Kestrel to HTTP/3", "Add app.UseForwardedHeaders() so the X-Forwarded-* headers are applied", "Hard-code the port with ConfigureKestrel", "Disable TLS termination on the proxy"],
    "answer": 1,
    "explain": "Behind a proxy the connection Kestrel sees is the proxy's. UseForwardedHeaders reads X-Forwarded-For / X-Forwarded-Proto and restores the real client IP and scheme."
  },
  {
    "q": "Which statement about a reverse proxy in front of Kestrel is correct?",
    "choices": ["Kestrel cannot safely face the internet, so a proxy is mandatory", "A proxy is a choice for TLS and ops convenience; Kestrel can also face the internet directly", "A proxy replaces the middleware pipeline", "Only IIS can act as a reverse proxy for Kestrel"],
    "answer": 1,
    "explain": "Kestrel is hardened and supported facing the internet directly. Teams add a proxy for TLS termination, static files, and load balancing — it's an operational choice, not a requirement."
  }
]
```

---

[← Phase 1: What Kestrel & the Pipeline Are](01-what-kestrel-and-the-pipeline-are.md) · [Guide overview](_guide.md) · [Phase 3: The Middleware Pipeline →](03-the-middleware-pipeline.md)
