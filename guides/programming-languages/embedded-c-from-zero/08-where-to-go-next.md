---
title: "Where to Go Next"
guide: "embedded-c-from-zero"
phase: 8
summary: "The on-ramps out of the Uno: bare registers versus a vendor HAL or CMSIS, a one-page intro to what an RTOS task is and why FreeRTOS exists, and the real boards to graduate to - STM32, ESP32, and the Raspberry Pi Pico - plus the datasheets worth reading."
tags: [embedded-c, hal, cmsis, registers, rtos, freertos, stm32, esp32, raspberry-pi-pico, rp2040, datasheet, next-steps]
difficulty: intermediate
synonyms: ["registers vs hal embedded", "what is a hal microcontroller", "what is cmsis", "what is an rtos", "what is a freertos task", "why use an rtos", "stm32 vs esp32 vs raspberry pi pico", "which microcontroller for wifi", "best board after arduino", "how to read a datasheet"]
updated: 2026-08-16
---

# Where to Go Next

You learned this on raw registers - setting bits in `DDRB` and `PORTB` by hand, reading the ADC and timer registers directly - on purpose. It's slower to write, but now nothing about a microcontroller is magic to you. This closing phase points at the roads out: the libraries that speed you up once you understand what they hide, the idea of an operating system for tiny chips, and the boards worth graduating to.

## Bare registers vs a vendor HAL

**What it actually is.** Everything you did talked to the hardware by writing directly to special memory addresses - the registers. A *HAL* (hardware abstraction layer) wraps those registers in friendly functions: instead of flipping bits in `DDRB` and `PORTB`, you call `digitalWrite(13, HIGH)`. On ARM chips there's also *CMSIS*, a standard naming scheme for a Cortex-M core's registers that vendor HALs (like STM32's) build on top of.

**The trade-off.** Registers give you full control and full understanding, at the cost of being verbose and tied to one specific chip. A HAL is faster to write and portable across a vendor's whole line, at the cost of hiding what's happening and adding overhead - Arduino's `digitalWrite` is many times slower than flipping the port bit directly, because it does a pin-to-port lookup and safety checks on every call.

💡 **Key point.** You learned registers first so the HAL is a convenience, not a crutch. When `digitalWrite` is too slow in a tight loop, or the HAL doesn't expose some peripheral mode you need, you can drop down to the registers - and you'll actually understand what you're reading in the datasheet. Most people who start at the HAL never can.

## A one-page look at an RTOS

**The problem it solves.** So far your program is one big `loop()` - a *super-loop* that does everything in sequence. That works until you need several things happening "at once": blink an LED every second, read a sensor every 100 ms, and respond to a button the instant it's pressed. Cram all that into one loop and the timing tangles into a knot of counters and flags.

**What an RTOS gives you.** A real-time operating system lets you write each job as its own *task* - an independent function with its own stack that acts as though it had the whole chip to itself. A *scheduler* switches between tasks rapidly, so on a single core they appear to run in parallel. "Real-time" means the scheduling is predictable: a high-priority task can interrupt a lower one to hit a deadline.

**FreeRTOS** is the name you'll meet first - small, open source, and running on everything from AVR to ARM to the ESP32 (whose official SDK is built on it). Treat this as a teaser, not a tutorial: the thing to carry forward is *why* you'd want one - many jobs at once, without a single tangled super-loop.

⚠️ **Gotcha.** An RTOS isn't free: every task needs its own stack, so tasks cost RAM. On a 2 KB AVR that's painfully tight, which is why an RTOS earns its keep more on roomier chips (ESP32, STM32) than on an Uno.

## Real boards to graduate to

The Uno taught you the fundamentals; here's where people go next, and when to pick each:

- **STM32** (ARM Cortex-M) - the industry workhorse. Far more speed, memory, and peripherals than an AVR at a similar price. Reach for it when a project outgrows the Uno and you want what professionals actually ship.
- **ESP32** - built-in WiFi and Bluetooth, dual core, plenty of RAM. Reach for it the moment your project needs to talk to a network or a phone.
- **Raspberry Pi Pico (RP2040)** - beginner-friendly and cheap, with an excellent, well-documented C/C++ SDK. Reach for it when you want a gentle step past Arduino into a modern SDK while staying in C.

And keep prototyping in **Wokwi** - it simulates all of these (Uno, ESP32, Pico, STM32), so you can try a board before buying one.

## Read the datasheet

One habit separates people who guess from people who know: reading the datasheet. Every register, every timer mode, every electrical limit you touched lives in the ATmega328P datasheet, stated exactly. It's dense, and you don't read it front to back - you look things up in it. Getting comfortable doing that is the real graduation from tutorials to engineering.

## Additional resources

- [ATmega328P datasheet (Microchip)](https://www.microchip.com/en-us/product/atmega328p) - the ground truth for every register and peripheral in this guide; learn to look things up here.
- [FreeRTOS documentation](https://www.freertos.org/) - the standard on-ramp to tasks and scheduling, with a free book-length kernel guide.
- [Raspberry Pi Pico C/C++ SDK](https://www.raspberrypi.com/documentation/microcontrollers/c_sdk.html) - a clean, modern SDK and a friendly next board after the Uno.
- [Wokwi](https://wokwi.com) - keep building and simulating AVR, ESP32, Pico, and STM32 projects in the browser, no hardware required.
- *Making Embedded Systems* by Elecia White - the classic readable book on designing real firmware, not merely blinking an LED.

## Recap

1. **Registers vs HAL:** direct register writes give full control and understanding but are verbose and chip-specific; a HAL (or ARM's CMSIS) is portable and quick to write but hides detail and adds overhead. You learned registers first so the HAL is a convenience, not magic.
2. **An RTOS** lets you split work into independent *tasks* a scheduler runs "at once," instead of one tangled super-loop. FreeRTOS is the common one; tasks cost RAM, so it fits roomier chips best.
3. **Graduate boards:** STM32 for power and industry use, ESP32 for WiFi and Bluetooth, Raspberry Pi Pico for a friendly modern C/C++ SDK.
4. **Read the datasheet** - it's the authority, and looking things up in it is the real skill.

One last check before you go build something:

```quiz
[
  {
    "q": "What's the core trade-off between writing directly to registers and using a vendor HAL?",
    "choices": [
      "Registers are portable across chips; a HAL only works on one chip",
      "Registers give full control and understanding but are verbose and chip-specific; a HAL is portable and quicker to write but hides detail and adds overhead",
      "A HAL runs faster than direct register access in every case",
      "There is no real difference; a HAL compiles to exactly the code you'd write by hand"
    ],
    "answer": 1,
    "explain": "Direct register access is maximum control and zero abstraction, at the price of verbosity and code tied to one chip. A HAL trades some speed and transparency for portability and convenience - Arduino's digitalWrite, for instance, is much slower than flipping the port bit yourself."
  },
  {
    "q": "In an RTOS, what is a 'task,' and why would you use one?",
    "choices": [
      "A single interrupt that fires once at startup",
      "An independent unit of work with its own stack that a scheduler switches between, letting several jobs run 'at once' without a tangled super-loop",
      "A compiler pass that optimizes your main loop",
      "A setting that overclocks the chip for more speed"
    ],
    "answer": 1,
    "explain": "A task is an independent thread of execution with its own stack; the scheduler rapidly switches between tasks so they appear concurrent on one core. You reach for an RTOS when a single super-loop can no longer juggle several timed jobs cleanly. The cost is RAM - each task needs its own stack."
  },
  {
    "q": "Your next project needs to send sensor data to a web server over WiFi. Which board is the natural pick?",
    "choices": [
      "A second Arduino Uno, since it's what you know",
      "An ESP32, because WiFi and Bluetooth are built in",
      "An STM32, because it has the most raw compute",
      "A base Raspberry Pi Pico, because it's the cheapest"
    ],
    "answer": 1,
    "explain": "The ESP32 integrates WiFi and Bluetooth, which is exactly why people pick it for connected projects. STM32 is the industry power option and the Pico is a friendly modern SDK, but neither includes wireless the way the ESP32 does - the base Pico/RP2040 has none."
  }
]
```
