---
title: "The Stack vs the Heap"
guide: "c-from-zero"
phase: 11
summary: "Why does a local array vanish the moment a function returns while a malloc'd one survives, and why does deep recursion crash with 'stack overflow' but a huge malloc just fails cleanly?"
tags: [c, stack, heap, memory, malloc, memory-management, undefined-behavior]
difficulty: advanced
synonyms: ["stack vs heap c", "c stack overflow explained", "why use malloc instead of local array", "dangling pointer return local variable c", "c memory layout stack heap", "automatic vs dynamic memory c", "stack frame explained", "heap fragmentation c"]
updated: 2026-07-14
---
# The Stack vs the Heap

You already know two ways to get memory in C. `int x = 5;` gets you a variable that just appears, and disappears when its block ends. `malloc(sizeof(int))` from [Phase 10: Dynamic Memory](10-dynamic-memory-malloc-and-free.md) gets you memory that sticks around until you `free` it. Those aren't two flavors of the same thing - they're memory coming from two entirely different regions of your program, managed by entirely different rules. Understanding *why* those regions exist, and what each one is actually good for, is what turns "my program crashed with a segfault" from a mystery into something you can predict before you even run the code.

## Two places a value can live

**What it actually is.** When your program runs, the memory it can use is split into regions. The two you'll touch constantly are the **stack** and the **heap**:

- The **stack** is where local variables and function-call bookkeeping live. It's a simple, fast, self-managing structure.
- The **heap** is a large, shared pool of memory that you request from and return to explicitly, using `malloc` and `free`.

**Why this exists.** These aren't arbitrary names - they describe *how* the memory is managed, and each name is literally the data structure it behaves like.

The stack behaves like a stack of plates: you can only add or remove from the top. Every time a function is called, a chunk of memory - a **stack frame** - is pushed on top, holding that function's local variables and its return address. When the function returns, its frame is popped off and that memory is instantly reclaimed. No bookkeeping, no searching for space - just move a pointer up or down. That's why stack memory is called **automatic**: the compiler manages its lifetime for you, tied exactly to scope.

The heap behaves like an open pool: you can ask for a chunk of any size, from anywhere, and give it back in any order. The allocator has to search for a free block, hand you its address, and remember it's yours until you say otherwise. That's why heap memory is called **dynamic** (or manual) - nothing frees it for you; *you* decide when its life ends.

## The stack: fast, automatic, and temporary

Every function call gets its own frame. Watch what that looks like:

```c
#include <stdio.h>

void third(void) {
    int c = 3;
    printf("third: c is at %p\n", (void *)&c);
}

void second(void) {
    int b = 2;
    printf("second: b is at %p\n", (void *)&b);
    third();
}

void first(void) {
    int a = 1;
    printf("first: a is at %p\n", (void *)&a);
    second();
}

int main(void) {
    first();
    return 0;
}
```
```console
$ ./frames
first: a is at 0x7ffd3a2c1b4c
second: b is at 0x7ffd3a2c1b2c
third: c is at 0x7ffd3a2c1b0c
```
*What just happened:* each address is a little *lower* than the last (on most systems the stack grows downward). Each function call pushed a new frame below the previous one, holding that function's own `a`, `b`, or `c`. When `third` returns, its frame is gone - `c`'s memory is immediately up for grabs again. You never called `free`; scope did the work.

💡 **Key point.** This is why a local variable's address is only meaningful while its function is still running. The moment the function returns, that stack space belongs to whatever gets called next, and the old value can be silently overwritten.

## Watching the stack overflow

The stack isn't infinite - a typical default is around 1-8 MB depending on your OS. Every frame eats into it, and if you push frames without ever popping any, you run out:

```c
#include <stdio.h>

void recurse(int depth) {
    char big[100000];      // eats ~100 KB of stack per call
    big[0] = depth;        // touch it so the compiler can't optimize it away
    printf("depth %d\n", depth);
    recurse(depth + 1);    // never returns, so frames never pop
}

int main(void) {
    recurse(0);
    return 0;
}
```
```console
$ ./blowup
depth 0
depth 1
...
depth 80
Segmentation fault (core dumped)
```
*What just happened:* `recurse` calls itself before it ever returns, so its frames pile up - each one 100 KB - until the stack region runs out of address space and the program crashes into memory it doesn't own. This is a **stack overflow**, and it's the direct, physical consequence of the stack's design: fast because it's a fixed region with no searching, but finite because that region has a hard edge.

⚠️ **Common footgun.** Deep or unbounded recursion, or a huge local array (`int buffer[10000000];`), are the two classic ways to blow the stack. If a value might be large or its size isn't known until runtime, that's a signal it belongs on the heap, not the stack.

## The classic bug: returning a pointer to a dead frame

This is the single most common pointer bug beginners write, and now you have the mental model to see exactly why it's wrong:

```c
#include <stdio.h>

int *make_number(void) {
    int n = 42;
    return &n;          // returning the address of a local variable
}

int main(void) {
    int *p = make_number();
    printf("%d\n", *p);  // undefined behavior
    return 0;
}
```
```console
$ gcc -Wall -o dangling dangling.c
dangling.c:5:12: warning: function returns address of local variable [-Wreturn-local-addr]
    5 |     return &n;
      |            ^
$ ./dangling
42          # ...or garbage, or a crash. It's undefined behavior.
```
*What just happened:* `n` lives in `make_number`'s stack frame. The function returns, its frame is popped, and `p` in `main` now holds the address of memory that no longer belongs to `n` - it's just an empty region waiting to be reused by the next function call. Reading through `p` is **undefined behavior** (more on this family of bugs in [Phase 14](14-undefined-behavior-and-common-footguns.md)): it might print `42` because nothing overwrote that spot yet, or it might print garbage, or crash. The compiler even warned you, in this case - always build with `-Wall`.

The fix is exactly the lesson of Phase 10: if a value needs to outlive the function that creates it, put it on the heap.

```c
int *make_number(void) {
    int *n = malloc(sizeof(int));
    *n = 42;
    return n;            // the heap block outlives this function - totally fine
}
```

## The heap: flexible, but you own the whole lifetime

The heap has no automatic scope. A `malloc`'d block lives exactly as long as you want it to - which is powerful, and also the entire source of the bugs from Phase 10 (leaks, double-frees, use-after-free). There's no free cleanup at the end of a block; *you* are the cleanup.

That flexibility buys you two things the stack structurally can't offer:

- **Size decided at runtime.** `malloc(n * sizeof(int))` works whether `n` is 10 or 10 million (well within available RAM); a stack array's size has to be known small and fixed, or the compiler-supported variable-length array trick, which still shares the stack's size limits.
- **Lifetime independent of any function.** A heap block can be created in one function, handed to another, stored in a data structure, and freed somewhere else entirely - useful for anything that needs to outlive the call that created it, like a linked list node or a buffer returned from a parser.

## Side by side

The same data, both ways, makes the tradeoff concrete:

```c
void stack_version(void) {
    int nums[100];              // allocated instantly, freed instantly
    // ... use nums ...
}                                // gone here, no code needed

void heap_version(void) {
    int *nums = malloc(100 * sizeof(int));   // one allocator call, can fail
    if (nums == NULL) return;                // must check
    // ... use nums ...
    free(nums);                              // must remember, or it leaks
}
```

`stack_version` is faster (allocation is a single instruction moving the stack pointer) and can never leak (the compiler guarantees the cleanup). `heap_version` costs more per call (the allocator does real bookkeeping) and puts the leak/double-free risk on you - but it's the only option once the size isn't known at compile time, the data needs to be huge, or the data needs to outlive the function.

## A mental map

| | Stack | Heap |
|---|---|---|
| Managed by | Compiler, automatically | You, manually (`malloc`/`free`) |
| Lifetime | Tied to scope (block/function) | Until you call `free` |
| Speed | Extremely fast (pointer move) | Slower (allocator does work) |
| Size | Small, fixed limit (MBs) | Large, limited by RAM |
| Size known at | Compile time | Can be decided at runtime |
| Failure mode | Stack overflow (crash) | `malloc` returns `NULL` (recoverable) |
| Common bug | Dangling pointer to a dead frame | Leak, double-free, use-after-free |

The rule of thumb that falls out of all this: **default to the stack** - it's free, fast, and impossible to leak. Reach for the heap only when you have a real reason: the data is large, its size isn't known until runtime, or it genuinely needs to outlive the function that creates it.

## Recap

1. The **stack** holds local variables and call bookkeeping, in **stack frames** pushed and popped automatically with every function call - fast, but finite, and its contents die the instant the function returns.
2. The **heap** is a pool you request from and return to explicitly with `malloc`/`free` - flexible size and lifetime, but you own the bookkeeping, and every bug from Phase 10 lives here.
3. Returning a pointer to a local (stack) variable is undefined behavior - the frame is gone before the caller ever reads it. If a value needs to outlive its function, allocate it on the heap instead.
4. Unbounded recursion or oversized local arrays blow the stack; oversized or dynamically-sized data belongs on the heap.
5. Default to the stack. Reach for the heap only when size, lifetime, or scale genuinely require it.

## Quick check

Test yourself on the idea that separates the two regions - who manages the lifetime, and what happens when each one runs out:

```quiz
[
  {
    "q": "You return `&n` from a function where `n` is a local `int`, and the caller prints `42` correctly anyway. What does that tell you?",
    "choices": [
      "The code is correct, since n clearly wasn't destroyed",
      "It's undefined behavior - the frame's memory just hasn't been overwritten yet, but nothing guarantees that",
      "The compiler silently moved n onto the heap because it was returned",
      "It only works because int is a small type"
    ],
    "answer": 1,
    "explain": "The frame is popped the moment the function returns, so that memory is free for reuse; reading through the dangling pointer is undefined behavior whether or not the old value happens to still be sitting there."
  },
  {
    "q": "Deep recursion crashes with a segfault, while a huge `malloc` request just returns `NULL`. Why the different failure modes?",
    "choices": [
      "The stack is a fixed-size region with no bounds check, so it runs straight into memory it doesn't own and crashes; the allocator can check the request against available memory first and fail gracefully",
      "malloc never fails, so this comparison doesn't apply",
      "Recursion is always a bug, so its failure mode doesn't matter",
      "Both are actually the same failure, just reported with different messages"
    ],
    "answer": 0,
    "explain": "The stack has no built-in size check - it just keeps pushing frames until it overruns its region. malloc, by contrast, can look at what's available and hand back NULL instead of crashing. (One wrinkle: Linux by default overcommits memory, so malloc may hand back a non-NULL pointer for more than really exists and let the OOM killer step in when you first touch it - but the return-NULL contract is still what you code against.)"
  },
  {
    "q": "You need an array sized by a number the user types in at runtime. What's the right call, and why?",
    "choices": [
      "Always use the stack - it's faster no matter what",
      "Use the heap - its size can be decided at runtime, while a stack array needs a size fixed (small) enough to stay well within the stack's limited space",
      "It doesn't matter, the two regions behave identically",
      "Use a global variable instead of either"
    ],
    "answer": 1,
    "explain": "A stack array's size has to be known and kept small at compile time (or risk a stack overflow), while the heap can be asked for exactly the size you need once you know it, up to available RAM."
  }
]
```

---

[← Phase 10: Dynamic Memory](10-dynamic-memory-malloc-and-free.md) · [Phase 12: Pointers II - Arithmetic, Double & Function Pointers →](12-pointers-ii-arithmetic-double-and-function-pointers.md)
