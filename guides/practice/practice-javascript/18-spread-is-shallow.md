---
title: "Fix the bug: one user's edit changes everyone"
guide: practice-javascript
phase: 18
summary: "The spread copy works - Ana's theme change stays with Ana. Her notification change lands on every user. Same object, same spread, one field leaked."
tags: [javascript, objects, spread, shallow-copy, references, debugging]
difficulty: advanced
synonyms:
  - javascript spread only copies one level
  - object spread nested object still shared
  - why does editing a copy change the original javascript
  - shallow copy vs deep copy javascript
  - object.assign nested object reference
  - structuredclone javascript deep copy
updated: 2026-07-17
---

# Fix the bug: one user's edit changes everyone

Every new user starts from one `defaultSettings` object, spread into a fresh
object of their own. That is the ordinary way to do this, and the code below
runs without a single error.

Then read the output. Ana changed her own settings. Ben never opened his - and
Ben's email notifications are off.

The strange part is what *did* work. Ana switched to the dark theme and Ben is
still on light, so the copy is clearly doing something. Out of the same object,
through the same spread, one field isolated correctly and one field leaked.

That split is the entire bug. It is also not a bug in JavaScript - it is the
spread operator doing exactly what it promises, no more.

**Your task:** fix `makeUserSettings(name)` so each user owns their settings
outright. Changing one user's `notifications` must not change another user's,
and must not change `defaultSettings` for whoever signs up next.

**You'll practice:**

- Reading a plausible output as a claim, then checking whether the claim is true
- Finding where a copy stopped, and copying the level it stopped at

```lesson
{
  "language": "js",
  "starterCode": "// Each user gets a copy of the defaults. This runs fine - read the output.\n// Ben never opened his settings.\nconst defaultSettings = {\n  theme: \"light\",\n  notifications: { email: true, sms: false },\n};\n\nfunction makeUserSettings(name) {\n  return { name, ...defaultSettings };\n}\n\nconst ana = makeUserSettings(\"Ana\");\nconst ben = makeUserSettings(\"Ben\");\n\n// Ana changes two of her own settings.\nana.theme = \"dark\";\nana.notifications.email = false;\n\nconsole.log(\"Ben's theme:\", ben.theme);               // expected: light\nconsole.log(\"Ben's email:\", ben.notifications.email); // expected: true",
  "solution": "const defaultSettings = {\n  theme: \"light\",\n  notifications: { email: true, sms: false },\n};\n\nfunction makeUserSettings(name) {\n  return {\n    name,\n    ...defaultSettings,\n    notifications: { ...defaultSettings.notifications },\n  };\n}\n\nconst ana = makeUserSettings(\"Ana\");\nconst ben = makeUserSettings(\"Ben\");\n\nana.theme = \"dark\";\nana.notifications.email = false;\n\nconsole.log(\"Ben's theme:\", ben.theme);               // light\nconsole.log(\"Ben's email:\", ben.notifications.email); // true",
  "hints": [
    "Run it. Ben's email prints false, and Ben has done nothing - so the output is lying, which means the copy is wrong, not the data. Now notice what the same copy got right: Ben's theme is still light, even though Ana switched to dark. One field survived being copied and one did not. What is different about notifications?",
    "Spread copies the values of the object's own properties, and it stops there - one level down. theme's value is the string \"light\", so Ben genuinely gets his own copy of it. notifications' value is not the object; it is a reference to an object living somewhere in memory. Copying a reference gives you a second arrow pointing at the same one object. So ana.notifications, ben.notifications, and defaultSettings.notifications are three names for a single object, and ana.notifications.email = false never touched ana - it reached through to the object all three share.",
    "Copy the level the spread stopped at: return { name, ...defaultSettings, notifications: { ...defaultSettings.notifications } }; - the second spread builds a fresh notifications object on every call, so no two users point at the same one. (structuredClone(defaultSettings) copies every level in one go, which is the better reach when the shape is deeper than this.) Shallow is not a design mistake. A deep copy has to decide what to do with class instances, DOM nodes, functions, and objects that point back at themselves, and it would duplicate things you meant to share, like a cache or a database connection. So the language does the one thing that is always cheap and always predictable - copy one level - and makes going deeper something you ask for by name."
  ],
  "tests": [
    { "name": "two users do not share notifications", "code": "const a = makeUserSettings('Ana'); const b = makeUserSettings('Ben'); a.notifications.email = false; if (b.notifications.email !== true) throw new Error('Editing notifications on one user changed another user - every user needs their own notifications object');" },
    { "name": "an edit does not reach the defaults", "code": "const c = makeUserSettings('Cira'); c.notifications.sms = true; const d = makeUserSettings('Dan'); if (d.notifications.sms !== false) throw new Error('A user created after an earlier edit should still get the default sms: false - that edit reached defaultSettings');" },
    { "name": "the copy still carries the default values", "code": "const e = makeUserSettings('Elin'); if (e.name !== 'Elin' || e.theme !== 'light' || e.notifications.email !== true || e.notifications.sms !== false) throw new Error('makeUserSettings(\"Elin\") should return name \"Elin\", theme \"light\", and notifications { email: true, sms: false }');" }
  ]
}
```
