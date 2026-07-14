---
title: "Jakarta EE From Zero"
guide: "jakarta-ee-from-zero"
phase: 0
summary: "Learn the enterprise Java standard that runs a huge share of big-company backends: what Jakarta EE actually is (specs vs app servers), CDI dependency injection, JAX-RS REST APIs, Jakarta Persistence, JTA transactions, validation and JSON binding, enterprise beans and messaging, security, and the cloud-native MicroProfile direction."
tags: [jakarta-ee, java-ee, java, framework, cdi, jax-rs, jpa, enterprise, application-server]
category: frameworks
order: 4
group: "Java"
difficulty: intermediate
synonyms: ["learn jakarta ee", "java ee tutorial", "what is jakarta ee", "jakarta ee vs spring", "cdi dependency injection", "jax-rs rest api", "jakarta persistence", "application server wildfly payara", "java enterprise edition", "microprofile"]
updated: 2026-06-22
---

# Jakarta EE From Zero

Jakarta EE (the platform formerly called Java EE) is the *standard* for enterprise Java - a family of
specifications that a huge share of banks, insurers, governments, and large enterprises build on. If
[Spring Boot](/guides/spring-boot-from-zero) is the popular framework, Jakarta EE is the official
standard it grew up alongside: instead of one vendor's framework, it's a set of agreed-upon APIs
(dependency injection, REST, persistence, transactions, security) that *multiple* server vendors
implement. Learn it and a whole category of enterprise jobs opens up - and you'll understand where many
of Spring's ideas came from.

The mental model that makes Jakarta EE click is **"specification, not implementation."** You write code
against standard annotations (`@Inject`, `@Path`, `@Entity`), and an **application server** (WildFly,
Payara, Open Liberty…) provides the actual engine. Swap the server, keep your code. This guide builds
that model first, then walks the specs you'll actually use, demystifying each instead of handing you
boilerplate to copy.

> 📝 This assumes you know **Java** (classes, interfaces, generics, annotations). If that's shaky, do
> [Java From Zero](/guides/java-from-zero) first. New to frameworks generally?
> [What a Framework Even Is](/guides/what-a-framework-even-is) sets the stage, and the persistence phase
> builds directly on [Hibernate & JPA](/guides/hibernate-and-jpa-from-zero).

## How to read this

Read in order - it builds one example (a small `Product` REST service) spec by spec. Phases carry
difficulty badges so you can see the climb.

## The phases

**Part 1 - The platform (🟢 Basic)**
1. **[What Jakarta EE Is](01-what-jakarta-ee-is.md)** 🟢 - specs vs implementations, the Java EE → Jakarta rename, and how it compares to Spring.
2. **[The Application Server & Deployment](02-the-app-server-and-deployment.md)** 🟢 - WildFly/Payara/Open Liberty, WAR packaging, and the container that runs your code.

**Part 2 - The core specs (🟡 Intermediate)**
3. **[CDI: Contexts & Dependency Injection](03-cdi-dependency-injection.md)** 🟡 - the standard DI: `@Inject`, beans, scopes, qualifiers, producers.
4. **[JAX-RS: Building REST APIs](04-jax-rs-rest-apis.md)** 🟡 - `@Path`/`@GET`/`@POST`, JSON-B, and a real REST resource.
5. **[Jakarta Persistence (JPA)](05-jakarta-persistence.md)** 🟡 - container-managed `EntityManager`, persistence units, and how Hibernate fits in.
6. **[Transactions with JTA](06-transactions-with-jta.md)** 🟡 - container-managed transactions, `@Transactional`, and what JTA adds.
7. **[Validation & JSON Binding](07-validation-and-json-binding.md)** 🟡 - Jakarta Validation (`@NotNull`…) and JSON-B, wired into JAX-RS.
8. **[Enterprise Beans & Messaging](08-enterprise-beans-and-messaging.md)** 🟡 - `@Stateless` beans, scheduling, and asynchronous messaging.

**Part 3 - Production & beyond (🔴 Advanced → 🟢)**
9. **[Jakarta Security](09-jakarta-security.md)** 🔴 - authentication mechanisms, `@RolesAllowed`, and identity stores.
10. **[MicroProfile & Where to Go Next](10-microprofile-and-where-next.md)** 🟢 - cloud-native EE, how Quarkus/Helidon build on these specs, and what to build.

> Jakarta EE and Spring aren't enemies - they share DNA (Spring helped inspire CDI; both use JPA). Knowing
> the *standard* makes every Java framework, including Spring, easier to read.

---

[Phase 1: What Jakarta EE Is →](01-what-jakarta-ee-is.md)
