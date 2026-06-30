---
title: "Generics, Deep - Type Safety Without Duplication"
guide: "java-from-zero"
phase: 10
summary: "Generics move type safety from runtime to compile time. Generic methods and classes, bounded type parameters, wildcards and PECS, and why type erasure makes generics vanish at runtime."
tags: [java, generics, type-parameters, bounded-types, wildcards, type-erasure, pecs]
difficulty: advanced
synonyms: ["java generics explained", "java bounded type parameter extends", "java wildcards super extends", "java pecs producer extends consumer super", "java type erasure", "java generic method", "java generic class"]
updated: 2026-06-22
---

# Generics, Deep - Type Safety Without Duplication

Back in [Phase 3](03-collections.md) you wrote `List<String>` and moved on. It just worked: you put strings in, you got strings out, no casting. That `<String>` was your first taste of generics, and it was doing more for you than you knew.

This phase is the country behind that postcard. The mental model to carry through all of it: **generics are how you write one piece of code that works for many types while the compiler still checks every type for you.** Before generics, you got *one* of those - reuse *or* safety, never both. Generics give you both at once, and they pay for it with a single weird tax at runtime called type erasure. Once you understand that trade, the confusing parts (wildcards, the errors the compiler throws at you) stop being arbitrary rules and start being consequences.

## Why generics exist - the pain they replaced

To feel why generics matter, you have to see life without them. Before Java 5, collections held `Object` - the universal supertype every class extends. A list could hold anything, which sounds flexible until you try to *get something back out*.

```java
import java.util.ArrayList;
import java.util.List;

// Pre-generics style: a raw list holds Object.
List names = new ArrayList();
names.add("Ada");
names.add("Grace");
names.add(42);                  // oops - nothing stops this

// Getting a value back gives you an Object. You must cast.
String first = (String) names.get(0);   // fine
String third = (String) names.get(2);   // 42 is not a String...
```
```console
Exception in thread "main" java.lang.ClassCastException:
  class java.lang.Integer cannot be cast to class java.lang.String
```
*What just happened:* the raw `List` accepted a `String`, a `String`, and an `Integer` without complaint - to it, they're all just `Object`. The trouble surfaced at `names.get(2)`: you *promised* the compiler it was a `String` with the cast, the promise was a lie, and the JVM threw `ClassCastException` **at runtime**. Nothing warned you while writing the code. The bug shipped, then exploded in production.

Now the same idea with generics:

```java
import java.util.ArrayList;
import java.util.List;

List<String> names = new ArrayList<>();
names.add("Ada");
names.add(42);                  // compile error - caught before you run
```
```console
error: incompatible types: int cannot be converted to String
        names.add(42);
                  ^
```
*What just happened:* `List<String>` told the compiler "this list holds strings, full stop." The bad `add(42)` was rejected **at compile time** - the program never even built. And because the compiler now knows the element type, `names.get(0)` hands you a `String` directly, no cast required. That's the whole pitch in one move: generics take the safety check that used to blow up at runtime and perform it while you type. 💡 A compile error is a gift - it's a runtime crash that got caught early, when it's cheap to fix.

## Generic methods and classes - `<T>` is a parameter for types

The `<String>` you've been writing is *using* a generic type. Now you'll *write* one. The core idea: a **type parameter** is a placeholder for a type, written in angle brackets, that gets filled in at the call site - exactly like a regular parameter is a placeholder for a value.

📝 **Type parameter** - a stand-in name (conventionally a single uppercase letter: `T` for "type," `E` for "element," `K`/`V` for "key"/"value") that represents some type the caller will supply. It lets one definition serve every type.

A **generic method** declares its type parameter before the return type:

```java
import java.util.List;

// <T> says "this method introduces a type parameter named T."
// It works for a List of ANY type, returning that same type.
static <T> T first(List<T> list) {
    return list.get(0);
}

public static void main(String[] args) {
    List<String> words = List.of("alpha", "beta");
    List<Integer> nums = List.of(10, 20, 30);

    String w = first(words);    // T inferred as String
    int n = first(nums);        // T inferred as Integer
    System.out.println(w + " " + n);
}
```
```console
alpha 10
```
*What just happened:* the `<T>` before the return type introduced a type parameter. Inside the method, `T` stands for whatever type the list holds; the return type `T` means "I give back the same type I received." At the call sites you never wrote `<String>` or `<Integer>` - the compiler performed **type inference**, reading the type off the argument. `first(words)` made `T` be `String`, so `w` is a `String` with no cast. One method, every element type, full safety.

A **generic class** puts the type parameter on the class itself, so every instance is bound to a chosen type:

```java
// Box<T>: a container holding exactly one value of some type T.
class Box<T> {
    private final T value;

    Box(T value) {
        this.value = value;
    }

    T get() {
        return value;
    }
}

public static void main(String[] args) {
    Box<String> nameBox = new Box<>("Ada");   // T = String for this box
    Box<Integer> ageBox = new Box<>(36);      // T = Integer for this box

    String name = nameBox.get();              // no cast - compiler knows it's String
    System.out.println(name + " is " + ageBox.get());
}
```
*What just happened:* `class Box<T>` declared `T` once at the top, and the whole class body could use it - the field, the constructor parameter, the return type. When you wrote `new Box<>("Ada")`, the `<>` (the "diamond") let the compiler infer `T` as `String` from the argument, so `nameBox.get()` returns a `String` directly. `ageBox` is a *different* binding where `T` is `Integer`. This is exactly how `List<E>`, `Optional<T>`, and `Map<K, V>` in the standard library are built - they're generic classes, and you've been instantiating them all along.

## Bounded type parameters - "any type, *as long as*"

A bare `<T>` means "literally any type." That's often too generous: if your method needs to *do* something with `T` - compare it, add it, call a method on it - `T` can't be truly anything, because not every type supports that operation. A **bounded type parameter** narrows the set of allowed types and, in exchange, unlocks the operations that bound guarantees.

📝 **Bound** - a constraint of the form `<T extends SomeType>` meaning "`T` must be `SomeType` or a subtype of it." It restricts which types the caller may use *and* lets the method body rely on everything `SomeType` provides. (Note: `extends` here means "is-a," and covers both extending classes and implementing interfaces.)

Here's the classic case - finding the maximum of a list. To compare two `T`s, each one must know how to compare *itself*, which is exactly what the `Comparable` interface promises:

```java
import java.util.List;

// T must implement Comparable<T> - i.e. T values can be compared to each other.
static <T extends Comparable<T>> T max(List<T> list) {
    T biggest = list.get(0);
    for (T item : list) {
        if (item.compareTo(biggest) > 0) {   // legal ONLY because of the bound
            biggest = item;
        }
    }
    return biggest;
}

public static void main(String[] args) {
    System.out.println(max(List.of(3, 9, 2, 7)));        // Integer is Comparable
    System.out.println(max(List.of("pear", "fig", "kiwi"))); // String is Comparable
}
```
```console
9
pear
```
*What just happened:* `<T extends Comparable<T>>` reads "for any type `T` that can be compared to itself." That bound is what makes `item.compareTo(biggest)` legal - without it, `T` might be a type with no `compareTo`, so the compiler couldn't allow the call. `Integer` and `String` both implement `Comparable`, so both work. The bound does double duty: it *keeps out* types that can't be compared, and it *grants* the method the right to compare.

Try it with a bound that isn't met and the compiler stops you cold:

```java
// A plain class that does NOT implement Comparable.
class Widget {}

static <T extends Number> double sum(List<T> list) {
    double total = 0;
    for (T item : list) {
        total += item.doubleValue();   // doubleValue() comes from Number
    }
    return total;
}

public static void main(String[] args) {
    sum(List.of(1, 2, 3));                 // fine: Integer extends Number
    sum(List.of(new Widget(), new Widget())); // bound violated
}
```
```console
error: method sum in class Demo cannot be applied to given types;
  required: List<T>
  found:    List<Widget>
  reason: inference variable T has incompatible bounds
    upper bounds: Number
    Widget is not within its upper bound
```
*What just happened:* `<T extends Number>` only admits `Number` and its subtypes (`Integer`, `Double`, `Long`, and so on), which is what makes `item.doubleValue()` safe to call. `Integer` satisfies the bound, so the first call compiles. `Widget` doesn't extend `Number`, so the second call is rejected before the program ever runs - "Widget is not within its upper bound." The bound is a contract the compiler enforces on callers and lets the body rely on, both at once.

## Wildcards and PECS - the part everyone trips on

Here's where generics get genuinely subtle, and it's worth slowing down. ⚠️ This is the section people find confusing - not because the rule is hard, but because the *reason* behind it is unintuitive. We'll build the intuition, not just hand you the mnemonic.

Start with a surprise. You'd think `List<Integer>` is a kind of `List<Number>` - after all, an `Integer` *is* a `Number`. It is not:

```java
import java.util.List;

List<Integer> ints = List.of(1, 2, 3);
List<Number> nums = ints;        // does NOT compile
```
```console
error: incompatible types: List<Integer> cannot be converted to List<Number>
```
*What just happened:* generics are **invariant** - `List<Integer>` and `List<Number>` are unrelated types even though `Integer` extends `Number`. Why so strict? Imagine it *were* allowed: through the `List<Number>` alias `nums`, you could call `nums.add(3.14)` - a `Double` is a `Number`, so that looks fine - but you'd have just stuffed a `Double` into a list that the rest of your code believes holds only `Integer`s. The invariance is the compiler refusing to let that happen.

But invariance is sometimes *too* strict. If you write a method to sum a list of numbers, you'd like it to accept `List<Integer>`, `List<Double>`, and `List<Long>`. **Wildcards** (`?`) restore that flexibility safely, and they come in two flavors that are mirror images of each other.

📝 **Upper-bounded wildcard `? extends T`** - "some specific subtype of `T`, but I don't know which." You can *read* `T`s out of it. **Lower-bounded wildcard `? super T`** - "some specific supertype of `T`, but I don't know which." You can *write* `T`s into it.

`? extends T` makes a collection a **producer** - a source you read from:

```java
import java.util.List;

// Accepts a List of ANY subtype of Number - reads values out and sums them.
static double sumAll(List<? extends Number> list) {
    double total = 0;
    for (Number n : list) {          // reading as Number is always safe
        total += n.doubleValue();
    }
    return total;
}

public static void main(String[] args) {
    System.out.println(sumAll(List.of(1, 2, 3)));        // List<Integer> - OK!
    System.out.println(sumAll(List.of(1.5, 2.5)));       // List<Double>  - OK!
}
```
*What just happened:* `List<? extends Number>` means "a list of *some* unknown subtype of `Number`." That's loose enough to accept both `List<Integer>` and `List<Double>`, fixing the invariance problem for reading. Reading is safe: whatever the real element type is, it's *some* kind of `Number`, so pulling items out as `Number` always works.

But you cannot *add* to a `? extends` collection - and this is the famous head-scratcher:

```java
static void brokenAdd(List<? extends Number> list) {
    list.add(42);    // does NOT compile
}
```
```console
error: incompatible types: int cannot be converted to CAP#1
  where CAP#1 is a fresh type-variable:
    CAP#1 extends Number from capture of ? extends Number
```
*What just happened:* the compiler refuses `list.add(42)` because it doesn't know the *real* element type. `list` might actually be a `List<Double>`. If adding an `Integer` were allowed, you'd corrupt a `List<Double>` with an `Integer` - the exact disaster invariance protects against. With `? extends`, the unknown type sits on the *output* side: you may take `Number`s out, but you may never put anything in (except `null`). The collection is read-only from the caller's view.

The mirror image is `? super T`, which makes a collection a **consumer** - a sink you write into:

```java
import java.util.ArrayList;
import java.util.List;

// Accepts any list that can HOLD an Integer: List<Integer>, List<Number>, List<Object>.
static void addThree(List<? super Integer> sink) {
    sink.add(1);     // safe: a List<Number> or List<Object> can hold an Integer
    sink.add(2);
    sink.add(3);
}

public static void main(String[] args) {
    List<Number> nums = new ArrayList<>();
    addThree(nums);              // works - Number is a supertype of Integer
    System.out.println(nums);
}
```
```console
[1, 2, 3]
```
*What just happened:* `List<? super Integer>` means "a list of `Integer` or any supertype of it." Writing `Integer`s into it is always safe - a `List<Number>` or `List<Object>` can certainly hold an `Integer`. But the reverse is now restricted: if you read from it, the best the compiler can promise is `Object`, because the real list might hold any supertype. With `? super`, the unknown type sits on the *input* side: you may put `Integer`s in, but you can't pull specific types out.

That symmetry - extends for reading, super for writing - has a mnemonic that the whole Java world uses:

📝 **PECS - Producer Extends, Consumer Super.** If a parameter *produces* values you'll read, use `? extends T`. If it *consumes* values you'll write, use `? super T`. (Pulling fruit *out* of a basket? The basket is a producer → `extends`. Dropping fruit *into* it? Consumer → `super`.)

💡 **Key point.** The single thread tying all of this together: the wildcard puts the "I don't know exactly which type" on whichever side is *unsafe*. `? extends` doesn't know what you'd be adding, so it bans adds. `? super` doesn't know what you'd be reading, so it bans typed reads. The rules aren't arbitrary - they're the minimum restrictions that keep you from corrupting a collection whose real type you can't see.

## Type erasure - generics are a compile-time ghost

Here's the twist that explains a whole category of "wait, *why* can't I do that?" errors. All the type safety above happens at **compile time**. Once the compiler is satisfied, it *throws the type information away*. At runtime, the generics are gone.

📝 **Type erasure** - the compiler uses type parameters to check your code, then erases them, replacing each `T` with its bound (or `Object` if unbounded). The resulting bytecode has no generics in it at all. `List<String>` and `List<Integer>` compile down to the same plain `List`.

You can watch the erasure with a runtime class check:

```java
import java.util.ArrayList;
import java.util.List;

public static void main(String[] args) {
    List<String> strings = new ArrayList<>();
    List<Integer> integers = new ArrayList<>();

    // At runtime, both are just "ArrayList" - the <String>/<Integer> is gone.
    System.out.println(strings.getClass() == integers.getClass());
}
```
```console
true
```
*What just happened:* `List<String>` and `List<Integer>` are different types to the *compiler*, which is why it could keep your strings and integers from mixing. But `getClass()` asks the *runtime* what the object is, and the runtime sees only `ArrayList` for both - the type parameter was erased. The generics did their job during compilation and then evaporated.

This single fact explains a cluster of restrictions that otherwise look random:

```java
class Box<T> {
    T makeOne() {
        return new T();      // does NOT compile
    }
}
```
```console
error: type parameter T cannot be instantiated directly
        return new T();
               ^
```
*What just happened:* you can't write `new T()` because at runtime there *is* no `T` - it's been erased to `Object`, and the JVM wouldn't know which constructor to call. The same erasure forbids `new T[10]` (no generic array creation) and makes this illegal too:

```java
class Printer {
    void print(List<String> items) {}    // erases to print(List)
    void print(List<Integer> items) {}   // ALSO erases to print(List) - clash!
}
```
```console
error: name clash: print(List<String>) and print(List<Integer>)
  have the same erasure
```
*What just happened:* you tried to overload `print` on `List<String>` versus `List<Integer>`. But after erasure both become `print(List)` - the same method signature - so the compiler sees a duplicate. Two methods that look distinct in source are identical in bytecode. This is the "same erasure" error, and now you know exactly why it happens.

💡 **Key point.** Generics protect you at compile time, then vanish. That's the mental model that turns confusing errors readable: whenever the compiler complains about `T` at runtime-shaped operations (`new`, arrays, `instanceof`, overloading), ask "what is `T` after erasure?" The answer - usually `Object` - explains the restriction. Generics are a compile-time fiction the compiler maintains for *you*; the JVM never sees them.

## Recap

1. **Generics move type safety from runtime to compile time.** Before them, collections held `Object` and forced casts that blew up as `ClassCastException`; `List<String>` makes the same mistake a compile error instead.
2. **Type parameters** (`<T>`) are placeholders for types. A **generic method** declares `<T>` before its return type; a **generic class** (`Box<T>`) declares it on the class. The compiler **infers** the type at the call site, so you rarely spell it out.
3. **Bounded type parameters** (`<T extends Comparable<T>>`, `<T extends Number>`) restrict which types are allowed *and* unlock the operations that bound guarantees - the body can call `compareTo` or `doubleValue` only because the bound promised them.
4. **Wildcards** fix invariance safely. **PECS - Producer Extends, Consumer Super**: read from a `? extends T` (you can't add to it), write to a `? super T` (you can't read specific types from it). The wildcard puts the unknown type on whichever side would be unsafe.
5. **Type erasure** means generics are compile-time only - `T` becomes its bound (usually `Object`) in the bytecode, so `List<String>` and `List<Integer>` are the same class at runtime. That's why you can't write `new T()`, `new T[]`, or overload on erased types.

You can now read other people's generic signatures, write your own, and decode the compiler's type complaints instead of guessing. Next we look at **lambdas and functional interfaces** - passing behavior around as values, which leans on generics constantly (`Function<T, R>`, `Predicate<T>`) to stay type-safe.

## Quick check

Test yourself on the three ideas that matter most - bounds, PECS, and erasure:

```quiz
[
  {
    "q": "Why does `static <T extends Comparable<T>> T max(List<T> list)` need the `extends Comparable<T>` bound?",
    "choices": [
      "Without it, the compiler can't guarantee values of T support compareTo, so the comparison in the body would be rejected",
      "It makes the method run faster by skipping runtime type checks",
      "It forces the list to be stored on the heap instead of the stack",
      "It's optional styling - the method compiles fine with a bare <T>"
    ],
    "answer": 0,
    "explain": "A bound both restricts which types T may be and unlocks that type's methods inside the body. Comparable provides compareTo; without the bound, T could be a non-comparable type, so item.compareTo(biggest) would be rejected."
  },
  {
    "q": "You have `List<? extends Number> list`. Why does `list.add(42)` fail to compile?",
    "choices": [
      "The real element type is unknown - it might be List<Double> - so adding an Integer could corrupt it; ? extends is read-only",
      "42 is too large to be a valid Number",
      "Wildcards make a list completely read-only, including reads",
      "You must call list.allowAdd() first to enable writing"
    ],
    "answer": 0,
    "explain": "With ? extends Number, the compiler only knows the list holds SOME unknown subtype of Number. It can't let you add anything (you might put an Integer into a List<Double>). You can read elements as Number, but not write - Producer Extends."
  },
  {
    "q": "At runtime, what does `new ArrayList<String>().getClass() == new ArrayList<Integer>().getClass()` evaluate to, and why?",
    "choices": [
      "true - type erasure removes the type parameter, so both are just ArrayList at runtime",
      "false - they are permanently different types, even at runtime",
      "It throws a ClassCastException because the types don't match",
      "true - but only because both lists happen to be empty"
    ],
    "answer": 0,
    "explain": "Generics are erased after compilation: List<String> and List<Integer> both become plain ArrayList in the bytecode. getClass() asks the runtime, which sees only ArrayList for both - so the comparison is true. This same erasure is why you can't do new T() or overload on erased types."
  }
]
```

---

[← Phase 9: Idioms & Common Gotchas](09-idioms-and-gotchas.md) · [Guide overview](_guide.md) · [Phase 11: Lambdas & Functional Interfaces →](11-lambdas-and-functional-interfaces.md)
