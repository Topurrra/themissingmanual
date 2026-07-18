---
title: "A generic class (capstone)"
guide: practice-typescript
phase: 12
summary: "Build Stack<T> - a generic class whose one type parameter flows through every method - and use it with two different element types."
tags: [typescript, generics, classes, data-structures, capstone]
difficulty: advanced
synonyms:
  - typescript generic class example
  - implement stack in typescript
  - class with type parameter
updated: 2026-07-18
---

# A generic class (capstone)

Generic functions carry their `T` for one call. A generic **class** carries
it for a lifetime: `new Stack<string>()` is a stack of strings forever -
every `push`, `pop`, and `peek` on that instance speaks strings, and pushing
a number is a compile error. One implementation, a fully-typed container for
any element type. This is exactly how the built-ins you already use work:
`Array<T>`, `Map<K, V>`, `Set<T>`.

The container to build is a stack - last in, first out, like a stack of
plates:

```ts
class Stack<T> {
  private items: T[] = [];
  push(item: T): void { ... }     // add to the top
  pop(): T | undefined { ... }    // remove and return the top
  peek(): T | undefined { ... }   // look at the top without removing
  size(): number { ... }          // how many items
}
```

Two details worth noticing: the `T` is declared once, on the class, and
every method shares it; and `pop`/`peek` return `T | undefined`, because an
empty stack has nothing to give - encoding "might be empty" in the type
instead of hoping callers remember.

**Your task:** implement all four methods. Arrays make it short: `push` and
`pop` on the private array are most of the work, and the top of the stack is
the array's last element.

**You'll practice:**

- Declaring a class-level type parameter shared by all methods
- Returning T | undefined for operations that can come up empty

```lesson
{
  "language": "typescript",
  "starterCode": "class Stack<T> {\n  private items: T[] = [];\n\n  push(item: T): void {\n    // add item to the top\n  }\n\n  pop(): T | undefined {\n    // remove and return the top item\n  }\n\n  peek(): T | undefined {\n    // return the top item WITHOUT removing it\n  }\n\n  size(): number {\n    return 0;\n  }\n}\n\nconst history = new Stack<string>();\nhistory.push(\"/home\");\nhistory.push(\"/guides\");\nhistory.push(\"/practice\");\n\nconst numbers = new Stack<number>();\nnumbers.push(1);\nnumbers.push(2);",
  "solution": "class Stack<T> {\n  private items: T[] = [];\n\n  push(item: T): void {\n    this.items.push(item);\n  }\n\n  pop(): T | undefined {\n    return this.items.pop();\n  }\n\n  peek(): T | undefined {\n    return this.items[this.items.length - 1];\n  }\n\n  size(): number {\n    return this.items.length;\n  }\n}\n\nconst history = new Stack<string>();\nhistory.push(\"/home\");\nhistory.push(\"/guides\");\nhistory.push(\"/practice\");\n\nconst numbers = new Stack<number>();\nnumbers.push(1);\nnumbers.push(2);",
  "hints": ["The private array does the heavy lifting: this.items.push(item) and this.items.pop() are push and pop.", "peek is the last element without removal: this.items[this.items.length - 1] - an empty array gives undefined, which is exactly the promised type.", "size is this.items.length. The same four methods then serve Stack<string> and Stack<number> alike."],
  "tests": [
    { "name": "pop returns items last-in-first-out", "code": "if (history.pop() !== '/practice') throw new Error('first pop should return /practice (the last push)');" },
    { "name": "peek looks without removing", "code": "history.pop(); const top = history.peek(); if (top !== '/guides') throw new Error('after one pop, peek should show /guides, got ' + top); if (history.size() !== 2) throw new Error('peek must not remove - size should still be 2');" },
    { "name": "the same class works for numbers", "code": "if (numbers.pop() !== 2 || numbers.pop() !== 1) throw new Error('number stack should pop 2 then 1');" },
    { "name": "an empty stack pops undefined", "code": "const empty = new Stack(); if (empty.pop() !== undefined) throw new Error('popping an empty stack should give undefined, not crash');" }
  ]
}
```
