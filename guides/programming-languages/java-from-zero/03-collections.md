---
title: "Collections - Arrays, Lists, Maps & Sets"
guide: "java-from-zero"
phase: 3
summary: "Arrays are fixed and rigid; the Collections Framework is where real Java lives. Here's the List/Map/Set mental model, ArrayList, HashMap, and HashSet - and why you program to the interface."
tags: [java, collections, arrays, arraylist, hashmap, hashset, generics, list]
difficulty: beginner
synonyms: ["java arraylist vs array", "java list interface", "java hashmap explained", "java hashset", "java collections framework", "java generics list", "java for each loop collection"]
updated: 2026-06-22
---

# Collections - Arrays, Lists, Maps & Sets

Up to now you've held one value at a time. Real programs deal in *many*: a roster of users, a table of
prices, the unique tags on a post. Java gives you two layers for this - the old, low-level **array**, and
the rich **Collections Framework** on top of it. Newcomers waste energy fighting arrays when they should
reach for a `List`. We'll meet the array, see when it earns its keep, then spend the rest of the phase on
the collections you'll actually use daily.

The mental model: an **array** is a fixed slab of memory you size once and live with. A **collection** is a
smart, growable object that manages that slab for you, letting you ask by *behavior* ("ordered list," "fast
lookup by key") instead of wrestling the memory yourself.

## Arrays - the fixed-size foundation

**What it actually is.** An **array** is a fixed-length sequence of values, all the same type, laid out
back-to-back in memory. You choose the length at creation; it never changes. `int[]` reads as "an array of
ints."

```java
int[] nums = {1, 2, 3};
System.out.println(nums[0]);      // first element
System.out.println(nums[2]);      // third element
System.out.println(nums.length);  // how many slots
```
```console
1
3
3
```
*What just happened:* `{1, 2, 3}` created an array with three slots, already filled. `nums[0]` reads the
**first** element (Java counts from zero), `nums[2]` the third. `nums.length` tells you the size - a
**field, no parentheses**. Reaching past the end (`nums[3]`) throws an `ArrayIndexOutOfBoundsException` -
there's no fourth slot.

The catch is right there in "fixed-length": no `add`. Need more room? Allocate a bigger array and copy
everything by hand - exactly the chore the Collections Framework does for you.

💡 **When you'd reach for an array.** When the size is known and fixed (the 12 months, an RGB triple), when
you want the leanest memory for primitives, or when an API hands you one. For nearly everything else - it
grows, shrinks, or you're unsure of the size - reach for a `List`, next up and where most of your
collection work lives.

## The Collections Framework - the mental model

The idea that unlocks the rest of Java's collections: the framework splits into two halves.

📝 **Interfaces vs. implementations.** An **interface** describes *behavior* - what a collection can do,
not how. `List`, `Map`, and `Set` are interfaces. A **concrete class** provides the how; `ArrayList`,
`HashMap`, and `HashSet` are the workhorses. The interface is the *contract*; the class is the *machine*
that fulfills it.

Three interfaces cover almost everything you'll need:

- **`List`** - an *ordered* sequence accessed by position. Duplicates allowed. (Think: a numbered to-do list.)
- **`Map`** - a table of **key → value** pairs looked up by key. (Think: a phone book.)
- **`Set`** - an *unordered* bag of **unique** elements. (Think: the distinct words in a document.)

💡 **Program to the interface.** Strong Java convention: *type your variable as the interface* but *create
the concrete class*:

```java
List<String> names = new ArrayList<>();
```

The variable is a `List`; the object is an `ArrayList` doing the work. The rest of your code only depends on
"it's a list," so the day a `LinkedList` suits better, you change one line - the `new` - and nothing else
breaks. Coding against the *promise*, not the *machinery*.

The `<String>` part is **generics**: it tells Java "this list holds `String`s and nothing else" - the
feature that makes collections type-safe.

## `List` and `ArrayList` - the growable sequence

**What it actually is.** A `List` is an ordered, indexed sequence - like an array, but growing and shrinking
on demand. `ArrayList` is the implementation you'll use 95% of the time; under the hood it manages a real
array, invisibly reallocating and copying when it fills up.

```java
import java.util.ArrayList;
import java.util.List;

public class Main {
    public static void main(String[] args) {
        List<String> names = new ArrayList<>();
        names.add("Ada");
        names.add("Alan");
        names.add("Grace");

        System.out.println(names.get(0));   // read by index
        System.out.println(names.size());   // how many

        for (String name : names) {         // the for-each loop
            System.out.println(name);
        }
    }
}
```
```console
Ada
3
Ada
Alan
Grace
```
*What just happened:* We declared `names` as a `List<String>` but built an `ArrayList<>()` - programming to
the interface, exactly as above. (The empty `<>` is the "diamond"; Java infers `String` from the left side.)
`add` appended each name to the end. `get(0)` read the first element by index; `size()` reported the count
*with* parentheses, unlike an array's `length` field. The **for-each** loop (`for (String name : names)`)
visited every element in order, no index needed - the cleanest way to walk a collection.

The generics payoff shows up the moment you slip: because `names` is a `List<String>`, this won't compile:

```java
names.add(42);   // compile error: int is not a String
```
*What just happened:* The `<String>` is a promise the **compiler enforces**. Adding an `int` is caught
before the program ever runs, not as a surprise crash later - type mistakes become compile-time errors
instead of `ClassCastException`s in production.

## `Map` and `HashMap` - lookup by key

A `List` suits *order* and *position*. But often you want to look something up by *name* - a user's score
by username, a setting's value by its key. That's a `Map`.

**What it actually is.** A `Map` stores **key → value** pairs and fetches a value instantly by key.
`HashMap` is the standard implementation. `Map<String, Integer>` reads as "a map from `String` keys to
`Integer` values." (Other languages call this a dictionary, hash, or associative array.)

```java
import java.util.HashMap;
import java.util.Map;

public class Main {
    public static void main(String[] args) {
        Map<String, Integer> ages = new HashMap<>();
        ages.put("Ada", 36);
        ages.put("Alan", 41);

        System.out.println(ages.get("Ada"));               // look up by key
        System.out.println(ages.getOrDefault("Nobody", 0)); // safe default

        for (Map.Entry<String, Integer> entry : ages.entrySet()) {
            System.out.println(entry.getKey() + " -> " + entry.getValue());
        }
    }
}
```
```console
36
0
Ada -> 36
Alan -> 41
```
*What just happened:* `put` stored two key→value pairs. `get("Ada")` returned `36`. The interesting one is
`getOrDefault("Nobody", 0)`: plain `get` on a missing key returns `null` (often a `NullPointerException` two
lines later), so `getOrDefault` says "give me the value, or this fallback" - here, `0`. To visit every pair,
we looped over `entrySet()`, which hands back each pair as a `Map.Entry` with `getKey()`/`getValue()` - the
standard way to iterate a map.

⚠️ **Gotcha - `get` returns `null` for a missing key.** It does *not* throw. Use the result blindly and a
missing key turns into a `NullPointerException` downstream, far from the real cause. Reach for
`getOrDefault` (or check `containsKey` first) whenever a key might be absent.

## `Set` and `HashSet` - uniqueness, fast

**What it actually is.** A `Set` holds **unique** elements - add the same value twice and the second add is
silently ignored. `HashSet` is the standard implementation, answering "is this in here?" almost instantly.

```java
import java.util.HashSet;
import java.util.Set;

public class Main {
    public static void main(String[] args) {
        Set<String> tags = new HashSet<>();
        tags.add("java");
        tags.add("beginner");
        tags.add("java");          // duplicate - ignored

        System.out.println(tags.size());            // 2, not 3
        System.out.println(tags.contains("java"));  // fast membership test
    }
}
```
```console
2
true
```
*What just happened:* We added `"java"` twice, but the set kept only one copy, so `size()` is `2`.
`contains` checked membership and returned `true` immediately - `HashSet` is built for exactly that "have I
seen this before?" question. Use a `Set` whenever uniqueness is the point: de-duplicating a list, tracking
processed items, testing membership in a hot loop.

💡 **Picking the right one.** Let the question pick the collection. **Order and position** (or duplicates)?
→ `List`. **Lookup by key**? → `Map`. **Uniqueness or fast membership**? → `Set`.

⚠️ **Gotcha - `HashMap` and `HashSet` have no order.** They're optimized for speed, not for preserving
insertion order - iterate one and the order can look random and even differ between runs. If you need order,
the framework has drop-in replacements: **`LinkedHashMap`/`LinkedHashSet`** preserve *insertion* order, and
**`TreeMap`/`TreeSet`** keep keys *sorted*. Same interfaces, so swapping one in is a one-line change.

## Recap

1. An **array** (`int[]`) is fixed-size and lean - great when the count never changes, awkward when it does.
   `.length` is a field, not a method.
2. The **Collections Framework** splits into **interfaces** (`List`, `Map`, `Set` - behavior) and **concrete
   classes** (`ArrayList`, `HashMap`, `HashSet` - implementation).
3. **Program to the interface:** `List<String> names = new ArrayList<>();`. Your code depends on the
   contract, so swapping implementations costs one line.
4. **`List`/`ArrayList`** is the growable ordered sequence: `add`, `get`, `size`, and the **for-each** loop.
   **Generics** (`<String>`) make it type-safe at compile time.
5. **`Map`/`HashMap`** does key→value lookup: `put`, `get`, `getOrDefault`, and `entrySet()` to iterate -
   but `get` returns `null` for a missing key.
6. **`Set`/`HashSet`** holds unique elements with fast `contains`. ⚠️ `HashMap`/`HashSet` are **unordered**;
   use `LinkedHashMap`/`TreeMap` (and the `Set` equivalents) when order matters.

Next: making programs *decide* and *organize logic* - `if`/`switch`, loops, and the methods that give Java
code its shape.

## Quick check

Test yourself on the habit that makes Java collections click - choosing by behavior and coding to the
interface:

```quiz
[
  {
    "q": "Why is `List<String> names = new ArrayList<>();` preferred over `ArrayList<String> names = new ArrayList<>();`?",
    "choices": [
      "The variable is typed to the List interface, so your code depends on behavior and you can swap the implementation with a one-line change",
      "It runs faster because List is a smaller type than ArrayList",
      "ArrayList cannot be assigned to a variable at all",
      "It automatically makes the list unmodifiable"
    ],
    "answer": 0,
    "explain": "Programming to the interface means the rest of your code only knows it has a `List`. The concrete class lives in one place - the `new` - so switching to, say, a `LinkedList` changes that single line and nothing else."
  },
  {
    "q": "You call `ages.get(\"Nobody\")` on a `HashMap<String, Integer>` that has no \"Nobody\" key. What happens?",
    "choices": [
      "It returns `null` (which can cause a NullPointerException downstream) - use `getOrDefault` to avoid this",
      "It throws a KeyNotFoundException immediately",
      "It returns 0 because the value type is Integer",
      "It adds the key with a null value and returns it"
    ],
    "answer": 0,
    "explain": "`get` returns `null` for a missing key rather than throwing. That null often blows up later, far from the cause. `getOrDefault(\"Nobody\", 0)` hands back a safe fallback instead."
  },
  {
    "q": "You need to store the distinct tags on a post and quickly check whether a given tag is already present. Which collection fits best?",
    "choices": [
      "A Set (HashSet) - it keeps elements unique and answers `contains` fast",
      "A List (ArrayList) - it preserves insertion order",
      "A Map (HashMap) - it stores key→value pairs",
      "An array - it has a fixed size"
    ],
    "answer": 0,
    "explain": "Uniqueness plus fast membership is exactly what a `Set` is for. A `HashSet` ignores duplicate adds and answers `contains` almost instantly - the right tool when 'is this already in here?' is the core question."
  }
]
```

---

[← Phase 2: Syntax, Values & Types](02-syntax-values-and-types.md) · [Guide overview](_guide.md) · [Phase 4: Control Flow & Methods →](04-control-flow-and-methods.md)
