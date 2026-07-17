---
title: "Fix the bug: the list shrinks while you walk it"
guide: practice-python
phase: 18
summary: "The cleanup function drops most of the backup files and quietly leaves one behind. Nothing raises. The loop is walking a list that keeps getting shorter underneath it."
tags: [python, lists, loops, mutation, debugging, list-comprehension]
difficulty: advanced
synonyms:
  - python remove from list while iterating
  - python for loop skips items after remove
  - list remove inside loop skipping elements
  - why does my loop miss elements python
  - python delete items from list in loop
  - modifying a list while looping over it
updated: 2026-07-17
---

# Fix the bug: the list shrinks while you walk it

Every deploy runs the folder through `clean_files` first. Editors leave `.bak`
copies of whatever you were last editing, and a web server does not know what a
`.bak` is - it just hands the raw file to anyone who asks for it by name. So the
script strips them before upload, and it has been stripping them for a year
without complaint.

Last Friday `styles.css.bak` showed up on the live site.

Nothing crashed. No traceback, no warning, no log line. `clean_files` was handed
six filenames, it removed two of the three backups, and it returned a list that
looks perfectly reasonable until you count what is in it. Run it and read the
output against the input - the survivor is sitting right there.

The loop is fine. The list is fine. What breaks is doing both at once.

**Your task:** fix `clean_files(files)` so it returns every filename that does
not end in `.bak` - all three backups gone, every other file kept, in order.

**You'll practice:**

- Reading a returned list as a claim, and counting whether the claim holds
- Spotting a loop whose list is being shortened underneath it

```lesson
{
  "language": "python",
  "starterCode": "# clean_files should drop every .bak file before upload. One of them survives.\ndef clean_files(files):\n    for f in files:\n        if f.endswith(\".bak\"):\n            files.remove(f)\n    return files\n\nprint(clean_files([\"app.js\", \"app.js.bak\", \"index.html\", \"logo.png\", \"notes.txt.bak\", \"styles.css.bak\"]))",
  "solution": "def clean_files(files):\n    return [f for f in files if not f.endswith(\".bak\")]\n\nprint(clean_files([\"app.js\", \"app.js.bak\", \"index.html\", \"logo.png\", \"notes.txt.bak\", \"styles.css.bak\"]))",
  "hints": [
    "Run it and read the output against the input. Six filenames went in, three of them ending in .bak, and one .bak came back out: styles.css.bak. Nothing raised, so nothing told you. The returned list is the only evidence that there is a bug at all.",
    "A for loop over a list does not hold the items - it holds a position, starting at 0 and stepping up by one each pass. Meanwhile .remove() is shortening that same list underneath it. Remove the item at index 1 and everything after it slides down one: what was at index 2 sits at index 1 now. But the loop has already moved on to index 2, so the item that slid down never gets looked at. It is skipped, silently. That is why two .bak files in a row are what break it: the second one always slides into the gap the first one left.",
    "Do not edit the list you are walking. Build a new one and return that instead: return [f for f in files if not f.endswith(\".bak\")] - that is the whole fix. Walking a copy works too (for f in files[:]) because the copy is never the list that shrinks."
  ],
  "tests": [
    { "name": "removes all three backups from the deploy folder", "code": "assert clean_files([\"app.js\", \"app.js.bak\", \"index.html\", \"logo.png\", \"notes.txt.bak\", \"styles.css.bak\"]) == [\"app.js\", \"index.html\", \"logo.png\"], 'clean_files should drop every .bak file and keep the rest in order'" },
    { "name": "removes a single backup between two keepers", "code": "assert clean_files([\"index.html\", \"app.js.bak\", \"logo.png\"]) == [\"index.html\", \"logo.png\"], 'a lone .bak between two keepers should be removed'" },
    { "name": "removes two backups sitting next to each other", "code": "assert clean_files([\"report.pdf\", \"notes.txt.bak\", \"styles.css.bak\", \"logo.png\"]) == [\"report.pdf\", \"logo.png\"], 'both .bak files should be gone, not just the first one'" }
  ]
}
```
