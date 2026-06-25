---
title: "The Fallacies You'll Meet Most"
guide: "critical-thinking-and-fallacies"
phase: 2
summary: "A field guide to the fallacies you'll actually encounter — ad hominem, straw man, false dilemma, slippery slope, appeal to authority/emotion, hasty generalization, circular reasoning, and post hoc (correlation isn't causation)."
tags: [logic, fallacies, ad-hominem, straw-man, correlation-causation]
difficulty: beginner
synonyms: ["common logical fallacies list", "ad hominem", "straw man", "false dilemma", "slippery slope", "correlation is not causation", "circular reasoning"]
updated: 2026-06-25
---

# The Fallacies You'll Meet Most

In Phase 1 you learned what a fallacy is and why a broken argument can still feel convincing. Now we get practical. This is a field guide to the moves you'll run into again and again — in comment threads, in meetings, in headlines, and (let's be honest) in your own head at 2 a.m.

You don't need to memorize Latin names. The goal is recognition: once you can *feel* the shape of a bad move, you can step back instead of getting swept along. So for each one, I'll give you the name, a one-line definition, and a small concrete example. Read for the pattern, not the label.

One thing up front: spotting a fallacy means the argument failed to *prove* its point. It does not mean the conclusion is false. A person can defend a true claim with a terrible argument. So "that's a fallacy" is a reason to ask for a better argument, not a victory dance. For that distinction in full, [What Logic Actually Is](/guides/what-logic-actually-is) lays the groundwork.

## Attacks on the person, not the point

### Ad hominem
**Attacking the person instead of their argument.**

Instead of engaging with what someone said, you go after who they are.

```text
"You think we should rewrite the billing service? You've only been
here three months. Sit down."
```

Notice what's missing: any response to whether the billing service should be rewritten. Maybe the newcomer is wrong — but their tenure isn't the reason, and the attack quietly changed the subject. Watch for this when an argument turns into a referendum on the speaker's credentials, motives, or character.

### Straw man
**Distorting someone's position into a weaker one, then knocking that down.**

You replace what your opponent actually said with a flimsier version, defeat the flimsy version, and act like you won.

```text
Alex: "I think we should add more tests before the next release."
Sam:  "So you want us to stop shipping features forever? Great plan."
```

Alex never said "forever." Sam built a scarecrow and toppled it. The tell is a phrase like "so what you're really saying is…" followed by something the person would never agree to. The honest move is the opposite — restate their view in a form *they'd* accept, then respond to that.

## Forcing the shape of the choice

### False dilemma (false dichotomy)
**Presenting only two options when more exist.**

The argument squeezes a rich situation down to "either A or B," then pushes you toward one by making the other look terrible.

```text
"Either we ship tonight or the whole quarter is a failure."
```

Ship tonight, ship tomorrow, ship a smaller version, cut one feature — the real menu has more than two items. False dilemmas thrive under pressure, because a fake either/or feels decisive. The counter is one quiet question: "Are those really the only options?"

### Slippery slope
**Claiming one small step inevitably leads to disaster, with no justification for the chain.**

The move isn't "B might follow A." It's asserting an unstoppable cascade from a first step straight to catastrophe, while skipping every link that would have to hold.

```text
"If we let one person work from home, soon nobody comes to the
office, and the company collapses."
```

Each arrow in that chain is a separate claim that needs support, and none is given. Slippery slopes aren't always wrong — sometimes a step really does set off a chain — but the burden is on whoever's claiming it to show *why* each link follows. No demonstrated chain, no argument.

## Borrowed weight: authority, emotion, the crowd

### Appeal to authority
**"X said so" — when X is not a relevant authority, or is wrong.**

Citing an expert is fine and often smart. The fallacy is leaning on someone whose authority doesn't cover the question, or treating "an expert said it" as the end of the discussion.

```text
"A famous physicist tweeted that this diet works, so it must."
```

Brilliant physics says nothing about nutrition. And even a relevant expert can be mistaken — authority is a reason to take a claim seriously, not a substitute for the evidence behind it.

### Appeal to emotion
**Using fear, pity, or anger in place of reasons.**

Emotions are real and they matter. The fallacy is when the feeling is offered *as if it were evidence*, doing the work a reason should do.

```text
"Think of how stressed the team is. We can't possibly do a code
review on this one."
```

Stress is worth caring about. But it isn't an argument that this particular change is safe to merge without review. When a claim makes you feel something strongly and gives you nothing to check, slow down and ask: what's the actual reason here?

### Bandwagon
**"Everyone believes it, so it's true."**

Popularity gets smuggled in as proof. But lots of people can be wrong together, and a true thing stays true even when it's unpopular.

```text
"Every startup is rewriting in this framework, so it must be the
right choice for us."
```

What everyone's doing tells you about trends and social proof — useful context. It does not tell you whether the thing is correct *for your situation*.

## Conclusions that outrun the evidence

### Hasty generalization
**A sweeping conclusion drawn from too few cases.**

This is weak induction in the wild: you take a tiny, possibly unrepresentative sample and stretch it over the whole.

```text
"Two users complained about the new layout, so everybody hates it."
```

Two complaints are data, but they're not "everybody." Maybe the loudest two percent are unhappy while the quiet majority is fine. The fix isn't to ignore the complaints — it's to ask whether the sample is big enough and representative enough to carry the conclusion you're hanging on it.

### Circular reasoning / begging the question
**The conclusion is assumed in the premises.**

The argument's support already contains the thing it's supposed to prove, so it goes in a circle and never establishes anything.

```text
"This API is the most reliable because it never fails — and it
never fails because it's so reliable."
```

Strip it down and "reliable" is being proved by "reliable." Nothing outside the claim was ever brought in. The tell is a vague feeling that you went around in a loop and ended where you started.

### Post hoc / correlation isn't causation
**A happened, then B happened, therefore A caused B.**

This is the big one, and the one that costs people the most. Two things lining up in time — or moving together — is not proof that one caused the other.

```text
"Ice cream sales and drowning both rise in summer, so ice cream
causes drowning."
```

Both are driven by a third thing: hot weather. The pattern is real; the causal story is invented. Other innocent explanations are always on the table — coincidence, reverse causation (B actually caused A), or a hidden common cause behind both. Before you accept "A caused B," ask what *else* could produce the same pattern.

This one has a formal cousin worth knowing about. "If the deploy was bad, the site would be slow; the site is slow, therefore the deploy was bad" is **affirming the consequent** — the site could be slow for a dozen other reasons. [Implication & Conditionals](/guides/implication-and-conditionals) walks through exactly why that direction doesn't hold.

## A couple more you'll recognize

### Whataboutism
**Deflecting criticism by pointing at someone else's fault instead of answering.**

```text
"Our deploy process is a mess." — "Yeah? What about *their* deploy
process, it's way worse."
```

Their mess, even if real, says nothing about whether yours needs fixing. The original point still stands, unanswered.

### No true Scotsman
**Redefining a term mid-argument to dodge a counterexample.**

```text
"A real engineer would never push to main." — "I push to main and
I'm an engineer." — "Well, no *real* engineer would."
```

The definition keeps shifting to protect the claim from any evidence against it, which means the claim can never be wrong — and a claim that can never be wrong isn't telling you anything.

## The catalog at a glance

| Fallacy | The move | Example |
|---|---|---|
| Ad hominem | Attack the person, not the point | "You're too junior to have an opinion on this." |
| Straw man | Distort the view, then defeat the distortion | "So you want to ship nothing ever?" |
| False dilemma | Only two options when more exist | "Ship tonight or the quarter is ruined." |
| Slippery slope | One step → disaster, no chain shown | "Remote one day, company collapses." |
| Appeal to authority | "X said so" (irrelevant or wrong X) | "A physicist endorsed this diet." |
| Appeal to emotion | Feeling offered as a reason | "The team's stressed, so skip review." |
| Bandwagon | Popular, therefore true | "Everyone uses it, so it's right." |
| Hasty generalization | Big conclusion, tiny sample | "Two complaints, so everyone hates it." |
| Circular reasoning | Conclusion hidden in the premise | "Reliable because it never fails." |
| Post hoc | After, therefore because of | "Ice cream sales rise with drownings." |

## For builders

You'll meet post hoc more than any other fallacy in your work, and it wears a specific costume: **"it broke right after my deploy, so my deploy caused it."**

Sometimes that's true. Often it isn't. A deploy is one event in a noisy system — a dependency could have changed, a config flag could have flipped, traffic could have spiked, or a slow-burning bug could have crossed a threshold by coincidence. "After" is a hint about where to look, not a verdict. Before you roll back and write "deploy caused outage" in the incident channel, check the evidence: timestamps, what *else* changed in that window, whether the symptom matches your diff, whether reverting actually fixes it. Treat the deploy as a suspect to investigate, not a confession to record.

Same discipline applies to "latency dropped after we added the cache, so the cache fixed it." Maybe. Or maybe traffic dropped at the same time. Correlation points your flashlight; it doesn't close the case.

## Recap

- A fallacy means the argument failed, not that the conclusion is false — ask for a better argument, don't celebrate.
- **Ad hominem** and **straw man** dodge the real point: one attacks the person, the other attacks a distorted version of their view.
- **False dilemma** and **slippery slope** rig the shape of the choice — too few options, or an unjustified chain to disaster.
- **Appeal to authority/emotion** and **bandwagon** borrow weight from a source, a feeling, or the crowd instead of giving reasons.
- **Hasty generalization** stretches a tiny sample; **circular reasoning** hides the conclusion in its own premises.
- **Post hoc** is the one that'll bite you most: "after" doesn't mean "because." Always ask what else could explain the pattern.

Quick check before you move on:

```quiz
[
  {
    "q": "In a debate about a proposed budget cut, someone responds: 'She only supports the cut — she's never managed a team in her life.' What fallacy is this?",
    "choices": ["Straw man", "Ad hominem", "False dilemma", "Post hoc"],
    "answer": 1,
    "explain": "The reply ignores the argument for the budget cut and attacks the person's experience instead. Attacking the speaker rather than their reasoning is ad hominem."
  },
  {
    "q": "Your manager says: 'We either adopt this tool company-wide today or we fall hopelessly behind our competitors.' What's the flaw?",
    "choices": ["False dilemma — there are more than two options", "Appeal to emotion", "Circular reasoning", "Bandwagon"],
    "answer": 0,
    "explain": "Only two outcomes are offered — adopt now, or fall behind — when a pilot, partial rollout, or waiting are all real options. Presenting two choices as the whole menu is a false dilemma."
  },
  {
    "q": "A teammate notes: 'Sign-ups went up the same week we changed the logo, so the new logo is driving growth.' What's the problem?",
    "choices": ["The conclusion is assumed in the premise", "Two events overlapping in time doesn't prove one caused the other", "It attacks the logo designer", "It relies on what's popular"],
    "answer": 1,
    "explain": "Sign-ups rising after the logo change is correlation, not proof of causation. A marketing push, seasonality, or coincidence could explain it — that's the post hoc fallacy."
  }
]
```

Next we'll turn defense into offense: a practical toolkit for thinking clearly and pressure-testing arguments before they fool you.

[← Phase 1: What a Fallacy Is (and Why They Work)](01-what-a-fallacy-is.md) · [Guide overview](_guide.md) · [Phase 3: Thinking Clearly: A Practical Toolkit →](03-thinking-clearly-a-practical-toolkit.md)