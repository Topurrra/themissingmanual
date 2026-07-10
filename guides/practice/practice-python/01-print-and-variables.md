---
title: "Print and variables"
guide: practice-python
phase: 1
summary: "Store values in variables and build a message out of them with an f-string."
tags: [python, variables, print, f-strings]
difficulty: beginner
synonyms:
  - python variables
  - python f-strings
  - print in python
updated: 2026-07-10
---

# Print and variables

A variable is a name for a value - `name = "Ada"` stores the text `"Ada"` under
the name `name`. No `let` or `const` in Python; you just assign, and the name
is ready to use.

An f-string builds a new string out of variables: `f"{name} is here"` drops the
current value of `name` right into the text. Put an `f` before the opening
quote and wrap any expression in `{}` - Python fills it in when the string is
built, not before.

**Your task:** create `name` as `"Ada"`, `age` as `28`, and `message` as an
f-string reading `"Ada is 28 years old"`, built from those two variables.

**You'll practice:**

- Assigning a variable
- Building a string with an f-string

```lesson
{
  "language": "python",
  "starterCode": "# Create name = \"Ada\", age = 28, and message using an f-string.\nname = \"\"\nage = 0\nmessage = \"\"",
  "solution": "name = \"Ada\"\nage = 28\nmessage = f\"{name} is {age} years old\"",
  "hints": ["An f-string starts with f right before the quotes: f\"...\"", "Put a variable inside curly braces to insert its value: f\"{name}\"", "message should read exactly \"Ada is 28 years old\"."],
  "tests": [
    { "name": "name and age are set", "code": "assert name == \"Ada\" and age == 28, 'name should be \"Ada\" and age should be 28'" },
    { "name": "message is built with an f-string", "code": "assert message == \"Ada is 28 years old\", 'message should be \"Ada is 28 years old\"'" }
  ]
}
```
