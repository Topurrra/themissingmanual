// Hand-picked against guides/databases content (not guessed from titles):
// lessons 1-3 (SELECT columns, WHERE, ORDER BY/LIMIT) map onto
// querying-basics-select-where's two phases, which cover exactly that ground.
// Lessons 7-8 (JOIN, capstone join+group+aggregate) map onto sql-joins-explained.
// ponytail: lessons 4-6 (aggregates, GROUP BY, HAVING) have no matching guide
// phase yet in guides/databases - omitted rather than forced. Add entries here
// once a GROUP BY/aggregate guide phase exists.
// Lesson 11 (NULLs/COALESCE) maps onto querying-basics-select-where#2, whose
// "NULL trap" section teaches the exact gotcha the lesson calls out (NULL
// isn't equal to anything, so = / != both silently misbehave on it).
// Lesson 12 (transactions) maps onto transactions-and-acid#1, which is
// literally "what a transaction is", built around the same money-transfer
// example.
// ponytail: lessons 9-10 (subqueries, window functions) have no matching guide
// phase in guides/databases - there's no dedicated subqueries or
// window-functions phase there yet, so omitted rather than forced. Add
// entries here once one exists. Lesson 13 (advanced capstone) also has no
// single-phase match - it combines several already-mapped concepts.
// Round 6 additions:
// Lesson 14 (many-to-many junction table) maps onto
// relationships-and-keys#3, which builds the exact students/courses/
// enrollments junction-table example this lesson reuses.
// Lesson 18 (ALTER TABLE) maps onto database-migrations#2, whose "Expand"
// step is a literal ALTER TABLE ... ADD COLUMN walkthrough.
// ponytail: lessons 15-17 (CTE, CASE, UNION) and 19 (self-join) have no
// matching guide phase in guides/databases - checked (grep for "CASE WHEN",
// "UNION", CTE/WITH, and "self-join"/"manager_id" across guides/databases
// turned up nothing beyond the ALTER TABLE hit already mapped above), so
// omitted rather than forced. Add entries here once matching phases exist.
export const RELATED = {
  1: 'querying-basics-select-where#1',
  2: 'querying-basics-select-where#2',
  3: 'querying-basics-select-where#2',
  7: 'sql-joins-explained#1',
  8: 'sql-joins-explained#2',
  11: 'querying-basics-select-where#2',
  12: 'transactions-and-acid#1',
  14: 'relationships-and-keys#3',
  18: 'database-migrations#2'
};
