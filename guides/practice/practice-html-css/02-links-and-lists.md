---
title: "Links and lists: what a list actually is"
guide: practice-html-css
phase: 2
summary: "A link is a tag with an address on it. A list is a structure, not decoration - and the difference is what a screen reader announces to someone who cannot see your bullets."
tags: [html, links, lists, anchor, accessibility]
difficulty: beginner
synonyms:
  - how to make a link in html
  - html a href tag
  - how to make a bulleted list in html
  - what are ul and li tags
  - html list of links
  - why use ul instead of typing dashes
updated: 2026-07-17
---

# Links and lists: what a list actually is

A link is a tag with an address on it: `<a href="https://example.com">Example</a>`.
The `href` is the address. Drop it and you still have an `<a>`, but it is no
longer a link - nothing to click, nothing to follow, and a screen reader will not
announce it as one.

Lists are where people go wrong. This page has three bookmarks typed as three
paragraphs, each starting with a dash. It *looks* like a list. It is three
unrelated paragraphs that happen to begin with a hyphen.

`<ul>` makes it a real one. `<ul>` opens the list, each `<li>` is one item, and
now the browser knows the three belong together. A screen reader announces
"list, 3 items", and its user can skip the whole group with one key. Typed dashes
say none of that: the screen reader finds three paragraphs, reads them one at a
time, and never mentions that they are related.

The bullets you get for free are not the point. Switch them off in CSS and it is
still a list, because the structure was never the bullet.

**Your task:** turn the three bookmark paragraphs into one `<ul>` with three
`<li>` items, dropping the typed dashes - the browser draws its own bullets. Then
make the MDN item a link to `https://developer.mozilla.org`.

**You'll practice:**

- Writing an `<a>` with an `href` so its text actually goes somewhere
- Picking a tag for what the content *is*, not for how it looks

```lesson
{
  "language": "html",
  "starterCode": "<h1>Bookmarks</h1>\n<p>Three places I keep going back to when I get stuck.</p>\n<p>- MDN Web Docs</p>\n<p>- The HTML spec</p>\n<p>- Can I Use</p>\n",
  "solution": "<h1>Bookmarks</h1>\n<p>Three places I keep going back to when I get stuck.</p>\n<ul>\n  <li><a href=\"https://developer.mozilla.org\">MDN Web Docs</a></li>\n  <li>The HTML spec</li>\n  <li>Can I Use</li>\n</ul>\n",
  "checks": [
    { "name": "the three bookmarks are one list, not three loose lines", "selector": "ul li", "count": true },
    { "name": "the first item reads 'MDN Web Docs', with no typed dash left on it", "selector": "ul li", "text": true },
    { "name": "the MDN bookmark is a link that points somewhere", "selector": "a[href]" },
    { "name": "the link is on 'MDN Web Docs', not on one of the other two", "selector": "a", "text": true }
  ],
  "hints": [
    "A list is two tags working together: <ul> wraps the whole group, and each item inside it gets its own <li> pair. The three <p> tags go away entirely - an item is an <li>, not a paragraph.",
    "Delete the dashes as you go. The browser draws a bullet for every <li> without being asked, so a typed dash just sits next to it. For the link, an <a> is an ordinary tag pair that carries an address: <a href=\"...\">text</a>. Wrap it around the words MDN Web Docs, inside that item's <li>.",
    "Replace the three bookmark paragraphs with these five lines: <ul> then <li><a href=\"https://developer.mozilla.org\">MDN Web Docs</a></li> then <li>The HTML spec</li> then <li>Can I Use</li> then </ul> - the <li> tags sit inside the <ul>, and the <a> sits inside the first <li>."
  ]
}
```
