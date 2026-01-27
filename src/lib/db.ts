import { Pool, QueryResultRow } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL belum disetel.");
}

export const pool = new Pool({ connectionString });

export async function query<R extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: ReadonlyArray<unknown>
): Promise<R[]> {
  const client = await pool.connect();
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await client.query<R>(text, params as unknown as any[]);
    return result.rows as R[];
  } finally {
    client.release();
  }
}
