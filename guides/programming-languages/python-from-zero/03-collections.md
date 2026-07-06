---
title: "Collections - Lists, Tuples, Dicts & Sets"
guide: "python-from-zero"
phase: 3
summary: "Python's four everyday collections: lists (ordered, changeable), tuples (ordered, fixed), dicts (key-to-value lookups), and sets (unique items) - how to index and slice them, which are mutable, and the aliasing trap where two names share one list."
tags: [python, list, tuple, dict, set, collections, slicing, indexing, mutability, aliasing]
difficulty: beginner
synonyms: ["python list vs tuple", "what is a dict in python", "python set explained", "how to slice a list in python", "python aliasing two names one list", "mutable vs immutable python", "indexing in python"]
updated: 2026-06-19
---

# Collections - Lists, Tuples, Dicts & Sets

A single value only gets you so far. Real programs juggle *groups* of things: a list of users, a price
per product, a set of tags. Python's four built-in collection types each have a job - reach for the
wrong one and your code fights you. Let's meet all four, then the trap that catches everyone.

## List - an ordered, changeable sequence

**What it actually is.** A **list** is an ordered row of values you can add to, remove from, or
rearrange - your default "bunch of things in order." Write one with square brackets `[]`.
```python runnable
fruits = ["apple", "banana", "cherry"]
print(fruits)
print(len(fruits))
```
*What just happened:* A list of three strings. `len()` reports how many items it holds:
```console
['apple', 'banana', 'cherry']
3
```

**Indexing** - reach in by position. Python counts from **0**; negative numbers count from the end:
```python runnable
fruits = ["apple", "banana", "cherry"]
print(fruits[0])
print(fruits[-1])
```
*What just happened:* `fruits[0]` is the *first* item (position zero, not one - this catches everyone
early); `fruits[-1]` is the *last*, counting backward:
```console
apple
cherry
```

⚠️ **Counting starts at 0.** A 3-item list has positions `0`, `1`, `2`. `fruits[3]` runs off the end and
raises `IndexError: list index out of range` - the last valid position is always `len - 1`.

**Changing it** - a list is *mutable* (changeable), so you can add and modify in place:
```python runnable
fruits = ["apple", "banana"]
fruits.append("cherry")
fruits[0] = "apricot"
print(fruits)
```
*What just happened:* `.append()` added an item to the end; `fruits[0] = "apricot"` replaced the first:
```console
['apricot', 'banana', 'cherry']
```

📝 **Terminology.** **Mutable** means "can be changed after it's created." **Immutable** means "fixed
once created." This distinction governs how every collection behaves - keep it in mind.

## Tuple - an ordered, *fixed* sequence

**What it actually is.** A **tuple** is like a list, but **immutable** - once made, you can't add,
remove, or change items. Write one with parentheses `()`, for a group of values that *belongs together
and shouldn't change*: coordinates, a row from a database, an RGB color.
```python runnable
point = (4, 5)
print(point[0])
print(point[1])
```
*What just happened:* A tuple of two numbers, read by index, exactly like a list:
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
That "can't change me" guarantee is the *point* - it tells anyone reading the code (and Python itself)
these values are fixed.

💡 **Key point.** List vs tuple is about intent. **List**: expected to grow, shrink, or reorder.
**Tuple**: a fixed group of related values that travels together and won't change.

## Dict - lookups by key

**What it actually is.** A **dictionary** (`dict`) stores **key → value** pairs, looked up by a
meaningful *key* instead of position - the tool for "given X, what's its Y?": given a username, their
age; given a product, its price. Write one with curly braces and `key: value` pairs.
```python runnable
ages = {"ada": 36, "linus": 54}
print(ages["ada"])
print("ada" in ages)
```
*What just happened:* `ages["ada"]` looked up the value under key `"ada"`; `in` asks whether a key
exists, giving a boolean:
```console
36
True
```

Adding and updating use the same square-bracket syntax:
```python runnable
ages = {"ada": 36}
ages["grace"] = 85
ages["ada"] = 37
print(ages)
```
*What just happened:* Assigning to a *new* key added a pair; assigning to an *existing* one updated it:
```console
{'ada': 37, 'grace': 85}
```

⚠️ **`KeyError` - asking for a key that isn't there.** Looking up a missing key with `[]` doesn't return
`None` - it crashes:
```console
Traceback (most recent call last):
  File "ages.py", line 2, in <module>
    print(ages["bob"])
          ~~~~^^^^^^^
KeyError: 'bob'
```
When unsure a key exists, use `.get()`, which returns `None` (or a chosen default) instead of crashing:
```python runnable
ages = {"ada": 36}
print(ages.get("bob"))
print(ages.get("bob", 0))
```
*What just happened:* `.get("bob")` returned `None` for the missing key; `.get("bob", 0)` returned your
supplied default `0`:
```console
None
0
```

## Set - a bag of unique items

**What it actually is.** A **set** holds *unique* items with no duplicates and no particular order -
reach for it for "what distinct things are here?" or "is this present?": membership and uniqueness, not
position. Write one with curly braces (just values, no `key: value`).
```python runnable
seen = {1, 2, 2, 3, 3, 3}
print(seen)
print(2 in seen)
```
*What just happened:* Duplicates collapsed automatically - a set keeps only one of each. `in` checks
membership:
```console
{1, 2, 3}
True
```
A favorite real use: strip duplicates from a list by passing it through a set.
```python runnable
tags = ["python", "web", "python", "api", "web"]
unique = set(tags)
print(unique)
```
*What just happened:* `set(tags)` built a set from the list, discarding repeats. Order isn't guaranteed,
so yours may print differently:
```console
{'python', 'web', 'api'}
```

## Slicing - grab a *range* of a sequence

For lists, tuples, and strings, pull out a *slice* - a sub-range - with `[start:stop]`. `start` is
included; `stop` is **not**.
```python runnable
nums = [10, 20, 30, 40, 50]
print(nums[1:3])
print(nums[:2])
print(nums[2:])
```
*What just happened:* `nums[1:3]` took positions 1 and 2 - *up to but not including* 3. Omitting `start`
means "from the beginning"; omitting `stop` means "to the end":
```console
[20, 30]
[10, 20]
[30, 40, 50]
```
The same works on strings, since a string is also a sequence:
```python runnable
word = "Python"
print(word[0:3])
```
*What just happened:* Took characters at positions 0, 1, 2 - again, stopping *before* 3:
```console
Pyt
```

📝 **Terminology.** "Stop is exclusive" means the `stop` index is the first one *left out* - `nums[1:3]`
gives two items, not three. Feels odd at first, becomes second nature.

## The trap: aliasing - two names, one list

This produces the most baffling beginner bugs, so meet it on purpose.

**What's really going on.** Write `b = a` where `a` is a list, and you do **not** get a copy - both
names point at the *exact same list in memory*. Change it through one name and the other shows the
change too, because there's only one list.
```python runnable
a = [1, 2, 3]
b = a
b.append(4)
print(a)
print(b)
```
*What just happened:* `b = a` made `b` a second name for the *same* list. `b.append(4)` changed that
shared list, so `a` shows the `4` too:
```console
[1, 2, 3, 4]
[1, 2, 3, 4]
```
For a separate, independent copy, ask for one explicitly with `.copy()` (or `list(a)`):
```python runnable
a = [1, 2, 3]
b = a.copy()
b.append(4)
print(a)
print(b)
```
*What just happened:* `.copy()` made a brand-new list with the same contents - `a` and `b` are now
independent, so appending to `b` leaves `a` untouched:
```console
[1, 2, 3]
[1, 2, 3, 4]
```

⚠️ **This only bites mutable collections.** Lists, dicts, and sets are mutable, so aliasing matters.
Numbers, strings, and tuples are immutable - you can't change them in place, so sharing one is harmless.
The rule: **assignment never copies; it makes another name for the same object.**

## Recap

1. **List** `[]` - ordered and *changeable*; your default sequence. Index from `0`, `-1` is the last.
2. **Tuple** `()` - ordered but *fixed* (immutable); for groups of values that shouldn't change.
3. **Dict** `{key: value}` - look up values by key; use `.get()` to avoid `KeyError` on missing keys.
4. **Set** `{a, b, c}` - unique items, no order; great for deduping and membership tests.
5. **Slicing** `[start:stop]` grabs a sub-range; `stop` is *excluded*.
6. **Aliasing:** `b = a` makes two names for *one* list, not a copy. Use `.copy()` for an independent
   one - assignment never copies.

Next: making programs *decide* and *repeat* with `if`/`else`, loops, and functions - plus the famous
mutable-default-argument trap.

---

[← Phase 2: Syntax, Values & Types](02-syntax-values-and-types.md) · [Guide overview](_guide.md) · [Phase 4: Control Flow & Functions →](04-control-flow-and-functions.md)
