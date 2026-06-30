---
title: "Character Encodings and Unicode"
guide: character-encodings-unicode
phase: 1
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

# Bytes Are Not Characters

Here is the thing nobody tells you up front, and it is the source of nearly every text bug you will ever hit: **a computer never stores characters. It stores numbers.** A file on disk, a packet on the wire, a string in memory — all of it is bytes, which are nothing more than numbers from 0 to 255. The letter `A` is not in that file. A *number* is in that file, and somewhere there is an agreement that says "when you see this number, draw an `A`."

That agreement is called an **encoding**. The whole topic of character encoding is the story of who agreed on what, what happens when two parties disagree, and how the world slowly built one table big enough to hold every character humans use.

## The two-step dance: encode and decode

Every piece of text makes a round trip. When you save text, the computer **encodes** it: it takes the characters in your head and turns them into bytes. When you open text, the computer **decodes** it: it takes bytes off the disk and turns them back into characters to show you.

```text
"Hi"  --encode-->  [72, 105]  --decode-->  "Hi"
characters          bytes               characters
```

*What just happened:* The string `Hi` became two numbers, 72 and 105, and then came back. The bytes in the middle are the only thing that ever touched the disk. The characters at either end only exist while a program is holding them.

The catch is the decode step. To turn bytes back into characters, the decoder has to know **which agreement was used to make them**. If you encode with one agreement and decode with a different one, you get the wrong characters out. That mismatch has a name, and you have seen it.

## Where it all started: ASCII

The original agreement was **ASCII**. It is a tiny table — 128 entries — mapping numbers 0 through 127 to the characters an American typewriter cared about: the uppercase and lowercase Latin letters, the digits, basic punctuation, and a handful of control codes like newline and tab.

```text
65 -> A      97  -> a      48 -> 0
66 -> B      98  -> b      32 -> (space)
67 -> C      99  -> c      10 -> (newline)
```

*What just happened:* These are the actual ASCII numbers. `A` is 65, `a` is 97 (lowercase letters sit 32 above their uppercase twins, which is why `c - 'a'` math works). Every plain-text file made of English fits in this table, one byte per character.

ASCII had one beautiful property: every character fit in a single byte, with room to spare (a byte holds 0–255; ASCII only used 0–127). For English, the world was simple. One byte, one character, no ambiguity. And then everyone who did not speak English showed up.

## The chaos years: code pages

A byte can hold 256 values, but ASCII only claimed the first 128. That left 128 unused slots (128–255), and every region on earth filled them with *their own* characters. Western Europe put accented letters there. Greece put the Greek alphabet there. Russia put Cyrillic there. These regional tables were called **code pages**, and there were dozens of them, all conflicting.

The disaster was inevitable. The same byte meant different things in different places:

```text
byte 233 decoded as Latin-1 (Western Europe)  ->  é
byte 233 decoded as Windows-1251 (Cyrillic)   ->  щ
byte 233 decoded as Mac Roman                 ->  È
```

*What just happened:* One identical byte, 233, produces three completely different characters depending on which code page the decoder assumes. The byte carries no label saying which table it belongs to. The reader has to guess — and when it guesses wrong, you get garbage.

> A byte does not know its own encoding. Nothing inside the number 233 tells you it means `é`. The encoding is context the reader supplies, and if that context is wrong, the text is wrong.

## Mojibake: the wrong-decoder bug

When bytes are decoded with the wrong agreement, the result is **mojibake** (a Japanese word, roughly "character transformation"). It is the `Ã©` and `â€™` you have seen in badly handled text. It is not random corruption — the bytes are perfectly intact. They are being *read* through the wrong table.

```text
Author writes:   café
Saved as UTF-8:  [99, 97, 102, 195, 169]
Read as Latin-1: c  a  f  Ã   ©
You see:         cafÃ©
```

*What just happened:* The é was encoded as two bytes in UTF-8 (195 and 169 — Phase 2 explains why two). When a reader decodes those same two bytes one at a time using Latin-1, byte 195 draws `Ã` and byte 169 draws `©`. The data is fine. The interpretation is broken. Re-decode the *same bytes* with UTF-8 and `café` comes right back.

This is the single most important takeaway of the whole guide: **mojibake is a decode-side mismatch, not data loss.** When you see it, the fix is almost never "the file is corrupt." The fix is "tell the reader the correct encoding."

For builders: this is why "what encoding?" is the first question to ask whenever text looks wrong. Not "is the file broken" — the file is usually fine. The reader was handed the wrong table.

```quiz
[
  {
    "q": "A text file contains the byte 233. What character does it represent?",
    "choices": ["é, always", "It depends on which encoding you decode it with", "A question mark", "Nothing — 233 is invalid"],
    "answer": 1,
    "explain": "A byte carries no encoding label. The same byte 233 is é in Latin-1, щ in Windows-1251, and so on. The decoder's chosen table decides."
  },
  {
    "q": "You open a file and see cafÃ© where café should be. What most likely happened?",
    "choices": ["The file is corrupted and data was lost", "The bytes were encoded as UTF-8 but decoded as Latin-1", "ASCII cannot store the letter c", "The disk has a hardware fault"],
    "answer": 1,
    "explain": "This is mojibake: a wrong-decoder mismatch. The bytes are intact; re-decoding the same bytes with the correct encoding (UTF-8) restores café."
  },
  {
    "q": "Why did code pages cause so many problems?",
    "choices": ["They were too slow", "Each region reused the same byte values (128-255) for different characters, with no label saying which", "They could not store English", "They used two bytes per character"],
    "answer": 1,
    "explain": "Code pages all claimed the upper 128 byte values for different characters. Identical bytes meant different things in different places, and nothing in the data said which."
  }
]
```

[← Overview](_guide.md) | [Phase 2: How UTF-8 Actually Works →](02-how-utf-8-actually-works.md)
