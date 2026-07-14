---
title: "Why One Agent Isn't Enough"
guide: "building-a-multi-agent-system"
phase: 1
summary: "A single agent juggling unrelated concerns tends to lose focus. Splitting work across specialized agents fixes that - at the cost of real coordination overhead. Both halves of that trade, stated plainly."
tags: [multi-agent, coordination, specialization, context, advanced]
difficulty: advanced
synonyms:
  - "why use multiple ai agents"
  - "single agent doing too much"
  - "when to split an agent into multiple agents"
  - "agent context overload"
updated: 2026-07-06
---

# Why One Agent Isn't Enough

Give one agent three unrelated jobs - research a topic, write it up, then check the write-up for accuracy - and watch what happens around turn 20. The system prompt for "be a careful fact-checker" is competing with 4,000 tokens of research notes and a half-finished draft, all in the same context window. The agent doesn't announce that it's confused. It starts citing a source that says something slightly different from what it wrote, or verifying its own claim by re-reading its own draft instead of the source. Nothing crashes. The output is worse in ways that are individually hard to catch.

This is the coordination problem in miniature: one context window, one set of instructions, three jobs that pull in different directions. [Context Engineering](/guides/context-engineering) covers why a crowded window degrades output in general. Multi-agent design is the specific fix when the crowding comes from *distinct concerns* - not just "too much text" but "too many different jobs stacked in one instruction set."

## What "distinct concerns" actually means

Not every long task needs to be split. A single agent that reads five documents and summarizes them is doing one job with a lot of input - that's a context-size problem, not a specialization problem. Solve it with retrieval and summarization, not more agents.

The split earns its keep when the *jobs themselves* conflict:

- **Different voice or stance.** A writer agent should sound confident and readable. A verifier checking the writer's claims should sound skeptical and literal. One system prompt can't hold both without one leaking into the other.
- **Different context needs.** A researcher wants the raw sources in its window. A summarizer wants the researcher's *conclusions*, not the raw sources - feeding it both dilutes the summary with material it should already have distilled past.
- **Different failure modes you want to isolate.** If the research step hallucinates a source, you want that caught before it reaches the writing step, not tangled into a draft that's already half-written around it.

If none of those apply - if it's genuinely one concern that runs long - a longer, better-managed context on a single agent beats splitting it. Specialization fixes conflicting jobs, not big jobs.

## The fix: one agent, one concern

Split along the seams above and each agent gets a narrow, coherent job: a researcher that only researches, a writer that only writes from a research summary, a verifier that only checks claims against sources. Each one's system prompt fits in a paragraph. Each one's context holds only what that job needs. A verifier with a clean, skeptical framing and no attachment to the prose it's checking catches things a self-checking writer won't - it isn't defending its own sentences.

```text
single agent, three hats           three agents, one hat each
┌─────────────────────┐            ┌──────────┐  ┌────────┐  ┌──────────┐
│ research + write +   │    →       │ Research │→ │ Write  │→ │ Verify   │
│ verify, one context  │            └──────────┘  └────────┘  └──────────┘
│ (instructions compete)│            each: narrow job, clean context
└─────────────────────┘
```

That's the appeal, and it's real. It's also only half the story.

## The tax: coordination overhead is not free

Three agents means three places for things to go wrong instead of one, plus a fourth new problem that didn't exist before: getting them to work together.

- **Handoff design becomes a real task.** What exactly does the researcher pass the writer - raw notes, a structured summary, a citation list? Get the handoff format wrong and the writer is missing what it needs, or drowning in what it doesn't. This is a new design surface that a single agent never had.
- **Latency stacks up.** Three sequential agent calls are three round trips, not one. If each takes 15 seconds, the pipeline takes 45-plus, not 15.
- **Cost multiplies.** Every agent has its own system prompt, its own context, its own model call. Three agents doing a job one agent used to do is roughly three times the token spend, sometimes more once retries and handoff overhead are counted in.
- **Debugging gets harder, not easier.** When the final output is wrong, which agent caused it - did research miss something, did writing misstate it, or did verification wave it through? A single agent's mistake is at least in one place. A multi-agent mistake requires tracing across a handoff boundary, which is exactly the kind of manual work [Loop Engineering](/guides/loop-engineering) is trying to get an agent to do *for itself* - you don't want to reintroduce it for yourself as the human debugging the system.

None of this means multi-agent is wrong. It means the decision is a real trade, not a free upgrade. A rough rule of thumb: split when the concerns genuinely conflict and the task is valuable enough to absorb the coordination cost. Don't split because "multi-agent" sounds more sophisticated than "agent." A single well-scoped agent with a clean context is still the right answer for most tasks - multi-agent earns its complexity on the tasks where one agent's context and voice can't hold every job at once.

```quiz
[
  {
    "q": "What kind of task actually benefits from splitting into multiple agents?",
    "choices": [
      "Any task involving more than one document",
      "A task where the sub-jobs need different voices, different context, or isolated failure modes",
      "Any task that takes more than 10 turns to finish",
      "Tasks that need to run faster"
    ],
    "answer": 1,
    "explain": "Splitting pays off when the jobs conflict in stance, context needs, or failure isolation - not merely because a task is long or multi-step. A long single-concern task is usually a context problem, not a specialization problem."
  },
  {
    "q": "Which of these is a real cost of moving from one agent to three?",
    "choices": [
      "Nothing changes except better output",
      "Coordination overhead: handoff design, added latency, multiplied cost, and harder debugging",
      "Multi-agent systems are always cheaper because each agent does less work",
      "Multi-agent systems eliminate the need for context management"
    ],
    "answer": 1,
    "explain": "Three agents means three round trips, three context windows to manage, a new handoff-format design problem, and a harder question of which agent caused a bad final result."
  },
  {
    "q": "A single agent summarizing five long documents into one report is struggling. What's the better first fix?",
    "choices": [
      "Split it into five separate agents, one per document",
      "Improve retrieval and summarization within one agent's context before assuming it needs to be multiple agents",
      "Add a supervisor agent to manage it",
      "Increase the step budget"
    ],
    "answer": 1,
    "explain": "This is one concern (summarization) with a lot of input - a context-management problem, not a case of conflicting jobs. Multi-agent splitting solves a different problem than context overload."
  }
]
```

---

[Guide overview](_guide.md) · [Phase 2: Orchestration Patterns →](02-orchestration-patterns.md)
