---
title: "Interfaces"
guide: practice-typescript
phase: 2
summary: "Describe the shape of an object with an interface, then write a function that expects it."
tags: [typescript, interfaces, objects, types]
difficulty: beginner
synonyms:
  - typescript interface example
  - describe object shape typescript
  - typescript interface vs type
updated: 2026-07-10
---

# Interfaces

An `interface` names a shape an object should have - a list of property names
and their types, with no runtime code of its own:

```ts
interface Product {
  name: string;
  price: number;
}
```

Any object with a matching `name` and `price` satisfies `Product` - there's no
class to instantiate, no `implements` keyword required. Once a parameter is
typed `product: Product`, you (and your editor) know exactly which properties
are safe to read inside the function.

**Your task:** define `Product` with `name: string` and `price: number`, then
write `describe(product)` returning `"<name> - $<price>"`.

**You'll practice:**

- Declaring an `interface` for an object shape
- Typing a function parameter with that interface

```lesson
{
  "language": "typescript",
  "starterCode": "// Define Product with name: string and price: number.\ninterface Product {\n\n}\n\n// Write describe(product: Product): string, returning \"<name> - $<price>\".\nfunction describe(product: Product): string {\n\n}\n\nconst sample = { name: \"Mouse\", price: 20 };\nconst summary = describe(sample);",
  "solution": "interface Product {\n  name: string;\n  price: number;\n}\n\nfunction describe(product: Product): string {\n  return `${product.name} - $${product.price}`;\n}\n\nconst sample = { name: \"Mouse\", price: 20 };\nconst summary = describe(sample);",
  "hints": ["List each property and its type inside the braces: name: string; price: number;", "describe just reads product.name and product.price with a template literal - the interface only describes the shape, it doesn't change how you access properties.", "summary should be 'Mouse - $20'; describe({ name: 'Keyboard', price: 45 }) should be 'Keyboard - $45'."],
  "tests": [
    { "name": "summary matches the sample product", "code": "if (summary !== 'Mouse - $20') throw new Error('summary should be \"Mouse - $20\"');" },
    { "name": "describe works on other products", "code": "if (describe({ name: 'Keyboard', price: 45 }) !== 'Keyboard - $45') throw new Error('describe({ name: \"Keyboard\", price: 45 }) should be \"Keyboard - $45\"');" }
  ]
}
```
