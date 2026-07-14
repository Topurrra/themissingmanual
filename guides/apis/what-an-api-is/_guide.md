---
title: "What an API Actually Is"
guide: "what-an-api-is"
phase: 0
summary: "An API is a defined way for one program to ask another for something - a contract that says what you can ask and what you'll get back - and this guide builds that mental model from the ground up before you touch any code."
tags: [apis, mental-model, beginner-friendly, integration, web-apis]
category: apis
order: 1
difficulty: beginner
synonyms: ["what is an api", "what does api mean", "api explained for beginners", "what is an api in simple terms", "why do apis exist", "api meaning"]
updated: 2026-07-10
---

# What an API Actually Is

You've seen "API" everywhere - "we have an API," "call the payments API," "the API is down." Maybe you've nodded along while quietly wondering what the word actually *means*, and whether everyone else is in on something you missed. You're not missing anything. "API" is one of those terms people use constantly and define rarely.

Here's the good news: the idea underneath it is genuinely simple, and once it clicks, a huge amount of how modern software fits together suddenly makes sense. This guide builds that idea slowly and properly - no jargon dropped on you undefined, no hand-waving. By the end you'll read "we'll integrate with their API" and know exactly what that sentence promises.

## How to read this

- **Want it to finally make sense?** Read in order. Each phase builds on the last - we install the core idea first, then *why* it exists, then the different shapes it comes in.
- **Already know the basics and want the lay of the land?** Skip to [Phase 3: Kinds of APIs](03-kinds-of-apis.md) for the map of library APIs vs web APIs and where REST/GraphQL/gRPC fit.

## The phases

1. **[A Contract Between Programs](01-a-contract-between-programs.md)** - what an API *actually is*: a defined way to ask another program for something, with the internals hidden. The restaurant-menu mental model.
2. **[Why APIs Exist](02-why-apis-exist.md)** - the real reasons they're everywhere: reuse, separation, and integration - and why a stable boundary is so valuable.
3. **[Kinds of APIs](03-kinds-of-apis.md)** - local/library APIs vs web APIs over the network, a preview of the common web styles (REST, GraphQL, gRPC), and where to go next.

> This guide deliberately stops at the mental model. It does *not* teach you to make HTTP requests, read JSON, or design a REST endpoint - those get their own guides, linked at the end, so this one stays a clean, calm foundation.
