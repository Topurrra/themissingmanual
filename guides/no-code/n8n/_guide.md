---
title: "n8n"
guide: n8n
phase: 0
summary: "The open-source, self-hostable automation tool that lets you drop to code when you need to - nodes and workflows, credentials, and real automations including AI steps."
tags: [n8n, automation, workflow, self-hosted, open-source]
category: no-code
group: "Automation"
order: 5
difficulty: intermediate
synonyms:
  - what is n8n
  - n8n vs zapier
  - self-hosted automation tool
  - n8n workflow examples
  - open source zapier alternative
  - how to use n8n
updated: 2026-06-30
---

# n8n

n8n (say it "n-eight-n", short for "nodemation") is a tool for wiring apps together so work happens without you. A new row lands in a spreadsheet, n8n sees it, looks up the customer, posts to Slack, and files a ticket - all on its own. If you've heard of Zapier or Make, it lives in the same neighborhood. The difference that matters: n8n is open-source, you can run it on your own server, and when the clicking-and-dragging runs out of road, you can drop into a code box and write a few lines yourself. That last escape hatch is why a lot of teams pick it.

This guide is for founders, ops people, and analysts who want to automate the boring connective tissue of a business and don't want to be locked into a per-task bill or a black box. You do not need to be an engineer. You will see what a "node" is, how a "workflow" strings them together, where your passwords and API keys live, and how a real automation looks end to end. We'll be honest about the parts that bite - n8n gives you more rope than a click-only tool, and rope cuts both ways.

The arc: **Phase 1** builds your mental model - nodes, connections, the editor, and what an "execution" is, plus why open-source and self-hosting are the whole pitch. **Phase 2** covers the grown-up concerns: hosting it yourself versus paying for n8n Cloud, where credentials and secrets live, how expressions pull data from one step into the next, and the Code node for when no-code hits a wall. **Phase 3** builds a concrete multi-step automation, shows how a webhook lets the outside world trigger your flow, and adds an AI node so a step can read, summarize, or decide instead of merely shuffling data.
