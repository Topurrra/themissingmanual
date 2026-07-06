---
title: "Your First Page: Elements, Tags, and Structure"
guide: "html-from-zero"
phase: 1
summary: "A tag marks where something starts or ends, an element is the whole marked-up thing, and every HTML page needs the same three-part skeleton. Build the empty shell of an About Me page."
tags: [html, web-fundamentals, elements, tags, doctype, beginner-friendly]
difficulty: beginner
synonyms: ["what is an html tag", "what is an html element", "html document structure", "doctype html meaning", "void elements html", "html skeleton template"]
updated: 2026-07-06
---

# Your First Page: Elements, Tags, and Structure

Open a plain text file, save it as `about.html`, and you've started writing HTML. There's no compiler, no
build step - a browser reads the text and decides how to show it based on the tags you put in it. That's the
whole game: tags tell the browser what each piece of content *is*, and the browser figures out how to display it.

## Tags, elements, and attributes

A **tag** is the marker itself, wrapped in angle brackets: `<p>`. Most tags come in pairs - an opening tag
and a closing tag with a `/`:

```html
<p>This is a paragraph.</p>
```

The opening tag, the content, and the closing tag together are called an **element**. So `<p>` is a tag, but
`<p>This is a paragraph.</p>` is an element. People say "tag" for both loosely, but when you see "element" in
docs, it means the whole package.

Tags can carry extra information called **attributes**, written inside the opening tag as `name="value"`:

```html
<a href="https://example.com">Visit example.com</a>
```

Here `href` is an attribute telling the `<a>` (link) element where to go. Attributes always live in the
opening tag, never the closing one, and their values go in quotes.

## Nesting: elements live inside elements

Elements can contain other elements, not just text:

```html
<p>My favorite language is <strong>Rust</strong>.</p>
```

`<strong>Rust</strong>` is nested inside the `<p>`. The rule is simple: whatever you open last, you close
first - like folding boxes inside boxes. This is valid:

```html
<p><strong>Bold text</strong></p>
```

This is not, because the tags cross over each other:

```html
<p><strong>Bold text</p></strong>
```

Browsers often render broken nesting anyway by guessing what you meant, which is exactly the problem - the
guess isn't always right, and it's a habit that bites you in bigger pages. Close tags in the reverse order
you opened them.

## Void elements: tags with no closing pair and no content

Some tags represent something that has no inner content to wrap around, so they never get a closing tag.
These are called **void elements**. The two you'll use constantly:

```html
<br>
<img src="photo.jpg" alt="A photo of me">
```

`<br>` forces a line break - there's nothing to put "inside" a line break, so it's just `<br>`, not
`<br></br>`. `<img>` embeds an image via its `src` attribute - the image data itself lives in a separate
file, not between tags, so there's no content to close around either. Other common void elements: `<hr>`
(a horizontal rule), `<input>`, `<meta>`, `<link>`.

⚠️ **Gotcha:** writing `<img src="photo.jpg"></img>` isn't wrong enough to break most pages, but it's
nonstandard and some tools will flag it. Void elements don't get a separate closing tag.

## The skeleton every HTML page needs

Every page starts with the same four pieces, in the same order:

```html
<!DOCTYPE html>
<html>
  <head>
    <title>About Me</title>
  </head>
  <body>

  </body>
</html>
```

Here's what each one does:

- **`<!DOCTYPE html>`** - not a tag, a declaration. It tells the browser "render this as modern HTML," so it
  doesn't fall back to a decades-old compatibility mode. Always the first line, always exactly this.
- **`<html>`** - the root element. Every other tag lives inside it.
- **`<head>`** - metadata about the page: the tab title, character encoding, links to CSS files. Nothing in
  `<head>` shows up as visible page content.
- **`<body>`** - everything the visitor actually sees: text, images, links, buttons, all of it.

📝 **Terminology:** the `<title>` element (inside `<head>`) sets the text shown in the browser tab. People
often mistake it for a visible page heading - it isn't one. Visible headings come from `<h1>`-`<h6>`, covered
next phase.

## Building the About Me skeleton

Save this as `about.html`:

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <title>About Me</title>
  </head>
  <body>

  </body>
</html>
```

The `<meta charset="UTF-8">` line tells the browser how to decode the text - which characters map to which
bytes. Without it, accented letters, curly quotes, or emoji can render as garbled symbols. It's a void
element, same family as `<br>`. Add it right after `<head>` opens; every real page has one.

Open the file in a browser and you'll see a blank page with "About Me" in the tab. That blank `<body>` is
where the next phase starts filling in content.

Check your understanding of tags, elements, and the skeleton:

```quiz
[
  {
    "q": "What's the difference between a tag and an element?",
    "choices": [
      "They're the same thing, just different names",
      "A tag is the marker like <p>; an element is the opening tag, content, and closing tag together",
      "An element is only used in the head; a tag is only used in the body",
      "A tag has attributes; an element never does"
    ],
    "answer": 1,
    "explain": "A tag is the bracketed marker itself. An element is the full package: opening tag, content, closing tag."
  },
  {
    "q": "Why does <img> not have a closing tag?",
    "choices": [
      "It's a mistake that browsers tolerate",
      "It's a void element - there's no inner content for a closing tag to wrap around",
      "Only tags inside <head> need closing tags",
      "Older HTML versions required it, but modern HTML dropped it"
    ],
    "answer": 1,
    "explain": "Void elements like <img> and <br> represent something with no content to nest inside, so they never get a separate closing tag."
  },
  {
    "q": "Where does visible page content - text, images, links - go?",
    "choices": [
      "Inside <head>",
      "Inside <title>",
      "Inside <body>",
      "Directly inside <!DOCTYPE html>"
    ],
    "answer": 2,
    "explain": "<head> holds metadata that never displays. Everything a visitor actually sees lives inside <body>."
  }
]
```

---

[Guide overview](_guide.md) · [Phase 2: Text, Lists, Links, and Images →](02-text-lists-links-and-images.md)
