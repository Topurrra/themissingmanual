---
title: "Keyboard, Mouse, and Screens"
guide: "making-omarchy-comfortable"
phase: 3
summary: "Set your keyboard layout and repeat rate, trackpad scrolling, and monitor scaling in input.lua and monitors.lua, including the Caps Lock surprise and the two numbers that fix tiny text on a 4K screen."
tags: [omarchy, hyprland, input-lua, monitors-lua, keyboard-layout, trackpad, scaling, hidpi]
difficulty: intermediate
synonyms: ["omarchy natural scrolling", "omarchy keyboard layout", "omarchy caps lock not working", "omarchy monitor scaling", "omarchy text too small 4k", "omarchy key repeat rate", "omarchy multiple monitors", "omarchy touchpad right click", "omarchy use alt as super"]
updated: 2026-10-04
---

# Keyboard, Mouse, and Screens

These are the settings you notice in the first hour: scrolling feels backwards, Caps Lock does something odd, the text is microscopic on a sharp monitor. All of it lives in two files, `~/.config/hypr/input.lua` and `~/.config/hypr/monitors.lua`. Open them with `Super + Space`, then _Setup > Input_ and _Setup > Monitors_.

## What Omarchy sets for you

Omarchy's defaults for input are worth knowing, because your file only needs to list what you want different:

- **Layout**: read from the system keyboard setting in `/etc/vconsole.conf` (`XKBLAYOUT`), or `us` when none is set.
- **Key repeat**: `repeat_rate = 40` and `repeat_delay = 250`. The delay is how many milliseconds a key is held before it starts repeating, and the rate is how many repeats per second follow.
- **Touchpad**: `natural_scroll = false`, two-finger click for right-click (`clickfinger_behavior = true`), and `scroll_factor = 0.4`.
- **Mouse**: `sensitivity = 0`, and `follow_mouse = 1`, which moves window focus to whatever is under the pointer as you move it (no click needed).
- **Caps Lock**: this one catches Windows and macOS users. The default `kb_options` is `compose:caps,shift:both_capslock_cancel`, which turns the Caps Lock key into the **compose key**. Pressing it, then a short sequence, types special characters, and Omarchy's `~/.XCompose` file defines quick-access emoji and name or email autocomplete on top. The real Caps Lock moved to pressing **both Shift keys together**, and the `_cancel` part releases it on the next lone Shift, so an accidental press fixes itself.

> ⚠️ **Gotcha**: `kb_options` is a single string. If you write your own, it replaces the default string entirely. Anything you want to keep from the default (`compose:caps`, `shift:both_capslock_cancel`) must be repeated in yours.

## input.lua in practice

Here is the manual's example, with each line explained. Uncomment or add only what you want:

```lua
hl.config({
  input = {
    -- Two layouts, switched with Left Alt + Right Alt.
    kb_layout = "us,dk",
    kb_options = "compose:caps,shift:both_capslock_cancel,grp:alts_toggle",

    -- Key repeat: wait 600 ms, then 40 repeats per second.
    repeat_rate = 40,
    repeat_delay = 600,

    -- Pointer speed (0 is the default).
    sensitivity = 0.35,

    touchpad = {
      -- Natural (inverse) scrolling, like a phone or a Mac.
      natural_scroll = true,

      -- Two-finger click for right-click.
      clickfinger_behavior = true,

      -- Scrolling speed.
      scroll_factor = 0.3,
    },
  },
})

-- Scroll faster in the terminal.
o.window("(Alacritty|kitty|foot)", { scroll_touchpad = 1.5 })
```

Most people want a much shorter file. Natural scrolling alone is this:

```lua
hl.config({
  input = {
    touchpad = {
      natural_scroll = true,
    },
  },
})
```

Other options from Omarchy's template file, all commented out until you remove the `--`:

- `accel_profile = "flat"` turns off mouse acceleration.
- `numlock_by_default = true` starts with Num Lock on (already the default).
- `touchpad.disable_while_typing = false` keeps the touchpad live while you type.
- `kb_variant = "intl"` selects a keyboard variant, such as the international one.

The full list of options is on the [Hyprland wiki's input page](https://wiki.hypr.land/Configuring/Basics/Variables/#input). Touchpad gestures work too. This line makes a three-finger horizontal swipe change workspaces:

```lua
hl.gesture({ fingers = 3, direction = "horizontal", action = "workspace" })
```

### Two layouts, one trap

Once you list more than one layout, a keyboard-layout widget appears in the bar. Put a Latin layout first. Omarchy's own default input file explains why: Hyprland matches keybindings against the first layout in `kb_layout`, not the one that is active right now, so `Super + W` and friends only fire when a Latin layout leads. If you installed with a layout that cannot type Latin letters, Omarchy adds `us` in front for you.

### Using Alt as Super

On some keyboards the Windows or Command key is awkward to hold. The manual's fix swaps Alt and Super, and it keeps the default compose and Caps Lock options in the same string:

```lua
hl.config({
  input = {
    kb_options = "compose:caps,shift:both_capslock_cancel,altwin:swap_alt_win",
  },
})
```

### Typing Chinese or Japanese

Omarchy already runs the fcitx5 input framework in every session. Install an engine such as `fcitx5-mozc` (Japanese) or `fcitx5-chinese-addons` (Chinese) with `omarchy pkg add`, plus `fcitx5-configtool` to add it to your input methods.

## Screens: scale is one idea

Omarchy assumes a high-density screen, what the manual calls a 2x retina-class display (218 pixels per inch or more). On such a screen, a scale of 2 draws everything twice as large, so text is crisp and readable. On a 27-inch 4K monitor that is too big, and on a 1080p monitor it would be enormous. Two numbers at the top of `monitors.lua` fix it:

```lua
local omarchy_gdk_scale = 2
local omarchy_monitor_scale = "auto"

hl.env("GDK_SCALE", tostring(omarchy_gdk_scale))
hl.monitor({ output = "", mode = "preferred", position = "auto", scale = omarchy_monitor_scale })
```

`omarchy_monitor_scale` is Hyprland's scale for the screen itself, and `"auto"` lets it choose. `GDK_SCALE` tells GTK apps how big to draw, and GTK only honors whole numbers, so keep it at the nearest integer of your scale. The last line applies to every monitor that has no rule of its own, because its output name is empty.

The manual's recommendations:

| Your screen | `omarchy_gdk_scale` | `omarchy_monitor_scale` |
|---|---|---|
| 27 or 32 inch 4K | `2` | `1.6` |
| 1080p or 1440p | `1` | `1` |
| 218 PPI or more (such as a 27 inch 5K) | `2` | `"auto"` (the default) |

`GDK_SCALE` only applies to apps you start after the change. Quit the oversized windows and reopen them, or press `Ctrl + Alt + Delete` to close every window.

To try a scale without editing a file, press `Super + /` to step up through 1, 1.25, 1.6, 2, 3, and 4, and `Super + Alt + /` to step down. With the default configuration the change survives a reboot. The command-line version is `omarchy hyprland monitor scaling 1.6`, or `up` and `down`.

### Text only

Scaling changes the size of everything. If only the text is wrong, use one command:

```console
$ omarchy display text size 14
```

*What just happened:* the Omarchy shell, GTK apps, and your terminal all moved to a 14 pixel text size together, so the desktop stays in proportion. Sizes run from 9 to 20. Without an argument it shows the current size, and `omarchy display text size reset` goes back to the default. Foot cannot reload its config, so terminals that are already open keep their old size until you open a new one.

### More than one screen

An external monitor extends your desktop by default. Mirror it with `Super + Ctrl + Alt + Delete` (or _Trigger > Hardware_), which is useful for a projector. With the screens extended, closing the laptop lid turns the internal display off. Toggle it yourself with `Super + Ctrl + Delete`.

For a specific monitor, list what Hyprland sees, then add a rule to `monitors.lua`:

```console
$ hyprctl monitors all
```

```lua
-- A 1440p monitor at 144 Hz, placed at the origin.
hl.monitor({ output = "DP-2", mode = "2560x1440@144", position = "0x0", scale = 1 })

-- A portrait (rotated) monitor: transform 1 is 90 degrees, 3 is 270.
hl.monitor({ output = "DP-2", mode = "preferred", position = "auto", scale = 1, transform = 1 })
```

Use the output name that `hyprctl monitors all` prints (`DP-2` is an example). The brightness keys adjust the display you are focused on, external monitors that speak DDC/CI included. Hold `Shift` for maximum or minimum, or `Alt` for 1 percent steps.

## Your turn: fix your screen and your scroll

```exercise
[
  {
    "type": "predict",
    "task": "You have a 27-inch 4K monitor. What value does the manual recommend for omarchy_monitor_scale?",
    "accept": ["1.6"],
    "hint": "It is a fractional scale between 1 and 2."
  },
  {
    "type": "predict",
    "task": "Type the command that sets the text size to 14 across the shell, GTK apps, and your terminal.",
    "accept": ["/^omarchy[ -]display[ -]text[ -]size\\s+14$/i"],
    "hint": "It starts with omarchy display text size."
  }
]
```

Check yourself before moving on:

```quiz
[
  {
    "q": "You add kb_options = \"grp:alts_toggle\" to input.lua to switch layouts. What else happens?",
    "choices": [
      "Nothing; it is added to the default options",
      "It replaces the default string, so compose:caps and shift:both_capslock_cancel are gone unless you repeat them",
      "Hyprland refuses to load the file"
    ],
    "answer": 1,
    "explain": "kb_options is one string, and yours replaces the default. The manual's own example repeats the defaults and appends grp:alts_toggle."
  },
  {
    "q": "On a 27-inch 4K monitor everything is too big at the default settings. What do you set in monitors.lua?",
    "choices": [
      "omarchy_gdk_scale = 2 and omarchy_monitor_scale = 1.6",
      "omarchy_gdk_scale = 1 and omarchy_monitor_scale = 1",
      "omarchy_gdk_scale = 3 and omarchy_monitor_scale = 3"
    ],
    "answer": 0,
    "explain": "The manual recommends 2 and 1.6 for a 27 or 32 inch 4K. The 1 and 1 pair is for 1080p and 1440p.",
    "why": [null, "That is the manual's setting for 1080p and 1440p screens, which would make a 4K screen's text tiny.", "Neither value is a manual recommendation for this screen, and it would make everything larger still."]
  },
  {
    "q": "Why should a Latin layout come first in kb_layout?",
    "choices": [
      "It makes typing faster",
      "Hyprland matches keybindings against the first layout, so Super-key shortcuts only fire when a Latin layout leads",
      "Omarchy refuses to start otherwise"
    ],
    "answer": 1,
    "explain": "Omarchy's default input file documents this: bindings resolve against the first entry in kb_layout, not the active layout."
  }
]
```

## Recap

1. Edit `input.lua` and `monitors.lua` via _Setup > Input_ and _Setup > Monitors_; list only what you want different from the defaults.
2. Caps Lock is the compose key by default, and the real Caps Lock is both Shift keys. `kb_options` is one string, so repeat the defaults you keep.
3. Natural scrolling is `touchpad = { natural_scroll = true }` inside `hl.config({ input = { ... } })`.
4. Put a Latin layout first in `kb_layout`, because bindings match the first layout.
5. Scale with two numbers: `omarchy_gdk_scale` and `omarchy_monitor_scale` (`2` and `1.6` for a 27 or 32 inch 4K, `1` and `1` for 1080p or 1440p). Try scales live with `Super + /` and `Super + Alt + /`.
6. For text size alone, use `omarchy display text size 14`.

Next up, [Themes, Fonts, and the Bar](04-themes-fonts-and-the-bar.md): the look.
