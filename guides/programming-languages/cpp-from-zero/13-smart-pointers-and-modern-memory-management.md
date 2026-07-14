---
title: "Smart Pointers & Modern Memory Management"
guide: "cpp-from-zero"
phase: 13
summary: "Do I still need raw new and delete in modern C++? No - unique_ptr, shared_ptr and weak_ptr apply the RAII you already learned to heap memory itself, so ownership is tracked by the type system instead of by your memory."
tags: [cpp, smart-pointers, unique_ptr, shared_ptr, weak_ptr, raii, memory-management, rule-of-zero]
difficulty: advanced
synonyms: ["c++ unique_ptr vs shared_ptr", "how do smart pointers work in c++", "when to use weak_ptr", "make_unique vs new c++", "rule of zero c++", "c++ modern memory management", "raw pointer vs smart pointer c++", "c++ avoid memory leaks", "shared_ptr reference counting explained", "c++ owning vs non-owning pointer"]
updated: 2026-07-14
---
# Smart Pointers & Modern Memory Management

If you worked through [C From Zero's chapter on `malloc`/`free`](/guides/c-from-zero/10-dynamic-memory-malloc-and-free), you already know the deal with manual heap memory: every `malloc` needs exactly one `free`, and it's on *you* to make sure that happens on every path through the function, including the early returns and the exceptions you haven't met yet. Forget one path and you leak. Free twice and you corrupt the heap. C++ inherited that same danger through `new` and `delete` - and then, over twenty-some years, built a way out of it.

That way out is not a new rule to memorize. It is the RAII pattern from [Phase 7](07-constructors-destructors-and-raii.md), applied to the one resource that causes the most pain: heap-allocated memory. A **smart pointer** is a small class whose whole job is to own a raw pointer and delete it in its destructor. You stop tracking `delete` calls by hand because you stop calling `delete` at all - the object's lifetime does it for you, automatically, exactly once, on every exit path.

## The mental model: ownership, made explicit in the type

Here's the shift that matters more than any function name. A raw pointer, `T*`, tells you *where* something is but says nothing about *who is responsible for freeing it*. Is this pointer owning the memory it points to, or just observing memory someone else owns? You cannot tell from the type - you have to read the surrounding code, the comments, the documentation, and hope they're accurate and up to date.

Smart pointers put that answer directly into the type:

- **`std::unique_ptr<T>`** - "I am the *only* owner of this. When I die, it dies with me."
- **`std::shared_ptr<T>`** - "Several of us share ownership. The last one out turns off the lights."
- **`T*` or `T&`** (a plain raw pointer or reference) - "I am *borrowing* this. I am not responsible for its lifetime, and I promise not to use it after the real owner is gone."

That third line is the one people miss: raw pointers didn't become bad in modern C++, they became *non-owning by convention*. Ownership questions disappear - the compiler and the type answer them for you.

## `unique_ptr`: RAII for a single heap owner

`unique_ptr` is the default. Reach for it first, always, and only step up to something else when you have an actual reason.

```cpp
#include <memory>
#include <iostream>

struct Widget {
    Widget(int id) : id_(id) { std::cout << "Widget " << id_ << " built\n"; }
    ~Widget() { std::cout << "Widget " << id_ << " destroyed\n"; }
    int id_;
};

void use_widget() {
    std::unique_ptr<Widget> w = std::make_unique<Widget>(1);
    std::cout << "using widget " << w->id_ << "\n";
}   // w goes out of scope here -> destructor runs -> delete happens automatically

int main() {
    use_widget();
    std::cout << "back in main, no leak, no manual delete\n";
}
```

```
Widget 1 built
using widget 1
Widget 1 destroyed
back in main, no leak, no manual delete
```

No `new`, no `delete`, no leak even if an exception had been thrown mid-function - unwinding still runs the destructor, same as any other RAII type. Always build one with `std::make_unique<T>(args...)` rather than `unique_ptr<T>(new T(args...))`: it's shorter, it names the type only once, and it keeps `new` out of your code entirely so there's no raw pointer sitting around waiting to be leaked or deleted twice.

`unique_ptr` cannot be copied - copying it would create two owners, which is exactly the double-free bug RAII exists to prevent. It *can* be moved, using the move semantics from [Phase 8](08-copy-move-and-the-rule-of-five.md):

```cpp
std::unique_ptr<Widget> a = std::make_unique<Widget>(2);
std::unique_ptr<Widget> b = std::move(a);   // ownership transfers to b
// a is now empty (nullptr); only b will delete the Widget
```

That's move semantics doing real, visible work: ownership physically changes hands, and the compiler enforces that only one `unique_ptr` ever points at that `Widget` at a time.

## `shared_ptr`: when ownership is genuinely shared

Sometimes one owner doesn't fit the problem - a cache entry that several parts of your program hold onto, a node in a graph reachable from multiple paths. `shared_ptr` keeps a **reference count** alongside the object: every copy of a `shared_ptr` increments it, every destructor decrements it, and the object is deleted the moment the count hits zero.

```cpp
#include <memory>

std::shared_ptr<Widget> make_shared_widget() {
    return std::make_shared<Widget>(3);
}

int main() {
    std::shared_ptr<Widget> p1 = make_shared_widget();   // count = 1
    {
        std::shared_ptr<Widget> p2 = p1;                 // count = 2, same object
        std::cout << "use count: " << p1.use_count() << "\n";   // 2
    }   // p2 destroyed, count = 1
    std::cout << "use count: " << p1.use_count() << "\n";       // 1
}   // p1 destroyed, count = 0 -> Widget deleted
```

Prefer `std::make_shared<T>(args...)` over `shared_ptr<T>(new T(...))` here too - it does one heap allocation for the object *and* its control block together, instead of two, which is both faster and safer.

The cost is real: every copy touches an atomic counter (so `shared_ptr` is thread-safe to copy, but that safety isn't free), and the type is larger than a raw pointer. Reach for `shared_ptr` when ownership is *actually* shared, not as a default "make the compiler stop complaining" move - that instinct is the `shared_ptr` version of the `.clone()`-to-escape-the-borrow-checker trap Rust programmers warn each other about. Most of the time `unique_ptr`, or no smart pointer at all (a plain value, or a reference), is the right call.

## `weak_ptr`: observing without owning, and breaking cycles

`shared_ptr` has one classic failure mode: a **reference cycle**. If A holds a `shared_ptr` to B, and B holds a `shared_ptr` back to A, each keeps the other's count above zero forever - neither is ever destroyed, even after nothing outside the pair can reach them. That's a leak, the same shape of bug garbage-collected languages call out as a known weakness of naive reference counting.

`weak_ptr` is the fix: it points at an object owned by a `shared_ptr` *without* incrementing the count. It can't be dereferenced directly - you must `lock()` it first, which hands you back a real `shared_ptr` if the object is still alive, or an empty one if it's already gone:

```cpp
struct Node {
    std::shared_ptr<Node> child;
    std::weak_ptr<Node> parent;   // weak: doesn't keep the parent alive
};

void visit_parent(const std::weak_ptr<Node>& wp) {
    if (std::shared_ptr<Node> p = wp.lock()) {
        // parent still alive, safe to use p
    } else {
        // parent has already been destroyed
    }
}
```

The rule of thumb: in a parent/child tree, the parent owns children with `shared_ptr`, children point back at the parent with `weak_ptr`. Ownership flows one direction; observation flows the other.

## Rule of Zero: smart pointers finish the job Phase 8 started

Phase 8 taught you the Rule of Five - if you manage a resource yourself, write all five special members or delete them. Smart pointers let most classes skip that homework entirely. Put a `unique_ptr` or `shared_ptr` in your class as a member, write nothing else, and the compiler-generated destructor, move, and (for `shared_ptr`) copy operations are already correct, because they just call into the member's own RAII machinery.

```cpp
class Document {
    std::unique_ptr<Widget> widget_;   // that's it - no destructor, no copy/move code needed
};
```

This is the **Rule of Zero**: the best number of special member functions to write yourself is zero, achieved by letting every resource-owning member be a type - a smart pointer, a `std::vector`, a `std::string` - that already does RAII correctly. Reserve the Rule of Five from Phase 8 for the rare class that *is* a resource wrapper itself; let smart pointers make every class *above* that layer simple again.

## When to still reach for a raw pointer

Raw pointers aren't gone, and that's fine - they just changed job. Use a raw pointer or a reference when you need to **observe** an object without any claim on its lifetime: a function parameter that just looks at a `Widget` someone else owns, an "current selection" field that points into a container it doesn't manage. The rule that keeps this safe is the same one you'd apply anywhere: never let a raw pointer outlive the owner it points into - which is exactly the dangling-pointer discipline from [C's pointer chapters](/guides/c-from-zero/05-pointers-i-the-mental-model), just with the *ownership* half of the problem already solved by the smart pointer standing behind it.

What you should never do is mix the two worlds carelessly: don't call `delete` on a pointer a `unique_ptr` already owns, and don't build a second `shared_ptr` from the raw pointer inside one you already have (`shared_ptr<Widget>(p1.get())` creates an independent control block that will double-free `p1`'s object). If you need another owning handle, copy the smart pointer, never rebuild one from `.get()`.

## Recap

1. A smart pointer is an RAII class whose destructor calls `delete` for you - it moves memory management from "your discipline" to "the type system."
2. `unique_ptr` is the default: single owner, move-only, built with `make_unique`. Cheap - basically a raw pointer with a destructor.
3. `shared_ptr` is for genuinely shared ownership: reference-counted, built with `make_shared`, copy is not free.
4. `weak_ptr` observes a `shared_ptr`-owned object without extending its life, and breaks the ownership cycles that would otherwise leak forever.
5. The **Rule of Zero**: hold resources in smart-pointer (or container) members and you rarely need to write the Rule of Five yourself.
6. Raw pointers and references still exist, but now mean one thing only: "I'm borrowing this, I don't own it" - never call `delete` on one.

## Check yourself

Test yourself on the idea that matters most here - that ownership now lives in the type, not in your memory of the code:

```quiz
[
  {
    "q": "What does a raw pointer, T*, tell you that a unique_ptr<T> doesn't - and vice versa?",
    "choices": [
      "T* says nothing about who owns the memory; unique_ptr<T> says in the type itself that this is the one and only owner",
      "They mean the same thing - unique_ptr is just a raw pointer with a different name",
      "T* is always non-owning by the language rules, so unique_ptr is only needed for arrays",
      "unique_ptr<T> is guaranteed to be faster at every operation than T*"
    ],
    "answer": 0,
    "explain": "A raw pointer only tells you where something is; you'd have to read comments or docs to know who's responsible for freeing it. unique_ptr puts that answer in the type: single, exclusive owner."
  },
  {
    "q": "A Widget only ever needs one owner, but you reach for shared_ptr anyway 'just to be safe.' What does that actually cost you?",
    "choices": [
      "Nothing measurable - shared_ptr behaves identically to unique_ptr in every way",
      "Every copy touches an atomic reference count, and the type carries a control-block pointer unique_ptr doesn't need, for a sharing guarantee you never use",
      "shared_ptr can't be used with make_shared, so you lose exception safety",
      "shared_ptr forces you to write your own destructor, unlike unique_ptr"
    ],
    "answer": 1,
    "explain": "shared_ptr's reference counting is real overhead - an atomic increment/decrement on every copy plus a heavier type - so it should model genuine shared ownership, not stand in as a default 'safer' choice."
  },
  {
    "q": "In a parent/child tree, Node holds children with shared_ptr and points back at its parent with weak_ptr. What breaks if you swap that weak_ptr for a second shared_ptr instead?",
    "choices": [
      "Nothing changes - weak_ptr and shared_ptr behave identically as long as you call lock() first",
      "The program crashes immediately the first time a Node is created",
      "Parent and child now each keep the other's reference count above zero forever, so neither is ever destroyed even after nothing else can reach them",
      "The compiler rejects the code, since shared_ptr can't point to a Node type"
    ],
    "answer": 2,
    "explain": "Two shared_ptrs pointing at each other form a reference cycle: each object's count never reaches zero, so both leak silently. weak_ptr observes without incrementing the count, which is exactly what breaks that cycle."
  }
]
```

---

[← Phase 12: The STL: Iterators & Algorithms](12-the-stl-iterators-and-algorithms.md) · [Phase 14: Inheritance & Polymorphism →](14-inheritance-and-polymorphism.md)
