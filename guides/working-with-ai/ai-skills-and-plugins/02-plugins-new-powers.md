---
title: "Plugins: New Powers"
guide: ai-skills-and-plugins
phase: 2
summary: "Plugins bundle commands, tools, and connectors that let the assistant reach outside systems and take real actions, going beyond what guidance alone can do."
tags: [plugins, tools, connectors, mcp, ai-agents]
difficulty: intermediate
synonyms:
  - "what is an ai plugin"
  - "how plugins differ from skills"
  - "ai connectors and tools"
  - "give ai assistant new abilities"
  - "mcp server vs skill"
updated: 2026-06-30
---

# Plugins: New Powers

A skill is a good briefing. A plugin is a new pair of hands.

Here's the line that separates them. A skill makes the assistant *better at* something it could already attempt with words and thinking. A plugin makes the assistant *able to do* something it flatly couldn't before - read a row from your database, post a message to Slack, run a calculation, look up today's exchange rate. No amount of clever instruction gets a model to send a real email. It needs a tool wired to your email system. That wiring is the plugin's job.

## What a plugin actually bundles

"Plugin" is a wrapper word. Open one up and you typically find some mix of three things.

**Tools.** A tool is a specific action the assistant can call, with defined inputs and outputs - `search_orders(customer_id)`, `create_calendar_event(title, time)`, `get_weather(city)`. The assistant decides when to call it and reads back what comes out. This is the part that lets the assistant *act on* the world rather than only talk about it.

**Commands.** Shortcuts you trigger on purpose, often typed as something like `/standup` or `/review`. Where a tool is something the assistant chooses to use mid-task, a command is something *you* invoke to kick off a defined workflow. Many commands are pre-packaged skills with a name on the front.

**Connectors.** The plumbing to an outside service - your GitHub, your Google Drive, your customer database, your project tracker. A connector handles the unglamorous, essential part: authenticating, fetching the right data, and handing it to the assistant in a form it can use. Under the hood, a lot of modern connectors speak a shared protocol called MCP (Model Context Protocol), which has become a common way to plug outside data and tools into AI assistants.

A single plugin might carry all three: a connector to your project tracker, a couple of tools for creating and updating tickets, and a `/triage` command that strings them into a workflow.

## Why this is a different category from skills

Skills and plugins solve different halves of the same problem, and seeing the split saves you a lot of confusion.

| | Skill | Plugin |
|---|---|---|
| What it adds | Know-how and reference material | New actions and connections |
| Changes... | How well the assistant does a task | What the assistant is *able* to touch |
| Typical contents | Instructions, templates, examples | Tools, commands, connectors |
| Reaches outside systems? | No | Yes |
| Who builds it | Often you, in plain language | Usually a developer (code involved) |
| Risk if it goes wrong | Bad output | Real action on real data |

That last row deserves a pause. A skill that misfires gives you a badly formatted invoice - annoying, harmless. A plugin that misfires can delete the wrong record, email the wrong person, or charge the wrong card, because it touches live systems. Powers come with stakes that pure guidance never has.

## The trust question

Because plugins take real actions and often hold access to your accounts, installing one is a trust decision, not a convenience one. A plugin with a connector to your email can, by design, read and send your email. That's the point - and also the risk.

Three habits keep you out of trouble:

- **Know who wrote it.** A plugin from the vendor of a tool you already use is a different proposition from one a stranger posted online. Prefer official and well-known sources.
- **Understand its reach.** When a plugin asks for access, read what it's asking for. "Read your calendar" and "manage your entire Google account" are very different grants. Give the narrowest access that does the job.
- **Watch the first few runs.** Many assistants will ask before a tool takes a consequential action - sending, deleting, paying. Keep that confirmation on while you learn a plugin's behavior. Trust it to act unattended only once you've seen it act sensibly.

None of this is meant to scare you off. Plugins are how an assistant graduates from a smart chat partner into something that actually moves work through your tools. It's the difference between an assistant that *tells you* how to clear your support queue and one that drafts the replies, files the tickets, and flags the three that need a human. The caution is the tax on that reach - pay it, and the powers are yours.

## How they work together

In practice you rarely choose one or the other. The strong setups pair them. A plugin gives the assistant a tool to query your sales database; a skill tells it how *your* team reads that data - which numbers matter, what "churn" means in your business, how to format the summary your CEO actually wants. The plugin supplies the hands. The skill supplies the judgment. Next we'll add both kinds to your own assistant.
