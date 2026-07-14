---
title: "Where It Bites"
guide: vibe-coding
phase: 3
summary: "The failure modes - the last-mile wall, code you can't debug, and the security and maintenance risks that surface only later."
tags: [vibe-coding, security, debugging, maintenance, ai]
difficulty: beginner
synonyms:
  - "vibe coding problems"
  - "is vibe coding safe"
  - "ai code i cant debug"
  - "vibe coding security risks"
  - "when not to vibe code"
updated: 2026-06-30
---

# Where It Bites

Everything in the last phase was true. The bites in this one are also true, and they're the part the demos never show - because they don't appear in the first hour. They appear in week three, when the thing is live, when something breaks, or when someone you weren't expecting tries to use it.

## The last-mile problem

Vibe coding gets you to eighty percent stunningly fast. The first afternoon feels like magic - a real app, working, from a paragraph. Then you spend the next three weeks on the last twenty percent, and that part doesn't feel like magic at all.

Here's why. The eighty percent is the common case: the parts a thousand other apps already have, so the AI has seen them a thousand times. The last twenty is *your* specifics - the one weird rule your business has, the edge case where two users do the same thing at once, the exact thing your customer demands that nobody else needed. The AI hasn't seen those patterns as often, so it guesses, and the guesses get worse the further you are from the well-trodden path.

The cruel shape of it: progress feels fast right up until it stops. You ask for a fix, the AI changes something, and now two other things are broken. You fix those, the first thing comes back. Without being able to read the code, you're negotiating with a system you can't see inside, and each round can dig the hole deeper. This is the wall most ambitious vibe-coding projects hit. Going from "impressive demo" to "thing real people depend on" is not the same kind of work as the demo, and it doesn't get the same kind of speedup.

## Code you can't debug

When you can't read the code, every problem becomes a guessing game. The app was working; now it isn't; you don't know why; and your only move is to describe the symptom and hope. Sometimes the AI fixes it in one shot. Sometimes it confidently changes the wrong thing, and you can't tell, because you can't read what it did.

It gets worse as the project grows. Early on the AI can hold the whole thing in view. As it gets bigger, a fix in one corner silently breaks another, and the AI loses the thread the same way you have - except you can't step in, because stepping in requires reading code. You end up in a loop where each "fix" trades one bug for another and the thing slowly degrades.

A grounding fact: AI writes code that *looks* right far more reliably than code that *is* right. It's fluent. Fluent and correct are different things, and from the outside they're nearly impossible to tell apart. That's exactly why this category is dangerous - the failures don't announce themselves.

## Security and maintenance: the bites that wait

These are the worst ones, because they're invisible until the damage is done.

**Security.** AI happily writes code with serious holes in it, and it looks completely normal. The classic disaster: a vibe-coded app where every user's private data sits behind a check that isn't actually there, or where the "secret" password to the admin panel is sitting in plain text anyone can read. There were real, public cases in 2025 of vibe-coded apps leaking user data and racking up surprise bills because nobody checked the boring parts. You won't see these by looking at the app - it works fine. They surface when someone with bad intentions looks where you didn't.

A short list of what quietly goes wrong:

| Risk | What it looks like | When it bites |
|---|---|---|
| Exposed secrets | Passwords or keys written into the code | When the code is shared or hosted publicly |
| No access checks | Any user can reach anyone's data | When a stranger pokes at the URLs |
| Runaway costs | A loop that calls a paid service forever | When the bill arrives |
| Unchecked input | The app trusts whatever it's given | When someone feeds it something hostile |

**Maintenance.** Software is never finished - the world underneath it shifts. A service it depends on changes, a payment provider updates its rules, a security hole is discovered in a piece you used. Real software needs upkeep. With code you can't read or change yourself, every bit of upkeep means going back to the AI and hoping it doesn't break three other things on the way. A personal tool can rot quietly; nobody's watching. Anything other people rely on can't.

## When to slow down and learn

None of this means don't vibe-code. It means know which thing you're building and match your caution to the stakes. A useful gut check:

- **Will strangers use it?** Then someone has to understand the security. Not vibe-coded-and-shipped.
- **Does it touch money, or personal data, or anyone's safety?** Slow down. Get a real developer to look, or learn enough to check it yourself.
- **Will it need to keep running for months?** Someone has to maintain it. Plan for who.
- **Is it only for you, or a quick experiment?** Go fast. This is exactly the right tool. Enjoy it.

The plain summary: vibe coding is a genuine breakthrough for prototypes, personal tools, learning, and disposable scripts - and a quiet trap for anything important enough to hurt people when it fails. The skill isn't writing the perfect prompt. It's telling the two apart, every single time, and being clear with yourself about which one you're holding.
