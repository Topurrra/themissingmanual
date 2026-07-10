---
title: "Classes and inheritance"
guide: practice-javascript
phase: 7
summary: "Write a class with a constructor and a method, then extend it so a subclass inherits and overrides behavior."
tags: [javascript, classes, inheritance, extends]
difficulty: intermediate
synonyms:
  - javascript classes
  - javascript extends inheritance
  - class constructor javascript
updated: 2026-07-10
---

# Classes and inheritance

A class is a template for objects that share the same shape and behavior.
`constructor(...)` runs once when you create an instance with `new` - it's
where you set the instance's own properties with `this.property = value`.
Methods defined in the class body are shared by every instance instead of
copied onto each one.

`class Dog extends Animal` builds a subclass: `Dog` gets every method `Animal`
has for free, and only needs to define what's different. Overriding a method -
writing a same-named method in the subclass - replaces the parent's version for
instances of the subclass, without touching how `Animal` itself behaves.

**Your task:** write class `Animal` with a constructor that stores `name`, and
a method `speak()` returning `"<name> makes a sound"`. Then write class `Dog`,
extending `Animal`, that overrides `speak()` to return `"<name> barks"`
instead.

**You'll practice:**

- Writing a constructor and a method on a class
- Extending a class and overriding one of its methods

```lesson
{
  "language": "js",
  "starterCode": "// Write class Animal: constructor(name) stores this.name;\n// speak() returns \"<name> makes a sound\".\nclass Animal {\n\n}\n\n// Write class Dog extending Animal: override speak() to return \"<name> barks\".\nclass Dog extends Animal {\n\n}",
  "solution": "class Animal {\n  constructor(name) {\n    this.name = name;\n  }\n  speak() {\n    return `${this.name} makes a sound`;\n  }\n}\n\nclass Dog extends Animal {\n  speak() {\n    return `${this.name} barks`;\n  }\n}",
  "hints": ["Animal's constructor(name) just needs this.name = name;", "speak() returns a template literal: `${this.name} makes a sound`", "Dog doesn't need its own constructor - extends Animal gives it one for free. Just override speak()."],
  "tests": [
    { "name": "Animal.speak() uses the generic message", "code": "if (new Animal('Cat').speak() !== 'Cat makes a sound') throw new Error('new Animal(\"Cat\").speak() should be \"Cat makes a sound\"');" },
    { "name": "Dog.speak() overrides the message", "code": "if (new Dog('Rex').speak() !== 'Rex barks') throw new Error('new Dog(\"Rex\").speak() should be \"Rex barks\"');" },
    { "name": "Dog inherits the Animal constructor", "code": "if (new Dog('Fido').name !== 'Fido') throw new Error('new Dog(\"Fido\").name should be \"Fido\" - Dog should inherit its constructor from Animal');" },
    { "name": "Dog is still an Animal", "code": "if (!(new Dog('Rex') instanceof Animal)) throw new Error('a Dog instance should also be an instanceof Animal');" }
  ]
}
```
