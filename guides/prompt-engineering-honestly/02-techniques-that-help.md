---
title: "The Techniques That Actually Help"
guide: "prompt-engineering-honestly"
phase: 2
summary: "The handful of prompting techniques that genuinely improve output: give context and a role, be specific about format and length, show examples, break hard tasks into steps, and say what to do rather than only what not to."
tags: [prompt-engineering, llm, few-shot, chain-of-thought, prompting, beginner-friendly]
difficulty: beginner
synonyms: ["best prompt engineering techniques", "what is few-shot prompting", "what is chain of thought", "how to get better answers from an llm", "give the model a role", "tell the model the format"]
updated: 2026-06-19
---

# The Techniques That Actually Help

There's a short list of moves that reliably improve what you get back. None of them are secret, and now that you have the mental model from [Phase 1](01-instruction-not-a-spell.md), you'll see why each one works: every technique here is just a way of adding information that narrows what a good continuation looks like.

Each technique below comes with a tiny annotated prompt so you can see the shape of it, not just the name.

## 1. Give it context and a role

**What it does.** Telling the model *who it's writing for* and *what role it's playing* constrains the vocabulary, depth, and assumptions of the answer. "Explain to a 10-year-old" and "explain to a database administrator" pull the continuation toward two very different places.

```text
You are a patient tutor explaining to someone who has never coded.
Explain what a "variable" is in programming, using one everyday analogy.
```

*What just happened:* The role ("patient tutor") and the audience ("never coded") tell the model to avoid jargon and reach for an analogy. Without them, "explain what a variable is" could just as easily produce a formal, technical definition — correct, but useless to a beginner.

⚠️ **Honest caveat.** A role helps because it nudges *style and framing*. It does not make the model more knowledgeable or more accurate. "You are a world-class cardiologist" does not give it medical facts it didn't already have — it changes how the answer sounds, not whether it's true. (More on this in [Phase 3](03-honest-limits.md).)

## 2. Be specific about format and length

**What it does.** If you don't say what shape you want, you get whatever shape is most common — usually a wall of prose. State the format and length explicitly and the model aims for it.

```text
List 5 common causes of slow website load times.
Format as a numbered list. One sentence each. No introduction.
```

*What just happened:* "Numbered list," "one sentence each," and "no introduction" remove the guesswork. You'll get five tight items instead of three paragraphs with a preamble you have to skim past. When you need a specific structure — a table, JSON, bullet points, a single word — say so directly.

💡 **Key point.** This is the highest-value, lowest-effort technique. Most "the AI is so wordy" complaints are really "I never told it to be brief."

## 3. Show it an example (few-shot prompting)

**What it does.** Instead of *describing* the output you want, *show* one or two completed examples. The model picks up the pattern — the format, the tone, the level of detail — and continues it. Showing examples like this is called **few-shot prompting** (one example is "one-shot"; none is "zero-shot").

```text
Turn each product name into a short tagline.

Product: Noise-canceling headphones
Tagline: Silence, on demand.

Product: Insulated water bottle
Tagline: Cold for 24 hours, warm never.

Product: Standing desk
Tagline:
```

*What just happened:* The two completed examples taught the model the pattern — short, punchy, benefit-focused — better than any adjective could. It will complete the last line in the same style. Examples are especially powerful when the format is fiddly or the tone is hard to put into words.

📝 **Terminology.** A **shot** here means one demonstration example you include in the prompt. "Few-shot" = a few demonstrations.

## 4. Break hard tasks into steps (chain-of-thought)

**What it does.** For problems that need reasoning — math, logic, multi-step decisions — asking the model to work through it step by step before answering tends to produce better results than demanding the answer immediately. This is called **chain-of-thought** prompting. (source: Wei et al., "Chain-of-Thought Prompting Elicits Reasoning in Large Language Models," https://arxiv.org/abs/2201.11903)

```text
A store sells pens at 3 for $2. I have $10.
Work through it step by step, then give the final number of pens I can buy.
```

*What just happened:* "Step by step" prompts the model to lay out the intermediate work (each set of 3 costs $2, so $10 buys 5 sets with $0 left over, which is 15 pens) before committing to a final answer. Because each step constrains the next, the model is less likely to blurt a wrong number. For reasoning tasks, showing the work genuinely helps; for a simple lookup, it just adds noise.

⚠️ **Gotcha.** "Step by step" is a tool for *reasoning* tasks, not a universal magic phrase. Bolting it onto "write me a haiku" won't make the haiku better — it'll just make it longer. Match the technique to the task.

## 5. Say what TO do, not just what NOT to do

**What it does.** Negative-only instructions leave a hole — you've ruled something out but haven't said what to put in its place. Positive instructions point at the target directly, which is exactly what the model needs.

```text
Weak:   Don't make it too long and don't use jargon.
Better: Keep it under 100 words and use plain, everyday language a beginner understands.
```

*What just happened:* "Don't be too long" leaves "how long?" unanswered; "under 100 words" gives a target. "Don't use jargon" still leaves the door open; "plain, everyday language for a beginner" describes the thing you actually want. Stating the positive removes ambiguity instead of just fencing off one bad option.

💡 **Key point.** Whenever you catch yourself writing "don't…," ask: *what do I want instead?* Then write that.

## Stacking them

These combine. A strong real-world prompt often uses several at once: a role, an explicit format, an example or two, and a clear positive instruction. You don't need all five every time — reach for the ones the task needs.

```text
You are a support agent. Reply to the customer email below.

Tone: friendly and apologetic. Length: under 80 words.
Always end by offering a refund or a replacement.

Here's the style to match:
"Hi Sam, I'm so sorry about the mix-up — that's on us. ..."

Customer email:
[paste email here]
```

*What just happened:* That single prompt stacks a role (support agent), a tone and length (friendly, under 80 words), a positive instruction (always offer a refund or replacement), and a style example to imitate. Each line narrows the target a little more — which is the entire idea from Phase 1, applied four times in one breath.

## Recap

1. **Context and a role** shape style, framing, and audience — not knowledge or accuracy.
2. **Specify format and length** explicitly; it's the cheapest, highest-value habit.
3. **Show examples (few-shot)** when the pattern is easier to demonstrate than to describe.
4. **Step-by-step (chain-of-thought)** helps *reasoning* tasks; it's not a universal booster.
5. **Say what to do**, not only what to avoid — positive instructions point at the target.
6. Stack the ones the task needs. Each line you add narrows what a good continuation looks like.

These work. The next phase is about being clear-eyed on what they *don't* — so you know where prompting stops and other tools begin.

---

[← Phase 1: A Prompt Is an Instruction](01-instruction-not-a-spell.md) · [Guide overview](_guide.md) · [Phase 3: Honest Limits →](03-honest-limits.md)
