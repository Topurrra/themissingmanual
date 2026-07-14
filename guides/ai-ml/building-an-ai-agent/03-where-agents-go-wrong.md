---
title: "Where Agents Go Wrong"
guide: "building-an-ai-agent"
phase: 3
summary: "The plain failure modes: infinite loops, hallucinated tool calls, runaway cost, and unsafe actions - plus the guardrails that contain them: step budgets, validation, approval gates, and observability."
tags: [ai, agent, failure-modes, guardrails, step-budget, cost, safety]
difficulty: intermediate
synonyms: ["why does my agent loop forever", "agent hallucinates tool calls", "agent runaway cost", "agent step budget", "guardrails for ai agents", "agent stuck in a loop", "approval gate for agent actions", "agent keeps repeating"]
updated: 2026-07-10
---

# Where Agents Go Wrong

The loop from the last two phases is elegant on paper. In production it's where the bills, the 2am pages, and the "why did it delete that?" incidents come from. None of this is a reason to avoid agents - it's the reason to build them with a leash. Every failure traces back to the same root: the model decides, but has no built-in sense of *when to stop*, *what's real*, or *what's safe*. Those judgments are your code's job, and skipping them is how a demo becomes a disaster.

This phase is the plain-spoken one. Four ways agents spiral, and the guardrail for each. Build the guardrails first; the agent is the easy part.

## Failure 1 - The infinite loop

The model never decides "done," so your loop never exits. Sometimes it repeats the same tool call forever; sometimes it oscillates between two; sometimes it keeps "almost" finishing. Every turn is a paid model call.

```text
TURN 14  search("invoice total")  → "no results"
TURN 15  search("invoice amount")  → "no results"
TURN 16  search("invoice total")  → "no results"   ← already tried this
TURN 17  search("invoice amount")  → "no results"   ← and this. forever.
```

*What just happened:* The agent got stuck, re-trying near-identical calls because nothing told it to give up. With no limit, this runs until you notice the bill. The fix is a hard ceiling you own - a **step budget**.

```text
MAX_STEPS = 12
for step in range(MAX_STEPS):
    reply = call_model(messages)
    if reply.is_final: return reply
    run_tool_and_append(reply)
else:
    return "Stopped: hit the step budget without finishing."
```

*What just happened:* The loop now *cannot* run more than 12 turns, full stop. A step budget is the single most important guardrail an agent has - it converts "potentially infinite cost" into "bounded cost." Make it the first line you write, before the agent does anything clever.

> ⚠️ **Gotcha - the budget must be a hard stop, not a hint.** Don't put "please finish within 12 steps" in the prompt and call it done. The model may ignore it. The ceiling has to live in *your loop's* control flow, where the model can't talk its way past it.

## Failure 2 - Hallucinated tool calls

The model is a text predictor, and sometimes it predicts a tool that doesn't exist, or arguments that don't match the schema. It'll confidently "call" `send_invoice` when your only tools are `get_invoice` and `list_invoices`.

```text
model returns:  tool_call: send_invoice(id="INV-200")
your tools:     get_invoice, list_invoices        ← no send_invoice here
```

*What just happened:* The model invented a capability it wished it had. If your loop runs tool calls without checking, this throws - or worse, silently does nothing while the loop keeps spinning. The guardrail is plain validation: confirm the tool exists and the arguments fit its schema *before* running, and if they don't, feed the error back as a tool message so the model can correct.

```text
if reply.tool_name not in TOOLS:
    append_tool_error(f"No such tool '{reply.tool_name}'. Available: {list(TOOLS)}")
    continue   # let the model try again, within the step budget
```

*What just happened:* Instead of crashing, you handed the model a correction and let it retry - bounded by the step budget so a stubborn hallucination can't loop forever. Treat every tool call as untrusted input, because that's exactly what it is.

## Failure 3 - Runaway cost

Even a *correct* agent can be expensive, and the reason is sneaky: remember from [Phase 2](02-the-reasoning-acting-cycle.md) that you resend the whole message list every turn. So the cost of each turn *grows* as the conversation does. A 20-turn task isn't 20 cheap calls - the later calls are large.

```text
TURN 1   send  1 message      → small
TURN 5   send  9 messages     → bigger
TURN 12  send 23 messages     → big; you pay for all of it, again
```

*What just happened:* Because the history compounds, total cost climbs faster than the turn count. Two levers tame it: the step budget (caps how many turns happen) and trimming the history (drop or summarize old, no-longer-needed messages so each turn doesn't carry the full pile). The instinct "I'll let it run as long as it needs" is precisely the expensive one.

> 💡 **Key point.** Agent cost is roughly *turns × growing-context*, not *turns × fixed-price*. Budget the turns and prune the context, and you turn an open-ended bill into a predictable one.

## Failure 4 - Unsafe actions

This is the one that keeps people up at night. A tool that only *reads* is low-stakes; a tool that *writes, deletes, sends, or spends* can do real damage from a single confident-but-wrong call. The model doesn't know it's about to email the wrong customer or drop the wrong table.

```text
model: tool_call: delete_records(table="customers", where="status='trial'")
                  ↑ confidently wrong filter - about to delete real accounts
```

*What just happened:* One hallucinated argument on a destructive tool is an incident. The guardrail is an **approval gate**: high-impact tools pause and require a human (or a stricter rule) to confirm before they run. Read-only tools run freely; anything that changes the world stops for a check.

```text
if TOOLS[name].is_destructive:
    if not human_approves(name, arguments):
        append_tool_error("Action declined by approver.")
        continue
run_tool(name, arguments)
```

*What just happened:* You drew a line between "let it explore" and "let it act." The agent can plan all it wants; the moment it reaches for something irreversible, a human is in the loop. The lazy-but-correct default: every new tool is read-only until you've earned the trust to let it write.

## The guardrail checklist

Before any agent touches production, walk this list. It's the difference between a tool you trust and one you fear.

```text
☐ STEP BUDGET     hard turn limit in the loop (not the prompt)
☐ VALIDATE        check tool name + arguments against the schema before running
☐ PRUNE CONTEXT   trim/summarize history so cost stays bounded
☐ APPROVAL GATE   human confirm for write/delete/send/spend tools
☐ OBSERVE         log every turn - reasoning, tool, args, result, cost
```

*What just happened:* You turned four failure modes into five concrete defenses. The last one - observability - is the quiet hero: when an agent misbehaves (and it will), a per-turn log of what it decided and why is the only way to debug something whose "code path" was chosen by a model at runtime.

## For builders

Build the cage before the animal. Write the loop with the step budget and validation in place *first*, give it one read-only tool, log every turn, and watch it run end to end. Only then add a second tool. Add anything destructive last, behind an approval gate, and never on the same day you ship. An agent is genuinely a small amount of code - the engineering is almost entirely in the guardrails, and that's where your attention belongs.

```quiz
[
  {
    "q": "What is the single most important guardrail against an agent looping forever?",
    "choices": [
      "A bigger model that's less likely to get confused",
      "A hard step budget enforced in your loop's control flow",
      "A polite instruction in the prompt to finish quickly",
      "Lowering the temperature setting"
    ],
    "answer": 1,
    "explain": "A step budget enforced in code caps the number of turns no matter what the model does, converting potentially infinite cost into bounded cost. A prompt hint can be ignored."
  },
  {
    "q": "Why does a longer agent task cost more than its turn count alone suggests?",
    "choices": [
      "Later turns use a more expensive model automatically",
      "You resend the whole message history each turn, so each turn's context grows",
      "The model charges a penalty for slow tools",
      "It doesn't - cost is flat per turn"
    ],
    "answer": 1,
    "explain": "Because the full conversation is resent every turn, the per-turn context (and cost) grows as the task goes on. Cost is roughly turns times growing-context."
  },
  {
    "q": "What's the right guardrail for a tool that deletes or sends things?",
    "choices": [
      "Run it freely - the model is usually right",
      "Put it behind an approval gate so a human confirms before it runs",
      "Remove it from the schema so the model can't see it",
      "Retry it three times to be safe"
    ],
    "answer": 1,
    "explain": "Destructive tools should pause for human (or stricter-rule) approval before executing. Read-only tools can run freely; anything that changes the world stops for a check."
  }
]
```

[← Phase 2: The Reasoning-Acting Cycle](02-the-reasoning-acting-cycle.md) · [Guide overview](_guide.md)
