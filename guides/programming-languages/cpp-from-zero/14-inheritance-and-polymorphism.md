---
title: "Inheritance & Polymorphism"
guide: "cpp-from-zero"
phase: 14
summary: "How does C++ let one function call behave differently depending on the actual object underneath it - and what is a vtable really doing?"
tags: [cpp, inheritance, polymorphism, virtual, vtable, abstract-classes, override]
difficulty: advanced
synonyms: ["c++ virtual functions explained", "what is a vtable", "c++ inheritance tutorial", "override vs virtual c++", "abstract class c++", "pure virtual function", "c++ polymorphism explained", "diamond problem c++", "slicing c++", "virtual destructor c++"]
updated: 2026-07-14
---
# Inheritance & Polymorphism

By now you've built classes (phase 6), you know RAII (phase 7), and you know the Rule of Five (phase 8). All of that was about a single object managing its own state and its own lifetime cleanly. Inheritance and polymorphism are about something different: letting *many* types share an interface, so code written once can work correctly on objects it has never seen.

## The mental model: a family of shapes, one function

Picture a drawing app. It has `Circle`, `Square`, and `Triangle` objects, and one function that draws whatever is on the canvas. Without inheritance, that function needs a `switch` on some "kind" field, and every time you add a new shape you go back and edit it. That's fragile and it's exactly the kind of coupling C++'s object model exists to avoid.

Inheritance lets you say: all of these types **are a** `Shape`. Polymorphism lets you say: when you call `shape.draw()`, run *the right version* for whatever object `shape` actually is, decided at runtime, without the caller needing to know which one it is. The caller just needs a `Shape*` or `Shape&` and the interface `Shape` promises.

This is different from templates (phase 10), which pick a version of a function *at compile time* for a type you name explicitly. Polymorphism here is a runtime decision: the same pointer type can point at a `Circle` today and a `Square` tomorrow, and the correct `draw()` runs either way. That flexibility costs a little (an indirect call through a table), but it buys you code that never needs to change when you add a new shape.

## Base and derived classes

```cpp
class Shape {
public:
    virtual void draw() const {
        std::cout << "some shape\n";
    }
    virtual ~Shape() = default;   // more on this below - don't skip it
};

class Circle : public Shape {
public:
    void draw() const override {
        std::cout << "a circle\n";
    }
};

class Square : public Shape {
public:
    void draw() const override {
        std::cout << "a square\n";
    }
};
```

`class Circle : public Shape` means "a `Circle` *is a* `Shape`, and inherits its public interface." `public` inheritance is the one you'll use almost always in modern C++ - it models a true is-a relationship. (`private`/`protected` inheritance exist but are rare; prefer composition, "has-a," when the relationship isn't really is-a.)

The `virtual` keyword on `draw()` is the whole trick. It tells the compiler: don't hard-wire which `draw` runs at compile time - look it up at runtime based on the actual object. `override` on the derived class's version isn't required, but always write it: it tells the compiler "I intend to override a virtual function here," and the compiler will error if you got the signature wrong (a typo'd parameter list otherwise silently creates an unrelated new function instead of overriding).

## What "runtime" buys you

```cpp
void render(const Shape& s) {
    s.draw();   // which draw() runs? decided at runtime, by the real object
}

int main() {
    Circle c;
    Square sq;
    render(c);   // "a circle"
    render(sq);  // "a square"
}
```

`render` takes a plain `const Shape&`. It has never heard of `Circle` or `Square` specifically. Yet it calls the correct `draw()` every time. That's the payoff: you can add a `Triangle` class next year, and `render` needs zero changes. This is why polymorphism matters for real programs - it's how you write code against an interface instead of an ever-growing list of concrete types.

## How it actually works: the vtable

Don't hand-wave this - it's not magic, it's a table of function pointers. When a class has at least one `virtual` function, the compiler adds a hidden pointer to each object, called the **vptr**, pointing at a per-class **vtable**: an array of function pointers, one slot per virtual function. `Circle`'s vtable slot for `draw` points at `Circle::draw`; `Square`'s points at `Square::draw`.

A call to `s.draw()` compiles down to roughly: "follow `s`'s vptr to its vtable, jump to the `draw` slot, call whatever's there." That's the entire mechanism. It costs one extra pointer dereference per call compared to a normal function call, and one extra pointer of size per object holding any virtual function - real but small, and it's exactly why C++ doesn't make every function virtual by default the way some languages do. You pay for polymorphism only on the classes that use it.

## The pointer/reference rule, and slicing

Polymorphism only works through a **pointer or reference** to the base class. This is the single most common beginner mistake:

```cpp
Circle c;
Shape s = c;      // OOPS: this COPIES just the Shape part of c - "slicing"
s.draw();          // prints "some shape", not "a circle"!

Shape& r = c;      // correct: reference, no copy
r.draw();          // prints "a circle"
```

`Shape s = c;` constructs a plain `Shape` object by copying only the `Shape` portion of `c` - the `Circle`-specific data (and its identity) is sliced off and gone. This isn't a bug in the language; it's just what "pass/store by value" always means in C++ (value semantics, from phase 8), applied to a case where it's rarely what you want. The fix is always the same: store and pass polymorphic objects through `Shape&`, `const Shape&`, or a pointer/smart pointer (phase 13 covers `unique_ptr<Shape>`, the usual home for a collection of shapes).

## Virtual destructors are not optional

```cpp
Shape* s = new Circle();
delete s;   // if ~Shape() is NOT virtual: undefined behavior, Circle's part leaks
```

If you delete a derived object through a base pointer and the base destructor isn't `virtual`, only `~Shape()` runs - `~Circle()` never gets called, so any resources `Circle` owns leak, and technically the whole thing is undefined behavior. The rule is simple and absolute: **any class meant to be used polymorphically through a base pointer must have a virtual destructor.** That's why the `Shape` above declares `virtual ~Shape() = default;` - it costs nothing when unused and prevents a real, common bug when it is.

## Abstract classes and pure virtual functions

Often the base class shouldn't be instantiable at all - "shape" isn't a thing you draw, only circles and squares are. Mark a function **pure virtual** with `= 0`:

```cpp
class Shape {
public:
    virtual void draw() const = 0;   // pure virtual - no body required
    virtual ~Shape() = default;
};
```

A class with any pure virtual function is **abstract**: you cannot create a `Shape` directly (`Shape s;` fails to compile), only derived classes that override every pure virtual function. This is C++'s version of an interface, and it's the right tool whenever the base class exists purely to define a contract, not to provide default behavior.

## Multiple inheritance and the diamond problem

C++ permits a class to inherit from more than one base, unlike many languages. It's genuinely useful for combining independent interfaces (`class Duck : public Flyable, public Swimmable`), but it introduces the **diamond problem**: if `Flyable` and `Swimmable` both inherit from a common `Animal`, a `Duck` ends up with two copies of `Animal` by default - ambiguous and usually wrong. The fix is `virtual` inheritance (`class Flyable : public virtual Animal`), which shares a single `Animal` subobject. This is a corner most codebases avoid by leaning on composition instead; know it exists, but reach for it rarely.

## Recap

Inheritance models "is-a"; a derived class inherits and can override its base's interface. `virtual` makes a function call resolve to the actual object's type at runtime, via a vtable lookup, not the pointer's declared type. Always mark overrides `override` and always give a polymorphic base a `virtual` destructor. Use through pointers/references, never plain values, or you'll get slicing. Pure virtual functions (`= 0`) make a class abstract - a contract with no default implementation. This machinery is what lets you write one function against an interface and have it correctly handle types that don't exist yet.

### Check yourself

```quiz
[
  {
    "q": "You have `Shape& r = someCircle;` and call `r.draw()`. What actually decides which `draw()` runs?",
    "choices": [
      "The actual runtime type of the object behind `r`, found via a vtable lookup",
      "The declared type of the reference, `Shape`, always",
      "Whichever `draw()` was compiled last",
      "The compiler picks whichever override is faster"
    ],
    "answer": 0,
    "explain": "Virtual dispatch follows the object's vptr to its own class's vtable at runtime - the reference's declared type never decides which override runs."
  },
  {
    "q": "You write `Shape s = c;` where `c` is a `Circle`, then call `s.draw()` and get \"some shape\" instead of \"a circle\". Why?",
    "choices": [
      "Assigning to a plain `Shape` (not a reference or pointer) copies only the `Shape` portion of `c` - the `Circle` part is sliced off",
      "`Shape::draw()` isn't marked `virtual`",
      "`Circle::draw()` forgot to call the base class version first",
      "You need to call `draw()` before the copy happens, not after"
    ],
    "answer": 0,
    "explain": "Value assignment to a base type copies only the base subobject; polymorphism only works through a pointer or reference to the base, never a plain value."
  },
  {
    "q": "Why must a class meant to be deleted through a base pointer (like `Shape* s = new Circle(); delete s;`) have a virtual destructor?",
    "choices": [
      "Without it, only the base destructor runs, so any resources the derived part owns never get cleaned up",
      "Virtual destructors are required to make a class abstract",
      "Non-virtual destructors run in the wrong order but never leak anything",
      "It only matters for classes with pure virtual functions"
    ],
    "answer": 0,
    "explain": "A non-virtual base destructor means `~Circle()` never runs on that `delete`, so Circle's resources leak - the object's true type is ignored the same way a non-virtual `draw()` would be."
  }
]
```

---

[Phase 13: Smart Pointers & Modern Memory Management](13-smart-pointers-and-modern-memory-management.md) · [Phase 15: Error Handling: Exceptions and Alternatives →](15-error-handling-exceptions-and-alternatives.md)
