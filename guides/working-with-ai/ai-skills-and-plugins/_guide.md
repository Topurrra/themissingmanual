---
title: "Skills and Plugins"
guide: ai-skills-and-plugins
phase: 0
summary: "Two ways to extend an AI assistant: skills teach it reusable know-how, plugins give it new powers. What each is, how they differ, and how to add or write your own."
tags: [skills, plugins, ai-agents, extensibility, claude]
category: working-with-ai
group: "Agents & Tools"
order: 9
difficulty: intermediate
synonyms:
  - "what is an ai skill vs plugin"
  - "how to add a skill to claude"
  - "extend ai assistant with plugins"
  - "write your own ai skill"
  - "ai agent capabilities and tools"
  - "difference between skill and plugin"
updated: 2026-06-30
---

# Skills and Plugins

Out of the box, an AI assistant knows a lot but does little. It can talk about your company's brand guidelines, but it hasn't read them. It can describe how to file a Jira ticket, but it can't file one. The gap between "knows about" and "can actually do" is where skills and plugins live.

These are the two main ways to extend an assistant past its default behavior, and people mix them up constantly. A **skill** is reusable know-how - packaged instructions and reference material the assistant pulls in when the moment calls for it. A **plugin** is a bundle that adds new powers - commands, tools, and connections to outside systems the assistant couldn't reach on its own. One changes what the assistant *knows how to do well*; the other changes what it's *able to touch*. Most real setups use both.

This guide is for anyone customizing an AI assistant for real work - a founder shaping it around their business, an ops lead wiring it into their tools, a writer who wants it to nail their house style every time. You don't need to be an engineer. Phase 1 unpacks skills: what they are and why a few pages of packaged instructions beat re-explaining yourself every session. Phase 2 covers plugins and how they hand the assistant capabilities a plain skill never could. Phase 3 gets practical - installing one someone else built, and writing a small skill of your own from scratch. By the end you'll know which tool fits which job, and you'll have made one yourself.
