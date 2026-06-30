---
title: "Light, Waves, and Fields"
guide: light-waves-and-fields
phase: 1
summary: "Why light, radio, sound, and ripples on a pond are the same idea: waves and fields, the electromagnetic spectrum, and what color really is."
tags: [physics, light, waves, electromagnetism, fields, color, sound]
difficulty: beginner
synonyms: ["what is a wave physics", "wavelength frequency amplitude", "does a wave move matter", "what is frequency", "what is amplitude"]
updated: 2026-06-30
---

# What a wave actually is

Throw a stone in a still pond. A ring spreads out. Now watch a single leaf floating on the surface as the ring passes under it. The leaf does not race off toward the shore. It bobs up, then down, then settles. The ring traveled across the whole pond. The water under the leaf went nowhere.

That gap between what travels and what stays still is the entire idea of a wave. Hold onto it, because almost everyone gets this wrong on the first pass, and once you have it, light and sound stop being mysterious.

## The pattern moves, the stuff stays put

A wave is a pattern of motion that travels through a material, while the material itself stays roughly where it was.

Picture a long line of people doing the stadium wave. A "wave" sweeps around the whole arena. But no single person ran around the arena. Each one stood up and sat back down. The thing that moved was the *pattern* of standing-up. The people stayed in their seats.

```text
seat:   1   2   3   4   5   6   7   8
t=0:    ^   .   .   .   .   .   .   .     (person 1 stands)
t=1:    .   ^   .   .   .   .   .   .     (1 sits, 2 stands)
t=2:    .   .   ^   .   .   .   .   .     (2 sits, 3 stands)
t=3:    .   .   .   ^   .   .   .   .     (the "wave" has moved right)
```

*What just happened:* the bump (`^`) traveled from seat 1 to seat 4, but every person only moved up and down in place. The wave carries a pattern and energy across the row; it does not carry the people.

This is why a wave can cross a stadium, a pond, or millions of kilometers of space without anything being shipped from one end to the other. What moves is the disturbance, the shape, the up-and-down. The water, the air, the people: they jiggle in place and go back home.

> One sentence to keep: a wave transports energy and a pattern, not the material it travels through.

## The three numbers that describe any wave

Every wave, sea swell or sound or light, can be pinned down by three quantities. Learn these three and you can talk about all of them.

Picture the wave frozen in time, drawn as a curve:

```text
amplitude
   |        peak              peak
   |        /\                /\
   |       /  \              /  \
---+------/----\------------/----\------>  distance
   |     /      \          /      \
   |    /        \        /        \
            trough           trough
        |<--- wavelength --->|
```

**Wavelength** is the distance from one peak to the next peak. It is a length, so you measure it in meters (or millimeters, or nanometers for light). A long ocean swell has a wavelength of many meters. The light hitting your eye right now has a wavelength smaller than a speck of dust.

**Frequency** is how many full peaks pass a fixed point each second. You measure it in hertz (Hz), which means "per second." If three peaks pass the floating leaf every second, that wave is 3 Hz. A radio station at 98.5 FM is sending you a wave at 98.5 million Hz.

**Amplitude** is how tall the wave is, peak to middle. It is how *much* of the disturbance there is. A gentle ripple has small amplitude; a storm swell has large amplitude. Amplitude is loudness for sound and brightness for light, as you will see in phase 2.

```text
wave speed = wavelength x frequency
```

*What just happened:* this is the one relationship tying the three together. If a wave moves at a fixed speed, then long wavelength forces low frequency, and short wavelength forces high frequency. They trade off. You will use this in the next phase to understand why a single dial covers radio all the way up to X-rays.

## Two flavors: along the motion, and across it

There are two ways the stuff can jiggle relative to the way the wave travels, and the difference matters later.

In a **transverse** wave, the material moves *across* the direction of travel. The stadium wave is transverse: people move up and down, the wave moves sideways. Water ripples and light are transverse.

In a **longitudinal** wave, the material moves *along* the direction of travel, squeezing and stretching. Sound is the clearest example: a speaker pushes air molecules forward, they bump the next ones, a compression travels outward. No air flies from the speaker to your ear. The squeeze-and-release pattern travels; the air bobs back and forth in place.

```text
longitudinal (sound):   pushing direction ------------>
  air:  | | |  | |   |    |   | |  | | |   (compressed and spread out)
                ^^^ pattern of compression travels right ^^^
```

*What just happened:* the dense patch (where the bars crowd together) moves to the right, carrying the sound, while each air molecule only shuffles a tiny bit back and forth. Same core idea as the pond: pattern travels, stuff stays.

This matters because it explains a fact you already know: sound needs a material to travel through (air, water, a wall), since it *is* the squeezing of that material. In space, no air, no squeezing, no sound. Light, you will see, plays by a different rule entirely.

## For builders

The wave model is not only for physicists. Every audio file on your machine is a list of amplitude samples over time, the exact up-and-down of a sound wave written as numbers. Every digital signal, Wi-Fi, Bluetooth, the bytes leaving your router, rides on a wave whose frequency and amplitude get nudged to encode bits. When you reach for a Fourier transform in a graphics or audio library, you are asking one question: which frequencies and amplitudes add up to make this signal? The three numbers from this phase are the vocabulary of that entire world.

```quiz
[
  {
    "q": "A duck floats on a pond and a wave passes under it. What does the duck mostly do?",
    "choices": ["Gets carried to the far shore", "Bobs up and down roughly in place", "Sinks to the bottom", "Speeds up in the wave's direction"],
    "answer": 1,
    "explain": "A wave moves a pattern and energy through the water; the water (and the duck) mostly jiggles in place and stays put."
  },
  {
    "q": "Wavelength is best described as:",
    "choices": ["How many peaks pass each second", "How tall the wave is", "The distance from one peak to the next", "The speed of the wave"],
    "answer": 2,
    "explain": "Wavelength is a distance, peak to peak. Peaks-per-second is frequency, and height is amplitude."
  },
  {
    "q": "Sound cannot travel through empty space because:",
    "choices": ["Space is too cold", "Sound is a squeezing of a material, and there is no material to squeeze", "Sound is too quiet", "Frequency drops to zero in a vacuum"],
    "answer": 1,
    "explain": "Sound is a longitudinal wave: it IS the compression of air (or water, or solids). No material means nothing to compress, so no sound."
  }
]
```

[← Overview](_guide.md) | [Phase 2: Light is one wave on a giant dial →](02-light-is-one-wave-on-a-dial.md)
