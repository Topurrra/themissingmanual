---
title: "What NestJS Is & Your First App"
guide: "nestjs-from-zero"
phase: 1
summary: "NestJS brings real architecture to Node — controllers, providers, dependency injection, and modules wired by decorators. Scaffold an app with the CLI, read main.ts, and serve your first JSON route."
tags: [nestjs, typescript, nodejs, web, getting-started]
difficulty: beginner
synonyms: ["what is nestjs", "nestjs first app", "nest new", "nestjs architecture", "nestjs controllers providers modules", "nest cli"]
updated: 2026-06-23
---

# What NestJS Is & Your First App

Picture a small [Express](/guides/express-from-zero) app you wrote six months ago. One file. A few routes. Lovely. Now picture that same app today, after it grew: route handlers calling helper functions calling other helpers, middleware stacked five deep, business logic smeared across files because there was never an obvious place to put it. That's "middleware soup," and once an app gets big enough, it stops being fun. You spend more time finding where things live than writing them.

NestJS is the framework you reach for when you want that problem to never start. It's an **opinionated, TypeScript-first** Node framework that brings a real, enforced structure to your backend — borrowed openly from Angular. And here's the part that surprises people: it doesn't throw Express away. By default Nest runs *on top of* Express (you can swap in Fastify via an adapter later), so everything you know about Express is still true underneath. Nest adds the architecture on top.

If the idea of "a framework that takes over the structure of your app" feels abstract, that's exactly the inversion of control from [/guides/what-a-framework-even-is](/guides/what-a-framework-even-is) — your code stops being in charge and starts filling in slots the framework defines. And if you've seen [Spring Boot](/guides/spring-boot-from-zero) or ASP.NET, Nest's whole DI-and-decorators style will feel like coming home; it's the same idea, in TypeScript.

## The mental model: four roles, wired by decorators

Before any code, plant this — it's the single thing that makes Nest stop looking like magic. Everything in a Nest app is one of four roles:

💡 **Controllers handle HTTP. Providers hold logic. Dependency injection wires them together. Modules group them.**

Read that again, because the entire framework is an elaboration of that one sentence. A **controller** is the part that touches the web — it receives a request and returns a response. A **provider** (usually an `@Injectable()` service) holds the actual business logic, kept deliberately separate from the HTTP layer so it stays testable and reusable. **Dependency injection** is how a controller gets hold of the providers it needs — you never write `new SomeService()` yourself; Nest constructs and hands them to you. And a **module** (`@Module()`) is a box that groups related controllers and providers, so a big app becomes a tidy tree of modules instead of one sprawling pile.

📝 The way you *declare* which role a class plays is with **decorators** — `@Controller`, `@Get`, `@Injectable`, `@Module`. A decorator is the `@Something` you write just above a class or method; think of it as a label that tells Nest "treat this thing as *this kind* of thing." Those four roles are the spine of this whole guide. You'll meet controllers properly in Phase 2, providers and DI in Phase 3, and modules in Phase 4. For now, just hold the sentence.

## Scaffolding your first app

You don't build a Nest project by hand — there's a CLI that does the boring setup for you, including the TypeScript and decorator configuration Nest needs to run at all.

First, install the CLI globally, then generate a project:

```bash
npm i -g @nestjs/cli
nest new my-app
```

*What just happened:* the first line installs `@nestjs/cli` so the `nest` command is available everywhere on your machine. The second line scaffolds a brand-new project in a folder called `my-app` — it asks which package manager you want, then creates the folder structure, installs dependencies, wires up TypeScript with decorators enabled, and drops in a tiny working app. You went from nothing to a runnable backend without writing a line of code.

Open the `src/` folder and you'll find a handful of files that map directly onto the mental model:

- `main.ts` — the **bootstrap** file; the entry point that starts everything.
- `app.module.ts` — the root `AppModule` that groups the app together.
- `app.controller.ts` — an `AppController` (the HTTP layer).
- `app.service.ts` — an `AppService` (a provider holding logic).

That's the four roles, already laid out for you in a fresh project. Now start the dev server from inside the folder:

```bash
cd my-app
npm run start:dev
```

*What just happened:* `start:dev` runs Nest in watch mode — it compiles your TypeScript, starts the server (on port 3000 by default), and then *re-runs automatically* every time you save a file. Leave this running in a terminal while you work and you get instant feedback on every change.

## How an app actually boots

Open `main.ts` and you'll see the whole startup in a few lines. This is worth reading slowly, because it's the one place your code is still in charge before the framework takes over:

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}
bootstrap();
```

*What just happened:* `NestFactory.create(AppModule)` is the moment the framework wakes up. You hand it your root module, and Nest walks that module's tree — discovering every controller and provider, constructing them, and wiring all the dependency injection — then returns a fully assembled `app`. `app.listen(3000)` starts the HTTP server (the Express server, underneath) on port 3000. After `bootstrap()` runs, your code is no longer driving: Nest is listening for requests and will call back into *your* controllers when they arrive. That handoff is inversion of control in the flesh — `main.ts` is the last moment you're holding the wheel.

## Your first route

Now let's make the app actually respond to something of our own. Here's a controller that serves a list of tasks:

```typescript
import { Controller, Get } from '@nestjs/common';

@Controller('tasks')
export class TasksController {
  @Get()
  findAll() {
    return [{ id: 1, title: 'Learn Nest', done: false }];   // auto-serialized to JSON
  }
}
```

*What just happened:* `@Controller('tasks')` labels this class as the HTTP handler for the `/tasks` URL — that string is the route prefix. Inside it, `@Get()` marks `findAll()` as the method that runs when a `GET /tasks` request comes in. And notice what `findAll` *returns*: a plain JavaScript array. You didn't open a socket, parse a request, set a `Content-Type` header, or call `JSON.stringify`. Nest takes whatever you return and serializes it to JSON automatically, with a `200` status. You described *which URL runs which method, and what it gives back* — the framework owns everything around that. That's the controller role from the mental model, doing exactly its one job: handling HTTP.

⚠️ This is TypeScript, and Nest leans hard on it — specifically on **decorators**, which require `experimentalDecorators` and `emitDecoratorMetadata` turned on in the TypeScript config. The good news: `nest new` already set all of that up, so you don't have to touch it. But if you ever try to hand-roll a Nest project and get cryptic "decorators are not valid here" errors, that missing config is almost always why. If types, classes, and decorators feel shaky, spend a little time in [/guides/typescript-from-zero](/guides/typescript-from-zero) first — the rest of this guide assumes them.

## Our running example: a tasks API

You may have noticed the tasks theme. That's deliberate. Across this whole guide we'll grow one small, real service: a **tasks API**, where each task is shaped like `{ id, title, done }`. We'll start exactly where we are now — a controller returning a hard-coded array — and phase by phase turn it into a properly structured REST API: real routes and parameters (Phase 2), a service holding the logic (Phase 3), modules organizing it all (Phase 4), validated request bodies (Phase 5), and beyond. Every new Nest concept will land on this same example, so by the end you won't just know the pieces — you'll have watched them assemble into something you'd actually ship.

## Recap

- **NestJS is an opinionated, TypeScript-first Node framework** that brings Angular-style architecture to your backend. It runs *on top of* Express by default (Fastify optional), so Express isn't replaced — it's structured.
- **The whole framework is four roles:** controllers handle HTTP, providers hold logic, dependency injection wires them, and modules group them. Decorators (`@Controller`, `@Get`, `@Injectable`, `@Module`) are how you declare each role.
- **The CLI does the setup.** `npm i -g @nestjs/cli` then `nest new my-app` scaffolds the project (with TypeScript + decorators configured), and `npm run start:dev` runs it in watch mode on port 3000.
- **`main.ts` is the bootstrap.** `NestFactory.create(AppModule)` assembles the app from your module tree, and `app.listen(3000)` starts the server — the point where control passes from your code to the framework.
- **A controller maps a URL to a return value.** `@Controller('tasks')` + `@Get()` + a method that returns an object or array gets auto-serialized to JSON for you.

## Quick check

Make sure the mental model stuck before moving on:

```quiz
[
  {
    "q": "What does NestJS run on top of by default?",
    "choices": [
      "Its own from-scratch HTTP server that replaces Node's",
      "Express (with Fastify available as an alternative adapter)",
      "A browser engine",
      "Django"
    ],
    "answer": 1,
    "explain": "Nest runs on Express by default and adds architecture on top; you can swap in Fastify via an adapter. It doesn't replace Express — it structures it."
  },
  {
    "q": "In Nest's mental model, which role holds the business logic, kept separate from the HTTP layer?",
    "choices": [
      "The controller",
      "The module",
      "A provider (usually an @Injectable service)",
      "main.ts"
    ],
    "answer": 2,
    "explain": "Controllers handle HTTP, providers hold logic, DI wires them, and modules group them. Logic lives in providers so it stays testable and reusable."
  },
  {
    "q": "What happens when a controller method returns a plain object or array?",
    "choices": [
      "Nothing — you must call JSON.stringify and set headers yourself",
      "Nest auto-serializes it to JSON and sends it as the response body",
      "It throws an error because handlers must return strings",
      "It's logged to the console but never sent to the client"
    ],
    "answer": 1,
    "explain": "Nest serializes whatever a handler returns to JSON automatically with a 200 status — you don't touch sockets, headers, or stringify."
  }
]
```

---

[Guide overview](_guide.md) · [Phase 2: Controllers & Routing →](02-controllers-and-routing.md)
