---
title: "Dynamic Memory: malloc & free"
guide: "c-from-zero"
phase: 10
summary: "How do you get memory in C when you don't know the size until the program is running? malloc, free, calloc and realloc - and the one rule that keeps them safe: every malloc needs exactly one free."
tags: [c, malloc, free, calloc, realloc, dynamic-memory, heap]
difficulty: advanced
synonyms: ["malloc in c explained", "how does malloc work", "when to use malloc vs array", "c free function", "malloc calloc realloc difference", "dynamic array in c", "c memory leak malloc", "why does malloc return void pointer", "c allocate memory at runtime"]
updated: 2026-07-14
---

# Dynamic Memory: malloc & free

Every array you've written so far has a size baked in at compile time: `int scores[10];` means "ten ints, forever, decided the moment this line was written." That's fine when you know the size up front. But most real programs don't. You don't know how many lines are in the file the user picked. You don't know how many results a search will return. You don't know how big the user's input is until they type it.

C's answer is **dynamic memory**: you ask for a block of memory *while the program is running*, sized exactly to what you need right now, and you get a pointer to it. This phase is about the four functions that make that possible - `malloc`, `calloc`, `realloc`, and `free` - and the single discipline that keeps them from turning into bugs.

## The mental model: asking a stranger for space

Picture your program's memory as two very different neighborhoods, which we'll properly tour in Phase 11 (The Stack vs the Heap). For now, you only need one idea: there's a region called the **heap**, and it's not managed by the compiler the way local variables are. Nothing about the heap knows your function names or your scopes. It's just a big pool of free bytes, and there's a librarian in front of it - the memory allocator - whose whole job is to hand out chunks of that pool on request and take them back when you're done.

`malloc` is you walking up to that librarian and saying "I need 40 bytes." The librarian finds 40 free bytes somewhere in the pool, marks them as yours, and hands you a pointer to the start. `free` is you walking back and saying "I'm done with those 40 bytes" - the librarian marks them free again so someone else can use them.

Nobody does this automatically for you. If you forget to give the memory back, the librarian has no way to know you're done - that block is gone for the rest of the program's life. That's a **memory leak**, and it's the first of several footguns we'll name properly in Phase 14. For now, just hold onto the shape of the deal: **every successful `malloc` (or `calloc`/`realloc`) owes exactly one `free`.**

## malloc: asking for raw bytes

`malloc` (memory allocate) takes a number of bytes and returns a pointer to that many free bytes, or `NULL` if it couldn't find that much memory.

```c
#include <stdio.h>
#include <stdlib.h>

int main(void) {
    int *scores = malloc(5 * sizeof(int));   // room for 5 ints
    if (scores == NULL) {
        fprintf(stderr, "out of memory\n");
        return 1;
    }

    for (int i = 0; i < 5; i++) {
        scores[i] = i * 10;
    }

    for (int i = 0; i < 5; i++) {
        printf("%d\n", scores[i]);
    }

    free(scores);
    return 0;
}
```

A few things to notice, because each one is a real habit, not decoration:

**`sizeof(int)`, not the number 4.** `malloc` only knows bytes, it has no idea what you're storing. `sizeof(int)` asks the compiler for the true size of an `int` on *this* platform (usually 4, but not guaranteed), so `5 * sizeof(int)` is "enough bytes for 5 ints" on any machine your code runs on. Hardcoding `20` works today and breaks the day someone builds your code somewhere `int` is a different size.

**No cast on the return value.** `malloc` returns `void *` - a pointer with no type, meaning "a pointer to *some* bytes, you decide what." In C, `void *` converts to any other pointer type automatically, so `int *scores = malloc(...)` just works. You'll see older code write `(int *) malloc(...)`. That cast isn't wrong, but it's not needed in C, and historically it could hide a real bug: forget to `#include <stdlib.h>`, and older compilers assumed `malloc` returned an `int` - the cast silenced the warning you'd otherwise get from stuffing that `int` into a pointer. Modern C compilers flag the missing header on their own, so the trap is smaller today, but leaving the cast off is still the tidier habit.

**Always check for `NULL`.** `malloc` fails when the system is out of memory, and it signals that failure by returning `NULL` instead of a real pointer. If you skip the check and use the pointer anyway, you dereference `NULL` and crash - or worse, on some systems, corrupt something before you crash. Checking costs three lines. Skipping it costs a debugging session six months from now when the program finally runs on a machine tight on memory.

## free: giving it back

```c
free(scores);
```

That's the whole call - just the pointer, no size. The allocator already remembers how big your block was, because it tracked that bookkeeping when you called `malloc`. Your job is only to say *which* block you're done with.

Two rules that matter more than they look:

- **Free exactly once.** Calling `free` twice on the same pointer (a "double free") corrupts the allocator's own bookkeeping - undefined behavior, and a nasty one, covered in depth in Phase 14.
- **Don't use the pointer after freeing it.** Once you call `free(scores)`, `scores` still holds the old address, but that memory no longer belongs to you. Reading or writing through it is a **use-after-free** - the allocator may have already handed that same address to someone else. A cheap habit that catches a lot of bugs: set the pointer to `NULL` right after freeing it. Using a `NULL` pointer crashes immediately and loudly; using a dangling pointer corrupts something quietly, maybe far from where the real mistake was.

```c
free(scores);
scores = NULL;   // now any accidental reuse crashes fast, instead of corrupting quietly
```

## calloc: malloc, but zeroed

`malloc` hands you memory as-is - whatever bytes happened to be sitting there, which is often garbage left over from something else. `calloc` (a handy way to remember it: "clear allocate") gives you the same kind of block, but guarantees every byte starts at zero, and it takes the count and the element size as two separate arguments instead of one:

```c
int *scores = calloc(5, sizeof(int));   // 5 ints, all zero-initialized
```

Use `calloc` whenever "starts at zero" matters - a counter array, a buffer you'll read from before fully writing to. Use `malloc` when you're about to overwrite every byte anyway; skipping the zeroing is marginally faster, though it rarely matters in practice.

Splitting the count and size across two arguments buys you one more thing: `calloc` checks `count * size` for overflow and returns `NULL` if that multiplication would wrap around to a small number. With `malloc(count * size)` you compute that product yourself, and if it overflows you'd get a too-small block that looks like it succeeded - a classic source of buffer overflows.

## realloc: growing (or shrinking) a block

Sometimes you don't know the final size even when you start filling the block - you're reading lines from a file and have no idea how many there'll be. `realloc` resizes an existing allocation, copying the old contents into the new block if it has to move:

```c
int capacity = 4;
int count = 0;
int *nums = malloc(capacity * sizeof(int));
if (nums == NULL) { return 1; }

int value;
while (scanf("%d", &value) == 1) {
    if (count == capacity) {
        capacity *= 2;
        int *bigger = realloc(nums, capacity * sizeof(int));
        if (bigger == NULL) {
            free(nums);          // realloc failed - the old block is still valid, free it
            return 1;
        }
        nums = bigger;            // only overwrite nums once we know it worked
    }
    nums[count++] = value;
}
```

That `bigger` temporary is not paranoia, it's the whole point of the pattern. If `realloc` fails, it returns `NULL` and leaves the *original* block untouched. Writing `nums = realloc(nums, ...)` directly would overwrite `nums` with `NULL` on failure, and you'd have just leaked the original block - you no longer have any pointer to free it with. Always realloc into a fresh variable, check it, and only then assign it back.

## The four functions, side by side

| Function | What it does | Zeroed? | Common use |
|---|---|---|---|
| `malloc(n)` | allocate `n` bytes | no | fixed-size block, about to fill it yourself |
| `calloc(count, size)` | allocate `count * size` bytes | yes | array you need to start at zero |
| `realloc(ptr, n)` | resize `ptr`'s block to `n` bytes | new part only | growing a buffer as you go |
| `free(ptr)` | release the block back to the allocator | - | exactly once per successful allocation |

## Recap

1. **The heap** is a pool of memory the allocator hands out on request, not tied to any function's scope - that's what lets you size things at runtime instead of compile time.
2. **`malloc(n)`** returns `n` raw, uninitialized bytes as `void *`, or `NULL` on failure - always check for `NULL` before using the pointer.
3. **`calloc(count, size)`** is `malloc` plus zero-initialization; use it when the starting value matters.
4. **`realloc(ptr, n)`** resizes a block, possibly moving it - always assign the result to a temporary first so a failed realloc doesn't strand your only pointer to the original block.
5. **`free(ptr)`** returns memory to the allocator - once per allocation, never twice, and never touch the pointer afterward. Set it to `NULL` after freeing so accidental reuse fails loud instead of quiet.

The discipline in this phase - one `free` per allocation, check every return value, never touch freed memory - is exactly what Phase 14 (Undefined Behavior & Common Footguns) will name and dissect in full. Next, we go one level deeper: *why* the heap needs manual management at all, by putting it side by side with the stack, where cleanup happens automatically.

## Quick check

Test yourself on the discipline that keeps dynamic memory safe:

```quiz
[
  {
    "q": "You call `malloc(5 * sizeof(int))` and it succeeds. What must eventually happen to that pointer?",
    "choices": [
      "free() must be called on it exactly once",
      "Nothing - malloc'd memory frees itself when the program exits normally",
      "It should be set to NULL, which releases the memory automatically",
      "free() should be called each time you finish reading from the array"
    ],
    "answer": 0,
    "explain": "Every successful malloc (or calloc/realloc) owes exactly one free - the allocator has no way to know you're done unless you tell it, and setting a pointer to NULL doesn't release anything by itself."
  },
  {
    "q": "Why does the safe realloc pattern assign the result to a temporary (`int *bigger = realloc(nums, newSize);`) instead of writing `nums = realloc(nums, newSize);` directly?",
    "choices": [
      "If realloc fails it returns NULL, and overwriting nums directly would destroy the only pointer to the still-valid original block, leaking it",
      "Assigning directly to nums causes a compiler warning in C",
      "realloc runs slower when its result is assigned back to the same variable",
      "C doesn't allow reassigning a pointer that was returned by malloc"
    ],
    "answer": 0,
    "explain": "realloc leaves the original block untouched on failure, so the only way to lose it is to overwrite your one pointer to it - the temporary variable protects against exactly that."
  },
  {
    "q": "You need an array of ints that must start at zero. Why reach for calloc instead of malloc?",
    "choices": [
      "calloc guarantees every byte is zeroed; malloc hands back whatever bytes happened to already be there",
      "malloc already zero-initializes memory on modern systems, so calloc is just a slower alias",
      "calloc and malloc both guarantee zeroing - calloc is only preferred because it takes two arguments",
      "Neither guarantees zeroing; you must call memset() yourself either way"
    ],
    "answer": 0,
    "explain": "malloc gives you raw, uninitialized bytes - often leftover garbage from something else. calloc gives you the same kind of block but guarantees it starts at zero."
  }
]
```

---

[← Phase 9: Build Tooling: Makefiles & Debugging](09-build-tooling-makefiles-and-debugging.md) · [Phase 11: The Stack vs the Heap →](11-the-stack-vs-the-heap.md)
