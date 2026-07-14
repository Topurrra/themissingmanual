---
title: "Modules"
guide: "nestjs-from-zero"
phase: 4
summary: "Modules group a feature's controllers and providers; the app is a tree of modules rooted at AppModule. Learn @Module, imports/exports, and why providers are private by default."
tags: [nestjs, typescript, modules, imports, exports]
difficulty: intermediate
synonyms: ["nestjs module", "nest @Module", "nest imports exports", "nest feature module", "nest root module", "nestjs app structure"]
updated: 2026-07-10
---

# Modules

You've got a `TasksController` handling HTTP and a `TasksService` holding the logic, with Nest's DI container wiring one into the other. But something has to *introduce* them to the container in the first place - to say "these two belong together, here's the controller, here's the provider it depends on." That's a **module**.

Here's the mental model to hold onto: **a module groups a feature's controllers and providers into one cohesive unit, and your whole app is a tree of modules with a single root at the top - `AppModule`.** Every controller and provider lives inside exactly one module. Nest walks that tree on startup, reads each module's metadata, and builds the DI container from it. Once you see the app as a tree of feature modules rather than a pile of files, the structure stops feeling arbitrary and starts feeling like a map.

📝 This is the piece that separates a Nest app from a sprawling Express app. In Express, structure is a convention you hope everyone follows. In Nest, structure is enforced by the framework: a feature is a module, and the module declares exactly what it owns and what it shares.

## A module is a class with one decorator

A module is an ordinary class annotated with `@Module()`. The decorator takes a metadata object that tells Nest what's inside. Here's the `TasksModule` that owns our tasks feature:

```typescript
import { Module } from '@nestjs/common';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

@Module({
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule {}
```

*What just happened:* We declared a feature unit. `controllers: [TasksController]` tells Nest "this module handles these HTTP routes." `providers: [TasksService]` tells Nest "this module owns this injectable - instantiate it and make it available to anything in this module that asks for it." The class body is empty because a module is pure configuration; the decorator's metadata *is* the module. When Nest boots `TasksModule`, it creates one `TasksService` instance and injects it into the `TasksController` constructor, exactly as you saw in [Phase 3](03-providers-and-di.md).

## Wiring it into the root

A module on its own does nothing - Nest only knows about it if it's reachable from the root. The root module, conventionally `AppModule`, is the trunk of the tree. Other modules become branches by being listed in its `imports`:

```typescript
import { Module } from '@nestjs/common';
import { TasksModule } from './tasks/tasks.module';

@Module({
  imports: [TasksModule],
})
export class AppModule {}
```

*What just happened:* `AppModule` doesn't declare any controllers or providers of its own here - it's a composition root. By putting `TasksModule` in its `imports`, we attach the tasks feature to the tree. Now when you start the app, Nest finds `AppModule`, follows `imports` to `TasksModule`, registers its controller and provider, and your `/tasks` routes go live. Add a `UsersModule` later and you wire it the same way: build the feature module, then list it in the root's `imports`.

💡 You almost never write this wiring by hand. Running `nest g module tasks` scaffolds `tasks.module.ts` *and* adds it to `AppModule.imports` automatically. `nest g resource tasks` goes further - it generates the module, controller, service, and DTOs, and wires them all together. The CLI exists precisely so module plumbing stays correct as the app grows.

## The four metadata fields

Everything a module can declare lives in four arrays. You'll use all of them as your app grows:

- **`controllers`** - the controllers that belong to this module. Nest instantiates them and registers their routes.
- **`providers`** - the providers (services, etc.) Nest can instantiate and inject *within this module*. This is the module's private toolbox.
- **`imports`** - other modules whose **exported** providers this module needs. Importing a module pulls its public providers into scope here.
- **`exports`** - the subset of *this* module's providers that you want to make available to modules that import it. The public face of the module.

The first two say "what this module contains." The last two say "how this module connects to others." Most feature modules start with just `controllers` and `providers` - you reach for `imports` and `exports` the moment one feature needs another's service.

## ⚠️ Encapsulation: providers are private by default

This is the single most common source of "Nest can't resolve dependencies" errors, so slow down here. **A provider is private to its module unless you explicitly `export` it.** Listing a service in `providers` makes it injectable *inside that module only* - not anywhere else in the app, no matter how the tree is shaped.

Say `TasksModule` needs `UsersService` (maybe a task records who created it). It is not enough to import `UsersModule`. The provider has to cross *two* gates: `UsersModule` must declare it in `exports`, **and** `TasksModule` must declare `UsersModule` in `imports`. Both, or it fails.

```typescript
// users.module.ts - UsersService must be EXPORTED to escape the module
@Module({
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}

// tasks.module.ts - and TasksModule must IMPORT UsersModule to receive it
@Module({
  imports: [UsersModule],
  controllers: [TasksController],
  providers: [TasksService], // TasksService can now inject UsersService
})
export class TasksModule {}
```

*What just happened:* We opened the door on both sides. `UsersModule` publishes `UsersService` by putting it in `exports` - without that line, the service stays sealed inside `UsersModule` and no amount of importing will reach it. `TasksModule` then pulls in that public provider by listing `UsersModule` in `imports`. Now `TasksService`'s constructor can declare `private users: UsersService` and Nest resolves it. Forget the `exports` line and you get the classic error: *"Nest can't resolve dependencies of the TasksService (?). Please make sure that the argument UsersService ... is available."* The fix is almost always "I imported the module but forgot to export the provider," or vice versa.

⚠️ The error message is your friend here - it names the failing provider and the module it tried to resolve in. When you hit it, check the export side first (it's the more commonly forgotten one), then the import side. The module boundary is doing exactly what it's designed to do: keeping internals private until you choose to share them.

## Why this matters: boundaries that scale

📝 On a tiny app, modules can feel like ceremony. Their payoff shows up as the app grows. A real Nest backend is a handful of focused feature modules - a `TasksModule`, a `UsersModule`, an `AuthModule` - each owning its controllers and services, each exposing only what others legitimately need. That gives you clear boundaries: you can read one module and understand a whole feature without the rest of the app leaking in. When `AuthModule` exports an `AuthService` and three other modules import it, the dependency is explicit and traceable - not a global singleton that anything can grab. This is the discipline that keeps large Nest codebases navigable where bare Express apps sprawl into tangled `require` graphs. And because the CLI scaffolds each module for you, the structure stays consistent no matter who on the team adds the next feature.

## Recap

- A **module** is a class with `@Module()` that groups a feature's `controllers` and `providers` into one cohesive unit.
- The app is a **tree of modules** with a single **root** (`AppModule`); feature modules join the tree by appearing in another module's `imports`.
- The four metadata fields: **`controllers`** and **`providers`** say what a module *contains*; **`imports`** and **`exports`** say how it *connects* to other modules.
- **Encapsulation**: a provider is private to its module unless `export`ed. Cross-module use requires the provider in the owner's `exports` *and* the owner module in the consumer's `imports` - missing either causes the #1 "can't resolve dependencies" error.
- The CLI (`nest g module`, `nest g resource`) scaffolds modules and wires them into `AppModule` for you, keeping structure consistent as the app grows.

## Quick check

```quiz
[
  {
    "q": "What is the relationship between AppModule and feature modules like TasksModule?",
    "choices": ["They are unrelated and discovered automatically by file name", "AppModule is the root of a tree; feature modules join it via imports", "Feature modules import AppModule to gain access to it", "AppModule must list every provider from every feature module"],
    "answer": 1,
    "explain": "The app is a tree of modules with AppModule as the root. A feature module becomes part of the app by being listed in another module's imports (usually AppModule's)."
  },
  {
    "q": "TasksService needs to inject UsersService, which lives in UsersModule. What must be true?",
    "choices": ["Just add UsersService to TasksModule's providers array", "UsersModule must export UsersService AND TasksModule must import UsersModule", "Nothing - providers are globally available across all modules", "AppModule must export UsersService to all children"],
    "answer": 1,
    "explain": "Providers are private to their module. To share one, the owning module must list it in exports, and the consuming module must list the owning module in imports. Both gates are required."
  },
  {
    "q": "What do a module's `controllers` and `providers` fields declare?",
    "choices": ["Other modules this one depends on", "Which providers this module shares with importers", "The controllers and injectables this module contains and owns", "The HTTP routes exposed to the public internet"],
    "answer": 2,
    "explain": "controllers and providers list what the module *contains*. imports/exports handle connections to other modules; controllers/providers handle what's inside this one."
  }
]
```

---

[← Phase 3: Providers & Dependency Injection](03-providers-and-di.md) · [Guide overview](_guide.md) · [Phase 5: DTOs, Validation & Pipes →](05-dtos-validation-pipes.md)
