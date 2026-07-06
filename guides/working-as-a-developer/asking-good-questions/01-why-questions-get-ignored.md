---
title: "Why Some Questions Get Answered Fast and Others Get Ignored"
guide: "asking-good-questions"
phase: 1
summary: "What separates a question that gets a fast, useful answer from one that gets ignored: specificity, showing your work, and the XY problem."
tags: [communication, soft-skills, questions, debugging]
difficulty: beginner
synonyms: ["why is nobody answering my slack message", "how to ask a specific question", "what is the XY problem", "why do vague questions get ignored"]
updated: 2026-07-06
---

# Why Some Questions Get Answered Fast and Others Get Ignored

"Hey, does anyone know why this isn't working?" gets silence. "The `/checkout` endpoint returns a 500 when
`cart_id` is null, but only in staging - anyone seen this?" gets an answer in five minutes. Same asker, same
skill level, wildly different response. The question itself did the work.

## Vague questions get vague answers, if they get answered at all

"It doesn't work" tells the reader nothing. What's "it"? What does "doesn't work" mean - a crash, a wrong
number, a blank screen? The person reading your message now has to ask three follow-up questions before they
can even start thinking about the actual problem. Most people, staring at a busy Slack sidebar, scroll past
instead.

Compare:

- **Vague:** "My tests are failing, any ideas?"
- **Specific:** "`test_user_login` fails with `AssertionError: 401 != 200` after I added the rate limiter
  middleware. Passes if I comment the middleware out."

The second version lets someone answer without opening your branch. They already know the symptom, the
suspect, and a data point that rules things in or out. Specificity isn't about writing more - it's about
including the two or three facts that let someone reason about the problem instead of interrogating you for
them.

## Show your work

"How do I fix this bug?" invites a question back: "what have you tried?" Skip that round-trip - answer it
up front. Showing your attempts does two things: it proves you didn't skip the first steps everyone reaches for
(checked the logs, read the error, searched for it), and it stops someone from suggesting the first thing
you already ruled out.

"I checked the logs, nothing unusual. I tried restarting the service, same error. I searched the error
message and found a GitHub issue that looked related but their fix didn't apply here" tells a reviewer
exactly where the trail goes cold. Now they can start past that point instead of re-walking it with you.

This doesn't mean listing everything you did. Two or three attempts, the ones that felt most promising or
most confusing, are enough. If you tried nothing yet, say that too - don't imply you dug in when you
didn't.

## The XY problem: asking about your attempted fix instead of the real problem

The XY problem is when you have problem X, decide solution Y might fix it, get stuck on Y, and then ask
about Y - without mentioning X at all. The person answering solves Y for you, and it turns out Y was never
going to fix X. Everyone's time is gone.

**Real-world example.** A developer needs to get the last three characters of a filename (X: check the file
extension). They decide the way to do that is to get the string's length and slice it (Y). They ask: "How do
I get the length of a filename string?" Someone answers that. They ask: "How do I slice the last three
characters from a string?" Someone answers that too. Only after both answers do they discover the filenames
sometimes have no extension, or a four-letter one, and the whole slicing approach was wrong from the start.
If they'd asked "how do I check a file's extension reliably?" the first answer would've pointed at a
library function that handles all of it.

The fix is cheap: state the actual goal, then mention your attempted approach as context, not as the
question. "I'm trying to check a file's extension. I was going to slice the last three characters off the
filename - is there a better way, or does that work here?" Now the person answering can redirect you before
you've built on a broken foundation.

The pattern to watch for in yourself: if your question is entirely about *how* to do something, and you
haven't said *why*, stop and add the why. It costs one sentence and saves the whole detour.

```quiz
[
  {
    "q": "Why do vague questions like \"it doesn't work\" get slow or no responses?",
    "choices": ["People are too busy to help beginners", "The reader has to ask follow-up questions before they can even think about the problem", "Vague questions are against most team norms"],
    "answer": 1,
    "explain": "A vague question shifts the work of narrowing the problem onto the reader, so most people skip it instead."
  },
  {
    "q": "What is the XY problem?",
    "choices": ["Asking two questions at once", "Asking about your attempted solution (Y) instead of your actual goal (X)", "Asking a question that has two possible answers"],
    "answer": 1,
    "explain": "You get help with Y, but Y may never have solved X - and nobody knew X to redirect you."
  },
  {
    "q": "What's the cheapest fix for the XY problem?",
    "choices": ["Never mention your attempted approach at all", "State the actual goal first, then mention your approach as context", "Ask a stranger instead of a teammate"],
    "answer": 1,
    "explain": "One sentence stating the real goal lets the person answering catch a wrong turn before you build on it."
  }
]
```

---

[Guide overview](_guide.md) · [Phase 2: The Question Template That Actually Works →](02-the-question-template.md)
