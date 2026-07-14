---
title: "Quarkus From Zero"
guide: "quarkus-from-zero"
phase: 0
summary: "Learn the cloud-native Java framework built for fast startup and low memory: why Quarkus moves work to build time, its loved dev mode, REST APIs, build-time CDI, Hibernate with Panache, configuration, reactive programming with Mutiny, testing, and compiling to a native executable. The standards you know, made supersonic."
tags: [quarkus, java, framework, cloud-native, graalvm, native-image, panache, reactive, microprofile]
category: frameworks
order: 5
group: "Java"
difficulty: intermediate
synonyms: ["learn quarkus", "quarkus tutorial", "what is quarkus", "quarkus vs spring boot", "quarkus native image graalvm", "quarkus panache hibernate", "quarkus dev mode", "quarkus reactive mutiny", "supersonic subatomic java", "cloud native java framework"]
updated: 2026-06-22
---

# Quarkus From Zero

Quarkus calls itself "supersonic subatomic Java," which sounds like marketing until you watch a Quarkus
app boot in tens of milliseconds and sip a fraction of the memory a traditional Java service needs. It
was built for a world that didn't exist when classic Java frameworks were designed: containers,
Kubernetes, serverless, and autoscaling - where slow startup and fat memory cost real money. If you've
done [Spring Boot](/guides/spring-boot-from-zero) or [Jakarta EE](/guides/jakarta-ee-from-zero), Quarkus
will feel familiar *and* faster - because it runs the same standards (CDI, JAX-RS, Hibernate,
MicroProfile) but optimizes them in a fundamentally different way.

The one idea that explains everything Quarkus does: **move work from runtime to build time.** Classic
frameworks scan, reflect, and wire everything when the app *starts*; Quarkus does as much of that as
possible when the app is *compiled*, so startup is nearly free - and so the app can even be compiled to a
native machine-code executable. We build that mental model first, then walk the pieces you'll actually
use, demystifying each.

> 📝 This assumes you know **Java** and will lean on concepts from [Jakarta EE](/guides/jakarta-ee-from-zero)
> (CDI, JAX-RS) and [Hibernate & JPA](/guides/hibernate-and-jpa-from-zero) (Panache simplifies these). If
> those are new, do them first - Quarkus is "the standards, optimized," so knowing the standards pays off.

## How to read this

Read in order - it builds one example (a small `Product` service) and adds a capability each phase. The
real magic to *feel* is dev mode (Phase 2) and native compilation (Phase 9). Phases carry difficulty badges.

## The phases

**Part 1 - The Quarkus way (🟢 Basic)**
1. **[What Quarkus Is & Why It's Fast](01-what-quarkus-is.md)** 🟢 - build-time vs runtime work, native images, and how it relates to Spring Boot / Jakarta EE.
2. **[Dev Mode & the Developer Experience](02-dev-mode-and-dx.md)** 🟢 - live reload, the Dev UI, continuous testing - the thing people fall in love with.
3. **[Building REST APIs](03-rest-apis.md)** 🟢 - JAX-RS endpoints (RESTEasy Reactive) and JSON, the standards you already know.

**Part 2 - A real application (🟡 Intermediate)**
4. **[CDI in Quarkus (ArC)](04-cdi-with-arc.md)** 🟡 - build-time dependency injection: the same `@Inject`, wired at compile time.
5. **[Persistence: Hibernate with Panache](05-persistence-with-panache.md)** 🟡 - Panache's active-record and repository patterns over Hibernate.
6. **[Configuration](06-configuration.md)** 🟡 - MicroProfile Config, `application.properties`, profiles, and injecting config.

**Part 3 - Going further (🔴 Advanced → 🟢)**
7. **[Reactive Quarkus with Mutiny](07-reactive-with-mutiny.md)** 🔴 - `Uni`/`Multi`, reactive vs imperative, and when each fits.
8. **[Testing Quarkus Apps](08-testing.md)** 🟡 - `@QuarkusTest`, continuous testing, and testing the native build.
9. **[Native Compilation & Containers](09-native-compilation.md)** 🔴 - GraalVM native images, the closed-world model, and container-first deployment.
10. **[Production & Where to Go Next](10-where-to-go-next.md)** 🟢 - health/metrics, Kubernetes-native, the extension ecosystem, and what to build.

> Quarkus isn't a rejection of Spring/Jakarta EE - it's the same ideas re-engineered for the container
> era. Knowing the standards (this guide assumes them) is exactly what makes Quarkus click.

---

[Phase 1: What Quarkus Is & Why It's Fast →](01-what-quarkus-is.md)
