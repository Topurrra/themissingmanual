---
title: "Headers, Cookies & the S in HTTPS"
guide: "http-explained"
phase: 3
summary: "The extra notes every HTTP message carries (headers - content type, authentication, and more), how cookies let a site remember who you are, and what the S in HTTPS actually buys you: encryption so others can't read or tamper with the conversation."
tags: [http, https, headers, cookies, encryption, authentication, security]
difficulty: beginner
synonyms: ["what are http headers", "what is a cookie", "how do cookies work", "what is https", "what does the s in https mean", "is https secure", "what is mixed content"]
updated: 2026-07-10
---

# Headers, Cookies & the S in HTTPS

You've got the core conversation down: request out, response back, verb on one side, status on the other. But we kept waving at some "extra notes" on each message. This phase opens them up.

Those notes are **headers**, and they carry everything that isn't the main content - what format the body is in, who you are, whether the site is allowed to remember you. Out of headers come **cookies** (how a site knows it's still you on the next click) and a lot of what makes **HTTPS** trustworthy.

## Headers - the notes on every message

A **header** is a single `Name: Value` line attached to a request or response, carrying information *about* the message rather than the message itself. You saw a few in Phase 1: `Host`, `Content-Type`, `Content-Length`. There can be many, and both sides use them.

Think of mailing a package: the body is what's *inside* the box, headers are everything written *on* it - who it's for, what's in it, whether it's fragile. The server reads the labels before it opens the package.

📝 **Terminology.** **Header** = one `Name: Value` line of metadata on an HTTP message. **Body** = the actual content (the HTML, the JSON, the image). Headers describe; the body delivers.

A handful you'll genuinely run into:

- **`Content-Type`** - what kind of thing the body is: `text/html` for a page, `application/json` for data, `image/png` for an image. This is how your browser knows whether to *draw* the body or *download* it.
- **`Authorization`** - proof of who you are, when a request needs it. The proper place for a secret token or credentials - a header, not stapled into the visible URL (remember the query-string warning from [Phase 1](01-request-and-response.md)).
- **`User-Agent`** - a description of the client itself (which browser, which version) - how a server tells a phone from a desktop.
- **`Cache-Control`** - instructions about reuse: "keep a copy for an hour" versus "always ask me fresh."

Here's a request and the start of its response, headers and all:

```http
GET /account HTTP/1.1
Host: example.com
Authorization: Bearer a1b2c3d4e5
Accept: text/html
```
```http
HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8
Cache-Control: no-store

<!DOCTYPE html> ...
```
*What just happened:* the client proved who it was with an `Authorization` header (the `Bearer ...` token is its ID badge) and asked for HTML back. The server approved, labelled its answer `Content-Type: text/html` so the browser knows to render it, and added `Cache-Control: no-store` - "don't keep a copy of this account page lying around." Neither side put any of that in the URL or the body; the headers carried it.

Half the puzzling moments in web work are a header doing its job quietly - a file downloading instead of displaying (wrong `Content-Type`), a request rejected as unauthorized (missing `Authorization`), a page stubbornly showing old content (`Cache-Control`). Once you know headers exist, those stop being mysteries and become a place to look.

## Cookies - how a site remembers you

HTTP has a problem by nature: each request stands completely alone. The server answers and then, in effect, *forgets you exist* - the next request is a stranger all over again. So how does a site keep you logged in across a dozen clicks? With a **cookie**.

📝 **Terminology.** A **cookie** is a small piece of text a server asks your browser to hold onto and hand back on every future request to that site - the site's way of pinning a name tag on you.

The mechanism is two ordinary headers, one on the way down, one on the way back up:

```http
HTTP/1.1 200 OK
Set-Cookie: session=7f3a9b2c; HttpOnly; Secure
```
*What just happened:* when you logged in, the server's response included `Set-Cookie`: "here's a token, `session=7f3a9b2c` - hold onto this." Your browser quietly saved it. `HttpOnly` and `Secure` are guardrails, telling the browser to keep the cookie out of reach of page scripts and to send it only over encrypted connections.

From then on, your browser includes it automatically on every request back to that site:

```http
GET /account HTTP/1.1
Host: example.com
Cookie: session=7f3a9b2c
```
*What just happened:* the browser attached the cookie in a `Cookie` header, without you doing anything. The server reads `session=7f3a9b2c`, looks it up, recognizes "this is the person who logged in earlier," and shows your account. `Set-Cookie` down, `Cookie` back up on every request - that's how a stack of forgetful, independent requests adds up to *staying logged in*.

That same mechanism is why cookies get talked about for tracking: a cookie that follows you around can recognize you across pages and visits. The technology is neutral - the same name tag whether it's keeping you logged in or watching where you go.

⚠️ **Gotcha.** A cookie is only as private as the connection it travels on. Over plain `http://`, anyone sitting between you and the server can *read* that `Cookie: session=...` header as it goes by - and a stolen session cookie can let someone impersonate you without ever knowing your password. This is the single biggest reason the next section exists: cookies and HTTPS are a package deal.

## The S in HTTPS - encryption, plainly

`https://` is the same HTTP you've learned this whole guide - same requests, responses, headers - wrapped in a layer that **encrypts** the conversation. The "S" stands for "Secure," and it buys you two things:

- **Privacy.** Anyone who can see your traffic - café Wi-Fi, your ISP, a machine in the middle - sees only scrambled noise, not the page you're reading or the cookie you're sending.
- **Integrity.** Nobody in the middle can quietly *alter* the page on its way to you - inject an ad, swap a download, change an account number. Tampered bytes are detectable.

(There's a third thing - confidence you're really talking to who you think you are, via certificates - but privacy and integrity are the heart of it.)

A common belief is that HTTPS means "this website is safe / trustworthy." It doesn't. HTTPS protects the *conversation*, not the *intentions* of whoever's on the other end - a scam site can have a perfect padlock. The padlock means "no one is eavesdropping on or tampering with what you send" - not "this server is run by good people." Conflating those is how people get caught out.

The encryption HTTPS adds doesn't live *inside* HTTP - it's a separate layer (called TLS) sitting just beneath it, scrambling bytes before they're sent and unscrambling them on arrival. HTTP doesn't even know it's there. Where that layer sits relative to everything else is the job of [The TCP/IP Model](/guides/tcp-ip-model).

⚠️ **Gotcha - mixed content.** A page loaded over `https://` is only fully protected if *everything* on it also came over `https`. If a secure page pulls in an image, script, or stylesheet over plain `http://`, that's **mixed content** - one insecure piece reopening the hole HTTPS was closing, since it can be read or tampered with in transit. Browsers block the insecure parts or strip the padlock and warn you. A "not fully secure" warning on a site that should be secure usually means one stray `http://` link on an otherwise `https://` page.

## Recap

1. **Headers** are `Name: Value` notes carrying metadata about a message - `Content-Type` (what the body is), `Authorization` (who you are), `Cache-Control` (whether to reuse it), and many more.
2. **Cookies** solve HTTP's forgetfulness: the server sends one with `Set-Cookie`, your browser hands it back in a `Cookie` header on every request, and that's how you "stay logged in."
3. A cookie is only as safe as its connection - over plain `http`, it can be read and stolen.
4. **HTTPS** is HTTP plus encryption: it gives you **privacy** (no eavesdropping) and **integrity** (no tampering) - but *not* a promise that the site itself is trustworthy.
5. **Mixed content** - an `http` resource on an `https` page - quietly undoes that protection, which is why browsers warn about it.

That's the whole everyday picture of HTTP: a request and a response (Phase 1), the verbs and replies they use (Phase 2), and the headers, cookies, and encryption that ride along (Phase 3). You can now read a request, read a response, read a status code, and read the address bar - which is most of what the web is doing, all day, under everything you click.

> Want to go a layer deeper - how the bytes actually travel, how a name like `example.com` becomes a
> machine you can reach, and where encryption sits in the stack? Continue with
> [How the Internet Works](/guides/how-the-internet-works),
> [IP, DNS, and Ports](/guides/ip-dns-and-ports), and [The TCP/IP Model](/guides/tcp-ip-model).

---

[← Phase 2: Methods & Status Codes](02-methods-and-status-codes.md) · [Guide overview](_guide.md)
