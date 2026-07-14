---
title: "Idioms & Common Gotchas"
guide: "python-from-zero"
phase: 9
summary: "The Pythonic idioms that make code read like a local wrote it - comprehensions, unpacking, enumerate/zip, truthiness, context managers - plus a cheat-card of the gotchas (mutable defaults, late-binding closures, is vs ==) that bite everyone exactly once."
tags: [python, idioms, pythonic, comprehensions, gotchas, mutable-default, enumerate, zip, gil]
difficulty: intermediate
synonyms: ["pythonic code idioms", "python list comprehension explained", "python enumerate zip", "python mutable default argument bug", "is vs == python", "python late binding closure", "what is the gil"]
updated: 2026-06-19
---

# Idioms & Common Gotchas

There's a point where Python stops feeling like "a language I'm translating my old habits into" and
starts feeling like its own thing - when you learn the **idioms**, patterns Python programmers reach for
so often that code *not* using them looks faintly foreign.

This phase has two halves: the idioms worth adopting on purpose, then a cheat-card of gotchas - small,
surprising behaviors that bite nearly every Python programmer exactly once. Read them *before* they bite
you; that's the point of having them in one place.

## The idioms worth adopting

### Comprehensions - build a list (or dict) in one expression

**What it actually is.** A **comprehension** builds a new collection by describing it, instead of
starting empty and appending in a loop - close to how you'd say it out loud.

```python runnable
nums = [1, 2, 3, 4, 5]

# the long way
squares = []
for n in nums:
    squares.append(n * n)

# the idiom
squares = [n * n for n in nums]

# with a filter
evens = [n for n in nums if n % 2 == 0]

# a dict comprehension
lengths = {word: len(word) for word in ["hi", "hello"]}
print(squares, evens, lengths)
```
```console
$ python comp.py
[1, 4, 9, 16, 25] [2, 4] {'hi': 2, 'hello': 5}
```
*What just happened:* `[n * n for n in nums]` produced the same list as the four-line loop, in one line
reading "n squared, for each n in nums." `if n % 2 == 0` filters as it builds; the dict version uses
`{key: value for ...}`. They're not just shorter - they signal "I'm transforming a collection," easier to
read than a loop whose purpose you must infer.

⚠️ **Gotcha - don't cram everything in.** A comprehension with two filters and a nested loop is *worse*
than a plain loop. Use them for simple transform-and-filter; reach for a loop as logic grows.

### Unpacking - pull a sequence apart into names

```python runnable
point = (3, 4)
x, y = point                       # unpack a tuple into two names
first, *rest = [1, 2, 3, 4]        # * grabs "everything else"
print(x, y)
print(first, rest)
```
```console
$ python unpack.py
3 4
1 [2, 3, 4]
```
*What just happened:* `x, y = point` assigned `3` and `4` in one move; `*rest` swept the rest into a
list. This is also how Python returns "multiple values" - a function returns a tuple and the caller
unpacks it.

### enumerate and zip - loop like a Python programmer

**What they are.** `enumerate` gives you the index *and* item while looping; `zip` walks two (or more)
sequences in lockstep. Both replace clunky index bookkeeping.

```python runnable
names = ["Ana", "Bo", "Cy"]
scores = [90, 85, 95]

for i, name in enumerate(names):           # index + value, no counter needed
    print(i, name)

for name, score in zip(names, scores):     # two lists, paired up
    print(f"{name}: {score}")
```
```console
$ python loops.py
0 Ana
1 Bo
2 Cy
Ana: 90
Bo: 85
Cy: 95
```
*What just happened:* `enumerate(names)` yielded `(0, "Ana")`, `(1, "Bo")`, ... - no manual `i = 0; i +=
1` counter needed. `zip(names, scores)` yielded `("Ana", 90)`, `("Bo", 85)`, ..., pairing the lists
position by position. ⚠️ Different-length lists? `zip` stops at the shorter one, quietly.

### Truthiness - empty things are False

**What it actually is.** Python lets you test collections directly: an empty list, string, dict, `0`,
and `None` are all "falsy"; non-empty ones are "truthy." So write `if items:`, not `if len(items) > 0:`.

```python runnable
items = []
if items:
    print("has stuff")
else:
    print("empty")            # this runs - [] is falsy
```
```console
$ python truthy.py
empty
```
*What just happened:* The empty list counted as `False`, so `else` ran. `if items:` reads as "if there
are any items," exactly what you mean. ⚠️ One catch: it can't tell `None` (missing) apart from `[]`
(present but empty), or `0` from absent. When that matters, test explicitly: `if value is not None:`.

### Context managers - `with` for guaranteed cleanup

You met `with open(...)` in [Phase 7](07-errors-and-io.md). The idiom generalizes: whenever something
must be set up and reliably torn down - a file, a network connection, a lock - `with` is the Pythonic
way, since cleanup happens even if an exception fires inside.

## The gotcha cheat-card

> **Read these once and you'll dodge an afternoon of confusion each. They bite nearly everyone.**

| The gotcha | What actually happens | The fix |
|---|---|---|
| **Mutable default argument** - `def f(x, items=[]):` | The `[]` is created *once*, at function definition, and *shared across every call* - it accumulates between calls. | Default to `None`, build inside: `def f(x, items=None): items = items or []` |
| **Late-binding closures** - functions made in a loop all see the *final* loop value | The closure captures the *variable*, not its value at creation time - all read `i` after the loop ended. | Bind it as a default arg: `lambda i=i: ...`, or use a factory function |
| **`is` vs `==`** - `a is b` for comparing values | `is` checks "same object in memory," not "equal value" - works by accident for small ints/`None`, fails on bigger values. | Use `==` for value equality; reserve `is` for `is None` / `is True` |
| **Integer caching** - `a is b` "works" for `256` but not `257` | CPython pre-caches small ints (−5 to 256) as shared objects, so `is` happens to be `True` for them; above that, separate objects. | Same fix: never use `is` to compare numbers - use `==` |
| **The GIL** - threads don't speed up CPU work | CPython's Global Interpreter Lock lets only one thread run Python bytecode at a time, so CPU-bound threads never run in parallel. | Use `multiprocessing` (or a native lib) for CPU work; threads suit I/O-bound waiting |
| **Shadowing stdlib names** - naming a file `random.py` or a variable `list` | `random.py` shadows the standard library's, so `import random` imports *your* file; `list = [...]` hides the built-in `list()`. | Don't name files/variables after stdlib modules or built-ins |

Two of these deserve seeing in code:

**Mutable default argument:**
```python runnable
def add_item(item, basket=[]):     # the trap
    basket.append(item)
    return basket

print(add_item("a"))
print(add_item("b"))               # surprise: "a" is still here
```
```console
$ python default.py
['a']
['a', 'b']
```
*What just happened:* The default `[]` was created *once* at definition time and reused on every call
omitting `basket`, so the second call appended to the *same* list, which still held `"a"`. Fix: default
to `None` and create a fresh list inside the function each call.

**`is` vs `==`:**
```python runnable
a = int("257")     # built at runtime, not a shared literal
b = int("257")
print(a == b)      # equal value?  yes
print(a is b)      # same object?  no (above the cached range)
```
```console
$ python identity.py
True
False
```
*What just happened:* `a` and `b` hold equal values, so `==` is `True`. But they're separate integer
objects in memory (257 is past CPython's small-int cache), so `is` - "the *same* object?" - is `False`.
We built them with `int("257")` on purpose: two bare `257` literals in one file get folded into a single
shared object by the compiler, so `is` would sneakily report `True` there - one more reason never to
trust `is` on numbers. Use `==` for values, `is` for `None`/`True`/`False`.

> 💡 **Key point.** Almost every gotcha here comes from one of two confusions: *when* something is
> created (default args, closures - timing), or *what* equality means (`is` vs `==` - identity vs
> value). Hold those two distinctions and the surprises mostly evaporate.

## Recap

1. **Comprehensions** build lists/dicts in one readable expression; keep them simple.
2. **Unpacking** (`x, y = point`, `first, *rest = ...`) pulls sequences apart by name.
3. **`enumerate`** gives index+item; **`zip`** walks sequences in lockstep (stopping at the shortest).
4. **Truthiness** lets you write `if items:` - test `is not None` when empty and missing differ.
5. **`with`** (context managers) guarantees cleanup, exceptions or not.
6. The **gotcha cheat-card** - mutable defaults, late-binding closures, `is` vs `==`, integer caching,
   the GIL, shadowing stdlib names - are the surprises that bite everyone once. Now they won't bite you.

That's the *basics* done - phases 1-9. From here the guide goes deeper, into how Python actually works
under your code, starting with its object model.

---

[← Phase 8: The Ecosystem & Tooling](08-ecosystem-and-tooling.md) · [Guide overview](_guide.md) · [Phase 10: The Data Model & Dunder Methods →](10-the-data-model.md)
