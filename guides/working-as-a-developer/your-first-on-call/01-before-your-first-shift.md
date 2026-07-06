---
title: "Before Your First Shift"
guide: "your-first-on-call"
phase: 1
summary: "What to verify before your first on-call rotation starts: alerts reach you reliably, you know where the runbooks live (and that missing ones are normal), and you know your escalation path."
tags: [on-call, incident-response, preparation, runbooks, escalation]
difficulty: beginner
synonyms: ["how to prepare for on-call", "on-call checklist before shift", "what is an escalation path", "on-call runbook missing", "test pagerduty alert"]
updated: 2026-07-06
---

# Before Your First Shift

Most on-call anxiety comes from the unknowns you could have checked beforehand. Do it now, while there's no
pressure, not during your first page.

## Make sure the alert can actually reach you

An alert that fires into the void is worse than no alert - the team thinks someone's on it, and no one is.
Before your shift starts:

- **Send yourself a test page.** Most tools (PagerDuty, Opsgenie, VictorOps) have a "test notification"
  button. Use it. Confirm it hits your phone, not only your laptop that's closed in a bag by 11pm.
- **Check the escalation delay.** If you don't acknowledge within N minutes, who gets paged next? Know that
  number - it tells you how much slack you have to wake up and open your laptop.
- **Turn off Do Not Disturb overrides that block it.** iOS and Android both let critical apps bypass silent
  mode, but only if you've granted that permission. Check it, don't assume it.
- **Test at low volume, not zero.** A silent phone under a pillow doesn't wake anyone. Set the alert tone
  loud enough to survive being in another room.

A missed page because a phone setting was wrong is a process failure, not a personal one - but it's one you
can eliminate in five minutes tonight instead of learning about it during an actual outage.

## Find the runbooks - and expect gaps

A runbook is a written procedure for a known problem: "if the checkout queue backs up, do X, then Y." Good
teams keep them in a wiki, a repo folder, or pinned in the on-call tool itself. Find that location before
your shift, not during it.

Then expect this: **for a lot of what pages you, there will be no runbook.** New failure modes don't get a
runbook until after they've happened once. That's not a gap in your training - it's a gap in the system's
history, and it's completely normal on any team, including ones that have been running for years.

📝 **What this means in practice.** If you're paged for something with no documented fix, you're not failing
by not knowing it instantly. You're doing exactly what the first responder to a new problem is supposed to
do: investigate, mitigate, and (per [Phase 3](03-after-the-fire-the-postmortem.md)) write the runbook that
didn't exist yet, so the next person has it.

Skim the runbooks that do exist even if none apply to your service tonight - you'll absorb what "on-call
documentation" looks like at your company, which makes writing your own during a real incident far less
intimidating.

## Know your escalation path cold

"Escalation path" means: when you're stuck, who do you call, in what order, and how. Before your shift,
know the answers to these without having to look them up:

- **Who's the secondary/backup on-call?** There should always be a second person for when you're
  unreachable or out of your depth.
- **How do you actually reach them at 3am?** A Slack DM they won't see until morning doesn't count. Know the
  tool's "escalate" button, or the phone number, whichever your team actually uses.
- **Who's the "break glass" contact** - the senior engineer or manager you page when it's bad enough to need
  someone with more context than the backup on-call has?
- **Is there a status page or customer-comms process**, and whose job is it to update it? You don't want to
  be figuring that out mid-incident.

Write these down somewhere you can find fast and half-asleep - a pinned note, a bookmark, not a memory you're
trusting to survive an adrenaline spike.

## The mindset shift

The goal of this prep isn't to make you capable of fixing everything solo. It's to remove every excuse for
hesitating to ask for help. A new on-call engineer who escalates fast and often is doing it right. One who
sits alone at 3am afraid to wake someone up, because they never checked who that someone was, is the failure
mode this phase exists to prevent.

Ready for the page itself? [When Prod Is Down](/guides/when-prod-is-down) covers the technical triage steps
in depth - Phase 2 here covers the calmer, human version of the same moment.

Quick check before you move on:

```quiz
[
  {
    "q": "You're paged for a failure mode with no existing runbook. What does that mean?",
    "choices": [
      "You should have known the fix already",
      "This is normal - write the runbook after, for the next person",
      "The on-call process is broken and needs to be escalated immediately"
    ],
    "answer": 1,
    "explain": "Runbooks get written after a failure happens once, not before. A missing runbook is a gap in the system's history, not a personal shortcoming."
  },
  {
    "q": "What's the best way to verify your alerts will actually wake you up?",
    "choices": [
      "Assume the on-call tool handles it correctly",
      "Send yourself a real test page before your shift starts",
      "Check that your laptop is charged"
    ],
    "answer": 1,
    "explain": "A test page confirms the full path - tool to phone to a sound loud enough to wake you - instead of hoping it works."
  },
  {
    "q": "Why write down your escalation path in advance instead of looking it up during an incident?",
    "choices": [
      "It's required by most incident tools",
      "Adrenaline and half-asleep brains are bad at finding things quickly",
      "It's only needed for very large outages"
    ],
    "answer": 1,
    "explain": "The whole point of prep is removing lookups from the moment you're least equipped to do them."
  }
]
```

---

[Guide overview](_guide.md) · [Phase 2: The 3am Page →](02-the-3am-page-a-calm-playbook.md)
