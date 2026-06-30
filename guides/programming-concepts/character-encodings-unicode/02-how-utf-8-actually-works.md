---
title: "How UTF-8 Actually Works"
guide: character-encodings-unicode
phase: 2
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
updated: 2026-06-30
---

# How UTF-8 Actually Works

The code-page chaos from Phase 1 had an obvious cure: stop having dozens of conflicting 256-entry tables and build **one table for every character on earth**. That table is **Unicode**. But Unicode by itself only solves half the problem — it assigns numbers; it does not say how to store them in bytes. The genius part, the part that actually runs the modern internet, is the *byte* encoding called **UTF-8**. This phase pulls those two apart, because confusing them is where intermediate developers get stuck.

## Unicode is the catalogue, not the storage

Unicode does one job: it gives every character a unique number called a **code point**. That is it. `A` is code point 65. `é` is code point 233. The euro sign `€` is 8364. The grinning face emoji is 128512. Code points are written in a standard hex form like `U+0041` (that is 65, the letter `A`).

```text
A    ->  U+0041  (65)
é    ->  U+00E9  (233)
€    ->  U+20AC  (8364)
😀   ->  U+1F600 (128512)
```

*What just happened:* These are the canonical Unicode code points. Notice they got large — the emoji is over a hundred thousand. A single byte stops at 255, so there is no way to cram these numbers into one byte each. Unicode the catalogue says *what number* a character is. It pointedly does **not** say how to write that number as bytes on disk. That is a separate decision, and there is more than one way to make it.

The cleanest mental model: **Unicode = the dictionary of characters and their numbers. The encoding = how you serialize those numbers into bytes.** Same dictionary, several possible byte formats.

## UTF-8: the encoding that won

The encoding the world settled on is **UTF-8**. It is a *variable-width* encoding: a character takes between one and four bytes depending on how big its code point is. This is its superpower. It packs the common case tight and only spends extra bytes when it has to.

```text
code point range        bytes used
U+0000  – U+007F        1 byte
U+0080  – U+07FF        2 bytes
U+0800  – U+FFFF        3 bytes
U+10000 – U+10FFFF      4 bytes
```

*What just happened:* The smaller the code point, the fewer bytes. Every ASCII character (U+0000–U+007F) is exactly one byte in UTF-8 — and it is the *same* byte ASCII always used. That is the killer feature: **valid ASCII is already valid UTF-8.** Decades of English text and existing code "just work" with zero conversion. The accented `é` and the euro sign cost two or three bytes; emoji cost four.

So a string's byte length and its character count are no longer the same number — and that gap is exactly what trips people up.

```text
"héllo"   ->  5 characters, but 6 bytes (the é takes 2)
"€5"      ->  2 characters, but 4 bytes (the € takes 3)
```

*What just happened:* `héllo` looks like five characters because it is — but on disk it is six bytes, because the `é` quietly costs two. Any code that assumes "bytes = characters" (slicing a string at byte 3, for example) can cut a multi-byte character in half and produce garbage.

## Seeing the bytes for real

Here is the round trip from Phase 1, now made concrete. You can run this.

```python runnable
s = "café"
encoded = s.encode("utf-8")
print("characters:", len(s))
print("bytes:", len(encoded))
print("byte values:", list(encoded))
print("round trip:", encoded.decode("utf-8"))
```

*What just happened:* The string has 4 characters but 5 bytes — the `é` is the two bytes `[195, 169]`, exactly the pair from Phase 1's mojibake example. `encode("utf-8")` turned characters into bytes; `decode("utf-8")` turned them back. Decode those same bytes with `"latin-1"` instead and you would get `café` mangled into `cafÃ©`.

## Why UTF-8 beat the alternatives

There were other ways to encode Unicode. UTF-16 uses two bytes for most characters; UTF-32 uses a flat four bytes for everything. Both waste space on English-heavy text and, worse, both raise a nasty question: when a character is more than one byte, **which byte comes first?**

```text
The same code point U+0041 (A) in UTF-16:
big-endian:    [0x00, 0x41]
little-endian: [0x41, 0x00]
```

*What just happened:* Multi-byte encodings have to decide byte order ("endianness"), and the two orders are incompatible. Get it wrong and every character is scrambled. UTF-16 and UTF-32 carry this hazard. UTF-8 sidesteps it entirely — its byte order is fixed by the format itself, so there is never an endianness question. That, plus ASCII compatibility and compactness, is why UTF-8 became the default of the web, of Linux, of JSON, of basically everything new.

> Default to UTF-8 everywhere and say so out loud. Set it on your files, your database columns, your HTTP `Content-Type` headers, your editor. The most reliable way to avoid Phase 1's mojibake is to make sure encoder and decoder both assume UTF-8 — and the way to guarantee that is to declare it explicitly rather than hope.

For builders: when you read or write text in code, name the encoding. `open(path, encoding="utf-8")`, not bare `open(path)` — the bare form uses the operating system's default, which differs between Windows and Linux and is a classic "works on my machine" trap. Make the byte format an explicit decision, not an accident of the host. (If you want the deeper picture of how those bytes sit in memory, the [/guides/how-a-computer-works](/guides/how-a-computer-works) guide covers the layer underneath.)

```quiz
[
  {
    "q": "What is the difference between Unicode and UTF-8?",
    "choices": ["They are two names for the same thing", "Unicode assigns a number (code point) to each character; UTF-8 is one way to encode those numbers as bytes", "Unicode is for English, UTF-8 is for everything else", "UTF-8 is older than Unicode"],
    "answer": 1,
    "explain": "Unicode is the catalogue mapping characters to code points. UTF-8 is a byte encoding — one of several ways to serialize those code points into bytes."
  },
  {
    "q": "How many bytes does the string \"café\" take when encoded as UTF-8?",
    "choices": ["4 bytes", "5 bytes — the é takes two", "8 bytes", "3 bytes"],
    "answer": 1,
    "explain": "Four characters, but the é is a 2-byte sequence (195, 169), so the total is 5 bytes. Byte count and character count are not the same in UTF-8."
  },
  {
    "q": "Why does UTF-8 have no byte-order (endianness) problem when UTF-16 does?",
    "choices": ["UTF-8 only stores English", "UTF-8's byte order is fixed by the format, while UTF-16 stores multi-byte units that can be ordered big- or little-endian", "UTF-8 always uses one byte", "UTF-16 is not a real encoding"],
    "answer": 1,
    "explain": "UTF-16 stores multi-byte code units whose order can differ (big- vs little-endian). UTF-8's byte sequence order is defined by the encoding itself, so the question never arises."
  }
]
```

[← Phase 1](01-bytes-are-not-characters.md) | [Overview](_guide.md) | [Phase 3: When Text Lies →](03-when-text-lies.md)
