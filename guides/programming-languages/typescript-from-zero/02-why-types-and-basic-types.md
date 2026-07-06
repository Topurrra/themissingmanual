---
title: "Why Types & the Basic Types - What the Checker Buys You"
guide: "typescript-from-zero"
phase: 2
summary: "The concrete payoff of types - a silent NaN bug caught at edit-time - plus the primitives, inference (you annotate less than you think), arrays and tuples, and why unknown beats any."
tags: [typescript, types, type-inference, any, unknown, arrays, tuples, primitives]
difficulty: beginner
synonyms: ["typescript basic types", "typescript any vs unknown", "typescript type inference", "typescript array tuple types", "typescript string number boolean", "why use types in typescript", "typescript type annotations"]
updated: 2026-06-22
---

# Why Types & the Basic Types - What the Checker Buys You

In Phase 1 you ran your first program. So far types feel like extra typing for no obvious reward. Here's where the reward shows up.

**A type checker is a second pair of eyes that reads your code without running it.** Plain JavaScript only notices a mistake the moment the broken line executes - possibly after corrupting a cart total or a database row. TypeScript notices it the instant you type it, red underline in your editor. Same code, same logic, but the discovery moves from "three screens later, confused" to "right now, while it's cheap."

## Why types - a bug that hides until it's expensive

Here's the payoff, made concrete with a bug you've almost certainly shipped: a function reads a field off an object, but the object spells it differently. In JavaScript, reading a nonexistent property isn't an error - it quietly returns `undefined`.

```javascript runnable
function priceWithTax(item, rate) {
  return item.price + item.price * rate;
}

const product = { name: "Notebook", cost: 12 }; // oops: "cost", not "price"

console.log(priceWithTax(product, 0.2));
```
```console
NaN
```
*What just happened:* `product` has a `cost` field, but `priceWithTax` reads `item.price`. That returns `undefined`, and `undefined + undefined * 0.2` evaluates to `NaN`, returned without complaint. The program keeps running - that `NaN` flows downstream into a total, a chart, a saved record, breaking something far from the actual typo.

⚠️ **The dangerous part isn't the crash - it's the *lack* of one.** A crash at least names a line; a silent `NaN` travels far from its source before causing visible damage, which is why these bugs eat afternoons.

The same function in TypeScript, with the shape spelled out:

```typescript
interface Product {
  name: string;
  price: number;
}

function priceWithTax(item: Product, rate: number): number {
  return item.price + item.price * rate;
}

const product = { name: "Notebook", cost: 12 };
console.log(priceWithTax(product, 0.2)); // error flagged here
```
```console
Argument of type '{ name: string; cost: number; }' is not assignable to parameter of type 'Product'.
  Object literal may only specify known properties, and 'cost' does not exist in type 'Product'.
```
*What just happened:* `interface Product` declares the shape an item must have. Pass `{ name, cost }` and the checker compares it against `Product`, sees no `price` (and a stray `cost`), and reports the error **in your editor, before you run anything** - the exact bug from the runnable demo above, caught by a tool that never executed your code.

## The basic types

Most values are one of three primitives, and TypeScript's names for them are the words you'd expect.

- `string` - text: `"Ada"`, `"hello"`.
- `number` - any number, integer or float (no separate `int`/`double`): `42`, `3.14`, `-7`.
- `boolean` - `true` or `false`.

Attach a type to a variable with a colon after the name - a **type annotation**.

```typescript
let name: string = "Ada";
let age: number = 36;
let isAdmin: boolean = false;

name = 42; // error
```
```console
Type 'number' is not assignable to type 'string'.
```
*What just happened:* `let name: string` tells the checker "this slot holds text, forever." The first three lines fit their declared types and pass silently. Put a `number` into the `string` slot and the checker objects - that promise is what catches `42` before it sneaks in and surprises you later.

## Inference - you annotate less than you think

What surprises people coming from other typed languages: you rarely write those annotations. TypeScript reads the value right of the `=` and figures out the type for you - **type inference** - which means the annotations above were redundant.

💡 **TypeScript infers a variable's type from its initializer.** `let count = 0` is already typed `number` - the annotation `let count: number = 0` adds nothing the checker didn't already know.

```typescript
let count = 0;        // inferred as number
let label = "ready";  // inferred as string
let done = false;     // inferred as boolean

count = "zero"; // error - count is number, inferred from 0
```
```console
Type 'string' is not assignable to type 'number'.
```
*What just happened:* You wrote no types at all, yet `count` is fully a `number` - assigning `"zero"` is still caught. TypeScript saw `0`, concluded "number," and enforced it from then on: safety without the noise. The practical rule: **annotate the boundaries, not every variable.** Function parameters and return types are worth spelling out (the checker can't guess what a caller will pass); locals almost never need one - let inference do it.

## Arrays and tuples

A list of values gets a type too - for an array where every element is the same type, write the element type followed by `[]`.

```typescript
let scores: number[] = [90, 85, 100];
let names: string[] = ["Ada", "Linus"];

scores.push(95);   // fine
scores.push("A+"); // error - only numbers allowed
```
```console
Argument of type 'string' is not assignable to parameter of type 'number'.
```
*What just happened:* `number[]` means "an array of numbers." Every operation on it - `push`, indexing, iteration - is checked against that element type, so a `string` slipping into a number array is caught. `Array<number>` means the same thing; `number[]` is the common spelling.

Sometimes you want a fixed-length sequence where *each position* has its own type - a pair, a coordinate, a row. That's a **tuple**, the types listed in order inside brackets.

```typescript
let point: [number, number] = [10, 20];
let entry: [string, number] = ["age", 36];

entry = [36, "age"]; // error - wrong types in wrong positions
```
```console
Type 'number' is not assignable to type 'string'.
Type 'string' is not assignable to type 'number'.
```
*What just happened:* `[string, number]` says "exactly two elements: a string then a number." Unlike `string[]` (any number of strings), a tuple pins down both length and type per slot, and flipping the order gets caught position by position. Reach for tuples when the shape is genuinely fixed - a key/value pair, an `(x, y)` point - and an array for a homogeneous list of unknown length.

## `any` vs `unknown` - the escape hatch and the safe one

Eventually you'll hit a value whose type you don't know yet - API data, a `JSON.parse` result, something dynamic. TypeScript gives you two types for "I don't know what this is," and they behave differently.

📝 **`any`** - turns type checking *off* for that value. Call it, index it, add to it - the checker stays silent. An escape hatch out of the type system.

📝 **`unknown`** - the safe "could be anything" type. It can *hold* any value, but the checker won't let you *use* it until you've proven what it is (a "narrowing" check). The top type, with the guardrails left on.

`any` is a hole in the floor; `unknown` is a locked door that asks for the key.

```typescript
let a: any = "hello";
a.toFixed(2);     // no error - any disables checking (this crashes at runtime!)

let u: unknown = "hello";
u.toFixed(2);     // error - must narrow first
```
```console
'u' is of type 'unknown'.
```
*What just happened:* `a` is `any`, so `.toFixed(2)` (a number method) on a string sails through the checker - then explodes at runtime, exactly the bug types should prevent. `u` is `unknown`, so the same misuse is *blocked at compile time*: the checker won't let you touch it until you've established what it is. With `unknown`, you'd first check `typeof u === "number"` inside an `if`, then call number methods - the checker walks you to safety instead of looking away.

⚠️ **`any` defeats the entire purpose of TypeScript.** Every `any` is a spot where the checker has been told to stop looking, so bugs flow straight through. It's tempting when the checker is nagging, but you're not fixing the problem - you're hiding it. Treat `any` as a last resort.

💡 **When a value's type is genuinely unknown, reach for `unknown`, not `any`.** Both say "I don't know what this is yet" - but `unknown` forces you to find out before you use it, while `any` lets you pretend you already know. The first surfaces bugs; the second buries them.

## Recap

1. **Types pay off by catching bugs at edit-time** - the silent `NaN` from a misspelled field gets a red underline before the code ever runs, instead of corrupting data three screens away.
2. The **basic types** are `string`, `number`, and `boolean`; attach one with an annotation like `let name: string = "Ada"`.
3. **Inference means you annotate less than you think** - `let count = 0` is already `number`. Annotate function boundaries; let inference handle locals.
4. **Arrays** use `number[]` (or `Array<number>`) for a homogeneous list; **tuples** use `[string, number]` for a fixed-length, fixed-type-per-position sequence.
5. ⚠️ **`any` switches off type checking** for a value - an escape hatch that defeats the point and lets bugs through. Avoid it.
6. **`unknown` is the safe top type**: it holds anything but forces you to narrow before use. Prefer it whenever a value's type is genuinely not known yet.

You can now read and write the everyday types that make up most TypeScript code. Next: **functions** - annotating parameters and return types, and how much inference still does for you.

## Quick check

Lock in the three ideas that matter most here - when types catch bugs, how much inference does for you, and why `unknown` beats `any`:

```quiz
[
  {
    "q": "In TypeScript, when would the misspelled-field bug (`item.price` vs an object with `cost`) be caught?",
    "choices": [
      "At edit-time in your editor, before the code ever runs",
      "At runtime, when the line executes and returns NaN",
      "Never - TypeScript ignores property names",
      "Only after you deploy and a user reports it"
    ],
    "answer": 0,
    "explain": "The checker compares the passed object against the declared `Product` type without running anything, sees `price` is missing, and underlines the error in your editor. That edit-time catch is the core payoff of types."
  },
  {
    "q": "Given `let count = 0;` with no annotation, what type does `count` have?",
    "choices": [
      "number - TypeScript infers it from the initializer 0",
      "any - because you didn't annotate it",
      "It has no type until you add `: number`",
      "unknown - until you narrow it"
    ],
    "answer": 0,
    "explain": "TypeScript reads the value on the right of `=` and infers the type. `0` is a number, so `count` is `number` - assigning a string to it later is still caught. You rarely need to annotate locals."
  },
  {
    "q": "Why is `unknown` safer than `any` for a value whose type you don't know yet?",
    "choices": [
      "`unknown` blocks you from using the value until you narrow it; `any` turns checking off entirely",
      "`unknown` is faster at runtime than `any`",
      "`any` cannot hold strings, but `unknown` can",
      "There is no real difference - they behave identically"
    ],
    "answer": 0,
    "explain": "`any` disables type checking, so misuse (like calling a number method on a string) slips through and crashes at runtime. `unknown` holds anything but forces a narrowing check before use, so the checker keeps protecting you."
  }
]
```

---

[← Phase 1: Install & Your First Program](01-install-and-first-program.md) · [Guide overview](_guide.md) · [Phase 3: Functions & Annotations →](03-functions-and-annotations.md)