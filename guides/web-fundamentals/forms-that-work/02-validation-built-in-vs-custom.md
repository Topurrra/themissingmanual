---
title: "Validation: Built-in vs. Custom"
guide: "forms-that-work"
phase: 2
summary: "HTML validates form fields for free with required, pattern, and type checks - but password confirmation and server-side checks like 'is this email taken' still need JavaScript."
tags: [forms, html, validation, constraint-validation-api, css, javascript, web-fundamentals]
difficulty: intermediate
synonyms: ["html form validation attributes", "constraint validation api explained", "checkValidity vs setCustomValidity", "css valid invalid pseudo class", "when do i need javascript form validation"]
updated: 2026-07-06
---

# Validation: Built-in vs. Custom

The browser already knows how to reject a blank required field or a malformed email - no JavaScript
needed. The signup form from phase 1 gets that validation almost free. What it can't do alone is check
whether two passwords match or whether an email is already taken. That split is the whole story of this
phase.

## Built-in validation attributes

A handful of HTML attributes turn on checks the browser enforces before it lets the form submit:

```html
<input type="text" name="fullName" required minlength="2">
<input type="email" name="email" required>
<input type="password" name="password" required minlength="8"
       pattern="(?=.*\d)(?=.*[a-z]).{8,}"
       title="At least 8 characters, including a number">
```

- **`required`** - the field can't be empty (or unchecked, for a checkbox).
- **`minlength` / `maxlength`** - character count bounds for text-like inputs.
- **`type="email"`** - rejects values without a plausible `name@domain` shape.
- **`pattern`** - a regular expression the value must fully match. Here it demands 8+ characters with at
  least one digit and one lowercase letter. The `title` attribute supplies the message some browsers
  show on failure.

Try submitting the form with an empty name field, and Chrome or Firefox pops a native "Please fill out
this field" bubble pointing right at it - the page never reloads, no code ran. That's the browser's
Constraint Validation engine doing its job before your form even touches the network.

⚠️ **Gotcha.** `pattern` matches the *entire* value, not a substring search. Forgetting to anchor
mentally trips people up less than forgetting that a pattern like `\d{3}` will fail on `"abc123abc"`
unless you meant it to match anywhere - always test with `.test()` in the console before shipping.

## Styling valid and invalid states

CSS reads these same constraints through the `:valid` and `:invalid` pseudo-classes, updating live as
the user types:

```css
input:invalid {
  border-color: #d33;
}

input:valid {
  border-color: #2a2;
}

input:placeholder-shown:invalid {
  border-color: initial; /* don't shame an empty field the user hasn't touched yet */
}
```

That last rule matters: every empty `required` field is `:invalid` by default, so without it every input
shows red before the user has typed anything. `:placeholder-shown` is a decent proxy for "still empty" -
combine it with `:invalid` to only flag fields the user actually got wrong.

## The Constraint Validation API

Attributes cover most cases; the Constraint Validation API is the JavaScript layer underneath them, for
when you need more control over *when* and *how* errors show.

```js
const password = document.getElementById('password');

if (password.checkValidity()) {
  console.log('Password meets the pattern and minlength.');
} else {
  console.log(password.validationMessage);
}
```

`checkValidity()` runs the same checks the browser runs on submit and returns `true`/`false`.
`validationMessage` holds the browser's human-readable explanation for the first failing rule.

`setCustomValidity()` lets you inject your own rule into that same system:

```js
const confirmField = document.getElementById('confirmPassword');

confirmField.addEventListener('input', () => {
  if (confirmField.value !== password.value) {
    confirmField.setCustomValidity('Passwords do not match');
  } else {
    confirmField.setCustomValidity(''); // clear it, or the field stays invalid forever
  }
});
```

Setting a non-empty string marks the field invalid and makes that string the message the browser shows
on submit attempt - it plugs straight into the native validation bubble, no custom UI needed. The empty
string on the else branch is not optional: `setCustomValidity` sticks until you explicitly clear it,
even after the user fixes the value.

## Where JavaScript has to take over

HTML attributes check *shape*. They can't check things that depend on another field or another system:

1. **Matching two fields.** "Confirm password" only makes sense compared against "password" -
   `pattern` can't reference a second input's value. `setCustomValidity()`, as above, is the standard
   way to wire that comparison into native validation.
2. **Server-side checks.** "Is this email already registered?" requires asking the server. No HTML
   attribute can know that; you send a request and act on the answer.

```js
async function checkEmailAvailable(email) {
  const res = await fetch(`/api/check-email?email=${encodeURIComponent(email)}`);
  const { available } = await res.json();
  return available;
}

emailField.addEventListener('blur', async () => {
  const available = await checkEmailAvailable(emailField.value);
  emailField.setCustomValidity(available ? '' : 'That email is already registered');
});
```

Running this check on `blur` (when the field loses focus) rather than on every keystroke avoids firing
a request per character typed.

💡 **Key point.** Built-in validation is not a substitute for server-side validation - it's a substitute
for *annoying round trips*. A user with JavaScript disabled, or a request sent straight to your API with
`curl`, bypasses every attribute and every `setCustomValidity()` call. The server must re-check
everything (required fields, formats, uniqueness) regardless of what the browser already checked. Client
validation is for user experience; server validation is for correctness.

Check your understanding:

```quiz
[
  {
    "q": "What does `pattern=\"\\d{3}\"` require of the input's value?",
    "choices": ["The value must contain three digits somewhere", "The entire value must be exactly three digits", "The value must be a number less than 1000"],
    "answer": 1,
    "explain": "pattern matches the whole value, not a substring - \\d{3} alone only matches a value that is exactly 3 digits."
  },
  {
    "q": "What happens if you call setCustomValidity('some message') and never clear it?",
    "choices": ["It clears automatically once the field is valid again", "The field stays invalid until you call setCustomValidity('')", "It only affects the next form submission"],
    "answer": 1,
    "explain": "A custom validity message persists until explicitly reset to an empty string, even if the underlying condition is fixed."
  },
  {
    "q": "Why does client-side validation not replace server-side validation?",
    "choices": ["Browsers validate too slowly", "A request can bypass the browser entirely (JS disabled, curl, a bug), so the server must re-check", "Server-side validation is only for checkboxes"],
    "answer": 1,
    "explain": "Anything that hits your API directly skips HTML/JS validation, so the server is the only place correctness can be guaranteed."
  }
]
```

---

[← Phase 1: Inputs, Labels, and Why `<label>` Matters](01-inputs-labels-and-why-label-matters.md) · [Guide overview](_guide.md) · [Phase 3: Submitting Data: GET vs. POST, FormData, and Fetch →](03-submitting-data-get-vs-post-formdata-and-fetch.md)
