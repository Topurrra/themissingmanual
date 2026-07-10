---
title: "When Text Lies: Emoji, Graphemes, and the BOM"
guide: character-encodings-unicode
phase: 3
summary: "Why text turns into garbled symbols, how UTF-8 actually works, and the difference between bytes, code points, and the characters a user sees."
tags: [unicode, utf-8, encoding, text, mojibake, ascii]
difficulty: intermediate
synonyms:
  - what is utf-8
  - why is my text garbled
  - unicode vs ascii
  - what causes mojibake
  - bytes vs characters
  - why is string length wrong for emoji
  - what is a code point
  - byte order mark bom problem
updated: 2026-07-10
---

# When Text Lies: Emoji, Graphemes, and the BOM

By now you have two solid ideas: bytes are not characters (Phase 1), and UTF-8 maps Unicode code points to a variable number of bytes (Phase 2). You might think the picture is complete: *byte → code point → character, done.* It isn't. There's one more layer, and it's the one that makes `len("👨‍👩‍👧")` return a number that looks insane. What a human calls "one character" and what Unicode calls "one code point" are **not the same thing**. This phase is about that gap, and about the small landmine called the byte-order mark.

## Three different lengths for "one" string

Take what looks like a single emoji: 👍🏽 (thumbs-up with a medium skin tone). Ask three different questions about its length and you get three different answers.

```text
👍🏽
  bytes (UTF-8):     8
  code points:       2   (base thumbs-up + a skin-tone modifier)
  graphemes:         1   (what the user sees and calls "one character")
```

*What just happened:* The same visible symbol is 8 bytes, 2 code points, or 1 grapheme depending on which layer you measure. The skin tone is a separate code point that *combines* with the base thumbs-up. A **grapheme** (or "grapheme cluster") is the real "character" a human perceives - and it can be built from several code points stuck together.

This is not an emoji curiosity. It is fundamental to how Unicode handles accents, scripts, and combining marks. The letter `é` can be stored two completely different ways:

```text
é  as one code point:   U+00E9                  (precomposed)
é  as two code points:  U+0065 (e) + U+0301 (◌́) (e + combining acute accent)
```

*What just happened:* Both render as an identical `é` on screen, but one is a single code point and the other is two code points glued together. They look the same and read the same to a human, yet a naive `==` comparison can say they are different strings, because their code points (and bytes) differ. This is why "the search box won't match the name that's obviously right there" bugs happen.

## Why string length lies

Most programming languages report string length in code points or, worse, in their internal code units - not in graphemes. So the number your code reports and the number a user would count diverge the moment emoji or combining marks appear.

```python runnable
s = "👍🏽"
print("len() reports:", len(s))
print("bytes:", len(s.encode("utf-8")))
# a human counts this as 1 character
```

*What just happened:* Python's `len` reports **2** for what the user sees as a single thumbs-up, because Python counts code points and this emoji is two of them (base + skin-tone modifier). It is 8 bytes on disk. None of these numbers is "1", which is the only answer a human would give. The lesson: **never use string length to count what a user sees as characters.** For tweets, SMS limits, password rules, or cursor movement, you must count graphemes, which usually means a dedicated library, not the built-in `len`.

> "How long is this string?" is an ambiguous question. Always answer the real one: bytes (for storage and network), code points (for Unicode processing), or graphemes (for anything a human reads). Picking the wrong one silently is how you ship a bug.

This three-layer model - bytes underneath, code points in the middle, graphemes on top - is the complete picture. If you have read the [/guides/data-structures-explained](/guides/data-structures-explained) guide, it is the same lesson as arrays versus the things stored in them: the container's count and the meaningful count are different questions.

## The byte-order mark: an invisible saboteur

There is one more gremlin that produces "impossible" bugs: the **byte-order mark**, or BOM. It is an optional invisible marker (the code point U+FEFF) that some tools - Windows Notepad and Excel are the usual culprits - stick at the very front of a UTF-8 file. In UTF-8 it is the three bytes `[239, 187, 191]`.

```text
file saved with BOM:
[239, 187, 191, 123, 34, ...]
 └──── BOM ────┘ └─ your actual "{"...

Naive reader sees the first character as:  "{   (with an invisible  before it)
```

*What just happened:* The reader, not knowing about the BOM, treats those three leading bytes as part of the content. Your JSON parser chokes because the file does not "start with `{`" - it starts with an invisible character. Your config key `name` is silently stored as `name`. Two files that look byte-for-byte identical in your editor behave differently because one has three ghost bytes at the front.

UTF-8 does not need a BOM (recall from Phase 2 that UTF-8 has no endianness to mark), so the cleanest rule is: **write UTF-8 without a BOM, and strip a BOM when reading if one sneaks in.** When a file mysteriously fails to parse on the very first character - especially a file that round-tripped through Excel or Notepad - check the first three bytes before you suspect anything else.

For builders: your debugging toolkit for any "weird text" bug is now three questions, asked in order. (1) *Wrong decoder?* - if whole runs of text are garbled, it is a Phase 1 mojibake mismatch; find who chose the encoding. (2) *Length surprise?* - if counts or comparisons are off near accents or emoji, you are confusing bytes, code points, and graphemes; pick the layer you actually mean. (3) *Fails on the first byte?* - suspect a BOM. Those three cover the overwhelming majority of text bugs you will ever meet.

```quiz
[
  {
    "q": "A user sees 👍🏽 as one character. Why does len() in many languages report 2?",
    "choices": ["The function is buggy", "It counts code points, and this emoji is a base character plus a separate skin-tone modifier (2 code points)", "It counts bytes", "Emoji always count as 2 for billing"],
    "answer": 1,
    "explain": "Length functions usually count code points (or internal code units), not graphemes. This emoji is 2 code points combined into 1 grapheme - the single symbol the user perceives."
  },
  {
    "q": "Two strings both display as \"é\" but a == comparison says they are different. What is the most likely cause?",
    "choices": ["A corrupted file", "One is the precomposed code point U+00E9 and the other is e + combining accent (two code points)", "Different fonts", "One is UTF-8 and one is ASCII"],
    "answer": 1,
    "explain": "The same visible é can be one precomposed code point or a base letter plus a combining mark. They render identically but have different code points and bytes, so a naive == fails."
  },
  {
    "q": "A JSON file fails to parse, complaining about the very first character, even though it clearly starts with {. What should you suspect first?",
    "choices": ["The JSON is invalid", "A byte-order mark (BOM) - three invisible bytes prepended by an editor like Notepad or Excel", "The disk is full", "JSON does not support objects"],
    "answer": 1,
    "explain": "A BOM (U+FEFF, the bytes 239 187 191 in UTF-8) is invisible but sits before your {. A naive parser treats it as content and fails on the first character. Write UTF-8 without a BOM."
  }
]
```

[← Phase 2](02-how-utf-8-actually-works.md) | [Overview](_guide.md)
