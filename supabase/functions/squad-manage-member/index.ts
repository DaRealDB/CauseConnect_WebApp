/**
 * Manage Squad Member Edge Function
 * DELETE /functions/v1/squad-manage-member (remove member)
 * PATCH /functions/v1/squad-manage-member (change role)
 * Body: { squadId: string, memberId: string, role?: 'admin' | 'moderator' | 'member' }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { handleCors, addCorsHeaders } from '../_shared/cors.ts'
import { getUserFromRequest } from '../_shared/supabase.ts'
import { handleError, AppError } from '../_shared/errors.ts'
import { queryOne, query } from '../_shared/db.ts'

serve(async (req: Request) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    const { user, error: authError } = await getUserFromRequest(req)
    if (authError || !user) {
      throw new AppError('Unauthorized', 401)
    }

    const body = await req.json().catch(() => ({}))
    const { squadId, memberId, role } = body

    if (!squadId || !memberId) {
      throw new AppError('Squad ID and Member ID are required', 400)
    }

    // Verify user is admin
    const adminCheck = await queryOne(
      `SELECT role FROM squad_members WHERE "squadId" = $1 AND "userId" = $2`,
      [squadId, user.id]
    )

    if (!adminCheck || adminCheck.role !== 'admin') {
      throw new AppError('Only squad admins can manage members', 403)
    }

    // Check if trying to remove/change self
    if (memberId === user.id) {
      throw new AppError('Cannot manage your own role. Transfer admin first.', 400)
    }

    // Verify member exists
    const member = await queryOne(
      `SELECT role FROM squad_members WHERE "squadId" = $1 AND "userId" = $2`,
      [squadId, memberId]
    )

    if (!member) {
      throw new AppError('Member not found', 404)
    }

    if (req.method === 'DELETE') {
      // Remove member
      await query(
        `DELETE FROM squad_members WHERE "squadId" = $1 AND "userId" = $2`,
        [squadId, memberId]
      )

      return addCorsHeaders(
        new Response(JSON.stringify({ message: 'Member removed successfully' }), {
          headers: { 'Content-Type': 'application/json' },
        })
      )
    } else if (req.method === 'PATCH') {
      // Change role
      if (!role || !['admin', 'moderator', 'member'].includes(role)) {
        throw new AppError('Valid role is required (admin, moderator, member)', 400)
      }

      await query(
        `UPDATE squad_members SET role = $1 WHERE "squadId" = $2 AND "userId" = $3`,
        [role, squadId, memberId]
      )

      return addCorsHeaders(
        new Response(JSON.stringify({ message: 'Member role updated successfully', role }), {
          headers: { 'Content-Type': 'application/json' },
        })
      )
    } else {
      throw new AppError('Method not allowed', 405)
    }
  } catch (error) {
    return addCorsHeaders(handleError(error))
  }
})



