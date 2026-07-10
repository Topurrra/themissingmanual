---
title: "ML Basics for Data People"
guide: "ml-basics-for-data-people"
phase: 0
summary: "What machine learning actually is from a data perspective — learning patterns from history instead of hand-writing rules, the workflow from features to evaluation, and why ML lives or dies on your data."
tags: [machine-learning, ml, data, supervised-learning, features, model-evaluation]
category: data-analytics
order: 6
difficulty: intermediate
synonyms: ["machine learning for data analysts", "what is machine learning for data people", "ml basics for analysts", "supervised vs unsupervised learning", "how does machine learning work", "ml workflow explained"]
updated: 2026-07-10
---

# ML Basics for Data People

You already work with data. You write SQL, build dashboards, and can smell a bad join from across the room. Now machine learning keeps coming up — in standups, in job posts, in "can't we just throw a model at it?" meetings — and it feels like a different world with its own priesthood and vocabulary.

Here's the reassuring truth: ML is not a different world. It's a different *technique* applied to the same raw material you already handle every day — data. The hard part of ML is almost never the math or the model; it's the data work you already understand. This guide gives you enough of a mental model to follow the conversation, ask the right questions, and recognize where your existing skills are exactly what a project needs.

## How to read this

- **Want the one-paragraph version?** ML learns patterns from historical data to make predictions on new data, instead of you hand-writing the rules. Everything else is detail. Read [Phase 1](01-what-ml-actually-is.md) and you'll have the core idea.
- **Want it to finally make sense?** Read in order. Each phase builds on the last: what ML *is*, how a project actually flows, and where you — the data person — fit and why you matter more than you think.

## The phases

1. **[What ML Actually Is (for Data People)](01-what-ml-actually-is.md)** — learning patterns from examples instead of writing rules by hand; the difference between supervised and unsupervised, grounded in a churn example.
2. **[The Workflow](02-the-workflow.md)** — features, splitting into train and test (and *why*), training, and evaluating — including why "99% accurate" can still be a useless model.
3. **[Where Data People Fit](03-where-data-people-fit.md)** — the unglamorous truth: clean inputs, good features, leak-free splits, reliable pipelines. The model is the easy part.

> This guide stops at the *basics* on purpose. Deep learning, neural networks, and large language models (the "AI" everyone's talking about) are their own territory — we'll point you toward a future **ai-ml** category for that, rather than cram it in here. The foundations below are what make that material make sense later.

> Related reading: [What Is Data Engineering](/guides/what-is-data-engineering) and [Data Quality and Observability](/guides/data-quality-and-observability) — the disciplines that feed ML its lifeblood.
