---
title: "Triage & Mitigate"
guide: "when-prod-is-down"
phase: 2
summary: "The fastest paths back to green during an outage — roll back the last deploy, flip the feature flag off, scale up, fail over — and how to actually run the incident: one coordinator, a clear comms channel, and a timeline written as you go. Mitigation over root cause, in the moment."
tags: [incident-response, mitigation, rollback, feature-flags, failover, incident-commander, comms]
difficulty: advanced
synonyms: ["how to mitigate an outage", "roll back deploy to fix prod", "feature flag to fix outage", "who runs an incident", "incident commander role", "incident comms channel", "write incident timeline", "fastest fix for production outage"]
updated: 2026-06-19
---

# Triage & Mitigate

You've confirmed it's real, you know the blast radius, and you've spotted the prime suspect. Now you need to
make the pain stop. This phase is the menu of fast mitigations — the moves that get users working again before
you fully understand what broke — and the second half is just as important: how to *run* the incident so five
people helping doesn't become five people colliding.

The mental shift to carry through this whole phase: **in the moment, mitigation beats root cause.** You are not
trying to be right; you are trying to make the graph green. The clever diagnosis can wait until the bleeding has
stopped.

## The mitigation menu — reach for these first

These are ordered roughly by how often they work and how fast they are. Start at the top. The unifying idea: a
sudden outage usually means *something changed*, so the fastest fixes *undo a change*.

### 1. Roll back the last deploy (the most common fix, full stop)

**Why this is first.** If the outage started right after a deploy, rolling that deploy back is the single most
likely fix in all of incident response. It directly undoes the prime suspect, it's usually fast, and it's
usually reversible. Reach for it before anything cleverer.

```console
$ kubectl rollout undo deployment/checkout-api
deployment.apps/checkout-api rolled back
$ kubectl rollout status deployment/checkout-api
Waiting for deployment "checkout-api" rollout to finish: 2 of 4 updated replicas are available...
deployment "checkout-api" successfully rolled out
```
*What just happened:* `rollout undo` told Kubernetes to redeploy the *previous* known-good revision, and
`rollout status` confirmed the new (old) pods came up healthy. If `v2.32.0` was the culprit, checkout should
recover within a minute or two as traffic shifts back to the good version. You haven't found the bug yet — and
that's fine. You've removed it from production, which is the job right now.

> ⏭️ A rollback is, at heart, a Git operation — putting production back on a known-good commit. The deeper
> mechanics of reverting safely live in [Git Disaster Recovery](/guides/git-disaster-recovery); during an
> incident, your deploy tool's "rollback" or "redeploy previous" button is usually the fastest front door.

⚠️ **Rollback gotcha: the irreversible migration.** Rolling back code is safe and easy. Rolling back a
*database migration* often is **not** — if the new deploy added a column, backfilled data, or changed a schema,
the old code may not run against the new database, and reversing the migration can lose data. Before you roll
back, ask: *"Did this release include a database change?"* If yes, pause and get the person who wrote it on the
call before you act. This is the one place "just roll it back" can dig the hole deeper.

### 2. Turn off the feature flag

**When it beats a rollback.** If the broken behavior is behind a feature flag, flipping the flag off is even
faster and more surgical than a rollback — no redeploy, no waiting for pods, and you disable *only* the bad
thing while leaving the rest of the release in place.

```console
$ flagctl set checkout_new_pricing --off
flag "checkout_new_pricing" → OFF (effective immediately, all environments)
```
*What just happened:* You disabled the new code path at runtime. Requests immediately fall back to the old,
known-good behavior without anything being redeployed. If the new pricing logic was the problem, checkout
recovers in seconds.

💡 **Key point.** This is *why* mature teams put risky changes behind flags: a flag turns "emergency rollback
under pressure" into "flip a switch." If your shop doesn't flag risky changes yet, that's a postmortem action
item ([Phase 3](03-after-the-blameless-postmortem.md)).

### 3. Scale up / give it more resources

**When this is the move.** If nothing changed in your code but load spiked — a traffic surge, a viral moment, a
batch job hammering the database — the fix isn't to undo a deploy; it's to give the system more room while you
figure out the source.

```console
$ kubectl scale deployment/checkout-api --replicas=12
deployment.apps/checkout-api scaled
```
*What just happened:* You went from however many replicas to 12, adding capacity to absorb the load. This is a
*mitigation*, not a cure — if a single slow query or a runaway client is the real cause, more replicas may
only buy you minutes. But minutes of breathing room to find the real cause is exactly what you're shopping for.

⚠️ **Scaling can move the bottleneck, not remove it.** Tripling your app servers when the *database* is the
bottleneck can make things *worse* — more app servers means more connections hammering the same overwhelmed
database. Scale the tier that's actually saturated, and watch the downstream effects.

### 4. Fail over to a healthy replica/region

**When this saves you.** If one database replica, availability zone, or region is unhealthy and you have a
standby, failing over to the healthy one restores service without fixing the sick component at all. You isolate
the damage and route around it.

```console
$ ./failover.sh --promote db-replica-2 --region us-west-2
Promoting db-replica-2 to primary...
Health check passed. Traffic now routing to us-west-2.
```
*What just happened:* You promoted a healthy standby and shifted traffic to it. The original primary is still
broken — but users don't care, because they're being served by the healthy one now. You've bought time to
investigate the failed component without it being in the critical path.

⚠️ **Know your failover before the fire.** Failover is the mitigation most likely to go wrong *if you've never
practiced it.* Promoting a stale replica can serve old data; a half-configured standby can fail under real
traffic. If you're not confident the standby is healthy and current, a rollback or flag-flip is the safer first
move. (Practicing failover when nothing is on fire is, you guessed it, a postmortem action item.)

---

```text
   PICK YOUR MITIGATION — start at the top, work down

   Did a deploy go out right before? ──────────► ROLL BACK the deploy
                │ no
                ▼
   Is the bad behavior behind a flag? ─────────► FLAG IT OFF
                │ no
                ▼
   Did load spike with no code change? ────────► SCALE UP the saturated tier
                │ no
                ▼
   Is one replica/zone/region unhealthy? ──────► FAIL OVER to the healthy one
                │ no
                ▼
   None obvious? ──► stabilize what you can, then diagnose (Phase 1 → logs/traces)
```

📝 **Terminology.** *Mitigation* = anything that reduces or stops the user impact, whether or not it fixes the
underlying cause. *Remediation* (or the permanent fix) = actually fixing the root cause so it can't recur. In
the moment you want mitigation; the postmortem produces remediation. Don't confuse "the pain stopped" with "the
problem is fixed" — they're different milestones.

## Running the incident — so help doesn't become chaos

Once more than one or two people are involved, the *coordination* becomes as important as the fix. The classic
failure mode isn't too few people — it's several skilled engineers all debugging in parallel, stepping on each
other, making simultaneous changes nobody else knows about, while leadership has no idea what's happening. A
well-run incident with three people beats a chaotic one with ten.

### One coordinator (the incident commander)

**What the role actually is.** One person — the **incident commander (IC)** — runs the response. Crucially,
*the IC usually isn't the one with hands on the keyboard.* Their job is to coordinate, not to fix: track what's
being tried, decide what to try next, keep comms flowing, and pull in the right people. Think conductor, not
soloist.

📝 **Terminology.** *Incident Commander (IC)* — the single person accountable for coordinating the response. Not
necessarily the most senior or the most knowledgeable; just the one holding the overall picture so the
responders can focus on their piece. The role can (and during long incidents, should) be handed off — but at
any moment, exactly one person holds it.

**Why "exactly one" matters.** With no coordinator, everyone assumes someone else is watching the whole board,
and nobody is. With two, they give conflicting directions. One named IC means there's always a single answer to
"what are we doing and who's deciding?" If you're first on the scene and nobody else has stepped up, *you* are
the IC until you explicitly hand it off — say so: *"I'm IC for this. [Name], can you investigate the database?
I'll handle comms."*

### A clear comms channel and status updates

**Why a dedicated channel.** Spin up (or use a standing) incident channel and put *everything* there — what's
being tried, what's been ruled out, status updates. One place means anyone joining can scroll up and catch the
whole story instead of asking five people to re-explain. It also becomes your timeline (next section) for free.

**Two audiences, two cadences.** The responders need detail. *Everyone else* — leadership, support, the rest of
the company — needs a short, regular heartbeat so they stop interrupting the responders to ask "any update?":

> *14:18 — Incident update: Checkout is failing for all users (started ~14:03). Suspected cause: the 14:01
> release. Rolling it back now. Next update in 15 min or when status changes.*

💡 **Key point.** "Next update at [time]" is the single most calming sentence in incident comms. It tells
everyone watching that someone is in control and they don't need to ask — which frees the responders to
actually respond. Send the next update even if it's just "still working, no change, next update in 15."

### Write the timeline as you go

**Why now, not later.** The instinct is to reconstruct the timeline afterward for the postmortem. Don't — you
*will* misremember the order and the times, because adrenaline scrambles memory. Drop one-line, timestamped
notes into the channel *as things happen* and you get an accurate timeline for free, with zero memory required.

```text
   14:03  alerts fire — checkout 500s, all regions
   14:05  declared incident, IC = Maria
   14:07  blast radius: all logged-in users, checkout fully down
   14:08  noticed deploy v2.32.0 went out 14:01 — prime suspect
   14:12  rolling back v2.32.0
   14:15  rollback complete, 500s dropping
   14:17  checkout confirmed working — bleeding stopped
   14:18  posted status update; starting root-cause investigation
```

*What this gives you:* an honest, minute-by-minute record while it's fresh. In the postmortem you'll mine it
for the metrics that matter — *time to detect* (alert to declared) and *time to mitigate* (declared to bleeding
stopped) — and those numbers are only trustworthy if you wrote them down live.

### ⚠️ The most dangerous person on the call: the silent hero

There's an anti-pattern that feels like heroism and is actually sabotage: the engineer who goes quiet, fixes
(or "fixes") something on their own, and tells no one. Even when they're *right*, they've broken the incident:

- Nobody else knows a change was made, so when the graph moves, the team can't tell what caused it.
- If their change makes things worse, others may be simultaneously making *other* changes, and now you have two
  uncontrolled variables and no idea which did what.
- The timeline gets a hole in it, so the postmortem can't learn from what actually happened.

🪖 **War story.** Mid-incident, the graphs suddenly recovered — then, a minute later, crashed harder. It turned
out one engineer had quietly restarted a service at the same moment another had quietly cleared a cache. Each
saw the brief recovery and assumed *their* change worked; neither had announced it. Untangling who did what cost
more time than the original bug. The rule that prevents this is simple and absolute:

> **Announce every change before you make it, in the channel.** *"I'm about to restart the worker pool —
> objections? Going in 30 seconds."* No silent fixes. No exceptions. The hero who saves the day silently is the
> one who turns a 20-minute incident into a 2-hour mystery.

The discipline isn't bureaucracy for its own sake — it's what keeps the response a *coordinated* effort instead
of several people gambling in the dark.

## Recap

1. **Mitigation beats root cause in the moment.** Make the graph green first; be clever later.
2. **The mitigation menu, top to bottom:** roll back the deploy (most common fix) → flag it off → scale the
   saturated tier → fail over to a healthy replica/region.
3. **Watch the gotchas:** irreversible DB migrations make rollbacks dangerous; scaling can move the bottleneck;
   never failover to a standby you haven't verified.
4. **One incident commander**, coordinating rather than typing, so there's always a single answer to "what are
   we doing?"
5. **One comms channel, regular heartbeat updates** ("next update at [time]"), and a **timeline written live** —
   not reconstructed from memory.
6. **No silent heroes.** Announce every change before you make it. The quiet fixer is the most dangerous person
   on the call.

---

[← Guide overview](_guide.md) · [Phase 3: After — the Blameless Postmortem →](03-after-the-blameless-postmortem.md)
