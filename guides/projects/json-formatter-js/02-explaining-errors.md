---
title: "Explaining Errors"
guide: json-formatter-js
phase: 2
summary: "Catch a failed parse and turn the thrown error into a readable message with a rough location in the text."
tags: [javascript, json, error-handling, validation, debugging]
difficulty: beginner
synonyms:
  - json parse error
  - explain json error
  - unexpected token json
  - json error location
  - catch json parse
updated: 2026-06-30
---

# Explaining Errors

Last phase ended with our formatter throwing `Unexpected token` and a line number that meant nothing. A tool that fails that way is worse than no tool. This phase is about catching the throw and turning it into something you'd actually want to read: what went wrong, and where to look.

## Don't let the throw escape

The first move is the cheapest one. Wrap the parse in `try` / `catch` so a bad input becomes a *result* you can hand back, not a crash.

```js runnable
function tryFormat(text) {
  try {
    const data = JSON.parse(text);
    return { ok: true, output: JSON.stringify(data, null, 2) };
  } catch (err) {
    return { ok: false, message: err.message };
  }
}

console.log(tryFormat('{"a":1}'));
console.log(tryFormat('{"a":1,}'));
```

Now every call returns an object. `ok: true` carries the formatted output; `ok: false` carries the error message. Nothing throws past our function. That alone makes this safe to wire into a page — but the message is still raw browser text.

## Where did it break?

Modern JavaScript engines tuck a character position into the error message — often as `position N` or `(line L column C)`. The exact wording differs between browsers, which is annoying, but the *number* is gold. If we can pull a position out, we can show the reader the spot.

```js runnable
const broken = '{"name":"Ada", "age":}'; // value missing after age

try {
  JSON.parse(broken);
} catch (err) {
  console.log("raw message:", err.message);
}
```

Run it and read the raw message your browser produced. Somewhere in there is a number telling you how many characters in the problem is. Let's dig that number out with a regular expression and translate it into a line and column a human can count to.

```js runnable
function findPosition(message) {
  // Engines say "position 21" or "(line 1 column 22)" — grab whichever.
  const posMatch = message.match(/position (\d+)/);
  if (posMatch) return Number(posMatch[1]);
  return null;
}

function lineAndColumn(text, position) {
  const before = text.slice(0, position);
  const line = before.split("\n").length;
  const lastNewline = before.lastIndexOf("\n");
  const column = position - lastNewline; // 1-based within the line
  return { line, column };
}

const broken = '{"name":"Ada", "age":}';
const pos = 21; // pretend the message gave us this

console.log("char position:", pos);
console.log("location:", lineAndColumn(broken, pos));
```

`findPosition` reads the number out of whatever the engine said. `lineAndColumn` counts newlines before that point to work out the line, then measures the distance from the last newline to get the column. For a one-line input the line is always 1 and the column is what you care about.

## A caret that points at the spot

Numbers are fine, but the kindest thing a formatter can do is draw an arrow at the broken character. We slice the text around the position and put a `^` underneath.

```js runnable
function pointAt(text, position) {
  const lines = text.split("\n");
  let remaining = position;
  let lineIndex = 0;

  // Walk lines until the position falls inside one.
  while (lineIndex < lines.length && remaining > lines[lineIndex].length) {
    remaining -= lines[lineIndex].length + 1; // +1 for the newline
    lineIndex += 1;
  }

  const badLine = lines[lineIndex] ?? "";
  const caret = " ".repeat(Math.max(0, remaining)) + "^";
  return badLine + "\n" + caret;
}

const broken = '{"name":"Ada", "age":}';
console.log(pointAt(broken, 21));
```

Run it and you get the line with a caret sitting under the character the parser choked on. For broken JSON that's usually right at — or one past — the real mistake, which is close enough to find it by eye.

## Wiring it into one honest formatter

Now we fold parsing, error catching, position-finding, and the caret into a single function that returns a clean result either way.

```js runnable
function findPosition(message) {
  const m = message.match(/position (\d+)/);
  return m ? Number(m[1]) : null;
}

function pointAt(text, position) {
  const slice = text.slice(0, position);
  const caret = " ".repeat(Math.max(0, position)) + "^";
  return text.split("\n")[0] + "\n" + caret;
}

function format(text) {
  try {
    return { ok: true, output: JSON.stringify(JSON.parse(text), null, 2) };
  } catch (err) {
    const pos = findPosition(err.message);
    const report = {
      ok: false,
      message: "Couldn't parse the JSON: " + err.message,
    };
    if (pos !== null) report.where = "\n" + pointAt(text, pos);
    return report;
  }
}

// A good one and three classic breakages.
console.log(format('{"name":"Ada","age":36}'));
console.log("");
console.log(format('{"name":"Ada","age":}'));      // missing value
console.log("");
console.log(format('{"name":"Ada" "age":36}'));    // missing comma
console.log("");
console.log(format("{'name':'Ada'}"));             // single quotes
```

Run the whole thing. The valid object formats cleanly. The three broken ones each come back with a message and, where the engine gave us a position, a caret under the trouble spot. Three of the most common JSON mistakes — missing value, missing comma, single quotes — now produce a result you can act on instead of a stack trace.

Your formatter no longer crashes on bad input, and it explains what it found. Next we ask a harder question: the JSON parsed fine, but is it the *right* data? That's the shape check in Phase 3.
