---
title: "Idioms & Common Gotchas"
guide: "python-from-zero"
phase: 9
summary: "The Pythonic idioms that make code read like a local wrote it — comprehensions, unpacking, enumerate/zip, truthiness, context managers — plus a cheat-card of the gotchas (mutable defaults, late-binding closures, is vs ==) that bite everyone exactly once."
tags: [python, idioms, pythonic, comprehensions, gotchas, mutable-default, enumerate, zip, gil]
difficulty: intermediate
synonyms: ["pythonic code idioms", "python list comprehension explained", "python enumerate zip", "python mutable default argument bug", "is vs == python", "python late binding closure", "what is the gil"]
updated: 2026-06-19
---

# Idioms & Common Gotchas

There's a point where Python stops feeling like "a language I'm translating my old habits into" and starts
feeling like its own thing. That point is when you learn the **idioms** — the handful of patterns Python
programmers reach for so often that code *not* using them looks faintly foreign.

This phase has two halves. First, the idioms worth adopting on purpose. Then a cheat-card of the gotchas —
the small, surprising behaviors that bite nearly every Python programmer exactly once. Read the gotchas
*before* they bite you; that's the whole point of having them in one place.

## The idioms worth adopting

### Comprehensions — build a list (or dict) in one expression

**What it actually is.** A **comprehension** builds a new collection by describing it, instead of starting
empty and appending in a loop. It reads close to how you'd say it out loud.

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
that reads "n squared, for each n in nums." Adding `if n % 2 == 0` filters as it builds. The dict version
uses `{key: value for ...}`. They're not just shorter — they signal "I'm transforming a collection,"
which is easier to read than a loop whose purpose you have to infer.

⚠️ **Gotcha — don't cram everything in.** A comprehension with two filters and a nested loop is *worse*
than the plain loop. Use them for simple transform-and-filter; reach for a real loop when the logic grows.

### Unpacking — pull a sequence apart into names

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
*What just happened:* `x, y = point` assigned `3` and `4` in one move. The `*rest` form swept the
remaining items into a list. This is how Python returns "multiple values" too — a function returns a
tuple and the caller unpacks it.

### enumerate and zip — loop like a Python programmer

**What they are.** `enumerate` gives you the index *and* the item while looping. `zip` walks two (or more)
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
*What just happened:* `enumerate(names)` yielded `(0, "Ana")`, `(1, "Bo")`, ... so you never manage a
manual `i = 0; i += 1` counter. `zip(names, scores)` yielded `("Ana", 90)`, `("Bo", 85)`, ... pairing the
lists position by position. ⚠️ If the lists are different lengths, `zip` stops at the shorter one — quietly.

### Truthiness — empty things are False

**What it actually is.** Python lets you test collections directly: an empty list, empty string, empty
dict, `0`, and `None` are all "falsy"; non-empty ones are "truthy." So you write `if items:`, not
`if len(items) > 0:`.

```python runnable
items = []
if items:
    print("has stuff")
else:
    print("empty")            # this runs — [] is falsy
```
```console
$ python truthy.py
empty
```
*What just happened:* The empty list counted as `False`, so the `else` branch ran. `if items:` reads as
"if there are any items," which is exactly what you mean. ⚠️ One catch: this can't tell `None` (missing)
apart from `[]` (present but empty), or `0` from absent. When that distinction matters, test explicitly:
`if value is not None:`.

### Context managers — `with` for guaranteed cleanup

You met `with open(...)` in [Phase 7](07-errors-and-io.md). The idiom generalizes: any time something
must be set up and reliably torn down — a file, a network connection, a lock — a `with` block is the
Pythonic way, because the cleanup happens even if an exception fires inside.

## The gotcha cheat-card

> **Read these once and you'll dodge an afternoon of confusion each. They bite nearly everyone.**

| The gotcha | What actually happens | The fix |
|---|---|---|
| **Mutable default argument** — `def f(x, items=[]):` | The `[]` is created *once*, when the function is defined, and *shared across every call*. It accumulates between calls. | Default to `None`, build inside: `def f(x, items=None): items = items or []` |
| **Late-binding closures** — functions made in a loop all see the *final* loop value | The closure captures the *variable*, not its value at creation time. All of them read `i` after the loop ended. | Bind it as a default arg: `lambda i=i: ...`, or use a factory function |
| **`is` vs `==`** — `a is b` for comparing values | `is` checks "same object in memory," not "equal value." It works by accident for small ints/`None`, then fails on bigger values. | Use `==` for value equality; reserve `is` for `is None` / `is True` |
| **Integer caching** — `a is b` "works" for `256` but not `257` | CPython pre-caches small ints (−5 to 256) as shared objects, so `is` happens to be `True` for them. Above that, separate objects. | Same fix: never use `is` to compare numbers — use `==` |
| **The GIL** — threads don't speed up CPU work | CPython's Global Interpreter Lock lets only one thread run Python bytecode at a time, so CPU-bound threads don't run in parallel. | Use `multiprocessing` (or a native lib) for CPU work; threads are still fine for I/O-bound waiting |
| **Shadowing stdlib names** — naming a file `random.py` or a variable `list` | Your `random.py` shadows the standard library's, so `import random` imports *your* file; `list = [...]` hides the built-in `list()`. | Don't name files/variables after stdlib modules or built-ins |

A couple of these deserve seeing in code, because reading about them isn't the same as watching them
happen.

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
*What just happened:* The default `[]` was created *once* at definition time and reused on every call that
omits `basket`. So the second call appended to the *same* list, which still held `"a"`. The fix is to
default to `None` and create a fresh list inside the function each call.

**`is` vs `==`:**
```python runnable
a = 257
b = 257
print(a == b)      # equal value?  yes
print(a is b)      # same object?  no (above the cached range)
```
```console
$ python identity.py
True
False
```
*What just happened:* `a` and `b` hold equal values, so `==` is `True`. But they're two separate integer
objects in memory (257 is past CPython's small-int cache), so `is` — which asks "the *same* object?" — is
`False`. This is why you use `==` for values and save `is` for `None`/`True`/`False`.

> 💡 **Key point.** Almost every gotcha here comes from one of two confusions: *when* something is created
> (default args, closures — both about timing), or *what* equality means (`is` vs `==` — identity vs
> value). Hold those two distinctions and the surprises mostly evaporate.

## Recap

1. **Comprehensions** build lists/dicts in one readable expression; keep them simple.
2. **Unpacking** (`x, y = point`, `first, *rest = ...`) pulls sequences apart by name.
3. **`enumerate`** gives index+item; **`zip`** walks sequences in lockstep (stopping at the shortest).
4. **Truthiness** lets you write `if items:` — but test `is not None` when empty and missing differ.
5. **`with`** (context managers) guarantees cleanup, exceptions or not.
6. The **gotcha cheat-card** — mutable defaults, late-binding closures, `is` vs `==`, integer caching, the
   GIL, shadowing stdlib names — are the surprises that bite everyone once. Now they won't bite you.

You can read, write, and reason about Python like someone who's been here a while. That's the *basics*
done — phases 1–9. From here the guide goes deeper, into how Python actually works under your code,
starting with its object model.

---

[← Phase 8: The Ecosystem & Tooling](08-ecosystem-and-tooling.md) · [Guide overview](_guide.md) · [Phase 10: The Data Model & Dunder Methods →](10-the-data-model.md)
