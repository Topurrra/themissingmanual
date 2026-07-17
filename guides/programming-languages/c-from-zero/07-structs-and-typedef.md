---
title: "Structs & Typedef"
guide: "c-from-zero"
phase: 7
summary: "How do you bundle different kinds of data - a name, an age, a balance - into one thing you can pass around, and why does everyone rename their structs with typedef?"
tags: [c, structs, typedef, data-structures, memory-layout]
difficulty: beginner
synonyms: ["c struct tutorial", "typedef struct c", "c struct vs array", "how to define a struct in c", "struct pointer c", "passing struct to function c", "c struct assignment copy", "nested struct c", "self referential struct c"]
updated: 2026-07-14
---
# Structs & Typedef

Every type you've used so far holds one kind of thing: an `int` holds a number, a `char[]` holds a run of characters. But real data is rarely that simple. A point on a screen is an x *and* a y. A person is a name *and* an age *and* a balance. You could track these as separate variables - `int x; int y;` - but nothing stops you from updating `x` and forgetting `y`, and you can't pass "a point" to a function as one thing. You'd have to pass two arguments and hope you keep them in sync forever.

**A struct is C's answer: a new type you define, made of other types glued together, that the compiler treats as one value.** Move the struct, and every field moves with it. Pass it to a function, and all its fields go together, correctly, every time. This is the last basic building block before the deep half of this guide, and it matters more than it looks: chapter 10 onward, you'll build linked lists and trees out of structs that point to other structs.

## Defining and using a struct

Here's a struct for a point in 2D space:

```c
#include <stdio.h>

struct point {
    int x;
    int y;
};

int main(void) {
    struct point p1 = { 3, 4 };   // fields set in order: x=3, y=4
    printf("p1 = (%d, %d)\n", p1.x, p1.y);

    p1.x = 10;                    // dot (.) accesses a field on the struct itself
    printf("p1 = (%d, %d)\n", p1.x, p1.y);

    return 0;
}
```
```console
$ gcc point.c -o point && ./point
p1 = (3, 4)
p1 = (10, 4)
```

*What just happened:* `struct point { ... };` defines a new type called `struct point` - notice the keyword `struct` is part of the type's name, not optional decoration. `p1.x` reads "the `x` field of `p1`", using the dot operator. That's the whole model: a struct is a labeled box of smaller boxes, and the dot reaches into one of them.

## Struct assignment copies everything

This is the detail that surprises people coming from other languages, and it connects straight back to what you learned about arrays in phase 6: a plain `struct point p2 = p1;` does **not** make `p2` point at `p1`'s data. It copies every field, field by field, into a brand new struct.

```c
struct point p1 = { 3, 4 };
struct point p2 = p1;   // full copy: p2.x = 3, p2.y = 4

p2.x = 99;
printf("%d %d\n", p1.x, p2.x);   // 3 99 - p1 was never touched
```

Unlike an array, a struct is a value you can assign, copy, and return from a function whole - the compiler generates the field-by-field copy for you. That's genuinely convenient for small structs. For big ones (say, a struct holding a 10,000-element array), it means `p2 = p1` silently copies a lot of bytes, which is worth knowing before you do it in a hot loop.

## Passing structs to functions: by value, or by pointer

Because assignment copies, passing a struct as a function argument copies it too - the function gets its own private copy and any changes it makes vanish when it returns:

```c
void move_wrong(struct point p) {
    p.x += 1;   // only changes the local copy
}

void move_right(struct point *p) {
    p->x += 1;  // changes the original, through the pointer
}

int main(void) {
    struct point p1 = { 3, 4 };
    move_wrong(p1);
    printf("%d\n", p1.x);   // 3 - unchanged, move_wrong only touched a copy

    move_right(&p1);
    printf("%d\n", p1.x);   // 4 - the real thing changed
}
```

`move_right` takes a `struct point *` - a pointer to a point, exactly the pointer mental model from phase 5. Inside, `p->x` means "follow the pointer, then access field `x`" - it's shorthand for `(*p).x`, which is clunky enough that C gives you the arrow operator instead. **Rule of thumb: pass small structs by value when you just need to read them; pass a pointer when the function needs to modify the original, or when the struct is large enough that copying it is wasteful.**

| Passing style | Syntax | Function sees | Use when |
|---|---|---|---|
| By value | `f(struct point p)` | a copy | struct is small, read-only use |
| By pointer | `f(struct point *p)` | the original, via `p->field` | need to modify it, or it's large |

## Nested structs

Structs can contain other structs. A rectangle is naturally two points:

```c
struct rect {
    struct point top_left;
    struct point bottom_right;
};

struct rect r = { { 0, 0 }, { 10, 5 } };
printf("width = %d\n", r.bottom_right.x - r.top_left.x);   // 10
```

Chain the dots to reach through the nesting: `r.bottom_right.x` means "in `r`, get `bottom_right`, then get its `x`." Nothing new is happening here, it's the same dot operator, just applied twice.

## typedef: giving a struct a shorter name

Notice that every declaration above had to say `struct point`, not just `point`. That's because in C, defining `struct point` only creates the tag `point` under the `struct` namespace - it doesn't create a plain type name you can use on its own. Writing `struct` everywhere works fine, but it's noisy, and almost every real C codebase uses `typedef` to skip it:

```c
typedef struct {
    int x;
    int y;
} Point;

int main(void) {
    Point p1 = { 3, 4 };   // no "struct" needed
    printf("(%d, %d)\n", p1.x, p1.y);
    return 0;
}
```

**What `typedef` actually is: it defines an alias for a type, nothing more.** `typedef struct { ... } Point;` says "define an anonymous struct, then let `Point` be another name for it." It doesn't change how the struct works, doesn't add behavior, doesn't cost anything at runtime - it's purely a name the compiler substitutes at compile time. You'll see this exact `typedef struct { ... } Name;` pattern constantly; it's the standard way to define a struct type in C, precisely so you never have to type `struct` again.

You can also `typedef` a *named* struct separately, which matters once structs start referencing themselves (linked lists, trees - coming in the deep half of this guide):

```c
typedef struct point Point;   // Point is now an alias for struct point
struct point { int x; int y; };
```

Both spellings show up in real code; the anonymous version above is more common for simple data-only structs.

## A quick look ahead: self-referential structs

One thing a struct *can't* contain is itself, directly - `struct node { struct node next; }` would need infinite memory, since every `node` would contain another whole `node` forever. But a struct absolutely can contain a *pointer* to its own type, because a pointer is always the same fixed size regardless of what it points to:

```c
typedef struct node {
    int value;
    struct node *next;   // a pointer to another node - this is legal
} Node;
```

This one pattern - a struct holding a pointer to its own type - is the entire foundation of linked lists, trees, and most of the dynamic data structures you'll build once you reach dynamic memory in phase 10. File it away; you'll use it constantly from here on.

## Recap

1. A **struct** bundles different types into one named type; access fields with `.`
2. **Assigning a struct copies every field.** It's a real value, not a reference - unlike an array.
3. Pass structs **by value** to give a function a private copy, or **by pointer** (`->` to access fields) so it can modify the original or avoid copying a large struct.
4. Structs can **nest**; chain `.` to reach through the layers.
5. **`typedef`** just creates an alias for a type - `typedef struct { ... } Name;` is the standard way to skip writing `struct` everywhere.
6. A struct can hold a **pointer to its own type** (not itself directly) - the pattern behind every linked data structure to come.

### Check yourself

```quiz
[
  {
    "q": "After `struct point p2 = p1;` followed by `p2.x = 99;`, what happens to `p1.x`?",
    "choices": [
      "It also becomes 99, since p2 points at p1's data",
      "It stays whatever it was before - p2 is a separate copy",
      "It's undefined behavior",
      "It becomes 0"
    ],
    "answer": 1,
    "explain": "Struct assignment copies every field into a brand new struct, unlike an array; p1 and p2 share nothing after the copy."
  },
  {
    "q": "Why does `move_wrong(struct point p)` fail to change the caller's struct, while `move_right(struct point *p)` succeeds?",
    "choices": [
      "move_wrong has a bug in its syntax",
      "move_wrong receives a copy of the struct, so changes to it vanish when the function returns; move_right receives a pointer to the original",
      "Structs can never be modified inside a function",
      "move_right is faster, which is the only real difference"
    ],
    "answer": 1,
    "explain": "Passing a struct by value copies it just like assignment does; passing a pointer lets the function reach through to the original via ->."
  },
  {
    "q": "Why can `struct node { struct node *next; }` compile, when `struct node { struct node next; }` cannot?",
    "choices": [
      "The pointer version is a stylistic choice with no real difference",
      "A pointer is always a fixed size no matter what it points to, so it doesn't require infinite memory; a direct struct-inside-itself would",
      "C only allows pointers to be named next",
      "The non-pointer version is legal too, just slower"
    ],
    "answer": 1,
    "explain": "A struct containing itself directly would need infinite memory, since each copy holds another whole copy; a pointer is a fixed-size address regardless of what type it points to."
  }
]
```

---

[Phase 8: Header Files & the Preprocessor →](08-header-files-and-the-preprocessor.md)
