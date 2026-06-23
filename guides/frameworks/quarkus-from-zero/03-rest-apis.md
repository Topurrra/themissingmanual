---
title: "Building REST APIs"
guide: "quarkus-from-zero"
phase: 3
summary: "Expose a Product over HTTP with Quarkus REST (RESTEasy Reactive): the standard JAX-RS annotations, path and query params, JSON request bodies via the rest-jackson extension, RestResponse for status codes, and the imperative-vs-reactive choice."
tags: [quarkus, rest, resteasy-reactive, jax-rs, json, rest-endpoints, quarkus-rest]
difficulty: beginner
synonyms: ["quarkus rest api", "quarkus resteasy reactive", "quarkus jax-rs endpoint", "quarkus json rest", "quarkus rest jackson", "quarkus path getmapping", "quarkus build rest service"]
updated: 2026-06-22
---

# Building REST APIs

In [Phase 2](02-dev-mode-and-dx.md) you watched dev mode reload your code the instant you saved it. That
loop is most fun when there's something to *hit* — an endpoint you can curl, tweak, and see change live.
So this phase gives you one: an HTTP API for the `Product` you've been carrying along (an `id`, a `name`,
and a `price`).

Here's the mental model to hold onto, and it's a comforting one: **Quarkus didn't invent a new way to
write REST APIs.** It uses the exact same Jakarta REST (JAX-RS) annotations you'd write on any Java
server — `@Path`, `@GET`, `@POST`, `@Produces`. If you've done the
[Jakarta EE guide](/guides/jakarta-ee-from-zero), you already know how to write a Quarkus resource; you
learned it there. What Quarkus changes is *underneath* — its REST engine (called **Quarkus REST**, and
historically **RESTEasy Reactive**) does the request-matching and wiring work at **build time** instead of
at startup, which is the whole "supersonic" story from Phase 1. Same spec you know, build-time optimized.

📝 So this phase isn't really "learn REST." It's "see the REST you know running on Quarkus, and meet the
two new wrinkles that are genuinely Quarkus-flavored: **extensions** (how you turn on features like JSON)
and the **imperative-vs-reactive** return-type choice." If `@Path`, `@PathParam`, or status codes feel
fuzzy, the [JAX-RS phase](/guides/jakarta-ee-from-zero) teaches them from scratch and
[REST APIs Explained](/guides/rest-apis-explained) covers the protocol itself. We won't re-teach all of
that here — we'll lean on it.

## It's JAX-RS (Quarkus REST / RESTEasy Reactive)

A REST endpoint in Quarkus is a *resource class*: a plain class marked with `@Path` to give it a URL, whose
methods are marked with the HTTP-verb annotations to become handlers. Here's a resource that returns a list
of products as JSON:

```java
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import java.math.BigDecimal;
import java.util.List;

@Path("/products")
public class ProductResource {

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public List<Product> list() {
        return List.of(
            new Product(1L, "Mechanical Keyboard", new BigDecimal("129.99")),
            new Product(2L, "USB-C Hub", new BigDecimal("49.50"))
        );
    }
}
```

*What just happened:* `@Path("/products")` mapped this class to the URL `/products`, and `@GET` said "this
method handles `GET` requests to that path." `@Produces(APPLICATION_JSON)` declares the response is JSON, so
when the method returns a `List<Product>`, Quarkus serializes each `Product` into a JSON object for you.
Notice the imports are `jakarta.ws.rs.*` — the standard JAX-RS package, not anything Quarkus-specific.
You're writing the spec; Quarkus is the engine. (The hardcoded list is a placeholder — the real data
arrives in [Phase 5](05-persistence-with-panache.md) when a database backs it.)

The request and the response it produces:

```http
GET /products HTTP/1.1
Host: localhost:8080
```

```json
[
  { "id": 1, "name": "Mechanical Keyboard", "price": 129.99 },
  { "id": 2, "name": "USB-C Hub", "price": 49.50 }
]
```

*What just happened:* The `List<Product>` came back as a JSON array, one object per product, each field
mapped by name. You wrote zero serialization code — the engine turned plain Java objects into the wire
format. (Quarkus defaults its HTTP port to `8080`, the same as a classic server, so the URL feels familiar.)

## Path and query params

A real API needs to address *one specific product* and to *filter* a list — and JAX-RS has a different
tool for each, exactly as in Jakarta EE.

📝 A **path param** is part of the URL path (`/products/2` means "the product with id 2"): you write a
placeholder with braces in `@Path` and bind it with `@PathParam`. A **query param** is a value after the
`?` (`/products?maxPrice=50`) and you bind it with `@QueryParam`. The rule of thumb is unchanged: a path
param *identifies* a resource; a query param *filters or modifies* the request.

```java
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import java.math.BigDecimal;
import java.util.List;

@Path("/products")
public class ProductResource {

    @GET
    @Path("/{id}")
    @Produces(MediaType.APPLICATION_JSON)
    public Product getOne(@PathParam("id") Long id) {
        return service.findById(id);
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public List<Product> list(@QueryParam("maxPrice") BigDecimal maxPrice) {
        return maxPrice == null ? service.findAll() : service.cheaperThan(maxPrice);
    }
}
```

*What just happened:* In `getOne`, the `{id}` in `@Path("/{id}")` lines up with `@PathParam("id") Long id`
— Quarkus pulls `2` out of `/products/2`, converts the text to a `Long`, and passes it in. In `list`,
`@QueryParam("maxPrice")` reads `?maxPrice=...`; when the client omits it the param is `null`, so we return
everything. (The `service` here is a stand-in for logic that moves into a CDI bean in
[Phase 4](04-cdi-with-arc.md) — keep the resource thin.)

Try both with curl against your running dev-mode app:

```bash
curl http://localhost:8080/products/2
curl "http://localhost:8080/products?maxPrice=60"
```

```console
{"id":2,"name":"USB-C Hub","price":49.50}

[{"id":2,"name":"USB-C Hub","price":49.50}]
```

*What just happened:* The first call hit the path-param route and returned a single product. The second hit
the same `/products` endpoint but, because `?maxPrice=` was present, returned a filtered array. The quotes
around the second URL keep the shell from choking on the `?`.

## Request bodies and JSON

Reading is half an API. To *create* a product the client sends JSON in the request body — and here's the
first genuinely Quarkus-flavored step: **JSON binding isn't on by default. You add it with an extension.**

⚠️ If you write a `@POST` that takes a `Product` body before adding a JSON extension, it won't deserialize
— Quarkus doesn't ship Jackson in the core. You add the capability by adding **`quarkus-rest-jackson`**,
and then JSON in *and* out just works:

```bash
quarkus extension add quarkus-rest-jackson
```

*What just happened:* That command edited your build file (`pom.xml` or `build.gradle`) to include the
extension, and dev mode picked it up on the next request. From this point, Quarkus REST can deserialize an
incoming JSON body into a Java object and serialize your return values to JSON. (The earlier `@GET`s
returning JSON also rely on this extension being present — it's the JSON engine for the whole resource.)

Now the create endpoint. To report the right status — **201 Created**, not the default 200 — return a
`RestResponse<Product>` instead of a bare `Product`:

```java
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import org.jboss.resteasy.reactive.RestResponse;

@Path("/products")
public class ProductResource {

    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public RestResponse<Product> create(Product product) {
        Product saved = service.create(product);
        return RestResponse.status(RestResponse.Status.CREATED, saved); // 201 + body
    }
}
```

*What just happened:* The `Product product` parameter has *no* annotation — JAX-RS treats the unannotated
parameter as the request body, and `@Consumes(APPLICATION_JSON)` tells the engine to deserialize the
incoming JSON into it. So by the time your code runs, you're holding a populated `Product`, not raw text. We
return a `RestResponse<Product>` set to **201 Created** with the saved product as the body — `RestResponse`
is Quarkus REST's type-safe wrapper over the classic JAX-RS `Response`, and you can use either (`Response`
works identically). Returning a bare `Product` would always yield a plain 200; `RestResponse` is the switch
you flip when the default status isn't the honest answer.

The JSON the client sends:

```json
{
  "name": "Laptop Stand",
  "price": 39.95
}
```

*What just happened:* The client posts a product with no `id` — the server assigns that on create. The
`quarkus-rest-jackson` extension binds `name` and `price` onto a `Product` before `create` runs, then
serializes the saved product (now with its `id`) back out as the 201 response body.

## Extensions — the Quarkus way to add features

You just used an extension to add JSON. It's worth pausing on *what an extension actually is*, because it's
how you'll add every capability from here on.

📝 An **extension** is a Quarkus-aware module — `quarkus-rest-jackson` for JSON,
`quarkus-hibernate-orm-panache` for persistence ([Phase 5](05-persistence-with-panache.md)),
`quarkus-jdbc-postgresql` for a database driver, and dozens more. You add one with `quarkus extension add`
(or by hand in your build file):

```bash
quarkus extension add quarkus-hibernate-orm-panache quarkus-jdbc-postgresql
```

*What just happened:* That added two capabilities to your project in one go. Each one wires itself into the
build and brings sensible defaults — for example, the persistence extensions hook into config so a database
"just works" in dev mode.

💡 So why an *extension* and not a plain Maven/Gradle dependency? Because an extension hooks into Quarkus's
**build-time processing** (the Phase 1 idea). A normal library only runs at runtime; an extension also
contributes a build step that does the scanning, reflection registration, and wiring *while compiling*, so
startup stays nearly instant — and so the feature still works when you compile to a native image
([Phase 9](09-native-compilation.md)), where runtime reflection isn't available. The extension catalog is
exactly how Quarkus stays fast while being full-featured: each feature pays its setup cost at build time,
once, instead of on every boot.

## Imperative vs reactive (a preview)

One last thing that makes Quarkus REST distinctive, mentioned now so it isn't a surprise later.

📝 Every handler above returned a value *directly* — a `Product`, a `List<Product>`, a `RestResponse`.
That's the **imperative** style: the method runs, blocks until it has the answer, and returns it. Quarkus
REST also lets a handler return a **reactive** type — a `Uni<Product>` (a promise of a single value) or a
`Multi<Product>` (a stream) — which lets the request hand its thread back while waiting on I/O, then resume
when the data is ready. Both styles run on the same Quarkus REST stack; you mix them freely per endpoint.
We dig into `Uni`/`Multi` properly in [Phase 7](07-reactive-with-mutiny.md) — for now, just know the door
exists.

💡 Whichever style you pick, the advice from this phase holds: **keep the resource thin.** A handler should
read the request, hand the real work to a CDI bean ([Phase 4](04-cdi-with-arc.md)) backed by Panache
([Phase 5](05-persistence-with-panache.md)), and shape the response. HTTP in, HTTP out; the logic lives
behind it. That separation is what lets you swap imperative for reactive — or the in-memory placeholder for
a real database — without touching the doorway.

## Recap

1. **It's standard JAX-RS, build-time optimized.** Quarkus REST (RESTEasy Reactive) runs the same
   `@Path`/`@GET`/`@POST`/`@Produces` annotations you'd write on any Jakarta server — but does the wiring
   at compile time, which is what makes startup nearly instant.
2. **Path params identify, query params filter.** `@PathParam` binds `{id}` from the path (one specific
   product); `@QueryParam` binds `?maxPrice=...` and is `null` when the client omits it.
3. **JSON comes from the `quarkus-rest-jackson` extension.** Add it, and the engine deserializes the
   unannotated `@POST` body into a Java object and serializes return values back to JSON.
4. **`RestResponse` controls status and headers.** Return a bare object for the default 200, or a
   `RestResponse<Product>` for 201 Created and other honest status codes (the classic `Response` works too).
5. **Extensions are how you add features.** An extension is a build-time-aware module added with
   `quarkus extension add`; it hooks Quarkus's build-time processing, which is why features stay fast and
   work in native images.
6. **Imperative or reactive, same stack.** A handler can return a plain `Product` or a `Uni<Product>` —
   both work; reactive comes in [Phase 7](07-reactive-with-mutiny.md). Keep the resource thin and push
   logic into a CDI bean.

## Quick check

Make sure the Quarkus-flavored bits stuck:

```quiz
[
  {
    "q": "Your @POST endpoint takes a Product body, but the incoming JSON isn't being deserialized into the object. What's the most likely cause?",
    "choices": [
      "The quarkus-rest-jackson extension isn't added — Quarkus doesn't ship JSON binding in the core, you turn it on with an extension",
      "JAX-RS annotations don't work in Quarkus; you need Quarkus-specific ones",
      "@POST methods can't accept a request body",
      "You must annotate the body parameter with @QueryParam"
    ],
    "answer": 0,
    "explain": "JSON binding is a capability you add via an extension. Without quarkus-rest-jackson, the engine has no JSON mapper, so the body won't deserialize. The annotations are standard JAX-RS, and the unannotated parameter IS the body — adding the extension is what's missing."
  },
  {
    "q": "Why does Quarkus use 'extensions' instead of plain Maven/Gradle dependencies for features like JSON and persistence?",
    "choices": [
      "An extension hooks into Quarkus's build-time processing, doing scanning and wiring at compile time so startup stays fast and the feature works in native images",
      "Extensions are just a rebrand of dependencies with no technical difference",
      "Extensions run only at runtime and skip the build entirely",
      "Plain dependencies aren't allowed in a Quarkus project"
    ],
    "answer": 0,
    "explain": "An extension contributes a build step that moves scanning, reflection registration, and wiring to compile time — the core Quarkus idea. That keeps boot nearly instant and makes the feature survive native compilation, where runtime reflection isn't available."
  },
  {
    "q": "Your create endpoint returns a plain Product and clients always get HTTP 200, even though a resource was created. How do you report 201 Created?",
    "choices": [
      "Return a RestResponse<Product>, e.g. RestResponse.status(RestResponse.Status.CREATED, saved), which carries the status alongside the body",
      "Add @POST(status = 201) to the method",
      "Throw an exception after saving so the server picks a different code",
      "Nothing can change it — Quarkus REST methods only return 200"
    ],
    "answer": 0,
    "explain": "Returning a bare object gives the default 200. To set the status (and headers), return a RestResponse — RestResponse.status(Status.CREATED, saved) reports 201 Created with the body. The classic JAX-RS Response works the same way."
  }
]
```

---

[← Phase 2: Dev Mode & the Developer Experience](02-dev-mode-and-dx.md) · [Guide overview](_guide.md) · [Phase 4: CDI in Quarkus (ArC) →](04-cdi-with-arc.md)
