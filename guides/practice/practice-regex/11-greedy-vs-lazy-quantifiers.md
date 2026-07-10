---
title: "Greedy vs. lazy quantifiers"
guide: practice-regex
phase: 11
summary: "The same quantifier grabs a different amount of text depending on whether it's greedy (.+) or lazy (.+?)."
tags: [regex, greedy, lazy, quantifiers]
difficulty: intermediate
synonyms:
  - greedy vs lazy regex
  - regex lazy quantifier example
  - what does +? mean in regex
  - regex matching too much text
updated: 2026-07-10
---

# Greedy vs. lazy quantifiers

Phase 3's quantifiers (`+`, `{n,m}`) are all **greedy** by default - they
grab as much text as possible while still letting the whole pattern match.
Usually that's what you want, but it has a classic failure mode: pull the
text between the first pair of quotes in `'Say "hello" and "goodbye"'` and a
greedy `.+` doesn't stop at the *first* closing quote - it stops at the
*last* one, because `.+` between the outer quotes can still match, greedily,
all the way to the end.

Add a `?` right after the quantifier and it becomes **lazy**: it grabs as
*little* as possible instead, stopping the moment the rest of the pattern is
satisfied. `.+?` between two quotes stops at the very first closing quote.
Same pattern shape, opposite instinct - and knowing which one you need is the
difference between "it works" and "it somehow grabbed the whole file."

**Your task:** write `extractGreedy(str)`, returning the text between the
first `"` and the *last* `"` in `str` using a greedy quantifier, and
`extractLazy(str)`, returning the text between the first `"` and the *next*
`"` using a lazy quantifier. Return `null` if `str` has no quoted text.

**You'll practice:**

- Seeing greedy `.+` overshoot to the last possible match
- Making a quantifier lazy with `.+?` to stop at the first match instead

```lesson
{
  "language": "js",
  "starterCode": "// Write extractGreedy(str): text between the first \" and the LAST \" (greedy).\nfunction extractGreedy(str) {\n\n}\n\n// Write extractLazy(str): text between the first \" and the NEXT \" (lazy).\nfunction extractLazy(str) {\n\n}",
  "solution": "function extractGreedy(str) {\n  const result = str.match(/\"(.+)\"/);\n  return result ? result[1] : null;\n}\n\nfunction extractLazy(str) {\n  const result = str.match(/\"(.+?)\"/);\n  return result ? result[1] : null;\n}",
  "hints": ["/\"(.+)\"/ is greedy: .+ grabs as much as it can, so it stretches to the LAST \" in the string.", "/\"(.+?)\"/ is lazy: the ? after + makes it stop at the first \" it reaches.", "With only one quoted section, greedy and lazy agree - the difference only shows up with two or more."],
  "tests": [
    { "name": "extractGreedy overshoots to the last quote", "code": "if (extractGreedy('Say \"hello\" and \"goodbye\"') !== 'hello\" and \"goodbye') throw new Error('extractGreedy should grab all the way to the last quote');" },
    { "name": "extractLazy stops at the first closing quote", "code": "if (extractLazy('Say \"hello\" and \"goodbye\"') !== 'hello') throw new Error('extractLazy(\"Say \\\"hello\\\" and \\\"goodbye\\\"\") should be \"hello\"');" },
    { "name": "extractGreedy matches a single quoted pair normally", "code": "if (extractGreedy('Just \"one\" quote pair') !== 'one') throw new Error('extractGreedy should return \"one\" when there is only one quoted pair');" },
    { "name": "extractLazy returns null with no quotes", "code": "if (extractLazy('no quotes here') !== null) throw new Error('extractLazy(\"no quotes here\") should be null');" }
  ]
}
```
