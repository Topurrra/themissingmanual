---
title: "The Top Bar, Panels, and Toggles"
guide: "omarchy-menus-panels-and-cli"
phase: 2
summary: "Read the Omarchy top bar glyph by glyph, open the audio, network, Bluetooth, display, and power panels by hotkey, and flip modes like do not disturb, night light, and stay awake without opening a settings window."
tags: [omarchy, top-bar, panels, toggles, notifications, idle, screensaver, reminders, quickshell, beginner-friendly]
difficulty: beginner
synonyms: ["omarchy top bar explained", "omarchy wifi panel hotkey", "omarchy bluetooth panel", "omarchy audio panel volume mixer", "omarchy do not disturb", "omarchy night light toggle", "omarchy stay awake caffeine", "omarchy screensaver and lock timeout", "omarchy reminder timer", "how to move the omarchy bar", "omarchy notification history"]
updated: 2026-10-04
---

# The Top Bar, Panels, and Toggles

The strip along the top of the screen is the one part of Omarchy that is always visible, so it is worth knowing what every glyph does. On Windows it covers the taskbar and system tray, and on macOS the menu bar and Notification Center.

This phase shows how to read the bar, open the popups behind it with a hotkey instead of aiming at a tiny icon, and flip the day-to-day modes you would otherwise hunt through settings for.

## What the bar actually is

The bar is not a separate program bolted onto the desktop. It is part of the Omarchy shell, one long-running process that also draws the menu, the notifications, the volume and brightness popups, and the lock screen. That is why a panel opens instantly and why everything shares one theme.

By default the bar has three sections.

| Section | Default contents |
|---|---|
| **Left** | The Omarchy logo (opens the menu) and the workspace indicators |
| **Center** | Status indicators, the clock, the keyboard layout, the weather, and an update badge |
| **Right** | The system tray, agents, Bluetooth, network, audio, display, and power |

Some widgets only appear when they have something to say. The keyboard layout shows only if you configured more than one. The update badge, a circle arrow right of the clock, appears only when an Omarchy update is waiting. The agents icon appears the first time Omarchy finds AI coding usage on the machine.

## Clicking: the right and middle buttons matter

Most widgets do something on left click, right click, and middle click, and some react to scrolling. The right and middle buttons are where a lot of the useful behavior hides.

| Widget | Left | Right | Middle or scroll |
|---|---|---|---|
| Menu | Omarchy menu | New terminal | - |
| Clock | Calendar popup | Cycle the label format | Middle: timezone picker |
| Weather | Forecast popup | Full weather as a notification | Middle: refresh |
| Audio | Audio panel | Mute | Middle: panel. Scroll: volume |
| Network | Network panel | - | - |
| Bluetooth | Bluetooth panel | Toggle the radio | - |
| Display | Display panel | - | Scroll: brightness |
| Power | Power panel | Toggle the battery percentage | - |
| Tray | Hover to reveal the drawer | Right-click the chevron to manage | - |
| Omarchy update | Run the update | - | - |

The media and microphone widgets exist but are off by default. The Tailscale and Dropbox widgets only appear after you install those services from _Install > Service_.

## Panels: do the thing, do not only read it

Clicking an icon opens a **panel**: a popup with sliders and lists you can use with the keyboard. Each panel has a hotkey, so you never need to aim at a 16-pixel glyph.

| Hotkey | Panel | What you do there |
|---|---|---|
| `Super + Ctrl + A` | Audio | Master volume, pick the output device, and a per-app mixer |
| `Super + Ctrl + W` | Network | Scan Wi-Fi, see signal strength, connect, choose a DNS provider |
| `Super + Ctrl + B` | Bluetooth | See devices, connect or disconnect, read battery levels |
| `Super + Ctrl + D` | Display | Brightness, text size, monitor scaling presets, per-monitor controls |
| `Super + Ctrl + P` | Power | Battery stats, power profiles, system info |
| `Super + Ctrl + Alt + D` | Calendar | A month grid with ISO week numbers |
| `Super + Ctrl + 1-9` | The nth panel | Counts icons left to right in the right section, skipping the tray |

Inside any panel, the arrow keys move, `Return` activates, `Tab` steps to the neighbouring panel, and `Escape` closes it. The Power panel remembers a separate power profile for battery and for AC.

If you are used to separate Wi-Fi and Bluetooth tools from older Omarchy releases, they are gone in version 4. These panels replaced them, with NetworkManager doing the work underneath.

## Indicators: the glyphs that appear on their own

The cluster in the center of the bar is the **indicators** widget. It shows modes you switched on: do not disturb, night light, a queued reminder, an active screen recording, stay awake, and dictation. Inactive ones stay hidden until you hover the center of the bar, and clicking an active one turns that mode off.

To see them all the time, set `alwaysShow` to `true` on the indicators widget in your shell config, covered below.

## Toggles: modes, not settings

A lot of what you change day to day is not a setting. It is a mode you turn on for an hour: night light while you work late, do not disturb while you present. Omarchy calls these **toggles**. Each one has a hotkey, a menu entry, and a command, all hitting the same switch.

`Super + Ctrl + O` opens _Trigger > Toggle_ directly.

| Toggle | Hotkey | Command |
|---|---|---|
| Night light | `Super + Ctrl + N` | `omarchy toggle nightlight` |
| Silence notifications | `Super + Ctrl + ,` | `omarchy toggle notification silencing` |
| Stay awake (no idle lock) | `Super + Ctrl + I` | `omarchy toggle idle` |
| Menu bar | `Super + Shift + Space` | `omarchy toggle bar` |
| Screensaver | none | `omarchy toggle screensaver` |
| Crash capture | none | `omarchy toggle crash-capture` |

Touchpad, touchscreen, and hybrid GPU switches live under _Trigger > Hardware_ (`Super + Ctrl + H`), because they only matter when you own that hardware. The Toggle menu also carries battery percentage, workspace layout (`Super + L`), window gaps (`Super + Shift + Backspace`), and the one-window square aspect (`Super + Ctrl + Backspace`).

Most toggles are a flag file under `~/.local/state/omarchy/toggles/`. The flags are named for the **off** state, such as `screensaver-off`, so a file's presence means the feature is disabled.

### Night light

`Super + Ctrl + N` warms the screen to 4000K, and pressing it again returns it to 6500K. It uses hyprsunset, which the toggle starts for you. Out of the box, hyprsunset does nothing to your screen until you ask.

### Do not disturb, and where notifications go

`Super + Ctrl + ,` silences notifications. No pop-ups appear, and the crossed-out bell stays in the bar to remind you why things went quiet. Nothing is lost: silenced notifications are written to your notification history.

| Hotkey | Does |
|---|---|
| `Super + ,` | Dismiss the latest notification |
| `Super + Shift + ,` | Dismiss all notifications |
| `Super + Ctrl + ,` | Toggle silencing |
| `Super + Alt + ,` | Invoke the most recent notification |
| `Super + Shift + Alt + ,` | Open notification history |

Two kinds still get through while silencing is on: Omarchy's own confirmations for something you did a moment ago, such as "Theme changed", and critical alerts sent from the command line.

### Idle, the screensaver, and the lock screen

Idle timing lives in `~/.config/omarchy/shell.json` as a top-level `idle` block:

```json
{
  "version": 1,
  "idle": {
    "screensaver": 150,
    "lock": 300
  }
}
```

Both numbers are seconds counted from when you went idle, not from each other. With the defaults the screensaver starts after two and a half minutes and the lock screen takes over at five, whether or not the screensaver ran. Saving the file applies the new timings right away.

- `Super + Ctrl + I` turns **stay awake** on, so the machine stops locking on idle, and a coffee cup indicator appears. Press it again to return to normal. Use it before a long presentation.
- `Super + Ctrl + L` locks the computer immediately.
- The screensaver is ASCII art with random text effects, one per monitor, and any key exits it. _System > Screensaver_ starts it on demand, and `Super + Escape` opens the System menu directly.

Stay awake controls locking and the screensaver, not suspend or hibernation. Those have their own setup.

### Reminders and notices

Reminders are countdown timers with a message, delivered as a notification.

| Hotkey | Does |
|---|---|
| `Super + Ctrl + R` | Set a reminder |
| `Super + Ctrl + Alt + R` | See all reminders |
| `Super + Ctrl + Shift + R` | Clear all reminders |

From a terminal, the number is minutes: `omarchy reminder 7 'Tea ready'`.

Three **notices** put information on screen without opening anything: `Super + Ctrl + Alt + T` shows the date and time, `Super + Ctrl + Alt + B` shows the battery, and `Super + Ctrl + Alt + W` shows the weather. The weather location comes from your IP address, which can be off. Pin it with `omarchy weather location --set Malibu`, run `omarchy weather location` alone to see where it thinks you are, and add `--clear` to return to auto-detection.

## Rearranging the bar

You can change the bar without opening a file. Drag an empty patch of the bar toward another screen edge and it moves there. Double-left-click empty space to toggle transparency. Drag any widget to reorder it. The same options are in _Style > Menu Bar_.

The commands, from the manual:

```bash
omarchy bar position bottom
omarchy bar transparent toggle
omarchy bar move omarchy.clock --section center --index 0
omarchy bar set omarchy.clock format "HH:mm"
omarchy bar defaults
```

To add or remove a whole widget, list them with `omarchy plugin list`, then enable or disable by id:

```bash
omarchy plugin enable omarchy.media --section center
omarchy plugin disable omarchy.weather
```

`Super + Shift + Space` hides the bar and shows it again without stopping the shell, so panels and hotkeys keep working.

All of this is stored in `~/.config/omarchy/shell.json` under a `bar` key. A trimmed version:

```json
{
  "version": 1,
  "bar": {
    "position": "top",
    "transparent": false,
    "centerAnchor": "omarchy.clock",
    "layout": {
      "left": [{ "id": "omarchy.menu" }, { "id": "omarchy.workspaces" }],
      "center": [{ "id": "omarchy.clock", "format": "HH:mm" }],
      "right": [{ "id": "omarchy.audio" }, { "id": "omarchy.power" }]
    }
  }
}
```

⚠️ **Gotcha.** Once you have your own `shell.json`, it is canonical. Until you customize anything, the shell reads Omarchy's default file. The moment you drag a widget or run an `omarchy bar` command, your file takes over, and there is no merge with the defaults. New default widgets in future releases will not appear on your bar. `omarchy bar defaults` restores the shipped layout.

## Your turn: quiet the machine for a talk

You are about to present for an hour. You want no pop-ups, no screen locking, and a warm screen you can leave on. The three hotkeys are in the tables above.

```exercise
[
  {
    "type": "predict",
    "task": "Which hotkey silences notifications? Write it like `Super + Ctrl + X`.",
    "accept": ["/^super\\s*\\+\\s*ctrl\\s*\\+\\s*,$/i"],
    "hint": "It uses the comma key, and it is in the Notifications table."
  },
  {
    "type": "task",
    "task": "Turn on do not disturb and stay awake, confirm both indicators appear in the bar (hover the center if they are hidden), then turn both off again.",
    "reveal": "Super + Ctrl + , for silencing and Super + Ctrl + I for stay awake. Press each again to turn it off.",
    "checklist": ["Pressed the silencing hotkey and saw the crossed-out bell", "Pressed the stay awake hotkey and saw the coffee cup", "Turned both back off"]
  }
]
```

Check yourself before moving on:

```quiz
[
  {
    "q": "You set idle.screensaver to 150 and idle.lock to 300 in shell.json. When does the lock screen appear if you stay idle?",
    "choices": [
      "300 seconds after the screensaver ends",
      "300 seconds after you went idle",
      "450 seconds after you went idle"
    ],
    "answer": 1,
    "explain": "Both values count from the moment you went idle, not from each other.",
    "why": ["The values are not chained to each other.", null, "That would add the two numbers, but each is measured from the same start."]
  },
  {
    "q": "You drag a widget on the bar. Weeks later a new Omarchy release adds a default widget, but it never shows up. Why?",
    "choices": [
      "Dragging disabled updates for the bar",
      "Your own shell.json now replaces the defaults without merging",
      "Widgets can only be added from the menu"
    ],
    "answer": 1,
    "explain": "Once you have your own shell.json it is canonical. Run omarchy bar defaults for a clean slate."
  },
  {
    "q": "Which statement about do not disturb is correct?",
    "choices": [
      "Silenced notifications are deleted",
      "Silenced notifications go to the notification history",
      "Do not disturb blocks every notification, including Omarchy's own confirmations"
    ],
    "answer": 1,
    "explain": "Nothing is lost: history opens with Super + Shift + Alt + ,. Omarchy's own confirmations and critical command-line alerts still get through."
  }
]
```

## Recap

1. The bar is part of the Omarchy shell, with left, center, and right sections, and some widgets appear only when relevant.
2. Right and middle clicks, plus scrolling, hold much of the bar's behavior.
3. Panels open with `Super + Ctrl + A`, `W`, `B`, `D`, and `P`, and the arrows, `Return`, `Tab`, and `Escape` work inside them.
4. Toggles are modes: night light (`Super + Ctrl + N`), silencing (`Super + Ctrl + ,`), and stay awake (`Super + Ctrl + I`), each with a menu entry and a command.
5. Idle timings live in `shell.json`, and both numbers count from when you went idle.
6. Your own `shell.json` replaces the defaults entirely, and `omarchy bar defaults` resets it.

Next up, [The omarchy Command](03-the-omarchy-command.md): the same switches from the terminal, and how to explore them safely.
