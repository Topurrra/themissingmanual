---
title: "Classes and inheritance"
guide: practice-python
phase: 9
summary: "Write a base class with a constructor and a method, then a subclass that inherits from it and overrides that method."
tags: [python, classes, oop, inheritance]
difficulty: intermediate
synonyms:
  - python classes
  - python inheritance
  - class constructor python
  - oop in python
updated: 2026-07-10
---

# Classes and inheritance

`__init__(self, ...)` is Python's constructor - it runs automatically when you
create an instance, and it's where you set the instance's own data with
`self.attribute = value`. Methods defined in the class body are shared by
every instance instead of copied onto each one; `self` is how a method reaches
back into the specific instance it was called on.

`class Dog(Animal):` builds a subclass - `Dog` gets every method `Animal` has
for free, and only needs to define what's different. Overriding a method -
writing a same-named method in the subclass - replaces the parent's version
for instances of the subclass, without touching how `Animal` itself behaves.
`super().__init__(...)` lets a subclass reuse the parent's constructor instead
of duplicating it, though this lesson's `Dog` doesn't need its own `__init__`
at all - it can just inherit `Animal`'s.

**Your task:** write class `Animal` with `__init__(self, name)` storing
`self.name`, and a method `speak(self)` returning `f"{self.name} makes a
sound"`. Then write class `Dog`, extending `Animal`, that overrides `speak()`
to return `f"{self.name} barks"` instead.

**You'll practice:**

- Writing `__init__` and a method on a class
- Subclassing with inheritance and overriding one method

```lesson
{
  "language": "python",
  "starterCode": "# Write class Animal: __init__(self, name) stores self.name;\n# speak(self) returns f\"{self.name} makes a sound\".\nclass Animal:\n    pass\n\n# Write class Dog(Animal): override speak() to return f\"{self.name} barks\".\nclass Dog(Animal):\n    pass",
  "solution": "class Animal:\n    def __init__(self, name):\n        self.name = name\n\n    def speak(self):\n        return f\"{self.name} makes a sound\"\n\nclass Dog(Animal):\n    def speak(self):\n        return f\"{self.name} barks\"",
  "hints": ["Animal's __init__(self, name) just needs self.name = name.", "speak(self) returns an f-string: f\"{self.name} makes a sound\".", "Dog doesn't need its own __init__ - inheriting from Animal gives it one for free. Just override speak()."],
  "tests": [
    { "name": "Animal.speak() uses the generic message", "code": "assert Animal('Cat').speak() == 'Cat makes a sound', \"Animal('Cat').speak() should be 'Cat makes a sound'\"" },
    { "name": "Dog.speak() overrides the message", "code": "assert Dog('Rex').speak() == 'Rex barks', \"Dog('Rex').speak() should be 'Rex barks'\"" },
    { "name": "Dog inherits the Animal constructor", "code": "assert Dog('Fido').name == 'Fido', \"Dog('Fido').name should be 'Fido' - Dog should inherit its constructor from Animal\"" },
    { "name": "Dog is still an Animal", "code": "assert isinstance(Dog('Rex'), Animal), 'a Dog instance should also be an instance of Animal'" }
  ]
}
```
