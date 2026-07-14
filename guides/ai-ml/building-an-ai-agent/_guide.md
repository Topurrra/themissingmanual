---
title: "Building an AI Agent"
guide: "building-an-ai-agent"
phase: 0
summary: "What an agent actually is under the hood: the model plus tools plus a loop. Function-calling, the reasoning-acting cycle, and where agents go wrong."
tags: [ai, agent, llm, function-calling, tool-use, reasoning-loop]
category: ai-ml
order: 10
difficulty: intermediate
synonyms: ["how does an ai agent work", "what is an llm agent", "build an ai agent from scratch", "function calling explained", "tool use with an llm", "react agent loop", "why does my agent loop forever", "agent step budget and guardrails"]
updated: 2026-07-10
---

# Building an AI Agent

You've seen the demos where an "AI agent" books a flight, fixes a bug, or files your taxes, and it feels like there's some new kind of intelligence behind the curtain. There isn't. An agent is the same language model you already know, handed two things: a set of tools it can call, and a loop that keeps running until the job is done. Once you see those three parts - model, tools, loop - the magic turns into machinery you can build, debug, and trust.

This guide takes the curtain down: the mental model first (it's a loop, and you write most of it), then the reasoning-acting cycle step by step with real function-calls, and finally the plain-spoken part - the ways agents spiral, hallucinate tools, and burn money, and the guardrails that keep them on a leash.

## How to read this

- **Want the whole idea in one sitting?** Read [Phase 1: An Agent Is a Loop](01-an-agent-is-a-loop.md). It installs the model-plus-tools-plus-loop picture, which is most of the battle.
- **Want it to actually click?** Read in order. Phase 1 is the *what*, Phase 2 is the *how* (function-calling and the real cycle), and Phase 3 is the *where it bites* - the failure modes and the guardrails that separate a toy from something you'd let near production.

## The phases

1. **[An Agent Is a Loop](01-an-agent-is-a-loop.md)** - the mental model: a model that reasons, decides to call a tool, reads the result, and repeats until done. The control loop *you* write versus the choices the *model* makes.
2. **[The Reasoning-Acting Cycle](02-the-reasoning-acting-cycle.md)** - function-calling with a schema, the turn-by-turn message exchange, how tool results feed back in, and what "memory" really means here.
3. **[Where Agents Go Wrong](03-where-agents-go-wrong.md)** - infinite loops, hallucinated tool calls, runaway cost, and the guardrails - step budgets, validation, approval gates - that keep an agent on a leash.

> This guide assumes you're comfortable calling a model programmatically. If "send a request, get text back" isn't second nature yet, read [Using an LLM API](/guides/using-an-llm-api) first - an agent is that same call, wrapped in a loop.

[Phase 1: An Agent Is a Loop](01-an-agent-is-a-loop.md) →
