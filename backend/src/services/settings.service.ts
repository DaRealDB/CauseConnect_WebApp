import prisma from '../config/database'

export const settingsService = {
  async getSettings(userId: string) {
    console.log(`[Settings] getSettings called for userId: ${userId}`)
    
    // Query ALL fields (no select) to get complete record with latest data
    let settings = await prisma.userSettings.findUnique({
      where: { userId },
    })

    if (!settings) {
      console.log(`[Settings] No settings found for userId ${userId}, creating new record`)
      settings = await prisma.userSettings.create({
        data: { userId },
      })
      console.log(`[Settings] Created new settings record with interestTags:`, settings.interestTags)
    } else {
      console.log(`[Settings] Found existing settings record for userId ${userId}`)
    }

    // CRITICAL: Use raw SQL query to directly check database value
    // This bypasses Prisma and gets the actual PostgreSQL array value
    let rawTags: string[] | null = null
    try {
      const rawQuery = await prisma.$queryRaw<Array<{ interestTags: string[] | null }>>`
        SELECT "interestTags" 
        FROM "user_settings" 
        WHERE "userId" = ${userId}
      `
      rawTags = rawQuery[0]?.interestTags || null
      console.log(`[Settings] Raw SQL query result:`, rawTags)
      console.log(`[Settings] Raw SQL query - is array:`, Array.isArray(rawTags))
      console.log(`[Settings] Raw SQL query - type:`, typeof rawTags)
      console.log(`[Settings] Raw SQL query - length:`, Array.isArray(rawTags) ? rawTags.length : 'N/A')
      console.log(`[Settings] Raw SQL query - JSON:`, JSON.stringify(rawTags))
    } catch (error) {
      console.error(`[Settings] Raw SQL query failed:`, error)
    }

    // CRITICAL: Query tags directly from database to ensure we get latest data
    const tagsQuery = await prisma.userSettings.findUnique({
      where: { userId },
      select: { interestTags: true },
    })
    console.log(`[Settings] Direct tags query result:`, tagsQuery?.interestTags)
    console.log(`[Settings] Direct tags query - is array:`, Array.isArray(tagsQuery?.interestTags))
    console.log(`[Settings] Direct tags query - JSON:`, JSON.stringify(tagsQuery?.interestTags))

    // PRIORITY: Use raw SQL result first (most accurate), then Prisma query, then settings object
    const interestTagsValue = rawTags && Array.isArray(rawTags)
      ? rawTags
      : (tagsQuery?.interestTags ?? settings.interestTags)
    
    // Log detailed information about what we got from DB
    console.log(`[Settings] User ${userId} - Raw interestTags from DB:`, interestTagsValue)
    console.log(`[Settings] interestTags type:`, typeof interestTagsValue)
    console.log(`[Settings] interestTags is array:`, Array.isArray(interestTagsValue))
    console.log(`[Settings] interestTags value:`, JSON.stringify(interestTagsValue))
    console.log(`[Settings] interestTags length:`, Array.isArray(interestTagsValue) ? interestTagsValue.length : 'N/A')
    
    // Normalize interestTags - ensure it's always an array
    let normalizedTags: string[] = []
    if (Array.isArray(interestTagsValue)) {
      normalizedTags = interestTagsValue // Keep as-is if it's already an array
    } else if (interestTagsValue !== null && interestTagsValue !== undefined) {
      // If it's a single value, convert to array
      normalizedTags = [String(interestTagsValue)]
    } else {
      // If null/undefined, use empty array
      normalizedTags = []
    }
    
    console.log(`[Settings] Final normalized tags being returned:`, normalizedTags)
    console.log(`[Settings] Tags count:`, normalizedTags.length)

    return {
      notifications: {
        donations: settings.notificationsDonations,
        comments: settings.notificationsComments,
        awards: settings.notificationsAwards,
        mentions: settings.notificationsMentions,
        newCauses: settings.notificationsNewCauses,
        email: settings.notificationsEmail,
        sms: settings.notificationsSMS,
      },
      privacy: {
        activityVisibility: settings.activityVisibility,
        twoFactor: settings.twoFactorEnabled,
      },
      personalization: {
        language: settings.language,
        region: settings.region,
        currency: settings.currency || 'USD',
        theme: settings.theme,
        interestTags: normalizedTags, // Use normalized tags
        accessibility: {
          highContrast: settings.highContrast,
          screenReader: settings.screenReader,
          textSize: settings.textSize,
        },
      },
    }
  },

  async updateSettings(userId: string, data: any) {
    const { notifications, privacy, personalization } = data
    
    // CRITICAL: Get existing tags first to preserve them if not provided
    const existingSettings = await prisma.userSettings.findUnique({
      where: { userId },
      select: { interestTags: true },
    })
    const existingTags = existingSettings?.interestTags || []
    
    console.log(`[UpdateSettings] Called for userId: ${userId}`)
    console.log(`[UpdateSettings] Existing tags:`, existingTags)
    console.log(`[UpdateSettings] Provided personalization.interestTags:`, personalization?.interestTags)
    
    const settings = await prisma.userSettings.upsert({
      where: { userId },
      create: {
        userId,
        notificationsDonations: notifications?.donations ?? true,
        notificationsComments: notifications?.comments ?? true,
        notificationsAwards: notifications?.awards ?? false,
        notificationsMentions: notifications?.mentions ?? true,
        notificationsNewCauses: notifications?.newCauses ?? true,
        notificationsEmail: notifications?.email ?? true,
        notificationsSMS: notifications?.sms ?? false,
        activityVisibility: privacy?.activityVisibility ?? 'friends',
        twoFactorEnabled: privacy?.twoFactor ?? false,
        language: personalization?.language ?? 'en',
        region: personalization?.region ?? 'us',
        currency: personalization?.currency ?? 'USD',
        theme: personalization?.theme ?? 'system',
        // Use provided tags if available, otherwise empty array for new record
        interestTags: personalization?.interestTags ?? [],
        highContrast: personalization?.accessibility?.highContrast ?? false,
        screenReader: personalization?.accessibility?.screenReader ?? false,
        textSize: personalization?.accessibility?.textSize ?? 'medium',
      },
      update: {
        ...(notifications && {
          notificationsDonations: notifications.donations,
          notificationsComments: notifications.comments,
          notificationsAwards: notifications.awards,
          notificationsMentions: notifications.mentions,
          notificationsNewCauses: notifications.newCauses,
          notificationsEmail: notifications.email,
          notificationsSMS: notifications.sms,
        }),
        ...(privacy && {
          activityVisibility: privacy.activityVisibility,
          twoFactorEnabled: privacy.twoFactor,
        }),
        ...(personalization && {
          ...(personalization.language !== undefined && { language: personalization.language }),
          ...(personalization.region !== undefined && { region: personalization.region }),
          ...(personalization.currency !== undefined && { currency: personalization.currency }),
          ...(personalization.theme !== undefined && { theme: personalization.theme }),
          // CRITICAL: Only update interestTags if explicitly provided AND meaningful
          // If empty array provided but existing tags exist, preserve existing tags
          // This prevents accidental overwrites from onboarding flow after tags are saved
          ...(personalization.hasOwnProperty('interestTags') && 
              (() => {
                const providedTags = personalization.interestTags
                if (Array.isArray(providedTags) && providedTags.length > 0) {
                  // Update with new tags
                  console.log(`[UpdateSettings] Updating tags to:`, providedTags)
                  return { interestTags: providedTags }
                } else if (Array.isArray(providedTags) && providedTags.length === 0 && existingTags.length === 0) {
                  // Clear tags if no existing tags (intentional clearing)
                  console.log(`[UpdateSettings] Clearing tags (no existing tags)`)
                  return { interestTags: [] }
                } else if (Array.isArray(providedTags) && providedTags.length === 0 && existingTags.length > 0) {
                  // Preserve existing tags if empty array provided but tags exist
                  console.log(`[UpdateSettings] ⚠️ Empty array provided but existing tags exist. PRESERVING existing tags:`, existingTags)
                  return {} // Don't update - preserve existing
                }
                return {} // Default: don't update
              })()),
          ...(personalization.accessibility?.highContrast !== undefined && { highContrast: personalization.accessibility.highContrast }),
          ...(personalization.accessibility?.screenReader !== undefined && { screenReader: personalization.accessibility.screenReader }),
          ...(personalization.accessibility?.textSize !== undefined && { textSize: personalization.accessibility.textSize }),
        }),
      },
    })

    return {
      notifications: {
        donations: settings.notificationsDonations,
        comments: settings.notificationsComments,
        awards: settings.notificationsAwards,
        mentions: settings.notificationsMentions,
        newCauses: settings.notificationsNewCauses,
        email: settings.notificationsEmail,
        sms: settings.notificationsSMS,
      },
      privacy: {
        activityVisibility: settings.activityVisibility,
        twoFactor: settings.twoFactorEnabled,
      },
      personalization: {
        language: settings.language,
        region: settings.region,
        currency: settings.currency || 'USD',
        theme: settings.theme,
        interestTags: settings.interestTags || [],
        accessibility: {
          highContrast: settings.highContrast,
          screenReader: settings.screenReader,
          textSize: settings.textSize,
        },
      },
    }
  },
}
