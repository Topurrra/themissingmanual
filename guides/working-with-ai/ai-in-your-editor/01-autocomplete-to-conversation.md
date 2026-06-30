---
title: "Autocomplete to Conversation"
guide: ai-in-your-editor
phase: 1
summary: "The range of editor AI, from inline next-line suggestions to a chat that edits your files, and what Copilot and Cursor each actually do."
tags: [copilot, cursor, ide, autocomplete, ai]
difficulty: beginner
synonyms:
  - "what does github copilot actually do"
  - "difference between copilot and cursor"
  - "inline ai suggestions vs ai chat"
  - "ai that edits multiple files"
  - "ghost text code completion"
updated: 2026-06-30
---

# Autocomplete to Conversation

Editor AI is not one feature. It's a spectrum, and knowing where you are on it tells you how much to trust what you're seeing.

## The ghost-text end

At the quiet end is inline completion. You type, and faint gray text appears ahead of your cursor — a guess at the rest of the line, or the next several lines. Press Tab and it's yours; keep typing and it disappears. People call this "ghost text," and it's what most folks mean by "AI autocomplete."

This is closest to a very well-read typing assistant. It has seen an enormous amount of code, so it's good at the boring middle: finishing a loop you've started, filling in a function whose name makes the intent clear, repeating a pattern you used three lines up. When you write `# read the file and return its lines as a list` and the next line is the obvious code, ghost text usually nails it.

What it's guessing from is narrow: mostly the file you're in and a few nearby ones. It does not know your whole project unless the tool went and gathered more (more on that in the next phase). So it's confident about local patterns and clueless about anything that lives in a file it never saw.

## The conversation end

At the other end is in-editor chat. Here you open a panel, type a question or a request in plain language, and the AI answers — often with code it can drop straight into your files. "Why is this function returning None?" "Add input validation to this form." "Rewrite this to use the new API." The AI reads the relevant code, reasons about it, and replies.

The leap from ghost text to chat is the leap from *finishing your sentence* to *taking instructions*. Ghost text reacts to your cursor. Chat acts on your words. And the more recent flavor — sometimes called an "agent" mode — can go further: change several files at once, run a command, read the error, and try again. That's genuinely useful and genuinely riskier, because more is happening between your request and the result you're asked to accept.

## What Copilot does

GitHub Copilot started as the ghost-text tool and is still the cleanest example of it. You install it into VS Code or a JetBrains IDE, and it suggests as you type. Over time it grew a chat panel (Copilot Chat) where you can ask about your code, and an agent mode that can make multi-file edits and run tasks. It lives inside an editor you already use, which is its whole appeal: nothing changes about your setup except that suggestions now appear.

Think of Copilot as a layer added onto your existing editor. The editor is still the editor; Copilot is the helpful overlay.

## What Cursor does

Cursor takes the other approach: it *is* the editor. It's a fork of VS Code — your extensions and keybindings mostly carry over — built so the AI is the center of gravity rather than a bolt-on. It does ghost text too, but it leans hard into chat and multi-file edits, and it works to pull in context from across your whole project automatically rather than only the open file.

The practical difference: with Copilot you add AI to your editor; with Cursor you adopt an editor built around AI. Both end up offering inline completion, chat, and agent-style edits. The lines between them blur every release, and other tools (JetBrains' own AI, Windsurf, and more) sit in the same space.

## Picking a starting point

Don't overthink the choice. If you already live in VS Code or a JetBrains IDE and want to dip a toe in, add Copilot — it's the smallest change. If you want the AI-first experience and don't mind switching editors, try Cursor. You can swap later; the skills transfer.

Here's the table version:

| | Ghost text | In-editor chat | Agent edits |
|---|---|---|---|
| You do | Type | Ask in words | Describe a task |
| It does | Finish the line | Answer, suggest code | Edit files, run commands |
| Trust level | Glance and accept | Read before accepting | Read carefully, every change |

Notice the trust column. It tightens as you move right. That's the thread running through the rest of this guide: the more the AI does on your behalf, the more deliberately you have to check it. Two things make that checking possible and reliable — giving the AI the right context up front, and reviewing the diff before you accept. Those are the next two phases.
