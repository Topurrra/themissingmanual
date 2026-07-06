---
title: "Classes & Objects - Java's Whole Worldview"
guide: "java-from-zero"
phase: 5
summary: "A class is a blueprint; an object is one thing built from it with new. Here's fields, constructors, this, instance vs static, encapsulation, and the toString/equals/hashCode trio every Java beginner trips on."
tags: [java, classes, objects, constructors, encapsulation, this, oop, fields]
difficulty: intermediate
synonyms: ["java classes and objects", "java constructor explained", "java this keyword", "java encapsulation private getter setter", "java instance vs static", "what is an object in java", "java new keyword"]
updated: 2026-06-22
---

# Classes & Objects - Java's Whole Worldview

Up to now you've written methods, loops, and `if` statements inside something called `class Main` that you
mostly ignored. This phase is where `class` stops being scenery and becomes the point. In Java, the class
isn't *a* feature - it's *the* feature. Almost everything you build is a class, and almost every value you
touch is an object made from one.

That worldview runs deeper than in most languages. Python lets you write a loose function in a file; Go
has standalone functions everywhere. Java does not - no code lives outside a class. This phase shows you
how to think *in* classes: bundle data with its behavior, hand out copies of that bundle, protect it from
the rest of your program.

## The mental model: blueprint and instance

**What it actually is.** A **class** is a blueprint - a description that says "things of this kind hold
*this* data and can do *these* things." An **object** (also called an **instance**) is one concrete thing
built from it with the `new` keyword. The class is the architect's drawing; objects are the actual houses
built from it - one drawing, as many houses as you like, each with its own address and furniture.

📝 **Class** - the template/blueprint, written once. **Object / instance** - one real thing made from it,
created with `new`. The class `Account` is the idea of a bank account; `new Account(...)` is *your*
account, separate from everyone else's.

**Why this is the whole worldview.** In many languages, classes are one tool among several. In Java, every
program is a set of classes, every value with behavior is an object, and even `main` sits inside one. Stop
asking "where do I put this loose code?" and start asking "what *kind of thing* is this?"

> 💡 **Key point.** Everything below is one sentence repeated in different clothes: *the data and the
> behavior that belongs with it live together inside an object.* When a detail feels arbitrary, return to
> that line.

## Fields, constructors, and `this`

Let's build a real blueprint. An `Account` holds data (an owner's name, a balance) and offers behavior
(deposit, check balance). Data lives in **fields**; setup happens in a **constructor**; `this` is how a
method points at *its own* object.

**What it actually is.** A **field** is a variable belonging to each object - its own slice of data. A
**constructor** is a special method, named exactly like the class, that runs once when you write `new`, to
fill in the object's starting fields. **`this`** refers to "the object this method is running on" - reach
for it when a parameter name collides with a field name.

```java
public class Account {
    private String owner;     // a field - each Account gets its own
    private double balance;   // another field

    public Account(String owner, double balance) {  // constructor: same name as the class
        this.owner = owner;       // this.owner = the field; owner = the parameter
        this.balance = balance;
    }

    public void deposit(double amount) {
        this.balance += amount;   // 'this.' is optional here - no name clash
    }

    public double getBalance() {
        return balance;           // reading the field directly
    }
}
```
```java
public class Main {
    public static void main(String[] args) {
        Account ada = new Account("Ada", 100.0);  // build one instance
        Account bob = new Account("Bob", 50.0);    // build another, totally separate

        ada.deposit(25.0);

        System.out.println(ada.getBalance());
        System.out.println(bob.getBalance());
    }
}
```
```console
$ java Main.java
125.0
50.0
```
*What just happened:* `new Account("Ada", 100.0)` allocated a fresh object and ran the constructor, copying
the parameters into that object's own `owner` and `balance` fields. `ada` and `bob` are independent
objects: depositing into `ada` changed `ada`'s balance and left `bob`'s untouched, since each carries its
own copy of the data - that separateness is the entire reason objects exist.

📝 **`this`** - a reference to the current object. Inside the constructor, `owner` (parameter) and
`this.owner` (field) share a name; `this.owner = owner` means "store the parameter into my field." Without
`this.`, you'd assign the parameter to itself and the field stays empty. ⚠️ A classic silent bug - write
`owner = owner` and your account starts up with a blank name and no error to explain why.

## Instance vs static: the object vs the class itself

Some things belong to *each object*; some belong to *the class as a whole*. Java draws that line with the
keyword `static`, explaining a mystery from Phase 1: why `main` is `static`.

**What it actually is.** An **instance member** (no `static`) belongs to each object - every `Account` has
its own `balance`. A **static member** (`static`) belongs to the *class itself* - exactly one copy, shared
by everyone, existing even if you never create a single object.

```java
public class Account {
    private static int accountCount = 0;  // ONE counter, shared by the whole class
    private String owner;                  // each object's own field

    public Account(String owner) {
        this.owner = owner;
        accountCount++;                    // bump the shared counter on every new Account
    }

    public static int getAccountCount() {  // a static method - call it on the class
        return accountCount;
    }
}
```
```java
public class Main {
    public static void main(String[] args) {
        new Account("Ada");
        new Account("Bob");
        new Account("Cy");

        // Called on the CLASS, not on an object:
        System.out.println(Account.getAccountCount());
    }
}
```
```console
$ java Main.java
3
```
*What just happened:* `accountCount` is `static`, so it isn't stored inside any one `Account` - it lives on
the class, and all three constructors incremented the *same* counter. We read it with
`Account.getAccountCount()` (on the class), not `ada.getAccountCount()` (on an object), since it was never
about any single account. Instance data answers "what's true of *this* object?"; static data answers
"what's true of *all of them at once*?"

💡 **Why `main` is `static`.** When a program runs, no objects exist yet - the JVM hasn't created anything,
so the entry point can't be an instance method. `static` means "this belongs to the class and can run with
zero objects in existence" - exactly what a starting point needs.

## Encapsulation: expose behavior, not raw data

Every field above was marked `private`. That's not decoration - it's the single most important habit in
object-oriented Java.

📝 **Encapsulation** - keeping an object's data (`private` fields) hidden from the outside world, letting
other code interact with it *only* through the object's methods. Nobody reaches in and changes a field
directly.

**Why hiding state prevents whole classes of bugs.** If `balance` were `public`, *any* code could write
`ada.balance = -9999` and your account would silently go invalid - and finding that negative balance later,
you'd have no idea which of a hundred lines did it. Make the field `private` and force all changes through
one method, and that method becomes the *one* checkpoint every change must pass.

Here's a setter that refuses to let the balance go negative:

```java
public class Account {
    private double balance;

    public Account(double balance) {
        this.balance = balance;
    }

    public void withdraw(double amount) {
        if (amount > balance) {              // the guard lives in ONE place
            System.out.println("Denied: insufficient funds");
            return;                          // reject the bad change, leave balance untouched
        }
        balance -= amount;
    }

    public double getBalance() {
        return balance;                      // a getter: read access, no write access
    }
}
```
```java
public class Main {
    public static void main(String[] args) {
        Account ada = new Account(100.0);

        ada.withdraw(30.0);   // fine
        ada.withdraw(500.0);  // rejected by the guard

        System.out.println(ada.getBalance());
    }
}
```
```console
$ java Main.java
Denied: insufficient funds
70.0
```
*What just happened:* `balance` is `private`, so the only way to change it from outside is `withdraw`,
which checks the amount before touching the field. The bad withdrawal was rejected and the balance held at
`70.0`. With no other door into `balance`, you get a guarantee: *no account can ever go negative*.

💡 **Expose behavior, not raw data.** Don't reflexively generate a getter and setter for every field - that
just makes the field public with extra steps. Ask what the object should let callers *do*: an account
should let you `deposit` and `withdraw`; whether it stores that as one `balance` field or a transaction
list is the object's private business.

## The trio: `toString`, `equals`, and `hashCode`

Two final pieces complete your mental model of a Java object - one is the single most common trap that
catches beginners. Both come down to: Java objects don't behave the way you'd hope until you *tell them
how*.

**Objects print as gibberish until you override `toString`.** Print an object you made and you'll get
something like `Account@1b6d3586` - class name and memory hash, useless to a human. Java calls `toString()`
whenever it needs a text version, and the default is that gibberish. Override it and printing makes sense:

```java
public class Account {
    private String owner;
    private double balance;

    public Account(String owner, double balance) {
        this.owner = owner;
        this.balance = balance;
    }

    @Override
    public String toString() {
        return owner + " ($" + balance + ")";
    }
}
```
```java
public class Main {
    public static void main(String[] args) {
        Account ada = new Account("Ada", 100.0);
        System.out.println(ada);   // println calls toString() for you
    }
}
```
```console
$ java Main.java
Ada ($100.0)
```
*What just happened:* `System.out.println(ada)` needed text, so it called `ada.toString()`. We overrode
that method to return a readable description, so instead of `Account@1b6d3586` we got `Ada ($100.0)`.
`@Override` tells the compiler "I mean to replace an inherited method" - misspell the name and it catches
the mistake instead of silently creating a new, uncalled method.

⚠️ **The #1 Java beginner trap: `==` vs `.equals()`.** This bites *everyone*. For objects, `==` does **not**
compare contents - it asks "are these the same object in memory?" To compare *value*, use `.equals()`. The
default `.equals()` you inherit *also* just checks identity - so until overridden, two accounts with
identical data count as unequal.

```java
public class Account {
    private String owner;
    private double balance;

    public Account(String owner, double balance) {
        this.owner = owner;
        this.balance = balance;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Account)) return false;
        Account other = (Account) o;
        return balance == other.balance && owner.equals(other.owner);
    }

    @Override
    public int hashCode() {
        return java.util.Objects.hash(owner, balance);  // override TOGETHER with equals
    }
}
```
```java
public class Main {
    public static void main(String[] args) {
        Account a = new Account("Ada", 100.0);
        Account b = new Account("Ada", 100.0);  // same data, different object

        System.out.println(a == b);        // same object in memory?
        System.out.println(a.equals(b));   // same value?
    }
}
```
```console
$ java Main.java
false
true
```
*What just happened:* `a` and `b` hold identical data but are two separate objects, so `a == b` is `false` -
`==` compares *identity*, not contents. Our overridden `.equals()` compares the actual fields, so
`a.equals(b)` is `true`. Rule to burn in: **use `.equals()` for value comparison, reserve `==` for "is it
literally the same object."** (Strings are the most common place this bites - Phase 9 has the full gotcha.)

⚠️ **Override `equals` and `hashCode` *together*, always.** Not optional politeness - it's a contract Java
relies on. Hash-based collections like `HashMap`/`HashSet` use `hashCode()` to find objects fast: *equal
objects must have equal hash codes.* Override `equals` but not `hashCode`, and two "equal" accounts can
land in different buckets - a `HashSet` stores both as distinct, a `HashMap` lookup fails to find a key
that's really there.

## Recap

1. A **class** is a blueprint; an **object / instance** is one thing built from it with **`new`**. In
   Java, this is the whole worldview - almost everything you build is a class.
2. **Fields** hold each object's own data; a **constructor** (same name as the class) fills them in when
   you call `new`; **`this`** points at the current object and disambiguates a field from a same-named
   parameter.
3. **Instance** members belong to each object; **`static`** members belong to the class itself (one shared
   copy) - which is exactly why `main` is `static`: it runs before any object exists.
4. **Encapsulation** means `private` fields plus methods as the only doors in. Putting the rules in one
   guarded method (reject a negative balance) prevents whole classes of bugs. Expose behavior, not raw data.
5. Override **`toString`** so objects print readably instead of as `Account@1b6d3586`.
6. ⚠️ `==` compares object *identity*; **`.equals()`** compares *value* - and you must override **`equals`
   and `hashCode` together** or hash-based collections break.

You can now design a Java object: bundle the data, guard it, give it behavior, make it print and compare
sensibly. Next: connecting objects to each other - how one class builds on another, and how interfaces let
unrelated classes promise the same behavior.

## Quick check

Test yourself on the ideas most likely to bite you in real code:

```quiz
[
  {
    "q": "Inside a constructor, why write `this.owner = owner` instead of just `owner = owner`?",
    "choices": [
      "`this.owner` is the object's field while `owner` is the parameter - without `this.`, you'd just assign the parameter to itself and the field would stay empty",
      "`this.` makes the assignment run faster",
      "It's purely stylistic; both lines do exactly the same thing",
      "`this.` is required in every assignment inside any method"
    ],
    "answer": 0,
    "explain": "When a parameter shares a name with a field, the unqualified name refers to the parameter. `this.owner` explicitly means the field. Writing `owner = owner` assigns the parameter to itself, leaving the field at its default - a silent bug with no error."
  },
  {
    "q": "You create two `Account` objects with identical owner and balance. What do `a == b` and `a.equals(b)` return, assuming `equals` is properly overridden?",
    "choices": [
      "`a == b` is false (different objects in memory); `a.equals(b)` is true (same values)",
      "Both are true - identical data means identical objects",
      "Both are false - Java never considers separate objects equal",
      "`a == b` is true and `a.equals(b)` is false"
    ],
    "answer": 0,
    "explain": "`==` compares object identity: two separate objects are never `==` even with identical data. A properly overridden `.equals()` compares the actual field values, so it returns true. This `==` vs `.equals()` split is the #1 Java beginner trap."
  },
  {
    "q": "Why must you override `hashCode` whenever you override `equals`?",
    "choices": [
      "Hash-based collections (HashMap, HashSet) require equal objects to have equal hash codes - override only `equals` and lookups silently break",
      "`hashCode` is what makes objects print readably",
      "The compiler refuses to compile a class that overrides only one of them",
      "`hashCode` controls how the constructor initializes fields"
    ],
    "answer": 0,
    "explain": "It's a contract: equal objects must return equal hash codes. HashMap/HashSet use hashCode to place objects in buckets, so if two 'equal' objects hash differently, a set stores both as distinct and a map lookup fails to find a key that's really there. Always change the pair together."
  }
]
```

---

[← Phase 4: Control Flow & Methods](04-control-flow-and-methods.md) · [Guide overview](_guide.md) · [Phase 6: Inheritance & Interfaces →](06-inheritance-and-interfaces.md)
