---
title: "Cross-Compile and Ship It"
guide: "cli-tool-go"
phase: 6
summary: "Build til for Windows, macOS, and Linux from one machine with GOOS/GOARCH, install it on your PATH with go install, and map the honest next steps."
tags: [go, cross-compile, goos-goarch, go-install, path]
difficulty: intermediate
synonyms:
  - cross compile go windows mac linux
  - GOOS GOARCH list
  - go install binary to path
  - where does go install put binaries
  - distribute go cli
updated: 2026-07-06
---

# Cross-Compile and Ship It

Your tool works, and it's tested. Two things separate it from the CLIs you use every day: it only exists for one operating system, and you can only run it from one folder. This phase fixes both - and the first fix is going to feel like a trick when you see it, because on most platforms, building for a *different* platform is a miserable afternoon of toolchains and SDKs. In Go it's two environment variables.

## The two knobs: GOOS and GOARCH

A compiled binary is machine code for a specific operating system and a specific CPU family. Remember phase 1, when `go version` printed `windows/amd64` (or your equivalent)? That pair - OS and architecture - is what `go build` targets, and by default it targets the machine you're on. You can see the current values any time:

```console
$ go env GOOS GOARCH
windows
amd64
```

Set them to something else and `go build` produces a binary for *that* platform instead. The whole standard library is written in Go and compiles for every target, so there's no cross-compiler to install, no SDK to download - the toolchain you already have contains everything. (The honest caveat: this holds as long as your project is pure Go, like ours. Depend on a package that wraps C code - some SQLite drivers, for instance - and cross-compiling stops being free. It's a real reason people keep CLI tools stdlib-only.)

The pairs you'll actually use:

| GOOS | GOARCH | Runs on |
|------|--------|---------|
| `windows` | `amd64` | Windows PCs |
| `darwin` | `arm64` | Apple silicon Macs (M1 and later) |
| `darwin` | `amd64` | Intel Macs |
| `linux` | `amd64` | Most Linux servers and desktops |
| `linux` | `arm64` | Raspberry Pi, ARM servers, AWS Graviton |

## Build for three platforms from one chair

On macOS or Linux, you can set the variables for a single command by prefixing it:

```console
$ GOOS=linux GOARCH=amd64 go build -o til-linux
$ GOOS=darwin GOARCH=arm64 go build -o til-mac
$ GOOS=windows GOARCH=amd64 go build -o til.exe
$ ls
go.mod  main.go  main_test.go  til-linux  til-mac  til.exe
```

PowerShell has no prefix syntax - set the variables, build, then unset them so later builds target your own machine again:

```powershell
$env:GOOS = "linux"; $env:GOARCH = "amd64"
go build -o til-linux

$env:GOOS = "darwin"; $env:GOARCH = "arm64"
go build -o til-mac

Remove-Item Env:GOOS, Env:GOARCH
```

*What just happened:* three binaries, three platforms, one machine, a few seconds each. The `-o` flag names the output file - essential here, since all three would otherwise want the same default name. Windows executables need the `.exe` suffix; the other platforms don't use one.

⚠️ **Gotcha:** a cross-compiled binary runs on its *target*, not on you. Build `til-linux` on Windows and try to run it locally and Windows will refuse ("this app can't run on your PC"); a Linux binary on a Mac dies with `exec format error`. The file isn't broken - it's a perfectly healthy Linux program standing in the wrong country. Copy it to a Linux machine, `chmod +x til-linux`, and it runs.

⚠️ **Gotcha, part two:** if you set `$env:GOOS` in PowerShell and forget to remove it, *every* future `go build` and `go run` in that terminal quietly targets Linux - including next week's, if your terminal restores sessions. If Go ever starts producing binaries your own machine can't run, check `go env GOOS` first.

That's distribution solved at the file level: hand `til-mac` to a Mac-owning teammate and it runs, no Go, no installer, no dependencies. This single ability is a large part of why Go owns the CLI-tool niche.

## Put it on your PATH

Typing `./til` from one specific folder is fine for a project; a *tool* answers from anywhere. When you type a bare command name, your shell walks the directories listed in the `PATH` environment variable looking for a matching executable. So `til` needs to live in one of those directories - and Go has a one-command way to do it:

```console
$ go install
```

*What just happened:* silence, which for Go means success. `go install` compiled the module and dropped the binary into Go's designated bin directory: `go env GOPATH` tells you the root (typically `~/go` on macOS/Linux, `C:\Users\you\go` on Windows), and the binaries go in its `bin` subfolder.

```console
$ go env GOPATH
C:\Users\you\go
```

One thing may remain, one time only: making sure that bin folder is on your PATH.

- **Windows:** Start menu → "Edit environment variables for your account" → select `Path` → Edit → New → add `%USERPROFILE%\go\bin`. Open a fresh terminal afterward.
- **macOS / Linux:** add `export PATH="$HOME/go/bin:$PATH"` to your shell's startup file (`~/.zshrc` on modern macOS, `~/.bashrc` on most Linux), then open a fresh terminal.

If you've installed any Go tool before, this is already done. Now the moment the whole guide was building toward - a new terminal, any directory:

```console
$ cd ~
$ til add -tags meta "til is on my PATH now"
Added note #4
$ til tags
TAG   NOTES
cli   1
git   1
go    2
meta  1
```

*What just happened:* no `./`, no project folder, no `go run`. The shell found `til` on your PATH like it finds `git`. Your notes are all still there, because the store lives in `~/.til`, not in the project - a phase-3 decision that quietly becomes load-bearing the moment the binary escapes its folder. `til` is now installed software that you wrote. When you change the code, `go install` again - it recompiles and replaces the binary in place.

## Where to take it next

The tool is genuinely done - and genuinely useful, which makes it the perfect codebase to keep learning in. The honest next steps, roughly in the order they start to itch:

| Want | What it takes |
|------|--------------|
| **A delete command** | `til delete 3`: parse the ID with `strconv.Atoi`, keep every note whose ID doesn't match, save. Stable IDs (phase 3) mean nothing renumbers. Write the test first - you have the pattern. |
| **An edit command** | Same shape as delete: find by ID, replace the text, save. |
| **Export to Markdown** | A `til export` that walks the notes and prints a Markdown list, ready for a blog or a team wiki. Pure formatting - no new concepts. |
| **A version flag** | Add `var version = "dev"` in main.go, print it on `til -version`, and stamp releases at build time with `go build -ldflags "-X main.version=1.0.0"`. |
| **A friendlier CLI framework** | When subcommands multiply and you want auto-generated help and shell completion, the community standard is `spf13/cobra` (it powers kubectl and gh). You'll understand exactly what it automates, because you built the manual version. |
| **Real releases** | Tag versions in git and publish binaries for every platform on a GitHub release page. The `goreleaser` tool automates the build matrix you did by hand above. |

Notice none of these require rearchitecting. Subcommand dispatch, path-taking storage functions, logic separated from printing - the structure you built is the structure these features slot into.

## What you built

Start to finish: a Go module compiled to a single self-contained binary; a subcommand dispatcher with per-command flag sets; JSON persistence that treats a missing file as day one and survives a crash mid-write; search, filtering, and aligned table output; a test suite that caught a planted bug; and binaries for three operating systems, one of which now answers from anywhere on your machine.

More durable than the tool: you now know the shape of every CLI you'll ever build. Parse arguments, dispatch to a handler, keep logic in pure functions, persist state carefully, print for humans, test the decisions. `til` is that shape at its smallest useful size - and everything from `git` to `kubectl` is the same shape, bigger.

Last quiz of the project:

```quiz
[
  {
    "q": "What do GOOS and GOARCH control?",
    "choices": [
      "The compiler's optimization level and debug output",
      "The target operating system and CPU architecture of the binary go build produces",
      "Which directory go install puts the binary in"
    ],
    "answer": 1,
    "explain": "Set the pair and go build emits machine code for that platform - no extra toolchain needed, as long as the project is pure Go."
  },
  {
    "q": "On your Windows machine you run GOOS=linux go build. Can you run the resulting binary locally?",
    "choices": [
      "Yes - Go binaries run on any operating system",
      "No - it is a Linux executable now; your machine needs the windows/amd64 build",
      "Only through go run"
    ],
    "answer": 1,
    "explain": "A binary is machine code for its target platform. Cross-compiling changes where the output runs, not where it was built."
  },
  {
    "q": "Where does go install put the compiled binary?",
    "choices": [
      "In the current project directory",
      "In /usr/local/bin or C:\\Program Files",
      "In the bin folder under go env GOPATH - typically ~/go/bin"
    ],
    "answer": 2,
    "explain": "That folder is Go's home for installed tools. Put it on your PATH once and every future go install lands ready to run."
  }
]
```
