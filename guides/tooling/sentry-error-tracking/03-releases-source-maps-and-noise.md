---
title: "Releases, source maps, and noise"
guide: sentry-error-tracking
phase: 3
summary: "Error tracking that turns a vague bug report into a stack trace: grouped issues, the breadcrumbs and context around a crash, releases, and source maps."
tags: [sentry, error-tracking, observability, monitoring, stack-trace, source-maps]
difficulty: beginner
synonyms: ["sentry source maps minified js", "sentry releases which deploy broke it", "sentry regression", "sentry alert rules noise", "sentry fingerprint grouping", "sentry data scrubbing pii"]
updated: 2026-06-30
---

# Releases, source maps, and noise

The SDK is reporting and your issues are readable. This phase is the difference between a Sentry that's a daily tool and one your team mutes after a week. Three things decide that fate: knowing which deploy broke things, getting readable stack traces out of minified JavaScript, and keeping the signal-to-noise ratio high enough that an alert still means something.

## Releases: which deploy introduced this

A **release** is a version identifier you attach to every event - you saw it in the `init` call as `release="web@2026.06.30-a1b2c3"`. On its own it's a tag. Its power comes from telling Sentry *when each release was deployed*, so it can line up issues against your deploy history.

```bash
# create the release and mark it deployed (run in CI after a deploy)
sentry-cli releases new "web@2026.06.30-a1b2c3"
sentry-cli releases set-commits "web@2026.06.30-a1b2c3" --auto
sentry-cli releases finalize "web@2026.06.30-a1b2c3"
sentry-cli releases deploys "web@2026.06.30-a1b2c3" new -e production
```

*What just happened:* you registered the release, attached the commits in it, finalized it, and recorded the deploy. Sentry can now show an issue's "first seen" against your deploy timeline and frequently name the **suspect commit** - the change most likely to have introduced the bug.

The payoff on an issue page:

```text
Issue: TypeError: cannot read properties of undefined (reading 'name')
  First seen:  in release web@2026.06.30-a1b2c3   (deployed 2h ago)
  Regression:  was resolved in web@2026.06.29-f0e1d2
  Suspect commit:  a1b2c3  "refactor user profile loader"  - by dev@team
```

*What just happened:* instead of "something is broken," you have "this started with this deploy, here's the likely commit, here's who wrote it." That's the line between an hour of bisecting and a one-minute fix. The release field you set in phase 2 is what makes all of this possible - skip it and you lose the single most useful diagnostic Sentry offers.

## Source maps: un-minifying JavaScript traces

Front-end code ships minified. Without help, a production JavaScript error in Sentry looks like this:

```text
TypeError: undefined is not a function
  at app.min.js:1:48210
  at app.min.js:1:51992
```

*What just happened:* the stack trace points into a single minified line. It's true and completely useless - you can't map column 48210 to anything in your source.

A **source map** is the translation table from minified code back to your original files and line numbers. Upload your source maps to Sentry alongside the matching release, and it rewrites the trace:

```bash
sentry-cli sourcemaps upload \
  --release "web@2026.06.30-a1b2c3" \
  ./dist
```

*What just happened:* you uploaded the build's source maps tied to that exact release. Now the same error renders against your real code:

```text
TypeError: undefined is not a function
  at renderProfile   (src/profile/view.js:88:12)
  at handleClick     (src/profile/view.js:54:5)
```

*What just happened:* the trace is back in your source coordinates - real function names, real files, real lines. The catch that bites everyone: source maps are matched to events **by release**. If the `release` in your SDK init doesn't exactly match the release you uploaded maps for, Sentry can't connect them and your traces stay minified. Same string, both places.

> Upload source maps but do not deploy them publicly. Source maps reveal your original source. Upload them to Sentry in CI, then keep them out of your public web root so strangers can't reconstruct your code. Sentry only needs its own copy.

## Steering grouping when the fingerprint is wrong

Default fingerprinting is good, not perfect. Two failure modes:

- **One bug, many issues.** An error message contains a changing value - `User 90431 not found`, `User 88110 not found` - and each variant becomes its own issue.
- **Many bugs, one issue.** A generic wrapper like `RequestError` swallows distinct underlying failures into a single group.

You fix the first by giving Sentry a stable fingerprint so the varying part is ignored:

```python
sentry_sdk.init(dsn="...", before_send=collapse_user_not_found)

def collapse_user_not_found(event, hint):
    exc = event.get("exception")
    if exc and "not found" in str(event.get("message", "")):
        event["fingerprint"] = ["user-not-found"]   # one issue, not thousands
    return event
```

*What just happened:* every "user not found" variant now shares the fingerprint `["user-not-found"]`, collapsing into a single issue. `before_send` runs on every event before it leaves your process - it's also where you split an over-grouped issue, by adding a distinguishing value to the fingerprint instead.

## Keeping the noise down

An error tracker everyone has muted catches nothing. Two levers keep alerts meaningful.

First, drop events you don't care about - bot noise, browser-extension errors, expected exceptions - in the same `before_send`:

```python
def before_send(event, hint):
    exc = hint.get("exc_info")
    if exc and isinstance(exc[1], BrokenPipeError):
        return None          # returning None discards the event entirely
    return event
```

*What just happened:* returning `None` from `before_send` drops the event so it's never sent or stored. `BrokenPipeError` from a client hanging up isn't your bug - filtering it keeps the dashboard accurate.

Second, alert on **state changes**, not on every event. The useful triggers are "a *new* issue appeared" and "a resolved issue *regressed*" - not "an event happened," which fires constantly for known issues.

```text
GOOD alert rule:   notify when a NEW issue is created in production
GOOD alert rule:   notify when a RESOLVED issue regresses
NOISY alert rule:   notify on every event  ← everyone mutes this by day two
```

*What just happened:* the good rules fire only when something genuinely changed - a fresh bug or a fix that broke again - so the notification still means "look now." That's the entire game: an alert people trust enough to act on.

## One last gotcha: scrub the sensitive data

Sentry captures request bodies, headers, and local variables - which means passwords, tokens, and personal data can ride along into an event. Many SDKs scrub common fields by default, but treat that as a starting point, not a guarantee.

```python
def scrub(event, hint):
    req = event.get("request", {})
    if "Authorization" in req.get("headers", {}):
        req["headers"]["Authorization"] = "[Filtered]"
    return event
```

*What just happened:* the auth header is redacted before the event leaves your server. Decide what must never reach Sentry and strip it in `before_send` - it's far easier than explaining later why secrets ended up in your error tracker.

**In the wild:** the teams that get the most out of Sentry treat releases as non-negotiable in CI - every deploy creates a release, uploads source maps, and finalizes it automatically. Once that pipeline exists, "which deploy broke it and what was the exact line" stops being a question you have to investigate.

```quiz
[
  {
    "q": "Why might a production JavaScript error show a stack trace pointing into app.min.js with no real file names?",
    "choices": [
      "Sentry is down",
      "The matching source maps were not uploaded for that release",
      "The DSN is wrong",
      "Breadcrumbs are disabled"
    ],
    "answer": 1,
    "explain": "Source maps translate minified traces back to source. Without maps uploaded and matched by release, the trace stays in minified coordinates."
  },
  {
    "q": "What links uploaded source maps to the right events?",
    "choices": [
      "The user's email",
      "The file size",
      "The release identifier, which must match exactly",
      "The time of day"
    ],
    "answer": 2,
    "explain": "Source maps are matched to events by release. If the SDK's release string doesn't exactly match the uploaded maps' release, traces stay minified."
  },
  {
    "q": "What does returning None from a before_send hook do?",
    "choices": [
      "Resolves the issue",
      "Discards the event so it is never sent",
      "Marks the event as a regression",
      "Doubles the event's severity"
    ],
    "answer": 1,
    "explain": "Returning None from before_send drops the event entirely - useful for filtering out noise like expected exceptions before they're stored."
  }
]
```

[← Phase 2](02-capturing-and-reading-an-issue.md) · [Overview](_guide.md)
