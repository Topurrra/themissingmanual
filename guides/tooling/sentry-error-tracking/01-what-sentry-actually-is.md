---
title: "What Sentry actually is"
guide: sentry-error-tracking
phase: 1
summary: "Error tracking that turns a vague bug report into a stack trace: grouped issues, the breadcrumbs and context around a crash, releases, and source maps."
tags: [sentry, error-tracking, observability, monitoring, stack-trace, source-maps]
difficulty: beginner
synonyms: ["sentry error tracking", "how does sentry work", "sentry issues vs events", "what is an error tracker", "sentry breadcrumbs context"]
updated: 2026-06-30
---

# What Sentry actually is

Here is the reality Sentry is built for. Something throws an exception in production. Maybe a user sees a white screen, maybe an API returns a 500, maybe a background job dies quietly and nobody notices for a week. The information you need to fix it - the type of error, the file and line, the values that caused it, what the user did right before - all exists for a fraction of a second and then it's gone. Your logs might have caught a sliver of it, if you happened to log the right thing, and if you can find it among ten thousand other lines.

Sentry's whole job is to grab that moment and keep it. When an exception is thrown, Sentry's SDK catches it, packages up everything around it, and sends it to a server you can search. You stop asking users "what were you doing?" because Sentry already knows.

## It captures exceptions, not log lines

The mental shift is this: a log is a string you decided to write in advance. An error tracker captures a structured event the moment something breaks, whether or not you anticipated it.

A typical log line for a crash looks like this:

```text
2026-06-30T14:22:01Z ERROR something went wrong: NoneType has no attribute 'email'
```

*What just happened:* you got one flat string. You know roughly what broke, but not where, not for whom, not with what input. To learn more you'd have had to predict this exact failure and log those details ahead of time.

A Sentry event for the same crash carries structure instead:

```text
AttributeError: 'NoneType' object has no attribute 'email'
  in send_welcome(user)  at  app/mail.py:42
  user.id = 90431   user is None  (lookup returned nothing)
  release = web@2026.06.30-a1b2c3
  url = POST /signup    environment = production
  10 breadcrumbs leading up to the crash
```

*What just happened:* the same failure now comes with the exact function and line, the variable that was `None`, the deploy it happened on, the request that triggered it, and a trail of what led there. You didn't write any of that by hand - the SDK collected it automatically when the exception bubbled up.

If reading a stack trace still feels like guesswork, the [reading-a-stack-trace](/guides/reading-a-stack-trace) guide is worth a detour - Sentry shows you traces all day, and they only help if you can read them.

## Events get grouped into issues

If one bad deploy crashes for ten thousand users, you do not want ten thousand notifications. You want one: "this is broken, it's affecting ten thousand people."

That is the difference between an **event** and an **issue**. An event is a single occurrence - one crash, one user, one moment. An **issue** is a group of events that Sentry decided are the same bug.

```text
Issue:  AttributeError: 'NoneType' object has no attribute 'email'
        app/mail.py in send_welcome
        ── 12,403 events ── 9,981 users ── first seen 2h ago

Events inside it:
  event a1  user 90431  14:22:01
  event a2  user 90432  14:22:01
  event a3  user 88110  14:22:02
  ...
```

*What just happened:* twelve thousand individual crashes collapsed into one issue you can read, assign, and resolve once. The event count tells you severity; the user count tells you blast radius.

How does Sentry decide two events are "the same"? It computes a **fingerprint** - by default, derived from the exception type and the top frames of the stack trace. Same error type thrown from the same place becomes the same issue. This is the most important idea in the tool: get fingerprinting right and your dashboard is a clean list of distinct bugs; get it wrong and one bug splinters into hundreds of issues, or hundreds of bugs collapse into one. Phase 3 covers how to steer it.

> Issues have a lifecycle, not a delete button. You **resolve** an issue when you've shipped a fix. If a matching event arrives after that, Sentry **regresses** it - reopens it and flags that your fix didn't hold. That regression signal is one of the most useful things Sentry does, and you only get it because issues persist instead of being cleared like logs.

## Where Sentry sits in the bigger picture

Sentry is not a replacement for logs, metrics, or traces - it's the specialist for one question: *what exceptions are happening, and exactly why?* Metrics tell you error rates are up; Sentry tells you which error and which line. They're complementary, and the [observability-logs-metrics-traces](/guides/observability-logs-metrics-traces) guide maps how the three pillars fit together.

```text
Metrics   "error rate jumped from 0.1% to 4%"     ── what & how much
Logs      "here's the timeline of requests"        ── narrative
Sentry    "AttributeError at mail.py:42, 12k hits" ── the exact failure
```

*What just happened:* each tool answers a different question. You reach for Sentry the moment "something is throwing" becomes the thing you need to chase down.

**For builders:** Sentry is open source and can be self-hosted, but most teams use the hosted service because running the storage and processing pipeline yourself is real work. Either way the SDK and concepts are identical - what you learn here transfers.

```quiz
[
  {
    "q": "What is the difference between an event and an issue in Sentry?",
    "choices": [
      "An event is a warning; an issue is a crash",
      "An event is one occurrence; an issue is a group of similar events",
      "They are two names for the same thing",
      "An issue is older than an event"
    ],
    "answer": 1,
    "explain": "An event is a single crash occurrence. Sentry groups similar events (by fingerprint) into one issue so you see distinct bugs, not duplicates."
  },
  {
    "q": "What does Sentry use to decide that two events belong to the same issue?",
    "choices": [
      "The user's IP address",
      "The exact timestamp",
      "A fingerprint, by default from the error type and top stack frames",
      "The size of the request body"
    ],
    "answer": 2,
    "explain": "By default the fingerprint comes from the exception type and the top frames of the stack trace, so the same error from the same place groups together."
  },
  {
    "q": "What happens when a new matching event arrives for an issue you already resolved?",
    "choices": [
      "Sentry ignores it permanently",
      "Sentry deletes the issue",
      "Sentry regresses the issue, reopening it",
      "Sentry creates a brand-new unrelated issue"
    ],
    "answer": 2,
    "explain": "A resolved issue that sees a new matching event is regressed (reopened), signaling that the fix did not fully hold."
  }
]
```

[← Overview](_guide.md) · [Phase 2: Capturing and reading an issue →](02-capturing-and-reading-an-issue.md)
