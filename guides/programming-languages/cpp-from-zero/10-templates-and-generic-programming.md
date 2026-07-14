---
title: "Templates & Generic Programming"
guide: "cpp-from-zero"
phase: 10
summary: "How do you write max() or a Vector once and have it work for int, double, and your own types, without copy-pasting the function for each one? C++ answers with templates - code that the compiler writes for you, per type, at compile time."
tags: [cpp, templates, generics, function-templates, class-templates, template-specialization, compile-time]
difficulty: advanced
synonyms: ["c++ templates explained", "how do c++ templates work", "template function c++", "class template c++", "generic programming c++", "c++ template specialization", "typename vs class c++", "c++ templates vs generics", "compile time polymorphism c++", "template instantiation c++"]
updated: 2026-07-14
---
# Templates & Generic Programming

Go back to [Phase 8: Copy, Move & the Rule of Five](08-copy-move-and-rule-of-five.md) and [Phase 9: Operator Overloading](09-operator-overloading.md) for a second and picture what you've built so far: a `Matrix` class, say, that overloads `+`, has proper copy and move constructors, and cleans up after itself with RAII. It's solid. But it only works for `Matrix<double>`. What if someone needs a matrix of `int`, or `float`, or a custom fraction type? Do you copy-paste the whole class and change one word?

That's the problem templates exist to solve, and it's the last big piece of the puzzle before you're fluent in modern C++. Once you have templates, the STL (next two phases) stops being a black box of container types you memorize and becomes something you understand from the inside, because the STL *is* templates, top to bottom.

## The mental model: templates are a blueprint, not a function

Here's the idea that makes everything else click: **a template is not code. It's a recipe for generating code.** When you write a function template, nothing compiles yet - there's no machine code sitting in your binary for it. The compiler waits until it sees you actually *use* the template with a specific type, and only then does it generate a real, concrete function for that type. This is called **instantiation**.

Compare that to what you might expect from other languages. In Python, a function just works with whatever type you throw at it, checked at runtime. In Java, generics are largely a compile-time-only illusion (type erasure) - the bytecode doesn't know or care what `T` was. C++ templates are neither of those. They generate a **real, fully-typed, separately-optimized function or class for every distinct type you instantiate with.** Call `max(3, 5)` and `max(3.0, 5.0)` in the same program, and the compiler produces two completely separate functions under the hood, each one just as fast as if you'd hand-written it for that exact type. This is why templates are sometimes called "compile-time polymorphism" or "zero-cost generics" - you get the flexibility of generic code with none of the runtime overhead of, say, virtual dispatch (which you'll meet properly in [Phase 14: Inheritance & Polymorphism](14-inheritance-and-polymorphism.md)).

The tradeoff is real too: more instantiations means more generated code (longer compile times, bigger binaries in some cases), and template error messages have a well-earned reputation for being long and intimidating - though modern compilers (and C++20 concepts, which constrain templates to give clearer errors) have gotten much better about this.

## Function templates

Let's build the thing that motivates all of this: a `max` function that works for any comparable type.

```cpp
#include <iostream>

template <typename T>
T my_max(T a, T b) {
    return (a > b) ? a : b;
}

int main() {
    std::cout << my_max(3, 7) << "\n";        // T deduced as int
    std::cout << my_max(2.5, 1.1) << "\n";     // T deduced as double
    std::cout << my_max('a', 'z') << "\n";     // T deduced as char
}
```

```console
7
2.5
z
```

Read `template <typename T>` as "for some type `T`, which I'll figure out or you'll tell me." `T` is a placeholder - a **template parameter** - that stands in for a real type. You could write `template <class T>` instead of `typename T`; they mean exactly the same thing here, it's purely historical (`typename` came later, and most style guides now prefer it for clarity). When you call `my_max(3, 7)`, the compiler looks at the argument types, deduces `T = int`, and generates a version of `my_max` where every `T` is replaced with `int`. Call it again with doubles, and it generates a second, entirely separate version with `T = double`. Neither version pays any price for the other existing.

**When deduction fails or you want to be explicit,** you can spell out `T` yourself:

```cpp
my_max<double>(3, 7.5);   // force T = double, converting 3 to 3.0
```

## Class templates

The same idea applies to whole classes - this is how you'd finally write that `Matrix<T>` or a generic `Box<T>` that holds one value of any type.

```cpp
template <typename T>
class Box {
public:
    explicit Box(T value) : value_(value) {}

    T get() const { return value_; }
    void set(T value) { value_ = value; }

private:
    T value_;
};

int main() {
    Box<int> b1(42);
    Box<std::string> b2("hello");

    std::cout << b1.get() << " " << b2.get() << "\n";
}
```

```console
42 hello
```

`Box<int>` and `Box<std::string>` are, to the compiler, two completely unrelated classes - as unrelated as if you'd written `BoxInt` and `BoxString` by hand. The template just saved you from writing them by hand. Notice you write out member functions the same way you always have; the only new syntax is the `template <typename T>` header above the class, and then `T` is just an ordinary type name everywhere inside it.

You've actually already used a class template without necessarily naming it that: `std::vector<int>` *is* `vector` instantiated with `T = int`. `std::vector` itself, uninstantiated, isn't a type at all - it's a template. `std::vector<int>` and `std::vector<double>` are two different, unrelated types that happen to share source code.

## Multiple template parameters

Templates aren't limited to one placeholder type. A `Pair` that holds two possibly-different types needs two:

```cpp
template <typename T1, typename T2>
class Pair {
public:
    Pair(T1 first, T2 second) : first_(first), second_(second) {}

    T1 first() const { return first_; }
    T2 second() const { return second_; }

private:
    T1 first_;
    T2 second_;
};

int main() {
    Pair<std::string, int> age("Alice", 30);
    std::cout << age.first() << " is " << age.second() << "\n";
}
```

This is, essentially, `std::pair` - the standard library ships its own version of exactly this, because the pattern is so common.

## Non-type template parameters

Template parameters don't have to be types - they can be compile-time *values* too, most commonly used for fixed-size arrays:

```cpp
template <typename T, int N>
class FixedArray {
public:
    T& operator[](int i) { return data_[i]; }
    int size() const { return N; }

private:
    T data_[N];
};

int main() {
    FixedArray<double, 5> scores;   // N = 5 baked in at compile time
    scores[0] = 9.5;
    std::cout << scores.size() << "\n";   // 5
}
```

Here `N` is a value, not a type, fixed at compile time for each instantiation - `FixedArray<double, 5>` and `FixedArray<double, 10>` are different types with different-sized internal arrays, and no heap allocation is needed because the compiler knows the exact size at compile time. `std::array<T, N>`, which you'll meet in the next phase, is built exactly this way.

## Template specialization: an escape hatch for special cases

Sometimes the generic version of a template is wrong, or just inefficient, for one particular type. **Specialization** lets you say "for this specific type, use this different implementation instead."

```cpp
template <typename T>
void print_type(T value) {
    std::cout << "generic value: " << value << "\n";
}

// full specialization for bool
template <>
void print_type<bool>(bool value) {
    std::cout << "boolean: " << (value ? "true" : "false") << "\n";
}

int main() {
    print_type(42);     // generic value: 42
    print_type(true);   // boolean: true
}
```

`template <>` with no parameters, followed by `<bool>` after the function name, says "this isn't a new template - it's a hand-written override for exactly `T = bool`." The compiler prefers the specialization whenever the type matches, and falls back to the generic version otherwise. You won't reach for this often as a beginner, but it's worth recognizing when you see it in library code, because it explains why, say, `std::vector<bool>` behaves so strangely compared to every other `std::vector<T>` - it's a specialization with a totally different internal representation (packed bits instead of real `bool`s).

## Templates vs. overloading vs. `void*`

If you came from C, you might reach for `void*` to write "generic" code - a function that takes any pointer, casts it internally, and hopes for the best. Templates replace that whole pattern and do it *safely*: no casting, no losing type information, and the compiler catches type errors at the call site instead of you finding out at 2am that you passed the wrong struct. If you came from a language with function overloading, templates are what you reach for when you'd otherwise have to write the *same body* for every overload - overloading is for genuinely different logic per type; templates are for identical logic, different type.

## What error messages look like (and how to read them)

Template errors can be long because the compiler is often reporting the error at the point of *instantiation*, several layers deep. The trick is to read from the bottom or top consistently (compilers differ) and look for the *first* concrete type mismatch - the rest is usually the compiler explaining how it got there.

```cpp
template <typename T>
T add(T a, T b) { return a + b; }

struct Point { int x, y; };

int main() {
    Point p1{1, 2}, p2{3, 4};
    add(p1, p2);   // Point has no operator+
}
```

```console
error: invalid operands to binary expression ('Point' and 'Point')
    return a + b;
             ^ ~
note: in instantiation of function template specialization 'add<Point>' requested here
    add(p1, p2);
    ^
```

Read it the same way you learned to read borrow-checker errors if you've seen Rust, or ordinary compile errors elsewhere: the real problem (`Point` has no `+`) is stated plainly, and the "in instantiation of" note is just the compiler showing its work - which specific instantiation triggered the failure. Once you know to look for that pattern, template errors stop being scary walls of text.

## Recap

1. A template is not code - it's a **blueprint**. The compiler generates a real, concrete function or class only when you **instantiate** it with an actual type, and each instantiation is fully independent, fully optimized code.
2. `template <typename T>` (or `class T`, identical meaning) declares a placeholder type; the compiler usually **deduces** it from your arguments, or you can specify it explicitly with `func<Type>(...)`.
3. **Class templates** work the same way - `std::vector<int>` is nothing more than `vector` instantiated with `T = int`, and it's an unrelated type to `std::vector<double>`.
4. **Non-type template parameters** (like `int N`) let a compile-time value, not just a type, shape the generated code - the basis for `std::array<T, N>`.
5. **Specialization** (`template <>`) lets you override the generic implementation for one specific type when the general version is wrong or slow for it.
6. This is compile-time, zero-runtime-cost generic code - the mechanism the entire STL is built on, which is exactly where you're headed next.

## Quick check

Test yourself on the idea that makes everything else in this phase click - that a template generates real, separate code per type, at compile time:

```quiz
[
  {
    "q": "When you call `my_max(3, 7)` and `my_max(2.5, 1.1)` in the same program, what does the compiler actually produce?",
    "choices": [
      "One generic function that branches on the argument type at runtime",
      "Two completely separate, fully-typed functions - one for `int`, one for `double` - generated at compile time",
      "A single function using `void*` internally, cast back to the right type on each call",
      "Nothing extra - templates are erased before compilation, like Java generics"
    ],
    "answer": 1,
    "explain": "Each distinct type you instantiate a template with gets its own real, separately-compiled function or class - this is why templates carry zero runtime overhead, unlike a branch-on-type function or Java's type erasure."
  },
  {
    "q": "`std::vector<int>` and `std::vector<double>` - what's the relationship between them, according to the compiler?",
    "choices": [
      "They're the same type, just displayed differently",
      "`std::vector<double>` inherits from `std::vector<int>`",
      "They are two completely unrelated types that happen to share the same source code",
      "They share one underlying implementation chosen at runtime"
    ],
    "answer": 2,
    "explain": "A class template isn't a type by itself - `std::vector` only becomes a real type once instantiated with a `T`, and each instantiation is as unrelated to the others as if you'd hand-written separate classes."
  },
  {
    "q": "You write a full specialization `template <> void print_type<bool>(bool value) { ... }` alongside the generic `print_type<T>`. What happens when you call `print_type(true)`?",
    "choices": [
      "A compile error, since you can't have two versions of the same function",
      "The generic version always wins, since it was defined first",
      "The compiler picks the `bool` specialization instead of instantiating the generic version",
      "Both versions run, generic first, then the specialization"
    ],
    "answer": 2,
    "explain": "Specialization is an escape hatch: the compiler prefers a matching specialization over generating a new instantiation from the generic template, which is exactly how `std::vector<bool>`'s odd packed-bit behavior comes about."
  }
]
```

---

[← Phase 9: Operator Overloading](09-operator-overloading.md) · [Phase 11: The STL - Containers →](11-the-stl-containers.md)
