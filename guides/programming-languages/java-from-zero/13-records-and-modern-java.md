---
title: "Records, Sealed Types & Modern Java - Less Boilerplate, More Safety"
guide: "java-from-zero"
phase: 13
summary: "Modern Java fixes old pain: records collapse data classes to one line, sealed types fence a hierarchy, switch becomes an expression, and pattern matching plus Optional kill whole categories of boilerplate and null bugs."
tags: [java, records, sealed-classes, pattern-matching, switch-expressions, optional, modern-java]
difficulty: intermediate
synonyms: ["java records explained", "java sealed classes", "java pattern matching switch", "java switch expression yield", "java optional usage", "java record vs class", "modern java features"]
updated: 2026-06-22
---

# Records, Sealed Types & Modern Java - Less Boilerplate, More Safety

Java has a reputation, and you've probably felt it already: a language where saying a simple thing takes
fifteen lines. Back in [Phase 5](05-classes-and-objects.md) you wrote an `Account` class with private
fields, a constructor, getters, and a hand-written `toString`/`equals`/`hashCode` trio - and that was for
*one* data type. Multiply that across a real codebase and "ceremony" starts to feel like an insult.

The Java of the last few years is a quieter, sharper language than its reputation. A whole wave of features
exists for one reason: to let you say the common thing concisely, and to let the *compiler* catch mistakes
it used to wave through. The mental model for this whole phase is a single move repeated five times -
**take a tired, verbose pattern and replace it with a tight, safer one.** Old way on the left, new way on
the right, every time.

## Records - the data class in one line

**What it actually is.** 📝 A **record** is an immutable data carrier: a class whose entire job is to hold
a few values. You declare the fields it carries, and the compiler generates everything else - the
constructor, an accessor for each field, and correct `equals`, `hashCode`, and `toString` implementations.

Remember the `Account` class from Phase 5 - fields, a constructor, getters, and a hand-written
`toString`/`equals`/`hashCode`? Here is roughly that amount of code for a simple two-value point, written
the old way:

```java
public final class Point {
    private final int x;
    private final int y;

    public Point(int x, int y) {
        this.x = x;
        this.y = y;
    }

    public int x() { return x; }
    public int y() { return y; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Point)) return false;
        Point other = (Point) o;
        return x == other.x && y == other.y;
    }

    @Override
    public int hashCode() {
        return java.util.Objects.hash(x, y);
    }

    @Override
    public String toString() {
        return "Point[x=" + x + ", y=" + y + "]";
    }
}
```

*What just happened:* Forty-ish lines, and not one of them says anything interesting - it's all the
mechanical bookkeeping the [Phase 5 trio](05-classes-and-objects.md) warned you to get right. Worse, every
line is a place to introduce a bug: forget a field in `equals`, mismatch `hashCode`, and your objects
misbehave in a `HashSet`.

Here is the exact same type as a record:

```java
public record Point(int x, int y) {}
```

*What just happened:* That one line generates *all* of the above - a constructor taking `x` and `y`,
accessor methods `x()` and `y()`, and the correct `equals`/`hashCode`/`toString` that include both fields.
The fields are `private final`, so a `Point` is immutable: once built, it never changes. (Note the accessors
are `x()` and `y()`, not `getX()`/`getY()` - records use the field name directly.)

```java
public class Main {
    public static void main(String[] args) {
        Point a = new Point(1, 2);
        Point b = new Point(1, 2);

        System.out.println(a);            // generated toString
        System.out.println(a.x());        // generated accessor
        System.out.println(a.equals(b));  // generated value equality
    }
}
```
```console
$ java Main.java
Point[x=1, y=2]
1
true
```

*What just happened:* Printing `a` gave a readable `Point[x=1, y=2]` for free, `a.x()` read the first field,
and `a.equals(b)` returned `true` because the generated `equals` compares values - the very thing you had
to hand-write before. Two separate objects with the same data are equal, exactly as a value type should be.

💡 **When to reach for a record.** Use one whenever the type's purpose is *to carry data* and not much else:
DTOs (the shape of a JSON request, a row from a query), value objects (a `Money`, a `Coordinate`), the
return of a method that needs to hand back two things at once. If you find yourself writing a class that's
all fields and getters, it almost certainly wants to be a record.

⚠️ **Need validation? Use a compact constructor.** A record isn't a dumb tuple - you can still guard its
inputs. Write a *compact constructor* (the record name, no parameter list) to validate before the fields
are assigned:

```java
public record Point(int x, int y) {
    public Point {                        // compact constructor - no parameters listed
        if (x < 0 || y < 0) {
            throw new IllegalArgumentException("coordinates must be non-negative");
        }
        // no explicit assignment needed - the fields are set for you afterward
    }
}
```

*What just happened:* The compact constructor runs your check, then Java assigns `x` and `y` to the fields
automatically - you don't write `this.x = x`. Now `new Point(-1, 0)` throws instead of quietly creating a
nonsense point, so a record stays immutable *and* always valid.

## `Optional` - a box that might be empty, instead of `null`

You met `null` and its favorite crime, the `NullPointerException`, back in
[Phase 7](07-errors-and-io.md). The modern reply to "this might not have a value" is
`Optional` - and the point isn't magic, it's *honesty*.

**What it actually is.** `Optional<User>` is a small wrapper that holds either one `User` or nothing. A
method that returns `Optional<User>` is telling its callers, right in the type signature, "this might come
back empty - you must deal with that." Compare that to returning a bare `User` that's *sometimes* `null`:
nothing in the signature warns you, so you forget the check, and the NPE finds you in production.

```java
import java.util.Optional;

public class Users {
    // Old way: returns User, or null if not found - the caller can't tell.
    // New way: the Optional makes "might be missing" part of the contract.
    static Optional<String> findName(int id) {
        if (id == 1) return Optional.of("Ada");
        return Optional.empty();          // honest "nothing here"
    }

    public static void main(String[] args) {
        String found   = findName(1).map(String::toUpperCase).orElse("(unknown)");
        String missing = findName(99).map(String::toUpperCase).orElse("(unknown)");

        System.out.println(found);
        System.out.println(missing);

        findName(1).ifPresent(name -> System.out.println("present: " + name));
    }
}
```
```console
$ java Users.java
ADA
(unknown)
present: Ada
```

*What just happened:* `findName` returns an `Optional<String>` instead of a possibly-`null` string.
`map` transforms the value *if it's there* (and quietly does nothing if it's empty), `orElse` supplies a
fallback for the empty case, and `ifPresent` runs code only when a value exists. The id-99 lookup flowed
through the same code without a single explicit `if (x == null)` and without any risk of an NPE.

⚠️ **Don't over-`Optional`.** `Optional` is for *return values* that may legitimately be absent. It is not
meant for fields (it bloats your objects and breaks serialization) and not for method parameters (just
overload the method or accept the plain type). And never call `.get()` without checking - that's just
`null` with extra steps and its own exception. Reach for `Optional` to make a *missing result* impossible to
ignore; don't sprinkle it everywhere.

## Switch expressions - `switch` that returns a value

The old C-style `switch` was a minefield: a colon for each `case`, a `break` you had to remember or fall
through by accident, and no way to produce a value - you had to assign to a variable from inside each branch.
Modern Java turns `switch` into an **expression** that hands back a value, with no fall-through.

**What it actually is.** A switch expression uses the arrow form `case X -> result;`, evaluates to a value
you can assign directly, and is *exhaustive* - for an enum, the compiler checks you've covered every case.
There's no `break`; each arrow handles exactly one case. When a branch needs more than one line, you wrap it
in braces and use `yield` to produce its value.

```java
public class Main {
    enum Day { MON, TUE, WED, THU, FRI, SAT, SUN }

    static String kind(Day day) {
        return switch (day) {                       // switch as an expression
            case SAT, SUN -> "weekend";             // group cases with a comma
            case MON, TUE, WED, THU, FRI -> {       // a block branch...
                String note = "five of these";
                yield "weekday (" + note + ")";     // ...uses yield to produce its value
            }
        };
    }

    public static void main(String[] args) {
        System.out.println(kind(Day.SAT));
        System.out.println(kind(Day.MON));
    }
}
```
```console
$ java Main.java
weekend
weekday (five of these)
```

*What just happened:* The whole `switch` *evaluated to* a string that we returned directly - no temporary
variable, no `break`, no fall-through. We grouped `SAT, SUN` on one arrow, and the multi-line branch used
`yield` to say "this is the value of this case." Because we covered every `Day`, the compiler accepts it
with no `default`; leave a case out and it refuses to compile - a missing case becomes an error, not a
silent bug at runtime.

## Pattern matching - test the type and bind in one move

Here's a tired old ritual: check a type with `instanceof`, then cast to that exact type on the next line so
you can use it. Two lines saying the same thing, and a chance to typo the cast. Pattern matching fuses them.

**What it actually is.** `if (obj instanceof String s)` tests *and*, when the test passes, binds the value
to a new variable `s` of that type - already cast, ready to use. The same pattern works inside `switch`,
and it can even *deconstruct* a record into its components.

```java
public class Main {
    static String describe(Object obj) {
        // Old way: if (obj instanceof String) { String s = (String) obj; ... }
        if (obj instanceof String s) {
            return "string of length " + s.length();   // s is already a String
        }
        return switch (obj) {
            case Integer i -> "int doubled = " + (i * 2);  // i is bound as an Integer
            case Point(int x, int y) -> "point at " + x + "," + y;  // record deconstruction
            default -> "something else";
        };
    }

    record Point(int x, int y) {}

    public static void main(String[] args) {
        System.out.println(describe("hello"));
        System.out.println(describe(21));
        System.out.println(describe(new Point(3, 4)));
        System.out.println(describe(3.14));
    }
}
```
```console
$ java Main.java
string of length 5
int doubled = 42
point at 3,4
something else
```

*What just happened:* `obj instanceof String s` checked the type and bound `s` in one step, so we used
`s.length()` immediately - no separate cast. Inside the `switch`, `case Integer i ->` did the same per
branch, and `case Point(int x, int y) ->` went further: it matched a `Point` *and* pulled its two
components straight into `x` and `y`. That last move - **record deconstruction** - is where records and
pattern matching start working as a team, and the next section closes the loop.

## Sealed types - a fixed, compiler-checked set of cases

Sometimes you want a type to have a *known, fixed* set of implementations - a `Shape` is a `Circle` or a
`Square`, and nothing else, ever. Plain interfaces can't express that: anyone, anywhere, can write a new
implementor, so the compiler can never be sure your `switch` has handled them all. Sealed types fix exactly
this.

**What it actually is.** 📝 A **sealed** type uses `sealed ... permits` to name the *only* types allowed to
extend or implement it: `sealed interface Shape permits Circle, Square`. Nobody outside that list can join
the family. The payoff lands when you `switch` over it with patterns - because the compiler knows the
complete set, it can verify your switch is **exhaustive**, with *no `default` needed*. Miss a case and you
get a compile error, not a surprise at runtime.

```java
public class Main {
    sealed interface Shape permits Circle, Square {}
    record Circle(double radius) implements Shape {}
    record Square(double side) implements Shape {}

    static double area(Shape s) {
        return switch (s) {
            case Circle(double r) -> Math.PI * r * r;   // deconstruct the record
            case Square(double side) -> side * side;
            // no default - the compiler knows Circle and Square are ALL the cases
        };
    }

    public static void main(String[] args) {
        System.out.printf("%.2f%n", area(new Circle(2)));
        System.out.printf("%.2f%n", area(new Square(3)));
    }
}
```
```console
$ java Main.java
12.57
9.00
```

*What just happened:* `Shape` permits exactly `Circle` and `Square`, so the `switch` covering both is
provably complete - the compiler is satisfied without a `default`. Now imagine you add a `Triangle` to the
`permits` list six months from now: every `switch` over `Shape` that forgot to handle it *stops compiling*,
pointing you at each place that needs updating. The compiler becomes your checklist instead of a bug report.

💡 **Sealed + records + switch = a "one of a fixed set" type.** Together these three give Java what other
languages call *discriminated unions* or *sum types*: a value that is exactly one of a closed list of
shapes, each carrying its own data, handled by a switch the compiler guarantees is total. It's the cleanest
way to model "a result is either a `Success(value)` or a `Failure(reason)`," or any "it's one of these N
things" domain - and you get exhaustiveness checking thrown in.

## Recap

1. A **record** (`record Point(int x, int y) {}`) collapses a whole data class - constructor, accessors,
   `equals`/`hashCode`/`toString` - into one immutable line. Use it for DTOs and value objects; add a
   **compact constructor** for validation.
2. **`Optional<T>`** makes "might be absent" part of a method's return type, so callers can't forget the
   case. Use `map`/`orElse`/`ifPresent`; ⚠️ don't put it on fields or parameters.
3. **Switch expressions** return a value with the `case X -> ...` arrow form - no `break`, no fall-through,
   `yield` for multi-line branches, and **exhaustiveness** checked for enums and sealed types.
4. **Pattern matching** fuses the type test and the cast: `if (obj instanceof String s)` binds `s` ready to
   use, works in `switch` (`case Integer i ->`), and can **deconstruct records** (`case Point(int x, int y)`).
5. **Sealed types** (`sealed interface Shape permits Circle, Square`) fix the set of implementations, which
   lets the compiler prove a pattern `switch` is exhaustive - a missing case is a compile error.
6. The three together - **sealed + records + switch** - are Java's answer to discriminated unions: model
   "one of a fixed set," handled totally, checked by the compiler.

You now write Java the way modern Java wants to be written: less ceremony, more meaning, and a compiler
that catches the mistakes the old style let slip. Next we leave single-threaded code behind and tackle the
hard, fascinating world of doing several things at once.

## Quick check

Test yourself on the ideas that separate old Java from modern Java:

```quiz
[
  {
    "q": "What does `public record Point(int x, int y) {}` generate for you?",
    "choices": [
      "A constructor, accessors `x()` and `y()`, and correct `equals`, `hashCode`, and `toString` - for an immutable type",
      "Only an empty class with two public mutable fields",
      "Getters named `getX()` and `getY()`, but no `equals` or `hashCode`",
      "Nothing - `record` is just a comment-style keyword"
    ],
    "answer": 0,
    "explain": "A record is an immutable data carrier. The compiler generates the canonical constructor, an accessor per field (named after the field, like `x()`), and value-based `equals`/`hashCode`/`toString` - replacing the ~40 lines you'd otherwise hand-write."
  },
  {
    "q": "Why can a pattern-matching `switch` over a sealed type skip the `default` branch?",
    "choices": [
      "Because `sealed ... permits` fixes the complete set of subtypes, so the compiler can verify every case is covered",
      "Because switch expressions never require a default under any circumstances",
      "Because `default` is forbidden inside any switch expression",
      "Because sealed types disable compile-time checking entirely"
    ],
    "answer": 0,
    "explain": "A sealed type names all its permitted implementations, so the compiler knows the full set of cases. When your switch covers them all, it's provably exhaustive - no `default` needed, and missing a case becomes a compile error."
  },
  {
    "q": "What is the right use of `Optional<User>`?",
    "choices": [
      "As a method return type that signals the result may legitimately be absent, forcing callers to handle the empty case",
      "As the type of every field in a class, to avoid ever storing null",
      "As a method parameter type so callers can pass nothing",
      "As a faster replacement for a regular `User` object"
    ],
    "answer": 0,
    "explain": "`Optional` exists to make 'this might be missing' explicit in a return type, so callers can't silently forget the check. It's not meant for fields or parameters - using it there adds overhead and awkwardness without the payoff."
  }
]
```

---

[← Phase 12: The Streams API](12-streams-api.md) · [Guide overview](_guide.md) · [Phase 14: Concurrency & Threads →](14-concurrency-and-threads.md)
