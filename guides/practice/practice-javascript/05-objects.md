---
title: "Objects"
guide: practice-javascript
phase: 5
summary: "Group related values into an object, then read them back with dot notation and template literals."
tags: [javascript, objects, template-literals]
difficulty: beginner
synonyms:
  - javascript objects
  - dot notation javascript
  - javascript template literals
updated: 2026-07-10
---

# Objects

An object groups related values under named keys: `{ title: "Dune", year: 1965
}` instead of three separate loose variables. You read a property back with
dot notation - `book.title` - and it reads almost like English.

Template literals (backticks instead of quotes) let you drop a variable or
expression straight into a string with `${...}`, instead of gluing pieces
together with `+`. Combine the two and you can build a display string directly
out of an object's properties, so it stays correct even if the object's values
change later.

**Your task:** create an object `book` with `title` (`"Dune"`), `author`
(`"Frank Herbert"`), and `year` (`1965`). Then build `summary`, a string reading
`"Dune by Frank Herbert (1965)"`, out of those properties.

**You'll practice:**

- Creating an object literal
- Reading properties with dot notation
- Building a string with a template literal

```lesson
{
  "language": "js",
  "starterCode": "// Create an object called book with title, author, and year.\nconst book = {\n\n};\n\n// Then create summary: \"<title> by <author> (<year>)\"\nconst summary = \"\";",
  "solution": "const book = {\n  title: \"Dune\",\n  author: \"Frank Herbert\",\n  year: 1965,\n};\n\nconst summary = `${book.title} by ${book.author} (${book.year})`;",
  "hints": ["An object literal looks like { key: value, key2: value2 }.", "Access a property with book.title, book.author, book.year.", "A template literal uses backticks: `${book.title} by ${book.author} (${book.year})`"],
  "tests": [
    { "name": "book has the right properties", "code": "if (book.title !== 'Dune' || book.author !== 'Frank Herbert' || book.year !== 1965) throw new Error('book should have title \"Dune\", author \"Frank Herbert\", year 1965');" },
    { "name": "summary is built from book", "code": "if (summary !== 'Dune by Frank Herbert (1965)') throw new Error('summary should be \"Dune by Frank Herbert (1965)\"');" }
  ]
}
```
