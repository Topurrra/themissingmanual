---
title: "Error Handling: Exceptions and Alternatives"
guide: "cpp-from-zero"
phase: 15
summary: "How does C++ report and recover from failure - and when should you reach for an exception versus a return value that might not be there?"
tags: [cpp, exceptions, error-handling, raii, noexcept, std-optional, std-expected]
difficulty: advanced
synonyms: ["c++ exceptions tutorial", "try catch c++", "c++ error handling best practices", "std::optional vs exceptions", "std::expected c++23", "noexcept c++ explained", "c++ exception safety guarantees", "when to use exceptions in c++", "c++ raii and exceptions", "custom exception class c++", "c++ error codes vs exceptions"]
updated: 2026-07-14
---
# Error Handling: Exceptions and Alternatives

C has one tool for reporting failure: return a special value (`-1`, `NULL`, a nonzero code) and hope the caller checks it. Nothing stops you from ignoring the check, and nothing carries the failure automatically through ten layers of function calls. C++ adds a second tool - **exceptions** - built specifically to solve that "carry the failure up automatically" problem, and it works hand in hand with the RAII you learned in Phase 7. Modern C++ then adds a third option, value types that *represent* failure (`std::optional`, `std::expected`), for the cases where exceptions are the wrong tool. This phase is about knowing which one to reach for, and why exceptions and RAII are really the same idea seen from two angles.

## The mental model: two totally different failure paths

**What it actually is.** An exception is a value you `throw` instead of `return`. Throwing doesn't return to your caller normally - it unwinds the call stack, skipping the rest of every function in between, until it finds a `catch` block that wants to handle that type of value. Nothing in between gets to ignore it. That's the entire idea: a way to report "this failed" that *cannot* be silently dropped the way a C return code can.

An error-as-value alternative (`std::optional<T>`, `std::expected<T, E>`, or a plain error code) is the opposite philosophy: failure is just data, returned normally, and the caller has to look at it to get the result at all. Nothing unwinds. Nothing is automatic. But nothing is "invisible control flow" either - you can read top to bottom and see exactly where a function might not give you what you asked for.

Neither one is "the C++ way." Both are. Picking between them is a real design decision, and by the end of this phase you'll have a rule of thumb for making it.

## Throwing and catching

```cpp
#include <iostream>
#include <stdexcept>

double divide(double a, double b) {
    if (b == 0.0) {
        throw std::invalid_argument("divide by zero");
    }
    return a / b;
}

int main() {
    try {
        std::cout << divide(10, 2) << "\n";
        std::cout << divide(1, 0) << "\n";   // throws
        std::cout << "never reached\n";
    } catch (const std::invalid_argument& e) {
        std::cout << "caught: " << e.what() << "\n";
    }
}
```

```
5
caught: divide by zero
```

Walk through what happened: the second `divide(1, 0)` call threw. The line after it, `"never reached"`, was skipped entirely - control jumped straight to the matching `catch`. That skip is the whole point. In C, the equivalent bug (forgetting to check a return code) just keeps executing with garbage data. In C++, an uncaught error *cannot* be silently stepped over.

Catch by `const&`, always. Catching by value copies the exception (usually harmless but wasteful); catching by non-const reference invites you to mutate an object nobody else will see anyway. `const&` is the idiom, full stop.

`std::invalid_argument` comes from `<stdexcept>`, which gives you a small hierarchy rooted at `std::exception` (`std::logic_error`, `std::runtime_error`, and their children). Prefer throwing one of these, or deriving your own from `std::exception`, over throwing a raw `int` or `const char*` - a caller who writes `catch (const std::exception& e)` should be able to catch *anything* your code throws and still call `.what()` on it.

```cpp
class ParseError : public std::runtime_error {
public:
    explicit ParseError(const std::string& msg) : std::runtime_error(msg) {}
};

// caller code, anywhere up the call stack:
try {
    parseConfig(path);
} catch (const std::exception& e) {   // catches ParseError too - it's a std::exception
    std::cerr << "config failed: " << e.what() << "\n";
}
```

## Why exceptions and RAII are the same idea

Here's the connection Phase 7 was setting up. Stack unwinding doesn't just jump to the `catch` block and leave a mess behind - as the stack unwinds, C++ calls the **destructor** of every local object that was fully constructed on the way, in reverse order, exactly as if the function had returned normally. That guarantee is the entire reason RAII exists.

```cpp
void process(const std::string& path) {
    std::lock_guard<std::mutex> lock(mtx);   // acquires the mutex
    std::ifstream file(path);                // opens the file
    parseOrThrow(file);                      // throws on bad input
    // ... more work
}                                             // normal exit: lock and file destructed here
```

If `parseOrThrow` throws, `process` never reaches its closing `}` the normal way - but the mutex still unlocks and the file still closes, because unwinding runs `lock`'s and `file`'s destructors on the way out, same as it would on a clean return. If you'd managed the mutex with a manual `mtx.lock()` / `mtx.unlock()` pair instead, the throw would skip the `unlock()` and the mutex would stay locked forever. **RAII is what makes exceptions safe to use.** Without it, every function with a resource would need a `catch`, clean up, `rethrow` just to avoid leaking - which is exactly the boilerplate RAII was invented to delete.

This is also why a destructor must never let an exception escape it. If a destructor throws while the stack is *already* unwinding from a different exception, the program calls `std::terminate` and dies on the spot - there's no sensible way to have two exceptions in flight at once. Destructors are implicitly `noexcept`; keep them that way.

## Exception safety: pick a guarantee

When you write a function that might throw partway through, ask what state it leaves things in if it does. Three levels, from weakest to strongest:

| Guarantee | Meaning |
|---|---|
| **Basic** | Nothing leaks, invariants hold, but the object's exact value after the throw is unspecified. |
| **Strong** | If it throws, the object is unchanged - as if the call never happened (commonly done by building the new state off to the side, then swapping it in only once nothing can fail). |
| **No-throw (`noexcept`)** | The function is guaranteed not to throw at all. |

Most STL operations offer at least the basic guarantee; things like `vector::push_back` offer the strong one. Aim for basic everywhere by default (RAII gets you most of this for free) and reach for strong only where a partial failure would actually be confusing to recover from.

## `noexcept`

```cpp
void swap(Widget& a, Widget& b) noexcept {
    // a move-based swap that truly cannot throw
}
```

`noexcept` is a promise to the compiler and to callers: this function will not throw. It matters for two reasons. First, it documents intent - callers can rely on it. Second, it changes generated code: move constructors and move assignment marked `noexcept` let containers like `std::vector` move elements during a resize instead of copying them (a non-`noexcept` move is considered unsafe to use there, since a throw mid-resize would leave the vector in a broken state). If a `noexcept` function throws anyway, the program calls `std::terminate` immediately - so only mark it when you mean it.

## When exceptions are the wrong tool

Exceptions cost you in a few specific ways worth knowing before you reach for them everywhere:

- **The throwing path is slow.** Stack unwinding, RTTI lookups, and constructing the exception object all cost real time - fine for something rare, bad for something that happens on every user keystroke.
- **Some environments ban them.** Embedded firmware, some game engines, and codebases compiled with `-fno-exceptions` don't have them at all. A library that throws is unusable there.
- **They're invisible in a function signature.** `int parse(const char*)` gives you no clue whether it might throw. A caller has to read the implementation, or trust documentation, to know.

For failures that are a *normal, expected* part of calling the function - "the key might not be in the map," "the input might not parse," "the file might not exist" - a value that carries the outcome is usually the better fit:

```cpp
#include <optional>

std::optional<int> parseInt(const std::string& s) {
    try {
        size_t pos;
        int value = std::stoi(s, &pos);   // pos = how many chars were consumed
        if (pos != s.size()) return std::nullopt;   // trailing junk, e.g. "12abc"
        return value;
    } catch (...) {
        return std::nullopt;   // no value - not an error we need details about
    }
}

if (auto n = parseInt(input)) {
    std::cout << "parsed: " << *n << "\n";
} else {
    std::cout << "not a number\n";
}
```

`std::optional<T>` says "there might not be a value" - no error message, just present-or-absent. When you *do* need to say why it failed, C++23's `std::expected<T, E>` carries either a value or an error object, checked explicitly instead of thrown:

```cpp
#include <expected>

std::expected<int, std::string> parseInt(const std::string& s) {
    try {
        size_t pos;
        int value = std::stoi(s, &pos);
        if (pos != s.size()) return std::unexpected("trailing characters after integer: " + s);
        return value;
    } catch (...) {
        return std::unexpected("not a valid integer: " + s);
    }
}

auto result = parseInt(input);
if (result) {
    std::cout << "parsed: " << *result << "\n";
} else {
    std::cout << "error: " << result.error() << "\n";
}
```

This is the same idea C encodes with a return code and an `errno` you have to remember to check (see c-from-zero's error-handling phase if you want the C-side version) - except `std::expected` makes the "might have failed" part of the type itself, so the compiler forces you to unwrap it rather than trusting you to remember.

## A working rule of thumb

Reach for **exceptions** when the failure is rare, when it needs to propagate through many layers that have nothing useful to do about it themselves (only the top-level caller can decide), and when performance on the failure path doesn't matter. Reach for **`optional`/`expected`/error codes** when failure is a routine, expected outcome (parsing, lookups, validation), when you're in performance-sensitive or no-exceptions code, or when you want the possibility of failure spelled out in the function's own signature. Many real codebases use both: exceptions for "something is fundamentally broken," value types for "this specific operation might not succeed" - and RAII underneath both, quietly guaranteeing that whichever one fires, nothing leaks.

### Check yourself

```quiz
[
  {
    "q": "A function throws partway through, a caller three levels up catches it, and the intermediate functions in between never wrote a try/catch of their own. What happens to those intermediate functions' local variables?",
    "choices": ["They keep their last values, since nothing explicitly cleaned them up", "Their destructors still run, in reverse order, as the stack unwinds", "The program skips destructors to unwind faster, then calls std::terminate"],
    "answer": 1,
    "explain": "Stack unwinding runs the destructor of every fully-constructed local object on the way up, which is exactly what makes RAII safe to combine with exceptions."
  },
  {
    "q": "A lock is managed with a manual mtx.lock() / mtx.unlock() pair instead of std::lock_guard, and the code between them throws. What happens to the mutex?",
    "choices": ["It unlocks automatically during unwinding, same as with lock_guard", "It stays locked forever, because the throw skips the unlock() call", "The throw is blocked from happening while the mutex is held"],
    "answer": 1,
    "explain": "Only RAII objects get their destructors run during unwinding - a manual unlock() call sitting after the throwing code is just skipped."
  },
  {
    "q": "You're writing a function to look up a key that's often missing - a completely normal, expected outcome for the caller. What's the better fit?",
    "choices": ["Throw a custom exception so the caller can't forget to handle the missing case", "Return std::optional<T>, since 'no value' isn't really an error", "Mark the function noexcept and return a null pointer on failure"],
    "answer": 1,
    "explain": "Exceptions are for rare, exceptional failures; a routine 'might not be there' outcome reads better and costs less as a value the caller checks."
  }
]
```

---

[Phase 16: Modern C++ - auto, Lambdas, Ranges & What Changed Since C++11 →](16-modern-c-auto-lambdas-ranges-and-what-changed-si.md)
