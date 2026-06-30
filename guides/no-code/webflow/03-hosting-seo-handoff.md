---
title: "Hosting, SEO & Handoff"
guide: webflow
phase: 3
summary: "The unglamorous decisive part of shipping a Webflow site: publishing and domains, the SEO and speed controls that actually matter, export limits, and handing editing to a non-technical client."
tags: [webflow, hosting, seo, performance, client-handoff]
difficulty: beginner
synonyms:
  - "how to publish a webflow site"
  - "webflow custom domain setup"
  - "webflow seo settings"
  - "can you export a webflow site"
  - "let a client edit webflow"
updated: 2026-06-30
---

# Hosting, SEO & Handoff

A site nobody can reach is a design file. This phase is about the part that turns your work into a real website on the internet - and then the part where you walk away and let someone else run it. None of this is glamorous. All of it decides whether the project succeeds.

## Publishing: the two-address model

Webflow gives every project a free staging address, something like `your-site.webflow.io`. Hitting **Publish** pushes your latest work live to that address in seconds. This is your testing ground - share it, click around, catch mistakes - before anything touches your real domain.

When you're ready for the world, you connect a **custom domain** like `yourcompany.com`. This requires a paid hosting plan, and the connection happens at your domain registrar (where you bought the domain - GoDaddy, Namecheap, Google Domains, and so on). Webflow shows you a few DNS records to copy over. It's a copy-paste job, but DNS changes can take a few hours to take effect, so don't schedule a launch for five minutes after you click connect.

A point that trips people up: Webflow is the **host**. Unlike WordPress, you don't shop for separate hosting, install anything, or manage a server. The hosting plan and the platform are one purchase. SSL (the padlock and `https://`) is included and automatic - you don't buy or configure a certificate.

```text
your-site.webflow.io   ← free staging, for testing
        │  Publish
        ▼
yourcompany.com        ← paid plan + DNS at your registrar, live to the public
```

## SEO: the controls that move the needle

SEO is how search engines understand and rank your pages. Webflow gives you the levers that matter; you supply the judgment. Per page, set:

- **Title tag** - the clickable blue headline in Google results. Make it specific and front-load the important words.
- **Meta description** - the gray summary under it. Doesn't directly affect ranking, but a good one earns clicks.
- **Slug** - the page's address, like `/pricing`. Keep it short and readable.
- **Open Graph image and text** - the preview card when someone shares your link on social or in chat. Set this or your link looks broken when shared.

There's also `alt` text on every image - a short description of what the image shows. It helps screen readers (accessibility) and image search both. Fill it in; it's a thirty-second habit that pays off twice.

For Collection pages, you set these fields **once on the template**, often by binding the title tag to the item's Title field - so all fifty blog posts get sensible SEO automatically. Webflow also generates a `sitemap.xml` (a map of your pages for search engines) and lets you control `robots.txt` (which pages crawlers may visit) from the site settings.

The honest caveat: these controls let you do SEO right, but they don't *do* SEO for you. Rankings come from useful content, real links, and time. Webflow removes the technical excuses; it doesn't replace the work.

## Performance: mostly handled, partly on you

Site speed affects both rankings and whether visitors stay. Webflow does a lot for you here - clean output, a global CDN so your site loads fast worldwide, and image handling that serves appropriately sized images and modern formats.

What's left is on you, and it's almost always images. A 4 MB photo straight off a camera will drag any page down. Resize and compress images before you upload, lean on Webflow's responsive image features, and don't stack ten heavy third-party embeds (chat widgets, trackers, video players) on one page. Speed problems are usually weight problems, and weight is usually pictures.

## Export and the lock-in question

Webflow lets you **export** your site's code - the HTML, CSS, JavaScript, and images - on the appropriate paid plan. Useful if you want to host elsewhere or hand raw files to a developer. But read the catch carefully:

> The exported site is **static**. The CMS does not come with it.

Your designed pages export fine. The dynamic machinery from Phase 2 - Collections, the spreadsheet editor, pages that generate from data, forms that collect submissions - only runs on Webflow's hosting. Export a blog and you get a frozen snapshot, not a working blog you can keep adding to elsewhere. So the realistic answer to "am I locked in?": your design is portable, your CMS-driven content management is not. For most marketing sites people stay on Webflow hosting and never export, which is the path the platform is built for.

## Handoff: let the client edit without breaking things

Here's the scenario that decides whether a build was worth it: you finish a client's site, and three weeks later they need to fix a typo or add a blog post. You do **not** want them in the Designer, where one stray drag can wreck a layout.

Webflow's answer is the **Editor** - a separate, stripped-down mode (now often called the **content editing** experience) that the client logs into. They can click text on the live page and retype it, swap an image, and add or edit CMS items (write a new blog post, update a price). They cannot move boxes, change styles, or alter the structure. Content stays editable; design stays locked.

When you hand off, do three things:

1. **Invite them as an editor**, not a designer - match the access to the job.
2. **Show them the two things they'll actually do**: edit text inline, and add a CMS item. Five minutes of screen-share beats a manual nobody reads.
3. **Set the expectation**: anything beyond text and content - a new section, a layout change - comes back to you. That's a feature, not a limitation. It's what keeps the site looking the way you built it.

That's the whole arc. You learned the canvas, made content build itself, and put it online in a way the owner can run without you hovering. The site is theirs now - and it won't fall apart the first time someone fixes a typo.
