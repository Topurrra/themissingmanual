---
title: "Your first stylesheet: colour and size"
guide: practice-html-css
phase: 3
summary: "CSS is a selector, a block, and property-value pairs inside it. Write your first rule, and learn why a misspelled property looks exactly like a rule you never wrote."
tags: [css, style, selectors, color, font-size]
difficulty: beginner
synonyms:
  - how to add css to a html page
  - what does the style tag do
  - how to change text colour with css
  - how to write a css rule
  - change font size with css
  - css is not working and there is no error
updated: 2026-07-17
---

# Your first stylesheet: colour and size

HTML says what a thing is. CSS says what it should look like. CSS goes in a
`<style>` block at the top of the page, and the browser applies each rule to
every element that matches it.

A rule is three parts. In `h2 { color: navy; }`, the `h2` out front is the
*selector*: it names what to style, and a bare tag name means every h2 on the
page. The curly braces hold the *block*. Inside go the *declarations* - a
property, a colon, a value, a semicolon - as many as you want. That is the
entire grammar. Everything else in CSS is which properties exist, and which
elements a selector reaches.

Now the part that costs people afternoons: CSS never errors. Write
`colour: red` instead of `color: red` and you get no error and nothing in the
console. The browser cannot parse that declaration, so it drops that one line,
applies the rest of the block, and carries on drawing. A typo looks exactly
like a rule you never wrote - which is why "CSS is broken" is almost always a
spelling mistake. Check the spelling before you doubt anything else.

**Your task:** the closure notice is drawn as ordinary text and people keep
missing it. Add a `<style>` block that gives the paragraph a `color` of `red`
and a `font-size` of `24px`. The heading stays exactly as it is.

**You'll practice:**

- Writing a rule: a selector, a block, and property-value pairs inside it
- Aiming a rule at one kind of element by its tag name

```lesson
{
  "language": "html",
  "starterCode": "<h1>Riverside Library</h1>\n<p>Closed for repairs until 3 March.</p>\n",
  "solution": "<style>\n  p {\n    color: red;\n    font-size: 24px;\n  }\n</style>\n\n<h1>Riverside Library</h1>\n<p>Closed for repairs until 3 March.</p>\n",
  "checks": [
    { "name": "the page still says the library is closed", "selector": "p", "count": true, "text": true },
    { "name": "the closure notice is red and hard to miss", "selector": "p", "styles": ["color", "font-size"] },
    { "name": "the heading is left the way it was", "selector": "h1", "styles": ["color", "font-size"] }
  ],
  "hints": [
    "A style block is a tag pair like any other: <style> opens it, </style> closes it, and your rules sit between them. Put it at the top, above the heading, which is where a page's styles belong.",
    "The selector is just p - the tag name with no angle brackets, because a selector names elements rather than being one. After it come the curly braces, and inside them one declaration per line: the property, a colon, the value, a semicolon. Watch the spelling of color - colour is silently dropped, which looks identical to nothing happening.",
    "Put this above the heading: <style> p { color: red; font-size: 24px; } </style> - a p selector only ever touches paragraphs, so the h1 is left alone without you doing anything to it."
  ]
}
```
