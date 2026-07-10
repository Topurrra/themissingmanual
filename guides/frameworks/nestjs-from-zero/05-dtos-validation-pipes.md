---
title: "DTOs, Validation & Pipes"
guide: "nestjs-from-zero"
phase: 5
summary: "Describe request bodies with DTO classes, annotate them with class-validator rules, and let the global ValidationPipe enforce them — auto-400 on bad input, zero validation code in your controllers."
tags: [nestjs, typescript, dto, validation, pipes]
difficulty: advanced
synonyms: ["nestjs dto", "nestjs validation", "nest class-validator", "nest ValidationPipe", "nest pipes", "nest ParseIntPipe", "nest PartialType"]
updated: 2026-07-10
---

# DTOs, Validation & Pipes

Back in [Phase 2](02-controllers-and-routing.md), `@Body()` handed you whatever JSON the client sent — typed as `any`, trusted blindly. That's fine in a demo and a disaster in production. A client can post `{ "title": 12345 }`, or `{ }`, or `{ "title": "x", "isAdmin": true }` trying to sneak in a field you never meant to accept. Somebody has to check.

The naive instinct is to write `if (!body.title) throw new BadRequestException(...)` at the top of every handler. Do that across twenty endpoints and your controllers turn into validation sludge, and the rules drift because nobody keeps twenty copies in sync.

Nest's answer is to make validation **declarative and automatic**. Here's the whole mental model, and it has three moving parts:

- A **DTO** (Data Transfer Object) is a **class** that describes the shape of the request body. One file, one source of truth.
- **class-validator decorators** on its fields are the *rules* — `@IsString()`, `@MaxLength(120)`, and friends.
- The **ValidationPipe** is the *enforcer*. It runs *before* your handler, reads those rules, and rejects anything that breaks them with an automatic **400 Bad Request**.

> 💡 A **pipe** in Nest is anything that transforms or validates a method's input before the handler runs. The ValidationPipe is the famous one, but you'll meet smaller built-in pipes (like `ParseIntPipe`) at the end of this phase. Same slot in the pipeline, smaller job.

Wire those three together and you write **no validation code in the controller at all**. Let's build it for the tasks API.

## Step 1 — Install the libraries

The DTO decorators and the engine that reads them live in two packages:

```bash
npm i class-validator class-transformer
```

*What just happened:* `class-validator` provides the `@IsString()` / `@IsNotEmpty()` / etc. decorators and the logic to check a value against them. `class-transformer` turns the plain JSON object Nest received into a real instance of your DTO class (validators need an *instance* to inspect, not a bare object). The ValidationPipe leans on both — install them or it'll throw an unhelpful error at startup.

## Step 2 — Write the CreateTaskDto

A DTO is an ordinary class where every field carries its validation rules as decorators:

```typescript
import { IsString, IsNotEmpty, IsOptional, IsBoolean, MaxLength } from 'class-validator';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  title: string;

  @IsOptional()
  @IsBoolean()
  done?: boolean;
}
```

*What just happened:* Read the decorators as a sentence. `title` **must** be a string (`@IsString`), **must not** be empty (`@IsNotEmpty`), and **must** be at most 120 characters (`@MaxLength(120)`). `done` is **optional** (`@IsOptional` — the `?` makes it optional in TypeScript, the decorator tells the validator "skip the rest of my rules if it's missing"), and *if present* must be a boolean. This class is now both your TypeScript type **and** your validation rulebook in one place — that's the whole point.

## Step 3 — Turn on the ValidationPipe globally

A DTO with rules does nothing on its own; something has to enforce it. Switch on the ValidationPipe for the entire app in `main.ts`:

```typescript
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.listen(3000);
}
bootstrap();
```

*What just happened:* `useGlobalPipes` installs the ValidationPipe in front of **every** handler in the app. From now on, any `@Body() dto: CreateTaskDto` is validated automatically before your code runs. The two options are your security defaults:

- `whitelist: true` — silently **strips** any property not declared on the DTO. Client sends `{ title: "Buy milk", isAdmin: true }`? Your handler receives `{ title: "Buy milk" }`. The junk never reaches your logic.
- `forbidNonWhitelisted: true` — go further and **reject** the request with a 400 if it contains unknown properties, instead of quietly dropping them. Loud failure beats silent surprise.

## Step 4 — Use the DTO in the controller

Now the controller method just *declares* the DTO type. No `if` statements, no manual checks:

```typescript
import { Body, Controller, Post } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';

@Controller('tasks')
export class TasksController {
  @Post()
  create(@Body() createTaskDto: CreateTaskDto) {
    // If we reach this line, createTaskDto is already valid.
    return { received: createTaskDto };
  }
}
```

*What just happened:* The ValidationPipe sees the `CreateTaskDto` type annotation on `@Body()`, builds an instance from the incoming JSON, runs its rules, and — only if everything passes — calls `create()`. A POST with `{ "title": "" }` never reaches your method: the pipe short-circuits it into a `400 Bad Request` with a message like `"title should not be empty"`, generated for you. Your handler body is pure business logic, exactly as it should be.

## ⚠️ The two gotchas that bite everyone

> ⚠️ **A DTO must be a `class`, not a TypeScript `interface`.**

This is the single most common "why isn't my validation running?" bug. Watch what *doesn't* work:

```typescript
// ❌ This compiles fine and validates NOTHING.
export interface CreateTaskDto {
  title: string;
  done?: boolean;
}
```

*What just happened:* TypeScript `interface`s are a *compile-time* construct — they're erased entirely when your code becomes JavaScript. At runtime there is no `CreateTaskDto` for the ValidationPipe to inspect, and decorators can't even attach to an interface. class-validator reads metadata off a real **class** that exists at runtime, so the rules vanish along with the interface. Use a `class`. Always. (If your editor ever suggests "convert to interface," say no.)

> ⚠️ **`whitelist` decides the fate of unknown properties — choose deliberately.**

With `whitelist: true` alone, extra fields are **stripped** (gone, no error). Add `forbidNonWhitelisted: true` and extra fields are **rejected** with a 400. Without either, a malicious or buggy client's extra fields flow straight into your handler. For most APIs, turn both on — it closes a real mass-assignment hole.

## Step 5 — `ParseIntPipe`: validating route params

DTOs cover the request *body*. But route params like `:id` arrive as **strings** (a URL is text), and you usually want a number. That's a job for a tiny built-in pipe:

```typescript
import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';

@Controller('tasks')
export class TasksController {
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    // id is a real number here, e.g. 42 — not "42"
    return { lookingUp: id };
  }
}
```

*What just happened:* `ParseIntPipe` sits between the route and your method. For `GET /tasks/42` it converts the string `"42"` into the number `42`, so `id` is genuinely typed and usable. For `GET /tasks/banana` it can't parse the value and throws an automatic **400** — your handler never runs. One pipe, both transformation and validation, no boilerplate. (Siblings: `ParseBoolPipe`, `ParseUUIDPipe`, and more.)

## Step 6 — `PartialType`: a DRY update DTO

Updating a task should accept the *same* fields as creating one, but all of them **optional** — a PATCH might change only the `title`. Rewriting the whole DTO with `@IsOptional()` on every field is duplication waiting to rot. Nest gives you a helper:

```typescript
import { PartialType } from '@nestjs/mapped-types';
import { CreateTaskDto } from './create-task.dto';

export class UpdateTaskDto extends PartialType(CreateTaskDto) {}
```

*What just happened:* `PartialType(CreateTaskDto)` generates a new class with **every field of `CreateTaskDto` made optional**, *keeping all the original validation rules*. So `title` stays "if present, a non-empty string ≤ 120 chars" — it's just no longer required. Your `UpdateTaskDto` is one line and can never drift out of sync with `CreateTaskDto`. Use it on your PATCH handler exactly like before: `@Body() updateTaskDto: UpdateTaskDto`.

> 💡 `PartialType` comes from `@nestjs/mapped-types`. If you're already using Swagger for API docs, import it from `@nestjs/swagger` instead — same behavior, plus it carries the field metadata into your generated docs. There's also `PickType`, `OmitType`, and `IntersectionType` in the same toolbox for composing DTOs.

You now have everything the tasks API needs to trust its inputs: `CreateTaskDto` and `UpdateTaskDto` guarded by a global ValidationPipe, and `ParseIntPipe` on the `:id` routes. In [Phase 6](06-building-a-rest-api.md) we'll plug these into a full resource — controller plus service — and the validation layer just quietly does its job.

## Recap

- A **DTO is a class** that describes the request body; **class-validator decorators** are its rules; the **ValidationPipe** enforces them before your handler runs — so controllers carry no validation code.
- Enable it once: `app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))`. Invalid input becomes an automatic **400** with messages.
- **`whitelist`** strips unknown properties; **`forbidNonWhitelisted`** rejects them — solid security defaults against mass-assignment.
- A DTO **must be a `class`, never an `interface`** — interfaces are erased at runtime, leaving nothing for the validator to read.
- **`ParseIntPipe`** turns a string `:id` into a number and 400s on garbage; **`PartialType(CreateTaskDto)`** builds a DRY update DTO with all fields optional but the same rules.
- Install the engine with `npm i class-validator class-transformer`.

## Quick check

```quiz
[
  {
    "q": "Why must a NestJS DTO be a class and not a TypeScript interface?",
    "choices": ["Classes are faster to instantiate", "Interfaces can't have a constructor", "Interfaces are erased at runtime, so class-validator has no metadata to read", "Nest only imports files that export classes"],
    "answer": 2,
    "explain": "Interfaces are a compile-time-only construct and vanish in the compiled JS. class-validator needs a real class (with decorator metadata) that exists at runtime."
  },
  {
    "q": "With the global ValidationPipe configured as { whitelist: true, forbidNonWhitelisted: true }, what happens to a request body containing a property not declared on the DTO?",
    "choices": ["It is silently stripped before the handler runs", "The request is rejected with a 400", "It is passed through unchanged", "The server returns a 500"],
    "answer": 1,
    "explain": "whitelist alone would strip the unknown property; adding forbidNonWhitelisted makes the pipe reject the request with a 400 instead."
  },
  {
    "q": "What does PartialType(CreateTaskDto) produce for an UpdateTaskDto?",
    "choices": ["A class with all of CreateTaskDto's fields made optional, keeping their validation rules", "A copy of CreateTaskDto with all validation removed", "An interface version of CreateTaskDto", "A DTO with only the required fields"],
    "answer": 0,
    "explain": "PartialType makes every inherited field optional while preserving the original class-validator rules, so the update DTO stays DRY and in sync."
  }
]
```

[← Phase 4: Modules](04-modules.md) · [Guide overview](_guide.md) · [Phase 6: Building a REST API →](06-building-a-rest-api.md)