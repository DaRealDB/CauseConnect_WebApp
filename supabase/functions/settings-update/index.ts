/**
 * Update User Settings Edge Function
 * PUT /functions/v1/settings-update
 * Updates user settings
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { handleCors, addCorsHeaders } from '../_shared/cors.ts'
import { getUserFromRequest } from '../_shared/supabase.ts'
import { handleError, AppError } from '../_shared/errors.ts'
import { query, queryOne } from '../_shared/db.ts'

serve(async (req: Request) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    const { user, error: authError } = await getUserFromRequest(req)
    if (authError || !user) {
      throw new AppError('Unauthorized', 401)
    }

    if (req.method !== 'PUT') {
      throw new AppError('Method not allowed', 405)
    }

    const body = await req.json()
    const { notifications, privacy, personalization, community, volunteering } = body

    // Get existing settings to preserve interestTags if not provided
    const existingSettings = await queryOne(
      `SELECT "interestTags" FROM user_settings WHERE "userId" = $1`,
      [user.id]
    )
    const existingTags = existingSettings?.interestTags || []

    // Build update query dynamically
    const updates: string[] = []
    const params: any[] = []
    let paramIndex = 1

    if (notifications) {
      if (notifications.donations !== undefined) {
        updates.push(`"notificationsDonations" = $${paramIndex}`)
        params.push(notifications.donations)
        paramIndex++
      }
      if (notifications.comments !== undefined) {
        updates.push(`"notificationsComments" = $${paramIndex}`)
        params.push(notifications.comments)
        paramIndex++
      }
      if (notifications.awards !== undefined) {
        updates.push(`"notificationsAwards" = $${paramIndex}`)
        params.push(notifications.awards)
        paramIndex++
      }
      if (notifications.mentions !== undefined) {
        updates.push(`"notificationsMentions" = $${paramIndex}`)
        params.push(notifications.mentions)
        paramIndex++
      }
      if (notifications.newCauses !== undefined) {
        updates.push(`"notificationsNewCauses" = $${paramIndex}`)
        params.push(notifications.newCauses)
        paramIndex++
      }
      if (notifications.email !== undefined) {
        updates.push(`"notificationsEmail" = $${paramIndex}`)
        params.push(notifications.email)
        paramIndex++
      }
      if (notifications.sms !== undefined) {
        updates.push(`"notificationsSMS" = $${paramIndex}`)
        params.push(notifications.sms)
        paramIndex++
      }
    }

    if (privacy) {
      if (privacy.activityVisibility !== undefined) {
        updates.push(`"activityVisibility" = $${paramIndex}`)
        params.push(privacy.activityVisibility)
        paramIndex++
      }
      if (privacy.twoFactor !== undefined) {
        updates.push(`"twoFactorEnabled" = $${paramIndex}`)
        params.push(privacy.twoFactor)
        paramIndex++
      }
    }

    if (personalization) {
      if (personalization.language !== undefined) {
        updates.push(`language = $${paramIndex}`)
        params.push(personalization.language)
        paramIndex++
      }
      if (personalization.region !== undefined) {
        updates.push(`region = $${paramIndex}`)
        params.push(personalization.region)
        paramIndex++
      }
      if (personalization.currency !== undefined) {
        updates.push(`currency = $${paramIndex}`)
        params.push(personalization.currency)
        paramIndex++
      }
      if (personalization.theme !== undefined) {
        updates.push(`theme = $${paramIndex}`)
        params.push(personalization.theme)
        paramIndex++
      }
      if (personalization.interestTags !== undefined) {
        // Only update if tags are provided and not empty, or if explicitly clearing
        const providedTags = personalization.interestTags
        if (Array.isArray(providedTags) && providedTags.length > 0) {
          updates.push(`"interestTags" = $${paramIndex}`)
          params.push(providedTags)
          paramIndex++
        } else if (Array.isArray(providedTags) && providedTags.length === 0 && existingTags.length === 0) {
          // Clear tags only if no existing tags
          updates.push(`"interestTags" = $${paramIndex}`)
          params.push([])
          paramIndex++
        }
        // Otherwise preserve existing tags
      }
      if (personalization.accessibility?.highContrast !== undefined) {
        updates.push(`"highContrast" = $${paramIndex}`)
        params.push(personalization.accessibility.highContrast)
        paramIndex++
      }
      if (personalization.accessibility?.screenReader !== undefined) {
        updates.push(`"screenReader" = $${paramIndex}`)
        params.push(personalization.accessibility.screenReader)
        paramIndex++
      }
      if (personalization.accessibility?.textSize !== undefined) {
        updates.push(`"textSize" = $${paramIndex}`)
        params.push(personalization.accessibility.textSize)
        paramIndex++
      }
    }

    if (community) {
      if (community.autoJoinSquadEvents !== undefined) {
        updates.push(`"autoJoinSquadEvents" = $${paramIndex}`)
        params.push(community.autoJoinSquadEvents)
        paramIndex++
      }
      if (community.rsvpReminders !== undefined) {
        updates.push(`"rsvpReminders" = $${paramIndex}`)
        params.push(community.rsvpReminders)
        paramIndex++
      }
      if (community.allowAwards !== undefined) {
        updates.push(`"allowAwards" = $${paramIndex}`)
        params.push(community.allowAwards)
        paramIndex++
      }
      if (community.showFeedbackButtons !== undefined) {
        updates.push(`"showFeedbackButtons" = $${paramIndex}`)
        params.push(community.showFeedbackButtons)
        paramIndex++
      }
    }

    if (volunteering) {
      if (volunteering.availableForVolunteering !== undefined) {
        updates.push(`"availableForVolunteering" = $${paramIndex}`)
        params.push(volunteering.availableForVolunteering)
        paramIndex++
      }
      if (volunteering.preferredActivities !== undefined) {
        updates.push(`"preferredVolunteerActivities" = $${paramIndex}`)
        params.push(volunteering.preferredActivities)
        paramIndex++
      }
    }

    // Always update updatedAt
    updates.push(`"updatedAt" = NOW()`)

    if (updates.length === 1) {
      // Only updatedAt - no changes
      return addCorsHeaders(
        new Response(JSON.stringify({ success: true, message: 'No changes to update' }), {
          headers: { 'Content-Type': 'application/json' },
        })
      )
    }

    // Upsert settings
    params.push(user.id) // For WHERE clause

    const updateQuery = `
      INSERT INTO user_settings ("userId", ${updates.filter(u => !u.includes('updatedAt')).map((_, i) => {
        // Extract column names
        const match = updates[i]?.match(/"?([a-zA-Z_]+)"?\s*=/)
        return match ? match[1] : null
      }).filter(Boolean).join(', "')}", "updatedAt")
      VALUES ($${paramIndex}, ${Array.from({ length: updates.length - 1 }, (_, i) => `$${i + 1}`).join(', ')}, NOW())
      ON CONFLICT ("userId") DO UPDATE SET
        ${updates.join(', ')}
    `

    // Simplified approach - use upsert with all fields
    await query(
      `INSERT INTO user_settings (
        "userId",
        "notificationsDonations", "notificationsComments", "notificationsAwards",
        "notificationsMentions", "notificationsNewCauses", "notificationsEmail", "notificationsSMS",
        "activityVisibility", "twoFactorEnabled",
        language, region, currency, theme, "interestTags",
        "highContrast", "screenReader", "textSize",
        "autoJoinSquadEvents", "rsvpReminders", "allowAwards", "showFeedbackButtons",
        "availableForVolunteering", "preferredVolunteerActivities",
        "createdAt", "updatedAt"
      )
      VALUES (
        $1,
        $2, $3, $4, $5, $6, $7, $8,
        $9, $10,
        $11, $12, $13, $14, $15,
        $16, $17, $18,
        $19, $20, $21, $22,
        $23, $24,
        NOW(), NOW()
      )
      ON CONFLICT ("userId") DO UPDATE SET
        "notificationsDonations" = COALESCE($2, user_settings."notificationsDonations"),
        "notificationsComments" = COALESCE($3, user_settings."notificationsComments"),
        "notificationsAwards" = COALESCE($4, user_settings."notificationsAwards"),
        "notificationsMentions" = COALESCE($5, user_settings."notificationsMentions"),
        "notificationsNewCauses" = COALESCE($6, user_settings."notificationsNewCauses"),
        "notificationsEmail" = COALESCE($7, user_settings."notificationsEmail"),
        "notificationsSMS" = COALESCE($8, user_settings."notificationsSMS"),
        "activityVisibility" = COALESCE($9, user_settings."activityVisibility"),
        "twoFactorEnabled" = COALESCE($10, user_settings."twoFactorEnabled"),
        language = COALESCE($11, user_settings.language),
        region = COALESCE($12, user_settings.region),
        currency = COALESCE($13, user_settings.currency),
        theme = COALESCE($14, user_settings.theme),
        "interestTags" = CASE 
          WHEN $15 IS NOT NULL AND array_length($15::text[], 1) > 0 THEN $15
          ELSE user_settings."interestTags"
        END,
        "highContrast" = COALESCE($16, user_settings."highContrast"),
        "screenReader" = COALESCE($17, user_settings."screenReader"),
        "textSize" = COALESCE($18, user_settings."textSize"),
        "autoJoinSquadEvents" = COALESCE($19, user_settings."autoJoinSquadEvents"),
        "rsvpReminders" = COALESCE($20, user_settings."rsvpReminders"),
        "allowAwards" = COALESCE($21, user_settings."allowAwards"),
        "showFeedbackButtons" = COALESCE($22, user_settings."showFeedbackButtons"),
        "availableForVolunteering" = COALESCE($23, user_settings."availableForVolunteering"),
        "preferredVolunteerActivities" = COALESCE($24, user_settings."preferredVolunteerActivities"),
        "updatedAt" = NOW()
      `,
      [
        user.id,
        notifications?.donations ?? null,
        notifications?.comments ?? null,
        notifications?.awards ?? null,
        notifications?.mentions ?? null,
        notifications?.newCauses ?? null,
        notifications?.email ?? null,
        notifications?.sms ?? null,
        privacy?.activityVisibility ?? null,
        privacy?.twoFactor ?? null,
        personalization?.language ?? null,
        personalization?.region ?? null,
        personalization?.currency ?? null,
        personalization?.theme ?? null,
        personalization?.interestTags && personalization.interestTags.length > 0 
          ? personalization.interestTags 
          : null,
        personalization?.accessibility?.highContrast ?? null,
        personalization?.accessibility?.screenReader ?? null,
        personalization?.accessibility?.textSize ?? null,
        community?.autoJoinSquadEvents ?? null,
        community?.rsvpReminders ?? null,
        community?.allowAwards ?? null,
        community?.showFeedbackButtons ?? null,
        volunteering?.availableForVolunteering ?? null,
        volunteering?.preferredActivities ?? null,
      ]
    )

    return addCorsHeaders(
      new Response(JSON.stringify({ success: true, message: 'Settings updated successfully' }), {
        headers: { 'Content-Type': 'application/json' },
      })
    )
  } catch (error) {
    return addCorsHeaders(handleError(error))
  }
})


