---
title: "Guardrails That Hold"
guide: "prompt-injection-and-guardrails"
phase: 3
summary: "You can't stop the model from being fooled, so you contain it: separate trust levels, least-privilege tools, validated output, and a human in the loop for anything irreversible."
tags: [llm, security, guardrails, least-privilege, human-in-the-loop, output-validation, intermediate]
difficulty: intermediate
synonyms: ["how to defend against prompt injection", "llm guardrails that work", "least privilege for ai agents", "human in the loop ai", "validate llm output", "secure ai agent design"]
updated: 2026-06-30
---

# Guardrails That Hold

By now the bad news is clear: you cannot reliably stop a model from being fooled, because being instruction-following is what it's for. So we stop trying to make the model un-foolable and instead build a system where *being fooled doesn't matter much*. That's the whole shift. Assume the model **will** eventually follow a malicious instruction, and design so that when it does, the damage is small, caught, or impossible.

These guardrails come from ordinary security engineering — least privilege, validation, trust boundaries, human approval for high-stakes actions. None of them is novel. What's new is *where* you apply them: not to the model's reasoning, which you can't trust, but to its inputs, its powers, and its outputs.

## 1. Treat the model as untrusted, and put the boundary after it

The single most important reframe: **the model's output is untrusted data, exactly like the input was.** Don't pipe the model's reply straight into a tool, a shell, a SQL query, or a `delete`. Put your security boundary *after* the model — the model proposes, your code disposes.

```text
   untrusted in            untrusted out
        │                       │
        ▼                       ▼
   [ content ] → [ LLM ] → [ proposed action ] → [ YOUR CODE checks it ] → effect
                                                   (allow-list, validate,
                                                    confirm, or refuse)
```

*What just happened:* You moved the trust boundary to where you actually have control — your own code, between the model and any real effect. The model can suggest anything; nothing happens until deterministic code you wrote approves it. This single placement is what most "AI safety" boils down to in practice.

## 2. Least privilege: don't hand the model a loaded gun

An injected instruction can only do what the model's tools can do. So give the model the *least* power that still does the job.

- **Scope tools narrowly.** If the task is "look up an order's status," give it a read-only `get_order_status(id)` — not a general `run_sql` or `http_request`. A read-only tool can't be turned into a delete.
- **Separate read from write.** Reading data is far lower-risk than changing it. Keep write/delete/spend tools behind the strictest guardrails, or out of the model's reach entirely.
- **Limit scope per call.** The credentials the model's tools run under should see only what *this* user is allowed to see — not the whole database. Then even a successful hijack is capped at one user's data.
- **No raw code execution on untrusted input** unless it's in a real sandbox with no network and no secrets.

> 💡 **The test.** For every tool you expose, finish this sentence: "If the model called this with the worst possible arguments, the damage would be ______." If you can't fill that blank with something you can live with, the tool is too powerful — narrow it, or gate it behind step 4.

## 3. Validate and constrain the output

Don't trust the shape *or* the content of what comes back.

- **Constrain to choices, not free text, when you can.** If the model picks an action, make it pick from an **allow-list** of known-safe operations. "Choose one of: `refund`, `escalate`, `close`" is far safer than "write the API call to run."
- **Validate arguments before acting.** Is that an order ID that belongs to this user? Is the amount within a sane limit? Check it in your code, every time.
- **Strip dangerous output rendering.** If you display model output as HTML or Markdown, sanitize it — this is what stops the image-tag exfiltration trick from Phase 2. Don't auto-render links or images pointing at arbitrary URLs.
- **Parse defensively.** Treat malformed or surprising output as a failure to handle, not an edge case to ignore.

```text
risky:   model returns  →  "DELETE FROM orders WHERE id=..."  →  run it
safe:    model returns  →  { "action": "close", "order_id": 7 }
                        →  is "close" in allow-list? is order 7 this user's?
                        →  only then perform it
```

*What just happened:* The model's job shrank from "produce a command I'll execute" to "pick a label and an id I'll verify." There's no string the attacker can inject that turns a label-from-a-fixed-list into a destructive command, because your code — not the model's text — decides what each label does.

## 4. Human-in-the-loop for anything irreversible

Some actions are too costly to ever let a possibly-hijacked model take alone. For those, the model *proposes* and a human *approves* before anything happens.

- Spending money, sending external communications, deleting data, granting access, changing permissions — these earn a confirmation step.
- Make the confirmation **meaningful**: show the human exactly what will happen ("Send this email to these 400 people?") in terms they can evaluate, not a vague "Proceed?"
- The bar is *reversibility and blast radius.* A draft the user reviews is fine to automate. An irreversible, wide-reach action is not.

> ⚠️ **Don't let convenience erode the gate.** The pressure will always be to auto-approve "to make it smoother." Every action you move from human-approved to fully automatic is a new thing an injected instruction can trigger unattended. Automate the safe and reversible; keep a human on the irreversible.

## 5. Separate trust levels and limit the blast radius

Tie it together with structure, not hope:

- **Keep secrets out of the context.** If an API key or another user's data isn't in the prompt, it can't be exfiltrated from the prompt. Inject secrets in your code at the tool layer, not into text the model sees.
- **Separate the planning context from the untrusted content** where you can — e.g., let one model call summarize an untrusted document into a constrained, structured result, and never let that document's raw text reach the call that has access to tools.
- **Log and monitor.** Record what tools the model called with what arguments. You want to *notice* an exfiltration attempt or a weird burst of actions, and be able to reconstruct what happened.
- **Cap rate and quantity.** Limits on how many emails, how much spend, how many records per session turn a catastrophic hijack into a contained one.

## What actually protects you — and what doesn't

```text
DOESN'T reliably protect:              DOES protect:
─────────────────────────              ──────────────
"ignore bad instructions" prompt       least-privilege, scoped tools
trusting the model to behave           output validation + allow-lists
giving the agent broad tools           human-in-the-loop on risky actions
secrets sitting in the context         secrets injected at the tool layer
auto-rendering model output            sanitized rendering, no auto-fetch
```

*What just happened:* The left column tries to fix the model. The right column accepts that the model is foolable and constrains the *system* around it. Defense in depth means stacking several from the right column, so that one bypass doesn't equal one breach.

## For builders

This is the same posture you'd take with any untrusted input crossing into a powerful system — the [OWASP Top 10](/guides/owasp-top-10) habits transfer directly: validate at the boundary, apply least privilege, don't trust client-supplied (here, model-supplied) data, sanitize output. The LLM doesn't repeal those lessons; it gives them a new place to apply. Build your feature so that the honest answer to "what's the worst an injected instruction could do?" is "annoy one user," not "drain the account."

## Recap

1. The model is foolable by design, so **don't try to make it un-foolable** — contain it.
2. Treat **model output as untrusted**; put your security boundary in your code, *after* the model.
3. **Least privilege** — narrow, read-only-where-possible tools scoped to this user. An injected instruction can only do what the tools allow.
4. **Validate and constrain output** — allow-lists over free text, check arguments, sanitize rendering to kill exfiltration tricks.
5. **Human-in-the-loop** for irreversible or wide-reach actions; keep secrets out of the context; log, monitor, and rate-limit.
6. Stack several of these — **defense in depth** — because any single guardrail can be bypassed.

You now have the real security model for LLM apps: not a magic prompt, but a system that stays safe even when the model is fooled. Build for the fooling, and a hijack becomes a contained incident instead of a headline.

```quiz
[
  {
    "q": "What is the central design shift behind guardrails that actually work?",
    "choices": [
      "Make the model impossible to fool with a stronger system prompt",
      "Assume the model will be fooled, and design so that when it is, the damage is small, caught, or impossible",
      "Use a larger model that won't fall for injection",
      "Lower the temperature so the model behaves predictably"
    ],
    "answer": 1,
    "explain": "You can't make an instruction-following model un-foolable. The fix is to contain it: constrain inputs, powers, and outputs so a successful hijack does little harm."
  },
  {
    "q": "Where should the security boundary sit in an LLM feature that can take actions?",
    "choices": [
      "Before the model, by sanitizing the input text",
      "Inside the model's reasoning, which you instruct to be careful",
      "After the model, in your own code that validates and approves any proposed action before it has an effect",
      "There's no need for a boundary if the model is well-behaved"
    ],
    "answer": 2,
    "explain": "The model proposes; your deterministic code disposes. Treat model output as untrusted and gate every real effect behind allow-lists and validation you control."
  },
  {
    "q": "Which action most clearly warrants a human-in-the-loop confirmation rather than full automation?",
    "choices": [
      "Drafting a reply the user will review before sending",
      "Looking up an order's status with a read-only tool",
      "Sending an email to 400 external recipients",
      "Summarizing a document into a structured result"
    ],
    "answer": 2,
    "explain": "The bar is reversibility and blast radius. A wide-reach, irreversible action like mass external email should be confirmed by a human; safe, reversible steps can be automated."
  }
]
```

---

[← Phase 2: How Injection Actually Works](02-how-injection-works.md) · [Guide overview](_guide.md)
