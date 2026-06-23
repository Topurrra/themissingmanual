---
title: "Syntax, Values & Types"
guide: "javascript-from-zero"
phase: 2
summary: "How to name values with let and const (and why not var), the primitive types (string, number, boolean, null, undefined), template literals, and what dynamic, loose typing means — including the == vs === trap, NaN, and floating-point money."
tags: [javascript, variables, let, const, types, strings, numbers, template-literals, equality]
difficulty: beginner
synonyms: ["let vs const vs var", "javascript data types", "what is undefined vs null", "double equals vs triple equals javascript", "what is NaN", "template literals javascript", "javascript floating point money bug"]
updated: 2026-06-19
---

# Syntax, Values & Types

A program shuffles **values** around — text, numbers, true/false — and to do that it needs to *name* them
so it can refer to them later. This phase is about those two things: the values JavaScript has, and how
you give them names. Most of JavaScript's famous "weird parts" live here, so we'll meet them head-on
rather than letting them ambush you later.

## Naming values: `let` and `const`

**What a variable actually is.** A variable is a name pointing at a value. You make one with `let` or
`const`, an `=`, and the value:
```javascript runnable
let score = 0;
const name = "Ada";
console.log(score, name);
```
```console
0 Ada
```
*What just happened:* `let score = 0` created a name `score` pointing at the number `0`. `const name =
"Ada"` created a name `name` pointing at the text `"Ada"`. Then `console.log` printed both. The semicolon
`;` ends a statement — JavaScript is fairly relaxed about them, but putting them in is a good habit that
avoids a rare class of surprises.

The difference between the two is one rule:

- **`let`** — you can reassign it later. Use it for values that change (a score, a counter, a running
  total).
- **`const`** — you *cannot* reassign it. Use it for values that shouldn't change. This is the one you'll
  use most.

```javascript runnable
let count = 1;
count = 2;          // fine — let allows this
const limit = 10;
limit = 20;         // error — const forbids reassignment
```
```console
TypeError: Assignment to constant variable.
```
*What just happened:* Reassigning `count` worked because it's a `let`. Reassigning `limit` threw a
`TypeError`, because `const` means "this name will always point at this value." That's not a restriction
to fight — it's a safety rail. When you read `const`, you *know* that name won't be yanked out from under
you fifty lines down.

💡 **Key point.** Default to `const`. Reach for `let` only when you genuinely need to reassign. Code where
most names are `const` is easier to reason about, because fewer things move.

⚠️ **Why not `var`?** You'll see `var` in older code and tutorials. It's the original way to declare
variables, and it has two traps `let`/`const` were specifically designed to fix: its scope leaks out of
blocks in surprising ways, and it lets you redeclare the same name silently. The community moved to
`let`/`const` years ago (they arrived in the 2015 language version, "ES2015"). Read `var` when you see it;
don't write it.

## The primitive types

Every value in JavaScript has a **type** that determines what it is and what you can do with it. The
fundamental ("primitive") types you'll use constantly:

- **string** — text: `"hello"`, `'also hello'`. Single or double quotes both work; pick one and be
  consistent.
- **number** — any number, whole or decimal: `42`, `3.14`, `-7`. (Unlike some languages, JavaScript has
  *one* number type, not separate integer and float types.)
- **boolean** — `true` or `false`. The answer to a yes/no question.
- **null** — a deliberate "nothing here." *You* set something to `null` to mean "intentionally empty."
- **undefined** — "no value has been assigned yet." JavaScript hands you this automatically for a variable
  that exists but was never given a value.

You can ask any value its type with the `typeof` operator:
```javascript runnable
console.log(typeof "hello");   // string
console.log(typeof 42);        // number
console.log(typeof true);      // boolean
console.log(typeof undefined); // undefined
```
```console
string
number
boolean
undefined
```
*What just happened:* `typeof` reports the type of the value to its right as a string. It's a handy tool
when you're unsure what you're holding — especially when a value came from somewhere you don't control.

📝 **Terminology — `null` vs `undefined`.** Both mean "no real value," and the difference confuses
everyone at first. The useful way to hold it: **`undefined` is the system's "you never set this"**;
**`null` is your "I'm deliberately setting it to empty."** A search box you haven't filled in might be
`""` (empty string); a setting you explicitly cleared might be `null`; a variable you declared but didn't
assign is `undefined`.

## Template literals: building strings cleanly

You'll constantly want to mix text and values together. The clean way uses **template literals** —
strings wrapped in backticks (`` ` ``) instead of quotes, with `${...}` holes you drop values into:
```javascript runnable
const name = "Ada";
const score = 42;
console.log(`${name} scored ${score} points.`);
```
```console
Ada scored 42 points.
```
*What just happened:* Inside backticks, anything in `${...}` gets evaluated and its result dropped into the
string. No fiddly `+` between pieces, no quote-juggling. Template literals also let a string span multiple
lines without tricks. Once you meet them you'll rarely glue strings together any other way.

## Dynamic and loose typing — the part to understand deeply

This is where JavaScript surprises people coming from other languages, so let's be precise about *two
separate* ideas that often get muddled.

**Dynamic typing** means a variable's type isn't fixed — it's decided by whatever value is in it right
now, and it can change:
```javascript
let x = 42;        // x holds a number
x = "now text";    // perfectly legal — x now holds a string
```
*What just happened:* The same name `x` held a number, then a string. JavaScript never made you *declare*
a type; the value carries its own type, and the variable just points at whatever's there. This is
flexible, and also a source of bugs — nothing stops a variable from quietly becoming a different kind of
thing than you expected.

**Loose typing** means JavaScript will *automatically convert* between types when an operation mixes them,
even when you didn't ask it to. This is the famous footgun:
```javascript runnable
console.log("5" + 1);   // string + number
console.log("5" - 1);   // string - number
```
```console
51
4
```
*What just happened:* With `+`, JavaScript saw a string on the left, decided you must mean
*concatenation*, turned `1` into `"1"`, and glued them: `"51"`. With `-`, there's no string version of
subtraction, so it went the other way — turned `"5"` into the number `5` and subtracted: `4`. Same two
values, opposite conversions, depending on the operator. This is loose typing in a nutshell, and it's why
the next gotcha matters so much.

## ⚠️ The gotchas everyone hits

**`==` vs `===` — always use `===`.** JavaScript has two equality operators. `==` ("loose equality")
converts types before comparing, which produces genuinely baffling results. `===` ("strict equality")
compares without converting — values must match in *both* value and type.
```javascript runnable
console.log(0 == "");      // true  (both convert to "falsy")
console.log(0 === "");     // false (number vs string — no conversion)
console.log(1 == "1");     // true  ("1" converted to 1)
console.log(1 === "1");    // false (number vs string)
```
*What just happened:* `==` quietly converted types to find a match, producing surprises like `0 == ""`
being `true`. `===` refused to convert, so a number and a string are never equal. The fix is a
habit, not a fight: **use `===` (and `!==`) everywhere.** The only people who use `==` on purpose are doing
one specific trick (checking for `null`/`undefined` together), and you can learn that later.

**`NaN` — "Not a Number," and it's contagious.** When a math operation can't produce a real number, you
get `NaN`:
```javascript runnable
console.log(Number("hello"));   // tried to make a number from non-numeric text
console.log(NaN === NaN);       // the famous one
```
```console
NaN
false
```
*What just happened:* `Number("hello")` couldn't find a number in `"hello"`, so it returned `NaN`. And
`NaN === NaN` is `false` — `NaN` is the only value in JavaScript not equal to itself, by design (it
represents "an invalid result," and two invalid results aren't meaningfully "the same"). To *check* for it,
use `Number.isNaN(x)`, never `x === NaN`.

**Floating-point money — don't store cents as decimals.** JavaScript numbers can't represent every decimal
exactly, which leads to the single most reported "JavaScript is broken" moment:
```javascript runnable
console.log(0.1 + 0.2);
console.log(0.1 + 0.2 === 0.3);
```
```console
0.30000000000000004
false
```
*What just happened:* `0.1` and `0.2` can't be stored exactly in the binary format JavaScript uses for
numbers (this is true in almost every language, not a JavaScript flaw), so their sum is a hair off `0.3`.
For money, the standard fix is to **work in the smallest unit as whole numbers** — store `$1.30` as `130`
cents, do your math on integers, and divide by 100 only when displaying. Never compare prices with `===`
on decimals.

## Recap

1. **`const` by default, `let` when you must reassign.** Avoid `var` — read it, don't write it.
2. **Primitive types:** string, number (one type for all numbers), boolean, `null` (deliberate empty),
   `undefined` (never assigned). Check with `typeof`.
3. **Template literals** (`` `${value}` ``) are the clean way to mix text and values.
4. **Dynamic typing:** a variable's type follows its current value. **Loose typing:** JavaScript
   auto-converts across types in operations — sometimes helpfully, often confusingly.
5. **Always use `===`**, check `NaN` with `Number.isNaN`, and never trust `===` on decimal money — work in
   integer cents.

Next, we move from single values to *collections* of them: lists (arrays) and labeled bundles (objects).

---

[← Phase 1: Install & Your First Program](01-install-and-first-program.md) · [Guide overview](_guide.md) · [Phase 3: Collections →](03-collections.md)
