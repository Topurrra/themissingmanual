---
title: "Pointers I: The Mental Model"
guide: "c-from-zero"
phase: 5
summary: "What is a pointer, actually, and why does C hand you one instead of hiding it like other languages do?"
tags: [c, pointers, memory, addresses, dereference, stack]
difficulty: intermediate
synonyms: ["what is a pointer in c", "pointer mental model", "how do pointers work", "dereference pointer c", "address of operator c", "pointer vs value c", "why does c have pointers", "null pointer c", "pointer to pointer c"]
updated: 2026-07-14
---
# Pointers I: The Mental Model

This is the phase people warn you about. Maybe someone already told you pointers are where C gets hard, and you're bracing for a fight. Here's the reframe that changes everything: **a pointer is not a strange new kind of thing. It's just a number - the address of a byte in memory - with a type attached so C knows how to read what's there.** That's the whole idea. Everything else in this phase is you getting comfortable with the syntax for saying "give me that address" and "go look at what's at that address."

Every variable you've written since Phase 2 already lives at an address. You've just never asked for it. Pointers are what happen when you do.

## Memory is one long street of numbered boxes

Picture your computer's memory as a very long street of mailboxes, each one holding one byte, each one with a number painted on it - its **address**. When you write:

```c
int age = 30;
```

C finds an empty box (or four consecutive boxes, since an `int` is usually 4 bytes), writes `30` into it, and privately remembers which address that was so that whenever you write `age` in your code, it goes and reads from that spot. You never see the address. `age` is a friendly nickname for "whatever is at address 0x7ffee2a1c."

A pointer is what you get when you stop letting C hide that address from you and ask for it directly.

## The address-of operator: `&`

`&variable` means "give me the address where this variable lives," not its value.

```c
#include <stdio.h>

int main(void) {
    int age = 30;
    printf("value of age:   %d\n", age);
    printf("address of age: %p\n", (void *)&age);
    return 0;
}
```
```console
$ gcc main.c -o main && ./main
value of age:   30
address of age: 0x7ffee2a1c9dc
```

That address will look different every time you run it (the OS places your program's memory in a slightly different spot each run, on purpose, for security). That's fine. The point isn't the specific number - it's that `age` genuinely lives *somewhere*, and `&age` is how you find out where.

## Declaring a pointer and storing an address

A pointer is a variable whose job is to hold an address instead of holding an `int` or a `char` directly. You declare one with a `*` in the type:

```c
int age = 30;
int *p = &age;   // p holds the address of age
```

Read `int *p` as "`p` is a pointer to an `int`." The type matters: it tells C how many bytes live at that address and how to interpret them, the same way `int` vs `char` tells C how to interpret a plain variable. A pointer without a type is just a bare number with no idea what's stored there.

## The dereference operator: `*`

`&` gets you an address from a variable. `*` does the opposite: given a pointer, it gets you the value sitting at the address it holds. This is called **dereferencing**.

```c
#include <stdio.h>

int main(void) {
    int age = 30;
    int *p = &age;

    printf("p holds address:      %p\n", (void *)p);
    printf("*p reads what's there: %d\n", *p);

    *p = 31;   // follow the pointer, change the value there
    printf("age is now:            %d\n", age);
    return 0;
}
```
```console
$ gcc main.c -o main && ./main
p holds address:      0x7ffee2a1c9dc
*p reads what's there: 30
age is now:             31
```

*What just happened:* `*p = 31` didn't touch `p` itself - `p` still holds the same address. It walked to that address and overwrote what was there. Since `p` points at `age`, changing `*p` changes `age`. This is the entire reason pointers exist: they let you reach out and touch a specific piece of memory from somewhere else in your program, instead of only being able to touch a value through its one original name.

Notice the same symbol, `*`, means two different things depending on where it appears, and this trips up everyone at first:

| Where you see `*` | What it means |
|---|---|
| `int *p` (in a declaration) | "`p` is a pointer to an `int`" - this is a type |
| `*p` (in an expression) | "the value at the address `p` holds" - this is dereferencing |

The rule of thumb: if `*` shows up right after a type name while you're declaring something, it's part of the type. Anywhere else, it means "go to that address."

## Why pointers exist at all

You might reasonably ask: why not just use the variable directly? Two reasons come up constantly once you start writing real programs, and both will get their own phase later - this is the preview so the *shape* of the idea is already in your head.

**Reason one: functions copy their arguments.** In C, when you call a function, every argument is copied in. If you pass `age` to a function and that function changes its local copy, `age` back in `main` never moves. If you want a function to actually modify a variable that lives in the caller, you pass a pointer to it instead - you hand the function the *address*, and it dereferences that address to make the change stick.

```c
void birthday(int *age_ptr) {
    *age_ptr = *age_ptr + 1;   // change the caller's variable, not a copy
}

int main(void) {
    int age = 30;
    birthday(&age);
    printf("%d\n", age);   // 31 - the real variable changed
    return 0;
}
```

**Reason two: some things are too big to copy everywhere, or need to be shared.** Passing a pointer means passing one small address instead of duplicating a large chunk of data every time you hand it to a function. You'll see this constantly once arrays and structs show up in the next two phases - both are usually passed around by pointer for exactly this reason.

## `NULL`: a pointer that points at nothing

A pointer is just an address, and sometimes you need to say "this pointer isn't pointing at anything valid right now." C's convention for that is `NULL`, defined in `<stddef.h>` (and pulled in by most standard headers) as address zero:

```c
#include <stddef.h>

int *p = NULL;   // p deliberately points at nothing
```

Dereferencing a `NULL` pointer - writing `*p` when `p` is `NULL` - is undefined behavior and almost always crashes your program (a "segmentation fault"). That's not a bug in C; it's the operating system protecting you: address zero is deliberately left unmapped so this mistake fails loudly instead of quietly corrupting something. You'll meet this crash for real the first time you forget to check a pointer before using it, and now you'll know exactly what it means: *something handed you a pointer that isn't pointing anywhere, and you dereferenced it anyway.*

A pointer that's declared but never given a value isn't automatically `NULL` - it holds garbage, a leftover address from whatever used that memory before. Always initialize a pointer, either to a real address or explicitly to `NULL`, before you use it.

## Picture it, one more time

```
Memory (a long street of addressed boxes):

  address:  0x1000   0x1004   0x1008   0x100c
            +------+ +------+ +------+ +------+
  contents: |  30  | | ???  | | ???  | |0x1000| <- p lives here
            +------+ +------+ +------+ +------+
              age                        p

  &age  ==  0x1000              (the address of age)
   p    ==  0x1000              (what p holds: age's address)
  *p    ==  30                  (what's stored at that address)
```

`age` and `p` are both variables with their own boxes. `age`'s box holds a number you care about. `p`'s box also holds a number - but that number is itself an address, pointing back at `age`'s box. `*p` means "don't stop at `p`'s box, follow the address inside it, and read that box instead."

## Recap

1. Every variable lives at an **address** in memory; `&variable` gets you that address.
2. A **pointer** is a variable that stores an address, declared with `type *name`.
3. `*pointer` **dereferences** it - follows the address to read or write the value there.
4. `*` means two different things depending on context: part of a type in a declaration, "follow this address" in an expression.
5. Pointers exist so functions can modify a caller's variable (pass `&x`, not `x`) and so large data can be shared without copying.
6. `NULL` is the address that means "points at nothing." Dereferencing it is undefined behavior - almost always an instant crash.

This is the model everything else in C builds on. Arrays, strings, structs, dynamic memory - all of it is pointers doing more elaborate versions of exactly what you just did with `age` and `p`.

### Check yourself

```quiz
[
  {
    "q": "What does the `*` mean in `*p = 31;` versus in `int *p;`?",
    "choices": [
      "In both cases it declares p as a pointer type",
      "In `int *p` it's part of the type (pointer to int); in `*p = 31` it dereferences - follows the address to write there",
      "In both cases it dereferences p and writes 31",
      "It doesn't matter, both are the same operation"
    ],
    "answer": 1,
    "explain": "The same symbol means two different things depending on context: part of a type in a declaration, or 'follow this address' in an expression."
  },
  {
    "q": "Why does `void birthday(int *age_ptr)` change the caller's `age`, while a plain `void birthday(int age)` wouldn't?",
    "choices": [
      "C copies arguments by default; passing the address lets the function dereference it and modify the original variable's memory directly",
      "Pointers are passed by reference automatically, unlike normal variables",
      "int *age_ptr somehow shares the same variable name as age",
      "It only works because age_ptr is declared inside main"
    ],
    "answer": 0,
    "explain": "Arguments are always copied in C; passing &age hands over the address so *age_ptr dereferences to the same memory as age, instead of a disposable local copy."
  },
  {
    "q": "A pointer is declared but never assigned a value, like `int *p;` with no initializer. What does p hold?",
    "choices": [
      "NULL, automatically, like most other languages",
      "Garbage - whatever leftover address happens to be in that memory, which is why you should always initialize it",
      "The address of the nearest existing variable",
      "0, the same as an uninitialized int"
    ],
    "answer": 1,
    "explain": "C doesn't zero-initialize pointers for you; an uninitialized pointer holds whatever leftover bits were already there, so dereferencing it before you set it to a real address or NULL is dangerous."
  }
]
```

---

[← Phase 4: Functions & Program Structure](04-functions-and-program-structure.md) · [Phase 6: Arrays & Strings →](06-arrays-and-strings.md)
