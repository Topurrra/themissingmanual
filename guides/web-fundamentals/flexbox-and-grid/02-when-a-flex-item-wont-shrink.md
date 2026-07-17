---
title: "When a Flex Item Won't Shrink: the min-width Floor"
guide: "flexbox-and-grid"
phase: 2
summary: "Why a flex item refuses to shrink below its longest unbreakable word, so one long URL or token blows your whole row apart, and why min-width: 0 is the fix that everyone eventually learns."
tags: [css, flexbox, min-width, overflow, flex-shrink, min-content]
difficulty: advanced
synonyms: ["flex item won't shrink", "long text breaks flex layout", "flexbox overflow long word", "min-width 0 flexbox fix", "flex item ignoring flex-shrink", "text overflowing flex container", "why is my flexbox overflowing"]
updated: 2026-07-17
---

# When a Flex Item Won't Shrink: the min-width Floor

Your equal-width card row from the last phase is perfect. Three cards, `flex: 1`
each, three clean thirds. You ship it.

Then real data shows up. One card holds a user's email, or an API token, or a URL
with no spaces in it - and the whole row detonates. That one card balloons out,
crushes its siblings into slivers, and a horizontal scrollbar crawls across the
page. You didn't change the layout. You changed the *text*, and `flex: 1` -
which was supposed to keep everything equal - just let one card ignore it
completely.

This is the single most common "it worked on my machine, then broke with real
content" bug in flexbox. It has one cause and one real fix.

## What's actually happening

`flex-shrink` (the middle value of `flex: 1`) says an item is *allowed* to shrink.
But every flex item also has a **floor** it won't shrink past, and by default that
floor is `min-width: auto`.

`auto` doesn't mean zero. It means: **don't shrink below your content's own
minimum width** - the width of the widest thing inside you that can't be broken
up. For text, that "widest unbreakable thing" is your longest word.

📝 **min-content.** An element's min-content width is how narrow it can get before
its content would have to be sliced mid-word. For a paragraph of normal prose,
that's just the longest word - narrow, harmless. For a 45-character API token with
no spaces or hyphens, it's the *entire token*, because there's nowhere to break it.

## Why one long string is different

Here's the trap. A long *sentence* is fine - it's full of spaces, so it wraps, and
its min-content is just its longest word. Even a long hyphenated word is fine,
because browsers can break after a hyphen. The floor only gets dangerous when the
content is one long **unbreakable** run: a token, a hash, a URL with no breakable
characters, a raw email address.

```css
.card { flex: 1; }   /* from the last phase */
```

```console
container: 400px wide, two cards, flex:1 each

┌──────────────────────────────────────────┐┌──┐
│ sk9Q2xZm7Kp4Rw8Tn5Vy1Bc6Hf3Jd0Ls2Gg8Ww4Aa │s…│   ← and it still runs off
└──────────────────────────────────────────┘└──┘      the right edge
        card A: 402px                       card B: 34px
```

*What just happened:* card A's content is a 45-character token with no break
points, so its min-content width is the full token - about 400px. Its
`min-width: auto` floor won't let it shrink past that, so `flex: 1` is overruled:
card A takes 402px, card B is crushed to 34px, and the row overflows its 400px
container and scrolls. `flex-shrink` never got a chance, because the floor stopped
it first.

**Why the default is `auto` and not `0`.** It's a protective default. The browser
assumes that silently shrinking a box until its content is clipped and unreadable
is worse than letting it overflow where you can at least see the problem. It's a
reasonable call - overflow is visible, hidden content is not - and, like margin
collapse, it's a sensible rule that ambushes you the first time.

## The fix: `min-width: 0`

Lower the floor. `min-width: 0` tells the item it's allowed to shrink below its
content's natural minimum:

```css
.card {
  flex: 1;
  min-width: 0;
}
```

*What just happened:* both cards are back to 200px, equal halves. `flex: 1` works
again. But run it and you'll see the token now spills out of card A's box, over
the top of card B - because you told the *card* it may shrink, but you never told
the *text* it may break. Two different problems: the card sizing, and the content
inside it.

So the complete fix is both - shrink the card, and let its text wrap:

```css
.card {
  flex: 1;
  min-width: 0;
  overflow-wrap: break-word;   /* let the unbreakable string break */
}
```

Now card A is 200px, the token wraps neatly onto multiple lines inside it, and
nothing overflows.

⚠️ **The gotcha within the gotcha.** `overflow-wrap: break-word` *by itself*,
without `min-width: 0`, does nothing here - the row still blows out to 402px. That
surprises people who reach for it first. The reason is exact: `break-word` lets
text wrap once a box is narrow, but it does not lower the item's min-content
width, so the `min-width: auto` floor is still standing at the full token width.
You have to remove the floor with `min-width: 0` *first*; the wrapping only
matters after the box is allowed to get small. (If you'd rather clip than wrap,
`overflow: hidden` also removes the floor and cuts the token off at the edge.)

## The same floor lives on grid items

Grid items have the identical default, so a long token overflows a `1fr` track the
same way - `1fr` is really `minmax(auto, 1fr)`, and that `auto` minimum is the same
floor. The fixes are the same idea: `min-width: 0` on the item, or write the track
as `minmax(0, 1fr)` so its minimum is zero from the start. You'll meet `1fr` and
`minmax` properly in [Phase 3](03-css-grid-two-dimensional-layout.md); just tuck
away that `minmax(0, 1fr)` is the grid version of this exact fix.

## Recap

1. Every flex item has a floor: by default `min-width: auto`, which means "don't
   shrink below my content's min-content width."
2. For normal text that floor is tiny (the longest word). For one long
   *unbreakable* string - a token, hash, or URL - it's the whole string, and that's
   what overrides `flex: 1` and blows the row apart.
3. `min-width: 0` removes the floor so the item shrinks to its fair share again.
4. That fixes the *box*, not the *text* - add `overflow-wrap: break-word` to wrap
   the string (or `overflow: hidden` to clip it).
5. `overflow-wrap` alone won't do it: it doesn't lower the floor. Grid items have
   the same floor, fixed with `min-width: 0` or `minmax(0, 1fr)`.

Check your intuition:

```quiz
[
  {
    "q": "A flex row of `flex: 1` cards looks fine with placeholder text but breaks when one card gets a long unbreakable API token. Why does that one card refuse to shrink?",
    "choices": ["flex: 1 only works with three or fewer items", "Its default min-width: auto won't let it shrink below the token's width", "Tokens are treated as images by the browser", "flex-shrink defaults to 0"],
    "answer": 1,
    "explain": "A flex item's default min-width: auto floor is its min-content width, which for an unbreakable token is the whole token. That floor overrides flex-shrink."
  },
  {
    "q": "You add `overflow-wrap: break-word` to the card but the row still overflows. What's missing?",
    "choices": ["word-break: keep-all", "min-width: 0 to lower the shrink floor", "flex-basis: 100%", "A fixed width on the container"],
    "answer": 1,
    "explain": "overflow-wrap lets text wrap once the box is narrow, but it doesn't lower the min-width: auto floor. min-width: 0 removes the floor so the box can actually get small."
  },
  {
    "q": "What's the grid-track equivalent of putting `min-width: 0` on a flex item?",
    "choices": ["grid-auto-flow: dense", "minmax(0, 1fr) instead of 1fr", "grid-template-columns: auto", "place-items: stretch"],
    "answer": 1,
    "explain": "1fr carries an implicit auto minimum (the same floor). Writing the track as minmax(0, 1fr) sets that minimum to zero, letting the track shrink."
  }
]
```

---

[← Phase 1: Flexbox: One-Dimensional Layout](01-flexbox-one-dimensional-layout.md) · [Guide overview](_guide.md) · [Phase 3: CSS Grid: Two-Dimensional Layout →](03-css-grid-two-dimensional-layout.md)
