---
title: "A Tiny Shape Check"
guide: json-formatter-js
phase: 3
summary: "Validate parsed JSON against a small expected shape - required keys present and each value the right type."
tags: [javascript, json, validation, schema, types]
difficulty: beginner
synonyms:
  - validate json shape
  - check required keys
  - json type check
  - mini json schema
  - validate object structure
updated: 2026-07-16
---

# A Tiny Shape Check

Valid JSON and *correct* JSON are different things. `{}` parses fine. So does `{"age":"thirty"}`. Your formatter from Phase 2 is happy with both, and neither is the user record your code expected. This phase adds the missing question: does this data have the keys I need, with values of the types I need?

We're not building a schema library. We're writing about thirty lines that answer "is this the shape I asked for?" - and that turns out to cover most of what you actually check by hand.

## Describe the shape with an object

The simplest way to say what you expect is another object: each key maps to the type its value should be. We'll use the strings `JSON.parse` would produce, plus `"array"` since JavaScript reports arrays as `"object"` and we want to tell them apart.

Guess what plain `typeof` would say for `[1, 2, 3]` and for `null` before you run this - both are the reason this wrapper exists.

```js runnable
function typeOf(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value; // "string", "number", "boolean", "object"
}

console.log(typeOf("hi"));
console.log(typeOf(42));
console.log(typeOf([1, 2, 3]));
console.log(typeOf({ a: 1 }));
console.log(typeOf(null));
console.log(typeOf(true));
```

`typeOf` is the one helper we need. Plain `typeof` calls an array an object and calls `null` an object - both misleading. This wrapper sorts those two out so the rest of the check can trust what it gets back.

## Compare data to the shape

Now the check itself: something that takes parsed `data` and an expected `shape`, and tells you exactly what's wrong with it - if anything.

**Your turn.** `typeOf` is given below, unchanged. `checkShape` is the point of this phase, so have a go before you read on. Fill it in and hit Run: the checks underneath tell you whether it works. My version is in the next block whenever you want it.

```js runnable
function typeOf(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

function checkShape(data, shape) {
  // `shape` maps each expected key to the type string it should have
  // (as typeOf would report it: "string", "number", "boolean", "array",
  // "object", "null").
  //
  // Return an array of human-readable problem strings:
  //   - if `data` itself isn't an object, return a single problem saying so
  //   - for every key in `shape` missing from `data`, add a problem
  //   - for every key present with the wrong type, add a problem
  //   - collect ALL problems, don't stop at the first
  // An empty array means "data matches the shape."
}

// --- checks: fix your function until this prints "All good." ---
const shape = { name: "string", age: "number", admin: "boolean" };

const good = { name: "Ada", age: 36, admin: true };
const goodProblems = checkShape(good, shape);
if (!Array.isArray(goodProblems) || goodProblems.length !== 0) {
  throw new Error(`a fully matching object should report no problems, got: ${JSON.stringify(goodProblems)}`);
}

const bad = { name: "Ada", age: "36" }; // age wrong type, admin missing
const badProblems = checkShape(bad, shape);
if (!Array.isArray(badProblems) || badProblems.length !== 2) {
  throw new Error(`age has the wrong type AND admin is missing - expected 2 problems, got: ${JSON.stringify(badProblems)}`);
}

const notObject = checkShape("nope", shape);
if (!Array.isArray(notObject) || notObject.length !== 1) {
  throw new Error(`a non-object top level should report exactly one problem, got: ${JSON.stringify(notObject)}`);
}

console.log("All good.");
```

Stuck on collecting every problem instead of stopping at the first? Push each problem onto an array as you find it, instead of returning the moment something's wrong.

### One way to write it

```js runnable
function typeOf(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

function checkShape(data, shape) {
  const problems = [];

  if (typeOf(data) !== "object") {
    return ["Expected an object at the top level, got " + typeOf(data)];
  }

  for (const key of Object.keys(shape)) {
    const wanted = shape[key];
    if (!(key in data)) {
      problems.push('Missing key "' + key + '" (wanted ' + wanted + ")");
      continue;
    }
    const got = typeOf(data[key]);
    if (got !== wanted) {
      problems.push('Key "' + key + '" should be ' + wanted + ", got " + got);
    }
  }

  return problems;
}

const shape = { name: "string", age: "number", admin: "boolean" };

const good = { name: "Ada", age: 36, admin: true };
const bad = { name: "Ada", age: "36" }; // age wrong type, admin missing

console.log("good:", checkShape(good, shape));
console.log("bad: ", checkShape(bad, shape));
```

Walk the expected shape; for each key, confirm it exists in the data and that its value's type matches, collecting every problem instead of stopping at the first - one good report beats five round trips. Run it. The good record returns an empty array - no problems. The bad one returns two: `age` is a string where we wanted a number, and `admin` is missing entirely. An empty list means "passed." A non-empty list is your to-do list of fixes.

Notice we let extra keys slide. If the data has a `email` field our shape didn't mention, we don't complain. That's a deliberate choice - most of the time you care that the keys you *need* are right, not that nothing extra came along. We'll revisit that in the extend section next phase.

## Parse, then check, in one flow

The shape check works on parsed data, so it slots in right after the parse from Phase 2. Text in, and one of three outcomes out: didn't parse, parsed but wrong shape, or parsed and valid.

Three inputs go in below. Before you run it, guess which one hits `stage: "parse"`, which hits `stage: "shape"`, and which comes back valid.

```js runnable
function typeOf(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

function checkShape(data, shape) {
  const problems = [];
  if (typeOf(data) !== "object") {
    return ["Expected an object, got " + typeOf(data)];
  }
  for (const key of Object.keys(shape)) {
    if (!(key in data)) {
      problems.push('Missing "' + key + '"');
    } else if (typeOf(data[key]) !== shape[key]) {
      problems.push('"' + key + '" should be ' + shape[key] + ", got " + typeOf(data[key]));
    }
  }
  return problems;
}

function validate(text, shape) {
  let data;
  try {
    data = JSON.parse(text);
  } catch (err) {
    return { ok: false, stage: "parse", message: err.message };
  }

  const problems = checkShape(data, shape);
  if (problems.length > 0) {
    return { ok: false, stage: "shape", problems };
  }

  return { ok: true, output: JSON.stringify(data, null, 2) };
}

const shape = { name: "string", age: "number" };

console.log(validate('{"name":"Ada","age":36}', shape)); // valid
console.log(validate('{"name":"Ada","age":"36"}', shape)); // wrong type
console.log(validate('{"name":"Ada",}', shape));           // won't parse
```

Run all three. The first parses and matches the shape, so you get formatted output. The second parses but `age` is a string, so you get a shape problem. The third never parses, so you get a parse error and we never even reach the shape check. The `stage` field tells you which wall it hit.

## How far would you push this?

What we've got handles flat objects of basic types - which is a big slice of real-world JSON. It does *not* check nested objects, types inside arrays, or optional-versus-required keys. Those are real, and they're a natural next step:

| Want | Sketch |
| --- | --- |
| Nested objects | Let a shape value *be* a shape, and recurse into it |
| Typed arrays | Shape value like `["string"]` meaning "array of strings" |
| Optional keys | Mark some keys with a `?` and skip the "missing" check for them |

Each is a few more lines on the same idea. Resist adding them until you have JSON that needs them - a check you don't use is a check you have to maintain for nothing.

You now have a tool that formats, explains failures, and judges shape. Phase 4 ties a bow on it: a minify mode for when you want the bytes back, stable key sorting, and a couple of directions to take it further.
