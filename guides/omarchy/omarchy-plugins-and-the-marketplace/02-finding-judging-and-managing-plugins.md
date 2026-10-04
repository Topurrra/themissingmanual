---
title: "Finding, Judging, and Managing Plugins"
guide: "omarchy-plugins-and-the-marketplace"
phase: 2
summary: "Browse the community marketplace, read a plugin's code before you enable it, and use the real omarchy plugin commands to add, enable, disable, update, and remove plugins."
tags: [omarchy, plugins, marketplace, omarchy-plugin, security-review]
difficulty: intermediate
synonyms: ["how to install an omarchy plugin", "omarchy plugin add", "omarchy plugin list", "omarchy plugin remove", "omarchy plugin update", "how to check if an omarchy plugin is safe", "plugins.omarchy.org", "enable disable omarchy plugin"]
updated: 2026-10-04
---

# Finding, Judging, and Managing Plugins

Because a plugin runs with your access (Phase 1), the skill that matters is not the install command. It is deciding what deserves to be installed, and knowing how to take it back out. The commands are short; the habit is the lesson.

## Where plugins come from

A plugin is a git repository with a `manifest.json` at its root. That is the whole distribution mechanism: anyone can publish one, and anyone can run `omarchy plugin add` against its URL.

To find them, use the community marketplace at [plugins.omarchy.org](https://plugins.omarchy.org). You can browse and search, sort by recently added, most starred, most viewed, most copied, install rate, or verified and unverified, and copy the install command from a listing. The marketplace's source repository is `omacom/omarchy-plugin-marketplace`.

What does a listing guarantee? Automated checks validate the plugin's current commit and a maintainer approves the listing. The marketplace's own words on what that covers: it validates listings, not plugin security. A listing tells you the plugin passed the marketplace's automated checks and a maintainer approved it. It does not tell you the code is safe.

## Judge before you enable

Treat a plugin the way you would treat a script a stranger asks you to run, because that is what it is. This checklist is our advice, built from what the official docs say plugins can do:

1. **Who and where.** Is the repository public, with a real README and a license? Does the author's other work look real?
2. **What it claims.** Does the README document every external dependency, setup step, privilege, service, installer, or remote build? The official development guide asks authors to document exactly these, so a plugin that does not is skipping something it was asked to do.
3. **What it declares.** Open `manifest.json`. The `kinds` tell you where it runs: a `service` is headless and never shows a window, which makes it worth extra care.
4. **What else is in the repo.** A plugin is not only QML. Plugins can ship helper scripts (the example in Phase 3 has a `bin/` folder), and those run as you too. Read every script.
5. **What it talks to.** Search the code for network calls and for anything that launches commands:

```bash
cd ~/.config/omarchy/plugins/<id>
grep -rniE "curl|wget|sudo|ssh|http" .
ls -R .
```

6. **Does it ask for more than its job needs?** A clock that wants the network, or a weather widget that wants `sudo`, is a red flag.

> 💡 **Key point.** You can read the code before it runs. `omarchy plugin add` clones the repo and validates it, but does not run any of it. If you do not pass `--enable`, the plugin sits on disk, disabled, until you decide.

## The review-first install

```bash
omarchy plugin add https://github.com/acme/omarchy-weather.git
```

*What just happened:* Omarchy warned you that plugins run as arbitrary, unsandboxed code inside your shell process, showed the URL, and asked you to confirm. Then it cloned the repo into a staging folder, validated the manifest, refused if the id was already in use, moved it into `~/.config/omarchy/plugins/<id>/`, and rescanned. It then asks "Enable now?". Answer no, go read the folder, and enable it when you are satisfied.

The URL check also refuses a URL that names a git option or a transport helper, so a malicious "URL" cannot run a command before the plugin is validated. That protects the clone step. It does not make the plugin's own code safe.

## The command set

Every command below is a real `omarchy plugin` subcommand at 4.0.4.

| Command | What it does |
|---|---|
| `omarchy plugin list` | Prints every discovered plugin: id, enabled state, first- or third-party, kinds, name. Add `--json` for machines. |
| `omarchy plugin add <git-url> [--enable] [--yes]` | Clones, validates, installs. Alias: `omarchy plugin install`. |
| `omarchy plugin enable <id>` | Turns a plugin on. |
| `omarchy plugin disable <id>` | Turns a plugin off. |
| `omarchy plugin update [id] [--yes]` | Updates one git-managed plugin, or all of them when you give no id. |
| `omarchy plugin remove [id] [--yes]` | Disables, then deletes a plugin. Alias: `omarchy plugin rm`. |
| `omarchy plugin clone <source-id> [--edit]` | Copies a built-in into your own folder (see the building guide). |
| `omarchy plugin validate <plugin-folder>` | Checks a folder against the manifest rules. |

You can do the same from the menu. Press `Super + Space`, then choose _Setup > Plugins_: it offers Enable, Disable, Add, Clone, and Remove, and each picker lists only the plugins that make sense for that action.

### Updating safely

```bash
omarchy plugin update acme.weather
omarchy plugin update
```

Updating is a fast-forward pull of the plugin's git checkout. Omarchy shows you the diff before applying it, refuses if you have local changes it cannot fast-forward past, and rolls back if the new revision fails validation. Read that diff. A plugin you reviewed last month can change under you, and the diff is your chance to review the change.

### Removing

```bash
omarchy plugin remove acme.weather
```

Removal disables the plugin first, then deletes it. If it is a git checkout, the repo is still upstream, so nothing is lost. If it is a symlink, the link is unlinked. A hand-made folder with no git repo is moved to a timestamped backup inside the plugins directory instead of being deleted outright.

If the plugin left things outside its own folder (a menu row, a keybinding, a script in `~/.local/bin`), those are yours to clean up. The next phase shows a real example of that.

### Scripts and AI agents

`add`, `update`, and `remove` ask for confirmation in a terminal even when you give arguments. Without a terminal they refuse rather than guess. `--yes` skips every prompt and is the path for scripts. Use it only when you have already decided to trust the plugin.

## When a plugin does not show up

After adding or hand-copying files, force the shell to look again:

```bash
omarchy-shell shell rescanPlugins
```

Saving any file under `~/.config/omarchy/plugins/` also reloads plugin code automatically. If a reload does not seem to take, `omarchy restart shell` is the stronger reset. A common cause of "it does nothing" is that the plugin was added but never enabled, so check `omarchy plugin list` first. [When Omarchy Breaks](/guides/when-omarchy-breaks) covers deeper recovery.

An installed plugin is a plain git checkout of its repository, so [Git From Zero](/guides/git-from-zero) explains what `update` is doing underneath.

Check yourself before moving on:

```quiz
[
  {
    "q": "A plugin is listed on the marketplace. What does that tell you?",
    "choices": [
      "The code was security audited and is safe to run",
      "Its listing passed automated validation and a maintainer approved it, but the marketplace does not vouch for the plugin's security",
      "Omarchy sandboxes it, so reviewing the code is optional"
    ],
    "answer": 1,
    "explain": "The marketplace validates listings, not plugin security. Plugins run unsandboxed whether or not they are listed."
  },
  {
    "q": "You want to read a plugin's code before it ever runs. Which approach fits?",
    "choices": [
      "omarchy plugin add <url> --enable --yes, then read it afterwards",
      "omarchy plugin add <url>, answer no to Enable now, read the folder under ~/.config/omarchy/plugins/, then omarchy plugin enable <id>",
      "Copy the files in by hand and reboot"
    ],
    "answer": 1,
    "explain": "Adding without enabling clones and validates but runs nothing. Enable only after you have read it.",
    "why": ["That enables it immediately, with no prompts and no chance to read first.", null, "Hand-copied plugins also start disabled, but rebooting is unnecessary and this skips the review habit entirely."]
  },
  {
    "q": "omarchy plugin update acme.weather finds that the new revision fails validation. What happens?",
    "choices": [
      "The broken version is kept so you can debug it",
      "It rolls back to the previous revision",
      "The plugin is removed"
    ],
    "answer": 1,
    "explain": "Update shows the diff first, refuses if local changes block a fast-forward, and rolls back if the new revision fails validation."
  }
]
```

## Recap

1. A plugin is a git repo with a `manifest.json`; the marketplace at plugins.omarchy.org is a directory of them.
2. A listing means the manifest validated and a maintainer approved it, not that the code is safe.
3. Review before enabling: README, manifest kinds, helper scripts, network calls, and anything that asks for more than its job needs.
4. `omarchy plugin add` runs nothing; `--enable` is the only thing between adding and running, so leave it off until you have read the code.
5. The command set is `list`, `add`, `enable`, `disable`, `update`, `remove`, with `clone` and `validate` for authors; `Setup > Plugins` is the menu equivalent.
6. `update` shows a diff and rolls back on failure; `remove` disables first and never silently discards a hand-made folder.

Next up, [Worked Example: The Missing Manual Plugin](03-worked-example-the-missing-manual-plugin.md): review, install, and use a real plugin from start to finish.
