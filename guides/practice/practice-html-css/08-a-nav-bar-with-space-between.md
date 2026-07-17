---
title: "A nav bar with space between"
guide: practice-html-css
phase: 8
summary: "Brand left, links right, everything lined up. The one rule that does it hands out leftover width - so it does nothing at all when there is none left over."
tags: [css, flexbox, justify-content, align-items, nav, layout]
difficulty: intermediate
synonyms:
  - justify-content space-between not working
  - how to push nav links to the right
  - css nav bar brand left links right
  - flexbox space between does nothing
  - align-items center nav bar
  - build a site header with css
updated: 2026-07-17
---

# A nav bar with space between

Nearly every site header is the same shape: brand on the left, links on the
right, one rule doing the pushing. That rule is `justify-content: space-between`
- and it does not push anything apart. It measures the width *left over* in the
container after the items have been laid out, then hands all of it to the gaps
between them.

Left over is the whole idea. A flex container that is exactly as wide as its
contents has nothing left over, so `space-between` shares out zero, and every
item stays exactly where it already was. Nothing errors. The rule is spelled
right, it is on the right element, it is applying, and it is doing nothing. So
when it looks broken, the question is never "is my syntax wrong". It is "does
this box have any spare width to give away?"

Lining the row up is the other half of a bar. A 22px brand next to 15px links
will not line up by itself: by default flex items stretch to match the tallest
one, and text sits at the top of a stretched box. `align-items: center` puts
each item in the middle of the bar instead.

**Your task:** the header below is `display: inline-flex`, and an inline-level
box is only ever as wide as its contents - you can see it in the preview, where
the dark bar stops right after "Log in" instead of reaching the edge of the
page. Make it a real header: the bar spans the page, the brand stays left, the
three links sit hard against the right edge, and everything lines up down the
middle of the 64px bar. Use `justify-content: space-between` and
`align-items: center` - and give them some spare width to work with.

**You'll practice:**

- Reading `space-between` as "share out the width left over", not "push things apart"
- Lining a row of different-sized items up across a bar with `align-items: center`

```lesson
{
  "language": "html",
  "starterCode": "<style>\n  body { margin: 0; font-family: system-ui, sans-serif; }\n  a { text-decoration: none; }\n\n  .site-nav {\n    display: inline-flex;\n    height: 64px;\n    padding: 0 24px;\n    background: #12263f;\n  }\n\n  .brand { color: #fff; font-size: 22px; font-weight: 700; }\n  .links a { color: #b9c6d6; font-size: 15px; margin-left: 24px; }\n</style>\n\n<nav class=\"site-nav\">\n  <a class=\"brand\" href=\"/\">Northwind</a>\n  <div class=\"links\">\n    <a href=\"/docs\">Docs</a>\n    <a href=\"/pricing\">Pricing</a>\n    <a href=\"/login\">Log in</a>\n  </div>\n</nav>\n",
  "solution": "<style>\n  body { margin: 0; font-family: system-ui, sans-serif; }\n  a { text-decoration: none; }\n\n  .site-nav {\n    display: flex;\n    justify-content: space-between;\n    align-items: center;\n    height: 64px;\n    padding: 0 24px;\n    background: #12263f;\n  }\n\n  .brand { color: #fff; font-size: 22px; font-weight: 700; }\n  .links a { color: #b9c6d6; font-size: 15px; margin-left: 24px; }\n</style>\n\n<nav class=\"site-nav\">\n  <a class=\"brand\" href=\"/\">Northwind</a>\n  <div class=\"links\">\n    <a href=\"/docs\">Docs</a>\n    <a href=\"/pricing\">Pricing</a>\n    <a href=\"/login\">Log in</a>\n  </div>\n</nav>\n",
  "checks": [
    { "name": "all three links are still in the bar", "selector": ".links a", "count": true },
    { "name": "the brand sits left and the links sit hard against the right edge", "selector": "nav", "styles": ["display", "justify-content"] },
    { "name": "the brand and the links line up down the middle of the bar", "selector": "nav", "styles": ["align-items"] }
  ],
  "hints": [
    "Add the two declarations the task names to the .site-nav rule and press Run, then look closely. align-items: center works straight away, but nothing moves sideways. Both are spelled right, so the problem is not the CSS: the bar has spare height for one of them to use, and no spare width for the other. Ask how wide the dark bar actually is.",
    "The bar stops right after 'Log in' because of the first line of the .site-nav rule. display: inline-flex makes the nav an inline-level box, and an inline-level box is only as wide as its contents. Zero leftover width means space-between has zero to share out. A block-level flex container fills the width its parent offers it instead, which here is the whole page.",
    "Change display: inline-flex to display: flex, then add justify-content: space-between and align-items: center to that same .site-nav rule. The bar now fills the page, so there is finally spare width for space-between to hand to the gap between the brand and the links."
  ]
}
```
