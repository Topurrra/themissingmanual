// Checked guides/databases/sql-vs-nosql (all 3 phases) for a genuine JSONB /
// document-hybrid mention, since that's the closest existing guide topic to
// this module's JSONB/array/UUID/upsert lessons. It doesn't mention JSONB,
// arrays, gen_random_uuid, ON CONFLICT, or any document-hybrid angle at all -
// confirmed with a grep across the whole guides/databases tree, not just this
// one guide (JSONB|jsonb|gen_random_uuid|ON CONFLICT|upsert|UUID primary
// key|array column|TEXT\[\], zero hits). No genuine match anywhere yet, so
// this map stays empty rather than forcing a loose link - same convention as
// sql.js's own unmapped lessons. Add entries here once a guide phase actually
// covers one of these Postgres-specific features.
export const RELATED = {};
