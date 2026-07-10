---
title: "Thinking Clearly: A Practical Toolkit"
guide: "critical-thinking-and-fallacies"
phase: 3
summary: "The habits that beat fallacies and bias: steelman instead of strawman, separate the claim from the evidence, ask 'what would change my mind?', check the source, and remember that fluent isn't the same as true."
tags: [logic, critical-thinking, cognitive-bias, skepticism]
difficulty: beginner
synonyms: ["how to think critically", "steelman an argument", "confirmation bias", "what would change my mind", "how to evaluate claims", "critical thinking habits"]
updated: 2026-07-10
---

# Thinking Clearly: A Practical Toolkit

You now know what an argument is, how implication works, and which fallacies show up most.
That's the diagnostic layer - you can spot a bad move when it happens. This phase is the
everyday layer: habits practiced quietly that make you harder to fool. Including by yourself.

Fallacies are mistakes other people make in front of you. Bias is the mistake you make on your
own, in the privacy of your own head, where nobody is around to call it out. A toolkit for clear
thinking has to cover both - so this isn't a list of clever rebuttals, it's a list of moves you
run *before* you've decided what you think.

## The toolkit

Each of these is a question or habit you can apply to any claim - yours, a friend's, a
headline's, a chatbot's. None require being smart, only being willing to slow down for ten
seconds.

**Steelman, don't strawman.** You met the strawman fallacy in Phase 2: attacking a weak,
distorted version of someone's position. The steelman is its opposite. Before you respond to an
argument, restate it in the strongest, most charitable form you can - strong enough that the
person who made it would say "yes, that's exactly what I mean." *Then* engage with that version.
This feels backwards, but if you can only beat the weak version, you haven't won anything - you've
dodged. Building the steelman often reveals the other side has a real point you'd missed.

**Separate claim from evidence from conclusion.** Most confusing arguments are confusing because
three things are mashed together:

- **The claim** - what's being asserted. ("This framework is faster.")
- **The evidence** - what's offered to support it. ("My app loaded quicker after I switched.")
- **The conclusion** - what you're being asked to do or believe. ("So you should switch too.")

Pulled apart, the gaps become visible. Is the evidence actually about the claim? (One app on one
machine isn't really about the framework being faster.) Does the conclusion follow even if the
claim is true? (Faster for them might not mean faster for you.) You can't evaluate a tangle - you
can evaluate three labeled pieces.

**Ask "what would change my mind?"** The single most useful question in the toolkit, asked about
your *own* beliefs. Pick something you believe. Now ask: what specific thing, if I saw it, would
make me give this up? If you can name it - "if a careful study showed the opposite" - your belief
is connected to reality; evidence could move it. If the honest answer is *nothing would change my
mind*, then whatever you're holding, you didn't arrive at it by reasoning, and reasoning won't get
you out of it either. That's an attachment wearing a belief's clothes - there's nothing wrong with
having those, but it's worth knowing which is which.

> **Try it on a small thing.** Next time you're sure about something low-stakes - a tool, a
> technique, a take - pause and finish the sentence "I'd change my mind if ___." If the blank
> stays empty, that's information about the belief, not about the world.

**Check the source and the incentive.** A claim doesn't arrive from nowhere - someone is saying
it, and they usually have a reason. Two quick questions: *Where did this come from?* (A primary
source, an expert, a random post, a generated summary?) And *who benefits if I believe it?* That
second one isn't cynicism, it's context. A company's blog explaining why its own product is best
isn't necessarily lying, but it isn't a neutral referee either. Incentive doesn't make a claim
false - it tells you how hard to check before you trust it.

**Extraordinary claims need extraordinary evidence.** The bigger the claim, the more it should
take to convince you. "It rained in Seattle" needs almost nothing - it fits everything you already
know. "I have a sorting algorithm that beats the theoretical limit" needs a great deal, because it
would overturn things that are well established. This isn't closed-mindedness, it's calibration:
the strength of your belief should track the strength of the evidence. A surprising claim with
thin support gets a "maybe, show me more," not a yes and not a flat no.

**Correlation is not causation (recap).** Two things moving together doesn't mean one causes the
other. Ice cream sales and drowning both rise in summer - heat drives both; the ice cream is
innocent. Before accepting "X causes Y" because they happen together, ask whether something else
might cause both, or whether it's coincidence. (You'll meet this properly in the Mathematics
track.)

## We fool ourselves too: a few biases

Fallacies are about arguments; biases are about the wiring - predictable ways your own mind tilts
before you've consciously decided anything. You can't delete them, but you can learn to notice
their fingerprints.

- **Confirmation bias.** You notice, remember, and seek out evidence that agrees with what you
  already think, and quietly skip the rest - which is why "I did my research" can mean "I found
  the articles that told me I was right." The counter is "what would change my mind?" - it forces
  you to look for disagreeing evidence on purpose.
- **Anchoring.** The first number you hear sticks, and everything after is judged relative to it.
  A "was $200, now $80" tag makes $80 feel like a steal, because $200 anchored you - whether or
  not anything ever sold for $200. When a number frames a decision, ask where it came from.
- **Availability.** Whatever comes to mind easily feels more common or likely than it is. Vivid,
  recent, scary events are easy to recall, so they get overweighted - one dramatic story can feel
  heavier than a pile of dull statistics that describe reality better.

Naming these isn't about feeling clever - it's so that when you catch yourself doing one, you have
a word for it, and a word is a handle you can grab.

## The AI-era angle

Modern AI chatbots produce text that is fluent, confident, well-organized, and grammatically
clean - and it can be completely wrong. The technical term is *hallucination*: the system
generates a plausible-sounding answer with no basis in fact. It will cite a paper that doesn't
exist, describe an API method that was never built, or state a date with total confidence and
total inaccuracy - in exactly the same calm tone it uses when it's right.

The trap is a built-in human shortcut: we treat fluency as a signal of truth. That heuristic is
roughly okay for humans, who at least usually feel uncertain when they're guessing. It fails badly
for a system with no such feeling, fluent by design whether or not it's correct.

So the move is nothing new - it's the toolkit you already have. Treat an AI's claim like any other
unverified claim: check the source, ask what would change your mind, verify load-bearing facts
against something independent. This is applied skepticism, not cynicism - you're not assuming the
answer is wrong, and you're not refusing to use the tool. You're refusing to let *confident* stand
in for *checked*. Fluent isn't true. It never was; now the gap is easier to fall into.

## For builders

If you write code, you already do critical thinking for a living.

- **Code review is steelmanning.** Before you reject a change, understand what it's actually
  trying to do, in its strongest form. The best review comments engage with the real intent.
- **Debugging is "what would change my mind?"** A bug means reality disagrees with your belief
  about the code. Name the belief - "this function gets called with a valid ID" - and hunt for the
  case that breaks it. You're trying to falsify your assumption; the counterexample *is* the bug.
- **Assume nothing, verify.** "It works on my machine" is a claim with one data point. "This
  config is loaded in production" is a claim until you've checked the running system.
- **An AI suggestion is a claim.** A confident, fluent code snippet is not the same as a correct
  one. Read it, understand it, test it - treat shipping it unverified the way you'd treat merging
  a stranger's PR you never read.

## Closing the toolkit - and the foundations

Phase 1 gave you the anatomy of an argument. Phase 2 gave you the catalog of bad moves so you can
name them on sight. This phase gave you the proactive habits: steelman the other side, separate
claim from evidence from conclusion, ask what would change your mind, check the source and the
incentive, demand evidence sized to the claim, and never mistake correlation for cause - while
staying honest that your own biases are working the whole time.

That toolkit zooms all the way out. The Logic foundations - [what logic actually
is](/guides/what-logic-actually-is), [implication and conditionals](/guides/implication-and-conditionals),
and [predicate logic and quantifiers](/guides/predicate-logic-and-quantifiers), now capped by
critical thinking - were never really about syllogisms. They were about one skill: holding a
thought up to the light and checking whether it holds. That's the foundation; everything else
builds on it.

From here, clear thinking turns numerical the moment real stakes appear: how big is the effect,
how likely is it, how much does the evidence actually move the needle? "Extraordinary claims need
extraordinary evidence" and "correlation isn't causation" are doorways into probability and
statistics - the Mathematics track, and the natural continuation of what you started here. You've
learned to think clearly in words. Next you learn to think clearly in quantities.

## Open-ended exercise

Read this product claim: "Our new feature increased user engagement by 40%." Apply the
toolkit from this phase: (1) steelman the claim - what's the strongest version of it?
(2) separate the claim from the evidence - what would you need to see to verify it?
(3) name at least one cognitive bias that could make the claim feel true before you've
checked it. The goal is to turn a persuasive sentence into a checklist you can act on.

Here's a quick check on the habits worth keeping.

```quiz
[
  {
    "q": "What does it mean to 'steelman' an argument?",
    "choices": [
      "Restate the opposing position in its strongest, most charitable form before engaging with it",
      "Attack the weakest version of the opposing position so it's easier to beat",
      "Refuse to engage with arguments you disagree with",
      "Repeat your own argument more forcefully until the other person gives up"
    ],
    "answer": 0,
    "explain": "Steelmanning is the opposite of strawmanning. You engage the strongest version of the other side - partly to win honestly, partly because building it often reveals a real point you'd missed."
  },
  {
    "q": "Why is asking 'what would change my mind?' such a useful habit?",
    "choices": [
      "It guarantees you'll never be wrong about anything",
      "It's a polite way to end an argument quickly",
      "If nothing could change your mind, the belief isn't actually held for reasons evidence can reach",
      "It lets you avoid having to check any sources"
    ],
    "answer": 2,
    "explain": "If you can name what would change your mind, your belief is connected to reality. If the honest answer is 'nothing,' you didn't arrive at it by reasoning - and it's worth knowing the difference."
  },
  {
    "q": "Which of these best describes confirmation bias?",
    "choices": [
      "Letting the first number you hear set the scale for everything after",
      "Treating fluent, confident text as if it must be true",
      "Overweighting vivid events because they come to mind easily",
      "Noticing and seeking evidence that agrees with you, while skipping evidence that disagrees"
    ],
    "answer": 3,
    "explain": "Confirmation bias is the tilt toward agreeing evidence - which is why 'I did my research' can quietly mean 'I found what told me I was right.' (The other options describe anchoring, the fluency trap, and availability.)"
  }
]
```

[← Phase 2: The Fallacies You'll Meet Most](02-the-fallacies-youll-meet-most.md) · [Guide overview](_guide.md)
