---
title: "Margin Collapse"
guide: "css-without-tears"
phase: 3
summary: "Why two stacked margins add up to the larger one instead of their sum, why a child's top margin sometimes escapes its parent and pushes the whole box down, and the one-line fixes for both."
tags: [css, margin, margin-collapse, box-model, block-formatting-context]
difficulty: advanced
synonyms: ["why is my margin not adding up", "css margin collapse explained", "child margin pushes parent down", "margin escaping parent div", "why is there a gap above my div", "collapsing margins css"]
updated: 2026-07-17
---

# Margin Collapse

You gave your tagline `margin: 20px 0` in the last phase, and the bio paragraphs
below it each have a top and bottom margin too. So the gap between two paragraphs
should be the bottom margin of one plus the top margin of the next, right?

It isn't. Measure it and you get the *larger* of the two, not the sum. And
sometimes it's stranger than that: you put a margin on the top of a heading
inside a colored box, and instead of pushing the heading down *inside* the box,
the margin shoves the *whole box* down and leaves the heading jammed against the
top edge. Nothing errored. The number you typed is just landing somewhere you
didn't expect.

This is **margin collapse**, and it is not a bug. It is a deliberate rule from
the earliest days of CSS, built for a good reason, that surprises absolutely
everyone the first time it bites. Once you can see it, it stops being spooky.

## What margin collapse actually is

When two vertical margins touch, they don't add together. They **collapse** into
a single margin, and that single margin is the larger of the two. Only vertical
margins do this - `margin-top` and `margin-bottom`. Left and right margins never
collapse.

That's the whole rule. The confusion comes entirely from the three different
situations where two vertical margins end up touching.

## Case 1: two stacked elements

The everyday one. Two paragraphs, one after the other:

```css
.bio p {
  margin: 20px 0; /* 20px top and bottom on every bio paragraph */
}
```

```console
first  paragraph  ──────────┐
                            │  margin-bottom: 20px  ┐
                            │                        ├─ these overlap; you get 20px,
second paragraph ───────────┘  margin-top: 20px     ┘   not 40px
```

*What just happened:* the bottom margin of the first paragraph and the top margin
of the second occupy the *same* gap instead of stacking. Both are 20px, so the
gap is 20px. Make one of them 30px and the gap becomes 30px - the larger wins,
the smaller is absorbed into it.

**Why it works this way.** CSS was born for documents - articles, not app
dashboards. Give every paragraph `margin: 1em 0` and, without collapsing, the
space between paragraphs would be `2em` while the space above the first would be
`1em`, so the gaps wouldn't match. Collapsing makes every gap a consistent `1em`.
It was the right call for text, and it's still the behavior you're standing on
every time a stack of paragraphs looks evenly spaced.

## Case 2: the margin that escapes its parent

This is the one that eats an afternoon. Put a heading with a top margin inside a
box that has no padding and no border:

```css
.note        { background: #fff3cd; }       /* no padding, no border */
.note h2     { margin-top: 24px; }
```

You expect 24px of yellow above the heading, inside the box. Instead:

```console
    ↑ 24px of margin, now OUTSIDE the box
┌───────────────────────┐  ← the box starts here, shoved down 24px
│ Before you deploy      │  ← heading jammed against the top, no gap above it
│ Run the migration...   │
└───────────────────────┘
```

*What just happened:* the heading's `margin-top` had nothing between it and the
top edge of the box - no padding, no border - so it collapsed straight *through*
the box's edge and came out the other side. The margin now sits above the box and
pushes the whole thing down. The yellow background doesn't grow to include it,
because margins are always transparent and always outside the element (last
phase). Measure the box and it's 24px shorter than you'd expect, sitting 24px
lower than you'd expect.

⚠️ **The gotcha.** This is why "there's a mysterious gap above my card" and "my
card's background won't fill the space above its title" are the same bug. The
margin you put on the child leaked out of the parent. You'll hunt through the
parent's styles for a padding or a position bug and find nothing, because the
call is coming from the child.

## The fix: give the margin something to touch

The margin escapes only because nothing sits between it and the parent's edge. Put
*anything* there and it can't collapse through. Any one of these fixes it:

```css
.note { padding-top: 1px; }        /* padding between edge and child */
.note { border-top: 1px solid; }   /* a border does it too */
.note { overflow: auto; }          /* establishes a block formatting context */
.note { display: flow-root; }      /* the modern, side-effect-free way */
```

*What just happened:* each of these stops the collapse, and the 24px margin now
sits *inside* the box where you wanted it - the box grows by 24px and its
background fills the gap. `padding-top` and `border-top` work by physically
sitting between the edge and the child. The other two work by a deeper mechanism:

📝 **Block formatting context (BFC).** A BFC is a box that keeps its own layout to
itself - and one of its rules is that its margins do *not* collapse with its
children's. `overflow` (anything but `visible`), `display: flow-root`, and being
a flex or grid item all turn an element into a BFC. That's the single reason all
those different-looking fixes work: they each make the parent a BFC. When you
want to stop parent-child collapse on purpose, `display: flow-root` is the clean
choice - it was added to CSS for exactly this, with none of the side effects that
`overflow` or a fake `1px` border drag along.

## When margins do NOT collapse

Collapsing is a normal-flow behavior. Step outside normal flow and it stops:

- **Flex and grid items don't collapse.** The moment a container is `display: flex`
  or `display: grid`, its children's margins are left alone. Stack two items with
  `margin: 20px 0` in a flex column and you get the full 40px gap.
- **Horizontal margins never collapse** - only `margin-top`/`margin-bottom`.
- **Floated and absolutely-positioned elements don't collapse** their margins with
  anything.

💡 **Key point.** If margins are behaving *predictably* - adding up the way you'd
expect - you're almost always inside a flex or grid container, which is most modern
layout. Margin collapse is a normal-document-flow rule, and the layout systems in
the next guide quietly switch it off.

## Recap

1. Touching vertical margins collapse into one - the larger of the two, never the
   sum. Only `margin-top`/`margin-bottom`, never left/right.
2. Between two stacked siblings, that's why the gap is the bigger margin, not both
   added together. It exists so stacked paragraphs get even spacing.
3. A child's top or bottom margin can collapse straight *through* a parent that has
   no padding or border between them, pushing the whole parent instead of adding
   space inside it.
4. Stop the parent-child version with padding, a border, `overflow`, or the
   purpose-built `display: flow-root` - all of which make the parent a block
   formatting context.
5. Flex and grid items don't collapse margins at all.

Test what you just learned:

```quiz
[
  {
    "q": "Two stacked block elements: the first has `margin-bottom: 30px`, the second has `margin-top: 10px`. What's the gap between them?",
    "choices": ["40px", "30px", "10px"],
    "answer": 1,
    "explain": "Touching vertical margins collapse to the larger of the two. 30 wins; the 10px is absorbed into it."
  },
  {
    "q": "A `div` with a background color but no padding or border wraps an `h2` that has `margin-top: 32px`. Where does the 32px go?",
    "choices": ["Inside the div, as a gap above the h2", "Outside the div, pushing the whole div down 32px", "It's ignored because the div has no height set"],
    "answer": 1,
    "explain": "With nothing between the div's edge and the h2, the margin collapses through the edge and ends up outside, shoving the div down. The background doesn't grow to cover it."
  },
  {
    "q": "Which of these does NOT stop a child's margin from escaping its parent?",
    "choices": ["Adding padding-top to the parent", "Setting the parent to display: flow-root", "Setting margin-top on the parent to 0"],
    "answer": 2,
    "explain": "The escape is about the child's margin touching the parent's edge. Padding, a border, or a block formatting context (flow-root, overflow) all stop it; changing the parent's own margin does nothing."
  }
]
```

---

[← Phase 2: The Box Model](02-the-box-model.md) · [Guide overview](_guide.md) · [Phase 4: Colors, Units, and Typography →](04-colors-units-and-typography.md)
