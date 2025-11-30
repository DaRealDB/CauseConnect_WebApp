# Legal & Support Features - Implementation Guide

This document outlines the complete implementation for the Legal & Support section in Settings.

## ✅ Backend Implementation (COMPLETE)

### 1. Impact Statistics Service (`backend/src/services/impact.service.ts`)
- ✅ Created service to calculate total donated amount
- ✅ Calculates unique causes supported (events, posts, recipients)
- ✅ Returns donation count

### 2. Settings Service Updates (`backend/src/services/settings.service.ts`)
- ✅ Added volunteering preferences to getSettings()
- ✅ Added volunteering preferences to updateSettings()
- ✅ Fields: `availableForVolunteering`, `preferredVolunteerActivities`

### 3. Database Schema (`backend/prisma/schema.prisma`)
- ✅ Added `preferredVolunteerActivities String[] @default([])` field
- ✅ Migration applied via `prisma db push`

### 4. Backend Endpoints
- ✅ `/api/settings/impact` - GET endpoint for impact statistics
- ✅ Settings routes updated to include impact endpoint

## 🔄 Frontend Implementation (IN PROGRESS)

### State Variables (Already Added)
- ✅ `impactStats` - stores total donated, causes supported
- ✅ `isLoadingImpactStats` - loading state
- ✅ `volunteeringPreferences` - stores volunteering toggle and activities
- ✅ `showLegalDocDialog` - controls legal document modal
- ✅ `showSupportDialog` - controls support dialog
- ✅ `VOLUNTEER_ACTIVITIES` - array of available activities

### Functions to Add

#### 1. Load Impact Statistics
```typescript
const loadImpactStats = async () => {
  if (!user) return
  try {
    setIsLoadingImpactStats(true)
    const stats = await settingsService.getImpactStats()
    setImpactStats(stats)
  } catch (error: any) {
    console.error("Failed to load impact stats:", error)
    toast.error(error.message || "Failed to load impact statistics")
  } finally {
    setIsLoadingImpactStats(false)
  }
}
```

#### 2. Load Volunteering Preferences
```typescript
const loadVolunteeringPreferences = async () => {
  try {
    const settings = await settingsService.getSettings()
    if (settings.volunteering) {
      setVolunteeringPreferences({
        availableForVolunteering: settings.volunteering.availableForVolunteering ?? false,
        preferredActivities: settings.volunteering.preferredActivities || [],
      })
    }
  } catch (error: any) {
    console.error("Failed to load volunteering preferences:", error)
  }
}
```

#### 3. useEffect Hook (Add after line 732)
```typescript
// Load impact stats and volunteering preferences when legal section is active
useEffect(() => {
  if (activeSection === "legal" && user) {
    loadImpactStats()
    loadVolunteeringPreferences()
  }
}, [activeSection, user])
```

### UI Updates Needed

#### 1. Legal Documents Section
- Update Button onClick to open modal:
```typescript
<Button 
  variant="outline" 
  size="sm"
  onClick={() => {
    setSelectedLegalDoc(doc.title.toLowerCase().replace(/\s+/g, '-'))
    setShowLegalDocDialog(true)
  }}
>
  View
  <ExternalLink className="w-3 h-3 ml-2" />
</Button>
```

#### 2. Impact Tracker Section
Replace hardcoded values with:
```typescript
<div className="text-center p-4 bg-muted rounded-lg">
  <p className="text-2xl font-bold text-primary">
    {isLoadingImpactStats ? "Loading..." : `$${impactStats.totalDonated.toFixed(2)}`}
  </p>
  <p className="text-sm text-muted-foreground">Total Donated</p>
</div>
<div className="text-center p-4 bg-muted rounded-lg">
  <p className="text-2xl font-bold text-primary">
    {isLoadingImpactStats ? "Loading..." : impactStats.causesSupported}
  </p>
  <p className="text-sm text-muted-foreground">Causes Supported</p>
</div>
```

#### 3. Volunteering Section
Update Switch and Badges:
```typescript
<Switch 
  checked={volunteeringPreferences.availableForVolunteering}
  onCheckedChange={(checked) => {
    setVolunteeringPreferences({
      ...volunteeringPreferences,
      availableForVolunteering: checked,
    })
  }}
/>

// For badges:
{VOLUNTEER_ACTIVITIES.map((activity) => (
  <Badge
    key={activity}
    variant={volunteeringPreferences.preferredActivities.includes(activity) ? "default" : "outline"}
    className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
    onClick={() => {
      setVolunteeringPreferences(prev => ({
        ...prev,
        preferredActivities: prev.preferredActivities.includes(activity)
          ? prev.preferredActivities.filter(a => a !== activity)
          : [...prev.preferredActivities, activity]
      }))
    }}
  >
    {activity}
  </Badge>
))}
```

#### 4. Support & Feedback Section
Update button onClick handlers:
```typescript
<Button 
  variant="outline" 
  className="w-full justify-start bg-transparent"
  onClick={() => {
    setSupportType('help')
    setShowSupportDialog(true)
  }}
>
  <HelpCircle className="w-4 h-4 mr-2" />
  Help Center
</Button>
```

### Dialog Components to Add

#### 1. Legal Document Dialog (Add before closing </div>)
```typescript
{/* Legal Document Dialog */}
<Dialog open={showLegalDocDialog} onOpenChange={setShowLegalDocDialog}>
  <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle>
        {selectedLegalDoc === 'terms-of-service' && 'Terms of Service'}
        {selectedLegalDoc === 'privacy-policy' && 'Privacy Policy'}
        {selectedLegalDoc === 'transparency-report' && 'Transparency Report'}
        {selectedLegalDoc === 'community-guidelines' && 'Community Guidelines'}
      </DialogTitle>
    </DialogHeader>
    <div className="prose max-w-none">
      {/* Add your legal document content here or fetch from API */}
      <p>Legal document content will be displayed here...</p>
    </div>
  </DialogContent>
</Dialog>
```

#### 2. Support Dialog (Add before closing </div>)
```typescript
{/* Support Dialog */}
<Dialog open={showSupportDialog} onOpenChange={setShowSupportDialog}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>
        {supportType === 'help' && 'Help Center'}
        {supportType === 'contact' && 'Contact Support'}
        {supportType === 'report' && 'Report an Issue'}
      </DialogTitle>
      <DialogDescription>
        {supportType === 'help' && 'Find answers to common questions'}
        {supportType === 'contact' && 'Get in touch with our support team'}
        {supportType === 'report' && 'Report a problem or issue you encountered'}
      </DialogDescription>
    </DialogHeader>
    <div className="space-y-4">
      {(supportType === 'contact' || supportType === 'report') && (
        <div className="space-y-2">
          <Label htmlFor="support-message">Message</Label>
          <Textarea
            id="support-message"
            value={supportMessage}
            onChange={(e) => setSupportMessage(e.target.value)}
            placeholder={supportType === 'contact' 
              ? "Describe your question or issue..." 
              : "Describe the problem you encountered..."}
            rows={6}
          />
        </div>
      )}
      {supportType === 'help' && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Help center content will be displayed here. You can add FAQ sections, search functionality, etc.
          </p>
        </div>
      )}
    </div>
    <DialogFooter>
      <Button variant="outline" onClick={() => {
        setShowSupportDialog(false)
        setSupportMessage("")
        setSupportType(null)
      }}>
        Cancel
      </Button>
      {(supportType === 'contact' || supportType === 'report') && (
        <Button onClick={async () => {
          // Handle submit - send to backend or email service
          toast.success("Your message has been sent. We'll get back to you soon!")
          setShowSupportDialog(false)
          setSupportMessage("")
          setSupportType(null)
        }}>
          Send
        </Button>
      )}
    </DialogFooter>
  </DialogContent>
</Dialog>
```

## Summary

### Backend: ✅ Complete
- Impact statistics service
- Volunteering preferences in settings
- Database schema updated
- API endpoints created

### Frontend: 🔄 Needs Implementation
- Helper functions (loadImpactStats, loadVolunteeringPreferences)
- useEffect hook to load data when section opens
- UI updates for all sections
- Dialog components for legal docs and support

## Next Steps

1. Add the helper functions
2. Add the useEffect hook
3. Update all UI sections with real data
4. Add dialog components
5. Test all functionality end-to-end





