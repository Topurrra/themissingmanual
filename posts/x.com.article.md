Title: What nobody tells you about the N+1 query problem

Your app was fast in dev. Then it shipped, and one screen started timing out. The bug is not in the code you wrote. It is in the code your ORM wrote for you, one row at a time.

This is the N+1 query problem, and it is the most common way a working backend quietly turns slow. Here is the mental model nobody hands you, and how to fix it without memorizing one library's API.

## Why this trips people up

Tutorials teach you the ORM syntax. They rarely teach you what the ORM actually does on the wire. Docs assume you already know that "lazy loading" is a database query. So you write the natural-looking loop and ship a time bomb.

The core idea is simple and easy to miss. When you fetch a list of objects and then touch a relation on each one, most ORMs run a fresh query for that relation every single time. Ten rows means eleven queries. A thousand rows means a thousand and one. Each query on its own is cheap. The round trips are not. Your laptop runs the ten-row version instantly, so you never feel it. Production, with real data, is where it bites you at 3am.

There is a second reason it hides so well. The code looks innocent. Accessing `order.customer` reads like a field, not like a network call. Nobody reviews it and thinks "database round trip." They think "property access." That is the trap.

## How it actually works

Say you have orders, and each order belongs to a customer. You want to list the order number and the customer name. The natural code looks like this:

    orders = Order.all()
    for order in orders:
        print(order.number, order.customer.name)

That `order.customer` access reads like a field. It is a query. `Order.all()` is query number one. Then every `order.customer.name` is another query. So for N orders you run N+1 queries, and most of them fetch a single row you could have joined.

On the wire, the loop above produces this:

    SELECT * FROM orders;                  -- query 1, the list
    SELECT * FROM customers WHERE id = 42; -- query 2, first row's customer
    SELECT * FROM customers WHERE id = 43; -- query 3, second row's customer
    -- ...and so on, one per row

The fix is eager loading: tell the ORM to fetch the relation up front, in the first query or one extra query, instead of one query per row. Every major ORM has it, under different names:

- Django: `Order.objects.select_related('customer')` (a JOIN, one query)
- Rails: `Order.includes(:customer)` (one extra query, not one per row)
- SQLAlchemy: `session.query(Order).options(joinedload(Order.customer))`
- Prisma: `prisma.order.findMany({ include: { customer: true } })`
- EF Core: `dbContext.Orders.Include(o => o.Customer)`

The naming changes. The idea is identical: load the relation eagerly, not lazily.

There are two flavors and the choice matters. A JOIN folds the relation into the first query, so you pay one round trip. Use it for one-to-one and many-to-one relations, where each parent has exactly one related row. A batched `WHERE id IN (...)` query runs one extra query that pulls all the related rows at once. Use it for collections, where a parent has many children, because a JOIN on a collection multiplies rows and ships the same parent over and over.

## What to do about it

1. Make the problem visible. Turn on query logging in dev and watch the count for a single request. If one page prints forty queries, you have an N+1, or several.
2. Eager load the relations you actually display. Use a JOIN (one query) for one-to-one and many-to-one relations. Use a batched `WHERE id IN (...)` query (one extra query) for collections, so you do not multiply rows.
3. Watch for the fix that makes a new problem. Joining a collection multiplies rows, so one parent can come back many times. ORMs dedupe in memory, but the database still ships the bloat over the wire. For collections, prefer the batched IN approach over a raw JOIN.
4. Measure before you optimize. An N+1 that runs twenty times a day is a smaller fire than one that runs inside a hot loop two hundred times a second. Fix the ones on the hot path first.

Be honest about the catch: eager loading is not free either. Pulling relations you never render is its own waste. Eager load what you show, not everything the model knows.

## A worked example

Before the fix, loading fifty orders with their customer names runs fifty-one queries. The first fetches the orders. The next fifty each fetch one customer by id. On a local database with empty tables that is instant. On a shared production database under load it is the request that times out.

After the fix, the same page runs one query with a JOIN:

    SELECT orders.*, customers.*
    FROM orders
    JOIN customers ON customers.id = orders.customer_id;

Same data on screen, one round trip instead of fifty-one. That is the whole win.

## Go deeper

The full, free walkthrough (no signup) is here:
https://themissingmanual.dev/guides/n-plus-one-queries?utm_source=x.com&utm_medium=social&utm_campaign=launch

And every guide page has a free AI Tutor you can ask follow-up questions, right there on the page. If your stack's eager-load syntax is not in the list above, ask it.

Stop writing loops that run a query per row. Your future self, the one on call, will thank you.
