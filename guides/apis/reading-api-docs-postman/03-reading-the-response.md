---
title: "Reading the Response & Iterating"
guide: "reading-api-docs-postman"
phase: 3
summary: "Read the status code before the body, tweak parameters and re-send, and save requests into Postman collections with variables for base URL and token - without ever leaking your API key."
tags: [apis, postman, curl, http-status-codes, collections, environment-variables, security, beginner-friendly]
difficulty: beginner
synonyms: ["what does http 401 mean", "how to read an api response", "postman collections and variables", "how to not leak api key", "http status code cheat sheet"]
updated: 2026-07-10
---

# Reading the Response & Iterating

You sent the request. Something came back. The instinct is to dive into the body looking for your data - 
but the first thing to read is the small number that tells you whether the request even *worked*. Read
it in the right order and the response stops being a mystery: status code first, then body. This phase
is that habit, plus how to tweak-and-resend efficiently and save your work safely.

## In a panic? The status-code cheat-card

You got a number you don't recognize and something's on fire. Find it here, breathe, then read the
section underneath for the fix.

| Code | Family | What it means | Calm first move |
|---|---|---|---|
| **200** | success | It worked, body has your data | Read the body |
| **201** | success | Created (after a `POST`) | Read the body for the new thing's id |
| **204** | success | Worked, no body to send back (common after `DELETE`) | Nothing - it's fine |
| **400** | your fault | Bad request - malformed input | Check your body/params against the docs |
| **401** | your fault | Unauthorized - who are you? | Token missing/wrong - check the auth header |
| **403** | your fault | Forbidden - known, but not allowed | Your key lacks permission for this |
| **404** | your fault | Not found - wrong URL or id | Check base URL, endpoint, and the id |
| **429** | your fault | Too many requests - slow down | Wait, then retry; you hit a rate limit |
| **500** | their fault | Server error on their end | Not you - retry; if it persists, report it |

💡 **Key point - the first digit is the whole story.** You don't memorize the table; you read the first
digit: **2xx** = it worked, **4xx** = *you* sent something wrong (fixable by you), **5xx** = *their*
server broke (not your fault). That single digit tells you which direction to look before you read a word
of the body.

## Status code first, then the body

Every HTTP response leads with a **status code** - a three-digit number that's the server's one-word
verdict on your request. The body is the detail; the status is the headline. Read the headline first,
because a `401` body and a `200` body need completely different reactions, and the code tells you which
you're holding.

Where to see it:

- **Postman** shows it in bold right above the response panel: `200 OK`, with the response time next to
  it.
- **curl** *hides it by default* - it prints only the body. To see the status, ask for the response
  headers with `-i`:

```console
$ curl -i https://api.bookshelf.dev/v1/books/42 \
    -H "Authorization: Bearer sk_live_8Kd2x9..."
HTTP/2 200
content-type: application/json
content-length: 102

{"id":42,"title":"The Left Hand of Darkness","author":"Ursula K. Le Guin","genre":"scifi","year":1969}
```

`-i` ("include") told curl to print the **response headers** along with the body. The very first line,
`HTTP/2 200`, is the status - `200` means success - followed by the server's own headers (it's sending
back JSON, 102 bytes of it), a blank line, and then the body. Now you can read the verdict before the
data.

**A failure looks like this:**

```console
$ curl -i https://api.bookshelf.dev/v1/books/42 \
    -H "Authorization: Bearer wrong-token"
HTTP/2 401
content-type: application/json

{"error":"invalid_token","message":"The API key provided is not valid."}
```

The status line says `401` before you read anything else - so this is an auth problem, *your* side. The
body confirms it in plain words: the token isn't valid. Good APIs put a human-readable `message` in the
error body - read it, it usually names the fix. Here: check the token (see
[Phase 1, §4](01-how-to-read-api-docs.md)).

⚠️ **Gotcha.** A `200` doesn't always mean you got what you wanted - it means the *request* succeeded.
`GET /books?genre=banana` might return `200` with an empty list `[]` because "no banana books" is a
perfectly successful answer to a valid question. When the body is empty or surprising but the code is
`2xx`, the problem is in your *parameters*, not your auth or URL. Re-read the parameter table from
Phase 1.

## Tweak a parameter and re-send

The real rhythm of working with an API is rarely one perfect request. It's: send, read, adjust, send
again. This is where having the request already built pays off - you change *one* thing and fire again.

Say `GET /books` returned the default 20 books and you want 5 science-fiction ones, newest first. You
don't rebuild anything - you add the query parameters from Phase 1's table:

- **Postman:** in the **Params** tab, add rows `genre = scifi`, `limit = 5`, `sort = newest`. Watch
  Postman build the URL for you as you type, then **Send**.
- **curl:** add them to the URL after a `?`, joined by `&`:

```console
$ curl "https://api.bookshelf.dev/v1/books?genre=scifi&limit=5&sort=newest" \
    -H "Authorization: Bearer sk_live_8Kd2x9..."
```

The `?` begins the query string and `&` separates each parameter, exactly as the docs described. You
changed the *inputs*, not the endpoint or the auth - same call, narrower question.

⚠️ **Gotcha - quote the whole URL in curl.** Notice the URL is in double quotes here. The `&` character
means "run this in the background" to most shells, so an unquoted URL with `&` in it gets chopped in
half and curl receives only the first parameter. Quote any URL that has a `?` and `&` in it, and you'll
save yourself a baffling debugging session.

## Save your work: collections, variables, and environments

Once you've got a working request you'll want it tomorrow too. Postman's job here is to stop you
retyping - and, done right, to stop you leaking secrets.

📝 **Terminology.**
- A **collection** is a saved folder of requests - your "Bookshelf API" set, grouped together so you
  (and your team) can reopen and re-send them.
- A **variable** is a named placeholder you write as `{{name}}` in a request. Instead of pasting the
  base URL into every request, you write `{{baseUrl}}/books` and define `baseUrl` once.
- An **environment** is a set of variable *values* you can switch between - a "Staging" environment
  where `baseUrl` points at the test server, a "Production" one where it points at the real server.
  Flip the environment and every request retargets at once.

**Why this is worth it.** With variables, moving a whole collection from staging to production is one
dropdown change instead of editing every URL by hand. And the token becomes a variable too - 
`{{token}}` in the auth header, its value living in the environment - which sets up the safety move
below.

```text
   Collection: "Bookshelf API"
     ├─ GET  {{baseUrl}}/books
     ├─ GET  {{baseUrl}}/books/{{bookId}}
     └─ POST {{baseUrl}}/books

   Environment: "Staging"          Environment: "Production"
     baseUrl = https://api-staging…  baseUrl = https://api.bookshelf.dev/v1
     token   = sk_test_…             token   = sk_live_…   ← switch with one dropdown
```

## ⚠️ The secret-leak trap - do not ship your API key

This is the one mistake in this whole guide that can genuinely hurt you, so it gets its own section.

Your token is your account (Phase 1, §4). It is dangerously easy to leak it without noticing, in two
specific ways:

1. **Exporting a Postman collection with the token baked in.** If you typed your real token directly
   into a request's auth field and then **Export** the collection to a `.json` file - to share it,
   commit it to the repo, or attach it to a ticket - the secret travels *inside that file*, in plain
   text. Now it's in your git history, in someone's downloads, in a Slack thread.

2. **Pasting a curl command with the token in it.** Every annotated curl in this guide has the token
   right there in the `-H` flag. The instant you paste a *real* one into a bug report, a gist, a chat
   message, or a screenshot, you've published your password.

**The fix - keep the secret out of anything you share:**

- In **Postman**, store the token as an **environment variable** and reference it as `{{token}}` in the
  request. Mark the variable type **secret** so its value is masked, and keep it in your *personal*
  environment. Crucially, environment values are **not** included when you export the collection - so
  the shared file contains `{{token}}`, a harmless placeholder, and your real secret stays on your
  machine.
- In **curl** / scripts, read the token from an **environment variable** instead of typing it inline.
  Set it once in your shell, then reference it - the secret never appears in the command you might paste:

```console
$ export BOOKSHELF_TOKEN="sk_live_8Kd2x9..."
$ curl https://api.bookshelf.dev/v1/books/42 \
    -H "Authorization: Bearer $BOOKSHELF_TOKEN"
```

`export` put the token into a shell variable named `BOOKSHELF_TOKEN`. The curl command then refers to it
as `$BOOKSHELF_TOKEN`, so the line you'd copy-paste contains the *name*, not the secret. Same request, but
nothing sensitive to leak.

🪖 **War story.** Leaked keys get found *fast*. Bots continuously scan public code for things that look
like API keys, and a key committed to a public repo can be abused within minutes of the push. This is
exactly why good providers let you **revoke and rotate** a key from their dashboard - so the recovery
move, if you ever do leak one, is: revoke the old key immediately, issue a new one, and update your
environment variable. Knowing that escape hatch exists is half of staying calm about it.

💡 **Key point.** The rule is short: **the secret lives in a variable, never in the thing you share.**
`{{token}}` in the collection, `$TOKEN` in the script - the real value stays only on your machine.

## Recap

1. **Read the status code first.** The first digit tells you everything: 2xx worked, 4xx is your fault,
   5xx is theirs.
2. In **curl**, use `-i` to see the status and headers (it hides them by default); **Postman** shows the
   status above the response.
3. A **2xx with a surprising body** is a *parameter* problem, not an auth or URL problem.
4. **Iterate** by changing one input and re-sending - add query parameters in Postman's **Params** tab
   or after `?...&...` in curl (and **quote the URL** so `&` doesn't break it).
5. Save requests in **collections**, and use **variables** + **environments** to swap base URL and token
   without editing every request.
6. **Never share your secret.** Keep the token in a (secret) environment variable / `$TOKEN`, reference
   it as `{{token}}` / `$TOKEN`, and if one ever leaks: revoke, rotate, replace.

---

[← Phase 2: Making the Request (Postman & curl)](02-making-the-request.md) · [Guide overview](_guide.md)

### Related guides
- [HTTP & JSON API Basics](/guides/http-and-json-api-basics) - what a request, header, and JSON body actually are, if any of that felt shaky.
- [REST APIs Explained](/guides/rest-apis-explained) - why endpoints and methods are shaped the way they are, the next layer down.
