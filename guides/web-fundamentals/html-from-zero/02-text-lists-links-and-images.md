---
title: "Text, Lists, Links, and Images"
guide: "html-from-zero"
phase: 2
summary: "Headings, paragraphs, semantic emphasis, lists, links, and images with real alt text - fill the About Me skeleton with actual content."
tags: [html, web-fundamentals, headings, links, images, lists, alt-text]
difficulty: beginner
synonyms: ["html headings h1 to h6", "strong vs em vs bold", "how to make a link in html", "html img alt attribute", "unordered vs ordered list html", "why alt text matters"]
updated: 2026-07-06
---

# Text, Lists, Links, and Images

The About Me page has a skeleton but nothing in it. Time to fill `<body>` with the tags that carry almost all
written content on the web: headings, paragraphs, emphasis, lists, links, and images.

## Headings: one `<h1>`, then step down

Headings come in six levels, `<h1>` through `<h6>`, biggest and most important to smallest:

```html
<h1>Alex Rivera</h1>
<h2>About Me</h2>
<h3>Background</h3>
```

`<h1>` is the page's main title - use it exactly **once** per page. Levels below it should nest by
importance, not by how big you want text to look: `<h2>` for major sections, `<h3>` for subsections inside
those. Screen readers let users jump heading-to-heading like a table of contents, so skipping from `<h1>`
straight to `<h4>` because it "looked right" breaks that navigation for them.

⚠️ **Gotcha:** don't pick a heading level for its default font size. `<h3>` looks small because browsers
style it small by default, not because it means "less important than h1." Size is CSS's job - covered in
[CSS Without Tears](/guides/css-without-tears). Pick heading levels by document structure.

## Paragraphs: the default text container

```html
<p>I'm a backend developer who spends most days in Rust and most evenings figuring out why my houseplants keep dying.</p>
```

`<p>` is a block of text - a paragraph. Browsers add space above and below it automatically. Don't use empty
`<p></p>` tags or a chain of `<br>` elements to fake spacing between paragraphs; each real paragraph gets its
own `<p>`.

## Semantic emphasis vs. visual styling

`<strong>` and `<em>` mark text as *important* or *stressed* - they are not shortcuts for "bold" and
"italic." That distinction matters more than it looks:

```html
<p><strong>Warning:</strong> this bio contains puns.</p>
<p>I <em>genuinely</em> love debugging race conditions.</p>
```

Browsers happen to render `<strong>` as bold and `<em>` as italic by default, which is why people confuse
them with styling tags. But a screen reader changes its *tone of voice* for `<strong>` and `<em>` - it
doesn't do that for text that's merely bold via CSS. If you want text bold purely for looks, with no added
meaning, that's a CSS job (`font-weight`), not an HTML one. Reach for `<strong>`/`<em>` when the emphasis is
part of the meaning; reach for CSS when it's purely decorative.

💡 **Key point:** HTML says what something *is* (important, emphasized, a heading). CSS says what it *looks
like*. Mixing the two up is the single most common HTML habit to unlearn.

## Lists: unordered, ordered, and their items

Two list types, both built from `<li>` (list item) elements:

```html
<h3>Skills</h3>
<ul>
  <li>Rust</li>
  <li>PostgreSQL</li>
  <li>Debugging things at 2am</li>
</ul>

<h3>How I Got Here</h3>
<ol>
  <li>Learned Python in college</li>
  <li>Got hooked on backend systems</li>
  <li>Switched to Rust and never looked back</li>
</ol>
```

`<ul>` (unordered list) is for items where order doesn't matter - bullets. `<ol>` (ordered list) is for
sequence - numbers. Every `<li>` must live directly inside a `<ul>` or `<ol>`; it doesn't work on its own.

## Links: `<a href>`

```html
<a href="https://github.com/alexrivera">My GitHub</a>
```

`<a>` (anchor) creates a link. The `href` attribute is where it points - a full URL, or a relative path to
another page on the same site (`about.html`). Text between the tags is what's clickable. Opening a link in a
new tab needs `target="_blank"`:

```html
<a href="https://github.com/alexrivera" target="_blank">My GitHub</a>
```

## Images: `<img src alt>`, and why `alt` isn't optional

```html
<img src="alex-headshot.jpg" alt="Alex Rivera smiling, standing in front of a bookshelf">
```

`src` points at the image file. `alt` is a text description of the image - and it's doing three jobs at
once, not one:

- **Screen readers read it aloud** instead of the image, for anyone who can't see the picture.
- **It shows in place of the image** if the file fails to load or is slow on a bad connection.
- **Search engines use it** to understand what the image contains, since they can't "see" it either.

Skipping `alt` doesn't just look sloppy - it silently excludes anyone using a screen reader from that part of
the page. Skip the description only for purely decorative images (`alt=""`, deliberately empty), never omit
the attribute entirely. This guide only scratches the surface - the full picture is in
[Accessibility From Day One](/guides/accessibility-from-day-one).

## Putting it in the About Me page

Here's `<body>` filled in:

```html
<body>
  <h1>Alex Rivera</h1>
  <img src="alex-headshot.jpg" alt="Alex Rivera smiling, standing in front of a bookshelf">

  <h2>About Me</h2>
  <p>I'm a backend developer who spends most days in <strong>Rust</strong> and most evenings figuring out why my houseplants keep dying.</p>

  <h2>Skills</h2>
  <ul>
    <li>Rust</li>
    <li>PostgreSQL</li>
    <li>Debugging things at 2am</li>
  </ul>

  <h2>Find Me Online</h2>
  <ul>
    <li><a href="https://github.com/alexrivera" target="_blank">GitHub</a></li>
    <li><a href="https://alexrivera.dev" target="_blank">Portfolio</a></li>
  </ul>
</body>
```

Load it in a browser: one big title, a photo with a real description, a bio with one emphasized word, a
bullet list of skills, and clickable links. Every tag here describes what something *is* - that's the whole
skill of HTML.

Check what you just learned:

```quiz
[
  {
    "q": "How many <h1> elements should a page have?",
    "choices": ["As many as you want", "Exactly one", "Zero - h1 is deprecated", "One per section"],
    "answer": 1,
    "explain": "h1 marks the page's main title. Screen readers and search engines rely on there being exactly one to identify the page's primary heading."
  },
  {
    "q": "You want text bold purely for visual style, with no added meaning. What should you use?",
    "choices": ["<strong>", "<b> with CSS font-weight, or CSS alone", "<em>", "A heading tag"],
    "answer": 1,
    "explain": "<strong> and <em> signal semantic importance/emphasis - screen readers change tone for them. Purely visual boldness belongs to CSS, not a semantic tag."
  },
  {
    "q": "Why does an <img> need an alt attribute?",
    "choices": [
      "It's only for search engine ranking",
      "It's optional decoration with no real function",
      "Screen readers read it aloud, it shows if the image fails to load, and search engines use it to understand the image",
      "It only matters for images inside <ul> lists"
    ],
    "answer": 2,
    "explain": "alt text serves accessibility, fallback display, and search indexing all at once - skipping it excludes screen reader users from that content."
  }
]
```

---

[← Phase 1: Your First Page](01-your-first-page-elements-tags-and-structure.md) · [Guide overview](_guide.md) · [Phase 3: Semantic HTML and Document Structure →](03-semantic-html-and-document-structure.md)
