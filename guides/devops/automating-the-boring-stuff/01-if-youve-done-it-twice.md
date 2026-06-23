---
title: "If You've Done It Twice, Script It"
guide: "automating-the-boring-stuff"
phase: 1
summary: "Manual steps are slow, error-prone, and unrepeatable; a script is documentation that runs. The mindset shift, and an honest test for when automating is worth it — and when it isn't."
tags: [automation, mindset, when-to-automate, ops, scripting]
difficulty: intermediate
synonyms: ["should i automate this task", "when is it worth writing a script", "why automate repetitive work", "script as documentation", "cost of automation"]
updated: 2026-06-19
---

# If You've Done It Twice, Script It

Before any code, the mindset — because this is where automation actually pays off or quietly wastes your time. The skill isn't writing scripts. Plenty of people can write a script. The skill is *noticing* which boring task deserves one, and being honest about which doesn't.

Picture the task you do by hand right now. You open a terminal, you run a handful of commands, you eyeball the output, you move on. It feels fine. It's only a couple of minutes. But that feeling is hiding three real costs.

## What a manual task actually costs

**It's slow — and the slowness compounds.** Two minutes, three times a week, is over five hours a year on one chore. That math alone rarely justifies a script. But the *time* is the smallest cost. The other two are the ones that hurt.

**It's error-prone, and the errors are silent.** Every manual run is a fresh chance to skip a step, run them out of order, copy the wrong path, or do step four before step three finished. Most of the time you get away with it. The one time you don't is the one you'll remember — the deleted directory, the service restarted in prod instead of staging, the backup that overwrote the thing it was supposed to protect.

**It's unrepeatable — it lives in your head.** This is the cost almost nobody counts. The "process" is a sequence of commands that exists only in your memory and your shell history. When you're on vacation, or you leave, or a teammate has to do it at 2am, the knowledge isn't *anywhere*. They reconstruct it from guesswork.

```text
   A manual task lives here:           A script lives here:

        ┌──────────────┐                  ┌──────────────┐
        │  your memory │                  │  a file, in  │
        │  + shell     │                  │  version     │
        │  history     │                  │  control     │
        └──────────────┘                  └──────────────┘
              │                                  │
        gone when you are              anyone can read it,
        different every run            run it, and trust it
```

## The reframe: a script is documentation that runs

Here's the idea that changes how you see this. When you write the task down as a script, you haven't just automated it — you've *documented* it. And unlike a wiki page or a README, this documentation can't go stale, because it's the same thing that does the work.

A README that says "to deploy, run these five commands" drifts out of date the moment someone changes step three and forgets to update the doc. A script *is* step three. If the process changes, you change the script, and the documentation updated itself. Reading the script tells you — and the next person, and future-you — exactly what happens, in order, with the real paths and real flags. No translation, no "well, actually it's slightly different now."

💡 **Key point.** The best reason to automate a boring task usually isn't speed. It's that the script becomes the single, honest, runnable record of how the task is *actually* done — so it survives you forgetting, leaving, or having a bad day.

## The honest test: when to automate

Automation has a cost too. Writing the script, testing it, and maintaining it as things change is real work. So don't automate reflexively. Run it through a few questions:

- **Have you done it more than twice — and will you do it again?** Once is a one-off; do it by hand. Twice is a coincidence. Three times is a pattern, and patterns are what scripts are for. The old rule of thumb is "if you've done it twice, the third time should be a script."
- **Is it the same every time?** Automation loves *repeatable* tasks. If every run is genuinely different and needs judgment, a script will fight you. (You can often still automate the boring 80% and leave the judgment to a human.)
- **Does getting it wrong hurt?** A task that's error-prone *and* consequential — touching backups, production, money, or data you can't recreate — earns a script even at low frequency, precisely because the script removes the chance to fat-finger it.
- **Will more than one person need to run it?** The moment a task has to outlive your memory, "it's in my head" stops being acceptable. The script is the handoff.

And the honest counter-cases — when *not* to automate:

⚠️ **Don't automate the genuinely rare one-off.** If you'll do it once, ever, the time spent scripting (and testing it carefully) is pure loss. Do it by hand, carefully.

⚠️ **Don't automate a task you don't yet understand.** A script that encodes a process you only half-grasp just makes your confusion fast and repeatable. Do it manually until you understand *why* each step is there. Then automate it.

⚠️ **Beware the trap.** There's a well-known cartoon-shaped truth here: it is very easy to spend three days automating a task that took you ten minutes a month, and never break even. Automate to remove *real* recurring pain, not because automating is more fun than the chore. (For a consequential, error-prone task, "breaking even" includes the disasters you didn't have — which is harder to see but very real.)

## 🪖 A short war story

A teammate once "knew how" to refresh the staging database from a backup. Four commands. They did it by hand every couple of weeks for a year. Then they were out sick the week before a big demo, staging was stale, and nobody else could do it — because it had never been written down anywhere but their muscle memory. We rebuilt it from shell history and got it wrong twice first. The fix was thirty lines of bash that should have existed eleven months earlier. The task wasn't worth automating for *speed*. It was worth automating so it didn't live in one person's head.

## Recap

1. A manual task has three costs: it's **slow** (and that compounds), **error-prone** (silently), and **unrepeatable** (it lives in your head).
2. A script is **documentation that runs** — the one record of the process that can't drift out of date.
3. Automate when the task is **repeated**, **repeatable**, **consequential**, or **shared** — and *don't* automate true one-offs or processes you don't yet understand.
4. The point isn't usually speed. It's removing the chance to get it wrong, and making the knowledge survive you.

You've got the judgment. Next, let's turn one of those tasks into a real, safe bash script.

---

[Guide overview](_guide.md) · [Phase 2: Shell Scripting Essentials →](02-shell-scripting-essentials.md)
