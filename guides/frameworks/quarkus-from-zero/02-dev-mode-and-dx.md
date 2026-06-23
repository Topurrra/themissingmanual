---
title: "Dev Mode & the Developer Experience"
guide: "quarkus-from-zero"
phase: 2
summary: "Quarkus's signature: live reload that recompiles on the next request, a built-in Dev UI, continuous testing, and Dev Services that auto-start throwaway databases — the fast feedback loop teams fall in love with."
tags: [quarkus, dev-mode, live-reload, dev-ui, continuous-testing, dev-services, developer-experience]
difficulty: beginner
synonyms: ["quarkus dev mode", "quarkus live reload", "quarkus dev ui", "quarkus continuous testing", "quarkus dev services", "quarkus developer experience", "quarkus quarkus dev command"]
updated: 2026-06-22
---

# Dev Mode & the Developer Experience

In [Phase 1](01-what-quarkus-is.md) we built the mental model: Quarkus moves work from runtime to build time, which is why it boots in milliseconds. That same build-time machinery has a second payoff that you *feel* every single day — and it's the reason most people who try Quarkus don't want to go back. It's the inner loop: the tiny cycle of edit code, see result, edit again that you run hundreds of times a day.

Here's the mental model to hold for this whole phase: **Quarkus treats your running dev server as a live thing you talk to, not a build you keep restarting.** Java has a long, painful reputation for the "change one line, wait thirty seconds for the app to rebuild and restart" tax. Quarkus's whole developer experience is an attack on that tax. You start the app once and then *stay* in flow — editing files, hitting endpoints, watching tests go green — without ever stopping and starting it yourself.

We'll walk the four pieces that make that real: live reload, the Dev UI, continuous testing, and Dev Services. Then we'll talk about why fast feedback is worth caring about at all.

## `quarkus dev` and live reload

The front door to all of this is one command:

```bash
quarkus dev
```

*What just happened:* you started Quarkus in **dev mode**. The app comes up on `http://localhost:8080`, and — this is the important part — it's now *watching your source files*. You did not start a "build watcher" or a separate tool; dev mode is a first-class run mode of Quarkus itself. (If you're using Maven instead of the Quarkus CLI, the equivalent is `./mvnw quarkus:dev`, and `./gradlew quarkusDev` for Gradle — same behavior.)

Now here's the mental model that trips people up coming from other ecosystems, so let's state it plainly:

> 📝 **Live reload happens on the *next request*, not on save.** When you change a file, Quarkus doesn't immediately rebuild in the background. It waits until the *next time you hit the app* — a browser refresh, a `curl`, an API call — and *then* recompiles the changed code and reloads it, in the moment, before serving that request. The very first request after an edit pays a tiny recompile cost; everything after is instant.

That design is deliberate and worth appreciating: nothing is recompiling while you're still typing. The work happens exactly when you ask to *see* a result, which is the only time you actually care.

Let's make it concrete with our `Product` service. Say you have a resource that returns a greeting:

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

With `quarkus dev` already running, hit it:

```bash
curl http://localhost:8080/products
```

```console
Product list coming soon
```

Now change the returned text — edit the method to return `"We have 3 products"` — and **save**. Don't restart anything. Just run the same `curl` again:

```bash
curl http://localhost:8080/products
```

```console
We have 3 products
```

*What just happened:* between the two requests you changed Java source and never touched the server. On that second request, Quarkus noticed the file was newer, recompiled `ProductResource`, swapped in the new bytecode, and served the response — all transparently. No manual rebuild, no restart, no waiting on a fat reboot. Edit, refresh, see it. That loop, repeated all day, is the thing people mean when they say Quarkus is a joy to work in.

> 💡 This even covers most config and dependency changes. Add a new endpoint method, tweak `application.properties`, pull in a new extension — dev mode picks it up on the next request. The cases where you *do* need a full restart (deep classpath surgery) are rare enough that you'll forget restarting was ever a habit.

## The Dev UI: a console for your running app

Live reload keeps you in flow; the **Dev UI** lets you see inside the app while it runs. Point your browser at:

```bash
http://localhost:8080/q/dev
```

> 📝 The **Dev UI** is a web console that Quarkus serves *only in dev mode*. It's a live dashboard of everything in your application: every **extension** you've added, your current **configuration**, the **CDI beans** Quarkus wired up, your **REST endpoints**, plus interactive tools to poke at them. It's not a separate app you install — it ships with the dev-mode runtime and disappears in production.

A quick tour of what you'll actually use:

- **Extensions** — a card for each extension on your project (REST, Hibernate, a database driver…). Many cards have their own buttons and views, so the UI grows as your app does.
- **Configuration** — every config property and its current value, editable live. Change a setting here and dev mode reloads it on the next request, same as editing the file.
- **Beans / CDI** — the full list of beans Quarkus discovered and how they're scoped. When [CDI in Phase 4](04-cdi-with-arc.md) makes you wonder "did my bean even get registered?", this is where you look.
- **Endpoints** — every route your app exposes, often with a way to invoke them straight from the browser. No Postman needed for a quick check.

*What just happened:* the same build-time metadata that makes Quarkus fast — the catalog of beans, routes, and config it computed at build — gets handed to a UI you can browse. The Dev UI is essentially that internal model made visible. When something behaves oddly, "open `/q/dev` and look" is often faster than reading code.

## Continuous testing: red/green without leaving the terminal

This is the feature that quietly changes how you work. Look at the terminal where `quarkus dev` is running — there's an interactive prompt at the bottom. Press `r`:

```console
Tests paused
Press [r] to resume, [h] for more options>
r
--
Running 1/1. Running: ProductResourceTest#listReturnsProducts()
All 1 tests are passing (0 failed), 1 tests were run in 412ms.
Press [r] to re-run, [o] Toggle test output, [h] for more options>
```

*What just happened:* you turned on **continuous testing**. From now on, every time you change code, Quarkus re-runs the affected tests automatically — and it's smart about it, running only the tests touched by your change rather than the whole suite. You get a green "all passing" or a red failure right there in the terminal, seconds after you save, without switching to your IDE's test runner or kicking off a build.

The interactive console has more single-key commands worth knowing: `r` to re-run, `o` to toggle test output, `h` for the full menu. You drive your whole inner loop from those keystrokes.

> 💡 Notice the *flow* this creates. Change the `Product` resource, glance at the terminal, see the test that covers it go red or green — you're getting TDD-style feedback whether or not you set out to "do TDD." Fast, automatic test feedback nudges you toward writing the test first and watching it pass, because the loop is finally short enough that doing so costs nothing. (We go deeper on testing in [Phase 8](08-testing.md).)

## Dev Services: zero-config infrastructure

Now the feature that makes people sit up. Suppose your `Product` service needs a real database. You add the Postgres extension to your project — and then, in dev, you *don't* configure a database connection at all. You'd expect the app to fail on startup, right? Watch:

```console
INFO  Dev Services for default datasource (postgresql) started
INFO  Container postgres:16 is starting...
INFO  Profile dev activated. Live Coding activated.
INFO  Installed features: [cdi, hibernate-orm, jdbc-postgresql, rest, smallrye-context-propagation]
```

*What just happened:* Quarkus noticed you have the Postgres extension but **no datasource configured**, and rather than erroring, it spun up a throwaway PostgreSQL **in a container** for you and wired your app to it automatically. That's **Dev Services**. You wrote zero connection strings, installed no database, and yet your app is talking to a real Postgres. When you stop dev mode, the container goes away — nothing to clean up.

This isn't special to Postgres. The same magic covers MySQL, MariaDB, Kafka, Redis, MongoDB, and more: add the extension, leave it unconfigured in dev, and Quarkus provisions a local instance on demand.

> 📝 The rule Dev Services follows is exactly the conditional pattern you saw with Spring Boot's auto-configuration: **if** an extension needs a service **and** you haven't configured one for this profile, **then** start a throwaway one. The moment you *do* set a connection (say, pointing at a shared dev database), Dev Services backs off and uses yours. Your config always wins.

⚠️ **Gotcha — this needs a container runtime.** Dev Services starts containers (via Testcontainers under the hood), so you need **Docker or Podman running** on your machine. No container runtime, no auto-database — Quarkus will tell you it couldn't start Dev Services. And to be clear: this is a **dev and test** convenience only. In production you configure real connections; nothing auto-spawns a database for you when you deploy. If containers are new to you, [Docker Without the Magic](/guides/docker-without-the-magic) is the companion read.

> 💡 Step back and appreciate what just got deleted from your life: the "set up your local environment" wiki page. No "install Postgres, create a user, run these schema scripts" ritual before a new teammate can run the app. Clone, `quarkus dev`, and a clean database is waiting. That's a real, measurable DX win — onboarding goes from an afternoon to a minute.

## Why developer experience actually matters

It's tempting to file all of this under "nice conveniences." It's more than that.

> 💡 **Fast feedback is a force multiplier.** The length of your inner loop — edit, run, see result — silently sets the ceiling on how fast you can think. A thirty-second rebuild doesn't just cost thirty seconds; it costs your concentration, because you context-switch away while you wait. Shrink that loop to near-zero and you stay *in* the problem. You try more ideas, because trying one is cheap. You catch mistakes the moment you make them, while the change is still fresh in your head.

That's the deeper reason teams pick Quarkus, and it's worth separating from the runtime story. Phase 1's pitch was about *production*: fast startup, low memory, cheap to run at scale. This phase's pitch is about *you*, every day at your desk: a language famous for slow rebuilds, made to feel instant. Both are real, and the second one is the one you'll notice first.

With the loop this tight, we're ready to actually build something. Next we'll write real REST endpoints for the `Product` service — and you'll get to *feel* live reload as we go, editing and re-hitting the API in the same breath.

## Recap

- **`quarkus dev` starts dev mode**, which watches your source and keeps the app running so you never manually restart during development.
- **Live reload recompiles on the *next request*, not on save** — the first request after an edit pays a tiny recompile cost; the result is "edit, refresh, see it" with no restart.
- **The Dev UI (`/q/dev`)** is a dev-only web console showing your extensions, config, beans, and endpoints, with tools to poke at them — the app's internal model made visible.
- **Continuous testing** (press `r` in the dev console) re-runs the affected tests automatically on every change, giving red/green feedback in the terminal and nudging you toward a TDD-style flow.
- **Dev Services** auto-starts throwaway containers (Postgres, Kafka, Redis…) when an extension needs a service you haven't configured — zero-config local infra. It needs a container runtime (Docker/Podman) and is **dev/test only**; your own config always wins.
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