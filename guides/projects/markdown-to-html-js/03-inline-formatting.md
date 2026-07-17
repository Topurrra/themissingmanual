---
title: "Inline Formatting"
guide: markdown-to-html-js
phase: 3
summary: "Format the text inside blocks - bold, italic, inline code, and links - with a chain of regex replacements applied in the right order."
tags: [javascript, markdown, regex, inline, links]
difficulty: intermediate
synonyms:
  - markdown bold italic regex
  - markdown links to anchor
  - inline code markdown
  - regex replace javascript
  - markdown inline parser
updated: 2026-07-16
---

# Inline Formatting

Block rules decide what a line *is*. Inline rules decorate the text *within* it. A
heading can contain `**bold**`; a paragraph can contain a `[link](url)`. This phase
handles those spans, and it works the same regardless of which block the text came from.

The tool here is `String.replace` with a regex and a replacement string. Where capture
groups in Phase 2 told us what to wrap, here they get pasted straight into the output.

## Bold and italic

Bold is `**text**`, italic is `*text*`. The replacement uses `$1` to mean "whatever the
first capture group caught":

Guess what this prints before you run it.

```js runnable
let text = "This is **bold** and this is *italic*.";

// \*\*(.+?)\*\*  ->  two literal stars, then capture, then two stars
text = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

// \*(.+?)\*      ->  one star, capture, one star
text = text.replace(/\*(.+?)\*/g, "<em>$1</em>");

console.log(text);
```

Two things to notice. The `g` flag means *global* - replace every match, not only the
first. And `.+?` is **non-greedy**: the `?` tells it to grab as few characters as
possible. Without it, `*a* and *b*` would match from the first star all the way to the
last, swallowing the text between. Try removing the `?` and re-running to see the mess.

## Order matters: bold before italic

There is a trap hiding in those two patterns. `**bold**` is also four stars, and the
italic pattern `\*(.+?)\*` could chew into it. The fix is order: handle `**` *before*
`*`. By the time the italic rule runs, the bold has already become `<strong>` tags and
its stars are gone.

```js runnable
function inline(text) {
  text = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>"); // bold FIRST
  text = text.replace(/\*(.+?)\*/g, "<em>$1</em>");             // italic second
  return text;
}

console.log(inline("**important** and *subtle*"));
console.log(inline("a *little* emphasis here"));
```

Run it. Both come out clean. Swap the two lines so italic runs first, re-run, and you will
see the bold break - the italic rule eats the inner stars and leaves a stray `**`. Order
is not cosmetic here; it is correctness.

## Inline code

Inline code is text between backticks: `` `code` ``. Same shape, different delimiter:

```js runnable
let text = "Call `mdToHtml(text)` to convert.";

text = text.replace(/`(.+?)`/g, "<code>$1</code>");

console.log(text);
```

In a fuller parser you would also want code spans to be *immune* to the other rules -
`` `**not bold**` `` should stay literal. We are keeping it small here, but it is worth
knowing that real parsers pull code out first and stitch it back last for exactly that
reason.

## Links

Links are the one with two captures. `[text](url)` becomes
`<a href="url">text</a>` - the text and the URL land in different places, so we capture
both and reorder them:

```js runnable
let text = "Read the [docs](https://example.com) for more.";

// \[(.+?)\]  capture the text inside square brackets
// \((.+?)\)  capture the url inside parens
text = text.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');

console.log(text);
```

`$1` is the link text, `$2` is the URL. Notice they swap places in the output - that
reordering is something a plain find-and-replace could never do, but a capture group makes
trivial.

## All inline rules together

Here is the last piece of this phase: one `inline` function that chains all four rules -
links, code, bold, italic - the function we will plug into the converter next phase.

**Your turn.** You already have all four `.replace` calls from above, and you already saw
what goes wrong when bold and italic run in the wrong order. Chain the four rules into one
function and get every check below to pass. My version is right after.

```js runnable
function inline(text) {
  // Chain the four .replace() rules from above into one function:
  //   links:  [text](url)   -> <a href="url">text</a>
  //   code:   `code`        -> <code>code</code>
  //   bold:   **text**      -> <strong>text</strong>
  //   italic: *text*        -> <em>text</em>
  // The order you chain them in matters - get it wrong and some of the
  // checks below will fail even though each individual rule "looks right".
}

// --- checks: fix your function until this prints "All good." ---
if (inline("**bold**") !== "<strong>bold</strong>") throw new Error(`inline("**bold**") should be "<strong>bold</strong>", got: ${inline("**bold**")}`);
if (inline("*italic*") !== "<em>italic</em>") throw new Error(`inline("*italic*") should be "<em>italic</em>", got: ${inline("*italic*")}`);
if (inline("`code`") !== "<code>code</code>") throw new Error(`inline("\`code\`") should be "<code>code</code>", got: ${inline("`code`")}`);
if (inline("[text](url)") !== '<a href="url">text</a>') throw new Error(`inline("[text](url)") should be '<a href="url">text</a>', got: ${inline("[text](url)")}`);
if (inline("**a** and *b*") !== "<strong>a</strong> and <em>b</em>") throw new Error(`inline("**a** and *b*") should be "<strong>a</strong> and <em>b</em>", got: ${inline("**a** and *b*")}`);
if (inline("[**bold link**](url)") !== '<a href="url"><strong>bold link</strong></a>') throw new Error(`inline("[**bold link**](url)") should be '<a href="url"><strong>bold link</strong></a>', got: ${inline("[**bold link**](url)")}`);
console.log("All good.");
```

Stuck on ordering? Links and code use different delimiters (`[]()` and `` ` ``) so they
can't collide with `*`, but they *contain* text that bold and italic will also try to
match - which order avoids that trap?

### One way to write it

```js runnable
function inline(text) {
  return text
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>') // links
    .replace(/`(.+?)`/g, "<code>$1</code>")                // inline code
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")      // bold
    .replace(/\*(.+?)\*/g, "<em>$1</em>");                 // italic
}

const sample =
  "See the **important** `config` setting in the [guide](https://docs.dev), *please*.";

console.log(inline(sample));
```

Run it. One line of mixed Markdown, and every span comes out as the right tag: a link, a
code span, bold, and italic, all in one pass. Chaining `.replace` calls like this reads
top to bottom as a list of rules, which is about as clear as text transformation gets.
Links and code run first because they have their own delimiters and won't collide with
each other - but their *captured text* still needs bold and italic applied afterward,
which is exactly what happens here since `inline` runs once, in order, over the whole
string.

```mermaid
graph LR
  A[raw text] --> B[links]
  B --> C[code]
  C --> D[bold]
  D --> E[italic]
  E --> F[formatted html]
```

## Where we are

You now have two halves of a converter. `toBlocks` from Phase 2 builds the structure;
`inline` from this phase decorates the text. They do not talk to each other yet - that is
the final phase, where we wire them together, add HTML escaping, and end up with one
function you can throw a whole document at.
