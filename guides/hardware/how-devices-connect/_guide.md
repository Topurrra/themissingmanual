---
title: "How Devices Connect (USB, PCIe, GPUs & Peripherals)"
guide: "how-devices-connect"
phase: 0
summary: "How the outside world and expansion cards plug into a computer: the USB host/device model, the PCIe highway inside the case, and how GPUs and everyday peripherals present themselves to the system."
tags: [hardware, usb, pcie, gpu, peripherals, drivers, expansion-cards]
category: hardware
order: 5
difficulty: intermediate
synonyms: ["how does usb work", "what is pcie", "what are pcie lanes", "how does a gpu connect", "usb-c vs usb 3", "how does a computer detect a device", "what is a host controller", "how do peripherals connect"]
updated: 2026-06-19
---

# How Devices Connect (USB, PCIe, GPUs & Peripherals)

You've plugged in a thousand USB sticks, slotted a graphics card into a motherboard, or stared at a
device that *should* work and quietly didn't. Most of us treat the ports on a machine as magic holes:
push the connector in, hope a light comes on. When it works, great. When it doesn't - "device not
recognized," a GPU the system swears isn't there, a webcam that's invisible - you've got nothing to
reason with.

This guide gives you something to reason with. There are really only two ways the outside world reaches
the brain of a computer: a slow, friendly, universal door (USB) for the things you plug and unplug all
day, and a fast, internal highway (PCIe) for the heavy hardware that lives inside the case. Once you can
see those two paths - and the little translator (the *driver*) that sits at the end of each - every port,
slot, and "why won't this work" stops being mysterious.

## How to read this
- **Here to fix one thing?** If a device isn't being detected, start with [Phase 1: USB & the Host/Device Model](01-usb-and-the-host-device-model.md) - detection and drivers live there. If you're choosing a slot for a card, jump to [Phase 2: PCIe](02-pcie-the-internal-highway.md).
- **Want it to finally make sense?** Read in order. Phase 1 builds the mental model (host, device, enumeration, driver) that the later phases reuse.

## The phases
1. **[USB & the Host/Device Model](01-usb-and-the-host-device-model.md)** - the universal port: one *host* (the computer) in charge of many *devices*, how plugging something in leads to it being detected and a driver loaded, hubs and daisy-chaining, and the genuinely confusing USB naming and USB-C situation.
2. **[PCIe - the High-Speed Internal Highway](02-pcie-the-internal-highway.md)** - the expansion bus inside the case: *lanes* as parallel data paths, the slots on the motherboard, and what plugs in (GPUs, NVMe SSDs, network cards). Why lane count and generation matter.
3. **[GPUs & Peripherals](03-gpus-and-peripherals.md)** - why a GPU exists (massively parallel work: graphics, and now ML), how it connects and gets fed data, and a short tour of how everyday peripherals - keyboard, mouse, display, webcam - present themselves to the system.

> This is the *physical/electrical* side of how parts talk to each other. The story of how data actually
> travels between the CPU, RAM, and these buses lives in [How Data Moves Inside a Machine](/guides/how-data-moves-inside-a-machine);
> the software layer that turns "a device exists" into "an app can use it" is covered in
> [What an Operating System Is](/guides/what-an-operating-system-is).
