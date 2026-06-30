---
title: "Sentry, From Zero"
guide: sentry-error-tracking
phase: 0
summary: "Error tracking that turns a vague bug report into a stack trace: grouped issues, the breadcrumbs and context around a crash, releases, and source maps."
tags: [sentry, error-tracking, observability, monitoring, stack-trace, source-maps]
category: tooling
group: "Observability"
order: 31
difficulty: beginner
synonyms: ["sentry error tracking", "how does sentry work", "sentry issues vs events", "sentry source maps minified js", "sentry releases which deploy broke it", "sentry breadcrumbs context", "set up sentry sdk"]
updated: 2026-06-30
---

# Sentry, From Zero

A user writes "it crashed" and closes the ticket. No steps, no browser, no idea which line. You stare at a log file that scrolled past hours ago, hoping the right exception is still in there. Sentry is the tool that catches the crash the moment it happens, with the stack trace, the events leading up to it, and which deploy introduced it. This guide takes you from "I have no idea what broke" to "I'm looking at the exact line, for the exact user, on the exact release."

## How to read this

Read the phases in order. Phase 1 builds the mental model: what an error tracker actually does and why it beats grepping logs. Phase 2 is the everyday loop: capturing exceptions, reading an issue, adding the context that makes a crash diagnosable. Phase 3 is the hard-won stuff: source maps for minified JavaScript, releases, noise control, and the gotchas that quietly make Sentry useless if you skip them. Each phase ends with a short quiz so you can check yourself before moving on.

## The phases

1. [What Sentry actually is](01-what-sentry-actually-is.md) - the mental model: exceptions captured with full context, not lines in a log.
2. [Capturing and reading an issue](02-capturing-and-reading-an-issue.md) - install the SDK, group events into issues, add tags and context.
3. [Releases, source maps, and noise](03-releases-source-maps-and-noise.md) - production reality: which deploy broke it, un-minifying traces, taming alerts.

[Phase 1: What Sentry actually is](01-what-sentry-actually-is.md) →
