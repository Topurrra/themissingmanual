---
title: "Minify and Extend"
guide: json-formatter-js
phase: 4
summary: "Add a whitespace-free minify mode, sort keys for stable output, and sketch a diff between two JSON values."
tags: [javascript, json, minify, sorting, diff]
difficulty: beginner
synonyms:
  - minify json
  - compact json
  - sort json keys
  - stable json output
  - diff two json
updated: 2026-07-16
---

# Minify and Extend

Pretty-printing makes JSON readable. Sometimes you want the opposite - the smallest possible string to send over the wire or stuff into a config field. This phase adds a minify mode, then a key-sorting option that makes output stable enough to diff, and finishes with directions to keep going after the weekend's over.

## Minify is the same call, minus the indent

You already know how to minify. It's `JSON.stringify` with no indent argument. Parse to clean out whatever spacing was there, stringify with no spacing to get the tightest valid form.

Guess roughly how many characters shorter the minified version will be before you run it and see the real number.

```js runnable
function minify(text) {
  return JSON.stringify(JSON.parse(text));
}

const spaced = `{
  "name": "Ada",
  "langs": [ "Pascal", "Ada" ],
  "active": true
}`;

const small = minify(spaced);
console.log(small);
console.log("from", spaced.length, "chars down to", small.length);
```

Run it. The multi-line input collapses to one line and you'll see the character count drop. Parsing first matters - it guarantees the output is valid JSON, not a clumsy find-and-replace on whitespace that would mangle spaces *inside* string values.

## One function, both directions

There's no reason to keep two functions. A `mode` argument picks pretty or compact, and both share the same parse.

```js runnable
function convert(text, mode = "pretty") {
  const data = JSON.parse(text);
  if (mode === "minify") return JSON.stringify(data);
  return JSON.stringify(data, null, 2);
}

const raw = '{"id":7,"tags":["x","y"]}';

console.log("--- pretty ---");
console.log(convert(raw, "pretty"));
console.log("--- minify ---");
console.log(convert(raw, "minify"));
```

Run it and watch the same input come out two ways. That's your formatter and your minifier in one place.

## Sorting keys for stable output

Here's a problem you hit the moment you try to compare two JSON files: object key order. `{"a":1,"b":2}` and `{"b":2,"a":1}` are the *same data*, but as text they're different lines, and any diff tool will light up red. The fix is to sort keys before stringifying, so the same data always produces the same text.

That third argument to `JSON.stringify` - the replacer we skipped in Phase 1 - has a second form worth knowing about. We'll use it here, alongside the function form from a moment ago.

**Your turn.** `sortedFormat` is the point of this phase - the thing that makes two files holding the same data produce identical text. Have a go before you read on. Fill it in and hit Run: the checks underneath tell you whether it works. My version is in the next block whenever you want it.

```js runnable
function sortedFormat(text, indent = 2) {
  // Parse `text`, then stringify it with every key across the whole
  // structure written in alphabetical order (not just the top level).
  // Use `indent` spaces per level. Return the formatted string.
  //
  // Hint: JSON.stringify's second argument (the replacer) can be either
  // a function called for every key/value, or an array of key names to
  // include (in that order). You get to use both forms here.
}

// --- checks: fix your function until this prints "All good." ---
const messy = '{"name":"Ada","age":36,"admin":true,"name2":"x"}';
const out = sortedFormat(messy);
if (typeof out !== "string") {
  throw new Error(`sortedFormat should return a string, got: ${JSON.stringify(out)}`);
}

const keysInOrder = [...out.matchAll(/"(\w+)":/g)].map((m) => m[1]);
const expectedOrder = ["admin", "age", "name", "name2"];
if (JSON.stringify(keysInOrder) !== JSON.stringify(expectedOrder)) {
  throw new Error(`keys should come out alphabetically as ${JSON.stringify(expectedOrder)}, got: ${JSON.stringify(keysInOrder)}`);
}

const parsed = JSON.parse(out);
if (parsed.name !== "Ada" || parsed.age !== 36 || parsed.admin !== true || parsed.name2 !== "x") {
  throw new Error(`sorting keys should not change the values, got: ${out}`);
}

const nested = '{"b":{"z":1,"a":2},"a":1}';
const nestedOut = sortedFormat(nested);
const nestedKeys = [...nestedOut.matchAll(/"(\w+)":/g)].map((m) => m[1]);
if (JSON.stringify(nestedKeys) !== JSON.stringify(["a", "b", "a", "z"])) {
  throw new Error(`sorting should reach into nested objects too, got: ${JSON.stringify(nestedKeys)}`);
}

console.log("All good.");
```

Stuck on reaching the nested keys too? The function-form replacer runs once for every key anywhere in the structure, not just the top-level ones - that's how you can collect all of them in a single pass.

### One way to write it

```js runnable
function sortedFormat(text, indent = 2) {
  const data = JSON.parse(text);
  // Gather every key across the whole structure, sorted.
  const keys = new Set();
  JSON.stringify(data, (key, value) => {
    if (key) keys.add(key);
    return value;
  });
  const ordered = [...keys].sort();
  return JSON.stringify(data, ordered, indent);
}

const messy = '{"name":"Ada","age":36,"admin":true,"name2":"x"}';

console.log("--- as written ---");
console.log(JSON.stringify(JSON.parse(messy), null, 2));
console.log("--- keys sorted ---");
console.log(sortedFormat(messy));
```

That second form: pass the replacer an *array of keys* and it outputs only those keys, in that order - hand it the sorted list of every key and you get sorted output. We use the *replacer-as-function* form once to collect all keys, then the *replacer-as-array* form to emit them in sorted order. Run it. The first block keeps the original key order; the second alphabetizes every key. Now two files holding the same data, formatted this way, produce identical text - and a diff between them shows only real differences.

## The whole tool, assembled

Here's everything from all four phases in one place - parse, pretty-print, explain errors, check shape, minify, sort. This is the thing you set out to build.

```js runnable
function typeOf(v) {
  if (v === null) return "null";
  if (Array.isArray(v)) return "array";
  return typeof v;
}

function checkShape(data, shape) {
  const problems = [];
  if (typeOf(data) !== "object") return ["Expected an object, got " + typeOf(data)];
  for (const key of Object.keys(shape)) {
    if (!(key in data)) problems.push('Missing "' + key + '"');
    else if (typeOf(data[key]) !== shape[key]) {
      problems.push('"' + key + '" should be ' + shape[key] + ", got " + typeOf(data[key]));
    }
  }
  return problems;
}

function jsonTool(text, { mode = "pretty", sort = false, shape = null } = {}) {
  let data;
  try {
    data = JSON.parse(text);
  } catch (err) {
    return { ok: false, stage: "parse", message: err.message };
  }

  if (shape) {
    const problems = checkShape(data, shape);
    if (problems.length) return { ok: false, stage: "shape", problems };
  }

  let replacer = null;
  if (sort) {
    const keys = new Set();
    JSON.stringify(data, (k, v) => (k && keys.add(k), v));
    replacer = [...keys].sort();
  }

  const indent = mode === "minify" ? undefined : 2;
  return { ok: true, output: JSON.stringify(data, replacer, indent) };
}

const raw = '{"name":"Ada","age":36,"admin":true}';

console.log(jsonTool(raw)); // pretty
console.log(jsonTool(raw, { mode: "minify" }));
console.log(jsonTool(raw, { sort: true }));
console.log(jsonTool(raw, { shape: { name: "string", age: "number" } }));
console.log(jsonTool('{"name":"Ada","age":"36"}', { shape: { name: "string", age: "number" } }));
console.log(jsonTool('{"name":}', {})); // broken
```

Run it. One function, one options object, every behavior we built. Pretty by default, minify on request, sorted on request, shape-checked when you hand it a shape, and a clean error report when the text won't parse. That's a real tool.

## Where to take it next

You've got a working formatter and validator. Here are directions worth a future afternoon - each builds on what's already here, none needs a library.

| Idea | The seed |
| --- | --- |
| Diff two JSONs | Parse both, walk keys, report added / removed / changed |
| Nested shape check | Let a shape value be another shape and recurse |
| Highlight | Wrap strings, numbers, keys in spans for colour in a page |
| Sort + diff combo | Sort both inputs first so the diff shows only real changes |

The diff is the most fun, so here's a starting sketch - a shallow compare of two flat objects that reports what changed.

Before you run it, count by eye: how many keys change value between `before` and `after`, and how many are brand new?

```js runnable
function diff(a, b) {
  const changes = [];
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    if (!(key in a)) changes.push("added " + key + " = " + JSON.stringify(b[key]));
    else if (!(key in b)) changes.push("removed " + key);
    else if (JSON.stringify(a[key]) !== JSON.stringify(b[key])) {
      changes.push("changed " + key + ": " + JSON.stringify(a[key]) + " -> " + JSON.stringify(b[key]));
    }
  }
  return changes;
}

const before = { name: "Ada", age: 36, admin: false };
const after = { name: "Ada", age: 37, admin: true, email: "a@x.io" };

console.log(diff(before, after));
```

Run it. You get `age` changed, `admin` changed, and `email` added - a small, clear diff. Notice it uses `JSON.stringify` to compare values, the same trick that lets it tell `[1,2]` apart from `[1,3]` without writing a deep-equality function. Make it recurse into nested objects and you've got something genuinely useful.

That's the build. You started with a one-line mess and ended with a tool that formats it, tells you when it's broken and where, checks it's the data you meant, shrinks it back down, and can even tell you what changed between two versions - every line of which you understand, because you ran all of it yourself.
