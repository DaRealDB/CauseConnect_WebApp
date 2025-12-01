/**
 * Simple Health Check Edge Function
 * No database connection required
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { handleCors, addCorsHeaders } from '../_shared/cors.ts'

serve(async (req: Request) => {
  // Handle CORS
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'Edge Functions are running',
    environment: Deno.env.get('ENVIRONMENT') || 'production',
  }

  return addCorsHeaders(
    new Response(JSON.stringify(health), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  )
})
