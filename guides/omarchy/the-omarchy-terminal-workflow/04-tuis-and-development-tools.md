---
title: "TUIs and Development Tools"
guide: "the-omarchy-terminal-workflow"
phase: 4
summary: "Meet the terminal apps Omarchy ships (lazygit, lazydocker, btop), then set up languages with mise, run Docker with its sudo default, and start local databases in containers."
tags: [omarchy, tui, lazygit, lazydocker, btop, mise, docker, databases, development]
difficulty: intermediate
synonyms: ["omarchy lazygit", "omarchy lazydocker permission", "omarchy install node python ruby", "omarchy mise", "omarchy docker sudo", "omarchy sudoless docker", "omarchy install postgres docker", "omarchy btop activity", "omarchy gh auth login", "omarchy add my own tui"]
updated: 2026-10-04
---

# TUIs and Development Tools

A TUI is a terminal user interface: a full-screen app that runs in the terminal and takes keyboard input. Omarchy ships several, and they cover jobs that usually need a separate GUI. The same menu installs your languages and gets Docker running. This phase covers both, with the decisions Omarchy made for you, including the one that surprises people: Docker needs `sudo` by default.

## The TUIs that ship with Omarchy

| App | Start it | What it is for |
|---|---|---|
| Lazygit | `lazygit` in a Git repo, or `Space G G` in Neovim | Drive Git with a keyboard interface |
| Lazydocker | `Super + Shift + D` | See and manage containers and images |
| Btop (called Activity) | `Super + Ctrl + T` | Watch CPU, memory, disk, network, and processes |
| Herdr | `Super + Ctrl + Return` | Terminal workspaces with sessions you can detach from |
| Fastfetch (called About) | _About_ in the Omarchy menu | System information |
| Disk Usage | _Disk Usage_ in the launcher (`Super + Space`) | Find what fills the drive and delete from inside it |
| Cliamp | `Super + Shift + Alt + M` | A retro terminal music player |

Each shows its own keys with `?`. A few worth knowing:

- **Lazygit**: `Tab` hops between panes. In the Files pane, `Space` stages a file and `c` starts a commit. [Git From Zero](/guides/git-from-zero) explains the staging and committing it shows.
- **Lazydocker**: `s` stops a container and `r` starts or restarts it.
- **Btop**: it opens as a floating window. Press `Super + T` to tile it. To understand what the numbers mean, read [Processes, Memory, and CPU](/guides/processes-memory-and-cpu).
- **Disk Usage** is `dua` in interactive mode, pointed at the whole file system. It sorts the biggest first and lets you walk down into the culprit.

Wi-Fi and Bluetooth have no TUI. Click the bar icon or use `Super + Ctrl + W` and `Super + Ctrl + B`.

Any terminal program can become a launcher entry. Open _Install > TUI_, give it a name, a launch command, a window style, and an icon, and it appears in the app launcher. Remove it again under _Remove > TUI_.

## Languages and versions with mise

Omarchy sets up development environments from _Install > Development_ in the Omarchy menu. The list covers Ruby on Rails, JavaScript (Node.js, Bun, Deno), PHP with Laravel or Symfony, Go, Rust, Python, Java, Elixir with Phoenix, .NET, OCaml, Zig, Clojure, and Scala.

Most are managed by [mise](https://mise.jdx.dev/), a tool for installing and running several versions of a language on one machine. It plays the role that rbenv does for Ruby or virtualenv does for Python, across many languages. The two commands you need:

```bash
mise use -g ruby
mise i
```

*What just happened:* the first installs Ruby and makes it the global default (`-g`). The second, run in a project folder that has a `.ruby-version` file, installs the version that project asks for. Replace `ruby` with the language you want.

Reading the install scripts shipped with 4.0.4, a few environments use the language's own installer instead of mise: Rust installs through rustup, OCaml through opam, and Python installs through mise but also adds [uv](https://docs.astral.sh/uv/). [Python Packaging: pip, Poetry, and uv](/guides/python-packaging-pip-poetry-uv) covers what that gives you.

`omarchy update` keeps the mise-managed tools current, and the `mup` alias updates them on their own.

## Docker, and why it needs sudo

Omarchy installs Docker and Docker Compose, and then makes one deliberate choice. Your user is **not** in the `docker` group by default. Membership in that group is effectively passwordless root, because anything in it can run a container that mounts the whole disk and takes over the machine, so a single rogue script or dependency running as you would be one command from root.

So on the command line, you use `sudo`:

```bash
sudo docker ps
sudo docker compose up
```

The graphical tools, Lazydocker on `Super + Shift + D` and the Windows VM, ask for authorization instead; Lazydocker prompts the first time.

If you understand the tradeoff and want plain `docker` back, enable it from _Setup > Security > Sudoless Docker_ (or `omarchy-setup-security-sudoless-docker`). It shows a warning, then adds you to the group, and takes effect after a reboot. After that, `docker` and its `d` alias work without `sudo`.

For what containers are and how Compose files work, see [Docker Without the Magic](/guides/docker-without-the-magic) and [Docker Compose for Real Projects](/guides/docker-compose-for-real-projects).

### Databases in one menu click

_Install > Development > Docker DB_ starts a database in a container. The choices are MySQL, PostgreSQL, Redis, MongoDB, MariaDB, and MSSQL. From the install script:

- Each container is published only on `127.0.0.1`, so it is reachable from your machine and not from the network.
- Each is started with `--restart unless-stopped`, so it comes back after a reboot.
- Ports are the standard ones (PostgreSQL 5432, Redis 6379, MongoDB 27017, and so on). MySQL and MariaDB both use 3306, so you cannot run both at once.
- The setups are for local development: the PostgreSQL container, for example, accepts connections without a password.

> ⚠️ **Gotcha**: those development defaults are only safe because of the `127.0.0.1` binding. Never publish one of these containers on a public address with its default credentials.

## GitHub and AI agents

`gh`, the GitHub command-line tool, is a lazy stub: the first time you run it, it installs itself. Then `gh auth login` signs you in, and `gh repo clone org/repo` clones private repositories. Lazygit is preinstalled, and a `ghui` stub gives you a pull-request TUI.

Omarchy also pre-wires the major coding-agent command-line tools (`claude`, `codex`, `opencode`, `gemini`, `copilot`, and others) as lazy stubs in `~/.local/bin`. Nothing downloads until you first run one. Pick a default under _Setup > Defaults > Agent_ or with `omarchy default agent <name>`, launch it with `Super + Shift + Ctrl + A`, or run `a` for it inline. Agents started this way run in their don't-stop-to-ask modes, as covered in [Phase 2](02-tmux-sessions-windows-and-panes.md). For the habits that keep that useful, read [AI in the Terminal CLIs](/guides/ai-in-the-terminal-clis).

## Your turn: Docker the Omarchy way

```exercise
[
  {
    "type": "predict",
    "task": "On a default Omarchy install (not in the docker group), type the command that lists running containers.",
    "accept": ["/^sudo\\s+docker\\s+ps$/i"],
    "hint": "It is the usual Docker command, with the privilege prefix Omarchy's default requires."
  }
]
```

Check yourself before moving on:

```quiz
[
  {
    "q": "Why does Omarchy not add your user to the docker group by default?",
    "choices": [
      "Docker does not work with groups",
      "Membership in that group is effectively passwordless root, so any script running as you could take over the machine",
      "To save disk space"
    ],
    "answer": 1,
    "explain": "A user in the docker group can run a container that mounts the whole disk. Omarchy keeps you out of it, so docker commands need sudo, unless you opt in under Setup > Security > Sudoless Docker.",
    "why": ["Docker uses a group; that is the problem Omarchy is avoiding.", null, "Disk space is not the reason."]
  },
  {
    "q": "You run mise i inside a project folder that contains a .ruby-version file. What does it do?",
    "choices": [
      "Installs the version of Ruby that the project asks for",
      "Deletes your global Ruby",
      "Updates Omarchy"
    ],
    "answer": 0,
    "explain": "mise reads the project's version file and installs what it names. mise use -g sets a global default instead."
  },
  {
    "q": "You install PostgreSQL from Install > Development > Docker DB. Who can connect to it?",
    "choices": [
      "Anyone on your network",
      "Only programs on your own machine, because the container is published on 127.0.0.1",
      "Only after you set a password"
    ],
    "answer": 1,
    "explain": "The install script publishes it on 127.0.0.1, which is why its development defaults (no password) are tolerable. Never expose it publicly with those defaults."
  }
]
```

## Recap

1. Omarchy ships TUIs for Git (`lazygit`), containers (`Super + Shift + D`), and system monitoring (`Super + Ctrl + T`), and you can add your own under _Install > TUI_.
2. Install languages from _Install > Development_. Most use mise: `mise use -g <language>` for a global default, `mise i` for a project's pinned version.
3. Docker is installed, but your user is not in the `docker` group, so use `sudo docker ...` or opt in under _Setup > Security > Sudoless Docker_.
4. _Install > Development > Docker DB_ runs MySQL, PostgreSQL, Redis, MongoDB, MariaDB, or MSSQL on `127.0.0.1` with local-development defaults.
5. `gh` and the coding agents are lazy stubs that install on first run; the agent aliases run in auto-approve modes.

That completes the toolkit. To keep it all current, see [Installing and Updating Software on Omarchy](/guides/installing-and-updating-software-on-omarchy), and for when something stops working, [When Omarchy Breaks](/guides/when-omarchy-breaks).
