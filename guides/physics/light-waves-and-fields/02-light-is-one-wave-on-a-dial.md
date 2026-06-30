---
title: "Light is one wave on a giant dial"
guide: light-waves-and-fields
phase: 2
summary: "Why light, radio, sound, and ripples on a pond are the same idea: waves and fields, the electromagnetic spectrum, and what color really is."
tags: [physics, light, waves, electromagnetism, fields, color, sound]
difficulty: beginner
synonyms: ["electromagnetic spectrum explained", "what is light", "why are radio and light the same", "what is color really", "what is a field physics", "how do magnets work field"]
updated: 2026-06-30
---

# Light is one wave on a giant dial

You learned in phase 1 that a wave is a pattern moving through a material. Now comes the part that broke physicists' brains for a century, and the part that finally makes light make sense: light is a wave that needs no material at all. It crosses the empty vacuum between the Sun and your face. To understand how, we need one more idea: the field.

## What a field is, without the hand-waving

Hold two magnets near each other and you feel something push back before they touch. Nothing visible connects them, yet there is a force across the gap. Drop your keys and they fall, pulled by the Earth across empty air. These are not magic. They are *fields*.

A field is a quantity that has a value at every point in space. That is the whole definition. Think of a weather map: at every point on the map there is a temperature. The temperature field is "the temperature, everywhere." You cannot see it, but it is real and you can measure it anywhere you stand.

A magnetic field is the same idea: at every point around a magnet there is a magnetic strength and direction. Iron filings sprinkled on paper make it visible, lining up along the field's directions.

```text
magnetic field around a bar magnet (iron filings pattern):

        .  -  -  .
      /            \
   N |   ------>    | S
      \            /
        '  -  -  '

  at every point, an arrow says "which way, how strong"
```

*What just happened:* the filings did not move themselves into a pretty shape. They revealed something already present everywhere around the magnet, a value (direction and strength) at every point. That invisible-value-everywhere is the field. Gravity is a field too: every point near Earth has a "down, this strong" value, which is why your keys know which way to fall.

> A field is not a thing sitting in space. It is a property *of* space at each point, an instruction for how something placed there would feel a push.

## The trick that makes light

Here is the discovery that ties it all together, and it is genuinely beautiful.

A changing electric field creates a magnetic field. And a changing magnetic field creates an electric field. So if you wiggle an electric field, it makes a magnetic field, whose wiggling makes another electric field, whose wiggling makes another magnetic field, and the pattern leapfrogs forward through empty space, each field regenerating the other.

That self-sustaining leapfrog *is* light. Light is an electromagnetic wave: an electric field and a magnetic field, at right angles, taking turns creating each other as they travel.

```text
electric field  (up/down)   ^   ^   ^
                            /|\ /|\ /|\
direction of travel  ------------------------>
                            \|/ \|/ \|/
magnetic field (in/out)     o   o   o

  each field's change feeds the other; the pair sails forward
```

*What just happened:* because each field powers the next, the wave needs no material to carry it. This is why sunlight crosses millions of kilometers of vacuum and a sound never could. The fields are the medium. They carry themselves.

And it explains the famous fact that light has a fixed top speed. The rate at which a changing electric field births a magnetic field, and back, is set by two constants of the universe. Run the leapfrog and you get one speed, the same for all light, everywhere: roughly 300,000 kilometers per second.

## The same wave at every frequency: the spectrum

Now recall the trade-off from phase 1: for a fixed speed, long wavelength means low frequency, short wavelength means high frequency. Light always travels at that one speed. So the only thing that varies from one kind of light to another is *frequency* (and therefore wavelength).

Turn that into a dial. Crank the frequency up from low to high and the *same kind of wave* gets new names:

```text
LOW frequency  <-----------------------------> HIGH frequency
long wavelength                                short wavelength

 radio  microwave  infrared  VISIBLE  ultraviolet  X-ray  gamma
  |        |          |       |  |  |      |          |       |
 FM/AM   ovens,     warmth   the rainbow  sunburn   medical  nuclear
 Wi-Fi   radar      heat     you can see            imaging
```

*What just happened:* radio waves, the microwaves in your kitchen, the warmth you feel from a fire, the colors you see, the rays that give sunburn, and the X-rays at the dentist are all the *exact same phenomenon*, an electromagnetic wave, differing only in frequency. This is the punchline of the whole guide. There is no separate "radio stuff" and "light stuff." It is one wave on one dial.

Visible light is a thin slice in the middle, the only frequencies your eyes evolved to detect. Everything else is light you cannot see but can build instruments to catch.

## What color and pitch actually are

This is where the abstract pays off in something you experience every waking second.

**Color is the frequency of visible light.** Within that thin visible slice, low frequency (longer wavelength) reads as red, and high frequency (shorter wavelength) reads as violet, with orange, yellow, green, and blue in between. Red and blue are not different *substances*. They are the same electromagnetic wave wiggling at different rates. When you see a red apple, the apple is absorbing most frequencies and bouncing the red-frequency light into your eye.

**Pitch is the frequency of sound.** A low rumble is a low-frequency sound wave; a high whistle is a high-frequency one. Same pattern as color, applied to the squeezing-of-air wave from phase 1.

And **amplitude** maps onto the "how much" in both: for light, larger amplitude is brighter; for sound, larger amplitude is louder. Frequency tells you *which* color or pitch; amplitude tells you *how strong* it is. Two knobs, and between them they describe nearly everything your eyes and ears report.

```text
LIGHT:  frequency -> color        amplitude -> brightness
SOUND:  frequency -> pitch        amplitude -> loudness
```

*What just happened:* the three numbers from phase 1 are no longer abstract. Frequency is the color you see and the note you hear. Amplitude is the brightness and the volume. You have been measuring waves with your senses your whole life.

## For builders

Every pixel on your screen is the amplitude trio of three frequencies, red, green, and blue, dialed up and down to fake every other color your eye can resolve. A hex code like `#3A7BD5` is literally "this much red-frequency, this much green, this much blue." Your screen never produces a true yellow wave; it lights red and green together and your eye is fooled. Understanding color as frequency, and brightness as amplitude, is why color pickers, audio meters, and signal code all share the same two-knob shape.

```quiz
[
  {
    "q": "What is a field, in physics?",
    "choices": ["A solid object floating in space", "A value (like strength and direction) defined at every point in space", "A type of energy made only by batteries", "A wave that needs air to travel"],
    "answer": 1,
    "explain": "A field is a quantity with a value at every point in space, like temperature on a weather map or 'down, this strong' for gravity."
  },
  {
    "q": "Why can light travel through the vacuum of space when sound cannot?",
    "choices": ["Light is faster", "Light is a wave of fields that regenerate each other, needing no material; sound is the squeezing of a material", "Space has special light-carrying air", "Sound is heavier than light"],
    "answer": 1,
    "explain": "Light is a self-sustaining electric-and-magnetic field wave; the fields carry themselves. Sound IS the compression of a material, so no material means no sound."
  },
  {
    "q": "Radio waves and X-rays differ mainly in:",
    "choices": ["What they are made of", "Their speed", "Their frequency (and wavelength)", "One is a wave and one is not"],
    "answer": 2,
    "explain": "Both are electromagnetic waves traveling at the same speed. They are the same phenomenon at different points on the frequency dial."
  }
]
```

[← Phase 1: What a wave actually is](01-what-a-wave-actually-is.md) | [Overview](_guide.md) | [Phase 3: When waves meet themselves →](03-when-waves-meet-themselves.md)
