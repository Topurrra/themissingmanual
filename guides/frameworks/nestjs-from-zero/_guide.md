---
title: "NestJS From Zero"
guide: "nestjs-from-zero"
phase: 0
summary: "Learn the opinionated, TypeScript-first Node framework for structured backends: controllers and routing, providers and dependency injection, modules, DTOs and validation pipes, building a REST API with a service layer, guards and interceptors and middleware, and testing and production. Angular-style architecture over Express or Fastify."
tags: [nestjs, typescript, nodejs, web, framework, rest, api, dependency-injection]
category: frameworks
order: 35
group: "JavaScript"
difficulty: intermediate
synonyms: ["learn nestjs", "nestjs tutorial", "nest js rest api", "nestjs controllers providers", "nestjs dependency injection", "nestjs modules", "nestjs dto validation pipes", "nestjs vs express"]
updated: 2026-06-23
---

# NestJS From Zero

NestJS is what you reach for when an [Express](/guides/express-from-zero) app grows up and the "middleware
soup" starts to hurt. It's an **opinionated, TypeScript-first** framework that brings a real architecture to
Node backends - borrowed, openly, from Angular: modules, controllers, providers, decorators, and a proper
dependency-injection container. Under the hood it runs on Express (or Fastify) but adds the structure and
conventions that keep large teams and large codebases sane. If you like strong typing and a place for
everything, Nest is the Node framework for you.

The mental model is three roles wired by DI. A **controller** handles HTTP - its methods are decorated with
`@Get()`/`@Post()` and map requests to responses. A **provider** (usually a `@Injectable()` service) holds
business logic and is **injected** into controllers (and other providers) by Nest's container - you never
`new` your dependencies. A **module** (`@Module()`) groups related controllers and providers and declares
what it exposes, so the app is a tree of modules. Hold "controllers handle HTTP, providers hold logic, DI
wires them, modules group them," and Nest's decorators stop looking like magic and become a clear structure.

> 📝 This teaches the **framework** - it assumes **TypeScript**: types, classes, decorators, generics
> ([TypeScript From Zero](/guides/typescript-from-zero)) on top of JavaScript/Node. It's most useful read
> after [Express](/guides/express-from-zero) (which it runs on and improves upon); the DI + decorator style
> echoes [Spring Boot](/guides/spring-boot-from-zero) and [ASP.NET Core](/guides/aspnet-core-from-zero).
> Nest runs on Node, so examples are shown with the commands to run them.

## How to read this

Read in order - it grows one service (a small **tasks API**) from a single controller to a structured,
tested, deployable REST API. Phases carry difficulty badges.

## The phases

**Part 1 - The building blocks (🟢 → 🟡)**
1. **[What NestJS Is & Your First App](01-what-nestjs-is.md)** 🟢 - the architecture, the CLI, and a running app.
2. **[Controllers & Routing](02-controllers-and-routing.md)** 🟡 - `@Controller`, route decorators, params, and responses.
3. **[Providers & Dependency Injection](03-providers-and-di.md)** 🟡 - `@Injectable` services and how Nest injects them.
4. **[Modules](04-modules.md)** 🟡 - `@Module`, imports/exports, and organizing the app.

**Part 2 - A real API (🟡 → 🔴)**
5. **[DTOs, Validation & Pipes](05-dtos-validation-pipes.md)** 🔴 - typed request bodies, `class-validator`, and the ValidationPipe.
6. **[Building a REST API](06-building-a-rest-api.md)** 🟡 - a full resource: controller + service + DTOs.
7. **[Guards, Interceptors & Middleware](07-guards-interceptors-middleware.md)** 🔴 - auth guards, the request pipeline, and cross-cutting logic.

**Part 3 - Ship it (🟡 → 🟢)**
8. **[Testing & Production](08-testing-and-production.md)** 🟡 - unit tests with the DI test module, e2e tests, and deployment.
9. **[Where to Go Next](09-where-to-go-next.md)** 🟢 - Nest vs Express/Fastify, TypeORM/Prisma, microservices, and what to build.

> The throughline: **controllers handle HTTP, providers hold logic, dependency injection wires them, and
> modules group them.** That structure is why Nest scales where bare Express sprawls.

---

[Phase 1: What NestJS Is & Your First App →](01-what-nestjs-is.md)
