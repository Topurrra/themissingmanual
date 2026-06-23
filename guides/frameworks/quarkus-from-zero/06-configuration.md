---
title: "Configuration"
guide: "quarkus-from-zero"
phase: 6
summary: "How Quarkus externalizes config with MicroProfile: application.properties, @ConfigProperty, type-safe @ConfigMapping, dev/test/prod profiles, source precedence, and the build-time vs runtime trap unique to Quarkus."
tags: [quarkus, configuration, microprofile-config, application-properties, profiles, config-mapping, env-vars]
difficulty: intermediate
synonyms: ["quarkus configuration", "quarkus application.properties", "microprofile config", "quarkus @ConfigProperty", "quarkus @ConfigMapping", "quarkus profiles dev prod test", "quarkus config environment variables"]
updated: 2026-06-22
---

# Configuration

In [Phase 5](05-persistence-with-panache.md) you gave `Product` a database, and the last snippet snuck in a line you didn't fully unpack: `quarkus.datasource.password=${DB_PASSWORD}`. That `${...}` is config injection, and this phase is where it gets explained properly.

The mental model is the same one from the Spring world ([/guides/spring-boot-from-zero](/guides/spring-boot-from-zero) covers it for that stack): **configuration is how one build of your app adapts to many environments without recompiling.** You ship a single artifact — the same jar, the same native binary — and feed it different values depending on whether it lands on your laptop, a test runner, or production. Quarkus has one extra wrinkle that Spring doesn't, and it bites people who don't know it's there. We'll get to that at the end.

## `application.properties` and MicroProfile Config

📝 Quarkus config isn't a bespoke Quarkus invention — it's built on **MicroProfile Config**, a standard with a defined API (`@ConfigProperty`, `Config`) and a defined ordering rule. Quarkus implements that standard (via an engine called SmallRye) and extends it. The practical upshot: one config file drives *both* Quarkus's own machinery and your application's settings, side by side.

That file is `src/main/resources/application.properties`:

```properties
# Quarkus's own settings — the quarkus.* namespace
quarkus.http.port=8081
quarkus.log.level=INFO

# Your application's settings — any namespace you like
catalog.currency=USD
catalog.max-page-size=50
```

*What just happened:* The `quarkus.*` keys configure the framework — `quarkus.http.port` tells the embedded server to listen on 8081 instead of the default 8080, and `quarkus.log.level` sets the root log level. The `catalog.*` keys are *yours*; Quarkus doesn't know or care what they mean, it just makes them available to your code. There's no separate "framework config" and "app config" file — it's one flat list of dotted keys, and the namespace prefix is the only thing distinguishing Quarkus's keys from yours.

💡 Quarkus also accepts YAML if you add the `quarkus-config-yaml` extension and use `application.yaml`. The nested form reads better once you have dozens of keys, but everything below works identically either way — we'll stick with `.properties` since it's the default and what you'll see most.

## Injecting a single value with `@ConfigProperty`

A config file is dead weight until your code can read it. The most direct way in is `@ConfigProperty` — the MicroProfile annotation that injects one value by its key into a CDI bean (recall beans and `@Inject` from [Phase 4](04-cdi-with-arc.md)):

```java
package org.acme.catalog;

import org.eclipse.microprofile.config.inject.ConfigProperty;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class PricingService {

    @ConfigProperty(name = "catalog.currency", defaultValue = "USD")
    String currency;

    public String label(Product p) {
        return p.price + " " + currency;
    }
}
```

*What just happened:* `@ConfigProperty(name = "catalog.currency")` tells Quarkus "find the `catalog.currency` key and inject its value into this field" when the bean is created. The `defaultValue = "USD"` is the safety net: if the key is *missing* from every config source, you get `"USD"` instead of a startup failure. Leave the default off and a missing required key fails loudly at boot — which is often what you want, so a misconfigured deployment never starts rather than limping along. Change the file, restart, and `currency` changes with no code edit.

⚠️ The injected *type* is checked, too. Declare the field as `int max;` for `catalog.max-page-size` and Quarkus converts the string `"50"` to an `int` for you — but a non-numeric value fails at startup with a clear conversion error, not three layers deep in a request. That's the standard's type conversion doing its job.

## Type-safe config groups: `@ConfigMapping`

`@ConfigProperty` is great for the odd one-off. But the moment you have a *group* of related settings, scattering individual `@ConfigProperty` fields around gets messy and easy to typo. 📝 The recommended, type-safe answer is **`@ConfigMapping`**: you declare an interface whose methods mirror a block of keys, and Quarkus binds the whole group into one typed object. It's the direct counterpart to Spring's `@ConfigurationProperties`.

```java
package org.acme.catalog;

import io.smallrye.config.ConfigMapping;
import io.smallrye.config.WithDefault;

@ConfigMapping(prefix = "catalog")
public interface CatalogConfig {

    String currency();                 // binds catalog.currency

    @WithDefault("50")
    int maxPageSize();                 // binds catalog.max-page-size

    boolean featuredEnabled();         // binds catalog.featured-enabled
}
```

Bound to these properties:

```properties
catalog.currency=USD
catalog.max-page-size=50
catalog.featured-enabled=true
```

*What just happened:* `@ConfigMapping(prefix = "catalog")` says "take everything under `catalog.` and map it onto this interface's methods by name." The method `maxPageSize()` binds to `catalog.max-page-size` — Quarkus translates the camelCase method name to the kebab-case key automatically. `@WithDefault("50")` supplies a fallback the way `defaultValue` did for `@ConfigProperty`. You don't write an implementation; Quarkus generates one at build time. Then you inject `CatalogConfig` like any bean and call `config.maxPageSize()`, getting a real `int`, with IDE autocomplete and compile-time method names instead of stringly-typed keys.

💡 **Prefer `@ConfigMapping` for anything beyond a single value.** You get one typed object instead of a fistful of `@ConfigProperty` strings, type checking, autocomplete on the methods, and a single interface that *documents* exactly what your component can be configured with. Reach for `@ConfigProperty` only for the genuine one-off.

## Profiles and precedence

Overriding settings one at a time is fine for a value or two. But environments differ in *many* ways at once — dev wants chatty logs and a throwaway database, prod wants quiet logs and a real one. 📝 Quarkus has **built-in profiles** for exactly this: `dev`, `test`, and `prod`. And the neat part — unlike Spring's separate per-profile files, Quarkus lets you keep profile-specific values *in the same file* using a `%profile.` prefix:

```properties
# Applies to every profile (the base)
quarkus.log.level=INFO
catalog.currency=USD

# Only when the dev profile is active
%dev.quarkus.log.level=DEBUG
%dev.catalog.currency=USD

# Only when the prod profile is active
%prod.quarkus.log.level=WARN
%prod.quarkus.datasource.jdbc.url=jdbc:postgresql://db.internal:5432/catalog
```

*What just happened:* Lines with no prefix apply everywhere. `%dev.quarkus.log.level=DEBUG` only takes effect when the `dev` profile is active, overriding the unprefixed `INFO`; `%prod.quarkus.log.level=WARN` does the same for prod. You don't activate these by hand for everyday work: `quarkus dev` runs the `dev` profile automatically, `@QuarkusTest` runs `test`, and a packaged build runs `prod`. One file, three environments, no copy-paste drift.

📝 Profiles are only half the story. Quarkus reads config from *several sources* and layers them, with higher sources **overriding** lower ones. Roughly, lowest to highest priority:

1. `@WithDefault` / `defaultValue` baked into your code
2. `application.properties` (packaged in the artifact)
3. OS **environment variables**
4. **System properties** (`-Dkey=value`)

A setting from a higher layer wins over the same setting from a lower one. *That* single rule is what makes the single-artifact dream work: ship `application.properties` with sensible defaults, then override the few values that differ per deployment from the outside — no rebuild.

```bash
# The file says port 8081, but this env var wins
QUARKUS_HTTP_PORT=9000 java -jar target/quarkus-app/quarkus-run.jar
```

*What just happened:* The file's `quarkus.http.port=8081` sits at layer 2; the environment variable sits at layer 3, so the app boots on 9000. This is the everyday way config reaches a containerized app — the image holds the artifact with its defaults, and the deployment platform injects the overrides.

⚠️ **Watch the env-var naming.** Environment variables can't contain dots, so MicroProfile maps them: uppercase the key and replace every dot and dash with an underscore. `quarkus.datasource.password` becomes `QUARKUS_DATASOURCE_PASSWORD`; `catalog.max-page-size` becomes `CATALOG_MAX_PAGE_SIZE`. Get the translation wrong and your override silently does nothing — the app keeps the file value and you lose an afternoon wondering why. For the broader why-and-how of environment-based config, see [/guides/env-vars-and-config](/guides/env-vars-and-config).

## Build-time vs runtime config: the Quarkus gotcha

Here's the wrinkle that exists in Quarkus and *not* in Spring — the one that catches everyone exactly once. ⚠️ **Some Quarkus config is fixed at BUILD time and cannot be changed at runtime.** Most of your config is runtime (the port, the database URL, your `catalog.*` values), but a specific subset is locked the moment you build the artifact.

Why? Recall from [Phase 1](01-what-quarkus-is.md) that Quarkus does aggressive **build-time processing** — it scans your code, wires beans, and pre-computes as much as possible during the build so startup is near-instant and the app fits a native binary. To do that pre-computation, Quarkus has to *read certain config at build time*. A value it baked into the build can't then be swapped out when the process later starts — the optimization already happened.

The classic example is the database *kind*:

```properties
# BUILD-TIME — fixed when you build. Changing the env var at runtime does nothing.
quarkus.datasource.db-kind=postgresql

# RUNTIME — read at startup. Override freely per environment.
quarkus.datasource.jdbc.url=jdbc:postgresql://db.internal:5432/catalog
quarkus.datasource.username=catalog
quarkus.datasource.password=${DB_PASSWORD}
```

*What just happened:* `db-kind` is build-time because Quarkus uses it during the build to decide *which JDBC driver and Hibernate dialect to include in the artifact at all* — that's a packaging decision, not a runtime one, so setting `QUARKUS_DATASOURCE_DB_KIND` at startup is ignored. The `jdbc.url`, `username`, and `password` are runtime: they're just read on startup, so you override them per environment exactly as you'd expect. How do you tell which is which? The Quarkus config reference marks build-time keys with a lock icon, and if you try to override one at runtime, Quarkus logs a warning telling you the value was fixed at build. When a `quarkus.*` override "isn't taking," build-time config is the first thing to suspect.

💡 And the same secrets rule from every config guide applies here, sharpened by precedence: the `password=${DB_PASSWORD}` above keeps the real secret *out of the file* — it resolves from the environment at startup, so nothing sensitive lands in git. Never commit passwords, API keys, or signing keys to `application.properties`; anything in your repo is effectively public forever, even after you delete it. For rotation, vaults, and managed secret stores, see [/guides/secrets-management](/guides/secrets-management).

## Recap

1. 📝 Quarkus config is built on the **MicroProfile Config** standard. One `application.properties` drives both Quarkus's own `quarkus.*` settings and your app's keys, with type-checked conversion built in.
2. **`@ConfigProperty(name=..., defaultValue=...)`** injects a single value into a bean; a missing required key fails at startup, which is usually what you want.
3. **`@ConfigMapping`** binds a whole prefixed group into a typed interface — type-safe, autocomplete-friendly, self-documenting. Prefer it for anything beyond one value (it's Quarkus's `@ConfigurationProperties`).
4. Built-in **profiles** (`%dev.`, `%test.`, `%prod.`) live in the *same* file; `quarkus dev`/`@QuarkusTest`/packaged builds pick them automatically. Sources **layer** (defaults < file < env vars < system props), so env vars override for deployment — mind the `QUARKUS_DATASOURCE_PASSWORD` ↔ `quarkus.datasource.password` naming.
5. ⚠️ The Quarkus-specific trap: **some config is fixed at BUILD time** (because of build-time optimization) and can't be changed at runtime — like `quarkus.datasource.db-kind`. Most app config is runtime; the docs mark build-time keys, and Quarkus warns when you try to override one.
6. 💡 **Never commit secrets.** Use a `${PLACEHOLDER}` and supply the value from an environment variable or secrets manager. One artifact, many environments — driven by inputs, not recompiles.

## Quick check

The three ideas worth keeping before you go reactive in the next phase:

```quiz
[
  {
    "q": "Your application.properties has quarkus.http.port=8081, but you launch with the environment variable QUARKUS_HTTP_PORT=9000. What port does the app use, and why?",
    "choices": [
      "9000 — environment variables sit higher in the source precedence order than application.properties, so they override it",
      "8081 — the packaged file is always authoritative once the app is built",
      "It fails to start because two sources set the same key",
      "Whichever was set first wins, so 8081"
    ],
    "answer": 0,
    "explain": "MicroProfile layers config sources with higher ones overriding lower: defaults < application.properties < env vars < system properties. The env var sits above the file, so the app boots on 9000 — which is exactly how one artifact runs in many environments."
  },
  {
    "q": "Why is @ConfigMapping usually preferred over @ConfigProperty for a group of related settings?",
    "choices": [
      "It binds a whole prefixed block into one typed interface — type-safe, autocomplete-friendly, and a single documented place for those settings",
      "It is the only way to read config at all in Quarkus",
      "It makes the application start faster",
      "It encrypts the values automatically"
    ],
    "answer": 0,
    "explain": "@ConfigProperty injects single values one at a time. @ConfigMapping maps a whole prefix onto a typed interface, giving you type checking, autocomplete on the methods, and one interface that documents what's configurable — Quarkus's equivalent of Spring's @ConfigurationProperties."
  },
  {
    "q": "You set QUARKUS_DATASOURCE_DB_KIND at runtime to switch databases, but Quarkus ignores it. What's going on?",
    "choices": [
      "db-kind is build-time config — Quarkus reads it during the build to bake in the right driver, so it can't be changed when the process starts",
      "The environment variable name is wrong; it should have dots, not underscores",
      "Datasource config can never be set from environment variables",
      "Quarkus only reads db-kind from a YAML file, never properties"
    ],
    "answer": 0,
    "explain": "Because of Quarkus's build-time optimization, a subset of config (like quarkus.datasource.db-kind) is fixed when you build the artifact and cannot be changed at runtime. The driver and dialect were chosen during the build, so a runtime override is ignored — Quarkus even logs a warning. Runtime keys like the jdbc.url override fine."
  }
]
```

---

[← Phase 5: Persistence: Hibernate with Panache](05-persistence-with-panache.md) · [Guide overview](_guide.md) · [Phase 7: Reactive Quarkus with Mutiny →](07-reactive-with-mutiny.md)