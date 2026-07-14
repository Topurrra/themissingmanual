---
title: "Errors & I/O - Exceptions, Resources & Files"
guide: "java-from-zero"
phase: 7
summary: "Java's error model is the exception - a thrown object that unwinds the stack until caught. Here's try/catch/finally, the checked-vs-unchecked split the compiler enforces, throwing your own, try-with-resources, and modern file I/O."
tags: [java, exceptions, checked-exceptions, try-catch, try-with-resources, io, files, finally]
difficulty: intermediate
synonyms: ["java checked vs unchecked exceptions", "java try catch finally", "java try with resources", "java throw throws", "java read write file", "java exception handling", "java nullpointerexception"]
updated: 2026-06-22
---

# Errors & I/O - Exceptions, Resources & Files

Every program eventually meets the moment something goes wrong: a file isn't there, a number won't parse, a network call times out. Languages disagree, sometimes fiercely, on what to *do* then. If you've seen the Go guide, you know one answer - [errors are values](/guides/go-from-zero) you return and check by hand. Java takes the other big path, worth stating up front since it shapes everything here:

> **In Java, an error is a thrown object that unwinds the stack until something catches it.**

When a method hits trouble, it doesn't return a special value - it *throws*. Normal execution stops dead, and the runtime walks back up the call chain, abandoning each method, looking for code that said "I'll handle this." Find a handler, control jumps there; find nobody, the program crashes and prints a stack trace. Once that picture is in your head, `try`/`catch`/`finally`, the checked/unchecked split, and `try`-with-resources stop being syntax to memorize and become obvious consequences of one idea.

## Exceptions - Java's error model

📝 **An exception** is an object (a subclass of `Throwable`) representing something going wrong. *Throwing* it stops normal flow and searches upward through the call stack for a *handler*. *Catching* it says "stop unwinding here, I've got this."

Contrast this with Go: a function that can fail hands back `(result, err)` and you check `if err != nil` right there - the error travels *with* the return value. In Java the failure travels *instead of* it: the method never returns normally, ripping through every intermediate method until it reaches a `catch`. The upside: let an error blow past five layers with nothing useful to say, and handle it once, where it matters. The cost: control flow becomes invisible - an innocent line might launch an exception three calls deep.

You contain that with three keywords:

- `try` - wrap the code that might throw.
- `catch` - handle a specific exception type if it's thrown.
- `finally` - run cleanup *no matter what* (threw or not, caught or not).

**A real example.**

```java
public class Divide {
    public static void main(String[] args) {
        try {
            int[] nums = {10, 0};
            System.out.println("result: " + (nums[0] / nums[1]));
        } catch (ArithmeticException e) {
            System.out.println("caught: " + e.getMessage());
        } finally {
            System.out.println("finally always runs");
        }
        System.out.println("program continues");
    }
}
```
```console
$ java Divide.java
caught: / by zero
finally always runs
program continues
```
*What just happened:* `nums[0] / nums[1]` is `10 / 0`, throwing an `ArithmeticException`. The division never completed - control jumped straight to the matching `catch`, which printed `e.getMessage()`. Then `finally` ran (it always does), and since we *caught* the exception, the program continued. Remove the `try`/`catch` and it unwinds all the way out of `main`, crashing with a stack trace like this:

```console
$ java Divide.java
Exception in thread "main" java.lang.ArithmeticException: / by zero
	at Divide.main(Divide.java:5)
```
*What just happened:* With no handler, the exception walked up past `main`, hit the top of the stack, and the JVM printed the exception type, message, and the exact line each frame was on. Your most useful debugging tool - read it top-down: the first line is *what* went wrong, the `at ...` lines trace *where*, most recent first.

## Checked vs unchecked - the split the compiler enforces

Here's the part that's genuinely Java's own, and the first thing that surprises newcomers. Java sorts exceptions into two camps, treated completely differently *at compile time*.

📝 **Checked exceptions** (subclasses of `Exception` but not `RuntimeException`, e.g. `IOException`) are ones the compiler forces you to deal with: any method that might throw one must either `catch` it or *declare* it with `throws` in its signature. Forget to, and your code won't compile. **Unchecked exceptions** (subclasses of `RuntimeException`, e.g. `NullPointerException`, `ArithmeticException`, `IllegalArgumentException`) carry no such obligation - you *may* catch them, but the compiler won't make you.

The intended dividing line: checked exceptions are for *recoverable, expected* conditions outside your control - a file might not exist - and a caller ought to have a plan. Unchecked exceptions are for *programming bugs* - a null you should have checked, an index past an array's end, an invalid argument. You can't "recover" from a bug; you fix it.

**A real example.** Watch the compiler refuse the checked one:

```java
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

public class Checked {
    // This method does NOT compile - Files.readString can throw IOException,
    // and we neither catch it nor declare it.
    static String load() {
        return Files.readString(Path.of("notes.txt"));
    }
}
```
```console
$ java Checked.java
Checked.java:9: error: unreported exception IOException; must be caught or declared to be thrown
        return Files.readString(Path.of("notes.txt"));
                               ^
1 error
```
*What just happened:* `Files.readString` declares `throws IOException` - checked - so the compiler demanded we acknowledge it. We did neither, so compilation failed *before the program ran*. Fix it by adding `throws IOException` to our method or wrapping the call in `try`/`catch`. Compare to `10 / 0`: `ArithmeticException` is unchecked, so the compiler said nothing - it only blew up at runtime.

💡 **Why checked exceptions are controversial.** The idea is sound: the compiler guarantees you can't *accidentally* ignore a failure mode the API author thought important. In practice, many find them noisy - they push `throws` up through every layer, and tired programmers "shut the compiler up" with an empty `catch {}` that swallows the very error checked exceptions existed to surface. That's why Kotlin and Scala dropped them entirely, and why much Java code wraps checked exceptions in unchecked ones. Know which camp an exception is in - the compiler will tell you.

## Throwing - and writing your own exceptions

You're not limited to catching exceptions the library throws; you throw your own with `throw`. The most common case is rejecting bad input *the moment you detect it*, rather than letting a garbage value slither deeper into your program where it causes a confusing failure far from the cause.

For built-in cases, reach for the standard unchecked types - `IllegalArgumentException` (a caller passed something invalid) and `IllegalStateException` (the object isn't in a state where this call makes sense) - covering a huge fraction of real code.

```java
public class Account {
    static int withdraw(int balance, int amount) {
        if (amount <= 0) {
            throw new IllegalArgumentException("amount must be positive, got " + amount);
        }
        if (amount > balance) {
            throw new IllegalArgumentException("insufficient funds");
        }
        return balance - amount;
    }

    public static void main(String[] args) {
        System.out.println(withdraw(100, 30));   // fine
        System.out.println(withdraw(100, -5));   // throws
    }
}
```
```console
$ java Account.java
70
Exception in thread "main" java.lang.IllegalArgumentException: amount must be positive, got -5
	at Account.withdraw(Account.java:4)
	at Account.main(Account.java:14)
```
*What just happened:* The first `withdraw` returned `70` normally. The second hit `amount <= 0`, so `throw new IllegalArgumentException(...)` fired, constructing and launching an exception with our message. `withdraw` never returned a value - the throw replaced it - and since `main` didn't catch it, the program crashed with our message attached. The key habit: *fail fast and loud* - validate at the boundary so the stack trace points at the real culprit.

**Writing a custom exception** is just subclassing. Do it when no built-in type names your error well and callers might want to catch *this specific thing*:

```java
class InsufficientFundsException extends RuntimeException {
    InsufficientFundsException(String message) {
        super(message);   // hand the message up to the base class
    }
}
```
*What just happened:* We extended `RuntimeException`, making our exception *unchecked*. The one-line constructor passes a message up to the parent so `getMessage()` works. Now `throw new InsufficientFundsException("balance too low")` reads like a sentence, and a caller can write `catch (InsufficientFundsException e)` to handle exactly that case. (Extend `Exception` instead for *checked*.) ⚠️ Don't manufacture custom exceptions for every error - a built-in type with a good message is usually clearer and less code.

## try-with-resources - cleanup that can't leak

Files, database connections, network sockets - anything you *open*, you must *close*, or you leak OS handles until your program (or the machine) runs out. The naive approach is a `finally` block calling `close()`, but that's verbose and easy to get subtly wrong (what if `close()` itself throws?). Java's purpose-built answer is **try-with-resources**.

📝 **try-with-resources** is a `try` with a parenthesized declaration: `try (var thing = open()) { ... }`. Any resource declared there is *automatically closed* when the block exits - normally or via exception - as long as it implements `AutoCloseable` (every file, stream, and connection in the standard library does). A structural guarantee you can't forget the close.

💡 This is the Java answer to "always close what you open." Declare the resource in the `try` header and the compiler wires up cleanup, even on the exception path. If you remember one resource-handling pattern, make it this one.

```java
import java.io.BufferedReader;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

public class ReadLines {
    public static void main(String[] args) throws IOException {
        try (BufferedReader reader = Files.newBufferedReader(Path.of("notes.txt"))) {
            String line;
            while ((line = reader.readLine()) != null) {
                System.out.println("line: " + line);
            }
        }   // reader.close() happens here, automatically - even if readLine threw
    }
}
```
```console
$ cat notes.txt
buy milk
call dentist
$ java ReadLines.java
line: buy milk
line: call dentist
```
*What just happened:* `Files.newBufferedReader` opened the file (a resource), and since we declared it inside `try (...)`, Java guaranteed `reader.close()` ran the instant the block ended - loop finished cleanly or `readLine` threw partway through. We never typed `close()` or wrote a `finally`. `throws IOException` on `main`: reading can fail with a checked exception, and here we chose to declare rather than catch it - fine for a small program. The leak-proof part is the parenthesized declaration; the rest is ordinary loop code.

## File I/O - the modern way with `java.nio.file.Files`

Older Java tutorials drown you in `FileReader`, `FileWriter`, `BufferedReader`, and streams wrapped in streams. For common cases, ignore all that: `java.nio.file.Files` gives clean, one-call methods built around `Path` objects. Reach for these first.

The three you'll use constantly:

- `Files.readString(path)` - read an entire (small) text file into one `String`.
- `Files.readAllLines(path)` - read a file into a `List<String>`, one entry per line.
- `Files.writeString(path, text)` - write a `String` to a file, creating or overwriting it.

```java
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

public class FileDemo {
    public static void main(String[] args) throws IOException {
        Path path = Path.of("greeting.txt");

        Files.writeString(path, "hello\nworld\n");   // create + write in one call

        String whole = Files.readString(path);       // entire file as one String
        System.out.print("readString gives:\n" + whole);

        List<String> lines = Files.readAllLines(path);  // one String per line
        System.out.println("line count: " + lines.size());
        System.out.println("first line: " + lines.get(0));
    }
}
```
```console
$ java FileDemo.java
readString gives:
hello
world
line count: 2
first line: hello
```
*What just happened:* `Files.writeString` created `greeting.txt` and wrote both lines in a single call - no stream to open or close, since these methods manage the resource internally. `Files.readString` handed the whole file back as one `String` (newlines included); `Files.readAllLines` split it into a `List<String>` so we could count lines and index into them. Each declares `throws IOException` - the file might not exist, the disk might be full - exactly why `main` declares it too. For genuinely large files you'd stream (`Files.lines(path)` returns a lazy `Stream<String>`), but for config files and most everyday work, these three methods are all you need.

⚠️ **The one runtime exception you'll meet most.** `NullPointerException` - thrown the instant you call a method or read a field on a `null` reference. A `null` path, a map lookup returning nothing, a method returning `null` you forgot to check - all roads lead to the dreaded NPE, the most common exception in production Java. It's *unchecked*, so the compiler gives no warning; it just detonates at runtime. Taming `null` gets its own treatment in [Phase 9](09-idioms-and-gotchas.md).

## Recap

1. **Exceptions are Java's error model** - a thrown object unwinds the stack until a `catch` handles it, or the program crashes with a stack trace. Opposite of Go's "errors are values you check inline."
2. **`try` / `catch` / `finally`** - wrap risky code, handle specific types, and `finally` runs cleanup on every path. Read stack traces top-down: *what* first, then the *where* trail.
3. **Checked vs unchecked is the Java-specific split** - checked exceptions (`IOException`) *must* be caught or declared with `throws`, compiler-enforced; unchecked (`RuntimeException`, `NullPointerException`) needn't be. Checked exceptions are controversial since that obligation can become noise.
4. **Throw your own** with `throw new IllegalArgumentException(...)` to fail fast at the boundary; write a custom exception (subclass `RuntimeException` or `Exception`) only when no built-in type fits.
5. **try-with-resources** - `try (var r = open()) { ... }` auto-closes anything `AutoCloseable`, on every exit path - the leak-proof way to handle files and connections.
6. **`java.nio.file.Files`** - `readString`, `readAllLines`, `writeString` cover everyday file I/O in one call each. ⚠️ Watch for `NullPointerException`, the most common runtime exception - more in Phase 9.

You now write code that fails clearly and cleans up after itself. Next: the *toolbox* around the language - how Java projects organize into packages and build with the tools the ecosystem actually uses.

## Quick check

Test yourself on the one idea that defines this phase - how Java handles failure:

```quiz
[
  {
    "q": "In Java, what happens when a method throws an exception that nothing catches?",
    "choices": [
      "The exception unwinds the entire call stack and the program crashes with a stack trace",
      "The method returns the special value null instead",
      "The exception is silently ignored and execution continues on the next line",
      "The compiler refuses to build the program until you add a return value"
    ],
    "answer": 0,
    "explain": "An uncaught exception keeps unwinding upward through each calling method until it leaves main, at which point the JVM crashes the program and prints a stack trace (type, message, and the line of each frame). Catching it anywhere along the way stops the unwind."
  },
  {
    "q": "What's the practical difference between a checked exception (like IOException) and an unchecked one (like NullPointerException)?",
    "choices": [
      "A checked exception must be caught or declared with throws, or the code won't compile; an unchecked one carries no such requirement",
      "A checked exception is faster because the compiler optimizes it",
      "An unchecked exception always crashes the program, while a checked one never does",
      "There's no real difference - the terms are interchangeable"
    ],
    "answer": 0,
    "explain": "The compiler enforces checked exceptions: any method that might throw one must catch it or declare throws. Unchecked exceptions (subclasses of RuntimeException) carry no compile-time obligation - they only surface at runtime, which is exactly why a forgotten null check (NullPointerException) compiles fine but blows up later."
  },
  {
    "q": "Why prefer try-with-resources - `try (var r = Files.newBufferedReader(path)) { ... }` - over opening a file and closing it yourself?",
    "choices": [
      "It automatically closes the resource on every exit path, including when an exception is thrown, so the file can't leak",
      "It makes file reading run significantly faster",
      "It converts checked exceptions into unchecked ones automatically",
      "It lets you skip importing the java.nio.file package"
    ],
    "answer": 0,
    "explain": "Any resource declared in the try header (that implements AutoCloseable) is closed automatically when the block exits - normally or via exception - so you can never forget the close or leak a handle. You don't write close() at all; the structure guarantees it."
  }
]
```

---

[← Phase 6: Inheritance & Interfaces](06-inheritance-and-interfaces.md) · [Guide overview](_guide.md) · [Phase 8: Packages, Build & Tooling →](08-packages-and-tooling.md)
