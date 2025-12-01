/**
 * Get User Settings Edge Function
 * GET /functions/v1/settings-get
 * Returns user settings with defaults
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { handleCors, addCorsHeaders } from '../_shared/cors.ts'
import { getUserFromRequest } from '../_shared/supabase.ts'
import { handleError, AppError } from '../_shared/errors.ts'
import { queryOne } from '../_shared/db.ts'

serve(async (req: Request) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    const { user, error: authError } = await getUserFromRequest(req)
    if (authError || !user) {
      throw new AppError('Unauthorized', 401)
    }

    // Get or create user settings
    let settings = await queryOne(
      `SELECT * FROM user_settings WHERE "userId" = $1`,
      [user.id]
    )

    // Create default settings if not exists
    if (!settings) {
      // Insert default settings
      const pool = await import('../_shared/db.ts').then(m => m.getDatabasePool())
      const client = await pool.connect()
      
      try {
        await client.queryObject(
          `INSERT INTO user_settings ("userId") VALUES ($1) RETURNING *`,
          [user.id]
        )
        
        // Fetch the created settings
        settings = await queryOne(
          `SELECT * FROM user_settings WHERE "userId" = $1`,
          [user.id]
        )
      } finally {
        client.release()
      }
    }

    // Format response with defaults
    const response = {
      notifications: {
        donations: settings?.notificationsDonations ?? true,
        comments: settings?.notificationsComments ?? true,
        awards: settings?.notificationsAwards ?? false,
        mentions: settings?.notificationsMentions ?? true,
        newCauses: settings?.notificationsNewCauses ?? true,
        email: settings?.notificationsEmail ?? true,
        sms: settings?.notificationsSMS ?? false,
      },
      privacy: {
        activityVisibility: settings?.activityVisibility || 'friends',
        twoFactorEnabled: settings?.twoFactorEnabled || false,
      },
      personalization: {
        language: settings?.language || 'en',
        region: settings?.region || 'us',
        currency: settings?.currency || 'USD',
        theme: settings?.theme || 'system',
        interestTags: settings?.interestTags || [],
      },
      accessibility: {
        highContrast: settings?.highContrast || false,
        screenReader: settings?.screenReader || false,
        textSize: settings?.textSize || 'medium',
      },
      volunteering: {
        availableForVolunteering: settings?.availableForVolunteering || false,
        preferredVolunteerActivities: settings?.preferredVolunteerActivities || [],
      },
      community: {
        autoJoinSquadEvents: settings?.autoJoinSquadEvents || false,
        rsvpReminders: settings?.rsvpReminders ?? true,
        allowAwards: settings?.allowAwards ?? true,
        showFeedbackButtons: settings?.showFeedbackButtons ?? true,
      },
    }

    return addCorsHeaders(
      new Response(JSON.stringify(response), {
        headers: { 'Content-Type': 'application/json' },
      })
    )
  } catch (error) {
    return addCorsHeaders(handleError(error))
  }
})




