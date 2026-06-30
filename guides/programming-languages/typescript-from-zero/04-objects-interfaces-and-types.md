---
title: "Objects, Interfaces & Type Aliases - Describing Shapes"
guide: "typescript-from-zero"
phase: 4
summary: "Real data is objects. Here's how to name an object's shape once with interface or type, reuse it everywhere, mark fields optional or readonly, extend shapes, and pick between interface and type without agonizing."
tags: [typescript, interface, type-alias, object-types, optional-properties, readonly, extends]
difficulty: beginner
synonyms: ["typescript interface vs type", "typescript object type", "typescript optional property", "typescript readonly property", "typescript interface extends", "typescript type alias", "how to type an object in typescript"]
updated: 2026-06-22
---

# Objects, Interfaces & Type Aliases - Describing Shapes

So far you've typed individual values - a `string` here, a `number` there, a function that takes both. But look at the code you actually write all day: almost none of it is loose values. It's *objects*. A user, a product, a request, a config - bundles of related fields traveling together. This phase is where typing stops being a tidy exercise and starts genuinely paying off, because TypeScript lets you describe the *shape* of those bundles once and reuse that description everywhere.

Here's the mental model to hold onto: **a type for an object is a contract about its shape** - which fields exist, and what type each one is. Write the contract down once, give it a name, and from then on the checker enforces it at every place that shape appears. Misspell a field, forget a required one, pass the wrong kind of value - caught in the editor, before anything runs. The rest of this phase is just the syntax for writing those contracts, and the small handful of decisions that come with them.

## Inline object types - fine for one-offs, tiring at scale

The most direct way to type an object is to write its shape right where you need it, in `{ ... }` braces:

```typescript
function greet(user: { name: string; age: number }): string {
  return `Hi ${user.name}, you are ${user.age}`;
}

greet({ name: "Ada", age: 36 }); // ok
```

*What just happened:* The annotation `{ name: string; age: number }` is the object's shape spelled out in place - `user` must be an object with a `name` string and an `age` number. Pass exactly that and the checker is happy. Note the field separator inside the braces can be a semicolon or a comma; semicolons are the convention.

This works, and for a shape used in exactly one spot it's perfectly reasonable. The trouble starts the moment a second function needs the *same* shape:

```typescript
function greet(user: { name: string; age: number }): string {
  return `Hi ${user.name}`;
}

function canVote(user: { name: string; age: number }): boolean {
  return user.age >= 18;
}
```

*What just happened:* The exact same shape is now written twice. If a `user` later grows an `email` field, you have to hunt down and update *every* inline copy - and the day you miss one, they silently disagree about what a "user" is. Repetition like this is the signal that the shape deserves a name of its own.

## `interface` - give a shape a name

The cleanest way to name an object shape is an **interface**.

📝 **Interface** - a named description of an object's shape: the set of properties it has and the type of each. You declare it once with `interface Name { ... }`, then use `Name` anywhere you'd otherwise spell the shape out inline.

```typescript
interface User {
  name: string;
  age: number;
}

function greet(user: User): string {
  return `Hi ${user.name}`;
}

function canVote(user: User): boolean {
  return user.age >= 18;
}

greet({ name: "Ada", age: 36 }); // ok
```

*What just happened:* `interface User` defines the shape one time. Both functions now annotate their parameter as `User` instead of repeating the braces. The repetition is gone, and "what a user is" lives in exactly one place - change the interface and every use updates with it. An interface generates no JavaScript; like all types, it's erased at compile time and exists purely to guide the checker.

Now watch the contract do its job. Leave out a required field and the checker stops you cold:

```typescript
interface User {
  name: string;
  age: number;
}

const u: User = { name: "Ada" }; // missing age
```
```console
Property 'age' is missing in type '{ name: string; }' but required in type 'User'.
```

*What just happened:* `User` says every user has both `name` *and* `age`. The object `{ name: "Ada" }` has no `age`, so the assignment violates the contract, and TypeScript reports it pointing at the exact missing property - in your editor, before you run a thing. This is the whole payoff: the typo or omission surfaces at edit-time, not as a confusing `undefined` three screens away.

## `type` aliases - name *anything*, not only objects

There's a second way to name a shape: a **type alias**.

📝 **Type alias** - the `type` keyword binds a name to *any* type expression: an object shape, but also a union, a primitive, a tuple, or a function type. `type User = { ... }` names an object shape; `type ID = string | number` names something an interface can't.

For an object, a `type` alias looks almost identical to an interface:

```typescript
type User = {
  name: string;
  age: number;
};

function greet(user: User): string {
  return `Hi ${user.name}`;
}
```

*What just happened:* `type User = { ... }` names the same object shape an interface would - note the `=` sign and the trailing semicolon, which the `type` form uses and `interface` doesn't. Used as a parameter annotation, it behaves exactly like the interface version.

The difference shows when you name something that *isn't* an object. An interface can only describe an object shape; a `type` alias can name a union, a primitive, or a tuple:

```typescript
type ID = string | number;        // a union - interface can't do this
type Pair = [number, number];     // a tuple
type Name = string;               // an alias for a primitive

const a: ID = "abc123";
const b: ID = 42;
const point: Pair = [3, 4];
```

*What just happened:* `ID` names "a string *or* a number" - a union type (you'll go deep on those next phase). `Pair` names a two-element tuple, and `Name` is a readable alias for `string`. None of these are object shapes, so none of them could be an `interface`. This breadth is the type alias's superpower: it names *any* type, not only objects.

## `interface` vs `type` - the honest guidance

This is the question everyone trips on, so here's the straight answer: **for object shapes, `interface` and `type` are mostly interchangeable.** Both name a shape, both get enforced identically, both support optional and readonly fields and extension. You can write almost any real codebase using only one of them and be completely fine.

The differences are real but narrow:

- **`interface` can be re-opened (declaration merging).** Declare `interface User` twice and TypeScript *merges* the two into one. A `type` alias can't be redeclared - a second `type User` is an error. Merging is mostly used for augmenting types from libraries; you'll rarely reach for it yourself, but it's why interfaces are conventional for *public* object APIs that others might extend.
- **`type` can express things an interface can't** - unions, tuples, primitives, and (later) intersections and mapped types. When you need any of those, only `type` will do.

💡 **Rule of thumb.** Reach for **`interface` when you're describing an object shape** - it's the convention, the error messages read a touch nicer, and it leaves the door open for merging. Reach for **`type` when you need a union, a tuple, or anything an interface can't express.** And do not agonize over object shapes: if your team standardizes on one, follow it; if you're alone, pick `interface` for objects and move on. The choice almost never matters, and when it does, the compiler tells you by rejecting the thing the other form can't do.

## Optional, `readonly`, and extending

Three small tools turn basic shapes into the ones you'll actually write: optional fields, read-only fields, and building one shape on top of another.

**Optional properties with `?`.** Mark a field optional by putting `?` after its name. The field may be present or absent, and code that reads it must account for it possibly being `undefined`:

```typescript
interface User {
  name: string;
  email?: string; // optional - may or may not be there
}

const a: User = { name: "Ada" };                       // ok, no email
const b: User = { name: "Grace", email: "g@xyz.io" };  // ok, with email
```

*What just happened:* The `?` on `email` makes it optional, so both objects satisfy `User` - one with an email, one without. The type of `email` is effectively `string | undefined`, which means when you go to use it the checker will (correctly) nudge you to handle the missing case. Optional is for fields that genuinely might not be there; it is not a license to skip required data.

**Read-only fields with `readonly`.** Prefix a field with `readonly` and TypeScript forbids reassigning it after the object is created. It's for values that should be set once and never change - an `id`, a creation timestamp:

```typescript
interface User {
  readonly id: number;
  name: string;
}

const u: User = { id: 1, name: "Ada" };
u.name = "Ada L.";  // ok - name is writable
u.id = 2;           // not allowed
```
```console
Cannot assign to 'id' because it is a read-only property.
```

*What just happened:* You set `id` once when the object was built. Reassigning `name` is fine, but the attempt to change `id` is rejected at compile time. ⚠️ `readonly` is a *compile-time* guarantee only - like every type, it's erased before the code runs, so it stops *you* from writing the reassignment in your editor but does nothing to a value at runtime. It documents and enforces intent during development; it is not a runtime lock.

**Extending a shape.** Real shapes build on each other - an `Admin` is a `User` with extra fields. With interfaces you use `extends`; with type aliases you use an intersection `&`. Both produce "everything from the base, plus the new fields":

```typescript
interface User {
  name: string;
  age: number;
}

interface Admin extends User {
  role: "admin";   // plus everything from User
}

const root: Admin = { name: "Ada", age: 36, role: "admin" };

// The type-alias equivalent, using intersection:
type AdminAlias = User & { role: "admin" };
```

*What just happened:* `interface Admin extends User` means an `Admin` has `name`, `age`, *and* `role` - so the object must supply all three. The `type AdminAlias = User & { role: "admin" }` line does the same thing with an intersection (`&`), which combines shapes into one that has every member of both. Pick `extends` when you're working in interfaces and `&` when you're in type aliases; the resulting contract is equivalent.

## Recap

1. **Inline object types** (`{ name: string; age: number }`) work for a one-off, but repeating the same shape across functions is a maintenance trap - that repetition is the signal to name it.
2. An **`interface`** names an object's shape once and reuses it everywhere; the checker then enforces the contract, flagging a missing required field right in the editor.
3. A **`type` alias** also names object shapes, but goes further: it can name **unions, tuples, and primitives** - things an interface can't express.
4. For object shapes the two are **mostly interchangeable**. Rule of thumb: **`interface` for object shapes, `type` when you need a union or something an interface can't do** - don't agonize.
5. **`?`** makes a field optional (possibly `undefined`); **`readonly`** forbids reassignment after creation. ⚠️ `readonly` is a compile-time check, erased at runtime - it isn't a runtime lock.
6. Build shapes on each other with **`interface Admin extends User`** or the type-alias equivalent **`User & { ... }`** (intersection) - both mean "everything from the base, plus more."

You can now describe the shape of real data and reuse it with confidence. Next, we tackle the other half of real data: values that can be *one of several* things - a status that's `"loading"` or `"done"`, an id that's a string *or* a number - and how TypeScript narrows them down safely.

## Quick check

Lock in the three decisions you'll make constantly - interface vs type, optional vs required, and what `readonly` actually guarantees:

```quiz
[
  {
    "q": "You need to name a type that is `string | number`. Which tool can express it?",
    "choices": [
      "A `type` alias - `type ID = string | number`",
      "An `interface` - `interface ID { string | number }`",
      "Either one; interfaces support unions too",
      "Neither; unions can't be named in TypeScript"
    ],
    "answer": 0,
    "explain": "An interface can only describe an object shape. A union like `string | number` isn't an object, so only a `type` alias can name it. This is the main reason to reach for `type` over `interface`."
  },
  {
    "q": "Given `interface User { name: string; email?: string }`, which object is valid?",
    "choices": [
      "`{ name: \"Ada\" }` - `email` is optional, so it can be omitted",
      "`{ email: \"a@x.io\" }` - only one field is needed",
      "`{}` - every field is optional once any field is",
      "Only `{ name: \"Ada\", email: \"a@x.io\" }` - both fields are required"
    ],
    "answer": 0,
    "explain": "The `?` on `email` makes it optional, so it may be absent. But `name` has no `?`, so it's still required - an object must include `name` and may or may not include `email`."
  },
  {
    "q": "What does `readonly id: number` actually guarantee?",
    "choices": [
      "The compiler rejects reassigning `id` after creation, but it's erased at runtime - not a runtime lock",
      "The value of `id` is frozen at runtime and any reassignment throws an error",
      "`id` can never be set at all, not even when the object is created",
      "Other fields on the object also become read-only automatically"
    ],
    "answer": 0,
    "explain": "`readonly` is a compile-time guarantee: TypeScript flags an attempt to reassign `id` in your editor. Like all types it's erased before the code runs, so it enforces intent during development but does nothing at runtime."
  }
]
```

---

[← Phase 3: Functions & Annotations](03-functions-and-annotations.md) · [Guide overview](_guide.md) · [Phase 5: Unions, Literals & Narrowing →](05-unions-and-narrowing.md)
