---
title: "Fix the bug: the copy that everyone shares"
guide: practice-python
phase: 19
summary: "Each account gets its own copy of the settings template, so one person's changes cannot touch anyone else's. Run it: Ben never touched a thing and his settings changed anyway. Nothing raised."
tags: [python, copy, deepcopy, mutability, aliasing, debugging]
difficulty: advanced
synonyms:
  - python editing a copy changes the original
  - dict copy still shares nested list
  - python shallow copy vs deep copy
  - why does changing one dict change another python
  - copy.deepcopy nested dictionary python
  - python list inside dict copied by reference
updated: 2026-07-17
---

# Fix the bug: the copy that everyone shares

Every new account starts from one settings template, and each account gets its
own copy so people can change their own settings without touching anyone
else's. That is exactly what `.copy()` is for, and the code below calls it.

Run it. Ana goes dark, mutes billing, and turns off email. Ben was created one
line after her and has not been touched since. Read Ben's line anyway: he is
muting billing and his email is off. Read the template's line: it is muting
billing too. Nothing raised. Nothing warned. Every account created from here on
starts with Ana's preferences baked in.

Now look at what did *not* leak. Ana's theme is `dark`, Ben's is still `light`,
the template's is still `light`. The copy is not fake - it is real, and it is
exactly one level deep. That is what keeps this bug alive for months: someone
tests the copy by changing a top-level value, watches the two dicts disagree,
concludes copying works, and ships it.

Python could have made every copy go all the way down. It does not, because
most copies do not need to - duplicating every nested object in a large
structure costs real time and memory, and some objects (an open file, a
database connection, a lock) cannot be meaningfully duplicated at all. So the
cheap copy is the one you get by default, and the thorough one is a deliberate
import away.

**Your task:** fix `new_account` so each account is fully independent of the
template and of every other account, at any depth. Ana's changes must show up
on Ana's line only. Ben and the template must both still read `light`, `[]`,
`{'email': True, 'sms': False}`.

**You'll practice:**

- Reading a plausible output as a claim, then checking it against what you already know is true
- Spotting where a shallow copy leaves its nested objects shared, and copying deeply instead

```lesson
{
  "language": "python",
  "starterCode": "# Each new account gets its own copy of the template. Run it and read all three\n# lines - Ben never touched anything, and the template is supposed to be a template.\nDEFAULTS = {\n    \"theme\": \"light\",\n    \"muted_channels\": [],\n    \"notifications\": {\"email\": True, \"sms\": False},\n}\n\ndef new_account(defaults):\n    return defaults.copy()\n\nana = new_account(DEFAULTS)\nben = new_account(DEFAULTS)\n\nana[\"theme\"] = \"dark\"\nana[\"muted_channels\"].append(\"billing\")\nana[\"notifications\"][\"email\"] = False\n\nprint(\"ana:     \", ana[\"theme\"], ana[\"muted_channels\"], ana[\"notifications\"])\nprint(\"ben:     \", ben[\"theme\"], ben[\"muted_channels\"], ben[\"notifications\"])\nprint(\"template:\", DEFAULTS[\"theme\"], DEFAULTS[\"muted_channels\"], DEFAULTS[\"notifications\"])",
  "solution": "import copy\n\nDEFAULTS = {\n    \"theme\": \"light\",\n    \"muted_channels\": [],\n    \"notifications\": {\"email\": True, \"sms\": False},\n}\n\ndef new_account(defaults):\n    return copy.deepcopy(defaults)\n\nana = new_account(DEFAULTS)\nben = new_account(DEFAULTS)\n\nana[\"theme\"] = \"dark\"\nana[\"muted_channels\"].append(\"billing\")\nana[\"notifications\"][\"email\"] = False\n\nprint(\"ana:     \", ana[\"theme\"], ana[\"muted_channels\"], ana[\"notifications\"])\nprint(\"ben:     \", ben[\"theme\"], ben[\"muted_channels\"], ben[\"notifications\"])\nprint(\"template:\", DEFAULTS[\"theme\"], DEFAULTS[\"muted_channels\"], DEFAULTS[\"notifications\"])",
  "hints": [
    "Run it and read all three lines. Ben was created one line after Ana and never touched again, yet he is muting billing and his email is off. The template is muting billing too. Now look at what did NOT leak: Ana's theme is dark and Ben's is still light. The copy is real. It just is not going all the way down.",
    "defaults.copy() copies the dict exactly one level deep. The new dict gets its own keys, but each value is the same object as before - ana[\"muted_channels\"] and DEFAULTS[\"muted_channels\"] are two names for one list. That is why ana[\"theme\"] = \"dark\" is safe: assigning to a key rebinds it inside Ana's own dict. But .append() and ana[\"notifications\"][\"email\"] = False never touch Ana's dict at all - they reach through it and edit the one shared object underneath. dict(d), list(l), and d.copy() are all shallow the same way.",
    "copy.deepcopy walks the whole structure and rebuilds every nested object, so nothing is shared at any depth. Add import copy at the top, then: def new_account(defaults): return copy.deepcopy(defaults)"
  ],
  "tests": [
    {
      "name": "one account's changes do not leak into another account",
      "code": "template = {\"theme\": \"light\", \"muted_channels\": [], \"notifications\": {\"email\": True, \"sms\": False}}\na = new_account(template)\nb = new_account(template)\na[\"muted_channels\"].append(\"billing\")\na[\"notifications\"][\"email\"] = False\nassert b[\"muted_channels\"] == [], \"one account muting a channel should not mute it for another account\"\nassert b[\"notifications\"] == {\"email\": True, \"sms\": False}, \"one account turning off email should not turn it off for another account\""
    },
    {
      "name": "editing an account does not corrupt the template",
      "code": "template = {\"theme\": \"light\", \"muted_channels\": [], \"notifications\": {\"email\": True, \"sms\": False}}\na = new_account(template)\na[\"muted_channels\"].append(\"billing\")\na[\"notifications\"][\"email\"] = False\nassert template[\"muted_channels\"] == [], \"editing an account should not change the template it was copied from\"\nassert template[\"notifications\"] == {\"email\": True, \"sms\": False}, \"editing an account should not change the template it was copied from\""
    },
    {
      "name": "the copy is independent deeper than one level down",
      "code": "template = {\"tabs\": [{\"name\": \"inbox\", \"filters\": [\"unread\"]}]}\na = new_account(template)\na[\"tabs\"][0][\"filters\"].append(\"starred\")\na[\"tabs\"].append({\"name\": \"sent\", \"filters\": []})\nassert template[\"tabs\"] == [{\"name\": \"inbox\", \"filters\": [\"unread\"]}], \"the copy must share nothing with the template at any depth, not just the first level\"\nassert a[\"tabs\"][0][\"filters\"] == [\"unread\", \"starred\"], \"the copy itself should still be editable\""
    }
  ]
}
```
