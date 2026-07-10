---
title: "Time calculator"
guide: practice-python
phase: 14
summary: "Add a duration in minutes to a start time, wrapping correctly at 24 hours and reporting how many days later the end time lands."
tags: [python, modulo, time, arithmetic]
difficulty: intermediate
synonyms:
  - python time calculator
  - modulo arithmetic python
  - add duration to time python
  - wrap time at midnight python
updated: 2026-07-10
---

# Time calculator

A clock only has 24 hours - the 25th hour is really `1:00` the next day. The
`%` (modulo) operator is exactly the tool for that wraparound: `total_minutes
% (24 * 60)` gives you the minute-of-day no matter how many times past
midnight `total_minutes` has rolled, and `total_minutes // (24 * 60)`
(integer division) tells you how many full days it rolled past.

The trick to this whole problem is working in one flat unit - total minutes
since midnight - instead of juggling hours and minutes separately. Convert
the start time to minutes, add the duration, then convert back: the hour is
`minutes // 60` and the minute is `minutes % 60`.

**Your task:** write `add_duration(start_hour, start_min, duration_min)`.
`start_hour` is `0`-`23` and `start_min` is `0`-`59` (24-hour time).
`duration_min` is how many minutes to add. Return a tuple `(end_hour,
end_min, days_later)`, where `days_later` is `0` if the end time lands on
the same day, `1` if it rolls past one midnight, and so on.

**You'll practice:**

- Converting hours and minutes into one flat total, and back
- Using `//` and `%` together to wrap a value and count how many times it wrapped

```lesson
{
  "language": "python",
  "starterCode": "# Write add_duration(start_hour, start_min, duration_min):\n# returns (end_hour, end_min, days_later) after adding duration_min\n# minutes to the start time, wrapping at 24 hours.\ndef add_duration(start_hour, start_min, duration_min):\n    pass",
  "solution": "def add_duration(start_hour, start_min, duration_min):\n    total_start = start_hour * 60 + start_min\n    total_end = total_start + duration_min\n    days_later = total_end // (24 * 60)\n    remainder = total_end % (24 * 60)\n    return (remainder // 60, remainder % 60, days_later)",
  "hints": ["Flatten the start time into one number first: total_start = start_hour * 60 + start_min.", "Add duration_min to get total_end, then days_later = total_end // (24 * 60) and remainder = total_end % (24 * 60).", "The final hour and minute come from the remainder: remainder // 60 and remainder % 60."],
  "tests": [
    { "name": "adds within the same day, no rollover", "code": "assert add_duration(10, 30, 90) == (12, 0, 0), 'add_duration(10, 30, 90) should be (12, 0, 0)'" },
    { "name": "rolls exactly past midnight", "code": "assert add_duration(23, 0, 60) == (0, 0, 1), 'add_duration(23, 0, 60) should be (0, 0, 1)'" },
    { "name": "rolls past one full day plus change", "code": "assert add_duration(0, 0, 1500) == (1, 0, 1), 'add_duration(0, 0, 1500) should be (1, 0, 1)'" },
    { "name": "small addition with no rollover", "code": "assert add_duration(5, 45, 20) == (6, 5, 0), 'add_duration(5, 45, 20) should be (6, 5, 0)'" }
  ]
}
```
