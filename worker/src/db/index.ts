import type { D1Database } from '@cloudflare/workers-types';

export interface Env {
  DB: D1Database;
}

export async function query<T>(
  db: D1Database,
  sql: string,
  ...params: (string | number | null | undefined)[]
): Promise<T[]> {
  const stmt = db.prepare(sql);
  const result = params.length > 0 ? stmt.bind(...params) : stmt;
  const { results } = await result.all();
  return (results ?? []) as T[];
}

export async function queryOne<T>(
  db: D1Database,
  sql: string,
  ...params: (string | number | null | undefined)[]
): Promise<T | null> {
  const rows = await query<T>(db, sql, ...params);
  return rows[0] ?? null;
}

export async function execute(
  db: D1Database,
  sql: string,
  ...params: (string | number | null | undefined)[]
): Promise<{ changes: number; lastInsertRowid: number }> {
  const stmt = db.prepare(sql);
  const result = params.length > 0 ? stmt.bind(...params) : stmt;
  const info = await result.run();
  return {
    changes: (info.meta as { changes?: number }).changes ?? 0,
    lastInsertRowid: Number((info.meta as { last_row_id?: number }).last_row_id ?? 0),
  };
}
