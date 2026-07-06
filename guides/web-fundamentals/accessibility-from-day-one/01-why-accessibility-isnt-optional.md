---
title: "Why Accessibility Isn't Optional"
guide: "accessibility-from-day-one"
phase: 1
summary: "Screen reader users, keyboard-only users, and people with low vision are a normal part of your audience. The four WCAG pillars explain what accessible means, and semantic HTML already covers most of it."
tags: [accessibility, a11y, wcag, semantic-html, web-fundamentals]
difficulty: intermediate
synonyms: ["why does accessibility matter", "what is wcag", "who needs accessible websites", "semantic html accessibility"]
updated: 2026-07-06
---

# Why Accessibility Isn't Optional

Someone using a screen reader doesn't see your page - they hear it, one element at a time, navigating
by jumping between headings, links, and form fields. Someone with a motor impairment doesn't use a
mouse - every interaction goes through a keyboard: Tab to move forward, Shift+Tab to move back, Enter
or Space to activate. Someone with low vision has the page zoomed to 200% or runs a high-contrast mode
that strips your color palette down to black and white. These aren't three rare people. They're a
regular slice of anyone's user base, and building for them is not a separate project bolted onto
"real" development - it's a property of the same HTML and CSS you're already writing.

The business case is straightforward even if you set empathy aside: in the US, the ADA has been
applied to websites in thousands of lawsuits; the EU's Accessibility Act sets similar requirements. But
the mechanical case is more useful day to day - accessible markup is more robust markup. A page that
works without a mouse also works when a mouse driver glitches. A page with real heading structure is
also easier for you to navigate in devtools six months from now.

## The four pillars: POUR

WCAG (Web Content Accessibility Guidelines) organizes every requirement under four principles, nicknamed
POUR:

- **Perceivable** - users must be able to perceive the content through some sense. Text needs enough
  color contrast to read; images need alt text for people who can't see them; video needs captions for
  people who can't hear it.
- **Operable** - users must be able to operate the interface. Every interactive element needs to work
  by keyboard, not just mouse click or touch. Nothing should require a hover gesture with no keyboard
  equivalent.
- **Understandable** - content and interface behavior must be predictable. Form errors need to say what
  went wrong and where. Navigation shouldn't rearrange itself between pages for no reason.
- **Robust** - content must work across browsers, devices, and assistive technology, including tools
  that don't exist yet. This is why standard HTML elements matter more than custom ones: a `<button>`
  works in every screen reader ever built and every one that gets built next year.

Every accessibility rule you'll run into traces back to one of these four. "Add alt text" is
Perceivable. "Make the dropdown keyboard-operable" is Operable. "Don't rely on color alone to show an
error" is Understandable. "Use real HTML elements instead of divs" is Robust.

## Semantic HTML already does the work

The fastest way to fail at accessibility is to rebuild native browser behavior from scratch. The fastest
way to succeed is to not do that. Compare these two buttons:

```html
<button onclick="submitForm()">Submit</button>

<div onclick="submitForm()">Submit</div>
```

The `<button>` is focusable by pressing Tab, activates on both Enter and Space, gets announced by a
screen reader as "Submit, button," and shows a visible focus outline automatically. The `<div>` does
none of that. It's invisible to Tab, silent to a screen reader (announced as nothing, or at best as
plain text with no indication it's clickable), and gives keyboard users no way to activate it at all.
To make the `<div>` match the `<button>`, you'd need to add `tabindex="0"`, a `role="button"`, a
`keydown` handler for both Enter and Space, and manual focus-visible styling - four extra pieces of
code to reinvent something the browser already gives you.

This pattern repeats across HTML:

- `<nav>`, `<main>`, `<header>`, `<footer>` let screen reader users jump straight to a page region
  instead of listening to the whole thing top to bottom.
- A real `<label for="email">` tied to `<input id="email">` means clicking the label focuses the input,
  and a screen reader announces the field's purpose automatically - covered in
  [Forms That Work](/guides/forms-that-work).
- Heading tags (`<h1>` through `<h6>`) in order let a screen reader user pull up a list of headings and
  skip straight to the section they want, the same way a sighted user scans a page visually.
- `<a href>` is keyboard-focusable and announced as a link out of the box; a `<span>` styled to look
  like one is not.

None of this is exotic knowledge - it's the same HTML from
[HTML From Zero](/guides/html-from-zero), used as intended instead of flattened into `<div>`s with
click handlers. The lesson for the rest of this guide: reach for ARIA and custom JavaScript only for
what native HTML genuinely can't do - things like a tab panel, a modal dialog, or a combobox that lack
a direct HTML equivalent. Phase 2 covers exactly that gap.

Quick check before moving on:

```quiz
[
  {
    "q": "Which group does accessible design serve?",
    "choices": ["Only users with permanent disabilities", "A broad range of users, including keyboard-only, low-vision, and screen reader users", "Only users required to comply by law"],
    "answer": 1,
    "explain": "Screen reader users, keyboard-only users, low-vision users, and more are a routine part of any real audience, not an edge case."
  },
  {
    "q": "Which WCAG pillar covers 'every interactive element must work by keyboard'?",
    "choices": ["Perceivable", "Operable", "Robust"],
    "answer": 1,
    "explain": "Operable means users can interact with the page using something other than a mouse - keyboard, switch device, voice control."
  },
  {
    "q": "Why does <button onclick=...> beat <div onclick=...> for accessibility?",
    "choices": ["It looks different in the browser's default styling", "It's keyboard-focusable, activates on Enter/Space, and is announced correctly by screen readers automatically", "Divs cannot run JavaScript"],
    "answer": 1,
    "explain": "A native button gets focus, keyboard activation, and correct screen reader announcement for free. A div needs tabindex, a role, and manual key handling to match it."
  }
]
```

---

[Guide overview](_guide.md) · [Phase 2: ARIA, Focus Management, and Keyboard Navigation →](02-aria-focus-management-and-keyboard-navigation.md)
