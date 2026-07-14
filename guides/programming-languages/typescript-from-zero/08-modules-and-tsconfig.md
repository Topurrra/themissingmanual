---
title: "Modules, tsconfig & the Build - Configuring the Compiler"
guide: "typescript-from-zero"
phase: 8
summary: "How TS shares code with ES modules and type-only imports, what tsconfig.json controls, the compiler options that actually matter, why strict mode is non-negotiable, and where tsc fits alongside a bundler."
tags: [typescript, modules, tsconfig, strict-mode, compiler-options, esm, build, target]
difficulty: intermediate
synonyms: ["typescript tsconfig explained", "typescript strict mode", "typescript compiler options", "typescript modules import export", "typescript target module option", "typescript esm commonjs", "typescript build setup"]
updated: 2026-06-22
---

# Modules, tsconfig & the Build - Configuring the Compiler

For seven phases you've been writing types and pretending the compiler reads them somehow. This phase names
that "somehow" and turns a folder of `.ts` files into a *real project*: code split across files that import
each other, a config file that tells the compiler how to check and build, and an answer to "wait, who
actually turns my `.ts` into `.js`?"

Here's the mental model to hold onto: **TypeScript is a checker bolted onto a compiler, and `tsconfig.json`
is the dial board for both.** Every option either changes *how strictly it checks* or *what JavaScript it
emits*. Seen through that lens, the file stops looking like an intimidating wall of JSON and starts looking
like a short list of decisions you actually understand.

## Modules in TypeScript - same import/export you already know

TypeScript doesn't invent its own module system - it uses **ES modules**, the exact `import` / `export`
syntax from JavaScript. If you've worked through the [JavaScript guide](/guides/javascript-from-zero), this
is the same `import { thing } from "./file"` you already know.

What *is* new: both **values** and **types** travel through those same statements. You export a function (a
value) the same way you export an `interface` (a type).

```typescript
// money.ts
export interface Money {
  amount: number;
  currency: string;
}

export function format(m: Money): string {
  return `${m.amount.toFixed(2)} ${m.currency}`;
}

// checkout.ts
import { Money, format } from "./money";

const total: Money = { amount: 19.99, currency: "USD" };
console.log(format(total));
```

`Money` is a type - exists only at check-time, vanishes from the output. `format` is a value - real runtime
code. `checkout.ts` imports both with one `import` line, and TypeScript sorts out which is which: `Money`
type-checks `total`, while `format` becomes a genuine function call in the emitted JavaScript.

### `import type` - saying "this is types only"

Sometimes you import *only* a type from another file - no functions, no runtime values. Mark that intent
explicitly with **`import type`**; it's worth the habit.

```typescript
// checkout.ts
import type { Money } from "./money";
import { format } from "./money";

const total: Money = { amount: 19.99, currency: "USD" };
console.log(format(total));
```

`import type { Money }` tells the compiler "I need this name only for type-checking - it has no runtime
existence." When TypeScript emits JavaScript, that line is **erased completely**. A plain `import { Money }`
might leave behind an `import "./money"` statement that a bundler then has to resolve and possibly include,
even though `Money` is just a shape.

💡 **Why bother with `import type`.** It does two jobs: guarantees the import is dropped from the build, so
you never accidentally pull a whole module into your bundle just to reference one interface; and documents
intent, sidestepping a class of circular-dependency headaches. Prefer it for type-only imports.

## `tsconfig.json` - the control panel

The compiler checks your types and emits JavaScript. One file decides what to check and what to emit.

📝 **`tsconfig.json`** - a JSON file at the root of your project that tells `tsc` how to behave: which files
to include, how strictly to type-check them, and what kind of JavaScript to produce. Run `tsc` in a folder
containing this file and it reads it automatically - no flags needed. Your editor reads it too, which is why
VS Code's red underlines match what the command line reports.

A sensible starter config - the kind you'd happily drop into a new project today:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "outDir": "./dist",
    "rootDir": "./src",
    "lib": ["ES2022", "DOM"],
    "strict": true,
    "sourceMap": true,
    "declaration": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"]
}
```

Everything lives under `compilerOptions`, plus an `include` array saying "compile every file under `src/`."
Each option is one decision about checking or emitting - don't memorize the list, the next two sections cover
the ones that earn their place. This file is the entire contract between you and the compiler; change a
value here and the behavior of `tsc` (and your editor) changes everywhere.

## The options that actually matter

You can ignore most of `tsconfig`'s long option list for a long time. The handful you'll set on day one, one
sentence of *why* each:

- **`target`** - which version of JavaScript to emit. Newer (`ES2022`) means cleaner output assuming a
  modern runtime; older (`ES5`) adds compatibility shims for ancient browsers. Pick the oldest environment
  you must support.
- **`module`** - the module *format* of the emitted code (`ESNext` for `import`/`export`, `CommonJS` for
  Node's older `require`). Decides how your `import` lines look after compilation.
- **`outDir`** / **`rootDir`** - where compiled `.js` files go (`outDir`) and where your source `.ts` lives
  (`rootDir`). Keeping output in `dist/` and source in `src/` stops generated files cluttering your code.
- **`lib`** - which built-in type definitions are available. Add `"DOM"` and the compiler knows about
  `document` and `window`; omit it for a pure Node project so browser globals don't sneak in.
- **`sourceMap`** - emit `.map` files so debuggers and stack traces point back to your original TypeScript
  instead of the compiled JavaScript. Turn it on; future-you debugging production will be grateful.
- **`declaration`** - emit `.d.ts` files alongside the JavaScript, letting *other* TypeScript projects
  consume your code with full types - essential for a published library, ignorable for a leaf app.

⚠️ **`target` is about *output*, not what you can write.** Setting `target: "ES2022"` doesn't unlock new
syntax for you - you can already write any modern TypeScript. It controls what the *emitted JavaScript* looks
like and which runtime features it assumes exist. Too new and your code may use syntax an old browser chokes
on; too old and `tsc` bloats the output down-leveling features nobody needed.

## `strict` mode - turn it on, always

Of every option above, one matters more than all the others combined. If you remember a single line from
this phase, make it `"strict": true`.

📝 **`strict`** - a master switch that turns on a bundle of the compiler's strongest safety checks at once,
including **`strictNullChecks`** (treat `null` and `undefined` as their own types you must handle, not
silent members of every type) and **`noImplicitAny`** (refuse to silently give a value the escape-hatch `any`
type when it can't infer one). It's the difference between TypeScript that *catches bugs* and TypeScript that
mostly nods along.

The most valuable thing in that bundle is `strictNullChecks`. Without it, `null` and `undefined` quietly
belong to *every* type, so the compiler waves through code that will explode at runtime:

```typescript
// With strictNullChecks OFF (strict: false), this compiles cleanly:
function firstChar(name: string): string {
  return name[0].toUpperCase();
}

const users: { name?: string } = {};
firstChar(users.name); // name is undefined - boom at runtime, no compiler warning
```

`users.name` is optional, so it's `undefined` here. With strict mode off, the compiler treats `undefined` as
an acceptable `string` and lets you pass it to `firstChar`. At runtime, `undefined[0]` throws `Cannot read
properties of undefined` - the exact bug TypeScript is supposed to prevent, sailing straight through because
the safety net was off.

Now turn `strict: true` on:

```typescript
// With strictNullChecks ON, the same call is a compile error:
function firstChar(name: string): string {
  return name[0].toUpperCase();
}

const users: { name?: string } = {};
firstChar(users.name);
// Error: Argument of type 'string | undefined' is not
// assignable to parameter of type 'string'.
```

Now the compiler knows `users.name` is `string | undefined` and that `firstChar` only accepts `string`. It
refuses to compile until you handle the `undefined` case - with a default, a guard (`if (users.name)`), or
the narrowing from [Phase 5](05-unions-and-narrowing.md). The bug is caught *at edit-time*, before the code
ever runs. That's the entire point of TypeScript, and it only works with strict on.

⚠️ **Never start a new project with strict off.** Turning strict on later, after thousands of lines, surfaces
a mountain of errors at once and tempts everyone to slap `any` everywhere or give up. Strict from line one
keeps the cost continuous and tiny. The only good reason to disable pieces of it is gradually migrating a
giant legacy codebase - and even then, turn the checks *on* one at a time, never leave them off forever.

## The build - where TypeScript meets the bundler

One last thing trips up nearly everyone: TypeScript can't run in a browser or Node directly, so *something*
has to turn `.ts` into `.js`. Two common arrangements:

**Option 1 - `tsc` does the build.** Run `tsc` and it both type-checks and emits JavaScript into `outDir`.
Simple, no extra tools, perfect for a library or a small Node program.

```bash
$ tsc
$ node dist/checkout.js
19.99 USD
```

`tsc` checked every file under `src/` and wrote compiled JavaScript to `dist/`. Then plain `node` ran the
output. One tool, whole job done.

**Option 2 - a bundler builds, `tsc` only checks.** Real front-end apps more commonly split the work. A fast
bundler or transpiler (Vite, esbuild, swc) handles the `.ts` → `.js` step as part of bundling, alongside
tree-shaking, code-splitting, and the other things from the
[JavaScript modules & bundlers phase](/guides/javascript-from-zero). Those tools are *fast* because they
**strip types without checking them**. So `tsc` runs separately, purely as the type checker, with a flag
that tells it to check and emit nothing:

```bash
$ tsc --noEmit
$ vite build
```

`tsc --noEmit` type-checked the whole project and produced *zero* output - its only job is to say "the types
are sound" (or fail the build if not). Then `vite build` did the actual transformation and bundling. Two
tools, two jobs: one guards correctness, the other produces the shippable files.

💡 **In real apps, the bundler builds and `tsc` just checks.** This split confuses people because the type
*errors* and the actual *build* come from different tools. It's worth it because bundlers transpile blazingly
fast precisely by *not* type-checking, giving instant rebuilds during development, while a separate
`tsc --noEmit` (often in CI, or a watch task) enforces type safety without slowing the build. The types still
protect you - verified by `tsc`, just not by the thing producing your JavaScript.

That closes the loop: a checker, a config file driving it, the settings that matter, strict mode keeping it
accurate, and a clear picture of who emits the JavaScript.

## Recap

1. **TypeScript uses ES modules** - the same `import`/`export` as JavaScript - and both **types and values**
   travel through them; the compiler sorts out which is which.
2. **`import type { ... }`** marks a type-only import so it's fully erased from the build, keeping types out
   of your bundle and documenting that nothing runtime crosses that boundary.
3. **`tsconfig.json`** is the control panel: it tells `tsc` (and your editor) which files to include, how
   strictly to check, and what JavaScript to emit. `tsc` reads it automatically.
4. The options that earn their keep: **`target`** (which JS version to emit), **`module`** (format),
   **`outDir`/`rootDir`**, **`lib`**, **`sourceMap`**, and **`declaration`** - each a single decision about
   checking or output.
5. ⚠️ **`strict: true` is non-negotiable for new projects** - it bundles `strictNullChecks`, `noImplicitAny`,
   and more, and makes TypeScript actually catch `null`/`undefined` bugs instead of nodding along.
6. **`tsc` can build, or a bundler builds while `tsc --noEmit` just checks** - the common front-end setup,
   where Vite/esbuild produce fast output and `tsc` guards correctness separately.

## Quick check

Test yourself on the three ideas that make a project real - type-only imports, the config dial board, and
strict mode:

```quiz
[
  {
    "q": "What does writing `import type { Money } from \"./money\"` (instead of a plain `import`) guarantee?",
    "choices": [
      "The import is fully erased from the emitted JavaScript, so it never pulls runtime code into your bundle",
      "It loads the module faster at runtime than a regular import",
      "It converts the interface into a runtime object you can inspect",
      "It makes `Money` available without needing to export it from money.ts"
    ],
    "answer": 0,
    "explain": "`import type` tells the compiler the name is needed only for type-checking. The line is dropped entirely from the build, so you never accidentally bundle a whole module just to reference one type - and it documents that nothing runtime crosses that boundary."
  },
  {
    "q": "What is the role of `tsconfig.json` in a TypeScript project?",
    "choices": [
      "It tells the compiler (and your editor) which files to include, how strictly to type-check, and what JavaScript to emit - read automatically by `tsc`",
      "It lists the npm packages your project depends on",
      "It stores the compiled JavaScript output of your project",
      "It is a runtime file the browser reads to enable TypeScript features"
    ],
    "answer": 0,
    "explain": "`tsconfig.json` is the control panel for `tsc`. Run `tsc` in a folder that has one and it's read automatically - no flags. Your editor reads it too, which is why its red underlines match the command line."
  },
  {
    "q": "Why is turning on `strict` mode the single most important `tsconfig` setting for a new project?",
    "choices": [
      "It bundles `strictNullChecks`, `noImplicitAny`, and more - making the compiler actually catch null/undefined bugs instead of silently allowing them",
      "It makes the compiled JavaScript run faster in the browser",
      "It automatically adds type annotations to your code for you",
      "It lets you skip writing types entirely while staying type-safe"
    ],
    "answer": 0,
    "explain": "`strict: true` enables the compiler's strongest checks at once. The key one, `strictNullChecks`, stops `null`/`undefined` from silently belonging to every type - which is what lets TypeScript catch the bugs it exists to catch. Start new projects with it on."
  }
]
```

---

[← Phase 7: Classes & OOP in TypeScript](07-classes-and-oop.md) · [Guide overview](_guide.md) · [Phase 9: The Type System, Deep →](09-the-type-system-deep.md)
