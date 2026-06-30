---
title: "Unions, Literals & Narrowing - One of Several Shapes"
guide: "typescript-from-zero"
phase: 5
summary: "Real values are often one of several possibilities. Union and literal types model that directly, then narrowing forces you to handle each case - peaking with discriminated unions and exhaustiveness checks the compiler enforces."
tags: [typescript, union-types, literal-types, narrowing, type-guards, discriminated-unions, type-narrowing]
difficulty: intermediate
synonyms: ["typescript union types", "typescript literal types", "typescript narrowing", "typescript type guard", "typescript discriminated union", "typescript typeof in check", "typescript tagged union"]
updated: 2026-06-22
---

# Unions, Literals & Narrowing - One of Several Shapes

So far your types have described one thing: a value is a `string`, or it's a `Product`, or it's a `number[]`. But real programs are full of values that are *one of several possibilities*. An API field that's either a string or `null`. A status that's `"pending"`, `"shipped"`, or `"cancelled"` - never anything else. A shape that's either a circle or a square, each with its own measurements.

Here's the mental model for this whole phase: **TypeScript lets you say "this value is one of these specific possibilities" - and then refuses to let you use it until you've figured out which one you're actually holding.** That second half is the magic. The checker tracks your code branch by branch, and inside an `if` that proves "this is a string," it *knows* it's a string and lets you call string methods. This is where TypeScript stops feeling like paperwork and starts feeling genuinely smart.

## Union types - a value that's one of several types

📝 **Union type** - a type written `A | B` meaning "a value of type `A` *or* type `B`." The `|` reads as "or." A `string | number` variable can hold either, and TypeScript only lets you do things that are valid for *both* until you prove which one you've got.

That last clause is the rule that trips people up, so let's see it bite:

```typescript
function format(id: string | number) {
  return id.toUpperCase(); // Error
}
```
```console
Property 'toUpperCase' does not exist on type 'string | number'.
  Property 'toUpperCase' does not exist on type 'number'.
```

*What just happened:* `id` is `string | number`, so at this point in the code it might genuinely be a number - and numbers have no `.toUpperCase()`. TypeScript blocks the call because the operation isn't safe for *every* member of the union. You're only allowed to use what's common to all members until you narrow the type down (which is the next big idea). This feels annoying for about a day, then you realize it's stopping a real crash: calling `.toUpperCase()` on a number throws at runtime.

## Literal types - exact values, not just "some string"

A union of *types* is useful. A union of *exact values* is where it gets powerful.

📝 **Literal type** - a type that is one specific value, not a whole category. `"shipped"` is a type that only the string `"shipped"` satisfies. `42` is a type only the number `42` satisfies. You combine them with `|` to describe a fixed set of allowed values.

Compare a bare `string` against a literal union for a fixed set of choices:

```typescript
// Bare string: any string is accepted, including typos.
function setAlignLoose(value: string) { /* ... */ }
setAlignLoose("centre"); // accepted - but "centre" is a typo, no warning

// Literal union: only these three are allowed.
type Align = "left" | "right" | "center";
function setAlign(value: Align) { /* ... */ }

setAlign("center"); // fine
setAlign("centre"); // Error
```
```console
Argument of type '"centre"' is not assignable to parameter of type 'Align'.
```

*What just happened:* With a bare `string` parameter, every string is fair game - the misspelled `"centre"` sails through and breaks something later. With `type Align = "left" | "right" | "center"`, the checker rejects anything outside the set the moment you type it, *and* your editor autocompletes the three valid options so you don't have to remember them. For any fixed set of choices - alignments, HTTP methods, status codes, sizes - a literal union beats a bare `string` every time.

💡 **Why this is a big deal.** A literal union turns "a value that's supposed to be one of these" (enforced by hope and comments) into "a value the compiler *guarantees* is one of these." Typos become compile errors, the valid options become autocomplete, and you never write a `default` branch handling an impossible string.

## Narrowing - proving which member you have

You saw the union problem: you can't use `string`-only operations on a `string | number`. The fix is **narrowing** - and it's the heart of working with unions.

📝 **Narrowing** - writing a runtime check that lets TypeScript shrink a value's type within a branch of code. Inside an `if` that proves the value is a string, the checker *narrows* the type from `string | number` to just `string`, and from there every string operation is allowed.

The remarkable part: you don't tell the checker the narrowed type. It reads your ordinary runtime check and works it out. The everyday tools for narrowing:

- **`typeof x === "string"`** - for primitives (`"string"`, `"number"`, `"boolean"`, etc.).
- **`"key" in obj`** - checks whether a property exists, narrowing to the variant that has it.
- **`Array.isArray(x)`** - separates an array from a non-array member.
- **A truthiness check** like `if (x)` - narrows `string | null` to `string` by ruling out `null`/`undefined`.

Here's `typeof` narrowing fixing the broken `format` from earlier:

```typescript
function format(id: string | number): string {
  if (typeof id === "string") {
    // In here, TypeScript knows id is a string.
    return id.toUpperCase();
  }
  // Down here, the string case is ruled out - id is a number.
  return id.toFixed(2);
}

console.log(format("abc")); // "ABC"
console.log(format(3.14159)); // "3.14"
```

*What just happened:* The `typeof id === "string"` check does double duty. At runtime it picks the right branch; at *compile* time TypeScript uses it to narrow `id` to `string` inside the `if`, so `.toUpperCase()` is allowed. After the `if`, the only remaining possibility is `number`, so `.toFixed(2)` is allowed there with no extra check needed. The checker followed your logic the same way a careful reader would - and the earlier error is gone.

## Discriminated unions - modeling "one of N variants"

Narrowing a `string | number` is handy. The real power move is modeling *objects* that come in several shapes - and TypeScript has a pattern built exactly for it.

📝 **Discriminated union** - a union of object types that all share a common literal field (the *discriminant* or *tag*), with a different value per variant. Checking that tag narrows the value to one specific shape, with all of its fields available. Also called a *tagged union*.

Picture shapes. A circle has a radius; a square has a side length. Give each a `kind` tag, union them, and a `switch` on `kind` narrows each case to its full shape:

```typescript
interface Circle {
  kind: "circle";
  radius: number;
}
interface Square {
  kind: "square";
  side: number;
}
type Shape = Circle | Square;

function area(shape: Shape): number {
  switch (shape.kind) {
    case "circle":
      // Tag is "circle" → shape is a Circle here, so .radius exists.
      return Math.PI * shape.radius ** 2;
    case "square":
      // Tag is "square" → shape is a Square here, so .side exists.
      return shape.side ** 2;
  }
}

console.log(area({ kind: "circle", radius: 2 })); // 12.566...
console.log(area({ kind: "square", side: 3 })); // 9
```

*What just happened:* `Shape` is a union of two object types, each carrying a literal `kind`. Inside `case "circle"`, TypeScript narrows `shape` to `Circle`, so `shape.radius` is valid and `shape.side` would be an error. The `kind` field is the key that unlocks the right shape in each branch - you never have to guess or cast.

💡 **This is the answer to "how do I model one of N variants?"** Discriminated unions are TypeScript's idiomatic replacement for enums-with-data, sealed classes, or a bag of optional fields. Each variant declares exactly the fields it has - no nullable `radius` that's only sometimes meaningful, no runtime confusion about which fields are valid. The shape *is* the documentation, and the checker enforces it.

## Exhaustiveness checking - the compiler catches what you forgot

Discriminated unions have one more trick, and it's the feature that makes the pattern indispensable on a real codebase: the compiler can force you to handle *every* variant, forever.

Suppose someone adds a `Triangle` to `Shape` next month but forgets to update `area`. Without protection, `area` silently returns `undefined` for triangles - a classic bug that hides until production. The fix is a `default` case that assigns the value to a variable of type `never`.

📝 **`never`** - the type of a value that can't exist. If every variant of a union has been handled, the value left over in the `default` branch has type `never`. Assigning anything *other* than `never` to a `never` variable is a compile error - which is exactly the alarm you want.

Watch it catch the forgotten case:

```typescript
interface Circle { kind: "circle"; radius: number; }
interface Square { kind: "square"; side: number; }
interface Triangle { kind: "triangle"; base: number; height: number; } // newly added
type Shape = Circle | Square | Triangle;

function area(shape: Shape): number {
  switch (shape.kind) {
    case "circle":
      return Math.PI * shape.radius ** 2;
    case "square":
      return shape.side ** 2;
    default:
      // We forgot the "triangle" case, so shape is Triangle here - not never.
      const _exhaustive: never = shape; // Error
      return _exhaustive;
  }
}
```
```console
Type 'Triangle' is not assignable to type 'never'.
```

*What just happened:* Because `"triangle"` isn't handled by any `case`, a `Triangle` value reaches the `default` branch. We try to assign it to `_exhaustive: never` - but a `Triangle` is very much *something*, not `never`, so the checker errors right there, pointing at the exact function you forgot to update. Add the `case "triangle"` and the leftover type in `default` becomes `never` again, the assignment is legal, and the error vanishes.

⚠️ **This is the killer feature - don't skip the `never` line.** Without it, adding a variant fails *silently*: `area` just returns `undefined` for the new shape and nothing warns you. With it, every place that switches over the union lights up red the instant you extend it, handing you a checklist of exactly what to fix. On a large codebase with dozens of switches over the same union, this turns a terrifying refactor into a mechanical one - change the type, follow the red squiggles, done.

## Recap

1. **Union types** (`A | B`) describe a value that's one of several types. You can only use operations valid for *every* member until you narrow.
2. **Literal types** (`"left" | "right" | "center"`) describe a fixed set of exact values - beating a bare `string` with autocomplete and typo-rejection for any fixed set of choices.
3. **Narrowing** is the heart of unions: a runtime check (`typeof`, `in`, `Array.isArray`, truthiness) lets TypeScript shrink the type inside that branch, so you can safely use member-specific operations.
4. **Discriminated unions** add a shared literal tag (`kind`) to each variant; switching on the tag narrows to that variant's full shape. This is the idiomatic way to model "one of N variants" - TypeScript's answer to enums-with-data.
5. ⚠️ **Exhaustiveness checking** with `never` in the `default` case makes the compiler *error* when you add a variant and forget to handle it somewhere - turning silent `undefined` bugs into a precise compile-time checklist.

## Quick check

Lock in the three ideas that do the real work - why unions block operations, how narrowing fixes that, and what `never` buys you:

```quiz
[
  {
    "q": "Why does calling `id.toUpperCase()` on a parameter typed `string | number` produce a compile error?",
    "choices": [
      "Until you narrow, you can only use operations valid for every member of the union - and `number` has no `.toUpperCase()`",
      "`toUpperCase` is deprecated in TypeScript and must be replaced with `toUppercase`",
      "Union types can never have methods called on them at all",
      "TypeScript requires you to cast every union to `any` before using it"
    ],
    "answer": 0,
    "explain": "A `string | number` value might be a number at runtime, and numbers have no `.toUpperCase()`. TypeScript only allows operations common to all members until a check (like `typeof id === \"string\"`) narrows the type to one that supports the call."
  },
  {
    "q": "In a discriminated union `type Shape = Circle | Square`, what makes a `switch (shape.kind)` able to access `shape.radius` inside `case \"circle\"`?",
    "choices": [
      "The shared literal `kind` tag lets TypeScript narrow `shape` to `Circle` in that branch, exposing its specific fields",
      "TypeScript guesses the shape based on which fields you try to access",
      "All fields of every variant are always available on every branch",
      "You must manually cast `shape` to `Circle` with `as` in each case"
    ],
    "answer": 0,
    "explain": "The literal `kind` field is the discriminant. Matching `case \"circle\"` proves `shape.kind` is `\"circle\"`, so TypeScript narrows `shape` to the `Circle` variant - making `radius` available and `side` an error, with no cast needed."
  },
  {
    "q": "What does assigning the leftover value to `const _exhaustive: never = shape;` in the `default` case accomplish?",
    "choices": [
      "If a new variant is added and left unhandled, it reaches `default` as a real type (not `never`), so the assignment errors and points you at the gap",
      "It makes the switch run faster by skipping the default branch at runtime",
      "It converts the union into an enum automatically",
      "It silences all type errors in the function"
    ],
    "answer": 0,
    "explain": "When every variant is handled, the value in `default` has type `never` and the assignment is legal. Add an unhandled variant and that value becomes a real type - not assignable to `never` - so the compiler errors at exactly the spot you forgot to update. That's exhaustiveness checking."
  }
]
```

---

[← Phase 4: Objects, Interfaces & Type Aliases](04-objects-interfaces-and-types.md) · [Guide overview](_guide.md) · [Phase 6: Generics →](06-generics.md)