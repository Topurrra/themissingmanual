---
title: "Generics — Reusable Code That Keeps Its Types"
guide: "typescript-from-zero"
phase: 6
summary: "Generics let one function or type work over many types without throwing the types away like `any` does. Type parameters, multiple parameters, constraints with extends and keyof, and generic types, interfaces, and classes."
tags: [typescript, generics, type-parameters, constraints, generic-functions, generic-types, keyof]
difficulty: intermediate
synonyms: ["typescript generics explained", "typescript type parameter", "typescript generic function", "typescript generic constraint extends", "typescript generic class", "why use generics typescript", "typescript generic interface"]
updated: 2026-06-22
---

# Generics — Reusable Code That Keeps Its Types

Here's a tension you've already felt. You write a small helper — grab the first element of an array, wrap a value in a box, swap two things — and you want it to work for *any* type. Numbers, strings, users, whatever. The lazy way to say "any type" in TypeScript is the `any` type. But `any` doesn't mean "any type, tracked" — it means "stop checking entirely." The moment a value passes through `any`, TypeScript forgets what it was. Your reusable helper becomes a black hole that swallows every type it touches.

The mental model for this whole phase: **a generic is a placeholder for a type, filled in at the moment you call the code.** Instead of committing to `number` or `string` when you *write* the function, you leave a blank — and TypeScript fills that blank with the real type when someone *uses* it. One function, many types, and the types survive the trip. That's the difference between `any` (types thrown away) and generics (types carried through). Everything below is that one idea, applied.

## The problem: `any` throws the types away

Let's write the simplest possible reusable function and watch it fail us. `first` returns the first element of an array. We don't know what's in the array, so we reach for `any`:

```typescript
function first(arr: any[]): any {
  return arr[0];
}

const n = first([1, 2, 3]);   // n is `any`
const s = first(["a", "b"]);  // s is `any`

n.toUpperCase();  // no error?! n is a number — this crashes at runtime
```

*What just happened:* The function works at runtime — it really does return the first element. But look at the *types*. `first([1, 2, 3])` should give us a `number`, and `first(["a", "b"])` should give us a `string`. Instead both come back as `any`, because the return type is annotated `any`. We told TypeScript "I don't know what this is," and TypeScript took us at our word and stopped checking. So `n.toUpperCase()` — calling a string method on a number — sails right past the type checker and blows up only when the code runs. We threw away exactly the safety we adopted TypeScript for.

⚠️ **`any` is contagious.** A single `any` in a return type doesn't stay put — it spreads to every variable that touches the result, and each of *those* stops being checked too. Reusable helpers are the worst place to use `any` precisely because they're called everywhere. One `any[]` helper can quietly switch off type-checking across half your codebase.

## Type parameters: the blank you fill in at the call site

What we actually want to say is: "this function works for *some* type `T`, and whatever `T` is going in, that's what comes out." TypeScript lets you write exactly that with a **type parameter**.

📝 **Type parameter** — a named placeholder for a type, written in angle brackets after the function name (`<T>`). It stands in for a real type that gets supplied — usually *inferred* — when the function is called. By convention it's a single capital letter (`T` for "type", `K` for "key", `V` for "value"), but it can be any name.

Here's `first` again, done right:

```typescript
function first<T>(arr: T[]): T | undefined {
  return arr[0];
}

const n = first([1, 2, 3]);     // n is `number`
const s = first(["a", "b"]);    // s is `string`
const u = first<boolean>([]);   // u is `boolean | undefined`
```

*What just happened:* The `<T>` after the name declares a type parameter — a blank. The signature reads: "take an array of `T`, return a `T` or `undefined`." When you call `first([1, 2, 3])`, TypeScript looks at the argument, sees a `number[]`, and *infers* `T = number` — so the return type is `number | undefined`, and `n` is a `number`. Call it with strings and `T` becomes `string`. The same function, written once, produces the *correct, specific* type at every call site. You almost never write `<boolean>` explicitly like in the last line; inference fills `T` in for you from the argument.

The payoff isn't only safety — it's tooling. Because TypeScript now knows `n` is a `number`, your editor offers number methods on it and red-underlines `n.toUpperCase()` instantly:

```console
Property 'toUpperCase' does not exist on type 'number'.
```

💡 **The whole win in one line.** `any` says "I don't know and I don't care." A type parameter says "I don't know *yet*, but I'll remember whatever it turns out to be." Same flexibility, zero loss of information. That "remember it" is the entire reason generics exist.

## Multiple type parameters

A function can have more than one blank. Each is independent and inferred separately. A classic example is `pair`, which bundles two values of possibly different types into a tuple:

```typescript
function pair<A, B>(a: A, b: B): [A, B] {
  return [a, b];
}

const p = pair("id", 42);   // p is [string, number]
```

*What just happened:* Two type parameters, `A` and `B`. `pair("id", 42)` infers `A = string` from the first argument and `B = number` from the second, so the return type is the tuple `[string, number]`. The two blanks don't have to match — they're filled in independently — which is exactly what you want for a function combining unrelated values.

## Constraints: `extends` to require *some* shape

A bare `<T>` means "literally any type," which is sometimes too permissive. Suppose you want a function that logs the length of its argument. Inside the body you'd write `arg.length` — but if `T` could be *anything*, TypeScript correctly objects, because a `number` has no `.length`. You need to tell TypeScript "`T` can be any type, *as long as* it has a `length`." That's a **constraint**.

📝 **Constraint** — a requirement on a type parameter, written `<T extends Shape>`. It narrows the blank from "any type" to "any type that is assignable to `Shape`," which lets you safely use `Shape`'s members inside the function while still accepting many concrete types.

```typescript
function logLength<T extends { length: number }>(arg: T): T {
  console.log(arg.length);   // safe: every T is guaranteed to have .length
  return arg;
}

logLength("hello");        // ok, strings have length → logs 5
logLength([1, 2, 3]);      // ok, arrays have length → logs 3
logLength(42);             // error
```

*What just happened:* `<T extends { length: number }>` constrains `T` to types that have a numeric `length` property. Strings and arrays qualify, so those calls are fine — and crucially, `T` is still preserved, so `logLength([1,2,3])` returns `number[]`, not some flattened type. But `42` is a `number` with no `length`, so it's rejected at compile time:

```console
Argument of type 'number' is not assignable to parameter of type '{ length: number; }'.
```

Note that `extends` here does *not* mean class inheritance. In a generic constraint it means "is assignable to" — "has at least this shape." Same keyword, different job from the `extends` you'll see with classes in the next phase.

### `keyof` and safe property access

A common, powerful pattern is reading a property off an object *by key* without losing track of the value's type. To do this safely you need a second constraint that ties one type parameter to another, using `keyof`.

📝 **`keyof T`** — an operator that produces the union of `T`'s property *names* as a literal type. For `{ name: string; age: number }`, `keyof` of it is the type `"name" | "age"`. (This is your first taste — Phase 10 goes deep on `keyof` and the rest of the type-operator toolkit.)

```typescript
function getProp<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const user = { name: "Ada", age: 36 };

const name = getProp(user, "name");   // name is `string`
const age = getProp(user, "age");     // age is `number`
getProp(user, "email");               // error: "email" isn't a key of user
```

*What just happened:* Two type parameters working together. `T` is the object's type (inferred as `{ name: string; age: number }`). `K extends keyof T` constrains `key` to be one of `T`'s actual keys — `"name" | "age"`. The return type `T[K]` is a *lookup*: "the type of `T`'s property named `K`." So `getProp(user, "name")` returns `string` and `getProp(user, "age")` returns `number` — different precise types from the same function. Pass a key that doesn't exist and TypeScript stops you cold:

```console
Argument of type '"email"' is not assignable to parameter of type '"name" | "age"'.
```

This is generics earning their keep: a single helper that's both fully reusable *and* fully type-safe, catching typo'd property names before the code ever runs.

## Generic types, interfaces, and classes

Generics aren't only for functions. Any **type alias**, **interface**, or **class** can take type parameters too — the same "blank filled in later" idea applied to data shapes instead of functions.

```typescript
// A generic interface: a box that holds a value of some type T.
interface Box<T> {
  value: T;
}

const numberBox: Box<number> = { value: 7 };
const stringBox: Box<string> = { value: "hi" };

// A generic type alias: a result that's either success data or an error.
type Result<T> = { ok: true; data: T } | { ok: false; error: string };

function parseAge(input: string): Result<number> {
  const n = Number(input);
  return Number.isNaN(n)
    ? { ok: false, error: "not a number" }
    : { ok: true, data: n };
}

// A generic class: a type-safe stack.
class Stack<T> {
  private items: T[] = [];
  push(item: T): void {
    this.items.push(item);
  }
  pop(): T | undefined {
    return this.items.pop();
  }
}

const numbers = new Stack<number>();
numbers.push(1);
numbers.push(2);
const top = numbers.pop();   // top is `number | undefined`
numbers.push("oops");        // error: "oops" is not a number
```

*What just happened:* Each construct carries a type parameter you fill in at the point of use. `Box<T>` becomes a concrete `Box<number>` (its `value` must be a number) or `Box<string>`. `Result<T>` is a reusable success-or-error shape — `Result<number>` here means "on success, `data` is a number." `Stack<T>` is a class where `T` flows through every method: you create a `Stack<number>`, so `push` only accepts numbers and `pop` returns `number | undefined`. `numbers.push("oops")` is rejected at compile time, because the stack *remembers* it's a stack of numbers:

```console
Argument of type 'string' is not assignable to parameter of type 'number'.
```

💡 **You've been using generics all along.** Every `Array<T>`, `Promise<T>`, and `Map<K, V>` you've written is generic — `number[]` is just shorthand for `Array<number>`, and `Promise<User>` is "a promise that resolves to a `User`." The angle-bracket syntax you've seen on built-in types is the exact same machinery you can now use on your *own* functions, interfaces, and classes. Generics weren't a new concept this phase — you were already a fluent user. Now you're an author.

## Recap

1. **`any` throws types away; generics carry them through.** A reusable helper typed with `any` stops type-checking everywhere it's used. A generic keeps the real type intact from input to output.
2. **A type parameter (`<T>`) is a blank filled in at the call site** — almost always *inferred* from the arguments — so one function produces the correct, specific type for every caller.
3. **Type parameters are independent.** A function like `pair<A, B>` can take several, each inferred separately, letting you combine unrelated types without losing either.
4. **Constraints (`<T extends Shape>`) narrow the blank** so you can safely use a shape's members inside the function. `<K extends keyof T>` plus the lookup type `T[K]` gives you type-safe property access by key.
5. ⚠️ In a generic constraint, **`extends` means "is assignable to,"** not class inheritance — it's "has at least this shape."
6. **Interfaces, type aliases, and classes can be generic too** (`Box<T>`, `Result<T>`, `Stack<T>`) — and you already use generic built-ins like `Array<T>`, `Promise<T>`, and `Map<K, V>` constantly.

Next, in [Phase 7](07-classes-and-oop.md), we move from generic *containers* to **classes and OOP in TypeScript** — where you'll see how access modifiers, inheritance, and interfaces combine, and where that other meaning of `extends` finally shows up.

## Quick check

Test yourself on the one idea that drives this whole phase — that a generic *keeps* the type instead of discarding it:

```quiz
[
  {
    "q": "Why does `function first<T>(arr: T[]): T | undefined` give a better result than `function first(arr: any[]): any`?",
    "choices": [
      "The generic version infers the element type at the call site, so `first([1,2,3])` returns `number`, while the `any` version returns `any` and stops type-checking the result",
      "The generic version runs faster because TypeScript optimizes type parameters at runtime",
      "There's no real difference — `T` and `any` mean the same thing",
      "The `any` version is safer because it accepts more argument types"
    ],
    "answer": 0,
    "explain": "A type parameter is inferred from the argument and preserved in the return type, so the caller gets a precise type (`number`). `any` discards the type and switches off checking, so the result is unchecked `any`. Types are erased at runtime, so there's no speed difference."
  },
  {
    "q": "In `function getProp<T, K extends keyof T>(obj: T, key: K): T[K]`, what does the constraint `K extends keyof T` accomplish?",
    "choices": [
      "It restricts `key` to be one of `T`'s actual property names, so passing a key that doesn't exist is a compile error",
      "It makes `getProp` work only on classes that inherit from `T`",
      "It forces every property of `T` to be a string",
      "It converts `obj` into an array of its keys before returning"
    ],
    "answer": 0,
    "explain": "`keyof T` is the union of `T`'s property names, and `K extends keyof T` constrains `key` to that union — so a non-existent key like `\"email\"` is rejected. The lookup type `T[K]` then returns the precise type of that property."
  },
  {
    "q": "What does `extends` mean in a generic constraint like `<T extends { length: number }>`?",
    "choices": [
      "`T` must be assignable to that shape — i.e. it must have at least a numeric `length` property",
      "`T` must be a subclass of a class named `length`",
      "`T` is automatically given a `length` property if it doesn't have one",
      "`T` can be any type at all, with no restriction"
    ],
    "answer": 0,
    "explain": "In a generic constraint, `extends` means 'is assignable to' — 'has at least this shape.' It lets you safely use `.length` inside the function while still accepting many concrete types (strings, arrays). It is not class inheritance, despite the shared keyword."
  }
]
```

---

[← Phase 5: Unions, Literals & Narrowing](05-unions-and-narrowing.md) · [Guide overview](_guide.md) · [Phase 7: Classes & OOP in TypeScript →](07-classes-and-oop.md)
