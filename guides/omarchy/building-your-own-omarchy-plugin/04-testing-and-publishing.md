---
title: "Testing and Publishing"
guide: "building-your-own-omarchy-plugin"
phase: 4
summary: "Run the pre-share test checklist, swap the temporary clone id for a permanent one, prepare the public repository, and submit the plugin to the Omarchy marketplace."
tags: [omarchy, plugins, publishing, marketplace, testing, git]
difficulty: advanced
synonyms: ["how to publish an omarchy plugin", "submit plugin to omarchy marketplace", "omarchy plugin readme template", "omarchy plugin permanent id", "omarchy plugin clonedFrom remove", "test omarchy plugin before sharing", "omarchy plugin update for users"]
updated: 2026-10-04
---

# Testing and Publishing

A plugin that works on your machine, in your clone, with your settings is a draft. Publishing means strangers will install it into a process that runs as them. This phase is the pre-flight list, the id change that turns a clone into a real plugin, and the three-step marketplace submission.

## Test like a stranger will use it

The official development guide lists what to test before sharing. Run through all of it:

1. **Click** the widget, and use every control in the panel.
2. **Escape** closes the panel.
3. **Shell open and close** work: `omarchy-shell shell summon <id> '{}'` and `omarchy-shell shell hide <id>`.
4. **Disable** it with `omarchy plugin disable <id>`, then **re-enable** it.
5. **Restart the shell** with `omarchy restart shell` and confirm it comes back.
6. **Removal** with `omarchy plugin remove <id>` leaves the desktop intact. For a clone, the built-in returns.

Add three checks that the docs do not list but that follow from them (our advice):

- **Validate again** with `omarchy plugin validate` and `qmllint`, from Phase 2, after your last edit.
- **Test from a fresh clone of your public repo**, not your working folder. This catches files you forgot to commit.
- **Test with the optional dependencies missing.** If your README names an optional tool, remove it and confirm the plugin degrades politely.

```bash
git clone https://github.com/yourname/custom-clock.git /tmp/custom-clock-check
omarchy plugin validate /tmp/custom-clock-check
```

*What just happened:* you ran the same manifest checks Omarchy runs at install time, against exactly what a user would receive. If it prints nothing and exits cleanly, the layout is sound.

## Turn the clone into a plugin

A clone is made to be temporary. Before you publish:

1. **Choose a permanent namespaced id.** The official example is `io.github.yourname.custom-clock`. Change it in `manifest.json` and in `moduleName` in every QML file that sets it. The official example uses the plugin id as `moduleName` in both files, so keep them in sync.
2. **Remove `omarchy.clonedFrom`.** It is development-only; its job was to restore the built-in when you removed the clone.
3. **Rewrite the description** to say what your plugin does, not what you cloned.
4. **Check the license.** The official example's LICENSE is MIT and lists the Omarchy copyright line (David Heinemeier Hansson) next to the plugin author's. If you started from a built-in, follow the same pattern and keep that notice.

Here is the finished manifest from the official guide, with the clone-only field gone:

```json
{
  "schemaVersion": 1,
  "id": "io.github.yourname.custom-clock",
  "name": "Custom Clock",
  "version": "1.0.0",
  "author": "Your name",
  "license": "MIT",
  "description": "A small clock with a details panel for the Omarchy bar.",
  "kinds": ["bar-widget"],
  "entryPoints": { "barWidget": "BarWidget.qml" },
  "barWidget": {
    "displayName": "Custom Clock",
    "category": "Time",
    "allowMultiple": false,
    "defaultSection": "center"
  }
}
```

The official guide adds a caution to take literally: use the example as a structural reference. Do not copy the id, repository URL, author, or description unchanged.

## Prepare the repository

The marketplace asks for four things, plus one optional:

- A **public GitHub repository**.
- A valid `manifest.json` **in the repository root**.
- A **README and a license**.
- **Safe install and removal**.
- Optionally a `preview.png`, which the marketplace optimizes for you.

The README the official guide shows is a good template, with four short sections: install, usage, configure, remove.

````markdown
# Custom Clock

A small clock with a details panel for the Omarchy Quattro bar.

## Install

```sh
omarchy plugin add https://github.com/yourname/custom-clock.git --enable
```

## Usage

Click the clock to open or close the details panel. Press Escape to close it.

## Configure

```sh
omarchy bar move io.github.yourname.custom-clock --section center
```

## Remove

```sh
omarchy plugin remove io.github.yourname.custom-clock
```
````

Add to it everything Phase 3 asked you to document: each external dependency, setup step, privilege boundary, service, installer, or remote build. If you ship a keybinding fragment or menu rows, say how to add and how to remove them.

Copy the files into a new working folder outside the plugins directory, so your repository is separate from the live clone, and make the id, `clonedFrom`, README, and LICENSE edits there. Put it under git (see [Git From Zero](/guides/git-from-zero) for what each command does), create the empty public repository on GitHub, and push:

```bash
mkdir -p ~/code/custom-clock
cp -r ~/.config/omarchy/plugins/yourname.clock/. ~/code/custom-clock/
cd ~/code/custom-clock
git init
git add .
git commit -m "Add custom clock plugin"
git branch -M main
git remote add origin https://github.com/yourname/custom-clock.git
git push -u origin main
```

> ⚠️ **Gotcha.** Set the permanent id in `manifest.json` before you commit, and read `git status` before the first commit. Everything you push is public, so never commit keys, tokens, or personal config.

Then install it the way a user would, from your own URL. Remove the clone first, so the two do not fight over the same widget:

```bash
omarchy plugin remove yourname.clock
omarchy plugin add https://github.com/yourname/custom-clock.git --enable
```

If that works, your plugin installs from nothing but your repo, under its permanent id.

## Submit to the marketplace

Publishing is three steps on [plugins.omarchy.org/publish.html](https://plugins.omarchy.org/publish.html):

1. **Prepare the repository** (above).
2. **Add a manifest** with every field the listing needs, and validate it. The required fields are `schemaVersion`, `id`, `name`, `version` (up to 64 characters), `author`, `description`, `kinds`, and `entryPoints`.
3. **Submit** with the [issue form](https://github.com/omacom/omarchy-plugin-marketplace/issues/new?template=submit-plugin.yml): your repository link, a category, and tags. Automated validation checks the current commit before a maintainer approves the listing.

The page says it plainly: the marketplace validates listings, not plugin security, and you remain responsible for your code, assets, documentation, and license.

Skipping the marketplace is also legitimate. A public git repo is the whole distribution mechanism: anyone can run `omarchy plugin add` against your URL.

## Shipping updates

When users run `omarchy plugin update <id>`, Omarchy fast-forwards their checkout to your latest commits, shows them the diff first, and rolls back if the new revision fails validation. Three habits follow from that:

- **Validate before every push.** A revision that fails validation does not reach users, but it also does not help them.
- **Do not rewrite published history.** An update is a fast-forward, and a rewritten branch cannot be fast-forwarded.
- **Make diffs reviewable.** Users are told to read the diff; small, focused commits make that review possible. Bump `version` when you release.

Put the checklist to work:

```exercise
[
  {
    "type": "task",
    "task": "Take the plugin you built or cloned and take it to publish-ready. Work through the list, then check each item off.",
    "reveal": "A publish-ready plugin has a permanent namespaced id (not omarchy.*) matching moduleName in every QML file, no omarchy.clonedFrom, a valid manifest in the repo root, a README with install/usage/configure/remove and every dependency documented, a license, and passes omarchy plugin validate from a fresh clone.",
    "checklist": ["Permanent namespaced id set in manifest and in every moduleName", "omarchy.clonedFrom removed", "README documents install, usage, configure, remove, and every dependency", "LICENSE present", "omarchy plugin validate passes on a fresh clone of the public repo", "Click, Escape, summon, hide, disable, enable, shell restart, and remove all tested"]
  }
]
```

Check yourself before moving on:

```quiz
[
  {
    "q": "Which change turns a development clone into a publishable plugin?",
    "choices": [
      "Rename the folder only",
      "Set a permanent namespaced id, remove omarchy.clonedFrom, and move the files into a public repo with README and license",
      "Add the omarchy. prefix to the id so it looks official"
    ],
    "answer": 1,
    "explain": "The clone id is temporary, clonedFrom is development-only, and the omarchy. prefix is reserved and rejected by the validator.",
    "why": ["The manifest id and every moduleName must change too.", null, "The reserved omarchy.* namespace is refused outright."]
  },
  {
    "q": "A user runs omarchy plugin update on your plugin. Which statement is true?",
    "choices": [
      "It reinstalls the plugin from scratch and discards their settings",
      "It fast-forwards their checkout to your newer commits, shows the diff first, and rolls back if the new revision fails validation",
      "It only works if the plugin is listed on the marketplace"
    ],
    "answer": 1,
    "explain": "Plugins are plain git checkouts; update is a fast-forward pull with a diff preview and a validation rollback."
  },
  {
    "q": "Your plugin is approved and listed on the marketplace. What does that mean for its security?",
    "choices": [
      "The maintainers audited it, so users do not need to read it",
      "Nothing about security: the marketplace validates listings, not plugin security, and you remain responsible for your code",
      "Omarchy sandboxes listed plugins"
    ],
    "answer": 1,
    "explain": "The publishing page states this directly. Document and bound what your plugin does."
  }
]
```

## Recap

1. Test the way a stranger will: click, Escape, summon and hide, disable and re-enable, shell restart, removal; also from a fresh clone of your public repo.
2. Replace the clone id with a permanent namespaced one (for example `io.github.yourname.custom-clock`), keep `moduleName` in sync, and delete `omarchy.clonedFrom`.
3. A listing needs a public GitHub repo, `manifest.json` at its root, a README and license, and safe install and removal; a `preview.png` is optional.
4. Submit through the marketplace issue form with the repository, a category, and tags; automated validation checks the commit, then a maintainer approves.
5. Users update by fast-forward with a diff preview and a validation rollback, so do not rewrite published history.
6. A public git repo alone is a complete distribution: anyone can `omarchy plugin add` your URL.

Your plugin is on its way. If an experiment ever leaves the desktop in a state you cannot get out of, [When Omarchy Breaks](/guides/when-omarchy-breaks) is the recovery guide.
