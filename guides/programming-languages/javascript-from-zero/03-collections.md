---
title: "Collections - Arrays & Objects"
guide: "javascript-from-zero"
phase: 3
summary: "Arrays are ordered lists with powerful methods like map, filter, and reduce; objects are labeled key/value bundles; Map and Set exist for special cases. Plus the reference-vs-value rule that explains why two equal-looking arrays aren't equal."
tags: [javascript, arrays, objects, map, filter, reduce, references, mutability, map-set]
difficulty: beginner
synonyms: ["javascript arrays explained", "what is map filter reduce", "javascript objects key value", "why are arrays not equal javascript", "reference vs value javascript", "what is a javascript object", "map vs object javascript"]
updated: 2026-06-19
---

# Collections - Arrays & Objects

Single values only get you so far. Real programs deal with *many* things - a list of users, the fields of
a form, the items in a cart. JavaScript has two workhorse collections for this, and almost everything you
build leans on them: the **array** (an ordered list) and the **object** (a labeled bundle). Get these two
fluent and a huge amount of JavaScript opens up.

## Arrays: ordered lists

**What an array actually is.** An array is an ordered list of values, written with square brackets. The
values can be any type, and you reach into the list by *position* - counting from **0**, not 1.
```javascript runnable
const fruits = ["apple", "banana", "cherry"];
console.log(fruits[0]);     // first item
console.log(fruits[2]);     // third item
console.log(fruits.length); // how many items
```
```console
apple
cherry
3
```
*What just happened:* `fruits[0]` is the first element, because array positions ("indexes") start at zero -
this is universal across most languages and worth burning into memory now. `fruits[2]` is the third.
`.length` tells you how many items there are. Asking for an index that doesn't exist (`fruits[99]`) gives
you `undefined` rather than an error.

You can add and change items:
```javascript runnable
const fruits = ["apple", "banana"];
fruits.push("cherry");   // add to the end
fruits[0] = "apricot";   // replace the first item
console.log(fruits);
```
```console
[ 'apricot', 'banana', 'cherry' ]
```
*What just happened:* `.push(...)` appended `"cherry"` to the end. `fruits[0] = "apricot"` overwrote the
first slot. Notice the array is a `const` and yet we changed its *contents* - that's allowed, and the
reason why is the most important idea in this phase. We'll get to it.

### A taste of array methods: `map`, `filter`, `reduce`

Arrays come with built-in methods that transform lists without you writing manual loops. These three are
the ones you'll reach for constantly, so meet them now - even if they feel like a lot at first.

**`map`** makes a *new* array by transforming every item:
```javascript runnable
const numbers = [1, 2, 3];
const doubled = numbers.map((n) => n * 2);
console.log(doubled);
```
```console
[ 2, 4, 6 ]
```
*What just happened:* `.map(...)` walked through `numbers`, ran the little function `(n) => n * 2` on each
item, and collected the results into a brand-new array. (That `(n) => n * 2` is an **arrow function** - a
compact function we'll cover properly in [Phase 4](04-control-flow-and-functions.md); for now, read it as
"given `n`, give back `n * 2`.") The original `numbers` is untouched.

**`filter`** makes a new array keeping only the items that pass a test:
```javascript runnable
const numbers = [1, 2, 3, 4, 5, 6];
const evens = numbers.filter((n) => n % 2 === 0);
console.log(evens);
```
```console
[ 2, 4, 6 ]
```
*What just happened:* `.filter(...)` kept each item only when the test `n % 2 === 0` ("the remainder when
dividing by 2 is zero" - i.e. it's even) returned `true`. The odd numbers were dropped. Again, a new array
comes out; the original stays put.

**`reduce`** boils a whole array down to a single value:
```javascript runnable
const numbers = [10, 20, 30];
const total = numbers.reduce((sum, n) => sum + n, 0);
console.log(total);
```
```console
60
```
*What just happened:* `.reduce(...)` carries a running value (`sum`) across the list. It starts at `0` (the
second argument), then for each item adds it on: `0+10`, then `+20`, then `+30`, landing on `60`. `reduce`
is the most powerful and least obvious of the three - don't worry if it takes a few uses to click. The
mental model: "fold the list into one result, one item at a time."

💡 **Key point.** `map`, `filter`, and `reduce` all return *new* values and leave the original array alone.
Building new data instead of mutating old data is a habit that prevents a whole class of bugs, and it reads
like a sentence: "take the numbers, *filter* the evens, *map* them doubled."

## Objects: labeled bundles

**What an object actually is.** Where an array holds values by *position*, an object holds values by
*name*. It's a bundle of `key: value` pairs in curly braces - perfect for representing one "thing" with
several properties.
```javascript runnable
const user = {
  name: "Ada",
  age: 36,
  isAdmin: true,
};
console.log(user.name);     // dot notation
console.log(user["age"]);   // bracket notation
```
```console
Ada
36
```
*What just happened:* `user` bundles three labeled values. You read a value by its key, either with a dot
(`user.name` - what you'll use most) or with brackets and the key as a string (`user["age"]` - needed when
the key is in a variable or has unusual characters). The keys are `name`, `age`, `isAdmin`; the values are
whatever you stored.

You change and add properties freely:
```javascript runnable
const user = { name: "Ada" };
user.age = 36;        // add a new property
user.name = "Ada L."; // change an existing one
console.log(user);
```
```console
{ name: 'Ada L.', age: 36 }
```
*What just happened:* Assigning to `user.age` (a key that didn't exist) *added* it; assigning to
`user.name` *changed* it. Objects are open for extension like this by default.

📝 **Terminology.** A **property** is one `key: value` pair on an object. A **method** is a property whose
value happens to be a function (e.g. `console.log` is the `log` method of the `console` object). Arrays are
technically a special kind of object too - which is why they have methods like `.push()`.

## A one-line note on `Map` and `Set`

For most "labeled data," a plain object is exactly right. But JavaScript also has two purpose-built
collections worth *knowing the names of* so you recognize them later: a **`Map`** is like an object but its
keys can be *any* type (not just strings) and it remembers insertion order cleanly; a **`Set`** is a list
that automatically rejects duplicates. Reach for them when those specific powers matter; until then, arrays
and objects cover the vast majority of real code.

## ⚠️ The big one: reference vs. value

This single idea explains the `const`-but-still-changeable puzzle from earlier, *and* a bug that bites
every JavaScript developer. Pay attention here - it's worth more than the rest of the phase combined.

**Primitives are copied by value. Objects and arrays are shared by reference.** When you assign a number
or string, you copy the value. When you assign an object or array, you copy a *reference* - a pointer to
the same underlying thing. Two names, one object.
```javascript runnable
const a = { count: 1 };
const b = a;        // b points at the SAME object as a
b.count = 99;
console.log(a.count);
```
```console
99
```
*What just happened:* `const b = a` did **not** make a second object - it made `b` point at the *exact same*
object `a` points at. So changing `b.count` also changed `a.count`, because they're two names for one
thing. This surprises everyone the first time. (Compare with primitives: `let x = 1; let y = x; y = 99;`
leaves `x` as `1`, because the number was copied.)

This is also why a `const` array can still be `push`ed into: `const` locks the *name* to one object, but
the object's *insides* are still free to change. `const` protects the pointer, not the contents.

And it's why two equal-looking objects aren't equal:
```javascript runnable
console.log({ x: 1 } === { x: 1 });   // two separate objects
const same = { x: 1 };
console.log(same === same);           // the same object
```
```console
false
true
```
*What just happened:* The first comparison is `false` because those are *two different objects* that merely
*look* alike - `===` on objects asks "are these the same object?", not "do they contain the same stuff?"
The second is `true` because both sides are literally the same object. To compare *contents*, you compare
the fields yourself (or use a library). This is the source of countless "but they're the same!" debugging
sessions.

🪖 **War story.** A classic bug: you copy an array with `const copy = original`, tweak `copy`, and later
discover `original` changed too - they were always the same array. The fix is to make a *real* copy:
`const copy = [...original]` for an array, or `const copy = { ...original }` for an object. That `...` is
the "spread" syntax; it builds a new collection with the old one's items shallow-copied in. Keep it in your
back pocket.

## Recap

1. **Arrays** are ordered lists indexed from **0**; `.length` counts them, `.push()` appends.
2. **`map`/`filter`/`reduce`** transform / select / fold an array into a *new* value, leaving the original
   alone.
3. **Objects** are `key: value` bundles read with `.dot` or `["bracket"]` notation; properties can be
   added and changed freely.
4. **`Map`** (any-type keys) and **`Set`** (no duplicates) exist for special cases - know the names.
5. **Reference vs. value:** objects and arrays are *shared*, not copied, on assignment. This explains
   `const` arrays you can still mutate, and why `{x:1} === {x:1}` is `false`. Copy with `[...a]` / `{...o}`.

Next: the logic that decides *which* code runs and *how often* - control flow - and the functions that let
you name and reuse blocks of behavior.

---

[← Phase 2: Syntax, Values & Types](02-syntax-values-and-types.md) · [Guide overview](_guide.md) · [Phase 4: Control Flow & Functions →](04-control-flow-and-functions.md)
