---
title: "Delegates, Lambdas & Events - Functions as Values"
guide: "csharp-from-zero"
phase: 11
summary: "Functions become values you can store, pass, and call later: delegates as typed function pointers, lambdas as inline functions, the Func/Action/Predicate vocabulary, how closures capture variables, and events as safe publish/subscribe."
tags: [csharp, delegates, lambdas, func, action, events, anonymous-functions, closures]
difficulty: intermediate
synonyms: ["c# delegate explained", "c# func action predicate", "c# lambda expression", "c# events explained", "c# event handler", "c# closure capture", "c# anonymous method"]
updated: 2026-06-22
---

# Delegates, Lambdas & Events - Functions as Values

Up to now, a method has been something you *call* by name. This phase flips that: a method can also be a **value** - handed to another method, stashed in a variable, called later. Once functions are first-class values, whole categories of code get shorter: sorting by a custom rule, retrying with a strategy, reacting when something happens.

The mental model: **a function can be passed around like data.** Delegates are the typed box you put a function in. Lambdas are the shortest way to write one on the spot. `Func`/`Action`/`Predicate` are the standard boxes everyone uses. Events are delegates with a safety rail bolted on. Get this clicking - [Phase 12: LINQ](12-linq.md) is built entirely on top of it.

## Delegates - a typed reference to a method

📝 **A delegate is a type-safe reference to a method** - a "function pointer, but with the parameter and return types checked by the compiler." Declaring a delegate type describes a *shape* of method: how many parameters, what types, what it returns. Any matching method can be stored in a variable of that delegate type and called through it.

A delegate type is declared like a method signature with the `delegate` keyword in front:

```csharp
// Declare a delegate TYPE: "any method taking two ints and returning an int".
delegate int Op(int a, int b);

class Calculator
{
    static int Add(int a, int b) => a + b;
    static int Multiply(int a, int b) => a * b;

    static void Main()
    {
        Op operation = Add;        // store a method in a delegate variable
        Console.WriteLine(operation(3, 4));   // call it - runs Add(3, 4)

        operation = Multiply;       // point the same variable at another method
        Console.WriteLine(operation(3, 4));   // now runs Multiply(3, 4)
    }
}
```
```console
7
12
```
*What just happened:* `delegate int Op(int a, int b);` defined a new *type* named `Op` whose values are "methods that take two ints and return an int." `Op operation = Add;` stored the `Add` method itself - not its result. Calling `operation(3, 4)` ran whatever method the variable held; reassigning `operation = Multiply` swapped behavior without touching the call site. The compiler enforces the shape throughout - a wrong signature won't compile, the "type-safe" part a raw C function pointer lacks.

💡 **Key point.** The payoff isn't reassigning a variable - it's *passing behavior into other code*. A method can take an `Op` parameter and let the caller decide what operation to run: one sort routine that sorts by any rule, one retry loop that runs any action.

## Lambdas & anonymous methods - functions written inline

Declaring a separate named method just to pass it somewhere is a lot of ceremony for one line of logic. A **lambda** is a function written *inline*, right where you need it, with no name.

📝 The syntax is `parameters => body`. The `=>` reads as "goes to." A single-expression body returns its value automatically (an **expression lambda**). Multiple statements need braces and an explicit `return` (a **statement lambda**).

```csharp
delegate int Op(int a, int b);

class Program
{
    static void Main()
    {
        // Expression lambda: one expression, value returned implicitly.
        Op add = (a, b) => a + b;

        // Statement lambda: braces, multiple lines, explicit return.
        Op maxPlusOne = (a, b) =>
        {
            int bigger = a > b ? a : b;
            return bigger + 1;
        };

        Console.WriteLine(add(3, 4));
        Console.WriteLine(maxPlusOne(3, 4));
    }
}
```
```console
7
5
```
*What just happened:* `(a, b) => a + b` created a function with no name, stored directly in an `Op` delegate - no separate `static int Add(...)` needed. The compiler inferred `a` and `b` as `int` from the `Op` type, so you didn't repeat them. The statement lambda used braces since it has more than one line, needing an explicit `return`. Both are the same idea as named methods, just written at the point of use.

(The older `delegate (int a, int b) { return a + b; }` form is an **anonymous method** - the pre-lambda way to write the same thing. Lambdas replaced it.)

## `Func`, `Action`, `Predicate` - the built-in delegate types

Declaring a custom `delegate` type for every shape gets tedious, and worse, your `Op` and my `Calc` would be incompatible even with identical signatures. .NET ships a standard set of generic delegate types instead - learn these three and you can read almost any modern C# API.

📝 **`Func<…, TResult>`** - a method that **returns a value**; the last type parameter is the return type, the rest are parameters. `Func<int, int, int>` takes two ints and returns an int.

📝 **`Action<…>`** - a method that returns **void**. `Action<string>` takes a string and returns nothing.

📝 **`Predicate<T>`** - a method taking one `T`, returning **`bool`** - a yes/no test. `Predicate<int>` asks a true/false question about an int.

```csharp
// Func: takes two ints, returns an int (return type is LAST).
Func<int, int, int> add = (a, b) => a + b;

// Action: takes a string, returns nothing.
Action<string> shout = msg => Console.WriteLine(msg.ToUpper());

// Predicate: takes an int, returns a bool - a test.
Predicate<int> isEven = n => n % 2 == 0;

Console.WriteLine(add(2, 5));
shout("hello");
Console.WriteLine(isEven(4));
```
```console
7
HELLO
True
```
*What just happened:* `Func<int, int, int>` held a value-returning function - read the type parameters left to right as "int, int → int," return type always last. `Action<string>` held a function with no return value, only a side effect (printing). `Predicate<int>` held a true/false test. Note `shout` and `isEven` skip parentheses around a single parameter - `msg => …` is shorthand for `(msg) => …`. Each is exactly a delegate, just pre-declared so you never write `delegate` yourself.

💡 **Key point.** These three are the *vocabulary* LINQ and modern APIs speak: `.Where(...)` wants a `Func<T, bool>` (a test), `.Select(...)` a `Func<T, TResult>` (a transform), `list.ForEach(...)` an `Action<T>`. A parameter typed `Func` or `Action` wants you to hand it behavior - usually a lambda.

## Closures - a lambda that captures its surroundings

📝 A **closure** is what you get when a lambda uses a variable from the scope where it was *defined*. The lambda doesn't copy the value - it captures the *variable itself*, reading its current value whenever it runs, even long after the surrounding method has returned.

```csharp
Func<int, int> MakeAdder(int amount)
{
    // The returned lambda "captures" the parameter `amount`.
    return x => x + amount;
}

var add10 = MakeAdder(10);
var add100 = MakeAdder(100);

Console.WriteLine(add10(5));    // 15
Console.WriteLine(add100(5));   // 105
```
```console
15
105
```
*What just happened:* `MakeAdder` returned a lambda referring to `amount`, a local parameter that would normally vanish when `MakeAdder` returns - but the lambda *captured* it, keeping it alive bundled with the function. `add10` and `add100` each closed over their own `amount`, which is why they behave differently.

⚠️ **Gotcha - capturing a loop variable.** Because closures capture the *variable*, not a snapshot, capturing a `for` loop's counter bites hard - every lambda shares the one loop variable and sees its *final* value:

```csharp
var funcs = new List<Func<int>>();

// for loop: ONE shared `i` captured by all three lambdas.
for (int i = 0; i < 3; i++)
    funcs.Add(() => i);

foreach (var f in funcs)
    Console.WriteLine(f());     // prints 3, 3, 3 - not 0, 1, 2!

// foreach: modern C# gives each iteration its OWN variable.
var fixedFuncs = new List<Func<int>>();
foreach (var n in new[] { 0, 1, 2 })
    fixedFuncs.Add(() => n);

foreach (var f in fixedFuncs)
    Console.WriteLine(f());     // prints 0, 1, 2 - fresh `n` each time
```
```console
3
3
3
0
1
2
```
*What just happened:* the `for` loop has a single variable `i` that lives for the whole loop; all three lambdas captured *that one variable*, and by the time you called them the loop had finished, leaving `i` at `3`. `foreach` is different: modern C# (5+) gives each iteration a *fresh* loop variable, so each lambda captured its own `n`. Fix the `for` case by copying into a local inside the loop: `int copy = i; funcs.Add(() => copy);` - now each lambda captures a distinct `copy`. ⚠️ `foreach` was fixed; `for` still bites.

## Events - publish/subscribe built on delegates

📝 An **event** is a publish/subscribe mechanism built on delegates. One object (the *publisher*) announces "something happened"; other objects (*subscribers*) register to be notified, attaching with `+=` and detaching with `-=`. The publisher *raises* the event to call everyone at once - the backbone of UI toolkits and reactive code, where a button doesn't know who's listening for its click, it just fires.

```csharp
class Button
{
    // An event: subscribers attach handlers; only Button can raise it.
    public event EventHandler? Clicked;

    public void SimulateClick()
    {
        Console.WriteLine("Button: raising Clicked");
        Clicked?.Invoke(this, EventArgs.Empty);   // notify every subscriber
    }
}

class Program
{
    static void Main()
    {
        var button = new Button();

        // Subscribe two handlers with +=.
        button.Clicked += (sender, e) => Console.WriteLine("Handler A: clicked!");
        button.Clicked += (sender, e) => Console.WriteLine("Handler B: also clicked!");

        button.SimulateClick();
    }
}
```
```console
Button: raising Clicked
Handler A: clicked!
Handler B: also clicked!
```
*What just happened:* `public event EventHandler? Clicked;` declared an event - `EventHandler` is the standard delegate type for "something happened" notifications (it carries a `sender` and an `EventArgs`). Two subscribers attached lambdas with `+=`. `SimulateClick` raised the event with `Clicked?.Invoke(...)` - the `?.` guards against nobody having subscribed (then `Clicked` is null and invoking it would throw). `Button` never named or knew about either handler - that decoupling is the point.

💡 **Key point.** An event is "a delegate with subscribe/unsubscribe semantics and safety." Under the hood it's a delegate holding a list of methods, but the `event` keyword restricts the outside world to only `+=` and `-=`: subscribers can add or remove *their own* handler, but can't overwrite the whole list, clear everyone else's, or raise the event themselves. Only the declaring class can do that - why events, not raw public delegates, model "X happened, react if you care."

## Recap

1. **A delegate is a type-safe reference to a method** - a typed box for a function, pass around, call later. `delegate int Op(int a, int b);` declares the shape; any matching method fits.
2. **Lambdas** write functions inline: `(a, b) => a + b` for a single expression (returned implicitly), or `(a, b) => { … return x; }` with braces for multiple statements.
3. **`Func`, `Action`, `Predicate`** are the built-in delegate types everyone uses: `Func<…,TResult>` returns a value, `Action<…>` returns void, `Predicate<T>` returns bool - the vocabulary LINQ speaks.
4. A **closure** captures the *variable* from its enclosing scope (not a snapshot), keeping it alive. ⚠️ Capturing a `for` loop variable makes every lambda share one variable and see its final value; `foreach` was fixed in modern C#, but `for` still bites - copy to a local inside the loop.
5. An **event** is publish/subscribe on top of delegates: subscribe with `+=`, unsubscribe with `-=`, raise with `?.Invoke(...)`. The `event` keyword adds safety so only the declaring class can raise or replace the handler list.

You can now treat functions as values - store, pass, react. That's the foundation [Phase 12: LINQ](12-linq.md) stands on: every query operator takes a function (a lambda) and applies it to a sequence.

## Quick check

Test yourself on the ideas that LINQ will lean on hardest:

```quiz
[
  {
    "q": "What is a delegate in C#?",
    "choices": [
      "A type-safe reference to a method - you can store a method in it, pass it around, and call it later",
      "A keyword that makes a method run on a background thread",
      "A way to inherit behavior from another class",
      "A read-only property that can't be reassigned"
    ],
    "answer": 0,
    "explain": "A delegate is a typed handle to a method - a 'function pointer with types.' You declare a shape (parameters and return type), store any matching method in a variable of that type, and call behavior through it. That's what lets functions be passed around as values."
  },
  {
    "q": "You want to pass a lambda that takes an `int` and returns a `bool` (a test). Which built-in delegate type fits?",
    "choices": [
      "`Func<int, bool>` (or `Predicate<int>`) - it takes an int and returns a bool",
      "`Action<int>` - it takes an int",
      "`Func<bool, int>` - bool first, then int",
      "`Op<int>` - the standard test delegate"
    ],
    "answer": 0,
    "explain": "`Func<int, bool>` reads 'int → bool': parameters first, return type last. `Predicate<int>` is the same shape. `Action<int>` is wrong because Action returns void. This is exactly the shape LINQ's `.Where(...)` expects."
  },
  {
    "q": "You add three lambdas `() => i` inside a `for (int i = 0; i < 3; i++)` loop, then call them all. What prints?",
    "choices": [
      "3, 3, 3 - all three lambdas captured the same `i`, which ended at 3",
      "0, 1, 2 - each lambda captured the value of `i` at that iteration",
      "0, 0, 0 - the lambdas captured `i` before the loop ran",
      "A compile error - you can't capture a loop variable"
    ],
    "answer": 0,
    "explain": "A closure captures the variable, not a snapshot. A `for` loop has one shared `i`, so all three lambdas point at it; by the time you call them the loop is done and `i` is 3. Copy to a local inside the loop (`int copy = i;`) to fix it. Note `foreach` was fixed in modern C# to give each iteration its own variable."
  }
]
```

---

[← Phase 10: Generics, Deep](10-generics-deep.md) · [Guide overview](_guide.md) · [Phase 12: LINQ →](12-linq.md)
