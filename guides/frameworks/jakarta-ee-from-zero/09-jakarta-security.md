---
title: "Jakarta Security"
guide: "jakarta-ee-from-zero"
phase: 9
summary: "Secure your Product REST API the standard way: an HttpAuthenticationMechanism proves who you are, an identity store validates credentials, and @RolesAllowed decides what you can do — with JWT for stateless APIs."
tags: [jakarta-ee, jakarta-security, authentication, authorization, roles-allowed, identity-store, jwt]
difficulty: advanced
synonyms: ["jakarta ee security", "jakarta security authentication mechanism", "@RolesAllowed jakarta", "jakarta identity store", "jakarta ee roles authentication", "jakarta security jwt", "java ee security api"]
updated: 2026-07-10
---

# Jakarta Security

Your `Product` API from [Phase 4](04-jax-rs-rest-apis.md) works beautifully — and right now, anyone on the internet can read it, write to it, and delete from it. That's fine for a demo on `localhost`. It is a catastrophe in production. This phase bolts a door onto the front of that API.

Security has a reputation for being a swamp, and Jakarta's history doesn't help: for years there were three competing, overlapping ways to do it (servlet security, JAAS, vendor-specific config) and tutorials that handed you XML you couldn't read. We're going to ignore all of that. Modern Jakarta EE has *one* coherent story — the **Jakarta Security API** — and it's built on two questions that, once you separate them cleanly, make everything else click into place.

Here are the two questions. Burn them into your memory before we touch code.

> **Authentication: who are you?**
> **Authorization: are you allowed to do this?**

Get those two straight and the rest of this phase is just learning which Jakarta annotation answers which one.

## Authentication vs authorization — two different questions

These words sound alike, get abbreviated to the nearly-identical *authN* and *authZ*, and are confused constantly — including in shipping production code that conflates them and opens a hole.

📝 **Authentication (authN) = "who are you?"** It's the login step: you prove your identity with a password, an API key, a token. The output is a verified identity, or a rejection. **Authorization (authZ) = "are you allowed to do this?"** It runs *after* authentication, on a now-known user, and checks whether that user may perform *this specific action* — usually via **roles** like `ADMIN` or `USER`.

A worked example makes the split obvious: logging into your bank's app is authentication — the app now knows it's you. Being told "you can view your own account but not transfer from someone else's" is authorization. You stay fully authenticated the whole time; you're just not authorized for that one action. Mix these up — confirm someone is logged in but never check *what* they're allowed to do — and any logged-in user can do anything. That is one of the most common real-world security bugs.

In Jakarta EE these two steps are handled by two different pieces of machinery, in order:

```mermaid
flowchart LR
  Req[HTTP request to /api/products] --> AM[Authentication mechanism]
  AM --> IS[Identity store validates]
  IS --> ID[Identity established: user + roles]
  ID --> AZ[Authorization check: @RolesAllowed]
  AZ -->|allowed| Res[ProductResource method runs]
  AM -.no credentials.-> Deny[401 Unauthorized]
  AZ -.wrong role.-> Forbid[403 Forbidden]
```

*What just happened:* A request first meets an **authentication mechanism**, which extracts credentials and asks an **identity store** to validate them. If that succeeds, the container records *who* you are and *which roles* you hold — that's the established identity. Only then does the **authorization** check run, comparing your roles against what the resource demands. Two failure exits, and they mean different things: no valid credentials gives **401 Unauthorized** ("I don't know who you are"); valid credentials but insufficient role gives **403 Forbidden** ("I know who you are, and the answer is no"). This authN-then-authZ ordering is foundational enough to have its own guide: [Authentication vs Authorization](/guides/auth-vs-authz).

## Authentication mechanisms — proving who you are

So how does the container *get* your credentials off the wire? That's the job of an **authentication mechanism**.

📝 In modern Jakarta Security, an `HttpAuthenticationMechanism` is the component that inspects an incoming request, pulls out whatever credentials it carries, and kicks off validation. You rarely write one by hand — the spec ships ready-made ones you switch on with a single annotation. The container then runs the chosen mechanism *before* your resource method, every request.

The built-in choices map to how clients actually authenticate:

- **`@BasicAuthenticationMechanismDefinition`** — HTTP Basic auth: the client sends `username:password` (base64-encoded) in an `Authorization` header. Simple, common for machine-to-machine APIs.
- **`@FormAuthenticationMechanismDefinition`** — a login form and a session cookie afterward. The right fit for browser apps with human users.
- **A custom mechanism** — implement `HttpAuthenticationMechanism` yourself when you need something the built-ins don't cover (this is how JWT support is often wired in, more on that later).

Turning on Basic auth for our `Product` API is a single annotation, placed on any CDI bean (your `Application` class is a natural home):

```java
import jakarta.security.enterprise.authentication.mechanism.http.BasicAuthenticationMechanismDefinition;
import jakarta.ws.rs.ApplicationPath;
import jakarta.ws.rs.core.Application;

@BasicAuthenticationMechanismDefinition(realmName = "product-api")
@ApplicationPath("/api")
public class RestConfig extends Application {
    // the annotation does the work; the class body stays empty
}
```

*What just happened:* `@BasicAuthenticationMechanismDefinition` told the container "for this application, authenticate requests using HTTP Basic." Now, before any `ProductResource` method runs, the container reads the `Authorization: Basic ...` header, decodes the username and password, and hands them off for validation. You didn't parse a header or decode base64 — you *declared* the mechanism and the container supplies the plumbing. Notice this annotation only answers *how credentials arrive*; it says nothing about *where the real users live*. That's the next, separate piece.

## Identity stores — where users actually live

A mechanism extracts a username and password. Something still has to answer: *is this a real user, is this their real password, and what roles do they have?* That something is an **identity store**.

📝 An `IdentityStore` is the source of truth for credentials and roles. The mechanism passes it the submitted credentials; the store looks the user up, verifies the password, and returns the user's roles (or "invalid"). Jakarta gives you declarative built-ins for the common backends:

- **`@DatabaseIdentityStoreDefinition`** — users and roles live in your database; you give it two SQL queries (one for the password hash, one for the roles).
- **`@LdapIdentityStoreDefinition`** — users live in an LDAP/Active Directory server.
- **A custom `IdentityStore`** — implement the interface when your users live somewhere else entirely.

Here's a database-backed store for our app, sitting alongside the mechanism:

```java
import jakarta.security.enterprise.identitystore.DatabaseIdentityStoreDefinition;
import jakarta.security.enterprise.identitystore.Pbkdf2PasswordHash;

@DatabaseIdentityStoreDefinition(
    dataSourceLookup = "java:app/jdbc/ProductDB",
    callerQuery   = "SELECT password_hash FROM users WHERE username = ?",
    groupsQuery   = "SELECT role FROM user_roles WHERE username = ?",
    hashAlgorithm = Pbkdf2PasswordHash.class
)
public class AppIdentityStore { }
```

*What just happened:* `callerQuery` fetches the stored password **hash** for the submitted username; the container hashes the submitted password the same way and compares — your raw password is never matched against plaintext. `groupsQuery` returns that user's roles (the spec calls them "groups"), which become the basis for authorization later. `hashAlgorithm = Pbkdf2PasswordHash.class` tells the store the passwords are hashed with PBKDF2, so it knows how to verify them.

⚠️ **Store password hashes, never plaintext.** That `password_hash` column must hold a salted, slow hash (PBKDF2, as above, or BCrypt) — *never* the raw password. If your database leaks and the passwords are plaintext, every account is instantly compromised everywhere those people reused that password. Hash them, and a leak yields useless gibberish. *Why* a slow salted hash (and not encryption, and not a fast hash like MD5) is its own rich topic — see [How Passwords Are Stored](/guides/how-passwords-are-stored). This is not a corner to cut.

## Authorization with roles — deciding what you can do

Identity established, roles in hand. Now: *should this user be allowed to do this?* This is where the two failure modes finally diverge in code — and where you protect the dangerous parts of your `Product` API.

📝 The standard, declarative tool is `@RolesAllowed`. You put it on a resource method (or an enterprise bean method from [Phase 8](08-enterprise-beans-and-messaging.md)) and name the roles permitted to call it. Its companions:

- **`@RolesAllowed("ADMIN")`** — only callers with the `ADMIN` role may invoke this.
- **`@PermitAll`** — anyone may call it, authenticated or not (good for public reads).
- **`@DenyAll`** — nobody may call it (rare, but explicit).

The natural shape for our API: let anyone *read* products, but require `ADMIN` to *create* or *delete* them.

```java
import jakarta.annotation.security.RolesAllowed;
import jakarta.annotation.security.PermitAll;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;

@Path("/products")
public class ProductResource {

    @Inject
    private ProductService service;

    @GET
    @PermitAll                                  // reading is public
    @Produces(MediaType.APPLICATION_JSON)
    public List<Product> listProducts() {
        return service.findAll();
    }

    @POST
    @RolesAllowed("ADMIN")                       // creating requires ADMIN
    @Consumes(MediaType.APPLICATION_JSON)
    public Response createProduct(Product product) {
        Product saved = service.create(product);
        return Response.status(Response.Status.CREATED).entity(saved).build();
    }
}
```

*What just happened:* `@PermitAll` on `listProducts` keeps the catalog open to everyone — no credentials needed. `@RolesAllowed("ADMIN")` on `createProduct` tells the container to run the authorization check *after* authentication: only a caller whose identity store returned the `ADMIN` role gets through. A logged-in non-admin reaches `createProduct` already authenticated, fails the role check, and is rejected — without your method body ever running. You wrote zero `if (user.hasRole(...))` plumbing; the annotation *is* the rule.

What a rejected write looks like — a valid but non-admin user trying to create a product:

```http
POST /api/products HTTP/1.1
Host: api.example.com
Authorization: Basic dXNlcjpwYXNzd29yZA==

{ "name": "Laptop Stand", "price": 39.95, "sku": "STD-LAP-04" }
```

```console
HTTP/1.1 403 Forbidden
```

*What just happened:* The credentials were valid (so it's **not** 401 — the server knows who this is), but the user lacks the `ADMIN` role, so authorization denied the request with **403 Forbidden**. That status is the whole authN/authZ distinction expressed in one number: *I know exactly who you are, and you still can't do this.*

When a decision depends on the *data*, not just a fixed role, declarative annotations aren't enough — and Jakarta gives you a programmatic escape hatch. Inject `SecurityContext` and ask it directly:

```java
import jakarta.security.enterprise.SecurityContext;

@DELETE
@Path("/{id}")
@RolesAllowed({"ADMIN", "MANAGER"})
public Response deleteProduct(@PathParam("id") Long id) {
    if (!securityContext.isCallerInRole("ADMIN") && service.isFlagship(id)) {
        return Response.status(Response.Status.FORBIDDEN).build();   // only ADMIN may delete flagship items
    }
    service.delete(id);
    return Response.noContent().build();
}
```

*What just happened:* `@RolesAllowed` did the coarse gate (admins and managers only), then `securityContext.isCallerInRole("ADMIN")` made a finer, *runtime* decision the annotation couldn't express: managers may delete ordinary products but not flagship ones. 💡 Reach for `SecurityContext` only when the rule genuinely depends on the request's data — for fixed role rules, the declarative `@RolesAllowed` is clearer and harder to get wrong.

## Stateless APIs & JWT — the overview, and the one rule

The Basic-auth-and-session model assumes the server *remembers* you between requests. For a REST API serving mobile apps and other services, that's often the wrong shape — you'd rather each request carry its own proof and the server keep no session memory at all.

📝 **A stateless API carries identity on every request instead of relying on a server-side session.** The dominant approach is the **JWT (JSON Web Token)**: at login the server hands the client a *signed* token encoding who they are, their roles, and when it expires. The client sends it back in an `Authorization: Bearer <token>` header on every subsequent request. A mechanism validates the signature and expiry and, if it checks out, establishes the identity — *with no session lookup*. In Jakarta-land this is standardized by **MicroProfile JWT**, which we meet in [Phase 10](10-microprofile-and-where-next.md); the beauty is that once the token is validated, your `@RolesAllowed` annotations work *exactly the same* — the roles just come from the token instead of an identity store.

```http
GET /api/products HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

*What just happened:* The client attaches its signed token in the `Authorization` header. A JWT mechanism reads it, verifies the signature against the issuer's key, checks it hasn't expired, and populates the caller's identity and roles — so the downstream authorization rules do their job without the server remembering anything. Any instance of your service can validate the token independently, which is exactly why this scales horizontally.

We are deliberately *not* hand-rolling a JWT implementation here, and you should be wary of any tutorial that casually does. ⚠️ The footguns are real and unforgiving:

- **Token storage on the client** — `localStorage` is exposed to XSS; `HttpOnly` cookies dodge that but invite CSRF. There's no free lunch; choose deliberately.
- **Expiry and revocation** — a stateless token can't be "logged out" server-side without extra machinery (a denylist, or short-lived tokens plus refresh tokens). Always set a sane expiry.
- **Transport** — a Bearer token is a password in plain text. ⚠️ Over plain HTTP, anyone on the network reads it and impersonates the user. **Always HTTPS in production**, no exceptions — see [HTTPS and TLS](/guides/https-and-tls).
- **Never roll your own crypto or token parsing** — this is the cardinal sin. Signature verification has subtle, exploited-in-the-wild failure modes (the infamous `alg: none` attack, among others).

💡 The throughline for this whole phase: **security is the worst possible place to improvise.** Lean on the container's standard mechanisms — `HttpAuthenticationMechanism`, declarative identity stores, `@RolesAllowed`, MicroProfile JWT. They encode years of patched vulnerabilities and hard-won lessons your clever shortcut hasn't survived. The most secure code you'll write in this phase is the code you *didn't* write because the spec already had it.

## Recap

1. **AuthN and authZ are two different questions.** Authentication is "who are you?" (the login step); authorization is "are you allowed to do this?" (roles), and it runs second on a now-known user. No credentials → **401**; valid credentials but wrong role → **403**. Conflating them is a classic hole — see [Authentication vs Authorization](/guides/auth-vs-authz).
2. **An authentication mechanism gets credentials off the wire.** `@BasicAuthenticationMechanismDefinition`, `@FormAuthenticationMechanismDefinition`, or a custom `HttpAuthenticationMechanism` — you *declare* one and the container runs it before your resource. It says *how* credentials arrive, not *where* users live.
3. **An identity store validates credentials and supplies roles.** `@DatabaseIdentityStoreDefinition` / `@LdapIdentityStoreDefinition` / a custom `IdentityStore`. ⚠️ Store salted, slow password *hashes* (PBKDF2/BCrypt), never plaintext — see [How Passwords Are Stored](/guides/how-passwords-are-stored).
4. **Authorize with `@RolesAllowed`.** Put it on resource or EJB methods; `@PermitAll` opens a method to everyone, `@DenyAll` closes it. For data-dependent rules, inject `SecurityContext` and call `isCallerInRole(...)` — but prefer the declarative annotation when the rule is fixed.
5. **Stateless APIs use JWT.** A signed `Authorization: Bearer ...` token carries identity and roles per request, no session; MicroProfile JWT (Phase 10) standardizes it and your `@RolesAllowed` keeps working. ⚠️ Mind token storage, expiry/revocation, always use HTTPS ([HTTPS and TLS](/guides/https-and-tls)), and never roll your own crypto.
6. **Don't improvise security.** Lean on the container's battle-tested standard mechanisms; the safest code is the code the spec already wrote and patched for you.

## Quick check

Make sure the authN/authZ split — and which Jakarta piece answers which question — actually stuck:

```quiz
[
  {
    "q": "A user with valid credentials but only the USER role calls a @RolesAllowed(\"ADMIN\") endpoint. What status should they get, and why?",
    "choices": [
      "403 Forbidden — the server knows who they are (authentication passed) but they lack the required role (authorization failed)",
      "401 Unauthorized — they failed to prove their identity",
      "200 OK — being logged in is enough to call any endpoint",
      "500 Internal Server Error — the role mismatch crashes the handler"
    ],
    "answer": 0,
    "explain": "Authentication succeeded, so it's not 401 — the server knows who they are. Authorization then failed because the caller lacks the ADMIN role, which is exactly what 403 Forbidden means: 'I know who you are, and the answer is no.' 401 means 'I don't know who you are.'"
  },
  {
    "q": "In modern Jakarta Security, what is the job of an identity store (e.g. @DatabaseIdentityStoreDefinition)?",
    "choices": [
      "It validates the submitted credentials against a backend and returns the user's roles",
      "It extracts the Authorization header off the incoming HTTP request",
      "It decides which roles are allowed to call a given resource method",
      "It encrypts the response body before sending it to the client"
    ],
    "answer": 0,
    "explain": "The authentication mechanism extracts credentials from the request; the identity store is the source of truth that validates them (against a database, LDAP, etc.) and returns the user's roles. Authorization — who may call what — is handled separately by @RolesAllowed."
  },
  {
    "q": "Which statement about securing a stateless JWT-based API is correct?",
    "choices": [
      "Use a vetted library/standard (like MicroProfile JWT), always serve over HTTPS, and set a token expiry",
      "Tokens make HTTPS unnecessary because they are already signed",
      "You should write your own signature-verification code so you fully control it",
      "A signed JWT can always be instantly revoked server-side with no extra machinery"
    ],
    "answer": 0,
    "explain": "A Bearer token is a password in plaintext, so HTTPS is mandatory — signing proves integrity, not confidentiality. Never roll your own crypto (the alg:none attack is real); lean on a vetted standard like MicroProfile JWT. And a stateless token can't be revoked without extra machinery (denylist or short-lived tokens + refresh), so always set an expiry."
  }
]
```

---

[← Phase 8: Enterprise Beans & Messaging](08-enterprise-beans-and-messaging.md) · [Guide overview](_guide.md) · [Phase 10: MicroProfile & Where to Go Next →](10-microprofile-and-where-next.md)
