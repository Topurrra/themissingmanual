---
title: "Pointers II: Arithmetic, Double & Function Pointers"
guide: "c-from-zero"
phase: 12
summary: "How does `ptr + 1` know to skip 4 bytes for an int but 8 for a double, what is a pointer to a pointer actually for, and how do you store a function in a variable and call it later?"
tags: [c, pointers, pointer-arithmetic, double-pointers, function-pointers, callbacks]
difficulty: advanced
synonyms: ["c pointer arithmetic explained", "pointer to pointer c", "double pointer c meaning", "what is a function pointer", "c function pointer syntax", "callback function c", "ptr plus plus c", "array decay pointer arithmetic", "void pointer to function pointer", "c dispatch table"]
updated: 2026-07-14
---
# Pointers II: Arithmetic, Double & Function Pointers

Back in Phase 5 you built the mental model for a pointer: a variable that holds an address. That model gets you through most C code. But three things still look like magic once you start reading real C: `ptr + 1` somehow "just works" no matter the type, `char **argv` shows up in every `main` signature you've ever seen, and libraries like `qsort` want you to hand them a *function* as an argument. This phase clears up all three, because they are really one idea applied three ways: **a pointer's type tells the compiler how to interpret what's at the address it holds** - whether that's "how many bytes to skip," "what kind of address is stored here," or "what kind of code lives here."

## Pointer arithmetic: the type does the math for you

**What it actually is.** When you add an integer to a pointer, C does not add that number of *bytes*. It adds that number of *elements*, where "element" means "however many bytes `sizeof` says this pointer's type takes up." `ptr + 1` means "the address of the next `T`," not "the next byte."

```c
#include <stdio.h>

int main(void) {
    int nums[4] = {10, 20, 30, 40};
    int *p = nums;              // decays to &nums[0]

    printf("%p -> %d\n", (void *)p, *p);
    printf("%p -> %d\n", (void *)(p + 1), *(p + 1));
    printf("%p -> %d\n", (void *)(p + 2), *(p + 2));

    return 0;
}
```
```console
$ gcc arith.c -o arith && ./arith
0x7ffee2a1c9a0 -> 10
0x7ffee2a1c9a4 -> 20
0x7ffee2a1c9a8 -> 30
```
Look at the addresses: they jump by 4, because `sizeof(int)` is 4 on this machine. If `p` were a `double *`, the same `p + 1` would jump by 8. The compiler already knows the type `p` points to, so it silently multiplies your `+ 1` by `sizeof(*p)`. You never write that multiplication yourself - that is the entire point of pointer arithmetic being type-aware instead of raw byte-counting.

**Why this exists.** It is what makes `nums[i]` and `*(nums + i)` the exact same operation. Array indexing in C is not a special feature - `nums[i]` is *defined* as `*(nums + i)`. When you write `nums[2]`, the compiler computes "start address, plus 2 elements' worth of bytes, then dereference." Understanding that array indexing is just pointer arithmetic in a nicer costume is the payoff of this whole section: once you see it, arrays and pointers stop being two topics and become one.

⚠️ **The trap: walking off the end.** Pointer arithmetic has no bounds checking. `p + 100` on a 4-element array computes a real address - some byte in memory you don't own - and the compiler will not stop you. Reading or writing through it is undefined behavior (more on exactly what that means in Phase 14). The array itself does not know its own length; *you* have to track it, usually by also carrying a count or a sentinel value like the `'\0'` that terminates a string.

You can also walk pointers with `++` and `--`, which is how idiomatic C often loops over an array without ever writing an index variable:

```c
void print_all(int *p, int count) {
    int *end = p + count;       // one-past-the-end pointer, valid to compute (not to deref)
    while (p != end) {
        printf("%d ", *p);
        p++;
    }
    printf("\n");
}
```

That `end` pointer is a deliberate C idiom: "one past the last valid element" is a legal address to *compute and compare against*, you just may never dereference it. It marks the stopping line without needing a separate index variable.

## Double pointers: a pointer to a pointer

**What it actually is.** A pointer holds the address of *something*. That something can itself be a pointer. `int **pp` is "the address of an `int *`." Nothing new is happening here beyond what you already know - it is the same "address of a box" idea, just with the box holding another box instead of an `int`.

The question that actually matters is: **why would you ever want that?** Two real answers.

**Reason 1: letting a function change a caller's pointer.** You already know that to let a function modify a caller's `int`, you pass `int *`. The same rule applies one level up: to let a function modify a caller's *pointer* (make it point somewhere new), you pass a pointer to that pointer.

```c
#include <stdlib.h>

void allocate(int **out, int value) {
    *out = malloc(sizeof(int));   // change what the CALLER's pointer points to
    **out = value;                // then set the value through it
}

int main(void) {
    int *p = NULL;
    allocate(&p, 42);             // pass the address of p itself
    printf("%d\n", *p);           // 42
    free(p);
    return 0;
}
```
```console
$ gcc dptr.c -o dptr && ./dptr
42
```
*What just happened:* if `allocate` took a plain `int *out`, it would only ever change its own local copy of the pointer - the caller's `p` would still be `NULL` when the function returned, same as the pass-by-value problem from Phase 4. Passing `&p` (an `int **`) gives `allocate` the address of the pointer variable itself, so `*out = ...` reaches back into `main` and rewrites `p`. This exact pattern is why functions that hand you back a freshly allocated pointer, like some parsing or "create" functions in real libraries, take a `T **` parameter.

**Reason 2: arrays of strings.** A `char *` is a string. An array of strings is naturally an array of `char *` - and an array, in a function signature, decays to a pointer to its first element. So "an array of strings" becomes `char **`. This is exactly `argv` in `int main(int argc, char **argv)`: `argv` points at the first element of an array of `char *`, and `argv[i]` is the i-th string.

```c
void print_args(int argc, char **argv) {
    for (int i = 0; i < argc; i++) {
        printf("arg %d: %s\n", i, argv[i]);   // argv[i] is a char*, %s prints the string it points to
    }
}
```

The layering is worth saying out loud once: `argv` is a pointer to a `char *`. `argv[i]` dereferences one level to get a `char *` (one string's address). `argv[i][j]` dereferences again to get a single `char`. Each `[ ]` peels off one layer of pointer.

## Function pointers: storing "code" in a variable

**What it actually is.** Everything in a running program lives at an address, including compiled functions. A function pointer is a variable that holds the address of a function, so you can pass a function around like any other value - store it in a variable, put it in a struct, hand it to another function to call later.

The syntax is the ugliest part of C, so read it slowly once and it stops being scary:

```c
int add(int a, int b) { return a + b; }
int sub(int a, int b) { return a - b; }

int main(void) {
    int (*op)(int, int);   // op: pointer to a function taking (int, int), returning int

    op = add;
    printf("%d\n", op(3, 4));   // 7

    op = sub;
    printf("%d\n", op(3, 4));   // -1

    return 0;
}
```
```console
$ gcc fptr.c -o fptr && ./fptr
7
-1
```
*Reading the declaration:* `int (*op)(int, int)` - the parentheses around `*op` are load-bearing. Without them, `int *op(int, int)` would mean "a function named `op` that returns `int *`," a completely different thing. With them, it means "`op` is a pointer, and what it points to is a function of type `(int, int) -> int`." Assigning `op = add` does not call `add` - a bare function name decays to its address, the same way an array name decays to a pointer to its first element.

**Why this matters: callbacks.** The standard library's sort function, `qsort`, has no idea how *your* data should be ordered - so it takes a function pointer and calls it whenever it needs to compare two elements:

```c
#include <stdlib.h>

int compare_ints(const void *a, const void *b) {
    int x = *(const int *)a;
    int y = *(const int *)b;
    return (x > y) - (x < y);  // negative, zero, positive - qsort's contract
}

int main(void) {
    int nums[] = {5, 3, 8, 1};
    qsort(nums, 4, sizeof(int), compare_ints);   // pass the function itself
    for (int i = 0; i < 4; i++) printf("%d ", nums[i]);
    printf("\n");
    return 0;
}
```
```console
$ gcc sort.c -o sort && ./sort
1 3 5 8
```
`qsort` is generic over any data because it never looks inside your elements itself - it just calls whatever comparison function you handed it, over and over, and trusts the return value. This is the same idea behind every callback API you'll meet later: signal handlers, GUI event handlers, thread start routines. They all boil down to "here is an address of code, call it when X happens."

A table of function pointers (a "dispatch table") is the C way of doing what other languages call polymorphism - an array where `table[opcode]` picks which function runs, instead of a chain of `if`/`else if`:

```c
int (*ops[])(int, int) = {add, sub};   // ops[0] == add, ops[1] == sub
printf("%d\n", ops[1](10, 4));         // calls sub(10, 4) -> 6
```

## Recap

- Pointer arithmetic is scaled by the pointee's `sizeof` automatically - `p + 1` means "next element," not "next byte." This is *why* `arr[i]` and `*(arr + i)` are the same expression.
- Pointer arithmetic has no bounds checking; tracking valid range is your job, not the compiler's.
- A double pointer (`T **`) is a pointer to a pointer. Use one when a function needs to modify the caller's *pointer variable*, or when representing an array of pointers (like `char **argv`, an array of strings).
- A function pointer stores a function's address so it can be assigned, stored, and called through a variable. The declaration syntax `T (*name)(args)` needs those parentheses to mean "pointer to function" rather than "function returning pointer."
- Callbacks (`qsort`) and dispatch tables are the two big real-world uses: let a generic function call code it doesn't know about yet.

### Check yourself

```quiz
[
  {
    "q": "Given `double *p`, what does `p + 1` compute?",
    "choices": [
      "The address one byte after `p`",
      "The address `sizeof(double)` (8, typically) bytes after `p`",
      "The value at `p`, incremented by 1",
      "A compile error, since only `int *` supports arithmetic"
    ],
    "answer": 1,
    "explain": "Pointer arithmetic is scaled by the pointee's sizeof, so `p + 1` always means 'the next element,' not 'the next byte' - that's true for any pointer type, not just int."
  },
  {
    "q": "Why does `allocate(int **out, int value)` take an `int **` instead of an `int *`?",
    "choices": [
      "`int **` is required whenever a function allocates memory",
      "So the function can reach back into the caller and change what the caller's own pointer variable points to",
      "It lets the function store two separate integers instead of one",
      "It makes the pointer arithmetic inside the function scale by 8 instead of 4"
    ],
    "answer": 1,
    "explain": "An `int *` argument only lets a function change its own local copy of the pointer; to change which address the caller's pointer variable holds, the function needs the address of that variable itself, which is an `int **`."
  },
  {
    "q": "Why do the parentheses matter in `int (*op)(int, int)`?",
    "choices": [
      "They are just a style convention and can be dropped safely",
      "Without them, `int *op(int, int)` declares a function named `op` returning `int *`, a completely different type",
      "They tell the compiler to allocate `op` on the heap instead of the stack",
      "They mark `op` as a pointer to an array of two ints"
    ],
    "answer": 1,
    "explain": "`*` binds to `op` first only because of the parentheses, making `op` a pointer to a function; drop them and `*` binds to `int` instead, declaring a function that returns a pointer."
  }
]
```

---

[← Phase 11: The Stack vs the Heap](11-the-stack-vs-the-heap.md) · [Phase 13: The Standard Library Essentials →](13-the-standard-library-essentials.md)
