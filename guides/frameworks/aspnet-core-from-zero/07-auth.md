---
title: "Authentication & Authorization"
guide: "aspnet-core-from-zero"
phase: 7
summary: "JWT bearer auth in ASP.NET Core: the who-then-what mental model, validating tokens, the all-important middleware order, and protecting endpoints with Authorize, policies, and roles."
tags: [aspnet-core, csharp, authentication, authorization, jwt]
difficulty: advanced
synonyms: ["aspnet authentication", "aspnet jwt bearer", "aspnet authorize attribute", "aspnet authorization policies", "RequireAuthorization", "aspnet core identity", "auth vs authz"]
updated: 2026-06-23
---

# Authentication & Authorization

The products API works - full CRUD from Phase 6 - but right now anyone who finds the URL can delete every product. Fine for a demo, a disaster for anything real. This phase locks the writes while leaving the reads open.

Before any code, the one mental model that untangles this whole topic. People mix up two words constantly, and the framework keeps them strictly separate, so you should too.

**Authentication** answers *who are you?* - it looks at the request (a token, a cookie) and figures out the identity behind it. **Authorization** answers *what are you allowed to do?* - it takes that established identity and checks it against the rules on the endpoint.

> 📝 The shorthand that sticks: **authentication = who, authorization = what.** Authentication runs first and produces an identity; authorization runs second and judges it. You cannot check what someone may do until you know who they are - exactly why the middleware order in Phase 5 is non-negotiable.

Both are middleware, slotting into the pipeline you already know, right after routing and before your endpoints. Hold "who, then what," and everything below is detail hanging off it.

## Setting up JWT bearer authentication

For APIs, the standard approach is **JWT bearer authentication**. A JWT (JSON Web Token) is a signed blob of claims - "I am user 42, my role is Admin" - that the client sends on every request in the `Authorization: Bearer <token>` header. Your server doesn't store sessions; it verifies the signature and trusts the claims inside.

Register it in `Program.cs` before `builder.Build()`:

```csharp
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = config["Jwt:Issuer"],
            ValidAudience = config["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(config["Jwt:Key"]!))
        };
    });

builder.Services.AddAuthorization();
```

*What just happened:* `AddAuthentication` registers the auth services and names the *default scheme* - the strategy used when an endpoint demands authentication. `AddJwtBearer` plugs in the JWT validator. `TokenValidationParameters` are the rules every incoming token must pass: signed by *our* key (`ValidateIssuerSigningKey` + `IssuerSigningKey`), from the issuer we expect, meant for our audience, and not expired (`ValidateLifetime`). If any check fails, the request arrives unauthenticated. `AddAuthorization()` then registers the services that enforce the *what*.

> ⚠️ That signing key is the master password of your entire auth system - anyone holding it can mint tokens that impersonate any user. It's read from `config["Jwt:Key"]` here, never hardcoded. In development use [user secrets](/guides/aspnet-core-from-zero/08-testing-and-production.md) or environment variables; in production use a secrets manager or vault. A signing key committed to source control is one of the most common, and most damaging, mistakes in real codebases.

## ⚠️ Wiring the middleware in the right order

Registering the *services* above isn't enough - you also have to add the *middleware* to the pipeline, and here Phase 5's ordering law comes back to collect its debt:

```csharp
var app = builder.Build();

app.UseAuthentication();   // WHO is this? - must run first
app.UseAuthorization();    // WHAT may they do? - runs second

app.MapGet("/products", () => Results.Ok("listing products"));   // endpoints last

app.Run();
```

*What just happened:* `UseAuthentication` reads the token and establishes the identity; `UseAuthorization` then checks that identity against each endpoint's rules. Authentication **must** come before authorization - you can't judge permissions for someone you haven't identified yet - and **both must come before the endpoints they protect**. Get this backwards and the failure is silent: if `UseAuthorization` lands after your `MapGet`, the endpoint runs before anyone checks permissions, and your `[Authorize]` rules quietly do nothing. No error, no warning - just an open door. When auth misbehaves, this ordering is the first place to look.

## Protecting endpoints

With the plumbing in place, locking down an endpoint is a one-liner, in one of two flavors depending on style.

On a minimal-API endpoint or group, chain **`.RequireAuthorization()`**. On a controller or action, use the **`[Authorize]`** attribute. Both mean the same thing: "you must be authenticated to get past here."

Here's the products API with reads open and writes locked:

```csharp
var products = app.MapGroup("/products");

products.MapGet("/", () => Results.Ok(GetAll()));            // open to everyone
products.MapGet("/{id}", (int id) => Results.Ok(GetOne(id))); // open to everyone

products.MapPost("/", (Product p) => Results.Created($"/products/{p.Id}", p))
    .RequireAuthorization();                                  // login required

products.MapDelete("/{id}", (int id) => Results.NoContent())
    .RequireAuthorization();                                  // login required
```

*What just happened:* the two `GET`s stay public - anyone can browse the catalog. `POST` and `DELETE` carry `.RequireAuthorization()`, so a request without a valid token gets a `401 Unauthorized` before the handler runs. The authorization middleware enforces this; the handler never executes for an unauthenticated caller. If you'd protected the whole group instead, you could re-open a single endpoint with `.AllowAnonymous()` (or `[AllowAnonymous]` on a controller action), which punches an exception through a blanket rule.

### Policies and roles

"Logged in" is often too coarse. Deleting a product should require an *admin*, not just any authenticated user - that's a **policy**, a named rule you define once and apply by name.

Define it on `AddAuthorization`, then reference it where you protect the endpoint:

```csharp
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy => policy.RequireRole("Admin"));
});

// ...later, on the endpoint:
products.MapDelete("/{id}", (int id) => Results.NoContent())
    .RequireAuthorization("AdminOnly");
```

*What just happened:* `AddPolicy` names a rule - `"AdminOnly"` requires the user to carry the `Admin` role (a role is just a claim in the token). Passing that name to `.RequireAuthorization("AdminOnly")` upgrades the gate: now an authenticated *non*-admin gets a `403 Forbidden` (known, but not permitted), while an admin sails through. Note the two different rejections - `401` means "I don't know who you are," `403` means "I know exactly who you are, and the answer is no."

### Reading the user's claims

Inside a handler you often need *who* is calling - to stamp an audit field, or filter to their own data. The identity established by authentication lives on `HttpContext.User`, a `ClaimsPrincipal`. In a minimal API you get it by declaring a `ClaimsPrincipal` parameter, and the framework injects it:

```csharp
products.MapPost("/", (Product p, ClaimsPrincipal user) =>
{
    var createdBy = user.FindFirst(ClaimTypes.Name)?.Value ?? "unknown";
    p.CreatedBy = createdBy;
    return Results.Created($"/products/{p.Id}", p);
}).RequireAuthorization();
```

*What just happened:* declaring `ClaimsPrincipal user` in the parameter list tells the framework to hand you the authenticated identity (the same object as `HttpContext.User`). `user.FindFirst(ClaimTypes.Name)` pulls a single claim out of the token - here the username - so we can record who created the product. Every claim the token carried is readable this way; authorization already guaranteed the user is real before the handler ran.

## Where tokens come from

So far we've *consumed* tokens. Someone has to *issue* them: a **login endpoint** verifies a username and password, then builds and signs a JWT with the user's claims and hands it back. The client stores that token and sends it on every subsequent request.

```csharp
app.MapPost("/login", (LoginRequest req) =>
{
    // ... verify credentials against your user store ...
    var claims = new[] { new Claim(ClaimTypes.Name, req.Username) };
    var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["Jwt:Key"]!));
    var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

    var token = new JwtSecurityToken(
        issuer: config["Jwt:Issuer"],
        audience: config["Jwt:Audience"],
        claims: claims,
        expires: DateTime.UtcNow.AddHours(1),
        signingCredentials: creds);

    return Results.Ok(new { token = new JwtSecurityTokenHandler().WriteToken(token) });
}).AllowAnonymous();
```

*What just happened:* the endpoint builds a `JwtSecurityToken` carrying the user's claims, signs it with the *same key* the validator checks against, and serializes it to a string with `JwtSecurityTokenHandler`. It's `.AllowAnonymous()` because you can't require a token from the endpoint whose job is to *hand out* tokens. Notice the symmetry: this endpoint signs with `Jwt:Key` and the `AddJwtBearer` setup validates with `Jwt:Key` - the shared secret ties issuing and verifying together. (Newer code may reach for `JsonWebTokenHandler`; the idea is identical.)

> 💡 Verifying passwords, hashing them safely, storing users, handling registration and password resets - that's a lot of security-sensitive code you do not want to write by hand. **ASP.NET Core Identity** is the batteries-included system for exactly this: user stores, password hashing, lockout, the works. The hand-rolled login above shows the *mechanics* so the model is clear, but for a real app, lean on Identity for user management and JWT bearer (what we built) for API protection.

## Recap

- **Authentication = who, authorization = what.** Authentication runs first and establishes an identity; authorization runs second and checks that identity against endpoint rules. Both are middleware.
- **JWT bearer** is the standard for APIs: `AddAuthentication(...).AddJwtBearer(...)` plus `AddAuthorization()`, with `TokenValidationParameters` defining which tokens are trusted (issuer, audience, lifetime, signing key). Keep the signing key in config/secrets, never in source.
- **Order is the law:** `app.UseAuthentication()` before `app.UseAuthorization()`, and both before the endpoints they protect. Get it wrong and `[Authorize]` silently does nothing.
- **Protect endpoints** with `.RequireAuthorization()` (minimal API) or `[Authorize]` (controllers); re-open exceptions with `.AllowAnonymous()` / `[AllowAnonymous]`. Use named **policies** (`AddPolicy` + `RequireRole`) for finer rules. `401` = unauthenticated, `403` = authenticated but forbidden.
- **Read the caller** via `ClaimsPrincipal` (inject it into a handler, or use `HttpContext.User`). A login endpoint issues signed JWTs; **ASP.NET Core Identity** is the full user-management option.

Quick gut-check before moving on:

```quiz
[
  {
    "q": "What is the difference between authentication and authorization?",
    "choices": [
      "Authentication checks permissions; authorization verifies identity",
      "Authentication verifies WHO you are; authorization checks WHAT you're allowed to do",
      "They are two names for the same middleware",
      "Authentication is for APIs; authorization is for web pages"
    ],
    "answer": 1,
    "explain": "Authentication establishes identity (who), then authorization checks that identity against permissions (what). Authentication must run first."
  },
  {
    "q": "In Program.cs, which order is correct?",
    "choices": [
      "UseAuthorization() before UseAuthentication()",
      "UseAuthentication() before UseAuthorization(), both before the endpoints",
      "Endpoints first, then UseAuthentication() and UseAuthorization()",
      "Order doesn't matter for auth middleware"
    ],
    "answer": 1,
    "explain": "You must establish identity before checking permissions, and both must run before the endpoints they protect - otherwise [Authorize] rules silently do nothing."
  },
  {
    "q": "An authenticated non-admin user calls an endpoint protected with .RequireAuthorization(\"AdminOnly\"). What do they get?",
    "choices": [
      "401 Unauthorized - they aren't logged in",
      "200 OK - being logged in is enough",
      "403 Forbidden - they're known, but not permitted",
      "500 Internal Server Error"
    ],
    "answer": 2,
    "explain": "401 means unauthenticated (we don't know who you are). 403 means authenticated but lacking the required role/policy - known, but not permitted."
  }
]
```

[← Phase 6: Building a REST API](06-building-a-rest-api.md) · [Guide overview](_guide.md) · [Phase 8: Testing & Production →](08-testing-and-production.md)