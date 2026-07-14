---
title: "Typing the Real World - Libraries, Declarations & Untyped Data"
guide: "typescript-from-zero"
phase: 12
summary: "The reality check: your code is type-safe, but libraries, the network, and JSON are not. How @types and .d.ts files work, why fetch and JSON.parse lie, what `as` really costs, and how runtime validation closes the gap."
tags: [typescript, definitely-typed, declaration-files, fetch, json, type-assertions, runtime-validation, zod]
difficulty: advanced
synonyms: ["typescript @types definitelytyped", "typescript declaration files d.ts", "typescript typing fetch json", "typescript type assertion as", "typescript validate api response", "typescript zod runtime validation", "typescript any escape hatch"]
updated: 2026-06-22
---

# Typing the Real World - Libraries, Declarations & Untyped Data

Everything you've built so far has been airtight *inside* your own code. The compiler knows the shape of every value, narrows your unions, infers your generics, and underlines mistakes before you run them. It feels like a fortress.

Here's the mental model for this phase: **the fortress has gates, and the world outside doesn't speak your type system.** A library was written by someone else. A network response is a stream of bytes the compiler has never seen. `JSON.parse` hands you back whatever was in a string at runtime. At every boundary, TypeScript's knowledge runs out - and what it does *instead* of admitting that is the single biggest source of "but the types said it was fine!" bugs in real TypeScript code.

This phase is about those boundaries: how types get attached to other people's code, and what happens (spoiler: nothing good, unless you act) when typed data arrives from outside your program.

## Third-party libraries and `@types`

You install a library with `npm`, import it, and start calling its functions. Where do the types come from? One of two places.

**Many modern libraries ship their own types** - the author wrote the library *in* TypeScript, or hand-wrote type declarations and bundled them in the package. Install it and the editor lights up with autocomplete and signatures. Nothing extra to do.

**Older or JS-only libraries ship no types.** For those, the community maintains a giant separate repository of type declarations.

📝 **DefinitelyTyped** - a massive open-source repository (`github.com/DefinitelyTyped/DefinitelyTyped`) holding hand-written type declarations for thousands of JavaScript libraries that don't ship their own. Each is published to npm under the `@types/` scope, so the types for `lodash` live in `@types/lodash`.

You install those declarations as a dev dependency, alongside the real library:

```bash
npm install lodash
npm install --save-dev @types/lodash
```

For the Node.js built-ins (`fs`, `path`, `process`, and friends), the declarations live in `@types/node`:

```bash
npm install --save-dev @types/node
```

The first command installs `lodash`, the actual runtime code. The second installs `@types/lodash` into `devDependencies`, since type declarations are erased at compile time and never ship to production - a *development*-only need. Once both are present, TypeScript automatically finds the declarations inside `node_modules/@types/` (and any `types` field a package declares in its own `package.json`) without you importing anything. Type `_.` and the editor offers every lodash function with full signatures.

💡 **How the editor "just knows."** You never import a `@types` package. TypeScript scans `node_modules/@types/` on its own and merges those declarations into your project's view of the world - why adding `@types/lodash` instantly fixes the red underline under `import _ from "lodash"`, even though your import points at the real library.

⚠️ **A red underline on an import usually means missing types, not a missing library.** If `import` works at runtime but the editor complains *"Could not find a declaration file for module 'foo'"*, the library is installed but its types aren't. The fix is almost always `npm i -D @types/foo` - if no such package exists, you're in the next section's territory.

## Declaration files (`.d.ts`)

The things inside `@types/` packages are **declaration files**, worth understanding because occasionally you'll write one yourself.

📝 **Declaration file (`.d.ts`)** - a file that describes the *types* of some JavaScript code without containing any implementation. No function bodies, no logic - only signatures and shapes. A contract that tells the compiler "here's what exists and what type it is," while the actual running code lives elsewhere (in plain `.js`).

The keyword that makes this possible is `declare`: it tells the compiler "trust me, this thing exists at runtime - here's its type" without providing or expecting an implementation.

```typescript
// globals.d.ts - describing things that exist at runtime but TS can't see
declare const APP_VERSION: string;
declare function trackEvent(name: string, data: object): void;
```

`declare const APP_VERSION: string` tells TypeScript a global `APP_VERSION` exists and is a string - perhaps injected by your build tool at compile time. There's no value assigned, since this file produces no runtime code; it's pure description. Now `APP_VERSION.toUpperCase()` type-checks everywhere in your project, and the compiler trusts the real value will be there at runtime.

The most common reason *you'd* write one is silencing the "no declaration file" error for an untyped module with no `@types` package. Stub it with `declare module`:

```typescript
// untyped-modules.d.ts
declare module "legacy-chart-lib" {
  export function render(el: HTMLElement, data: number[]): void;
}
```

`declare module "legacy-chart-lib"` defines the type contract for an import that otherwise has none. Now `import { render } from "legacy-chart-lib"` resolves, and `render` has a real signature instead of falling back to `any`. You're describing only the slice of the library you actually use. Mostly, though, you *consume* declaration files written by others; authoring them is rare.

## The danger zone: data from outside

Now the part that catches everyone. Inside your code the compiler verifies everything; the moment data crosses a gate from outside, that verification silently stops, replaced by blind trust.

⚠️ **`JSON.parse()` returns `any`. And `await response.json()` from `fetch` returns `Promise<any>`.** That `any` is the compiler waving a white flag: it has no idea what's in that string or response, so it surrenders all checking. Whatever type you *claim* the result is, TypeScript will believe you completely, with no verification - even if the server sent back something entirely different.

Watch the trap spring:

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

async function loadUser(id: number): Promise<User> {
  const response = await fetch(`/api/users/${id}`);
  const user: User = await response.json(); // looks safe. is not.
  return user;
}

const u = await loadUser(1);
console.log(u.email.toLowerCase()); // compiles cleanly
```

`response.json()` is typed `Promise<any>`. Annotating `const user: User` tells the compiler "this is a `User`," and since the source was `any`, it accepts the claim without evidence. Every line that follows is type-checked *against your claim*, not reality - `u.email.toLowerCase()` compiles perfectly.

But suppose the server is having a bad day and returns `{ "error": "not found" }`. There's no `email` field. At runtime, `u.email` is `undefined`, and `undefined.toLowerCase()` throws:

```console
TypeError: Cannot read properties of undefined (reading 'toLowerCase')
```

The annotation `: User` did *nothing* at runtime - a compile-time fiction, a label you stuck on untyped data. The types describe what you *hope* arrives, and the compiler can't tell hope from fact for anything that comes from outside.

💡 **Types are a contract you write; the outside world never signed it.** Inside your program, both sides of every assignment are checked, so the contract holds. For a network response, *you* wrote the type and *you* alone are bound by it - the server has no idea your `User` interface exists and is free to send whatever it likes. This is the gap every robust TypeScript app has to close deliberately.

## Type assertions (`as`) - a promise, not a check

The annotation trap above is closely related to a feature you'll see (and be tempted by) constantly: the type assertion.

📝 **Type assertion (`value as Type`)** - tells the compiler "treat this value as `Type`, trust me." It performs *no* runtime check and changes *no* runtime behavior, only overriding what the compiler thinks the type is. A promise from you to the checker, enforced by nobody.

This is fundamentally different from **narrowing**, which you learned earlier. Narrowing (`if (typeof x === "string")`, `if ("email" in obj)`) *proves* a type with a real runtime test the compiler can see. An assertion *asserts* a type with no test at all:

```typescript
const raw: unknown = JSON.parse(input);

// Narrowing - verified at runtime, safe:
if (typeof raw === "object" && raw !== null && "name" in raw) {
  // compiler knows raw has a `name` here because the code checked
}

// Assertion - unverified, you take responsibility:
const user = raw as User; // no check happens. ever.
```

The narrowing branch runs an actual `if` that exists in the compiled JavaScript - the check happens at runtime, so the compiler's belief is backed by evidence. The assertion `raw as User` compiles to *nothing*; `as User` vanishes entirely in the emitted JS. You've told the checker `raw` is a `User`, it stops worrying, and if `raw` is actually `{ error: "..." }`, you've moved the crash downstream to wherever the missing field gets touched.

TypeScript blocks an assertion between two *clearly* unrelated types (e.g. `string as number`). The escape hatch is the double assertion through `unknown`:

```typescript
const sketchy = someValue as unknown as User;
```

Routing through `unknown` first tells the compiler "forget what you knew about this value's type," then re-asserts it as `User`. It's the strongest "trust me" you can write, and the loudest alarm bell in a code review. Every `as unknown as` fully disables the type checker for that value and bets the program's correctness on your assumption being right.

⚠️ **An assertion is where you take responsibility *away* from the checker.** Each `as` is a spot the compiler is no longer protecting - it does what you said instead of what it verified. They have legitimate uses (telling the compiler something it genuinely can't infer), but every one is a small loan against safety. Use them sparingly, and never reach for `as` to make external data "be" a type - that's not closing the gap, it's papering over it.

## Closing the gap: runtime validation

So what *does* close the gap? If types can't verify external data and assertions just lie about it, the only real answer is to check the data yourself, at runtime, the moment it arrives - and derive the static type from that check so the two can never drift apart.

The hand-rolled version is a **type guard**: a function that inspects an `unknown` value and returns a special boolean narrowing the type for the compiler.

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

function isUser(x: unknown): x is User {
  return (
    typeof x === "object" &&
    x !== null &&
    typeof (x as Record<string, unknown>).id === "number" &&
    typeof (x as Record<string, unknown>).name === "string" &&
    typeof (x as Record<string, unknown>).email === "string"
  );
}

async function loadUser(id: number): Promise<User> {
  const data: unknown = await (await fetch(`/api/users/${id}`)).json();
  if (!isUser(data)) {
    throw new Error("API returned a shape that isn't a User");
  }
  return data; // narrowed to User - and actually checked
}
```

`isUser` returns `x is User` - a **type predicate**. When it returns `true`, the compiler narrows the argument to `User`, exactly like `typeof` narrowing. But unlike an assertion, the narrowing is *earned*: the function genuinely inspected every field at runtime. `loadUser` types the response as `unknown`, forcing itself to validate before using it. If the server lies, `isUser` returns `false`, you throw at the boundary, and the bad data never reaches your core logic - the crash, if any, happens *at the gate* with a clear message, not three screens away with a cryptic one.

Writing those guards by hand is correct but tedious, and they drift from your interface the instant someone adds a field. The popular fix is a validation library - **zod** is the one you'll meet most - letting you define the shape *once* for both a runtime validator and a static type.

```typescript
import { z } from "zod";

// Define the shape once:
const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.email(),
});

// Derive the static type from the schema - single source of truth:
type User = z.infer<typeof UserSchema>;

async function loadUser(id: number): Promise<User> {
  const data: unknown = await (await fetch(`/api/users/${id}`)).json();
  return UserSchema.parse(data); // validates at runtime; throws on mismatch
}
```

`UserSchema` describes the shape as a runtime *value* that knows how to check data. `UserSchema.parse(data)` actually inspects the object at runtime and throws a detailed error if anything is wrong (missing field, wrong type, malformed email) - real verification, unlike `as`. The magic line is `type User = z.infer<typeof UserSchema>`: it pulls a static type *out of* the schema, so your compile-time type and runtime check come from one definition and can never disagree. `parse` returns a value the compiler knows is `User` - and this time it's right, because the data was genuinely checked.

💡 **Validate at the edges, trust types in the core.** This is the durable pattern for real TypeScript. At every boundary where data enters - network responses, form input, `localStorage`, environment variables, message queues - validate it once and convert `unknown` into a known type. Everywhere *inside* that boundary, lean fully on the type system: it's accurate now, because nothing untyped got past the gate. The fortress works again - you just had to put guards on the doors.

## Recap

1. Libraries get their types either by **shipping their own** or via **`@types/` packages from DefinitelyTyped** (`npm i -D @types/foo`); the editor finds them automatically in `node_modules/@types/` - you never import them.
2. A **declaration file (`.d.ts`)** describes types without implementation; `declare` asserts something exists at runtime, and `declare module "foo"` stubs an untyped library. You mostly consume these, rarely write them.
3. ⚠️ External data is the danger zone: `JSON.parse()` is `any` and `fetch().json()` is `Promise<any>`. TypeScript believes whatever type you claim for it - the annotation is a **compile-time fiction** with zero runtime verification.
4. A **type assertion (`as`)** is a promise, not a check - it changes no runtime behavior and takes responsibility away from the compiler. `as unknown as T` is the double-assertion escape hatch. Contrast with **narrowing**, verified by a real runtime test.
5. The real fix is **runtime validation at the boundary**: a hand-written **type guard** (`x is User`) or a library like **zod**, where `z.infer` derives the static type from the validator so check and type stay one source of truth.
6. 💡 **Validate at the edges, trust types in the core** - turn `unknown` into a known type once at every entry point, then rely on the type system everywhere inside.

## Quick check

Test yourself on the gap between what types promise and what gets checked:

```quiz
[
  {
    "q": "You write `const user: User = await response.json()` and `user.email.toLowerCase()` compiles with no errors. The server returns `{ error: \"not found\" }`. What happens?",
    "choices": [
      "It crashes at runtime with a TypeError - the `: User` annotation did nothing, because `response.json()` is `any` and TypeScript trusted your claim without checking",
      "The compiler catches it before running, since it knows the server's real response shape",
      "It returns `undefined` silently and the program continues safely",
      "`response.json()` automatically validates the data against the `User` interface at runtime"
    ],
    "answer": 0,
    "explain": "`response.json()` returns `Promise<any>`, so annotating the result as `User` is an unverified claim. The types are a compile-time fiction for external data - at runtime `user.email` is `undefined` and `.toLowerCase()` throws."
  },
  {
    "q": "What is the key difference between `raw as User` (assertion) and an `if` that checks the fields (narrowing)?",
    "choices": [
      "The assertion performs no runtime check and compiles to nothing; narrowing runs a real test the compiler can see, so its conclusion is backed by evidence",
      "Narrowing is slower because it adds runtime code; the assertion is the faster, safer choice",
      "They are identical - `as` is just shorthand for an `if` check",
      "The assertion validates the data at runtime while narrowing only affects the editor"
    ],
    "answer": 0,
    "explain": "`as` is a promise to the compiler with no runtime check - it vanishes in the emitted JS. Narrowing proves a type with an actual runtime test the compiler can observe, so the type it infers is earned, not assumed."
  },
  {
    "q": "Why is defining a `zod` schema and using `type User = z.infer<typeof UserSchema>` better than writing the `User` interface and a separate hand-rolled type guard?",
    "choices": [
      "The runtime validator and the static type come from one definition, so they can never drift apart - change the schema and the type updates automatically",
      "zod skips runtime checks entirely, which makes it faster than a type guard",
      "zod lets you use `as` assertions safely without any validation",
      "Interfaces can't describe network data, but zod schemas can"
    ],
    "answer": 0,
    "explain": "With a hand-written interface plus a separate guard, the two can fall out of sync when fields change. `z.infer` derives the static type from the same schema that does the runtime validation, making them a single source of truth that stays consistent."
  }
]
```

---

[← Phase 11: Conditional & Template Literal Types](11-conditional-and-template-types.md) · [Guide overview](_guide.md) · [Phase 13: Where to Go Next →](13-where-to-go-next.md)
