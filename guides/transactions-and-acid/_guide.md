---
title: "Transactions & ACID, Explained"
guide: "transactions-and-acid"
phase: 0
summary: "What a database transaction actually is, the four ACID guarantees in plain language, and what really goes wrong when transactions overlap — so you can make multiple changes all-or-nothing without losing sleep."
tags: [databases, transactions, acid, isolation, concurrency, sql]
category: databases
order: 6
difficulty: intermediate
synonyms: ["what is a database transaction", "what does acid mean", "begin commit rollback explained", "atomicity consistency isolation durability", "why do i need transactions", "database isolation levels explained", "what is a deadlock"]
updated: 2026-06-19
---

# Transactions & ACID, Explained

You're moving money from one account to another. You subtract $100 from Alice, and then — right there, between two statements — the process crashes, the connection drops, the server reboots. Bob never got his $100. It vanished. Somewhere a customer is furious and you're staring at two rows that don't add up.

This is the problem transactions exist to solve: making a *group* of changes happen completely or not at all, with nothing torn in half. This guide gives you the mental model first (a transaction is an all-or-nothing bundle), then the four guarantees behind the acronym ACID in plain words, and finally the messy reality of what happens when many transactions run at once — dirty reads, deadlocks, and the dial you turn to trade safety for speed.

## How to read this

- **Need the gist fast?** Phase 1 alone gives you the working mental model and the three commands (`BEGIN`, `COMMIT`, `ROLLBACK`) you'll use every day.
- **Want it to finally make sense?** Read in order. Each phase builds on the last: the bundle (Phase 1), the four promises about that bundle (Phase 2), and what breaks when bundles overlap (Phase 3).

## The phases

1. **[What a Transaction Is](01-what-a-transaction-is.md)** — the money-transfer story, `BEGIN` / `COMMIT` / `ROLLBACK`, and the mental model of a transaction as one all-or-nothing bundle.
2. **[ACID, Explained](02-acid-explained.md)** — Atomicity, Consistency, Isolation, and Durability, each in one plain sentence with a concrete example.
3. **[Isolation & Concurrency in Real Life](03-isolation-and-concurrency.md)** — dirty reads, non-repeatable reads, and phantoms; isolation levels as a safety-vs-speed dial; and ⚠️ deadlocks — what they are and how real apps handle them.

> This guide covers single-database transactions. Distributed transactions across multiple databases (two-phase commit, sagas) are a much harder problem with their own trade-offs — that's a follow-up guide, and you'll find a thread to it from [Scaling a Database](/guides/scaling-a-database).
