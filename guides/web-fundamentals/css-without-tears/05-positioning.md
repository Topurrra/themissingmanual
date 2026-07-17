---
title: "Positioning"
guide: "css-without-tears"
phase: 5
summary: "What static, relative, absolute, fixed, and sticky actually reposition an element relative to, worked through a sticky header and a centered modal overlay."
tags: [css, position, sticky, absolute, fixed, relative, modal]
difficulty: beginner
synonyms: ["css position absolute vs relative", "how does position sticky work", "how to center a modal with css", "css position fixed explained"]
updated: 2026-07-06
---

# Positioning

Everything so far has followed normal document flow - each box stacks below the last, in source order.
`position` is how you pull an element out of that flow, or anchor it to something other than "wherever
it landed." Five values, each answering "positioned relative to what?"

## The five values

**`static`** is the default. No repositioning, `top`/`left`/`right`/`bottom` do nothing. Every element
is `static` until you say otherwise.

**`relative`** keeps the element in normal flow - it still takes up its original space - but lets you
nudge it with `top`/`left`/`right`/`bottom`, offset from where it *would* have been.

```css
.badge {
  position: relative;
  top: -4px;
}
```

*What just happened:* `.badge` shifted up 4px visually, but the space it originally occupied in the
layout is still reserved - other elements don't move to fill the gap.

**`absolute`** removes the element from normal flow entirely and positions it relative to its nearest
ancestor that has a `position` other than `static`. If no ancestor qualifies, it falls back to the
`<html>` element - which is almost never what you want, and the most common reason `position: absolute`
"doesn't work."

**`fixed`** positions relative to the browser viewport itself, ignoring scrolling entirely - it stays
glued to the same spot on screen as the page scrolls underneath it.

**`sticky`** behaves like `relative` until the page scrolls past a threshold you set (`top: 0`, for
instance), then it locks in place like `fixed` - but only within its parent's boundaries. Scroll the
parent out of view and the sticky element scrolls away with it.

## Worked example 1: a sticky header

Add a header to your About Me page that stays visible while you scroll the bio text below it.

```css
header {
  position: sticky;
  top: 0;
  background: white;
  padding: 12px 20px;
  border-bottom: 1px solid #ddd;
}
```

*What just happened:* while the page is scrolled to the top, the header sits in normal flow, exactly
where its HTML position puts it. Scroll down, and the moment the header would scroll past `top: 0`, it
sticks there instead - staying visible above the content scrolling underneath. No JavaScript, no manual
scroll-tracking.

⚠️ **The gotcha.** `position: sticky` silently does nothing if any ancestor has `overflow: hidden`,
`overflow: auto`, or a fixed `height` that clips it - the sticky element can't escape a container that
doesn't let its content overflow. If your sticky header refuses to stick, check every parent up the
tree for an `overflow` rule.

## Worked example 2: a centered modal overlay

A modal needs two things: a dark backdrop covering the whole screen, and a centered box on top of it.
This is the pairing that makes `absolute` click - a positioned parent, and an absolutely positioned
child anchored to it.

```html
<div class="modal-backdrop">
  <div class="modal">
    <p>Thanks for visiting my page!</p>
  </div>
</div>
```

```css
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
}

.modal {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  padding: 24px;
  border-radius: 8px;
}
```

*What just happened:* `.modal-backdrop` uses `fixed` to cover the entire viewport regardless of scroll
position, dimmed by a semi-transparent black background. `.modal` uses `absolute`, and because its
parent `.modal-backdrop` has `position: fixed` (not `static`), the modal positions relative to *that*
backdrop instead of falling back to `<html>`. `top: 50%; left: 50%` puts its top-left corner at the
backdrop's center - then `transform: translate(-50%, -50%)` shifts it back by half its own width and
height, so the modal's actual center lands on the backdrop's center, not its corner.

💡 **Key point.** `position: absolute` only does something useful once you've deliberately given some
ancestor a non-static position to anchor to. That pairing - "positioned parent, absolutely positioned
child" - is the pattern behind dropdowns, tooltips, badges on avatars, and modals alike.

## Recap

1. `static` is the default - no offsets apply.
2. `relative` nudges an element while keeping its original space reserved.
3. `absolute` removes the element from flow and anchors it to the nearest non-static ancestor (or
   `<html>` if none exists).
4. `fixed` anchors to the viewport and ignores scrolling.
5. `sticky` is `relative` until a scroll threshold, then behaves like `fixed` within its parent - breaks
   silently under `overflow: hidden` on an ancestor.
6. Centering with `absolute` needs three things together: a positioned parent, `top/left: 50%`, and
   `transform: translate(-50%, -50%)`.

Test what you just learned:

```quiz
[
  {
    "q": "An element has `position: absolute` and none of its ancestors have a position set. What does it position relative to?",
    "choices": ["Its immediate parent, always", "The <html> element", "It stays in normal flow like static"],
    "answer": 1,
    "explain": "absolute anchors to the nearest ancestor with a non-static position. With no qualifying ancestor, it falls back to the html element - the most common cause of absolute positioning behaving unexpectedly."
  },
  {
    "q": "A sticky header isn't sticking - it scrolls away like a normal element. What's the most likely cause?",
    "choices": ["sticky doesn't exist as a real value", "An ancestor has overflow: hidden or auto, which breaks sticky", "top: 0 was set instead of top: 100%"],
    "answer": 1,
    "explain": "position: sticky is silently disabled by an ancestor with overflow set to anything other than visible."
  },
  {
    "q": "Why does the centered modal need `transform: translate(-50%, -50%)` in addition to `top: 50%; left: 50%`?",
    "choices": ["top/left alone centers the element's top-left corner, not its actual center", "transform is required for position: absolute to work at all", "It's purely a decorative animation"],
    "answer": 0,
    "explain": "top: 50%; left: 50% places the corner at the midpoint. Shifting back by half the element's own width and height centers the element itself."
  }
]
```

Positioning moves individual elements around, but it isn't how you build real page layouts - rows,
columns, and grids of content are their own tool. That's
[Flexbox and Grid](/guides/flexbox-and-grid), the natural next guide from here.

---

[← Phase 4: Colors, Units, and Typography](04-colors-units-and-typography.md) · [Guide overview](_guide.md)
