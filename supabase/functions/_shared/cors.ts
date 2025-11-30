/**
 * CORS helper for Supabase Edge Functions
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
}

export function handleCors(request: Request): Response | null {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
    })
  }
  return null
}

export function addCorsHeaders(response: Response): Response {
  const newResponse = new Response(response.body, response)
  Object.entries(corsHeaders).forEach(([key, value]) => {
    newResponse.headers.set(key, value)
  })
  return newResponse
}


