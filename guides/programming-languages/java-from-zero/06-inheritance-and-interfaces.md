---
title: "Inheritance & Interfaces - Sharing Behavior"
guide: "java-from-zero"
phase: 6
summary: "How Java classes share behavior: inheritance with extends, overriding methods, polymorphism, interfaces as contracts, and the honest call between an interface and an abstract class."
tags: [java, inheritance, interfaces, polymorphism, abstract, extends, implements, override]
difficulty: intermediate
synonyms: ["java inheritance extends", "java interface implements", "java polymorphism explained", "java abstract class vs interface", "java method override", "java super keyword", "java default method interface"]
updated: 2026-06-22
---

# Inheritance & Interfaces - Sharing Behavior

In Phase 5 you learned to build one self-contained object: bundle the data, guard it, give it behavior.
This phase is about the relationships *between* objects - how one class can build on another, and how
unrelated classes can promise the same capability. These are the two mechanisms Java gives you for sharing
behavior, and the most valuable thing you'll take from this phase isn't the syntax. It's knowing *which one
to reach for*, because that single judgment call separates clean Java from the tangled inheritance towers
that give object-oriented code a bad name.

The mental model to hold onto: there are two ways to say "this thing is related to that thing." One is **"is
a kind of"** - a `Dog` *is a kind of* `Animal`, so it inherits what an animal does. The other is **"is
capable of"** - a `Dog` *is capable of* making a sound, and so is a car horn and a doorbell, even though
they share nothing else. Inheritance handles the first. Interfaces handle the second. Most beginners over-use
the first and under-use the second; by the end you'll know why the pros lean the other way.

## Inheritance: building on a class with `extends`

**What it actually is.** **Inheritance** lets one class - the **subclass** - take everything a
**superclass** has (its fields and methods) and add to or change it. You write `class Dog extends Animal`,
and `Dog` automatically gets `Animal`'s behavior without copying a single line. The keyword `super` lets the
subclass reach back to the superclass - most often to call its constructor.

**When it's the right tool.** Inheritance models a genuine **"is-a"** relationship. A `Dog` *is an*
`Animal`. A `SavingsAccount` *is an* `Account`. If you can't say "X is a kind of Y" with a straight face,
inheritance is the wrong tool - and we'll come back to that warning, because it's the one that matters most.

```java
public class Animal {
    protected String name;            // protected = visible to subclasses

    public Animal(String name) {
        this.name = name;
    }

    public void describe() {
        System.out.println(name + " is an animal.");
    }
}
```
```java
public class Dog extends Animal {     // Dog IS A kind of Animal
    public Dog(String name) {
        super(name);                  // call Animal's constructor to set up the inherited part
    }

    public void fetch() {             // brand-new behavior, only Dogs have it
        System.out.println(name + " fetches the ball.");
    }
}
```
```java
public class Main {
    public static void main(String[] args) {
        Dog rex = new Dog("Rex");
        rex.describe();   // inherited from Animal - never written in Dog
        rex.fetch();      // added by Dog
    }
}
```
```console
$ java Main.java
Rex is an animal.
Rex fetches the ball.
```
*What just happened:* `Dog extends Animal`, so `rex` got `describe()` for free - that method lives in
`Animal`, but `rex` can call it as if it were its own. The `super(name)` line in `Dog`'s constructor handed
the name up to `Animal`'s constructor, which is the part of `rex` that knows how to store it. Then `Dog`
added `fetch()`, behavior no plain `Animal` has. That's inheritance: reuse what the superclass already does,
then extend it.

📝 **`protected`** - a third visibility level alongside `public` and `private`. A `protected` field or method
is hidden from the outside world but *visible to subclasses*. That's why `Dog`'s `fetch()` could read `name`
directly. Use it sparingly; `private` plus a getter is often still the cleaner choice.

## Overriding: replacing an inherited method

Inheriting a method as-is is useful, but the real power is *changing* it. A subclass can **override** a
superclass method - provide its own version that runs instead of the inherited one.

**What it actually is.** **Overriding** means a subclass redefines a method it inherited, using the exact
same signature (name and parameters), to give it different behavior. You mark it with `@Override` so the
compiler verifies you actually matched an inherited method.

⚠️ **Don't confuse overriding with overloading (from Phase 4).** They sound alike and mean opposite things.
**Overloading** is *several methods with the same name but different parameters* in one class (`print(int)`
and `print(String)`) - the compiler picks which one based on the arguments. **Overriding** is *one method
signature, redefined in a subclass* - Java picks which version at runtime based on the object's actual type.
Overloading is a compile-time convenience; overriding is the engine behind polymorphism.

```java
public class Animal {
    protected String name;

    public Animal(String name) { this.name = name; }

    public String speak() {           // the default sound
        return name + " makes a sound.";
    }
}
```
```java
public class Dog extends Animal {
    public Dog(String name) { super(name); }

    @Override
    public String speak() {           // replace Animal's version for Dogs
        return name + " says: Woof!";
    }
}

public class Cat extends Animal {
    public Cat(String name) { super(name); }

    @Override
    public String speak() {
        return name + " says: Meow!";
    }
}
```
```java
public class Main {
    public static void main(String[] args) {
        Animal a = new Dog("Rex");    // declared Animal, but it's really a Dog
        Animal b = new Cat("Mia");

        System.out.println(a.speak());   // which speak() runs?
        System.out.println(b.speak());
    }
}
```
```console
$ java Main.java
Rex says: Woof!
Mia says: Meow!
```
*What just happened:* Both `a` and `b` are *declared* as `Animal`, yet `a.speak()` ran `Dog`'s version and
`b.speak()` ran `Cat`'s. Java looked at the object's **actual runtime type** - not the declared type - and
called the matching override. This is **dynamic dispatch**: the decision about which method body to run is
made when the program runs, based on what the object truly is. Hold that thought, because it's the whole
point of the next section.

💡 **Why `@Override` earns its keep.** It's optional, but always write it. If you misspell the method name or
get a parameter type wrong, you haven't overridden anything - you've quietly created a *new* method, and the
inherited one still runs. The `@Override` annotation makes the compiler check your work and reject the
mistake, turning a silent runtime bug into an obvious compile error.

## Polymorphism: one type, many behaviors

This is the payoff. Everything above was setup for this idea, which is the reason inheritance exists at all.

📝 **Polymorphism** - a variable of a *supertype* can hold an object of *any subtype*, and when you call an
overridden method on it, the version matching the object's **real** type runs. One line of code,
`thing.speak()`, does the right thing for a `Dog`, a `Cat`, or any future animal - without that line ever
knowing which it's dealing with. ("Polymorphism" is Greek for "many shapes": one variable, many possible
concrete shapes underneath.)

**Why this is the whole point.** Without polymorphism, handling three animal types means three branches of
`if/else` checking what each one is. With it, you write the loop *once* against the supertype, and each
object brings its own behavior along. Add a `Cow` class next year and the loop doesn't change - it already
knows how to ask any `Animal` to `speak()`. You program against the general idea, and the specifics take care
of themselves.

```java
import java.util.List;

public class Main {
    public static void main(String[] args) {
        // A list of Animal - but each element is really a different subtype
        List<Animal> zoo = List.of(
            new Dog("Rex"),
            new Cat("Mia"),
            new Dog("Buddy")
        );

        for (Animal a : zoo) {        // we only know they're Animals
            System.out.println(a.speak());   // each runs ITS OWN speak()
        }
    }
}
```
```console
$ java Main.java
Rex says: Woof!
Mia says: Meow!
Buddy says: Woof!
```
*What just happened:* The loop variable `a` is typed `Animal`, so the loop has no idea whether it's holding a
dog or a cat. Yet each `a.speak()` produced the correct sound, because dynamic dispatch resolved the call
against each object's real type at runtime. *This* is why we bothered with inheritance and overriding: you
write one loop against the supertype, and it correctly handles every subtype - including ones that don't
exist yet. New subclass, zero changes to this code.

## Interfaces: a contract any class can sign

Inheritance has a hard limit: a class can `extend` **exactly one** superclass. Java has no multiple
inheritance of classes - it's a deliberate choice that avoids a famous category of ambiguity bugs. But you
often need a class to play several roles. That's what interfaces are for.

📝 **Interface** - a *contract*: a named list of method signatures a class promises to provide. A class that
`implements` an interface must supply a body for each method, or it won't compile. Unlike `extends`, a class
can `implements` **many** interfaces at once - it can sign as many contracts as it likes. The interface says
*what* must be possible; each class decides *how*.

```java
public interface Drawable {       // the contract: "anything drawable can draw itself"
    void draw();                  // no body - just the promise
}
```
```java
public class Circle implements Drawable {
    @Override
    public void draw() {
        System.out.println("Drawing a circle ◯");
    }
}

public class Square implements Drawable {
    @Override
    public void draw() {
        System.out.println("Drawing a square ▢");
    }
}
```
```java
import java.util.List;

public class Main {
    public static void main(String[] args) {
        List<Drawable> shapes = List.of(new Circle(), new Square());
        for (Drawable d : shapes) {
            d.draw();             // polymorphism again - via interface this time
        }
    }
}
```
```console
$ java Main.java
Drawing a circle ◯
Drawing a square ▢
```
*What just happened:* `Circle` and `Square` share no common parent class - they're unrelated. But both
*signed the same contract* by implementing `Drawable`, so we can treat them uniformly as `Drawable` and loop
over them with the same polymorphism you just saw. The interface gave us shared behavior *without* forcing an
"is-a" family tree. That's its superpower: it groups things by *capability*, not by ancestry.

💡 **Default methods.** Since Java 8, an interface method can ship with a body using the `default` keyword -
a fallback implementation classes inherit unless they override it. It exists mainly so library authors can
add a method to an existing interface without breaking every class that already implements it. You'll see it
in the standard library (`List.sort`, for one); reach for it rarely in your own code.

## Abstract classes - and the call between the two

There's a middle ground between a fully-built class and a pure interface: the **abstract class**.

**What it actually is.** An `abstract` class is one you *can't instantiate directly* - `new Animal(...)` is a
compile error if `Animal` is abstract. It exists only to be extended. It can mix two things an interface
historically couldn't: **shared state** (fields, real constructors) and **shared code** (fully-written
methods), alongside `abstract` methods that have no body and *force* every subclass to supply one.

```java
public abstract class Shape {
    private final String name;        // shared STATE - interfaces can't hold this

    public Shape(String name) {       // shared constructor
        this.name = name;
    }

    public abstract double area();    // no body - every subclass MUST implement this

    public void describe() {          // shared CODE, reused by all subclasses
        System.out.println(name + " has area " + area());
    }
}
```
```java
public class Rectangle extends Shape {
    private final double w, h;

    public Rectangle(double w, double h) {
        super("Rectangle");
        this.w = w;
        this.h = h;
    }

    @Override
    public double area() {            // satisfy the abstract method
        return w * h;
    }
}
```
```java
public class Main {
    public static void main(String[] args) {
        // Shape s = new Shape("x");  // ERROR: can't instantiate an abstract class
        Shape r = new Rectangle(3, 4);
        r.describe();                 // uses shared describe(), which calls our area()
    }
}
```
```console
$ java Main.java
Rectangle has area 12.0
```
*What just happened:* `Shape` can't be built on its own - it's a half-finished blueprint. `Rectangle`
finished it by implementing the abstract `area()`, and in return inherited the ready-made `describe()` and
the `name` field. Notice `describe()` calls `area()` and gets `Rectangle`'s version via dynamic dispatch:
the abstract class wrote the shared logic once and let each subclass fill in the one piece that differs.

💡 **The honest guidance: interface or abstract class?** Here's the real-world rule of thumb.
- Reach for an **interface** to describe a *capability or contract* - "can be drawn," "can be compared,"
  "can be saved." It's the lighter, more flexible tool, a class can implement many of them, and modern Java
  (with default methods) covers most cases interfaces once couldn't. **When unsure, prefer an interface.**
- Reach for an **abstract class** only when subclasses genuinely need to *share state or substantial code* in
  a common base - like `Shape`'s `name` field and its `describe()` method. The one-superclass limit is the
  price you pay for that sharing.

⚠️ **Favor composition and interfaces over deep inheritance.** The single most common object-oriented
mistake is building tall inheritance hierarchies - `A extends B extends C extends D` - to share code.
They're rigid (one superclass, forever), brittle (a tweak in `B` ripples down to everything), and they force
"is-a" relationships that often aren't true. The modern habit: model *capabilities* with interfaces, and when
one object needs another's behavior, **hold an instance of it as a field** (composition) instead of
inheriting from it. Inheritance is a sharp tool for genuine "is-a" families; reach for it last, not first.

## Recap

1. **Inheritance** (`class Dog extends Animal`) lets a subclass reuse and extend a superclass; `super(...)`
   calls the superclass constructor. Use it only for a true **"is-a"** relationship.
2. **Overriding** redefines an inherited method (mark it `@Override`); it's resolved at runtime by the
   object's real type - distinct from **overloading**, which is same-name methods chosen at compile time.
3. **Polymorphism** is the payoff: a supertype variable holds any subtype, and the right overridden method
   runs automatically - so you write one loop that handles every subtype, present and future.
4. An **interface** is a contract of methods a class promises (`implements`); a class can implement **many**
   interfaces, grouping unrelated classes by *capability* rather than ancestry. `default` methods add an
   optional body.
5. An **abstract class** can't be instantiated and forces subclasses to implement its `abstract` methods,
   but can also share state and code in a base.
6. 💡 Prefer an **interface** for a capability (and when in doubt); use an **abstract class** for shared
   state/code. ⚠️ Favor **composition + interfaces** over deep inheritance towers.

You can now make classes share behavior two ways - and, more importantly, choose between them with judgment
instead of habit. Next we handle what happens when things go wrong: errors, exceptions, and reading and
writing data.

## Quick check

Test yourself on the distinctions most likely to trip you in real code:

```quiz
[
  {
    "q": "A variable is declared `Animal a` but actually holds a `Dog` object, and `Dog` overrides `speak()`. When you call `a.speak()`, which version runs?",
    "choices": [
      "Dog's version - Java dispatches on the object's real runtime type, not the declared type",
      "Animal's version - the declared type decides which method runs",
      "Neither; it's a compile error because the types don't match",
      "Both, one after the other, starting with Animal's"
    ],
    "answer": 0,
    "explain": "This is dynamic dispatch, the engine behind polymorphism. Java looks at what the object actually is at runtime (a Dog), not how the variable is declared (Animal), so Dog's overridden speak() runs. That's exactly why one loop over a List<Animal> can handle every subtype correctly."
  },
  {
    "q": "What's the difference between overriding and overloading?",
    "choices": [
      "Overriding redefines an inherited method (same signature) in a subclass, resolved at runtime; overloading is several same-name methods with different parameters in one class, resolved at compile time",
      "They're two words for the same thing",
      "Overloading replaces a superclass method; overriding adds a new parameter list",
      "Overriding works only on static methods; overloading only on instance methods"
    ],
    "answer": 0,
    "explain": "Overriding = one signature redefined in a subclass, picked at runtime by the object's real type (the basis of polymorphism). Overloading = same name, different parameter lists in one class, picked at compile time by the arguments. They sound alike but do opposite things."
  },
  {
    "q": "You need several unrelated classes to share a capability, and a class already extends something else. Interface or abstract class?",
    "choices": [
      "Interface - a class can implement many interfaces, and they group classes by capability rather than ancestry",
      "Abstract class - it's always the better choice for shared behavior",
      "Neither works; you must copy the methods into each class",
      "Abstract class, because a class can extend several of them at once"
    ],
    "answer": 0,
    "explain": "A class can extend only one class but implement many interfaces, so when classes are unrelated (or already extend something), an interface is the fit - it describes a capability without forcing an is-a family tree. Reach for an abstract class only when subclasses need to share actual state or code in a common base."
  }
]
```

---

[← Phase 5: Classes & Objects](05-classes-and-objects.md) · [Guide overview](_guide.md) · [Phase 7: Errors & I/O →](07-errors-and-io.md)
