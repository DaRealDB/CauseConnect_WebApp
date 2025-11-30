/**
 * Generic Storage Upload Edge Function
 * POST /functions/v1/storage-upload
 * Body: FormData with file and metadata
 * Headers: X-Bucket-Name (required), X-File-Path? (optional)
 * 
 * Uploads files to Supabase Storage buckets
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { handleCors, addCorsHeaders } from '../_shared/cors.ts'
import { getUserFromRequest } from '../_shared/supabase.ts'
import { handleError, AppError } from '../_shared/errors.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.44.0'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

serve(async (req: Request) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    const { user, error: authError } = await getUserFromRequest(req)
    if (authError || !user) {
      throw new AppError('Unauthorized', 401)
    }

    if (req.method !== 'POST') {
      throw new AppError('Method not allowed', 405)
    }

    // Get bucket name from header
    const bucketName = req.headers.get('X-Bucket-Name')
    if (!bucketName) {
      throw new AppError('X-Bucket-Name header is required', 400)
    }

    // Parse form data
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      throw new AppError('File is required', 400)
    }

    // Get optional custom path
    const customPath = req.headers.get('X-File-Path') || null

    // Generate file path
    const fileExt = file.name.split('.').pop()
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 15)
    const fileName = customPath || `${user.id}/${timestamp}-${randomStr}.${fileExt}`
    const filePath = `${fileName}`

    // Upload to Supabase Storage
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      throw new AppError(`Upload failed: ${uploadError.message}`, 400)
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(filePath)

    const response = {
      url: urlData.publicUrl,
      path: filePath,
      bucket: bucketName,
      size: file.size,
      type: file.type,
      name: file.name,
    }

    return addCorsHeaders(
      new Response(JSON.stringify(response), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      })
    )
  } catch (error) {
    return addCorsHeaders(handleError(error))
  }
})


