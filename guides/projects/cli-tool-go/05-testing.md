---
title: "Tests That Catch Real Bugs"
guide: "cli-tool-go"
phase: 5
summary: "Write table-driven tests for the search and filter logic, round-trip the JSON storage through t.TempDir, and watch go test catch a planted bug."
tags: [go, testing, table-driven-tests, tempdir, go-test]
difficulty: intermediate
synonyms:
  - go testing package tutorial
  - table driven tests go
  - t.TempDir example
  - test file io go
  - go test -v
updated: 2026-07-06
---

# Tests That Catch Real Bugs

Right now, `til` works because you watched it work. That guarantee expires the next time you touch the code - add an `edit` command in three months, nudge `searchNotes` while you're in there, and nothing will tell you that search stopped being case-insensitive. Tests are how the guarantee outlives your attention span. This phase writes real ones: not ceremony, not 100% coverage - a handful of tests aimed at the behavior that would hurt to lose.

And here's the payoff I promised twice: because the logic functions take plain data and return plain data - `searchNotes(notes, query)`, not "read the file, search it, print results" - testing them requires **no setup at all.** Build a slice, call the function, check the result. The design choice was the hard part, and it's already done.

## How Go testing works

No framework to install. The `testing` package and `go test` command ship with the toolchain, and the rules fit in three lines:

- Tests live in files ending in `_test.go`, which `go build` ignores - test code never bloats your shipped binary.
- Each test is a function named `TestXxx` taking `*testing.T`.
- A test fails if it calls `t.Errorf` or `t.Fatalf`; otherwise it passes. That's the entire API you need today.

Because our test file declares `package main` - the same package as `main.go` - it can call `searchNotes`, `loadNotes`, and the rest directly, no exporting required.

## The test file

Create `main_test.go` next to `main.go`:

```go
package main

import (
	"path/filepath"
	"testing"
	"time"
)

func sample() []Note {
	return []Note{
		{ID: 1, Text: "Go interfaces are satisfied implicitly", Tags: []string{"go"}, Created: time.Now()},
		{ID: 2, Text: "git rebase rewrites history", Tags: []string{"git"}, Created: time.Now()},
		{ID: 3, Text: "go build makes one binary", Tags: []string{"go", "cli"}, Created: time.Now()},
	}
}

func TestSearchNotes(t *testing.T) {
	tests := []struct {
		name  string
		query string
		want  int
	}{
		{"case insensitive", "GO", 2},
		{"no match", "docker", 0},
		{"multi-word phrase", "one binary", 1},
		{"substring inside a word", "hist", 1},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := searchNotes(sample(), tt.query)
			if len(got) != tt.want {
				t.Errorf("searchNotes(%q) returned %d notes, want %d", tt.query, len(got), tt.want)
			}
		})
	}
}

func TestFilterByTag(t *testing.T) {
	if got := filterByTag(sample(), "go"); len(got) != 2 {
		t.Errorf("tag go: got %d notes, want 2", len(got))
	}
	if got := filterByTag(sample(), "GO"); len(got) != 2 {
		t.Errorf("tag GO should match like go: got %d notes, want 2", len(got))
	}
	if got := filterByTag(sample(), "python"); len(got) != 0 {
		t.Errorf("tag python: got %d notes, want 0", len(got))
	}
}

func TestSaveLoadRoundTrip(t *testing.T) {
	path := filepath.Join(t.TempDir(), "notes.json")

	if err := saveNotes(path, sample()); err != nil {
		t.Fatalf("saveNotes: %v", err)
	}
	got, err := loadNotes(path)
	if err != nil {
		t.Fatalf("loadNotes: %v", err)
	}
	if len(got) != 3 {
		t.Fatalf("got %d notes back, want 3", len(got))
	}
	if got[2].Text != "go build makes one binary" {
		t.Errorf("note text corrupted in round trip: %q", got[2].Text)
	}
	if len(got[2].Tags) != 2 {
		t.Errorf("tags lost in round trip: %v", got[2].Tags)
	}
}

func TestLoadMissingFile(t *testing.T) {
	notes, err := loadNotes(filepath.Join(t.TempDir(), "does-not-exist.json"))
	if err != nil {
		t.Fatalf("a missing file is a first run, not an error - got: %v", err)
	}
	if len(notes) != 0 {
		t.Errorf("want an empty list from a missing file, got %d notes", len(notes))
	}
}
```

Four tests, four different lessons. Let's take them in turn.

**`TestSearchNotes` is table-driven** - the pattern you'll see in nearly every serious Go codebase. Instead of one test function per case, you declare a slice of cases (an anonymous struct with a name, inputs, and the expected result) and loop over it. `t.Run(tt.name, ...)` makes each row a named subtest that passes or fails independently. The win is the marginal cost of a new case: when you wonder "what about a query with an apostrophe?", the answer is one more line in the slice, not a new function. Notice the cases test *behavior you decided on* in phase 4: case-insensitivity, the empty result, multi-word queries, substring matching.

**`TestFilterByTag` guards a promise** - that tag matching ignores case, because `parseTags` lowercases on the way in and `filterByTag` lowercases the query. That promise currently holds because of two lines in two different functions. If anyone "cleans up" either one, this test is the tripwire.

**`TestSaveLoadRoundTrip` tests the disk code against a real disk** - but not *your* disk. `t.TempDir()` hands the test a freshly created directory and registers automatic cleanup when the test ends; nothing to delete, nothing left behind, and - because `saveNotes` takes a path instead of calling `storePath` itself - **the test can't touch your real `~/.til`.** This is the phase-3 design decision paying rent. The test then asserts the property that actually matters: what comes back out equals what went in.

**`TestLoadMissingFile` pins down an edge case** - the "first run is not an error" behavior from phase 3. Edge-case decisions like that one are precisely what future-you forgets; write them down as tests and they stop being folklore.

📝 **Terminology:** `t.Errorf` records a failure and lets the test keep running; `t.Fatalf` records a failure and stops the test immediately. Use `Fatalf` when continuing makes no sense - if `loadNotes` returned an error, inspecting the notes it didn't return would only produce noise.

## Run them

```console
$ go test
PASS
ok      til     0.184s
```

*What just happened:* `go test` found every `_test.go` file in the package, compiled it together with the code under test, ran all four test functions, and summarized. Quiet output is the Go way - passing tests have nothing interesting to say. Add `-v` when you want the play-by-play:

```console
$ go test -v
=== RUN   TestSearchNotes
=== RUN   TestSearchNotes/case_insensitive
=== RUN   TestSearchNotes/no_match
=== RUN   TestSearchNotes/multi-word_phrase
=== RUN   TestSearchNotes/substring_inside_a_word
--- PASS: TestSearchNotes (0.00s)
    --- PASS: TestSearchNotes/case_insensitive (0.00s)
    --- PASS: TestSearchNotes/no_match (0.00s)
    --- PASS: TestSearchNotes/multi-word_phrase (0.00s)
    --- PASS: TestSearchNotes/substring_inside_a_word (0.00s)
=== RUN   TestFilterByTag
--- PASS: TestFilterByTag (0.00s)
=== RUN   TestSaveLoadRoundTrip
--- PASS: TestSaveLoadRoundTrip (0.00s)
=== RUN   TestLoadMissingFile
--- PASS: TestLoadMissingFile (0.00s)
PASS
ok      til     0.201s
```

Each table row shows up as its own named subtest - that's `t.Run` earning its keep.

## Watch a test actually catch something

A passing suite proves nothing until you've seen it fail. So break the code the way a hurried future-you might: in `main.go`, edit `searchNotes` and remove the `strings.ToLower` around `n.Text` - the kind of change that survives a glance at a diff, because the function still compiles and still finds *lowercase* matches.

```console
$ go test
--- FAIL: TestSearchNotes (0.00s)
    --- FAIL: TestSearchNotes/case_insensitive (0.00s)
        main_test.go:32: searchNotes("GO") returned 0 notes, want 2
FAIL
exit status 1
FAIL    til     0.198s
```

*What just happened:* one subtest failed - exactly the one guarding the behavior you broke - and its message says what was expected and what happened instead. The other three search cases still pass, because lowercase queries still work; that precision is the point of subtests. Manual testing would likely have missed this: you'd type a lowercase query, see results, and ship.

Put the `strings.ToLower` back and confirm you're green:

```console
$ go test
PASS
ok      til     0.190s
```

That loop - break, see red, fix, see green - is the entire testing workflow. From now on, `go test` before every commit costs two seconds and buys you the confidence to change anything.

## What you have now

A tool *and* a safety net: the search and filter behavior, the storage round trip, and the first-run edge case are all pinned down by tests that run in a fraction of a second. Notice what we didn't test - `main`'s dispatch, `usage` printing, tabwriter's alignment. Thin wiring over the standard library, visible every time you run the tool, is not where the bugs that hurt live. Test judgment beats test coverage.

One thing left: `til` still only exists in this folder, on this machine. Next phase we compile it for every OS you care about and put it on your PATH, where a real tool belongs.

Quick check on the testing ideas:

```quiz
[
  {
    "q": "Why does main_test.go declare package main, the same package as the code it tests?",
    "choices": [
      "So the tests can call unexported functions like searchNotes directly",
      "Because go test only works on package main",
      "To make the compiled binary include the tests"
    ],
    "answer": 0,
    "explain": "Same package means full access to unexported names. (go build still excludes _test.go files, so the shipped binary contains no test code.)"
  },
  {
    "q": "What does t.TempDir() give the storage tests?",
    "choices": [
      "A faster in-memory filesystem",
      "A fresh directory per test, deleted automatically afterward - so tests never touch your real ~/.til",
      "A directory shared by all tests so they can pass files to each other"
    ],
    "answer": 1,
    "explain": "Combined with saveNotes and loadNotes taking a path parameter, tests exercise the real file code against a disposable location."
  },
  {
    "q": "In TestSaveLoadRoundTrip, why t.Fatalf for the loadNotes error but t.Errorf for the text check?",
    "choices": [
      "Fatalf stops the test - if loading failed there are no notes worth inspecting; Errorf records the problem and continues",
      "Fatalf is required for errors returned by functions",
      "They behave identically; the choice is style"
    ],
    "answer": 0,
    "explain": "Fatalf for 'cannot meaningfully continue', Errorf for 'note this failure and keep checking'. Using Errorf after a failed load would produce a cascade of noise."
  }
]
```
