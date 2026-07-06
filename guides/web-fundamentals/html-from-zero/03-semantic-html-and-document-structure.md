---
title: "Semantic HTML and Document Structure"
guide: "html-from-zero"
phase: 3
summary: "Swap generic <div> soup for <header>, <nav>, <main>, <section>, and <footer> - tags that describe a page's structure instead of hiding it, which is what screen readers and search engines actually read."
tags: [html, web-fundamentals, semantic-html, accessibility, document-structure]
difficulty: beginner
synonyms: ["semantic html elements", "div vs section vs article", "header nav main footer html", "why use semantic html", "html document structure best practice"]
updated: 2026-07-06
---

# Semantic HTML and Document Structure

The About Me page works, but everything sits loose in `<body>` - a browser has no idea which part is the
page header, which part is the main content, and which part is a footer. `<div>` could technically wrap any
of it, but `<div>` means nothing on its own. This phase replaces that ambiguity with tags that describe
structure, not just group things visually.

## The problem with `<div>` soup

```html
<div class="header">
  <div class="title">Alex Rivera</div>
</div>
<div class="content">
  <div class="bio">I'm a backend developer...</div>
</div>
<div class="footer">© 2026 Alex Rivera</div>
```

This renders fine. But a `<div>` is a generic box - it carries zero meaning about what's inside it. The only
reason a human knows `class="header"` is the header is the class name; a screen reader or search engine
doesn't parse your class names for intent. Nest enough of these and you get "div soup": structurally
identical boxes stacked arbitrarily, readable only by squinting at CSS classes.

## Semantic elements: tags that say what they are

HTML has purpose-built tags for the sections almost every page has:

```html
<header>...</header>
<nav>...</nav>
<main>...</main>
<section>...</section>
<article>...</article>
<footer>...</footer>
```

- **`<header>`** - introductory content for the page or a section: a title, a logo, a tagline.
- **`<nav>`** - a block of navigation links.
- **`<main>`** - the primary content of the page. Use it once per page.
- **`<section>`** - a thematic grouping of content, usually with its own heading.
- **`<article>`** - a self-contained piece that would make sense on its own if pulled out and syndicated
  elsewhere (a blog post, a single skill card).
- **`<footer>`** - closing content: copyright, contact info, closing links.

These render exactly like `<div>` by default - no visual difference. The difference is entirely in the
meaning they carry.

## Why semantics matter: two audiences who can't see your CSS classes

**Screen readers.** A screen reader builds a navigable outline of a page from tags like `<header>`, `<nav>`,
and `<main>`. A blind user can jump straight to "main content," skipping repeated navigation on every page
load. That skip is only possible if the page uses real `<nav>` and `<main>` elements - a `<div class="nav">`
is invisible to that navigation feature. Full detail lives in
[Accessibility From Day One](/guides/accessibility-from-day-one).

**Search engines.** Crawlers weight content inside `<main>` and `<article>` differently than content inside
`<nav>` or `<footer>`, because those tags tell it what's actually the point of the page versus what's
boilerplate repeated everywhere. Semantic structure is free signal you'd otherwise have to fight for.

💡 **Key point:** `<div>` groups things for styling. Semantic tags group things by *meaning*. Use semantic
tags first; drop down to `<div>` only when no semantic tag fits (a generic styling wrapper with no
structural meaning of its own).

## The finished, annotated About Me page

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <title>About Me</title>
  </head>
  <body>

    <header>
      <h1>Alex Rivera</h1>
      <img src="alex-headshot.jpg" alt="Alex Rivera smiling, standing in front of a bookshelf">
    </header>

    <nav>
      <ul>
        <li><a href="#about">About</a></li>
        <li><a href="#skills">Skills</a></li>
        <li><a href="#links">Find Me Online</a></li>
      </ul>
    </nav>

    <main>
      <section id="about">
        <h2>About Me</h2>
        <p>I'm a backend developer who spends most days in <strong>Rust</strong> and most evenings figuring out why my houseplants keep dying.</p>
      </section>

      <section id="skills">
        <h2>Skills</h2>
        <ul>
          <li>Rust</li>
          <li>PostgreSQL</li>
          <li>Debugging things at 2am</li>
        </ul>
      </section>

      <section id="links">
        <h2>Find Me Online</h2>
        <ul>
          <li><a href="https://github.com/alexrivera" target="_blank">GitHub</a></li>
          <li><a href="https://alexrivera.dev" target="_blank">Portfolio</a></li>
        </ul>
      </section>
    </main>

    <footer>
      <p>&copy; 2026 Alex Rivera</p>
    </footer>

  </body>
</html>
```

Walking through the structure:

- **`<header>`** holds the name and photo - introductory, not the main point of the page.
- **`<nav>`** wraps a plain `<ul>` of links. Semantic tags still use ordinary tags inside them; `<nav>` just
  tells the browser "this list is for navigating," on top of "this is a list."
- **`<main>`** wraps everything that's actually the content - one per page, never nested inside another
  `<main>`.
- **`<section>`** breaks `<main>` into three thematic chunks, each with its own `<h2>` and an `id` the nav
  links jump to.
- **`<footer>`** closes the page with copyright - content that's true regardless of which section someone
  scrolled to.

The visible result hasn't changed from phase 2. What changed is that the page's structure is now readable by
machines, not just implied by which order things happen to appear on screen.

## Where to go next

The About Me page is complete: structured, filled with content, and marked up semantically. It also looks
exactly as plain as the very first skeleton - browser default fonts, no color, no layout. That's next:
[CSS Without Tears](/guides/css-without-tears) takes this exact page and makes it look like something.

Last check before you move on:

```quiz
[
  {
    "q": "What's the main problem with building a page entirely out of <div> elements?",
    "choices": [
      "Divs render slower than semantic tags",
      "Divs carry no meaning about what the content is, only CSS classes do - which screen readers and crawlers don't read for intent",
      "Divs can't contain headings",
      "Browsers no longer support <div>"
    ],
    "answer": 1,
    "explain": "A <div> is a generic box. Its meaning exists only in a class name a human wrote - assistive tech and search engines can't infer intent from that the way they can from <nav> or <main>."
  },
  {
    "q": "How many <main> elements should a page have?",
    "choices": ["As many as there are sections", "Exactly one", "One per <article>", "Zero - main is optional decoration"],
    "answer": 1,
    "explain": "<main> marks the primary content of the page. One per page lets screen reader users jump straight to it, skipping repeated navigation."
  },
  {
    "q": "Visually, how does <section> differ from <div> in a browser with no CSS applied?",
    "choices": [
      "It doesn't - both render as an unstyled block by default; the difference is semantic meaning",
      "<section> is bold by default",
      "<section> adds a border automatically",
      "<section> centers its content"
    ],
    "answer": 0,
    "explain": "Semantic tags look identical to <div> with no CSS - the entire benefit is machine-readable meaning, not appearance."
  }
]
```

---

[← Phase 2: Text, Lists, Links, and Images](02-text-lists-links-and-images.md) · [Guide overview](_guide.md)
