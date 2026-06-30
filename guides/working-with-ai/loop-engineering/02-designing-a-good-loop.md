---
title: "Designing a Good Loop"
guide: loop-engineering
phase: 2
summary: "The three ingredients that make an agent's loop self-correcting: a goal it can verify, feedback it can act on, and a clear condition for stopping."
tags: [loop-design, verifiable-goals, stop-conditions, feedback, agents]
difficulty: intermediate
synonyms:
  - "how to design an agent loop"
  - "verifiable goals for AI"
  - "stop conditions AI agent"
  - "actionable feedback for agents"
  - "make AI agent self correct"
updated: 2026-06-30
---

# Designing a Good Loop

A loop that corrects itself needs three things, and most loops that go wrong are missing one of them. The AI needs a goal it can tell whether it has hit. It needs feedback it can do something with. And it needs a clear signal for when to stop. Miss the goal and it doesn't know what right looks like. Miss the feedback and it can't improve. Miss the stop condition and it either quits too early or spins forever. Get all three and the loop does the grinding for you.

## A goal it can verify

The single biggest lever is whether the goal can be checked, by the AI, without you in the room.

Compare two versions of the same request:

- "Make this landing page copy better."
- "Rewrite this landing page copy so every sentence is under 20 words and there's a clear call to action in the first paragraph."

The first has no check step possible. "Better" is in your head; the AI can't measure against it, so it takes one swing at vibes and stops. The second has a test the AI can run on its own output: count the words, look for the call to action. It can rewrite, check, and rewrite again until both conditions hold. Same task, but one is loopable and one isn't.

This is why software work is the place agents look most impressive — not because code is special, but because it comes with verification built in. Tests pass or fail. Code compiles or throws an error. The result talks back. Your job, on tasks that don't come with that for free, is to manufacture a check.

Some ways to give a fuzzy task a real check:

| Fuzzy goal | Verifiable version |
|---|---|
| "Clean up this data" | "No blank cells, no duplicate rows, every date in YYYY-MM-DD format" |
| "Summarize this well" | "Under 200 words, covers all five section headings, no claim not in the source" |
| "Fix the spreadsheet" | "The totals row equals the sum of the column above it" |
| "Write good tests" | "Every public function has at least one test, and they all pass" |

You're turning "I'll know it when I see it" into "here is the thing the AI can hold the result against." That single move is what lets the AI check instead of guess.

## Feedback it can act on

A check is only useful if it produces information the AI can use on the next turn. "That's wrong, try again" sends it back into the same fog. "The totals row says 4,200 but the column sums to 4,650" points it straight at the problem.

The best feedback comes from letting the work itself produce the signal. Real error messages, real test failures, real output the AI can read — these beat your hand-written critique because they're specific and they're true. When you set up a task, ask: after the AI acts, what will tell it whether it worked, in concrete terms it can read? If the answer is "nothing, until I notice," you've built a loop with the check step missing.

This is also where giving the agent the right tools matters. An AI that can run the code it writes gets real feedback every turn. One that can only describe code is flying blind. Same for letting it open the file it edited, re-run the search, or query the actual data. The tools are how the loop gets its eyes.

## A clear stop condition

A loop needs to know when to quit — both when it's won and when it should give up.

The success stop is the verifiable goal from above. When the check passes, stop. Without it, agents do a strange thing: they finish, then keep going, "improving" something that was already done and sometimes breaking it. A clear "done means X" prevents the AI from polishing past the finish line.

The give-up stop is as important and easier to forget. Agents can get stuck — trying the same broken fix three times, or burning through steps making no progress. Two guards:

- **A limit.** "Try at most five times, then stop and tell me what's blocking you." This caps wasted effort and, more importantly, surfaces the problem to you instead of hiding it inside an infinite grind.
- **A no-progress rule.** If two attempts in a row produce the same failure, stop — repeating the same move won't help, and a human needs to look.

```text
loop:
  act
  check against the goal
  if the check passes        -> stop, you're done
  if you've hit the limit    -> stop, report what's blocking you
  if you're repeating yourself -> stop, ask for help
  otherwise                  -> adjust and go again
```

That's the whole shape. Nothing exotic — and notice none of it requires you to write code. It's the same logic you'd put in plain language at the top of a task: "Here's the goal. Here's how you'll know you hit it. Check your work each time. If you're stuck after a few tries, stop and tell me what's wrong instead of guessing."

## Putting it together

Say you want an AI to comb a contract for risky clauses. The loopable version: "Find every clause that assigns liability to us. For each one, quote the exact text and the section number, then re-read the document and confirm you haven't missed any. If you find one with no clear section number, flag it for me instead of guessing." There's a goal it can verify against the source, feedback from re-reading, and a stop condition that hands edge cases back to you.

The difference between that and "check this contract for risks" is the difference between a loop that catches its own misses and a one-shot answer you have to trust on faith. You're not writing better prompts so much as designing the conditions for the AI to be its own first reviewer.
