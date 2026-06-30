---
title: "Functions & Annotations - Typing the Boundaries"
guide: "typescript-from-zero"
phase: 3
summary: "Functions are the contracts between parts of your program - the highest-value place for types. Parameter and return types, arrow functions, optional and default and rest parameters, and the void/never distinction."
tags: [typescript, functions, parameter-types, return-types, optional-parameters, default-parameters, void]
difficulty: beginner
synonyms: ["typescript function types", "typescript parameter return type", "typescript optional parameter", "typescript default parameter", "typescript void return", "typescript arrow function types", "typescript function signature"]
updated: 2026-06-22
---

# Functions & Annotations - Typing the Boundaries

In Phase 2 you typed individual variables. Useful, but variables aren't where the bugs live. The bugs live at the *seams* - the moment one piece of code hands data to another and quietly assumes it's the right shape. A function call is exactly that handoff: caller passes arguments in, function passes a result back. Get the shapes wrong and you're back to the silent `undefined`/`NaN` failures TypeScript exists to kill.

So here's the mental model for this whole phase: **a function signature is a contract.** It states, in a form the checker enforces, "give me these types and I'll give you that type back." Both sides are held to it - the caller can't pass garbage, and the function can't return the wrong thing. 💡 **Annotate the boundaries, let inference handle the inside.** The parameters and return type are the contract worth writing down; the local variables inside the body, TypeScript usually figures out on its own. That single habit gives you most of the safety for very little typing.

## Parameter and return types - the contract itself

The most basic annotated function: types on each parameter, and a type after the parameter list for what comes back.

```typescript
function add(a: number, b: number): number {
  return a + b;
}

add(2, 3);      // 5 - fine
add(2, "3");    // Error flagged here
```

*What just happened:* The signature `(a: number, b: number): number` is the contract. The first call satisfies it. The second passes a string where a `number` is required, so the checker rejects it before the code ever runs:

```console
Argument of type 'string' is not assignable to parameter of type 'number'.
```

That's the caller side of the contract. The function side is enforced too - the `: number` after the parentheses promises the *return* value is a number, and TypeScript holds you to it:

```typescript
function add(a: number, b: number): number {
  return `${a + b}`;   // Error flagged here
}
```

*What just happened:* The body builds a *string* with the template literal, but the signature promised a `number`. The checker catches the broken promise at the `return`:

```console
Type 'string' is not assignable to type 'number'.
```

Now the part that surprises people: **you can often leave the return type off entirely.** TypeScript reads the body and *infers* it.

```typescript
function add(a: number, b: number) {
  return a + b;   // TS infers the return type is number
}

const result = add(2, 3);   // result is typed as number, automatically
```

*What just happened:* With no `: number` written, TypeScript looked at `a + b` - two numbers added - and concluded the function returns `number`. `result` gets that type with zero annotation. This is inference doing the "inside" work for you, exactly as promised.

So why ever write the return type by hand? Because **an explicit return type locks the contract.** When you write `: number`, you're telling the checker "this function must return a number" - and if a future edit accidentally returns a string, the error points at *this* function, where the mistake is. Without it, the wrong type silently flows out and the error pops up wherever some caller chokes on it, far from the cause.

💡 **When to write the return type:** on anything public or important - exported functions, anything other people call, anything whose contract you want pinned down. For small local helpers, letting inference do it is fine and keeps the code clean. Parameters, by contrast, are almost always worth annotating: TypeScript can rarely infer what a parameter *should* be.

## Arrow functions - same contract, different syntax

Everything above applies unchanged to arrow functions. The annotations sit in the same places: types on the parameters, return type after the parameter list.

```typescript
const add = (a: number, b: number): number => a + b;

const double = (n: number) => n * 2;   // return type inferred as number
```

*What just happened:* `add` spells out its return type; `double` lets inference handle it. Same rules as `function` declarations - the arrow is purely a different way to write the same typed contract.

There's a second, distinct skill here: typing a variable that *holds* a function. The type of a function value is written `(params) => returnType` - it looks like an arrow function but it's describing a *type*, not running anything.

```typescript
let op: (x: number, y: number) => number;

op = (a, b) => a + b;        // fine - matches the signature
op = (a, b) => `${a}${b}`;   // Error flagged here
```

*What just happened:* `op` is declared to hold "a function taking two numbers and returning a number." The first assignment matches, so it's accepted - and notice the parameters `a` and `b` need no annotation, because TypeScript already knows from `op`'s type what they must be (this is **contextual typing**). The second assignment returns a string, breaking the declared contract:

```console
Type '(a: number, b: number) => string' is not assignable to type '(x: number, y: number) => number'.
```

⚠️ **Don't confuse the two arrows.** `(x: number) => number` written as a *type* (after a colon, in an annotation) describes a function's shape. `(x) => x * 2` written as a *value* is an actual arrow function. Same symbol, opposite roles - one is a label, the other is the thing being labeled. You'll use the type form constantly once you start typing callbacks in Phase 4 and beyond.

## Optional and default parameters

Real functions don't always take every argument every time. TypeScript has two distinct tools for that, and the difference between them matters.

An **optional parameter** is marked with `?`. The caller may skip it - and when they do, its value is `undefined`.

```typescript
function greet(name: string, title?: string): string {
  if (title) {
    return `Hello, ${title} ${name}`;
  }
  return `Hello, ${name}`;
}

greet("Ada");              // "Hello, Ada"
greet("Ada", "Dr.");       // "Hello, Dr. Ada"
```

*What just happened:* The `?` on `title` makes it optional, so `greet("Ada")` is a legal call. Inside the function, `title` might be a string *or* `undefined` - which is why the `if (title)` check exists before using it.

That last point is the crux. 📝 **An optional parameter's type secretly includes `undefined`.** `title?: string` is really `title: string | undefined`. The checker knows this and will stop you from treating it as a guaranteed string:

```typescript
function shout(message?: string): string {
  return message.toUpperCase();   // Error flagged here
}
```

```console
'message' is possibly 'undefined'.
```

*What just happened:* Because `message` is optional, it might be `undefined`, and `undefined.toUpperCase()` would crash at runtime. TypeScript catches it now and forces you to handle the missing case (with an `if`, a default, or the `?.` operator) before calling a method on it.

A **default parameter** is different: you give it a fallback value with `=`, so it's *never* `undefined` inside the function.

```typescript
function greet(name: string, greeting: string = "Hello"): string {
  return `${greeting}, ${name}`;
}

greet("Ada");             // "Hello, Ada"
greet("Ada", "Welcome");  // "Welcome, Ada"
```

*What just happened:* When the caller omits `greeting`, it falls back to `"Hello"`. Crucially, inside the body `greeting` is a plain `string` - not `string | undefined` - because the default guarantees a value is always there. TypeScript even infers the parameter's type *from* the default, so you can often drop the `: string` and write `greeting = "Hello"`.

⚠️ **Optional vs. default - the type difference is the whole point.** An optional param (`x?: T`) hands you `T | undefined` and makes you deal with the gap. A default param (`x: T = value`) fills the gap for you and hands you a clean `T`. Reach for a default when you have a sensible fallback; reach for optional when "absent" is genuinely a case you want to handle differently. Picking the right one means less defensive `undefined`-checking later.

## Rest parameters - "however many"

When a function should accept any number of trailing arguments, collect them with `...` into an array. The type is the array type - `number[]` for a list of numbers.

```typescript
function sum(...nums: number[]): number {
  return nums.reduce((total, n) => total + n, 0);
}

sum(1, 2, 3);        // 6
sum(10, 20);         // 30
sum();               // 0
sum(1, "2");         // Error flagged here
```

*What just happened:* `...nums: number[]` gathers every argument into an array called `nums`, and the checker enforces that *each* one is a number - so `sum(1, "2")` is rejected. Inside, `nums` is an ordinary `number[]`, so array methods like `.reduce` are fully typed. One signature, any arity, full type safety.

## `void` and `never` - functions that don't (usefully) return

Not every function hands back a value. TypeScript has a specific type for that, and it's worth understanding precisely.

📝 **`void`** - the return type of a function that doesn't return a meaningful value. It runs for its *effect* (printing, saving, updating something) rather than to produce a result you'd use.

```typescript
function logMessage(text: string): void {
  console.log(`[log] ${text}`);
  // no return statement - or a bare `return;`
}

const ignored = logMessage("hi");   // ignored is typed as void
```

*What just happened:* `logMessage` does its job - printing - and returns nothing. `void` documents that. If you capture its result, you get a `void` value, which TypeScript won't let you do anything useful with, correctly signalling "there's nothing here to use."

Then there's a rarer, sharper cousin. 📝 **`never`** - the type of a function that *never returns at all*: it always throws, or it loops forever. Not "returns nothing" (that's `void`) but "control flow never even reaches the end."

```typescript
function fail(reason: string): never {
  throw new Error(reason);   // always throws - never returns
}

function loopForever(): never {
  while (true) {
    // runs until the process is killed
  }
}
```

*What just happened:* `fail` always throws, so execution never makes it past the `throw` to return anything - `never` says exactly that. `loopForever` never exits its loop, same idea.

The distinction is subtle but real: a `void` function *finishes and comes back* having produced no value; a `never` function *never comes back at all*. You'll mostly *write* `void` (it's everywhere - event handlers, loggers, savers). You'll mostly *encounter* `never` rather than write it - TypeScript uses it internally for impossible cases, and it becomes genuinely useful later for exhaustiveness checking on unions, which you'll meet in a future phase.

## Recap

1. **A function signature is a contract.** Annotate parameters and the return type, and TypeScript holds both the caller and the function body to it - wrong-typed arguments and wrong-typed returns are caught before the code runs.
2. **Return types are often inferred** from the body, so you can omit them on small helpers. Write them explicitly on important/exported functions to *lock* the contract, so a mistake points at the function rather than at some distant caller.
3. **Arrow functions take the same annotations**, and the function-type form `(x: number) => number` lets you type a variable that holds a function - distinct from an arrow function *value*.
4. **Optional `x?: T` includes `undefined`** in its type (you must handle the missing case); **default `x: T = value` does not** (the fallback guarantees a real value). That type difference is the reason to choose one over the other.
5. **Rest parameters `...nums: number[]`** collect any number of trailing arguments into a typed array, giving you variable arity with full safety.
6. **`void`** types a function that returns no meaningful value; **`never`** types one that never returns at all (always throws or loops forever) - finishing-with-nothing versus never-finishing.

You can now type the contracts between the parts of your program - the highest-leverage place types pay off. Next, we turn from functions to *data*: how to describe the shape of objects with interfaces and type aliases, so the things you pass through those contracts are just as well-defined as the contracts themselves.

## Quick check

Lock in the three ideas that bite hardest - return inference, the optional-vs-default type difference, and void vs. never:

```quiz
[
  {
    "q": "You write `function add(a: number, b: number) { return a + b; }` with no return type annotation. What type does TypeScript give the return value?",
    "choices": [
      "`number` - TypeScript infers it from the body (`a + b` is two numbers added)",
      "`any` - without an explicit annotation the return type is untyped",
      "`void` - a function with no return annotation returns nothing",
      "It's a compile error; the return type is required"
    ],
    "answer": 0,
    "explain": "TypeScript reads the body and infers the return type. Since `a + b` adds two numbers, it concludes the function returns `number`. Writing `: number` explicitly is optional here - it's worth doing on important/exported functions to lock the contract, but inference handles small helpers fine."
  },
  {
    "q": "What's the difference between `function f(x?: string)` and `function f(x: string = \"hi\")` inside the function body?",
    "choices": [
      "With `x?`, `x` is typed `string | undefined` and you must handle the missing case; with the default, `x` is always a plain `string`",
      "There is no difference - both make the parameter optional in the same way",
      "With `x?`, `x` is always a `string`; with the default, `x` might be `undefined`",
      "The default version makes `x` required, while `x?` makes it optional"
    ],
    "answer": 0,
    "explain": "An optional parameter's type secretly includes `undefined` (`x?: string` means `string | undefined`), so the checker forces you to handle the absent case. A default parameter fills the gap with a fallback, so inside the body it's a guaranteed `string` - no undefined to worry about."
  },
  {
    "q": "When should a function's return type be `never` rather than `void`?",
    "choices": [
      "When the function never returns at all - it always throws or loops forever",
      "When the function returns nothing but finishes normally, like a logger",
      "Whenever the function has no `return` statement",
      "When the function returns `undefined` explicitly"
    ],
    "answer": 0,
    "explain": "`void` means the function finishes and comes back having produced no useful value (a logger, a saver). `never` means control flow never reaches the end - the function always throws or loops forever, so it can't return anything. Finishing-with-nothing versus never-finishing."
  }
]
```

---

[← Phase 2: Why Types & the Basic Types](02-why-types-and-basic-types.md) · [Guide overview](_guide.md) · [Phase 4: Objects, Interfaces & Type Aliases →](04-objects-interfaces-and-types.md)
