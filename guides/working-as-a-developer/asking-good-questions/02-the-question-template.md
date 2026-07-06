---
title: "The Question Template That Actually Works"
guide: "asking-good-questions"
phase: 2
summary: "A reusable template for asking developer questions - what you're trying to do, what you expected, what actually happened, what you tried, and a minimal reproduction - with a bad question rewritten using it."
tags: [communication, soft-skills, questions, debugging, templates]
difficulty: beginner
synonyms: ["how to write a good bug report question", "template for asking for help", "how to ask a question on slack", "how to write a minimal reproduction"]
updated: 2026-07-06
---

# The Question Template That Actually Works

Five parts, in this order: what you're trying to do, what you expected, what actually happened, what you
already tried, and - if you can put one together - a minimal reproduction. Not every question needs all
five, but running through them before you hit send catches most of what makes a question unanswerable.

## The template

**1. What you're trying to do.** The goal, not the mechanism. "I'm trying to paginate a list of orders,"
not "I'm trying to use `slice()` on this array." This is what prevents the XY problem from Phase 1 - if your
approach is wrong, this line is what lets someone catch it.

**2. What you expected.** What should have happened if things worked. "I expected the second page to start
at order 21." Sounds obvious, but it tells the reader what "working" means to you, which is often not
obvious from the code alone.

**3. What actually happened.** The exact error, output, or behavior - not a paraphrase. Copy-paste the real
error message and stack trace. "It gives an error" makes someone ask "which one?" before they can help.
"It threw `TypeError: Cannot read properties of undefined (reading 'length')` on line 42" doesn't.

**4. What you already tried.** Two or three attempts, each with its result. This is the "show your work"
from Phase 1, folded into the template so it's never skipped.

**5. A minimal reproduction, if you can make one.** The smallest version of the code that still shows the
problem - ideally something someone can paste and run. Not always possible (some bugs only show up with
real data or a live service), but when it is, it's the single biggest time-saver on this list. Building it
also frequently reveals the bug to you before you even ask.

## A bad question, rewritten

**Bad:**

> Hey, my API call isn't working, anyone know why?

This has none of the five parts. It doesn't say which endpoint, what "not working" means, what was tried, or
show any code. Anyone who wants to help has to interview the asker first - and most people won't bother.

**Rewritten with the template:**

> **What I'm trying to do:** Fetch a user's order history from `/api/orders?user_id=123` and render it in
> the dashboard.
>
> **What I expected:** A 200 response with a JSON array of orders.
>
> **What actually happened:** A 403 response with body `{"error": "missing scope: orders:read"}`. Full
> response in the thread.
>
> **What I tried:** Confirmed the auth token is valid (works fine on `/api/profile`). Checked the token's
> scopes in the JWT payload - `orders:read` isn't listed. Not sure if I need to request that scope somewhere
> or if it's a backend config issue.
>
> **Minimal repro:**
> ```
> curl -H "Authorization: Bearer $TOKEN" https://api.internal/orders?user_id=123
> ```

This version can be answered without a single follow-up question. The reader can look at the scope issue
directly, or say "yeah, you need to request that scope in the OAuth config" in one reply. The asker did the
narrowing work instead of outsourcing it.

## Trim it to fit the moment

The full template is for a written question in Slack, a ticket, or a forum post - anywhere the answer might
come from someone who wasn't there for the last hour of your debugging. In a quick verbal check with someone
sitting next to you, you can compress it to two sentences: goal, and what's different from expected. The
five parts don't have to be five paragraphs; they're five things to make sure are covered, however briefly
the moment allows.

```quiz
[
  {
    "q": "In the template, what should \"what actually happened\" contain?",
    "choices": ["A paraphrase like \"it gives an error\"", "The exact error message, output, or behavior", "A guess at what caused it"],
    "answer": 1,
    "explain": "\"It gives an error\" forces a follow-up question. The exact text lets someone act immediately."
  },
  {
    "q": "Why does the template start with \"what you're trying to do\" rather than the code you wrote?",
    "choices": ["It's a more polite opener", "It surfaces the actual goal, which catches an XY problem before it wastes time", "It's required by most style guides"],
    "answer": 1,
    "explain": "Leading with the goal is what lets a reader catch a wrong approach instead of answering the wrong question outright."
  },
  {
    "q": "What's the biggest time-saver among the five parts, when you can produce it?",
    "choices": ["A long list of everything you tried", "A minimal reproduction someone can paste and run", "A polite greeting"],
    "answer": 1,
    "explain": "A minimal repro often reveals the bug to you before anyone even answers, and removes all guesswork for whoever helps."
  }
]
```

---

[← Phase 1: Why Some Questions Get Answered Fast and Others Get Ignored](01-why-questions-get-ignored.md) · [Guide overview](_guide.md) · [Phase 3: Async vs. Sync, and Reading the Room →](03-async-vs-sync-reading-the-room.md)
