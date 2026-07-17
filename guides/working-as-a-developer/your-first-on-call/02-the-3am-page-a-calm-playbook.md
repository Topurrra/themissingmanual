---
title: "The 3am Page: A Calm Playbook"
guide: "your-first-on-call"
phase: 2
summary: "How to stay calm when the pager goes off: triage before you try to fix anything, stop the bleeding before you root-cause, and know when to escalate instead of struggling alone."
tags: [on-call, incident-response, triage, escalation, calm-under-pressure]
difficulty: beginner
synonyms: ["what to do when paged at 3am", "how to triage an outage", "on-call panic what to do", "when to escalate an incident", "stop the bleeding before root cause"]
updated: 2026-07-16
---

# The 3am Page: A Calm Playbook

Your phone buzzes. You're awake, heart already going, before you've read a single word. That physical jolt
is normal - everyone gets it, even the engineer who's been doing this for a decade. What separates a calm
response from a panicked one isn't the absence of adrenaline. It's having a sequence to follow so the
adrenaline doesn't have to make decisions for you.

This phase is that sequence. For the technical mechanics of diagnosing and fixing what's actually broken,
[When Prod Is Down](/guides/when-prod-is-down) goes deep on triage and mitigation. Here, the focus is the
order of operations and the headspace that makes following it possible at 3am.

## Step 1: Triage before you touch anything

Before you fix, before you even fully understand - answer three questions:

- **Is this actually urgent?** Some alerts are noisy or low-stakes and can wait for morning. Check the
  alert's severity and what it's actually measuring before assuming the worst.
- **Who's affected, and how many?** All users, or one customer's edge case? Payment flow, or a background
  job nobody's watching tonight? This determines how fast you need to move and who else needs to know.
- **How bad is "bad"?** Fully down is different from slow. Data loss risk is different from a cosmetic bug.
  Match your urgency to the actual severity, not to how scared you feel.

Five minutes spent triaging is never wasted, even on something that turns out to be nothing. Rushing
straight to "fix it" without knowing what "it" is wastes far more time than it saves.

## Step 2: Stop the bleeding, not the mystery

The instinct at 3am is to understand *why* before you act. Resist it. Your job in the first stretch of an
incident is to reduce user pain, not to solve the puzzle.

That usually means one of: roll back the last deploy, restart the failing service, fail over to a healthy
replica, or turn off the feature flag behind the bad behavior. None of these require knowing the root cause
- they remove the most likely culprit from production. [When Prod Is Down](/guides/when-prod-is-down)
walks through each of these mitigations in detail, with the tradeoffs of each.

💡 **The mantra worth memorizing.** *Mitigate first, root-cause later.* You are not being paid at 3am to be
clever. You're being paged to make the graph green. The clever part - understanding exactly what broke and
why - can happen in daylight, with coffee, and other people awake to help.

## Step 3: Know when to stop struggling alone

This is the part beginners get wrong most often, almost always in the same direction: they wait too long to
escalate because asking for help feels like admitting failure.

It isn't. Escalating is the job working correctly. Here's the real test:

- **You've spent 15-20 minutes and don't have a mitigation in sight.** That's long enough. Escalate.
- **The blast radius is bigger than you expected once you looked closer.** Get someone with more context on
  the call - don't quietly absorb a bigger incident than you signed up for.
- **You're about to do something you're not fully sure about** (a database change, a forced failover,
  anything hard to undo). A second opinion costs two minutes and prevents the incidents that turn into
  legendary war stories for the wrong reasons.
- **You don't know what's happening, full stop.** Not knowing isn't the failure. Sitting with "I don't know"
  alone for an hour, when someone else could've told you in five minutes, is.

🪖 **The math that should convince you.** Waking up a senior engineer costs them twenty minutes of
disrupted sleep. An extra ninety minutes of a payment outage while you quietly try to figure it out solo
costs the company real money and costs you a much worse morning. The senior engineer would rather be woken
up. Every time.

## What escalating actually sounds like

It's not a distress signal, it's a normal status update: *"Hey, I'm on-call for checkout, seeing 500s since
2:47, tried a rollback and it didn't help, I think I need another set of eyes - can you hop on?"* That's it.
No apology required, no explanation of why you couldn't solve it yourself. You're doing exactly what on-call
is designed for: contain what you can, pull in help for what you can't.

Once things are stable, don't let the story of the night end at "and then it was fixed." What you learned
in that window - the fix, the near-misses, the runbook that didn't exist - becomes the material for the next
phase.

## Your turn: it's 2:47am and you're alone with it

Reading "escalate at 15-20 minutes" is easy in daylight. Deciding it live, on your first page, when asking
for help feels like admitting you couldn't handle it, is the actual job. There is no single right answer
below and nothing is scored right or wrong - but the clock is real, and every minute on it is a minute you
carry this by yourself.

```scenario
{
  "title": "2:47am - checkout is down and you're alone",
  "brief": "First rotation, first real page. It's 2:47am, checkout is throwing 500s on the payment flow, and nobody else on the team knows yet. Every minute you spend deciding is a minute you're carrying this by yourself.",
  "prompt": "What do you do first?",
  "clock": { "unit": "min", "running": "carrying it alone", "resolved": "you're not alone anymore" },
  "resolvedHeading": "Help is on the way. Here's how it went.",
  "actions": [
    {
      "id": "triage",
      "label": "Check severity: who's affected, how bad, is it urgent",
      "cost": 3,
      "reveals": "checkout-api error rate: 94% (500s)\naffected: all logged-in users, payment flow\nstatus: fully down, not degraded",
      "note": "Three minutes well spent. You now know this is real, it's the payment flow, and it's fully down - that's what decides how fast you move next."
    },
    {
      "id": "rollback",
      "label": "Roll back the last deploy",
      "cost": 5,
      "reveals": "$ kubectl rollout undo deployment/checkout-api\ndeployment.apps/checkout-api rolled back\n$ curl -s -o /dev/null -w \"%{http_code}\\n\" https://api.example.com/health\n500",
      "note": "Sensible first move. It just didn't work, and you're several minutes further into this."
    },
    {
      "id": "restart",
      "label": "Restart the checkout service, in case it's stuck",
      "cost": 5,
      "reveals": "deployment.apps/checkout-api restarted\n$ curl -s -o /dev/null -w \"%{http_code}\\n\" https://api.example.com/health\n500",
      "note": "Also reasonable, also no change. Two real attempts, still down."
    },
    {
      "id": "logs",
      "label": "Dig into the stack traces yourself until you find it",
      "cost": 12,
      "reveals": "checkout-api  ERROR  NullPointerException: paymentToken.expiry is null\n  at PaymentService.charge(PaymentService.java:112)\n  ... 3,800 more in the last 90s",
      "note": "You found something real - a null token expiry - and it is genuinely interesting. You found it alone, twelve minutes in, on your first-ever page, before anyone else knew you were struggling."
    },
    {
      "id": "one-more-try",
      "label": "Try one more fix before you wake anyone up",
      "cost": 10,
      "reveals": "$ kubectl scale deployment/checkout-api --replicas=6\ndeployment.apps/checkout-api scaled\n$ curl -s -o /dev/null -w \"%{http_code}\\n\" https://api.example.com/health\n500",
      "note": "It didn't work. You're now well past the point where a second opinion would have been cheap."
    },
    {
      "id": "wait-and-watch",
      "label": "Wait a few minutes to see if it recovers on its own",
      "cost": 6,
      "reveals": "checkout-api error rate: 94% (500s)\nno change",
      "note": "Nothing changed except the clock."
    },
    {
      "id": "escalate",
      "label": "Page the secondary on-call for a second set of eyes",
      "cost": 2,
      "resolves": true,
      "reveals": "you: Hey, I'm on-call for checkout, seeing 500s since 2:47, tried a rollback and a restart, neither helped - I think I need another set of eyes, can you hop on?\nmaya: on my way, give me 2 min\nmaya: joined the call",
      "note": "Two minutes, and you're no longer the only person who knows this is happening."
    }
  ],
  "debrief": {
    "ideal": 10,
    "text": "The win here isn't the fix - it's not carrying this alone. Triage told you it was real and it was bad, one real mitigation attempt told you it wasn't a quick one, and paging your secondary at that point is the process working, not you failing. Root cause can wait for daylight and a second set of eyes.",
    "notes": [
      { "when": "if-taken", "action": "logs", "text": "You found something real - a null payment token expiry - and it's worth knowing. But you found it alone, twelve minutes into your first-ever page, before anyone else knew you were struggling. Interesting isn't the same as urgent." },
      { "when": "if-taken", "action": "one-more-try", "text": "This is the trap the guide names directly: not escalating because you feel like you should be able to handle it. One more idea, alone, past the point where a second opinion would have cost two minutes and saved ten." },
      { "when": "if-taken", "action": "wait-and-watch", "text": "Waiting cost six minutes and taught you nothing you didn't already know. It isn't triage and it isn't mitigation - it's the appearance of doing something." },
      { "when": "if-not-taken", "action": "triage", "text": "You skipped straight to fixing without knowing what you were fixing or how bad it was. It worked out this time - but you were guessing at urgency instead of knowing it." }
    ]
  }
}
```

Quick check before you move on:

```quiz
[
  {
    "q": "During an incident, what should you generally do first?",
    "choices": [
      "Find the root cause before making any changes",
      "Stop the bleeding with a fast mitigation, then investigate the cause",
      "Wait for a senior engineer to take over"
    ],
    "answer": 1,
    "explain": "Mitigation (rollback, restart, failover, flag-off) reduces user pain fast without requiring you to understand the root cause yet."
  },
  {
    "q": "You've been stuck for 20 minutes with no mitigation working. What should you do?",
    "choices": [
      "Keep trying alone until you find it, escalating looks like failure",
      "Escalate - this is exactly what the escalation path is for",
      "Wait until morning to ask for help"
    ],
    "answer": 1,
    "explain": "Escalating after a reasonable attempt is the process working correctly, not a personal failure."
  },
  {
    "q": "Why triage (urgency, blast radius, severity) before fixing anything?",
    "choices": [
      "It's a formality most teams skip",
      "It ensures your response matches the actual severity instead of your adrenaline level",
      "It's only necessary for outages affecting all users"
    ],
    "answer": 1,
    "explain": "Triage keeps you from either overreacting to something minor or underreacting to something severe."
  }
]
```

---

[← Phase 1: Before Your First Shift](01-before-your-first-shift.md) · [Guide overview](_guide.md) ·
[Phase 3: After the Fire →](03-after-the-fire-the-postmortem.md)
