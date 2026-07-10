---
title: "Testing & Production"
guide: "nestjs-from-zero"
phase: 8
summary: "Use Nest's DI test module to swap mocks for real deps in unit tests, boot the whole app for e2e tests with supertest, centralize config with @nestjs/config, and ship a compiled production build."
tags: [nestjs, typescript, testing, production, config]
difficulty: intermediate
synonyms: ["nestjs testing", "nest Test.createTestingModule", "nestjs e2e supertest", "nestjs config module", "nestjs production build", "nest deploy"]
updated: 2026-07-10
---

# Testing & Production

Back in [Phase 3](03-providers-and-di.md) there was a promise: dependency injection isn't ceremony for its own sake — it exists to make your code testable, and this is where that promise pays off. The same mechanism Nest uses to wire `TasksService` into `TasksController` in production is the mechanism that lets you, in a test, swap that real service for a fake one and check the controller's behavior in isolation.

Here's the mental model for the whole testing half of this phase: **a test builds its own tiny Nest app.** You hand `@nestjs/testing` a list of providers — some real, some fake — it spins up a DI container exactly like the real one, and you pull pieces out and poke at them. Because the wiring is identical to production, what passes in the test reflects how things behave for real. The only thing you change is *which* objects get injected.

## Unit testing: a real class with fake neighbors

A unit test isolates one class. For a service that has no dependencies, that means building a testing module with just the real class and reading it back out.

```typescript
import { Test } from '@nestjs/testing';
import { TasksService } from './tasks.service';

describe('TasksService', () => {
  let service: TasksService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [TasksService],
    }).compile();

    service = moduleRef.get(TasksService);
  });

  it('creates a task', () => {
    const t = service.create({ title: 'x' });
    expect(t.id).toBeDefined();
  });
});
```

*What just happened:* `Test.createTestingModule({ providers: [TasksService] })` describes a miniature module — same shape as the `@Module()` decorator from [Phase 4](04-modules.md), just built in code. Calling `.compile()` actually constructs the DI container (it's async, so we `await` it inside `beforeEach`, which Jest runs before every test). Then `moduleRef.get(TasksService)` reaches into that container and hands back the real, fully-constructed instance — the same object Nest would build at runtime. From there it's a plain object: call `create`, assert on what comes back. No HTTP, no server, just the logic.

> 📝 Jest is the default test runner — the Nest CLI wires it up when you scaffold the project, so `npm test` runs your `*.spec.ts` files with zero setup. The `describe`/`it`/`expect`/`beforeEach` functions above are all Jest.

### Testing a controller with a mock service

A controller is harder to isolate because it *depends* on a service. You don't want the real `TasksService` in a controller test — it carries its own state and logic, and a bug there would fail the controller's test for the wrong reason. So you inject a fake. This is the swap [Phase 3](03-providers-and-di.md) was building toward.

```typescript
import { Test } from '@nestjs/testing';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

describe('TasksController', () => {
  let controller: TasksController;

  const mockTasks = {
    findAll: () => [{ id: 1, title: 'seed', done: false }],
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [{ provide: TasksService, useValue: mockTasks }],
    }).compile();

    controller = moduleRef.get(TasksController);
  });

  it('returns the tasks the service gives it', () => {
    expect(controller.findAll()).toEqual([{ id: 1, title: 'seed', done: false }]);
  });
});
```

*What just happened:* The line that matters is `{ provide: TasksService, useValue: mockTasks }`. It tells the container: "when something asks for `TasksService`, hand it `mockTasks` instead." The controller's constructor still says `tasksService: TasksService` — it has no idea it got a fake, because, as Phase 3 put it, *it never knew where its dependency came from in the first place.* Now `controller.findAll()` exercises only the controller's own code (does it call the service and return the result?), with the service's behavior pinned to known canned data. That's a true unit test of the controller.

> 💡 This is the whole argument for DI in one example. Without it, the controller would `new TasksService()` internally and you'd have no seam to insert a fake. With it, the fake slides in cleanly. The deeper discipline of *what* to test and how to run it all in CI is its own topic — see [Testing in CI](/guides/testing-in-ci).

## e2e testing: boot the real app and make requests

Unit tests check pieces in isolation. **End-to-end (e2e) tests check the whole thing wired together** — routing, pipes, guards, the lot — by starting an actual HTTP server in memory and sending it real requests. Nest scaffolds a `test/` folder with `*.e2e-spec.ts` files and an `npm run test:e2e` script for exactly this.

The tool is **supertest**, which fires HTTP requests at your running app and lets you assert on the responses.

```typescript
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Tasks (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  it('GET /tasks returns 200', () => {
    return request(app.getHttpServer()).get('/tasks').expect(200);
  });

  afterAll(async () => {
    await app.close();
  });
});
```

*What just happened:* This time the testing module imports the whole `AppModule`, so the real controllers and services are all present. `createNestApplication()` turns that container into an actual app, and `await app.init()` boots it (running the same startup it would in production). `app.getHttpServer()` exposes the underlying HTTP server, and `request(...).get('/tasks').expect(200)` sends a genuine GET and asserts the status code — supertest never opens a network port, it talks to the server object directly, which keeps it fast. `afterAll` closes the app so the test process can exit cleanly. Nothing is mocked here: a passing e2e test means the real request actually flowed through routing and into your code and came back right.

## Config: one place for environment values

Your production app needs a database URL, secrets, a port — values that differ between your laptop and the server, and that must never be hard-coded. The wrong way is to sprinkle `process.env.DATABASE_URL` across a dozen files. The right way in Nest is `@nestjs/config`.

You load it once in your root module:

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot()],
})
export class AppModule {}
```

*What just happened:* `ConfigModule.forRoot()` reads a `.env` file and the real environment variables at startup and folds them into a single `ConfigService` that the DI container now knows how to inject. `forRoot()` is the convention for "configure this module once for the whole app" — you'll see the same pattern in database modules later.

Then anywhere you need a value, you inject `ConfigService` — the same constructor injection you already know:

```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TasksService {
  constructor(private readonly config: ConfigService) {}

  private get dbUrl() {
    return this.config.get<string>('DATABASE_URL');
  }
}
```

*What just happened:* `config.get('DATABASE_URL')` pulls the value through the one service that owns config, instead of the service reaching out to the global `process.env` itself. That gives you a single, typed, injectable, *mockable* source of truth — in a test you can supply a fake `ConfigService` the same way you faked `TasksService` above.

> ⚠️ Don't scatter `process.env.SOMETHING` across your codebase. The moment a typo'd key or a missing variable causes a bug, you'll be hunting through every file that read it. Centralize on `ConfigModule` + `ConfigService` and there's exactly one place to look — and one place to validate that required values are actually present at boot.

## Going to production: ship the compiled build

In development you've been running `npm run start:dev`, which uses ts-node and a file watcher to recompile and restart as you save. That's wonderful for iterating and wrong for production — it carries the TypeScript toolchain, recompiles at runtime, and restarts on file changes you don't want in a live server.

📝 For production you compile *ahead of time* and run plain JavaScript. `npm run build` (which runs `nest build`) compiles your TypeScript into a `dist/` folder, and you run the output directly:

```bash
npm run build
NODE_ENV=production node dist/main.js
```

*What just happened:* `nest build` does the TypeScript-to-JavaScript compile once, writing `dist/`. Then `node dist/main.js` runs that compiled entry point — no ts-node, no watcher, no recompile. Setting `NODE_ENV=production` tells your app (and many libraries) to use production behavior, like trimming verbose logging.

A few things belong in your `main.ts` bootstrap before you ship — most you've already met:

```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.use(helmet());
  app.enableCors();
  app.enableShutdownHooks();

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

*What just happened:* The global `ValidationPipe` ([Phase 5](05-dtos-validation-pipes.md)) enforces your DTO rules on every incoming request app-wide. `helmet()` sets a batch of security-related HTTP headers. `enableCors()` controls which browsers' origins may call your API. `enableShutdownHooks()` is the production-specific one: it makes Nest listen for termination signals (like the `SIGTERM` a container sends when it's stopping) and run any cleanup — closing database connections, finishing in-flight work — before the process dies, so deploys don't drop requests or leak connections.

In a real deployment you'd run `node dist/main.js` inside a container (Docker), behind a reverse proxy (nginx, or your platform's load balancer) that terminates TLS and forwards traffic. That last mile — Dockerfile, env management, picking a host, wiring CI — is a guide of its own: [Ship Your Side Project](/guides/ship-your-side-project) walks the full path from working code to a public URL.

## Recap

- A test builds its **own DI container** with `Test.createTestingModule({...}).compile()`, then `moduleRef.get(X)` pulls instances out — the same wiring as production, so passing tests reflect real behavior.
- **Unit-test a controller** by providing `{ provide: TasksService, useValue: mockTasks }` — the DI swap from Phase 3, letting you isolate the controller from the real service. Jest is the default runner (`npm test`).
- **e2e tests** import `AppModule`, call `createNestApplication()` + `app.init()`, and hit `app.getHttpServer()` with **supertest** to check the whole request pipeline end to end (`npm run test:e2e`).
- Centralize configuration with `@nestjs/config`: `ConfigModule.forRoot()` once, then inject `ConfigService` and call `config.get(...)` — never scatter `process.env` across files.
- For production, `npm run build` compiles to `dist/` and you run `node dist/main.js` (not `start:dev`); enable the global `ValidationPipe`, `helmet`, CORS, `enableShutdownHooks()`, set `NODE_ENV=production`, and run behind a container/reverse proxy.

## Quick check

```quiz
[
  {
    "q": "In a controller unit test, why do you provide { provide: TasksService, useValue: mockTasks }?",
    "choices": ["To make the test run faster by skipping compilation", "To swap the real service for a fake so the controller is tested in isolation", "Because controllers cannot be tested with the real service at all", "To register a new route on the controller"],
    "answer": 1,
    "explain": "DI lets you substitute a fake service for the real one. The controller's constructor still asks for TasksService but receives the mock, so the test exercises only the controller's own logic against known data."
  },
  {
    "q": "What does an e2e test do that a unit test does not?",
    "choices": ["Runs without Jest", "Boots the whole app and sends real HTTP requests through the full pipeline via supertest", "Avoids using the DI container", "Only tests private methods"],
    "answer": 1,
    "explain": "An e2e test imports AppModule, calls createNestApplication() and app.init(), then uses supertest against app.getHttpServer() to exercise routing, pipes, guards, and handlers together — not one class in isolation."
  },
  {
    "q": "How should you run a NestJS app in production?",
    "choices": ["npm run start:dev, which uses ts-node and a watcher", "node dist/main.js after npm run build compiles TypeScript to dist/", "ts-node src/main.ts directly", "nest start --watch on the source files"],
    "answer": 1,
    "explain": "start:dev is for development (ts-node + file watcher). In production you compile ahead of time with npm run build (nest build) into dist/ and run the plain JavaScript with node dist/main.js."
  }
]
```

---

[← Phase 7: Guards, Interceptors & Middleware](07-guards-interceptors-middleware.md) · [Guide overview](_guide.md) · [Phase 9: Where to Go Next →](09-where-to-go-next.md)
