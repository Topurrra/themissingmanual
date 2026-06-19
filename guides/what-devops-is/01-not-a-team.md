---
title: "Not a Team, a Way of Working"
guide: "what-devops-is"
phase: 1
summary: "DevOps is the way of working that removes the wall between the people who write code (dev) and the people who run it (ops), so a single loop owns the whole journey from build to ship to run."
tags: [devops, culture, dev, ops, build-ship-run, mental-model]
difficulty: beginner
synonyms: ["what is devops", "dev vs ops", "what does devops mean", "why was devops invented", "is devops a team or a culture"]
updated: 2026-06-19
---

# Not a Team, a Way of Working

Before we touch a single tool or pipeline, let's install the one idea the entire topic rests on. Once you have it, everything else about DevOps — the loops, the automation, the culture — falls into place on its own. So forget job titles for a moment. We're building a mental picture first.

## The wall that DevOps tears down

To understand DevOps, you have to understand the world it was a reaction *against*. For a long time, building software and running it were two separate jobs, done by two separate groups of people, often who barely talked to each other.

```text
   ┌──────────────────────┐         ┌──────────────────────┐
   │   DEVELOPERS (Dev)    │         │   OPERATIONS (Ops)   │
   │                      │  ░░░░░  │                      │
   │  write the code,      │  ░THE░  │  run the servers,     │
   │  add the features,    │  ░WALL░ │  deploy the code,     │
   │  then "throw it       │  ░░░░░  │  keep it alive at 3am │
   │  over the wall"  ───────────►   │  when it falls over   │
   └──────────────────────┘         └──────────────────────┘
```

**What "Dev" is.** The developers. Their job is to *build* — write the code, add the features, fix the bugs. Their instinct is **change**: ship the new thing, move fast.

📝 **Terminology.** *Ops* (operations) = the people and work of *running* software in production: provisioning servers, deploying releases, monitoring, and responding when things break. Where dev *builds* the software, ops *keeps it alive*.

**What "Ops" is.** The operations people. Their job is to *run* what dev built — set up the servers, push the code live, watch it, and scramble when it crashes. Their instinct is **stability**: don't break what's working.

And there, between them, sat the wall.

## Why the wall was a disaster

The wall wasn't just an org-chart line. It created a genuinely painful way to work, and naming the pain tells you exactly what DevOps is *for*:

- **The hand-off was a cliff.** Developers finished their code and "threw it over the wall" to ops to deploy. Once it was over, it wasn't their problem anymore. Ops received a thing they didn't write and didn't fully understand, and had to make it run.
- **The two sides wanted opposite things.** Dev was rewarded for shipping changes. Ops was rewarded for keeping things stable. Every release was a tug-of-war: dev pushing to release, ops pushing to slow down. They were, structurally, set against each other.
- **When it broke, nobody owned it.** Production goes down at 2am. Ops is paged. Ops didn't write the code, so they can't fix the bug — they can only wake up a developer. The developer says "well, it worked on my machine." Time is lost, fingers point, and the user is still staring at an error page.

🪖 **War story.** The phrase "it works on my machine" is the entire wall in five words. A developer's code ran fine on their laptop, got thrown over to ops, and died on the real servers — different settings, different data, different everything. Ops couldn't fix code they didn't write; dev couldn't see a server they had no access to. Hours burned not on the bug, but on the gap between two teams who'd each done "their part."

## So what is DevOps, actually?

**What it actually is.** DevOps is the **way of working that removes that wall.** That's the whole idea. Instead of "dev builds it, then ops runs it, and they hand off across a gap," DevOps says: **the same people, sharing one set of goals, own the software across its entire life — building it, shipping it, *and* running it.**

The name itself is the definition: **Dev** + **Ops**, joined, with no wall in between.

```text
   BEFORE DevOps                      WITH DevOps
   ┌─────┐  wall  ┌─────┐            ┌───────────────────────────┐
   │ Dev │ ░░░░░► │ Ops │            │   one team, one loop:      │
   └─────┘        └─────┘            │   build  ─►  ship  ─►  run │
   build it    run it (alone)        │     ▲                  │   │
   hand off and walk away            │     └──────────────────┘   │
                                     │   you build it, you run it │
                                     └───────────────────────────┘
```

**Why people get this wrong.** Because organizations took the *idea* and slapped it on a *box*. They renamed the ops team "the DevOps team," or hired a "DevOps engineer" to manage the deploy scripts, and called it done. But putting "DevOps" on a door doesn't remove the wall — it just moves the wall and renames one side of it. DevOps is something a whole team *does*, not a department you can point at. (We'll come back hard to this in [Phase 3](03-the-culture.md).)

💡 **Key point.** DevOps is a **way of working, not a team.** Its one core move is: **the people who build the software also share responsibility for running it** — so there's no wall to throw things over, and no gap for problems to fall into.

## "You build it, you run it"

The cleanest one-line summary of DevOps is a phrase made famous by Amazon's then-CTO, Werner Vogels: **"You build it, you run it."** (Source: ["A Conversation with Werner Vogels," ACM Queue, 2006](https://queue.acm.org/detail.cfm?id=1142065).)

It means: the team that writes a piece of software is also on the hook for operating it in production. If it breaks at 2am, the people who built it are the ones who get the context to fix it — fast, because they wrote it.

**Why this changes everything.** When you know *you'll* be the one woken up if your code falls over, you write it differently. You add logging so you can see what's happening. You think about what happens when the database is slow. You make it easier to deploy and easier to roll back. The wall created an incentive to make code "someone else's problem." Tearing it down creates an incentive to make code that's genuinely robust — because its problems are *your* problems now.

**Why this saves you later.** When you join a team that "does DevOps," you'll know what to expect: you won't just write a feature and disappear. You'll help ship it, you'll have visibility into it running, and you may carry a pager for it. That's not a burden bolted onto your job — it's the point. It's how software gets better and how 2am stops being a blame contest.

## Recap

1. The old world had a **wall**: developers (*dev*) built software and threw it over to operations (*ops*) to run, across a painful hand-off.
2. The wall set the two sides against each other — dev wanted change, ops wanted stability — and when things broke, **nobody owned it**.
3. **DevOps is the way of working that removes the wall**: one team, one set of goals, owning software across its whole life — build, ship, *and* run.
4. It is **not a team or a job title** you can point at; it's something a whole team *does*.
5. The phrase that captures it: **"you build it, you run it."**

Next, we'll look at *how* a team actually works without the wall — the continuous loop that carries software from an idea all the way to running in production, and back again.

---

[← Guide overview](_guide.md) · [Phase 2: The Loop: Build → Test → Ship → Observe →](02-the-loop.md)
