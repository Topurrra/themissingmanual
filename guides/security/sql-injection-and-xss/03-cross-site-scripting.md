---
title: "Cross-Site Scripting (XSS)"
guide: "sql-injection-and-xss"
phase: 3
summary: "Untrusted input rendered straight into a page is read by the browser as HTML and JavaScript, so it runs in other users' browsers - stealing sessions, defacing pages. The fix is context-aware output encoding (ideally an auto-escaping template engine), with a Content-Security-Policy as defense-in-depth."
tags: [security, xss, cross-site-scripting, output-encoding, escaping, content-security-policy, csp]
difficulty: intermediate
synonyms: ["how does xss work", "how to prevent cross-site scripting", "what is output encoding", "what is html escaping", "what is a content security policy", "stored vs reflected xss", "why sanitize on output not input", "xss example"]
updated: 2026-07-10
---

# Cross-Site Scripting (XSS)

Same bug, second interpreter. In Phase 2 the interpreter was your database and the code was SQL. Here the
interpreter is **a visitor's web browser**, and the code is **HTML and JavaScript**. Cross-Site Scripting is
what happens when input meant as *text on a page* gets read by the browser as *markup and script* instead.

The cruel twist: with SQL injection the attacker hits *your* data. With XSS, the attacker's code runs in
**other users' browsers** - the script you accidentally served executes with *their* logged-in session. The
victim isn't you; it's your user, trusting your site.

## How text on a page turns into running script

Take any page that echoes user input back to other people: a comment, a display name, a search term in
"results for ___." Drop that input straight into the HTML by concatenation - the exact Phase 1 shortcut -
and you have the hole.

```text
   page = "<p>Comment: " + input + "</p>"
           └──── your code ───┘ └in┘ └code┘
                                glued into HTML the browser will parse
```

Type a normal comment, `Nice article!`, and the browser renders exactly what you intended:

```html
<p>Comment: Nice article!</p>
```

*What just happened:* The browser parsed `<p>` as markup and the comment as text inside it - fine, because
the input behaved like plain data.

Now an attacker leaves a "comment" that's actually a `<script>` tag:

```html
<p>Comment: <script>/* attacker's JavaScript runs here */</script></p>
```

*What just happened:* The browser doesn't know your `<p>` was intended and the `<script>` wasn't - it's all
one HTML string to the parser. It sees a real `<script>` element and **runs the JavaScript inside it**, for
*every visitor who loads that comment*. The boundary between "markup I wrote" and "text the user typed"
existed only in your head, exactly like the SQL case.

📝 **Terminology - stored vs. reflected XSS.** Input saved and served to everyone who views the page (like
that comment) is **stored XSS** - the worst kind, hitting every visitor automatically. Input that bounces
straight back in a single response (a search term echoed into results, reached via a crafted link) is
**reflected XSS** - it hits whoever follows the link. Same root cause, same fix.

## What this actually costs your users

JavaScript running in your page can do anything *your own* JavaScript could do for that user:

- **Steal the session** - read cookies/tokens the page can access and send them to the attacker, who then
  logs in *as the victim*. No password needed.
- **Act as the victim** - change their email, post on their behalf, drain an account.
- **Deface or phish** - show a fake login form and harvest credentials, running on your real, trusted domain.

XSS appears in [The OWASP Top 10](/guides/owasp-top-10) under the same **Injection** category as SQL
injection - because it's the same bug, pointed at the browser.

## The fix: context-aware output encoding

The cure is the Phase 1 sentence again - *keep data as data* - applied at the moment input gets written into
a page. A browser only gets one stream (the HTML), so unlike a database you can't send code and values
separately. Instead you **encode** the value: transform characters that *mean something* to the HTML parser
into harmless equivalents that *display* as those characters but can't act as markup.

```text
   <   becomes   &lt;
   >   becomes   &gt;
   &   becomes   &amp;
   "   becomes   &quot;
   '   becomes   &#x27;
```

📝 **Terminology - output encoding / escaping.** Converting characters so an interpreter treats them as data,
not syntax. HTML-encoding `<` to `&lt;` means the browser *shows* a less-than sign instead of *starting a
tag*.

The attacker's comment, encoded on the way into the page:

```html
<p>Comment: &lt;script&gt;/* attacker's JavaScript */&lt;/script&gt;</p>
```

*What just happened:* `<` and `>` arrived as `&lt;` and `&gt;`, so the browser had no real `<script>` element
to run - it just *displayed* the text, literally, as a harmless (if weird-looking) comment. The input never
became code, because the characters that would have made it code arrived as data.

⚠️ **Gotcha - encode on OUTPUT, in the right CONTEXT, and treat all input as hostile.** Two traps:

- **Output, not input.** Encode when you *render* the value, not when you *receive and store* it. The same
  stored value might land in HTML on one page, a JavaScript string on another, or a URL on a third - each
  needs *different* encoding. Encode once on input and you've guessed wrong for some of those contexts.
- **Context matters.** HTML-encoding suits text between tags, but a value inside an HTML attribute, a
  `<script>` block, a URL, or CSS each has its *own* dangerous characters and encoding rules. Putting user
  input directly inside a `<script>` tag or an `onclick=` handler is especially dangerous - pass data into
  JavaScript through a properly-encoded data attribute or a JSON endpoint instead.

Treat every piece of input as hostile - every form field, URL parameter, header, and value read back out of
your own database (stored XSS means your database is now a delivery mechanism). "Where did this come from?"
is the wrong question; "am I encoding it for where it's going?" is the right one.

## Let your templates do it: auto-escaping

You should almost never hand-encode character by character. Modern template engines **auto-escape** by
default - write `{{ comment }}` (React's JSX, Jinja, Django templates, Handlebars, Razor) and the engine
HTML-encodes the value before it hits the page. The common path is safe, the same pattern as ORMs in Phase 2.

The danger is the escape hatch. Every engine has a "render this as raw HTML, don't escape it" feature for the
rare case you truly need it - React's `dangerouslySetInnerHTML`, the `|safe` filter, `v-html`, `innerHTML`.
The name `dangerouslySetInnerHTML` is a warning: hand raw, unescaped user input to one of these and you've
reopened the hole auto-escaping was closing.

```text
   template {{ value }}        →  auto-escaped for you      ✅ safe
   raw-HTML escape hatch       →  YOUR responsibility       ⚠️ never feed it raw user input
```

If you genuinely must allow *some* user-supplied HTML - a rich-text comment with bold and links - don't
hand-roll it. Run the input through a well-maintained, allowlist-based **HTML sanitizer** library (such as
DOMPurify) that permits a known-safe set of tags and strips everything else. Hand-written "strip the bad
tags" filters are blocklists, and you already know how those end.

## Defense-in-depth: a Content-Security-Policy

Encoding is the fix. A **Content-Security-Policy (CSP)** is the seatbelt you wear in case a bug slips through
anyway - a second wall, not a replacement for the first.

📝 **Terminology - Content-Security-Policy (CSP).** An HTTP response header telling the browser which sources
of script, style, and other content it's allowed to load and run for your page. The browser enforces it. A
well-tuned policy can refuse inline scripts and scripts from origins you didn't approve - so even if an
attacker injects a `<script>`, the browser declines to execute it.

```text
   Content-Security-Policy: default-src 'self'
                            └ only load/run resources from my own origin;
                              block inline scripts and third-party script by default
```

A strict CSP can turn a successful injection into a non-event, which is why it's worth deploying. But it's
genuinely fiddly to get right without breaking your own site, and a loose policy gives little protection.
Treat it as **defense-in-depth layered on top of correct output encoding**, never an excuse to skip encoding.

💡 **Key point.** XSS is closed at the **output** boundary: encode every untrusted value for the **context**
it's rendered into, and let an auto-escaping template engine do it for you. Add a CSP as a backstop. Same
instinct as Phase 2: keep data as data so it can never be run as code.

## Recap

1. XSS happens when **untrusted input rendered into a page** is read by the browser as **HTML/JavaScript**
   and runs - in *other users'* browsers, with *their* session.
2. **Stored XSS** hits every viewer (worst); **reflected XSS** bounces back via a crafted request. Same
   cause, same fix.
3. The damage lands on your users: **session/token theft, acting as the victim, defacement and phishing** -
   part of the OWASP **Injection** family.
4. **The fix is context-aware output encoding:** transform markup characters into harmless equivalents at
   render time, matching the context (HTML, attribute, script, URL).
5. **Encode on OUTPUT, not input; treat all input as hostile** - including values from your own database. Let
   an **auto-escaping template engine** do it by default, and never feed the raw-HTML escape hatch user input
   (sanitize with an allowlist library if you must allow some HTML).
6. **Add a Content-Security-Policy as defense-in-depth** - a backstop, never a substitute for encoding.

Both holes closed, same move from Phase 1: keep data as data. For the wider landscape of web risks beyond
these two, head to [The OWASP Top 10](/guides/owasp-top-10).

Watch it animated: [cross-site scripting](/explainers/XSS.dc.html)

---

[← Phase 2: SQL Injection](02-sql-injection.md) · [Guide overview](_guide.md)
