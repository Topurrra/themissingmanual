---
title: "A Peripheral Tour: PWM, Serial, and Sensors"
guide: "embedded-c-from-zero"
phase: 6
summary: "The three peripherals that connect a microcontroller to the real world: PWM to fake an analog output and dim an LED, UART serial as your firmware's printf and main debug tool, and the ADC to read an analog sensor - one clear ATmega328P example each."
tags: [embedded-c, pwm, analogwrite, uart, serial, adc, analogread, atmega328p, arduino-uno, wokwi, duty-cycle]
difficulty: intermediate
synonyms: ["what is pwm on arduino", "how does analogwrite work", "duty cycle explained", "how to print to serial monitor arduino", "what is uart", "serial monitor shows garbage", "how does an adc work", "analogread range 0 to 1023", "read a potentiometer arduino", "how to dim an led with pwm"]
updated: 2026-08-16
---

# A Peripheral Tour: PWM, Serial, and Sensors

You've made a pin go HIGH and LOW. That on/off control is the foundation, but the real world isn't only on and off - it's brightness, sound, temperature, position. This phase tours the three peripherals that bridge a digital chip to that analog world: PWM to fake an analog *output*, UART to talk back to your PC, and the ADC to read an analog *input*. One clear ATmega328P example each, not an encyclopedia.

## PWM: faking analog with a fast square wave

**What it actually is.** A digital pin has two voltages, 0 V and 5 V, nothing between. PWM (pulse-width modulation) fakes the in-between by switching between them very fast and varying how much of each cycle it spends HIGH. That fraction is the *duty cycle*: 50% duty (HIGH half the time) averages to 2.5 V, 25% duty averages to about 1.25 V. The pin never truly outputs 1.25 V - it flips between 0 and 5 so quickly that whatever it drives (an LED, a motor) responds to the average.

**Real behavior.** On the Uno, `analogWrite(pin, value)` does this for you. `value` runs 0 to 255 (8-bit), so `analogWrite(pin, 128)` is roughly 50% duty. Under the hood, one of the ATmega328P's hardware timers counts continuously and flips the pin at a compare point with no CPU involvement once it's set - the timer runs the waveform in the background while your code moves on. Only the pins marked with a tilde (`~`) on the board can do it: 3, 5, 6, 9, 10, and 11.

**Real example** - the classic LED fade on pin 9:

```c
int led = 9;
int brightness = 0;
int step = 5;

void setup() {
  pinMode(led, OUTPUT);
}

void loop() {
  analogWrite(led, brightness);   // 0 = off, 255 = full
  brightness += step;
  if (brightness <= 0 || brightness >= 255) {
    step = -step;                 // reverse direction at each end
  }
  delay(30);
}
```

The LED ramps up, then back down, forever. You wrote no timing loop to hold each brightness level - the timer hardware keeps the duty cycle steady between `analogWrite` calls.

▶ **Try it:** start a new Arduino Uno project at [wokwi.com](https://wokwi.com), wire an LED (through a resistor) from pin 9 to ground, paste this in, and Run. Watch it breathe.

⚠️ **Gotcha.** `analogWrite` is not a real analog voltage - it's a square wave averaged out. That's perfect for LEDs and motors, which don't care, but you cannot use it to feed something that needs a clean, steady voltage (an analog audio line, a sensor's reference) without an external filter. It's also a different scale from analog *input*: `analogWrite` takes 0-255, while `analogRead` (below) gives 0-1023. Two peripherals, two ranges - mixing them up is a rite of passage. One more: a hobby servo is *not* driven by `analogWrite`; it wants a 50 Hz pulse of a specific width, so you use the `Servo` library, which builds that signal for you.

**Why this saves you later.** Duty cycle is the whole idea behind LED dimming, motor speed control, and class-D audio. Once you see analog output as "a fast switch plus an average," every one of those stops being mysterious.

## UART (serial): your firmware's printf

**What it actually is.** UART (universal asynchronous receiver/transmitter) sends bytes one bit at a time down a wire, with both ends agreeing in advance on the speed - the *baud rate*. On the Uno the chip's UART is bridged through the onboard USB chip to your PC, so anything the firmware "prints" appears in the Arduino Serial Monitor. This is the single most important debugging tool you have on a microcontroller: it's how you *see* what the firmware is doing when you can't attach a debugger.

**Real behavior.** `Serial.begin(9600)` starts the UART at 9600 baud. `Serial.print` and `Serial.println` send text. The Serial Monitor on your PC must be set to the *same* baud, or you get garbage.

**Real example:**

```c
int count = 0;

void setup() {
  Serial.begin(9600);
  Serial.println("Booting up");
}

void loop() {
  Serial.print("count = ");
  Serial.println(count);
  count++;
  delay(1000);
}
```

Open the Serial Monitor and you see:

```console
Booting up
count = 0
count = 1
count = 2
count = 3
```

*What just happened:* the firmware sent each line over the UART, one character at a time at 9600 baud, and the USB bridge relayed it to your PC. That `count` value is coming from a chip with no screen - the serial line is its only voice.

⚠️ **Gotcha.** If the Serial Monitor's baud does not match `Serial.begin`, you see gibberish like `x??B?@?` instead of text. The bytes arrived fine; the two ends only disagreed on speed. Also: the UART is physically pins 0 (RX) and 1 (TX) on the Uno, so if you use `Serial`, don't also wire those pins for something else - you'll get corrupted output or a failed upload.

**Why this saves you later.** Most embedded debugging is a well-placed print. When a sensor reads wrong or a state machine sticks, a `Serial.println` at the right spot tells you what the chip actually saw - the embedded version of the print debugging you already know, and often the only window you get.

## ADC: reading the analog world

**What it actually is.** The analog-to-digital converter is PWM's mirror image: it takes a real voltage on a pin and turns it into a number your code can read. The ATmega328P's ADC is 10-bit, so it maps the 0 V to 5 V range onto the integers 0 to 1023. A potentiometer at its midpoint sits near 2.5 V, which reads about 512.

**Real behavior.** `analogRead(A0)` samples pin A0 and returns that 0-1023 number. The Uno exposes six analog inputs, A0 through A5. To turn the raw number back into volts, scale by the reference voltage: `raw * (5.0 / 1023.0)`.

**Real example** - read a potentiometer and report it over serial:

```c
void setup() {
  Serial.begin(9600);
}

void loop() {
  int raw = analogRead(A0);              // 0..1023
  float volts = raw * (5.0 / 1023.0);
  Serial.print("raw = ");
  Serial.print(raw);
  Serial.print("  volts = ");
  Serial.println(volts);
  delay(500);
}
```

Turn the knob and the numbers track it:

```console
raw = 0     volts = 0.00
raw = 512   volts = 2.50
raw = 1023  volts = 5.00
```

*What just happened:* the ADC sampled the wiper voltage and quantized it to one of 1024 steps; your code scaled that back to a readable voltage. This is how every analog sensor - a temperature probe, a light sensor, a joystick - gets into your program.

▶ **Try it:** start a new Arduino Uno project at [wokwi.com](https://wokwi.com), add a potentiometer, wire its outer pins to 5V and GND and its middle pin to A0, paste this in, and Run. Drag the knob and watch the readings move.

```mermaid
flowchart LR
  POT[Potentiometer<br/>0 to 5 volts] --> ADC[ADC<br/>sample and quantize]
  ADC --> NUM[Number 0 to 1023]
  NUM --> CODE[Your code]
```

⚠️ **Gotcha.** An analog pin with nothing connected does not read 0 - it *floats*, picking up ambient noise and giving you drifting, random-looking values. If a reading makes no sense, check the wiring before you blame the code. And keep the scales straight: input is 0-1023, output (`analogWrite`) is 0-255.

**Why this saves you later.** Every sensor that reports a level rather than a yes/no - temperature, light, pressure, a slider - reaches your code through an ADC. Understanding "voltage in, integer out, scaled by a reference" is the key that unlocks all of them.

## Recap

1. **PWM** fakes an analog output by switching a pin between 0 and 5 V fast; the *duty cycle* (fraction of time HIGH) sets the average. `analogWrite(pin, 0..255)` on pins 3, 5, 6, 9, 10, 11.
2. **UART / serial** sends bytes to your PC at an agreed baud rate; `Serial.begin` plus `Serial.print` is your firmware's `printf` and primary debug window.
3. Both ends of a serial link must agree on baud, or the text arrives as garbage.
4. **ADC** turns a pin voltage into a number - 10-bit means 0-1023 for 0-5 V on the ATmega328P; scale with `raw * (5.0 / 1023.0)`.
5. Watch the scales: analog **in** is 0-1023, PWM **out** is 0-255.

Check the three ideas most likely to bite you:

```quiz
[
  {
    "q": "On the Uno, `analogWrite(9, 64)` makes pin 9 do what?",
    "choices": [
      "Output a steady 1.25 V from a built-in analog converter",
      "Switch between 0 V and 5 V fast, HIGH about 25% of each cycle, averaging near 1.25 V",
      "Read the analog voltage on pin 9 and return 64",
      "Go fully HIGH, because any non-zero value means on"
    ],
    "answer": 1,
    "explain": "analogWrite sets a PWM duty cycle from 0 to 255. 64 out of 255 is about 25%, so the pin is HIGH a quarter of each cycle and averages near 1.25 V. There is no real digital-to-analog converter here - it's a fast square wave, and whatever it drives responds to the average."
  },
  {
    "q": "Your Serial Monitor shows `?H?@?x` instead of readable text. Most likely cause?",
    "choices": [
      "The USB cable is charge-only and cannot carry data",
      "The Monitor's baud rate does not match the value you passed to Serial.begin()",
      "You forgot to call analogRead() first",
      "The ATmega328P has run out of flash"
    ],
    "answer": 1,
    "explain": "Garbled characters are the classic symptom of a baud mismatch. The bytes arrive fine, but the two ends disagree on speed. Set the Monitor to the same baud you passed to Serial.begin (9600 here)."
  },
  {
    "q": "`analogRead(A0)` on the ATmega328P returns a value in what range, and why?",
    "choices": [
      "0 to 255, because the ADC is 8-bit",
      "0 to 1023, because the ADC is 10-bit (2^10 = 1024 steps)",
      "0 to 5, matching the input voltage in volts",
      "0.0 to 5.0 as a float, straight from the pin"
    ],
    "answer": 1,
    "explain": "The AVR ADC is 10-bit, so it maps the input range onto 1024 integer steps, 0 through 1023. To get volts back you scale it yourself: raw * (5.0 / 1023.0)."
  }
]
```
