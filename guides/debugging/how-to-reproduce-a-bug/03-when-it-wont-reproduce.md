---
title: "When It Won't Reproduce (Heisenbugs)"
guide: "how-to-reproduce-a-bug"
phase: 3
summary: "Intermittent bugs have a hidden input you haven't pinned: timing/races, uninitialized state, an external dependency, or caching. The tactics that make them reliable: log around it, force the timing, control randomness and the clock, and pin the dependency."
tags: [debugging, heisenbug, race-condition, intermittent-bug, flaky, logging, caching]
difficulty: intermediate
synonyms: ["bug won't reproduce", "intermittent bug", "what is a heisenbug", "flaky bug", "race condition reproduce", "bug only happens sometimes", "how to reproduce a race condition", "control randomness in tests"]
updated: 2026-06-19
---

# When It Won't Reproduce (Heisenbugs)

You've matched the steps, environment, data, and state from Phase 2, and the bug *still* shows up only one time in ten. Worse, the moment you attach a debugger or add a print statement, it stops happening. This is the bug that makes people say "haunted."

It isn't. An intermittent bug just has a **hidden input you haven't pinned yet** - a condition varying behind your back, invisible in the four variables you can see. The program is still deterministic; you just don't control all its inputs yet. This phase finds and clamps that last one.

📝 **Terminology.** A *heisenbug* is a bug that changes or vanishes when observed - named for the physics idea that observation disturbs what it measures. Usual reason: your observation tool (a debugger pause, a log line, extra code) changes the *timing* the bug depended on. The name is a clue to the cause.

## Cheat-card: symptom → likely culprit → tactic

You're probably here mid-hunt, so the map comes first, explanations underneath.

| Symptom | Likely culprit | First tactic to try |
|---|---|---|
| Vanishes under a debugger / when you add logging | **Timing / race condition** | Force the timing (add a deliberate delay), or log to a buffer, not the console |
| Fails the *first* time, works after; or only on a cold start | **Uninitialized state** | Reproduce from a truly fresh start every run; stop reusing setup |
| Fails at random intervals unrelated to your actions | **External dependency** (network, API, disk) | Pin or fake the dependency; make it fail on demand |
| Works for you, then breaks "for no reason" later | **Caching / stale state** | Clear every cache; reproduce with caching turned off |
| Different result on different runs of the *same* input | **Randomness or the clock** | Pin the random seed; freeze the clock |

## Culprit 1: timing and race conditions

**What it is.** A *race condition*: two things happen at once - two requests, two threads, an event and its handler - and the bug appears only when they finish in a particular order. Usually the "right" order wins; once in a while it flips, and it breaks. Hidden input: *which one won the race*, decided by microscopic timing you don't control.

**Why observing it makes it vanish.** Classic heisenbug: a debugger pause or log line slows one side, changing who wins, so the bug stops appearing. You haven't fixed it - you've nudged the timing to the lucky side.

**The tactic: force the timing instead of fighting it.** If the bug needs B before A, *make* B land first - a deliberate delay on A turns the rare order into the guaranteed one:

```console
$ npm test -- races.test.js
  user signup
    ✓ creates the account (41 ms)
    ✗ sends welcome email after account exists (12 ms)

  Expected: account to exist when email step runs
  Received: account not found
```
*What just happened:* a small forced delay on account creation made the email step run *before* the account finished saving, turning a one-in-ten flake into a failure every run - reproducible, and showing exactly what the email step wrongly assumed was ready.

⚠️ **Gotcha.** Don't reach for the debugger first on a suspected race - it's the one tool that hides this class of bug. Prefer logging that barely changes timing (buffer in memory, dump it *after*, rather than printing mid-race), or force the order as above.

## Culprit 2: uninitialized or leftover state

**What it is.** Some value the code assumed was set up wasn't - a variable only initialized on the second pass, a config loading a beat late, a field empty until something fills it. Shows on the *first* run, hides after, since by the second run the state exists.

**Why it's intermittent.** Depends entirely on what ran *before*. Run cold and it breaks; run again in the same session and the earlier run already set things up, so it passes. Hidden input: how fresh is the starting state.

**The tactic: always start cold.** Reproduce from a genuinely clean slate every time - fresh process, fresh session, cleared storage, freshly seeded database. If a bug only reproduces on the *first* run, that *is* the diagnosis: something's being set up by a run that shouldn't have to.

## Culprit 3: external dependencies

**What it is.** Your code talks to something outside itself - a network call, a third-party API, the filesystem, another service. Those things have moods: slow sometimes, timing out, returning an error or odd shape now and then. When *they* misbehave, *your* bug appears, and since that's intermittent, so is yours.

**Why it's hard to reproduce.** You don't control it, so you can't make it fail on command - it cooperates all morning, then fails at 2pm for thirty seconds, exactly when you're not looking.

**The tactic: take control of the dependency.** Replace the real thing with a fake or stub returning whatever you need - an error, a timeout, an empty response, garbage. Now the rare failure is a switch you flip:

```console
$ FAKE_PAYMENTS=timeout npm run dev
[payments] using FAKE client (mode: timeout)
[checkout] calling payments...
[checkout] ERROR: payment request timed out after 30s
[checkout] uncaught: cannot read property 'id' of undefined
```
*What just happened:* swapping the payment service for a fake set to always time out turned a random timeout into an on-command one, surfacing the real bug: the code assumed a response came back and crashed reading `.id` from `undefined` when one didn't. Flaky external failure, now a reliable reproduction.

## Culprit 4: caching and stale state

**What it is.** A cache stores a previous result to avoid recomputing it. The bug appears when the cached value is *stale* - out of date with reality - so the code acts on old information: "works," then mysteriously breaks (cache went stale), or breaks then heals (cache expired and refreshed).

**Why it's confusing.** The trigger isn't your latest action - it's the *gap* between when something was cached and when it was read, invisible in your steps and so feels random.

**The tactic: remove caching from the picture.** Reproduce with every cache cleared or disabled - app, browser, CDN or proxy, build caches. If the bug disappears with caching off, you've found it: something's serving stale data.

## Culprit 5: randomness and the clock

**What it is.** Code using random numbers, or reading the current date/time, has a different input every run *by design*. A bug triggering only on certain values - a specific random draw, the last day of a month, a leap year, midnight - looks random because the input genuinely is.

**The tactic: make the "random" input fixed.** Pin the random generator to a fixed *seed* for the same sequence every run, and freeze the clock. Once both are fixed, a "random" bug becomes repeatable:

```console
$ SEED=42 FAKE_NOW="2024-02-29T23:59:59Z" npm test -- billing.test.js
  monthly billing
    ✗ rolls over to next month at midnight (8 ms)

  Expected next bill date: 2024-03-01
  Received:                 2024-03-29
```
*What just happened:* freezing "now" to the last second of a leap day and pinning the random seed makes the test run identically every time. With the date locked, the month-rollover bug - which only bit on certain dates and was therefore "intermittent" - fails every run. A frozen clock turned a calendar ghost into a plain, repeatable failure.

## Putting it together

The thread through all five: an intermittent bug has an input you aren't yet controlling, and the fix is finding it and clamping it. Timing, freshness of state, an outside service, a cache, a random draw or a clock - each varies behind your back. Pin it, and the bug becomes an ordinary, triggerable one - back to Phase 1: trigger it, fix it, confirm it's gone.

💡 **Key point.** An irreproducible bug isn't magic or haunted. It has a hidden input you haven't pinned down yet. Your job with a heisenbug is to *find that input and take control of it* - then it's just a bug.

## Recap

1. **Intermittent = a hidden input you don't yet control.** The program is still deterministic; something varies out of sight.
2. **A heisenbug vanishes when observed** because your observation (a debugger pause, a log line) changes the *timing* it depended on.
3. **The five usual culprits:** timing/races, uninitialized state, external dependencies, caching, and randomness/the clock - see the cheat-card up top.
4. **The core tactics:** force the timing, always start cold, fake the dependency so it fails on command, disable caching, pin the seed and freeze the clock.
5. **Once the hidden input is pinned,** the bug becomes reliably triggerable - back to trigger → fix → verify.

---

[← Phase 2: Nailing It Down](02-nailing-it-down.md) · [Guide overview](_guide.md)

Once you can trigger it on demand, the next skills pick up where this leaves off: [Reading a Stack Trace](/guides/reading-a-stack-trace) to decode the crash, [Using a Debugger](/guides/using-a-debugger) to watch it run, and [Bisecting a Bug](/guides/bisecting-a-bug) to find the commit that introduced it.
