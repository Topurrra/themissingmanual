---
title: "Configuration & Profiles"
guide: "spring-boot-from-zero"
phase: 4
summary: "How Spring Boot reads externalized config: application.yml, @Value and @ConfigurationProperties, the precedence order that lets one jar run anywhere, profiles per environment, and keeping secrets out of your code."
tags: [spring-boot, configuration, application-yml, profiles, value, configuration-properties, externalized-config]
difficulty: intermediate
synonyms: ["spring boot application properties yml", "spring @Value annotation", "spring @ConfigurationProperties", "spring profiles dev prod", "spring externalized configuration", "spring boot environment variables"]
updated: 2026-06-22
---

# Configuration & Profiles

In [Phase 3](03-rest-controllers.md) you built a REST API that returns JSON. Every value in it was *hardcoded* — the port the server runs on, any URL, any tuning knob. That's fine for a demo. It falls apart the moment the same code has to run on your laptop, on a staging box, and in production, where each of those needs *different* values: a different database, different log levels, different secrets.

The mental model for this phase: **configuration is how one build of your app adapts to many environments without recompiling.** You don't ship three versions of the app — you ship *one* jar and feed it different settings depending on where it lands. Spring Boot has a rich, layered system for doing exactly that, and once you see the layers you'll stop being surprised by "why is it using *that* value?"

## The config file: `application.properties` / `application.yml`

📝 Spring Boot automatically looks for a config file named `application` on startup — no wiring, no annotation. Drop it in `src/main/resources/` and Boot reads it. You get two formats, and you pick one.

The older format is **`.properties`** — flat `key=value` lines:

```properties
server.port=8081
spring.application.name=bookstore
logging.level.org.springframework.web=DEBUG
```

*What just happened:* Three settings, each a dotted key and a value. `server.port` tells the embedded server to listen on 8081 instead of the default 8080. `spring.application.name` names your app (it shows up in logs and tooling). The `logging.level...` line turns on DEBUG logging for Spring's web package so you can see request handling. These are Boot's own well-known keys — you didn't define them; Boot reads them.

The newer format is **`.yml`** (YAML), which expresses the same thing as a nested tree:

```yaml
server:
  port: 8081
spring:
  application:
    name: bookstore
logging:
  level:
    org.springframework.web: DEBUG
```

*What just happened:* Identical settings, written as indentation instead of repeated `server.`/`spring.` prefixes. The dotted key `server.port` becomes a `port:` nested under `server:`. YAML collapses the repetition, which is why it reads better as configs grow — once you have a dozen `spring.datasource.*` keys, the nested form is far easier to scan.

💡 **Use `.yml`.** Both formats are equivalent and Boot reads either, but YAML's nesting wins as soon as your config is more than a handful of lines. Just don't keep *both* files — pick one to avoid confusion about which wins. (One YAML gotcha: indentation is significant and must be spaces, never tabs.)

## Reading config in your code

A config file is useless if your code can't see the values. Spring gives you two ways in, and they suit different needs.

The quick one is **`@Value`** — inject a single value by its key:

```java
@Service
public class GreetingService {

    @Value("${app.greeting}")
    private String greeting;

    public String greet(String name) {
        return greeting + ", " + name + "!";
    }
}
```

With this in `application.yml`:

```yaml
app:
  greeting: "Hello"
```

*What just happened:* The `${app.greeting}` placeholder tells Spring "find the `app.greeting` key in the config and inject its value into this field." When the `GreetingService` bean is created (recall beans and injection from [Phase 2](02-dependency-injection-and-beans.md)), Spring resolves the placeholder and sets `greeting` to `"Hello"`. Change the file, restart, and the behavior changes — no code edit. `@Value` is perfect for one or two stray values.

📝 But when you have a *group* of related settings, the cleaner way is **`@ConfigurationProperties`** — it binds a whole block of config into one typed object. You define a class whose fields mirror the keys, and Spring populates it:

```java
@Component
@ConfigurationProperties(prefix = "app")
public class AppProperties {
    private String name;
    private String greeting;
    private int maxResults;

    // getters and setters required for binding
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getGreeting() { return greeting; }
    public void setGreeting(String greeting) { this.greeting = greeting; }
    public int getMaxResults() { return maxResults; }
    public void setMaxResults(int maxResults) { this.maxResults = maxResults; }
}
```

Bound to this config:

```yaml
app:
  name: bookstore
  greeting: "Hello"
  max-results: 50
```

*What just happened:* `@ConfigurationProperties(prefix = "app")` says "take everything under the `app.` prefix and map it onto this object's fields by name." `app.name` lands in `name`, `app.greeting` in `greeting`, and `app.max-results` in `maxResults` — note Spring's *relaxed binding* matches the kebab-case `max-results` to the camelCase `maxResults` field automatically. Crucially, `max-results: 50` becomes an `int`, not a string: the binding is **type-safe**, so a non-numeric value fails loudly at startup instead of blowing up later. You then inject `AppProperties` like any other bean and call `appProps.getMaxResults()`.

💡 **Prefer `@ConfigurationProperties` for anything more than a value or two.** You get one typed object instead of scattered `@Value` strings, IDE autocomplete on the fields, type checking, and a single place that documents what your app can be configured with. Reach for `@Value` only for the odd one-off.

## Externalized configuration & precedence

Here's the idea that makes the single-jar dream work. 📝 Spring Boot doesn't read config from *one* place — it layers it from many sources and merges them, with later sources **overriding** earlier ones. Roughly, lowest to highest priority:

1. Defaults baked into the framework
2. Your `application.yml` (packaged in the jar)
3. OS **environment variables**
4. **Command-line arguments** (`--key=value`)

A setting from a higher layer wins over the same setting from a lower one. That single rule is what lets the *same* jar behave differently everywhere: ship `application.yml` with sensible defaults, then *override* the few values that differ per environment from the outside — no rebuild.

Say your jar bakes in `server.port: 8081`, but production needs 9000. You override it without touching the file:

```bash
java -jar bookstore.jar --server.port=9000
```

Or via an environment variable:

```bash
SERVER_PORT=9000 java -jar bookstore.jar
```

*What just happened:* In both cases the file says 8081, but the external source sits higher in the precedence order, so the app boots on 9000. The command-line `--server.port=9000` maps straight to the `server.port` key. The env var `SERVER_PORT` does too — Spring translates it back to `server.port`. This is the everyday way config reaches a containerized app: the image holds the jar with its defaults, and the deployment environment injects the overrides.

⚠️ **Watch the env-var naming.** Environment variables can't contain dots, so Spring uses *relaxed binding* in reverse: uppercase the key and replace dots with underscores. `app.name` becomes `APP_NAME`; `server.port` becomes `SERVER_PORT`; `spring.datasource.url` becomes `SPRING_DATASOURCE_URL`. Get the translation wrong and your override silently does nothing — the app keeps the file value and you waste an afternoon wondering why. For the broader why-and-how of environment-based config, see [/guides/env-vars-and-config](/guides/env-vars-and-config).

## Profiles: a config set per environment

Overriding values one at a time is fine for a couple of settings. But dev and prod often differ in *many* ways at once — different database, different log levels, different feature flags. 📝 **Profiles** let you bundle a whole set of config under a name and switch the entire set on or off together.

The mechanism is naming: alongside `application.yml`, you create `application-dev.yml` and `application-prod.yml`. Whatever profile is *active*, Boot loads its file *on top of* the base `application.yml` (so the base holds shared defaults, the profile file holds the differences).

`application-dev.yml`:

```yaml
logging:
  level:
    root: DEBUG
spring:
  datasource:
    url: jdbc:h2:mem:devdb
```

`application-prod.yml`:

```yaml
logging:
  level:
    root: WARN
spring:
  datasource:
    url: jdbc:postgresql://db.internal:5432/bookstore
```

*What just happened:* Two complete config sets. The dev profile points at a throwaway in-memory H2 database and logs verbosely; the prod profile points at a real PostgreSQL server and keeps logs quiet. They share whatever's in the base `application.yml`. You don't merge these by hand — you activate one and Boot layers the right file automatically.

You can also gate *beans* by profile with `@Profile`, so a whole component only exists in certain environments:

```java
@Component
@Profile("dev")
public class DevDataSeeder {
    // populates fake data on startup — only when "dev" is active
}
```

*What just happened:* `@Profile("dev")` tells Spring to create this bean **only** when the `dev` profile is active. In prod it does not exist at all, so your fake-data seeder can never accidentally run against the real database. This is the clean way to make behavior — not just values — environment-specific.

You choose the active profile the same way you override any other setting:

```bash
java -jar bookstore.jar --spring.profiles.active=prod
```

```console
... : The following 1 profile is active: "prod"
... : Tomcat started on port(s): 8081 (http)
... : Started BookstoreApplication in 2.1 seconds
```

*What just happened:* `--spring.profiles.active=prod` switched on the prod profile, so Boot loaded `application-prod.yml` over the base — the startup log confirms `"prod"` is active. In a real deployment you'd usually set this with the `SPRING_PROFILES_ACTIVE` environment variable instead, so the platform decides the profile, not the command line. No active profile? Boot runs with just the base `application.yml`, which is the sensible default for local work.

## Secrets: the one thing that never goes in the file

There's a category of config that needs special care: passwords, API keys, database credentials, signing keys. ⚠️ **Never commit these to `application.yml`.** That file lives in your git repository, and anything in git is effectively public forever — even if you delete it later, it sits in the history. A leaked database password or cloud key in a repo is one of the most common, most expensive security mistakes there is.

The fix follows directly from precedence: leave secrets *out* of the file and inject them from outside at runtime — exactly the environment-variable mechanism you just saw.

```yaml
spring:
  datasource:
    url: jdbc:postgresql://db.internal:5432/bookstore
    username: bookstore_app
    password: ${DB_PASSWORD}
```

*What just happened:* The non-secret connection details live in the file, but the password is a `${DB_PASSWORD}` placeholder. At startup Spring resolves it from the `DB_PASSWORD` environment variable, which the deployment platform supplies. The real secret is never written down in the repo — it lives only in the environment (or a dedicated secrets manager that hands it to the process). For production-grade handling — rotation, vaults, managed secret stores — see [/guides/secrets-management](/guides/secrets-management).

💡 **The whole picture.** Config, profiles, and externalized secrets are three angles on one principle: *one build adapts to dev, staging, and prod by changing inputs, not code.* You compile and test a single artifact, then let the environment decide the port, the database, the log level, and the secrets. That's what makes a Spring Boot app something you can confidently promote from your laptop all the way to production.

## Recap

1. Spring Boot auto-loads a config file named `application` from `src/main/resources/`. Prefer **`.yml`** over `.properties` — same capability, but nesting scales better. (YAML uses spaces, never tabs.)
2. Read config in code with **`@Value("${key}")`** for one-off values, or **`@ConfigurationProperties(prefix = ...)`** to bind a whole group into a typed object. Prefer `@ConfigurationProperties` — it's type-safe and self-documenting.
3. Config is **layered**: defaults < `application.yml` < environment variables < command-line args, with higher layers overriding lower. This is what lets one jar run in every environment.
4. **Environment variables** map to keys by uppercasing and replacing dots with underscores (`app.name` ↔ `APP_NAME`). Get the name wrong and the override silently does nothing.
5. **Profiles** (`application-dev.yml`, `application-prod.yml`, `@Profile("dev")`) bundle a full config set per environment; activate with `--spring.profiles.active=prod` or `SPRING_PROFILES_ACTIVE`.
6. **Never commit secrets** to the config file. Use a `${PLACEHOLDER}` and inject from environment variables or a secrets manager. One build, many environments — driven by inputs, not recompiles.

## Quick check

Make sure the config model stuck before you wire a database to it in the next phase:

```quiz
[
  {
    "q": "You have server.port: 8081 in application.yml but start the app with --server.port=9000. What port does it use, and why?",
    "choices": [
      "9000 — command-line arguments sit higher in the precedence order than the config file, so they override it",
      "8081 — the file is always authoritative once the app is built",
      "It fails to start because two sources disagree on the same key",
      "Whichever was set first wins, so 8081"
    ],
    "answer": 0,
    "explain": "Spring layers config from many sources with later ones overriding earlier ones: defaults < application.yml < env vars < command-line args. The command-line override wins, so the app boots on 9000 — which is exactly how one jar runs in many environments."
  },
  {
    "q": "Why is @ConfigurationProperties usually preferred over @Value for a group of related settings?",
    "choices": [
      "It binds a whole prefixed block into one typed object — type-safe, IDE-friendly, and a single documented place for your settings",
      "It is the only way to read config files at all",
      "It makes the application start faster",
      "It encrypts the values automatically"
    ],
    "answer": 0,
    "explain": "@Value injects single string values one at a time. @ConfigurationProperties maps a whole prefix onto a typed object, so you get type checking (a bad number fails at startup), autocomplete, and one place that documents what's configurable."
  },
  {
    "q": "Where should a production database password live?",
    "choices": [
      "Out of the config file entirely — injected from an environment variable or secrets manager via a ${PLACEHOLDER}",
      "Directly in application.yml so it ships with the jar",
      "In application-prod.yml, which is safe because it's profile-specific",
      "Hardcoded in the Java source so it can't be changed by accident"
    ],
    "answer": 0,
    "explain": "Any file in your repo — including application-prod.yml — is committed to git and effectively public forever. Secrets must stay out of the build: use a ${DB_PASSWORD} placeholder and supply the real value from the environment or a secrets manager at runtime."
  }
]
```

---

[← Phase 3: Building a REST API: Controllers](03-rest-controllers.md) · [Guide overview](_guide.md) · [Phase 5: Persistence with Spring Data JPA →](05-persistence-with-jpa.md)