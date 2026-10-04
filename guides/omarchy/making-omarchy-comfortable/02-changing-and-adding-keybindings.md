---
title: "Changing and Adding Keybindings"
guide: "making-omarchy-comfortable"
phase: 2
summary: "Read the live keybinding list, then add, change, and disable bindings in ~/.config/hypr/bindings.lua using Omarchy's o.bind helper and Hyprland's hl.unbind."
tags: [omarchy, hyprland, keybindings, lua, bindings-lua, hotkeys]
difficulty: intermediate
synonyms: ["how to change keybindings in omarchy", "omarchy bindings.lua", "how to add a hotkey in omarchy", "omarchy o.bind example", "how to remap super key omarchy", "disable omarchy keybinding", "omarchy hl.unbind"]
updated: 2026-10-04
---

# Changing and Adding Keybindings

Every Omarchy hotkey is one line of Lua, and the file where yours go is almost empty: it ships with comments only. That is good news, because you can read the whole thing in a minute and make your first change safely. By the end of this phase you will add a hotkey, take a key away from an app, and remove a default you never use.

## See what is bound first

Press `Super + K` to open a searchable list of every keybinding. `Super` is the Windows key (the Command key on a Mac keyboard). The same list prints into a terminal with `omarchy menu keybindings --print`, so you can search it with `grep`. Check a key here before you claim it, because binding a key that is already taken needs one extra step (below).

Tmux has its own list on `Super + Alt + K`, and Herdr on `Super + Ctrl + K`.

## A one-minute tour of Lua

You need five things from Lua to read and write bindings:

- `--` starts a comment. Everything after it on that line is ignored.
- Text goes in double quotes: `"SUPER + SHIFT + R"`.
- A call is a name followed by parentheses with comma-separated arguments: `o.bind("...", "...", "...")`.
- Curly braces make a table, a bundle of `name = value` pairs: `{ webapp = "https://reddit.com" }`.
- A dot reaches inside something: `hl.unbind` is the `unbind` function that Hyprland (`hl`) provides, and `o.bind` is the `bind` helper that Omarchy (`o`) provides.

Lua is strict. A missing quote or parenthesis stops the whole file from loading, so change one thing at a time.

## Anatomy of a binding

```lua
o.bind("SUPER + SHIFT + R", "Reddit", { webapp = "https://reddit.com" })
```

`o.bind` takes the key combination, a description, and what to do:

1. **The keys**: modifiers and one key, joined by ` + `. The modifiers are `SUPER`, `SHIFT`, `CTRL`, and `ALT`.
2. **The description**: the label you see in the `Super + K` list.
3. **The action**: a shell command as a string, or a table that Omarchy turns into a command for you. The tables used by the defaults are `{ omarchy = "terminal" }` (an Omarchy launcher), `{ webapp = "https://..." }` (a site in its own app-like window), `{ tui = "btop" }` (a terminal program in a terminal window), and `{ launch = "obsidian", focus = "^obsidian$" }` (start the app, or jump to its window if it is already open). Hyprland actions like `hl.dsp.window.close()` also work.

A fourth, optional argument is a table of settings. You will see `{ locked = true, repeating = true }` on the volume keys in the defaults, but you rarely need it.

> 📝 **Terminology**: a *binding* connects a key combination to an action. *Unbinding* removes that connection. Omarchy's own bindings are the *defaults*, and yours sit on top of them as described in [Phase 1](01-whose-files-are-whose.md).

## Add, change, disable

Open the file with `Super + Space`, then _Setup > Keybindings_. Here is a complete example with all three moves:

```lua
-- Add: a new key that opens a web app.
o.bind("SUPER + SHIFT + R", "Reddit", { webapp = "https://reddit.com" })

-- Add: a key that runs any command (here, an SSH session in a terminal window).
o.bind("SUPER + SHIFT + Z", "Work server", "omarchy-launch-tui ssh your-server")

-- Change: give a key that Omarchy already uses to a different app.
-- Install it first with: omarchy-pkg-add joplin-bin
hl.unbind("SUPER + SHIFT + O")
o.bind("SUPER + SHIFT + O", "Joplin", "joplin-desktop")

-- Disable: remove a default and leave the key empty.
hl.unbind("SUPER + SHIFT + B")
```

The Joplin lines come straight from the manual, which swaps the preinstalled Obsidian note app for Joplin. The rule behind them: **to change a key that is already bound, unbind it first, then bind it again.** Omarchy's own instructions for this file say to unbind first, so that your binding replaces the default instead of competing with it.

> 💡 **Key point**: disabling `Super + Shift + B` costs you nothing here. The browser is also bound to `Super + Shift + Return`, so only the duplicate key is gone.

Habits from other systems are one line each. Windows users who reach for `Alt + F4` can add it:

```lua
o.bind("ALT + F4", "Close window", hl.dsp.window.close())
```

That reuses the same action Omarchy gives `Super + W`.

## Key names: copy the spelling

Letters and digits are what you expect. A few keys have names you would not guess:

| Key | How the defaults spell it |
|---|---|
| Enter | `RETURN` |
| Space bar | `SPACE` |
| Escape | `ESCAPE` |
| `/` | `SLASH` |
| `.` | `PERIOD` |
| `,` | lowercase `comma` |
| Number row (1 to 0) | `code:10` through `code:19` |

The comma is a trap. A comment in Omarchy's own bindings file says the underlying keyboard library names that key `comma`, and the upper-case `COMMA` does not match. A `code:` number refers to a physical key position on the keyboard, which is how the defaults handle the number row.

You are allowed to read Omarchy's default binding files even though you must not edit them. They sit in `/usr/share/omarchy/default/hypr/bindings/`, and copying the spelling of a similar key is the safest way to get yours right.

## Turn off whole groups of defaults

Two switches live in `~/.config/hypr/hyprland.lua`, as comments near the top. They must come before the line that loads the defaults:

```lua
-- Disable only the bindings for preinstalled apps and web apps,
-- keeping core window-manager bindings:
omarchy_preinstalled_bindings = false

-- Disable every Omarchy default binding (you then add your own):
-- omarchy_default_bindings = false

require("default.hypr.omarchy")
```

Use the first if you removed the preinstalled apps and want their keys back for yourself. Use the second only if you are prepared to rebuild every binding you rely on, window closing included.

## Check your work

Hyprland reloads its config when you save. Omarchy's own guidance for editing these files is to force a reload and ask for errors afterwards:

```console
$ hyprctl reload
$ hyprctl configerrors
```

*What just happened:* the first command makes Hyprland re-read every config file. The second lists any errors it found, so a typo shows up there instead of as a mystery. If a binding does nothing, run both and read what comes back.

If you cannot find your mistake, rewind only this file with `omarchy refresh config hypr/bindings.lua` and start again from a known-good state.

## Your turn: two small edits

```exercise
[
  {
    "type": "predict",
    "task": "Type the one line that disables the default Super + Shift + B binding without replacing it.",
    "accept": ["/^hl\\.unbind\\(\\s*[\"']SUPER \\+ SHIFT \\+ B[\"']\\s*\\)$/"],
    "hint": "It is an hl.unbind call with the key string inside the parentheses."
  },
  {
    "type": "task",
    "task": "Add a binding on Super + Shift + H that opens https://news.ycombinator.com as a web app, then confirm it appears in the Super + K list.",
    "reveal": "o.bind(\"SUPER + SHIFT + H\", \"Hacker News\", { webapp = \"https://news.ycombinator.com\" })",
    "checklist": ["I checked Super + K first and the key was free", "I edited ~/.config/hypr/bindings.lua, not a file under /usr/share/omarchy", "The new line shows up in the keybinding list with my description"]
  }
]
```

Check yourself before moving on:

```quiz
[
  {
    "q": "You want Super + Shift + O to open Joplin instead of Obsidian. What goes in bindings.lua?",
    "choices": [
      "Only the new o.bind line; the later binding wins automatically",
      "hl.unbind(\"SUPER + SHIFT + O\") first, then the new o.bind line",
      "An edit to the default file under /usr/share/omarchy"
    ],
    "answer": 1,
    "explain": "A key that is already bound must be unbound before you bind it again. The defaults are Omarchy's files and are replaced on update.",
    "why": ["The template's rule is to unbind first, then bind the key again.", null, "Files under /usr/share/omarchy are overwritten by updates. Overrides belong in ~/.config."]
  },
  {
    "q": "Your binding on the comma key never fires. Which is the most likely cause?",
    "choices": [
      "You wrote COMMA in capitals, but the key is named comma in lowercase",
      "Comma cannot be used in bindings at all",
      "You forgot to add SHIFT"
    ],
    "answer": 0,
    "explain": "Omarchy's own bindings use lowercase comma and note that the upper-case form does not match."
  },
  {
    "q": "You removed the preinstalled apps and want their key combinations free for your own use. Where do you switch off the app bindings?",
    "choices": [
      "In bindings.lua, with omarchy_preinstalled_bindings = false",
      "In hyprland.lua, setting omarchy_preinstalled_bindings = false before require(\"default.hypr.omarchy\")",
      "In monitors.lua"
    ],
    "answer": 1,
    "explain": "The switch must be set in hyprland.lua before the defaults load, because it decides which default files load."
  }
]
```

## Recap

1. `Super + K` lists every live binding; check it before you pick a key.
2. A binding is `o.bind(keys, description, action)` in `~/.config/hypr/bindings.lua`; the action is a command string or a table like `{ webapp = "..." }`.
3. To change a key that is already bound, call `hl.unbind` on it first, then `o.bind`. To disable one, call `hl.unbind` alone.
4. Copy key spellings from the defaults: `RETURN`, `SLASH`, `PERIOD`, and lowercase `comma`.
5. `omarchy_preinstalled_bindings = false` and `omarchy_default_bindings = false` go in `hyprland.lua`, before the defaults load.
6. After an edit, `hyprctl reload` then `hyprctl configerrors` shows what went wrong.

Next up, [Keyboard, Mouse, and Screens](03-keyboard-mouse-and-screens.md): layouts, repeat rate, natural scrolling, and monitor scaling.
