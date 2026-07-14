---
title: "Controllers & Routing"
guide: "nestjs-from-zero"
phase: 2
summary: "How controllers map HTTP requests to methods: @Controller base paths, route decorators, parameter decorators for params/query/body, and returning values that Nest auto-serializes to JSON."
tags: [nestjs, typescript, controllers, routing, decorators]
difficulty: intermediate
synonyms: ["nestjs controller", "nestjs routing", "nest @Get @Post", "nest @Param @Query @Body", "nestjs route decorators", "nest http methods"]
updated: 2026-07-10
---

# Controllers & Routing

In Phase 1 you got an app running and saw a controller answer a request. Now let's look closely at the thing doing the answering: once it clicks, the rest of Nest stops feeling like a pile of decorators and starts feeling like a layout you can predict.

## The mental model: a controller is a class of routes

Here's the one idea to hold onto: **a controller is a plain class whose methods are routes.** That's it. The class says "I'm in charge of this slice of the URL space." Each method says "I handle this HTTP verb on this sub-path." The decorators are just labels Nest reads to wire the method to a URL.

If you've written [Express](/guides/express-from-zero), you've done this with `app.get('/tasks', handler)`. Nest is the same routing - it literally runs on Express underneath - but instead of registering handlers by hand, you describe them with decorators and let Nest do the registration. The payoff is structure: related routes live together in one named class, and there's an obvious place for every endpoint.

> 📝 A second idea rides along with the first: **parameter decorators inject the pieces of the request you ask for.** You don't reach into a big `req` object and dig out `req.params.id` - you write `@Param('id') id: string` and Nest hands you exactly that. The request gets disassembled into the arguments you declared.

We'll build these ideas around the **tasks API** we're growing through this guide. A task is just `{ id, title, done }`. By the end of the guide it'll have a real service and database behind it; for now we're focused on the HTTP shell - the controller - so the method bodies will stay sketchy on purpose.

## `@Controller` and the route decorators

`@Controller('tasks')` declares a controller whose base path is `/tasks`. Every route method inside it is relative to that base. The method decorators - `@Get()`, `@Post()`, `@Put(':id')`, `@Patch(':id')`, `@Delete(':id')` - name the HTTP verb, and their argument is the **sub-path** appended to the base.

```typescript
import { Controller, Get, Post, Put, Patch, Delete } from '@nestjs/common';

@Controller('tasks')
export class TasksController {
  @Get()              // GET    /tasks
  findAll() { /* ... */ }

  @Get(':id')         // GET    /tasks/:id
  findOne() { /* ... */ }

  @Post()             // POST   /tasks
  create() { /* ... */ }

  @Patch(':id')       // PATCH  /tasks/:id
  update() { /* ... */ }

  @Delete(':id')      // DELETE /tasks/:id
  remove() { /* ... */ }
}
```

*What just happened:* the `'tasks'` on `@Controller` set the base path once, and each method decorator added a verb plus an optional sub-path. `@Get()` with no argument means "the base path itself" (`/tasks`), while `@Get(':id')` adds a route parameter to get `/tasks/:id`. The same `:id` sub-path shows up on `@Patch`, `@Delete`, and `@Put` because they all act on a single task by its id - that's the standard REST shape, and Nest just made it readable.

> ⚠️ Two methods that resolve to the same verb **and** the same path will collide - Nest matches in declaration order, so the first one wins and the second silently never runs. If a route "isn't being hit," check for a duplicate (and remember `@Get(':id')` will happily match `/tasks/anything`, so order your literal routes before your `:id` route when paths could overlap).

## Parameter decorators: pulling the request apart

A route method usually needs *something* from the request - which task id, what query filter, what body to save. Parameter decorators inject exactly those pieces:

- `@Param('id') id: string` - a route parameter from the path (`:id`).
- `@Query('done') done: string` - a single query-string value (`?done=true`).
- `@Body() body: CreateTaskDto` - the parsed request body.
- `@Headers('authorization') auth: string` - a request header.

```typescript
import { Controller, Get, Post, Param, Query, Body } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';

@Controller('tasks')
export class TasksController {
  @Get()
  findAll(@Query('done') done?: string) {
    // GET /tasks?done=true  →  done === 'true'
    return `all tasks, filtered by done=${done}`;
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    // GET /tasks/42  →  id === '42'  (a string!)
    return `one task with id ${id}`;
  }

  @Post()
  create(@Body() body: CreateTaskDto) {
    // POST /tasks  with a JSON body
    return body;
  }
}
```

*What just happened:* each decorated argument grabbed one slice of the incoming request. `@Query('done')` read `?done=...`, `@Param('id')` read the `:id` segment, and `@Body()` (with no argument) handed over the whole parsed JSON body. Notice `findOne` returns the value straight away - no response object in sight - and `create` echoes the body back. We typed the body as `CreateTaskDto`; that's a class describing the expected shape, which we'll define and *validate* properly in [Phase 5](05-dtos-validation-pipes.md). For now it's just a type annotation.

> ⚠️ **Route params and query values arrive as strings - always.** `@Param('id') id: string` gives you `'42'`, not `42`. If you need a number, you parse it (or, better, let a `ParseIntPipe` do it for you - that's [Phase 5](05-dtos-validation-pipes.md)). Forgetting this is a classic first-week bug: `id === 42` is `false` when `id` is `'42'`.

There are two more decorators you'll see in other people's code: `@Req()` and `@Res()`, which hand you the raw Express `request` and `response` objects.

> 💡 Reach for `@Req()`/`@Res()` rarely, and `@Res()` almost never. The moment you grab the raw `res` and call `res.json()` yourself, you opt out of Nest's response handling - interceptors and some features stop applying to that route. The whole point of the parameter decorators is that you *don't* need the raw request. Ask for the pieces you want and let Nest manage the rest.

## Responses: just return a value

This is the part that surprises people coming from Express. In Nest you don't call `res.send()` - **you return a value, and Nest serializes it.** Return an object or array and Nest sends it as JSON; return a string and it sends text. The status code defaults to **200**, except `@Post()` which defaults to **201 Created** (the correct status for "I made a thing").

```typescript
import { Controller, Get, Post, Delete, Param, Body, HttpCode, Header } from '@nestjs/common';

@Controller('tasks')
export class TasksController {
  @Get(':id')
  findOne(@Param('id') id: string) {
    return { id, title: 'Write the docs', done: false }; // → 200, JSON
  }

  @Post()
  create(@Body() body: { title: string }) {
    return { id: '1', title: body.title, done: false };  // → 201, JSON
  }

  @Delete(':id')
  @HttpCode(204)                  // override: "deleted, no content to return"
  @Header('X-Deleted', 'true')   // set a custom response header
  remove(@Param('id') id: string) {
    return; // nothing to send back
  }
}
```

*What just happened:* `findOne` returned a plain object and Nest turned it into a `200` JSON response - no serialization code from us. `create` returned an object too, but because it's a `@Post()` the default status was `201`. On `remove` we *overrode* the default with `@HttpCode(204)` (the standard "success, empty body" status for deletes) and tacked on a custom header with `@Header(...)`. We never touched a response object once.

> 📝 Returning a value is the idiomatic Nest style, and it's why controllers read so cleanly - a method's signature tells you what it takes in, and its `return` tells you what goes out. You'll go a long way before you ever need the raw `res`.

## It's Express underneath

None of this is a parallel universe. When your app boots, Nest walks your controllers, reads the decorators, and registers each method as a route on Express (or Fastify, if you choose that adapter). `@Get(':id')` on `@Controller('tasks')` becomes, more or less, the `app.get('/tasks/:id', ...)` you'd have written by hand in [Express](/guides/express-from-zero). The decorators are a **declarative layer over the same routing** - Nest does the wiring so your code stays a clean description of intent.

That's the whole controller story: a class marks a base path, methods mark verbs and sub-paths, parameter decorators inject request pieces, and a returned value becomes the response. The method bodies have been stubs because the *logic* doesn't belong here - it belongs in a provider. Wiring those in is exactly where Phase 3 goes.

## Recap

- A **controller is a class whose decorated methods are routes**; `@Controller('tasks')` sets the base path and `@Get`/`@Post`/`@Put`/`@Patch`/`@Delete` set the verb plus an optional sub-path.
- **Parameter decorators inject request pieces**: `@Param('id')` (route param), `@Query('q')` (query string), `@Body()` (parsed body), `@Headers()` (a header).
- **Route params and query values are always strings** - parse them yourself or use a pipe (Phase 5).
- **Return a value and Nest serializes it** to JSON with a `200` (or `201` for `@Post`); override with `@HttpCode()` and set headers with `@Header()`.
- `@Req()`/`@Res()` exist for raw Express access, but avoid them - grabbing raw `res` opts you out of Nest's response handling.
- Under the hood it all compiles down to [Express](/guides/express-from-zero) routes; controllers are a declarative layer over routing you already understand.

## Quick check

```quiz
[
  {
    "q": "Given @Controller('tasks') with a method decorated @Get(':id'), which request does it handle?",
    "choices": ["POST /tasks", "GET /tasks", "GET /tasks/42", "GET /id"],
    "answer": 2,
    "explain": "The base path 'tasks' plus the sub-path ':id' makes GET /tasks/:id, so GET /tasks/42 matches with id = '42'."
  },
  {
    "q": "A method handles @Get(':id') with @Param('id') id. For GET /tasks/42, what is the value and type of id?",
    "choices": ["42 as a number", "'42' as a string", "{ id: 42 } as an object", "undefined"],
    "answer": 1,
    "explain": "Route params (and query values) always arrive as strings - you get '42', not 42. Parse it or use a pipe if you need a number."
  },
  {
    "q": "A @Post() method does `return { id: '1', title: 'x', done: false };` and nothing else. What does the client receive?",
    "choices": ["A 200 response with an empty body", "A 201 response with that object as JSON", "A 500 error because no response was sent", "A 204 response with no content"],
    "answer": 1,
    "explain": "Returning a value lets Nest auto-serialize it to JSON, and @Post defaults to 201 Created - no response object needed."
  }
]
```

[← Phase 1: What NestJS Is & Your First App](01-what-nestjs-is.md) · [Guide overview](_guide.md) · [Phase 3: Providers & Dependency Injection →](03-providers-and-di.md)
