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

Java has a reputation: a language where a simple thing takes fifteen lines. Back in
[Phase 5](05-classes-and-objects.md) you wrote an `Account` class with private fields, a constructor,
getters, and a hand-written `toString`/`equals`/`hashCode` trio - for *one* data type. Multiply that across
a real codebase and "ceremony" starts to feel like an insult.

Modern Java is quieter and sharper than its reputation. A whole wave of features exists for one reason: let
you say the common thing concisely, and let the *compiler* catch mistakes it used to wave through. The
mental model for this phase: **take a tired, verbose pattern and replace it with a tight, safer one** -
repeated five times.

## Records - the data class in one line

📝 A **record** is an immutable data carrier: a class whose entire job is to hold a few values. You declare
the fields it carries, and the compiler generates everything else - the constructor, an accessor per field,
and correct `equals`, `hashCode`, and `toString`.

Here's roughly the `Account`-class amount of code for a simple two-value point, the old way:

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

*What just happened:* Forty-ish lines, none interesting - just the mechanical bookkeeping the
[Phase 5 trio](05-classes-and-objects.md) warned you to get right. Worse, every line risks a bug: forget a
field in `equals`, mismatch `hashCode`, and your objects misbehave in a `HashSet`.

The same type as a record:

```java
public record Point(int x, int y) {}
```

*What just happened:* That one line generates *all* of the above - a constructor taking `x` and `y`,
accessors `x()`/`y()`, and correct `equals`/`hashCode`/`toString` covering both fields. The fields are
`private final`, so a `Point` is immutable. (Accessors use the field name directly, not `getX()`/`getY()`.)

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
and `a.equals(b)` returned `true` because the generated `equals` compares values - the thing you had to
hand-write before. Two separate objects with the same data are equal, as a value type should be.

💡 **When to reach for a record.** Use one whenever the type's purpose is *to carry data*: DTOs (a JSON
request shape, a query row), value objects (`Money`, `Coordinate`), or a method returning two things at
once. A class that's all fields and getters almost certainly wants to be a record.

⚠️ **Need validation? Use a compact constructor.** A record isn't a dumb tuple. Write a *compact constructor*
(the record name, no parameter list) to validate before the fields are assigned:

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

*What just happened:* The compact constructor runs your check, then Java assigns `x` and `y` automatically -
you don't write `this.x = x`. Now `new Point(-1, 0)` throws instead of quietly creating a nonsense point, so
a record stays immutable *and* always valid.

## `Optional` - a box that might be empty, instead of `null`

You met `null` and its favorite crime, `NullPointerException`, back in [Phase 7](07-errors-and-io.md). The
modern reply to "this might not have a value" is `Optional` - and the point isn't magic, it's *honesty*.

`Optional<User>` is a small wrapper holding either one `User` or nothing. A method returning
`Optional<User>` tells callers, right in the signature, "this might come back empty - deal with it."
Compare a bare `User` that's *sometimes* `null`: nothing warns you, you forget the check, and the NPE
finds you in production.

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

*What just happened:* `findName` returns an `Optional<String>` instead of a possibly-`null` string. `map`
transforms the value *if present*, `orElse` supplies a fallback, `ifPresent` runs code only when a value
exists. The id-99 lookup flowed through with no explicit `if (x == null)` and no risk of an NPE.

⚠️ **Don't over-`Optional`.** It's for *return values* that may legitimately be absent - not for fields (it
bloats objects and breaks serialization) and not for method parameters (overload the method or accept the
plain type instead). Never call `.get()` without checking - that's `null` with extra steps. Use `Optional`
to make a *missing result* impossible to ignore; don't sprinkle it everywhere.

## Switch expressions - `switch` that returns a value

The old C-style `switch` was a minefield: a colon per `case`, a `break` you had to remember or fall through
by accident, and no way to produce a value directly. Modern Java turns `switch` into an **expression** that
hands back a value, with no fall-through.

A switch expression uses the arrow form `case X -> result;`, evaluates to a value you assign directly, and
is *exhaustive* - for an enum, the compiler checks you've covered every case. No `break`; each arrow handles
one case. A branch needing more than one line wraps in braces and uses `yield`.

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

*What just happened:* The whole `switch` *evaluated to* a string returned directly - no temp variable, no
`break`, no fall-through. `SAT, SUN` were grouped on one arrow; the multi-line branch used `yield` to
produce its value. Covering every `Day` lets the compiler accept it with no `default`; leave a case out and
it refuses to compile - a missing case is an error, not a silent runtime bug.

## Pattern matching - test the type and bind in one move

A tired old ritual: check a type with `instanceof`, then cast to that exact type on the next line to use it.
Two lines saying the same thing, and a chance to typo the cast. Pattern matching fuses them.

`if (obj instanceof String s)` tests *and*, when the test passes, binds the value to a new variable `s` of
that type - already cast, ready to use. The same pattern works inside `switch`, and can even *deconstruct*
a record into its components.

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

*What just happened:* `obj instanceof String s` checked the type and bound `s` in one step, so `s.length()`
worked immediately - no separate cast. Inside the `switch`, `case Integer i ->` did the same per branch, and
`case Point(int x, int y) ->` went further: it matched a `Point` *and* pulled its two components straight
into `x` and `y`. That last move - **record deconstruction** - is where records and pattern matching team up.

## Sealed types - a fixed, compiler-checked set of cases

Sometimes a type needs a *known, fixed* set of implementations - a `Shape` is a `Circle` or a `Square`,
nothing else, ever. Plain interfaces can't express that: anyone can write a new implementor, so the compiler
can never be sure a `switch` handled them all. Sealed types fix this.

📝 A **sealed** type uses `sealed ... permits` to name the *only* types allowed to extend or implement it:
`sealed interface Shape permits Circle, Square`. Nobody outside that list can join the family. The payoff:
`switch` over it with patterns - since the compiler knows the complete set, it can verify the switch is
**exhaustive**, with *no `default` needed*. Miss a case and you get a compile error, not a runtime surprise.

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
provably complete - satisfied without a `default`. Add a `Triangle` to `permits` six months from now, and
every `switch` over `Shape` that missed it *stops compiling*, pointing at each place needing an update. The
compiler becomes your checklist instead of a bug report.

💡 **Sealed + records + switch = a "one of a fixed set" type.** Together these give Java what other
languages call *discriminated unions* or *sum types*: a value that's exactly one of a closed list of
shapes, each carrying its own data, handled by a switch the compiler guarantees is total - the cleanest way
to model "a result is either a `Success(value)` or a `Failure(reason)`," with exhaustiveness checking free.

## Recap

1. A **record** (`record Point(int x, int y) {}`) collapses a whole data class - constructor, accessors,
   `equals`/`hashCode`/`toString` - into one immutable line. Use it for DTOs and value objects; add a
   **compact constructor** for validation.
2. **`Optional<T>`** makes "might be absent" part of a method's return type, so callers can't forget the
   case. Use `map`/`orElse`/`ifPresent`; ⚠️ don't put it on fields or parameters.
3. **Switch expressions** return a value with the `case X -> ...` arrow form - no `break`, no fall-through,
   `yield` for multi-line branches, **exhaustiveness** checked for enums and sealed types.
4. **Pattern matching** fuses the type test and the cast: `if (obj instanceof String s)` binds `s` ready to
   use, works in `switch` (`case Integer i ->`), and can **deconstruct records** (`case Point(int x, int y)`).
5. **Sealed types** (`sealed interface Shape permits Circle, Square`) fix the set of implementations, letting
   the compiler prove a pattern `switch` is exhaustive - a missing case is a compile error.
6. Together - **sealed + records + switch** - these are Java's answer to discriminated unions: "one of a
   fixed set," handled totally, checked by the compiler.

You now write Java the way modern Java wants to be written: less ceremony, more meaning, and a compiler
that catches mistakes the old style let slip. Next: leaving single-threaded code behind for the hard,
fascinating world of doing several things at once.

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
