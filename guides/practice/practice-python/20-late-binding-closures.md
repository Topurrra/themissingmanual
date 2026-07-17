---
title: "Fix the bug: every handler reports the last channel"
guide: practice-python
phase: 20
summary: "Three notifiers built in a loop, three clean strings back, and all three name the same channel. Nothing throws. The lambdas captured the variable, not its value."
tags: [python, closures, late-binding, lambda, loops, debugging]
difficulty: advanced
synonyms:
  - python lambda in loop returns last value
  - all my closures have the same value python
  - python closure captures variable not value
  - lambda in for loop python bug
  - python late binding closure fix
updated: 2026-07-17
---

# Fix the bug: every handler reports the last channel

A deploy tool builds one notifier per alert channel up front, hands the list to
the scheduler, and the scheduler calls them later when a build finishes. It ran
for a month before anyone noticed every channel was reporting `sms`.

Nothing throws. The list holds three separate functions, exactly as intended,
and each one hands back a clean string. They just all hand back the *same*
string - the last one. Spot-check `senders[-1]()` and it looks perfect, which is
why this walks through review.

The mechanism is not what most people assume. A `lambda` does not capture the
*value* of `name` at the moment it is created. Its body does not run at all
then. It captures the *variable* `name` - the same one the loop keeps
reassigning - and reads it later, when it is finally called. All three lambdas
share that one variable, and by the time the scheduler calls them the loop has
long finished and left `name` set to `"sms"`. These are not three functions that
each remembered a different channel. They are three functions looking in the same
box, and the box holds the last thing the loop put in it.

**Your task:** fix `make_senders(channels)` so `senders[i]()` returns
`"alert sent to <channels[i]>"` at every index, not just the last one.

**You'll practice:**

- Reading three identical outputs as a bug rather than a coincidence
- Binding a loop variable's current value into a closure instead of the variable itself

```lesson
{
  "language": "python",
  "starterCode": "# Each alert channel gets its own notifier. Run it - all three report the same channel.\ndef make_senders(channels):\n    senders = []\n    for name in channels:\n        senders.append(lambda: f\"alert sent to {name}\")\n    return senders\n\nfor send in make_senders([\"email\", \"slack\", \"sms\"]):\n    print(send())",
  "solution": "def make_senders(channels):\n    senders = []\n    for name in channels:\n        senders.append(lambda name=name: f\"alert sent to {name}\")\n    return senders\n\nfor send in make_senders([\"email\", \"slack\", \"sms\"]):\n    print(send())",
  "hints": [
    "Run it. Three notifiers, three identical lines, every one of them 'sms'. Now look at the list that went in: email and slack are right there. The loop really did append three separate lambdas, and two of them still answer with the wrong channel - so the bug is in what those lambdas read, not in how many got made.",
    "A lambda's body does not run when you create it. It runs when you call it, long after the loop is over. And it does not hold a copy of name - it holds name itself, the one variable the loop reassigns on every pass. All three lambdas share it. The loop ends with name set to 'sms', so all three read 'sms' when the scheduler finally calls them. The last one looks right only because 'sms' happens to be its own channel.",
    "Bind the current value into each lambda at creation time with a default argument. Defaults are evaluated once, right where the lambda is defined, so each pass of the loop gives its lambda a private copy: senders.append(lambda name=name: f\"alert sent to {name}\"). functools.partial(lambda name: f\"alert sent to {name}\", name) does the same job if you prefer it."
  ],
  "tests": [
    { "name": "the first notifier reports its own channel", "code": "s = make_senders([\"email\", \"slack\", \"sms\"])\nassert s[0]() == \"alert sent to email\", 'senders[0]() should be \"alert sent to email\", not the last channel'" },
    { "name": "the middle notifier reports its own channel", "code": "s = make_senders([\"email\", \"slack\", \"sms\"])\nassert s[1]() == \"alert sent to slack\", 'senders[1]() should be \"alert sent to slack\", not the last channel'" },
    { "name": "every notifier reports its own channel, in order", "code": "s = make_senders([\"pagerduty\", \"webhook\"])\nassert [f() for f in s] == [\"alert sent to pagerduty\", \"alert sent to webhook\"], 'each notifier should report the channel it was built for, in order'" },
    { "name": "the last notifier still reports its own channel", "code": "s = make_senders([\"email\", \"slack\", \"sms\"])\nassert s[2]() == \"alert sent to sms\", 'senders[2]() should be \"alert sent to sms\"'" }
  ]
}
```
