---
title: "The Reasoning-Acting Cycle"
guide: "building-an-ai-agent"
phase: 2
summary: "How the loop really runs: function-calling with a JSON schema, the turn-by-turn message exchange between your code and the model, how tool results feed back, and what memory actually means for an agent."
tags: [ai, agent, function-calling, tool-use, schema, messages, memory]
difficulty: intermediate
synonyms: ["how function calling works", "json schema for tools", "agent message exchange", "feed tool result back to model", "what is agent memory", "react cycle in code", "structured tool call from llm"]
updated: 2026-07-10
---  

# The Reasoning-Acting Cycle

[Phase 1](01-an-agent-is-a-loop.md) landed the shape: reason, act, look, repeat. That leaves the question every builder hits next — *how does the model actually "call" a function?* It only emits text. So how does fuzzy English ("I should check the weather") turn into a clean, runnable call your code can trust?

The answer is **function-calling**: you describe your tools to the model in a strict format, and it replies with a structured request instead of prose. This phase walks the real exchange, message by message, so you can see exactly what crosses the wire each turn.

## Step 1 — You describe the tools with a schema

Before the loop starts, you tell the model what tools exist. Not the code — a *description*: each tool's name, what it does, and what arguments it takes, written as a small JSON schema. Think of it as a menu the model orders from.

```text
tool: get_weather
  description: "Get the current weather for a city."
  parameters:
    city:  string  (required)  — "the city name, e.g. Oslo"
    units: string  (optional)  — "celsius or fahrenheit"
```

*What just happened:* You handed the model a contract. The `description` lines aren't decoration — the model reads them to decide *when* a tool fits a task and *how* to fill the arguments. Vague descriptions get vague tool calls; this is the cheapest, highest-leverage quality knob you have.

> 📝 **Schema** — a machine-readable description of a tool's name, purpose, and arguments (usually JSON Schema). The model uses it to format a valid call; your code uses it to validate what comes back. Same contract, both sides.

## Step 2 — The model replies with a structured call, not prose

When the model decides a tool fits, it doesn't write "you should check the weather." It returns a structured object naming the tool and its arguments — already parsed, ready to run.

```text
model returns:
{
  "tool_call": {
    "name": "get_weather",
    "arguments": { "city": "Oslo", "units": "celsius" }
  }
}
```

*What just happened:* The model translated its intent into the exact shape your code expects. No regex, no scraping English for a city name — you get a name and a clean argument bag. This structured handoff is the engineering breakthrough that made agents practical; before function-calling, you were parsing freeform text and praying.

## Step 3 — Your loop runs the tool and feeds the result back

Your code takes that object, calls the real `get_weather("Oslo")`, gets a number, and appends the result to the conversation as a new message — tagged as coming from the tool. Then you call the model again.

```text
your loop appends:
{
  "role": "tool",
  "name": "get_weather",
  "content": "12°C, light rain"
}
→ call model again with the updated message list
```

*What just happened:* The tool's output re-entered the conversation as just another message. From the model's point of view, the next turn simply has more information than the last. This is the feedback edge from the Phase 1 diagram, made concrete — and notice nothing is hidden: the whole exchange is plain messages.

## The full exchange in one view

Here's a complete two-tool task as the message list grows. Each block is one message; the loop calls the model once per "→".

```text
[user]   "Should I bring an umbrella to the Oslo office today?"
   → model
[model]  tool_call: get_weather(city="Oslo")
   (your loop runs it)
[tool]   get_weather → "12°C, light rain expected this afternoon"
   → model
[model]  tool_call: get_hours(office="Oslo")
   (your loop runs it)
[tool]   get_hours → "open until 18:00"
   → model
[model]  "Yes — rain's expected this afternoon and the office is
          open until 18:00, so you'll likely be out in it."
```

*What just happened:* The agent ran twice through reason→act→observe, then exited the loop with a final answer because no further tool was needed. The entire "memory" of the task is right there: it's the growing message list. That's the next idea, and it's smaller than it sounds.

## What "memory" actually means here

People imagine agent memory as something exotic. For a single task, it isn't — it's the **conversation history you keep resending**. The model is stateless between calls; it remembers nothing on its own. Every turn, you send the *entire* message list back, and that list *is* the memory.

```text
TURN 3 request to model =  [user msg]
                           + [model: tool_call get_weather]
                           + [tool: 12°C, light rain]
                           + [model: tool_call get_hours]
                           + [tool: open until 18:00]
```

*What just happened:* By turn 3 you're resending everything from turns 1 and 2. The model "remembers" the weather only because you handed it back the message that contained it. Drop a message and the agent forgets that fact instantly — there's no hidden store keeping it.

> 💡 **Key point.** Short-term memory = the message list you resend each turn. Long-term memory (facts that outlive one task) is a separate thing you build — usually by writing notes to a store and *retrieving* the relevant ones into the prompt later. That retrieval-into-the-prompt pattern is exactly what [RAG](/guides/rag-explained) describes; an agent with long-term memory is, under the hood, an agent that does RAG over its own past.

## For builders

The whole cycle is a tidy loop you can write today: keep a `messages` list, call the model, branch on the reply. If it's a tool call, run the named function with the given arguments, append a tool message with the output, and loop. If it's a final answer, return it. The two failure points to anticipate — the model naming a tool that doesn't exist, and the loop never reaching a final answer — are exactly what [Phase 3](03-where-agents-go-wrong.md) is about.

> ⚠️ **Gotcha — never trust the arguments blindly.** The model can return arguments that are malformed, out of range, or pointed somewhere dangerous (a path traversal, an oversized query). Validate every tool call against its schema *before* you execute it. The model is suggesting; your code is responsible for what actually runs.

```quiz
[
  {
    "q": "In function-calling, how does the model 'call' a tool?",
    "choices": [
      "It writes a sentence and your code searches it for keywords",
      "It returns a structured object naming the tool and its arguments",
      "It runs the function directly inside the model",
      "It opens a network socket to the tool's server"
    ],
    "answer": 1,
    "explain": "The model returns a structured call (name + arguments) that your code can run directly — no parsing of freeform English required."
  },
  {
    "q": "After your loop runs a tool, how does the result reach the model?",
    "choices": [
      "It's stored in the model's weights for next time",
      "You append it to the message list as a tool message and call the model again",
      "The model polls your server for it",
      "It's discarded — the model re-derives it"
    ],
    "answer": 1,
    "explain": "The tool output re-enters the conversation as a new message. On the next call the model simply sees more information than before."
  },
  {
    "q": "What is an agent's short-term 'memory' during a single task?",
    "choices": [
      "A vector database the model writes to automatically",
      "The conversation message list you resend on every turn",
      "Hidden internal state the model keeps between calls",
      "The system prompt only"
    ],
    "answer": 1,
    "explain": "The model is stateless between calls. It remembers a fact only because you keep resending the message that contains it. The growing message list IS the memory."
  }
]
```

[← Phase 1: An Agent Is a Loop](01-an-agent-is-a-loop.md) · [Guide overview](_guide.md) · [Phase 3: Where Agents Go Wrong →](03-where-agents-go-wrong.md)
