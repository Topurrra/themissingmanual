---
title: "After the Fire: the Postmortem"
guide: "your-first-on-call"
phase: 3
summary: "Why blameless postmortems beat blame-driven ones, why human error is rarely the real root cause, and how to write up an incident so the next on-call engineer benefits from your bad night."
tags: [on-call, postmortem, incident-response, blameless, documentation]
difficulty: beginner
synonyms: ["what is a blameless postmortem", "how to write an incident postmortem", "human error root cause fallacy", "postmortem template for beginners", "after an outage what happens next"]
updated: 2026-07-06
---

# After the Fire: the Postmortem

The outage is over, the graphs are green, and you finally get to sleep. The instinct is to close the laptop
and never think about it again. Don't - the postmortem is where a bad night turns into something the whole
team gets to benefit from, including future-you on your next rotation.

## Blameless, not because it's nice - because it works

A blameless postmortem assumes everyone involved did a reasonable thing given what they knew at the time. It
asks "what let this happen?" instead of "who caused this?" That's not a soft HR preference - it's the
approach that actually surfaces the truth.

Here's why. If postmortems hunt for someone to blame, people learn fast to protect themselves instead of
the process: they leave out the part where they almost pushed a bad config, they downplay how confused they
were, they stay quiet about the workaround they didn't fully understand. None of that is deceit for its
own sake - it's a rational response to a process that punishes candor.

Take away the blame, and the same person tells you exactly what happened, including the embarrassing parts,
because nothing bad happens to them for saying it. Those embarrassing parts are usually where the real fix
lives.

## "Human error" is where investigations stop too early

"An engineer ran the wrong command" or "someone forgot to update the config" reads like a root cause. It
isn't - it's where a lazy investigation stops. People don't fail randomly; they fail in exactly the
conditions a system sets up for that failure.

Push one level further, every time:

- "An engineer ran the wrong command" → *why was it possible to run that command against production without
  a confirmation step or a safeguard?*
- "Someone forgot to update the config" → *why did updating it depend on one person's memory instead of
  being automated or checked in CI?*
- "The on-call engineer didn't know about the edge case" → *why did that knowledge live only in one senior
  engineer's head instead of a runbook?*

Each real root cause is a process or system gap that made the human error possible, or made it matter once
it happened. Fix the gap, and the *next* person - who will absolutely also be human and also capable of a
typo - doesn't cause the same outage.

📝 **Key point.** "Human error" is a symptom description, not a diagnosis. If a postmortem's action item is
"be more careful," the investigation stopped one question too early.

## Writing it up for the next on-call engineer

You're not writing this for your manager or for a compliance checkbox. You're writing it for the version of
someone else - maybe you in six months - who gets paged for the same thing at 3am and needs it to go faster
than it did for you. Good postmortems are short and specific:

- **Timeline.** What happened, in order, with real timestamps. Pull it from the incident channel if you
  wrote one live - don't reconstruct from memory, adrenaline scrambles that.
- **Impact.** Who was affected, for how long, and how badly. Concrete numbers beat vague severity.
- **What worked.** The mitigation that actually stopped the bleeding - so it becomes the new runbook entry.
- **Contributing factors, not a villain.** The process or system gaps that let this happen, from the "human
  error" digging above.
- **Action items with owners.** Vague resolutions ("improve monitoring") don't get done. Specific ones
  ("add an alert on queue depth > 5,000, owner: Priya, due Friday") do.

If there was no runbook for what paged you, this is where you write the one that didn't exist before - the
gap you found in [Phase 1](01-before-your-first-shift.md) is exactly the gap this document closes.

## The upside nobody mentions

A rough first on-call shift feels like a personal ordeal in the moment. Written up clearly, it becomes
institutional memory - the next new hire on this rotation gets a runbook you didn't have, an alert that
didn't exist before your outage, or a documented escalation contact instead of a guess. That's the actual
payoff of on-call: not that you survived it, but that the team is measurably better prepared because you
did.

Quick check before you finish:

```quiz
[
  {
    "q": "Why do blameless postmortems tend to produce more accurate accounts of what happened?",
    "choices": [
      "They make the incident feel less serious",
      "People share embarrassing but important details when they aren't at risk of blame",
      "They skip the timeline to save time"
    ],
    "answer": 1,
    "explain": "Removing blame removes the incentive to hide the details, which are often exactly where the real cause lives."
  },
  {
    "q": "Why is 'human error' usually not the true root cause?",
    "choices": [
      "Humans never actually make mistakes",
      "It's typically a symptom of a system or process gap that let the error matter",
      "It's always a training problem"
    ],
    "answer": 1,
    "explain": "The deeper question is why the system allowed that mistake to happen or to cause damage - that gap is the fixable root cause."
  },
  {
    "q": "Who is the primary audience for a postmortem write-up?",
    "choices": [
      "Whoever caused the incident, as a record of what went wrong",
      "The next on-call engineer who might face the same problem",
      "No one - it's mostly a formality"
    ],
    "answer": 1,
    "explain": "A good postmortem is documentation aimed at making the next person's response faster and easier, not a report card."
  }
]
```

## Where to go next

You've made it through a first on-call rotation, from setup to a 3am page to writing it up afterward. That
same instinct for staying calm under pressure and reasoning clearly about what happened, shows up again in a
different high-stakes setting: [Technical Interviews](/guides/technical-interviews) - another situation
where the pressure feels bigger than the actual problem in front of you.

---

[← Phase 2: The 3am Page](02-the-3am-page-a-calm-playbook.md) · [Guide overview](_guide.md)
