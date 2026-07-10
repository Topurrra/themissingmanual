---
title: "Capstone: word counter"
guide: practice-python
phase: 16
summary: "Combine a loop, a dict, and string methods to count word frequency in a piece of text."
tags: [python, capstone, dictionaries, strings]
difficulty: intermediate
synonyms:
  - python word count function
  - python capstone project
  - count word frequency python
updated: 2026-07-10
---

# Capstone: word counter

This is the function every text-processing tool eventually needs: split text
into words, then count how often each one shows up. It's also everything from
this module in one place - a loop, a dict, string methods, and a default value
for keys you haven't seen yet.

`text.lower().split()` lowercases the whole string, then splits it into a list
of words on whitespace. `counts.get(word, 0)` reads a dict value that might not
exist yet, falling back to `0` instead of raising - exactly what you need to
build up counts one word at a time.

**Your task:** write `word_count(text)`, returning a dict mapping each lowercase
word to how many times it appears in `text`.

**You'll practice:**

- Splitting and lowercasing a string
- Building up a dict with `.get(key, default)`

```lesson
{
  "language": "python",
  "starterCode": "# Write word_count(text): dict mapping each lowercase word to how many times it appears.\ndef word_count(text):\n    pass",
  "solution": "def word_count(text):\n    counts = {}\n    for word in text.lower().split():\n        counts[word] = counts.get(word, 0) + 1\n    return counts",
  "hints": ["text.lower().split() gives a list of lowercase words split on whitespace.", "counts.get(word, 0) returns 0 if word isn't in counts yet, so + 1 always works.", "word_count(\"a a b\") should be {\"a\": 2, \"b\": 1}."],
  "tests": [
    { "name": "counts repeated words", "code": "assert word_count(\"a a b\") == {\"a\": 2, \"b\": 1}, 'word_count(\"a a b\") should be {\"a\": 2, \"b\": 1}'" },
    { "name": "is case-insensitive", "code": "assert word_count(\"Cat cat CAT\") == {\"cat\": 3}, 'word_count(\"Cat cat CAT\") should be {\"cat\": 3}'" },
    { "name": "handles a sentence", "code": "assert word_count(\"to be or not to be\") == {\"to\": 2, \"be\": 2, \"or\": 1, \"not\": 1}, 'word counts should match the sentence'" }
  ]
}
```
