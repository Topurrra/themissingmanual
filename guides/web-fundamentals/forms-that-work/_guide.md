---
title: "Forms That Work"
guide: "forms-that-work"
phase: 0
summary: "Forms are how the web collects input - and most of what makes them good or broken lives in details people skip. Build one real signup form and wire up labels, validation, and submission the right way."
tags: [forms, html, validation, fetch, formdata, web-fundamentals, intermediate]
category: web-fundamentals
order: 6
difficulty: intermediate
synonyms: ["how to build an html form", "form validation html", "formdata and fetch example", "how to submit a form with javascript", "html form best practices"]
updated: 2026-07-06
---

# Forms That Work

Every account you've ever created, every comment you've posted, every search you've run started with
a form. They look simple - a few inputs and a button - which is exactly why they're easy to get wrong.
A form with no `<label>` is unusable for screen reader users. A form with only client-side validation
lets bad data through if JavaScript fails. A form that navigates away on submit breaks the smooth,
single-page feel modern apps promise.

This guide builds one form and takes it seriously: a signup form with a name, an email, a password,
and an "I agree to terms" checkbox. By the end it has proper labels, layered validation, and a
JavaScript-powered submit that talks to a server without reloading the page.

## How to read this

- **Building your first form?** Read in order - phase 1 gets the markup right, phase 2 adds
  validation, phase 3 wires up submission.
- **Already comfortable with inputs and labels?** Jump to
  [Phase 2: Validation: Built-in vs. Custom](02-validation-built-in-vs-custom.md).

## The phases

1. **[Inputs, Labels, and Why `<label>` Matters](01-inputs-labels-and-why-label-matters.md)** - the
   input types you'll actually use, why `<label for="id">` is load-bearing rather than decorative, and
   grouping related fields with `<fieldset>`/`<legend>`.
2. **[Validation: Built-in vs. Custom](02-validation-built-in-vs-custom.md)** - `required`, `pattern`,
   `minlength`, `type="email"`, the `:valid`/`:invalid` CSS hooks, the Constraint Validation API, and
   where JavaScript still has to step in.
3. **[Submitting Data: GET vs. POST, FormData, and Fetch](03-submitting-data-get-vs-post-formdata-and-fetch.md)** -
   native form submission versus `preventDefault()` plus `fetch`, building a `FormData` object, and
   handling both success and server-side validation errors.

> This guide covers the form itself, not layout or making it usable on a phone screen - that's
> [Responsive Design](/guides/responsive-design). It also only lightly touches accessibility; the full
> treatment is [Accessibility From Day One](/guides/accessibility-from-day-one).
