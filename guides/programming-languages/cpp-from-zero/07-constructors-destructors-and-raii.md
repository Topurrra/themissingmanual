---
title: "Constructors, Destructors & RAII"
guide: "cpp-from-zero"
phase: 7
summary: "How does a C++ object set itself up and clean itself up automatically, and why does everyone say RAII is the single most important idea in the language?"
tags: [cpp, constructors, destructors, raii, resource-management, classes]
difficulty: intermediate
synonyms: ["what is raii in c++", "c++ constructor destructor explained", "raii resource acquisition is initialization", "c++ member initializer list", "when does a destructor run in c++", "c++ automatic cleanup without garbage collector", "explicit constructor c++", "raii vs garbage collection", "order of construction and destruction c++ members", "c++ raii file handle example"]
updated: 2026-07-14
---
# Constructors, Destructors & RAII

In [Phase 6](06-classes-and-objects.md) you gave objects data and behavior. This phase gives them a
birth and a death - code that runs automatically the moment an object comes into being, and code that
runs automatically the moment it's gone. That second half, the automatic death, turns out to be the
single most important idea in C++. It has a name - **RAII** - and once it clicks, it explains half of
why C++ code looks the way it does.

## The mental model: objects have a lifecycle

Every object in C++ goes through the same three moments, whether it's a local variable, a class member,
or something on the heap:

1. **Construction** - memory for the object exists, and now its constructor runs to set it up.
2. **Life** - you use it.
3. **Destruction** - the object's destructor runs, then the memory is reclaimed.

You've already seen construction and destruction happen for built-in things without thinking about it:
a `std::vector` allocates its buffer when you create it and frees that buffer the instant it goes out of
scope. That's not magic the language special-cased for `vector`. It's a constructor and a destructor,
and you can write the exact same behavior into your own types.

**What makes this different from C:** in C, `struct Buffer { char *data; }` is just a data layout. Nothing
runs when it's created, and nothing runs when it goes away - if `data` was `malloc`'d, *you* remember to
`free` it, on every path out of the function, including the early `return` and the branch you added six
months later and forgot about. C++ lets a type own that responsibility itself.

## Constructors: setting up

A **constructor** is a special member function with the same name as the class and no return type. It
runs automatically whenever an object is created.

```cpp
class Point {
public:
    Point(double x, double y) : x_(x), y_(y) {
        std::cout << "Point constructed at (" << x_ << ", " << y_ << ")\n";
    }

private:
    double x_;
    double y_;
};

int main() {
    Point p(3.0, 4.0);   // constructor runs here, automatically
}
```
```console
Point constructed at (3, 4)
```

Notice `: x_(x), y_(y)` before the constructor's `{ }` body. That's the **member initializer list**, and
it's not just style - it's *how members get their first value*. Without it, `x_` and `y_` would be left
with indeterminate values first and then you'd overwrite them by assignment inside the body. For a
primitive `double` that's merely redundant, but for a member like `std::string` it's genuinely wasteful:
the member gets fully default-constructed and *then* reassigned - two steps where the list does one.
Prefer the initializer list; use the body only for logic that isn't "just set this member."

💡 **Key point.** A class can have several constructors that differ by parameters - this is just
[overloading](04-functions-overloading-and-default-arguments.md) applied to construction. A constructor
with no parameters is the **default constructor**; it's what runs for `Point p;` with nothing in the
parentheses, if you provide one (or if the compiler can generate one for you - more on that in
[Phase 8](08-copy-move-and-the-rule-of-five.md)).

⚠️ **The `explicit` trap.** A constructor taking exactly one argument doubles as an implicit conversion
unless you stop it:

```cpp
class Meters {
public:
    Meters(double value) : value_(value) {}
private:
    double value_;
};

void print(Meters m);

print(5.0);   // compiles! 5.0 silently becomes a Meters
```

That silent conversion is rarely what you want - it lets a plain `double` sneak into an API expecting a
`Meters` with no visible sign it happened. Mark single-argument constructors `explicit` unless you
*specifically* want the implicit conversion:

```cpp
explicit Meters(double value) : value_(value) {}

print(5.0);          // error now: no implicit conversion
print(Meters(5.0));  // fine: you said it on purpose
```

## Destructors: tearing down

A **destructor** is `~ClassName()` - no parameters, no return type, and a class has at most one. It runs
automatically the instant the object's lifetime ends: when a local variable's scope closes, when a
member's owning object is destroyed, or when you `delete` a heap object.

```cpp
class Point {
public:
    Point(double x, double y) : x_(x), y_(y) {}
    ~Point() {
        std::cout << "Point destroyed\n";
    }
private:
    double x_, y_;
};

void demo() {
    Point p(1.0, 2.0);
    std::cout << "using p\n";
}   // p goes out of scope right here

int main() {
    demo();
}
```
```console
using p
Point destroyed
```

No call to destroy `p` anywhere in the code. The compiler inserted it at the closing `}` of `demo`,
because that's where `p`'s scope ends. This is **deterministic destruction**: you can point at the exact
line where cleanup happens, before the program even runs. Compare that to a garbage-collected language,
where an object becomes eligible for collection at that point but the actual cleanup happens whenever the
collector next runs, on its own schedule, possibly much later. C++ gives you the same "when it's dead,
it's cleaned up" guarantee, minus the "eventually."

📝 **Terminology.** People often say an object's destructor runs "when it goes out of scope." More
precisely: it runs when the object's **lifetime ends**, which for a local variable is scope exit, but
also happens for heap objects on `delete`, for members when their owning object is destroyed, and
(critically) during **stack unwinding** - when an exception is thrown, every local object between the
`throw` and the matching `catch` gets its destructor run, in order, on the way out. You'll see this again
in [Phase 15](15-error-handling-exceptions-and-alternatives.md).

## RAII: the idea destructors make possible

Here's the leap. If a destructor is *guaranteed* to run when an object dies, and it runs *no matter which
path* the code takes out of scope (normal return, early return, break, or an exception unwinding
through), then a destructor is the perfect place to release anything the object is holding onto: heap
memory, a file handle, a mutex lock, a network socket. This pattern has a name:

**RAII - Resource Acquisition Is Initialization.** Acquire a resource in the constructor. Release it in
the destructor. Tie the resource's lifetime to an object's lifetime, and let the compiler's automatic
destruction do the releasing for you.

Watch the difference on a file handle. First, the C way:

```c
void process_c(const char *path) {
    FILE *f = fopen(path, "r");
    if (!f) return;

    if (something_goes_wrong()) {
        return;              // leak: f is never closed
    }

    // ... use f ...
    fclose(f);
}
```

Every early exit is a place a fix could be forgotten - and in a function with five exit paths, someone
eventually will. Now the RAII way:

```cpp
class FileHandle {
public:
    explicit FileHandle(const char *path) : f_(std::fopen(path, "r")) {}
    ~FileHandle() {
        if (f_) std::fclose(f_);
    }
    FILE *get() const { return f_; }

private:
    FILE *f_;
};

void process_cpp(const char *path) {
    FileHandle f(path);
    if (!f.get()) return;

    if (something_goes_wrong()) {
        return;               // f_'s destructor still runs. No leak.
    }

    // ... use f.get() ...
}   // and here, on the normal path, same guarantee.
```

`FileHandle`'s destructor runs on *every* exit from `process_cpp` - the early return, an exception, or
falling off the end - because the compiler put the cleanup at the language level, not at each call site.
You didn't write three copies of "remember to close the file." You wrote one destructor, once, and it
covers every path forever, including paths someone adds next year.

This is why `std::vector`, `std::string`, and `std::unique_ptr` (coming in
[Phase 13](13-smart-pointers-and-modern-memory-management.md)) never need a manual `free` or `delete`:
they're all RAII wrappers around a resource, exactly like `FileHandle` above, just written once by the
standard library so nobody has to write it twice.

## Construction and destruction order

When a class has several members, they're constructed in the order they're **declared** in the class -
not the order they appear in the initializer list - and destroyed in the exact reverse order:

```cpp
class Widget {
public:
    Widget() : a_(1), b_(2) {}   // a_ built first, then b_ (declaration order)
private:
    A a_;
    B b_;
};   // ~Widget() destroys b_ first, then a_
```

⚠️ **Gotcha.** If your initializer list writes `b_(2), a_(1)` - out of declaration order - most compilers
will warn you (`-Wreorder`). The list's *order in the source* doesn't control construction order; the
class's member declaration order does. Always write the initializer list in declaration order so the
code reads the way it runs.

🪖 **War story.** A common bug: a member holds a raw pointer *into* another member declared later in the
class, and the constructor tries to use it. Because members build top-to-bottom, that later member
doesn't exist yet when the earlier one's constructor runs - the pointer is dangling from the start. The
fix is almost always to reorder the member declarations, not to fight the initializer list.

## Recap

1. Every object has a lifecycle: **construction** (constructor runs), **life**, **destruction**
   (destructor runs) - and in C++ both are automatic and deterministic.
2. **Constructors** set up an object; prefer the **member initializer list** over assignment in the body,
   and mark single-argument constructors `explicit` to block silent conversions.
3. **Destructors** (`~ClassName()`) run the instant an object's lifetime ends - scope exit, `delete`, or
   exception unwinding - on every path, guaranteed.
4. **RAII** ties a resource's lifetime to an object's lifetime: acquire in the constructor, release in
   the destructor. That single pattern is *why* C++ can manage memory, files, and locks without a garbage
   collector and without manual cleanup calls scattered through the code.
5. Members are constructed in **declaration order** and destroyed in the **reverse** of that order,
   regardless of the initializer list's written order.

RAII answers "how does cleanup happen automatically." It doesn't yet answer what happens when you *copy*
an RAII object - two owners now think they're responsible for freeing the same resource. That collision,
and the five special functions that resolve it, is the crux of the whole language.

## Quick check

Test yourself on the idea that makes this phase matter - that RAII ties cleanup to an object's
lifetime instead of leaving it to a programmer's memory:

```quiz
[
  {
    "q": "What does RAII actually guarantee?",
    "choices": [
      "A resource acquired in a constructor gets released in the destructor, automatically, on every exit path",
      "The compiler runs a garbage collector periodically to free unused objects",
      "Memory is freed the moment the last variable pointing to it is reassigned",
      "Resources are released only if the program exits normally, without an exception"
    ],
    "answer": 0,
    "explain": "RAII ties a resource's lifetime to an object's lifetime: the constructor acquires it, the destructor releases it, and the destructor is guaranteed to run on every path out of scope - normal return, early return, or exception unwinding."
  },
  {
    "q": "In `FileHandle f(path); if (!f.get()) return;`, why doesn't the early `return` leak the file handle the way the C version does?",
    "choices": [
      "The compiler runs `~FileHandle()` at that `return`, because that's where `f`'s lifetime ends, regardless of which exit path was taken",
      "The `return` statement automatically calls `fclose` on any open file handles it detects",
      "`FileHandle` doesn't actually leak in C either, the C example was just missing an `if`",
      "It only avoids the leak because `f.get()` happened to return null"
    ],
    "answer": 0,
    "explain": "Destruction is tied to lifetime, not to how a function exits. Every path out of `process_cpp` - including the early `return` - ends `f`'s lifetime at that point, so the compiler inserts the destructor call there too."
  },
  {
    "q": "A class has members `A a_;` then `B b_;`, and the constructor's initializer list writes `b_(2), a_(1)`. What order do construction and destruction actually happen in?",
    "choices": [
      "`a_` constructed first, then `b_`; destroyed in reverse - `b_` then `a_` - regardless of the initializer list's order",
      "`b_` constructed first because it's listed first in the initializer list, then `a_`",
      "Both are constructed in whatever order the compiler finds fastest",
      "Construction order follows the initializer list, but destruction order is unrelated to either"
    ],
    "answer": 0,
    "explain": "Declaration order controls construction order, not the order written in the initializer list - `a_` is declared first so it's built first, and destruction always reverses that: `b_` then `a_`."
  }
]
```

---

[← Phase 6: Classes & Objects](06-classes-and-objects.md) · [Phase 8: Copy, Move & the Rule of Five →](08-copy-move-and-the-rule-of-five.md)
