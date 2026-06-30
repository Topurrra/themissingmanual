---
title: "Perceived Performance and the Three Vitals"
guide: "web-performance-core-web-vitals"
phase: 1
summary: "Performance is what the user feels, not what a server log says. The three Core Web Vitals - LCP, CLS, and INP - turn loading, visual stability, and responsiveness into numbers you can chase."
tags: [performance, web-performance, core-web-vitals, lcp, cls, inp, perceived-performance, frontend]
difficulty: intermediate
synonyms: ["what is perceived performance", "what are core web vitals", "lcp cls inp meaning", "why does my page feel slow", "what counts as a fast website", "good lcp cls inp scores"]
updated: 2026-06-30
---

# Perceived Performance and the Three Vitals

Picture two pages. The first finishes loading in 800 milliseconds, but for the first half-second it's a blank white screen, then everything pops in at once and a banner shoves the button you were about to tap. The second takes a full second to "finish," but the headline and main image appear almost instantly, nothing jumps around, and every tap responds the moment you make it.

Ask a real user which one is faster and they'll pick the second one - even though, by the stopwatch, it's slower. That gap between *what the clock says* and *what the user feels* is the single most important idea in web performance. The server's "request completed in 200ms" log is real, but it's not the experience. The experience is built from a handful of moments the user lives through: when did I see something? Did it stay put? When I tapped, did it respond?

So here's the mental model for this whole guide: **you are optimizing a feeling, and the feeling has been broken into three measurable moments.** Google calls them the Core Web Vitals. Each one captures a different way a page can feel bad, and each one is a number you can measure and move.

## The user's timeline, in three questions

Every page load is a small story the user experiences in order. Each Core Web Vital answers one question in that story.

```text
   user clicks a link
        │
        ▼
   [ blank ] ──▶ "When does the MAIN thing appear?"      → LCP   (loading)
        │
        ▼
   [ content paints ] ──▶ "Does it STAY PUT, or jump?"    → CLS   (visual stability)
        │
        ▼
   [ user taps a button ] ──▶ "Does it RESPOND quickly?"  → INP   (interactivity)
```

*What just happened:* The three vitals aren't three random metrics - they're three points along the one timeline every user moves through. Loading (LCP), stability (CLS), and responsiveness (INP) are the three distinct ways that timeline can feel slow or broken, which is exactly why these three were chosen.

## LCP - Largest Contentful Paint (the loading feeling)

LCP measures **how long until the biggest piece of content visible in the viewport has rendered.** Not the first pixel, not the last byte - the largest *meaningful* element: usually the hero image, a big heading, or the main block of text. That's the moment the user feels "okay, the page is here."

Why the *largest* element? Because that's the proxy for "the main content has arrived." A spinner appearing fast doesn't help; the user is waiting for the actual thing. LCP captures the arrival of the actual thing.

```text
   Good       ≤ 2.5 s
   Needs work 2.5 s – 4.0 s
   Poor       > 4.0 s
```

*What just happened:* These are the thresholds Google publishes for LCP, measured at the 75th percentile of real page loads (more on that percentile in [Phase 2](02-measuring-what-users-feel.md)). "Good" means at least 75% of your visitors saw the main content within 2.5 seconds. The common LCP killers - a huge unoptimized hero image, a slow server response, render-blocking scripts - are exactly the levers we fix in [Phase 3](03-the-levers-that-move-the-numbers.md).

## CLS - Cumulative Layout Shift (the stability feeling)

CLS measures **how much the visible content moves around unexpectedly while the page is loading.** You've felt this: you go to tap a link, an image finishes loading above it, the whole page jumps down, and you tap an ad instead. That lurch is a layout shift, and CLS adds them all up.

It's not measured in seconds - it's a unitless score combining *how much* of the screen moved by *how far*. A perfectly stable page scores 0. The more things jump, and the bigger the jumps, the higher (worse) the score.

```text
   Good       ≤ 0.1
   Needs work 0.1 – 0.25
   Poor       > 0.25
```

*What just happened:* These are the CLS thresholds. The cause is almost always the same: an element with no reserved space - an image without width and height, an ad slot, a late-loading font or banner - drops in and pushes everything else down. The fix is to tell the browser how big things will be *before* they load, so the space is held open. We cover sized media in [Phase 3](03-the-levers-that-move-the-numbers.md).

> 💡 **Why "cumulative."** A single shift might be small, but a page that nudges itself five times during load feels broken even if no single jump is large. CLS sums the shifts across the whole load to capture that death-by-a-thousand-jumps feeling.

## INP - Interaction to Next Paint (the responsiveness feeling)

INP measures **how quickly the page responds visually after the user interacts** - a click, a tap, a key press. Specifically, the time from the interaction until the browser paints the next frame showing a response. It looks across all the interactions in a visit and reports a number close to the worst one, because the worst lag is the one users remember.

This is the vital that catches "I clicked and nothing happened." Usually the culprit is JavaScript: a long task hogging the main thread, so the browser can't get around to handling your click and updating the screen.

```text
   Good       ≤ 200 ms
   Needs work 200 ms – 500 ms
   Poor       > 500 ms
```

*What just happened:* These are the INP thresholds, in milliseconds. INP replaced an older metric (First Input Delay) in 2024 because FID only measured the *first* interaction's delay; INP looks at responsiveness across the whole visit, which is a far truer picture of how the page felt to use. Heavy JavaScript bundles are the usual cause - another reason bundle size in [Phase 3](03-the-levers-that-move-the-numbers.md) matters so much.

## For builders: the three are independent - and you need all three

A page can ace one vital and fail another, and they fail for different reasons. A blog with a giant hero image has bad LCP but probably fine INP. A heavy single-page app might paint fast (good LCP) but choke on every click (bad INP). An ad-heavy news site can load and respond fine yet shove content around constantly (bad CLS).

That's the practical payoff of splitting the feeling into three: when someone says "the page is slow," you don't guess. You check which vital is red, and that tells you *which kind* of slow it is - loading, stability, or responsiveness - and therefore which family of fixes to reach for. Before you can fix anything, though, you have to measure honestly. That's where local tools lie to you, and where field data tells the truth - Phase 2.

```quiz
[
  {
    "q": "A page finishes loading by the stopwatch in 700ms but shows a blank screen for most of that time, then pops everything in at once. Why might users still call it slow?",
    "choices": [
      "The stopwatch is wrong; 700ms is impossible",
      "Perceived performance is about what the user feels seeing content, not when the server says it's done",
      "Throughput is too low",
      "The page has too many DNS lookups"
    ],
    "answer": 1,
    "explain": "Performance is the experience, not the server log. A blank screen that fills in late feels slow even with a fast total time - which is exactly what LCP captures."
  },
  {
    "q": "Which Core Web Vital captures 'I tapped a button and nothing happened for a moment'?",
    "choices": [
      "LCP (Largest Contentful Paint)",
      "CLS (Cumulative Layout Shift)",
      "INP (Interaction to Next Paint)",
      "TTFB (Time to First Byte)"
    ],
    "answer": 2,
    "explain": "INP measures the time from an interaction to the next visual response. Laggy clicks, usually caused by heavy JavaScript blocking the main thread, show up as poor INP."
  },
  {
    "q": "A 'Good' CLS score is at or below 0.1. What does a CLS score actually measure?",
    "choices": [
      "Seconds until the largest element renders",
      "How much visible content moves around unexpectedly during load",
      "Milliseconds of delay before the first click is handled",
      "The total number of network requests"
    ],
    "answer": 1,
    "explain": "CLS is a unitless score summing how much of the viewport shifted and how far, capturing the lurch when unsized images, ads, or fonts drop in and push content around."
  }
]
```

---

[← Overview](_guide.md) · [Phase 2: Measuring What Users Feel →](02-measuring-what-users-feel.md)
