/**
 * Database client helper for Edge Functions
 * Uses PostgreSQL connection pool
 */

import { Pool } from 'https://deno.land/x/postgres@v0.17.0/mod.ts'

let pool: Pool | null = null

export function getDatabasePool(): Pool {
  if (!pool) {
    const databaseUrl = Deno.env.get('DATABASE_URL')
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is required')
    }

    pool = new Pool(databaseUrl, 10, true)
  }

  return pool
}

export async function query(
  sql: string,
  params?: any[]
): Promise<any[]> {
  const pool = getDatabasePool()
  const client = await pool.connect()

  try {
    const result = await client.queryObject(sql, params)
    return result.rows as any[]
  } finally {
    client.release()
  }
}

export async function queryOne(
  sql: string,
  params?: any[]
): Promise<any | null> {
  const results = await query(sql, params)
  return results[0] ?? null
}




