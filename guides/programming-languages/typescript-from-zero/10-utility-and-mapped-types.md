---
title: "Utility & Mapped Types - Deriving Types From Types"
guide: "typescript-from-zero"
phase: 10
summary: "Stop hand-maintaining parallel types. Use keyof, indexed access, the built-in utility types, and mapped types to derive one type from another so they can never drift apart."
tags: [typescript, utility-types, mapped-types, partial, pick, omit, record, keyof]
difficulty: advanced
synonyms: ["typescript utility types", "typescript partial pick omit record", "typescript mapped types", "typescript keyof operator", "typescript indexed access type", "derive type from another type typescript", "typescript readonly required"]
updated: 2026-06-22
---

# Utility & Mapped Types - Deriving Types From Types

By now you can describe the shape of your data with interfaces and type aliases. But real codebases don't have *one* type per concept - they have a whole family of near-identical ones: a `User`, a `UserUpdate` where every field is optional, a `NewUser` with no `id` yet, a `ReadonlyUser` the cache hands back. Write all four by hand and you've signed up for a maintenance nightmare: add a field to `User`, and you must remember the other three. Forget one, and the type system happily lets the bug through.

Here's the mental model for this whole phase: **stop hand-maintaining parallel types - derive one type from another so they can never drift apart.** Instead of copy-pasting `User`'s fields into `UserUpdate`, say "`UserUpdate` is `User` with everything optional" and let the compiler compute it. When `User` changes, every derived type updates automatically, for free. This is where the type system stops being labels you stick on values and becomes a small language you *compute* with.

## `keyof` and indexed access - the building blocks

Everything in this phase is built from two tiny operators - learn these and the rest is recombination.

📝 **`keyof T`** - an operator producing the union of `T`'s property names *as a type*. If `User` has `id`, `name`, and `email`, `keyof User` is the type `"id" | "name" | "email"`.

📝 **Indexed access (`T["key"]`)** - looks up the *type* of a property by its key, the way you'd index a value with `obj["key"]`, except at the type level. `User["id"]` is whatever type `id` was declared as.

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

type UserKeys = keyof User;     // "id" | "name" | "email"
type IdType = User["id"];       // number
type NameOrId = User["name" | "id"]; // string | number
```

`keyof User` collected the three property names into a union of string-literal types - a value of type `UserKeys` can only ever be one of those three strings. `User["id"]` reached into the interface and pulled out the *type* at `id`, which was `number`. Because you can index with a union, `User["name" | "id"]` returned the union of *both* property types, `string | number`. These two operators are the gears; the rest of the phase is machines built from them.

💡 **Why this is powerful:** `keyof` and indexed access read the type *as it is right now*. Nothing to keep in sync - add a property to `User` and `keyof User` grows automatically. That self-updating quality is the foundation everything else depends on.

## The built-in utility types - derivations you'll use daily

TypeScript ships a standard library of pre-built derivations. Each takes a type and hands back a transformed version. You don't import them; they're always in scope. The six you'll reach for constantly:

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

type PartialUser = Partial<User>;
// { id?: number; name?: string; email?: string }

type RequiredUser = Required<User>;
// every field non-optional

type ReadonlyUser = Readonly<User>;
// { readonly id: number; readonly name: string; readonly email: string }

type PublicUser = Pick<User, "id" | "name">;
// { id: number; name: string }   - keep only the named keys

type CreatePayload = Omit<User, "id">;
// { name: string; email: string }   - drop the named keys

type UsersById = Record<number, User>;
// { [key: number]: User }   - a lookup object
```

Each utility computed a new type from `User` without restating a single field. `Partial<User>` made every property optional - exactly the shape an `updateUser(id, changes)` function wants, since a caller should send only the fields they're changing. `Omit<User, "id">` dropped `id` for a *create* request, where the server assigns the id. `Pick<User, "id" | "name">` kept only the two safe-to-expose fields for a public API. `Record<number, User>` built a lookup object keyed by user id - an in-memory cache's type. None of these were hand-written; all track `User` automatically.

The everyday signatures look like this:

```typescript
// Partial<T> for updates - caller sends only what changed
function updateUser(id: number, changes: Partial<User>): void { /* ... */ }

// Omit<T, K> for create payloads - no id yet
function createUser(payload: Omit<User, "id">): User { /* ... */ }

// Record<K, V> for lookups
const cache: Record<number, User> = {};
```

💡 **The bug class these kill:** the "I changed `User` but forgot to update `UserUpdate`" family. Add a `phone` field to `User`, and `Partial<User>`, `Omit<User, "id">`, and `Record<number, User>` *all* gain it the instant you save. A hand-maintained parallel type would silently fall behind, surfacing only when something broke at runtime - far from the line you actually changed.

⚠️ **`Omit` doesn't warn on a typo'd key.** `Omit<User, "emial">` (misspelled) doesn't error in older TypeScript versions - it just omits nothing and returns `User` unchanged, because `Omit` accepts any string key, not only real ones. Modern versions are stricter, but if a `Pick`/`Omit` misbehaves, check the key spelling first. `Pick<User, "emial">` *does* error, since `Pick`'s key parameter is constrained to `keyof T`.

## Mapped types - the engine underneath

Those utility types feel like magic until you see what's inside: they're all built from one construct, the **mapped type**.

📝 **Mapped type** - a type that builds a new object type by *iterating over the keys of another type*, using the syntax `{ [K in keyof T]: ... }`. For each key `K` in `T`, it produces one property in the result - a `for` loop over the keys of a type, running at compile time.

The clearest way to see it: the *actual definition* of `Partial<T>` from TypeScript's standard library.

```typescript
type Partial<T> = {
  [K in keyof T]?: T[K];
};
```

Read it left to right. `[K in keyof T]` says "for each key `K` in the union `keyof T`." The `?` after the bracket makes that property optional. `T[K]` - indexed access, from the first section - looks up the original type of that property and keeps it. So `Partial<User>` walks `"id" | "name" | "email"`, emitting an optional property of the same type for each. The "magic" utility type is four lines you can now read - every built-in in the previous section is a variation on this pattern.

Now write your own: a type where every field of `User` becomes a `boolean` flag - useful for tracking which fields a form has touched:

```typescript
type Flags<T> = {
  [K in keyof T]: boolean;
};

type UserTouched = Flags<User>;
// { id: boolean; name: boolean; email: boolean }
```

`Flags<T>` iterated `keyof T` exactly like `Partial` did, but instead of reusing `T[K]` for each property's type, it hard-coded `boolean`. The result has the same *keys* as `User` but a uniform value type. You've written a custom derivation - `UserTouched` will gain a `boolean` flag for any field you later add to `User`, with zero extra work.

## Mapping modifiers - adding and removing `readonly` and `?`

A mapped type can do more than copy properties - it can change their *modifiers*. The two modifiers are `readonly` (can't reassign) and `?` (optional). You add one by writing it, and - the part most people don't know - remove one with a `-` prefix.

📝 **Mapping modifiers** - inside `[K in keyof T]`, write `readonly` or `?` to add that modifier to every property, or `-readonly` / `-?` to strip it. A bare `+` (`+readonly`) is allowed but is the default, so rarely written.

This is how `Required<T>` works: strips the optional modifier off everything.

```typescript
// TypeScript's actual Required<T>
type Required<T> = {
  [K in keyof T]-?: T[K];   // -? removes "optional" from every property
};

// And a Mutable<T> - the inverse of Readonly, not built in
type Mutable<T> = {
  -readonly [K in keyof T]: T[K];   // -readonly strips "readonly"
};

type FrozenUser = Readonly<User>;     // all readonly
type ThawedUser = Mutable<FrozenUser>; // readonly stripped back off
```

`Required<T>` mapped over every key and applied `-?`, subtracting the optional modifier - so even if `T` had optional fields, the result has none. `Mutable<T>` did the same trick with `-readonly`, peeling `readonly` off each property; feeding it `FrozenUser` produced a fully writable type again. There's no built-in `Mutable`, so this is genuinely useful to keep around. The `-` prefix is the only way to *remove* a modifier a type already has.

## Key remapping with `as` - renaming the keys themselves

The last move: a mapped type can rename keys as it goes, using an `as` clause. Combined with template literal types (next phase's topic), this lets you transform `name` into `getName`. A `Getters<T>` that turns every field into a getter method:

```typescript
type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};

type UserGetters = Getters<User>;
// {
//   getId: () => number;
//   getName: () => string;
//   getEmail: () => string;
// }
```

The `as` clause rewrites each key before it lands in the result. For key `K`, the template `` `get${Capitalize<string & K>}` `` builds a new name - `id` becomes `getId`, `name` becomes `getName`. The value type became `() => T[K]`, a function returning the original property's type. `Getters<User>` derived a full interface of getter methods straight from `User`'s fields, staying in sync forever. (Don't worry about the template-literal mechanics yet - that's Phase 11; this is a taste of where these pieces lead.)

⚠️ **Keep derived types readable.** This is genuinely powerful, and that's exactly the danger. A type expression three transformations deep can become unreadable - the next person (or future-you) opens `Getters<Omit<Mutable<User>, "id">>` and has no idea what shape comes out. Derivation earns its keep when it removes real duplication and the result is obvious. When the expression itself becomes the puzzle, a plain hand-written type - even with a little duplication - often serves the team better. Cleverness in types has the same cost as cleverness in code: someone has to read it later.

## Recap

1. **`keyof T`** gives the union of a type's keys, and **`T["key"]`** (indexed access) looks up a property's type - the building blocks for everything else in this phase.
2. **Built-in utility types** derive new shapes for free: `Partial<T>` (update payloads), `Required<T>`, `Readonly<T>`, `Pick<T, K>` and `Omit<T, K>` (subsets), and `Record<K, V>` (lookups). They track the source type automatically, killing the "changed `User`, forgot `UserUpdate`" bug class.
3. **Mapped types** (`{ [K in keyof T]: ... }`) are the engine underneath - a compile-time loop over a type's keys. `Partial<T>` is itself just `{ [K in keyof T]?: T[K] }`, and you can write your own derivations the same way.
4. **Mapping modifiers** add or remove `readonly` and `?`. The `-` prefix *removes* a modifier (`-?` powers `Required<T>`, `-readonly` powers a custom `Mutable<T>`) - the only way to strip one a type already has.
5. **Key remapping with `as`** renames keys during the mapping (e.g. a `Getters<T>` mapping `name` → `getName`), pairing with template literal types.
6. ⚠️ Derive to remove duplication, not to show off. When a type expression gets unreadable, a hand-written type may serve the team better.

## Quick check

Lock in what the building blocks do, where the utility types come from, and how to remove a modifier:

```quiz
[
  {
    "q": "Given `interface User { id: number; name: string }`, what is the type `keyof User`?",
    "choices": [
      "The union `\"id\" | \"name\"`",
      "The union `number | string`",
      "An array `[\"id\", \"name\"]` available at runtime",
      "The type `User` itself, unchanged"
    ],
    "answer": 0,
    "explain": "`keyof T` produces the union of a type's *property names* as string-literal types - here `\"id\" | \"name\"`. (The union of property *value* types, `number | string`, is what you'd get from indexed access like `User[keyof User]`.)"
  },
  {
    "q": "TypeScript's `Partial<T>` is defined as a mapped type. Which definition is correct?",
    "choices": [
      "`{ [K in keyof T]?: T[K] }` - iterate the keys and make each property optional",
      "`{ [K in keyof T]-?: T[K] }` - iterate the keys and make each property required",
      "`Pick<T, keyof T>` - pick every key from T",
      "`{ readonly [K in keyof T]: T[K] }` - iterate the keys and make each readonly"
    ],
    "answer": 0,
    "explain": "`Partial<T>` maps over `keyof T` and applies the `?` modifier to every property, giving `{ [K in keyof T]?: T[K] }`. The `-?` version is `Required<T>` (it *removes* optional), and the `readonly` version is `Readonly<T>`."
  },
  {
    "q": "You want a `Mutable<T>` that strips `readonly` off every property. What goes in the mapped type?",
    "choices": [
      "`-readonly [K in keyof T]: T[K]` - the `-` prefix removes the readonly modifier",
      "`readonly [K in keyof T]: T[K]` - writing readonly toggles it off",
      "`[K in keyof T]-readonly: T[K]` - the modifier goes after the brackets",
      "There's no way to remove readonly; you must rebuild the type by hand"
    ],
    "answer": 0,
    "explain": "Prefixing a modifier with `-` removes it: `-readonly [K in keyof T]: T[K]` strips `readonly` from every property. (Writing plain `readonly` *adds* it, and `?`/`-?` work the same way for the optional modifier.)"
  }
]
```

---

[← Phase 9: The Type System, Deep](09-the-type-system-deep.md) · [Guide overview](_guide.md) · [Phase 11: Conditional & Template Literal Types →](11-conditional-and-template-types.md)
