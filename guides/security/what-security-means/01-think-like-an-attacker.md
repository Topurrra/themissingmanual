---
title: "Think Like an Attacker"
guide: "what-security-means"
phase: 1
summary: "Security means protecting three things - confidentiality, integrity, and availability (the CIA triad) - against people who actively want your system to break; the core skill is shifting from 'does it work?' to 'how could this be abused?'"
tags: [security, cia-triad, confidentiality, integrity, availability, attacker-mindset, mental-model]
difficulty: beginner
synonyms: ["what does secure mean", "cia triad confidentiality integrity availability", "attacker mindset", "how to think like a hacker", "what are you protecting in security", "abuse case vs use case"]
updated: 2026-06-19
---

# Think Like an Attacker

Before any tools, any checklists, any acronyms - let's install the one idea the whole field rests on. Most of security feels overwhelming because nobody told you what you're actually defending, or against whom. Once you have those two pieces, the rest stops being magic.

## What "secure" is actually protecting

When someone says "is it secure?", they're really asking about three separate things. Security people bundle them into one famous shorthand: the **CIA triad**. (No relation to the agency - it's just the three first letters.)

```text
        ┌──────────────────────────────────────────────┐
        │  C  Confidentiality  - only the right people   │
        │                        can SEE the data        │
        ├──────────────────────────────────────────────┤
        │  I  Integrity        - only the right people   │
        │                        can CHANGE the data,     │
        │                        and only in allowed ways │
        ├──────────────────────────────────────────────┤
        │  A  Availability     - the right people can     │
        │                        actually USE it when     │
        │                        they need to             │
        └──────────────────────────────────────────────┘
```

📝 **Terminology.** *CIA triad* = the three goals of security: **C**onfidentiality (keep secrets secret), **I**ntegrity (keep data correct and un-tampered), **A**vailability (keep the system working and reachable). Almost every security problem is one of these three breaking.

**What this looks like in real life.** Think about your own bank account, and each letter snaps into focus:

- **Confidentiality breaks** when someone reads your balance and transactions who shouldn't - a leaked database, a borrowed login.
- **Integrity breaks** when someone *changes* the data: edits your balance, redirects a transfer, alters a record after the fact. The data is still there - it's just been *lied to*.
- **Availability breaks** when you can't get in at all - the site is down, you're locked out, the service is being flooded so nobody can use it.

**Why this matters.** "Make it secure" is too vague to act on. "Make sure no one but the account owner can *see* this (confidentiality), no one can *alter* it (integrity), and the owner can always *reach* it (availability)" - that you can actually do something about. The triad turns a feeling into three concrete questions.

💡 **Key point.** When you're unsure whether something is a "security issue," ask: *does it threaten confidentiality, integrity, or availability?* If yes, it's security. If no, it's probably a different kind of bug.

## The mindset shift: from "does it work?" to "how could this be abused?"

Here's the shift that separates building software from securing it - and it's a genuine shift, not a tip.

When you build a feature, you think about the **use case**: the user does the right thing, in the right order, and gets the right result. You test that the happy path works. That's your whole job most days, and it's the correct instinct.

Security asks the opposite question. Not "does it work when used correctly?" but **"what happens when someone uses it *incorrectly on purpose*?"** That's the **abuse case**.

📝 **Terminology.** *Use case* = how a feature is meant to be used. *Abuse case* = how a feature could be deliberately misused by someone who wants it to break. Building is about use cases; security is about abuse cases.

Walk through one concrete example. Imagine a search box that shows results matching what you type. The use case is obvious - you type `shoes`, you get shoes.

```text
   USE CASE (what you built for):
        user types:  shoes
        you show:    results for "shoes"          ✓ works

   ABUSE CASE (what an attacker tries):
        attacker types:  '; DROP TABLE users; --
        what if the box passes that straight into the database?
        attacker types:  <script>steal_cookies()</script>
        what if the box echoes that straight back into the page?
```

*What just happened:* You didn't change the feature - you changed the *kind of input you imagined*. The normal user types a word. The attacker types something engineered to make your code do something you never intended. You don't need to know the exact attacks yet (those are [the OWASP Top 10](/guides/owasp-top-10)). You just need to start *expecting* that some inputs are hostile.

**Why people get this wrong.** It feels paranoid, even a little insulting to the user. But the attacker isn't a user having a bad day - the attacker is a person, or a script, whose *goal* is to find the input you didn't think of. They have time, they have patience, and they only have to be right once. That's the asymmetry at the heart of all security: you have to cover every door; they only have to find one that's unlocked.

🪖 **War story.** Plenty of breaches start with something nobody thought to abuse - a "name" field that accepted a million characters, a "forgot password" form that revealed whether an email was registered, a file upload that happily accepted a file that wasn't an image. None of those broke the happy path. Every one of them was an abuse case nobody asked about.

## Who is "the attacker," really?

It helps to drop the hoodie-in-a-dark-room image. The attacker is rarely a genius targeting *you* personally. Far more often it's:

- **Automated scripts** scanning the entire internet for known weak spots - they don't care who you are, only that a door is open.
- **Opportunists** who notice something is misconfigured and poke at it.
- **Insiders** - someone who already has *some* access and uses more than they should.
- **People tricking *people*** - phishing an employee is often easier than breaking any code (more on that in [Phase 3](03-defense-in-depth.md)).

The point isn't to fear a mastermind. It's to accept that *someone, or something, actively wants your system to behave badly* - and design as if that's true, because it is.

## Recap

1. **Security protects three things - the CIA triad:** **C**onfidentiality (who can see it), **I**ntegrity (who can change it, and how), **A**vailability (can the right people use it).
2. To decide if something is a security problem, ask which of those three it threatens.
3. The core mindset shift is from the **use case** ("does it work when used right?") to the **abuse case** ("how could this be misused on purpose?").
4. The **attacker** is usually a script or an opportunist, not a mastermind - but they only have to find *one* unlocked door, while you have to guard all of them.

Now that you're thinking in abuse cases, the next phase gives you a light, repeatable way to find them on purpose: threat modeling.

---

[← Guide overview](_guide.md) · [Phase 2: Threat Modeling, Lightly →](02-threat-modeling-lightly.md)
