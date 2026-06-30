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

Before C# is fun, you need two things on your machine: a tool that turns your code into something runnable, and one tiny program that proves it works. With modern .NET both are quick, and the very first program teaches you something about how C# *thinks* - that your source isn't run directly, but compiled to a portable in-between form that a runtime turns into real machine code as your program runs. Let's get there, and build the mental model along the way.

## The mental model: your code becomes IL, the CLR runs it

Here's the thing to hold in your head before anything else. When you "run" C#, three layers are involved, and they're often confused:

- **The .NET SDK** - the developer toolkit. It contains the C# compiler, the `dotnet` command-line tool, project templates, and everything you need to *build* software. This is what you install to write code.
- **The .NET runtime** - what your finished program needs to *run*. The SDK includes a runtime, so installing the SDK gives you both. (End users who only run .NET apps install just the runtime, not the whole SDK.)
- **The CLR (Common Language Runtime)** - the engine *inside* the runtime that actually executes your program: it loads code, manages memory (garbage collection), and turns the portable code into native instructions.

📝 **Terminology.** SDK = build tools (compiler + CLI + a runtime). Runtime = the thing that runs a finished app. CLR = the execution engine at the heart of the runtime. Rule of thumb: install the **SDK** to develop, ship to people who have the **runtime**, and the **CLR** does the work at execution time.

Now the part that surprises people coming from C or Go. The C# compiler does **not** produce a native `.exe` full of machine code for your CPU. It produces **IL** (Intermediate Language - also called CIL or MSIL): a compact, CPU-independent bytecode. At runtime, the CLR's **JIT** (Just-In-Time) compiler translates that IL into native machine code *for the specific machine it's running on*, method by method, the first time each method is called.

```mermaid
flowchart LR
  A["Program.cs"] --> B["C# compiler"]
  B --> C["IL (bytecode)"]
  C --> D["CLR + JIT"]
  D --> E["native code"]
```

*What just happened:* Your `.cs` source goes through the compiler once to become IL, which is what actually ships inside a .NET program. The CLR loads that IL and the JIT compiles it to native code on demand as the program runs. This is why the *same* compiled .NET program can run on Windows, macOS, and Linux: the IL is portable, and each platform's CLR JITs it to that platform's instructions.

💡 **Why this design.** Compiling to IL instead of straight to native buys you two big wins: portability (one build, many platforms) and a smart runtime that can optimize using information only known at execution time - like which CPU model you actually have. The cost is a runtime must be present, and a brief JIT warm-up the first time code runs. For the vast majority of software, that trade is invisible and worth it.

One naming knot worth untangling now, because it confuses everyone. **Modern .NET** (the current versions - .NET 5, 6, 7, 8, and onward) is cross-platform and open source; it used to be called ".NET Core." The **legacy .NET Framework** (versions 4.x and earlier) is Windows-only and in maintenance mode. ⚠️ When a tutorial says "create a new project," it almost always means modern .NET today - that's what you're installing here. If you ever see ".NET Framework," know it's the old Windows-only line and not what new code targets.

## Install the .NET SDK

Go to the official downloads page - **[dotnet.microsoft.com/download](https://dotnet.microsoft.com/download)** - and grab the **SDK** (not the runtime-only option) for the latest .NET version on your operating system. Run the installer and accept the defaults. On macOS and Linux you can also install it through a package manager, which is often tidier:

```bash
# macOS (Homebrew)
brew install --cask dotnet-sdk

# Debian / Ubuntu (Microsoft package feed configured)
sudo apt-get install -y dotnet-sdk-8.0

# Windows (winget)
winget install Microsoft.DotNet.SDK.8
```

*What just happened:* Each of these fetches and installs the .NET SDK - the compiler, the `dotnet` CLI, and a runtime - and puts the `dotnet` command on your system `PATH`, so you can type `dotnet` in any terminal and have it found. Pick the one line that matches your machine; the rest are there so you recognize them later.

Now confirm it worked. Before writing any code, ask .NET to introduce itself:

```bash
dotnet --version
```

```console
8.0.401
```

*What just happened:* You ran the `dotnet` tool with the `--version` flag, and it reported the installed SDK version. The exact number will differ over time - anything 8.0 or newer is great for this guide. If you got a version line, the toolchain is on your machine and on your `PATH`.

⚠️ **Gotcha.** If your terminal says `dotnet: command not found` (or `'dotnet' is not recognized` on Windows) right after installing, the usual cause is a terminal window that was open *before* the install - it doesn't know about the updated `PATH` yet. Close it and open a fresh one. The install is fine; the old window just hadn't heard about it.

## Your first program

Unlike single-file Java or Go, C# is **project-oriented** from the very first program - you create a small project rather than a lone source file. The CLI scaffolds one for you. In a folder of your choosing:

```bash
dotnet new console -o hello
cd hello
```

*What just happened:* `dotnet new console` created a new **console** (text-based) application from a built-in template, and `-o hello` put it in a new folder called `hello`. Inside, you'll find two files that matter: `Program.cs` (your code) and `hello.csproj` (the project file - more on it in a moment). Open `Program.cs` and you'll see something refreshingly short:

```csharp
Console.WriteLine("Hello, World!");
```

*What just happened:* That single line is a complete, runnable C# program. `Console` is a type from .NET's standard library that represents the text terminal, and `WriteLine` is a method on it that prints its argument followed by a newline. There's no class, no `Main` method, no `using` directive cluttering the file - and yet this compiles and runs. That's thanks to a modern feature called **top-level statements**.

📝 **Top-level statements** let you write executable code directly at the top of a file, without wrapping it in a class and a method. The compiler treats this file's statements as the body of the program's entry point. It's the same machinery as the classic form below - just with the boilerplate written for you.

To run it:

```bash
dotnet run
```

```console
Hello, World!
```

*What just happened:* `dotnet run` did everything in one step: it compiled `Program.cs` to IL, handed that IL to the CLR, and the CLR (via the JIT) ran it - printing the text. You didn't manage any intermediate files or invoke the compiler directly; `dotnet run` is the "just try it" command you'll lean on constantly while learning.

### What top-level statements desugar to

That one-liner is real, but it's worth seeing what it stands in for, because you'll meet the longer form in older code and in most non-trivial programs. Under the hood, the compiler wraps your top-level statements in a class with a special `Main` method - historically *the* entry point of every C# program:

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

*What just happened:* This is the classic, fully-spelled-out version of the same program, and it's exactly what your one-liner desugars into. `using System;` brings the `System` namespace into scope so you can write `Console` instead of `System.Console`. `class Program` is a container for your code (C# organizes everything into classes). `static void Main(string[] args)` is the **entry point** - the single method the CLR calls when your program starts; `args` holds command-line arguments. The top-level form lets the compiler generate all of this so a beginner's first program isn't a wall of ceremony.

💡 **Key point.** Top-level statements and the explicit `class Program { static void Main }` form are *the same thing* - one is shorthand the compiler expands into the other. Use the short form for small programs and scripts; you'll see the long form in larger codebases and when you need fine control over the entry point. Knowing they're equivalent means neither one will ever look mysterious.

## The project model: `.csproj` and why C# is project-first

Remember that `hello.csproj` file the template created? That's the **project file**, and it's central to how C# work is organized. Peek inside and it's surprisingly small:

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

*What just happened:* The `.csproj` is an XML file that *describes* the project: that it builds an executable (`OutputType`), which .NET version it targets (`TargetFramework`), and a couple of language settings. `ImplicitUsings` is why your one-liner didn't need `using System;` - common namespaces are imported automatically. You rarely edit this file by hand early on, but it's worth knowing it exists: when `dotnet run` builds your program, it reads this file to know *how*.

📝 **Mental model.** A C# program is a **project**, not a loose file. `dotnet build` compiles the project; `dotnet run` builds *and* runs it. This is different from languages where you point a tool at a single source file - in C#, the `.csproj` is the unit of work, and the CLI commands operate on it. It feels like extra structure at first, but it's what lets projects scale cleanly to many files and dependencies.

## Your everyday workflow

You can write C# in any editor, but a few setups are worth knowing:

- **Visual Studio** (Windows/Mac) - Microsoft's full IDE, deeply integrated with .NET. Heavy, but powerful.
- **VS Code + the C# Dev Kit extension** - lightweight, cross-platform, and the most common modern choice for everyday work.
- **JetBrains Rider** - a polished cross-platform IDE that many professionals prefer.

Any of these gives you autocomplete, inline error highlighting, and a debugger. While you're learning, though, the `dotnet` CLI plus any editor is plenty.

One CLI command will make your loop smoother right away:

```bash
dotnet watch run
```

*What just happened:* `dotnet watch run` runs your program and then *keeps watching* your source files. Edit and save `Program.cs`, and it automatically recompiles and re-runs - no need to stop and type `dotnet run` again. It's the tightest feedback loop for experimenting, and it'll save you a lot of keystrokes as you work through this guide.

We'll keep things to single-project programs for now. Pulling in third-party libraries with **NuGet** (.NET's package manager) and grouping multiple projects into **solutions** come later, in Phase 8 - you don't need them to learn the language itself.

## Recap

1. **C# compiles to IL** (a portable bytecode), and the **CLR** runs it by JIT-compiling that IL to native machine code at execution time - which is why one build runs on Windows, macOS, and Linux.
2. **SDK vs runtime vs CLR**: install the SDK to develop, ship to machines that have the runtime, and the CLR is the engine that executes your code. **Modern .NET** is cross-platform (formerly ".NET Core"); legacy **.NET Framework** is the old Windows-only line.
3. Install the SDK from [dotnet.microsoft.com/download](https://dotnet.microsoft.com/download) (or a package manager) and confirm with **`dotnet --version`**.
4. **`dotnet new console`** scaffolds a project; **`dotnet run`** builds and runs it. **Top-level statements** let your first program be a single line, which desugars to the classic `class Program { static void Main }`.
5. A C# program is a **project** described by a **`.csproj`** file - C# is project-oriented from the start, unlike single-file languages.
6. Use an IDE (Visual Studio, VS Code + C# Dev Kit, Rider) and **`dotnet watch run`** for an auto-reloading feedback loop; NuGet and solutions come in Phase 8.

Next, we give the program something to work with: named values, the types C# stores them in, and the rules that govern how they behave.

## Quick check

Test yourself on the one idea that underpins everything else - how C# actually runs:

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
