---
title: "The CMS & Dynamic Content"
guide: webflow
phase: 2
summary: "How Webflow's CMS Collections store repeating content and feed one reusable template — so a blog or catalog builds itself from your entries instead of copy-pasted pages."
tags: [webflow, cms, collections, dynamic-content, blog]
difficulty: beginner
synonyms:
  - "how does webflow cms work"
  - "webflow collection template explained"
  - "build a blog in webflow"
  - "webflow dynamic content binding"
  - "webflow product catalog cms"
updated: 2026-06-30
---

# The CMS & Dynamic Content

Phase 1 was about designing pages by hand. That's fine for a homepage or an about page — things you build once and rarely change. But a blog has fifty posts. A catalog has two hundred products. A team page has thirty people. You are not going to design two hundred near-identical pages by hand, and you shouldn't have to. This is the problem the CMS solves.

CMS stands for Content Management System, but here's the plainer way to think about it: **a spreadsheet that fills in a page design for you.** You design the layout once. You keep your content in a list. Webflow stamps the design onto every row of the list automatically.

## Collections are spreadsheets

A **Collection** is a list of items that all share the same shape. A "Blog Posts" Collection. A "Products" Collection. A "Team Members" Collection. Each one is like a single spreadsheet table.

Every Collection has **fields** — the columns. You decide what columns exist when you create the Collection. For a blog:

```text
Collection: Blog Posts

| Title              | Author  | Date       | Featured image | Body            |
|--------------------|---------|------------|----------------|-----------------|
| Why we rebranded   | Maya    | 2026-03-01 | rebrand.jpg    | (rich text...)  |
| Our pricing change | Dev     | 2026-04-12 | pricing.jpg    | (rich text...)  |
| Hiring a designer  | Maya    | 2026-05-20 | designer.jpg   | (rich text...)  |
```

Each **row is an item** — one blog post. Webflow gives you field types that match the kind of content: plain text for a title, a date picker for the date, an image field for the photo, a rich-text field for the body (formatted paragraphs, headings, links). There's also a field type that links one Collection to another — so a post can point to its author in a separate "Authors" Collection. That keeps you from retyping "Maya, marketing lead" on every post she writes.

You add and edit these items in a list view that looks and feels like a spreadsheet or an admin table. No design happens here — it's pure content.

## The template page: design once, applies to all

When you create a Collection, Webflow gives you a matching **Collection Page** — one template page that will render *every* item in the list. You design it like any other page (boxes, padding, flex, classes — everything from Phase 1), but instead of typing in real text, you **bind** elements to fields.

Binding means: "this heading shows the item's Title. This image shows the item's Featured image. This block shows the item's Body." You're connecting a design element to a column, not to a specific value.

```text
Template page (you design once):
   [ Featured image field ]   ← bound to "Featured image"
   # Title field               ← bound to "Title"
   By Author · Date            ← bound to "Author", "Date"
   Body field                  ← bound to "Body"

Webflow then generates:
   /blog/why-we-rebranded      (filled from row 1)
   /blog/our-pricing-change    (filled from row 2)
   /blog/hiring-a-designer     (filled from row 3)
```

Write a new post in the spreadsheet view, hit publish, and a fully designed page appears at its own web address. You never touched the design again. Fix a typo in the template's byline style, and all fifty posts update together — the same "style once, reuse everywhere" idea from Phase 1, now applied to whole pages.

## Collection Lists: showing many items on one page

The template page shows *one* item. But your blog's main page needs to show *all* of them as a grid of cards. That's a **Collection List** — a special box you drop onto any page that repeats its contents once per item.

You design a single card inside the list — image, title, short excerpt, a "Read more" link — and bind each part to a field. Webflow repeats that card automatically, one per post. You can sort the list (newest first), filter it (only posts tagged "Product"), and limit how many show. Add a post to the Collection and it appears in the list with no extra work.

```text
You design ONE card:        Webflow repeats it:
┌──────────────┐            ┌──────┐ ┌──────┐ ┌──────┐
│ [image]      │     →      │ post │ │ post │ │ post │
│ Title        │            │  1   │ │  2   │ │  3   │
│ excerpt →    │            └──────┘ └──────┘ └──────┘
└──────────────┘            (one per item, auto-generated)
```

## A catalog works the same way

Swap "Blog Posts" for "Products" and nothing about the mechanics changes. Fields become Name, Price, Photo, Description, Category. The template page becomes your product detail page. The Collection List becomes your shop grid. Link a "Products" Collection to a "Categories" Collection and you can build a page per category that lists only its products. Same three pieces every time: a Collection (the data), a template page (one item), a Collection List (many items).

## The limits worth knowing now

The CMS is a genuine content database, not a spreadsheet you paste once. But there are real ceilings, and they're tied to your plan, so check current numbers before you commit:

- **Item caps.** Each plan allows a fixed number of CMS items across your Collections. A small blog won't notice; a catalog with thousands of SKUs might. Know your ceiling before you import.
- **It's not a relational database.** You can link Collections together, but deep, many-layered relationships and heavy querying aren't what it's built for. It shines at marketing content — posts, products, people, case studies — not complex app data.
- **Structure is easiest to set up front.** Adding a field later is fine, but reshaping a Collection after you've built and bound dozens of items is tedious. Spend ten minutes planning your fields before you create the Collection.

Get those three pieces — Collection, template, list — and you've covered ninety percent of what people use the CMS for. The rest is content, and content is the part only you can write.
