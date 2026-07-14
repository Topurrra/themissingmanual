---
title: "Arrays & Strings"
guide: "c-from-zero"
phase: 6
summary: "How does C store a list of values, and why is there no string type - just a convention involving a zero byte?"
tags: [c, arrays, strings, pointers, char-arrays, null-terminator, string-h]
difficulty: beginner
synonyms: ["c arrays explained", "c strings tutorial", "what is a null terminator", "c array vs pointer", "strcpy strcat strlen", "c array decay", "why does c not have a string type", "char array c", "c multidimensional arrays", "buffer overflow c strings"]
updated: 2026-07-14
---
# Arrays & Strings

You've met pointers now, so this phase is where they stop being an abstract idea and start doing real work. An array in C is nothing but a run of memory. A string in C is nothing but an array with a rule attached. Once you see both of those clearly, a huge amount of "why does C do it this way" clicks into place - including why `strcpy` can silently wreck your program if you're not careful.

## What an array actually is

**The mental model.** A C array is a fixed number of elements, laid out back to back in memory, with no gaps and no bookkeeping. That's it. There's no hidden length field, no bounds check, no metadata riding along with it. If you declare:

```c
int scores[5];
```

C reserves enough space for five `int`s in a row and calls the whole block `scores`. Picture five boxes glued together, numbered 0 through 4. `scores[2]` means "start at the beginning of this block, skip past two `int`-sized boxes, and read what's there." That skip-and-read is not a metaphor - it's literally what the compiler generates. `scores[2]` and `*(scores + 2)` compile to the same instructions.

```c
#include <stdio.h>

int main(void) {
    int scores[5] = {10, 20, 30, 40, 50};

    for (int i = 0; i < 5; i++) {
        printf("scores[%d] = %d\n", i, scores[i]);
    }

    printf("scores[2] and *(scores + 2): %d %d\n", scores[2], *(scores + 2));
    return 0;
}
```

```console
$ gcc scores.c -o scores && ./scores
scores[0] = 10
scores[1] = 20
scores[2] = 30
scores[3] = 40
scores[4] = 50
scores[2] and *(scores + 2): 30 30
```

**Why this matters.** Because there's no bounds check, `scores[5]` or `scores[-1]` doesn't error - it just reads (or writes) whatever memory happens to sit past the array. This compiles cleanly and might even "work" by accident. This is undefined behavior, and it's one of C's sharpest edges; you'll dig into it fully in phase 14, but keep it in the back of your mind starting now: **an array index is a promise you make to the compiler, not a rule it enforces for you.**

## Arrays decay to pointers

Here's the fact that explains half of C's function signatures: when you pass an array to a function, C doesn't copy the array. It hands the function a pointer to the array's first element. This is called **array decay**.

```c
#include <stdio.h>

void print_all(int *arr, int len) {
    for (int i = 0; i < len; i++) {
        printf("%d ", arr[i]);
    }
    printf("\n");
}

int main(void) {
    int nums[4] = {1, 2, 3, 4};
    print_all(nums, 4);   // nums decays to &nums[0]
    return 0;
}
```

Notice `print_all` needed a separate `len` parameter. This is the direct consequence of decay: once `nums` becomes a bare pointer, the function has no way to know how many elements follow it. `sizeof(nums)` inside `main` gives you the full array's byte size (16, for four `int`s) - but `sizeof(arr)` inside `print_all` gives you the size of *a pointer* (8 on a 64-bit machine), because by the time it gets there, `arr` really is just a pointer. **You must always carry the length alongside the array once it crosses a function boundary.** This one habit prevents a large share of beginner C bugs.

## Strings: arrays with a sentinel

C has no string type. What C calls a "string" is a plain `char` array with one convention layered on top: **the string ends at the first byte that is `0`** (written `'\0'`, the null terminator). Everything before that byte is the text; that byte itself marks "stop here."

```c
char greeting[] = "Hi!";
```

This doesn't create a 3-character array. It creates a 4-character array: `{'H', 'i', '!', '\0'}`. The compiler adds that trailing zero for you automatically whenever you write a string literal. This is why `strlen("Hi!")` returns `3`, not `4` - `strlen` counts characters *up to* the terminator, not including it.

```c
#include <stdio.h>
#include <string.h>

int main(void) {
    char greeting[] = "Hi!";
    printf("bytes reserved: %zu\n", sizeof(greeting));   // 4 - includes '\0'
    printf("strlen: %zu\n", strlen(greeting));            // 3 - stops at '\0'
    return 0;
}
```

**Why this design.** Instead of a length prefix or a struct, C strings carry their end *inside themselves*, as one extra byte. It's cheap and simple - but it means every string function has to walk the bytes one at a time looking for that zero, and if the zero is missing (or in the wrong place), the function keeps reading into whatever memory comes next. That's not a corner case; it's the single most common source of C bugs in the wild.

## The `string.h` toolkit, and where it bites

`<string.h>` gives you the basic operations. The mental model for every one of them: **it walks bytes until it finds `'\0'`, and it does not know how big your destination buffer is.**

```c
#include <stdio.h>
#include <string.h>

int main(void) {
    char name[20] = "Ada";

    printf("length: %zu\n", strlen(name));       // 3
    strcat(name, " Lovelace");                    // appends onto name
    printf("after strcat: %s\n", name);            // "Ada Lovelace"

    char copy[20];
    strcpy(copy, name);                            // copies name into copy
    printf("copy: %s, equal? %d\n", copy, strcmp(name, copy) == 0);
    return 0;
}
```

```console
$ gcc names.c -o names && ./names
length: 3
after strcat: Ada Lovelace
copy: Ada Lovelace, equal? 1
```

That worked because `name[20]` had room. Change `name` to `char name[8]` and `strcat` would write past the end of the array - into memory that belongs to something else - without any warning at compile time or runtime. This is a **buffer overflow**, and `strcpy`/`strcat`/`gets` are the classic culprits because none of them take a size limit. The safer habit is to use the bounded versions, `strncpy` and `strncat`, and to always know how big your destination buffer actually is:

```c
char name[8];
strncpy(name, "Grace Hopper", sizeof(name) - 1);
name[sizeof(name) - 1] = '\0';   // strncpy doesn't guarantee a terminator - add it yourself
```

That last line matters: `strncpy` stops writing at the limit you give it, but if the source was longer than the buffer, it never writes a `'\0'` at all. You have to place one yourself, or every string function that touches `name` afterward will keep reading past it looking for a terminator that isn't there.

`strncpy` was never really designed as a safe `strcpy` (that manual terminator step is exactly why), so the more modern idiom is `snprintf(name, sizeof(name), "%s", source)`, which always null-terminates for you. Some platforms also offer `strlcpy` with the same guarantee.

## Multi-dimensional arrays

A 2D array like `int grid[3][4]` is not an array of pointers - it's one contiguous block of 12 `int`s, laid out row by row, that you address with two indices for convenience:

```c
int grid[2][3] = {{1, 2, 3}, {4, 5, 6}};
printf("%d\n", grid[1][2]);   // 6 - row 1, column 2
```

Under the hood, `grid[1][2]` is computed as "skip 1 full row (3 ints), then skip 2 more ints" - the same skip-and-read idea as a 1D array, just with an extra multiply. Keep that picture in mind and 2D arrays stop feeling like a separate feature; they're the same memory model, one dimension up.

## Recap

- An array is a contiguous, fixed-size block of memory with no bounds checking - `arr[i]` is `*(arr + i)` in disguise.
- Passing an array to a function decays it to a pointer to its first element; you lose the length and must pass it separately.
- A C string is a `char` array where the text ends at the first `'\0'` byte - there's no separate string type.
- `string.h` functions (`strlen`, `strcpy`, `strcat`, `strcmp`) walk bytes looking for `'\0'` and don't know your buffer's size - use the bounded `strn*` variants and terminate manually when needed.
- A 2D array is one flat block addressed with two indices, not an array of arrays of pointers.

Arrays and strings are where "C is just memory with syntax on top" stops being a slogan and starts being something you can predict. Next up: bundling related values together with structs.

## Quick check

Test yourself on the two ideas that trip up most beginners: array decay losing the length, and the null terminator being a convention, not a guarantee.

```quiz
[
  {
    "q": "Why does `print_all(int *arr, int len)` need a separate `len` parameter instead of just using `sizeof(arr)`?",
    "choices": [
      "Once an array is passed to a function it decays to a pointer, so `sizeof(arr)` gives the pointer's size, not the array's",
      "`sizeof` only works on arrays declared with `int`, not other types",
      "C requires every function parameter to have an explicit length, even for non-array types",
      "`len` is needed for the loop to run faster, not for correctness"
    ],
    "answer": 0,
    "explain": "Array decay means the function only ever receives a pointer to the first element - the size information is left behind in the caller, so it has to be passed explicitly."
  },
  {
    "q": "`char greeting[] = \"Hi!\";` followed by `strlen(greeting)` returns 3. Why not 4?",
    "choices": [
      "`strlen` counts bytes up to but not including the `'\\0'` terminator, while `sizeof(greeting)` (4) counts the terminator too",
      "The compiler drops the last character of every string literal",
      "`strlen` and `sizeof` are the same function under different names, so this is a bug",
      "`\"Hi!\"` is stored as 3 bytes because `!` doesn't count as a character"
    ],
    "answer": 0,
    "explain": "The literal is stored as 4 bytes (`'H'`, `'i'`, `'!'`, `'\\0'`), but strlen walks the array and stops counting the moment it hits the null byte."
  },
  {
    "q": "After `strncpy(name, \"Grace Hopper\", sizeof(name) - 1);` on `char name[8]`, why is the next line `name[sizeof(name) - 1] = '\\0';` necessary?",
    "choices": [
      "`strncpy` stops writing at the given limit but won't add a `'\\0'` itself if the source was longer than that limit, so one must be placed manually",
      "It isn't necessary - `strncpy` always null-terminates its destination",
      "It resets `name` to an empty string before the copy happens",
      "It's only needed on some compilers, not as a rule of the language"
    ],
    "answer": 0,
    "explain": "strncpy's size limit protects against overflow, but if the source text is longer than that limit it just stops writing - it never guarantees a trailing '\\0', so leaving that line out can leave name un-terminated."
  }
]
```

---

[← Phase 5: Pointers I](05-pointers-i-the-mental-model.md) · [Phase 7: Structs & Typedef →](07-structs-and-typedef.md)
