---
title: "Orchestration Patterns"
guide: "building-a-multi-agent-system"
phase: 2
summary: "Three nameable shapes for coordinating multiple agents — linear pipeline, fan-out/fan-in, and supervisor-worker — with a concrete scenario for each."
tags: [multi-agent, orchestration, pipeline, fan-out, supervisor-worker, advanced]
difficulty: advanced
synonyms:
  - "multi-agent orchestration patterns"
  - "agent pipeline pattern"
  - "fan out fan in pattern"
  - "supervisor worker agents"
updated: 2026-07-06
---

# Orchestration Patterns

Once you've decided a task genuinely needs more than one agent, the next decision is shape: how do the agents hand work to each other? Most real systems are built from three patterns, often combined. Each has a distinct data flow, a distinct failure profile, and a scenario it fits naturally.

## Pattern 1 — Linear pipeline

Agent A's output becomes agent B's input, in a fixed sequence. No agent decides what runs next — the order is hardcoded by you.

```text
[Researcher] → notes → [Writer] → draft → [Editor] → final
```

**Scenario:** a content pipeline. A researcher agent pulls facts and sources into a structured note. A writer agent turns that note into a draft, seeing only the note — not the raw sources, which would dilute its focus. An editor agent tightens the draft for voice and length. Each stage has one clean input and one clean output; nothing loops back.

Pipelines are the easiest pattern to reason about because the flow is linear and each handoff is a fixed contract — the writer always gets "a note," never "sometimes a note, sometimes raw sources." Failure is also straightforward to localize: check the stage outputs in order, and the first bad one is the culprit. The limitation is rigidity — a pipeline can't react to something the researcher finds mid-run by changing what the writer is asked to do; the sequence is fixed before it starts.

## Pattern 2 — Fan-out / fan-in

Several agents work the same problem independently and in parallel, then a synthesis step combines their outputs. No agent sees another's work until the fan-in step.

```text
                 ┌→ [Agent A: cost angle]  ──┐
[Problem] ──fan──┼→ [Agent B: risk angle]  ──┼─→ [Synthesizer] → combined answer
                 └→ [Agent C: timeline angle]┘
```

**Scenario:** evaluating a vendor proposal from three angles at once — one agent assesses cost, one assesses risk, one assesses delivery timeline — running in parallel rather than one agent trying to hold all three lenses in its head sequentially. A synthesis agent then reads all three assessments and produces a single recommendation, explicitly weighing where they agree and where they conflict.

Fan-out is the pattern for genuinely independent sub-problems, and its main payoff is speed — three parallel calls instead of three sequential ones — plus each agent staying narrowly focused on its one lens. The cost is at the fan-in step: the synthesizer has to reconcile viewpoints that may disagree, and a synthesizer with a vague brief will average disagreements away instead of surfacing them, quietly hiding the most useful signal the pattern produced.

## Pattern 3 — Supervisor-worker

One agent plans and dispatches; it doesn't do the work itself. Worker agents each execute one narrow, well-defined task and report back. The supervisor decides what happens next based on what comes back — the pattern with real branching, unlike the fixed sequence of a pipeline.

```text
                    ┌──────────────┐
                    │  Supervisor   │  ← plans, dispatches, decides next step
                    └──────┬───────┘
             dispatch │    │    │ dispatch
                ┌──────┘    │    └──────┐
                ▼            ▼           ▼
          [Worker: search] [Worker: code] [Worker: test]
                │            │           │
                └──────report────────────┘
                            ▼
                     back to Supervisor
```

**Scenario:** a coding task where the supervisor breaks "add a feature" into steps, dispatches a search worker to find the relevant files, dispatches a code-writing worker once it knows where to edit, then dispatches a test worker to check the result — deciding after each report whether to proceed, retry, or dispatch a different worker. Unlike a pipeline, the next dispatch depends on what the previous worker returned.

This pattern handles dynamic, branching work a fixed pipeline can't — the supervisor can react to a worker failing by trying a different worker, or skip a step that turns out to be unnecessary. That flexibility is also its cost: the supervisor itself becomes a single point of failure and a single point of complexity. A supervisor with a vague dispatch policy will spin — reassigning the same failed step to the same worker with the same result, a variant of the loop problem covered in [Building an AI Agent](/guides/building-an-ai-agent). The supervisor's decision logic needs the same rigor as any single agent's loop, plus the added job of interpreting worker reports correctly.

## Picking one

Match the shape to how the work actually branches, not to which pattern seems most sophisticated:

| Your task looks like... | Use |
|---|---|
| A fixed sequence of transformations, each stage depending only on the last | Pipeline |
| Several independent angles on the same input, none needing the others' work | Fan-out/fan-in |
| Work whose next step depends on what just happened, with real decisions to make | Supervisor-worker |

Real systems mix these — a supervisor might dispatch a fan-out step as one of its workers, or a pipeline stage might internally be a supervisor-worker loop. Start with the simplest shape that fits, and only add branching complexity where the task actually branches.

```quiz
[
  {
    "q": "In a fan-out/fan-in pattern, where does most of the design risk sit?",
    "choices": [
      "In dispatching the parallel agents, which is trivial",
      "In the synthesis step, where a vague brief can average away real disagreement between the parallel results",
      "There is no risk once agents run in parallel",
      "In choosing which model each worker uses"
    ],
    "answer": 1,
    "explain": "The parallel agents are usually the easy part. A synthesizer without a clear brief for handling disagreement will smooth conflicting findings into a bland average instead of surfacing the useful signal."
  },
  {
    "q": "What distinguishes supervisor-worker from a linear pipeline?",
    "choices": [
      "Supervisor-worker is always faster",
      "The supervisor decides the next step based on what a worker just reported, rather than following a fixed sequence",
      "Pipelines can't have more than two stages",
      "Workers don't report results back"
    ],
    "answer": 1,
    "explain": "A pipeline's order is fixed in advance. A supervisor makes a real decision after each worker's report — retry, proceed, or dispatch something different — which a fixed pipeline cannot do."
  },
  {
    "q": "You need a fixed sequence: extract data, transform it, load it into a database, with no branching decisions needed. Which pattern fits best?",
    "choices": [
      "Supervisor-worker, for maximum flexibility",
      "Fan-out/fan-in, to parallelize the stages",
      "Linear pipeline, since each stage depends only on the previous stage's fixed output",
      "None — this doesn't need multiple agents"
    ],
    "answer": 2,
    "explain": "A fixed, non-branching sequence is exactly what a pipeline is for. Supervisor-worker's branching logic and fan-out's parallelism aren't needed when the steps and order never change."
  }
]
```

---

[← Phase 1: Why One Agent Isn't Enough](01-why-one-agent-isnt-enough.md) · [Guide overview](_guide.md) · [Phase 3: Failure Recovery and Guardrails →](03-failure-recovery-and-guardrails.md)
