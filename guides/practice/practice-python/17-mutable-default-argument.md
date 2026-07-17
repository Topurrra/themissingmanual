---
title: "Fix the bug: the second cart is not empty"
guide: practice-python
phase: 17
summary: "The code runs clean and hands back a list, exactly as promised. The second shopper's cart comes back holding the first shopper's groceries. The default was built once."
tags: [python, functions, default-arguments, mutable, debugging, gotcha]
difficulty: advanced
synonyms:
  - python mutable default argument
  - why does my default list keep growing
  - python function default list shared between calls
  - python default argument evaluated once
  - python empty list default remembers old values
updated: 2026-07-17
---

# Fix the bug: the second cart is not empty

A small store's checkout script. `add_item` puts one item in a cart, and if you
do not hand it a cart it starts a fresh one. Ada shops first and gets apples.
Ben shops next and gets bread. Run it and read Ben's cart: Ada's apples are in
it.

Nothing raised. Both calls returned a list, which is exactly what they promised
to return. The only thing wrong is the value - and the value is what reaches the
customer, on the receipt and in the total. A traceback would have stopped the
deploy. This ships.

The data is not doing anything clever. Two shoppers, one ordinary string each,
no `None`, no empty input, nothing to trip over. The first call is perfect,
which is exactly why nobody catches this in review. What is adversarial here is
the *second call*. Ada and Ben share nothing in this program except `add_item`
itself, so whatever is leaking between them is living on the function.

**Your task:** fix `add_item` so a call that passes no cart starts from an empty
one, while a call that does pass a cart still adds to that cart. Ben's cart
should be `['bread']`.

**You'll practice:**

- Reading a clean run that returns a wrong value as a bug, not a quirk
- Tracing leaked state back to *when* a default argument is actually created

```lesson
{
  "language": "python",
  "starterCode": "# Ada shops, then Ben shops. Ben's cart comes back holding Ada's apples. Fix add_item.\ndef add_item(item, cart=[]):\n    cart.append(item)\n    return cart\n\nprint(add_item(\"apples\"))  # Ada's cart\nprint(add_item(\"bread\"))   # Ben's cart - should be ['bread']",
  "solution": "def add_item(item, cart=None):\n    if cart is None:\n        cart = []\n    cart.append(item)\n    return cart\n\nprint(add_item(\"apples\"))  # Ada's cart\nprint(add_item(\"bread\"))   # Ben's cart - should be ['bread']",
  "hints": [
    "Press Run before you change anything and read the two lines it prints. Ada's cart is right. Ben's cart is ['apples', 'bread'] - and Ben was only ever handed 'bread'. Nothing raised, so nothing stopped it: the function returned a list, as promised, and the list is simply wrong. Ada and Ben share nothing in this program except add_item itself, so go looking for a value that outlives a call.",
    "The def line runs once - when Python builds the function object, not each time you call it. So cart=[] creates exactly one list, right there at definition time, and Python stores it on the function. You can see it: add print(add_item.__defaults__) after the two calls and watch the same list growing. Every call that omits cart is handed that one list, and .append keeps adding to it. Python is not failing to reset anything. A def line is code that runs once, like any other, and its default was evaluated once with it.",
    "The fix is to make the default None and build the list in the body, because the body does run on every call. Change the signature to def add_item(item, cart=None): then make the first two lines of the body if cart is None: and, indented under it, cart = []. Leave cart.append(item) and return cart exactly as they are - they were never the problem. Test None specifically rather than a falsy check like if not cart, or an empty list the caller deliberately passed in would get silently swapped for a different one."
  ],
  "tests": [
    {
      "name": "a call with no cart starts from an empty cart",
      "code": "add_item(\"apples\")\nassert add_item(\"bread\") == [\"bread\"], 'a call that passes no cart should start from an empty cart, so add_item(\"bread\") should return [\"bread\"]'"
    },
    {
      "name": "one call's cart is not touched by the next call",
      "code": "ada = add_item(\"apples\")\nadd_item(\"bread\")\nassert ada == [\"apples\"], \"Ada's cart should still be ['apples'] after the next call - two calls that pass no cart must not share one list\""
    },
    {
      "name": "a cart passed in is still used",
      "code": "assert add_item(\"bread\", [\"apples\"]) == [\"apples\", \"bread\"], 'add_item(\"bread\", [\"apples\"]) should return [\"apples\", \"bread\"] - a cart the caller passes in must still be added to'"
    }
  ]
}
```
