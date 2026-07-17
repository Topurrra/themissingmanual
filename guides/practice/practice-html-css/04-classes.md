---
title: "Classes: styling one box, not all of them"
guide: practice-html-css
phase: 4
summary: "A tag selector hits every element of its type. A class is a name you hang on the ones you mean, so one box can look different from its neighbours."
tags: [html, css, classes, class-attribute, selectors]
difficulty: beginner
synonyms:
  - what is a class in html
  - how to use a css class
  - css class selector with a dot
  - style only one element not all
  - difference between class and id
updated: 2026-07-17
---

# Classes: styling one box, not all of them

A tag selector is a blunt instrument. `div { border: 1px solid #ccc; }` means
*every* div on the page, which is exactly what you want for the shared look -
all four steps below get the same box for free, and a fifth step would too.

It stops working the moment one of them needs to look different. There is no tag
for "the one that failed". All four are divs (a div is a plain box, no meaning
attached), and the browser cannot guess which one you mean.

So you name it. `class="failed"` inside an opening tag hangs a label on that
element. The label has no look of its own; it changes nothing until some CSS
asks for it. In CSS you ask with a leading dot: `.failed` means "the elements
carrying that label". The dot is the whole difference. Written without it,
`failed { }` goes looking for a `<failed>` tag, finds none, and does nothing at
all - no error, no warning, no pink.

A class name is reusable on purpose. Put `class="failed"` on three of these divs
and all three light up. That is the point of a class, and it is the line between
a class and an id, which names exactly one element on the page. Reach for a
class first; nearly every rule you ever write will be one.

**Your task:** the Test step failed. Put `class="failed"` on that div, then add a
rule to the `<style>` block giving `.failed` a `pink` background. The other three
steps must look exactly as they do now.

**You'll practice:**

- Labelling a subset of elements with the class attribute
- Selecting that label in CSS with a leading dot

```lesson
{
  "language": "html",
  "starterCode": "<style>\n  div {\n    border: 1px solid #ccc;\n    padding: 8px;\n    margin-bottom: 4px;\n  }\n</style>\n\n<h1>Build #418</h1>\n\n<div>Install</div>\n<div>Test</div>\n<div>Build</div>\n<div>Deploy</div>\n",
  "solution": "<style>\n  div {\n    border: 1px solid #ccc;\n    padding: 8px;\n    margin-bottom: 4px;\n  }\n\n  .failed {\n    background-color: pink;\n  }\n</style>\n\n<h1>Build #418</h1>\n\n<div>Install</div>\n<div class=\"failed\">Test</div>\n<div>Build</div>\n<div>Deploy</div>\n",
  "checks": [
    { "name": "exactly one step is labelled as the failed one", "selector": ".failed", "count": true },
    { "name": "the step you labelled is Test", "selector": ".failed", "text": true },
    { "name": "the failed step has a pink background", "selector": ".failed", "styles": ["background-color"] },
    { "name": "the other steps keep their plain background", "selector": "div:not(.failed)", "styles": ["background-color"] }
  ],
  "hints": [
    "This takes two edits, one in the HTML and one in the CSS. Start with the HTML: a class is an attribute you write inside the opening tag, so the Test line becomes <div class=\"failed\">Test</div>. Run it. Nothing changes on screen yet, and that is correct - you have only hung a name on it.",
    "Now the CSS half, inside the same style block. A selector that starts with a dot matches the elements carrying that class name, so .failed picks out the div you just labelled and nothing else. Write it as a new rule below the div rule. If you style div instead, you paint all four steps.",
    "Change the Test line to <div class=\"failed\">Test</div>, then add this rule inside the style block: .failed { background-color: pink; } - the dot belongs to the selector only, never to the name you typed in the HTML."
  ]
}
```
