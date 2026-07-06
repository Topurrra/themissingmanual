---
title: "Events: Listening, Bubbling, and Delegation"
guide: "the-dom-explained"
phase: 3
summary: "How addEventListener and the event object work, why events bubble from child to parent, and how to use that to handle a whole list of items with a single delegated listener."
tags: [dom, javascript, web-fundamentals, events, event-delegation, event-bubbling]
difficulty: intermediate
synonyms: ["addeventlistener example", "event bubbling explained", "what is event delegation", "javascript event object", "how to remove list item with one listener"]
updated: 2026-07-06
---

# Events: Listening, Bubbling, and Delegation

Every click, keystroke, and page load fires an **event** - an object the browser creates and sends
through the DOM. `addEventListener` is how you tell an element "run this function when that happens."

```js
const button = document.querySelector('.card-btn');

button.addEventListener('click', (event) => {
  console.log('clicked', event.target);
});
```

The callback receives an **event object**. `event.target` is the exact element that triggered it -
useful the moment more than one element shares a listener, which is where this phase is headed.
`event.preventDefault()` stops the browser's default action (a link navigating, a form submitting).
`event.stopPropagation()` stops the event from continuing its journey through the DOM - which requires
knowing what that journey is.

## Bubbling: events climb the tree

Click a `<button>` inside a `<li>` inside a `<ul>`, and the click doesn't fire only on the button. It
fires on the button, then the `<li>`, then the `<ul>`, then `<body>`, all the way up to `document` - each
ancestor gets a turn. This is **bubbling**, and it's the default for almost every event type.

```html
<ul id="menu">
  <li><button>Settings</button></li>
</ul>
```

```js
document.querySelector('ul').addEventListener('click', (event) => {
  console.log('ul saw a click on', event.target.tagName); // BUTTON
});
```

The listener is on `<ul>`, but it still fires when you click the `<button>` inside it, because the click
bubbled up. `event.target` tells you what was actually clicked; `event.currentTarget` (or `this` in a
non-arrow function) tells you which element the listener is attached to - here, always the `<ul>`.

This matters because it means you don't need a listener on every single descendant to react to clicks
inside it. One listener on a shared parent catches everything below it.

## Delegation: one listener instead of many

Take a to-do list where each item has a "remove" button:

```html
<ul id="todo-list">
  <li>Buy milk <button class="remove-btn">×</button></li>
  <li>Walk the dog <button class="remove-btn">×</button></li>
  <li>Write guide <button class="remove-btn">×</button></li>
</ul>
```

The naive approach attaches a listener to every button:

```js
document.querySelectorAll('.remove-btn').forEach(btn => {
  btn.addEventListener('click', (event) => {
    event.target.closest('li').remove();
  });
});
```

This works, until an item gets added later - a new `<li>` built with `createElement` and appended.
Its button has no listener, because the `forEach` above only ran once, before that button existed. You'd
have to remember to re-attach a listener every time the list changes.

**Event delegation** fixes this by putting one listener on the parent `<ul>` and using bubbling to catch
clicks from any child, present now or added later:

```js
const list = document.querySelector('#todo-list');

list.addEventListener('click', (event) => {
  if (event.target.matches('.remove-btn')) {
    event.target.closest('li').remove();
  }
});
```

One listener, attached once, handles every item forever - including ones that don't exist yet. Add a
new `<li>` with a `.remove-btn` inside it at any point, and the click still bubbles up to the same `<ul>`
listener, which still fires. `event.target.matches('.remove-btn')` filters for the button specifically,
since the listener also fires for clicks on the `<li>` text itself. `.closest('li')` walks up from the
clicked button to find the containing list item, so it removes the right one regardless of how deep the
button is nested.

## Why delegation wins

- **Fewer listeners, less memory** - one instead of one-per-item, which matters on long lists.
- **Works for elements added later** - no re-binding step, no missed items, no memory leaks from
  listeners on removed elements that never got cleaned up.
- **Less code to maintain** - add a new item type to the list, and it's covered automatically as long as
  it bubbles to the same parent.

Delegation isn't universal - some events don't bubble at all (`focus`, `blur`, and `scroll` behave
differently), and for a handful of static elements a direct listener is simpler and clearer. For any
list that grows, shrinks, or gets rebuilt dynamically, delegate to the parent by default.

Check your understanding:

```quiz
[
  {
    "q": "In event delegation, why does the parent's listener still fire for an item added to the list after page load?",
    "choices": ["The browser automatically re-scans the DOM every second", "The click event bubbles up from the new item to the parent, where the listener already lives", "New elements always inherit the listeners of their siblings"],
    "answer": 1,
    "explain": "The listener sits on the parent, not the item. Bubbling carries the click event up to the parent regardless of when the clicked child was added."
  },
  {
    "q": "In a delegated click listener on a <ul>, what does event.target refer to?",
    "choices": ["Always the <ul> itself", "The specific element that was actually clicked, wherever it is inside the <ul>", "The first <li> in the list"],
    "answer": 1,
    "explain": "event.target is the original element the event started on. event.currentTarget is the element the listener is attached to - the <ul>, in this case."
  },
  {
    "q": "Why not just attach a separate click listener to every .remove-btn when the list can grow?",
    "choices": ["It's technically impossible in JavaScript", "New buttons added later won't have a listener unless you remember to re-attach one to them", "It would be a syntax error"],
    "answer": 1,
    "explain": "Per-item listeners only cover elements that existed when you attached them. Anything added afterward is silently unhandled unless you re-run the binding code."
  }
]
```

Next: getting user input right. [Forms That Work](/guides/forms-that-work) covers form elements, validation, and submission - the DOM concepts from this guide apply directly once you're listening for `input` and `submit` events instead of `click`.

---

[← Phase 2: Selecting and Modifying Elements](02-selecting-and-modifying-elements.md) · [Guide overview](_guide.md)
