import { Pool, types, type QueryResultRow } from "pg";

// Return timestamp/timestamptz columns as ISO strings. The app's types model these as
// `string` and some UI does string ops (e.g. `created_at.split("T")`), matching the JSON
// strings Supabase used to return. Reuse pg's default Date parser then serialize; the
// `instanceof Date` guard keeps this idempotent across dev hot-reloads.
function parseAsIsoString(oid: number) {
  const base = types.getTypeParser(oid) as (value: string) => unknown;
  types.setTypeParser(oid, (value: string) => {
    const parsed = base(value);
    return parsed instanceof Date ? parsed.toISOString() : parsed;
  });
}
parseAsIsoString(types.builtins.TIMESTAMPTZ);
parseAsIsoString(types.builtins.TIMESTAMP);

// Reuse a single pool across hot reloads in dev so we don't exhaust connections.
const globalForPg = globalThis as unknown as { pgPool?: Pool };

export const pool =
  globalForPg.pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPg.pgPool = pool;
}

/**
 * Run a parameterized SQL query and return the rows.
 * Server-only — never import this from a client component.
 */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const result = await pool.query<T>(text, params as unknown[]);
  return result.rows;
}
