---
title: "Building REST APIs"
guide: "quarkus-from-zero"
phase: 3
summary: "Expose a Product over HTTP with Quarkus REST (RESTEasy Reactive): the standard JAX-RS annotations, path and query params, JSON request bodies via the rest-jackson extension, RestResponse for status codes, and the imperative-vs-reactive choice."
tags: [quarkus, rest, resteasy-reactive, jax-rs, json, rest-endpoints, quarkus-rest]
difficulty: beginner
synonyms: ["quarkus rest api", "quarkus resteasy reactive", "quarkus jax-rs endpoint", "quarkus json rest", "quarkus rest jackson", "quarkus path getmapping", "quarkus build rest service"]
updated: 2026-07-10
---

# Building REST APIs

Phase 2's live reload is most fun when there's something to *hit* - an endpoint you can curl, tweak, and see change live. This phase gives you one: an HTTP API for the `Product` you've been carrying along (an `id`, a `name`, a `price`).

**Quarkus didn't invent a new way to write REST APIs.** It uses the exact same Jakarta REST (JAX-RS) annotations you'd write on any Java server - `@Path`, `@GET`, `@POST`, `@Produces`. If you've done the [Jakarta EE guide](/guides/jakarta-ee-from-zero), you already know how to write a Quarkus resource. What Quarkus changes is *underneath* - its REST engine (**Quarkus REST**, historically **RESTEasy Reactive**) does request-matching and wiring at **build time** instead of startup - the "supersonic" story from Phase 1.

📝 So this phase isn't "learn REST" - it's "see the REST you know running on Quarkus," plus two genuinely Quarkus-flavored wrinkles: **extensions** (turning on features like JSON) and the **imperative-vs-reactive** return-type choice. If `@Path`, `@PathParam`, or status codes feel fuzzy, the [JAX-RS phase](/guides/jakarta-ee-from-zero) and [REST APIs Explained](/guides/rest-apis-explained) teach them from scratch.

## It's JAX-RS (Quarkus REST / RESTEasy Reactive)

A REST endpoint in Quarkus is a *resource class*: a plain class marked with `@Path`, whose methods are marked with HTTP-verb annotations. Here's one that returns a list of products as JSON:

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

*What just happened:* `@Path("/products")` mapped this class to `/products`, `@GET` handles `GET` requests, and `@Produces(APPLICATION_JSON)` declares the response format, so `List<Product>` serializes automatically. The imports are `jakarta.ws.rs.*` - standard JAX-RS, nothing Quarkus-specific. (The hardcoded list is a placeholder - real data arrives in [Phase 5](05-persistence-with-panache.md).)

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

*What just happened:* the `List<Product>` came back as a JSON array. You wrote zero serialization code. (Quarkus defaults to port `8080`, same as a classic server.)

## Path and query params

📝 A **path param** is part of the URL (`/products/2` = "product with id 2"): a placeholder in `@Path`, bound with `@PathParam`. A **query param** is a value after `?` (`/products?maxPrice=50`), bound with `@QueryParam`. Path param *identifies*; query param *filters*.

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

*What just happened:* in `getOne`, `{id}` lines up with `@PathParam("id") Long id` - Quarkus pulls `2` from `/products/2` and converts it. In `list`, `@QueryParam("maxPrice")` is `null` when the client omits it, so we return everything. (`service` moves into a CDI bean in [Phase 4](04-cdi-with-arc.md).)

```bash
curl http://localhost:8080/products/2
curl "http://localhost:8080/products?maxPrice=60"
```

```console
{"id":2,"name":"USB-C Hub","price":49.50}

[{"id":2,"name":"USB-C Hub","price":49.50}]
```

## Request bodies and JSON

To *create* a product the client sends JSON in the body - and here's the first genuinely Quarkus-flavored step: **JSON binding isn't on by default. You add it with an extension.**

⚠️ Write a `@POST` taking a `Product` body before adding a JSON extension and it won't deserialize - Quarkus doesn't ship Jackson in the core. Add **`quarkus-rest-jackson`**:

```bash
quarkus extension add quarkus-rest-jackson
```

*What just happened:* that edited your build file to include the extension; dev mode picked it up on the next request. From here, JSON binds both in and out - the earlier `@GET`s also rely on this extension being present.

Now the create endpoint. To report **201 Created** instead of the default 200, return a `RestResponse<Product>`:

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

*What just happened:* the unannotated `Product product` parameter *is* the request body - `@Consumes(APPLICATION_JSON)` deserializes it before your code runs. `RestResponse<Product>` is Quarkus REST's type-safe wrapper over the classic JAX-RS `Response` (either works); returning a bare `Product` would always yield 200.

```json
{
  "name": "Laptop Stand",
  "price": 39.95
}
```

*What just happened:* the client posts a product with no `id` - the server assigns it. The extension binds `name`/`price` onto a `Product` before `create` runs, then serializes the saved product back out.

## Extensions - the Quarkus way to add features

You just used an extension to add JSON - worth pausing on what one actually is, since it's how you'll add every capability from here on.

📝 An **extension** is a Quarkus-aware module - `quarkus-rest-jackson` for JSON, `quarkus-hibernate-orm-panache` for persistence, `quarkus-jdbc-postgresql` for a driver, dozens more:

```bash
quarkus extension add quarkus-hibernate-orm-panache quarkus-jdbc-postgresql
```

*What just happened:* both capabilities added in one go, each wiring itself into the build with sensible defaults.

💡 Why an *extension* and not a plain dependency? An extension hooks into Quarkus's **build-time processing** (Phase 1's idea) - it contributes a build step that does scanning, reflection registration, and wiring *while compiling*, so startup stays instant and the feature still works in a native image ([Phase 9](09-native-compilation.md)), where runtime reflection isn't available. Each feature pays its setup cost once, at build time, instead of on every boot.

## Imperative vs reactive (a preview)

Every handler above returned a value *directly* - the **imperative** style: the method blocks until it has the answer and returns it. Quarkus REST also lets a handler return a **reactive** type - a `Uni<Product>` (a promise) or `Multi<Product>` (a stream) - which hands the request's thread back while waiting on I/O, then resumes when data is ready. Both styles run on the same stack; you mix them per endpoint. [Phase 7](07-reactive-with-mutiny.md) covers `Uni`/`Multi` properly - for now, just know the door exists.

💡 Whichever style you pick: **keep the resource thin.** A handler reads the request, hands the real work to a CDI bean ([Phase 4](04-cdi-with-arc.md)) backed by Panache ([Phase 5](05-persistence-with-panache.md)), and shapes the response. That separation is what lets you swap imperative for reactive without touching the doorway.

## Recap

1. **It's standard JAX-RS, build-time optimized.** Quarkus REST (RESTEasy Reactive) runs the same
   `@Path`/`@GET`/`@POST`/`@Produces` annotations you'd write on any Jakarta server - but does the wiring
   at compile time, which is what makes startup nearly instant.
2. **Path params identify, query params filter.** `@PathParam` binds `{id}` from the path (one specific
   product); `@QueryParam` binds `?maxPrice=...` and is `null` when the client omits it.
3. **JSON comes from the `quarkus-rest-jackson` extension.** Add it, and the engine deserializes the
   unannotated `@POST` body into a Java object and serializes return values back to JSON.
4. **`RestResponse` controls status and headers.** Return a bare object for the default 200, or a
   `RestResponse<Product>` for 201 Created and other correct status codes (the classic `Response` works too).
5. **Extensions are how you add features.** An extension is a build-time-aware module added with
   `quarkus extension add`; it hooks Quarkus's build-time processing, which is why features stay fast and
   work in native images.
6. **Imperative or reactive, same stack.** A handler can return a plain `Product` or a `Uni<Product>` - 
   both work; reactive comes in [Phase 7](07-reactive-with-mutiny.md). Keep the resource thin and push
   logic into a CDI bean.

## Quick check

Make sure the Quarkus-flavored bits stuck:

```quiz
[
  {
    "q": "Your @POST endpoint takes a Product body, but the incoming JSON isn't being deserialized into the object. What's the most likely cause?",
    "choices": [
      "The quarkus-rest-jackson extension isn't added - Quarkus doesn't ship JSON binding in the core, you turn it on with an extension",
      "JAX-RS annotations don't work in Quarkus; you need Quarkus-specific ones",
      "@POST methods can't accept a request body",
      "You must annotate the body parameter with @QueryParam"
    ],
    "answer": 0,
    "explain": "JSON binding is a capability you add via an extension. Without quarkus-rest-jackson, the engine has no JSON mapper, so the body won't deserialize. The annotations are standard JAX-RS, and the unannotated parameter IS the body - adding the extension is what's missing."
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
    "explain": "An extension contributes a build step that moves scanning, reflection registration, and wiring to compile time - the core Quarkus idea. That keeps boot nearly instant and makes the feature survive native compilation, where runtime reflection isn't available."
  },
  {
    "q": "Your create endpoint returns a plain Product and clients always get HTTP 200, even though a resource was created. How do you report 201 Created?",
    "choices": [
      "Return a RestResponse<Product>, e.g. RestResponse.status(RestResponse.Status.CREATED, saved), which carries the status alongside the body",
      "Add @POST(status = 201) to the method",
      "Throw an exception after saving so the server picks a different code",
      "Nothing can change it - Quarkus REST methods only return 200"
    ],
    "answer": 0,
    "explain": "Returning a bare object gives the default 200. To set the status (and headers), return a RestResponse - RestResponse.status(Status.CREATED, saved) reports 201 Created with the body. The classic JAX-RS Response works the same way."
  }
]
```

---

[← Phase 2: Dev Mode & the Developer Experience](02-dev-mode-and-dx.md) · [Guide overview](_guide.md) · [Phase 4: CDI in Quarkus (ArC) →](04-cdi-with-arc.md)
