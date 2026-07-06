---
title: "Install & Your First Program - .NET, the dotnet CLI & the CLR"
guide: "csharp-from-zero"
phase: 1
summary: "Get the .NET SDK installed, write a one-line program with top-level statements, and run it with dotnet - plus the mental model of how C# compiles to IL that the CLR JITs to native code."
tags: [csharp, dotnet, clr, dotnet-cli, install, il, getting-started]
difficulty: beginner
synonyms: ["how to install dotnet sdk", "dotnet cli new run", "what is the clr", "c# il bytecode", "c# hello world", "dotnet vs .net framework", "c# top level statements"]
updated: 2026-06-22
---

# Install & Your First Program

Before C# is fun, you need a tool that turns your code into something runnable, and one tiny program that proves it works. With modern .NET both are quick - and the first program already teaches you how C# *thinks*: source isn't run directly, but compiled to a portable in-between form a runtime turns into real machine code as it runs.

## The mental model: your code becomes IL, the CLR runs it

When you "run" C#, three often-confused layers are involved:

- **The .NET SDK** - the developer toolkit: the C# compiler, the `dotnet` command-line tool, project templates, and everything needed to *build* software. This is what you install to write code.
- **The .NET runtime** - what your finished program needs to *run*. The SDK includes a runtime, so installing the SDK gives you both. (End users who only run .NET apps install just the runtime, not the whole SDK.)
- **The CLR (Common Language Runtime)** - the engine *inside* the runtime that actually executes your program: it loads code, manages memory (garbage collection), and turns the portable code into native instructions.

📝 **Terminology.** SDK = build tools. Runtime = what runs a finished app. CLR = the execution engine at its heart. Rule of thumb: install the **SDK** to develop, ship to people who have the **runtime**, and the **CLR** does the work at execution time.

Here's the part that surprises people coming from C or Go: the C# compiler does **not** produce a native `.exe` full of machine code for your CPU. It produces **IL** (Intermediate Language, also called CIL or MSIL): a compact, CPU-independent bytecode. At runtime, the CLR's **JIT** (Just-In-Time) compiler translates that IL into native machine code for the specific machine it's on, method by method, the first time each is called.

```mermaid
flowchart LR
  A["Program.cs"] --> B["C# compiler"]
  B --> C["IL (bytecode)"]
  C --> D["CLR + JIT"]
  D --> E["native code"]
```

*What just happened:* Your `.cs` source goes through the compiler once to become IL, which is what ships inside a .NET program. The CLR loads that IL and JITs it to native code on demand as the program runs - why the *same* compiled .NET program runs on Windows, macOS, and Linux: the IL is portable, and each platform's CLR JITs it to that platform's instructions.

💡 **Why this design.** Compiling to IL instead of straight to native buys portability (one build, many platforms) and a runtime that can optimize using information only known at execution time, like which CPU model you have. The cost: a runtime must be present, plus a brief JIT warm-up the first time code runs - invisible and worth it for most software.

One naming knot worth untangling: **Modern .NET** (.NET 5, 6, 7, 8, and onward) is cross-platform and open source; it used to be called ".NET Core." The **legacy .NET Framework** (4.x and earlier) is Windows-only and in maintenance mode. ⚠️ "Create a new project" almost always means modern .NET - that's what you're installing here. ".NET Framework" is the old Windows-only line, not what new code targets.

## Install the .NET SDK

Go to **[dotnet.microsoft.com/download](https://dotnet.microsoft.com/download)** and grab the **SDK** (not the runtime-only option) for the latest .NET version on your OS. Run the installer and accept the defaults. On macOS and Linux a package manager is often tidier:

```bash
# macOS (Homebrew)
brew install --cask dotnet-sdk

# Debian / Ubuntu (Microsoft package feed configured)
sudo apt-get install -y dotnet-sdk-8.0

# Windows (winget)
winget install Microsoft.DotNet.SDK.8
```

*What just happened:* Each fetches and installs the .NET SDK - compiler, `dotnet` CLI, and a runtime - and puts `dotnet` on your `PATH`. Pick the line matching your machine.

Now confirm it worked:

```bash
dotnet --version
```

```console
8.0.401
```

*What just happened:* `--version` reported the installed SDK version - anything 8.0 or newer is fine here. A version line means the toolchain is on your `PATH`.

⚠️ **Gotcha.** `dotnet: command not found` (or `'dotnet' is not recognized` on Windows) right after installing usually means a terminal window open *before* the install doesn't know about the updated `PATH` yet. Close it and open a fresh one; the install is fine.

## Your first program

Unlike single-file Java or Go, C# is **project-oriented** from the first program - you create a small project, not a lone source file. The CLI scaffolds one for you:

```bash
dotnet new console -o hello
cd hello
```

*What just happened:* `dotnet new console` created a **console** (text-based) app from a built-in template; `-o hello` put it in a new folder. Inside are two files that matter: `Program.cs` (your code) and `hello.csproj` (more in a moment). Open `Program.cs`:

```csharp
Console.WriteLine("Hello, World!");
```

*What just happened:* That single line is a complete, runnable C# program. `Console` is a type from .NET's standard library representing the text terminal; `WriteLine` prints its argument followed by a newline. No class, no `Main`, no `using` directive - yet it compiles and runs, thanks to **top-level statements**.

📝 **Top-level statements** let you write executable code directly at the top of a file, without wrapping it in a class and a method. The compiler treats the file's statements as the body of the entry point - the same machinery as the classic form below, with the boilerplate written for you.

To run it:

```bash
dotnet run
```

```console
Hello, World!
```

*What just happened:* `dotnet run` compiled `Program.cs` to IL, handed it to the CLR, and the JIT ran it - printing the text, with no intermediate files or manual compiler invocation. It's the "just try it" command you'll lean on constantly.

### What top-level statements desugar to

You'll meet the longer form in older code and most non-trivial programs. Under the hood, the compiler wraps your top-level statements in a class with a special `Main` method - historically *the* entry point of every C# program:

```csharp
using System;

class Program
{
    static void Main(string[] args)
    {
        Console.WriteLine("Hello, World!");
    }
}
```

*What just happened:* This is the classic, fully-spelled-out version your one-liner desugars into. `using System;` brings the `System` namespace into scope so you can write `Console` instead of `System.Console`. `class Program` is a container for your code (C# organizes everything into classes). `static void Main(string[] args)` is the **entry point** - the method the CLR calls when your program starts; `args` holds command-line arguments. The top-level form lets the compiler generate all this so a beginner's first program isn't a wall of ceremony.

💡 **Key point.** Top-level statements and the explicit `class Program { static void Main }` form are *the same thing* - one is compiler shorthand for the other. Use the short form for small programs and scripts; the long form appears in larger codebases and when you need fine control over the entry point.

## The project model: `.csproj` and why C# is project-first

That `hello.csproj` file the template created is the **project file**, central to how C# work is organized. Peek inside - it's surprisingly small:

```csharp
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>net8.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
  </PropertyGroup>

</Project>
```

*What just happened:* The `.csproj` is an XML file that *describes* the project: that it builds an executable (`OutputType`), which .NET version it targets (`TargetFramework`), and a couple of language settings. `ImplicitUsings` is why your one-liner didn't need `using System;` - common namespaces import automatically. You rarely edit this by hand early on, but `dotnet run` reads it to know *how* to build your program.

📝 **Mental model.** A C# program is a **project**, not a loose file. `dotnet build` compiles the project; `dotnet run` builds *and* runs it. Unlike languages where you point a tool at a single source file, here the `.csproj` is the unit of work - extra structure that lets projects scale cleanly to many files and dependencies.

## Your everyday workflow

You can write C# in any editor, but a few setups are worth knowing:

- **Visual Studio** (Windows/Mac) - Microsoft's full, heavy IDE, deeply integrated with .NET.
- **VS Code + the C# Dev Kit extension** - lightweight, cross-platform, the most common modern choice.
- **JetBrains Rider** - a polished cross-platform IDE many professionals prefer.

All three give autocomplete, inline error highlighting, and a debugger. While learning, the `dotnet` CLI plus any editor is plenty.

One CLI command makes your loop smoother right away:

```bash
dotnet watch run
```

*What just happened:* `dotnet watch run` runs your program and *keeps watching* your source files - edit and save `Program.cs`, and it recompiles and re-runs automatically, no retyping `dotnet run`. It's the tightest feedback loop for experimenting.

We'll keep to single-project programs for now. Third-party libraries via **NuGet** and multi-project **solutions** come later, in Phase 8 - not needed to learn the language itself.

## Recap

1. **C# compiles to IL** (a portable bytecode), and the **CLR** runs it by JIT-compiling that IL to native machine code at execution time - which is why one build runs on Windows, macOS, and Linux.
2. **SDK vs runtime vs CLR**: install the SDK to develop, ship to machines that have the runtime, and the CLR is the engine that executes your code. **Modern .NET** is cross-platform (formerly ".NET Core"); legacy **.NET Framework** is the old Windows-only line.
3. Install the SDK from [dotnet.microsoft.com/download](https://dotnet.microsoft.com/download) (or a package manager) and confirm with **`dotnet --version`**.
4. **`dotnet new console`** scaffolds a project; **`dotnet run`** builds and runs it. **Top-level statements** let your first program be a single line, which desugars to the classic `class Program { static void Main }`.
5. A C# program is a **project** described by a **`.csproj`** file - C# is project-oriented from the start, unlike single-file languages.
6. Use an IDE (Visual Studio, VS Code + C# Dev Kit, Rider) and **`dotnet watch run`** for an auto-reloading feedback loop; NuGet and solutions come in Phase 8.

Next, we give the program something to work with: named values, the types C# stores them in, and the rules that govern how they behave.

## Quick check

Test yourself on the idea that underpins everything else - how C# actually runs:

```quiz
[
  {
    "q": "When the C# compiler builds your program, what does it produce?",
    "choices": [
      "IL (Intermediate Language) bytecode, which the CLR JIT-compiles to native code at runtime",
      "Native machine code for your exact CPU, ready to run with no runtime",
      "An interpreted script the runtime reads line by line every time",
      "A .csproj file describing how to build the program later"
    ],
    "answer": 0,
    "explain": "The compiler emits portable IL, not native code. At runtime the CLR's JIT compiler translates that IL into native machine code for the current machine - which is what makes one build run across platforms."
  },
  {
    "q": "What's the difference between the .NET SDK and the .NET runtime?",
    "choices": [
      "The SDK is the developer toolkit (compiler + CLI + a runtime); the runtime is just what's needed to run a finished app",
      "They're two names for the same download",
      "The SDK runs apps and the runtime builds them",
      "The SDK is for Windows and the runtime is for macOS and Linux"
    ],
    "answer": 0,
    "explain": "You install the SDK to develop - it bundles the compiler, the dotnet CLI, and a runtime. End users who only run .NET apps install just the runtime."
  },
  {
    "q": "The one-line `Console.WriteLine(\"Hello, World!\");` with no class or Main - what is it?",
    "choices": [
      "A top-level statement that the compiler desugars into a class with a static Main entry point",
      "A special scripting mode that skips compilation entirely",
      "An error that only works in the REPL, not in a real project",
      "A different language feature unrelated to the classic Main method"
    ],
    "answer": 0,
    "explain": "Top-level statements let you skip the boilerplate; the compiler wraps them in a generated class with a static Main method. The short form and the explicit class Program { static void Main } form are the same program."
  }
]
```

---

[Guide overview](_guide.md) · [Phase 2: Syntax, Values & Types →](02-syntax-values-and-types.md)
