---
title: "The STL: Iterators & Algorithms"
guide: "cpp-from-zero"
phase: 12
summary: "How do you write one sort() that works on a vector, a list, and a deque without three copies of the code? Iterators are the answer - a generalized pointer that lets algorithms and containers stay completely decoupled."
tags: [cpp, stl, iterators, algorithms, ranges, std-algorithm, generic-programming]
difficulty: intermediate
synonyms: ["c++ iterators explained", "what is an iterator in c++", "std::sort how does it work", "c++ algorithm header", "begin end iterator c++", "iterator categories c++", "c++ for_each vs range for", "invalidated iterator c++", "std::find example", "c++ accumulate transform"]
updated: 2026-07-14
---
# The STL: Iterators & Algorithms

In [Phase 11](11-the-stl-containers.md) you met the containers: `vector`, `list`, `map`, `unordered_map`, `set`, and friends. Each one stores data differently - contiguous array, linked nodes, a tree, a hash table. Now here's a question that should bother you: how does `std::sort` work on a `vector`? What about `std::find`, does it need a different version for `list` than for `map`?

The answer is the single cleverest idea in the STL, and it's why the library is called the *Standard Template Library* and not just "some containers." **Algorithms never touch containers directly. They only ever touch iterators.** A `vector` and a `list` store memory in totally different shapes, but both can hand out an iterator, and every algorithm only knows how to talk to iterators. That one layer of indirection is what lets dozens of algorithms work correctly on every container that ever existed, or ever will.

## The mental model: an iterator is a generalized pointer

Forget the word "iterator" for a second and think about a raw pointer into an array:

```cpp
int arr[] = {10, 20, 30};
int* p = arr;      // points at arr[0]
*p;                 // 10 - dereference to read
++p;                // now points at arr[1]
p == arr + 3;       // true when p has walked off the end
```

A pointer already does three things: it can be dereferenced (`*p`), it can be advanced (`++p`), and it can be compared to a sentinel to know when to stop. An **iterator** is exactly that idea, generalized to work for containers where "advance" doesn't mean "add 4 bytes." For a `std::list`, advancing means "follow the `next` pointer to the next node." For a `std::map`, it means "walk to the next node in tree order." The syntax `*it`, `++it`, `it == end` stays identical - only what happens underneath changes, and each container hides that difference inside its own iterator type.

Every container exposes exactly this pair:

```cpp
std::vector<int> v = {1, 2, 3, 4, 5};

auto it = v.begin();   // iterator to the first element
auto e  = v.end();     // "one past the last element" - not a valid element!

for (; it != e; ++it) {
    std::cout << *it << " ";
}
```

That `end()` is the detail that trips people up first: it does **not** point at the last element, it points *past* it. `[begin, end)` is a half-open range - you keep going while `it != end`, and you never dereference `end` itself. This is exactly why `for (int i = 0; i < n; ++i)` and `[begin, end)` feel so similar: both describe "start here, stop right before there."

The range-based `for` loop you've been using since [Phase 3](03-types-variables-and-control-flow.md) is literally sugar for the loop above - the compiler rewrites `for (auto x : v)` into a `begin()`/`end()`/`++`/`*` loop for you. You already knew iterators; you just weren't calling them that.

## Why not just write the loop yourself?

You *can* write `for` loops forever and never call an algorithm. So why bother?

```cpp
// The "just write a loop" version
int count = 0;
for (auto it = v.begin(); it != v.end(); ++it) {
    if (*it % 2 == 0) ++count;
}

// The algorithm version
int count = std::count_if(v.begin(), v.end(),
                           [](int x) { return x % 2 == 0; });
```

Both do the same thing, but the second one names the *intent* - "count things matching a condition" - instead of making you reconstruct that intent from a loop's mechanics. That matters more than it sounds like: a loop can have an off-by-one bug, forget to increment, or accidentally mutate something it shouldn't. `std::count_if` cannot have an off-by-one bug, because the STL authors already got it right once and every caller reuses that correctness. This is the same trade you make reaching for a library function over hand-rolling one - except here the "library" covers searching, sorting, copying, and transforming, uniformly, over every container.

## The `<algorithm>` toolbox

Almost everything lives in `<algorithm>` (with a few numeric ones in `<numeric>`). They all take iterator ranges, not containers:

```cpp
#include <algorithm>
#include <numeric>
#include <vector>

std::vector<int> v = {5, 3, 1, 4, 1, 5, 9};

std::sort(v.begin(), v.end());                    // {1,1,3,4,5,5,9}

auto it = std::find(v.begin(), v.end(), 4);        // iterator to the 4
bool found = (it != v.end());

int total = std::accumulate(v.begin(), v.end(), 0); // sum, starting from 0

std::vector<int> doubled(v.size());
std::transform(v.begin(), v.end(), doubled.begin(),
                [](int x) { return x * 2; });       // doubled = {2,2,6,8,10,10,18}

auto count = std::count_if(v.begin(), v.end(),
                            [](int x) { return x > 3; });

v.erase(std::remove(v.begin(), v.end(), 1), v.end()); // the "erase-remove idiom"
```

That last line looks strange the first time you see it, and it teaches something important about how algorithms are constrained. `std::remove` **cannot** actually shrink the container - it only has iterators, not a reference to the `vector` itself, so it has no way to change the container's size. All it can do is shuffle the elements you want to keep toward the front and return an iterator to the new "logical end." You then call the container's own `.erase()` to actually cut the tail off. This split - algorithms rearrange through iterators, containers own the memory - is the same begin/end boundary showing up again, and it's a rite of passage every C++ programmer hits once.

A binary-search family (`std::lower_bound`, `std::binary_search`) assumes the range is already sorted; running it on unsorted data compiles fine and silently gives you a wrong answer, because the algorithm has no way to check your data's shape, only walk it. That's a common, quiet bug - the fix is always "did I sort first?"

## Iterator categories: not all iterators can do the same things

A `vector`'s iterator can jump five elements at once (`it + 5`), because the underlying memory is contiguous. A `list`'s iterator cannot - to reach five elements ahead it must follow five `next` pointers one at a time. The STL names these capability tiers **iterator categories**:

| Category | Can do | Example container |
|---|---|---|
| Input | read once, `++` forward | `istream_iterator` |
| Forward | read multiple times, `++` forward | `forward_list` |
| Bidirectional | `++` and `--` | `list`, `map`, `set` |
| Random access | `+n`, `-n`, `<`, jump anywhere in O(1) | `vector`, `deque`, `array` |

This is why `std::sort` refuses to compile on a `std::list` - sorting efficiently needs to jump around, which requires random access, and `list`'s iterator doesn't offer it. (`list` ships its own `.sort()` member instead, written to work with what a linked list *can* do: pointer relinking.) The compiler error you'll get is ugly template noise, but the root cause is always this: the algorithm asked for more than that iterator can promise.

## The trap: invalidated iterators

An iterator is a handle into a container's current memory. If the container reallocates or restructures - a `vector` growing past its capacity, or erasing an element - any iterator you were holding can become a dangling reference to memory that's no longer valid:

```cpp
std::vector<int> v = {1, 2, 3};
auto it = v.begin();
v.push_back(4);      // may reallocate the whole buffer
*it;                  // undefined behavior - it may point at freed memory
```

The rule of thumb: get a fresh iterator (or index) right before you use it, don't hold one across an operation that might resize or erase from the container. Each container's reference documents exactly which operations invalidate iterators - `vector::push_back` might, `list::insert` never does (nodes don't move), and so on.

## What C++20 ranges do about all this

Writing `v.begin(), v.end()` everywhere gets repetitive, and it's easy to accidentally mix a `begin()` from one container with an `end()` from another. C++20 added **ranges**, which let you write `std::ranges::sort(v)` instead of `std::sort(v.begin(), v.end())` - the range itself carries its own bounds. Under the hood it's still iterators doing the work; ranges are a friendlier front door on the same machinery you just learned. [Phase 16](16-modern-cpp-auto-lambdas-ranges-and-what-changed-since-cpp11.md) covers this properly.

## Recap

1. **Iterators are generalized pointers**: `*it` reads, `++it` advances, comparing to `end()` tells you when to stop. Every container exposes `begin()`/`end()`, and `[begin, end)` is half-open - `end()` is never a valid element to read.
2. **Algorithms only know iterators, never containers.** That's the whole trick: one `std::sort` works on every container whose iterators support what it needs.
3. Reach for `<algorithm>` (`sort`, `find`, `count_if`, `transform`, `accumulate`, `remove`) instead of hand-writing loops - the intent is clearer and the correctness is already proven.
4. The **erase-remove idiom** exists because algorithms can rearrange through iterators but can't resize a container - only the container's own `.erase()` can do that.
5. **Iterator categories** (input, forward, bidirectional, random access) describe what an iterator can do; algorithms like `sort` require random access, which is why it won't compile on `list`.
6. Don't hold iterators across operations that might resize or erase - get them fresh, right before use.

### Check yourself

```quiz
[
  {
    "q": "Why can algorithms like std::find or std::count_if work identically on a vector, a list, and a map, even though those containers store data in totally different ways?",
    "choices": [
      "Because algorithms only ever interact with iterators, never with the container's internal representation",
      "Because every container converts to a vector internally before an algorithm runs",
      "Because the STL keeps a separate compiled algorithm implementation for each container type",
      "Because list and map secretly use the same memory layout as vector"
    ],
    "answer": 0,
    "explain": "Algorithms are written purely in terms of *it, ++it, and it == end() - the iterator interface - so they never need to know or care how a container actually stores its elements underneath."
  },
  {
    "q": "After calling std::remove(v.begin(), v.end(), 1) on a vector, why is the vector's size unchanged even though every 1 seems to have been removed?",
    "choices": [
      "std::remove has no reference to the container, only iterators, so it can shuffle elements around but can't resize anything - erase() is what actually removes them",
      "std::remove is a no-op that only searches without modifying anything",
      "std::remove only removes the first matching element it finds",
      "Vectors can never shrink once elements have been added to them"
    ],
    "answer": 0,
    "explain": "Because algorithms only get iterators, not a reference to the container object, std::remove can only overwrite the unwanted elements and return a new logical end; only the container's own erase() member can actually shrink it."
  },
  {
    "q": "Why does std::sort(lst.begin(), lst.end()) fail to compile on a std::list, when the exact same call works fine on a std::vector?",
    "choices": [
      "std::sort needs random-access iterators to jump around efficiently, and list's iterators are only bidirectional - they can only step one node at a time",
      "std::list elements can't be compared with <",
      "std::sort only accepts containers directly, not iterator ranges",
      "list typically holds more elements than vector, so it would be too slow"
    ],
    "answer": 0,
    "explain": "list's iterator category is bidirectional (++ and --), not random access (+n); std::sort assumes it can jump to any position in O(1), so use list's own .sort() member instead, which works with pointer relinking."
  }
]
```

---

[← Phase 11: The STL: Containers](11-the-stl-containers.md) · [Phase 13: Smart Pointers & Modern Memory Management →](13-smart-pointers-and-modern-memory-management.md)
