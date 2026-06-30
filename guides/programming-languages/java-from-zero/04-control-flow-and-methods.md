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

So far your programs have run in a straight line: top to bottom, every statement once. Real programs don't
work that way. They make decisions ("if the user is logged in, show the dashboard"), they repeat work
("for every order, send a receipt"), and they bundle logic into named pieces you can call again and again.
Those three ideas - branching, looping, and methods - are the joints that let a program bend.

The mental model for this whole phase: **control flow is about choosing which statements run and how
often, and methods are about giving a chunk of those statements a name so you can reuse it.** Everything
below is a variation on those two themes. Get them, and you can read the shape of almost any Java program.

## `if` / `else` - making a decision

The most basic branch. You give Java a **boolean expression** - something that evaluates to `true` or
`false` - and it picks a path.

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
condition was `true`. `temperature > 25` is `30 > 25`, which is `true`, so it printed `Warm` and skipped
the rest entirely - once a branch wins, the others don't even get evaluated. The parentheses around the
condition are required in Java (unlike Python), and the braces `{ }` group the statements that belong to
each branch.

The conditions themselves are boolean expressions. You build them with comparison operators (`>`, `<`,
`>=`, `<=`, `==`, `!=`) and combine them with `&&` (and), `||` (or), and `!` (not):

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
*What just happened:* `loggedIn && age >= 18` is `true && (20 >= 18)`, which is `true && true`, so the
block ran. The `&&` operator is **short-circuiting**: if the left side were `false`, Java wouldn't bother
checking the right side at all, because the whole thing can't be `true` anymore. That's not just a speed
trick - it lets you write guards like `if (user != null && user.isActive())` where the second check is
only safe *because* the first one passed.

💡 **Key point.** Keep conditions explicit and readable. `if (count > 0)` says exactly what it means.
Resist the urge to be clever with nested ternaries or stacked negations - code is read far more often than
it's written, and a clear `if` is a gift to whoever debugs this at 2 a.m. (often future you).

## `switch` - one value, many cases

When you're checking a *single* value against many possible matches, a tall stack of `else if` gets noisy.
`switch` is built for exactly that. Java has two forms, and the difference matters.

### The classic `switch` statement

The old form has a sharp edge you need to know about. Here it is, done correctly:

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
*What just happened:* `switch (day)` jumped to the `case` that matched `day` (which was `3`), set `name`
to `"Wednesday"`, and then `break` stopped it. `default` is the catch-all when nothing matches. The thing
to burn into memory is that `break`.

⚠️ **Gotcha - fall-through.** In the classic `switch`, execution does **not** stop at the end of a `case`.
It keeps running straight into the next `case` until it hits a `break` (or the end of the switch). Forget
a `break` and you get a bug that's hard to spot:

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
*What just happened:* `day` was `1`, so it matched `case 1` and printed `"Monday"`. But there was no
`break`, so execution **fell through** into `case 2` and printed `"Tuesday"` too - even though `day`
isn't `2`. This is the single most common `switch` mistake, and it's exactly why the modern form exists.
(Fall-through is occasionally useful when you *want* several cases to share code, but it's a deliberate,
documented choice - never an accident.)

### The modern `switch` expression

Newer Java (14+) gives you a `switch` *expression* with arrow syntax. It returns a value, never falls
through, and reads cleanly:

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
*What just happened:* The whole `switch (...) { ... }` *evaluated to a value* that we assigned straight
into `name` - notice the `=` before it and the `;` after the closing brace. Each `case ... ->` runs only
its own branch with no fall-through, so there's no `break` to forget. You can list several values in one
case (`case 1, 2, 3 -> ...`), and the compiler will even warn you if you miss a possible value in some
situations. It's the same idea as the classic form, minus the footgun.

💡 **Key point.** Reach for the **switch expression** (`->`) by default in modern Java. It's safer (no
fall-through), more concise, and it produces a value you can assign or return directly. Keep the classic
statement form only when you're maintaining older code or genuinely need fall-through behavior.

## Loops - repeating work

Three loop shapes cover almost everything. They differ in *when* you know how many times to repeat.

**`for`** - when you're counting, or you know the number of iterations up front:

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
*What just happened:* The `for` header has three parts separated by semicolons: **init** (`int i = 0`,
runs once at the start), **condition** (`i < 3`, checked before every pass - keep going while it's
`true`), and **update** (`i++`, runs after each pass; `i++` means "add one to `i`"). So `i` walked through
`0`, `1`, `2` and the loop stopped the moment `i` reached `3`.

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
long as it held. Each pass printed `countdown` and then `countdown--` subtracted one. When `countdown` hit
`0`, the condition became `false` and the loop ended. ⚠️ If you forget the `countdown--`, the condition
never changes and you get an **infinite loop** - the classic "why is my program frozen?" bug.

**Enhanced `for` (for-each)** - when you just want to visit every element of a collection or array,
without caring about index numbers:

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
*What just happened:* `for (String name : names)` reads as "for each `name` in `names`." On every pass,
`name` is bound to the next element, in order, until the list runs out. There's no index, no `i++`, no
off-by-one risk - which is exactly why you should prefer it whenever you don't actually need the index.
(`List.of(...)` came from [Phase 3](03-collections.md).)

💡 **Key point.** Pick the loop that says what you mean: **for-each** when you're walking a collection,
**`for`** when you're counting or need the index, **`while`** when you're looping until a condition
changes. The right choice makes the loop's intent obvious at a glance.

## Methods - naming reusable logic

Once you've written the same handful of statements twice, it's time for a method.

📝 **Method** - a named, reusable block of logic. It has a **return type** (what kind of value it hands
back, or `void` for nothing), a **name**, a list of **parameters** (the inputs it accepts), and a body. An
**access modifier** like `public` or `private` controls who's allowed to call it. You "call" a method by
its name to run its body.

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
*What just happened:* `public static int add(int a, int b)` declares a method named `add` that takes two
`int` parameters and **returns** an `int`. Inside `main`, `add(3, 4)` called it with the arguments `3` and
`4`, which became `a` and `b`; `return a + b` handed back `7`, and we stored it in `sum`. The return type
comes *first* in Java (`int add(...)`), unlike Go where it comes last - a small thing that trips up people
switching between the two.

You've been staring at one keyword on every method so far: **`static`**. Here's just enough to read it.

📝 **`static` vs instance.** A `static` method belongs to the **class itself** - you call it without
creating an object (`Calculator.add(3, 4)`). A non-static (**instance**) method belongs to an individual
**object** built from the class, and you call it on that object. We use `static` heavily right now because
we haven't built objects yet - that's all of [Phase 5](05-classes-and-objects.md). For now, `static` is
why `main` can run before any object exists, and why these helper methods sit right alongside it.

💡 **Key point.** A good method does **one thing** and has a name that says what that thing is. If you're
struggling to name a method, that's often a signal it's doing too much - split it. Methods are how a
program stays readable as it grows from 20 lines to 20,000.

## Method overloading - same name, different parameters

Sometimes you want one logical operation that works on different inputs. Java lets you give several methods
the **same name** as long as their **parameter lists differ** - different types, or a different number of
parameters. This is **overloading**.

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
*What just happened:* All three methods are named `show`, but each takes a different parameter list. When
we called `show(42)`, the compiler matched the `int` argument to `show(int x)`. `show("hello")` matched
the `String` version, and `show(1, 2)` matched the two-parameter one. One name, three behaviors, chosen by
what you pass in - which is why you don't need `showInt`, `showString`, and `showTwoInts`.

💡 **Resolved at compile time.** The compiler picks the overload by inspecting the argument types *while
it compiles*, not while the program runs. The choice is baked in before your code ever executes. That's a
real distinction from the next concept, and worth holding onto.

⚠️ **Don't confuse overloading with overriding.** They sound alike but are opposites in spirit.
**Overloading** is *same name, different parameters, picked at compile time* - what you just saw.
**Overriding** is when a subclass *replaces* a method it inherited (same name, same parameters), and which
version runs is decided *at runtime* based on the actual object. Overriding needs inheritance, which we
haven't met yet - it lands in [Phase 6](06-inheritance-and-interfaces.md). For now: different parameters =
overloading; you'll meet its cousin later.

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

Next, we stop writing everything as `static` helpers and start building the real thing Java is named for:
**classes and objects** - your own types, with their own data and behavior.

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
