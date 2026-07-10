---
title: "Making the Request (Postman & curl)"
guide: "reading-api-docs-postman"
phase: 2
summary: "Postman and curl are two interfaces to the same thing — building an HTTP request out of a method, URL, headers, and body. Build one GET-with-auth request both ways, with an annotated curl transcript."
tags: [apis, postman, curl, http, headers, authentication, beginner-friendly]
difficulty: beginner
synonyms: ["how to use postman", "how to make a request in postman", "how to use curl", "curl with authorization header", "postman vs curl"]
updated: 2026-07-10
---

# Making the Request (Postman & curl)

You found the five things in [Phase 1](01-how-to-read-api-docs.md): the base URL, the endpoint and
method, the parameters, the auth header, and the example. Now you fire the request. There are two tools
you'll reach for, and here's the thing that makes both feel calm — **they are the same tool wearing
different clothes.**

## The one idea: both tools build the same request

Whether you click around in Postman or type a command in curl, you are assembling the exact same four
things and handing them to the same server:

```text
   An HTTP request = four parts, every time:

   ┌─────────────────────────────────────────────┐
   │ METHOD   GET                                 │  the verb
   │ URL      https://api.bookshelf.dev/v1/books  │  where + which thing
   │ HEADERS  Authorization: Bearer sk_live_...   │  the "envelope" info, incl. auth
   │ BODY     (none for GET)                       │  the payload, for POST/PUT
   └─────────────────────────────────────────────┘
                          │
              Postman ────┤──── curl
            (you click    │   (you type
             the parts)   │    the parts)
                          ▼
                    the same server
```

The moment you see that Postman fields and curl flags are *the same four parts*, you stop memorizing
either tool. A header is a header. A method is a method. You learn the request once and translate between
tools freely.

📝 **Terminology.**
- **Postman** is a graphical app (GUI) for building and sending HTTP requests. You fill in fields and
  click **Send**; it shows you the response in a nice panel. Great for exploring an API and saving
  requests to reuse.
- **curl** ("see-URL") is a command-line tool that does the same thing in one typed line. It's
  everywhere — preinstalled on macOS and Linux and on modern Windows — which is why docs and Stack
  Overflow answers are written in curl. Great for scripts, quick checks, and pasting into a ticket.

Neither is "better." Postman is friendlier to poke at an API by hand; curl is friendlier to automate
and to share. Knowing both means you're never stuck.

## The same request in Postman

Let's send the request we assembled in Phase 1: `GET https://api.bookshelf.dev/v1/books/42` with an auth
header. In Postman, you're filling in the four parts of that diagram, each in its own spot:

**1. Method and URL.** At the top of a new request there's a dropdown (it defaults to `GET`) and a long
URL bar. Set the dropdown to `GET` and paste the full URL — base URL, endpoint, and the `42` filled in
for `{id}`:

```text
   [ GET ▼ ]  https://api.bookshelf.dev/v1/books/42        [ Send ]
```

**2. Headers — where auth goes.** Below the URL is a row of tabs: **Params**, **Authorization**,
**Headers**, **Body**. Two equivalent ways to attach your token:

- The **Headers** tab: add a row with key `Authorization` and value `Bearer sk_live_...`. This is the
  literal header from the docs — what's actually sent over the wire.
- The **Authorization** tab: choose type "Bearer Token" and paste just the token. Postman *builds the
  same `Authorization` header for you* behind the scenes. Same result, fewer chances to fat-finger the
  word "Bearer."

💡 **Key point.** The **Params** tab and the **Body** tab map straight onto Phase 1's parameters. Query
parameters go in **Params** (Postman appends them to the URL as `?key=value` for you); a JSON body for a
`POST` goes in **Body**. You're filling in the same fields the docs' parameter table listed.

**3. Send.** Click **Send**. The response — status code, time, and body — appears in the panel below.
We read that panel in [Phase 3](03-reading-the-response.md).

⚠️ **Gotcha.** A request that works in Postman but fails when your *code* runs it is almost always a
header your code forgot — most often `Authorization`, or a `Content-Type: application/json` on a `POST`.
Postman can be configured to add some headers automatically, so what you see in the GUI isn't always
exactly what a bare script sends. When debugging, compare the *actual* headers, not the convenient ones.

## The same request in curl

Now the identical request, typed. curl's flags are just the four parts again. Here it is, annotated
line by line (the `\` at the end of each line lets one command span several lines for readability):

```console
$ curl https://api.bookshelf.dev/v1/books/42 \
    --request GET \
    --header "Authorization: Bearer sk_live_8Kd2x9..."
```

Reading the flags against the diagram:

```text
   curl  https://.../books/42         the URL  (curl's first argument)
   --request GET                      the METHOD   (short form: -X GET)
   --header "Authorization: Bearer …" a HEADER     (short form: -H; repeat for more)
```

📝 **Terminology.** Those `--request` / `--header` are **flags** (options). curl has a short form for
each: `-X` for `--request`, `-H` for `--header`. You'll see both in the wild; they're identical. For
`GET`, you can even drop `--request` entirely, because curl sends `GET` by default — so the *minimal*
version of this exact call is:

```console
$ curl https://api.bookshelf.dev/v1/books/42 \
    -H "Authorization: Bearer sk_live_8Kd2x9..."
```

Now the full transcript — command, then realistic output:

```console
$ curl https://api.bookshelf.dev/v1/books/42 \
    -H "Authorization: Bearer sk_live_8Kd2x9..."
{"id":42,"title":"The Left Hand of Darkness","author":"Ursula K. Le Guin","genre":"scifi","year":1969}
```

curl built an HTTP `GET` request to that URL, attached your `Authorization` header, sent it, and printed
the server's response body straight to your terminal. That body is JSON — the same shape the docs'
example promised in Phase 1 — but crammed onto one line, because curl prints exactly what the server
sent, with no prettifying. (You'll see how to read it, including the status code curl hid by default, in
[Phase 3](03-reading-the-response.md).)

⚠️ **Gotcha — the quotes matter.** Wrap the header value in double quotes: `-H "Authorization: Bearer
..."`. Without quotes, your shell sees the space after `Bearer` and treats the rest as separate
arguments, and curl gets a broken, half-a-header. If a curl call fails in a confusing way, missing or
mismatched quotes are the first suspect.

## Translating between the two

Because they're the same four parts, copying a request from one tool to the other is mechanical — and
both tools help you. This is a genuinely useful daily move:

- **Docs give you curl, you prefer Postman?** Postman has an **Import** that pastes a raw curl command
  and fills in the method, URL, headers, and body for you.
- **Built it in Postman, need it in a ticket or a script?** Postman's **Code** button exports the
  request as curl (and many languages). Paste that into a bug report and a teammate can reproduce your
  exact call.

🪖 **War story.** The fastest way I've seen a "the API is broken!" panic get resolved: someone exported
their failing Postman request as curl, pasted it into the chat, and a teammate spotted in two seconds
that the token had an extra space in it. The curl line made the *exact* request visible — no "well, what
did you click?" The lesson: when a request misbehaves, get it into curl, because curl is the request
with nothing hidden.

## Recap

1. Postman and curl build the **same HTTP request** — method, URL, headers, body — just clicked vs.
   typed.
2. In **Postman**: method dropdown + URL bar, the **Authorization**/**Headers** tab for your token, and
   **Params**/**Body** for parameters; then **Send**.
3. In **curl**: the URL is the first argument, `-X`/`--request` is the method (skippable for `GET`), and
   `-H`/`--header` adds a header — **quote the header value**.
4. The auth header is the same `Authorization: Bearer <token>` from the docs in both tools.
5. You can **import curl into Postman** and **export Postman as curl** — translate freely, and reach for
   curl when you need to show someone the exact request.

---

[← Phase 1: How to Read API Docs](01-how-to-read-api-docs.md) · [Guide overview](_guide.md) · [Phase 3: Reading the Response & Iterating →](03-reading-the-response.md)
