---
title: "The Handshake & Keys"
guide: "https-and-tls"
phase: 2
summary: "How two strangers agree on a shared secret over an open wire: slow asymmetric (public/private key) cryptography is used to bootstrap trust and agree on a key, then fast symmetric encryption protects all the actual data. A walk through the TLS handshake with an ASCII diagram, and where TLS sits in the stack."
tags: [security, tls, handshake, asymmetric, symmetric, public-key, encryption, keys]
difficulty: intermediate
synonyms: ["how does the tls handshake work", "what is asymmetric encryption", "public key vs private key", "how do https keys work", "why use both symmetric and asymmetric encryption", "how do two computers agree on a secret"]
updated: 2026-06-19
---

# The Handshake & Keys

Here's a puzzle that sounds impossible. Two computers that have never met, talking over a wire that anyone can listen to, need to agree on a secret password so they can scramble their conversation. But anything one sends, the eavesdropper hears too. So how do they whisper a secret in a crowded room where every word is shouted aloud?

The answer is one of the genuinely clever ideas in computing, and once it clicks, the rest of TLS makes sense. This phase walks through it slowly. No math required — just the shapes of the ideas.

## Two kinds of locks

Everyday encryption you might imagine works like a house key: one key locks and unlocks the same lock. That's **symmetric encryption** — the same secret both scrambles and unscrambles the data. It's fast and it's what protects the bulk of your traffic. The catch is right there in the name: *both sides need the same secret first.* And we're back to the impossible puzzle — how do you share that secret over a wire everyone can hear?

📝 **Asymmetric encryption** (also called *public-key* cryptography) solves it with a different shape of lock: a **key pair**. The two keys are mathematically linked, but you can't derive one from the other.

- A **public key** that you hand out freely — print it on a billboard if you like.
- A **private key** that you guard and never share.

The trick: **anything locked with the public key can only be unlocked with the matching private key.** So anyone can lock a message for you using your public billboard key, but only you, holding the private key, can open it. The eavesdropper hearing the public key learns nothing useful — it only *locks*, it can't *unlock*.

```text
   SYMMETRIC (one shared key)            ASYMMETRIC (a matched pair)
   ────────────────────────             ───────────────────────────
        🔑  same key                       🔓 public key   →  locks
       /        \                          🔑 private key  →  unlocks
   lock          unlock                    (anyone can lock; only the
   (fast, but both sides                    private-key holder unlocks;
    must share the key first)               slow, but no shared secret needed)
```

## Why use both? The design decision

Asymmetric crypto sounds magical, so why not use it for everything? Because it's **slow** — far too slow to encrypt every byte of a video stream or a busy API. Symmetric crypto is **fast**, but needs a shared secret you can't safely send.

So TLS does the obvious smart thing: use each for what it's good at.

> Use **slow asymmetric** crypto *once*, at the start, to safely agree on a shared secret. Then switch to **fast symmetric** crypto, using that secret, for all the actual data.

That bootstrapping step — agree on a shared secret without ever sending it in the clear — is the heart of the **TLS handshake**. The shared secret it produces is called the **session key**.

💡 **The one idea to hold onto:** asymmetric crypto exists to *bootstrap* a fast symmetric key. It's the secure handshake before the fast conversation — not the conversation itself.

## The handshake, step by step

Here's the shape of what happens in the half-second before your page loads, slightly simplified to keep the idea clear. (Modern TLS 1.3 streamlines this and uses a key-agreement method where neither side ever transmits the secret at all — but the *roles* below are what matters for the mental model.)

```text
   YOU (browser)                                        SERVER (yourbank.com)
        │                                                        │
        │ ── 1. "Hello. Here's what TLS versions & ──────────►   │
        │        ciphers I can speak."                           │
        │                                                        │
        │ ◄──── 2. "Hello. Let's use this cipher. ──────────────  │
        │          And here is my CERTIFICATE,                   │
        │          which contains my PUBLIC KEY."                │
        │                                                        │
   3. You CHECK the certificate                                  │
      (Is it for yourbank.com? Signed by a                       │
       CA I trust? Not expired? — Phase 3)                       │
        │                                                        │
        │ ── 4. Using the public key, both sides ──────────►     │
        │        safely agree on a shared SESSION KEY            │
        │        (the eavesdropper can't derive it)              │
        │                                                        │
        │ ◄═══ 5. From here on, EVERYTHING is encrypted ═══════► │
        │        with the fast SYMMETRIC session key.            │
        │        (your password, the page, all of it)            │
        │                                                        │
```

*What just happened:* Steps 1–2 are introductions — agreeing on a common language and the server presenting its credentials. Step 3 is where authentication happens: you verify the certificate before trusting anything (the whole of Phase 3). Step 4 is the clever part — the public/private key pair lets both sides arrive at the *same* session key without that key ever crossing the wire in a form an eavesdropper could use. Step 5 is the payoff: a fast, symmetric, encrypted tunnel for the real conversation. Notice the asymmetric keys did their job in step 4 and then step aside.

⚠️ **The gotcha.** The handshake authenticates the *server* to *you* — that's the default and what protects normal browsing. It does **not** automatically prove *you* to the server; that's what your login (password, token, etc.) is for afterward, inside the encrypted tunnel. (Two-way "mutual TLS," where the client also presents a certificate, exists but is the exception, used mostly between back-end services — not for everyday websites.)

## Where TLS sits in the stack

It helps to know *where* this layer lives. TLS isn't a replacement for the networking you already know — it slots neatly into it.

```text
   ┌─────────────────────────────┐
   │  HTTP   (your page request)  │   ← the application's language
   ├─────────────────────────────┤
   │  TLS    (encrypt + verify)   │   ← THIS GUIDE: the security layer
   ├─────────────────────────────┤
   │  TCP    (reliable delivery)  │   ← gets bytes there in order, intact
   ├─────────────────────────────┤
   │  IP     (addressing/routing) │   ← finds the machine across the internet
   └─────────────────────────────┘
```

*What just happened:* TLS sits *between* HTTP and TCP. First TCP makes a reliable connection (the bytes will arrive, in order). Then TLS runs its handshake over that connection and turns it into a private, verified channel. Then HTTP flows through that channel exactly as it normally would — it barely knows TLS is there. That's why "HTTPS" is genuinely "HTTP over TLS," nothing more exotic. For the full picture of those lower layers, see [The TCP/IP Model](/guides/tcp-ip-model).

## Why this saves you later

When something goes wrong with HTTPS, knowing the handshake order tells you *where* to look. A "connection reset during handshake" is a different problem from a certificate error (Phase 3), which is different again from a page that loads fine but behaves badly (an application bug, not a TLS one). And when you hear "we need to rotate the private key" or "the session key is ephemeral," you'll know exactly which key they mean and what role it plays.

## Recap

1. **Symmetric** encryption uses one shared key — fast, but both sides must already share the secret.
2. **Asymmetric** encryption uses a public/private key pair — anyone can lock with the public key, only the private key unlocks. No pre-shared secret needed, but it's slow.
3. TLS uses the slow asymmetric pair *once* to safely agree on a fast **symmetric session key**, then uses that for all the real data. Best of both.
4. The handshake: hello → server's certificate + public key → you verify it → both agree on a session key → encrypted conversation begins.
5. The handshake authenticates the **server to you** by default; your login authenticates **you to the server** afterward, inside the tunnel.
6. TLS sits between **HTTP** and **TCP** — it secures the reliable connection that TCP/IP already built.

---

[← Phase 1: What HTTPS Protects (and Doesn't)](01-what-https-protects.md) · [Phase 3: Certificates & Trust →](03-certificates-and-trust.md)
