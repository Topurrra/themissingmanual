---
title: "Cross-Site Scripting (XSS)"
guide: "sql-injection-and-xss"
phase: 3
summary: "Untrusted input rendered straight into a page is read by the browser as HTML and JavaScript, so it runs in other users' browsers - stealing sessions, defacing pages. The fix is context-aware output encoding (ideally an auto-escaping template engine), with a Content-Security-Policy as defense-in-depth."
tags: [security, xss, cross-site-scripting, output-encoding, escaping, content-security-policy, csp]
difficulty: intermediate
synonyms: ["how does xss work", "how to prevent cross-site scripting", "what is output encoding", "what is html escaping", "what is a content security policy", "stored vs reflected xss", "why sanitize on output not input", "xss example"]
updated: 2026-06-19
---

# Cross-Site Scripting (XSS)

Same bug, second interpreter. In Phase 2 the interpreter was your database and the code was SQL. Here the
interpreter is **a visitor's web browser**, and the code is **HTML and JavaScript** - the stuff a browser
happily executes. Cross-Site Scripting is what happens when user input you meant as *text on a page* gets
read by the browser as *markup and script* instead.

There's a cruel twist that makes XSS feel different from SQL injection, even though it's the same disease:
with SQL injection the attacker hits *your* data. With XSS, the attacker's code runs in **other users'
browsers** - the script you accidentally served them executes with *their* logged-in session. The victim
isn't you; it's your user, trusting your site.

## How text on a page turns into running script

Take any page that shows something a user typed back to other people: a comment, a display name, a product
review, a search term echoed in "results for ___." If the app drops that input straight into the HTML by
concatenation - the exact Phase 1 shortcut - you have the hole.

```text
   page = "<p>Comment: " + input + "</p>"
           └──── your code ───┘ └in┘ └code┘
                                glued into HTML the browser will parse
```

Type a normal comment, `Nice article!`, and the browser renders exactly what you intended:

```html
<p>Comment: Nice article!</p>
```

*What just happened:* The browser parsed your `<p>` tags as markup and the comment as text inside them, and
showed the words. Fine - because the input behaved like the plain data you assumed.

Now an attacker leaves a "comment" that's actually a `<script>` tag:

```html
<p>Comment: <script>/* attacker's JavaScript runs here */</script></p>
```

*What just happened:* The browser doesn't know your `<p>` was intended and the `<script>` wasn't - it's all
one HTML string to the parser. It sees a real `<script>` element and **runs the JavaScript inside it**, in
the context of your page. And it doesn't run for the attacker; it runs for *every visitor who loads that
comment.* The boundary between "markup I wrote" and "text the user typed" existed only in your head - exactly
like the SQL case.

📝 **Terminology - stored vs. reflected XSS.** If the malicious input is saved and served to everyone who
views the page (like that comment), it's **stored XSS** - the worst kind, because it hits every visitor
automatically. If the input bounces straight back in a single response (a search term echoed into the
results page, reached via a crafted link), it's **reflected XSS** - it hits whoever follows the link. Same
root cause, same fix; they differ only in how the input reaches the page.

## What this actually costs your users

JavaScript running in your page can do anything *your own* JavaScript could do for that user. So an attacker's
injected script can:

- **Steal the session** - read cookies or tokens the page can access and send them to the attacker, who then
  logs in *as the victim*. No password needed.
- **Act as the victim** - make requests the user is authenticated for: change their email, post on their
  behalf, drain an account.
- **Deface or phish** - rewrite the page to show a fake login form and harvest credentials, since it's
  running on your real domain that the user trusts.

XSS appears in [The OWASP Top 10](/guides/owasp-top-10) under the **Injection** category - the same family
as SQL injection - for exactly the reason this guide has been building toward: it is the same bug, pointed at
the browser.

## The fix: context-aware output encoding

The cure is the Phase 1 sentence again - *keep data as data* - applied at the moment input gets written into
a page. You can't send HTML and values on separate channels the way a database lets you (the browser only
gets one stream: the HTML). So instead you **encode** the value: you transform the characters that *mean
something* to the HTML parser into harmless equivalents that *display* as those characters but can't act as
markup.

The key characters and their HTML-encoded forms:

```text
   <   becomes   &lt;
   >   becomes   &gt;
   &   becomes   &amp;
   "   becomes   &quot;
   '   becomes   &#x27;
```

📝 **Terminology - output encoding / escaping.** Converting characters so an interpreter treats them as data,
not syntax. "Encoding" and "escaping" are used interchangeably here. HTML-encoding `<` to `&lt;` means the
browser *shows* a less-than sign instead of *starting a tag*.

Now the attacker's comment, encoded on the way into the page:

```html
<p>Comment: &lt;script&gt;/* attacker's JavaScript */&lt;/script&gt;</p>
```

*What just happened:* The `<` and `>` arrived as `&lt;` and `&gt;`, so the browser had no real `<script>`
element to run - it just *displayed the text* `<script>...</script>` on the page, literally, as a harmless
(if weird-looking) comment. The input never became code, because the characters that would have made it code
arrived as data. Nothing was blocked or stripped; it was kept as data.

⚠️ **Gotcha - encode on OUTPUT, in the right CONTEXT, and treat all input as hostile.** Two traps here:

- **Output, not input.** Encode at the moment you *render* the value into a page, not when you *receive and
  store* it. The same stored value might be shown in HTML on one page, inside a JavaScript string on another,
  or in a URL on a third - and each needs *different* encoding. Encode once on input and you've guessed wrong
  for some of those contexts (and mangled the stored data). Encode on output and you encode correctly for
  *where it's actually going.*
- **Context matters.** HTML-encoding is right for text between tags. But a value placed inside an HTML
  attribute, inside a `<script>` block, inside a URL, or inside CSS each has *its own* dangerous characters
  and *its own* encoding rules. "Context-aware" means using the encoding that matches the spot the value
  lands in. Putting user input directly inside a `<script>` tag or an `onclick=` handler is especially
  dangerous - avoid it; pass data into JavaScript through a properly-encoded data attribute or a JSON
  endpoint instead.

And the mindset that ties it together: **treat every piece of input as hostile** - every form field, URL
parameter, header, and value read back out of your own database (stored XSS means your database is now a
delivery mechanism). "Where did this come from?" is the wrong question. "Am I encoding it correctly for where
it's going?" is the right one.

## Let your templates do it: auto-escaping

The reassuring part: you should almost never be hand-encoding character by character. Modern template
engines **auto-escape** by default. When you write `{{ comment }}` in a template (React's JSX, Jinja,
Django templates, Handlebars, Razor, and most others), the engine HTML-encodes that value for you before it
hits the page. Use your framework's normal templating and the common path is safe - the same happy pattern as
ORMs in Phase 2: the default way is the safe way.

The danger, again, is the escape hatch. Every engine has a "render this as raw HTML, don't escape it" feature
for the rare case you truly need it - React's `dangerouslySetInnerHTML`, the `|safe` filter, `v-html`,
`innerHTML`. The name `dangerouslySetInnerHTML` is a warning, and you should hear it: the instant you hand
raw, unescaped user input to one of these, you've reopened the hole the auto-escaping was closing.

```text
   template {{ value }}        →  auto-escaped for you      ✅ safe
   raw-HTML escape hatch       →  YOUR responsibility       ⚠️ never feed it raw user input
```

If you genuinely must allow *some* user-supplied HTML - say a rich-text comment with bold and links - don't
hand-roll it. Run the input through a well-maintained, allowlist-based **HTML sanitizer** library (such as
DOMPurify) that permits a known-safe set of tags and strips everything else. Hand-written "strip the bad
tags" filters are blocklists, and you already know how those end.

## Defense-in-depth: a Content-Security-Policy

Encoding is the fix. A **Content-Security-Policy (CSP)** is the seatbelt you wear in case a bug slips through
anyway - a second wall, not a replacement for the first.

📝 **Terminology - Content-Security-Policy (CSP).** An HTTP response header where you tell the browser which
sources of script, style, and other content it's allowed to load and run for your page. The browser enforces
it. A well-tuned policy can refuse to run inline scripts and scripts from origins you didn't approve - so
even if an attacker manages to inject a `<script>`, the browser declines to execute it.

```text
   Content-Security-Policy: default-src 'self'
                            └ only load/run resources from my own origin;
                              block inline scripts and third-party script by default
```

The honest framing: a strict CSP can turn a successful injection into a non-event, which is why it's worth
deploying. But CSP is genuinely fiddly to get right without breaking your own site, and a loose policy gives
little protection. So treat it as it's meant to be treated - **defense-in-depth layered on top of correct
output encoding**, never an excuse to skip the encoding.

💡 **Key point.** XSS is closed at the **output** boundary: encode every untrusted value for the **context**
it's rendered into - and let an auto-escaping template engine do it for you on the normal path. Add a
Content-Security-Policy as a backstop. Same instinct as Phase 2: keep data as data so it can never be run as
code.

## Why this saves you later

Lean on your framework's auto-escaping templates and the everyday path is safe without effort - you only have
to stay alert at the rare escape hatches, where the framework is explicitly warning you. Add a CSP and even a
missed spot may fail harmlessly. You've stopped trying to anticipate every clever payload and instead made
the page structurally unable to run your users' input as script. That's the whole guide in one habit, applied
to the browser.

## Recap

1. XSS happens when **untrusted input rendered into a page** is read by the browser as **HTML/JavaScript** and
   runs - in *other users'* browsers, with *their* session.
2. **Stored XSS** is served to every viewer (worst); **reflected XSS** bounces back via a crafted request.
   Same cause, same fix.
3. The damage lands on your users: **session/token theft, acting as the victim, defacement and phishing.**
   It's part of the OWASP **Injection** family.
4. **The fix is context-aware output encoding:** transform markup characters into harmless equivalents at the
   moment you render, using the encoding that matches the context (HTML, attribute, script, URL).
5. **Encode on OUTPUT, not input; treat all input as hostile** - including values from your own database.
   Let an **auto-escaping template engine** do it by default, and never feed user input to the raw-HTML
   escape hatch (sanitize with an allowlist library if you must allow some HTML).
6. **Add a Content-Security-Policy as defense-in-depth** - a backstop if a bug slips through, never a
   substitute for encoding.

That's both holes closed, and both with the same move you learned in Phase 1: keep data as data. For the
wider landscape of web risks beyond these two, head to [The OWASP Top 10](/guides/owasp-top-10).

Watch it animated: [cross-site scripting](/explainers/XSS.dc.html)

---

[← Phase 2: SQL Injection](02-sql-injection.md) · [Guide overview](_guide.md)
