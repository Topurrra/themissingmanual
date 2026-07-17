---
title: "Colors, Units, and Typography"
guide: "css-without-tears"
phase: 4
summary: "Hex, rgb, and hsl color syntax, why rem is the right default unit for font sizes because it respects the user's browser settings, and the line-height mistake that makes text feel cramped."
tags: [css, colors, units, rem, em, typography, line-height, accessibility]
difficulty: beginner
synonyms: ["rem vs px vs em", "css color formats explained", "why use rem for font size", "line-height default too small"]
updated: 2026-07-06
---

# Colors, Units, and Typography

Your About Me page has structure and boxes now, but every measurement so far has been an arbitrary
pixel number, and every color has been a name or a hex code you didn't think about. This phase is about
choosing those numbers on purpose - what unit to reach for, and why the "obvious" choice for font size
is usually the wrong one.

## Three ways to write a color

```css
h1 { color: #1a1a2e; }
h1 { color: rgb(26, 26, 46); }
h1 { color: hsl(240, 28%, 14%); }
```

All three produce the exact same dark navy. **Hex** (`#1a1a2e`) packs red, green, and blue into
pairs of hexadecimal digits (00-ff each) - compact, and what design tools usually hand you. **rgb()**
spells out the same three channels in plain decimal (0-255) - easier to read and to tweak one channel
at a time. **hsl()** uses hue (0-360, a position on the color wheel), saturation (0-100%), and lightness
(0-100%) - the one that matches how humans actually think about color: "same hue, but darker" is a
one-number change in hsl, not a hex-code guessing game.

Both `rgb()` and `hsl()` accept a fourth value for transparency: `rgb(26, 26, 46, 0.5)` is the same
navy at 50% opacity.

📝 **Terminology.** `background-color` paints the padding and content area (not margin - margin is
always transparent, per Phase 2). `color` sets text color. The two names look alike but control
different things.

## px, %, em, and rem

```css
.tagline {
  font-size: 18px;
  padding: 1em;
  width: 90%;
}
```

**`px`** is an absolute pixel. Predictable, but fixed - it ignores any font-size preference the reader
set in their own browser.

**`%`** is relative to the parent element's corresponding size - `width: 90%` means 90% of the parent's
width.

**`em`** is relative to the *current element's own* `font-size`. This makes `em` compound: if a parent
has `font-size: 20px` and a child has `padding: 1em`, that's 20px of padding. But if the child also sets
its own `font-size: 1.5em`, later `em` values on that same child are relative to the *new* size, and
nested `em` values multiply through the tree - which is exactly why deeply nested `em` sizing gets
confusing fast.

**`rem`** ("root em") is always relative to the root `<html>` element's font-size, ignoring how deeply
nested you are. No compounding, no surprises.

⚠️ **The gotcha.** `em` for font-size specifically is the one that bites people: three levels of nested
`em` font-sizes multiply together, and a "small" 0.9em on each level quietly shrinks to illegibly tiny
text by the fourth generation. `rem` doesn't have this problem because it never looks at its parent.

💡 **Key point.** Use `rem` as your default for font sizes. Browsers let users set a base font size
(commonly for low vision or personal preference) and `rem` values scale with that setting automatically -
`px` font sizes stay locked at whatever you hard-coded, ignoring the reader's accessibility settings
entirely. `rem` is also the right choice for most spacing (`margin`, `padding`) so your layout scales
proportionally if the base size ever changes. `%` still earns its place for widths relative to a
container, and `px` is fine for things that should never scale, like a 1px border.

```css
html { font-size: 100%; }        /* respects the browser/OS default, usually 16px */
h1   { font-size: 2rem; }         /* 32px, unless the reader changed their base size */
p    { font-size: 1rem; }         /* 16px, same logic */
```

## Font stacks: always have a fallback

```css
body {
  font-family: "Helvetica Neue", Arial, sans-serif;
}
```

*What just happened:* the browser tries "Helvetica Neue" first. If that font isn't installed - common on
Windows and Linux, where it usually isn't - it falls back to Arial, then to the browser's generic
sans-serif if neither exists. A font-family without a fallback chain means some fraction of your readers
silently get the browser's default serif font instead of your design.

The last entry should always be a generic family: `serif`, `sans-serif`, `monospace`. That's the
guaranteed floor - every browser has one.

## line-height: the cramped-text mistake

```css
p {
  font-size: 1rem;
  line-height: 1.6;
}
```

`line-height` sets the vertical space a line of text occupies - effectively the gap between baselines.
Leave it unset and browsers use a default around 1.1-1.2, which is fine for a single short line and
cramped for a paragraph. Multi-line body text with tight line-height is measurably harder to read: the
eye has trouble tracking back to the start of the next line.

⚠️ **The gotcha.** Beginners either leave `line-height` at the browser default (too tight for paragraphs)
or set it in `px` (which stops scaling if `font-size` changes, defeating the point). Use a unitless
number like `1.5` or `1.6` - it's a *multiplier* of the element's own font-size, so it scales
automatically if the font-size ever changes, including via a reader's `rem`-driven base font setting.

## Recap

1. Hex, rgb(), and hsl() all describe the same colors - hsl() is easiest to reason about when adjusting
   one property like lightness.
2. `px` is fixed, `%` is relative to the parent, `em` is relative to the current element's own font-size
   (and compounds when nested), `rem` is relative to the root and never compounds.
3. Default to `rem` for font sizes - it respects the reader's browser font-size setting, which `px`
   ignores.
4. Always give `font-family` a fallback chain ending in a generic family.
5. Set `line-height` explicitly, as a unitless multiplier like `1.5`, or paragraphs read as cramped.

Test what you just learned:

```quiz
[
  {
    "q": "Why is rem usually the better default than px for font-size?",
    "choices": ["rem renders faster in the browser", "rem scales with the reader's browser font-size setting; px ignores it", "rem is shorter to type"],
    "answer": 1,
    "explain": "px locks text at a fixed size regardless of accessibility settings. rem respects the root font-size, which the reader can change."
  },
  {
    "q": "A child element has `font-size: 1.5em` and its parent also has `font-size: 1.5em` relative to a 16px root. What is the child's actual font-size?",
    "choices": ["24px", "36px", "16px"],
    "answer": 1,
    "explain": "em compounds: parent is 16 * 1.5 = 24px, child is 24 * 1.5 = 36px. This is the nested-em trap rem avoids."
  },
  {
    "q": "Paragraph text looks visually cramped with lines almost touching. What's the likely fix?",
    "choices": ["Increase font-size only", "Set line-height to a unitless value like 1.5 or 1.6", "Switch font-family to a monospace font"],
    "answer": 1,
    "explain": "The browser's default line-height (around 1.1-1.2) is too tight for multi-line body text. A unitless line-height like 1.5 fixes it and scales with font-size."
  }
]
```

---

[← Phase 3: Margin Collapse](03-margin-collapse.md) · [Guide overview](_guide.md) · [Phase 5: Positioning →](05-positioning.md)
