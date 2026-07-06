---
title: "A Real Investigation"
guide: "debugging-in-the-browser"
phase: 3
summary: "Walk one why-is-this-broken bug end to end across Console, Network, Sources, and Elements - plus the gotchas (caching, scope, source maps) that send people chasing ghosts."
tags: [debugging, devtools, investigation, elements, network, console]
difficulty: intermediate
synonyms: ["debug a real bug in the browser", "devtools investigation walkthrough", "why is my button not working", "inspect element live dom css", "debugging method frontend", "stale cache devtools gotcha", "edit css in elements panel"]
updated: 2026-06-30
---

# A Real Investigation

A real bug doesn't announce which panel to open. What separates flailing from debugging is knowing the
*order* to reach for them. This phase walks one realistic bug end to end and introduces the last panel -
**Elements** - for when the page *looks* wrong rather than *behaves* wrong.

## The bug

A user reports: *"I click 'Add to cart' on the sale items and nothing happens. Works fine on regular items."*
One rule the whole way: **observe before you theorize** - open DevTools, look, let each panel point to the next.

## Step 1: Console first, always

You click "Add to cart" on a sale item. Nothing visibly happens. Before guessing, glance at the Console.

```console
❌ Uncaught TypeError: Cannot read properties of null (reading 'price')
       at addToCart (cart.js:54)
       at HTMLButtonElement.onclick (sale.js:31)
```
*What just happened:* The click *did* fire - `onclick` in sale.js called `addToCart`, which blew up on
`cart.js:54` reading `.price` off `null`. "Nothing happens" was never true; it threw and died silently -
the Console turned a vague report into a precise location.

## Step 2: Set a breakpoint where it broke

The error points at line 54. Open it in Sources, drop a breakpoint there, then click the sale button again
to pause at the crime scene.

```text
cart.js - PAUSED on :54

  52   function addToCart(productId) {
  53     const product = catalog.find(p => p.id === productId);
● 54     return { ...product, price: product.price };   ◄── paused, product = null
  55   }

  SCOPE
    productId = "sale-1099"
    product   = null              ◄── the find() returned nothing
```
*What just happened:* `product` is `null` - `catalog.find(...)` matched nothing for `"sale-1099"`. Either
the id is wrong, or the catalog never loaded this item.

Check the live prompt for the cheaper theory first:

```console
> catalog.length
40
> catalog.find(p => p.id === "sale-1099")
undefined
> catalog.filter(p => p.id.startsWith("sale")).length
0
```
*What just happened:* The catalog has 40 items but *zero* sale items - `addToCart` is correctly failing on
data that isn't there.

## Step 3: Network - did the sale data even arrive?

Sale items likely come from an API call. Open **Network**, filter to `Fetch/XHR`, and reload.

```text
Name                    Status   Type    Size    Time
──────────────────────────────────────────────────────
GET /api/catalog        200      fetch   8.0 kB   90 ms
GET /api/sale-items     403      fetch   180 B   60 ms   ◄── red
```
*What just happened:* `/api/sale-items` came back **403 Forbidden** while the catalog loaded fine (200) -
explaining the empty sale items, the `null` from `find`, the throw in `addToCart`. Click it to learn why:

```text
GET /api/sale-items  →  Response tab:
  { "error": "missing or expired session token" }
```
*What just happened:* No valid session token - the frontend isn't sending the auth the sale endpoint requires
(the public catalog endpoint doesn't need it, hence *it* worked). Root cause, in the server's own words.

## The Elements panel: when the page LOOKS wrong

That bug was *behavioral*. The other half of frontend bugs are *visual* - broken layout, wrong color,
misalignment. Reach for **Elements**: it shows the **live DOM** (the HTML right now, post-JavaScript) and
the **CSS the browser actually applied**.

Say the sale price should be red but renders gray. Right-click it → Inspect:

```text
Elements:
  <span class="price sale-price">$10.99</span>

Styles (winning rules at top, losing rules struck through):
  .sale-price { color: red; }            ◄── what you wrote
  .price      { color: gray; }           ◄── what actually won
```
*What just happened:* Both rules target the element, but `.price` won and painted it gray. Styles shows the
*real* cascade - every matching rule, which won, which got overridden: a specificity/order problem, `.price`
beats `.sale-price`. Test the fix instantly:

```text
> double-click color value, type "red", Enter
  → the price turns red on screen immediately
```
*What just happened:* Fix confirmed without touching a file or refreshing. Elements edits are a live
*experiment*, not a save - they vanish on reload - but prove what change will work before you write it in
the real CSS.

## The gotchas that send you chasing ghosts

Three traps waste more hours than any actual bug:

⚠️ **Stale cache - you're debugging old code.** You fix something, reload, bug's still there - the browser
served a *cached* copy of your old JS. Open DevTools → Network, tick **Disable cache** (only while DevTools
is open), reload. First thing to rule out if unsure you're looking at current code.

⚠️ **"undefined" in the live prompt - wrong scope.** You type a variable name and get `Uncaught
ReferenceError`. It's real but *local* to a function, and you're asking from global scope. To read a local,
you must be **paused on a breakpoint inside that function** - then the Console evaluates in that scope.

⚠️ **Minified line numbers that make no sense.** An error points at `app.js:1:48210`, gibberish - built/minified
code. Make sure **source maps** are loading (Phase 2) so DevTools shows your original source, or every
breakpoint and stack frame is in a language you didn't write.

## The method, distilled

A method you can reuse on any frontend bug:

```text
1. Console      → is there an error? where (file:line)?      → cart.js:54
2. Sources      → breakpoint there; what's actually true?    → product is null
3. Network      → did the data arrive? what status?          → 403 on /sale-items
4. Response     → why did it fail, in the server's words?    → "missing session token"
   (Elements    → for visual bugs: what CSS actually won?)
```
*What just happened:* Each panel answered one question and pointed at the next. You never guessed - you
*observed*, and the bug unwound from symptom to root cause. That ordered habit is the real takeaway.

## For builders

When you file or hand off a bug, attach what this loop found: the Console error, the failing request's
status and Response body, the exact `file:line`. "Add to cart fails because `/api/sale-items` returns 403 -
missing session token" gets fixed in minutes. "It doesn't work" takes days.

## Recap

1. **Order beats tool knowledge.** Start at the **Console**, follow the error to **Sources**, check
   **Network** when data's involved, read the **Response** for the server's own explanation.
2. **Observe before you theorize** - let each panel hand you the next question instead of guessing.
3. **Elements** is for *visual* bugs: it shows the live DOM and the CSS that actually won (overridden rules
   struck through), and lets you test fixes live.
4. Rule out the ghosts early: **stale cache** (Disable cache + reload), **wrong scope** (pause inside the
   function to read locals), and **missing source maps** (so line numbers mean something).

That's the toolkit. Four panels, one method - most "why is this broken?" mysteries don't stand a chance.

```quiz
[
  {
    "q": "A button 'does nothing' when clicked. Where do you look first, and why?",
    "choices": [
      "The Network tab, because it's always a server problem",
      "The Console, because 'nothing happens' is often code that threw and died silently",
      "The Elements panel, to check the button's CSS",
      "The Performance panel, to see if it was too slow"
    ],
    "answer": 1,
    "explain": "'Nothing happened' frequently means the click handler ran and threw an error. The Console shows that error and the exact file:line, turning a vague report into a precise starting point."
  },
  {
    "q": "You type a variable name in the Console and get a ReferenceError, but you know the variable exists. What's the likely cause?",
    "choices": [
      "The variable was deleted by the garbage collector",
      "The Console can only read numbers, not objects",
      "It's local to a function, and you're not paused on a breakpoint inside that function",
      "You need to enable the variable in settings"
    ],
    "answer": 2,
    "explain": "The Console evaluates in the current scope. A function-local variable is only visible when you're paused on a breakpoint inside that function - then the Console reads that paused scope."
  },
  {
    "q": "In the Elements panel's Styles pane, a CSS rule appears struck through. What does that mean?",
    "choices": [
      "The rule has a syntax error",
      "The rule matched the element but was overridden by a more specific or later rule",
      "The rule is disabled and will never apply",
      "The rule belongs to a different element"
    ],
    "answer": 1,
    "explain": "Struck-through rules matched the element but lost the cascade to a winning rule. The Styles pane shows the real cascade, so you can see exactly which rule painted the element and which got overridden."
  }
]
```

---

[← Phase 2: Breakpoints and the Network Tab](02-breakpoints-and-the-network-tab.md) · [Guide overview](_guide.md)
