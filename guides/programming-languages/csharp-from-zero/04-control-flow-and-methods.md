---
title: "Control Flow & Methods - Decisions, Loops & Reusable Logic"
guide: "csharp-from-zero"
phase: 4
summary: "Branch with if and switch (statement and expression), loop with for/while/do-while/foreach, and package logic into methods - with optional, named, ref/out parameters and overloading explained from scratch."
tags: [csharp, control-flow, if, switch, switch-expression, loops, methods, overloading]
difficulty: beginner
synonyms: ["c# if else switch", "c# switch expression", "c# for foreach while loop", "c# methods explained", "c# method overloading", "c# optional parameters", "c# ref out parameters"]
updated: 2026-06-22
---

# Control Flow & Methods - Decisions, Loops & Reusable Logic

So far your programs run top to bottom. Real programs do three things straight-line code can't: **decide** (do this, but only if that's true), **repeat** (do this for every item), and **organize** logic into named, reusable pieces you call instead of copy-pasting. This phase is all three.

The mental model: control flow is about *choosing which lines run*, methods about *giving a chunk of lines a name so you can run it from anywhere*. C# has a slightly larger toolbox here than some languages - two flavors of `switch`, four loop keywords - each fitting a specific shape of problem. We'll focus on *when* to reach for each, not just *how*.

## `if` / `else` - the basic decision

The `if` statement runs a block only when a condition is true - any expression evaluating to a `bool` (a `true`/`false` value from [Phase 2](02-syntax-values-and-types.md)).

```csharp
int age = 20;

if (age >= 18)
{
    Console.WriteLine("adult");
}
else
{
    Console.WriteLine("minor");
}
```
```console
adult
```
*What just happened:* `age >= 18` evaluated to `true`, so the first block ran and printed `adult`; a `false` would have run `else` instead. C# *requires* parentheses around the condition. The braces `{ }`, optional for a single statement, are worth always keeping - they prevent "I added a second line and it silently ran every time" bugs.

For chains of conditions, stack `else if`:

```csharp
int score = 73;

if (score >= 90)
{
    Console.WriteLine("A");
}
else if (score >= 80)
{
    Console.WriteLine("B");
}
else if (score >= 70)
{
    Console.WriteLine("C");
}
else
{
    Console.WriteLine("needs work");
}
```
```console
C
```
*What just happened:* C# checked each condition top to bottom and ran the **first** true one (`score >= 70`), then skipped the rest. `90` and `80` failed, `70` matched, giving `C`. `else` is the catch-all when nothing matched. Boolean expressions combine with `&&` (and), `||` (or), `!` (not) - `if (age >= 18 && hasTicket)` runs only when *both* are true.

💡 **Key point.** A long `else if` ladder comparing *one variable* against several values is exactly what `switch` was built for.

## `switch` - comparing one value against many

Testing a single value against a list of possibilities makes a tower of `else if` noisy. `switch` flattens it.

### The classic `switch` statement

```csharp
string day = "Sat";

switch (day)
{
    case "Sat":
    case "Sun":
        Console.WriteLine("weekend");
        break;
    case "Fri":
        Console.WriteLine("almost there");
        break;
    default:
        Console.WriteLine("weekday");
        break;
}
```
```console
weekend
```
*What just happened:* `switch (day)` compared `day` against each `case` label, matched `"Sat"`, and printed `weekend`. `default` is the catch-all, like the final `else`. Stacking `case "Sat":` and `case "Sun":` with no code between them means "either matches the same block" - that's how you group values.

⚠️ **Gotcha (the good kind) - C# forbids implicit fall-through.** Notice every case ends in `break`. In C and older Java/JavaScript, forgetting that `break` lets execution silently "fall through" into the *next* case - a notorious bug source. **C# won't compile a non-empty case that doesn't explicitly end** (`break`, `return`, etc.), so that bug cannot happen. (Grouping empty cases like `case "Sat": case "Sun":` is still allowed - shared labels, not fall-through.)

### The modern `switch` *expression*

The statement above *does* something (prints). Often you want to *produce a value* from the input instead - the **switch expression** (C# 8+) does that, more compactly:

```csharp
string day = "Sat";

string kind = day switch
{
    "Sat" or "Sun" => "weekend",
    "Fri"          => "almost there",
    _              => "weekday",
};

Console.WriteLine(kind);
```
```console
weekend
```
*What just happened:* This is a `switch` written as an **expression** - it evaluates to a value, stored here in `kind`. The shape is `value switch { pattern => result, ... }`; each arm uses `=>` ("goes to") to map a pattern to a result. `"Sat" or "Sun"` matches either; `_` (discard) is the catch-all. No `break`, no `case`/`:` ceremony - the whole construct *is* one value.

📝 **Statement vs. expression.** A *statement* performs an action (no value); an *expression* evaluates to a value you can assign, return, or pass along. The classic `switch` is a statement; `x switch { ... }` is an expression - reach for it when every branch's job is "produce this value."

That `"Sat" or "Sun"` syntax is a taste of **pattern matching** - switch expressions can also match on types, ranges, and property values. Deep dive in [Phase 13](13-records-and-modern-csharp.md); for now, matching constant values covers most everyday use.

## Loops - doing something repeatedly

C# has four looping keywords. They overlap, but each has a sweet spot: know *how many times* up front, loop *until a condition changes*, or walk *every item in a collection*?

### `for` - when you're counting

Use `for` when you know the count or need the index - it bundles three parts into one line.

```csharp
for (int i = 0; i < 3; i++)
{
    Console.WriteLine(i);
}
```
```console
0
1
2
```
*What just happened:* The `for` header has three semicolon-separated parts: **init** (`int i = 0`, runs once), **condition** (`i < 3`, checked before each pass), and **post** (`i++`, "add one to `i`", runs after each pass). It printed `0`, `1`, `2` and stopped once `i` reached `3`. `i` exists only inside the loop.

### `while` - when you loop until something changes

Use `while` when repetitions depend on a condition, not a count. The condition is checked *before* each pass, so the body might run zero times.

```csharp
int n = 3;

while (n > 0)
{
    Console.WriteLine(n);
    n--;
}
```
```console
3
2
1
```
*What just happened:* `while (n > 0)` checked the condition first, ran the body while it held, and stopped when `n` hit `0`. (`n--` subtracts one from `n`.) Had `n` started at `0`, the body would never run - the check happens up front. ⚠️ Make sure something inside the loop changes the condition, or you've written an infinite loop.

### `do-while` - when you must run at least once

`do-while` is `while`'s twin, but checks the condition *after* the body, so it always runs at least once - the right tool for "prompt the user, then re-prompt if invalid."

```csharp
int countdown = 0;

do
{
    Console.WriteLine($"value is {countdown}");
    countdown--;
}
while (countdown > 0);
```
```console
value is 0
```
*What just happened:* Even though `countdown > 0` was already false, the body ran **once** before the check happened - the whole point of `do-while`. After printing, the condition tested false and the loop ended. A `while` loop here would have printed nothing.

### `foreach` - the workhorse for collections

Most real loops walk every item in a collection. `foreach` does that directly - no index bookkeeping, no off-by-one risk. This is how you iterate the collections from [Phase 3](03-collections.md).

```csharp
string[] names = { "Ada", "Linus", "Grace" };

foreach (string name in names)
{
    Console.WriteLine($"Hello, {name}!");
}
```
```console
Hello, Ada!
Hello, Linus!
Hello, Grace!
```
*What just happened:* `foreach (string name in names)` handed us each element in turn, binding it to `name`. No counter, no `names[i]`, no running past the end - `foreach` knows when the collection is exhausted and stops. This is the loop you'll write most often.

💡 **Key point - which loop when?** `for` for index or known count, `while` until a condition flips, `do-while` when the body must run at least once, `foreach` for "do this to every item" - most of the time. When in doubt over a collection, reach for `foreach` first.

## Methods - naming reusable logic

📝 **Method** - a named, reusable block of code that takes inputs (**parameters**) and optionally hands back an output (**return value**), so you can call it from anywhere instead of copying it. (In C#, all code lives inside methods, which live inside classes - see [Phase 5](05-classes-and-objects.md).)

Here's a method that adds two numbers:

```csharp
static int Add(int a, int b)
{
    return a + b;
}

Console.WriteLine(Add(3, 4));
```
```console
7
```
*What just happened:* The signature `static int Add(int a, int b)` reads piece by piece: `static` (more in a second), `int` is the **return type**, `Add` is the name, `(int a, int b)` are two `int` **parameters**. `return a + b` computes the sum and hands it back. The call `Add(3, 4)` passed `3` and `4` as **arguments**, got `7` back, and printed it. A method returning nothing uses `void`.

**Expression-bodied members.** When a method is just a single expression, `=> ` (same arrow as the switch expression) trims the braces and `return`:

```csharp
static int Add(int a, int b) => a + b;
static int Square(int x) => x * x;

Console.WriteLine(Square(5));
```
```console
25
```
*What just happened:* `=> a + b` means "this method returns `a + b`" - exactly equivalent to `{ return a + b; }`, just shorter. Use it for one-liners; keep braces for anything multi-step. This `=>`, the one in switch expressions, and lambdas (later) all share the "goes to / produces" meaning.

**`static` vs. instance - just enough for now.** A `static` method belongs to the class itself, called without creating an object (`Add(3, 4)`). An **instance** method belongs to a specific object, called through it (`myList.Add(x)`). Your entry point is `static void Main(...)` because the runtime calls it *before any object exists*. Full story in [Phase 5](05-classes-and-objects.md); for now: `static` = "call it on the type, no object needed."

## Parameters: optional, named, and `ref`/`out`

Plain parameters are just the start. C# offers several ways to make calls clearer and more flexible.

**Optional parameters** have a default value, so callers can skip them:

```csharp
static string Greet(string name, string greeting = "Hello")
{
    return $"{greeting}, {name}!";
}

Console.WriteLine(Greet("Ada"));                       // uses the default
Console.WriteLine(Greet("Linus", "Welcome"));          // overrides it
Console.WriteLine(Greet("Grace", greeting: "Hi"));     // named argument
```
```console
Hello, Ada!
Welcome, Linus!
Hi, Grace!
```
*What just happened:* `greeting = "Hello"` makes that parameter **optional** - call `Greet("Ada")` and it fills in `"Hello"`. The third call uses a **named argument** (`greeting: "Hi"`), labeling the argument by its parameter name - self-documenting, and lets you skip optional parameters you don't care about. Optional parameters must come *after* all required ones.

**`out` parameters - the "try" pattern you'll meet immediately.** Sometimes a method needs to hand back *more than one thing*: a result *and* whether it succeeded. `out` lets a parameter carry a value *out*, in addition to the return value - as in `int.TryParse`, which safely converts text to a number:

```csharp
string input = "42";

if (int.TryParse(input, out int number))
{
    Console.WriteLine($"Parsed: {number + 1}");
}
else
{
    Console.WriteLine("Not a valid number");
}
```
```console
Parsed: 43
```
*What just happened:* `int.TryParse` returns a `bool` (did it work?) *and* writes the parsed value into the `out` parameter. `out int number` declares `number` right inside the call; if parsing succeeds, `TryParse` fills it in and returns `true`. If `input` were `"banana"`, it would return `false` (no crash) and we'd hit `else`. This `bool` + `out` shape - also used by `Dictionary.TryGetValue` - is *the* idiomatic C# way to do "give me the value if it exists, but don't blow up if it doesn't."

📝 **`out` vs. `ref`.** `out` means "the method *will* assign this - its incoming value is ignored." `ref` means "the method can *read and modify* this existing variable in place." Both pass the variable itself, so changes are visible to the caller. `out` (the `Try` pattern) is common; `ref` is rarer, for methods that need to both see and update a caller's variable.

**Overloading - same name, different parameters.** Several methods can share a name as long as their parameter lists differ. C# picks the right one at compile time based on the arguments:

```csharp
static int Multiply(int a, int b) => a * b;
static double Multiply(double a, double b) => a * b;
static int Multiply(int a, int b, int c) => a * b * c;

Console.WriteLine(Multiply(3, 4));         // matches (int, int)
Console.WriteLine(Multiply(2.5, 2.0));     // matches (double, double)
Console.WriteLine(Multiply(2, 3, 4));      // matches (int, int, int)
```
```console
12
5
24
```
*What just happened:* Three methods named `Multiply`, distinguished by parameters - **overloading**. The compiler matched each call to the overload whose parameter types fit: `(3, 4)` to `(int, int)`, `(2.5, 2.0)` to `double`, the three-argument call to its own overload. This is **compile-time resolution**, based on argument types - why `Console.WriteLine` accepts a string, an int, a bool, and more: one name, many overloads.

## Recap

1. **`if` / `else`** runs a block based on a `bool` condition; `else if` chains check top to bottom and run the first match. Combine conditions with `&&`, `||`, `!`.
2. **`switch`** compares one value against many. The classic statement needs `break` on every case - ⚠️ C# *forbids* implicit fall-through, killing a classic bug. The modern **switch expression** (`x switch { v => result, _ => ... }`) returns a value, no `break` needed.
3. **Four loops:** `for` (counting / index), `while` (loop until a condition flips, checked first), `do-while` (runs at least once, checked after), and `foreach` (every item in a collection - the everyday workhorse).
4. **Methods** name reusable logic: `static returnType Name(params)`. Expression-bodied `=> ...` is shorthand for a one-line body; `static` means "call on the type, no object needed."
5. **Parameters** can be **optional** (`x = 0`), passed by **name**, or marked **`out`/`ref`** to pass values back. The `bool` + `out` `Try...` pattern (`int.TryParse`) is everywhere in C#.
6. **Overloading** lets several methods share a name with different parameters; the compiler resolves which to call at compile time from the argument types.

You can now make decisions, repeat work, and bundle logic into named, callable pieces. Next, we put methods and data together into **classes and objects** - the heart of how C# programs are structured.

## Quick check

Test yourself on the ideas most likely to trip you up - fall-through, the switch expression, and the `out` pattern:

```quiz
[
  {
    "q": "In a classic C# `switch` statement, what happens if you write a non-empty `case` block without a `break` (or other terminator)?",
    "choices": [
      "The code won't compile - C# forbids implicit fall-through",
      "Execution silently falls through into the next case, like in C",
      "Only the matching case runs, and the rest are skipped automatically",
      "It compiles but throws an exception at runtime"
    ],
    "answer": 0,
    "explain": "C# requires every non-empty case to end explicitly (with break, return, etc.). It will not compile a case that would fall through, which eliminates the classic 'forgot the break' bug found in C and older Java/JavaScript."
  },
  {
    "q": "What's the key difference between the classic `switch` statement and a switch *expression* (`x switch { ... }`)?",
    "choices": [
      "The switch expression evaluates to a value you can assign or return; the statement performs an action and has no value",
      "The switch expression is slower because it checks every arm",
      "The switch statement can match patterns but the expression cannot",
      "There is no difference - they are just two spellings of the same thing"
    ],
    "answer": 0,
    "explain": "A statement does something (it has no value); an expression produces a value. `x switch { v => result, _ => ... }` evaluates to a result you store, return, or pass along, while the classic `switch` runs side-effecting code."
  },
  {
    "q": "Why does `int.TryParse(\"42\", out int number)` use an `out` parameter instead of just returning the parsed number?",
    "choices": [
      "So it can return a bool for success/failure AND hand back the parsed value through the out parameter - without crashing on bad input",
      "Because out parameters are always faster than return values",
      "Because methods in C# can only return bool, never int",
      "To force the caller to create the variable before calling the method"
    ],
    "answer": 0,
    "explain": "TryParse needs to communicate two things: whether parsing succeeded (the bool return) and the value itself (the out parameter). This lets you safely attempt a conversion and check the result without an exception when the input isn't a valid number."
  }
]
```

---

[← Phase 3: Collections](03-collections.md) · [Guide overview](_guide.md) · [Phase 5: Classes & Objects →](05-classes-and-objects.md)