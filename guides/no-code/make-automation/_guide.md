---
title: "Make"
guide: make-automation
phase: 0
summary: "The visual, operations-priced automation tool (formerly Integromat): build scenarios from modules, map and transform arrays, and handle errors deliberately."
tags: [make, integromat, automation, scenarios, no-code]
category: no-code
group: "Automation"
order: 4
difficulty: intermediate
synonyms:
  - "how does make.com work"
  - "make vs zapier"
  - "integromat scenarios tutorial"
  - "make iterator array aggregator"
  - "make operations pricing explained"
  - "make error handling rollback"
updated: 2026-06-30
---

# Make

Make is a tool for wiring apps together so work happens without you. You draw a flow on a canvas - "when a form is submitted, create a row in a sheet, then send a Slack message" - and Make runs it. It used to be called Integromat, and you'll still see that name in old tutorials and forum posts; it's the same product, renamed in 2022.

What sets Make apart from the other big name in this space, Zapier, is that it shows you the wires. Most automation tools hide the plumbing behind a friendly checklist. Make hands you a visual map of circles connected by lines, and lets you see the actual data flowing between each step. That's more to look at up front, and it's the reason people who outgrow simpler tools come here: you get loops, branching, data reshaping, and real error handling that the checklist-style tools either can't do or bury.

This guide is for founders, ops people, and analysts who have a real workflow to automate and have hit a wall - either with a simpler tool, or with the manual copy-paste version of the job. You don't need to write code. You do need to be willing to think about your data as it moves: where it comes from, what shape it's in, and what should happen when a step fails. Phase 1 covers the canvas and how a scenario actually runs - the mental model everything else rests on. Phase 2 is the part that trips everyone up: mapping fields between steps, transforming text and dates, and handling lists of things with iterators, aggregators, and routers. Phase 3 covers the unglamorous but money-relevant parts - error handlers, scheduling, and Make's pricing model, which is counted in "operations" and surprises almost everyone the first time they read the bill.
