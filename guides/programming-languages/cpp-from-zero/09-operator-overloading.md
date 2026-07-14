---
title: "Operator Overloading"
guide: "cpp-from-zero"
phase: 9
summary: "How do you make + and == and << work on your own classes the same way they work on int and double, and where's the line between convenience and confusing your reader?"
tags: [cpp, operators, operator-overloading, classes, operator-plus, operator-equals, stream-operators]
difficulty: intermediate
synonyms: ["c++ operator overloading", "how to overload operators in c++", "overload == in c++", "c++ overload + operator for a class", "c++ overload << operator for printing", "friend function operator overloading", "when should you overload operators in c++", "c++ operator overloading rules", "member vs non-member operator overload"]
updated: 2026-07-14
---
# Operator Overloading

Here's a question that sounds like a trick but isn't: why is `1 + 2` valid C++, but `p1 + p2` for two `Point` objects a compile error, unless *you* do something about it? `+` isn't magic. It's just a function with unusually short, symbolic syntax. `int::operator+` (conceptually) is built into the language for the built-in types. For your own types, nothing calls it unless you write it.

**Operator overloading is defining a function that runs when someone writes an operator symbol against your type.** That's the whole idea. `a + b` on a class you wrote is sugar for a function call - either `a.operator+(b)` or `operator+(a, b)`, depending on how you defined it. The compiler sees `+` between two `Point`s, looks for an `operator+` that accepts those types, and calls it, exactly like it would resolve any other overloaded function name (phase 4). You're not changing what `+` *means* to the language. You're teaching it what `+` means *for your type*.

This phase assumes you're comfortable with classes (phase 6) and constructors/destructors (phase 7). We won't re-cover `operator=` here - assignment is part of the Rule of Five from phase 8, and it deserves that phase's full attention to copies, moves, and self-assignment. This phase is about the *other* operators: arithmetic, comparison, indexing, and the one you've been using since phase 1 without knowing it was overloaded - `<<` on `std::cout`.

## Member vs. free function: who's on the left?

An operator function can be written two ways, and the choice isn't stylistic - it's forced by *which side of the operator your type is on*.

**As a member function**, the left operand is the implicit `this`:

```cpp
struct Point {
    double x, y;
    Point operator+(const Point& other) const {
        return Point{x + other.x, y + other.y};
    }
};

Point a{1, 2}, b{3, 4};
Point c = a + b;   // calls a.operator+(b)
```

This works because `a`, the left operand, is a `Point` - it has the member to call.

**As a free (non-member) function**, neither operand needs to be `this`:

```cpp
Point operator+(const Point& lhs, const Point& rhs) {
    return Point{lhs.x + rhs.x, lhs.y + rhs.y};
}
```

Both versions produce identical behavior for `a + b`. So why would you ever pick the free function? Because sometimes the left operand *isn't your type*, and a member function can't help you there.

## The stream operator: why `<<` has to be free

You've written `std::cout << x` in every example in this guide. `<<` is an operator on `std::ostream`, overloaded to mean "print" instead of its original meaning "bit-shift left" (that's the C legacy showing - `<<` was borrowed, not invented, for streams). When you want `std::cout << myPoint` to work, think about what a member function would require: `operator<<` would need to be a member of `std::ostream`, since the left operand is the stream. You can't add members to a class you don't own. So the stream operator for a custom type is **always a free function**:

```cpp
#include <ostream>

std::ostream& operator<<(std::ostream& os, const Point& p) {
    os << "(" << p.x << ", " << p.y << ")";
    return os;
}

std::cout << a << "\n";   // (1, 2)
```

Two details matter here. First, it takes `std::ostream&` and *returns* `std::ostream&` - that's what makes chaining (`os << a << " and " << b`) work, the same reason `std::cout` itself returns a reference to itself from every `<<`. Second, if `operator<<` needs to read `Point`'s private members, it can't - unless you either expose the data (as we did, with public `x`/`y`) or declare it `friend` inside the class:

```cpp
class Point {
    double x, y;
public:
    Point(double x, double y) : x(x), y(y) {}
    friend std::ostream& operator<<(std::ostream& os, const Point& p);
};

std::ostream& operator<<(std::ostream& os, const Point& p) {
    return os << "(" << p.x << ", " << p.y << ")";   // friend, so private x/y are visible
}
```

`friend` is a narrow, deliberate exception: this one specific free function, and only this one, gets access to `Point`'s private members. It's not a general escape hatch - use it for exactly this pattern (operators and closely-coupled helper functions), not as a way to avoid writing accessors.

## Comparison operators

`operator==` follows the same member-or-free choice as `+`. The natural spelling compares field by field:

```cpp
bool operator==(const Point& lhs, const Point& rhs) {
    return lhs.x == rhs.x && lhs.y == rhs.y;
}
bool operator!=(const Point& lhs, const Point& rhs) {
    return !(lhs == rhs);
}
```

Notice `operator!=` is defined *in terms of* `operator==` rather than repeating the comparison. That's not laziness, it's a correctness habit: if someone later changes what "equal" means for `Point`, there's exactly one place to update, and `!=` stays consistent by construction. (If your compiler targets C++20, the language will synthesize `!=` from `==` automatically - one less function to write - but understanding the manual version is what tells you *why* that shortcut is safe.)

## Indexing with `operator[]`

Container-like types overload `operator[]` to give array syntax. The trick worth knowing here is the **const overload pair**:

```cpp
class IntBox {
    std::vector<int> data;
public:
    int& operator[](std::size_t i) { return data[i]; }
    const int& operator[](std::size_t i) const { return data[i]; }
};
```

The non-const version returns `int&` - a reference you can assign through, so `box[0] = 5;` compiles. The const version returns `const int&` - read-only, called when `box` itself is `const`. The compiler picks whichever overload matches the const-ness of the object you're indexing. Without the const version, a `const IntBox&` parameter couldn't be indexed at all. This pair shows up constantly in real STL-style container code, which is exactly what you're about to look at in phases 11 and 12.

## What not to overload

Operator overloading has one famous cautionary tale: `std::cin >> x` and `std::cout << x` mean "extract" and "insert," borrowed from bit-shift for a purpose that has nothing to do with shifting bits. It works because streams committed to it consistently and everyone learned the convention. That's the bar: **an overloaded operator should do the thing a reader would guess from its symbol**, applied to your type. `+` should combine two things into a bigger thing. `==` should mean "these are equivalent," not "start a network request." If you find yourself overloading `+` to mean "log this and return void," stop and write a named function instead - `point.add(other)` is clearer code than a `+` that lies about what it does.

A few overloads are also just off the table. `&&`, `||`, and `,` can technically be overloaded, but doing so throws away short-circuit evaluation and sequencing guarantees the built-in versions have, which surprises callers in ways that are hard to debug - avoid them. You also can't overload an operator when *both* operands are built-in types (`int + int` can't be redefined), and you can't invent new operator tokens; you're restricted to the fixed set the language already has symbols for.

## Recap

1. Operator overloading is a function call in disguise: `a + b` becomes `a.operator+(b)` or `operator+(a, b)`.
2. Use a **member function** when your type is always the left operand; use a **free function** when it isn't - `operator<<` for printing is the standard example, since the left operand is `std::ostream`, not your class.
3. `friend` grants one specific outside function access to private members - the right tool for stream operators that need to read your class's internals.
4. Define `operator!=` in terms of `operator==` so there's one source of truth for equality.
5. `operator[]` typically comes in a const/non-const pair, returning `T&` or `const T&` to match the caller's access level.
6. Overload only what reads naturally from the symbol. If the operator's meaning isn't obvious at a glance, write a named function instead.

### Check yourself

```quiz
[
  {
    "q": "Why must `operator<<` for printing a custom type be written as a free function, not a member of your class?",
    "choices": [
      "Member operators can't return a value, so chaining wouldn't work",
      "The left operand in `std::cout << myPoint` is `std::ostream`, which you can't add members to",
      "Free functions run faster than member functions in C++",
      "`<<` can only be a member function when overloaded for arithmetic types"
    ],
    "answer": 1,
    "explain": "A member function is invoked through its left operand; since the left operand here is std::ostream, not your class, only a free function can be the one called."
  },
  {
    "q": "Why does the guide define `operator!=` by calling `operator==` and negating it, instead of writing a separate field-by-field comparison?",
    "choices": [
      "Negation is faster at runtime than a second comparison",
      "C++ requires operator!= to be implemented in terms of operator==",
      "If the definition of equality changes later, there's only one place to update, so != stays correct automatically",
      "Only operator== is allowed to access private members"
    ],
    "answer": 2,
    "explain": "Deriving != from == means there's a single source of truth for what 'equal' means, so a later change to == can't leave != out of sync."
  },
  {
    "q": "A function takes `const IntBox&`. What lets it call `box[0]` inside that function?",
    "choices": [
      "A single `operator[]` returning `int&` is enough",
      "A const `operator[]` returning `const int&`, callable on a const object, must exist",
      "Marking `operator[]` as `friend`",
      "Making `operator[]` a template function"
    ],
    "answer": 1,
    "explain": "The compiler picks the overload matching the object's const-ness; without a const version, a const IntBox can't be indexed at all."
  }
]
```

---

[← Phase 8: Copy, Move & the Rule of Five](08-copy-move-and-the-rule-of-five.md) · [Phase 10: Templates & Generic Programming →](10-templates-and-generic-programming.md)
