---
title: "Measuring What Users Feel"
guide: "web-performance-core-web-vitals"
phase: 2
summary: "Lab versus field data, why Lighthouse and real users disagree, and how to read the Network tab to see where the time and the bytes actually go."
tags: [performance, web-performance, lighthouse, network-tab, lab-data, field-data, crux, devtools]
difficulty: intermediate
synonyms: ["lab vs field data web performance", "why is lighthouse different from real users", "how to use the network tab", "read chrome devtools network", "what is crux field data", "throttle network devtools", "ttfb waterfall"]
updated: 2026-06-30
---

# Measuring What Users Feel

You run Lighthouse on your laptop. Green across the board, 98. You ship it, feeling good. A week later someone pulls up the real-user dashboard and your LCP is in the red. Same page, same code - wildly different numbers. What happened?

Nothing went wrong. You measured two different things and assumed they were the same. This is the trap that wastes the most time in web performance: trusting one measurement, in one environment, as if it were the truth. Your laptop on office wifi is not your user on a three-year-old phone on a train. Until you know which kind of measurement you're looking at, you can't tell whether a number is good news, bad news, or noise.

So the mental model for this phase: **there are two kinds of performance data, and they answer different questions.** Lab data answers "is this page *capable* of being fast, in a controlled setting?" Field data answers "is this page *actually* fast for the humans using it?" You need both, and you need to stop confusing them.

## Lab data versus field data

```text
   LAB DATA (synthetic)              FIELD DATA (real users / RUM)
   ─────────────────────            ──────────────────────────────
   one device, one network          thousands of real devices/networks
   you control everything           you control nothing
   repeatable, debuggable           messy, representative
   "CAN it be fast?"                "IS it fast, for real people?"
   e.g. Lighthouse, WebPageTest     e.g. Chrome UX Report (CrUX), RUM
```

*What just happened:* The two columns aren't rivals - they're a division of labor. Lab data is your workshop: clean, controlled, where you reproduce a problem and test a fix. Field data is your reality: the actual distribution of devices, networks, and patience your users bring. A fix proven in the lab still has to show up in the field to count. Google's official Core Web Vitals - the ones that affect search ranking - are measured from **field data**, not your laptop.

> 💡 **Lighthouse is lab data.** That 98 in your dev tools is a simulation on *your* machine under *one* throttling profile. It's genuinely useful for finding problems and checking fixes - but it is not what your users experience, and it is not what Google ranks on. When lab and field disagree, the field is the one that's right about reality.

## The 75th percentile, not the average

Field data never gives you one number - it gives you a distribution, because your users are all different. Core Web Vitals are reported at the **75th percentile**: the value that 75% of page loads came in *at or below*.

Why not the average? Because averages hide the people having a bad time. If most visits are fast but a meaningful slice are awful, the average can look fine while a quarter of your users suffer. The 75th percentile says "three out of four of your users had at least this good an experience" - and it deliberately keeps the slow tail in view.

```text
   100 page loads, sorted by LCP (fastest → slowest)
   ▕▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▕▔▔▔▔▔▔▔▔▔▕
                                                              ▲
                                               75th percentile lives here
                          (ignore the average - watch this and the slow tail to its right)
```

*What just happened:* The metric is taken three-quarters of the way along the sorted distribution, not at the middle and not at the average. This is the same percentile thinking that runs through all of performance work - watch the tail, not the mean - covered more deeply in [Optimizing Real Systems](/guides/optimizing-real-systems). It's why a green Lighthouse run can coexist with a red field score: your laptop is one fast sample; the 75th percentile includes the slow phones you never test on.

## Reading the Network tab

When LCP is bad and you need to know *why*, the Network tab in your browser's dev tools is the first place to look. It shows every resource the page requested - HTML, CSS, JavaScript, images, fonts - as a waterfall: when each one started, how long it took, and how big it was.

```text
   Name              Size     Time     Waterfall
   ───────────────────────────────────────────────────────────
   document.html     14 kB    220 ms   ▕█▏                          ← TTFB: server think time
   app.bundle.js    480 kB    900 ms       ▕████████▏               ← huge JS, blocks rendering
   styles.css        38 kB    140 ms       ▕█▏
   hero.jpg        1,800 kB  1,400 ms          ▕███████████▏        ← unoptimized image = LCP killer
   font.woff2        96 kB    180 ms              ▕█▏
   ───────────────────────────────────────────────────────────
   Total: 2.4 MB transferred, finished at ~2.6 s
```

*What just happened:* Two problems jump out of this waterfall. The 480 kB JavaScript bundle and the 1.8 MB hero image dominate both the bytes and the timeline - and that hero image is almost certainly the LCP element, so its 1.4-second download *is* your bad LCP. The waterfall turns a vague "the page is slow" into "these two specific resources are the cost," which is the whole point of looking.

A few things to read off every waterfall:

- **TTFB (Time to First Byte)** - how long before the server even started sending the HTML. A long bar before *anything* else means the problem is the server or network, not the front-end. Nothing you do to images will help a slow TTFB.
- **Size column** - the actual transferred bytes (after compression). This is your bundle-size and image-weight reality check. Sort by it.
- **The long bars** - the resources that take the most time. These are your suspects, ranked for free.
- **Blocking resources** - CSS and synchronous JavaScript in the `<head>` that the browser must fetch and process *before* it can paint. We disarm these in [Phase 3](03-the-levers-that-move-the-numbers.md).

## Throttle, or you're lying to yourself

Your dev machine has a fast CPU and a fast connection. Your users, on average, do not. Every dev tools Network tab has a throttling dropdown - set it to something like "Slow 4G" and, where available, throttle the CPU too. The page you thought was instant will suddenly behave like it does for a real person on a mid-range phone.

> ⚠️ **The fast-laptop illusion.** The single most common reason a team is blindsided by bad field data is that everyone tests on fast hardware and fast wifi. Throttling isn't pessimism - it's the closest a lab tool gets to telling the truth. Make it a habit before you call anything "fast."

## For builders: measure, fix, then confirm in the field

Put the two kinds of data to work in a loop. Use **field data** (CrUX, or real-user monitoring if you have it) to decide *whether* there's a problem and which vital is red. Use **lab tools** (Lighthouse, the Network tab, throttled) to *diagnose* it - find the heavy resource, the blocking script, the unsized image - and to verify your fix made the number move locally. Then wait for the field data to confirm the win for real users, because field is the scoreboard that counts.

That's the no-nonsense measurement discipline. Now that you can see *where* the time and bytes go, Phase 3 is the short list of levers that move them.

```quiz
[
  {
    "q": "Your Lighthouse score is a green 98, but Google's Core Web Vitals report shows your LCP in the red. What's the most likely explanation?",
    "choices": [
      "Lighthouse is broken and should be ignored",
      "Lighthouse is lab data from your fast machine; Google ranks on field data from real users' slower devices",
      "Your server is down",
      "The two tools measure completely unrelated things and can never agree"
    ],
    "answer": 1,
    "explain": "Lighthouse is a controlled lab simulation on your hardware. Core Web Vitals are measured from real users in the field - slower phones and networks - so a green lab score can coexist with a red field score."
  },
  {
    "q": "Why are Core Web Vitals reported at the 75th percentile instead of the average?",
    "choices": [
      "The 75th percentile is easier to compute",
      "Averages can look fine while hiding a large slice of users having a bad experience; the percentile keeps the slow tail in view",
      "It makes the numbers look better",
      "Browsers can only measure percentiles"
    ],
    "answer": 1,
    "explain": "An average can mask a suffering minority. The 75th percentile guarantees at least three of four users had that experience or better, while deliberately keeping the slow tail visible."
  },
  {
    "q": "In the Network tab, you see a long bar before any other resource loads, even the HTML. What does that point to?",
    "choices": [
      "An oversized hero image",
      "A bloated JavaScript bundle",
      "A slow TTFB - the server or network is slow to send the first byte, before the front-end is even involved",
      "Too much CSS"
    ],
    "answer": 2,
    "explain": "Time to First Byte is the delay before the server starts responding. A long gap before anything arrives means the bottleneck is server/network - optimizing images or JS won't help it."
  }
]
```

---

[← Phase 1: Perceived Performance and the Three Vitals](01-perceived-performance-and-the-three-vitals.md) · [Overview](_guide.md) · [Phase 3: The Levers That Move the Numbers →](03-the-levers-that-move-the-numbers.md)
