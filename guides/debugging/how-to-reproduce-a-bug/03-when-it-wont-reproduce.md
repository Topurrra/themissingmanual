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

You've done everything in Phase 2 - matched the steps, the environment, the data, the state - and the bug *still* only shows up one time in ten. Worse, the moment you attach a debugger or add a print statement to catch it in the act, it stops happening entirely. This is the bug that makes people start using words like "haunted."

It isn't haunted. An intermittent bug is just a bug with a **hidden input you haven't pinned yet** - some condition that's varying behind your back, invisible in the four variables you can see. A program is still deterministic; you don't yet control all of its inputs. This phase is about finding and clamping that last hidden input.

📝 **Terminology.** A *heisenbug* is a bug that changes or vanishes when you try to observe it - named after the physics idea that observing something can disturb it. The usual reason: your observation tool (a debugger pause, a log line, extra code) changes the *timing*, and the bug depended on timing. The name is a clue to the cause.

## Cheat-card: symptom → likely culprit → tactic

You're probably here mid-hunt, so the map comes first; the explanations are underneath.

| Symptom | Likely culprit | First tactic to try |
|---|---|---|
| Vanishes under a debugger / when you add logging | **Timing / race condition** | Force the timing (add a deliberate delay), or log to a buffer, not the console |
| Fails the *first* time, works after; or only on a cold start | **Uninitialized state** | Reproduce from a truly fresh start every run; stop reusing setup |
| Fails at random intervals unrelated to your actions | **External dependency** (network, API, disk) | Pin or fake the dependency; make it fail on demand |
| Works for you, then breaks "for no reason" later | **Caching / stale state** | Clear every cache; reproduce with caching turned off |
| Different result on different runs of the *same* input | **Randomness or the clock** | Pin the random seed; freeze the clock |

## Culprit 1: timing and race conditions

**What it actually is.** A *race condition* is when two things happen at once - two requests, two threads, an event and its handler - and the bug appears only when they finish in a particular order. Most of the time they happen to finish in the "right" order and everything's fine. Once in a while the order flips, and it breaks. The "hidden input" is *which one won the race*, and that's decided by microscopic timing you don't control.

**Why observing it makes it vanish.** This is the classic heisenbug. Your debugger pause or log line slows one side of the race down - and slowing it down changes who wins, so the bug stops appearing. You haven't fixed it; you've nudged the timing to the lucky side.

**The tactic: force the timing instead of fighting it.** If the bug needs B to land before A, *make* B land first - insert a deliberate delay on A so the rare order becomes the guaranteed order:

```console
$ npm test -- races.test.js
  user signup
    ✓ creates the account (41 ms)
    ✗ sends welcome email after account exists (12 ms)

  Expected: account to exist when email step runs
  Received: account not found
```
*What just happened:* by adding a small forced delay to the account-creation step in the test setup, you made the email step reliably run *before* the account finished saving - turning a one-in-ten flake into a failure on every run. Now it's reproducible, and you can see exactly what the email step assumed was ready but wasn't.

⚠️ **Gotcha.** Don't reach for the debugger first on a suspected race - it's the one tool that hides this class of bug. Prefer logging that doesn't change timing much (write to an in-memory buffer and dump it *after*, rather than printing to the console mid-race), or lean on forcing the order as above.

## Culprit 2: uninitialized or leftover state

**What it actually is.** Some value the code assumed was set up wasn't - a variable that's only initialized on the second pass, a config that loads a beat late, a field that's empty until something else fills it. The bug shows up on the *first* run and hides afterward because by the second run the state exists.

**Why it's intermittent.** It depends entirely on what ran *before*. Run the steps cold and it breaks; run them again in the same session and the earlier run already set things up, so it passes. The hidden input is "how fresh is the starting state."

**The tactic: always start cold.** Reproduce from a genuinely clean slate every single time - fresh process, fresh session, cleared storage, freshly seeded database. If a bug only reproduces on the *first* run, that *is* the diagnosis: something is being set up by a run that shouldn't be required to set it up.

## Culprit 3: external dependencies

**What it actually is.** Your code talks to something outside itself - a network call, a third-party API, the filesystem, another service. Those things have their own moods: they're slow sometimes, they time out, they return an error or an unexpected shape once in a while. When *they* misbehave, *your* bug appears, and since their misbehavior is intermittent, so is yours.

**Why it's hard to reproduce.** You don't control the dependency, so you can't make it fail when you want to watch. It cooperates all morning, then fails at 2pm for thirty seconds - exactly when you're not looking.

**The tactic: take control of the dependency.** Replace the real thing with a stand-in you command - a fake or stub that returns whatever you need: an error, a timeout, an empty response, garbage. Now the rare failure becomes a switch you flip:

```console
$ FAKE_PAYMENTS=timeout npm run dev
[payments] using FAKE client (mode: timeout)
[checkout] calling payments...
[checkout] ERROR: payment request timed out after 30s
[checkout] uncaught: cannot read property 'id' of undefined
```
*What just happened:* you swapped the real payment service for a fake set to always time out, then ran a checkout. The timeout that used to happen randomly now happens on command - and it surfaced the real bug underneath: the code assumed a response object came back and crashed reading `.id` from `undefined` when one didn't. The flaky external failure is now a reliable internal reproduction.

## Culprit 4: caching and stale state

**What it actually is.** A cache stores a previous result to avoid recomputing it. The bug appears when the cached value is *stale* - out of date with reality - so the code acts on old information. It "works," then mysteriously breaks later (the cache went stale), or breaks then mysteriously heals (the cache expired and refreshed).

**Why it's confusing.** The trigger isn't your latest action - it's the *gap* between when something was cached and when it was read. That delay is invisible in your steps, which is why it feels random.

**The tactic: remove caching from the picture.** Reproduce with every cache cleared or disabled - the app's cache, the browser cache, any CDN or proxy in front, build caches. If the bug disappears when caching is off, you've found it: something is serving stale data, and you now know where to look.

## Culprit 5: randomness and the clock

**What it actually is.** Code that uses random numbers, or reads the current date/time, has a different input on every run *by design*. A bug that only triggers on certain values - a specific random draw, the last day of a month, a leap year, midnight - will look random because the input genuinely is.

**The tactic: make the "random" input fixed.** Pin the random number generator to a fixed *seed* so it produces the same sequence every run, and freeze the clock to a specific time. Once both are fixed, a "random" bug becomes a repeatable one:

```console
$ SEED=42 FAKE_NOW="2024-02-29T23:59:59Z" npm test -- billing.test.js
  monthly billing
    ✗ rolls over to next month at midnight (8 ms)

  Expected next bill date: 2024-03-01
  Received:                 2024-03-29
```
*What just happened:* you froze "now" to the last second of a leap day and pinned the random seed, so the test runs identically every time. With the date locked, the month-rollover bug - which only bit on certain dates and was therefore "intermittent" - fails on every run. A frozen clock turned a calendar-dependent ghost into a plain, repeatable failure.

## Putting it together

The thread through all five culprits is the same: an intermittent bug has an input you aren't yet controlling, and the fix is to find that input and clamp it. Timing, freshness of state, an outside service, a cache, a random draw or a clock - each is something varying behind your back. Pin it, and the bug stops being intermittent and becomes an ordinary, triggerable bug - at which point you're back to the solid ground of Phase 1: trigger it, fix it, confirm it's gone.

💡 **Key point.** An irreproducible bug isn't magic and it isn't haunted. It has a hidden input you haven't pinned down yet. Your whole job with a heisenbug is to *find that input and take control of it* - then it's just a bug.

## Recap

1. **Intermittent = a hidden input you don't yet control.** The program is still deterministic; something is varying out of sight.
2. **A heisenbug vanishes when observed** because your observation (a debugger pause, a log line) changes the *timing* it depended on.
3. **The five usual culprits:** timing/races, uninitialized state, external dependencies, caching, and randomness/the clock - see the cheat-card up top.
4. **The core tactics:** force the timing, always start cold, fake the dependency so it fails on command, disable caching, and pin the seed and freeze the clock.
5. **Once the hidden input is pinned,** the bug becomes reliably triggerable - and you're back to trigger → fix → verify.

---

[← Phase 2: Nailing It Down](02-nailing-it-down.md) · [Guide overview](_guide.md)

Once you can trigger it on demand, the next skills pick up where this leaves off: [Reading a Stack Trace](/guides/reading-a-stack-trace) to decode the crash, [Using a Debugger](/guides/using-a-debugger) to watch it run, and [Bisecting a Bug](/guides/bisecting-a-bug) to find the commit that introduced it.
