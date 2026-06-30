---
title: "Character Encodings and Unicode"
guide: character-encodings-unicode
phase: 0
summary: "Why text turns into garbled symbols, how UTF-8 actually works, and the difference between bytes, code points, and the characters a user sees."
tags: [unicode, utf-8, encoding, text, mojibake, ascii]
category: programming-concepts
order: 10
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

# Character Encodings and Unicode

You opened a file and where a name should be, you got `Ã©` or `â€™` or a row of black diamonds with question marks. Or your code said a string was 7 characters long when the user clearly typed 5. Text feels like it should be the simplest thing a computer handles, and yet it betrays you constantly. The reason is almost always the same: somewhere, bytes were treated as characters, and they are not the same thing.

This guide gives you the one mental model that makes all of it click, then walks the real machinery, then shows you exactly where it breaks and how to never get burned again.

## How to read this

Read the phases in order the first time. Phase 1 installs the core distinction (bytes are not characters) that every later confusion depends on. Phase 2 is the everyday mechanics of UTF-8 and where most working programmers spend their time. Phase 3 is the deep end: emoji, combining characters, and why `length` lies. If you only have five minutes, read Phase 1 and the first section of Phase 2.

## The phases

1. [Bytes Are Not Characters](01-bytes-are-not-characters.md)
2. [How UTF-8 Actually Works](02-how-utf-8-actually-works.md)
3. [When Text Lies: Emoji, Graphemes, and the BOM](03-when-text-lies.md)

[Phase 1: Bytes Are Not Characters](01-bytes-are-not-characters.md) →
