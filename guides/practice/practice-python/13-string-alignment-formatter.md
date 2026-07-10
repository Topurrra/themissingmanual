---
title: "String-alignment formatter"
guide: practice-python
phase: 13
summary: "Given a list of (a, op, b) arithmetic problems, build a multi-line string with each problem's operands right-aligned over a dashed line."
tags: [python, string-formatting, alignment, strings]
difficulty: intermediate
synonyms:
  - python string alignment
  - format arithmetic problems python
  - right align strings python
  - rjust python string formatting
updated: 2026-07-10
---

# String-alignment formatter

`str.rjust(width)` pads a string with spaces on the left until it's `width`
characters long - the same trick you'd use to line up numbers in a column
by hand, except Python does the padding for you. Get the width right and
operands of different lengths still line up on their last digit.

That's exactly what a hand-written arithmetic problem looks like on paper:
the operand, then the operator and the other operand right below it, then a
line under both:

```
   32
+ 698
-----
```

The width of that block is the longer operand's length plus 2 (one character
for the operator, one for the space after it). The top line is just the
first operand right-justified to that width. The second line is the operator
followed by the second operand, right-justified to `width - 1` (leaving room
for the operator itself). The dashes are exactly `width` long.

**Your task:** write `format_problems(problems)`, where `problems` is a list
of `(a, op, b)` tuples (`op` is `"+"` or `"-"`). For each tuple, build a
3-line block like the one above. Join multiple blocks with a blank line
between them, and return it all as one string.

**You'll practice:**

- Right-justifying strings to a computed width with `.rjust()`
- Building a multi-line result by joining pieces with `\n`

```lesson
{
  "language": "python",
  "starterCode": "# Write format_problems(problems): problems is a list of (a, op, b) tuples.\n# For each, build a 3-line block: a right-justified, then \"op b\" right-justified\n# one column narrower, then a line of dashes as wide as the block.\n# Join blocks with a blank line between them.\ndef format_problems(problems):\n    pass",
  "solution": "def format_problems(problems):\n    blocks = []\n    for a, op, b in problems:\n        width = max(len(str(a)), len(str(b))) + 2\n        line1 = str(a).rjust(width)\n        line2 = op + str(b).rjust(width - 1)\n        dashes = \"-\" * width\n        blocks.append(f\"{line1}\\n{line2}\\n{dashes}\")\n    return \"\\n\\n\".join(blocks)",
  "hints": ["width = max(len(str(a)), len(str(b))) + 2 - room for the wider operand plus the operator and its space.", "line1 = str(a).rjust(width); line2 = op + str(b).rjust(width - 1) (the operator takes the first column, the number fills the rest).", "Join each block's 3 lines with \\n, then join multiple blocks with \\n\\n (a blank line between them)."],
  "tests": [
    { "name": "formats a single addition problem", "code": "assert format_problems([(32, '+', 698)]) == '   32\\n+ 698\\n-----', 'format_problems([(32, \"+\", 698)]) should be \"   32\\\\n+ 698\\\\n-----\"'" },
    { "name": "formats a single subtraction problem", "code": "assert format_problems([(10, '-', 3)]) == '  10\\n-  3\\n----', 'format_problems([(10, \"-\", 3)]) should be \"  10\\\\n-  3\\\\n----\"'" },
    { "name": "joins two problems with a blank line between them", "code": "assert format_problems([(32, '+', 698), (3801, '-', 2)]) == '   32\\n+ 698\\n-----\\n\\n  3801\\n-    2\\n------', 'two problems should be joined with a blank line between their blocks'" }
  ]
}
```
