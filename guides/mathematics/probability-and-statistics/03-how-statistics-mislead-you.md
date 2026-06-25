---
title: "How Statistics Mislead You"
guide: "probability-and-statistics"
phase: 3
summary: "The same statistics that explain the world are used to distort it: correlation sold as causation, biased samples, ignored base rates, cherry-picked results, and charts engineered to deceive. Here's how to catch each one."
tags: [mathematics, statistics, correlation-causation, bias, data-literacy]
difficulty: beginner
synonyms: ["how statistics lie", "correlation vs causation", "sampling bias", "base rate fallacy", "misleading graphs", "how to spot bad statistics"]
updated: 2026-06-25
---

# How Statistics Mislead You

In Phase 2 you learned to read data honestly: averages, spread, distributions. This phase is
the other half. The same tools — averages, percentages, correlations, charts — are the favorite
weapons of anyone who wants to sell you something, win an argument, or move a dashboard number.

Here's the uncomfortable part: most misleading statistics aren't lies. The numbers are real.
The arithmetic checks out. What's broken is the *story wrapped around the numbers* — what got
left out, who got counted, which slice got shown. That's why this fools smart people. You can't
catch it by checking the math. You catch it by knowing the moves.

So this phase is a field guide. Each section is one trick: what it looks like, why it works on
you, and the question that defuses it. Once you've seen them, you don't un-see them.

## Correlation is not causation

Two things move together. Ice cream sales rise; so do drownings. Plot them month by month and
the lines track beautifully. A tempting conclusion writes itself: ice cream causes drowning.

It doesn't, and you know why — summer. Hot weather drives *both* ice cream sales and swimming
(and therefore drownings). The two numbers are linked, but neither causes the other. They share
a hidden third cause. Statisticians call it a **lurking variable** or **confounder**, and it's
behind a huge share of "shocking finding" headlines.

Three things can be true when two numbers correlate:

- A causes B (smoking → cancer).
- B causes A (you assumed the arrow points the wrong way).
- C causes both A and B (the ice cream / summer trap above).

And a fourth, sneakier possibility: nothing causes anything. With enough data series in the
world, some line up by pure chance. The number of films a certain actor appears in per year
might track national cheese consumption for a decade — perfectly, and meaninglessly. That's a
**spurious correlation**, and the lesson is brutal: a tight line on a chart proves two numbers
*moved together*, and nothing about *why*.

*What just happened:* you learned the single most abused word in statistics. "Linked to,"
"associated with," and "tied to" are how careful writers say *correlation* — and how careless
ones smuggle in *causation*. When you read "X linked to Y," ask: what's the third thing that
could cause both? For the broader pattern of mistaking sequence and coincidence for cause, see
[/guides/critical-thinking-and-fallacies](/guides/critical-thinking-and-fallacies).

## Sampling bias: who got counted

A statistic describes a *sample* — the people or things you actually measured — then claims to
speak for a *population*, everyone you care about. That leap is valid only if the sample looks
like the population. When it doesn't, the conclusion is broken before the math starts.

The classic example is the WWII planes. Engineers studied bombers returning from missions to
decide where to add armor. The returning planes were riddled with bullet holes on the wings and
tail, almost none on the engines. The obvious move: armor the wings and tail. The statistician
Abraham Wald said the opposite — armor the engines. Why? The sample was only the planes that
*came back*. Planes hit in the engines didn't return to be measured. The holes they could see
marked where a plane could survive being hit; the clean spots marked where it couldn't.

That's **survivorship bias**, and it's everywhere: "every successful founder dropped out of
college" (you're not counting the dropouts who failed and vanished), "this old building was
built to last" (the flimsy ones from that era are long gone). You're studying the survivors and
mistaking them for the whole story.

The everyday version is the **self-selected survey**. An online poll asking "are you angry about
this policy?" only hears from people angry enough to click. "We surveyed our own users and 90%
love the feature" — the users who hated it already left. The sample selected itself, and it
selected *for the answer you got*.

The defusing question is always the same: **who is missing from this data, and would they answer
differently?**

## Base rate neglect: forgetting how rare things are

This is the most counterintuitive trick in the catalog, so we'll walk it slowly with round,
hypothetical numbers.

Imagine a disease that affects 1 in 1,000 people. There's a test that is "99% accurate" — if
you have the disease it says yes 99% of the time, and if you don't it correctly says no 99% of
the time. You take the test. It comes back positive. What's the chance you actually have the
disease?

The instinct screams "99%." The real answer is about **9%**. Here's why, with a hypothetical
population of 100,000 people:

```text
Population:                    100,000
Actually have the disease:          100   (1 in 1,000)
Don't have it:                   99,900

Of the 100 sick people:
  test catches 99% →                 99 true positives

Of the 99,900 healthy people:
  test wrongly flags 1% →           999 false positives

Total positive results:        99 + 999 = 1,098
Chance a positive is real:     99 / 1,098 ≈ 9%
```

The 1% error rate sounds tiny — until it's applied to the *enormous* group of healthy people. A
small slice of a huge number (999) dwarfs the true cases (99). What the "99% accurate" headline
forgot to mention is the **base rate**: how common the condition is to begin with. When the base
rate is low, even an excellent test produces mostly false alarms.

This isn't a math curiosity. It's how to think about rare events generally: airport-screening
hits, fraud-detection flags, a rare-bug alert that fires constantly. Before you trust a
positive, ask how rare the real thing is. The rarer it is, the more a "positive" is probably
noise.

> Rule of thumb: accuracy is meaningless without the base rate. "99% accurate" and "mostly
> wrong" can both be true about the same test at the same time.

## Cherry-picking and p-hacking: torturing the data

Run one coin-flipping experiment and getting 8 heads out of 10 is mildly surprising. Run a
*thousand* and some will hit 8, 9, even 10 heads — guaranteed, by pure chance. Now report only
those. You've "proven" the coin is loaded, using nothing but luck and selective reporting.

That's the engine behind two related tricks:

- **Cherry-picking** — showing only the data that flatters your point. "Sales are up 40%!"
  (since the worst month last year, conveniently chosen as the starting line). The same dataset
  with an honest start date might show flat or falling sales.
- **p-hacking** — testing so many things that something crosses the "statistically significant"
  line by accident, then presenting that one result as if it were the question all along. Does
  this food cause cancer? Test it against 20 diseases and one will look significant at the usual
  threshold roughly 1 time in 20 *even if the food does nothing*. Report that one. Bury the
  nineteen.

The tell is **the missing denominator**: how many things did you test, how many time windows did
you try, before you found the one you're showing me? A result chosen *after* looking at the data
is a much weaker claim than one predicted *before*. (If you've read
[/guides/counting-and-combinatorics](/guides/counting-and-combinatorics), you'll feel the trap
in your gut: enough chances, and even a rare outcome becomes near-certain to appear *somewhere*.)

## Misleading charts: true data, lying pictures

A chart can be completely accurate and still deliberately deceive, because your eye reads the
*picture*, not the numbers. The most common moves:

- **Truncated y-axis (no zero baseline).** A bar chart of values 98, 99, 100 looks flat if the
  axis starts at 0 — and looks like a dramatic 3x cliff if it starts at 97. Same numbers,
  opposite story. Bar charts almost always need a zero baseline, because the *length* of the bar
  is the message.
- **Cropped time range.** Show only the slice where the line does what you want. A stock that's
  flat over five years can look like a rocket if you zoom into its best three months.
- **Mismatched or dual scales.** Two lines on two different y-axes, scaled so they appear to
  "track" each other — manufactured correlation, on purpose.
- **Inverted or unlabeled axes.** Rare, but devastating: an axis flipped upside down so a *rise*
  in deaths reads visually as a *decline*.

The defense is mechanical. Before you trust a chart, read the axes out loud. Where does the
y-axis start? What's the time range, and why that range? Is each axis labeled with real units? A
chart that won't answer those questions is hiding something.

```text
Same data, two charts:

  y starts at 0          y starts at 97
  100 ┤ ▇ ▇ ▇            100 ┤        ▇
      │ ▇ ▇ ▇             99 ┤    ▇   ▇
   50 ┤ ▇ ▇ ▇             98 ┤▇   ▇   ▇
      │ ▇ ▇ ▇             97 ┤▇   ▇   ▇
    0 └────────              └────────
   "basically flat"      "exploding growth!"
```

## Small samples: numbers that swing wildly

"100% of customers recommend us!" — three customers. "This treatment doubled survival!" — from
two patients to four.

Small samples are unstable by nature. Flip a fair coin four times and getting all heads happens
about 1 time in 16 — often enough that it'll happen to *somebody*, who will then swear the coin
is magic. The fewer the data points, the more any single result is dominated by luck rather than
truth. This is the flip side of the base-rate and p-hacking traps: rare flukes are common when
you have lots of small samples lying around.

So a headline rate means little without the **sample size** behind it. A 70% success rate from
1,000 trials is a real signal. A 100% success rate from 3 trials is a coin that happened to land
heads three times. Always ask: *out of how many?* A percentage with no denominator is a mood, not
a measurement.

## For builders: A/B tests and vanity metrics

Everything above shows up in your own work the moment you start measuring a product.

**A/B test pitfalls** — running variant A against variant B and reading the result:

- **Peeking early.** You check on day two, variant B is "winning," you ship it. But early
  numbers swing wildly (small samples again), and significance thresholds assume you decide
  *when* to stop *before* you start. Stopping the moment you like the result manufactures false
  wins. Pick your sample size up front and wait for it.
- **Too-small samples.** A "12% lift" from 40 users is noise wearing a suit. Underpowered tests
  produce confident-looking numbers that evaporate when you run them again.
- **Multiple comparisons.** Testing ten button colors at once is p-hacking by another name — one
  will "win" by chance. The more variants and metrics you check, the more accidental "winners"
  you'll find.

**Vanity metrics** — numbers that look great and mean nothing:

- Total signups (a number that only goes up, even as everyone churns).
- Page views without engagement (a spike from one viral link that converts no one).
- Followers, downloads, raw totals — any cumulative count that can't go down and so can never
  tell you something got worse.

The honest replacements measure a *rate* or a *retained* behavior: active users this week,
conversion percentage, whether people came back. If a metric can't get worse, it can't teach you
anything.

## The catalog, and where you go from here

Step back and look at what you can now do. Someone shows you a statistic. You run the checklist:

- Are they sliding from *correlation* to *causation*? What's the lurking third cause?
- Who's in the **sample** — and more importantly, who got left out?
- What's the **base rate**? Is a "positive" actually rare enough to trust?
- How many things did they test before showing me this one? (the missing denominator)
- What do the **chart's axes** actually say — zero baseline, full time range, real labels?
- Out of how many? What's the **sample size** behind that percentage?

None of these require advanced math. They're questions. That's the whole point of this guide,
and of the Mathematics foundations. We started in
[/guides/why-math-isnt-your-enemy](/guides/why-math-isnt-your-enemy) with one promise: math
isn't a wall keeping you out, it's a set of tools that make the world legible. Probability taught
you to reason about uncertainty instead of fearing it. Statistics taught you to read data
honestly. And this phase taught you the defensive half — because the same numbers that
illuminate are used, constantly, to manipulate.

That's the mission in one line: **numeracy is self-defense.** Not so you can win arguments with
spreadsheets, but so nobody can move you with a number you didn't understand. A truncated axis, a
self-selected survey, a "99% accurate" test on a rare condition — these are designed to work on
people who trust numbers without questioning them. You're no longer one of those people.

And these foundations feed everything ahead. When you reach the data and analytics material,
you'll already know why a clean average can lie and why the sample matters more than the size.
When you study AI and machine learning, base rates and false positives stop being a puzzle and
become the daily reality of every classifier you build or trust. When you tune performance, the
same instincts — read the distribution, distrust the small sample, ask out of how many — are how
you tell a real speedup from a lucky benchmark. You built the lens. The rest of the library is
what you point it at.

Quick gut-check before you go:

```quiz
[
  {
    "q": "A city finds that neighborhoods with more firefighters at a blaze tend to have more fire damage. What's the most reasonable conclusion?",
    "choices": [
      "Firefighters cause fire damage and should be sent in smaller numbers",
      "A third factor — the size of the fire — drives both the number of firefighters and the amount of damage",
      "The data must be wrong, since firefighters reduce damage",
      "More firefighters always means a more dangerous neighborhood"
    ],
    "answer": 1,
    "explain": "Classic correlation-without-causation. Bigger fires summon more firefighters AND cause more damage — the fire size is the lurking variable. The firefighters aren't the cause; they're a symptom of the same thing causing the damage."
  },
  {
    "q": "An online poll on a company's homepage shows 92% of respondents love the new redesign. Why should you be cautious?",
    "choices": [
      "92% isn't a high enough number to be meaningful",
      "Polls are always rigged by the company",
      "The sample is self-selected — only people still visiting and motivated to respond are counted, and people who hated it may have already left",
      "Online polls can't measure opinions accurately at all"
    ],
    "answer": 2,
    "explain": "This is sampling bias by self-selection. The poll only hears from people who stayed on the site and chose to answer. The users most upset by the redesign may have already churned and aren't in the sample at all — so it can't speak for everyone."
  },
  {
    "q": "A bar chart shows your competitor's revenue towering over yours — but you notice the y-axis starts at $9.8M, not $0, and the real values are $9.9M vs $10.1M. What's going on?",
    "choices": [
      "The chart is fine; your competitor really is dominating",
      "A truncated (non-zero) baseline exaggerates a tiny 2% difference into a visual landslide",
      "The numbers are fabricated and can't be trusted",
      "Bar charts should never start at zero"
    ],
    "answer": 1,
    "explain": "The data is true but the picture lies. A bar chart's message is bar length, so starting the axis at $9.8M instead of $0 turns a ~2% gap into what looks like a 3x gap. Read the axis before you trust the impression."
  }
]
```

You've finished the Probability & Statistics guide — and the Mathematics foundations. The numbers
work for you now, not the other way around.

[← Phase 2: Reading Data: Statistics That Don't Lie](02-reading-data-statistics.md) · [Guide overview](_guide.md)
