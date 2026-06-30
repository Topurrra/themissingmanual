---
title: "A Real Investigation"
guide: "debugging-in-the-browser"
phase: 3
summary: "Walk one why-is-this-broken bug end to end across Console, Network, Sources, and Elements — plus the gotchas (caching, scope, source maps) that send people chasing ghosts."
tags: [debugging, devtools, investigation, elements, network, console]
difficulty: intermediate
synonyms: ["debug a real bug in the browser", "devtools investigation walkthrough", "why is my button not working", "inspect element live dom css", "debugging method frontend", "stale cache devtools gotcha", "edit css in elements panel"]
updated: 2026-06-30
---

# A Real Investigation

You've met the panels. But a real bug doesn't announce which one to open — it sits there, broken,
mocking you. The skill that separates flailing from debugging isn't knowing the tools; it's knowing the
*order* to reach for them. This phase walks one realistic bug from "it's broken" to "here's exactly why,"
and along the way introduces the last panel — **Elements** — for when the page *looks* wrong rather than
*behaves* wrong.

## The bug

A user reports: *"I click 'Add to cart' on the sale items and nothing happens. Works fine on regular
items."* Let's find it. We'll follow one rule the whole way: **observe before you theorize.** Open DevTools,
look, and let each panel point at the next.

## Step 1: Console first, always

You click an "Add to cart" button on a sale item. Nothing visibly happens. Before guessing, you glance at
the Console.

```console
❌ Uncaught TypeError: Cannot read properties of null (reading 'price')
       at addToCart (cart.js:54)
       at HTMLButtonElement.onclick (sale.js:31)
```
*What just happened:* The click *did* fire — it ran `onclick` in sale.js, which called `addToCart`, which
blew up on `cart.js:54` trying to read `.price` off `null`. "Nothing happens" was never true; the code threw
and died silently. The Console turned a vague report into a precise location. Click `cart.js:54`.

## Step 2: Set a breakpoint where it broke

The error points at line 54. You open it in Sources and drop a breakpoint there, then click the sale button
again to pause right at the crime scene.

```text
cart.js — PAUSED on :54

  52   function addToCart(productId) {
  53     const product = catalog.find(p => p.id === productId);
● 54     return { ...product, price: product.price };   ◄── paused, product = null
  55   }

  SCOPE
    productId = "sale-1099"
    product   = null              ◄── the find() returned nothing
```
*What just happened:* `product` is `null` — `catalog.find(...)` didn't match anything for
`productId = "sale-1099"`. So the real question shifts: why isn't this sale item in `catalog`? Either the id
is wrong, or the catalog never loaded the sale items. You're now one good question away from the root cause.

You check the live prompt to test the cheaper theory first:

```console
> catalog.length
40
> catalog.find(p => p.id === "sale-1099")
undefined
> catalog.filter(p => p.id.startsWith("sale")).length
0
```
*What just happened:* The catalog has 40 items but *zero* sale items in it. The bug isn't in `addToCart` at
all — that function is correctly failing on data that should be there and isn't. The sale items never made it
into `catalog`. Time to find out where they were supposed to come from.

## Step 3: Network — did the sale data even arrive?

Sale items almost certainly come from an API call. You open the **Network** tab, filter to `Fetch/XHR`, and
reload.

```text
Name                    Status   Type    Size    Time
──────────────────────────────────────────────────────
GET /api/catalog        200      fetch   8.0 kB   90 ms
GET /api/sale-items     403      fetch   180 B   60 ms   ◄── red
```
*What just happened:* `/api/sale-items` came back **403 Forbidden**. The regular catalog loaded fine (200),
but the sale-items request was *rejected*. That's why `catalog` had 40 regular items and no sale items, which
is why `find` returned `null`, which is why `addToCart` threw. The whole chain unwound from one forbidden
request. Click it to learn *why* it was forbidden:

```text
GET /api/sale-items  →  Response tab:
  { "error": "missing or expired session token" }
```
*What just happened:* The server says the request had no valid session token. The frontend isn't sending the
auth the sale endpoint requires (the public catalog endpoint doesn't need it, which is why *it* worked).
That's the root cause, in the server's own words — a complete, hand-offable diagnosis, reached without
editing a single line of code.

## The Elements panel: when the page LOOKS wrong

That bug was *behavioral*. The other half of frontend bugs are *visual* — the layout's broken, text is the
wrong color, something's misaligned. For those, you reach for **Elements**, which shows the **live DOM** (the
HTML as it exists *right now*, after JavaScript has had its way with it) and the **CSS the browser actually
applied**.

Say the sale price is supposed to be red but renders gray. Right-click it → Inspect:

```text
Elements:
  <span class="price sale-price">$10.99</span>

Styles (winning rules at top, losing rules struck through):
  .sale-price { color: red; }            ◄── what you wrote
  .price      { color: gray; }           ◄── what actually won
```
*What just happened:* Both rules target the element, but `.price` won and painted it gray. The Styles pane
shows you the *real* cascade — every rule that matched, which one won, and which got overridden (shown
struck through). Here it's a specificity/order problem: `.price` is beating `.sale-price`. You can test the
fix instantly — double-click the `color` value and type `red`, and the page updates *live*:

```text
> double-click color value, type "red", Enter
  → the price turns red on screen immediately
```
*What just happened:* You confirmed the fix without touching a file or refreshing. Elements edits are a live
*experiment*, not a save — they vanish on reload — but they prove what change will work before you go write
it in the real CSS.

## The gotchas that send you chasing ghosts

Three traps waste more debugging hours than any actual bug:

⚠️ **Stale cache — you're debugging old code.** You fix something, reload, and the bug's still there — because
the browser served a *cached* copy of your old JS. Open DevTools, go to Network, tick **Disable cache** (it
only applies while DevTools is open), and reload. If you're ever unsure whether you're even looking at your
latest code, this is the first thing to rule out.

⚠️ **"undefined" in the live prompt — wrong scope.** You type a variable name in the Console and get
`Uncaught ReferenceError`. The variable is real, but it's *local* to a function and you're asking from the
global scope. To read a local, you have to be **paused on a breakpoint inside that function** — then the
Console evaluates in *that* paused scope and the variable is visible.

⚠️ **Minified line numbers that make no sense.** An error points at `app.js:1:48210` and the line is gibberish.
You're seeing built/minified code. Make sure **source maps** are enabled and loading (covered in Phase 2) so
DevTools shows your original source — otherwise every breakpoint and stack frame is in a language you didn't
write.

## The method, distilled

Notice the shape of the whole investigation — it's a method you can reuse on any frontend bug:

```text
1. Console      → is there an error? where (file:line)?      → cart.js:54
2. Sources      → breakpoint there; what's actually true?    → product is null
3. Network      → did the data arrive? what status?          → 403 on /sale-items
4. Response     → why did it fail, in the server's words?    → "missing session token"
   (Elements    → for visual bugs: what CSS actually won?)
```
*What just happened:* Each panel answered one question and pointed at the next. You never guessed; you
*observed*, and the bug unwound itself from symptom to root cause. That ordered habit — Console, then the
panel the error points to, then Network if data's involved — is the real takeaway of this guide.

## For builders

When you file or hand off a bug, do this whole loop first and attach what you found: the Console error, the
failing request's status and Response body, the exact `file:line`. A report that says "Add to cart fails on
sale items because `/api/sale-items` returns 403 — missing session token" gets fixed in minutes. "It doesn't
work" gets fixed in days.

## Recap

1. **Order beats tool knowledge.** Start at the **Console**, follow the error to **Sources**, check
   **Network** when data's involved, read the **Response** for the server's own explanation.
2. **Observe before you theorize** — let each panel hand you the next question instead of guessing.
3. **Elements** is for *visual* bugs: it shows the live DOM and the CSS that actually won (overridden rules
   struck through), and lets you test fixes live.
4. Rule out the ghosts early: **stale cache** (Disable cache + reload), **wrong scope** (pause inside the
   function to read locals), and **missing source maps** (so line numbers mean something).

That's the toolkit. Four panels, one method, and most "why is this broken?" mysteries don't stand a chance.

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
    "explain": "The Console evaluates in the current scope. A function-local variable is only visible when you're paused on a breakpoint inside that function — then the Console reads that paused scope."
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
