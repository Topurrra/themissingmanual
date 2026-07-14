---
title: "Classes & Objects"
guide: "cpp-from-zero"
phase: 6
summary: "A class bundles data with the functions that operate on it into one type you control - this phase builds the mental model of objects, member functions, and access control that everything else in C++ is built on."
tags: [cpp, classes, objects, encapsulation, member-functions, access-control, this-pointer]
difficulty: intermediate
synonyms: ["c++ class vs struct", "what is a class in c++", "c++ member functions explained", "c++ public private protected", "c++ this pointer", "how do classes work in c++", "c++ encapsulation", "c++ object oriented basics"]
updated: 2026-07-14
---
# Classes & Objects

Phase 2 showed you what changed going from C to C++: references, `bool`, better strings, `new`/`delete`.
Those were surface changes. This phase is the real one. **The class is the thing C++ is actually built
around.** Once you can write and reason about classes, phases 7 through 14 - RAII, copying, operators,
templates, the STL, smart pointers, inheritance - are all just answers to questions that classes raise.
Get the mental model right here and the rest of the language stops feeling like a pile of features and
starts feeling like one coherent idea, worked out in different directions.

## What a class actually is

**What it actually is.** A class is a blueprint for a type you design yourself. It bundles two things that
C keeps apart: the *data* that describes something, and the *functions* that are allowed to act on that
data. An `int` is a type the language gives you. A class is a type *you* give the language.

If you've read [C From Zero: Structs & Typedef](/guides/c-from-zero/07-structs-and-typedef), you already
know half of this. A C `struct` groups data:

```c
struct Account {
    double balance;
};
```

But in C, nothing ties `deposit(&acc, 50.0)` to that struct. It's just a function that happens to take an
`Account*` - nothing stops you from calling it on the wrong struct, forgetting to call it at all, or
poking `acc.balance` directly from anywhere in the program. The struct doesn't *own* its behavior.

A C++ class fixes that by putting the functions **inside** the type, and letting the type say which parts
of itself the outside world is even allowed to touch:

```cpp
class Account {
public:
    void deposit(double amount) {
        balance += amount;
    }
    double getBalance() const {
        return balance;
    }
private:
    double balance = 0.0;
};
```

```cpp
#include <iostream>

int main() {
    Account acc;
    acc.deposit(50.0);
    acc.deposit(25.0);
    std::cout << acc.getBalance() << "\n";   // 75
}
```
```console
$ g++ -std=c++17 account.cpp -o account && ./account
75
```
*What just happened:* `acc` is an **object** - a concrete instance of the `Account` class, with its own
`balance`. `deposit` and `getBalance` are **member functions**: functions that live inside the class and
act on one particular object's data. Calling `acc.deposit(50.0)` runs `deposit` with `acc`'s data in
scope. There is no way to reach into `acc` and set `balance` directly from `main` - the class itself
forbids it. That's the whole idea, stated in one example.

## Classes vs. structs: one real difference

C++ kept the `struct` keyword and quietly turned it into a class in disguise. In C++, `struct` and `class`
are **the same feature**, separated by a single default: `struct` defaults to `public`, `class` defaults
to `private`. That one default shows up in two places - member access, and (later, when you get to
inheritance in phase 14) which base classes a derived type inherits:

| | `struct` | `class` |
|---|---|---|
| Default member access | `public` | `private` |
| Default inheritance access | `public` | `private` |
| Everything else | identical | identical |

```cpp
struct Point { double x, y; };   // x and y are public by default

class Point2 { double x, y; };   // x and y are private by default
```

📝 **Terminology.** *Member* means "something declared inside the class" - a **data member** (a variable)
or a **member function** (a function, sometimes called a *method* in other languages, though C++ mostly
just says "member function").

Convention, not the compiler, decides which keyword you reach for: use `struct` for a type that's really
just a passive bundle of public data (a `Point`, a `Color`, a config block), and `class` for a type with
invariants to protect and behavior to hide. Nothing stops you from writing `struct` with private members
and member functions - it works identically - but doing so surprises every C++ programmer who reads it.
Match the keyword to the intent.

## Access control: why "private" is a feature, not a restriction

**Why this exists.** `balance` is `private` in the first example on purpose. Imagine `Account` also
tracked a transaction count that must always match the number of deposits. If any code anywhere could
write `acc.balance = -500;` directly, nothing could guarantee that invariant held. By making `balance`
private and forcing every change through `deposit` (and, later, a `withdraw` you'd write the same way),
the class becomes the *only* code that can break its own rules - and you only have to check `deposit` and
`withdraw` for bugs, not every line in the program that ever touched an `Account`.

This is **encapsulation**: hiding the data, exposing a small, deliberate set of operations on it. It's the
same instinct as a library's `.h` file only declaring the functions callers need (phase 8 revisits this
for headers) - except now the hiding happens *per object*, enforced by the compiler, not by convention.

There are three access levels:

```cpp
class Widget {
public:
    // callable from anywhere - the class's public interface
protected:
    // callable from this class and classes derived from it (phase 14)
private:
    // callable only from inside this class's own member functions
};
```

💡 **Key point.** Access control is checked at compile time, per *class*, not per *object*. One
`Account`'s member function can freely read another `Account`'s private `balance`, because both are
instances of the same class. Privacy in C++ means "hidden from outside code," not "hidden from other
objects of the same type."

## `this`: how a member function knows which object it's operating on

**What it actually is.** Every non-static member function secretly receives a pointer to the object it
was called on, named `this`. When `deposit` writes `balance += amount;`, it's really shorthand for
`this->balance += amount;`. You rarely need to write `this` explicitly, but two situations call for it:

```cpp
class Account {
public:
    void setBalance(double balance) {
        this->balance = balance;   // parameter shadows the member; this-> disambiguates
    }
    Account& deposit(double amount) {
        this->balance += amount;
        return *this;              // return the object itself, to allow chaining
    }
private:
    double balance = 0.0;
};
```

```cpp
Account acc;
acc.deposit(10).deposit(20).deposit(30);   // chained: each call returns *this
```

*What just happened:* `setBalance`'s parameter is also named `balance`, so plain `balance = balance;`
would just assign the parameter to itself. `this->balance` reaches past the parameter to the member.
Separately, `deposit` returns `*this` (dereferencing the pointer to get the object back by reference), so
the caller can chain calls: each `.deposit(...)` runs, hands the same object back, and the next call runs
on it immediately.

⚠️ **The naming trap.** New C++ programmers often avoid the parameter-shadows-member collision by giving
members ugly names like `m_balance` or `balance_`. Either style is fine and common in real codebases - the
point isn't which convention you pick, it's that you pick one on purpose rather than fighting `this`
every time a parameter and a member want the same name.

## Defining member functions outside the class

Writing every function body inside the class works, but for anything longer than a line or two, C++
programmers usually **declare** the function in the class and **define** it below using the scope
resolution operator `::`, which reads as "belongs to":

```cpp
class Account {
public:
    void deposit(double amount);      // declaration only
    double getBalance() const;
private:
    double balance = 0.0;
};

void Account::deposit(double amount) {   // "deposit, which belongs to Account"
    balance += amount;
}

double Account::getBalance() const {
    return balance;
}
```

This is the same declaration/definition split you already know from ordinary functions (phase 4) and from
C header files - it just needs `Account::` to say which class's `deposit` this is. Real projects put the
class declaration in a `.h` file and these definitions in a matching `.cpp` file, exactly like phase 8
will formalize for headers in general.

🪖 **War story.** A common first mistake is marking a read-only member function like `getBalance` without
`const`, then being unable to call it on a `const Account&` parameter later - the compiler simply refuses,
because a non-`const` member function is allowed to modify the object, and a `const` object can't be
handed to anything that might modify it. The fix in the example above, `double getBalance() const;`, tells
the compiler "I promise not to touch this object's data" - and unlocks calling it wherever the object is
`const`. Get in the habit of marking every member function `const` unless it genuinely needs to change
something; it costs nothing and the compiler starts catching bugs for you.

## Objects have a lifecycle you don't fully control yet

You may have noticed `Account acc;` created a working object with `balance` already at `0.0`, with no
explicit setup call. Something initialized it - and something will eventually clean it up when `acc` goes
out of scope. That "something" is a **constructor** and a **destructor**, and they are the single most
important idea in C++'s object model: the language guarantees code runs automatically when an object is
born and when it dies. That guarantee is called **RAII**, and it's the subject of the next phase - so
consider everything in this phase the stage-setting for the real payoff.

## Recap

1. **A class bundles data with the functions allowed to touch it** - unlike a C `struct`, the behavior is
   part of the type, not a loose function that happens to take a pointer to it.
2. **`struct` and `class` are the same mechanism**; the only difference is the default access level
   (`public` vs `private`). Use `struct` for plain data, `class` for anything with invariants to protect.
3. **Access control (`public`/`protected`/`private`) enforces encapsulation** - the class decides what
   outside code can touch, so it can guarantee its own rules stay true.
4. **`this`** is the hidden pointer every member function gets to the object it was called on; use
   `this->` to resolve a name collision, and return `*this` to enable chaining.
5. **Member functions can be declared in the class and defined outside it** with `Class::function`, the
   same declaration/definition split as ordinary functions.
6. **`const` on a member function** promises it won't modify the object - mark read-only member functions
   `const` by default.
7. Objects already have data ready the moment they exist, and clean up automatically when they leave
   scope. *Why* is the next phase's entire subject: constructors, destructors, and RAII.

## Quick check

Test yourself on the ideas that matter most this phase - what actually separates `class` from `struct`, and how access control works:

```quiz
[
  {
    "q": "What is the real difference between `struct` and `class` in C++?",
    "choices": [
      "`struct` defaults to `public`, `class` defaults to `private` - the same flip governs both member access and default inheritance access",
      "`struct` cannot have member functions, only `class` can",
      "`struct` has more runtime overhead than `class`",
      "`class` supports inheritance, `struct` does not"
    ],
    "answer": 0,
    "explain": "struct and class are the same mechanism; the only thing that differs is the public-vs-private default, which applies both to members and to how base classes are inherited. Both can have member functions, access control, and inheritance."
  },
  {
    "q": "One `Account` object's member function tries to read another `Account` object's private `balance`. Is this legal?",
    "choices": [
      "Yes - access control is checked per class, not per object, so any Account's member function can read another Account's private data",
      "No - private members are only visible to the exact object that owns them",
      "Only if the two objects were created in the same function",
      "Only if `balance` is marked `friend`"
    ],
    "answer": 0,
    "explain": "Access control is enforced at compile time per class: private hides data from outside code, not from other instances of the same class."
  },
  {
    "q": "In `void setBalance(double balance) { balance = balance; }`, the member never actually changes. Why, and what fixes it?",
    "choices": [
      "The parameter `balance` shadows the member `balance`; writing `this->balance = balance;` reaches past the parameter to the member",
      "C++ requires `self` instead of `this` for member access",
      "A parameter can never share a name with a member - one of them must be renamed",
      "It works correctly as written; the member is updated"
    ],
    "answer": 0,
    "explain": "Inside the function body, the parameter's name hides the member's name; this-> explicitly targets the object's own data instead of the parameter."
  }
]
```

---

[← Phase 5: References vs Pointers](05-references-vs-pointers.md) · [Phase 7: Constructors, Destructors & RAII →](07-constructors-destructors-and-raii.md)
