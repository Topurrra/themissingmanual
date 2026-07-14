---
title: "Providers & Dependency Injection"
guide: "nestjs-from-zero"
phase: 3
summary: "How Nest's @Injectable services hold your logic and how the IoC container wires them into controllers via constructor injection - thin controllers, swappable deps, and the startup errors when wiring breaks."
tags: [nestjs, typescript, providers, dependency-injection, injectable]
difficulty: intermediate
synonyms: ["nestjs providers", "nestjs dependency injection", "nest @Injectable", "nest constructor injection", "nestjs service", "nest IoC container"]
updated: 2026-07-10
---

# Providers & Dependency Injection

In Phase 2 you built a `TasksController` that did everything itself - held the array of tasks *and* handled the HTTP. That works for a demo and falls apart the moment the app grows. Here's the mental model that fixes it - the heart of how Nest is meant to be written.

**Controllers handle HTTP and delegate. Providers hold the logic. Dependency injection wires them together.**

Picture three roles. The controller is the receptionist: it greets the request, reads the URL and body, and hands the work off. The provider - almost always an `@Injectable()` **service** - is the specialist who actually does the work (business rules, data access, calculations). And the wiring between them? You don't do it by hand. You declare what you need as a **constructor parameter**, and Nest's container - its IoC ("Inversion of Control") container - builds the service and hands it to you. You never write `new TasksService()` yourself.

That last part trips people up at first, so sit with it: *you ask for the dependency by listing it in the constructor, and something else supplies it.* That inversion - the framework constructing your dependencies instead of you - is the whole game.

## Step one: pull the logic into a service

Let's split the Phase 2 controller. The data and behavior move into a service marked `@Injectable()`:

```typescript
import { Injectable } from '@nestjs/common';

@Injectable()
export class TasksService {
  private tasks = [];

  findAll() {
    return this.tasks;
  }

  create(title: string) {
    const task = { id: Date.now(), title, done: false };
    this.tasks.push(task);
    return task;
  }
}
```

*What just happened:* `@Injectable()` is the marker that tells Nest "this class can be managed by the container - you're allowed to inject it places." Inside, it's a plain TypeScript class holding the `tasks` array and two methods. No HTTP anywhere - no `@Get`, no `@Post`, no request objects. This class doesn't know or care that it's part of a web app, which is exactly the point: it's pure logic you could test or reuse on its own.

## Step two: inject it into the controller

Now the controller asks for the service and delegates to it:

```typescript
import { Controller, Get } from '@nestjs/common';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}   // injected by Nest

  @Get()
  findAll() {
    return this.tasksService.findAll();
  }
}
```

*What just happened:* The controller no longer owns any tasks. It declares one constructor parameter - `tasksService: TasksService` - and when Nest creates the controller, it sees that parameter, finds the `TasksService` instance it manages, and passes it in. The route handler shrank to a single line: read nothing, decide nothing, hand it to the service. That's a thin controller.

> 📝 The `private readonly tasksService: TasksService` in the constructor is TypeScript shorthand. Adding an access modifier (`private`, `public`, `readonly`) to a constructor parameter tells TS to both declare it as a field *and* assign it automatically. Without the shorthand you'd write `this.tasksService = tasksService` by hand. So one line declares the dependency, stores it as `this.tasksService`, and makes it read-only - all at once.

## Step three: register the provider (or Nest can't find it)

There's one piece that makes the magic work, and people forget it. For Nest to inject `TasksService`, the service has to be listed in a module's **`providers`** array. A module is the next phase's topic, but here's the shape so the picture is complete:

```typescript
import { Module } from '@nestjs/common';

@Module({
  controllers: [TasksController],
  providers: [TasksService],   // ← this is what makes TasksService injectable
})
export class TasksModule {}
```

*What just happened:* The `providers` array is the registry. When Nest boots, it reads this module, sees `TasksService` listed, constructs exactly one instance, and stores it in the container - ready to hand to anyone who asks for it in a constructor. Leave `TasksService` out of this array and the `@Injectable()` decorator alone won't save you: Nest won't know the service exists. (Full module mechanics - imports, exports, sharing providers across modules - come in [Phase 4](04-modules.md).)

## Scopes: one instance, shared by default

How many `TasksService` objects exist? By default: **exactly one**, for the whole application's lifetime. Providers are **singletons**. Every controller or other provider that injects `TasksService` gets the *same* instance - which is why the `tasks` array persists across requests in our demo. This is efficient (build it once) and it's the right default for the overwhelming majority of services.

Occasionally you need a fresh instance per HTTP request - say, a service that holds data specific to the current user's request and must not leak into another. For that there's request scope:

```typescript
import { Injectable, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.REQUEST })
export class RequestScopedService {
  // a new instance is created for every incoming request
}
```

*What just happened:* `Scope.REQUEST` tells Nest to construct a new instance per request instead of reusing one singleton. It's genuinely useful in narrow cases, but it's slower (Nest has to build the instance, and everything that depends on it, on every request) and you rarely need it. ⚠️ Reach for it only when you have a concrete reason; default to the singleton.

## Why bother? Swappable dependencies

Here's the payoff that makes DI worth the ceremony. Because the controller depends on the *class* `TasksService` rather than constructing one itself, you can hand it a *different* object that fits the same shape. In a test, you swap in a fake `TasksService` that returns canned data - no real database, no real state - and verify the controller behaves correctly in isolation. The controller can't tell the difference, because it never knew where its dependency came from in the first place.

> 💡 That's the real reason dependency injection exists: it decouples "what I need" from "who builds it," which is what makes code testable and changeable. It's the same DI you'd recognize from [Spring Boot](/guides/spring-boot-from-zero) and [ASP.NET Core](/guides/aspnet-core-from-zero) - different language, identical idea. We'll lean on exactly this swap-in-a-fake trick when we write tests in [Phase 8](08-testing-and-production.md).

## When the wiring breaks

You will eventually see this at startup:

```
Nest can't resolve dependencies of the TasksController (?).
Please make sure that the argument TasksService at index [0]
is available in the TasksModule context.
```

⚠️ This is Nest telling you it tried to build something and couldn't find one of its constructor dependencies. The usual cause is the one from step three: the provider isn't in any module's `providers` array (or isn't exported from the module it lives in, or two providers depend on each other in a circle). Don't panic at the wall of text - **read it**. It names the class it was building, and it names the dependency it couldn't resolve. Nine times out of ten the fix is "add the missing provider to `providers`." The error is doing you a favor by failing loudly at boot instead of silently at runtime.

## Recap

- A **provider** is a class - usually an `@Injectable()` **service** - that holds business logic and data access, kept separate from the controller so controllers stay thin (HTTP only).
- **Dependency injection** means you declare a dependency as a **constructor parameter** and Nest's IoC container builds and supplies it. You never `new` your dependencies.
- The `private readonly x: T` constructor shorthand both declares the dependency and stores it as a field in one line.
- A provider must be listed in a module's **`providers`** array, or Nest can't inject it.
- Providers are **singletons by default** (one shared instance) - the right default; `Scope.REQUEST` gives a per-request instance for the rare cases that need it.
- DI makes dependencies **swappable**, which is what makes controllers testable - the same idea you've seen in Spring and ASP.NET. A "Nest can't resolve dependencies of…" error at startup names the exact provider that's missing.

## Quick check

Three quick ones to make sure the core idea stuck:

```quiz
[
  {
    "q": "What makes TasksService eligible to be injected into a controller?",
    "choices": ["Calling new TasksService() in the controller", "Marking it @Injectable() and listing it in a module's providers array", "Exporting it as a default export", "Adding @Get() to its methods"],
    "answer": 1,
    "explain": "@Injectable() marks the class as manageable by the container, and listing it in a module's providers array is what actually registers it so Nest can resolve and inject it."
  },
  {
    "q": "How many instances of a default-scoped provider does Nest create for the whole app?",
    "choices": ["One per request", "One per controller that injects it", "Exactly one, shared application-wide (singleton)", "One per route handler call"],
    "answer": 2,
    "explain": "Providers are singletons by default: Nest builds one instance and shares it everywhere it's injected. Scope.REQUEST is the opt-in for per-request instances."
  },
  {
    "q": "You get 'Nest can't resolve dependencies of the TasksController' at startup. What's the most likely fix?",
    "choices": ["Rename the controller", "Add the missing provider to a module's providers array", "Remove the constructor parameter", "Switch the provider to Scope.REQUEST"],
    "answer": 1,
    "explain": "That error means a constructor dependency couldn't be found in the module context. The usual cause is a provider missing from the providers array; the message names which one."
  }
]
```

---

[← Phase 2: Controllers & Routing](02-controllers-and-routing.md) · [Guide overview](_guide.md) · [Phase 4: Modules →](04-modules.md)
