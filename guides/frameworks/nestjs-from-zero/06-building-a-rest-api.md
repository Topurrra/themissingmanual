---
title: "Building a REST API"
guide: "nestjs-from-zero"
phase: 6
summary: "Assemble the whole tasks resource — thin controller, service with the logic and store, DTOs for input, module for wiring — into full CRUD, throwing built-in HTTP exceptions that auto-map to status codes."
tags: [nestjs, typescript, rest, api, crud]
difficulty: intermediate
synonyms: ["nestjs rest api", "nestjs crud", "nest resource", "nest controller service crud", "nestjs NotFoundException", "nest g resource"]
updated: 2026-07-10
---

# Building a REST API

This is the payoff phase. For five phases you've been collecting parts: a controller that handles HTTP ([Phase 2](02-controllers-and-routing.md)), a service that holds logic and gets injected ([Phase 3](03-providers-and-di.md)), a module that wires them together ([Phase 4](04-modules.md)), and DTOs with a ValidationPipe that guard the input ([Phase 5](05-dtos-validation-pipes.md)) — now we snap them into one complete, working resource.

Here's the mental model for a REST resource in Nest, and it's the same shape for every resource you'll ever build:

**A thin controller maps routes to method calls → a service holds the data and the logic → DTOs type the input → a module wires it all → and you throw HTTP exceptions for the error cases.**

That's the whole thing. The controller decides nothing; it reads the request and delegates. The service is where the work lives. When something goes wrong — a task that doesn't exist, say — you don't hand-craft a 404 response; you `throw` a built-in exception and Nest renders it for you.

> 📝 You don't have to assemble this by hand every time. `nest g resource tasks` scaffolds exactly this layout — controller, service, DTOs, module, and CRUD method stubs — in one command. We're building it manually here so you can see every piece and *why* it's there; once you understand it, let the generator do the typing.

## The service: where the data and logic live

Start with the service, because it's the heart of the resource. It owns an in-memory store and the five CRUD operations. For the error cases, it throws Nest's built-in HTTP exceptions:

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

export interface Task {
  id: number;
  title: string;
  done: boolean;
}

@Injectable()
export class TasksService {
  private tasks: Task[] = [];
  private nextId = 1;

  findAll() {
    return this.tasks;
  }

  findOne(id: number) {
    const task = this.tasks.find((t) => t.id === id);
    if (!task) throw new NotFoundException(`Task ${id} not found`); // → 404 automatically
    return task;
  }

  create(dto: CreateTaskDto) {
    const task = { id: this.nextId++, ...dto, done: dto.done ?? false };
    this.tasks.push(task);
    return task;
  }

  update(id: number, dto: UpdateTaskDto) {
    const task = this.findOne(id); // reuses the 404 throw above
    Object.assign(task, dto);
    return task;
  }

  remove(id: number) {
    const index = this.tasks.findIndex((t) => t.id === id);
    if (index === -1) throw new NotFoundException(`Task ${id} not found`);
    this.tasks.splice(index, 1);
  }
}
```

*What just happened:* The service is pure logic with zero HTTP knowledge — no `@Get`, no request objects, exactly as Phase 3 promised. `findOne` is the piece to study: when the task isn't there, it `throw`s a `NotFoundException` instead of returning `null` or fabricating a response object. That throw is doing real work — Nest catches it and turns it into a `404 Not Found` with a clean JSON body, automatically. Notice `update` *reuses* `findOne`, so the "not found" rule lives in exactly one place. The `nextId` counter hands out simple ascending ids, and `done: dto.done ?? false` defaults the optional flag. This store is a stand-in for a real database — swap it for TypeORM or Prisma later (more on that below).

## The controller: thin routing to the service

Now the controller. Its only job is to map each HTTP route to a service call, lean on the pipes and DTOs from Phase 5, and pick the right status code:

```typescript
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Get()
  findAll() {
    return this.tasks.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tasks.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateTaskDto) {
    return this.tasks.create(dto); // 201 Created by default on POST
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTaskDto) {
    return this.tasks.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseIntPipe) id: number) {
    this.tasks.remove(id);
  }
}
```

*What just happened:* Every handler is one line, because every decision was made elsewhere. `@Param('id', ParseIntPipe)` turns the URL string `"42"` into the number `42` (and 400s on garbage); `@Body() dto: CreateTaskDto` arrives already validated by the global ValidationPipe — so the controller trusts its inputs without a single `if`. Two status-code details matter: a `@Post()` returns **201 Created** automatically (Nest knows POST means "made something new"), and `@HttpCode(204)` overrides the default on `@Delete` to return **204 No Content** — the correct "done, nothing to send back" status. The constructor injection (`private readonly tasks: TasksService`) is the Phase 3 wiring; the controller never `new`s the service.

## The module: wiring it together

Neither class does anything until a module registers them. This is the Phase 4 piece:

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

*What just happened:* `controllers` registers the route handlers; `providers` registers `TasksService` so the DI container can build it and inject it into the controller. Leave `TasksService` out of `providers` and you'd hit that "Nest can't resolve dependencies of the TasksController" error from Phase 3. Import this `TasksModule` into your `AppModule` and the resource is live.

## Driving it with curl

With the app running (`npm run start:dev` from [Phase 1](01-what-nestjs-is.md)), here's the full resource in action. First, create a task:

```bash
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "Buy milk"}'
```

```
HTTP/1.1 201 Created
{"id":1,"title":"Buy milk","done":false}
```

*What just happened:* The POST returned **201**, not 200 — that's Nest's default for `@Post`, signalling a resource was created. The body came back with the server-assigned `id` and the defaulted `done: false`. The ValidationPipe checked `{"title": "Buy milk"}` against `CreateTaskDto` and let it through.

Now ask for a task that doesn't exist:

```bash
curl -i http://localhost:3000/tasks/999
```

```
HTTP/1.1 404 Not Found
{"statusCode":404,"message":"Task 999 not found","error":"Not Found"}
```

*What just happened:* This is the `throw new NotFoundException(...)` from the service, rendered. You wrote one line — `throw` — and Nest produced the correct status code *and* a structured JSON error body with your message. You never touched a response object.

And here's what a bad request body looks like, courtesy of the Phase 5 ValidationPipe:

```bash
curl -i -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": ""}'
```

```
HTTP/1.1 400 Bad Request
{"statusCode":400,"message":["title should not be empty"],"error":"Bad Request"}
```

*What just happened:* The empty `title` violated `@IsNotEmpty()` on the DTO, so the pipe rejected the request with a **400** before `create()` ever ran — and the message names exactly which rule failed. The controller stayed blissfully ignorant; validation happened in the pipeline. Finally, `curl -i -X DELETE http://localhost:3000/tasks/1` returns a bare `204 No Content` with no body, exactly as `@HttpCode(204)` specified.

## The two ideas to carry forward

> 💡 **Built-in HTTP exceptions auto-map to the right status code and a JSON body — you throw, Nest renders.** `NotFoundException` → 404, `BadRequestException` → 400, `ForbiddenException` → 403, `UnauthorizedException` → 401, `ConflictException` → 409, and more. Reach for the named exception that fits the situation and stop thinking about response objects; the framework handles the HTTP translation.

> 💡 **The in-memory array is a database stand-in.** It's perfect for learning and prototyping, but it forgets everything on restart and won't survive more than one server process. The beauty of the service layer is that swapping it out is a *contained* change: the controller, DTOs, and module don't move — you replace the array and the CRUD bodies inside `TasksService` with real persistence. That's where an ORM comes in: see [how an ORM works](/guides/how-an-orm-works), then wire in TypeORM or Prisma.

You've now built a complete REST resource the way Nest intends: thin controller, logic-holding service, validated DTOs, a module that wires it, and exceptions that turn into proper HTTP responses. Every resource you build follows this exact template. In [Phase 7](07-guards-interceptors-middleware.md) we'll wrap cross-cutting concerns — auth, logging, request transformation — around this pipeline without touching the resource itself.

## Recap

- A REST resource is a **thin controller** (routes → calls) over a **service** (data + logic), with **DTOs** typing the input and a **module** wiring it — the same shape for every resource.
- The service owns the store and the CRUD methods, and **throws built-in HTTP exceptions** (like `NotFoundException`) for error cases instead of crafting responses by hand.
- The controller delegates in one-line handlers, using `@Param('id', ParseIntPipe)` and validated `@Body() dto`, returning **201** on POST and **204** on DELETE (via `@HttpCode(204)`).
- Built-in exceptions **auto-map to status + JSON**: `throw` the right one and Nest renders the response — `NotFoundException` → 404, `BadRequestException` → 400, and so on.
- `nest g resource tasks` scaffolds this entire layout in one command once you understand the pieces.
- The in-memory array is a **database stand-in**; swapping it for TypeORM/Prisma ([how an ORM works](/guides/how-an-orm-works)) is contained to the service, leaving the controller, DTOs, and module untouched.

## Quick check

```quiz
[
  {
    "q": "In the TasksService, what happens when findOne is called with an id that isn't in the store?",
    "choices": ["It returns null and the controller must build a 404", "It throws NotFoundException, which Nest auto-maps to a 404 response", "It returns an empty array", "It throws a generic Error that becomes a 500"],
    "answer": 1,
    "explain": "The service throws NotFoundException; Nest catches built-in HTTP exceptions and renders the correct status code (404) plus a JSON error body automatically."
  },
  {
    "q": "Why is the @HttpCode(204) decorator added to the remove() handler?",
    "choices": ["To make DELETE return 200 with the deleted task", "To override the default and return 204 No Content, the right status for a successful delete with no body", "To validate the id parameter", "To register the route in the module"],
    "answer": 1,
    "explain": "DELETE that succeeds with nothing to return should respond 204 No Content. @HttpCode(204) overrides Nest's default 200 for that handler."
  },
  {
    "q": "What stays the same when you later replace the in-memory array with a real database via an ORM?",
    "choices": ["Nothing — every layer must be rewritten", "The controller, DTOs, and module; only the service's store and CRUD bodies change", "Only the module changes", "The DTOs must be converted to interfaces"],
    "answer": 1,
    "explain": "The service layer contains the change: the controller, DTOs, and module don't move. You swap the array and the CRUD method bodies inside TasksService for real persistence."
  }
]
```

---

[← Phase 5: DTOs, Validation & Pipes](05-dtos-validation-pipes.md) · [Guide overview](_guide.md) · [Phase 7: Guards, Interceptors & Middleware →](07-guards-interceptors-middleware.md)