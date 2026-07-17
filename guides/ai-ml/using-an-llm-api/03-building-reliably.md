---
title: "Building Reliably"
guide: "using-an-llm-api"
phase: 3
summary: "The model is non-deterministic, can be confidently wrong, can be slow, and can fail - so build for it: control randomness with temperature, verify outputs instead of trusting them, handle timeouts and retries, and ask for structured output like JSON."
tags: [llm, reliability, temperature, hallucination, json, error-handling, beginner-friendly]
difficulty: beginner
synonyms: ["why does the llm give different answers", "what is temperature in an llm", "what is an llm hallucination", "how to get json from an llm", "how to handle llm api errors and timeouts", "how to make llm output reliable"]
updated: 2026-07-10
---

# Building Reliably

The first time you wire a model into your app and it answers your question, it feels like magic. The second time, you ask the *same* question and get a slightly different answer, and the magic curdles into worry. Then it confidently states something false, or takes eight seconds, or returns an error mid-demo - and you realize you're not calling a database that returns the same row every time. You're calling something that *generates*.

That's not a flaw to be fixed; it's the nature of the tool. Building reliably means designing *around* these properties. Here are the four that bite, and what to do about each.

## It's non-deterministic - the same input can give different output

**What it actually is.** A language model generates text by repeatedly picking a likely next token, and that pick involves some randomness. So the same prompt can produce different wordings - or different *answers* - on different calls. Expected behavior, not a bug.

**The lever: temperature.** Most APIs expose a `temperature` setting (commonly a number from 0 upward) that controls how much randomness goes into each pick:

- **Low temperature** → more focused and repeatable. Good when you want consistency: classification, extraction, "pick one of these options," anything where you'd be annoyed by variety.
- **Higher temperature** → more varied and creative. Good for brainstorming, drafting, alternatives - anywhere you *want* different results each time.

```text
   low temperature                     higher temperature
   ───────────────                     ──────────────────
   tends to the same,                  ranges more widely,
   safe, expected answer               more surprising / creative

   use for: extraction,                use for: brainstorming,
   classification, format-strict       drafting, "give me options"
```

⚠️ **Gotcha.** Low temperature makes output *more* consistent - it does **not** make it guaranteed-identical or guaranteed-correct. Don't build logic that assumes the model returns the exact same string every time. If your code needs an exact, reliable value, constrain the output shape (see structured output below) and validate it, rather than trusting the model to repeat itself.

## It can be confidently wrong - hallucinations

**What it actually is.** A model can produce text that is fluent, authoritative, and *false*. It can invent a function that doesn't exist, cite a source that was never written, or state a "fact" with total confidence. This is a **hallucination**, and it's the single most important thing to internalize: the model is optimized to produce *plausible* text, not *true* text. Plausible and true usually overlap. Usually is not always.

**What it does in real life.** The danger is precisely that wrong answers don't *look* wrong - no error, no flag, no lower confidence in the tone. A made-up API method reads exactly like a real one.

💡 **Key point.** Treat model output as a *draft from a fast, confident, sometimes-mistaken assistant* - never as a source of truth. Verify anything that matters:

- For facts, prices, dates, or anything load-bearing - check against a real source.
- For anything where a wrong answer causes harm (medical, legal, financial, destructive actions) - put a human in the loop, or don't use the raw output at all.
- Show users where an answer came from when you can, so *they* can verify too.

🪖 **War story.** Plenty of people have shipped a chatbot that confidently quoted a refund policy, a discount, or a legal clause that never existed - and found out the business was on the hook for what the bot promised. The model wasn't malfunctioning; it was doing exactly what it does, generate plausible text. The missing piece was a guardrail around it.

## It can be slow - and it can fail

**What it actually is.** A model call goes over the network to someone else's busy service and waits for text to be generated token by token - *slower and less predictable* than a typical database query or internal API. And like any network call, it can fail: the service can be briefly overloaded, rate-limit you, or time out.

**What it does in real life.** Treat the call as what it is - a network request to an external dependency that is sometimes slow and sometimes down. The habits are the ordinary ones for any flaky external service:

- **Set a timeout.** Don't let a single call hang your request forever. Decide how long you're willing to wait and give up past that.
- **Retry transient failures - carefully.** For a temporary error (overloaded, rate-limited, timed out), waiting briefly and trying again often works. Back off between attempts and cap the number of tries, so a struggling service isn't hammered and your user isn't stuck.
- **Don't blindly retry everything.** A "your input is too long" or "your key is invalid" error won't fix itself on retry - that's a bug to surface, not a blip to retry. Retry the transient stuff; fail fast on the rest.
- **Have a fallback.** Decide what your app does when the model is genuinely unavailable: a friendly message, a cheaper backup model, a queued retry later. "It just spins forever" is not a plan.

⚠️ **Gotcha.** A naive integration with no timeout and infinite retries can turn one slow upstream moment into a pile-up that takes *your* app down - every stuck request holding resources while it waits. The timeout and the retry cap aren't polish; they're what keeps a model hiccup from becoming your outage.

## Asking for structured output (JSON)

**What it actually is.** Often you don't want prose, you want *data* your code can use: a category, a score, a list of extracted fields. You can ask the model to reply in a structured format, almost always **JSON**, and then parse it.

**What it does in real life.** You instruct the model, in your prompt, to respond with JSON in a specific shape - many providers offer a dedicated setting (a "JSON mode" or schema option) that strongly nudges or guarantees valid JSON. A simple extraction request might look like:

```json
{
  "model": "some-chat-model",
  "messages": [
    {
      "role": "system",
      "content": "Extract the order details. Respond ONLY with JSON matching: {\"item\": string, \"quantity\": number, \"rush\": boolean}. No prose, no explanation."
    },
    { "role": "user", "content": "I'd like three of the blue mugs, and I need them fast." }
  ]
}
```

And you'd hope to get back, in `choices[0].message.content`, something like:

```json
{ "item": "blue mug", "quantity": 3, "rush": true }
```

*What just happened:* You turned a sentence of free text into structured data your program can act on - no fragile string-parsing of prose. The system message both describes the exact shape *and* tells the model to return nothing but the JSON.

⚠️ **Gotcha.** Even with clear instructions, the model can still hand you something that won't parse - wrapped in a code fence, prefixed with "Sure! Here's the JSON:", or with a missing field. So **always parse defensively**: try to parse, and if it fails or a required field is missing, handle that case (retry once, fall back, or surface an error) instead of assuming the JSON is well-formed. Use the provider's JSON/schema mode when available - it makes valid output more likely - but validate anyway.

## Don't ship a foot-gun

The difference between a demo and a feature is a handful of guardrails:

- **Validate before you trust.** Check the output (parse the JSON, verify the facts that matter) instead of assuming it's right.
- **Keep a human in the loop for anything consequential.** Especially actions that spend money, delete data, or give advice with real stakes.
- **Cap the blast radius.** Timeouts, retry limits, output-length caps, and a fallback for when the model is down.
- **Watch your spend.** Log the `usage` from Phase 2 so a runaway prompt doesn't quietly run up a bill.
- **Never expose your key** (Phase 1) - server-side only, loaded from a secret.

## Recap

1. The model is **non-deterministic** - same input, possibly different output. Use **temperature** to dial randomness down for consistency or up for creativity; never assume identical results.
2. It can be **confidently wrong** (hallucinate). Treat output as a draft, not truth - verify anything that matters and keep humans in the loop for high-stakes cases.
3. It can be **slow or fail** - set timeouts, retry transient errors with backoff and a cap, fail fast on permanent ones, and have a fallback.
4. For data, ask for **structured output (JSON)** - and parse it defensively, because the model can still hand you something malformed.
5. The guardrails - validate, human-in-the-loop, cap the blast radius, watch spend, hide the key - are what make it shippable.

You can now call a hosted model, reason about its cost and limits, and build around its rough edges. The remaining craft is getting the model to actually *do what you want* - writing instructions that produce good results reliably.

> ⏭️ Next up: [Prompt Engineering, Plainly](/guides/prompt-engineering-plainly) - how to write prompts that get you the output you're after, without the cargo-cult.

---

[← Phase 2: Tokens, Context & Cost](02-tokens-context-and-cost.md) · [Guide overview](_guide.md)
