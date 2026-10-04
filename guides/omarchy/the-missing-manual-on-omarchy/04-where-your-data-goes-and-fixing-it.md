---
title: "Where Your Data Goes, and Fixing It When It Breaks"
guide: "the-missing-manual-on-omarchy"
phase: 4
summary: "A symptom-to-fix card for the plugin's common failures, a plain table of what each action sends and what stays on your machine, and how to report a bug or contribute."
tags: [omarchy, plugin, troubleshooting, privacy, bug-report, contributing, tmm-manual]
difficulty: beginner
synonyms: ["tmm.manual window does not appear", "omarchy-shell shell summon unknown", "omarchy tmm diagram mermaid card", "what does the missing manual plugin send", "journalctl omarchy-shell tmm", "how to report a bug omarchy-tmm", "omarchy tmm privacy what is stored"]
updated: 2026-10-04
---

# Where Your Data Goes, and Fixing It When It Breaks

Either something is not working, or you want a straight answer about what the plugin does with your data. The card below handles the first, and the two tables after it handle the second. The phase ends with how to report a bug.

## When it breaks

| Symptom | Calm fix |
|---|---|
| Hotkey, menu row, or `summon` does nothing | Run `omarchy plugin list`. If `tmm.manual` says `disabled`, run `omarchy plugin enable tmm.manual` |
| `omarchy-shell shell summon tmm.manual` prints `unknown` | The shell has no such plugin loaded. Check `ls ~/.config/omarchy/plugins/tmm.manual/`, then `omarchy-shell shell rescanPlugins` |
| It prints `ok` but no window appears | A QML error stopped it drawing. Read the journal, below |
| The bar icon is missing | `omarchy bar put tmm.manual --section right` |
| `omarchy plugin add` says it is already installed | Use `omarchy plugin update tmm.manual` instead |
| The window opens unstyled | You are not on Omarchy 4 |
| Search says "Search failed" or finds nothing | Check the network with the `curl` test below the table |
| Diagrams show as `Diagram · mermaid` cards | See the diagram check below |
| Copy does nothing | Install `wl-clipboard`, which provides `wl-copy` |
| Menu rows show words like `search` instead of icons | You have an old menu fragment. Run `~/.config/omarchy/plugins/tmm.manual/bin/tmm-menu install` again, then `omarchy menu refresh` |
| A hotkey does nothing | Check the `o.bind` lines for typos, run `hyprctl reload`, then `omarchy menu keybindings --print` to see whether the binding loaded |
| An update does not seem to take | `omarchy-restart-shell` is the stronger reset |

To test the network side yourself, ask the search endpoint directly. If this prints JSON, the site is reachable:

```bash
curl -fsSL "https://themissingmanual.dev/search.json?q=git" | head -c 300
```

When `summon` prints `ok` and nothing appears, the shell logs to the journal under its own tag:

```bash
journalctl -t omarchy-shell -n 100 --no-pager | grep -i -A3 'tmm\|error\|warning'
```

Run `journalctl -t omarchy-shell -f` in one terminal to watch live while you summon from another. Omarchy's plugin development guide gives a second way to read the same logs: `qs log -p "$OMARCHY_PATH/shell" --tail 100`. After you edit plugin files, `omarchy-restart-shell` is the clean reset.

You can also check the plugin folder against Omarchy's own rules. It prints nothing and exits cleanly when everything is fine:

```bash
omarchy plugin validate ~/.config/omarchy/plugins/tmm.manual/
```

**Diagram check.** The helper looks for an image tool in this order: `rsvg-convert`, then ImageMagick (`magick` or `convert`). With neither, or without `python3`, you get cards. Test the helper directly on a phase that has diagrams:

```bash
command -v rsvg-convert python3
curl -fsSL https://themissingmanual.dev/guides/how-the-internet-works/1 \
  | ~/.config/omarchy/plugins/tmm.manual/bin/tmm-diagrams /tmp/d test
```

It prints one line per diagram: a path, a width, and a height. No output means the page had no diagrams; an error points at `python3`. Offline, cards are expected.

**Chat errors.** The dock shows failures in red. The common ones:

| Message starts with | Meaning and fix |
|---|---|
| "No AI key configured" | An API provider is missing its key or model. Open settings with `Ctrl + ,` |
| "No AI endpoint configured" | `openai` needs a `baseUrl` |
| "The AI request failed" | Network or endpoint trouble. Check the connection and `baseUrl` |
| "Could not read the model's reply" | The endpoint did not answer in the expected format. Check the key and config |
| "The model declined to answer that" | The provider refused that question |
| "The AI CLI didn't run" | The CLI is not installed or not on `PATH`. Install it, or set `bin` to its full path |
| "The AI CLI returned nothing" | It ran but gave no answer. Check that it is signed in |

## What leaves your machine

Every request the plugin itself makes goes through `curl`, and the website sees it the way any website sees a visitor: your IP address and the address you asked for. The plugin sends no account, cookie, or identifier of its own. Here is each action and where it goes:

| Action | Goes to | What is sent |
|---|---|---|
| Typing in search | themissingmanual.dev `/search.json` | The text you typed |
| Opening the window | `/llms.txt` | A request for the catalog |
| Opening a phase | `/guides/<slug>/<phase>.md`, and the phase's web page when it has diagrams | The guide and phase you asked for |
| Ask with `?` | `/ask.json` | Your question, up to 300 characters |
| A search with no hits, or the chat with no provider | `/ask.json` in free retrieval mode | The text you typed, or your chat question |
| Chat with `openai` or `anthropic` | Your `baseUrl`, or Anthropic's API | The system prompt, up to the first 6,000 characters of the phase on screen, your whole conversation, and your key as a request header |
| Chat with a CLI provider | The CLI on your machine | The same text, on its standard input. What that tool sends onward is between you and its vendor |

Two consequences follow. With a provider configured, your chat questions go to that provider and not to The Missing Manual. And your key goes to whatever `baseUrl` you type, so only point it at a server you trust. Only the first 6,000 characters of a phase are included, so a question about the end of a long phase gets less context. [AI Privacy and What Not to Paste](/guides/ai-privacy-and-safety) covers what is wise to put into any chatbot.

What stays on your machine:

| Where | What |
|---|---|
| The `tmm` cache folder | Phase text (`<slug>-<phase>.md`), diagram images, saved ask answers, and the CLI scratch folder |
| `~/.local/state/omarchy/tmm-recents.json` | Your last 12 phases: slug, phase, title, and time |
| `~/.local/state/omarchy/tmm-ui.json` | Your dragged column widths |
| `~/.config/tmm/ai.json` | Your chat settings, and the key if you saved one |
| Memory only | The chat conversation. The plugin never writes it to disk, and "Clear history" in the dock empties it |

The README documents the cache as `~/.cache/tmm/`. Run `find ~/.cache -maxdepth 3 -type d -name tmm` to see where yours is. Every network reply is also held to a size ceiling and a time limit, and a reply that goes over either is dropped rather than half-read or half-saved.

## Report a bug, or help

Bugs in the plugin go to its issue tracker at [github.com/Topurrra/omarchy-tmm](https://github.com/Topurrra/omarchy-tmm/issues). Gather these first, so nobody has to ask:

```bash
grep version ~/.config/omarchy/plugins/tmm.manual/manifest.json
git -C ~/.config/omarchy/plugins/tmm.manual rev-parse --short HEAD
omarchy version
omarchy plugin list | grep tmm.manual
```

Add what you pressed, what you expected, and the journal lines from the troubleshooting card. Do not paste `ai.json`; it may hold a key. A wrong command or mistake inside a guide is a content bug, and the README says those belong with The Missing Manual itself, not with the plugin.

To contribute code, the README asks for a few things: take colors, spacing, and type from the shell's `Color` and `Style` helpers instead of hardcoding them, keep `bin/tmm` clean POSIX `sh`, and test with `sh -n`, JSON validation, and `omarchy plugin validate`. It also asks that a QML file do one job. The plugin is MIT licensed. If you want to understand how a plugin like this is built before you open a pull request, read [Building Your Own Omarchy Plugin](/guides/building-your-own-omarchy-plugin).

Check yourself before moving on:

```quiz
[
  {
    "q": "omarchy-shell shell summon tmm.manual prints ok, but no window appears. What does that tell you?",
    "choices": [
      "The plugin is disabled, so enable it",
      "The plugin is not installed, so run omarchy plugin add again",
      "The shell loaded the plugin and opened it, but an error in its QML stopped it drawing, so read the journal with journalctl -t omarchy-shell"
    ],
    "answer": 2,
    "explain": "ok means the shell has the plugin loaded and tried to open it. The enable check is already behind you, so the shell's log is the next place to look.",
    "why": ["ok means the shell already has the plugin loaded, so the enable check is behind you.", "A plugin that is not installed is not loaded, so summon would not say ok.", null]
  },
  {
    "q": "Every diagram in the reader shows as a small Diagram · mermaid card, and you are online. What is the most likely cause?",
    "choices": [
      "Nothing on the machine can turn the diagram into an image, for example no rsvg-convert or ImageMagick, or python3 or the helper script cannot run",
      "Your Omarchy theme is not supported",
      "The study chat is turned on"
    ],
    "answer": 0,
    "explain": "The helper recolors the website's diagram and rasterizes it with rsvg-convert or ImageMagick. If it cannot, the reader falls back to a card. Test the helper with curl piped into bin/tmm-diagrams.",
    "why": [null, "Theme changes only recolor diagrams; they never turn them into cards.", "The chat has no effect on how diagrams are drawn."]
  },
  {
    "q": "While reading in the window you find a wrong command inside a guide. Where does the report belong?",
    "choices": [
      "The plugin's issue tracker, because the plugin displays it",
      "The Missing Manual itself, because guide content lives upstream, not in the plugin",
      "Omarchy's repository"
    ],
    "answer": 1,
    "explain": "The plugin only reads and displays the library. The README says content bugs belong with The Missing Manual, not with the plugin.",
    "why": ["The plugin does not own the text it shows; a fix there could not change the guide.", null, "Omarchy does not write or host these guides."]
  }
]
```

## Recap

1. Work down the card in order: `omarchy plugin list` for the enabled state, then whether `summon` says `ok` or `unknown`, then the journal with `journalctl -t omarchy-shell`.
2. Diagram cards mean nothing could turn the diagram into an image, `python3` or the helper cannot run, or you are offline.
3. Search, phases, and Ask go to themissingmanual.dev. With a provider configured, chat text goes to that provider only, and your key goes to the `baseUrl` you typed.
4. Locally it keeps a cache, a recents file, a widths file, and `ai.json`. The chat conversation lives in memory and is never written to disk.
5. For a bug report, bring your versions, what you pressed, and the journal lines, and never paste `ai.json`. Content mistakes go to The Missing Manual, not the plugin repo.

You now have the whole path: install it, learn the keys, shape it, and fix it. To see how a plugin like this is built, or to build your own, continue with [Building Your Own Omarchy Plugin](/guides/building-your-own-omarchy-plugin).
