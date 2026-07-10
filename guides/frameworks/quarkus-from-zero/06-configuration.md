---
title: "Configuration"
guide: "quarkus-from-zero"
phase: 6
summary: "How Quarkus externalizes config with MicroProfile: application.properties, @ConfigProperty, type-safe @ConfigMapping, dev/test/prod profiles, source precedence, and the build-time vs runtime trap unique to Quarkus."
tags: [quarkus, configuration, microprofile-config, application-properties, profiles, config-mapping, env-vars]
difficulty: intermediate
synonyms: ["quarkus configuration", "quarkus application.properties", "microprofile config", "quarkus @ConfigProperty", "quarkus @ConfigMapping", "quarkus profiles dev prod test", "quarkus config environment variables"]
updated: 2026-07-10
---

# Configuration

Phase 5's last snippet snuck in a line you didn't fully unpack: `quarkus.datasource.password=${DB_PASSWORD}`. That `${...}` is config injection, explained properly here.

The mental model is the same as Spring's ([/guides/spring-boot-from-zero](/guides/spring-boot-from-zero)): **configuration is how one build of your app adapts to many environments without recompiling.** You ship a single artifact and feed it different values on your laptop, in test, or in production. Quarkus has one extra wrinkle Spring doesn't - we'll get there at the end.

## `application.properties` and MicroProfile Config

📝 Quarkus config is built on **MicroProfile Config**, a standard with a defined API (`@ConfigProperty`, `Config`) and ordering rule, implemented via an engine called SmallRye. One config file drives *both* Quarkus's own machinery and your application's settings.

```properties
# Quarkus's own settings — the quarkus.* namespace
quarkus.http.port=8081
quarkus.log.level=INFO

# Your application's settings — any namespace you like
catalog.currency=USD
catalog.max-page-size=50
```

*What just happened:* `quarkus.*` keys configure the framework; `catalog.*` keys are yours - Quarkus just makes them available to your code. One flat list of dotted keys; the namespace prefix is the only distinction.

💡 Quarkus also accepts YAML with the `quarkus-config-yaml` extension and `application.yaml` - reads better with dozens of keys, works identically otherwise.

## Injecting a single value with `@ConfigProperty`

`@ConfigProperty` injects one value by key into a CDI bean:

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

*What just happened:* `defaultValue = "USD"` is the safety net - if the key is missing everywhere, you get `"USD"` instead of a startup failure. Leave the default off and a missing required key fails loudly at boot, which is often what you want.

⚠️ The injected *type* is checked too. Declare `int max;` for `catalog.max-page-size` and Quarkus converts `"50"` to an `int` - a non-numeric value fails at startup with a clear error, not three layers into a request.

## Type-safe config groups: `@ConfigMapping`

For a *group* of related settings, scattering `@ConfigProperty` fields gets messy. 📝 **`@ConfigMapping`** binds a whole prefixed block into one typed interface - Quarkus's counterpart to Spring's `@ConfigurationProperties`.

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

```properties
catalog.currency=USD
catalog.max-page-size=50
catalog.featured-enabled=true
```

*What just happened:* `maxPageSize()` binds to `catalog.max-page-size` - Quarkus translates camelCase to kebab-case automatically. You don't write an implementation; Quarkus generates one at build time. Inject `CatalogConfig` like any bean and call `config.maxPageSize()` with autocomplete and compile-time method names.

💡 **Prefer `@ConfigMapping` for anything beyond a single value.** Reach for `@ConfigProperty` only for the genuine one-off.

## Profiles and precedence

📝 Quarkus has built-in profiles - `dev`, `test`, `prod`. Unlike Spring's separate per-profile files, Quarkus keeps profile-specific values *in the same file* using a `%profile.` prefix:

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

*What just happened:* unprefixed lines apply everywhere; `%dev.`/`%prod.` override for that profile. `quarkus dev` runs `dev` automatically, `@QuarkusTest` runs `test`, a packaged build runs `prod` - no manual activation, no copy-paste drift.

📝 Config sources layer, higher overriding lower:

1. `@WithDefault` / `defaultValue` baked into your code
2. `application.properties` (packaged in the artifact)
3. OS **environment variables**
4. **System properties** (`-Dkey=value`)

```bash
# The file says port 8081, but this env var wins
QUARKUS_HTTP_PORT=9000 java -jar target/quarkus-app/quarkus-run.jar
```

*What just happened:* the file's `quarkus.http.port=8081` sits at layer 2, the env var at layer 3, so the app boots on 9000 - the everyday way config reaches a containerized app.

⚠️ **Watch the env-var naming.** Dots can't appear in env var names - uppercase the key and replace dots/dashes with underscores. `quarkus.datasource.password` becomes `QUARKUS_DATASOURCE_PASSWORD`. Get it wrong and your override silently does nothing. See [/guides/env-vars-and-config](/guides/env-vars-and-config).

## Build-time vs runtime config: the Quarkus gotcha

⚠️ **Some Quarkus config is fixed at BUILD time and cannot be changed at runtime.** Most config is runtime, but a subset is locked the moment you build the artifact.

Why? Quarkus does aggressive **build-time processing** (Phase 1) - it has to read certain config at build time to pre-compute wiring. A value baked into the build can't be swapped when the process later starts.

```properties
# BUILD-TIME — fixed when you build. Changing the env var at runtime does nothing.
quarkus.datasource.db-kind=postgresql

# RUNTIME — read at startup. Override freely per environment.
quarkus.datasource.jdbc.url=jdbc:postgresql://db.internal:5432/catalog
quarkus.datasource.username=catalog
quarkus.datasource.password=${DB_PASSWORD}
```

*What just happened:* `db-kind` is build-time because Quarkus uses it during the build to decide *which JDBC driver and Hibernate dialect to include* - a packaging decision. Setting `QUARKUS_DATASOURCE_DB_KIND` at startup is ignored. `jdbc.url`, `username`, `password` are runtime, overridable as expected. The Quarkus config reference marks build-time keys with a lock icon, and Quarkus logs a warning if you try to override one at runtime.

💡 The `password=${DB_PASSWORD}` keeps the real secret out of the file, resolving from the environment at startup - nothing sensitive lands in git. Never commit passwords or API keys. See [/guides/secrets-management](/guides/secrets-management).

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
