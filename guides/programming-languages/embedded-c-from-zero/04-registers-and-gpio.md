---
title: "Talking to Hardware: Registers and GPIO"
guide: "embedded-c-from-zero"
phase: 4
summary: "What a hardware register actually is - a memory address wired to physical pins - and how to use one. Blink an LED and read a button on the AVR ATmega328P with DDRx, PORTx, and PINx, why floating inputs read noise, and how the internal pull-up resistor fixes it. Runs in the free Wokwi simulator."
tags: [embedded-c, registers, gpio, avr, atmega328p, ddr, port, pull-up, arduino, wokwi]
difficulty: intermediate
synonyms: ["what is a hardware register", "how to blink an led in c", "avr gpio tutorial", "ddrb portb pinb explained", "how to read a button in c avr", "why use a pull-up resistor", "internal pull-up avr", "what are memory mapped registers", "atmega328p gpio example", "arduino register level programming"]
updated: 2026-08-16
---
# Talking to Hardware: Registers and GPIO

In phase 3 you learned to flip individual bits in a number. Now the payoff: on a microcontroller, some of those numbers are not ordinary variables. They are **registers**, and flipping a bit in one moves real voltage on a real pin. This is where C stops being about data on a screen and starts controlling the physical world.

We will use the AVR ATmega328P, the chip on an Arduino Uno, because its registers are simple, well documented, and you can run every example in this phase for free in [Wokwi](https://wokwi.com), an in-browser simulator, without owning any hardware.

## What a register actually is

A hardware register is a fixed memory address that the chip's designers wired directly to a piece of hardware. When your C code writes a byte to that address, you are not storing data for later - you are setting the state of the circuitry connected to it. Read from that address and you are sampling the actual voltage on the pins.

On the ATmega328P, the register named `PORTB` lives at data address `0x25`. Write a bit there and a physical pin changes. That is the whole idea:

```mermaid
flowchart LR
  A["Your code sets bit PB5 in PORTB"] -->|write| B["Data address 0x25 = PORTB"]
  B -->|latches bit 5| C["Port B output driver"]
  C -->|drives 5V| D["Physical pin 13 (PB5)"]
  D -->|current flows| E["On-board LED lights"]
```

📝 **Terminology.** A **GPIO** pin is a General-Purpose Input/Output pin: one you control from software, as either an output (you set its voltage) or an input (you read its voltage). The ATmega328P groups its GPIO pins into **ports** named B, C, and D, and each port has three registers that control it.

## The three registers behind every port

For any port `x` (B, C, or D), you get three registers, and phase 3's bit operations are exactly how you drive them:

- **`DDRx`** - the Data Direction Register. A `1` bit makes that pin an **output**; a `0` bit makes it an **input**. This is the first thing you set.
- **`PORTx`** - for an output pin, the bit you write here is the level: `1` drives it high, `0` drives it low. For an *input* pin, writing `1` here enables that pin's internal pull-up resistor (more on that below).
- **`PINx`** - read this to sample the actual voltage on the pins right now. This is how you read a button.

You find these names, and every bit inside them, in the chip's **datasheet** - the ATmega328P datasheet has a register summary and a chapter per peripheral. That document is the source of truth for embedded work. Nobody memorizes it; you learn to look things up in it.

## Hello, world: blink the on-board LED

The Arduino Uno has an LED soldered to pin 13, which the AVR calls **`PB5`** (bit 5 of port B). Blinking it is the embedded equivalent of printing "hello, world."

```c
#include <avr/io.h>
#include <util/delay.h>

void setup() {
    DDRB |= (1 << PB5);        // PB5 is an OUTPUT (Uno pin 13, the on-board LED)
}

void loop() {
    PORTB |= (1 << PB5);       // drive PB5 high: LED on
    _delay_ms(500);
    PORTB &= ~(1 << PB5);      // drive PB5 low: LED off
    _delay_ms(500);
}
```

`setup()` runs once at power-up and `loop()` runs forever after - they are the two functions the AVR's startup code calls for you. In a from-scratch bare-metal program you would write the same thing as `int main(void)` with the setup at the top and the blink inside a `while (1)` loop; `setup` and `loop` are that split into two named functions. The register code inside is identical either way. The names `PB5`, `DDRB`, and `PORTB` come from `<avr/io.h>`.

▶ **Try it:** start a new Arduino Uno project at [wokwi.com](https://wokwi.com), paste this in, and Run. The on-board LED blinks once a second, no wiring needed.

## Reading a button, and why inputs need help

Now flip the direction and read a pin. Wire a pushbutton from pin **PD2** to ground. To read it you configure PD2 as an input, then sample `PIND`:

```c
#include <avr/io.h>

void setup() {
    DDRB  |= (1 << PB5);       // LED output, as before
    DDRD  &= ~(1 << PD2);      // PD2 is an INPUT (the button)
    PORTD |=  (1 << PD2);      // enable the internal pull-up on PD2
}

void loop() {
    if (PIND & (1 << PD2)) {   // pull-up holds this HIGH while the button is open
        PORTB &= ~(1 << PB5);  // not pressed: LED off
    } else {
        PORTB |=  (1 << PB5);  // pressed (pin pulled to ground): LED on
    }
}
```

Notice the logic looks inverted: the LED turns on when the read is *low*. That is because of the pull-up, and here is why it has to be there.

An input pin is extremely high-impedance - it barely draws any current, so it is happy to float. If a pin is configured as an input and nothing is actively driving it (the button is open, connecting it to nothing), its voltage drifts with stray electrical noise from nearby wires, your hand, the power supply. Read it and you get unpredictable 1s and 0s. A **floating input reads garbage.**

⚠️ **Gotcha.** A disconnected input is not a reliable 0. It is a floating antenna. If your button "works sometimes" or triggers on its own, an unconnected or un-pulled input is the first suspect.

The fix is a **pull-up** (or pull-down) resistor: a resistor that gently ties the pin to a known level when nothing else is driving it. With a pull-up, the pin sits **high** by default; press the button to connect it to ground and it goes **low**. The ATmega328P has a pull-up resistor built into every pin - you enable it by writing a `1` to the pin's `PORTx` bit while the pin is an input, which is what `PORTD |= (1 << PD2)` does above. That one line saves you from soldering an external resistor.

▶ **Try it:** in the same Wokwi project, add a pushbutton connected from pin 2 to GND, paste this in, and Run. Hold the button and the on-board LED lights; release it and the LED goes off.

## Recap

1. A **register** is a memory address wired to hardware. Writing it moves real voltage on a pin; reading it samples real voltage.
2. Each AVR port has three registers: **`DDRx`** sets direction (1 = output, 0 = input), **`PORTx`** sets an output's level (or enables an input's pull-up), and **`PINx`** reads the pins.
3. On the Uno, the on-board LED is **`PB5`** (pin 13). `DDRB |= (1 << PB5)` makes it an output; `PORTB |= (1 << PB5)` turns it on.
4. To read a button: `DDRD &= ~(1 << PD2)` makes PD2 an input, then test `PIND & (1 << PD2)`.
5. A floating input reads noise. A **pull-up** ties it to a known level; enable the AVR's internal one with `PORTD |= (1 << PD2)`, which makes an idle button read HIGH and a press read LOW.
6. The **datasheet** is where every register name and bit lives. Look things up; do not memorize.

You can now light a pin and read a pin. Phase 5 makes the reading efficient: instead of asking the button "are you pressed yet?" a million times a second, you let the hardware tell you the instant it happens.

### Check yourself

```quiz
[
  {
    "q": "What does `DDRB |= (1 << PB5);` do?",
    "choices": [
      "Sets PB5 high",
      "Configures PB5 as an output pin",
      "Reads the current state of PB5",
      "Enables the pull-up on PB5"
    ],
    "answer": 1,
    "explain": "DDRB is the data-direction register for port B. A 1 makes that pin an output; a 0 makes it an input. It sets direction, not level.",
    "why": [
      "PORTB, not DDRB, sets the output level once the pin is an output.",
      null,
      "PINB reads the pin; DDRB only sets its direction.",
      "The pull-up is enabled through PORTB while the pin is an input, not through DDRB."
    ]
  },
  {
    "q": "A pin is configured as an input with nothing connected to it. Why might reading it give random 1s and 0s?",
    "choices": [
      "The datasheet must be wrong",
      "The pin is floating - with no pull-up or pull-down it drifts with electrical noise",
      "Inputs always read zero",
      "You forgot to delay before reading"
    ],
    "answer": 1,
    "explain": "A floating input drives nothing and is driven by nothing, so its voltage wanders with stray noise and reads unpredictably. A pull-up or pull-down ties it to a known level."
  },
  {
    "q": "With the internal pull-up enabled on PD2 and a button wired from PD2 to ground, what does `PIND & (1 << PD2)` read when the button is NOT pressed?",
    "choices": [
      "Zero (LOW)",
      "Nonzero (HIGH), because the pull-up holds the pin high until the button grounds it",
      "It is undefined",
      "It depends on the value of DDRB"
    ],
    "answer": 1,
    "explain": "The pull-up holds the pin HIGH while the button is open, so the read is nonzero. Pressing connects the pin to ground, pulling it LOW. This is why button logic often looks inverted."
  }
]
```
