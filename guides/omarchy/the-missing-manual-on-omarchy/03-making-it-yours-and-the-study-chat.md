---
title: "Making It Yours: Themes, Hotkeys, and the Study Chat"
guide: "the-missing-manual-on-omarchy"
phase: 3
summary: "Change the theme, layout, hotkeys, and bar spot of the tmm.manual plugin, then set up the bring-your-own-key study chat and learn exactly where your key is stored."
tags: [omarchy, plugin, configuration, theming, hotkeys, ai-chat, api-key, tmm-manual]
difficulty: beginner
synonyms: ["how to change the theme of the missing manual plugin", "omarchy tmm ai.json", "tmm study chat api key", "where is my api key stored omarchy plugin", "omarchy tmm custom keybinding open a guide", "use claude code or ollama with the missing manual plugin", "tmm ctrl k chat"]
updated: 2026-10-04
---

# Making It Yours: Themes, Hotkeys, and the Study Chat

The reader ships with sensible behavior and very few switches, so making it yours means a theme, a layout, a hotkey, and the optional study chat. The chat is the one part that can send your text somewhere other than themissingmanual.dev, so this phase also says exactly where your key lives.

## What you can change

There is no settings file for the reader itself. These are the real levers:

| Lever | How | Saved? |
|---|---|---|
| Reading theme | `Ctrl + T` cycles auto, light, dark | No. It resets to auto when the shell restarts |
| Column layout | `s` folds the list; drag a divider to resize | Widths are saved in `~/.local/state/omarchy/tmm-ui.json` |
| Desktop look | Switch your Omarchy theme | Follows it live |
| Bar position | `omarchy bar move tmm.manual --section left` | Omarchy saves bar layout |
| Hotkeys | Your `~/.config/hypr/bindings.lua` | Yours |
| Study chat | The settings form, or `~/.config/tmm/ai.json` | Yes |
| Which server | The `TMM_BASE` environment variable | n/a |

## Theming

In **auto** mode the window asks the running Omarchy theme for its background, foreground, accent, and error colors, and takes its font and spacing from the shell as well, so a theme switch repaints it with no action from you. Code highlighting picks a light or dark palette by checking how bright your desktop background is. Mermaid diagrams are re-baked in the new palette whenever the colors change.

`Ctrl + T` from anywhere pins the window to **light** or **dark** instead: fixed reading palettes, independent of the desktop, for guides that read better one way. Press it a third time to return to auto. Try it now: open a phase with a diagram, press `Ctrl + T` twice, and watch the code cards and the diagram change together.

To test the follow-the-desktop part, open Omarchy's theme menu with `Super + Shift + Ctrl + Space`, pick another theme, and look at the reader again. If the window looks unstyled instead, it cannot find the shell's `qs.Commons` theme module, which means you are not on Omarchy 4.

## Make it reachable

You already have `Super + Alt + M`, `Super + Alt + B`, and `Super + Alt + R` from Phase 1. Every hotkey is a command, and the window accepts a small JSON payload that decides where it opens. These are the keys it understands:

| Payload | Opens |
|---|---|
| `{"query":"git rebase"}` | The search view with that query already run |
| `{"slug":"linux-from-zero","phase":1}` | That exact phase |
| `{"catalog":true}` | The catalog |
| `{"random":true}` | A random guide |

Bind one to a key of your own. In `~/.config/hypr/bindings.lua`:

```lua
o.bind("SUPER + ALT + L", "Missing Manual: Linux From Zero", "omarchy-shell shell summon tmm.manual '{\"slug\":\"linux-from-zero\",\"phase\":1}'")
```

*What just happened:* Lua reads `\"` inside its double-quoted string as a plain double quote, so the shell receives `'{"slug":"linux-from-zero","phase":1}'` in single quotes, which keeps the JSON in one piece. `Super + Alt + L` is not bound in Omarchy 4.0.4's default bindings. Run `hyprctl reload`, then press `Super + K` to see Omarchy's keybindings list.

To move the bar button, use `omarchy bar move tmm.manual --section left` (or `--index 0` for the first spot in a section). To reword or reorder the menu rows, edit `~/.config/omarchy/extensions/omarchy-menu.jsonc`; remember that `tmm-menu install` replaces every entry whose key starts with `tmm`.

To point the window or the terminal client at another server, such as a self-hosted copy of the library, set `TMM_BASE`:

```bash
TMM_BASE=http://localhost:5173 tmm search "networks"
```

The window reads `TMM_BASE` from the environment of the running shell, so exporting it in one terminal does not reach it.

## The study chat

There are two AI features in the window, and they are not the same thing:

| | Ask (`?`) | Study chat (`Ctrl + K`) |
|---|---|---|
| Whose AI | The website's answer service | A model **you** configure |
| Whose budget | The site's monthly budget | Your provider account or subscription |
| Needs setup | No | Yes, or it runs in retrieval mode |
| Context | Your question only | The phase you are reading, plus your conversation |

Press `Ctrl + K` to open a dock titled "Ask the tutor" beside the reader. In a wide window it sits on the right and the left list folds away. With no provider configured it works in **retrieval mode**: it searches the manual and replies with the most relevant sections, each with a clickable source chip that opens that phase, and the dock says "retrieval mode" to remind you. Three starter chips, such as "Show a real example", send a question in one click.

### Turn on real answers

Click the gear in the dock's header, or press `Ctrl + ,`. Pick a provider, fill in the fields it shows, and press `Ctrl + S` (or `Ctrl + Enter`) to save. `Esc` cancels. The form writes `~/.config/tmm/ai.json`, and changes apply at once without a restart. The "None" choice saves an empty object (`{}`), which means retrieval mode.

| Provider | Runs on | You provide |
|---|---|---|
| `claude-cli` | Claude Code, the `claude` command | The CLI installed and signed in |
| `codex` | OpenAI Codex, the `codex` command | The CLI installed and signed in |
| `cursor` | Cursor Agent, the `cursor-agent` command | The CLI installed and signed in |
| `opencode` | The `opencode` command | The CLI installed and signed in |
| `openai` | Any OpenAI-compatible endpoint: OpenAI, OpenRouter, Groq, or a local Ollama or LM Studio server | `baseUrl`, `apiKey`, `model` |
| `anthropic` | Anthropic's Messages API | `apiKey`, `model` |

The four CLI providers run a tool you have already signed in to, so, per the README, answers use that tool's subscription with no API key and no per-token bill. The README says each CLI runs inside a scratch folder with its tools locked down so the chat can only return text: Claude Code gets no tools and no MCP servers, Codex runs in its read-only sandbox, Cursor in ask mode, and opencode as a dedicated agent with every permission denied. They are slower, because each reply starts the agent, and each call is cut off after 150 seconds.

If you prefer a file to the form, `~/.config/tmm/ai.json` is plain JSON, so no comments are allowed. Three working shapes:

```json
{ "provider": "claude-cli" }
```

```json
{ "provider": "openai", "baseUrl": "http://localhost:11434/v1", "apiKey": "ollama", "model": "llama3.1" }
```

```json
{ "provider": "anthropic", "apiKey": "YOUR-KEY-HERE", "model": "YOUR-MODEL-ID" }
```

The second one is the README's local-model example: a free Ollama server on your own machine. The plugin treats an API provider as ready only when it has a key and a model, so a local server gets a placeholder key. Put a real model id in the third example, the one your provider documents.

| Field | Meaning |
|---|---|
| `provider` | One of the six values above (required) |
| `baseUrl` | Required for `openai`. Optional for `anthropic`, where it defaults to `https://api.anthropic.com` |
| `apiKey` | Required for `openai` and `anthropic`. Can come from the `TMM_AI_KEY` environment variable instead |
| `model` | Required for `openai` and `anthropic`. Optional for the CLI providers |
| `bin` | The CLI's full path, if it is not on your `PATH` |
| `maxTokens` | Reply length limit for the API providers. Defaults to 1024 |
| `effort` | A reasoning-effort hint such as `low`, where the provider supports it |
| `systemPrompt` | Replaces the built-in "Tutor" instructions |

The README's advice is that studying does not need a frontier model: set `model` (and `effort`) to a cheaper, faster one.

### Where a chat message goes

With a provider configured, a chat message goes to that provider only (or, for the four CLI providers, to the tool on your machine), and not to The Missing Manual. With none configured, your question goes to the site's free retrieval endpoint instead. Phase 4 has the complete table of what is sent where.

### Where your key lives

The key sits in `~/.config/tmm/ai.json` as plain text. It is not encrypted, so treat the file like a password:

- When the form saves, it creates the folder with owner-only access (mode 700) and writes the file through a temporary file with owner-only access (mode 600), then renames it into place. A file you create by hand has whatever permissions you give it, so run `chmod 600 ~/.config/tmm/ai.json`.
- The key, the request, and your conversation are passed to the program that talks to your provider through a private pipe (standard input), never as command-line arguments. Command-line arguments can be read by other programs through the process list; a pipe cannot.
- `TMM_AI_KEY` is an alternative to storing the key in the file. It is read from the environment of the running shell process, so a variable exported in a terminal does not reach it.
- If you keep your dotfiles in a git repository, keep `~/.config/tmm/` out of it. [Secrets Management](/guides/secrets-management) explains why a key that reaches a repository should be treated as leaked.

If a key does leak, revoke it at your provider; deleting the file is not enough.

Check yourself before moving on:

```quiz
[
  {
    "q": "You want a hotkey that opens phase 1 of linux-from-zero directly. Which command should the binding run?",
    "choices": [
      "omarchy-shell shell summon tmm.manual '{\"slug\":\"linux-from-zero\",\"phase\":1}'",
      "omarchy-shell shell summon tmm.manual linux-from-zero",
      "omarchy plugin enable linux-from-zero"
    ],
    "answer": 0,
    "explain": "The window takes its instructions as a JSON payload. The slug and phase keys open an exact phase.",
    "why": [null, "The payload has to be JSON. A bare word is not valid, and the window reports that the payload was not valid JSON.", "omarchy plugin enable turns a plugin on by its id. linux-from-zero is a guide, not a plugin."]
  },
  {
    "q": "How is your API key stored, and how does the plugin hand it to your provider?",
    "choices": [
      "Encrypted in the system keyring, and passed to curl as a command-line argument",
      "In the cache folder, so it can be shared with the tmm command",
      "As plain text in ~/.config/tmm/ai.json (saved with owner-only permissions by the form), and passed to the program on standard input rather than on a command line"
    ],
    "answer": 2,
    "explain": "The file is not encrypted, so protect it like a password. Keeping the key off command lines stops other programs from reading it in the process list.",
    "why": ["The plugin does not use the keyring, and a command-line argument would be visible to other programs.", "The key lives in ai.json under your config folder, not in the cache.", null]
  },
  {
    "q": "You set provider openai with a baseUrl pointing at your own Ollama server and ask the study chat a question. What does themissingmanual.dev receive from that chat message?",
    "choices": [
      "Your question, as a free retrieval request",
      "Nothing from the chat. The conversation goes to your own server",
      "Your API key"
    ],
    "answer": 1,
    "explain": "With a configured provider the chat goes to that provider only. Retrieval mode, which asks the website, is the fallback for when no provider is set.",
    "why": ["That only happens in retrieval mode, which is used when no provider is configured.", null, "The key goes to the baseUrl you configured, never to the website."]
  }
]
```

## Recap

1. The reader has few switches: `Ctrl + T` for the reading theme (not saved), draggable column widths (saved), your own hotkeys, and the optional study chat. The window follows your Omarchy theme live.
2. A summon payload such as `{"slug":"linux-from-zero","phase":1}` lets a hotkey open an exact phase, a search, the catalog, or a random guide.
3. The study chat is bring-your-own-model: a CLI you already use, an OpenAI-compatible endpoint (including local Ollama), or Anthropic's API. With none configured it falls back to retrieval from the manual.
4. Your key is plain text in `~/.config/tmm/ai.json`, saved with owner-only permissions by the form and kept off command lines. Keep that file out of any repository, and revoke the key at your provider if it leaks.

Next up, [Where Your Data Goes, and Fixing It When It Breaks](04-where-your-data-goes-and-fixing-it.md): the full table of what is sent where, a symptom-to-fix card, and how to report a bug.
