---
title: "Dev Mode & the Developer Experience"
guide: "quarkus-from-zero"
phase: 2
summary: "Quarkus's signature: live reload that recompiles on the next request, a built-in Dev UI, continuous testing, and Dev Services that auto-start throwaway databases - the fast feedback loop teams fall in love with."
tags: [quarkus, dev-mode, live-reload, dev-ui, continuous-testing, dev-services, developer-experience]
difficulty: beginner
synonyms: ["quarkus dev mode", "quarkus live reload", "quarkus dev ui", "quarkus continuous testing", "quarkus dev services", "quarkus developer experience", "quarkus quarkus dev command"]
updated: 2026-07-10
---

# Dev Mode & the Developer Experience

Phase 1 built the mental model: Quarkus moves work from runtime to build time, which is why it boots in milliseconds. That same machinery has a second payoff you *feel* every day, and it's the reason most people who try Quarkus don't want to go back: the inner loop of edit-code-see-result, run hundreds of times a day.

The mental model for this phase: **Quarkus treats your running dev server as a live thing you talk to, not a build you keep restarting.** Java has a long reputation for the "change one line, wait thirty seconds" tax. Quarkus's dev experience is an attack on that tax - you start the app once and stay in flow, without ever stopping and starting it yourself.

Four pieces make that real: live reload, the Dev UI, continuous testing, and Dev Services.

## `quarkus dev` and live reload

```bash
quarkus dev
```

*What just happened:* you started Quarkus in **dev mode**. The app comes up on `http://localhost:8080` and is now *watching your source files* - dev mode is a first-class run mode of Quarkus itself, not a separate tool. (Maven: `./mvnw quarkus:dev`; Gradle: `./gradlew quarkusDev` - same behavior.)

> 📝 **Live reload happens on the *next request*, not on save.** Quarkus doesn't rebuild in the background when you change a file. It waits until the next time you hit the app - a refresh, a `curl`, an API call - and *then* recompiles and reloads the changed code before serving that request. The first request after an edit pays a tiny recompile cost; everything after is instant.

Nothing recompiles while you're still typing - the work happens exactly when you ask to *see* a result.

Say you have a resource that returns a greeting:

```java
package org.acme;

import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;

@Path("/products")
public class ProductResource {

    @GET
    public String list() {
        return "Product list coming soon";
    }
}
```

With `quarkus dev` running, hit it:

```bash
curl http://localhost:8080/products
```

```console
Product list coming soon
```

Now change the returned text to `"We have 3 products"` and **save**. Don't restart anything - run the same `curl` again:

```bash
curl http://localhost:8080/products
```

```console
We have 3 products
```

*What just happened:* between the two requests you changed Java source and never touched the server. On the second request Quarkus noticed the file was newer, recompiled `ProductResource`, and served the response - transparently. Edit, refresh, see it.

> 💡 This covers most config and dependency changes too - a new endpoint method, a tweaked `application.properties`, a new extension all get picked up on the next request. Cases needing a full restart (deep classpath surgery) are rare enough you'll forget restarting was ever a habit.

## The Dev UI: a console for your running app

Live reload keeps you in flow; the **Dev UI** lets you see inside the app while it runs:

```bash
http://localhost:8080/q/dev
```

> 📝 The **Dev UI** is a web console Quarkus serves *only in dev mode* - a live dashboard of every **extension**, your current **configuration**, the **CDI beans** wired up, your **REST endpoints**, plus interactive tools to poke at them. It ships with the dev-mode runtime and disappears in production.

What you'll actually use:

- **Extensions** - a card for each one (REST, Hibernate, a database driver...), often with its own views.
- **Configuration** - every property and its current value, editable live.
- **Beans / CDI** - the full list of beans and how they're scoped. When [CDI in Phase 4](04-cdi-with-arc.md) makes you wonder "did my bean get registered?", look here.
- **Endpoints** - every route, often invokable straight from the browser. No Postman needed.

*What just happened:* the same build-time metadata that makes Quarkus fast - the catalog of beans, routes, and config - gets handed to a UI you can browse. When something behaves oddly, "open `/q/dev` and look" is often faster than reading code.

## Continuous testing: red/green without leaving the terminal

Look at the terminal where `quarkus dev` is running - there's an interactive prompt at the bottom. Press `r`:

```console
Tests paused
Press [r] to resume, [h] for more options>
r
--
Running 1/1. Running: ProductResourceTest#listReturnsProducts()
All 1 tests are passing (0 failed), 1 tests were run in 412ms.
Press [r] to re-run, [o] Toggle test output, [h] for more options>
```

*What just happened:* you turned on **continuous testing**. From now on, every code change re-runs the affected tests automatically - only the tests touched by the change, not the whole suite - and you get a green or red result right in the terminal, seconds after you save.

`r` re-runs, `o` toggles test output, `h` shows the full menu.

> 💡 Change the `Product` resource, glance at the terminal, watch its test go red or green - you're getting TDD-style feedback whether or not you set out to "do TDD." (Deeper in [Phase 8](08-testing.md).)

## Dev Services: zero-config infrastructure

Suppose your `Product` service needs a real database. Add the Postgres extension and *don't* configure a connection at all. You'd expect it to fail on startup:

```console
INFO  Dev Services for default datasource (postgresql) started
INFO  Container postgres:16 is starting...
INFO  Profile dev activated. Live Coding activated.
INFO  Installed features: [cdi, hibernate-orm, jdbc-postgresql, rest, smallrye-context-propagation]
```

*What just happened:* Quarkus noticed the Postgres extension but **no datasource configured**, and instead of erroring, spun up a throwaway PostgreSQL **in a container** and wired your app to it automatically - **Dev Services**. Zero connection strings, no database installed, yet a real Postgres. Stop dev mode and the container goes away.

Same for MySQL, MariaDB, Kafka, Redis, MongoDB, and more: add the extension, leave it unconfigured in dev.

> 📝 The rule: **if** an extension needs a service **and** you haven't configured one for this profile, **then** start a throwaway one. The moment you *do* set a connection, Dev Services backs off. Your config always wins.

⚠️ This needs a container runtime - Dev Services starts containers via Testcontainers, so you need **Docker or Podman running**. No runtime, no auto-database. This is a **dev and test** convenience only - production needs real configured connections. See [Docker Without the Magic](/guides/docker-without-the-magic) if containers are new.

> 💡 What just got deleted from your life: the "set up your local environment" wiki page. Clone, `quarkus dev`, and a clean database is waiting.

## Why developer experience actually matters

> 💡 **Fast feedback is a force multiplier.** The length of your inner loop silently sets the ceiling on how fast you can think. A thirty-second rebuild costs your concentration, not just thirty seconds - you context-switch while you wait. Shrink the loop to near-zero and you stay *in* the problem, try more ideas, and catch mistakes while the change is still fresh.

Phase 1's pitch was about *production*: fast startup, low memory, cheap at scale. This phase's pitch is about *you*, every day at your desk - a language famous for slow rebuilds, made to feel instant.

Next we write real REST endpoints for the `Product` service - and feel live reload as we go.

## Recap

- **`quarkus dev` starts dev mode**, which watches your source and keeps the app running so you never manually restart during development.
- **Live reload recompiles on the *next request*, not on save** - the first request after an edit pays a tiny recompile cost; the result is "edit, refresh, see it" with no restart.
- **The Dev UI (`/q/dev`)** is a dev-only web console showing your extensions, config, beans, and endpoints, with tools to poke at them - the app's internal model made visible.
- **Continuous testing** (press `r` in the dev console) re-runs the affected tests automatically on every change, giving red/green feedback in the terminal and nudging you toward a TDD-style flow.
- **Dev Services** auto-starts throwaway containers (Postgres, Kafka, Redis…) when an extension needs a service you haven't configured - zero-config local infra. It needs a container runtime (Docker/Podman) and is **dev/test only**; your own config always wins.
- **Fast feedback is the real point.** A near-instant inner loop keeps you in flow and is a genuine reason teams choose Quarkus, separate from its runtime speed.

## Quick check

Make sure the dev-mode mental model stuck before we start building APIs.

```quiz
[
  {
    "q": "When does Quarkus live reload recompile your changed code?",
    "choices": [
      "Immediately every time you save a file, in the background",
      "On the next request to the app after you've changed a file",
      "Only when you manually restart the dev server",
      "On a fixed timer, every few seconds"
    ],
    "answer": 1,
    "explain": "Dev mode waits until the next request (a refresh, curl, or API call), then recompiles and reloads the changed code before serving that request. The first request after an edit pays a small cost; the rest are instant."
  },
  {
    "q": "You added the Postgres extension but configured no datasource in dev. What does Quarkus do?",
    "choices": [
      "Fails to start because there's no database connection",
      "Falls back to an in-memory map and ignores Postgres",
      "Uses Dev Services to auto-start a throwaway Postgres container and wires the app to it",
      "Prompts you to enter a connection string before starting"
    ],
    "answer": 2,
    "explain": "Dev Services follows the rule: if an extension needs a service and you haven't configured one, start a throwaway one (in a container). It needs a running container runtime and is for dev/test only."
  },
  {
    "q": "What does continuous testing do in Quarkus dev mode?",
    "choices": [
      "Runs the entire test suite once when the app starts",
      "Re-runs the affected tests automatically as you change code, showing red/green in the terminal",
      "Replaces your tests with auto-generated ones",
      "Only runs tests when you push to CI"
    ],
    "answer": 1,
    "explain": "Press 'r' in the dev console to enable it. Quarkus then re-runs only the tests touched by each change, giving immediate red/green feedback without leaving the terminal."
  }
]
```

---

[← Phase 1: What Quarkus Is & Why It's Fast](01-what-quarkus-is.md) · [Guide overview](_guide.md) · [Phase 3: Building REST APIs →](03-rest-apis.md)
