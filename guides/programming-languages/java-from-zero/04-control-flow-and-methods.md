---
title: "Control Flow & Methods - Decisions, Loops & Reusable Logic"
guide: "java-from-zero"
phase: 4
summary: "How Java branches with if/else and switch, repeats with for/while/for-each, and packages logic into methods - plus method overloading and why the compiler picks the right one."
tags: [java, control-flow, if, switch, loops, methods, overloading]
difficulty: beginner
synonyms: ["java if else switch", "java switch expression", "java for while loop", "java enhanced for loop", "java methods explained", "java method overloading", "java return type"]
updated: 2026-06-22
---

# Control Flow & Methods - Decisions, Loops & Reusable Logic

So far your programs have run in a straight line: top to bottom, every statement once. Real programs make
decisions ("if logged in, show the dashboard"), repeat work ("for every order, send a receipt"), and bundle
logic into named pieces you can call again and again. Branching, looping, and methods are the joints that
let a program bend.

The mental model for this phase: **control flow is about choosing which statements run and how often, and
methods are about naming a chunk of statements so you can reuse it.** Everything below is a variation on
those two themes.

## `if` / `else` - making a decision

The most basic branch: give Java a **boolean expression** - something evaluating to `true` or `false` - and
it picks a path.

```java
int temperature = 30;

if (temperature > 25) {
    System.out.println("Warm");
} else if (temperature > 10) {
    System.out.println("Mild");
} else {
    System.out.println("Cold");
}
```
```console
Warm
```
*What just happened:* Java checked the conditions top to bottom and ran the **first** block whose
condition was `true`. `temperature > 25` is `30 > 25`, `true`, so it printed `Warm` and skipped the rest
entirely - once a branch wins, the others aren't even evaluated. Parentheses around the condition are
required in Java (unlike Python), and braces `{ }` group each branch's statements.

Conditions are boolean expressions, built with comparison operators (`>`, `<`, `>=`, `<=`, `==`, `!=`) and
combined with `&&` (and), `||` (or), and `!` (not):

```java
boolean loggedIn = true;
int age = 20;

if (loggedIn && age >= 18) {
    System.out.println("Access granted");
}
```
```console
Access granted
```
*What just happened:* `loggedIn && age >= 18` is `true && (20 >= 18)`, i.e. `true && true`, so the block
ran. `&&` is **short-circuiting**: if the left side were `false`, Java wouldn't check the right side at all,
since the whole thing can't be `true` anymore. That's not just a speed trick - it lets you write guards like
`if (user != null && user.isActive())` where the second check is only safe *because* the first passed.

💡 **Key point.** Keep conditions explicit and readable. `if (count > 0)` says exactly what it means.
Resist nested ternaries or stacked negations - code is read far more than it's written, and a clear `if` is
a gift to whoever debugs this at 2 a.m.

## `switch` - one value, many cases

When checking a *single* value against many possible matches, a tall stack of `else if` gets noisy.
`switch` is built for that. Java has two forms, and the difference matters.

### The classic `switch` statement

The old form has a sharp edge worth knowing. Here it is, done correctly:

```java
int day = 3;
String name;

switch (day) {
    case 1:
        name = "Monday";
        break;
    case 2:
        name = "Tuesday";
        break;
    case 3:
        name = "Wednesday";
        break;
    default:
        name = "Unknown";
}

System.out.println(name);
```
```console
Wednesday
```
*What just happened:* `switch (day)` jumped to the `case` matching `day` (`3`), set `name` to `"Wednesday"`,
and `break` stopped it. `default` is the catch-all when nothing matches. Burn that `break` into memory.

⚠️ **Gotcha - fall-through.** In the classic `switch`, execution does **not** stop at the end of a `case`.
It runs straight into the next `case` until it hits a `break` (or the end of the switch). Forget a `break`
and you get a bug that's hard to spot:

```java
int day = 1;
switch (day) {
    case 1:
        System.out.println("Monday");
        // no break - execution falls through!
    case 2:
        System.out.println("Tuesday");
        break;
}
```
```console
Monday
Tuesday
```
*What just happened:* `day` was `1`, so it matched `case 1` and printed `"Monday"`. No `break`, so
execution **fell through** into `case 2` and printed `"Tuesday"` too - even though `day` isn't `2`. The
single most common `switch` mistake, and exactly why the modern form exists. (Fall-through is occasionally
useful when several cases *should* share code, but that's a deliberate, documented choice - never an
accident.)

### The modern `switch` expression

Newer Java (14+) gives you a `switch` *expression* with arrow syntax: it returns a value, never falls
through, and reads cleanly.

```java
int day = 3;

String name = switch (day) {
    case 1 -> "Monday";
    case 2 -> "Tuesday";
    case 3 -> "Wednesday";
    default -> "Unknown";
};

System.out.println(name);
```
```console
Wednesday
```
*What just happened:* The whole `switch (...) { ... }` *evaluated to a value* assigned straight into `name`
- notice the `=` before it and `;` after the closing brace. Each `case ... ->` runs only its own branch
with no fall-through, so there's no `break` to forget. You can list several values in one case
(`case 1, 2, 3 -> ...`), and the compiler can even warn you if you miss a possible value. Same idea as the
classic form, minus the footgun.

💡 **Key point.** Reach for the **switch expression** (`->`) by default in modern Java: safer (no
fall-through), more concise, and it produces a value you can assign or return directly. Keep the classic
form only for older code or genuine fall-through needs.

## Loops - repeating work

Three loop shapes cover almost everything, differing in *when* you know how many times to repeat.

**`for`** - when you're counting, or you know the iteration count up front:

```java
for (int i = 0; i < 3; i++) {
    System.out.println("Pass " + i);
}
```
```console
Pass 0
Pass 1
Pass 2
```
*What just happened:* The `for` header has three parts: **init** (`int i = 0`, runs once), **condition**
(`i < 3`, checked before every pass), and **update** (`i++`, adds one to `i` after each pass). `i` walked
through `0`, `1`, `2`, and the loop stopped the moment `i` reached `3`.

**`while`** - when you repeat until some condition flips, and you don't know the count ahead of time:

```java
int countdown = 3;
while (countdown > 0) {
    System.out.println(countdown);
    countdown--;
}
```
```console
3
2
1
```
*What just happened:* `while (countdown > 0)` checked the condition before each pass and ran the body as
long as it held. Each pass printed `countdown`, then `countdown--` subtracted one. When `countdown` hit `0`,
the condition became `false` and the loop ended. ⚠️ Forget the `countdown--` and the condition never
changes - an **infinite loop**, the classic "why is my program frozen?" bug.

**Enhanced `for` (for-each)** - to visit every element of a collection or array without caring about index
numbers:

```java
List<String> names = List.of("Ada", "Linus", "Grace");

for (String name : names) {
    System.out.println(name);
}
```
```console
Ada
Linus
Grace
```
*What just happened:* `for (String name : names)` reads as "for each `name` in `names`." Each pass binds
`name` to the next element, in order, until the list runs out - no index, no `i++`, no off-by-one risk.
Prefer it whenever you don't need the index. (`List.of(...)` came from [Phase 3](03-collections.md).)

💡 **Key point.** Pick the loop that says what you mean: **for-each** to walk a collection, **`for`** to
count or need the index, **`while`** to loop until a condition changes.

## Methods - naming reusable logic

Once you've written the same handful of statements twice, it's time for a method.

📝 **Method** - a named, reusable block of logic with a **return type** (what it hands back, or `void` for
nothing), a **name**, a list of **parameters** (its inputs), and a body. An **access modifier** like
`public` or `private` controls who's allowed to call it. You "call" a method by its name to run its body.

```java
public class Calculator {

    // a method: returns an int, named add, takes two int parameters
    public static int add(int a, int b) {
        return a + b;
    }

    public static void main(String[] args) {
        int sum = add(3, 4);
        System.out.println(sum);
    }
}
```
```console
7
```
*What just happened:* `public static int add(int a, int b)` declares a method named `add` taking two `int`
parameters and **returning** an `int`. Inside `main`, `add(3, 4)` called it with `3` and `4`, which became
`a` and `b`; `return a + b` handed back `7`, stored in `sum`. The return type comes *first* in Java
(`int add(...)`), unlike Go where it comes last.

You've been staring at one keyword on every method so far: **`static`**. Just enough to read it.

📝 **`static` vs instance.** A `static` method belongs to the **class itself** - call it without creating an
object (`Calculator.add(3, 4)`). A non-static (**instance**) method belongs to an individual **object**. We
lean on `static` heavily now since we haven't built objects yet - that's all of
[Phase 5](05-classes-and-objects.md). For now, `static` is why `main` can run before any object exists.

💡 **Key point.** A good method does **one thing** and has a name that says what that thing is. Struggling
to name it often signals it's doing too much - split it.

## Method overloading - same name, different parameters

Sometimes you want one logical operation that works on different inputs. Java lets you give several methods
the **same name** as long as their **parameter lists differ** - different types, or a different count. This
is **overloading**.

📝 **Overloading** - defining multiple methods with the same name but distinct parameter lists. The
compiler decides which one to call by looking at the *types and number of arguments* at the call site.

```java
public class Printer {

    public static void show(int x) {
        System.out.println("int: " + x);
    }

    public static void show(String x) {
        System.out.println("String: " + x);
    }

    public static void show(int x, int y) {
        System.out.println("two ints: " + x + ", " + y);
    }

    public static void main(String[] args) {
        show(42);
        show("hello");
        show(1, 2);
    }
}
```
```console
int: 42
String: hello
two ints: 1, 2
```
*What just happened:* All three methods are named `show`, but each takes a different parameter list.
`show(42)` matched `show(int x)`; `show("hello")` matched the `String` version; `show(1, 2)` matched the
two-parameter one. One name, three behaviors, chosen by what you pass in - no need for `showInt`,
`showString`, `showTwoInts`.

💡 **Resolved at compile time.** The compiler picks the overload by inspecting argument types *while it
compiles*, baked in before your code runs - a real distinction from the next concept.

⚠️ **Don't confuse overloading with overriding.** They sound alike but are opposites. **Overloading** is
*same name, different parameters, picked at compile time*. **Overriding** is when a subclass *replaces* an
inherited method (same name, same parameters), decided *at runtime* by the actual object - needs
inheritance, met in [Phase 6](06-inheritance-and-interfaces.md).

## Recap

1. **`if` / `else`** branches on a **boolean expression** and runs the first matching block; build
   conditions with `>`, `==`, `&&`, `||`, `!`, and lean on short-circuiting for safe guards.
2. **`switch`** matches one value against many cases. ⚠️ The classic statement **falls through** without
   `break`; prefer the modern **switch expression** (`->`), which returns a value and never falls through.
3. **Loops** come in three shapes: **`for`** for counting, **`while`** for looping until a condition flips,
   and the **enhanced for-each** for walking a collection without an index.
4. A **method** packages reusable logic with a **return type**, a name, **parameters**, and an access
   modifier; **`static`** methods belong to the class (no object needed), which is why `main` is static.
5. **Overloading** gives one name several parameter lists, and the **compiler** picks the right one by
   argument types - distinct from **overriding** (a runtime, inheritance concept coming in Phase 6).

Next: we stop writing everything as `static` helpers and build the real thing Java is named for -
**classes and objects**, your own types with their own data and behavior.

## Quick check

Test yourself on the ideas most likely to bite - fall-through, loop choice, and overloading:

```quiz
[
  {
    "q": "In a classic `switch` statement, what happens if a matching `case` has no `break`?",
    "choices": [
      "Execution falls through and runs the following case(s) until it hits a break or the end",
      "Java throws a compile error demanding a break",
      "Only that case runs, then the switch ends automatically",
      "The default case runs instead"
    ],
    "answer": 0,
    "explain": "Without `break`, execution falls through into the next case and keeps going. This is the most common switch bug, and exactly why the modern switch expression (with `->` arrows) never falls through."
  },
  {
    "q": "You want to visit every element of a `List<String>` and don't need the index. Which loop fits best?",
    "choices": [
      "The enhanced for-each: `for (String s : list)`",
      "A `while` loop with a manual counter",
      "A classic `for` loop with `i++`",
      "A `switch` statement"
    ],
    "answer": 0,
    "explain": "The for-each loop binds each element in turn with no index, no `i++`, and no off-by-one risk. Use a classic `for` only when you actually need the index."
  },
  {
    "q": "Given `show(int x)` and `show(String x)`, how does Java decide which `show` runs when you call `show(42)`?",
    "choices": [
      "The compiler picks the `int` version based on the argument type, at compile time",
      "The JVM picks one at random at runtime",
      "It always calls the first method declared",
      "It calls both versions in order"
    ],
    "answer": 0,
    "explain": "This is overloading: the compiler resolves which overload to call by inspecting the argument types while it compiles. `42` is an int, so `show(int x)` is chosen - the decision is made before the program runs."
  }
]
```

---

[← Phase 3: Collections](03-collections.md) · [Guide overview](_guide.md) · [Phase 5: Classes & Objects →](05-classes-and-objects.md)
