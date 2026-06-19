---
title: "USB & the Host/Device Model"
guide: "how-devices-connect"
phase: 1
summary: "USB has one host (the computer) in charge of many devices; plugging something in triggers enumeration — the host detects the device, asks what it is, and loads a driver. Hubs let one port branch into many, and USB's confusing names describe speed and a connector shape, not the same thing."
tags: [usb, host-controller, enumeration, drivers, usb-c, hubs, peripherals]
difficulty: intermediate
synonyms: ["how does usb work", "what is a usb host", "what is usb enumeration", "why is my usb device not recognized", "usb-c vs usb 3", "what is a usb hub", "is usb-c faster than usb-a", "what does usb 3.2 mean"]
updated: 2026-06-19
---

# USB & the Host/Device Model

USB is the port you've used more than any other, and probably understood the least — which is fine,
because for years it was *designed* to ask nothing of you. Push the connector in, a thing appears. But the
moment something *doesn't* appear — "USB device not recognized," a drive that mounts on one machine and
not another — that friendliness turns into a black box. This phase opens the box. The whole standard rests
on one lopsided relationship and one little ceremony, and once you've seen both, USB stops surprising you.

## The one big idea: a host in charge of devices

**What it actually is.** USB is not a connection between two equals. It is a connection between one boss
and its workers. The boss is the **host** — almost always the computer (more precisely, a chip in it
called the *host controller*). Everything you plug in is a **device**: the keyboard, the flash drive, the
webcam. The host starts every conversation; devices only ever answer.

📝 **Terminology.** *Host* = the side in charge (your computer). *Device* (sometimes *peripheral*) = the
thing plugged into it. The "B" in USB literally stands for "Bus" — a shared road that the host directs
traffic on. *Host controller* = the chip in the computer that runs that road.

**Why this matters.** This is why you can't normally plug two laptops together with a plain USB-A cable
and have them talk — both think they're the host, and a USB conversation needs exactly one. It's also why
a USB device does nothing until a host gives it power and starts asking questions. The device is patient
and dumb on purpose; all the intelligence about *what to do* lives on the host side.

```text
        ┌──────────────────────┐
        │      THE HOST        │   one boss: starts every conversation,
        │  (computer + its     │   supplies power, assigns addresses
        │   host controller)   │
        └──────────┬───────────┘
                   │ the bus (a shared road)
        ┌──────────┼───────────┐
        ▼          ▼           ▼
     ┌─────┐    ┌─────┐     ┌──────┐
     │ kbd │    │ usb │     │ web- │     many devices: they only answer,
     │     │    │drive│     │ cam  │     never start the conversation
     └─────┘    └─────┘     └──────┘
```

## What happens when you plug something in (enumeration)

**What it actually is.** The little ceremony between "you pushed the connector in" and "the thing works"
has a name: **enumeration**. It's the host noticing a new device, then interviewing it.

**What it does in real life.** The sequence is roughly always the same:

1. **Detection.** Electrically, the host notices a device has appeared on the port (a voltage on the data
   lines changes). This is the "bong" sound or the tray-icon flash.
2. **Reset and address.** The host resets the device to a known state and assigns it a number (an
   *address*) so it can be told apart from everything else on the bus.
3. **The interview (descriptors).** The host asks the device to describe itself. The device sends back
   **descriptors** — small data structures that say "I am vendor `0x05ac`, product `0x024f`, and I behave
   like a *keyboard*." (Those vendor/product IDs are how the system knows *exactly* what you plugged in.)
4. **Driver match.** Using that description, the operating system finds and loads the matching **driver** —
   the translator that knows how to talk to this kind of device. Now an app can use it.

📝 **Terminology.** *Descriptor* = the device's self-description (who made it, what it is, what it can do).
*Enumeration* = the whole detect → address → interview → match sequence. *Device class* = a standard
category (keyboard, mass storage, audio) so the OS can use a generic driver without needing one specific
to that exact model.

**A real example.** On Linux you can watch enumeration happen live. Plug in a flash drive and check the
kernel log:

```console
$ sudo dmesg --follow
[ 8842.1] usb 1-2: new high-speed USB device number 7 using xhci_hcd
[ 8842.3] usb 1-2: New USB device found, idVendor=0781, idProduct=5567
[ 8842.3] usb 1-2: Product: SanDisk Cruzer Blade
[ 8842.4] usb-storage 1-2:1.0: USB Mass Storage device detected
[ 8842.7] sd 6:0:0:0: [sdb] 30031872 512-byte logical blocks
```

*What just happened:* You watched the whole ceremony in five lines. The host (`xhci_hcd`, the host
controller driver) gave the new device a number (`7`), interviewed it and read its descriptors
(`idVendor`, `idProduct`, the product name), recognized it as the *mass storage* class, loaded the
`usb-storage` driver, and the drive showed up as a disk (`sdb`). "USB device not recognized" is this exact
sequence failing partway — usually at the interview or the driver-match step.

⚠️ **Gotcha — "not recognized" is rarely the cable's fault, but sometimes it is.** Enumeration needs the
*data* lines, not only power. A charge-only cable (very common with cheap cables and phone chargers) has
the power wires but skips or under-builds the data wires, so the device charges but never enumerates — it
looks dead. If a device powers on but is never detected, swapping to a known-good data cable is a real
first move, not superstition.

**Why this saves you later.** When a device "doesn't work," you now have a sequence to point at. Does it
get power (light on)? Then detection's fine — suspect the interview or driver. Is it detected on one
computer but not another? Then the hardware's fine — it's a missing or broken driver on the second
machine. You're no longer debugging a black box; you're asking which step of a known ceremony failed.

## Hubs and daisy-chaining: one port becomes many

**What it actually is.** A computer has only a handful of physical USB ports, but you can run far more
than a handful of devices. A **hub** is a device whose whole job is to split one upstream port into
several downstream ports. Plug a hub into the host, plug four things into the hub, and the host now sees
all four.

**What it does in real life.** Hubs nest. A port on your laptop can feed a hub, and a port on *that* hub
can feed another hub — this nesting is what "daisy-chaining" means in practice. The host doesn't lose
track: it still addresses and interviews every device individually, no matter how deep in the tree it
sits. Many things you don't think of as hubs *are* hubs internally — your monitor with USB ports on the
back, your keyboard with a passthrough port.

```text
   HOST
    │
    ▼
  ┌─────┐      a hub turns one upstream port into several downstream ones
  │ hub │──┬──────┬──────┬───────────┐
  └─────┘  ▼      ▼      ▼           ▼
         mouse   kbd   ┌─────┐     printer
                       │ hub │──┬────────┐      hubs nest: a hub can feed a hub
                       └─────┘  ▼        ▼
                              drive    webcam
```

⚠️ **Gotcha — power is shared, and it's the usual reason a chain "gets flaky."** A port supplies a limited
amount of power, and an *unpowered* (bus-powered) hub splits that one budget among everything hanging off
it. Plug a power-hungry device — a portable hard drive, some webcams — into an unpowered hub already
running a few things, and it may enumerate intermittently, disconnect under load, or never spin up. The
fix is a *powered* hub (one with its own wall adapter), which supplies its own power instead of rationing
the host's. There are also limits on how deeply you can nest hubs, but you'll hit a power problem long
before you hit that.

**Why this saves you later.** "It worked when it was the only thing plugged in" and "it disconnects when I
copy big files" are classic shared-power symptoms, not broken devices. Knowing hubs split one power budget
tells you to reach for a powered hub instead of replacing perfectly good hardware.

## The genuinely confusing part: USB naming and USB-C

This confuses *everybody*, including people who work with it daily, because the names mix up two things
that are unrelated. Take a breath; here's the untangling.

**Two separate questions live in the word "USB":**

- **What shape is the connector?** This is the physical plug: **USB-A** (the classic flat rectangle that
  only goes in one way after three tries), **USB-B** and **Micro-USB** (older, on printers and small
  devices), and **USB-C** (the small, reversible oval — it goes in either way up).
- **How fast can it move data, and what can it carry?** This is the *protocol / version* — USB 2.0, USB
  3.x, and so on — which sets the speed and capabilities.

The trap is assuming the shape tells you the speed. **It does not.** A USB-C *connector* might run a slow
USB 2.0 protocol underneath, or a fast one, or even carry an entirely different protocol. The shape and
the speed are decided separately.

📝 **Terminology.** *USB-C* is a **connector** (a plug shape), not a speed. When someone says "it's USB-C,"
they've told you what the plug looks like and *nothing* about how fast it is or what it can do. You have to
ask separately.

**The version names are a mess, on purpose-by-committee.** Over the years the fast-USB family was renamed
several times. The same generation of speed has, at different points, been labeled with different "USB
3.x" names; later branding shifted toward marketing names like **SuperSpeed USB** with a stated number
(for example, "SuperSpeed USB 5Gbps" or "10Gbps"). The practical upshot: **the version number on the box
is unreliable for telling you actual speed.** The number that's actually meaningful is the advertised data
rate (the "Gbps" figure), not the "3.x" label.

⚠️ **Gotcha — and this is the one that bites.** Because a USB-C port can hide any of several protocols, two
ports that *look identical* can behave completely differently. A USB-C port might carry:
- plain USB data (slow or fast),
- **DisplayPort** video (so the same port drives a monitor — this is "DP Alt Mode"),
- **Thunderbolt** (a faster protocol that uses the USB-C connector),
- **power delivery** (USB-PD) to charge a laptop.

…and a given port may support some of these and not others. This is why one USB-C port on a laptop drives
an external display and another, identical-looking one doesn't, or why one charges the laptop and another
won't. The plug shape promised you nothing; the *port's* capabilities are what matter.

**How to actually tell what you've got.** Don't trust the shape — look for the icon next to the port (a
display symbol means video out; a lightning/Thunderbolt bolt means Thunderbolt; an "SS" or a number means
the faster data rate) or check the device's spec sheet. When in doubt, the spec sheet is the only honest
source.

**Why this saves you later.** Half of all "but it's USB-C, why won't it…" frustration comes from
expecting the connector to imply a capability it never promised. Once you hold "shape and capability are
separate," you stop being surprised that two identical-looking ports do different things — and you know to
check the icon or spec instead of assuming.

## Recap

1. **One host, many devices.** USB is a boss/worker relationship: the host (your computer) starts every
   conversation, supplies power, and addresses each device. Devices only answer.
2. **Enumeration is the plug-in ceremony.** Detect → reset and address → interview (descriptors) → match a
   driver. "Not recognized" is this sequence failing partway, and a charge-only cable is a real cause.
3. **Hubs split one port into many** and nest freely, but they share *one* power budget — flakiness under
   load usually means you want a powered hub.
4. **Connector ≠ speed.** USB-C is a plug shape; the USB version/protocol is a separate question. The
   version names are genuinely confusing, and identical-looking USB-C ports can carry different things
   (data, video, Thunderbolt, power). Check the icon or spec, not the shape.

Next we go *inside* the case, where the heavy hardware lives — and where the connection model flips from
"slow and universal" to "fast and direct."

---

[← Guide overview](_guide.md) · [Phase 2: PCIe — the High-Speed Internal Highway →](02-pcie-the-internal-highway.md)
