---
title: "Reading Data: Statistics That Don't Lie"
guide: "probability-and-statistics"
phase: 2
summary: "Mean, median, and mode summarize the center of data; range and standard deviation describe its spread; and the distribution describes its shape. Knowing when the mean betrays you is half the skill."
tags: [mathematics, statistics, mean, median, standard-deviation, distribution]
difficulty: beginner
synonyms: ["mean median mode", "what is standard deviation", "average vs median", "what is a normal distribution", "what is variance", "percentiles explained"]
updated: 2026-06-25
---

# Reading Data: Statistics That Don't Lie

You have a pile of numbers - salaries, page-load times, exam scores - and someone asks the
most natural question in the world: *so, what's it like?* You can't read out all 10,000
values. You need to compress them into a few clear numbers that capture the shape of the pile
without lying about it.

That's this phase. Three questions, three kinds of answer: **where is the center?**, **how
spread out is it?**, and **what shape does it make?** Get those three and you can describe
almost any dataset in a sentence. Get the first one wrong and every downstream conclusion
inherits the lie.

## Where the data sits: measures of center

The "center" of a dataset is your one-number summary of a typical value. There are three
common ways to find it, and they don't always agree.

Take this tiny dataset of quiz scores: `[3, 5, 5, 7, 10]`.

- **Mean** (the "average"): add everything up, divide by how many there are.
  `(3 + 5 + 5 + 7 + 10) / 5 = 30 / 5 = 6`. The mean is the balance point.
- **Median** (the middle value): sort the numbers, take the one in the middle. Sorted, the
  middle of `[3, 5, 5, 7, 10]` is `5`. Half the data sits below it, half above. With an even
  count, average the two middle values.
- **Mode** (the most common value): the value that shows up most. Here `5` appears twice and
  everything else once, so the mode is `5`.

For this gentle dataset, mean (6), median (5), and mode (5) sit close together. That's the
comfortable case. The interesting - and dangerous - case is when they pull apart.

## Mean vs median: the one idea that matters most

Here's the single most useful thing in this phase, so slow down for it.

Imagine a small room with ten people. Nine earn around \$50,000 a year. The tenth is a
billionaire who earns \$1,000,000,000.

What's the **average** (mean) income? Add the nine \$50,000 salaries (\$450,000) to the
billion, divide by ten - roughly \$100,045,000. So the headline reads: *"Average income in
this room: over \$100 million."*

Every word of that is arithmetically true and completely useless. Nobody in that room lives
like they earn \$100 million. Nine earn \$50k; one earns a fortune. The mean got **dragged**
toward the one extreme value, and now it describes nobody.

The **median** doesn't flinch. Line up all ten incomes and look at the middle: still about
\$50,000. The median gives a straight answer to "what does a typical person here earn?" because a single
huge value can't move the middle of the line - it sits at the far end.

This is the core lesson: **the mean is sensitive to outliers and skew; the median resists
them.** When data is lumpy - a few values far from the rest - the mean tells you about the
lump, and the median tells you about the people.

That's why you hear "median household income" and "median home price" in the news, almost never
"average." For money, the median is the trustworthy number.

## How spread out: range and standard deviation

Knowing the center isn't enough. Two datasets can share a mean and feel completely different.
`[50, 50, 50]` and `[0, 50, 100]` both average to 50, but one is identical everywhere and the
other is all over the place. You need a number for **spread**.

The simplest is the **range**: largest value minus smallest. For `[0, 50, 100]` the range is
`100 - 0 = 100`. Quick, but fragile - one freak value blows it up, and it says nothing about
what happens in between.

The workhorse is **standard deviation**. The intuition is all you need right now:

> Standard deviation is the *typical distance* a value sits from the mean.

A small standard deviation means values cluster tightly around the average. A large one means
they're scattered. If exam scores average 70 with a standard deviation of 4, almost everyone
scored near 70. If it's 25, scores are flung from near-zero to near-perfect, and "the average
is 70" hides a lot.

(Under the hood: measure how far each value is from the mean, square those distances so
positives and negatives don't cancel, average them - that average is the **variance** - then
take the square root to get back to the original units. You don't grind the formula by hand; a
calculator or one line of code does it. What you need is the mental model: *typical distance
from the average*.)

## What shape: distributions and percentiles

A **distribution** is the shape the data makes when you sort it into buckets and ask "how many
values land here, how many there?" Picture a histogram: tall bars where values pile up, short
bars where they're rare.

The most famous shape is the **normal distribution** - the "bell curve." Most values cluster
around the center and thin out symmetrically as you move away in either direction. Adult
heights, measurement errors, and many natural quantities land roughly here. When data is
bell-shaped, the mean and median sit together in the middle, and standard deviation describes
the width of the bell.

Plenty of real data is **not** symmetric. When a long tail stretches off to one side, the
distribution is **skewed**. Incomes, latencies, and file sizes are classic right-skewed shapes:
most values are modest, with a few very large ones trailing off to the right. That long tail is
exactly what drags the mean away from the median - which is why those are the cases where the
median earns its keep.

To talk about position inside a distribution, use **percentiles**. The *p*th percentile is the
value below which *p* percent of the data falls. The **median is the 50th percentile** - half
the data sits below it. The 95th percentile (**p95**) is the value 95% of your data comes in
under; only the slowest or largest 5% exceed it. Percentiles let you describe the tail
precisely instead of hand-waving about "the big ones."

## See it move

Watch the mean and median react differently to a single outlier. This uses Python's
standard-library `statistics` module - nothing to install.

```python runnable
import statistics
data = [2, 3, 3, 4, 4, 4, 100]   # one big outlier
print(statistics.mean(data))      # pulled up by 100
print(statistics.median(data))    # resists the outlier
print(round(statistics.pstdev(data), 2))
```

*What just happened:* the mean comes out to about `17.14`, even though six of the seven values
are between 2 and 4. That single `100` dragged the average into a range where no actual data
point lives. The median is `4` - the genuine middle of the pile - and it doesn't budge no
matter how extreme that outlier gets. The standard deviation is large precisely because one
value sits so far from the mean. Same data, two very different stories about "the typical
value," and only one tells it straight.

## For builders: why teams track p95, not the average

If you run a web service, you care how fast it responds. The tempting metric is **average
response time** - but request latencies are right-skewed, and the average hides the pain.

Say 99 requests return in 50 ms and one stalls at 5,000 ms. The average is about 99.5 ms,
which sounds fine. But one user waited five full seconds, and the average quietly buried them.
Latency data almost always has this long tail, so the mean flatters you while real users
suffer.

That's why serious teams watch **percentiles** instead:

- **p50** (the median): the typical experience - half of requests are faster.
- **p95**: 95% of requests come in under this. A reasonable "most people are okay."
- **p99**: the slowest 1%. This is where your worst real experiences live - the spinning
  loaders, the rage-quits, the support tickets.

Optimizing the average can mean shaving milliseconds off requests that were already fast.
Optimizing p99 means fixing the requests that are actually hurting people. The percentile tells
you where the suffering is; the average tells you a comforting story. This same instinct shows
up anywhere you summarize counts - and counting itself has its own toolkit in
[/guides/counting-and-combinatorics](/guides/counting-and-combinatorics).

> ⚠️ **"Average" almost always means the mean.** And for skewed data - incomes, latencies, file
> sizes, response times - the mean is the number most likely to mislead you. When you see an
> average reported on lumpy data, ask for the median (and a percentile or two) before you trust
> it. The mean isn't wrong; it's answering a different question than the one you probably care
> about.

## Recap

- **Center**: the **mean** is the balance point, the **median** is the middle value, the
  **mode** is the most common value. On gentle data they agree.
- **Mean vs median** is the key skill: the mean gets pulled by outliers and skew; the median
  resists them. For money and other lumpy data, the median is the reliable summary.
- **Spread**: the **range** is max minus min; **standard deviation** is the typical distance of
  values from the mean. Same center, different spread = different data.
- **Shape**: a **distribution** describes how values pile up. The **normal** curve is the
  symmetric bell; **skewed** data has a long tail. **Percentiles** pin down position - the
  median is the 50th percentile, and p95/p99 expose the tail.

A quick check before you move on:

```quiz
[
  {
    "q": "Nine people earn about $50k and one earns $1 billion. Which number better describes a typical income in the room?",
    "choices": ["The mean, because it uses every value", "The median, because the outlier barely moves it", "The range, because it shows the gap", "They're equally good summaries here"],
    "answer": 1,
    "explain": "The single huge income drags the mean to over $100 million - a value nobody actually earns. The median stays near $50k because one extreme value can't shift the middle of the sorted list."
  },
  {
    "q": "What does the standard deviation of a dataset describe?",
    "choices": ["The most common value", "The middle value when sorted", "How far values typically sit from the mean (the spread)", "The difference between the largest and smallest value"],
    "answer": 2,
    "explain": "Standard deviation is the typical distance of values from the mean. A small one means tight clustering; a large one means values are scattered widely. (The largest-minus-smallest gap is the range.)"
  },
  {
    "q": "The median is equivalent to which percentile?",
    "choices": ["The 50th percentile", "The 95th percentile", "The 100th percentile", "The 0th percentile"],
    "answer": 0,
    "explain": "The pth percentile is the value below which p percent of the data falls. The median splits the data in half, so exactly 50% sits below it - making it the 50th percentile."
  }
]
```

[← Phase 1: Probability: Measuring Uncertainty](01-probability-measuring-uncertainty.md) · [Guide overview](_guide.md) · [Phase 3: How Statistics Mislead You →](03-how-statistics-mislead-you.md)