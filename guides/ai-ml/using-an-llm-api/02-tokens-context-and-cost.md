---
title: "Tokens, Context & Cost"
guide: "using-an-llm-api"
phase: 2
summary: "A token is a chunk of text; the context window is the model's limited short-term memory that input and output must both fit inside; and you pay per token — so long histories cost more and can overflow. Plus streaming for responsiveness."
tags: [llm, tokens, context-window, cost, streaming, beginner-friendly]
difficulty: beginner
synonyms: ["what is a token in an llm", "what is a context window", "why is the llm api expensive", "how does llm pricing work", "why does my llm conversation get cut off", "what is streaming in an llm api"]
updated: 2026-06-19
---

# Tokens, Context & Cost

In Phase 1 you saw a `usage` block counting `prompt_tokens` and `completion_tokens`. That word — *token* — is the unit the whole economy of LLMs runs on. It's the unit of how much the model can "hold in its head," and it's the unit you're billed in. Get a feel for tokens and two mysteries dissolve at once: why your bill is what it is, and why long conversations start failing.

This phase is the one that saves you from a surprise invoice and a confusing "the model forgot the start of our chat" bug. Let's build the intuition.

## What a token is

**What it actually is.** A **token** is a chunk of text — usually a short piece of a word, sometimes a whole short word, sometimes punctuation. Models don't read letter by letter or word by word; they read in these chunks. "Cat" might be one token; "unbelievable" might be three (`un`, `believ`, `able`); a space and the next word often travel together.

**Why people get this wrong.** The common assumption is "one token = one word." Close, but it'll mislead you. A rough working rule for English is that a token is a bit less than a word, so a paragraph is more tokens than it has words. Don't treat that as exact — providers publish tools to count tokens precisely for their models, and the `usage` field tells you the real count after each call. Use those for anything that matters; use the rough rule only for back-of-envelope estimates.

📝 **Terminology.** "Tokenize" just means *chop the text into these chunks*. Everything the model reads (your prompt) and everything it writes (its reply) is measured in tokens.

## The context window — the model's short-term memory

**What it actually is.** The **context window** is the maximum number of tokens a model can consider at once — its entire short-term memory for a single request. Crucially, **the input and the output share this same budget.** Everything you send (system message, the whole conversation history, the user's question) *plus* everything the model generates back has to fit inside that one window.

```text
   ┌──────────────── the context window (a fixed token budget) ────────────────┐
   │                                                                            │
   │   [system]  [earlier turns ...........]  [your new question]   [the reply] │
   │   └──────────────── what you send (input) ──────────────┘   └── output ──┘ │
   │                                                                            │
   └────────────────────────────────────────────────────────────────────────┘
        if the whole thing won't fit, something has to give
```

**What it does in real life.** The window is large on modern models — easily enough for a long document or a substantial conversation — but it is *finite*. When your input grows (long document, long chat history), two things happen: you leave less room for the output, and eventually you risk not fitting at all.

⚠️ **Gotcha.** Two failure modes come straight from this shared budget:

- **The reply gets cut off.** If your input eats most of the window, there's little room left for the answer, and the model stops mid-sentence. Remember `finish_reason: "length"` from Phase 1? That's this. The fix is to leave headroom: shorter input, or explicitly reserve more space for the output.
- **The request is rejected.** If the input alone exceeds the window, the API returns an error before generating anything. You can't just keep appending to a conversation forever.

**Why this saves you later.** This is the real reason a long-running chat eventually breaks or "forgets" the beginning. The cure is to keep only what matters in the window — trim or summarize old turns rather than blindly resending the entire history (which, remember from Phase 1, *you* are the one resending).

## You pay per token

**What it actually is.** With a hosted model, you're billed by tokens used — both the ones you send and the ones the model generates. There's no flat per-request price; a call that processes a long document and writes a long answer costs more than a one-line question with a one-line reply.

A few things worth knowing, stated honestly rather than with invented numbers:

- **Input and output are often priced differently.** Generated (output) tokens are commonly billed at a higher rate than input tokens. The exact rates vary by provider and by model — **check current pricing on the provider's site**, because it changes.
- **Bigger, more capable models cost more per token** than smaller, faster ones. Part of building well is using a cheaper model where it's good enough and saving the expensive one for the hard requests.
- **The `usage` block is your meter.** Every response tells you exactly how many tokens that call cost. Log it. That's how you find the request type quietly draining your budget.

💡 **Key point.** Two levers control your bill: *how many tokens you send* and *how many you let the model generate*. You control the first by trimming history and not stuffing in irrelevant context; you control the second by capping output length where a short answer will do.

## Long histories cost more — and can overflow

These two ideas — the window and the per-token price — collide in the most common real-world bug. Because you resend the whole conversation on every turn (Phase 1), each new message makes the *next* request bigger:

```text
   turn 1:  send [system + Q1]                           → small, cheap
   turn 2:  send [system + Q1 + A1 + Q2]                 → bigger
   turn 3:  send [system + Q1 + A1 + Q2 + A2 + Q3]       → bigger still
   ...
   turn N:  send the entire conversation, every time     → slow, costly, and
                                                            eventually too big
```

⚠️ **Gotcha.** A naive chat feature that just keeps appending turns gets *more expensive and slower with every message*, and one day a long conversation crosses the window limit and starts erroring. This catches people in production after the demo worked fine with three short messages. Plan for it from the start: cap the history you resend, drop or summarize old turns, and keep the system message lean.

## Streaming — for when waiting feels broken

**What it actually is.** Normally you wait for the model to finish, then get the whole reply at once. **Streaming** instead sends the reply to you token by token as it's generated, so you can show text appearing live — the typewriter effect you've seen in chat apps.

**What it does in real life.** Streaming doesn't make the model faster or cheaper — the total tokens and total time are about the same. What it changes is *perceived* speed: the user sees words within a moment instead of staring at a spinner for several seconds. For anything interactive, that difference is the whole experience.

**The trade-off.** Streaming is a bit more work to handle: instead of one JSON response, you read a sequence of small chunks and stitch them together. For a background job (summarize this overnight), don't bother — wait for the full response. For a user watching a chat box, it's usually worth it.

## Recap

1. A **token** is a chunk of text, a bit smaller than a word; both your input and the model's output are measured in tokens.
2. The **context window** is a fixed token budget that input *and* output share — overflow it and replies get cut off or the request is rejected.
3. You **pay per token**, input and output (often at different rates, bigger models cost more) — check current pricing, and watch the `usage` meter.
4. Because you resend the whole history each turn, **long conversations get costlier, slower, and eventually too big** — trim or summarize.
5. **Streaming** shows the reply as it's generated: same cost and total time, far better perceived responsiveness for interactive use.

Next: the model will sometimes be wrong, slow, or unavailable — and it won't warn you. Phase 3 is the set of habits that turn a fragile demo into a feature you can stand behind.

---

Type anything and watch it split into tokens — the unit you actually pay for:

```playground-tokens
```

Watch it animated: [tokens and context windows](/explainers/TokensContext.dc.html)

[← Phase 1: It's Just an API Call](01-its-just-an-api-call.md) · [Guide overview](_guide.md) · [Phase 3: Building Reliably →](03-building-reliably.md)
