---
title: "Real Automations (and AI Nodes)"
guide: n8n
phase: 3
summary: "Building it for real — a concrete multi-step automation end to end, how webhooks let the outside world trigger a flow, and using AI/LLM nodes to add a thinking step."
tags: [n8n, automation, webhooks, ai-nodes, llm]
difficulty: intermediate
synonyms:
  - n8n real workflow example
  - n8n webhook tutorial
  - n8n ai node llm
  - n8n automation end to end
  - how to use ai in n8n
updated: 2026-06-30
---

# Real Automations (and AI Nodes)

Enough scaffolding. Let's build something a real business would actually run, then add a step that thinks.

## A concrete automation, start to finish

The job: **every time a customer fills out the contact form on our website, look them up, route urgent ones to the team in Slack, and log everyone to a spreadsheet.** Here's the wiring.

```text
[Webhook: form submitted]
        |
[HTTP Request: enrich — look up company by email domain]
        |
   [IF: message contains "urgent" or "down"?]
       /                    \
    true                   false
      |                       |
[Slack: ping #support]   [no alert]
       \                    /
        \------- merge -----/
                 |
[Google Sheets: append a row]
```

Walk it node by node:

1. **Webhook trigger.** The form posts its data to a URL n8n gives you. The moment someone submits, this fires. (More on webhooks below.)
2. **Enrich.** An HTTP Request node calls an enrichment API with the submitter's email domain, so you learn the company name and size before a human ever reads it.
3. **Route.** An IF node checks the message text. Anything mentioning "urgent" or "down" goes down the true branch.
4. **Alert.** The true branch posts to Slack: `🔥 Urgent from {{ $json.name }} at {{ $json.company }}: {{ $json.message }}`. Notice the expressions from Phase 2 doing the work.
5. **Merge & log.** Both branches rejoin, and a Google Sheets node appends one row per submission, urgent or not, so nothing is lost.

That's five nodes and maybe twenty minutes. The thing that would've been a recurring "did anyone see the contact form?" problem now handles itself, and you have a spreadsheet of every lead as a side effect.

The build rhythm from Phase 1 still applies: wire the webhook, submit one test form, look at the real data, then build each downstream node against that real data. Don't wire all five and pray.

## Webhooks: letting the outside world knock

A schedule trigger asks "is it time yet?" on a clock. A **webhook** is the opposite — it sits and waits for the outside world to call *it*. n8n hands you a unique URL; whenever something hits that URL, your workflow runs, with whatever data the caller sent as the input.

This is how you connect to anything that can "send a notification when X happens" — form tools, payment processors (Stripe firing on a new charge), GitHub on a new issue, your own app. Instead of polling "any new orders? any new orders?" every minute, the order system tells you the instant it happens.

A few things to know:

- **Test URL vs production URL.** n8n gives you one URL for testing in the editor and a separate one for the live, activated workflow. Point your form at the test URL while building, then swap to production. Forgetting this is the classic "it worked in the editor but nothing happens live" bug.
- **The workflow must be active.** A webhook only listens when the workflow is switched on. In the editor it listens during a test run; in production it listens once activated.
- **Secure it.** Anyone who knows the URL can trigger it. Treat the URL as a secret, and for anything sensitive, check a shared token in the incoming data before acting on it.

## AI nodes: a step that thinks

Everything so far moves and reshapes data. The newer trick is a node that *reads and decides*. n8n has nodes that call large language models — OpenAI, Anthropic, and others — so a step in your flow can summarize, classify, extract, or draft, instead of only routing fields around.

Go back to the contact-form flow. The IF node checked for the literal words "urgent" or "down." Crude — it misses "your service has been broken for an hour and I'm losing money." Swap in an AI step and you can ask, in plain English, "Read this message. Reply with `urgent` or `normal`." The model reads intent, not keywords. You feed its answer into the IF node and the routing gets dramatically smarter for one extra node.

Other honest, everyday uses:

- **Summarize.** Turn a long support email into one line before it hits Slack.
- **Extract.** Pull a date, an amount, and an order number out of free-text and hand back clean fields for the spreadsheet.
- **Classify & tag.** Sort incoming messages into "billing," "bug," "sales."
- **Draft.** Write a first-pass reply for a human to approve — never auto-send unreviewed.

n8n also has an "Agent" style node where the model can decide which other tools to call, but start with the boring single-shot version: hand it text, get back a label or a summary, use that downstream. Walk before you run.

Two cautions, because AI steps fail differently than normal nodes:

- **They cost money per call and they're slow.** Each AI step is an API charge and a second or two of latency. A workflow that fires thousands of times will run up a bill — batch where you can, and don't put an AI call on a path that fires constantly.
- **They're non-deterministic.** The same input can give slightly different output, and they occasionally make things up. Never let an AI step take an irreversible action — sending money, deleting records, emailing a customer — without a human or a hard rule in between. Use it to *suggest and sort*, and keep a person on anything that can't be undone.

Put it together and you have the shape of modern automation: webhooks let the world trigger you, nodes do the moving and routing, the Code node handles the weird parts, and an AI step adds judgment where keywords fall short — all running on infrastructure you control. That's the whole pitch of n8n, built.
