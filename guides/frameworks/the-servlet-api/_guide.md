---
title: "The Servlet API From Zero"
guide: "the-servlet-api"
phase: 0
summary: "Learn the foundation under every Java web framework: what a servlet is, the servlet container and its thread-per-request lifecycle, handling HTTP by hand with HttpServlet, URL mapping and the front-controller pattern, filters and the filter chain, and sessions. Spring's DispatcherServlet, JAX-RS, and middleware all live on top of this — see it bare."
tags: [servlet, servlet-container, java, http, filters, sessions, front-controller, jakarta-servlet]
category: frameworks
order: 7
group: "Java"
difficulty: intermediate
synonyms: ["what is a java servlet", "servlet api tutorial", "httpservlet doget dopost", "servlet container lifecycle", "servlet filters chain", "httpsession java", "front controller pattern servlet", "what spring dispatcherservlet is built on"]
updated: 2026-06-22
---

# The Servlet API From Zero

Underneath every Java web framework you'll ever use — Spring MVC, Jakarta EE's JAX-RS, even Quarkus on
the JVM — there's one ancient, stable foundation: the **Servlet API**. Spring's `DispatcherServlet` is,
as the name says, a *servlet*. JAX-RS runs on servlets. Every "middleware" you've heard of is a servlet
**filter** underneath. This is the bedrock the whole Java web world is built on, and almost nobody learns
it directly anymore — which is exactly why the frameworks feel like magic.

This is a **roots guide**. You'll rarely write raw servlets in a real job (the frameworks exist for good
reasons), but understanding them turns a dozen framework concepts from magic into mechanism: routing,
middleware, the request lifecycle, why your controllers must be thread-safe, how sessions work. We build
the mental model bare-metal first — an HTTP request arriving, a container handing it to your code, a
response going back — and then you'll recognize that exact shape inside every framework you touch.

> 📝 This assumes **Java** (classes, interfaces, inheritance) and a basic grasp of **HTTP**. If HTTP is
> fuzzy, read [HTTP, Explained](/guides/http-explained) first. This guide is the deepest "kill the magic"
> root under [Spring](/guides/spring-framework-from-zero) and [Jakarta EE](/guides/jakarta-ee-from-zero) —
> most valuable *after* you've used a framework and want to see what's beneath it.

## How to read this

Read in order — it builds from a single bare servlet up to the front-controller pattern that frameworks
generalize. Short and foundational. Phases carry difficulty badges.

## The phases

1. **[What a Servlet Is](01-what-a-servlet-is.md)** 🟢 — the foundational unit of Java web: an object that handles HTTP requests, and the container that runs it.
2. **[The Servlet Container & Lifecycle](02-the-servlet-container-and-lifecycle.md)** 🟡 — init/service/destroy, one instance serving many threads, and why that demands thread-safety.
3. **[Handling Requests with HttpServlet](03-handling-requests.md)** 🟢 — `doGet`/`doPost`, reading the request, writing the response, by hand.
4. **[Mapping & the Front-Controller Pattern](04-mapping-and-the-front-controller.md)** 🟡 — URL mapping, and the one-servlet-routes-everything pattern that *is* DispatcherServlet's secret.
5. **[Filters & the Chain](05-filters-and-the-chain.md)** 🟡 — intercepting requests before/after your servlet — the root of all "middleware."
6. **[Sessions & State](06-sessions-and-state.md)** 🟡 — `HttpSession`, cookies, and how stateful behavior is built on a stateless protocol.
7. **[From Servlets to Frameworks](07-from-servlets-to-frameworks.md)** 🟢 — see the servlet inside Spring MVC, JAX-RS, and middleware; where to go next.

> Once you've seen the Servlet API bare, "a framework" reads as "conveniences over a servlet, a front
> controller, and a filter chain." The magic was always this.

---

[Phase 1: What a Servlet Is →](01-what-a-servlet-is.md)
