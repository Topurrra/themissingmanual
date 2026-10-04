---
title: "Themes, Fonts, and the Bar"
guide: "making-omarchy-comfortable"
phase: 4
summary: "Switch and customize themes and backgrounds, change the font and prompt, rearrange the bar through shell.json, and soften the look with looknfeel.lua - without touching a file Omarchy owns."
tags: [omarchy, themes, fonts, backgrounds, bar, shell-json, looknfeel, starship, customization]
difficulty: beginner
synonyms: ["how to change theme in omarchy", "omarchy custom theme", "omarchy change font", "omarchy add wallpaper", "omarchy move the top bar", "omarchy rounded corners", "omarchy remove window gaps", "omarchy shell.json", "omarchy 12 hour clock", "omarchy starship prompt"]
updated: 2026-10-04
---

# Themes, Fonts, and the Bar

Omarchy's look is the first thing people love and the first thing they want to adjust. The good news is that nearly every visual setting follows the same pattern from [Phase 1](01-whose-files-are-whose.md): a menu or command for the common case, and a file in `~/.config` for the rest. You will not edit anything Omarchy owns.

## Themes and backgrounds

A theme is a coordinated set of colors. Omarchy ships twenty-two, according to the manual, and one theme styles the desktop, terminal, Neovim, the activity monitor (btop), Chromium, and the whole shell: bar, menu, notifications, on-screen display, and lock screen. (Obsidian is the exception: pick the Omarchy theme once inside the app, under _Appearance > Themes_.)

Change it three ways:

- `Super + Ctrl + Shift + Space` opens the visual theme picker.
- _Style > Theme_ in the Omarchy menu does the same.
- In a terminal: `omarchy theme list`, then `omarchy theme set "Tokyo Night"`. Both `"Tokyo Night"` and `tokyo-night` work.

Every theme comes with a set of backgrounds. `Super + Ctrl + Space` picks between them. To add your own image, copy it into `~/.config/omarchy/backgrounds/<theme-name>/`, for example `~/.config/omarchy/backgrounds/nord`. The quickest route is _Install > Style > Background_, which opens that folder; `Super + Shift + F` opens a second file manager to copy from. Your image then appears in the `Super + Ctrl + Space` picker.

### Tweaking a theme without losing it

Never edit a stock theme under `/usr/share/omarchy/themes`, because an update replaces it. Omarchy's official customization guide gives two safe routes:

- **Overlay** (best for small changes): make a folder with the same name under `~/.config/omarchy/themes` containing only the files you change. When the theme is applied, the stock theme is copied first and your files win on top.

```console
$ mkdir -p ~/.config/omarchy/themes/catppuccin
$ cp /usr/share/omarchy/themes/catppuccin/colors.toml ~/.config/omarchy/themes/catppuccin/
$ n ~/.config/omarchy/themes/catppuccin/colors.toml
$ omarchy theme set catppuccin
```

*What just happened:* you copied the one file that defines the colors, edited your copy (with `n`, the Neovim alias), and re-applied the theme so Omarchy regenerates the terminal, bar, and app colors from it.

- **Fork**: copy the whole stock theme to a new name (`cp -r /usr/share/omarchy/themes/catppuccin ~/.config/omarchy/themes/catppuccin-custom`) and apply that.

The main file is `colors.toml`. A light theme sets `mode = "light"` at the top of it, which pairs every app with light mode. The Aether app (from the apps menu, `Super + Alt + Space`) can generate a theme from a background through a graphical editor.

### Installing someone else's theme

_Install > Style > Theme_ takes a git URL. The naming convention is `omarchy-<themename>-theme`, which then shows up in the picker as `<themename>`. One safety rule is worth knowing: a theme installed from a repo keeps its colors but loses anything that could run code on your machine. That means any `.lua` file, the terminal config files (`alacritty.toml`, `foot.ini`, `ghostty.conf`, `kitty.conf`), and `vscode.json`. Installing a theme should change what your desktop looks like, never what it runs. A theme you write yourself in `~/.config/omarchy/themes` is not restricted.

## Fonts and the prompt

The default font is JetBrainsMono Nerd Font for both the terminal and the system. _Style > Font_ changes the monospace font everywhere. _Install > Style > Font_ adds Cascadia Mono, Meslo LG Mono, Fira Code, Victor Code, Bitstream Vera Mono, or Iosevka, in Nerd Font versions so the icons in the bar and terminal keep working. After installing one, pick it under _Style > Font_. From a terminal:

```console
$ omarchy font list
$ omarchy font set "CaskaydiaMono Nerd Font"
```

For text size, remember `omarchy display text size 14` from [Phase 3](03-keyboard-mouse-and-screens.md). It moves the shell, GTK apps, and terminal together.

The shell prompt is a minimal [Starship](https://starship.rs/) prompt, configured in `~/.config/starship.toml`. The Foot terminal's own settings live in `~/.config/foot/foot.ini`, which starts by including the current theme's Foot file. That is why the colors come from the theme and not from `foot.ini` itself.

## The bar

The strip along the top is part of the Omarchy shell, so it follows the theme. You can rearrange it without opening a file:

- Drag an empty part of the bar toward another screen edge to move it. Double-left-click empty space to toggle transparency. Drag a widget to reorder it. _Style > Menu Bar_ offers position and transparency from the menu.
- `Super + Shift + Space` hides and shows the bar.
- Right-click the small arrow that hides your tray icons to pin the ones you always want visible.
- Right-click the clock to cycle formats. For a 12-hour clock that reads like `Sunday 10:55 AM`, run `omarchy bar set omarchy.clock format "dddd h:mm AP"`.

The same moves exist as commands, which is what you want for a dotfiles backup:

```console
$ omarchy bar position bottom
$ omarchy bar transparent toggle
$ omarchy bar move omarchy.clock --section center --index 0
$ omarchy bar defaults
```

To add or remove a widget, use `omarchy plugin list` to see ids, then `omarchy plugin enable omarchy.media --section center` or `omarchy plugin disable omarchy.weather`.

All of it lands in `~/.config/omarchy/shell.json`, which reloads when you save it. The same file holds your idle timings, in seconds since you went idle:

```json
{
  "version": 1,
  "idle": {
    "screensaver": 150,
    "lock": 300
  }
}
```

Those are the shipped values: screensaver at 150 seconds, lock at 300. "Lock after ten minutes" is `"lock": 600`. (The file also holds the `bar` section; this excerpt shows only the idle part.)

> 💡 **Key point**: once you change anything about the bar, your `shell.json` is canonical and nothing merges. `omarchy bar defaults` (or _Update > Config > Shell_) brings the shipped layout back, and new default widgets in future releases will not appear on their own.

## Gaps, corners, and layout in looknfeel.lua

Open it with _Style > Hyprland_. Everything in it ships commented out. Remove the `--` on what you want. These are the manual's two common tweaks plus others from the same template:

```lua
hl.config({
  general = {
    -- No gaps between windows or borders.
    gaps_in = 0,
    gaps_out = 0,
    border_size = 0,
  },
  decoration = {
    -- Round the window corners (Omarchy's default is square).
    rounding = 8,

    -- Dim windows that are not focused (0.0 is no dim, 1.0 is fully dimmed).
    dim_inactive = true,
    dim_strength = 0.15,
  },
})
```

If you only want to try gaps off, `Super + Shift + Backspace` toggles all gaps and borders without editing anything. Two more quick toggles: `Super + Backspace` toggles transparency on the focused window, and `Super + L` switches the current workspace between the default dwindle layout and a side-scrolling one. To make side-scrolling the layout everywhere, set `layout = "scrolling"` inside `general`. To turn animations off, set `animations = { enabled = false }` in its own `hl.config` block.

## Keep your work

Once you have tuned things, back them up. The manual suggests GNU Stow. The files worth keeping are the ones you edited: the `~/.config/hypr` folder, `~/.config/omarchy` (your themes, hooks, `shell.json`, and plugins), `~/.config/foot`, `~/.config/tmux`, `~/.config/starship.toml`, `~/.bashrc`, and `~/.XCompose`. The generated theme state under `~/.local/state/omarchy/current` is rebuilt for you and not worth saving.

## Your turn: make it yours

```exercise
[
  {
    "type": "predict",
    "task": "You want the screen to lock after ten minutes of idle time. What number goes in idle.lock in shell.json? (It is measured in seconds.)",
    "accept": ["600"],
    "hint": "Ten minutes times sixty seconds."
  },
  {
    "type": "task",
    "task": "Restyle your desktop in four steps, all without editing a file Omarchy owns.",
    "reveal": "Theme: Super + Ctrl + Shift + Space. Background: copy an image into ~/.config/omarchy/backgrounds/<theme-name>/ and press Super + Ctrl + Space. Font: omarchy font set \"CaskaydiaMono Nerd Font\" (after installing it under Install > Style > Font). Corners: in looknfeel.lua, set decoration = { rounding = 8 } inside hl.config.",
    "checklist": ["I switched to a different theme", "I added one background image of my own and selected it", "I changed the font under Style > Font", "I enabled rounded corners in looknfeel.lua"]
  }
]
```

Check yourself before moving on:

```quiz
[
  {
    "q": "You like Catppuccin but want one color changed, and you do not want an update to undo it. What is the safe route?",
    "choices": [
      "Edit colors.toml in /usr/share/omarchy/themes/catppuccin",
      "Make ~/.config/omarchy/themes/catppuccin containing only the files you change, then re-apply the theme",
      "Edit foot.ini, because it holds the terminal colors"
    ],
    "answer": 1,
    "explain": "A user theme folder with the same name overlays the stock theme: the stock files are copied first and yours win on top. Files in /usr/share/omarchy are replaced by updates.",
    "why": ["That folder belongs to Omarchy and is overwritten on update.", null, "foot.ini pulls its colors from the current theme, so the colors come from colors.toml, not from foot.ini."]
  },
  {
    "q": "You install a theme from a stranger's git repo and it ships a hyprland.lua and a foot.ini. What does Omarchy do with them?",
    "choices": [
      "Applies them, since they are part of the theme",
      "Drops them, because files that can run code are not allowed in an installed theme, and keeps the colors",
      "Refuses to install the theme at all"
    ],
    "answer": 1,
    "explain": "An installed theme keeps its colors but loses .lua files, terminal configs, and vscode.json. Those are regenerated from colors.toml."
  },
  {
    "q": "After you dragged a widget on the bar, a new Omarchy release adds a default widget. What happens to your bar?",
    "choices": [
      "The new widget is merged in automatically",
      "Your shell.json is canonical, so the new widget does not appear unless you add it",
      "Your changes are reset"
    ],
    "answer": 1,
    "explain": "There is no deep merge once you own shell.json. omarchy bar defaults restores the shipped layout."
  }
]
```

## Recap

1. Switch themes with `Super + Ctrl + Shift + Space` or `omarchy theme set`; add backgrounds under `~/.config/omarchy/backgrounds/<theme-name>/`.
2. To tweak a stock theme, overlay a same-named folder in `~/.config/omarchy/themes`. Installed themes lose code-running files.
3. Change fonts under _Style > Font_ or with `omarchy font set`; the prompt is `~/.config/starship.toml`.
4. The bar is configured in `~/.config/omarchy/shell.json` through drags, `omarchy bar` commands, or the file, and it reloads on save. Idle timings live there in seconds.
5. Gaps, rounding, dimming, and layout go in `looknfeel.lua`; `Super + Shift + Backspace` toggles gaps without editing.
6. Back up the files you edited, not the generated theme state.

When something does go wrong, [When Omarchy Breaks](/guides/when-omarchy-breaks) covers snapshots and recovery, and [Omarchy Plugins and the Marketplace](/guides/omarchy-plugins-and-the-marketplace) shows how to add bar widgets that others wrote.
