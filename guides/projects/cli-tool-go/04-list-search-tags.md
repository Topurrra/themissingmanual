---
title: "list, search, and tags"
guide: "cli-tool-go"
phase: 4
summary: "Finish the subcommand set - list with -n and -tag flags, case-insensitive search, a tags summary - and align it all into clean tables with text/tabwriter."
tags: [go, tabwriter, cli-output, search, subcommands]
difficulty: intermediate
synonyms:
  - go tabwriter example
  - align columns terminal go
  - go cli table output
  - case insensitive search go
  - count values in map go
updated: 2026-07-06
---

# list, search, and tags

A note you can't find again was never really saved. This phase turns `til` from a log into a memory: `list` learns flags for "the last few" and "only this tag," `search` finds that thing you half-remember from March, and `tags` shows you the shape of what you've been learning. Along the way you'll meet `text/tabwriter`, the standard library's answer to "how do real CLIs print those neat aligned columns?"

One design rule carries this whole phase: **the functions that decide are separate from the functions that print.** `searchNotes` takes notes and returns notes; something else formats them. It reads like fussiness today - in phase 5 it's what makes the logic testable without capturing terminal output.

## Table output with tabwriter

Print notes with plain `Printf` and columns wander - a 2-digit ID pushes its row a character right of a 1-digit one, tags of different lengths shove the text around. Fixed-width format strings like `%-20s` fix alignment but truncate or overflow the moment real data shows up.

`text/tabwriter` solves it properly: you write rows with tab characters (`\t`) between cells, it **buffers everything**, measures the widest cell in each column, and pads every cell to match when you call `Flush`. Columns fit the data, whatever the data is.

```go
// printTable renders notes as an aligned table.
func printTable(notes []Note) {
	if len(notes) == 0 {
		fmt.Println(`No notes yet. Add one: til add "what you learned"`)
		return
	}
	w := tabwriter.NewWriter(os.Stdout, 0, 4, 2, ' ', 0)
	fmt.Fprintln(w, "ID\tDATE\tTAGS\tNOTE")
	for _, n := range notes {
		fmt.Fprintf(w, "%d\t%s\t%s\t%s\n", n.ID, n.Created.Format("2006-01-02"), strings.Join(n.Tags, ","), n.Text)
	}
	w.Flush()
}
```

The `NewWriter` arguments in order: the destination, minimum cell width (0), tab width (4, unused with spaces), padding between columns (2 spaces), the padding character, and flags (none). You rarely change these.

⚠️ **Gotcha:** because tabwriter buffers, **forgetting `w.Flush()` prints nothing at all.** No error, no partial output - the rows sit in the buffer and the program exits. If a table-printing function ever goes silently mute, look for the missing `Flush` before anything else.

## list, grown up

`list` gets its own flag set - the same pattern as `add`, which is the payoff of `NewFlagSet`: each subcommand's flags live in their own world.

```go
// filterByTag returns only the notes carrying the given tag.
func filterByTag(notes []Note, tag string) []Note {
	tag = strings.ToLower(tag)
	var hits []Note
	for _, n := range notes {
		for _, t := range n.Tags {
			if t == tag {
				hits = append(hits, n)
				break
			}
		}
	}
	return hits
}

func runList(args []string) error {
	fs := flag.NewFlagSet("list", flag.ExitOnError)
	n := fs.Int("n", 0, "show only the last n notes (0 = all)")
	tag := fs.String("tag", "", "only notes with this tag")
	fs.Parse(args)

	path, err := storePath()
	if err != nil {
		return err
	}
	notes, err := loadNotes(path)
	if err != nil {
		return err
	}

	if *tag != "" {
		notes = filterByTag(notes, *tag)
	}
	if *n > 0 && len(notes) > *n {
		notes = notes[len(notes)-*n:]
	}
	printTable(notes)
	return nil
}
```

Order matters here, and it's a decision, not an accident: **filter first, then limit.** `til list -tag go -n 3` means "my last three *Go* notes" - so we narrow to the tag before taking the tail. Do it the other way around and a tag that hasn't appeared recently returns nothing, which is never what you meant. `notes[len(notes)-*n:]` takes the last `n` elements - the most recent, since `add` always appends.

(`runList` now takes `args` - remember to pass `os.Args[2:]` in the `main` switch. The full listing below has it.)

## search

Search is a filter with a lowercase trick. Lowercasing **both** the query and the text before comparing is the standard way to get case-insensitive matching - `strings.Contains` itself is strictly case-sensitive, and a search tool that misses "Defer" when you type "defer" feels broken even when it's technically working.

```go
// searchNotes returns notes whose text contains the query, case-insensitively.
func searchNotes(notes []Note, query string) []Note {
	q := strings.ToLower(query)
	var hits []Note
	for _, n := range notes {
		if strings.Contains(strings.ToLower(n.Text), q) {
			hits = append(hits, n)
		}
	}
	return hits
}

func runSearch(args []string) error {
	if len(args) == 0 {
		return errors.New(`usage: til search "query"`)
	}
	query := strings.Join(args, " ")

	path, err := storePath()
	if err != nil {
		return err
	}
	notes, err := loadNotes(path)
	if err != nil {
		return err
	}

	hits := searchNotes(notes, query)
	if len(hits) == 0 {
		fmt.Printf("No notes matching %q.\n", query)
		return nil
	}
	printTable(hits)
	return nil
}
```

This is a linear scan of every note - and for this tool, that's the right call. Even thousands of notes scan in well under a blink; anything cleverer would be solving a problem you don't have.

Note the "no results" path prints a sentence and returns `nil`: finding nothing is a valid answer, not an error. Exit codes should mean "the tool failed," not "the world disappointed you."

## tags

The tag summary is a counting problem, and counting in Go means a map:

```go
func runTags() error {
	path, err := storePath()
	if err != nil {
		return err
	}
	notes, err := loadNotes(path)
	if err != nil {
		return err
	}

	counts := map[string]int{}
	for _, n := range notes {
		for _, t := range n.Tags {
			counts[t]++
		}
	}
	if len(counts) == 0 {
		fmt.Println("No tags yet.")
		return nil
	}

	names := make([]string, 0, len(counts))
	for name := range counts {
		names = append(names, name)
	}
	sort.Strings(names)

	w := tabwriter.NewWriter(os.Stdout, 0, 4, 2, ' ', 0)
	fmt.Fprintln(w, "TAG\tNOTES")
	for _, name := range names {
		fmt.Fprintf(w, "%s\t%d\n", name, counts[name])
	}
	return w.Flush()
}
```

⚠️ **Gotcha:** the detour through a sorted `names` slice isn't decoration. **Go maps iterate in deliberately randomized order** - print the map directly and the tags come out shuffled differently on every run. The runtime does this on purpose, so nobody accidentally depends on an ordering the language never promised. Any time map contents face a human, collect the keys and sort them.

## The full program

Here's `main.go` complete, so you and I are looking at the same file. New since phase 3: `printTable`, `filterByTag`, the rewritten `runList`, `searchNotes`/`runSearch`, `runTags`, two new imports (`sort`, `text/tabwriter`), and the expanded `usage` and `main` switch. The Note type, `parseTags`, and all three storage functions are unchanged.

```go
package main

import (
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"text/tabwriter"
	"time"
)

type Note struct {
	ID      int       `json:"id"`
	Text    string    `json:"text"`
	Tags    []string  `json:"tags,omitempty"`
	Created time.Time `json:"created"`
}

// parseTags turns "Go, CLI" into ["go", "cli"].
func parseTags(s string) []string {
	if s == "" {
		return nil
	}
	var tags []string
	for _, p := range strings.Split(s, ",") {
		p = strings.TrimSpace(strings.ToLower(p))
		if p != "" {
			tags = append(tags, p)
		}
	}
	return tags
}

// storePath returns the notes file location: ~/.til/notes.json.
func storePath() (string, error) {
	home, err := os.UserHomeDir()
	if err != nil {
		return "", fmt.Errorf("finding home directory: %w", err)
	}
	return filepath.Join(home, ".til", "notes.json"), nil
}

// loadNotes reads the store. A missing file is a first run, not an error.
func loadNotes(path string) ([]Note, error) {
	data, err := os.ReadFile(path)
	if errors.Is(err, os.ErrNotExist) {
		return []Note{}, nil
	}
	if err != nil {
		return nil, err
	}
	var notes []Note
	if err := json.Unmarshal(data, &notes); err != nil {
		return nil, fmt.Errorf("parsing %s: %w", path, err)
	}
	return notes, nil
}

// saveNotes writes the store atomically: temp file first, then rename.
func saveNotes(path string, notes []Note) error {
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return err
	}
	data, err := json.MarshalIndent(notes, "", "  ")
	if err != nil {
		return err
	}
	tmp := path + ".tmp"
	if err := os.WriteFile(tmp, data, 0o644); err != nil {
		return err
	}
	return os.Rename(tmp, path)
}

// searchNotes returns notes whose text contains the query, case-insensitively.
func searchNotes(notes []Note, query string) []Note {
	q := strings.ToLower(query)
	var hits []Note
	for _, n := range notes {
		if strings.Contains(strings.ToLower(n.Text), q) {
			hits = append(hits, n)
		}
	}
	return hits
}

// filterByTag returns only the notes carrying the given tag.
func filterByTag(notes []Note, tag string) []Note {
	tag = strings.ToLower(tag)
	var hits []Note
	for _, n := range notes {
		for _, t := range n.Tags {
			if t == tag {
				hits = append(hits, n)
				break
			}
		}
	}
	return hits
}

// printTable renders notes as an aligned table.
func printTable(notes []Note) {
	if len(notes) == 0 {
		fmt.Println(`No notes yet. Add one: til add "what you learned"`)
		return
	}
	w := tabwriter.NewWriter(os.Stdout, 0, 4, 2, ' ', 0)
	fmt.Fprintln(w, "ID\tDATE\tTAGS\tNOTE")
	for _, n := range notes {
		fmt.Fprintf(w, "%d\t%s\t%s\t%s\n", n.ID, n.Created.Format("2006-01-02"), strings.Join(n.Tags, ","), n.Text)
	}
	w.Flush()
}

func runAdd(args []string) error {
	fs := flag.NewFlagSet("add", flag.ExitOnError)
	tags := fs.String("tags", "", "comma-separated tags, e.g. -tags go,cli")
	fs.Parse(args)

	text := strings.TrimSpace(strings.Join(fs.Args(), " "))
	if text == "" {
		return errors.New(`nothing to add - usage: til add [-tags a,b] "your note"`)
	}

	path, err := storePath()
	if err != nil {
		return err
	}
	notes, err := loadNotes(path)
	if err != nil {
		return err
	}

	id := 1
	if len(notes) > 0 {
		id = notes[len(notes)-1].ID + 1
	}
	notes = append(notes, Note{ID: id, Text: text, Tags: parseTags(*tags), Created: time.Now()})

	if err := saveNotes(path, notes); err != nil {
		return err
	}
	fmt.Printf("Added note #%d\n", id)
	return nil
}

func runList(args []string) error {
	fs := flag.NewFlagSet("list", flag.ExitOnError)
	n := fs.Int("n", 0, "show only the last n notes (0 = all)")
	tag := fs.String("tag", "", "only notes with this tag")
	fs.Parse(args)

	path, err := storePath()
	if err != nil {
		return err
	}
	notes, err := loadNotes(path)
	if err != nil {
		return err
	}

	if *tag != "" {
		notes = filterByTag(notes, *tag)
	}
	if *n > 0 && len(notes) > *n {
		notes = notes[len(notes)-*n:]
	}
	printTable(notes)
	return nil
}

func runSearch(args []string) error {
	if len(args) == 0 {
		return errors.New(`usage: til search "query"`)
	}
	query := strings.Join(args, " ")

	path, err := storePath()
	if err != nil {
		return err
	}
	notes, err := loadNotes(path)
	if err != nil {
		return err
	}

	hits := searchNotes(notes, query)
	if len(hits) == 0 {
		fmt.Printf("No notes matching %q.\n", query)
		return nil
	}
	printTable(hits)
	return nil
}

func runTags() error {
	path, err := storePath()
	if err != nil {
		return err
	}
	notes, err := loadNotes(path)
	if err != nil {
		return err
	}

	counts := map[string]int{}
	for _, n := range notes {
		for _, t := range n.Tags {
			counts[t]++
		}
	}
	if len(counts) == 0 {
		fmt.Println("No tags yet.")
		return nil
	}

	names := make([]string, 0, len(counts))
	for name := range counts {
		names = append(names, name)
	}
	sort.Strings(names)

	w := tabwriter.NewWriter(os.Stdout, 0, 4, 2, ' ', 0)
	fmt.Fprintln(w, "TAG\tNOTES")
	for _, name := range names {
		fmt.Fprintf(w, "%s\t%d\n", name, counts[name])
	}
	return w.Flush()
}

func usage() {
	fmt.Println(`til - a tiny "today I learned" log

Usage:
  til add [-tags a,b] "your note"
  til list [-n 5] [-tag go]
  til search "query"
  til tags`)
}

func main() {
	if len(os.Args) < 2 {
		usage()
		os.Exit(1)
	}

	var err error
	switch os.Args[1] {
	case "add":
		err = runAdd(os.Args[2:])
	case "list":
		err = runList(os.Args[2:])
	case "search":
		err = runSearch(os.Args[2:])
	case "tags":
		err = runTags()
	default:
		fmt.Fprintf(os.Stderr, "unknown command %q\n", os.Args[1])
		usage()
		os.Exit(1)
	}
	if err != nil {
		fmt.Fprintln(os.Stderr, "til:", err)
		os.Exit(1)
	}
}
```

## Run it all

Add a third note so the filters have something to disagree about, then put every command through its paces:

```console
$ go run . add -tags git "git stash pops in LIFO order too"
Added note #3
$ go run . list
ID  DATE        TAGS    NOTE
1   2026-07-06  go      defer runs in LIFO order
2   2026-07-06  go,cli  flag.NewFlagSet gives each subcommand its own flags
3   2026-07-06  git     git stash pops in LIFO order too
```

*What just happened:* tabwriter measured every column - the widest tag cell is `go,cli`, so the whole TAGS column sized itself to that - and padded the rest to match. No column widths appear anywhere in our code.

```console
$ go run . search lifo
ID  DATE        TAGS  NOTE
1   2026-07-06  go    defer runs in LIFO order
3   2026-07-06  git   git stash pops in LIFO order too
$ go run . list -tag go -n 1
ID  DATE        TAGS    NOTE
2   2026-07-06  go,cli  flag.NewFlagSet gives each subcommand its own flags
$ go run . tags
TAG  NOTES
cli  1
git  1
go   2
```

*What just happened:* `search lifo` matched "LIFO" in two notes despite the case difference. `list -tag go -n 1` narrowed to the two Go-tagged notes, then kept the most recent one. And `tags` counted every tag across all notes and printed them alphabetically - run it ten times, same order ten times, because we sorted.

Finish with a fresh binary, since this is now a tool worth keeping built:

```console
$ go build
$ ./til list -n 2
ID  DATE        TAGS    NOTE
2   2026-07-06  go,cli  flag.NewFlagSet gives each subcommand its own flags
3   2026-07-06  git     git stash pops in LIFO order too
```

## What you have now

The complete feature set: capture, browse, filter, search, and summarize - with output that looks like a tool someone maintains. What you *don't* have is proof it keeps working. The logic is now spread across enough functions that a careless edit could quietly break search or corrupt the round-trip to disk. Next phase we pin it down with real tests - and you'll see why every function in this file that makes a decision takes plain data in and returns plain data out.

Three checks on the ideas that carry this phase:

```quiz
[
  {
    "q": "How does text/tabwriter get the columns to line up?",
    "choices": [
      "You configure fixed column widths when creating the writer",
      "It uses your terminal's built-in tab stops directly",
      "It buffers all rows, measures each column's widest cell, and pads with spaces on Flush"
    ],
    "answer": 2,
    "explain": "That buffering is also the gotcha: skip Flush and the buffered rows are simply discarded - the table prints nothing."
  },
  {
    "q": "You run: til list -tag go -n 3. What does the code do?",
    "choices": [
      "Takes the last 3 notes overall, then keeps the go-tagged ones",
      "Selects the go-tagged notes first, then shows the last 3 of those",
      "Prints an error because -tag and -n cannot combine"
    ],
    "answer": 1,
    "explain": "Filter first, then limit - so the command means 'my last three Go notes'. The other order would often return nothing."
  },
  {
    "q": "Why does runTags copy the map keys into a slice and sort them before printing?",
    "choices": [
      "Go maps iterate in deliberately randomized order, so unsorted output would shuffle on every run",
      "tabwriter requires its rows in alphabetical order",
      "Sorting makes the map lookups faster"
    ],
    "answer": 0,
    "explain": "The runtime randomizes map iteration on purpose so programs can't depend on an unpromised order. Sort the keys whenever map contents face a human."
  }
]
```
