---
title: "The Data Model & Relationships"
guide: power-bi-from-zero
phase: 4
summary: "Why Power BI wants several small, related tables instead of one wide spreadsheet, and how relationships and cardinality make that model behave correctly when you build a report."
tags: [power-bi, data-model, relationships, star-schema, cardinality, cross-filter-direction]
difficulty: intermediate
synonyms:
  - power bi data model explained
  - power bi relationships
  - power bi cardinality one to many
  - star schema in power bi
  - power bi cross filter direction
  - why is my power bi total wrong
  - power bi many to many relationship
  - how does power bi model relationships
updated: 2026-07-14
---

# The Data Model & Relationships

You just spent Phase 3 shaping data in Power Query - cleaning columns, splitting fields, fixing types. It's tempting to load one big clean table into Power BI and call it done. That instinct is wrong, and understanding why is the single biggest jump in skill this guide asks of you. Get this phase right and DAX (Phase 5) will feel like common sense. Skip it and you'll spend months fighting numbers that are silently wrong.

## The mental model: a model is several small tables, not one big one

**What it actually is.** A Power BI data model is a set of tables connected by relationships, not one flat spreadsheet. You'll typically have one table that records *events* - a sale, an order, a shift, a click - with one row per event, and several smaller tables that describe the *things involved* in those events: customers, products, dates, stores. The event table is called a **fact table**. The description tables are called **dimension tables**. This is a **star schema** - the same pattern covered end to end in [Star Schema, Explained](/guides/star-schema-explained), just wearing a Power BI costume. If you haven't read that guide, the short version: one fact table in the middle, dimension tables around it like points of a star, joined by keys.

**Why this exists.** A flat spreadsheet with "Customer Name," "Customer City," "Product Name," "Product Category," and "Sale Amount" all in one row per sale looks simpler, but it repeats "New York" and "Electronics" on every single row that mentions them. That repetition isn't just wasteful - it's actively dangerous the moment you try to count something. "How many customers do we have?" against a flat table means counting distinct names across millions of repeated rows, which is slow and error-prone the instant a name is spelled two different ways. Split the customer into its own table with one row per customer, and "how many customers" becomes "how many rows in that table." Counting becomes correct *by construction*, not by careful filtering.

**Why people get this wrong.** Excel trained you to want one sheet with everything in it, because Excel has no real concept of relationships between sheets - VLOOKUP is you doing the join by hand, every time. Power BI has relationships built into the engine, so the instinct to flatten everything into one table is actively working against the tool. Let go of the flat-sheet habit; it's the single most common reason new Power BI users get numbers that don't add up.

## Fact tables and dimension tables, concretely

Say you're modeling coffee shop sales. A flat version might look like this:

```text
date       | customer   | city     | product   | category  | qty | amount
2026-07-01 | J. Osei    | Accra    | Latte     | Beverage  | 2   | 9.00
2026-07-01 | J. Osei    | Accra    | Croissant | Bakery    | 1   | 3.50
2026-07-02 | M. Chen    | Nairobi  | Latte     | Beverage  | 1   | 4.50
```

Split into a star, that becomes four tables:

```text
Sales (fact)                          Customer (dimension)
date       | cust_id | prod_id | qty | amount    cust_id | name    | city
2026-07-01 | 101     | 501     | 2   | 9.00      101     | J. Osei | Accra
2026-07-01 | 101     | 502     | 1   | 3.50      102     | M. Chen | Nairobi
2026-07-02 | 102     | 501     | 1   | 4.50

Product (dimension)                   Date (dimension)
prod_id | name      | category         date       | month   | quarter | year
501     | Latte     | Beverage         2026-07-01 | July    | Q3      | 2026
502     | Croissant | Bakery           2026-07-02 | July    | Q3      | 2026
```

*What just happened:* `Sales` keeps only the numbers that change every row - quantity, amount - plus IDs pointing at the tables that describe *who*, *what*, and *when*. "City" lives in `Customer` exactly once per customer, not once per sale. If a customer moves city, you fix one row, not thousands.

📝 **Terminology.** The column a relationship joins on is a **key** - `cust_id`, `prod_id`, `date`. On the dimension side it's usually unique per row (the **one** side). On the fact side it repeats once per transaction (the **many** side). That "one row describes many events" shape is exactly what a relationship encodes.

## Building the relationship

Power BI's **Model view** (the third icon down the left rail, after Report and Data) is where you see your tables as boxes and draw lines between them. Drag `cust_id` from `Sales` onto `cust_id` in `Customer` and Power BI draws a line with a `1` at the `Customer` end and a `*` at the `Sales` end.

```text
Customer (1) ──────< (*) Sales
Product  (1) ──────< (*) Sales
Date     (1) ──────< (*) Sales
```

*What just happened:* that `1` to `*` line is Power BI's version of a foreign key join, except it's not run per query like a SQL join - it's a standing relationship the engine uses every time a visual asks for data. Put "City" on a chart's axis and "Amount" as a value, and Power BI silently walks the relationship from `Customer` to `Sales`, filters `Sales` down to the rows for that city, and sums `Amount`. You never write the join. You just build the model once, correctly, and every visual afterward gets it for free.

## Cardinality: what kind of relationship is this

**What it actually is.** Cardinality describes how many rows on each side of a relationship can match. Power BI shows three kinds:

| Cardinality | Meaning | Example |
|---|---|---|
| One-to-many (1:*) | One dimension row matches many fact rows | One customer, many sales |
| One-to-one (1:1) | Exactly one row matches exactly one row on both sides | A customer and their loyalty-card record |
| Many-to-many (*:*) | Many rows on each side can match many on the other | Products and the promotions that can apply to several products each |

**Why this matters.** One-to-many is the normal, healthy shape of a star schema, and it's what Power BI expects by default. Many-to-many is real (it comes up more than beginners expect - shared bank accounts, students in multiple classes, products in overlapping promotions) but it changes how filters propagate and is easy to build by accident when a "dimension" table actually has duplicate keys. If Power BI reports a relationship as many-to-many and you expected one-to-many, that's a signal your dimension table isn't as unique as you thought - go check for duplicate keys before you trust anything downstream.

## Cross-filter direction: which way filtering flows

**What it actually is.** Every relationship has a cross-filter direction: **single** (the default for the one-to-many relationships a star schema is built from) means filtering flows only from the "one" side to the "many" side - filter `Customer` by city, and `Sales` filters down accordingly, but filtering `Sales` does *not* filter `Customer` back. **Both** lets filtering flow in both directions.

**Why this exists.** Single direction matches how a star schema is meant to be queried: dimensions filter facts, not the other way around, and that keeps the model predictable. "Both" can look convenient - it makes a relationship "just work" in more scenarios - but it can also silently create ambiguous filter paths once you have more than a couple of tables connected, where Power BI can't tell which route a filter should take and either refuses the relationship or gives you a number that's technically correct but not what you meant.

**Rule of thumb.** Leave cross-filter direction as single unless you hit a specific, understood case that needs "both" - don't flip it defensively because a number looks wrong. A wrong number is almost never fixed by loosening the model; it's fixed by finding the actual mistake (often a missing relationship or the wrong table granularity).

## A dedicated Date table, always

Power BI can auto-generate hidden date hierarchies from any date column, but build your own `Date` table anyway and relate it to every fact table's date column. Time intelligence (Phase 7 - things like "sales this month vs. last month") depends on DAX functions that expect a proper, continuous, marked-as-a-date-table `Date` dimension. Skipping this now means redoing your whole model later.

## Recap

1. A Power BI model is several small related tables, not one flat sheet - fact tables hold events and numbers, dimension tables hold the descriptive detail, in the same star-schema shape as [Star Schema, Explained](/guides/star-schema-explained).
2. Relationships join tables on a key, usually one dimension row (**1**) to many fact rows (**\***) - build them once in Model view and every visual reuses them, no manual joins.
3. Cardinality (1:*, 1:1, *:*) describes how rows match on each side; an unexpected many-to-many usually means duplicate keys in what you thought was a clean dimension.
4. Cross-filter direction controls which way filtering flows - leave it single unless you have a specific, understood reason for both.
5. Build a real `Date` table and relate it everywhere dates live; time intelligence in Phase 7 depends on it.

### Check yourself

```quiz
[
  {
    "q": "You've flattened all your sales data into one wide table, repeating customer and product details on every row. What's the real problem this causes, beyond extra storage?",
    "choices": [
      "Counting distinct things like customers becomes unreliable, because you're counting rows in a table where each customer appears many times",
      "Power BI simply refuses to load flat tables past a few thousand rows",
      "DAX functions won't run at all against a flat table",
      "Relationships become mandatory instead of optional"
    ],
    "answer": 0,
    "explain": "A flat table repeats descriptive values on every row, so 'how many customers' means counting distinct names across repeats instead of counting rows in a table built for that purpose - slow and error-prone the moment a name is spelled two ways."
  },
  {
    "q": "Power BI reports a relationship you expected to be one-to-many as many-to-many instead. What does that most likely mean?",
    "choices": [
      "The table you assumed was a clean dimension actually has duplicate keys, so it isn't as unique as you thought",
      "Nothing meaningful - many-to-many is just Power BI's default label for any new relationship",
      "The fact table doesn't have enough rows yet",
      "You need to switch the cross-filter direction to both to fix it"
    ],
    "answer": 0,
    "explain": "A one-to-many relationship requires uniqueness on the 'one' side; if Power BI sees repeats there, it reports many-to-many - that's a signal to go check for duplicate keys, not something to filter your way around."
  },
  {
    "q": "A relationship's cross-filter direction is left on the default, single, instead of switched to both. What does single actually do?",
    "choices": [
      "Filtering flows from the dimension side to the fact side only, which matches how a star schema is meant to be queried",
      "It leaves the relationship inactive until both is turned on",
      "It only applies to one-to-one relationships",
      "It's a temporary setting Power BI auto-upgrades to both as the model grows"
    ],
    "answer": 0,
    "explain": "Single direction means filtering a dimension (like Customer) filters the fact table down, but filtering the fact table doesn't filter the dimension back - the predictable shape a star schema depends on."
  }
]
```

---

[← Phase 3: Shaping Data with Power Query](03-shaping-data-with-power-query.md) · [Phase 5: DAX From Intuition →](05-dax-from-intuition.md)
