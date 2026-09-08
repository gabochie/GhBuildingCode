-- D1 migration 0002: sequence placeholder.
-- There is no schema change in 0002. Migration 0003 (Clerk users) rebuilds the
-- `users` table; this placeholder exists solely so the 0001 -> 0003 numbering is
-- contiguous and `wrangler d1 migrations apply` can advance the sequence.
SELECT 1;