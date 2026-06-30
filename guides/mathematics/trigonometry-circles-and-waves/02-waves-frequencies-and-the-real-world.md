---
title: "Waves, Frequencies, and the Real World"
guide: "trigonometry-circles-and-waves"
phase: 2
summary: "A sine wave is the shape of every repeating phenomenon: sound, light, seasons, heartbeats. This phase shows how amplitude, frequency, and phase shift turn a single circle into the full language of waves, and how to generate a simple audio tone with code."
tags: [mathematics, trigonometry, sine-waves, amplitude, frequency, phase, audio, signals, beginner-friendly]
difficulty: beginner
synonyms: ["what is a sine wave", "amplitude and frequency", "phase shift", "sound waves and trigonometry", "how to generate a tone", "Fourier transform intuition"]
updated: 2026-06-28
---

# Waves, Frequencies, and the Real World

## The ripple that taught me everything

Drop a stone in a pond. The ripple that spreads out is a wave. It repeats: up, down, up, down, moving outward from where the stone landed.

That ripple is a sine wave in two dimensions. If you could freeze time and slice through the water, the height of the surface at each distance from the center would trace a sine wave. The same shape shows up in sound, light, radio, and the alternating current in your wall outlet.

That is what this phase is about. Not the formula first. The idea first: a sine wave is what you get when a point moves around a circle and you project its motion onto one axis.

## From circle to wave

In Phase 1 you saw a point moving around the unit circle. Its y coordinate is sine. As the angle increases, the y coordinate rises and falls in a smooth, repeating pattern.

If you plot angle on the x-axis and sine on the y-axis, you get a wave:

```
       ___
      /   \
_____/     \_____
```

That is the sine wave. It starts at 0, rises to 1 at pi/2, falls back through 0 at pi, down to -1 at 3*pi/2, and back to 0 at 2*pi. Then it repeats.

The cosine wave is the same shape, but shifted 90 degrees to the left. Where sine is at 0, cosine is at 1. Where sine is at 1, cosine is at 0. They are two views of the same circle, projected onto different axes.

## Amplitude: how tall the wave is

The **amplitude** is the height of the wave from the center line to the peak. A sine wave with amplitude 1 goes from -1 to 1. A sine wave with amplitude 2 goes from -2 to 2.

```
y = A * sin(x)
```

`A` is the amplitude. It stretches or shrinks the wave vertically. In audio, amplitude is loudness. In physics, amplitude is the energy of the wave.

## Frequency: how fast it repeats

The **frequency** is how many complete cycles the wave goes through in a given interval. A high frequency wave repeats quickly. A low frequency wave repeats slowly.

```
y = sin(B * x)
```

`B` is the frequency multiplier. If `B = 1`, the wave completes one cycle every 2*pi units. If `B = 2`, it completes two cycles in the same distance. The wave is twice as fast, twice as squeezed.

In audio, frequency is pitch. A 440 Hz wave is the A above middle C. A 880 Hz wave is the same note an octave higher, with twice the frequency.

## Phase shift: where the wave starts

A **phase shift** slides the wave left or right. It answers the question: "where in the cycle is this wave at time zero?"

```
y = sin(x - C)
```

`C` is the phase shift. If `C = pi/2`, the wave starts at its peak instead of at zero. It is the same wave, starting at a different point in the cycle.

Phase shift matters when you combine waves. Two sine waves with the same frequency but different phases can add up to anything from zero to twice the amplitude, depending on whether they are in sync or out of sync.

## Combining waves: the start of Fourier

When you add two sine waves together, you get a new wave. If the waves have the same frequency and are in phase, they add constructively: the result is a taller sine wave. If they are out of phase, they add destructively: the result is a smaller wave, or even zero.

This is the seed of the **Fourier transform**, the idea that any repeating pattern can be built by adding together sine waves of different frequencies and amplitudes. A musical chord is several sine waves played at once. A square wave is an infinite sum of odd harmonics.

You do not need the full Fourier transform to use the insight. The insight is: complex waves are simple waves stacked on top of each other.

## See it run

Here is code that generates a sine wave and an audio tone using Python's built-in libraries.

```python runnable
import math

def sine_wave(t, amplitude=1, frequency=1, phase=0):
    return amplitude * math.sin(frequency * t + phase)

# Print values of a sine wave at key points
print("t       | sin(t)")
print("-" * 20)
for t in [0, math.pi/4, math.pi/2, 3*math.pi/4, math.pi]:
    print(f"{t:7.4f} | {sine_wave(t):7.4f}")

# Generate a simple audio-like sequence
sample_rate = 10  # samples per unit of time
duration = 2 * math.pi  # one full cycle
samples = []
for i in range(int(sample_rate * duration)):
    t = i / sample_rate
    samples.append(sine_wave(t, amplitude=0.5, frequency=1))

print("\nFirst 10 samples of a sine wave with amplitude 0.5:")
for i, s in enumerate(samples[:10]):
    print(f"Sample {i}: {s:.4f}")
```

*What just happened:* The `sine_wave` function computed `amplitude * sin(frequency * t + phase)`. With amplitude 1, frequency 1, and phase 0, it produced the standard sine wave. The printed values showed the wave rising from 0 to 1 at pi/2, falling back through 0 at pi, and continuing. The sample generation created a discrete version of the wave, like the samples in an audio file. The amplitude of 0.5 meant the wave varied between -0.5 and 0.5.

## For builders

Sine waves are not only for math class. They are the raw material of sound, light, and signal processing.

- **Audio synthesis** - A pure tone is a sine wave. Musical notes are sine waves at specific frequencies. Combining sine waves creates timbre. This is how synthesizers work.
- **Signal processing** - Filters, modulators, and demodulators all manipulate sine waves. A radio tuner selects one frequency from the many that fill the air.
- **Animation** - A bouncing ball, a pulsing glow, a swinging pendulum: all follow sine or cosine patterns. Using trig functions makes the motion smooth and natural.
- **Procedural generation** - Terrain height, cloud shape, and water waves are often generated by summing sine waves at different frequencies. This is called "value noise" or "fractal noise."
- **Testing and mocking** - Sine waves are useful for generating test data that has known properties: a fixed frequency, a known amplitude, and a predictable shape.

> The key insight: a sine wave is a point on a circle, projected onto one axis. Amplitude stretches it, frequency squeezes it, and phase shifts it. Combine waves by adding them. That is the whole language of repeating phenomena.

## What we have built

- A **sine wave** is the y coordinate of a point moving around the unit circle, plotted against angle.
- A **cosine wave** is the x coordinate of the same point, shifted 90 degrees.
- **Amplitude** controls the height of the wave.
- **Frequency** controls how quickly the wave repeats.
- **Phase shift** controls where in the cycle the wave starts.
- **Combining waves** adds their amplitudes at each point, creating complex patterns from simple ones.
- In code, `math.sin` and `math.cos` generate sine and cosine values from an angle in radians.

A quick check before you move on:

```quiz
[
  {
    "q": "What does the amplitude of a sine wave control?",
    "choices": ["How fast the wave repeats", "How tall the wave is from center to peak", "Where the wave starts in its cycle", "The frequency of the wave"],
    "answer": 1,
    "explain": "Amplitude controls the height of the wave. A larger amplitude means a taller wave. In audio, amplitude is loudness. In physics, amplitude is energy."
  },
  {
    "q": "If you double the frequency of a sine wave, what happens?",
    "choices": ["The wave gets taller", "The wave completes twice as many cycles in the same distance", "The wave shifts to the left", "The wave becomes a cosine wave"],
    "answer": 1,
    "explain": "Doubling the frequency means the wave repeats twice as often. It is squeezed horizontally. In audio, doubling the frequency raises the pitch by one octave."
  },
  {
    "q": "What is the relationship between a point on the unit circle and a sine wave?",
    "choices": ["They are unrelated concepts", "A sine wave is the y coordinate of a point moving around the unit circle, plotted against the angle", "A sine wave is the distance from the origin to the point", "A sine wave is the slope of the radius"],
    "answer": 1,
    "explain": "As a point moves around the unit circle, its y coordinate traces out a sine wave. Plot angle on the x-axis and y on the y-axis, and you see the wave. The same point's x coordinate traces out a cosine wave."
  }
]
```

[← Phase 1: The Unit Circle and Why Sine/Cosine Exist](01-the-unit-circle-and-why-sine-cosine-exist.md) · [Guide overview](_guide.md) · [Phase 3: Rotation, Navigation, and Where Am I Facing →](03-rotation-navigation-and-where-am-i-facing.md)
