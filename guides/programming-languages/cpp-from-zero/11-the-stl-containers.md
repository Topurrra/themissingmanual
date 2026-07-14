---
title: "The STL: Containers"
guide: "cpp-from-zero"
phase: 11
summary: "What is std::vector and when should I reach for map, set, or deque instead - and why do C++ containers copy everything by value unless you tell them not to?"
tags: [cpp, stl, vector, map, containers, data-structures, templates]
difficulty: intermediate
synonyms: ["c++ vector tutorial", "std::vector explained", "when to use std::map vs unordered_map", "c++ stl containers", "c++ array vs vector", "std::string is it a container", "c++ deque vs vector", "c++ container complexity", "c++ pair and tuple", "how does std::vector grow"]
updated: 2026-07-14
---
# The STL: Containers

You've now got the two ingredients that make this phase possible. Templates (phase 10) let you write a
type once and have the compiler stamp out a version for any `T`. RAII and the Rule of Five (phases 7-8)
mean a type can own a resource and manage its own lifetime correctly through copies and moves. Put those
together and you get the **Standard Template Library** - a set of generic, RAII-safe data structures that
ship with every C++ compiler. This phase is about the container half of the STL: the boxes you put your
data in. Phase 12 covers the other half - iterators and algorithms, the tools that work *on* those boxes.

## The mental model: a container is a class template that owns its elements

A `std::vector<int>` is not a language feature. It's an ordinary class, defined with a template, whose
constructor allocates memory, whose destructor frees it, and whose copy constructor deep-copies every
element. You already know how to reason about it - you reasoned about exactly this shape of class in
phase 7 and phase 8. The only new thing is that the library ships dozens of these classes, each with a
different internal layout and a different set of tradeoffs, all wrapped around the same ownership
discipline.

That's the payoff for suffering through RAII and the Rule of Five: you never manually `new` or `delete`
a buffer again. `std::vector` does it for you, correctly, every time.

## `std::vector`: your default container

`std::vector<T>` is a dynamically-sized array: elements sit contiguously in memory, exactly like a C
array, but the vector grows itself as you add elements.

```cpp
#include <vector>
#include <iostream>

int main() {
    std::vector<int> scores;        // starts empty
    scores.push_back(90);
    scores.push_back(85);
    scores.push_back(72);

    for (int s : scores) {          // range-based for loop
        std::cout << s << " ";
    }
    std::cout << "\nsize: " << scores.size() << "\n";
}
```
```
90 85 72
size: 3
```

Under the hood, a vector holds a pointer, a size, and a capacity. When `push_back` would exceed capacity,
it allocates a bigger buffer (typically double the size), moves (or copies) the existing elements into
it, and frees the old one. That's why appending is usually O(1) but occasionally, on a resize, costs O(n) - averaged
out ("amortized") over many pushes, it's still O(1) per element. If you know roughly how many elements
you'll need, call `scores.reserve(1000)` up front to skip the resizing dance entirely.

Because a vector's storage is contiguous, indexing with `scores[i]` is a single pointer offset, O(1),
just like a C array. That contiguity is also *why* vector is the default: it's the most cache-friendly
layout there is, and modern CPUs reward that heavily.

**Rule of thumb: reach for `std::vector` unless you have a specific reason not to.** The rest of this
phase is mostly about what those reasons look like.

## `std::array`: when the size is fixed at compile time

`std::array<T, N>` is a fixed-size array with the size baked into the type, stored inline (no heap
allocation at all, just like the raw C arrays from `c-from-zero`) but wrapped with the same interface as
the other containers - `.size()`, iterators, bounds-checked `.at()`.

```cpp
#include <array>

std::array<int, 3> rgb = {255, 0, 128};
// rgb.push_back(1);  // error: array has no push_back, size is fixed
```

Use it when the count is genuinely fixed and known at compile time (a 3D vector's `x, y, z`, a lookup
table). It has zero allocation overhead compared to `std::vector`, which is the whole reason it exists.

## `std::string`: a container you already met

`std::string` (phase 3) *is* a sequence container under the hood - a dynamically-sized, contiguous
buffer of `char`, with the exact same growth story as `std::vector<char>`. Everything you learn here
about vector's cost model - amortized O(1) append, O(n) insert in the middle, contiguous storage -
applies to `std::string` too.

## The other sequence containers, and when to reach for them

| Container | Layout | Good at | Bad at |
|---|---|---|---|
| `std::vector<T>` | contiguous array | indexing, iterating, appending at the end | inserting/removing in the middle |
| `std::deque<T>` | chunked array | push/pop at *both* ends | less cache-friendly than vector |
| `std::list<T>` | doubly linked list | insert/remove anywhere, O(1), given an iterator | indexing (must walk the list), cache-unfriendly |
| `std::forward_list<T>` | singly linked list | minimal memory per node | forward iteration only |

In practice, `std::deque` shows up when you need a queue (push at the back, pop from the front) and
`std::list`/`std::forward_list` are rare - most "I need to insert in the middle a lot" problems are still
faster with a vector plus a smarter algorithm, because linked-list traversal thrashes the cache. Reach
for `list` only after you've measured that vector is actually the bottleneck.

## Associative containers: looking things up by key

`std::vector` finds elements by position. The associative containers find elements by **key**.

```cpp
#include <map>
#include <string>
#include <iostream>

int main() {
    std::map<std::string, int> age;
    age["Ada"] = 36;
    age["Alan"] = 41;

    if (auto it = age.find("Ada"); it != age.end()) {
        std::cout << "Ada is " << it->second << "\n";
    }

    for (const auto& [name, years] : age) {   // structured bindings, C++17
        std::cout << name << ": " << years << "\n";
    }
}
```
```
Ada is 36
Ada: 36
Alan: 41
```

`std::map<K, V>` keeps its keys **sorted** (it's a balanced binary search tree internally), so lookup,
insert, and erase are all O(log n), and iterating it visits keys in order - notice `Ada` printed before
`Alan` above, even though `Alan` was inserted second. `std::set<T>` is the same idea without the value -
just a sorted collection of unique keys.

`std::unordered_map<K, V>` and `std::unordered_set<T>` are the hash-table versions: no ordering
guarantee, but O(1) average-case lookup instead of O(log n). **Default to `unordered_map` when you don't
care about order** - it's almost always faster in practice. Reach for `map`/`set` when you need sorted
iteration, or when your key type doesn't have a good hash function readily available.

Both families reject duplicate keys by design - inserting `age["Ada"] = 40;` again overwrites the
existing entry rather than adding a second one. If you need duplicates, `std::multimap`/`std::multiset`
exist but come up rarely.

## `std::pair` and `std::tuple`: bundling values without a class

Sometimes you want to return two or three related values without writing a whole struct. That's what
`std::map`'s `it->second` came from - a `std::map` entry is actually a `std::pair<const K, V>`. You can
build one yourself:

```cpp
#include <utility>

std::pair<std::string, int> entry = {"Grace", 47};
std::cout << entry.first << " is " << entry.second << "\n";

auto [name, age2] = entry;   // structured bindings unpack it directly
```

`std::tuple<T1, T2, ...>` generalizes `pair` to any number of elements, accessed with `std::get<0>(t)` or
unpacked the same way with structured bindings. Both are fine for quick, throwaway bundling; once a
grouping of values has a real meaning in your program (a `Point`, a `Result`), give it a named struct -
it reads better and the compiler catches more mistakes for you.

## Containers copy by value - on purpose

Because containers follow the Rule of Five, copying one deep-copies everything inside it:

```cpp
std::vector<int> a = {1, 2, 3};
std::vector<int> b = a;      // full copy - a and b own separate buffers
b.push_back(4);               // a is untouched, still {1, 2, 3}
```

This is value semantics doing exactly what it promised back in phase 8: no aliasing surprises, no two
containers secretly sharing one buffer. It also means copying a large container is genuinely expensive -
pass containers by `const&` into functions that only read them, and use `std::move` when you mean to
transfer ownership rather than duplicate it.

## Recap

- Every STL container is a class template built on RAII: it owns its elements, allocates in its
  constructor, frees in its destructor, and deep-copies on copy.
- `std::vector` is the default: contiguous, cache-friendly, O(1) amortized append, O(1) indexing.
- `std::array` is a fixed-size array with vector's interface but no growth and no heap allocation.
- `std::deque`, `std::list`, `std::forward_list` trade vector's cache-friendliness for cheap insertion
  elsewhere, or push/pop at both ends - reach for them only when measurement says vector isn't enough.
- `std::map`/`std::set` are sorted, O(log n); `std::unordered_map`/`std::unordered_set` are hashed,
  O(1) average - default to the unordered versions unless you need sorted order.
- `std::pair`/`std::tuple` bundle a few values quickly; a named struct is clearer once the grouping means
  something.
- Containers copy by value, deeply, following the same rules as any well-behaved class from phase 8.

Now that your data has somewhere to live, the next phase covers how to actually walk through it and
operate on it without writing a raw loop every time.

## Quick check

Test yourself on the ideas that matter most for choosing and using a container correctly:

```quiz
[
  {
    "q": "A vector is at capacity and you call push_back() one more time. What actually happens?",
    "choices": [
      "It throws an exception - call reserve() first or it will always fail",
      "It allocates a bigger buffer, moves (or copies) the existing elements into it, and frees the old buffer",
      "It silently overwrites the last element instead of growing",
      "It grows by exactly one element to avoid wasting memory"
    ],
    "answer": 1,
    "explain": "That reallocate-move-free step is the occasional O(n) cost behind vector's amortized O(1) append - reserve() lets you skip it if you know the size ahead of time."
  },
  {
    "q": "You need to look up values by key and don't care about iteration order. Which container should you default to?",
    "choices": [
      "std::map, because sorted output is always more useful",
      "std::vector, searching linearly for the key",
      "std::unordered_map, for O(1) average-case lookup",
      "std::list, since it inserts anywhere in O(1)"
    ],
    "answer": 2,
    "explain": "unordered_map's hash table gives O(1) average lookup versus map's O(log n) tree - reach for map only when you specifically need sorted iteration."
  },
  {
    "q": "After `std::vector<int> b = a;` followed by `b.push_back(4)`, what happens to `a`?",
    "choices": [
      "a also gains the 4, since b just references a's buffer",
      "a is untouched - the copy gave b its own separate buffer",
      "a becomes empty because ownership moved to b",
      "It's undefined behavior since both vectors share memory"
    ],
    "answer": 1,
    "explain": "STL containers follow the Rule of Five: copying deep-copies every element, so a and b own independent buffers - unlike a Python list or Java ArrayList reference, there's no aliasing here."
  }
]
```

---

[← Phase 10: Templates & Generic Programming](10-templates-and-generic-programming.md) · [Phase 12: The STL: Iterators & Algorithms →](12-the-stl-iterators-and-algorithms.md)
