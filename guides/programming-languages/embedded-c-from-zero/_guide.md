---
title: "Embedded C From Zero"
guide: "embedded-c-from-zero"
phase: 0
summary: "Learn embedded C from zero: program a microcontroller and write bare-metal firmware for the AVR ATmega328P (Arduino Uno). Registers, GPIO, volatile, bit manipulation, interrupts, timers, PWM, and serial - read along and run every example in Wokwi, a free in-browser simulator, no hardware needed."
tags: [embedded, c, microcontrollers, firmware, bare-metal, avr, atmega328p, arduino, gpio, registers, interrupts, wokwi]
category: programming-languages
order: 10
difficulty: intermediate
synonyms: ["how to program a microcontroller in c", "what is embedded c", "learn embedded c from scratch", "bare metal c programming", "how to blink an led in c", "avr atmega328p programming", "what does volatile do in embedded c", "embedded c vs regular c", "how to write firmware in c", "arduino c without the arduino library", "microcontroller programming tutorial", "how to simulate arduino in the browser"]
updated: 2026-08-16
---

# Embedded C From Zero

You already know C. You compiled it, wrangled pointers, and watched `malloc` hand you memory. Embedded C is that same language pointed at a completely different kind of machine: a chip the size of a fingernail, with no operating system under it, a couple of kilobytes of RAM, and no screen to print to. You do not run your program *on* the chip so much as *become* the chip's entire software. There is nothing else running.

That sounds intimidating and turns out to be freeing. On a desktop, a dozen layers sit between your code and the hardware. Here there are none. When you want a pin to go high, you write a number to a memory address and the voltage on a physical leg of the chip changes. No driver, no system call, no permission check. Direct control is the whole reason people love embedded work, and the reason a two-dollar microcontroller can run a coffee machine, a drone, or a pacemaker.

We teach this the way real firmware gets written: read the code, understand the mechanism. But reading is not all you will do. Embedded C targets real chips, so we target one - the **AVR ATmega328P**, the chip on the Arduino Uno. Its registers are real bare-metal C, and every example runs in **Wokwi**, a free in-browser simulator. You will blink your first LED in a browser tab, no hardware, no purchase, in about a minute.

## Prerequisite

This guide assumes the C from [C From Zero](/guides/c-from-zero): variables, types, pointers, and how a program is compiled. If that feels rusty, read it first - embedded C is unforgiving of half-remembered pointers. It also helps to know roughly how a machine is built underneath. [How a Computer Works](/guides/how-a-computer-works) and [CPU, RAM & Storage](/guides/cpu-ram-and-storage) give you the mental picture of CPU, memory, and buses that a microcontroller makes concrete and touchable.

## How to read this

- **Read the phases in order.** Each one builds on the last. The early phases rewire how you think about "a program"; the later ones put real peripherals under your control.
- **Keep a Wokwi tab open.** When you hit a "Try it" line, run the example. Seeing an LED blink because *you* wrote to a register teaches more than any paragraph can.
- **C rusty?** Detour through [C From Zero](/guides/c-from-zero) first, then come back here.

## The phases

1. **[What "Embedded" Even Means](01-what-embedded-even-means.md)** - bare metal, tiny memory, and the super-loop that never exits.
2. **[The C That Changes](02-the-c-that-changes.md)** - fixed-width types, `volatile`, why `malloc` is avoided, and the memory map.
3. **[Bit Manipulation, Properly](03-bit-manipulation.md)** - setting, clearing, and testing single bits, the daily language of hardware.
4. **[Talking to Hardware: Registers and GPIO](04-registers-and-gpio.md)** - what a register really is, and driving and reading pins with `DDRB`, `PORTB`, and `PINB`.
5. **[Timing and Interrupts](05-timing-and-interrupts.md)** - doing things on time without blocking, and letting the hardware call you back.
6. **[A Peripheral Tour: PWM, Serial, and Sensors](06-a-peripheral-tour.md)** - dimming an LED, talking over UART, and reading the outside world.
7. **[The Toolchain and the Real Workflow](07-the-toolchain-and-workflow.md)** - compilers, flashing, and how firmware actually gets onto a chip.
8. **[Where to Go Next](08-where-to-go-next.md)** - other chips, real-time operating systems, and what to build so it sticks.

> This guide takes you from zero to real firmware on one chip. Deeper ground - a real-time operating system in depth, DMA, low-power and sleep modes, and the jump to 32-bit ARM (STM32) - is a natural follow-up once the fundamentals here are solid.
