---
title: "Testing Quarkus Apps"
guide: "quarkus-from-zero"
phase: 8
summary: "@QuarkusTest boots a real app fast enough to lean on, REST Assured asserts the HTTP contract, Dev Services hands tests a real database, and @QuarkusIntegrationTest runs the suite against the native binary."
tags: [quarkus, testing, quarkustest, rest-assured, continuous-testing, dev-services, test-profiles]
difficulty: intermediate
synonyms: ["quarkus testing tutorial", "@QuarkusTest", "quarkus rest-assured", "quarkus continuous testing", "quarkus test dev services", "quarkus integration test native", "quarkus mock bean"]
updated: 2026-06-22
---

# Testing Quarkus Apps

In the Spring world, testing forces a constant economic choice (see [Testing Spring Boot Apps](/guides/spring-boot-from-zero)): boot the whole app for confidence but pay in seconds, or boot a thin slice to stay fast. That tension exists because a classic JVM app is *expensive to start*. Here's the mental model that reframes everything in this phase: **Quarkus moved that startup cost to build time ([Phase 1](01-what-quarkus-is.md)), so booting a real app in a test is cheap - which means you can lean on real, end-to-end tests far more than you're used to.**

The whole reason slice tests exist is to dodge a slow boot. When the boot is fast, a lot of that ceremony melts away. You'll still write plain unit tests for pure logic - but the default in Quarkus is to boot the genuine application and exercise the real wiring, because doing so costs you almost nothing.

We'll walk four things: `@QuarkusTest` (boot the real app), REST Assured (test the HTTP contract), Dev Services in tests (a real database, free), and then native testing for CI.

## `@QuarkusTest` - boot the real app, cheaply

📝 `@QuarkusTest` starts a **real Quarkus application** for your test class - the same app, wired the same way, beans and all. Because the app boots in milliseconds, this isn't the heavyweight "integration test" tax you'd brace for elsewhere; it's the *normal* way to test in Quarkus. You inject the real beans with `@Inject` and exercise the real wiring. (For the broader where-does-this-test-sit picture, [Unit, Integration & E2E](/guides/unit-integration-e2e) is the companion read.)

Here's a `@QuarkusTest` exercising the `ProductService`:

```java
package org.acme;

import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.*;

@QuarkusTest
class ProductServiceTest {

    @Inject
    ProductService products;          // the REAL bean, wired by Quarkus

    @Test
    void rejectsDuplicateSku() {
        products.create(new Product("Widget", "SKU-1", 9_99));

        assertThatThrownBy(() ->
            products.create(new Product("Widget Clone", "SKU-1", 9_99)))
            .isInstanceOf(DuplicateSkuException.class);
    }
}
```

*What just happened:* `@QuarkusTest` booted the actual application context, and `@Inject ProductService` handed you the genuine, fully-wired bean - not a hand-constructed object, not a mock. You then exercised the real duplicate-SKU rule against the real service. In a classic JVM framework you'd think twice before booting the whole app for one rule like this; in Quarkus the boot is fast enough that this *is* the comfortable default. The same machinery that makes Quarkus cheap to run in production makes it cheap to test.

## Testing endpoints with REST Assured

The service test never touched HTTP. But the endpoint has its own contract - status codes, JSON shape - and Quarkus ships the perfect tool for asserting it.

📝 **REST Assured** is a fluent HTTP-testing library bundled into the Quarkus test setup. It reads almost like a sentence: `given()` (set up the request), `when()` (fire it), `then()` (assert the response). Combined with `@QuarkusTest`, it sends *real* HTTP requests at your running app and lets you assert on status and the JSON body.

```java
package org.acme;

import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

@QuarkusTest
class ProductResourceTest {

    @Test
    void listReturnsProducts() {
        given()
          .when().get("/products")
          .then()
             .statusCode(200)
             .body("$", not(empty()));        // the JSON array isn't empty
    }

    @Test
    void getByIdReturnsTheProduct() {
        given()
          .when().get("/products/1")
          .then()
             .statusCode(200)
             .body("sku", is("SKU-1"))
             .body("name", is("Widget"));
    }
}
```

*What just happened:* with the app booted by `@QuarkusTest`, REST Assured fired genuine `GET` requests at `/products` and `/products/1`. The first asserts a `200` and that the returned JSON array has contents; the second digs into the JSON body (`body("sku", ...)`) to confirm the serialized fields match. This is the endpoint's contract, tested over real HTTP - no mocked controller, no fake request pipeline. What the client sees is exactly what the test checks.

💡 REST Assured's `body(path, matcher)` uses a GPath/JSONPath-style expression, so you can reach deep into nested JSON without deserializing it yourself. It's the fastest way to pin down "the API returns *this* shape."

## Dev Services in tests: a real database, zero config

Both tests above quietly assumed the app could start - including its database. So where did the database come from? You didn't configure one. The answer is the same magic you met in dev mode.

💡 **Dev Services runs in tests too.** Recall from [Phase 2](02-dev-mode-and-dx.md) that when an extension needs a service you haven't configured, Quarkus auto-starts a throwaway container for it. That behavior covers the `%test` profile as well: a test that hits Postgres gets a *real* Postgres, spun up in a container, wired in automatically, and torn down when the suite finishes. You get production-engine confidence with none of the manual setup - no `@Container` field, no datasource URLs, no "install Postgres first" wiki page.

```console
INFO  Dev Services for default datasource (postgresql) started
INFO  Container postgres:16 is starting...
INFO  Profile test activated.
INFO  ProductResourceTest > listReturnsProducts() PASSED
```

*What just happened:* before the test class ran, Quarkus saw the Postgres extension with no test datasource configured and started a throwaway `postgres:16` container, exactly as it does in dev. Your `@QuarkusTest` then ran against that real database and the container vanished afterward. Think about what this collapses: in the Spring world the equivalent confidence needs Testcontainers wired up by hand with `@Container` and `@DynamicPropertySource`; here it's the default, and you wrote zero lines for it. ⚠️ Like in dev, this needs a container runtime (Docker or Podman) on the machine running the tests - including your CI runner.

## Continuous testing, profiles, and mocking a bean

A few smaller tools round out the picture. Keep these in your back pocket.

**Continuous testing** - you already met it in [Phase 2](02-dev-mode-and-dx.md): with `quarkus dev` running, press `r` and Quarkus re-runs only the tests affected by each change, live in the terminal. The tests you're writing here are exactly what that loop runs. You get red/green feedback seconds after a save, without leaving the editor.

**Test profiles** - when a test needs different config than dev or prod, two tools handle it. Anything under the `%test` profile in `application.properties` applies only when tests run, and `@TestProfile` lets a specific class override config or swap beans for its scope.

```properties
# application.properties - only active while tests run
%test.product.featured-limit=3
%test.quarkus.log.level=WARN
```

*What just happened:* the `%test.` prefix scopes these properties to the test profile, so tests see a `featured-limit` of `3` and quieter logging while dev and prod keep their own values. It's the Quarkus equivalent of a test-only config file - no separate file needed, just a prefix.

💡 When you genuinely need to isolate one bean - say, a service that calls a paid external API you don't want hit in tests - use `@InjectMock` to replace just that bean with a Mockito mock while the rest of the app stays real:

```java
@QuarkusTest
class ProductResourceMockTest {

    @InjectMock
    PricingClient pricing;            // this ONE bean becomes a mock

    @Test
    void usesQuotedPrice() {
        when(pricing.quote("SKU-1")).thenReturn(1_299);
        // ... the rest of the app is real; only PricingClient is faked ...
    }
}
```

*What just happened:* `@InjectMock` told Quarkus to put a Mockito mock of `PricingClient` into the running application context in place of the real one. Everything else - the resource, the service, the database via Dev Services - stays genuine; you've faked exactly the seam you needed to control. That's surgical isolation without dropping the real-app boot.

## Native testing and CI

There's one class of bug a JVM test can never catch, and it's worth naming.

📝 In [Phase 9](09-native-compilation.md) you'll compile the app to a **native executable** with GraalVM. Native compilation does aggressive ahead-of-time analysis, and it can break things that work fine on the JVM - most commonly **reflection**: code that inspects classes at runtime may find them stripped from the native image. `@QuarkusIntegrationTest` exists to catch exactly this. Point it at a test class and it runs that suite against the *actual built artifact* - the native executable (or the runnable JAR) - instead of an in-process JVM app.

```java
package org.acme;

import io.quarkus.test.junit.QuarkusIntegrationTest;

@QuarkusIntegrationTest          // runs ProductResourceTest against the NATIVE binary
class ProductResourceIT extends ProductResourceTest {
}
```

*What just happened:* `ProductResourceIT` inherits every test from the JVM `ProductResourceTest`, but `@QuarkusIntegrationTest` changes *what they run against*. Instead of booting an in-process app, it launches the packaged artifact - the native executable when you build with `-Dnative` - and fires the same REST Assured requests at it over real HTTP. If a serialization path relied on reflection that the native build stripped away, this test goes red where the JVM test stayed green. (The `IT` suffix is the Maven Failsafe convention for integration tests; they run in a separate `verify` phase, not with the regular unit tests.)

⚠️ **Native tests are slow** - building the native image alone can take minutes. Don't run them on every dev-loop save; that's what fast `@QuarkusTest` is for. Run native tests in **CI** instead, as a gate before release (see [Testing in CI](/guides/testing-in-ci)). The everyday inner loop stays JVM-fast; the native check runs where slowness doesn't hurt your flow.

💡 Step back and see the through-line: Quarkus's fast boot makes integration testing cheap enough to *prefer*. Where other stacks push you toward mocks and slices to dodge a slow startup, here the real app, a real database, and real HTTP are the comfortable default - and you reserve the genuinely expensive test, the native one, for CI. Fast boot isn't only a production story; it quietly reshapes how you test.

## Recap

1. **`@QuarkusTest` boots the real app - and that's cheap.** Build-time work means a real, fully-wired app starts in milliseconds, so booting it for a test is the normal default, not a heavyweight last resort. Inject real beans with `@Inject`.
2. **REST Assured tests the HTTP contract.** The bundled `given().when().get(...).then().statusCode(...).body(...)` library fires real requests and asserts status plus JSON shape - the endpoint's contract, over real HTTP.
3. **Dev Services runs in tests too.** A test that needs Postgres gets a real, throwaway Postgres container with zero config - production-engine confidence for free. ⚠️ Needs Docker/Podman, including on CI.
4. **Profiles and `@InjectMock` for the edge cases.** `%test` config and `@TestProfile` scope settings to tests; `@InjectMock` swaps one bean for a Mockito mock while the rest of the app stays real. Continuous testing (Phase 2, press `r`) reruns affected tests live.
5. **`@QuarkusIntegrationTest` runs the suite against the native binary.** It catches native-only bugs (reflection!) that JVM tests can't. ⚠️ Slow - run it in CI, not every dev loop. 💡 Fast boot makes leaning on real integration tests cheap enough to be the default.

## Quick check

Make sure the "real app is cheap to test" model - and when to reach for each tool - actually stuck:

```quiz
[
  {
    "q": "Why is booting the real app with @QuarkusTest considered cheap in Quarkus, unlike classic JVM integration tests?",
    "choices": [
      "Quarkus moved startup work to build time, so the real app boots in milliseconds",
      "@QuarkusTest secretly mocks every bean so nothing really starts",
      "Quarkus only runs one test per JVM to amortize the cost",
      "It skips wiring the beans, so there's nothing to boot"
    ],
    "answer": 0,
    "explain": "Quarkus does heavy lifting at build time (Phase 1), so a real, fully-wired application starts in milliseconds. That cheap boot is exactly why booting the genuine app for a test is the comfortable default in Quarkus rather than an expensive last resort."
  },
  {
    "q": "Your @QuarkusTest hits an endpoint that reads from Postgres, but you never configured a datasource for tests. What happens?",
    "choices": [
      "The test fails because there's no database connection",
      "Dev Services starts a throwaway Postgres container for the test profile and wires the app to it",
      "Quarkus falls back to an in-memory map and ignores Postgres",
      "You must add a @Container field and a datasource URL by hand first"
    ],
    "answer": 1,
    "explain": "Dev Services applies to the %test profile too: when an extension needs a service you haven't configured, Quarkus auto-starts a throwaway container (real Postgres) and wires it in, then tears it down after the suite. It needs a container runtime like Docker or Podman, including on CI."
  },
  {
    "q": "What does @QuarkusIntegrationTest give you that a regular @QuarkusTest cannot, and when should you run it?",
    "choices": [
      "It runs the suite against the actual built artifact (e.g. the native executable) to catch native-only bugs like reflection failures; run it in CI because it's slow",
      "It runs the tests faster than @QuarkusTest, so use it for the everyday dev loop",
      "It mocks the database automatically so no container is needed",
      "It is identical to @QuarkusTest but with a different annotation name"
    ],
    "answer": 0,
    "explain": "@QuarkusIntegrationTest runs the suite against the packaged artifact - the native executable when built with -Dnative - instead of an in-process JVM app, so it catches native-only bugs (commonly reflection issues) that JVM tests miss. Because building the native image is slow, you run it in CI as a release gate, not on every dev-loop save."
  }
]
```

---

[← Phase 7: Reactive Quarkus with Mutiny](07-reactive-with-mutiny.md) · [Guide overview](_guide.md) · [Phase 9: Native Compilation & Containers →](09-native-compilation.md)