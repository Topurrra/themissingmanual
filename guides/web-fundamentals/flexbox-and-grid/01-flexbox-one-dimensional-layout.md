---
title: "Flexbox: One-Dimensional Layout"
guide: "flexbox-and-grid"
phase: 1
summary: "How display: flex lines up boxes along a single axis, with justify-content, align-items, wrapping, and flex-grow/shrink/basis for building a navbar and a row of equal-width cards."
tags: [css, flexbox, justify-content, align-items, flex-wrap, flex-grow]
difficulty: intermediate
synonyms: ["how to use flexbox", "justify-content vs align-items", "flexbox navbar", "flex-grow flex-shrink flex-basis explained", "how to center with flexbox", "equal width cards css"]
updated: 2026-07-06
---

# Flexbox: One-Dimensional Layout

Flexbox arranges children of a container along a single line - a row or a column. That's the whole
premise: one dimension at a time. It's the right tool anytime you're thinking "put these things next
to each other" or "stack these and space them out."

## Turning it on

One property starts it:

```css
.navbar {
  display: flex;
}
```

Every direct child of `.navbar` is now a **flex item**. By default they line up in a row, left to
right, each sized to its own content - no floats, no `inline-block`, no clearfix.

## Main axis vs cross axis

Flexbox thinks in two axes, and almost every property is "along the main axis" or "along the cross
axis":

- **Main axis** - the direction items flow. Row by default (left to right). Set `flex-direction:
  column` to flow top to bottom instead, which swaps which axis is "main."
- **Cross axis** - perpendicular to the main axis. Row layout → cross axis is vertical. Column layout →
  cross axis is horizontal.

```text
flex-direction: row  (default)
┌─────────────────────────────┐
│  [Item] [Item] [Item]   →   │  ← main axis (horizontal)
│    ↕ cross axis (vertical)  │
└─────────────────────────────┘
```

Once that clicks, `justify-content` and `align-items` stop being two properties to memorize and become
one idea applied twice.

## Positioning items: justify-content and align-items

- **`justify-content`** - spacing along the main axis: `flex-start`, `center`, `flex-end`,
  `space-between`, `space-around`.
- **`align-items`** - alignment along the cross axis: `flex-start`, `center`, `flex-end`, `stretch`
  (default).

```css
.navbar {
  display: flex;
  justify-content: space-between; /* push children to opposite ends */
  align-items: center;            /* vertically center them */
}
```

*What just happened:* in a row layout, `justify-content` controls left-right spacing and
`align-items` controls up-down alignment. `space-between` is what makes "logo left, links right" a
one-line fix instead of a positioning puzzle.

💡 **Key point.** "Center a div" - the CSS joke for a decade - is two lines:
```css
.center-me {
  display: flex;
  justify-content: center;
  align-items: center;
}
```

**`align-self`** overrides `align-items` for one specific item, when everyone else stays aligned one
way and a single item needs to sit differently:

```css
.navbar .help-link {
  align-self: flex-end; /* this one link sits low while everything else centers */
}
```

## Build it: a real navbar

The logo-left, links-right navbar, done properly:

```html
<nav class="navbar">
  <div class="logo">Acme</div>
  <ul class="nav-links">
    <li><a href="/">Home</a></li>
    <li><a href="/docs">Docs</a></li>
    <li><a href="/about">About</a></li>
  </ul>
</nav>
```

```css
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
}

.nav-links {
  display: flex;
  gap: 1.5rem;
  list-style: none;
}
```

*What just happened:* the outer `.navbar` flex container pushes `.logo` and `.nav-links` to opposite
ends and centers them vertically. The inner `.nav-links` is *also* a flex container, laying its `<li>`s
out in a row with `gap` for spacing - no margin math, no `:last-child { margin-right: 0 }` cleanup.
Flex containers nest freely; each one only manages its own children.

## Wrapping: flex-wrap

By default, flex items shrink to fit on one line, however cramped that gets. `flex-wrap: wrap` lets
them drop to a new line instead:

```css
.card-row {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}
```

Without `flex-wrap`, five cards in a narrow viewport squeeze into an unreadable sliver. With it, cards
that don't fit flow onto the next row, like text wrapping at the edge of a paragraph.

## Sizing items: flex-grow, flex-shrink, flex-basis

Three properties control how an item's size responds to available space, almost always used through
the `flex` shorthand (`flex-grow flex-shrink flex-basis`):

- **`flex-grow`** - how much of the *leftover* space this item claims, relative to siblings. `0`
  (default) means it won't grow.
- **`flex-shrink`** - how much this item shrinks when there isn't enough space. `1` (default) means it
  shrinks proportionally.
- **`flex-basis`** - the item's starting size before growing/shrinking, like `width` but flex-aware.

## Build it: a row of equal-width cards

```html
<div class="card-row">
  <div class="card">Card 1</div>
  <div class="card">Card 2</div>
  <div class="card">Card 3</div>
</div>
```

```css
.card-row {
  display: flex;
  gap: 1rem;
}

.card {
  flex: 1;
  padding: 1.5rem;
  border: 1px solid #ddd;
  border-radius: 8px;
}
```

*What just happened:* `flex: 1` is shorthand for `flex-grow: 1; flex-shrink: 1; flex-basis: 0%`. Each
card starts at zero width, then grows to fill the row equally - three cards, three equal thirds,
recalculated automatically whether you have three cards or five. Change one card to `flex: 2` and it
claims twice the leftover space of its siblings; a common pattern for a "featured" card that's wider
than the rest.

⚠️ **Gotcha.** `flex: 1` and `width: 33%` look similar but behave differently on resize: percentage
widths are fixed fractions of the container, while `flex: 1` items renegotiate space with their
siblings every time one shrinks, grows, or wraps. For equal-width items in a flex row, `flex: 1` is the
right tool - it rebalances space instead of dividing it once and freezing.

Check your intuition with a quick quiz:

```quiz
[
  {
    "q": "In a default (row) flex container, what does justify-content control?",
    "choices": ["Vertical alignment", "Horizontal spacing along the main axis", "The stacking order of items", "The font size of items"],
    "answer": 1,
    "explain": "justify-content works along the main axis, which is horizontal in a row layout. align-items handles the cross (vertical) axis."
  },
  {
    "q": "Three items each have flex: 1 in a flex row. What happens if you change one to flex: 2?",
    "choices": ["It disappears", "It becomes exactly twice as wide in pixels, always", "It claims roughly twice the leftover space of its siblings", "Nothing, flex-grow is ignored without flex-basis set separately"],
    "answer": 2,
    "explain": "flex-grow values are compared as ratios among siblings sharing the leftover space, not absolute sizes."
  },
  {
    "q": "Your flex row of five cards is unreadable on a narrow screen because they're all squeezed onto one line. What fixes it?",
    "choices": ["flex-direction: column-reverse", "flex-wrap: wrap", "justify-content: space-around", "align-self: stretch"],
    "answer": 1,
    "explain": "flex-wrap: wrap lets items that don't fit flow onto a new line instead of shrinking indefinitely."
  }
]
```

---

[Guide overview](_guide.md) · [Phase 2: CSS Grid: Two-Dimensional Layout →](02-css-grid-two-dimensional-layout.md)
