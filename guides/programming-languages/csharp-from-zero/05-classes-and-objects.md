---
title: "Classes & Objects - The Spine of C#"
guide: "csharp-from-zero"
phase: 5
summary: "A class is a blueprint; an object is one built with new. Here's how fields, constructors, this, and C#'s signature feature - properties - fit together, plus encapsulation, static, and overriding ToString."
tags: [csharp, classes, objects, properties, constructors, encapsulation, this, oop]
difficulty: intermediate
synonyms: ["c# classes and objects", "c# properties get set", "c# constructor", "c# auto property", "c# encapsulation access modifiers", "c# this keyword", "c# object initializer"]
updated: 2026-06-22
---

# Classes & Objects - The Spine of C#

You've been writing methods inside a class since Phase 1, even if nobody made a fuss about it. Every C# program lives inside a class - there's no "outside." Classes and objects aren't a corner of C#; they *are* C#. Almost everything you'll touch - a list, a file, an HTTP client, a button - is an object built from a class.

The word "OOP" arrives wrapped in scary vocabulary: encapsulation, polymorphism, abstraction. Set that aside - there's one idea underneath, and once it lands the keywords stop being spells: **a class bundles data together with the behavior that acts on that data, and `new` stamps out individual copies you can use.**

## The mental model: blueprint vs. instance

📝 **Class** - a blueprint describing what *kind* of thing exists: what data it holds and what it can do. **Object** (also called an **instance**) - one concrete thing built from that blueprint with `new`. The class is the cookie cutter; the objects are the cookies.

A `class Account` doesn't *hold* any money - it's the *idea* of an account. Write `new Account(...)` and you get a real account, with its own balance, separate from every other account you make.

> 💡 **Key point.** The class is written once, at design time. Objects are created over and over, at run time. One blueprint, many independent instances - each remembering its own state.

## Fields, constructors, and `this`

A class needs somewhere to keep its data (**fields**), a way to set that data up when an object is born (a **constructor**), and a word for "the specific object I'm working on" (`this`). Let's build `Account` for real.

📝 **Field** - a variable that lives on the object, holding its data. **Constructor** - a special method that runs automatically when you write `new`, whose job is to set up the new object's starting data. It has no return type and shares the class's name. **`this`** - a reference to the current object, the one a method was called on.

```csharp
class Account
{
    private decimal balance;   // a field: data stored on each Account
    public string Owner;       // another field

    // Constructor: runs when you write new Account(...)
    public Account(string owner, decimal opening)
    {
        this.Owner = owner;        // this.Owner = the field; owner = the parameter
        this.balance = opening;
    }

    public void Deposit(decimal amount)
    {
        this.balance += amount;    // change THIS account's balance
    }

    public decimal Balance()
    {
        return this.balance;
    }
}

class Program
{
    static void Main()
    {
        Account ada = new Account("Ada", 100m);   // build one instance
        ada.Deposit(50m);
        Console.WriteLine($"{ada.Owner}: {ada.Balance()}");
    }
}
```
```console
Ada: 150
```
*What just happened:* `new Account("Ada", 100m)` ran the constructor, copying the two arguments into the new object's fields. `ada` is now one instance carrying its own `Owner` and `balance`. `ada.Deposit(50m)` changed *Ada's* balance specifically - `this.balance` means "the balance of the account `Deposit` was called on." A second account's balance would be untouched - that separateness is the whole point of instances.

Notice `this.Owner = owner`: the field is `Owner`, the parameter is `owner` - same word, different case. `this.` makes it unambiguous: left side is the object's field, right the parameter. You'll see this constantly in constructors.

💡 **Object initializer syntax.** C# gives a shortcut for setting public members right after construction - instead of (or alongside) constructor arguments, write the assignments in braces:

```csharp
Account ada = new Account("Ada", 0m)
{
    Owner = "Ada Lovelace"   // set a public member inline, after the constructor runs
};
```
*What just happened:* The constructor ran first (with `"Ada"` and `0m`), then the braces reassigned `Owner` to `"Ada Lovelace"`. Object initializers are pure convenience - they run *after* the constructor and can only touch members the caller is allowed to set. They read nicely for an object with several settable fields.

## Properties - C#'s signature feature

Here's where C# parts ways with most languages you've seen. You might make a field `public` and let callers read and write it directly. That works, but it's a trap: the day you need to *validate* a value, compute it, or log when it changes, a raw public field gives you no hook - you'd have to change every caller.

Java solved this with `getName()` / `setName(...)` methods everywhere - verbose, and the *caller* has to know whether it's reading a field or calling a getter. C# solved it differently with one of its defining features: the **property**.

📝 **Property** - a member that *looks* like a field from the outside (`account.Owner`) but *runs code* underneath. It has a `get` accessor (runs on read) and/or a `set` accessor (runs on assignment, with the value arriving as the keyword `value`). Callers can't tell a property from a field - that's the point.

The simplest form is an **auto-property**, where the compiler generates the hidden backing field:

```csharp
class Account
{
    public string Owner { get; set; }      // auto-property: read and write
    public string Bank  { get; init; }     // init-only: settable once, at creation
    public decimal Balance { get; private set; }  // public read, private write

    public Account(string owner)
    {
        Owner = owner;
        Balance = 0m;
    }
}
```
*What just happened:* `Owner { get; set; }` is a full read/write property in one line - the compiler wired both accessors to an invisible backing field. `Bank { get; init; }` is **init-only**: settable in the constructor or an object initializer, then frozen. `Balance { get; private set; }` lets *anyone* read the balance but only code *inside this class* change it - callers can't set it to a million.

When you need logic, spell the accessors out - here's a guarded setter that refuses bad data:

```csharp
class Account
{
    private decimal balance;   // the backing field, hidden

    public decimal Balance
    {
        get { return balance; }
        set
        {
            if (value < 0)
                throw new ArgumentException("Balance cannot be negative.");
            balance = value;    // 'value' is the incoming assigned amount
        }
    }
}

class Program
{
    static void Main()
    {
        var acc = new Account();
        acc.Balance = 200m;            // calls the set accessor; value = 200
        Console.WriteLine(acc.Balance); // calls the get accessor
        acc.Balance = -5m;             // set accessor throws
    }
}
```
```console
200
Unhandled exception. System.ArgumentException: Balance cannot be negative.
```
*What just happened:* `acc.Balance = 200m` looked like a plain assignment but ran the `set` block, `value` holding `200`. Since `200` passed the check, it landed in the hidden `balance` field. Reading `acc.Balance` ran the `get` block. The illegal `acc.Balance = -5m` failed the `value < 0` check and threw - the property *guarded its own data*, with no change to the caller's code.

You can also make a **computed, read-only property** - only a `get` calculating its value from other state:

```csharp
public string Summary => $"{Owner} has {Balance:C}";   // expression-bodied, get-only
```
*What just happened:* `Summary` has no backing field. Every read runs the `=>` expression and builds a fresh string from `Owner` and `Balance`. It's read-only because there's nothing to assign to - this is how you expose *derived* information without storing it.

💡 **Why this matters.** Properties are the idiomatic C# way to expose an object's state - not raw public fields, not Java-style `getX`/`setX`. They give a field's clean syntax *and* a method's power to validate, compute, and control access. Your reflex should be `public string Name { get; set; }`, not `public string Name;`. Reach for the full accessor form only when you need logic.

## Encapsulation & access modifiers

The guarded setter above hinted at the bigger idea: **encapsulation** - keeping an object's internal data private and exposing only a controlled surface. The reason isn't tidiness; *uncontrolled* state is where bugs breed. If any code anywhere can set `balance` to anything, any code anywhere can corrupt it. Make `balance` private with a guarded property, and there's exactly *one* place a bad balance can come from.

C# controls visibility with **access modifiers** - the four you'll use constantly:

📝 **`public`** - visible everywhere. **`private`** - visible only inside the same class (the default for class members if you write nothing). **`protected`** - visible inside this class and its subclasses (matters once you hit inheritance, Phase 6). **`internal`** - visible anywhere in the same project/assembly, but not to outside code that references your library.

The discipline: **make state `private`, expose it through `public` properties and methods.**

```csharp
class Thermostat
{
    private double celsius;   // private state - nobody touches this directly

    public double Celsius
    {
        get => celsius;
        set
        {
            if (value < -273.15)
                throw new ArgumentException("Below absolute zero.");
            celsius = value;
        }
    }

    // A public, read-only view derived from the private state
    public double Fahrenheit => celsius * 9 / 5 + 32;
}

class Program
{
    static void Main()
    {
        var t = new Thermostat();
        t.Celsius = 20;
        Console.WriteLine($"{t.Celsius}C = {t.Fahrenheit}F");
    }
}
```
```console
20C = 68F
```
*What just happened:* `celsius` is private, so no outside code can poke an impossible temperature into it. The only way in is `Celsius`'s setter, which rejects anything below absolute zero. `Fahrenheit` is a read-only computed view of that private value. The class decides exactly what the world can do to it - set a valid Celsius, read either scale, nothing else. That controlled surface is encapsulation, keeping an object trustworthy as your program grows.

⚠️ **Don't reflexively make everything `public`.** A class with all-public fields is a bag of variables with no defenses - it can't stop bad data or change its internals later without breaking callers. Start private, open up only what callers genuinely need.

## `static` members, and overriding `ToString`

So far every field and method has belonged to an *instance* - each `Account` has its own `balance`. But sometimes a member belongs to the *class itself*. That's what `static` means.

📝 **Instance member** - belongs to each object; you need one to use it (`ada.Deposit(...)`). **`static` member** - belongs to the class as a whole, used through the class name (`Account.Count`), existing even with zero objects made.

This is why your entry point is `static void Main()`: when the program starts, *no objects exist yet*, so `Main` can't belong to an instance - it has to belong to the class itself.

```csharp
class Account
{
    public static int Count = 0;   // shared across ALL accounts
    public string Owner { get; }

    public Account(string owner)
    {
        Owner = owner;
        Count++;                   // bump the shared counter on every new account
    }
}

class Program
{
    static void Main()
    {
        new Account("Ada");
        new Account("Grace");
        Console.WriteLine(Account.Count);   // through the class, not an instance
    }
}
```
```console
2
```
*What just happened:* `Count` is `static`, so there's exactly *one* shared by every `Account`. Each constructor incremented that shared counter, so after two accounts `Account.Count` is `2`. You read it through the class name, never through an object - static members don't belong to any instance.

The other thing nearly every class should do is teach itself how to print. By default, printing an object gives its type name - useless. **Overriding `ToString`** fixes that. Every C# object inherits a `ToString()` method (from the universal base type `object`, Phase 6), which you can replace with something meaningful:

```csharp
class Account
{
    public string Owner { get; }
    public decimal Balance { get; }

    public Account(string owner, decimal balance)
    {
        Owner = owner;
        Balance = balance;
    }

    public override string ToString()      // replace the default, useless version
    {
        return $"Account({Owner}: {Balance:C})";
    }
}

class Program
{
    static void Main()
    {
        var ada = new Account("Ada", 150m);
        Console.WriteLine(ada);            // Console.WriteLine calls ToString() for you
    }
}
```
```console
Account(Ada: $150.00)
```
*What just happened:* `Console.WriteLine(ada)` automatically called `ada.ToString()`. Because we **overrode** it (`override` tells the compiler we're deliberately replacing the inherited version), it returned our friendly string instead of the default `"Account"`. Overriding `ToString` makes objects readable in logs, debuggers, and quick `Console.WriteLine`s.

⚠️ **One gotcha to bank for later: `==` doesn't mean what you'd expect for classes.** For a class (a *reference type*), `==` and `.Equals()` compare *whether two variables point at the same object in memory* - not whether they hold the same data. Two separate `Account` objects with identical owner and balance are `==` only if literally the same object:

```csharp
var a = new Account("Ada", 150m);
var b = new Account("Ada", 150m);
Console.WriteLine(a == b);   // False - two different objects, despite identical data
Console.WriteLine(a == a);   // True  - same object
```
```console
False
True
```
*What just happened:* `a` and `b` describe the same account on paper, but they're two distinct objects at different spots in memory, so `==` says `False`. This is *reference equality*, the default for all classes - it trips people constantly. **Records** flip this to compare by *value* automatically (Phase 13); the full gotcha, including how to override equality yourself, is in Phase 9. For now: `==` on class objects asks "same object?", not "same contents?"

## Recap

1. A **class** is a blueprint written once; an **object/instance** is one concrete thing built from it with `new`, carrying its own data. One blueprint, many independent instances.
2. **Fields** hold an object's data; the **constructor** sets that data up when `new` runs; **`this`** means "the current object," and disambiguates a field from a same-named parameter.
3. **Properties** are C#'s signature feature: they look like fields but run code (`get`/`set`, with `value` as the incoming assignment). Auto-properties (`{ get; set; }`), `init`-only setters, `private set`, and computed get-only properties are the idiomatic way to expose state - not raw public fields.
4. **Encapsulation** means keeping state `private` and exposing a controlled surface via properties/methods; **access modifiers** (`public`, `private`, `protected`, `internal`) set visibility. Private-by-default prevents whole classes of bugs.
5. **`static`** members belong to the class, not any instance (which is why `Main` is static); override **`ToString`** so your objects print meaningfully.
6. ⚠️ For classes, **`==` compares object identity, not contents** - two objects with identical data are not equal unless they're the same object. (Records fix this; full story in Phase 9.)

You can now design your own types - the building blocks of every C# program. Next, we connect classes together: how one class can build on another, and how **interfaces** let unrelated classes promise the same behavior.

## Quick check

Test yourself on the ideas that define C# classes - properties and reference equality:

```quiz
[
  {
    "q": "What makes a C# property different from a plain public field?",
    "choices": [
      "A property looks like a field to callers but can run code (validation, computation) in its get/set accessors",
      "A property is always faster than a field because the compiler optimizes it",
      "A property can only be read, never written",
      "There is no real difference; 'property' is just another word for 'field'"
    ],
    "answer": 0,
    "explain": "A property exposes a field-like syntax (account.Owner) while running code underneath. Its get and set accessors let you validate, compute, log, or restrict access - without callers ever knowing it isn't a raw field. That's why C# uses properties instead of public fields or Java-style getX/setX."
  },
  {
    "q": "You write two separate accounts with identical data and compare them with ==. What do you get, and why?",
    "choices": [
      "False - for a class, == compares object identity (same object in memory), not contents",
      "True - == always compares the data inside two objects",
      "A compile error, because you can't use == on classes",
      "True, but only if both objects were created in the same method"
    ],
    "answer": 0,
    "explain": "Classes are reference types, so == (and the default .Equals) ask 'are these the same object?', not 'do they hold the same data?'. Two distinct objects with identical fields are not ==. Records change this to value comparison (Phase 13); the full gotcha is in Phase 9."
  },
  {
    "q": "Why is a program's entry point declared `static void Main()`?",
    "choices": [
      "Because when the program starts no objects exist yet, so Main must belong to the class itself rather than an instance",
      "Because static methods run faster than instance methods",
      "Because Main is not allowed to use the 'this' keyword for security reasons",
      "Because static is required on every method that returns void"
    ],
    "answer": 0,
    "explain": "A static member belongs to the class as a whole, not to any object. At startup there are no instances yet, so Main can't be an instance method - there'd be no object to call it on. It has to belong to the class itself, which is exactly what static means."
  }
]
```

---

[← Phase 4: Control Flow & Methods](04-control-flow-and-methods.md) · [Guide overview](_guide.md) · [Phase 6: Inheritance & Interfaces →](06-inheritance-and-interfaces.md)
