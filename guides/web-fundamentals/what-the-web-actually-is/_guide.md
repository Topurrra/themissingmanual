---
title: "What the Web Actually Is"
guide: "what-the-web-actually-is"
phase: 0
summary: "The web isn't magic - it's two programs talking. This guide builds the mental model everything else in Web Fundamentals depends on: browsers and servers, URLs and DNS, and the three languages (HTML, CSS, JS) that make a page."
tags: [web, browser, server, http, dns, html, css, javascript, beginner-friendly]
category: web-fundamentals
order: 1
difficulty: beginner
synonyms: ["how does the web work", "what happens when you load a website", "what is a browser", "what is a server", "difference between html css and javascript"]
updated: 2026-07-06
---

# What the Web Actually Is

You type a web address, hit enter, and a page appears. That feels instant and a little magical, and
it hides a real, mechanical process: one program asking another program for something, over a network,
in a format both sides agree on. Nothing about it is mysterious once you've seen it happen slowly.

This guide is the slow version. It's the first guide in Web Fundamentals because everything else -
HTML, CSS, the DOM, forms, accessibility - assumes you already know what a browser and a server
actually are, and where each of the three web languages fits. Skip this and later guides will keep
saying "the browser does X" without ever having introduced you to what a browser is doing that for.

## The phases

1. **[The Client-Server Model](01-the-client-server-model.md)** - what a browser and a server actually
   are as programs, the request/response cycle, and watching a real request happen in DevTools.
2. **[URLs, DNS, and HTTP, Together](02-urls-dns-and-http-together.md)** - taking a URL apart, how a
   hostname becomes an IP address, and what a raw HTTP request/response looks like.
3. **[HTML, CSS, and JavaScript: Three Jobs, Three Languages](03-html-css-and-javascript-three-jobs-three-languages.md)** -
   structure, presentation, and behavior, shown on one page so you know exactly what each language is
   for before you go learn it.

No prior web knowledge assumed. If you can open a browser, you're ready.
