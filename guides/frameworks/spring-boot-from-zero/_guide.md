---
title: "Spring Boot From Zero"
guide: "spring-boot-from-zero"
phase: 0
summary: "Learn Spring Boot the way it's actually used: what auto-configuration really does, dependency injection and beans, building a REST API, configuration and profiles, persistence with Spring Data JPA, the service layer and validation, error handling, testing, security, and shipping to production. Mental-model-first, magic demystified."
tags: [spring-boot, spring, java, framework, rest-api, dependency-injection, jpa, spring-security, backend]
category: frameworks
order: 2
group: "Java"
difficulty: intermediate
synonyms: ["learn spring boot", "spring boot tutorial", "spring boot for beginners", "spring boot rest api", "spring dependency injection beans", "spring data jpa", "spring security", "spring boot from scratch", "what is spring boot"]
updated: 2026-06-22
---

# Spring Boot From Zero

Spring Boot is the framework most professional Java is written in. If you want a backend job in the Java
world — banks, enterprises, most of the JVM ecosystem — this is the thing they're hiring for. It has a
reputation for "magic": you add an annotation, a dependency appears wired up; you name a method a certain
way and a database query writes itself. That magic is wonderful when it works and baffling when it
doesn't — so this guide's whole job is to show you *what the magic actually is*, not hand you spells to
paste.

We build the mental model first the whole way: what Spring Boot is doing under each annotation, why it
made the choice it did, and how to reason about it when something breaks. By the end you'll be able to
build a real REST API backed by a database — with config, validation, error handling, tests, and
security — and understand every layer instead of cargo-culting it.

> 📝 This guide teaches the **framework**. It assumes you know **Java** — classes, interfaces, generics,
> annotations, exceptions. If you don't yet, do [Java From Zero](/guides/java-from-zero) first; a framework
> amplifies the language under it, it can't replace it. New to frameworks as a concept? Read
> [What a Framework Even Is](/guides/what-a-framework-even-is) for the mental model this builds on.

## How to read this

Read in order — each phase builds the running example (a small REST API) one layer at a time. Type the
code as you go; a Spring app clicks once you've wired the pieces yourself. Phases carry difficulty badges
so you can see the climb.

## The phases

**Part 1 — The core (🟢 Basic)**
1. **[What Spring Boot Is & Your First App](01-what-spring-boot-is.md)** 🟢 — Spring vs Spring Boot, auto-configuration demystified, Spring Initializr, your first running web app.
2. **[Dependency Injection & Beans](02-dependency-injection-and-beans.md)** 🟢 — the heart of Spring: the IoC container, beans, `@Component`/`@Service`, constructor injection.
3. **[Building a REST API: Controllers](03-rest-controllers.md)** 🟢 — `@RestController`, request mappings, path variables, request bodies, returning JSON.

**Part 2 — A real application (🟡 Intermediate)**
4. **[Configuration & Profiles](04-configuration-and-profiles.md)** 🟡 — `application.yml`, `@Value`, `@ConfigurationProperties`, and per-environment profiles.
5. **[Persistence with Spring Data JPA](05-persistence-with-jpa.md)** 🟡 — `@Entity`, repositories, CRUD without SQL, derived queries, and where the magic stops.
6. **[The Service Layer, DTOs & Validation](06-service-layer-and-validation.md)** 🟡 — separating concerns, DTOs vs entities, Bean Validation, `@Transactional`.
7. **[Error Handling Done Right](07-error-handling.md)** 🟡 — `@ExceptionHandler`, `@ControllerAdvice`, and honest HTTP status codes.
8. **[Testing Spring Boot Apps](08-testing-spring-boot.md)** 🟡 — `@SpringBootTest`, slice tests, MockMvc, and testing the data layer.

**Part 3 — Production (🔴 Advanced → 🟡)**
9. **[Security with Spring Security](09-security-with-spring-security.md)** 🔴 — the filter chain, authentication vs authorization, password encoding, securing endpoints.
10. **[Production: Actuator, Packaging & Deployment](10-production-actuator-and-deploy.md)** 🟡 — health/metrics with Actuator, building a runnable JAR, Docker, prod profiles.

**Finale**
11. **[Where to Go Next](11-where-to-go-next.md)** 🟢 — microservices, reactive (WebFlux), messaging, and what to build.

> The "magic" of Spring Boot is auto-configured Spring. When you want to see what it automates by hand,
> the [Spring Framework (core)](/guides/spring-framework-from-zero) guide (writing the config yourself) is
> the demystifier — but learn it *after* this; Boot is how the job is actually done.

---

[Phase 1: What Spring Boot Is & Your First App →](01-what-spring-boot-is.md)
