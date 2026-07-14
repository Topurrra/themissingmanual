---
title: "Syntax, Variables & Types"
guide: "c-from-zero"
phase: 2
summary: "What does a C program actually look like, and what are int, char, and float really storing under the hood?"
tags: [c, syntax, variables, types, beginner, printf, scanf]
difficulty: beginner
synonyms: ["c variable types", "c data types explained", "int vs float vs char in c", "how to declare a variable in c", "c printf format specifiers", "c syntax basics", "c int size in bytes", "what is a type in c"]
updated: 2026-07-14
---
# Syntax, Variables & Types

Last phase you got a C program to compile and run. Now open it up and figure out what every piece of it actually means. This phase is about the smallest building blocks: how you write a line of C, what a variable *is* to the machine, and why C makes you say up front exactly what kind of data you're storing.

## The mental model: a variable is a labeled box of a fixed size

In a lot of languages you're used to thinking of a variable as a name that can hold anything - a number today, a string tomorrow. C does not work that way, and understanding why unlocks almost everything else in this language.

**What a variable actually is.** When you declare a variable in C, you're telling the compiler to reserve a specific, fixed number of bytes in memory, and you're giving that spot a name and a rule for how to interpret the bits inside it. An `int` is (usually) 4 bytes, always interpreted as a whole number. A `char` is 1 byte, always interpreted as a small integer that usually represents a character. The *type* isn't a suggestion or a label you can peel off later - it's a promise to the compiler about the size and shape of the box, made before the program ever runs.

**Why this exists.** C was designed to map almost directly onto how a computer actually works: memory as a flat sequence of bytes, and a CPU that needs to know exactly how many bytes to read and how to interpret them. A dynamically-typed language like Python or JavaScript spends real work at runtime tracking what kind of value is in a variable right now. C skips all of that by deciding it once, at compile time, and baking it into the generated machine code. That's a big part of why C programs are fast: there is no "what type is this?" check happening while your program runs. The type was already decided when the program was built.

This is also why C is called **statically typed**: every variable's type is fixed the moment you declare it, and it never changes for the life of that variable.

## Declaring a variable

A declaration says three things at once: the type, the name, and (optionally) a starting value.

```c
int age = 30;
```

Read that left to right: "reserve a box shaped like an `int`, call it `age`, put `30` in it." You can declare without a value too, but the box's contents are then *garbage* - whatever bits happened to already be sitting in that memory. C will not clear it for you.

```c
int score;          // uninitialized - contains leftover garbage bits, not 0
score = 100;         // now it's meaningful
```

⚠️ **This is a real footgun, not a theoretical one.** Reading an uninitialized variable before assigning it is **undefined behavior** - the standard doesn't say what happens, so the compiler is free to do anything. It will usually just warn you rather than stop you, and the value you read is unpredictable: it might be `0` on one run and `47331` on the next, because it depends on whatever was in that memory before. (You'll meet "undefined behavior" properly in phase 14; for now, just treat it as a line you don't cross.) Get in the habit of initializing every variable when you declare it.

## The basic types

C gives you a small set of built-in types, each a different-sized box:

| Type | Typical size | Holds | Example |
|------|-------------|-------|---------|
| `int` | 4 bytes | Whole numbers | `int count = 42;` |
| `char` | 1 byte | A single character (really a small integer) | `char grade = 'A';` |
| `float` | 4 bytes | Decimal numbers, less precision | `float pi = 3.14f;` |
| `double` | 8 bytes | Decimal numbers, more precision | `double pi = 3.14159265;` |

📝 **Terminology.** "Typical size" because the C standard only guarantees *minimums*, not exact sizes - on almost every machine you'll touch today (including your laptop), these sizes hold, but C's portability across decades of wildly different hardware means the standard leaves a little room. If you ever need to know for certain, `sizeof(int)` tells you, on your machine, right now.

A `char` deserves a second look, because it surprises people. `'A'` looks like a letter, but C stores it as the integer 65 - its position in the ASCII table. `char` is really just a 1-byte integer that print functions *choose* to display as a letter. Proof:

```c
#include <stdio.h>

int main(void) {
    char grade = 'A';
    printf("As a character: %c\n", grade);
    printf("As a number: %d\n", grade);
    return 0;
}
```
```console
As a character: A
As a number: 65
```

Same byte, two different printf format specifiers, two different ways of looking at the same bits. That's the whole idea of a type in one example: the bits don't change, only how you've told the program to *read* them.

## Format specifiers: telling printf and scanf how to read the box

`printf` doesn't know what type its arguments are - C strips that information away by the time the function is called. So you tell it, with a **format specifier**, right there in the string:

| Specifier | For type |
|-----------|----------|
| `%d` | `int` |
| `%c` | `char` |
| `%f` | `float` or `double` |
| `%s` | string (a `char` array - more on that in phase 6) |

```c
#include <stdio.h>

int main(void) {
    int age = 30;
    float height = 5.9f;
    char initial = 'J';

    printf("Age: %d, Height: %.1f, Initial: %c\n", age, height, initial);
    return 0;
}
```
```console
Age: 30, Height: 5.9, Initial: J
```

`%.1f` means "print a float, one digit after the decimal point" - the number before the `f` controls precision.

Get a specifier wrong and C will not stop you. Write `%d` for a `float` and the compiler may warn you, but it will still run, reading the wrong number of bytes and interpreting them as the wrong type, printing nonsense. This is your first real taste of **undefined behavior** - a phrase you'll meet properly in phase 14 - where C trusts you to be right instead of checking. For now, the rule is simple: match the specifier to the type, every time.

Reading input works the same way, with `scanf`, except you also need `&` before the variable name:

```c
int age;
printf("Enter your age: ");
scanf("%d", &age);
```

That `&` means "the address of `age`" - `scanf` needs to know *where* in memory to write the number it reads, not just what's currently there. Addresses and `&` are the whole subject of phase 5 (Pointers I), so don't worry about fully absorbing it yet - just recognize the pattern: `printf` reads values, `scanf` writes into addresses.

## Constants: a box you promise not to change

Sometimes you want a named value that can never be reassigned - a safety rail, not just a convention. C gives you `const`:

```c
const float TAX_RATE = 0.08f;
```

Try to assign to `TAX_RATE` again anywhere later in the code and the compiler stops you cold, with an error at compile time - not a bug you discover at 2am. Use `const` for any value that's meant to stay fixed; it costs nothing and it turns a whole category of "wait, who changed this?" bugs into a compiler error instead.

## Naming rules and style

C's rules for names are strict but small: letters, digits, and underscores, must not start with a digit, and case matters (`age` and `Age` are different variables). Beyond that, it's convention rather than syntax - most C code uses `snake_case` (`total_score`, not `totalScore`), and that's what you'll see in this guide and in most C codebases you'll read.

## Recap

1. A variable is a fixed-size, fixed-interpretation box in memory - the type is decided once, at compile time, and never changes.
2. The core types - `int`, `char`, `float`, `double` - are different box sizes for different kinds of data; `char` is secretly just a 1-byte integer.
3. Uninitialized variables hold garbage, not zero - always give a starting value.
4. `printf`/`scanf` need a format specifier (`%d`, `%c`, `%f`, `%s`) that matches the variable's type, because the function itself has no idea what type you passed it.
5. `scanf` needs `&variable` (an address) so it knows where to write - your first hint of pointers, coming properly in phase 5.
6. `const` locks a value at compile time, turning accidental reassignment into an error instead of a bug.

### Check yourself

```quiz
[
  {
    "q": "You write `int age;` with no value. What does `age` actually contain until you assign it?",
    "choices": [
      "0, C always zero-initializes local variables",
      "Whatever leftover bits were already sitting in that memory - unpredictable garbage",
      "A compile error - C refuses to declare a variable without a value",
      "The same value every time you run the program, guaranteed by the compiler"
    ],
    "answer": 1,
    "explain": "C never clears memory for you. An uninitialized local variable holds whatever bits were already there, which can differ from run to run."
  },
  {
    "q": "`char grade = 'A';` prints as `A` with `%c` and as `65` with `%d`. What's really going on?",
    "choices": [
      "char secretly stores two values, one for each format specifier",
      "printf converts the character to a number behind the scenes when it sees %d",
      "The byte in memory never changes - char is just a 1-byte integer, and the format specifier only changes how that same byte is displayed",
      "This only works because 'A' is a special case in ASCII"
    ],
    "answer": 2,
    "explain": "A char is a 1-byte integer holding 65. Nothing about the stored bits changes between the two printf calls - only the specifier tells printf how to read and display them."
  },
  {
    "q": "In C, once you declare `int age = 30;`, what does the type `int` actually fix?",
    "choices": [
      "Nothing permanent - like Python, C can let age hold a float or string later if you reassign it",
      "Only how printf formats the value when you print it",
      "A compile-time promise about the exact size and byte-interpretation of that memory, which never changes for age's lifetime",
      "The maximum number of times age can be reassigned"
    ],
    "answer": 2,
    "explain": "C decides a variable's size and interpretation once, at compile time, and bakes that into the generated machine code - that's what 'statically typed' means here."
  }
]
```

---

[← Phase 1: Install, Compiling & Your First Program](01-install-compiling-and-your-first-program.md) · [Guide overview](_guide.md) · [Phase 3: Control Flow →](03-control-flow.md)
