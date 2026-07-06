---
title: "Async vs. Sync, and Reading the Room"
guide: "asking-good-questions"
phase: 3
summary: "How to pick the right channel for a question - Slack, a ticket, a meeting, or walking over - how to respect focus time, and when to escalate past someone who hasn't answered."
tags: [communication, soft-skills, questions, workplace, remote-work]
difficulty: beginner
synonyms: ["should i slack or email my coworker", "how to know if a question is urgent", "when to escalate a question to a manager", "how to interrupt someone at work politely"]
updated: 2026-07-06
---

# Async vs. Sync, and Reading the Room

A perfectly written question can still land badly if it goes to the wrong place. Interrupting someone
mid-focus for something that could've waited a day burns goodwill. Waiting three days to ask something
blocking your whole team burns time. The channel matters as much as the wording.

## Match the channel to the urgency and the complexity

**Async (Slack message, ticket comment, email)** - default for most questions. Anything with a clear
answer that doesn't need back-and-forth: "does this API endpoint support pagination?", "is staging down for
anyone else?", "can you review this PR when you get a chance?" The person can answer when they resurface
from focus work, and there's a paper trail others can search later.

**A scheduled call or meeting** - for anything that needs real back-and-forth, or where explaining in text
would take longer than talking. "I don't understand how the auth flow is supposed to work across these three
services" is a 15-minute conversation with a whiteboard, not a Slack thread that spans forty messages over
two days. If you're rewriting your message a third time trying to make it clearer in text, that's the
signal to ask for 15 minutes instead.

**Walking over / interrupting in person** - reserve for genuinely urgent, blocking issues: production is
down, a deploy is failing and you need a second pair of eyes right now, you're about to ship something
risky and need a quick sanity check before you do. If it can wait an hour, it's not this category.

## Respect focus time

Most questions are not emergencies, even when they feel urgent to the person asking. Before interrupting
someone in a meeting, wearing headphones, or with a "do not disturb" status, ask yourself: will this still
matter in two hours? If yes, it's async. Sending it async doesn't mean it gets ignored - it means the
person can answer on their own schedule instead of dropping what they're doing.

A useful habit: when you send an async question, say whether it's blocking. "No rush, whenever you have a
sec" versus "this is blocking my PR from merging today" tells the reader how to prioritize you against
everything else in their queue. Without that signal, people default to treating everything as non-urgent -
which is usually the safer assumption for them, even if it's frustrating for you.

## Escalation etiquette

Sometimes you ask and get silence. The etiquette here is about timing and framing, not about being pushy.

- **Give it a real window first.** A few hours for something blocking, a day or two for something that
  isn't, accounting for time zones and whether the person's out. Pinging again after ten minutes reads as
  impatient, not urgent.
- **Nudge before you escalate.** A polite bump in the same thread - "following up on this, still blocked
  if you get a sec" - is not escalation. It's a normal part of async work.
- **Escalate the blocker, not the person.** When you do need to go to a manager, frame it around impact:
  "I've been blocked on X since Tuesday, asked in the thread, wanted to flag it's now affecting the sprint
  deadline" - not "so-and-so is ignoring me." The first gets the blocker solved. The second makes you look
  like you're keeping score.
- **Loop the original person in, don't go around them.** If possible, tell them you're escalating before or
  as you do it - "hey, going to loop in Sam since this is now blocking release, wanted you to know" - rather
  than letting them find out from their manager.

"I asked and got no answer" becoming "I'm now asking your manager" should feel like a last resort after a
real wait and a genuine nudge, not the second message you send.

```quiz
[
  {
    "q": "When should you default to an async channel like Slack or a ticket instead of a meeting?",
    "choices": ["Always, meetings are never appropriate", "For most questions with a clear answer that doesn't need back-and-forth", "Only when the question is urgent"],
    "answer": 1,
    "explain": "Async is the default for clear, answerable questions - it respects the other person's schedule and leaves a searchable record."
  },
  {
    "q": "What's a useful habit when sending an async question?",
    "choices": ["Marking every message as urgent so it gets seen", "Stating whether it's blocking, so the reader knows how to prioritize it", "Sending it multiple times to different people at once"],
    "answer": 1,
    "explain": "Without an urgency signal, most people default to treating a message as non-urgent - saying it's blocking changes that."
  },
  {
    "q": "What's the right way to escalate a question that's gone unanswered?",
    "choices": ["Go straight to their manager as soon as you notice no reply", "Give it a real window, nudge once, then escalate the blocker (not the person) while looping them in", "Ask the same question in a different channel without mentioning the first one"],
    "answer": 1,
    "explain": "Escalation should follow a genuine wait and a polite nudge, and should frame the impact rather than blame the person."
  }
]
```

Once you can get answers fast, the next skill is handling the moments where nobody's around to ask at all -
see [Your First On-Call](/guides/your-first-on-call) for what changes when you're the one holding the pager.

---

[← Phase 2: The Question Template That Actually Works](02-the-question-template.md) · [Guide overview](_guide.md)
