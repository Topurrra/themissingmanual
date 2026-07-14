---
title: "Errors & I/O - Exceptions, Resources & Files"
guide: "csharp-from-zero"
phase: 7
summary: "How C# signals failure with exceptions: try/catch/finally, catching specific types, throwing your own, deterministic cleanup with using/IDisposable, and reading and writing files without leaking handles."
tags: [csharp, exceptions, try-catch, using, idisposable, io, files, finally]
difficulty: intermediate
synonyms: ["c# exception handling try catch", "c# using statement idisposable", "c# throw custom exception", "c# read write file", "c# finally block", "c# nullreferenceexception", "c# exception filters when"]
updated: 2026-06-22
---

# Errors & I/O - Exceptions, Resources & Files

Up to now your programs have run the happy path: the file was there, the number parsed, the index was in range. Real programs spend half their lives off it - disks fill, users type nonsense, networks blink. This phase covers how C# tells you when something went wrong, and how you respond without leaving a mess behind.

If you've read the [Go guide](/guides/go-from-zero), you saw a language where *errors are values* - a function returns a failure alongside its result, checked on the spot. C# made the opposite bet: failure is a **thrown object** that interrupts normal flow and travels *up* the call stack looking for someone willing to handle it. That's the **exception**, and getting comfortable with it - when to catch, when to throw, how to always clean up - is the whole job.

## Exceptions - C#'s error model

**What it actually is.** An exception is an object (an instance of `Exception` or a subclass) *thrown* when something goes wrong. The instant it's thrown, the current method stops dead and the runtime starts **unwinding the stack** - abandoning the current method, then its caller, then *its* caller - until it finds a `catch` block willing to handle it. If nobody catches it, the program crashes and prints a **stack trace** showing the path the exception took.

📝 **Exception** - an object describing a failure, thrown at the point of trouble and caught (or not) up the call chain. **`try`** wraps risky code; **`catch`** handles a failure; **`finally`** runs cleanup either way. **Stack trace** - the printed list of method calls the exception unwound through, newest first.

⚠️ **C# exceptions are all *unchecked*.** Unlike Java's "checked exceptions," the compiler never makes you wrap a call in `try`/`catch`. Any method can throw anything, and you'll only find out at runtime or by reading its docs - freedom and a footgun in one.

The mental model: a thrown exception is a hot potato, rising until someone catches it or it falls out the top and crashes the program.

**A real example.**

```csharp
int[] scores = { 90, 80, 70 };

Console.WriteLine("about to read index 5");
Console.WriteLine(scores[5]);   // there is no index 5
Console.WriteLine("this line never runs");
```
```console
$ dotnet run
about to read index 5
Unhandled exception. System.IndexOutOfRangeException: Index was outside the bounds of the array.
   at Program.<Main>$(String[] args) in /app/Program.cs:line 4
```
*What just happened:* `scores[5]` reached past the end of a three-element array, so the runtime threw an `IndexOutOfRangeException`. The third `WriteLine` never ran - the throw aborted the method immediately. With no `catch` anywhere up the stack, the program printed "Unhandled exception," the type and message, and the stack trace pointing at `line 4` - your best clue for *where* a crash happened.

Now wrap it so the failure is handled instead of fatal:

```csharp
int[] scores = { 90, 80, 70 };

try
{
    Console.WriteLine(scores[5]);
}
catch (IndexOutOfRangeException ex)
{
    Console.WriteLine($"oops: {ex.Message}");
}
finally
{
    Console.WriteLine("cleanup always runs");
}

Console.WriteLine("program continues normally");
```
```console
$ dotnet run
oops: Index was outside the bounds of the array.
cleanup always runs
program continues normally
```
*What just happened:* the `try` block threw, and control jumped straight to the matching `catch`, which read `Message` and kept going. `finally` ran next - it runs whether the `try` succeeded, threw and was caught, or threw something *not* caught here. Execution flowed past the whole block and the program continued. The exception was contained.

## Catching well - be specific, don't swallow

**What it actually is.** A `catch` block can name the exception type it handles. Stack several, and the runtime picks the *first* matching type. The art is catching failures you can actually do something about, and letting everything else keep rising.

💡 **Catch specific types, not `Exception`.** A bare `catch (Exception ex)` grabs *everything*: the file-not-found you expected, but also out-of-memory, a null-reference bug, a typo you'd want to crash loudly. Swallowing it all hides real bugs behind a calm-looking but quietly broken program. Catch the narrowest type you're prepared to handle; if you can't recover, don't catch - let it propagate (or crash, which is the clean outcome).

**A real example.**

```csharp
string input = "not a number";

try
{
    int n = int.Parse(input);
    Console.WriteLine($"parsed {n}");
}
catch (FormatException ex)
{
    Console.WriteLine($"bad input, not a number: {ex.Message}");
}
catch (OverflowException)
{
    Console.WriteLine("that number is too big to fit in an int");
}
```
```console
$ dotnet run
bad input, not a number: The input string 'not a number' was not in a correct format.
```
*What just happened:* `int.Parse` throws a `FormatException` when the text isn't a number and an `OverflowException` when it's too large for `int`. We wrote a separate `catch` for each, and the runtime matched `FormatException` and skipped the other. We did *not* write `catch (Exception)` - an unrelated bug should crash and show us, not get mistaken for "bad input."

**Exception filters with `when`.** Sometimes you want to catch a type only *when* a condition holds - retry on some HTTP failures but not others. `when` adds that condition without forcing you to catch, inspect, and re-throw.

```csharp
try
{
    throw new InvalidOperationException("retryable: server busy");
}
catch (InvalidOperationException ex) when (ex.Message.Contains("retryable"))
{
    Console.WriteLine("caught a retryable error, will try again");
}
```
```console
$ dotnet run
caught a retryable error, will try again
```
*What just happened:* the `when (...)` filter ran *before* the catch body engaged. The message contained "retryable," so the filter returned `true` and this block handled it. Had it *not* matched, this `catch` would have been skipped entirely and the exception kept unwinding, as if the block weren't there. That's the win over catching-then-rethrowing: a declined exception never counts as "handled here," keeping a cleaner stack trace.

## Throwing & custom exceptions

**What it actually is.** You raise an exception yourself with `throw new SomeException("message")`, when your method is asked to do something it *can't* sensibly do. Built-in types cover most cases: `ArgumentException` (a parameter is wrong), `ArgumentNullException` (a required argument was null), `InvalidOperationException` (wrong state for this call).

**A real example - validate and throw.**

```csharp
decimal Withdraw(decimal balance, decimal amount)
{
    if (amount <= 0)
        throw new ArgumentException("amount must be positive", nameof(amount));
    if (amount > balance)
        throw new InvalidOperationException("insufficient funds");

    return balance - amount;
}

Console.WriteLine(Withdraw(100m, 30m));   // fine
Console.WriteLine(Withdraw(100m, 500m));  // throws
```
```console
$ dotnet run
70
Unhandled exception. System.InvalidOperationException: insufficient funds
   at Program.<Withdraw>g__Withdraw|0_0(Decimal balance, Decimal amount)
```
*What just happened:* the first call passed validation and returned `70`. The second asked to withdraw more than the balance - a state this method refuses to handle - so it threw `InvalidOperationException`. `throw` immediately stopped `Withdraw` and handed the failure to the caller. `nameof(amount)` passes the parameter's name to the exception so the message can say *which* argument was bad, without hard-coding a string that would rot if you renamed the parameter.

**A small custom exception.** When the built-ins don't capture your domain, derive your own from `Exception` - convention names it `...Exception` with a constructor that takes a message.

```csharp
public class InsufficientFundsException : Exception
{
    public decimal Shortfall { get; }

    public InsufficientFundsException(decimal shortfall)
        : base($"short by {shortfall:C}")
    {
        Shortfall = shortfall;
    }
}

decimal Withdraw(decimal balance, decimal amount)
{
    if (amount > balance)
        throw new InsufficientFundsException(amount - balance);
    return balance - amount;
}

try
{
    Withdraw(100m, 130m);
}
catch (InsufficientFundsException ex)
{
    Console.WriteLine($"declined - {ex.Message} (shortfall {ex.Shortfall})");
}
```
```console
$ dotnet run
declined - short by $30.00 (shortfall 30)
```
*What just happened:* `InsufficientFundsException` carries a typed `Shortfall` field, so callers can catch it specifically *and* read structured data off it - far better than parsing a string message. `: base(...)` hands a human-readable message up to `Exception`. A caller can write `catch (InsufficientFundsException ex)` to handle exactly this case.

💡 **Throw vs. return a result.** Throw for the *exceptional* - the genuinely unexpected, "I can't do my job" case. For normal, expected outcomes (a lookup that might miss, a parse that might fail on user input), prefer a non-throwing path: `int.TryParse` and `dictionary.TryGetValue` return a `bool` instead, because "the user typed letters" is a Tuesday, not a catastrophe. Exceptions are relatively expensive and interrupt flow.

## `using` / `IDisposable` - deterministic cleanup

**What it actually is.** Some objects hold resources the garbage collector can't tidy up promptly - open files, sockets, database connections. These must be *released* the moment you're done, not "eventually." C#'s answer is **`IDisposable`**: any type holding such a resource implements a `Dispose()` method that releases it. **`using`** guarantees `Dispose()` runs the instant the variable leaves scope - even if an exception is thrown partway through.

📝 **`IDisposable`** - an interface with one method, `Dispose()`, for releasing unmanaged resources. **`using`** - calls `Dispose()` automatically when its scope ends: "open this, and *no matter what happens*, close it on the way out."

**Why this exists.** You *could* do this by hand with `try`/`finally` - open the file, `Close()` in a `finally` block so it runs even on failure. `using` is that pattern compressed into one keyword you can't forget.

**A real example.**

```csharp
using (var writer = new StreamWriter("log.txt"))
{
    writer.WriteLine("first line");
    writer.WriteLine("second line");
}   // writer.Dispose() runs HERE - file flushed and closed automatically

Console.WriteLine("file is closed and saved");
```
*What just happened:* `StreamWriter` implements `IDisposable` because it holds an open file handle. The `using` block opened the file, wrote to it, and called `writer.Dispose()` automatically at the closing brace, flushing buffered text to disk and releasing the handle. Even if `WriteLine` had thrown, `Dispose()` would *still* run, so the file would never stay locked open.

Modern C# offers a tidier form, the **`using` declaration** - no braces, disposal at the end of the *enclosing* scope:

```csharp
void SaveReport()
{
    using var writer = new StreamWriter("report.txt");
    writer.WriteLine("totals: ...");
    // no closing brace block - writer.Dispose() runs when SaveReport() returns
}
```
*What just happened:* `using var writer = ...` is the same guarantee with less nesting - `Dispose()` fires when `writer` falls out of scope at the method's end. Use this form when the resource lives the whole method; use braced `using (...) { }` to release it partway through instead.

## File I/O - reading and writing

**What it actually is.** `System.IO` is C#'s toolbox for files and streams. For "read/write a whole file," the static `File` class has one-call helpers; for a large file piece by piece, `StreamReader` streams it line by line without loading it all into memory.

**A real example - the one-call helpers.**

```csharp
using System.IO;

File.WriteAllText("greeting.txt", "hello\nfrom C#");

string whole = File.ReadAllText("greeting.txt");
Console.WriteLine($"--- whole file ---\n{whole}");

string[] lines = File.ReadAllLines("greeting.txt");
Console.WriteLine($"--- line count: {lines.Length} ---");
foreach (string line in lines)
    Console.WriteLine($"> {line}");
```
```console
$ dotnet run
--- whole file ---
hello
from C#
--- line count: 2 ---
> hello
> from C#
```
*What just happened:* `File.WriteAllText` created (or overwrote) the file and wrote the string in one call - opens, writes, closes for you, no handle to dispose. `File.ReadAllText` slurped the entire contents as one string; `File.ReadAllLines` split on line breaks into a `string[]`. Perfect for small files. ⚠️ The catch is in the name: `ReadAllText` loads the *whole* file into memory, so a multi-gigabyte log needs streaming instead.

**Reading line by line with `StreamReader`.** For a big file, read it as a stream so only one line sits in memory at a time, wrapped in `using` so the handle always closes.

```csharp
using System.IO;

File.WriteAllLines("data.txt", new[] { "alpha", "beta", "gamma" });

using var reader = new StreamReader("data.txt");
string? line;
int count = 0;
while ((line = reader.ReadLine()) != null)
{
    count++;
    Console.WriteLine($"{count}: {line}");
}
```
```console
$ dotnet run
1: alpha
2: beta
3: gamma
```
*What just happened:* `StreamReader.ReadLine()` returns the next line each call, and `null` when nothing's left - the loop's exit condition. Only one line is held at a time, working on files far too large for RAM. `using var` releases the handle when the method ends, even if a read throws. `string? line` marks it possibly-null, since `ReadLine()` returns `null` at end of file (more in [Phase 13](13-records-and-modern-csharp.md)).

⚠️ **`NullReferenceException` - the error you'll hit most.** Calling a method or reading a property on a `null` reference throws `NullReferenceException` ("Object reference not set to an instance of an object") - C#'s single most common runtime crash, from a file read returning `null`, a missed dictionary lookup, an object you forgot to construct. The modern defense is **nullable reference types**, warning the compiler about possible nulls *before* you run - covered in [Phase 13](13-records-and-modern-csharp.md) and [Phase 9](09-idioms-and-gotchas.md). For now: check before you use a value that *could* be null.

## Recap

1. **Exceptions are C#'s error model** - a thrown object aborts the current method and unwinds the stack until a `catch` handles it; uncaught, it crashes with a stack trace. `try`/`catch`/`finally` is the structure, and `finally` always runs.
2. **All C# exceptions are unchecked** - the compiler never forces you to handle one, so knowing what can throw is on you. Catch *specific* types you can recover from; never swallow a bare `catch (Exception)` and hide real bugs. Use `when` filters to catch conditionally.
3. **Throw deliberately** - `throw new ArgumentException(...)` when your method can't do its job; define a custom `: Exception` to carry typed, domain-specific data. Reserve exceptions for the genuinely exceptional; prefer `TryParse`-style methods for expected failures.
4. **`using` / `IDisposable` guarantee cleanup** - `using var f = ...;` calls `Dispose()` at scope end no matter what, so files, connections, and sockets are always released. It's `try`/`finally` for resources, made unforgettable.
5. **File I/O lives in `System.IO`** - `File.ReadAllText`/`WriteAllText`/`ReadAllLines` for whole small files; `StreamReader.ReadLine()` in a `using` for large files read line by line.
6. ⚠️ **`NullReferenceException` is the crash you'll meet most** - calling into a `null` reference. Check for null, and lean on nullable reference types ([Phase 13](13-records-and-modern-csharp.md)) to catch it at compile time.

You can now fail gracefully and clean up after yourself - the difference between a toy and a program people trust. Next we step out of the language and into the toolbox around it: how real C# projects are structured, how to pull in libraries with NuGet, and the commands that build and run it all.

## Quick check

Test yourself on the ideas that matter most - how exceptions flow, and why `using` exists:

```quiz
[
  {
    "q": "What happens the moment an exception is thrown and nothing in the current method catches it?",
    "choices": [
      "The runtime unwinds the stack, abandoning the current method and rising to its caller, looking for a matching catch",
      "The method returns its default value and execution continues normally",
      "The compiler refuses to build the program until you add a try/catch",
      "The exception is silently ignored and the next line runs"
    ],
    "answer": 0,
    "explain": "A thrown exception aborts the current method and travels up the call stack, method by method, until a matching catch handles it - or it falls out the top and crashes the program. The compiler never forces you to handle it: C# exceptions are all unchecked."
  },
  {
    "q": "Why is catching `Exception` (the base type) usually a bad idea?",
    "choices": [
      "It grabs everything - including bugs you'd want to crash loudly - and hides them behind a program that looks fine but is quietly broken",
      "It is slower than catching a specific type",
      "The compiler emits an error when you catch the base Exception type",
      "It only works inside a finally block"
    ],
    "answer": 0,
    "explain": "A bare catch (Exception) swallows the failure you expected AND unrelated bugs like null-reference or out-of-memory. Catch the narrowest type you can actually recover from; let everything else keep propagating."
  },
  {
    "q": "What does a `using` statement guarantee about the object it wraps?",
    "choices": [
      "Its Dispose() method is called when the variable leaves scope, even if an exception is thrown",
      "The object can never be set to null",
      "The object is loaded entirely into memory before use",
      "The object's methods can only be called once"
    ],
    "answer": 0,
    "explain": "using is try/finally for resources: it calls Dispose() automatically at the end of scope no matter how you leave it - normal exit or exception. That is how files, sockets, and connections get released promptly and reliably."
  }
]
```

---

[← Phase 6: Inheritance & Interfaces](06-inheritance-and-interfaces.md) · [Guide overview](_guide.md) · [Phase 8: Projects, NuGet & Tooling →](08-projects-and-tooling.md)
