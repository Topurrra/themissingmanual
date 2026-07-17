---
title: "Your first page: a heading and a paragraph"
guide: practice-html-css
phase: 1
summary: "A web page is text with labels around it. Write the two labels every page starts with, and watch the browser draw them."
tags: [html, headings, paragraphs, elements, tags]
difficulty: beginner
synonyms:
  - how to write html
  - what is an h1 tag
  - html heading and paragraph
  - my first html page
  - html tags explained
updated: 2026-07-17
---

# Your first page: a heading and a paragraph

A web page is just text with labels wrapped around it. The labels are called
tags, and they tell the browser what a piece of text *is* - not what it should
look like. `<h1>Hello</h1>` says "Hello is the main heading of this page". The
browser already knows headings should look big and bold, so it draws it that
way without being asked.

A tag comes in a pair. `<h1>` opens it, `</h1>` closes it, and the text sits
between them. Forget the slash on the closing tag and the browser will not
raise an error - it will just keep treating everything after it as a heading.
That is worth knowing early: HTML almost never tells you that you are wrong. It
guesses, draws something, and moves on.

The preview on the right is a real browser window. Change the text, press Run,
and it redraws.

**Your task:** the page has a heading but nothing else. Add a paragraph under
it, using `<p>` tags, that reads exactly `I am learning HTML.`

**You'll practice:**

- Wrapping text in a tag pair so the browser knows what it is
- Reading the preview as the answer to what you wrote

```lesson
{
  "language": "html",
  "starterCode": "<h1>My first page</h1>\n",
  "solution": "<h1>My first page</h1>\n<p>I am learning HTML.</p>\n",
  "checks": [
    { "name": "the page still has its heading", "selector": "h1", "count": true, "text": true },
    { "name": "there is a paragraph on the page", "selector": "p", "count": true },
    { "name": "the paragraph reads 'I am learning HTML.'", "selector": "p", "text": true }
  ],
  "hints": [
    "A paragraph uses the p tag. It works exactly like the h1 already on the page: an opening tag, your text, then a closing tag with a slash in it.",
    "Write it on a new line under the h1, so it is a separate thing on the page rather than something inside the heading. Order matters here - the browser draws the page top to bottom, in the order you wrote it.",
    "Add this line under the h1: <p>I am learning HTML.</p> - the full stop is part of the text, so keep it inside the tags."
  ]
}
```
