---
title: "Timing and Interrupts"
guide: "embedded-c-from-zero"
phase: 5
summary: "Polling versus interrupts, and why busy-waiting wastes the CPU and misses fast events. What an interrupt service routine is and its rules, the volatile-flag pattern for sharing data with the main loop, why mechanical buttons bounce, and using a hardware timer instead of delay. A worked AVR external-interrupt example with ISR(INT0_vect), EIMSK, and sei() that runs in Wokwi."
tags: [embedded-c, interrupts, isr, timers, volatile, debouncing, avr, atmega328p, wokwi]
difficulty: intermediate
synonyms: ["polling vs interrupts", "what is an isr", "how do interrupts work in embedded", "volatile flag interrupt c", "how to debounce a button", "why does a button bounce", "avr external interrupt example", "int0 interrupt atmega328p", "hardware timer vs delay", "why keep an isr short", "what does sei do avr"]
updated: 2026-08-16
---
# Timing and Interrupts

At the end of phase 4 your program read a button by asking, over and over, "are you pressed yet?" That works, but it wastes the entire CPU doing nothing but asking, and if the interesting event is faster than your asking, you miss it. This phase is about the better way: let the hardware interrupt you the instant something happens, and let a timer keep time in the background so your CPU is free for real work.

## Polling versus interrupts

**Polling** is a loop that keeps checking: `while (1) { if (PIND & (1 << PD2)) ... }`. It is simple and predictable, but the processor is pinned to that check and can do nothing else useful. Worse, if you slip a delay into the loop (say, to blink an LED), a quick button tap that happens *during* the delay is gone - you were not looking.

An **interrupt** flips the relationship around. You tell the hardware "when this pin goes low, stop whatever you are doing and run this function." Then your main code gets on with its life, and the moment the event fires, the CPU pauses the main program, runs your handler, and resumes exactly where it left off. Nothing is missed, and no cycles are burned waiting.

```mermaid
flowchart LR
  A["Button press on PD2"] -->|falling edge| B["Hardware sets INT0 flag"]
  B -->|CPU pauses main| C["ISR(INT0_vect) runs"]
  C -->|sets volatile flag| D["button_pressed = 1"]
  D -->|loop checks it| E["Main loop toggles LED"]
```

📝 **Terminology.** The function the CPU jumps to is an **ISR**, an Interrupt Service Routine. Each interrupt source has a fixed slot called a **vector**; `INT0_vect` names the slot for external interrupt 0. You write an ISR with the `ISR(vector_name)` macro from `<avr/interrupt.h>`.

## The rules of an ISR

An ISR is not a normal function, and treating it like one is how beginners hang their boards. Three rules:

1. **Keep it short.** Do the bare minimum and return. An ISR usually runs with other interrupts held off, and while it runs your main program is frozen. A slow ISR delays everything.
2. **Never block inside it.** No `_delay_ms()`, no waiting on `Serial`, no long loops. Blocking in an ISR stalls the whole system, including the timers other features rely on.
3. **Do the real work in the main loop.** The ISR's job is to notice the event and record it. The loop reacts to it.

⚠️ **Gotcha.** `Serial.println()` inside an ISR is a classic trap - serial output is itself interrupt-driven, so printing from an ISR can deadlock or drop characters. Set a flag in the ISR and print from the loop.

## Sharing data: the `volatile` flag

So the ISR records the event and the loop reacts. They share a variable - and this is exactly where `volatile` from phase 2 earns its keep.

The compiler optimizes aggressively. Looking at `while (1) { if (button_pressed) ... }`, it sees nothing in the loop that changes `button_pressed`, so it may "helpfully" read the variable once, cache it in a CPU register, and never look at memory again. It cannot see that an ISR writes the variable behind its back. Result: the ISR sets the flag, the loop never notices, your button does nothing.

`volatile` tells the compiler "this can change out from under you - reload it from memory every single time." Any variable shared between an ISR and the main code must be `volatile`.

💡 **Key point.** The pattern behind almost every interrupt you will ever write: **the ISR sets a `volatile` flag and returns; the main loop sees the flag and does the work.** Small ISR, no surprises.

## A worked example: an interrupt-driven button

External interrupt **INT0** is wired to pin **PD2** on the ATmega328P. We arm it to fire on a falling edge (the moment a pull-up-held pin drops to ground, which is a button press), and each press toggles the LED.

```c
#include <avr/io.h>
#include <avr/interrupt.h>

volatile uint8_t button_pressed = 0;   // shared between the ISR and loop()

ISR(INT0_vect) {
    button_pressed = 1;                 // do the minimum: set a flag, return
}

void setup() {
    Serial.begin(9600);
    DDRB  |= (1 << PB5);                // on-board LED (pin 13) is an output
    DDRD  &= ~(1 << PD2);              // PD2 (INT0) is an input
    PORTD |=  (1 << PD2);              // enable its internal pull-up

    EICRA |= (1 << ISC01);             // INT0 triggers on a FALLING edge
    EIMSK |= (1 << INT0);              // unmask (enable) the INT0 interrupt
    sei();                             // turn on interrupts globally
}

void loop() {
    if (button_pressed) {
        button_pressed = 0;            // clear the flag first
        PORTB ^= (1 << PB5);           // toggle the LED
        Serial.println("press");
    }
    // the loop is free to do other work here, and never misses a press
}
```
```console
press
press
press
```

*What just happened:* each press pulls PD2 low, the hardware fires `INT0_vect`, and the ISR does one thing - sets `button_pressed`. The loop notices the flag, clears it, toggles the LED, and prints. The heavy work (the print) stays out of the ISR, and because the interrupt catches the press directly, the loop could be busy with anything else and still not miss it.

Two register details worth naming, both from the datasheet: `EICRA` (External Interrupt Control Register A) picks the trigger, where `ISC01 = 1` with `ISC00 = 0` means falling edge; `EIMSK` (External Interrupt Mask Register) has one enable bit per external interrupt, so `1 << INT0` switches INT0 on. Finally, `sei()` sets the global interrupt-enable bit - until you call it, no interrupt fires at all. Its opposite is `cli()`.

▶ **Try it:** start a new Arduino Uno project at [wokwi.com](https://wokwi.com), wire a pushbutton from pin 2 to GND, paste this in, and Run. Open the serial monitor and click the button - each click toggles the LED and logs a press.

## Why buttons bounce, and what to do

Run that example and you may see one click log two or three presses. Your code is fine - the button is not. A pushbutton is two metal contacts snapping together, and for a few milliseconds after they touch they physically chatter, bouncing open and closed several times before settling. Each bounce is a real falling edge, so your ISR fires several times for one human press.

The fix is **debouncing**: after the first edge, ignore further edges for a short window - roughly 20 to 50 ms, longer than the bounce but shorter than a human can press twice. The lazy, reliable version records the time of the last accepted press and rejects any new one that arrives too soon after it:

```c
if (button_pressed) {
    button_pressed = 0;
    unsigned long now = millis();
    if (now - last_press > 50) {       // 50 ms since the last accepted press
        last_press = now;
        PORTB ^= (1 << PB5);           // one toggle per real press
    }
}
```

That is enough to collapse the chatter back into one press. (Hardware debouncing with a small capacitor exists too, but a time window in software costs nothing and is usually all you need.)

## Timers: keeping time without `delay()`

`_delay_ms(500)` from phase 4 is a **busy-wait**: the CPU sits in a counting loop doing nothing for the whole half second. During that delay it cannot read a sensor, answer an interrupt promptly, or do anything else. For a first blink that is fine; for a real program it is dead weight.

A **hardware timer** is a counter built into the chip that ticks on its own, driven by the system clock, completely independent of your code. You configure it once, and it counts in the background while your CPU does other things. When it reaches a target it can fire an interrupt - so you get a steady heartbeat for free.

Here is Timer1 (the 16-bit timer) set to fire once per second and toggle the LED, with no `delay()` anywhere:

```c
#include <avr/io.h>
#include <avr/interrupt.h>

volatile uint8_t tick = 0;

ISR(TIMER1_COMPA_vect) {
    tick = 1;                          // heartbeat: set a flag, return
}

void setup() {
    DDRB   |= (1 << PB5);              // LED output
    TCCR1A  = 0;                       // normal operation, no output pins driven
    TCCR1B  = (1 << WGM12)             // CTC mode: count up to OCR1A, then reset
            | (1 << CS12) | (1 << CS10); // prescaler /1024
    OCR1A   = 15624;                   // 16MHz / 1024 = 15625 ticks per second;
                                       // 0..15624 is 15625 counts = exactly 1 s
    TIMSK1 |= (1 << OCIE1A);           // fire an interrupt on compare-match A
    sei();
}

void loop() {
    if (tick) {
        tick = 0;
        PORTB ^= (1 << PB5);           // toggle once per second
    }
    // loop stays responsive the whole time; the timer runs itself
}
```

The clock ticks at 16 MHz. The `/1024` prescaler slows the timer's counting to 15625 ticks per second, and counting 0 up to `OCR1A` (15624) and resetting takes exactly one second, at which point `TIMER1_COMPA_vect` fires. Same pattern as before: the ISR sets a flag, the loop acts. The difference from `delay()` is that the loop is never blocked - it is free every moment between ticks.

🪖 **War story.** A common first embedded project is a data logger that reads a sensor and blinks a status LED. Written with `delay()` for the blink, it drops readings every time the LED is mid-blink, and the bug hides because it only loses data half the time. Rebuilt with a timer interrupt for the blink and the main loop free for the sensor, the dropped readings vanish. Once you have felt that, you stop reaching for `delay()` in anything that has to do two things at once.

## Recap

1. **Polling** burns the CPU checking, and can miss events during a delay. **Interrupts** let the hardware call you the instant something happens, freeing the CPU in between.
2. An **ISR** must be short and never block. No `_delay_ms()`, no `Serial` printing, no long loops inside it.
3. Share data between an ISR and the loop through a **`volatile`** variable, or the compiler may cache it and never see the ISR's update.
4. The core pattern: **ISR sets a `volatile` flag and returns; the main loop reacts.**
5. On AVR, arm external interrupt INT0 (pin PD2) with `EICRA` for the edge, `EIMSK` to enable it, `sei()` to turn interrupts on, and handle it in `ISR(INT0_vect)`.
6. Mechanical buttons **bounce**: one press makes several edges. Debounce by ignoring further edges for ~20 to 50 ms.
7. A **hardware timer** counts in the background and can fire an interrupt on a schedule - a steady heartbeat that replaces blocking `delay()` and keeps the loop responsive.

You can now light pins, read pins, and react to the world the moment it changes without wasting a cycle. That is the core loop of embedded programming - everything else is more peripherals and the same three registers per feature, looked up in the datasheet.

### Check yourself

```quiz
[
  {
    "q": "Why must the shared flag in `ISR(INT0_vect) { button_pressed = 1; }` be declared `volatile`?",
    "choices": [
      "volatile makes the variable faster to access",
      "Without volatile the compiler may cache the flag in a register and never see the ISR's update",
      "volatile is required on every global variable in C",
      "It stops the ISR from firing more than once"
    ],
    "answer": 1,
    "explain": "The compiler cannot see the ISR change the flag, so it may read the value once and reuse it. volatile forces every access to hit memory, so the loop sees the ISR's write."
  },
  {
    "q": "Which line does NOT belong inside an interrupt service routine?",
    "choices": [
      "flag = 1;",
      "count++;",
      "_delay_ms(500);",
      "reading a register into a variable"
    ],
    "answer": 2,
    "explain": "An ISR should do the minimum and return fast. A 500 ms busy-wait freezes the whole program while it runs and can make other interrupts miss their events. Do slow work in the main loop."
  },
  {
    "q": "A mechanical button is pressed once but the press-counter jumps by three. What is the most likely cause?",
    "choices": [
      "The interrupt is disabled",
      "Contact bounce - the metal contacts chatter for a few milliseconds, firing several edges per press",
      "volatile was left off the counter",
      "The pull-up resistor is too strong"
    ],
    "answer": 1,
    "explain": "Mechanical contacts physically bounce when they close, producing several fast edges for a single press. Debouncing - ignoring further edges for roughly 20 to 50 ms - collapses them back into one press."
  }
]
```
