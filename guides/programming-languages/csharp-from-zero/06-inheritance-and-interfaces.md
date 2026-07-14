---
title: "Inheritance & Interfaces - Sharing Behavior"
guide: "csharp-from-zero"
phase: 6
summary: "How one class builds on another with inheritance, how virtual/override give you polymorphism, and how interfaces let unrelated classes promise the same behavior - plus abstract, sealed, and when to choose which."
tags: [csharp, inheritance, interfaces, polymorphism, abstract, virtual, override, sealed]
difficulty: intermediate
synonyms: ["c# inheritance base class", "c# interface implementation", "c# polymorphism virtual override", "c# abstract class vs interface", "c# sealed class", "c# base keyword", "c# default interface methods"]
updated: 2026-06-22
---

# Inheritance & Interfaces - Sharing Behavior

Phase 5 built a single class - fields, constructors, properties, the whole spine of a type. But programs are rarely one type. You get families of related types: a `Dog` and a `Cat` both animals, a `Circle` and a `Rectangle` both shapes, a `FileLogger` and a `ConsoleLogger` that both, well, log. This phase answers: *how do related types share code and promise common behavior without copy-pasting?*

C# gives you two tools, and the phase is really about telling them apart. **Inheritance** is "this type *is a* more specific version of that type" - a `Dog` is an `Animal`, so it gets everything an `Animal` has, plus its own twist. **Interfaces** are "this type *can do* a certain thing" - anything drawable promises a `Draw()` method, no matter what it actually is. Inheritance shares *implementation*; interfaces share *a contract*.

## Inheritance - the "is-a" relationship

📝 **Inheritance** - defining a new class (the **derived**/**child** class) that automatically gets all the public and protected members of an existing class (the **base**/**parent** class), then adds or changes things. Written with a colon: `class Dog : Animal`. The derived class *is a* kind of the base class.

The litmus test is the **"is-a" test**: read it aloud as "a Dog is an Animal." If true and stays true, inheritance fits. "A Car *has an* Engine" is *has-a* - a field, not inheritance. Getting this wrong is the single most common OOP mistake.

When the base class has a constructor that needs arguments, the derived class passes them up with the `base(...)` keyword:

```csharp
class Animal
{
    public string Name { get; }

    public Animal(string name)
    {
        Name = name;
    }

    public void Eat()
    {
        Console.WriteLine($"{Name} is eating.");
    }
}

class Dog : Animal          // Dog IS AN Animal
{
    public Dog(string name)
        : base(name)        // pass 'name' up to Animal's constructor
    {
    }

    public void Fetch()     // Dog adds its own behavior
    {
        Console.WriteLine($"{Name} fetches the ball.");
    }
}

class Program
{
    static void Main()
    {
        Dog rex = new Dog("Rex");
        rex.Eat();      // inherited from Animal
        rex.Fetch();    // defined on Dog
    }
}
```
```console
Rex is eating.
Rex fetches the ball.
```
*What just happened:* `Dog : Animal` means `Dog` inherited `Animal`'s `Name` property and `Eat()` method for free - `rex.Eat()` works even though `Dog` never defines `Eat`. `: base(name)` handed `"Rex"` up to `Animal`'s constructor so the inherited `Name` got set; without it, the compiler wouldn't know how to initialize the `Animal` part of the `Dog`. Then `Dog` added `Fetch()`, which `Animal` knows nothing about - get everything the parent has, then extend it.

💡 **Every class already inherits something.** Even a plain `class Account` with no colon silently inherits from a universal base type called `object` - why every object has a `ToString()` you can override (Phase 5). Inheritance is already underneath everything.

## `virtual` and `override` - and the trap that bites Java refugees

Here's a rule that surprises people from other languages. Inheriting a method is one thing; *replacing* it with a more specific version is another - and C# makes you ask for that explicitly on **both** sides.

📝 **`virtual`** - a base-class method keyword saying "derived classes may replace this." **`override`** - a derived-class keyword saying "I am deliberately replacing the virtual base version." You need *both*: `virtual` opens the door, `override` walks through it.

⚠️ **This is the C#-specific rule that trips everyone.** In Java, *every* method is overridable by default - matching the signature is enough. In C#, methods are **sealed shut by default**: if the base method isn't `virtual`, the derived class cannot truly override it. A deliberate design choice - C# wants overriding intentional, not accidental.

```csharp
class Animal
{
    public string Name { get; }
    public Animal(string name) => Name = name;

    public virtual void Speak()      // 'virtual' opens this up for overriding
    {
        Console.WriteLine($"{Name} makes a sound.");
    }
}

class Dog : Animal
{
    public Dog(string name) : base(name) { }

    public override void Speak()     // 'override' replaces the base version
    {
        Console.WriteLine($"{Name} barks: Woof!");
    }
}

class Cat : Animal
{
    public Cat(string name) : base(name) { }

    public override void Speak()
    {
        Console.WriteLine($"{Name} meows: Meow!");
    }
}

class Program
{
    static void Main()
    {
        Animal a = new Dog("Rex");    // an Animal-typed variable holding a Dog
        a.Speak();                     // which Speak runs?

        Animal b = new Cat("Whiskers");
        b.Speak();
    }
}
```
```console
Rex barks: Woof!
Whiskers meows: Meow!
```
*What just happened:* This is **dynamic dispatch** - the payoff for the `virtual`/`override` ceremony. `a` is *declared* as `Animal`, but at run time it holds a `Dog`. Calling `a.Speak()`, C# looks at the *real* object, not the declared type, and runs `Dog`'s overridden `Speak`. Same for `b` and its `Cat`. The decision is made at run time based on the actual object - hence "dynamic."

⚠️ **The `new` keyword is a trap, not a fix.** Forget `virtual` on the base method and write `override` in the derived class, and the compiler errors - the good case. But write `new` instead of `override`, and the code compiles and looks like it works while doing something subtly wrong: `new` *hides* the base method rather than overriding it. The difference only shows up through a base-typed variable:

```csharp
class Animal
{
    public void Speak()              // NOT virtual
    {
        Console.WriteLine("Animal sound");
    }
}

class Dog : Animal
{
    public new void Speak()          // 'new' HIDES, it does not override
    {
        Console.WriteLine("Woof!");
    }
}

class Program
{
    static void Main()
    {
        Dog d = new Dog();
        Animal a = d;                // same object, two different declared types

        d.Speak();                   // uses Dog's version
        a.Speak();                   // uses Animal's version - surprise!
    }
}
```
```console
Woof!
Animal sound
```
*What just happened:* `d` and `a` point at the *exact same object*, yet print different things. With `new`, C# picks the method based on the **declared type of the variable**, not the real object - the opposite of dynamic dispatch, almost never what you want. When you mean to override, use `virtual` + `override` and verify through a base-typed variable. Seeing `new` on a method is a red flag.

## Polymorphism - one type, many behaviors

You just saw the mechanism - now the name.

📝 **Polymorphism** ("many forms") - treating different derived objects uniformly through a base-class (or interface) reference, each running *its own* overridden behavior at run time. A variable of type `Animal` can hold a `Dog`, `Cat`, or any other animal, and calling `.Speak()` does the right thing - *without your code knowing or caring which*.

The payoff shows up with a *collection* of mixed subtypes: one loop against the base type, each object bringing its own behavior:

```csharp
class Program
{
    static void Main()
    {
        // A list of Animals - but each element is really a Dog or a Cat.
        List<Animal> zoo = new List<Animal>
        {
            new Dog("Rex"),
            new Cat("Whiskers"),
            new Dog("Buddy")
        };

        foreach (Animal a in zoo)   // we only know they're Animals here
        {
            a.Speak();              // each runs ITS OWN Speak
        }
    }
}
```
```console
Rex barks: Woof!
Whiskers meows: Meow!
Buddy barks: Woof!
```
*What just happened:* The loop variable `a` is just an `Animal` as far as the code can tell - `foreach` has no idea it's juggling dogs and cats. But every `a.Speak()` dispatched to the real object's overridden method, so dogs barked and the cat meowed, all from one line of code. Add a `Hamster : Animal` next week, drop it in the list, and **this loop never changes** - code against the base type automatically handles types that didn't exist when you wrote it.

## Interfaces - a contract any class can sign

Inheritance has a hard limit in C#: a class can inherit **exactly one** base class. You can't be both a `Bird` and a `Swimmer` by inheritance. And often "is-a" is the wrong relationship - a `FileLogger` and a `Button` share nothing as *types*, yet both might need to be "savable" or "disposable." For sharing *capability* across unrelated types, you want an **interface**.

📝 **Interface** - a contract: a named list of members (methods, properties) a type promises to provide, with *no implementation*. A class signs it with the same colon syntax (`class Circle : IShape`) and must supply a body for every declared member. By convention interface names start with `I`: `IShape`, `IComparable`, `IDisposable`.

The crucial difference from inheritance: a class inherits **one** base class but implements **many** interfaces. An interface says nothing about *what* a type is - only what it can *do*.

```csharp
interface IShape
{
    double Area();        // just the signature - no body, no fields
    string Describe();
}

class Circle : IShape     // Circle promises to fulfil the IShape contract
{
    private double radius;
    public Circle(double radius) => this.radius = radius;

    public double Area() => Math.PI * radius * radius;
    public string Describe() => $"Circle with area {Area():F2}";
}

class Rectangle : IShape  // an UNRELATED class, same contract
{
    private double w, h;
    public Rectangle(double w, double h) { this.w = w; this.h = h; }

    public double Area() => w * h;
    public string Describe() => $"Rectangle with area {Area():F2}";
}

class Program
{
    static void Main()
    {
        List<IShape> shapes = new List<IShape>
        {
            new Circle(2),
            new Rectangle(3, 4)
        };

        foreach (IShape s in shapes)   // we only know they're IShapes
        {
            Console.WriteLine(s.Describe());
        }
    }
}
```
```console
Circle with area 12.57
Rectangle with area 12.00
```
*What just happened:* `IShape` declared *what* a shape must offer - `Area()` and `Describe()` - but not *how*. `Circle` and `Rectangle` supplied their own implementations, sharing no base class; their only connection is the contract. `List<IShape>` treated them uniformly, exactly like polymorphism with inheritance. Interfaces give the same "one loop, many behaviors" payoff *without* forcing types into a family tree - how unrelated things agree to be interchangeable.

💡 **Default interface methods (a modern wrinkle).** Since C# 8, an interface can include a default body for a member, so types that don't override it inherit that default - handy for extending an interface without breaking existing implementers. Treat it as a special-purpose escape hatch, not the norm; an interface's everyday job is still to declare a contract, not carry code.

## Abstract and sealed - the two ends of the dial

Two more keywords sit at opposite extremes: one forces inheritance, the other forbids it.

📝 **`abstract` class** - a base class you *cannot instantiate directly* (`new Animal(...)` is a compile error); it exists only to be inherited. It can mix concrete members (shared code) with **`abstract` members** - declared but unimplemented - which every concrete subclass is *forced* to override. Use it when there's no such thing as a generic instance ("only dogs, cats, ... never just an `Animal`") but subtypes share real code and state.

```csharp
abstract class Animal
{
    public string Name { get; }
    protected Animal(string name) => Name = name;   // shared setup

    public abstract void Speak();        // no body - subclasses MUST provide one

    public void Sleep()                  // shared concrete behavior
    {
        Console.WriteLine($"{Name} sleeps.");
    }
}

class Dog : Animal
{
    public Dog(string name) : base(name) { }
    public override void Speak() => Console.WriteLine($"{Name}: Woof!");
}

class Program
{
    static void Main()
    {
        // Animal a = new Animal("???");  // compile error: can't instantiate abstract
        Dog d = new Dog("Rex");
        d.Speak();
        d.Sleep();
    }
}
```
```console
Rex: Woof!
Rex sleeps.
```
*What just happened:* `abstract class Animal` can't be `new`-ed - there's no such thing as a generic animal, and the commented-out line proves the compiler enforces that. `Speak()` is `abstract`, so `Animal` declares it but refuses to implement it, *forcing* `Dog` to override it. Meanwhile `Sleep()` is fully written once and shared by every subclass. That blend - force some methods, share others, hold common state - is what separates an abstract class from an interface.

📝 **`sealed` class** - the opposite: `sealed` *cannot be inherited from* at all. `sealed class Receipt` slams the door so no one can subtype it. Reach for it when behavior must not be altered by subclassing - safety, guarantees, or signaling "this is final." You can also seal an individual `override` to stop *further* overriding down the chain.

💡 **So which do you actually pick?** The plain guidance:

- **Default to interfaces.** They model *capability*, a type can implement many, and they avoid a rigid family tree. When types just need to agree on a contract, an interface is almost always right.
- **Use an abstract class when subtypes genuinely share state and code.** If every subclass would copy-paste the same fields and helpers, an abstract base earns its keep by owning that shared implementation once. The cost is the one-base-class limit.

⚠️ **Favor composition and interfaces over deep inheritance hierarchies.** The classic beginner trap is building tall towers - `Animal → Mammal → Carnivore → Dog → Puppy` - then finding a change near the top ripples unpredictably to the bottom, or a new type doesn't fit the tree. Most reuse in real C# codebases comes from *small interfaces* plus *composition* (an object holding other objects, the "has-a" case). Use inheritance shallowly, only when "is-a" is unmistakably true.

## Recap

1. **Inheritance** (`class Dog : Animal`) gives a derived class everything its base has, then lets it add more. Use the **"is-a" test**, and pass base-constructor arguments with **`base(...)`**.
2. **`virtual` + `override`** are both required for true overriding - and ⚠️ this is C#-specific: methods are *not* virtual by default (unlike Java). The `new` keyword *hides* instead of overriding, which is a silent trap; verify behavior through a base-typed variable.
3. **Polymorphism** is the payoff: a base-typed variable (or a `List<Animal>`) runs each object's own overridden method at run time, so one loop handles every subtype - including ones you add later.
4. **Interfaces** declare a contract with no implementation; a class implements **many** interfaces but inherits **one** base class. Name them `IThing`. They share *capability* across unrelated types.
5. **`abstract`** classes can't be instantiated and can force subclasses to implement members (shared code + enforced contract); **`sealed`** forbids inheritance entirely.
6. 💡 Prefer **interfaces** for capability and **composition** over deep hierarchies; reach for an **abstract class** only when subtypes truly share state and code.

You can now connect your types together - let them build on each other, promise common behavior, and be used interchangeably. Next, we deal with the messy real world: what happens when things go wrong (exceptions) and how to read and write data (I/O).

## Quick check

Test yourself on the ideas that separate inheritance from interfaces - especially the override trap:

```quiz
[
  {
    "q": "In C#, what do you need for a derived class to truly override a base-class method (so a base-typed variable runs the derived version)?",
    "choices": [
      "The base method must be marked 'virtual' and the derived method marked 'override'",
      "Nothing special - every C# method is overridable by default, like in Java",
      "The derived method must use the 'new' keyword to replace the base version",
      "Both methods must be marked 'static'"
    ],
    "answer": 0,
    "explain": "C# methods are sealed by default. You need 'virtual' on the base method to allow overriding and 'override' on the derived method to do it. Unlike Java, matching the signature isn't enough - and 'new' only *hides* the method (picking by declared type), which is a common trap, not a real override."
  },
  {
    "q": "What is the key difference between inheriting a base class and implementing an interface in C#?",
    "choices": [
      "A class can implement many interfaces but inherit only one base class; interfaces share a contract while a base class shares implementation",
      "There is no difference - they are two words for the same feature",
      "Interfaces let you inherit from several base classes at once, replacing single inheritance",
      "A base class has no implementation, while an interface always provides full method bodies"
    ],
    "answer": 0,
    "explain": "Inheritance models 'is-a' and shares actual implementation, but C# allows only one base class. Interfaces model 'can-do' - a pure contract (traditionally with no bodies) that any number of unrelated classes can sign, so a class can implement many at once."
  },
  {
    "q": "When should you reach for an abstract class instead of an interface?",
    "choices": [
      "When the subtypes genuinely share state and concrete code, and a generic instance of the base makes no sense",
      "Always - abstract classes are strictly better than interfaces",
      "Whenever you want a type to be usable by code that didn't exist when you wrote it",
      "When you need a single type to inherit from several bases at once"
    ],
    "answer": 0,
    "explain": "An abstract class earns its keep when subtypes share real fields and helper methods (so the base owns that code once) and there's no sensible standalone instance of the base. Otherwise prefer interfaces: they model capability, allow multiple implementation, and avoid the one-base-class limit and brittle deep hierarchies."
  }
]
```

---

[← Phase 5: Classes & Objects](05-classes-and-objects.md) · [Guide overview](_guide.md) · [Phase 7: Errors & I/O →](07-errors-and-io.md)
