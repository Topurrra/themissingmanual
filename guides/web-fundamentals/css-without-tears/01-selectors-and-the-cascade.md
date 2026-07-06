---
title: "Selectors and the Cascade"
guide: "css-without-tears"
phase: 1
summary: "How CSS decides which rule wins when two rules target the same element, what properties inherit from parent to child, and when !important is legitimate versus a code smell."
tags: [css, selectors, specificity, cascade, inheritance, important]
difficulty: beginner
synonyms: ["css specificity explained", "why isn't my css style applying", "what does important do in css", "does css inherit"]
updated: 2026-07-06
---

# Selectors and the Cascade

Here's your About Me page right now:

```html
<body>
  <h1>Nikola Petrova</h1>
  <p class="tagline">Backend developer, coffee enthusiast, occasional hiker.</p>
  <p id="intro">I build APIs for a living and break them for fun on weekends.</p>
  <a href="mailto:nikola@example.com">Email me</a>
</body>
```

Default browser styling: black serif text, blue underlined link, no spacing worth mentioning. Every
change from here starts with a CSS rule - a selector telling the browser *which* elements to touch, and
a declaration telling it *what* to change.

```css
h1 {
  color: #1a1a2e;
}
```

This says: find every `h1`, make its text that color. `h1` is the selector, `color: #1a1a2e` is the
declaration. Simple until two rules disagree about the same element - which is where most CSS confusion
actually comes from.

## Selector types

**Element selectors** target a tag name: `p { }` hits every paragraph. Good for broad defaults.

**Class selectors** target a `class` attribute, written with a dot: `.tagline { }` hits only elements
with `class="tagline"`. Classes are reusable - put the same class on ten elements, style them all at
once.

**ID selectors** target an `id` attribute, written with a hash: `#intro { }` hits the one element with
`id="intro"`. IDs must be unique per page, so this only ever matches one thing.

**Attribute selectors** target an attribute directly, no class or ID needed:
`a[href^="mailto:"] { }` matches any link whose `href` starts with `mailto:`. Useful for styling
external links, specific input types, or anything else identifiable by its HTML attributes without
adding a class.

```css
p { line-height: 1.6; }
.tagline { font-style: italic; }
#intro { font-weight: bold; }
a[href^="mailto:"] { color: #d64550; }
```

*What just happened:* every `<p>` got more breathing room between lines. The tagline paragraph also got
italics, because it has both a `p` rule and a `.tagline` rule applying to it - CSS doesn't pick one, it
merges every rule that matches. The intro paragraph got bold on top of its line-height. The email link
turned red because its `href` matches the attribute selector.

## The cascade: what wins when rules conflict

Merging rules is fine until two rules set the *same* property on the *same* element with different
values. Say your stylesheet has both:

```css
p { color: black; }
.tagline { color: gray; }
```

The tagline paragraph matches both. Gray wins. Not because it's written second - because a class is more
specific than an element selector, and **more specific wins**. That's the entire rule. Specificity is a
pecking order, roughly:

1. Inline `style="..."` attributes (most specific)
2. IDs (`#intro`)
3. Classes, attribute selectors, pseudo-classes (`.tagline`, `[href]`, `:hover`)
4. Element selectors (`p`, `h1`)

An ID beats any number of classes. A class beats any number of element selectors. If two rules have
equal specificity, the one later in the stylesheet wins - order only matters as a tiebreaker, not a
first resort.

💡 **Key point.** Don't count specificity points like a scoring game. Remember the pecking order:
inline beats ID beats class beats element. When a style refuses to apply, check whether something more
specific is overriding it - that's the fix in nearly every case.

⚠️ **The gotcha.** `!important` jumps the entire queue - it beats specificity, not just ties with it.
```css
p { color: black !important; }
```
This wins over the ID and the inline style both. That's exactly the problem: once you reach for
`!important`, the only way to override it later is another `!important`, and now you're in an arms race.
Legitimate uses are narrow - overriding a third-party library's inline styles you can't edit, or a
utility class that must always win regardless of context. Reaching for it because you can't figure out
why your selector lost is a code smell: fix the specificity instead.

## Inheritance: some properties pass down, some don't

Some CSS properties inherit from parent to child automatically. Set `color` on `<body>` and every
paragraph, heading, and span inside it inherits that color unless something overrides it. Text-related
properties inherit: `color`, `font-family`, `font-size`, `line-height`, `text-align`.

Box- and layout-related properties don't inherit: `border`, `margin`, `padding`, `background`, `width`.
That's deliberate - if `border` inherited, setting a border on `<body>` would put a border around every
element on the page.

```css
body {
  color: #333;
  font-family: Georgia, serif;
  border: 1px solid red;
}
```

*What just happened:* every piece of text on the page turned dark gray and switched to Georgia -
`color` and `font-family` inherited straight down. Only `<body>` itself got the red border, because
`border` doesn't inherit.

📝 **Terminology.** If you ever need to force inheritance on a property that doesn't do it by default,
the value `inherit` does that explicitly: `border: inherit;` copies the parent's border. Rare, but it
exists for exactly this case.

## Recap

1. Element, class, ID, and attribute selectors each target elements differently - classes are the
   workhorse for reusable styling.
2. When rules conflict, the more specific selector wins: inline > ID > class > element. Order only
   breaks ties between equal specificity.
3. `!important` overrides specificity entirely - save it for overriding styles you can't otherwise
   touch, not for winning an argument with your own stylesheet.
4. Text properties (`color`, `font-family`, `line-height`) inherit down the tree. Box properties
   (`border`, `margin`, `padding`) don't.

Test what you just learned:

```quiz
[
  {
    "q": "A paragraph has both `p { color: black; }` and `.tagline { color: gray; }` applied. What color is it?",
    "choices": ["black, because element selectors are checked first", "gray, because a class is more specific than an element selector", "It depends on which rule appears first in the file"],
    "answer": 1,
    "explain": "Classes outrank element selectors regardless of order. Order only breaks ties between rules of equal specificity."
  },
  {
    "q": "Which of these inherits from a parent to its children by default?",
    "choices": ["border", "margin", "color", "padding"],
    "answer": 2,
    "explain": "Text-related properties like color, font-family, and line-height inherit. Box-model properties like border, margin, and padding do not."
  },
  {
    "q": "Why is `!important` considered a code smell when overused?",
    "choices": ["It's slower for the browser to process", "It breaks the normal specificity order, so future overrides need another !important", "It only works on class selectors"],
    "answer": 1,
    "explain": "Once a rule uses !important, only another !important can override it - that escalation is what makes stylesheets hard to maintain."
  }
]
```

---

[Guide overview](_guide.md) · [Phase 2: The Box Model →](02-the-box-model.md)
