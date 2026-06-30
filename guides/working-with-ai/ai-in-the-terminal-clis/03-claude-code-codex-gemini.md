---
title: "Claude Code, Codex, and Gemini CLI"
guide: ai-in-the-terminal-clis
phase: 3
summary: "An honest comparison of the three main terminal coding agents - what they share, where they differ, and how to pick one without overthinking it."
tags: [claude-code, codex, gemini-cli, coding-agents, comparison]
difficulty: intermediate
synonyms:
  - "claude code vs codex vs gemini cli"
  - "best terminal coding agent"
  - "compare ai cli tools for coding"
  - "which ai coding agent should i use"
updated: 2026-06-30
---

# Claude Code, Codex, and Gemini CLI

Three terminal coding agents get most of the attention right now: **Claude Code** from Anthropic, the **Codex CLI** from OpenAI, and the **Gemini CLI** from Google. There are others, and the landscape moves fast enough that specifics here may drift - but these three are the ones a normal person is most likely to reach for, and understanding them tells you how to read any newcomer.

The honest headline first: they are more alike than different. All three follow the loop from the last phase - describe, work, review, approve. All three can read your files, run commands, and edit code. All three ask permission before consequential actions and let you tune how often. If you learn one, you can use the others within an afternoon. So don't agonize over the choice; the differences are real but mostly at the margins.

## What they all share

- **The same basic workflow.** Run it in your project folder, talk to it in plain language, review diffs, approve.
- **Permission gating.** Each defaults to asking before edits and risky commands, with modes to loosen that as you trust it.
- **Project memory files.** Each reads a plain-text file you can drop in your project to give it standing instructions - your conventions, what to avoid, how to run your tests. (They use different file names, but the idea is identical.)
- **Tool connections (MCP).** All three support a shared standard for plugging in extra tools and data sources, so an agent can reach a database, an issue tracker, or your docs. You don't need this on day one, but it's there when you grow into it.

That shared core is why "which one" matters less than people expect. The skill you build transfers.

## Where they differ

The differences cluster in a few areas: which AI model is behind them, how they're priced, and the feel of the tool.

| | Claude Code | Codex CLI | Gemini CLI |
|---|---|---|---|
| Maker | Anthropic | OpenAI | Google |
| Model family | Claude | GPT / o-series | Gemini |
| Open source | No | Yes | Yes |
| Typical pull | Strong at multi-step coding tasks and staying on track | Tight integration with the OpenAI ecosystem | Large free allowance; ties into Google's tools |
| Usual access | Paid subscription or API | Subscription or API | Generous free tier, then paid |

A few notes on that table, kept honest:

- **The model matters most, and it changes constantly.** The quality of any of these comes mostly from the model underneath, and all three makers ship new models often. Any claim that one is flatly "the best coder" has a short shelf life. By the time you read this, the rankings may have shuffled.
- **Open source isn't only about cost.** Codex CLI and Gemini CLI being open source means you can read exactly what they do and the community can extend them. Claude Code is closed but widely used and heavily polished. None of these positions is wrong - they're different bets.
- **Pricing is the most likely thing to be out of date here.** Gemini CLI has stood out for a large free tier, which makes it a low-risk place to start. Claude Code and Codex are typically reached through a paid plan or pay-as-you-go API. Check current pricing yourself before committing - this is exactly the kind of detail that moves.

## How to pick

Don't overthink it. Here's a decision that holds up:

- **Want to try this for free first?** Start with the Gemini CLI's free tier. You'll learn the loop at no cost and that skill carries to the others.
- **Already paying for ChatGPT or living in OpenAI's tools?** The Codex CLI fits that world and is the natural pick.
- **Already paying for Claude, or you've heard good things about it for coding?** Claude Code is a strong default and many developers reach for it for exactly the multi-step "go fix this across a few files" work this guide describes.

And the real answer underneath all three: pick one, run a small task on a real project, and judge it yourself. A guide can tell you the shape of the field, but the feel of a tool on your kind of work is something you only learn by using it. Spend twenty minutes, not twenty hours of research. Because they share a workflow, switching later costs you almost nothing - your habits transfer even when the tool doesn't.

## The takeaway

You came in thinking the choice was the hard part. It isn't. The hard part - and the valuable part - is the habit: describe precisely, watch the work, read every diff, keep the risky actions gated, and lean on version control as your undo. That habit makes any of these three a genuine force multiplier and keeps all of them from making a confident mess of your project. The tool is interchangeable. The discipline is what you keep.
