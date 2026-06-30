---
title: "TypeScript From Zero"
guide: "typescript-from-zero"
phase: 0
summary: "Learn TypeScript from nothing to genuinely advanced: install it and the basics - types, functions, interfaces, unions, generics, classes, and the build - then the deep half: the structural type system, utility and mapped types, conditional and template-literal types, and typing the real world. Mental-model-first, with honest explanations."
tags: [typescript, ts, types, type-safety, javascript, beginner, advanced, generics, utility-types, mapped-types]
category: programming-languages
order: 3
difficulty: intermediate
synonyms: ["learn typescript", "typescript for beginners", "typescript from beginner to advanced", "advanced typescript", "typescript tutorial a to z", "typescript for javascript developers", "typescript generics utility types", "typescript mapped conditional types", "is typescript hard to learn", "should i learn typescript"]
updated: 2026-06-22
---

# TypeScript From Zero

TypeScript is the language most professional JavaScript is written in now. It's not a different
language you have to relearn - it's JavaScript with a type checker bolted on top. You write code that
looks almost exactly like the JS you know, add a few annotations about what your data *is*, and a
checker catches whole categories of bugs in your editor *before the code ever runs*. The "undefined is
not a function" and "I passed the wrong shape" mistakes stop being 2am production incidents and become
red squiggles you fix as you type.

This guide takes you the whole way: from "I've never run `tsc`" to understanding what the type system is
*actually doing* underneath - including the genuinely advanced features (mapped types, conditional
types) that power the libraries you use. We go mental-model-first the whole way: before any annotation,
you'll understand what it means and why TypeScript made the choice it did.

> 📝 This guide assumes you know **JavaScript** - values, functions, objects, `async`/`await`. If you
> don't yet, do [JavaScript From Zero](/guides/javascript-from-zero) first (its final phase hands off
> directly to this one). TypeScript only makes sense once the JavaScript underneath does.

It's one zero-to-hero journey in two halves. **Phases 1–8 are the basics** - enough to type real
applications confidently. **Phases 9–12 are the deep half** - the structural type system, utility and
mapped types, conditional and template-literal types, and typing messy real-world data, the stuff that
separates "writes TypeScript" from "understands the type system." Each phase carries a difficulty badge
so you can see the climb.

## How to read this

- **New to TypeScript (but know JS)?** Read 1–8 in order - each builds on the last. Type the examples
  yourself; watching the checker catch a mistake teaches more than reading about it. Come back for 9+
  when the basics feel comfortable.
- **Already using TypeScript day to day?** Jump to the deep half - [Phase 9: The Type System,
  Deep](09-the-type-system-deep.md) onward is where TypeScript stops being "JS with annotations" and
  becomes a system you can compute *with*.

## The phases

**Part 1 - The basics (🟢 Basic → 🟡 Intermediate)**
1. **[Install & Your First Program](01-install-and-first-program.md)** 🟢 - `tsc`, a `tsconfig.json`, and compiling TS to JS.
2. **[Why Types & the Basic Types](02-why-types-and-basic-types.md)** 🟢 - what the checker buys you; `string`/`number`/`boolean`/arrays/tuples, `any` vs `unknown`, inference.
3. **[Functions & Annotations](03-functions-and-annotations.md)** 🟢 - parameter and return types, optional and default params, `void`.
4. **[Objects, Interfaces & Type Aliases](04-objects-interfaces-and-types.md)** 🟢 - shape types, `interface` vs `type`, optional and `readonly` properties.
5. **[Unions, Literals & Narrowing](05-unions-and-narrowing.md)** 🟡 - union types, literal types, type guards, and discriminated unions.
6. **[Generics](06-generics.md)** 🟡 - type parameters, constraints, and writing code that works over many types safely.
7. **[Classes & OOP in TypeScript](07-classes-and-oop.md)** 🟡 - access modifiers, `implements`, `abstract`, and parameter properties.
8. **[Modules, tsconfig & the Build](08-modules-and-tsconfig.md)** 🟡 - ES modules, `strict` mode, and the compiler options that actually matter.

**Part 2 - Beyond the basics (🔴 Advanced)**
9. **[The Type System, Deep](09-the-type-system-deep.md)** 🔴 - structural typing, widening and narrowing, and how inference really works.
10. **[Utility & Mapped Types](10-utility-and-mapped-types.md)** 🔴 - `Partial`/`Pick`/`Omit`/`Record`, `keyof`, and writing your own mapped types.
11. **[Conditional & Template Literal Types](11-conditional-and-template-types.md)** 🔴 - `T extends U ? X : Y`, `infer`, and types built from string patterns.
12. **[Typing the Real World](12-typing-the-real-world.md)** 🔴 - third-party `@types`, declaration files, typing `fetch`/JSON, and taming `any`.

**Finale**
13. **[Where to Go Next](13-where-to-go-next.md)** 🟢 - React, Node, full-stack with TypeScript, and what to build.

> Frameworks (React, Next, NestJS) are their own guides - they *use* TypeScript heavily, but this guide
> makes the *type system itself* make sense, top to bottom.

---

[Phase 1: Install & Your First Program →](01-install-and-first-program.md)
