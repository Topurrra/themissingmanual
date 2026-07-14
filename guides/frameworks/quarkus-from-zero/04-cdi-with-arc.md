---
title: "CDI in Quarkus (ArC)"
guide: "quarkus-from-zero"
phase: 4
summary: "Quarkus's DI container is ArC: the same CDI standard - @Inject, @ApplicationScoped - but the wiring graph is computed at build time, which is what makes fast boot and native images possible."
tags: [quarkus, cdi, arc, dependency-injection, build-time, inject, scopes]
difficulty: intermediate
synonyms: ["quarkus cdi arc", "quarkus dependency injection", "quarkus @Inject", "quarkus build time di", "quarkus bean scopes", "arc quarkus container", "quarkus vs spring di"]
updated: 2026-07-10
---

# CDI in Quarkus (ArC)

Phase 3's JAX-RS resource quietly relied on something glossed over: when you wrote `@Inject ProductService`, *somebody* created the service and handed it to the resource. This phase is that somebody - Quarkus's dependency-injection container - and the one thing it does differently from every container you've used before.

**It's the same CDI you already know, but the wiring is figured out while your code compiles, not when it starts.** A traditional container wakes up at startup, scans your classes, reads annotations via reflection, builds the "who needs what" graph, and *then* serves requests. Quarkus does almost all of that at **build time** - the graph is baked in before the app ever runs. Same annotations, same programming model, different timing - the build-time-over-runtime idea from Phase 1, applied to DI.

📝 If you've done [CDI in Jakarta EE](/guides/jakarta-ee-from-zero), you already know the programming model - `@Inject`, `@ApplicationScoped`, qualifiers, producers. This phase shows Quarkus's twist on it rather than re-teaching CDI from scratch.

## It's CDI, wired at build time

📝 Quarkus's DI container is **ArC** - a build-time implementation of **CDI**. No new API: the exact same `jakarta.inject` and `jakarta.enterprise.context` annotations. The difference is *when* the wiring happens.

```java
import jakarta.enterprise.context.ApplicationScoped;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@ApplicationScoped
public class ProductService {
    private final Map<Long, Product> store = new ConcurrentHashMap<>();

    public List<Product> all()        { return List.copyOf(store.values()); }
    public Product find(long id)      { return store.get(id); }
    public void save(Product p)       { store.put(p.id(), p); }
}
```
*What just happened:* `@ApplicationScoped` is the standard CDI bean-defining annotation - one instance for the whole app. Identical to Jakarta EE; ArC just notices it at compile time instead of startup.

```java
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import java.util.List;

@Path("/products")
public class ProductResource {
    @Inject
    ProductService service;

    @GET
    public List<Product> list() {
        return service.all();
    }
}
```
*What just happened:* `@Inject` says "container, fill this in." ArC finds the `@ApplicationScoped` bean and records the connection. The field isn't `private` - ArC's generated injection code needs to write to it directly, avoiding reflection.

💡 Field injection is compact, which is why you see it everywhere in examples. Constructor injection is still the better habit - more below.

## Why build-time DI is a big deal

💡 A runtime container's startup cost is dominated by **scanning the classpath** and **reflection** to construct beans - both happen every boot. ArC does that once, at build time, and emits plain generated code that wires everything directly. At runtime there's almost nothing left to do - a big slice of why Quarkus boots in tens of milliseconds.

The deeper win is **native images**. GraalVM's closed-world model (Phase 9) is hostile to reflection - anything discovered dynamically at runtime is a problem. Build-time DI sidesteps that entirely, because the wiring is settled before the native compiler runs. It's a big part of how Quarkus offers full CDI *and* compiles to native.

⚠️ The flip side is mostly good news: errors a runtime container throws at *startup* (a missing dependency, an ambiguous bean), ArC often catches at *compile time*.

```java
@Path("/products")
public class ProductResource {
    @Inject
    PricingEngine pricing;   // no bean of this type exists anywhere
}
```

```console
[ERROR] Build step ...ArcProcessor#validate threw an exception:
jakarta.enterprise.inject.UnsatisfiedResolutionException:
Unsatisfied dependency for type com.example.PricingEngine and qualifiers [@Default]
  - java member: com.example.ProductResource#pricing
  - declared on CLASS bean [class=com.example.ProductResource]
```
*What just happened:* ArC validated the whole graph at build time and refused to build. Classic Jakarta EE throws the same standard exception, just at deploy/startup instead. (An ambiguous dependency fails the same way; the fix is the standard `@Qualifier`.) Shifting failures left means you find them on your machine, not in prod.

## Beans & scopes

Same CDI scopes as Jakarta EE - a quick recap, not a re-teach. A scope answers: *how long does a bean live*, and *who shares the same instance*.

| Scope | Annotation | One instance per… | Reach for it when |
|-------|------------|-------------------|-------------------|
| Application | `@ApplicationScoped` | the whole application | stateless services & repositories (the common default in Quarkus) |
| Request | `@RequestScoped` | a single HTTP request | per-request state tied to one call |
| Singleton | `@Singleton` | the whole application | like app-scoped, but eager and proxy-free (a micro-optimization; usually prefer `@ApplicationScoped`) |

📝 `@ApplicationScoped` is the workhorse. Full detail on scopes and the proxy machinery lives in the [Jakarta EE CDI phase](/guides/jakarta-ee-from-zero) - it applies here unchanged.

💡 A bonus from build-time analysis: Quarkus **removes unused beans** - since ArC sees the whole graph, it can leave out beans nothing injects, for a smaller, faster-loading app. (Mark an apparently-unused bean `@Unremovable` if you need to keep it - say it's only used reflectively.)

## Constructor injection & the basics

Constructor injection is the better habit, for the same reasons as in Spring and Jakarta EE:

```java
@Path("/products")
public class ProductResource {
    private final ProductService service;

    public ProductResource(ProductService service) {   // ArC passes one in
        this.service = service;
    }

    @GET
    @Path("/{id}")
    public Product byId(@PathParam("id") long id) {
        return service.find(id);
    }
}
```
*What just happened:* a single injectable constructor doesn't even need `@Inject` - ArC treats the sole constructor as the injection point. `service` can be `final`, the constructor is a clear list of dependencies, and you can unit-test with a plain `new ProductResource(fakeService)` - no container needed.

📝 **Qualifiers** (a custom `@Qualifier` to pick between beans of the same type) and **producers** (`@Produces` methods for non-bean objects) work exactly as in standard CDI - see the [Jakarta EE CDI phase](/guides/jakarta-ee-from-zero); ArC resolves it all at build time.

## The Spring bridge (brief)

💡 Coming from Spring? The `quarkus-spring-di` extension lets Spring's DI annotations work directly - `@Autowired`, `@Component`, `@Service`, `@Value` - so you can lift familiar code over:

```java
import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Autowired;

@Component                       // Spring's annotation, understood by Quarkus via quarkus-spring-di
public class ProductService {
    @Autowired
    ProductRepository repository;
}
```
*What just happened:* with the extension present, ArC understands `@Component`/`@Autowired` and wires this bean as if it were CDI - still at build time. It's a **compatibility bridge** for migration, not the idiomatic path.

📝 Idiomatic Quarkus uses **standard CDI** but resolves wiring at build time for speed and native-image friendliness. Learn CDI once and you've learned the wiring model for Quarkus, Jakarta EE, and (via the bridge) much of Spring too - the only thing genuinely different is *when* the magic happens.

## Recap

1. **ArC is build-time CDI.** Quarkus's DI container, ArC, implements the standard CDI spec - same `@Inject`,
   `@ApplicationScoped`, qualifiers, producers - but computes the wiring graph at compile time instead of at
   startup. No new API, just different timing.
2. **Why it matters:** doing scanning and reflection once at build time (not on every boot) is a big reason
   Quarkus starts in milliseconds, and doing DI at build time sidesteps reflection - which is what lets full
   CDI coexist with GraalVM native images.
3. **Errors shift left.** A missing or ambiguous bean that a runtime container would throw at startup, ArC
   often catches at build time - the build fails on your machine instead of the server failing in prod.
4. **Scopes are standard CDI.** `@ApplicationScoped` is the common Quarkus default; `@RequestScoped` for
   per-request state; `@Singleton` as an eager, proxy-free variant. Full detail lives in the Jakarta EE CDI
   phase. Bonus: ArC removes unused beans for a smaller app.
5. **Prefer constructor injection** (testable, `final`, no reflection needed); qualifiers and producers work
   as in standard CDI. For Spring devs, `quarkus-spring-di` bridges `@Autowired`/`@Component` - but idiomatic
   Quarkus uses CDI.

With wiring understood, the next piece slots right in: a real persistence layer. Next we give `Product` a
database with Hibernate and Panache.

## Quick check

Test yourself on the ideas that have to stick from this phase:

```quiz
[
  {
    "q": "What is the key difference between Quarkus's ArC container and a traditional CDI container?",
    "choices": [
      "ArC computes the dependency-injection wiring graph at build time, not at application startup",
      "ArC uses a completely different set of annotations from standard CDI",
      "ArC only supports field injection and forbids constructor injection",
      "ArC runs the application as interpreted bytecode instead of compiled code"
    ],
    "answer": 0,
    "explain": "ArC is a build-time implementation of the standard CDI spec. The annotations (@Inject, @ApplicationScoped, etc.) are identical to Jakarta EE; what changes is that the wiring is resolved at compile time rather than at startup - which is what enables fast boot and native images."
  },
  {
    "q": "You @Inject a type that no bean satisfies. In Quarkus, when do you find out?",
    "choices": [
      "At build time - ArC validates the dependency graph and the build fails",
      "Never - Quarkus silently injects null",
      "Only in production, on the first request that uses the bean",
      "At unit-test time only, never during the build"
    ],
    "answer": 0,
    "explain": "Because ArC analyzes the whole graph at build time, an unsatisfied (or ambiguous) dependency fails the build with the standard exception - earlier than a runtime container would throw it at startup. The failure shifts left to your machine."
  },
  {
    "q": "Why does doing dependency injection at build time help Quarkus compile to a native image?",
    "choices": [
      "It avoids runtime reflection and classpath scanning, which the native closed-world model is hostile to",
      "It makes the application use less disk space at build time",
      "It converts all beans into static methods that need no instances",
      "It disables CDI entirely so there is nothing for the native compiler to analyze"
    ],
    "answer": 0,
    "explain": "GraalVM's closed-world native compilation struggles with reflection and dynamic discovery. By resolving DI at build time and generating plain wiring code, ArC removes the runtime scanning/reflection that would otherwise break native compilation - letting full CDI and native images coexist."
  }
]
```

---

[← Phase 3: Building REST APIs](03-rest-apis.md) · [Guide overview](_guide.md) · [Phase 5: Persistence: Hibernate with Panache →](05-persistence-with-panache.md)
