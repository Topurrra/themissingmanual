---
title: "Testing with a Screen Reader and Automated Tools"
guide: "accessibility-from-day-one"
phase: 3
summary: "Turn on VoiceOver or NVDA and tab through a real page to hear what a screen reader user hears. Then add Lighthouse and axe - automated tools that catch about a third of issues, which is why manual testing still matters."
tags: [accessibility, screen-reader, voiceover, nvda, lighthouse, axe, testing, web-fundamentals]
difficulty: intermediate
synonyms: ["how to test with a screen reader", "voiceover keyboard shortcuts", "nvda tutorial", "lighthouse accessibility audit", "axe devtools"]
updated: 2026-07-06
---

# Testing with a Screen Reader and Automated Tools

Reading about accessibility only goes so far. The fastest way to understand what's broken is to close
your eyes, or at least your assumptions about a mouse, and use a screen reader on your own page for five
minutes.

## VoiceOver on Mac

VoiceOver ships with every Mac. Turn it on with `Cmd+F5` (or ask Siri: "turn on VoiceOver"). It starts
narrating immediately - the interface, then whatever's under your cursor.

Basic navigation once it's on:

- **Tab** - move to the next focusable element (buttons, links, form fields).
- **VO+Right Arrow / VO+Left Arrow** (VO = Control+Option, held together) - move to the next or previous
  item, focusable or not, reading everything on the page in order.
- **VO+Space** - activate the current item, like a click.
- **VO+U** - open the rotor, a menu that lists all headings, links, or form controls on the page so you
  can jump directly to one.
- **Cmd+F5** - turn VoiceOver back off.

Load a real page you've built, turn on VoiceOver, and Tab through it. Listen for: buttons announced
as "button" (not silence, not just the label with no role), images with meaningful alt text instead of
"image" or the filename, and form fields that announce their label, not just "edit text."

## NVDA on Windows

NVDA is a free, open-source screen reader - download it from nvaccess.org. Launch it and it starts
narrating right away.

Basic navigation:

- **Tab / Shift+Tab** - move forward/backward through focusable elements.
- **Down Arrow** (in browse mode, NVDA's default for reading web pages) - move to the next line or
  element, read aloud.
- **H** - jump to the next heading; **1** through **6** jump to a heading of that specific level.
- **F** - jump to the next form field.
- **Insert+Q** - quit NVDA.

Same exercise: Tab through your page and listen. A well-marked-up page announces its structure without
you doing anything special - that's the semantic HTML from Phase 1 paying off. A `<div>`-and-`<span>`
page announces nothing useful: no roles, no labels, just streams of plain text.

## What to listen for

- Every interactive element announces a role ("button," "link," "checkbox, not checked") - not silence.
- Every image either has descriptive alt text or, if purely decorative, an empty `alt=""` so the screen
  reader skips it instead of reading a useless filename.
- Every form field announces its label before its type ("Email, edit text," not just "edit text").
- Headings are in a sensible order (`h1` then `h2` then `h3`, not jumping from `h1` to `h4`), because
  that's what a screen reader user's heading-jump list is built from.

## Automated tools: fast, but partial

**Lighthouse** ships in Chrome DevTools (Lighthouse tab → run an audit → check "Accessibility"). **axe
DevTools** is a free browser extension from Deque that does a similar scan with often more detail per
issue. Both crawl the DOM and flag things like missing alt text, insufficient color contrast, form
inputs without labels, and invalid ARIA usage. Run one before every release - they take seconds and
catch real, common mistakes.

Their real limit: automated accessibility testing catches roughly a **third** of WCAG issues. A tool can
check whether an image has an `alt` attribute; it cannot judge whether the alt text actually describes
the image, or whether a modal's focus trap actually works, or whether a custom dropdown responds
correctly to arrow keys. Those need a human - ideally with a keyboard and a screen reader, doing exactly
what Phases 2 and 3 walked through.

Treat automated tools as a floor, not a finish line: run Lighthouse or axe on every page as a fast
regression check, then manually tab through and listen to anything genuinely interactive - forms,
modals, custom widgets, navigation menus. That combination catches what either approach misses alone.

Last check for this guide:

```quiz
[
  {
    "q": "What keyboard shortcut turns VoiceOver on/off on a Mac?",
    "choices": ["Cmd+F5", "Ctrl+Alt+V", "Cmd+Shift+A"],
    "answer": 0,
    "explain": "Cmd+F5 toggles VoiceOver on macOS. NVDA on Windows is a separate download from nvaccess.org."
  },
  {
    "q": "Roughly what proportion of accessibility issues do automated tools like Lighthouse and axe catch?",
    "choices": ["Nearly all of them", "About a third", "None - they only check performance"],
    "answer": 1,
    "explain": "Automated scanners catch structural issues (missing alt, bad contrast, missing labels) but can't judge whether alt text is meaningful or whether a focus trap actually works - roughly a third of real issues, by common estimates."
  },
  {
    "q": "Why still test manually with a screen reader if you already ran Lighthouse?",
    "choices": ["Lighthouse doesn't run in Chrome", "Lighthouse can't judge things like whether alt text is meaningful or a custom widget behaves correctly with a keyboard", "Manual testing is faster than automated testing"],
    "answer": 1,
    "explain": "Automated tools check for the presence of attributes, not their quality or actual keyboard/screen-reader behavior. Interactive widgets especially need a human pass."
  }
]
```

Accessibility habits carry into the next layer of the stack, too - where you store data affects who can
use your site. See [Browser Storage and Cookies](/guides/browser-storage-and-cookies) for how
`localStorage`, `sessionStorage`, and cookies work, including the consent and privacy angles that come
with them.

---

[← Phase 2: ARIA, Focus Management, and Keyboard Navigation](02-aria-focus-management-and-keyboard-navigation.md) · [Guide overview](_guide.md)
