---
title: "Installing, Removing, and Wrapping Apps"
guide: "installing-and-updating-software-on-omarchy"
phase: 2
summary: "Install and remove packages with the Omarchy menu or the omarchy pkg commands, understand what pacman -Rns takes away, and add web apps and terminal programs as launcher entries."
tags: [omarchy, pacman, packages, install, remove, web-apps, tui, omarchy-pkg, fzf]
difficulty: beginner
synonyms: ["how to install a package on omarchy", "omarchy pkg add", "how to uninstall a program on omarchy", "omarchy remove package completely", "what does pacman -Rns do", "omarchy web app how to add", "omarchy install tui", "how to check if a package is installed on arch"]
updated: 2026-10-04
---

# Installing, Removing, and Wrapping Apps

You know where software comes from. Now you want to install one thing, and later get rid of another one without leaving junk behind. Omarchy gives you a menu for it, a command for it, and the raw `pacman` underneath.

## Install > Package

Press `Super + Space`, choose **Install**, then **Package**. A terminal opens with a filterable list of every package in the repositories. Type a few letters and the list narrows. That is fuzzy matching: the letters need not be contiguous.

The picker is built on a tool called `fzf`. The footer shows the keys: `Tab` selects several packages at once, `alt-p` toggles the description preview, and `alt-j` and `alt-k` scroll it. Pick one or more, press `Return`, and Omarchy installs them with pacman.

⚠️ **Gotcha.** The picker installs with `pacman -S --noconfirm`, so pacman does not stop to ask "install these N packages?" Read the preview before you press `Return`.

## The command form: omarchy pkg add

The same job from a terminal, using the example from the command's own help:

```bash
omarchy pkg add jq ripgrep
```

This installs the packages if they are missing, and quietly does nothing for any already installed. Under the hood it runs `sudo pacman -S --noconfirm --needed` on the names you gave. The `--needed` flag tells pacman not to reinstall what is already current. Afterward it checks that each package really arrived and prints an error if one did not.

Three related commands answer questions without changing anything:

```console
$ omarchy pkg present jq && echo "jq is here"
jq is here
$ omarchy pkg missing nonexistent-package-xyz && echo "not installed"
not installed
```

*What just happened:* `present` is true only when every named package is installed, and `missing` is true when any is absent. Both return an exit status you can chain with `&&`.

## Looking things up with pacman

Read-only pacman questions are always safe to ask. They are documented in the pacman manual:

| Command | Answers |
|---|---|
| `pacman -Ss word` | Which packages in the repositories mention this word? |
| `pacman -Si name` | What is this repository package, and what does it depend on? |
| `pacman -Qi name` | What is installed under this name? |
| `pacman -Ql name` | Which files does this installed package own? |
| `pacman -Qe` | Which packages did I choose to install, as opposed to dependencies? |
| `pacman -Qm` | Which installed packages are not in any configured repository? |

Use the `-Q` family to learn what is on your machine and the `-S` family to learn what could be.

## Remove > Package, and what -Rns takes with it

_Remove > Package_ lists the packages you explicitly installed and removes the ones you pick. The command form is:

```bash
omarchy pkg drop name-of-package
```

Both end up running `pacman -Rns`. Here is what the three letters mean:

- **R** - remove the package.
- **s** - also remove dependencies that were installed for it, as long as nothing else needs them and you did not install them yourself.
- **n** - do not leave `.pacsave` backup copies of its config files.

The manual puts the result plainly: it removes the package, its config files, and its dependencies. The practical consequence is that a clean removal leaves no leftovers, and also that you cannot get back your old settings for that package by reinstalling.

`omarchy pkg drop` ignores any name that is not installed, so it is safe to put in a script. If another package still needs what you tried to remove, pacman refuses the transaction rather than breaking that package.

⚠️ **Gotcha.** Like the install picker, the removal list passes `--noconfirm`. A mis-click does not get a second prompt. Check your selection before pressing `Return`.

## Web apps: a website that behaves like an app

A **web app** on Omarchy is a launcher entry that opens a site in a frameless browser window. It has its own place in the app launcher and can have its own hotkey. Nothing is installed with pacman.

To add one, choose _Install > Web App_. Omarchy asks for a name, a URL, and an icon URL. The icon URL is only needed if it cannot fetch the site's favicon. The manual recommends [Dashboard Icons](https://dashboardicons.com) for good PNG icons. Afterward the app appears when you open the menu with `Super + Space`.

To remove one, use _Remove > Web App_.

- **Log in first in a regular browser.** The manual notes the thin wrapper frame does not work well with the 1Password extension.
- **Copy the current page URL** with `Alt + Shift + L` while inside a web app.
- **Hotkeys** for web apps can be changed in `~/.config/hypr/bindings.lua`.

Omarchy ships with a set of preinstalled web apps with hotkeys, such as HEY email on `Super + Shift + E`, ChatGPT on `Super + Shift + A`, and YouTube on `Super + Shift + Y`. If you will never use them, _Remove > Preinstalls_ removes the web apps, TUIs, and optional apps, and their hotkeys go away with them. _Install > Preinstalls_ brings them back.

## TUIs: terminal programs as launcher entries

A **TUI** is a text-interface program that runs inside a terminal window, such as `btop`. _Install > TUI_ asks for a name, a launch command, a window style, and an icon, then adds an entry to the launcher. Remove it under _Remove > TUI_.

This is the right tool when you already have a command-line program installed and want it one keypress away, without making it a package.

## Choosing the right door

| You want | Use |
|---|---|
| A normal application from the repositories | _Install > Package_ or `omarchy pkg add` |
| An editor, browser, or service Omarchy already knows | The matching _Install_ entry, which also configures it |
| A website that feels like an app | _Install > Web App_ |
| A terminal program one key away | _Install > TUI_ |
| A program only in the AUR | _Install > AUR_, after Phase 4 |
| Removal of any of the above | The matching _Remove_ entry |

## Your turn: a round trip

Pick any small tool you recognize from the package list, install it with `omarchy pkg add`, check it with `omarchy pkg present`, then remove it with `omarchy pkg drop`.

```exercise
[
  {
    "type": "predict",
    "task": "In `pacman -Rns`, which letter stops pacman from leaving `.pacsave` backup copies of config files? Write the single letter.",
    "accept": ["n"],
    "hint": "Look at the list of what each letter does above."
  },
  {
    "type": "task",
    "task": "Do the round trip: install a small package with `omarchy pkg add`, confirm with `omarchy pkg present <name> && echo yes`, then remove it with `omarchy pkg drop` and confirm with `omarchy pkg missing <name> && echo gone`.",
    "reveal": "Example shape: omarchy pkg add NAME, then omarchy pkg present NAME && echo yes, then omarchy pkg drop NAME, then omarchy pkg missing NAME && echo gone.",
    "checklist": ["Installed the package", "Saw yes after the first check", "Removed the package", "Saw gone after the second check"]
  }
]
```

Check yourself before moving on:

```quiz
[
  {
    "q": "Why can reading the preview in Install > Package matter more than it would in a typical installer?",
    "choices": [
      "Because the picker installs with --noconfirm, so pacman will not ask again",
      "Because packages are installed to your home folder",
      "Because Return only previews the package"
    ],
    "answer": 0,
    "explain": "The picker passes --noconfirm, so your selection is the last checkpoint."
  },
  {
    "q": "You run omarchy pkg drop on a package. What is removed?",
    "choices": [
      "Only the package's program files",
      "The package, its config files, and dependencies nothing else needs",
      "Every package you installed in the last week"
    ],
    "answer": 1,
    "explain": "It runs pacman -Rns: remove, recursive dependencies, and no .pacsave backups."
  },
  {
    "q": "What kind of thing is a web app added from Install > Web App?",
    "choices": [
      "A pacman package",
      "A launcher entry that opens a URL in a frameless window",
      "An AUR build"
    ],
    "answer": 1,
    "explain": "Nothing is installed with pacman. It is a launcher entry."
  }
]
```

## Recap

1. _Install > Package_ opens a filterable list, installs with `--noconfirm`, and lets you select several with `Tab`.
2. `omarchy pkg add` installs missing packages, and `present` and `missing` check state for scripts.
3. `pacman -Q` and `-S` read-only queries are safe ways to learn what is installed or available.
4. `omarchy pkg drop` and _Remove > Package_ run `pacman -Rns`, which also removes config files.
5. Web apps and TUIs are launcher entries, not packages, and are removed from their own menu entries.

Next up, [Updating a Rolling Release Safely](03-updating-a-rolling-release-safely.md): what happens when you press the update badge.
