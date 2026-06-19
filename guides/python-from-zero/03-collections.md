---
title: "Collections — Lists, Tuples, Dicts & Sets"
guide: "python-from-zero"
phase: 3
summary: "Python's four everyday collections: lists (ordered, changeable), tuples (ordered, fixed), dicts (key-to-value lookups), and sets (unique items) — how to index and slice them, which are mutable, and the aliasing trap where two names share one list."
tags: [python, list, tuple, dict, set, collections, slicing, indexing, mutability, aliasing]
difficulty: beginner
synonyms: ["python list vs tuple", "what is a dict in python", "python set explained", "how to slice a list in python", "python aliasing two names one list", "mutable vs immutable python", "indexing in python"]
updated: 2026-06-19
---

# Collections — Lists, Tuples, Dicts & Sets

A single value — one number, one string — only gets you so far. Real programs juggle *groups* of
things: a list of users, a price per product, a set of tags. Python gives you four built-in collection
types, and the secret to using them well is knowing *what each one is for*. Reach for the wrong one and
your code fights you; reach for the right one and it almost writes itself. Let's meet all four, then deal
with the trap that catches everyone.

## List — an ordered, changeable sequence

**What it actually is.** A **list** is an ordered row of values you can change — add to, remove from,
rearrange. It's your default "bunch of things in order." You write one with square brackets `[]`.
```python
fruits = ["apple", "banana", "cherry"]
print(fruits)
print(len(fruits))
```
*What just happened:* You made a list of three strings. `len()` reports how many items it holds:
```console
['apple', 'banana', 'cherry']
3
```

**Indexing** — reach in by position. Python counts from **0**, and negative numbers count from the end:
```python
fruits = ["apple", "banana", "cherry"]
print(fruits[0])
print(fruits[-1])
```
*What just happened:* `fruits[0]` is the *first* item (position zero, not one — this catches everyone
early). `fruits[-1]` is the *last* item, counting backward:
```console
apple
cherry
```

⚠️ **Counting starts at 0.** A 3-item list has positions `0`, `1`, `2`. Asking for `fruits[3]` runs off
the end and raises `IndexError: list index out of range`. The last valid position is always `len - 1`.

**Changing it** — because a list is *mutable* (changeable), you can add and modify in place:
```python
fruits = ["apple", "banana"]
fruits.append("cherry")
fruits[0] = "apricot"
print(fruits)
```
*What just happened:* `.append()` added an item to the end. `fruits[0] = "apricot"` replaced the first
item. The same list now reads:
```console
['apricot', 'banana', 'cherry']
```

📝 **Terminology.** **Mutable** means "can be changed after it's created." **Immutable** means "fixed
once created." This distinction quietly governs how every collection behaves — keep it in mind.

## Tuple — an ordered, *fixed* sequence

**What it actually is.** A **tuple** is like a list, but **immutable** — once you make it, you can't add,
remove, or change items. You write one with parentheses `()`. Use a tuple when a group of values
*belongs together and shouldn't change*: coordinates, a row from a database, an RGB color.
```python
point = (4, 5)
print(point[0])
print(point[1])
```
*What just happened:* You made a tuple of two numbers and read them by index, exactly like a list:
```console
4
5
```

The difference shows up the moment you try to change one:
```python
point = (4, 5)
point[0] = 9
```
*What just happened:* Python refuses, because tuples are immutable:
```console
Traceback (most recent call last):
  File "point.py", line 2, in <module>
    point[0] = 9
    ~~~~~^^^
TypeError: 'tuple' object does not support item assignment
```
That "can't change me" guarantee is the *point* of a tuple — it tells anyone reading the code (and
Python itself) that these values are fixed.

💡 **Key point.** List vs tuple is about intent. **List**: a collection you expect to grow, shrink, or
reorder. **Tuple**: a fixed group of related values that travels together and won't change.

## Dict — lookups by key

**What it actually is.** A **dictionary** (`dict`) stores **key → value** pairs. Instead of looking
things up by position, you look them up by a meaningful *key*. It's the right tool whenever you think
"given X, what's its Y?" — given a username, their age; given a product, its price. You write one with
curly braces and `key: value` pairs.
```python
ages = {"ada": 36, "linus": 54}
print(ages["ada"])
print("ada" in ages)
```
*What just happened:* `ages["ada"]` looked up the value stored under the key `"ada"`. The `in` keyword
asks whether a key exists, giving a boolean:
```console
36
True
```

Adding or updating is the same square-bracket syntax:
```python
ages = {"ada": 36}
ages["grace"] = 85
ages["ada"] = 37
print(ages)
```
*What just happened:* Assigning to a *new* key added a pair; assigning to an *existing* key updated it:
```console
{'ada': 37, 'grace': 85}
```

⚠️ **`KeyError` — asking for a key that isn't there.** Looking up a missing key with `[]` doesn't give
`None` — it crashes:
```console
Traceback (most recent call last):
  File "ages.py", line 2, in <module>
    print(ages["bob"])
          ~~~~^^^^^^^
KeyError: 'bob'
```
When you're not sure a key exists, use `.get()`, which returns `None` (or a default you pick) instead of
crashing:
```python
ages = {"ada": 36}
print(ages.get("bob"))
print(ages.get("bob", 0))
```
*What just happened:* `.get("bob")` returned `None` for the missing key; `.get("bob", 0)` returned the
default `0` you supplied:
```console
None
0
```

## Set — a bag of unique items

**What it actually is.** A **set** holds *unique* items with no duplicates and no particular order. Reach
for it when you care about "what distinct things are in here?" or "is this thing present?" — membership
and uniqueness, not position. You write one with curly braces (but just values, no `key: value`).
```python
seen = {1, 2, 2, 3, 3, 3}
print(seen)
print(2 in seen)
```
*What just happened:* The duplicates collapsed automatically — a set keeps only one of each. `in` checks
membership:
```console
{1, 2, 3}
True
```
A favorite real use: strip duplicates out of a list by passing it through a set.
```python
tags = ["python", "web", "python", "api", "web"]
unique = set(tags)
print(unique)
```
*What just happened:* `set(tags)` built a set from the list, discarding repeats. Order isn't guaranteed,
so yours may print in a different arrangement:
```console
{'python', 'web', 'api'}
```

## Slicing — grab a *range* of a sequence

For lists, tuples, and strings, you can pull out a *slice* — a sub-range — with `[start:stop]`. The
`start` is included; the `stop` is **not**.
```python
nums = [10, 20, 30, 40, 50]
print(nums[1:3])
print(nums[:2])
print(nums[2:])
```
*What just happened:* `nums[1:3]` took positions 1 and 2 — *up to but not including* 3. Leaving out
`start` means "from the beginning"; leaving out `stop` means "to the end":
```console
[20, 30]
[10, 20]
[30, 40, 50]
```
The same works on strings, since a string is a sequence of characters:
```python
word = "Python"
print(word[0:3])
```
*What just happened:* It took characters at positions 0, 1, 2 — again, stopping *before* 3:
```console
Pyt
```

📝 **Terminology.** "Stop is exclusive" means the `stop` index is the first one *left out*. `nums[1:3]`
gives you two items, not three. This off-by-one feels odd at first but becomes second nature.

## The trap: aliasing — two names, one list

This is the gotcha that produces the most baffling bugs for beginners, so meet it now, on purpose.

**What's really going on.** When you write `b = a` where `a` is a list, you do **not** get a copy. Both
names now point at the *exact same list in memory*. Change it through one name, and the change shows up
through the other — because there's only one list.
```python
a = [1, 2, 3]
b = a
b.append(4)
print(a)
print(b)
```
*What just happened:* `b = a` made `b` a second name for the *same* list, not a new one. `b.append(4)`
changed that one shared list, so reading it through `a` shows the `4` too:
```console
[1, 2, 3, 4]
[1, 2, 3, 4]
```
If you genuinely want a separate, independent copy, ask for one explicitly with `.copy()` (or
`list(a)`):
```python
a = [1, 2, 3]
b = a.copy()
b.append(4)
print(a)
print(b)
```
*What just happened:* `.copy()` made a brand-new list with the same contents. Now `a` and `b` are
independent, so appending to `b` leaves `a` untouched:
```console
[1, 2, 3]
[1, 2, 3, 4]
```

⚠️ **This only bites mutable collections.** Lists, dicts, and sets are mutable, so aliasing matters for
them. Numbers, strings, and tuples are immutable — you can't change them in place, so "sharing" one is
harmless. The rule to remember: **assignment never copies; it makes another name for the same object.**
For mutable objects, copy on purpose when you need independence.

## Recap

1. **List** `[]` — ordered and *changeable*; your default sequence. Index from `0`, `-1` is the last.
2. **Tuple** `()` — ordered but *fixed* (immutable); for groups of values that shouldn't change.
3. **Dict** `{key: value}` — look up values by key; use `.get()` to avoid `KeyError` on missing keys.
4. **Set** `{a, b, c}` — unique items, no order; great for deduping and membership tests.
5. **Slicing** `[start:stop]` grabs a sub-range; `stop` is *excluded*.
6. **Aliasing:** `b = a` makes two names for *one* list — not a copy. Use `.copy()` when you need an
   independent one. Assignment never copies.

Next, we make programs *decide* and *repeat*: `if`/`else`, loops, and functions — plus the famous
mutable-default-argument trap.

---

[← Phase 2: Syntax, Values & Types](02-syntax-values-and-types.md) · [Guide overview](_guide.md) · [Phase 4: Control Flow & Functions →](04-control-flow-and-functions.md)
