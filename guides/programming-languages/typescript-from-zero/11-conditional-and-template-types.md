---
title: "Conditional & Template Literal Types - Types That Make Decisions"
guide: "typescript-from-zero"
phase: 11
summary: "Types can branch and pattern-match: conditional types are a type-level ternary, infer reaches inside a type, and template literal types build string types from patterns. Learn to read the magic and write the simple cases."
tags: [typescript, conditional-types, infer, template-literal-types, distributive-conditional, type-level-programming]
difficulty: advanced
synonyms: ["typescript conditional types", "typescript infer keyword", "typescript template literal types", "typescript extends ternary type", "typescript ReturnType implementation", "typescript type level programming"]
updated: 2026-06-22
---

# Conditional & Template Literal Types - Types That Make Decisions

This is the deep end of the type system - the phase where types stop being static labels and start to *compute*. If you've ever opened a library's `.d.ts` file, seen `T extends (...args: any[]) => infer R ? R : never`, and quietly closed the tab, this phase is for you. By the end you'll be able to *read* that line, and write its simpler cousins yourself.

Here's the one mental model to carry through everything below: **a type can be computed from another type**. Up to now your types have been fixed shapes - `string`, `Product`, `User[]`. But TypeScript also lets a type *branch* ("if the input is a string, the result is X, otherwise Y") and *pattern-match* ("if the input is a function, pull out its return type"). Conditional types are the branching; `infer` is the pattern-matching; template literal types do the same trick for strings. Everything in this phase is one of those three ideas.

One reassurance up front: **most application code never needs to *write* any of this.** You'll mostly *read* it, in the type definitions of libraries you use. The last section covers exactly when reaching for these tools pays off - and when it makes your code worse.

## Conditional types - a ternary for types

You already know the JavaScript ternary: `condition ? a : b`. Conditional types are the same shape, operating on *types* instead of values.

📝 **Conditional type** - `T extends U ? X : Y`. Read: "if `T` is assignable to `U`, the result is `X`; otherwise `Y`." The `extends` here doesn't mean inheritance - it's a yes/no question: *does `T` fit into `U`?*

Start with the simplest example, which does nothing useful but makes the mechanics obvious:

```typescript
type IsString<T> = T extends string ? true : false;

type A = IsString<"hello">; // true
type B = IsString<42>;      // false
```

`IsString<T>` takes another type `T` as input (that's what `<T>` is - a type parameter, like a function argument but for types). Asking for `IsString<"hello">`, TypeScript checks "is `"hello"` assignable to `string`?" - yes - so the result is `true`. For `IsString<42>`, `42` is not a string, so you get `false`. The type literally *decided* its own value from its input.

Now one you've already used without knowing how it's built. The standard library's `NonNullable<T>` strips `null` and `undefined` out of a type. Its actual definition:

```typescript
type MyNonNullable<T> = T extends null | undefined ? never : T;

type Cleaned = MyNonNullable<string | null | undefined>; // string
```

For each member of the input, the conditional asks "is this `null` or `undefined`?" If yes, it resolves to `never` - the type with no values, which vanishes from a union. If no, it keeps the type as-is. Feed it `string | null | undefined` and the `null`/`undefined` arms disappear, leaving `string`. (Why it processes each union member separately is covered in the *distributive* section below.)

💡 **`never` is the type-level "delete" button.** When you want a conditional type to *remove* something, resolve that branch to `never`. In a union, `never` evaporates. This pattern - `... ? never : T` - is how almost every "filter out X" utility type is built.

## `infer` - reaching inside a type

A conditional type can ask "does `T` match this shape?" But often you want more than yes/no - you want to *grab a piece* of the matched type. That's what `infer` is for.

📝 **`infer`** - used only inside the `extends` clause of a conditional type. It captures part of the matched type and binds it to a name you use in the `true` branch. A placeholder that says "match anything here, and call it `R`."

The classic example is extracting a function's return type - a simplified version of the built-in `ReturnType<T>`:

```typescript
type MyReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

function getUser() {
  return { id: 1, name: "Ada" };
}

type User = MyReturnType<typeof getUser>; // { id: number; name: string }
```

The conditional asks "does `T` match the shape *some function returning something*?" `infer R` sits in the return-type position, meaning "capture whatever the return type is as `R`." When `T` is the type of `getUser`, the match succeeds and `R` becomes `{ id: number; name: string }`, which the `true` branch returns. If `T` weren't a function, the match would fail and you'd get `never`. (`typeof getUser` grabs the *type* of the function value - covered in [Phase 5](05-unions-and-narrowing.md).)

The same trick pulls out *parameter* types - exactly how the built-in `Parameters<T>` works:

```typescript
type MyParameters<T> = T extends (...args: infer P) => any ? P : never;

function greet(name: string, times: number) {}

type Args = MyParameters<typeof greet>; // [name: string, times: number]
```

This time `infer P` sits in the *arguments* position, capturing the whole parameter list as a tuple `[string, number]`. Same mechanism, different slot. You don't need to memorize these - TypeScript ships `ReturnType` and `Parameters` built in - but now you can *read* them when you hover over them in your editor.

💡 **`infer` is how library types "reach inside" your types.** Whenever a utility seems to magically know the return type, element type, or resolved value of your `Promise`, there's an `infer` doing the reaching. It's the single most common ingredient in advanced library typings - recognizing it demystifies most of them at a glance.

## Distributive conditional types - the surprising part

Here's the behavior that catches everyone off guard, including veterans. When the type you pass to a conditional is a **union**, the conditional doesn't run once on the whole union - it runs *separately on each member* and combines the results back into a union.

⚠️ **This is called *distribution*, and it's automatic.** A "naked" type parameter (`T` bare on the left of `extends`) distributes over unions. It's why `MyNonNullable<string | null>` worked member-by-member earlier instead of asking "is the whole union `null | undefined`?" - which would have answered "no" and broken everything.

Watch it with a conditional that wraps each type in an array:

```typescript
type ToArray<T> = T extends any ? T[] : never;

type Result = ToArray<string | number>; // string[] | number[]
```

You might have expected `(string | number)[]` - one array of mixed values. Instead you got `string[] | number[]` - *either* an array of strings *or* numbers. That's distribution: TypeScript split `string | number` into `string` and `number`, ran `ToArray` on each, and rejoined the results with `|`. The conditional fired twice, once per union member.

This is usually what you want (it's why filtering utilities work), but when it isn't, suppress it by wrapping both sides in a tuple so `T` is no longer "naked":

```typescript
// [T] is not a naked type parameter, so distribution is off
type ToArrayNoDistribute<T> = [T] extends [any] ? T[] : never;

type Result2 = ToArrayNoDistribute<string | number>; // (string | number)[]
```

Writing `[T] extends [any]` instead of `T extends any` wraps the parameter in a one-element tuple. TypeScript now sees the whole union as a single unit, doesn't split it, and you get the combined `(string | number)[]`. You don't need this often - but when a conditional type gives a weirdly *split* result you didn't expect, distribution is the culprit, and `[T]` is the fix.

## Template literal types - building string types from patterns

Conditional types branch on types. Template literal types do something different: build new *string literal types* by stitching together pieces, using the same backtick syntax as JavaScript template strings.

📝 **Template literal type** - a string literal type built from a pattern, e.g. `` `on${string}` ``. Interpolate other types into a string template, and the result describes strings matching that shape. Combined with union types, one template can describe a whole family of valid strings.

The headline use is generating related string types instead of writing them by hand. Say you have a set of event names and want the "handler" versions (`click` → `onClick`):

```typescript
type EventName = "click" | "focus" | "blur";

type HandlerName = `on${Capitalize<EventName>}`;
// "onClick" | "onFocus" | "onBlur"
```

The template `` `on${Capitalize<EventName>}` `` interpolated each member of the `EventName` union into the pattern. `Capitalize<T>` uppercases the first letter, so `"click"` became `"Click"`, then the `on` prefix gave `"onClick"`. Because `EventName` is a union, you got a union back: all three handler names, generated automatically. Change `EventName` and the handler names update with it - no manual list to keep in sync.

A more real-world flavor: typed API routes, where a string must follow `METHOD /path`:

```typescript
type Method = "GET" | "POST";
type Path = "/users" | "/posts";

type Route = `${Method} ${Path}`;
// "GET /users" | "GET /posts" | "POST /users" | "POST /posts"

const valid: Route = "POST /users"; // ok
```

```console
const bad: Route = "DELETE /users";
//    ~~~ Type '"DELETE /users"' is not assignable to type 'Route'.
```

The template combined every `Method` with every `Path` - TypeScript takes the cross-product of the two unions, giving all four valid route strings. `"POST /users"` is fine, a member of that union; `"DELETE /users"` is rejected because `DELETE` was never in `Method`. You've turned a free-form string into a tightly checked set, and your editor autocompletes the valid routes as you type - the whole appeal.

## When to reach for this - and when not

Now the straight-talk part. Everything above is powerful, and that power is a trap if you misjudge when to use it.

💡 **You will read these far more than you write them.** The vast majority of application code - components, API handlers, business logic - is typed perfectly well with tools from earlier phases: interfaces, unions, generics, the built-in utility types. Conditional and template literal types live mostly in the `.d.ts` files of *libraries*, written once by authors so thousands of callers get great autocomplete and safety. Reading them is the daily skill; writing them is the occasional one.

⚠️ **Type-level programming can become write-only code, and it can slow your compiler to a crawl.** A deeply nested conditional type with three `infer`s and a recursive helper is genuinely hard for the next person (often future-you) to understand, and elaborate type computations make the compiler and editor sluggish. Before building one, ask: *is the payoff a real, measurable improvement to the people calling this code?* If the answer is "it'd be kind of clever," write the simpler, more verbose type instead. A type you can read at a glance beats a brilliant one you have to decode.

So when *is* it worth it? When you're building something whose entire value is a great typed API for its callers - a query builder, a router, a form library. When Prisma gives fully-typed results matching the columns you selected, or tRPC autocompletes your server procedures on the client with zero code generation, *this is the machinery doing it*: conditional types branching on your schema, `infer` reaching into your function signatures, template literals assembling route strings. It was never magic - it's the three tools you just learned, applied with care.

## Recap

1. A **conditional type** `T extends U ? X : Y` is a ternary for types: checks whether `T` is assignable to `U` and resolves to one branch or the other. Resolving a branch to `never` is how "filter out X" utilities like `NonNullable` delete types from a union.
2. **`infer`** captures a piece of the matched type inside the `extends` clause - it's how `ReturnType` grabs a function's return type and `Parameters` grabs its argument list. Whenever a library type "reaches inside" yours, an `infer` is doing it.
3. **Distributive conditional types**: a conditional over a *union* runs once per member and rejoins the results. Usually what you want, surprises you when it isn't, and is suppressed by wrapping the parameter in a tuple (`[T] extends [U]`).
4. **Template literal types** build string literal types from patterns with backtick syntax (`` `on${Capitalize<E>}` ``), and crossed with unions they generate whole families of valid strings - great for event names, route strings, and the like.
5. You'll mostly **read** these in library `.d.ts` files, not write them - everyday app code rarely needs them.
6. ⚠️ Type-level programming can become unreadable and slow the compiler. Reach for it only when the payoff - excellent autocomplete and safety for callers - is real; otherwise prefer the simpler type. It's the machinery behind the "magic" in libraries like Prisma and tRPC.

## Quick check

Lock in the core moves - branching, reaching inside, and building strings:

```quiz
[
  {
    "q": "What does the conditional type `T extends string ? true : false` resolve to when `T` is `42`?",
    "choices": [
      "`false` - because the number `42` is not assignable to `string`, so the conditional takes the else branch",
      "`true` - because every type extends `string` in TypeScript",
      "`never` - because the types don't match",
      "A compile error, because you can't compare a number to a string"
    ],
    "answer": 0,
    "explain": "A conditional type is a type-level ternary. `extends` asks 'is `T` assignable to `string`?' For `T = 42` the answer is no, so it resolves to the else branch - the type `false`."
  },
  {
    "q": "In `type MyReturnType<T> = T extends (...args: any[]) => infer R ? R : never`, what is the role of `infer R`?",
    "choices": [
      "It captures the function's return type and binds it to `R`, so the `true` branch can return that captured type",
      "It declares a new generic parameter that the caller must supply",
      "It forces `T` to be a function or the type errors",
      "It runs the function `T` and stores the result in `R`"
    ],
    "answer": 0,
    "explain": "`infer` is pattern-matching inside the `extends` clause. `infer R` sits in the return-type position and captures whatever the function returns, naming it `R` so the `true` branch can resolve to it. If `T` isn't a function, the match fails and you get `never`."
  },
  {
    "q": "Given `type ToArray<T> = T extends any ? T[] : never`, what is `ToArray<string | number>`?",
    "choices": [
      "`string[] | number[]` - the conditional distributes over each union member and rejoins the results",
      "`(string | number)[]` - one array holding both types",
      "`never` - because a union can't extend `any`",
      "`any[]` - because the condition is `extends any`"
    ],
    "answer": 0,
    "explain": "This is distribution: a naked type parameter over a union runs the conditional once per member, giving `string[]` and `number[]`, then rejoins them as `string[] | number[]`. To get `(string | number)[]` instead, you'd suppress distribution with `[T] extends [any]`."
  }
]
```

---

[← Phase 10: Utility & Mapped Types](10-utility-and-mapped-types.md) · [Guide overview](_guide.md) · [Phase 12: Typing the Real World →](12-typing-the-real-world.md)