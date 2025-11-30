/**
 * Health Check Edge Function
 * Verifies database connection and basic functionality
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { handleCors, addCorsHeaders } from '../_shared/cors.ts'
import { getDatabasePool } from '../_shared/db.ts'

serve(async (req: Request) => {
  // Handle CORS
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    // Check database connection
    const pool = getDatabasePool()
    const client = await pool.connect()

    let dbStatus = 'ok'
    try {
      await client.queryObject('SELECT 1')
    } catch (error) {
      dbStatus = 'error'
      console.error('Database health check failed:', error)
    } finally {
      client.release()
    }

    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: dbStatus,
      environment: Deno.env.get('ENVIRONMENT') || 'development',
    }

    return addCorsHeaders(
      new Response(JSON.stringify(health), {
        status: dbStatus === 'ok' ? 200 : 503,
        headers: { 'Content-Type': 'application/json' },
      })
    )
  } catch (error) {
    console.error('Health check error:', error)
    return addCorsHeaders(
      new Response(
        JSON.stringify({
          status: 'error',
          timestamp: new Date().toISOString(),
          error: 'Health check failed',
        }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    )
  }
})


