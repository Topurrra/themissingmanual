---
title: "Failure Recovery and Guardrails"
guide: "building-a-multi-agent-system"
phase: 3
summary: "What happens when a sub-agent fails, hallucinates, or loops - and the guardrails that contain it: timeouts, retry limits, output validation, and hard budget caps."
tags: [multi-agent, guardrails, timeouts, retries, validation, budget, advanced]
difficulty: advanced
synonyms:
  - "multi-agent failure recovery"
  - "sub-agent timeout and retry"
  - "validating sub-agent output"
  - "multi-agent cost control"
updated: 2026-07-06
---

# Failure Recovery and Guardrails

Every guardrail a single agent needs - step budgets, tool validation, approval gates, covered in [Building an AI Agent](/guides/building-an-ai-agent) - still applies to each agent in a multi-agent system. What's new here is what happens *between* agents: a sub-agent failing, returning something wrong, or looping costs more than that agent's own budget. It can propagate into every downstream agent that trusts its output. The orchestrator's job is to make sure it doesn't.

## Failure 1 - A sub-agent hangs or times out

A worker agent gets stuck mid-tool-call, or its model call never returns. In a single-agent system, that's the whole program stalled. In a multi-agent system, it's worse in a specific way: a supervisor waiting on one worker blocks every step that depended on that worker's result, and if nothing bounds the wait, the whole run hangs indefinitely.

The fix is a timeout on every sub-agent dispatch, with an explicit decision for what happens when it fires - not just "the call ends."

```text
dispatch("search-worker", task, timeout=30s)
  → no response in 30s
  → orchestrator marks this dispatch FAILED, not "still pending"
  → supervisor decides: retry, reassign to a different worker, or abort this branch
```

A timeout without a defined next step converts a hang into a silent skip instead of a fix. Decide up front whether a timed-out worker gets retried, replaced, or treated as a hard failure for that branch of work.

## Failure 2 - A sub-agent loops

The same "can't tell when to stop" problem from single-agent systems ([Loop Engineering](/guides/loop-engineering)) shows up at the orchestration level too, in a form that's easier to miss: a supervisor re-dispatching the same failed task to the same worker, expecting a different result.

```text
Attempt 1: dispatch(search-worker, "find the config file") → not found
Attempt 2: dispatch(search-worker, "find the config file") → not found  ← same task, same worker
Attempt 3: dispatch(search-worker, "find the config file") → not found  ← still looping
```

A **retry limit** caps this per task, and it should trigger a change in strategy, not just a stop:

```text
MAX_RETRIES = 2
if retries_for(task) >= MAX_RETRIES:
    escalate_to_supervisor("search-worker failed twice on: find the config file")
    # supervisor tries a different worker, a different approach, or gives up cleanly
```

A retry cap that halts silently is only half a fix - the useful version tells the supervisor to change tactics, since retrying an identical failed dispatch a third time has the same odds as the first two.

## Failure 3 - A sub-agent hallucinates a wrong answer

This is the dangerous one, because a hallucinated result doesn't look like a failure - it looks like a normal, confident output. A research worker reports a source that doesn't say what it claims. A code worker reports "tests pass" when it didn't actually run them. Nothing times out, nothing errors. The orchestrator has no reason to distrust it unless something checks.

The guardrail is the same principle as [Guardrails That Hold](/guides/prompt-injection-and-guardrails): treat a sub-agent's output as untrusted input to the orchestrator, not as ground truth. Validate before the next agent builds on it.

```text
worker_result = dispatch("code-worker", "fix the failing test")
# don't trust worker_result.claims_tests_pass on its own
actual_result = run_tests()   # orchestrator verifies independently
if not actual_result.passed:
    reject(worker_result, reason="claimed pass, tests still failing")
```

Where independent verification isn't possible - a research claim you can't automatically re-check - the fallback is asking a *different* agent to check it, the same way a human editor doesn't proofread their own writing. A verifier agent with no stake in the original answer catches things the original agent, primed to see its own work as correct, will not. The security angle on this - a sub-agent's output potentially carrying adversarial or manipulated content, not just a good-faith mistake - is covered in [Prompt Injection and Guardrails](/guides/prompt-injection-and-guardrails); the orchestration guardrail here handles the good-faith-mistake case, that guide handles the adversarial one.

## Failure 4 - Runaway cost across the whole system

A single agent's cost grows with its turn count. A multi-agent system's cost grows with turn count *per agent, multiplied by the number of agents*, and a supervisor that retries liberally or fans out too wide can burn a budget fast without any single step looking expensive in isolation.

```text
3 workers × up to 2 retries each × growing context per call
= worst case, several times a single agent's cost, for one "run"
```

Two caps make this bounded instead of open-ended:

- **A per-agent step budget**, same as a single agent needs - no worker or supervisor turn runs unbounded.
- **A total run budget** the orchestrator tracks across every agent combined, in tokens or dollars, that halts the entire run when hit - not just one agent's slice of it.

```text
RUN_BUDGET = 500_000  # tokens, across all agents combined
if total_tokens_used >= RUN_BUDGET:
    abort_run("Hit total budget cap")
    # partial results so far are still returned - not silently discarded
```

A cap per agent alone misses the case where every agent individually stays under its limit but the sum across a wide fan-out or a retried supervisor loop is what actually blows the budget. Track the total, not just the parts.

## Putting it together

None of these guardrails are exotic - timeouts, retry limits, independent validation, and budget caps are ordinary engineering discipline applied to a system where the "code path" is chosen by models at runtime instead of by you at write time. The pattern across all four: don't let one agent's confidence stand in for verification, and don't let any single failure mode run unbounded. Build these before the first real multi-agent run, not after the first surprising bill.

```quiz
[
  {
    "q": "A worker agent times out mid-task. What's the guardrail beyond setting a timeout?",
    "choices": [
      "Nothing else is needed - the timeout alone fixes it",
      "An explicit decision for what happens next: retry, reassign, or abort that branch",
      "Automatically restart the entire multi-agent run from the beginning",
      "Ignore the timeout and let the run continue without that worker's result"
    ],
    "answer": 1,
    "explain": "A timeout that ends the call without a defined next step converts a hang into a silent skip. The orchestrator needs a decision - retry, reassign to a different worker, or abort - for what a timeout means."
  },
  {
    "q": "Why is a hallucinated sub-agent result more dangerous than a timeout or an error?",
    "choices": [
      "It costs more tokens than a timeout",
      "It looks like a normal, confident, successful output, so nothing flags it unless something independently checks it",
      "It always crashes the orchestrator",
      "It only happens with fan-out patterns"
    ],
    "answer": 1,
    "explain": "A timeout or error is visibly a failure. A hallucinated result looks like success - a confident claim with no error signal - so the orchestrator needs to independently validate it rather than trust it by default."
  },
  {
    "q": "Why isn't a per-agent step budget alone enough to control multi-agent cost?",
    "choices": [
      "Per-agent budgets don't work at all",
      "Every agent could individually stay under its own budget while the combined total across all agents and retries still runs away",
      "Step budgets only apply to supervisor agents",
      "Cost is unrelated to the number of agents"
    ],
    "answer": 1,
    "explain": "Cost in a multi-agent system is roughly per-agent cost multiplied by the number of agents and retries. A per-agent cap doesn't catch a wide fan-out or a retry-heavy supervisor where each piece stays under its own limit but the sum doesn't."
  }
]
```

---

[← Phase 2: Orchestration Patterns](02-orchestration-patterns.md) · [Guide overview](_guide.md)
