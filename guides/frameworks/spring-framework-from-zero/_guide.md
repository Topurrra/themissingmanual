---
title: "Spring Framework (Core) From Zero"
guide: "spring-framework-from-zero"
phase: 0
summary: "Learn the Spring that Spring Boot auto-configures: the IoC container and ApplicationContext, defining beans with @Configuration and @Bean, dependency injection in depth, bean scopes and lifecycle, AOP and the proxies that power @Transactional, and Spring MVC without Boot. Write the config Boot hides - and the magic disappears."
tags: [spring, spring-framework, ioc-container, dependency-injection, beans, aop, spring-mvc, java]
category: frameworks
order: 6
group: "Java"
difficulty: intermediate
synonyms: ["learn spring framework", "core spring without spring boot", "spring ioc container applicationcontext", "spring @Configuration @Bean", "spring bean lifecycle scopes", "spring aop proxies", "how spring boot works under the hood", "spring mvc dispatcherservlet"]
updated: 2026-07-10
---

# Spring Framework (Core) From Zero

Here's a secret that makes [Spring Boot](/guides/spring-boot-from-zero) stop being magic:
**Spring Boot is just core Spring with the configuration written for you.** Every `@Bean` Boot
auto-creates, every component it wires, every default it sets - that's plain Spring Framework underneath,
which Boot generates based on what's on your classpath. This guide is the one where you write that
configuration *yourself*. It's more typing and less convenience - and that's exactly the point. Once
you've assembled a Spring app by hand, Boot's "magic" becomes "oh, that's the thing I now know how to do,
done automatically."

This is a **roots guide**: it's about *understanding*, not about the fastest way to ship (Boot is that).
But the payoff is large - you'll debug Spring apps with X-ray vision, understand error messages that
baffle Boot-only developers, and see why `@Transactional` and `@Async` behave the way they do. We build
the mental model first the whole way: the container, beans, injection, lifecycle, and the proxies that
make the annotations work.

> 📝 This assumes **Java** (classes, interfaces, generics, annotations) and is far more valuable *after*
> [Spring Boot From Zero](/guides/spring-boot-from-zero) - do Boot first to be productive, then this to
> understand it. New to frameworks generally? [What a Framework Even Is](/guides/what-a-framework-even-is).

## How to read this

Read in order - it assembles a small app by hand (a notification service, then a web layer), revealing
one piece of "what Boot does for you" per phase. Phases carry difficulty badges.

## The phases

**Part 1 - The container (🟢 Basic → 🟡)**
1. **[Spring Without Boot - Why Core Spring?](01-spring-without-boot.md)** 🟢 - what Spring *is* vs Boot, and standing up an `ApplicationContext` by hand.
2. **[The IoC Container & ApplicationContext](02-the-ioc-container.md)** 🟡 - the container deeply: what it is, how it bootstraps, what a "bean" really means.
3. **[Defining Beans: @Configuration & @Bean](03-defining-beans.md)** 🟡 - declaring beans by hand (the explicit version of Boot's auto-config) vs component scanning.

**Part 2 - Wiring & lifecycle (🟡 → 🔴)**
4. **[Dependency Injection, Deep](04-dependency-injection-deep.md)** 🟡 - constructor/setter/field injection, `@Autowired` resolution, `@Qualifier`/`@Primary`, ambiguity.
5. **[Bean Scopes & Lifecycle](05-bean-scopes-and-lifecycle.md)** 🔴 - singleton/prototype/web scopes, lazy beans, the full lifecycle, and `BeanPostProcessor`.
6. **[Spring AOP & Proxies](06-spring-aop-and-proxies.md)** 🔴 - aspect-oriented programming, and how proxies make `@Transactional`/`@Async` actually work (with the self-invocation gotcha explained at the root).

**Part 3 - Web & beyond (🟡 → 🟢)**
7. **[Spring MVC Without Boot](07-spring-mvc-without-boot.md)** 🟡 - the `DispatcherServlet`, `@Controller`, and the web config Boot auto-wires.
8. **[From Core Spring to Spring Boot](08-from-core-spring-to-boot.md)** 🟢 - tie it all back: Boot = core Spring + auto-config + starters + embedded server. The magic, fully seen.

> After this, re-read the Spring Boot guide - every annotation you used there will now have a visible
> mechanism underneath it. That's the whole goal.

---

[Phase 1: Spring Without Boot - Why Core Spring? →](01-spring-without-boot.md)
