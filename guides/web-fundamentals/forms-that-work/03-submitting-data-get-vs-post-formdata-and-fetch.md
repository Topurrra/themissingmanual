---
title: "Submitting Data: GET vs. POST, FormData, and Fetch"
guide: "forms-that-work"
phase: 3
summary: "A plain form submit navigates the whole page. preventDefault() plus fetch and FormData sends the same data without leaving the page - and lets you handle server errors gracefully."
tags: [forms, javascript, fetch, formdata, get, post, web-fundamentals]
difficulty: intermediate
synonyms: ["formdata javascript example", "fetch form submit example", "get vs post form method", "prevent default form submit", "handle form submission errors"]
updated: 2026-07-06
---

# Submitting Data: GET vs. POST, FormData, and Fetch

Submit the signup form as-is and the whole page reloads - the browser navigates to a new URL built from
the form's data. That's native form submission, and it still has a place. Most modern apps intercept it
instead, sending the data with `fetch` and updating the page without a reload. Both matter; know when
to reach for which.

## Native submission: GET vs. POST

Every `<form>` has a `method`, and it changes where the data goes:

```html
<form method="get" action="/search">
  <input type="text" name="q">
</form>
```

A `GET` form appends its fields to the URL as a query string: submitting `q=svelte` navigates to
`/search?q=svelte`. That's right for searches and filters - the result is bookmarkable and shareable,
and "search again" is just reloading the URL.

```html
<form method="post" action="/signup">
  <input type="text" name="fullName">
</form>
```

A `POST` form sends the data in the request body instead, invisible in the URL. That's right for
anything that changes state or carries sensitive data - a signup form with a password has no business
appearing in a URL, browser history, or a server access log.

Without JavaScript, either version fully navigates: the browser follows `action`, the server responds
with a new page (or a redirect), and the current page is gone. That's a real, working form with zero
lines of JavaScript - worth remembering when you don't need an SPA-style flow at all.

## Intercepting submission with `preventDefault()`

To keep the user on the page, listen for the form's `submit` event and stop the default navigation:

```js
const form = document.querySelector('form');

form.addEventListener('submit', (event) => {
  event.preventDefault();
  // handle the data yourself from here
});
```

`preventDefault()` stops the browser from navigating anywhere. If you forget it, everything else in
this phase still runs, but the page reloads immediately after, and your JavaScript never gets to react
to the result.

## Building a `FormData` object

`FormData` reads every named field from a form element in one call - no manually grabbing each input by
id:

```js
form.addEventListener('submit', (event) => {
  event.preventDefault();

  const data = new FormData(form);
  console.log(data.get('email'));       // one field
  console.log(Object.fromEntries(data)); // the whole form as a plain object
});
```

`FormData` picks up `name` attributes, not `id` - a field with no `name` is silently skipped, which is
the most common reason "my form data is missing a field" turns out to be a typo'd or missing `name`.
Checkboxes are the other trap: an *unchecked* checkbox sends nothing at all, not `false` - `data.get('agree')`
returns `null` unless the box was checked.

## Sending it with `fetch`

`FormData` can go straight into a `fetch` call as the request body - the browser sets the right
`Content-Type` header automatically:

```js
form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const data = new FormData(form);

  const response = await fetch('/api/signup', {
    method: 'POST',
    body: data,
  });

  if (response.ok) {
    const result = await response.json();
    showSuccess(`Welcome, ${result.name}!`);
  } else {
    const error = await response.json();
    showError(error.message);
  }
});
```

`response.ok` is `true` for any `2xx` status and `false` otherwise - it's the quickest way to branch
between success and failure without checking exact status codes. A `422` with `{"message": "Email
already registered"}` lands in the `else` branch, where `showError` can put that exact message next to
the email field instead of a generic "something went wrong."

If you'd rather send JSON instead of `multipart/form-data` (some APIs expect that), convert first:

```js
const data = new FormData(form);
const json = Object.fromEntries(data);

await fetch('/api/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(json),
});
```

⚠️ **Gotcha.** `fetch` only rejects its promise on a network failure (no connection, DNS failure) - a
`404` or `500` response still resolves normally with `response.ok` set to `false`. Wrap in `try`/`catch`
for the network case, and check `response.ok` separately for the HTTP-status case; missing either one
means some class of failure shows the user nothing at all.

```js
try {
  const response = await fetch('/api/signup', { method: 'POST', body: new FormData(form) });
  if (!response.ok) {
    const error = await response.json();
    showError(error.message);
    return;
  }
  showSuccess('Account created.');
} catch (networkError) {
  showError('Could not reach the server. Check your connection.');
}
```

## Putting the whole form together

```js
const form = document.querySelector('#signup-form');

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (!form.checkValidity()) {
    form.reportValidity(); // triggers the native error bubbles
    return;
  }

  try {
    const response = await fetch('/api/signup', { method: 'POST', body: new FormData(form) });
    const result = await response.json();

    if (response.ok) {
      window.location.href = '/welcome';
    } else {
      showError(result.message);
    }
  } catch {
    showError('Could not reach the server. Check your connection.');
  }
});
```

`form.checkValidity()` runs every constraint from phase 2 (required, pattern, minlength, your custom
`setCustomValidity` calls) in one shot; `reportValidity()` shows the same native bubbles a real submit
would have. Running both before the `fetch` call means the built-in and server checks stay layered
instead of the JavaScript path silently skipping past HTML validation.

Check your understanding:

```quiz
[
  {
    "q": "Why does a signup form use method=\"post\" instead of \"get\"?",
    "choices": ["POST is faster than GET", "GET puts the data in the URL, exposing it in history and logs", "GET forms cannot include a password field"],
    "answer": 1,
    "explain": "GET appends form data to the URL as a query string - fine for a search, unacceptable for a password."
  },
  {
    "q": "What does FormData.get('agree') return if the checkbox was left unchecked?",
    "choices": ["false", "\"\" (empty string)", "null"],
    "answer": 2,
    "explain": "An unchecked checkbox contributes no field at all to FormData, so get() returns null rather than a false value."
  },
  {
    "q": "When does fetch's returned promise reject?",
    "choices": ["On any 4xx or 5xx response", "Only on a network-level failure, like no connection", "Whenever response.ok is false"],
    "answer": 1,
    "explain": "fetch resolves normally even for error status codes - you check response.ok yourself. The promise only rejects on network failures."
  }
]
```

## Where to go next

The form now renders accessibly, validates on both sides, and submits without a page reload. What
happens after the browser gets that response - how it turns HTML, CSS, and the DOM into pixels on
screen in the first place - is the subject of
[How the Browser Renders a Page](/guides/how-the-browser-renders-a-page).

---

[← Phase 2: Validation: Built-in vs. Custom](02-validation-built-in-vs-custom.md) · [Guide overview](_guide.md)
