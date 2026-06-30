---
title: "Idioms & Common Gotchas - Write It Like a Local, Dodge the Traps"
guide: "javascript-from-zero"
phase: 9
summary: "Modern JS idioms - destructuring, spread/rest, optional chaining, nullish coalescing, array methods over loops, modules over globals - plus a cheat-card for the classic traps: == vs ===, this, hoisting, NaN, floating point, shared references, and truthy/falsy surprises."
tags: [javascript, idioms, destructuring, spread, optional-chaining, gotchas, equality, this, hoisting]
difficulty: intermediate
synonyms: ["modern javascript syntax", "javascript destructuring", "spread operator javascript", "optional chaining", "nullish coalescing", "== vs === javascript", "javascript this keyword", "javascript hoisting", "why is NaN weird", "0.1 + 0.2 javascript", "javascript truthy falsy"]
updated: 2026-06-19
---

# Idioms & Common Gotchas - Write It Like a Local, Dodge the Traps

You can now write JavaScript that works. This phase is about writing it the way experienced developers do - and not falling into the handful of traps that have confused every JavaScript programmer who ever lived. (Genuinely. The ones in the cheat-card below have wasted millions of collective hours. You're about to skip that.)

Two halves: first the **idioms** - modern syntax that makes code shorter and clearer, the stuff you'll see in every codebase. Then a scannable **gotcha cheat-card** - the surprises, named before they bite, so when you hit one you'll recognize it instead of staring at the screen.

## Modern idioms - the way it's written today

### Destructuring - unpack in one line

**What it actually is.** Pulling values out of an object or array straight into named variables, instead of one assignment per field.

```javascript runnable
const user = { name: "Ada", role: "admin" };

const { name, role } = user;          // object destructuring
const [first, second] = [10, 20];     // array destructuring
console.log(name, role, first);
```
```console
Ada admin 10
```
*What just happened:* `const { name, role } = user` created two variables named after the object's keys, in one line. It's the same as `const name = user.name; const role = user.role;` but shorter and the standard way to read fields. You'll see it constantly in function parameters too: `function greet({ name }) { ... }`.

### Spread & rest - `...` does two jobs

**What it actually is.** The `...` operator either *spreads* a collection out into pieces, or *gathers* loose pieces into one - depending on where you use it.

```javascript
const a = [1, 2];
const b = [...a, 3, 4];              // spread: copy a's items into a new array
const merged = { ...user, role: "user" }; // spread: copy + override a field

function sum(...nums) {              // rest: gather all arguments into an array
  return nums.reduce((t, n) => t + n, 0);
}
console.log(b, sum(1, 2, 3));
```
```console
[ 1, 2, 3, 4 ] 6
```
*What just happened:* `[...a, 3, 4]` spread `a`'s elements into a brand-new array (a clean way to copy without mutating). `{ ...user, role: "user" }` copied `user` and overrode one field. In `sum(...nums)`, the same `...` did the opposite - *gathered* every argument into an array. Same symbol, mirror-image jobs.

### Optional chaining `?.` and nullish `??`

**What it actually is.** `?.` safely reads a property that might not exist; `??` supplies a fallback only when something is `null` or `undefined`.

```javascript runnable
const data = { user: { name: "Ada" } };

console.log(data.user?.name);        // "Ada"
console.log(data.order?.total);      // undefined - no crash
console.log(data.order?.total ?? 0); // 0 - fallback
```
*What just happened:* `data.order?.total` would normally crash (`data.order` is `undefined`, and you can't read `.total` of `undefined`) - but `?.` short-circuits to `undefined` instead of throwing. Then `?? 0` supplies a default. Together they replace whole towers of `if (data && data.order && ...)` checks.

⚠️ **Gotcha: use `??`, not `||`, for defaults - when 0 or "" are valid.** `||` falls back on *any* falsy value, so `count || 10` gives `10` even when `count` is a legitimate `0`. `??` only falls back on `null`/`undefined`, so `count ?? 10` correctly keeps the `0`. Reach for `??` whenever zero or empty-string is a real value.

### Array methods over manual loops

**What it actually is.** `map`, `filter`, `reduce`, `find`, and friends express *what* you want done to a list, rather than a manual `for` loop that spells out *how*.

```javascript runnable
const nums = [1, 2, 3, 4];
const doubled = nums.map((n) => n * 2);        // transform each
const evens = nums.filter((n) => n % 2 === 0); // keep some
const total = nums.reduce((sum, n) => sum + n, 0); // combine to one
console.log(doubled, evens, total);
```
```console
[ 2, 4, 6, 8 ] [ 2, 4 ] 10
```
*What just happened:* Each method takes a small function and applies it across the array, returning a new array (or value) without you managing an index or a counter. The code reads like a sentence - "map each to double" - and you can't fat-finger an off-by-one. This is the default style for working with lists.

### Modules over globals

**What it actually is.** Sharing code through explicit `import`/`export` (Phase 5) rather than dumping everything onto shared global variables.

A global variable is reachable - and *editable* - from anywhere, which means any file can quietly break any other. Modules make sharing intentional: a file exports exactly what it means to share, and importers state exactly what they depend on. When something changes, you can trace who's affected. *Prefer the import; avoid the global.*

> 💡 The umbrella idiom: prefer the form that makes intent explicit and prevents silent mistakes. Destructuring names what you took, `??` says exactly when to fall back, modules declare exactly what's shared. Clarity over cleverness.

## The gotcha cheat-card

> **Hit something baffling? Find the symptom here, then read the note below.** These trap *everyone* - recognizing them is the whole battle.

| The trap | What bites you | The fix |
|---|---|---|
| `==` vs `===` | `0 == ""` is `true`; `1 == "1"` is `true` | Always use `===` (and `!==`) |
| `this` binding | `this` is `undefined`/wrong inside a callback | Use arrow functions; they keep the outer `this` |
| Hoisting | A `function` works before its line; `let`/`const` don't | Declare before use; prefer `const` |
| `NaN` | `NaN === NaN` is `false` | Test with `Number.isNaN(x)` |
| Floating point | `0.1 + 0.2 !== 0.3` | Round, or compare with a tolerance |
| Shared references | Copying an object copies the *pointer*, not the data | Copy with `{ ...obj }` / `[...arr]` |
| Truthy/falsy | `if (count)` skips a real `0` | Check explicitly: `if (count > 0)` |

Now the *why* behind each.

### `==` vs `===`

`==` performs *type coercion*: it converts operands to a common type before comparing, producing famous nonsense like `0 == ""` and `false == "0"` both being `true`.

```javascript runnable
console.log(0 == "");      // true  (coerced - surprising)
console.log(0 === "");     // false (no coercion - sane)
```
*What just happened:* `==` quietly converted both sides until they matched; `===` compared type *and* value, so a number and a string are never equal. **Always use `===`.** It has no surprises, and ESLint will nag you if you slip.

### `this` binding

`this` doesn't mean "the current object" the way it does in some languages - it depends on *how a function is called*, and inside a plain-function callback it often isn't what you expect.

```javascript
const counter = {
  count: 0,
  startBroken() {
    setTimeout(function () { this.count++; }, 100); // `this` is NOT counter
  },
  startFixed() {
    setTimeout(() => { this.count++; }, 100);        // arrow keeps outer `this`
  },
};
```
*What just happened:* In `startBroken`, the plain `function` callback got its own `this` (not `counter`), so `this.count++` fails silently. The **arrow function** in `startFixed` doesn't have its own `this` - it borrows the surrounding one, which *is* `counter`. Rule of thumb: use arrow functions for callbacks and the problem mostly disappears.

### Hoisting

`function` declarations are *hoisted* - moved to the top of their scope - so they work before the line they're written on. `let` and `const` are not usable before their declaration.

```javascript runnable
greet();                       // works - function declarations are hoisted
function greet() { console.log("hi"); }

console.log(x);                // ReferenceError - can't use before declaration
const x = 5;
```
*What just happened:* `greet` ran before its definition because function declarations are pulled up. `const x` was *not* usable early - it throws until its line runs. The clean habit: **declare things before you use them** and you never have to think about hoisting.

### `NaN`

`NaN` ("Not a Number") is the result of invalid math, and it's the only value in JavaScript not equal to itself.

```javascript runnable
const result = Number("abc"); // NaN
console.log(result === NaN);       // false (!)
console.log(Number.isNaN(result)); // true
```
*What just happened:* `NaN === NaN` is `false` by design, so the obvious check silently fails. Use `Number.isNaN(x)` to test for it. Seeing `NaN` in your output usually means a string-to-number conversion went wrong upstream.

### Floating point

Numbers are stored in binary floating point, which can't represent some decimals exactly - so arithmetic has tiny rounding errors.

```javascript runnable
console.log(0.1 + 0.2);            // 0.30000000000000004
console.log(0.1 + 0.2 === 0.3);    // false
```
*What just happened:* `0.1` and `0.2` have no exact binary form, so their sum is a hair off. This isn't a JavaScript bug - it's how floating point works in nearly every language. For money, work in integer cents; for comparisons, round or check `Math.abs(a - b) < 0.0001`.

### Shared references

Objects and arrays are held by *reference*. Assigning one to a new variable doesn't copy the data - both names point at the *same* object, so a change through one is visible through the other.

```javascript runnable
const a = { count: 1 };
const b = a;        // NOT a copy - same object
b.count = 99;
console.log(a.count); // 99 - `a` changed too
```
*What just happened:* `b = a` copied the *reference*, not the contents, so mutating through `b` mutated the one shared object. To get an independent copy, spread it: `const b = { ...a }`. This is behind countless "why did my other variable change?!" bugs.

### Truthy / falsy

In a condition, non-boolean values are coerced to true/false. The falsy values are: `false`, `0`, `""`, `null`, `undefined`, and `NaN`. Everything else is truthy.

```javascript runnable
const count = 0;
if (count) console.log("has items");  // never runs - 0 is falsy!
if (count > 0) console.log("has items"); // correct
```
*What just happened:* `if (count)` treated a real `0` as false and skipped the block - a classic bug when `0` is a valid value. When you mean "exists," check explicitly (`count > 0`, `value != null`) rather than relying on truthiness.

## Recap

1. **Idioms:** destructuring unpacks, `...` spreads/gathers, `?.` reads safely, `??` defaults on null/undefined, array methods beat manual loops, modules beat globals.
2. **Always `===`** - `==` coerces types and lies.
3. **`this`** depends on how a function is called; **arrow functions** keep the outer `this`.
4. **`NaN` isn't equal to itself** (`Number.isNaN`); **floats are imprecise** (`0.1 + 0.2`); **objects copy by reference** (spread to clone).
5. **Truthy/falsy** treats `0` and `""` as false - check existence explicitly when they're valid values.

---

[← Phase 8: The Ecosystem & Tooling](08-ecosystem-and-tooling.md) · [Guide overview](_guide.md) · [Phase 10: Scope, Closures & Hoisting →](10-scope-and-closures.md)
