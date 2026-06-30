---
title: "Parse and Pretty-Print"
guide: json-formatter-js
phase: 1
summary: "Turn a cramped one-line JSON string into clean, indented output using JSON.parse and JSON.stringify."
tags: [javascript, json, formatting, parse, stringify]
difficulty: beginner
synonyms:
  - pretty print json
  - format json string
  - json indent
  - beautify json javascript
  - json stringify indent
updated: 2026-06-30
---

# Parse and Pretty-Print

The core of a JSON formatter is two function calls. Text comes in, becomes a real JavaScript value, then becomes text again — but the second time, with indentation. That round trip is the whole trick, and once you see it you'll wonder why you ever pasted JSON into a website.

## Text is not data

When an API sends you JSON, you get a *string*. It looks like an object, but to JavaScript it's a wall of characters. You can't read `.name` off it. You have to parse it first.

```js runnable
const raw = '{"name":"Ada","langs":["Pascal","Ada"]}';

console.log("type of raw:", typeof raw);

const data = JSON.parse(raw);
console.log("type after parse:", typeof data);
console.log("now we can reach in:", data.name);
```

`JSON.parse` reads the string and hands back the real thing — an object you can index into. Run that and you'll see the type change from `string` to `object`, and `data.name` gives you `Ada`.

## Going the other way, with spacing

`JSON.stringify` does the reverse: a value goes in, a string comes out. Most people stop at `JSON.stringify(data)` and get back the same cramped single line. The fix is the *third argument* — the number of spaces to indent with.

```js runnable
const data = { name: "Ada", langs: ["Pascal", "Ada"] };

console.log("--- no indent ---");
console.log(JSON.stringify(data));

console.log("--- indent of 2 ---");
console.log(JSON.stringify(data, null, 2));
```

That `null` in the middle is the *replacer* slot — a hook for transforming values as they're written. We don't need it yet, so we pass `null`. The `2` is what matters: two spaces per level. Try changing it to `4`, or to the string `"\t"` for tabs, and run it again.

## Putting both halves together

A formatter is parse-then-stringify. Take messy text, turn it into data, turn the data back into clean text.

```js runnable
function format(text, indent = 2) {
  const data = JSON.parse(text);
  return JSON.stringify(data, null, indent);
}

const messy = '{"id":7,"tags":["a","b"],"meta":{"draft":true,"views":0}}';

console.log(format(messy));
```

Run it. The cramped input comes out laid out across multiple lines, nested objects indented under their parents, arrays spaced cleanly. That `format` function is the spine of everything we build from here.

Notice what `JSON.parse` did for free along the way: it *normalized* the data. Whatever odd-but-legal spacing was in the input is gone, replaced by exactly the indentation you asked for. Run this to see it cope with input that's already a mess of inconsistent whitespace:

```js runnable
function format(text, indent = 2) {
  return JSON.stringify(JSON.parse(text), null, indent);
}

const ugly = '{ "a" :1,   "b":[  2,3 ,  4],"c"   : { "d" : true } }';

console.log(format(ugly));
```

Same clean result. The parser threw away the input's spacing and the stringifier rebuilt it consistently. That's why "format this JSON" and "is this JSON valid" are answered by the same two calls — if it parses, it formats.

## What JSON.parse is strict about

JSON looks like JavaScript, but it's a stricter dialect. The parser will reject things that are fine in your code:

| Allowed in JS | Allowed in JSON? |
| --- | --- |
| Single quotes `'x'` | No — keys and strings need double quotes |
| Trailing comma `[1,2,]` | No |
| Unquoted keys `{a:1}` | No — keys must be quoted strings |
| Comments `// note` | No |
| `undefined` | No — use `null` |

This strictness is a feature. It means valid JSON parses the same way everywhere, in every language. It also means the day your input is *not* valid, the parser throws — and right now our `format` function would crash and take the page with it.

Run this to watch it fail. The error is real; the page survives because the block is isolated, but in a real tool an uncaught throw stops everything:

```js runnable
function format(text, indent = 2) {
  return JSON.stringify(JSON.parse(text), null, indent);
}

const broken = '{"name":"Ada", "langs":["Pascal","Ada",]}'; // trailing comma

try {
  console.log(format(broken));
} catch (err) {
  console.log("It threw:", err.message);
}
```

There's the trailing comma biting us. The raw message is cryptic and the line number is useless for a one-line string. We can do far better than `Unexpected token`.

That's exactly Phase 2: catching that throw and turning it into something a human can act on — what broke, and roughly where. You've already got a working pretty-printer. Next we make it honest about failure.
