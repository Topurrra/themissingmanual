---
title: "Copy, Move & the Rule of Five"
guide: "cpp-from-zero"
phase: 8
summary: "What actually happens when you write `Widget b = a;`, why the compiler-generated copy can silently corrupt your program, and how the Rule of Five (and its lazier cousin, the Rule of Zero) let you control it."
tags: [cpp, copy-constructor, move-semantics, rule-of-five, rule-of-zero, rvalue-references, destructors]
difficulty: advanced
synonyms: ["c++ rule of five explained", "what is a move constructor", "c++ copy constructor vs assignment", "std::move c++", "rvalue reference explained", "c++ shallow copy bug", "rule of zero c++", "when do i need a destructor c++", "c++ double free copy"]
updated: 2026-07-14
---
# Copy, Move & the Rule of Five

This is the phase the whole book has been building toward. Phase 7 gave you RAII: a constructor acquires a resource, a destructor releases it, and scope does the rest. That idea is beautiful right up until you copy the object - and then, if you haven't told C++ what copying *means* for your class, it quietly does the wrong thing. Understanding exactly what "wrong" looks like, and how to fix it, is the single most important skill in C++. Get this phase and the rest of the language falls into place. Skip it and you'll spend years chasing crashes that only show up in release builds.

## The mental model: every type answers five questions

In C++, objects are values by default (unlike C#, Java, or Python, where `Widget b = a` copies a reference - see phase 2 for that contrast). When you write `Widget b = a`, C++ has to *build a new object* that behaves like `a`. To do that, every type - whether you wrote it or the compiler did - answers five questions:

1. How do I **destroy** you? (destructor)
2. How do I **copy** you from an existing object? (copy constructor)
3. How do I **copy** you into an already-existing object? (copy assignment)
4. How do I **steal** your guts instead of copying them, because you're about to be thrown away anyway? (move constructor)
5. How do I steal your guts into an already-existing object? (move assignment)

If you write none of these, the compiler generates all five for you, member by member: destroy each member, copy each member, move each member. For a class made only of plain values (`int`, `double`) or well-behaved RAII types (`std::string`, `std::vector`), that generated behavior is *exactly right* and you never think about it again. The trouble starts the moment your class manages a resource by hand - a raw pointer, a file handle, anything phase 7 taught you to wrap in a constructor/destructor pair.

## Watch the compiler get it wrong

Take the `Buffer` class from phase 7, a thin RAII wrapper around a heap array:

```cpp
class Buffer {
public:
    Buffer(size_t size) : size_(size), data_(new int[size]) {}
    ~Buffer() { delete[] data_; }

    int size() const { return size_; }
    int* data() { return data_; }

private:
    size_t size_;
    int* data_;
};
```

We never wrote a copy constructor, so the compiler generated one: it copies `size_` (fine, it's an `int`) and copies `data_` (a *pointer* - so it copies the address, not the array it points to). That's called a **shallow copy**, and it's a landmine:

```cpp
Buffer a(10);
Buffer b = a;   // compiler-generated copy: b.data_ == a.data_ !

// a and b now both "own" the same heap array.
```

Both objects think they own that array. When `a` goes out of scope, its destructor runs `delete[] data_`. When `b` then goes out of scope, its destructor runs `delete[] data_` on the *same already-freed pointer* - a double free, which is undefined behavior (phase 17 covers UB in depth; for now, treat it as "your program is no longer trustworthy"). Worse, any use of `b` after `a` is destroyed is a use of freed memory. Neither of these crashes reliably or immediately, which is exactly why it's dangerous: it can pass every test you write and then corrupt memory in production.

The fix isn't "be more careful." It's: **tell the compiler what copying actually means for this type.**

## Writing the copy operations

```cpp
class Buffer {
public:
    Buffer(size_t size) : size_(size), data_(new int[size]) {}
    ~Buffer() { delete[] data_; }

    // Copy constructor: build a *new* Buffer from an existing one.
    Buffer(const Buffer& other) : size_(other.size_), data_(new int[other.size_]) {
        std::copy(other.data_, other.data_ + size_, data_);
    }

    // Copy assignment: *this already exists; make it equal to other.
    Buffer& operator=(const Buffer& other) {
        if (this == &other) return *this;      // guard self-assignment
        int* new_data = new int[other.size_];  // allocate first
        std::copy(other.data_, other.data_ + other.size_, new_data);
        delete[] data_;                        // then release the old data
        data_ = new_data;
        size_ = other.size_;
        return *this;
    }

    size_t size_;
    int* data_;
};
```

Now `Buffer b = a;` allocates its own array and copies the *values*. Two independent objects, two independent arrays, no double free. Notice the "allocate first, then release" order in copy assignment - if `new int[]` throws (out of memory), `*this` is left untouched instead of half-destroyed. That's the same "acquire before you release" discipline RAII taught you in phase 7.

## Move: skip the copy when the source is disposable

Copying is correct, but for a large `Buffer`, it's wasteful in one common case: when the source object is a temporary that's about to be destroyed anyway. Consider `Buffer make_buffer() { Buffer b(1000000); return b; }`. Copying a million ints just to immediately destroy the original would be pure waste - the data didn't need to be duplicated, just handed off. (For this exact named return the compiler usually skips the handoff entirely via *copy elision* / NRVO; the move constructor is what keeps that handoff cheap everywhere elision doesn't reach, like dropping a temporary into a `std::vector`.)

C++11 added **rvalue references** (`Buffer&&`) to name exactly this situation: a reference that only binds to values the compiler knows are temporary (or that you explicitly mark as "safe to plunder" with `std::move`). A move constructor and move assignment operator take a `Buffer&&` and, instead of copying, **steal the pointer** and leave the source in a harmless empty state:

```cpp
    // Move constructor: cannibalize other's insides, leave it empty.
    Buffer(Buffer&& other) noexcept
        : size_(other.size_), data_(other.data_) {
        other.data_ = nullptr;   // other's destructor must not free this now
        other.size_ = 0;
    }

    // Move assignment: release our own data, then steal other's.
    Buffer& operator=(Buffer&& other) noexcept {
        if (this == &other) return *this;
        delete[] data_;
        data_ = other.data_;
        size_ = other.size_;
        other.data_ = nullptr;
        other.size_ = 0;
        return *this;
    }
```

`std::move(x)` doesn't move anything by itself - it's just a cast that says "treat `x` as an rvalue," giving the compiler permission to pick the move overload instead of the copy overload. After `Buffer c = std::move(a);`, `a` is still a valid object (you can destroy it or reassign it), but its internal pointer is gone. Relying on `a`'s old contents after moving from it is a bug, just not a memory-safety one - `a.data()` now returns `nullptr`, and the class contract only promises "safely destructible," not "unchanged."

Mark move operations `noexcept` whenever you can. Containers like `std::vector` check for this: if your move constructor might throw, `std::vector` falls back to copying when it resizes, silently giving up the speed you wrote the move constructor for.

## The Rule of Five (and the Rule of Zero)

**The Rule of Five:** if your class needs to define *any one* of destructor, copy constructor, copy assignment, move constructor, or move assignment, it almost always needs to define *all five*, deliberately. The reasoning is symmetric: needing a custom destructor is a signal you're managing a resource by hand, and a hand-managed resource needs hand-written copy and move behavior too, or you're back to the shallow-copy landmine. (Older code you'll encounter follows the **Rule of Three** - destructor, copy constructor, copy assignment - from before C++11 added move semantics; the idea is the same, just missing the two move operations.)

**The Rule of Zero**, and this is the one experienced C++ programmers actually reach for: **don't manage raw resources in your own classes at all.** Let your members be `std::string`, `std::vector`, `std::unique_ptr` (phase 13) - types that already correctly implement their own Rule of Five. Then write *none* of the five yourself, and let the compiler generate correct member-wise copy and move for free:

```cpp
class Buffer {
public:
    Buffer(size_t size) : data_(size) {}   // std::vector<int> owns the memory
    size_t size() const { return data_.size(); }
private:
    std::vector<int> data_;
};
```

This `Buffer` has no destructor, no copy operations, no move operations - and is correct, because `std::vector` already solved this problem for you. The lesson of this entire phase, distilled: write the Rule of Five when you're the one holding a raw resource; reach for the Rule of Zero and let RAII types do the holding whenever you can. Most real C++ code should look like the second `Buffer`, not the first - you now understand *why* the first one works, so you'll recognize it (and its bugs) when you meet it in the wild.

## Recap

- C++ objects have value semantics: `b = a` builds or overwrites a real object, and every type needs an answer for how.
- The compiler generates all five special member functions by default, member-wise - correct for RAII members, silently wrong (shallow copy) for raw pointers/handles you own.
- A shallow copy of an owning pointer means two objects think they own one resource, leading to double free / use-after-free when both destructors run.
- Write a copy constructor and copy assignment operator to make copying deep and correct; allocate-before-release keeps assignment safe if allocation throws.
- Move operations (`T&&`, `std::move`) let you steal a temporary's resources instead of copying them, and should be `noexcept`.
- Rule of Five: define one of {destructor, copy ctor, copy assign, move ctor, move assign} and you likely need all five.
- Rule of Zero: prefer RAII members (`std::string`, `std::vector`, `unique_ptr`) so you never have to write any of the five yourself.

### Check yourself

```quiz
[
  {
    "q": "Why does the compiler-generated copy constructor break the raw-pointer Buffer class in this phase?",
    "choices": [
      "It copies the pointer's address, so both objects end up owning and eventually freeing the same heap array",
      "It forgets to copy size_, leaving the new object with size 0",
      "It calls the destructor on the original object as soon as the copy finishes"
    ],
    "answer": 0,
    "explain": "A member-wise copy duplicates the pointer value, not the array it points to - that's the shallow copy that leads to a double free."
  },
  {
    "q": "What does std::move(x) actually do?",
    "choices": [
      "It immediately relocates x's data to new memory",
      "It casts x to an rvalue reference, which just gives the compiler permission to pick a move overload instead of a copy",
      "It deletes x's contents right away so nothing can use them by accident"
    ],
    "answer": 1,
    "explain": "std::move moves nothing by itself - it's a cast that makes the move constructor or move assignment eligible to be chosen."
  },
  {
    "q": "Under the Rule of Zero, why can a class whose only members are std::string and std::vector skip writing all five special member functions?",
    "choices": [
      "Because std::string and std::vector never allocate heap memory, so there's nothing to copy or move",
      "Because those member types already implement correct copy and move themselves, so the compiler-generated member-wise versions are correct",
      "Because the Rule of Zero disables copying entirely, so the question never comes up"
    ],
    "answer": 1,
    "explain": "The compiler-generated special members just call each member's own copy/move - which is already correct when every member is an RAII type."
  }
]
```

---

[← Phase 7: Constructors, Destructors & RAII](07-constructors-destructors-and-raii.md) · [Phase 9: Operator Overloading →](09-operator-overloading.md)
