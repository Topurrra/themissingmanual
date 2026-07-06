---
title: "ARIA, Focus Management, and Keyboard Navigation"
guide: "accessibility-from-day-one"
phase: 2
summary: "ARIA fills the gaps native HTML leaves, but bad ARIA is worse than none. Learn the first rule of ARIA, how tabindex works, why removing focus outlines without a replacement breaks keyboard navigation, and how to trap focus in a modal."
tags: [accessibility, aria, tabindex, focus, keyboard-navigation, web-fundamentals]
difficulty: intermediate
synonyms: ["what is aria", "tabindex explained", "how to trap focus in a modal", "keyboard accessible modal", "outline none accessibility"]
updated: 2026-07-06
---

# ARIA, Focus Management, and Keyboard Navigation

ARIA (Accessible Rich Internet Applications) is a set of HTML attributes that describe roles, states,
and properties to assistive technology - things like `role`, `aria-label`, and `aria-expanded`. It
exists for one reason: some UI patterns have no native HTML equivalent. A tab panel, a modal dialog, a
combobox, a live chat notification - HTML has no `<tab-panel>` tag, so ARIA fills in what a screen
reader needs to announce.

## The first rule of ARIA

**No ARIA is better than bad ARIA.** If a native element already does what you need, use it instead of
faking it with ARIA on a `<div>`. This isn't a style preference - a native `<button>` gets keyboard
support, focus handling, and correct announcement built into the browser. Recreate it with
`<div role="button">`, and you've taken on the job of manually adding everything the browser used to
do for you: a `tabindex`, a `keydown` handler for Enter and Space, and focus styling. Miss any one of
those and you've shipped something that announces as a button but doesn't act like one - arguably worse
than a plain unstyled `<div>`, because a screen reader user now expects button behavior and doesn't get
it.

Before reaching for `role="button"`, `role="link"`, or `role="checkbox"`, check whether `<button>`,
`<a>`, or `<input type="checkbox">` already does the job. It almost always does. Save ARIA for what HTML
genuinely lacks.

## tabindex: 0, -1, and why positive numbers are a trap

`tabindex` controls whether an element can receive keyboard focus and where it sits in the tab order.

- **`tabindex="0"`** - makes an element focusable in the natural DOM order, wherever it sits in the
  document. Use this on a custom interactive element (like a `<div>` acting as a tab, if you truly can't
  use a native element) so it joins the tab sequence like everything else.
- **`tabindex="-1"`** - removes an element from the natural Tab order but leaves it focusable
  programmatically, via `element.focus()` in JavaScript. Use this for things like a modal's heading,
  which you want to move focus to when it opens, but which no one should reach by tabbing.
- **Positive values (`tabindex="1"`, `"2"`, etc.)** - force a specific tab order, overriding the DOM.
  Avoid these. They create a second, invisible ordering that has to be kept in sync by hand every time
  the page changes, and one forgotten update produces a tab order that jumps around unpredictably. If
  elements tab in the wrong order, the fix is almost always to move them in the HTML, not to patch the
  order with numbers.

```html
<!-- Focusable in natural order -->
<div tabindex="0" role="tab">Settings</div>

<!-- Focusable only via JS, e.g. modal.focus() on open -->
<h2 tabindex="-1" id="modal-title">Confirm deletion</h2>
```

## Visible focus styles are not optional

Every browser ships a default focus outline - that blue (or platform-specific) ring around whatever
element currently has keyboard focus. It's the only way a keyboard user tracks where they are on the
page. Removing it without a replacement is one of the most common accessibility regressions:

```css
/* Don't ship this */
:focus {
  outline: none;
}
```

That single rule makes a page silently unusable by keyboard: buttons still work when Tabbed to and
activated, but the user has no visual signal of which one is about to fire. If the default outline
clashes with a design, replace it - don't delete it:

```css
:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}
```

`:focus-visible` (rather than `:focus`) matters here too - it shows the ring for keyboard navigation but
skips it for mouse clicks, which is why modern sites don't flash an outline every time you click a
button with a mouse.

## Trapping focus in a modal

Open a modal dialog and Tab should cycle through the elements inside it - not escape into the page
behind it. Without this, a keyboard user can tab straight past the dialog into background content they
can't even see, because the modal is covering it visually while the DOM tab order ignores that.

```html
<div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
  <h2 id="modal-title" tabindex="-1">Delete this file?</h2>
  <button id="cancel-btn">Cancel</button>
  <button id="confirm-btn">Delete</button>
</div>
```

```js
const modal = document.querySelector('.modal');
const focusable = modal.querySelectorAll('button, [href], input, [tabindex]:not([tabindex="-1"])');
const first = focusable[0];
const last = focusable[focusable.length - 1];

document.getElementById('modal-title').focus(); // move focus in on open

modal.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();

  if (e.key !== 'Tab') return;

  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
});
```

Three things happen here: focus moves into the modal the moment it opens (so a screen reader announces
the dialog immediately), Tab and Shift+Tab wrap around inside the modal instead of leaking out, and
Escape closes it - a keyboard user's expected shortcut for dismissing any dialog. When the modal closes,
return focus to whatever element opened it, so the user picks up where they left off instead of landing
back at the top of the page.

`aria-modal="true"` combined with `role="dialog"` tells assistive technology to treat everything outside
the modal as inert while it's open - screen readers won't navigate into background content, matching
what the focus trap does for keyboard users.

Try it yourself:

```quiz
[
  {
    "q": "What's the first rule of ARIA?",
    "choices": ["Add ARIA to every interactive element for safety", "No ARIA is better than bad ARIA - use a native element instead when one exists", "ARIA should replace all semantic HTML"],
    "answer": 1,
    "explain": "A native element like <button> already handles focus, keyboard activation, and correct announcement. Recreating it with ARIA on a div means manually replicating all of that correctly."
  },
  {
    "q": "Why should you avoid positive tabindex values (1, 2, 3...)?",
    "choices": ["They are not supported in most browsers", "They create a separate manual tab order that has to be kept in sync by hand and easily breaks", "They make elements unfocusable"],
    "answer": 1,
    "explain": "Positive tabindex overrides the natural DOM order with numbers you must maintain yourself - one missed update produces an unpredictable tab sequence."
  },
  {
    "q": "What's wrong with `:focus { outline: none; }` and no replacement?",
    "choices": ["It slows down page rendering", "It removes the only visual cue keyboard users have for where focus currently is", "It breaks screen readers"],
    "answer": 1,
    "explain": "The focus outline is how a keyboard-only user tracks their position on the page. Removing it without a visible replacement makes the page unusable without a mouse."
  }
]
```

---

[← Phase 1: Why Accessibility Isn't Optional](01-why-accessibility-isnt-optional.md) · [Guide overview](_guide.md) · [Phase 3: Testing with a Screen Reader and Automated Tools →](03-testing-with-a-screen-reader-and-automated-tools.md)
