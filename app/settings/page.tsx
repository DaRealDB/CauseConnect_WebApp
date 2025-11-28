"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  User,
  Shield,
  CreditCard,
  Bell,
  Palette,
  Users,
  FileText,
  SettingsIcon,
  ChevronLeft,
  Camera,
  EyeOff,
  Smartphone,
  Mail,
  Lock,
  Trash2,
  Download,
  UserX,
  Heart,
  Globe,
  Moon,
  Sun,
  Monitor,
  Accessibility,
  Volume2,
  MessageSquare,
  Award,
  Calendar,
  HelpCircle,
  ExternalLink,
  Plus,
  X,
} from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"
import { userService, settingsService, squadService } from "@/lib/api/services"
import type { Squad } from "@/lib/api/types"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ImageCropper } from "@/components/image-cropper"
import { getImageUrl } from "@/lib/utils"
import { getAvailableCurrencies } from "@/lib/utils/currency"
import { getAllCountries, getRegionsByCountry, type Country } from "@/lib/utils/countries"
import { useCurrency } from "@/contexts/CurrencyContext"
import { useThemeContext } from "@/contexts/ThemeContext"
import { PaymentMethods } from "@/components/payment-methods"
import { DonationHistory } from "@/components/donation-history"
import { RecurringDonations } from "@/components/recurring-donations"

export default function SettingsPage() {
  const { user, refreshUser } = useAuth()
  const { refreshCurrency } = useCurrency()
  const { theme: currentTheme, setTheme: setThemeContext } = useThemeContext()
  const [activeSection, setActiveSection] = useState("account")
  const [isMounted, setIsMounted] = useState(false)
  
  // Prevent hydration mismatch by only rendering dynamic content after mount
  useEffect(() => {
    setIsMounted(true)
  }, [])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [showEmailDialog, setShowEmailDialog] = useState(false)
  const [showAvatarDialog, setShowAvatarDialog] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string>("")
  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [emailData, setEmailData] = useState({
    newEmail: "",
  })
  
  // Profile form state
  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    bio: "",
    location: "",
    website: "",
    email: "",
  })

  // Settings state
  const [notifications, setNotifications] = useState({
    donations: true,
    comments: true,
    awards: false,
    mentions: true,
    newCauses: true,
    email: true,
    sms: false,
  })
  const [privacy, setPrivacy] = useState({
    activityVisibility: "friends" as "public" | "friends" | "private",
    twoFactor: false,
  })
  const [loginActivity, setLoginActivity] = useState<Array<{
    id: string
    device: string
    location: string
    timeAgo: string
    isCurrentSession: boolean
    createdAt: string
  }>>([])
  const [isLoadingLoginActivity, setIsLoadingLoginActivity] = useState(false)
  const [blockedUsers, setBlockedUsers] = useState<Array<{
    id: string
    userId: string
    username: string
    name: string
    avatar?: string
    verified: boolean
    blockedAt: string
  }>>([])
  const [isLoadingBlockedUsers, setIsLoadingBlockedUsers] = useState(false)
  const [isExportingData, setIsExportingData] = useState(false)
  const [blockUserSearch, setBlockUserSearch] = useState("")
  const [searchResults, setSearchResults] = useState<Array<{
    id: string
    username: string
    firstName: string
    lastName: string
    avatar?: string
    verified: boolean
  }>>([])
  const [isSearching, setIsSearching] = useState(false)
  const [theme, setThemeState] = useState("system")
  const [personalization, setPersonalization] = useState({
    language: "en",
    country: "US",
    region: "",
    currency: "USD",
    interestTags: [] as string[],
    accessibility: {
      highContrast: false,
      screenReader: false,
      textSize: "medium",
    },
  })
  const [availableRegions, setAvailableRegions] = useState<Array<{ code: string; name: string }>>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  
  // Community & Engagement state
  const [squads, setSquads] = useState<Squad[]>([])
  const [isLoadingSquads, setIsLoadingSquads] = useState(false)
  const [communityPreferences, setCommunityPreferences] = useState({
    autoJoinSquadEvents: false,
    rsvpReminders: true,
    allowAwards: true,
    showFeedbackButtons: true,
  })
  const [showCreateSquadDialog, setShowCreateSquadDialog] = useState(false)
  const [createSquadData, setCreateSquadData] = useState({
    name: "",
    description: "",
    avatar: null as File | null,
  })
  
  // Legal & Support state
  const [impactStats, setImpactStats] = useState({
    totalDonated: 0,
    causesSupported: 0,
    donationCount: 0,
  })
  const [isLoadingImpactStats, setIsLoadingImpactStats] = useState(false)
  const [volunteeringPreferences, setVolunteeringPreferences] = useState({
    availableForVolunteering: false,
    preferredActivities: [] as string[],
  })
  const [showLegalDocDialog, setShowLegalDocDialog] = useState(false)
  const [selectedLegalDoc, setSelectedLegalDoc] = useState<string | null>(null)
  const [showSupportDialog, setShowSupportDialog] = useState(false)
  const [supportType, setSupportType] = useState<'help' | 'contact' | 'report' | null>(null)
  const [supportMessage, setSupportMessage] = useState("")
  
  // Available volunteer activities
  const VOLUNTEER_ACTIVITIES = [
    "Event Organization",
    "Fundraising",
    "Community Outreach",
    "Administrative",
    "Hands-on Work",
  ]
  
  // Available tags from onboarding
  const AVAILABLE_TAGS = [
    { id: "education", label: "Education" },
    { id: "environment", label: "Environment" },
    { id: "health", label: "Health & Medicine" },
    { id: "poverty", label: "Poverty & Hunger" },
    { id: "animals", label: "Animal Welfare" },
    { id: "human-rights", label: "Human Rights" },
    { id: "disaster-relief", label: "Disaster Relief" },
    { id: "arts-culture", label: "Arts & Culture" },
    { id: "technology", label: "Technology Access" },
    { id: "elderly", label: "Elderly Care" },
    { id: "youth", label: "Youth Development" },
    { id: "mental-health", label: "Mental Health" },
    { id: "community", label: "Community" },
  ]

  // Load user data on mount
  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        bio: user.bio || "",
        location: user.location || "",
        website: user.website || "",
        email: user.email || "",
      })
    }
  }, [user])

  // Load login activity when privacy section is active
  useEffect(() => {
    if (activeSection === "privacy" && user) {
      loadLoginActivity()
      loadBlockedUsers()
    }
  }, [activeSection, user])

  // Load squads when community section is active
  useEffect(() => {
    if (activeSection === "community" && user) {
      loadSquads()
    }
  }, [activeSection, user])

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true)
        const settings = await settingsService.getSettings()
        console.log("🔍 Full settings API response:", settings)
        console.log("🔍 personalization object:", settings.personalization)
        console.log("🔍 interestTags in response:", settings.personalization?.interestTags)
        setNotifications(settings.notifications)
        setPrivacy(settings.privacy)
        const personalizationData = settings.personalization
        // Handle legacy region format (e.g., "us" -> country: "US", region: "")
        const countryCode = personalizationData.region?.toUpperCase() || "US"
        const country = getAllCountries().find(c => c.code === countryCode)
        // Filter interestTags to only include valid tags from AVAILABLE_TAGS
        const rawTags = personalizationData.interestTags || []
        const validTags = rawTags.filter(tagId => 
          AVAILABLE_TAGS.some(tag => tag.id === tagId)
        )
        
        // Debug: Log tags if they exist (can be removed after verification)
        if (rawTags.length > 0) {
          console.log("✅ Loaded tags from settings:", rawTags)
          console.log("✅ Valid tags after filtering:", validTags)
        } else {
          console.log("⚠️ No tags found in settings. interestTags:", personalizationData.interestTags)
        }
        
        setPersonalization({
          ...personalizationData,
          country: country?.code || "US",
          region: personalizationData.region || "",
          interestTags: validTags,
          accessibility: personalizationData.accessibility || {
            highContrast: false,
            screenReader: false,
            textSize: "medium",
          },
        })
        setSelectedTags(validTags)
        // Load regions for the country
        if (country?.regions) {
          setAvailableRegions(country.regions)
        } else {
          setAvailableRegions([])
        }
        const savedTheme = settings.personalization.theme || "system"
        setThemeState(savedTheme)
        // Theme will be applied by ThemeContext
        
        // Load community preferences
        if (settings.community) {
          setCommunityPreferences({
            autoJoinSquadEvents: settings.community.autoJoinSquadEvents ?? false,
            rsvpReminders: settings.community.rsvpReminders ?? true,
            allowAwards: settings.community.allowAwards ?? true,
            showFeedbackButtons: settings.community.showFeedbackButtons ?? true,
          })
        }
        
        // Load volunteering preferences
        if (settings.volunteering) {
          setVolunteeringPreferences({
            availableForVolunteering: settings.volunteering.availableForVolunteering ?? false,
            preferredActivities: settings.volunteering.preferredActivities || [],
          })
        }
        
        // Apply accessibility settings after loading (will be applied by useEffect when state updates)
      } catch (error: any) {
        console.error("Failed to load settings:", error)
        // Don't show error toast - settings might not exist yet
      } finally {
        setIsLoading(false)
      }
    }
    loadSettings()
  }, [])

  // Reload settings when switching to personalization section to ensure tags are fresh
  useEffect(() => {
    if (activeSection === "personalization") {
      const reloadSettings = async () => {
        try {
          const settings = await settingsService.getSettings()
          const personalizationData = settings.personalization
          const rawTags = personalizationData.interestTags || []
          const validTags = rawTags.filter(tagId => 
            AVAILABLE_TAGS.some(tag => tag.id === tagId)
          )
          if (validTags.length !== selectedTags.length || 
              !validTags.every(tag => selectedTags.includes(tag))) {
            setSelectedTags(validTags)
            setPersonalization(prev => ({
              ...prev,
              interestTags: validTags,
            }))
            console.log("🔄 Refreshed tags in personalization section:", validTags)
          }
        } catch (error) {
          console.error("Failed to refresh settings:", error)
        }
      }
      reloadSettings()
    }
  }, [activeSection])

  // Update available regions when country changes
  useEffect(() => {
    const country = getAllCountries().find(c => c.code === personalization.country)
    if (country?.regions) {
      setAvailableRegions(country.regions)
      // If current region is not in the new country's regions, reset it
      if (personalization.region && !country.regions.find(r => r.code === personalization.region)) {
        setPersonalization({ ...personalization, region: "" })
      }
    } else {
      setAvailableRegions([])
    }
  }, [personalization.country])

  // Sync theme state with context
  useEffect(() => {
    if (currentTheme) {
      setThemeState(currentTheme)
    }
  }, [currentTheme])

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true)
      const { email, ...rest } = profileData
      await userService.updateProfile(rest)
      if (email && email !== user?.email) {
        await userService.updateProfile({ email })
      }
      await refreshUser()
      toast.success("Profile updated successfully!")
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile")
    } finally {
      setIsSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match")
      return
    }
    if (passwordData.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long")
      return
    }
    try {
      setIsSaving(true)
      await userService.changePassword(passwordData.oldPassword, passwordData.newPassword)
      toast.success("Password changed successfully!")
      setShowPasswordDialog(false)
      setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" })
    } catch (error: any) {
      toast.error(error.message || "Failed to change password")
    } finally {
      setIsSaving(false)
    }
  }

  const handleAvatarCrop = async (croppedImageBlob: Blob) => {
    try {
      setIsSaving(true)
      const file = new File([croppedImageBlob], "avatar.jpg", { type: "image/jpeg" })
      await userService.uploadAvatar(file)
      await refreshUser()
      toast.success("Avatar updated successfully!")
      setShowAvatarDialog(false)
      setAvatarPreview("")
    } catch (error: any) {
      toast.error(error.message || "Failed to update avatar")
    } finally {
      setIsSaving(false)
    }
  }

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string)
        setShowAvatarDialog(true)
      }
      reader.readAsDataURL(file)
    }
  }

  const loadLoginActivity = async () => {
    if (!user) return
    try {
      setIsLoadingLoginActivity(true)
      const activity = await settingsService.getLoginActivity()
      setLoginActivity(activity)
    } catch (error: any) {
      console.error("Failed to load login activity:", error)
      toast.error(error.message || "Failed to load login activity")
    } finally {
      setIsLoadingLoginActivity(false)
    }
  }

  const loadBlockedUsers = async () => {
    if (!user) return
    try {
      setIsLoadingBlockedUsers(true)
      const blocked = await settingsService.getBlockedUsers()
      setBlockedUsers(blocked)
    } catch (error: any) {
      console.error("Failed to load blocked users:", error)
      toast.error(error.message || "Failed to load blocked users")
    } finally {
      setIsLoadingBlockedUsers(false)
    }
  }

  const handleRevokeSession = async (tokenId: string) => {
    try {
      await settingsService.revokeSession(tokenId)
      toast.success("Session revoked successfully")
      await loadLoginActivity()
    } catch (error: any) {
      toast.error(error.message || "Failed to revoke session")
    }
  }

  const handleBlockUser = async (userId: string) => {
    try {
      await settingsService.blockUser(userId)
      toast.success("User blocked successfully")
      await loadBlockedUsers()
    } catch (error: any) {
      toast.error(error.message || "Failed to block user")
    }
  }

  const handleUnblockUser = async (userId: string) => {
    try {
      await settingsService.unblockUser(userId)
      toast.success("User unblocked successfully")
      await loadBlockedUsers()
    } catch (error: any) {
      toast.error(error.message || "Failed to unblock user")
    }
  }

  const handleSearchUsers = async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([])
      return
    }
    try {
      setIsSearching(true)
      const users = await userService.searchUsers(query, 10)
      // Filter out already blocked users and current user
      const blockedUserIds = new Set(blockedUsers.map(u => u.userId))
      const filtered = users.filter(u => !blockedUserIds.has(u.id) && u.id !== user?.id)
      setSearchResults(filtered)
    } catch (error: any) {
      console.error("Failed to search users:", error)
      // Don't show error toast for search failures
    } finally {
      setIsSearching(false)
    }
  }

  const handleBlockFromSearch = async (userId: string) => {
    try {
      await handleBlockUser(userId)
      setBlockUserSearch("")
      setSearchResults([])
    } catch (error: any) {
      // Error already handled in handleBlockUser
    }
  }

  const handleExportData = async () => {
    try {
      setIsExportingData(true)
      const data = await settingsService.exportUserData()
      
      // Create a blob and download it
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `causeconnect-data-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      toast.success("Data exported successfully!")
    } catch (error: any) {
      toast.error(error.message || "Failed to export data")
    } finally {
      setIsExportingData(false)
    }
  }

  const loadSquads = async () => {
    if (!user) return
    try {
      setIsLoadingSquads(true)
      const userSquads = await squadService.getSquads()
      setSquads(userSquads)
    } catch (error: any) {
      console.error("Failed to load squads:", error)
      toast.error(error.message || "Failed to load squads")
    } finally {
      setIsLoadingSquads(false)
    }
  }

  const handleCreateSquad = async () => {
    if (!createSquadData.name.trim()) {
      toast.error("Squad name is required")
      return
    }
    try {
      setIsSaving(true)
      await squadService.createSquad({
        name: createSquadData.name,
        description: createSquadData.description,
        avatar: createSquadData.avatar || undefined,
      })
      toast.success("Squad created successfully!")
      setShowCreateSquadDialog(false)
      setCreateSquadData({ name: "", description: "", avatar: null })
      await loadSquads()
    } catch (error: any) {
      toast.error(error.message || "Failed to create squad")
    } finally {
      setIsSaving(false)
    }
  }

  const handleSquadManage = (squadId: string | number) => {
    // Navigate to squad detail page for management
    window.location.href = `/squads/${squadId}`
  }

  // Load impact statistics
  const loadImpactStats = async () => {
    if (!user) return
    try {
      setIsLoadingImpactStats(true)
      const stats = await settingsService.getImpactStats()
      setImpactStats(stats)
    } catch (error: any) {
      console.error("Failed to load impact stats:", error)
      // Don't show error toast - stats might not exist yet
    } finally {
      setIsLoadingImpactStats(false)
    }
  }

  // Load volunteering preferences from settings
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

  // Apply accessibility settings to the document
  const applyAccessibilitySettings = (accessibility: {
    highContrast: boolean
    screenReader: boolean
    textSize: string
  }) => {
    if (typeof document === 'undefined') return

    const html = document.documentElement
    const body = document.body

    // High Contrast Mode
    if (accessibility.highContrast) {
      html.classList.add('high-contrast')
      html.style.setProperty('--contrast-multiplier', '1.5')
    } else {
      html.classList.remove('high-contrast')
      html.style.removeProperty('--contrast-multiplier')
    }

    // Screen Reader Support
    if (accessibility.screenReader) {
      html.setAttribute('data-screen-reader', 'true')
      // Add ARIA landmarks and improve semantic structure
      body.setAttribute('role', 'main')
    } else {
      html.removeAttribute('data-screen-reader')
      body.removeAttribute('role')
    }

    // Text Size
    html.classList.remove('text-small', 'text-medium', 'text-large', 'text-extra-large')
    html.classList.add(`text-${accessibility.textSize}`)
    
    // Apply CSS variable for text size scaling
    const textSizeMap: Record<string, string> = {
      small: '0.875rem',
      medium: '1rem',
      large: '1.125rem',
      'extra-large': '1.25rem',
    }
    html.style.setProperty('--base-font-size', textSizeMap[accessibility.textSize] || '1rem')
  }

  // Apply accessibility settings on mount and when settings load
  useEffect(() => {
    if (personalization.accessibility) {
      applyAccessibilitySettings(personalization.accessibility)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personalization.accessibility?.highContrast, personalization.accessibility?.screenReader, personalization.accessibility?.textSize])

  const handleSaveSettings = async () => {
    try {
      setIsSaving(true)
      const settingsData: any = {
        notifications: {
          donations: notifications.donations,
          comments: notifications.comments,
          awards: notifications.awards,
          mentions: notifications.mentions,
          newCauses: notifications.newCauses,
          email: notifications.email,
          sms: notifications.sms,
        },
        privacy: {
          activityVisibility: privacy.activityVisibility,
          twoFactorEnabled: privacy.twoFactor,
        },
        personalization: {
          language: personalization.language,
          region: personalization.region || personalization.country || "US",
          currency: personalization.currency || "USD",
          theme: theme,
          interestTags: selectedTags,
          accessibility: personalization.accessibility,
        },
      }
      
      // Add community preferences if we're in the community section
      if (activeSection === "community") {
        settingsData.community = communityPreferences
      }
      
      // Add volunteering preferences if we're in the legal section
      if (activeSection === "legal") {
        settingsData.volunteering = volunteeringPreferences
      }
      
      await settingsService.updateSettings(settingsData)
      // Theme is already applied by setThemeContext when clicking the theme buttons
      // Refresh currency context to update all displays immediately
      await refreshCurrency()
      
      // If tags were updated in personalization, notify user and trigger feed refresh
      if (activeSection === "personalization") {
        // Update local state to reflect saved tags
        setPersonalization({ ...personalization, interestTags: selectedTags })
        
        // Dispatch event to notify feed page to refresh
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('settings_updated'))
          // Also set localStorage to trigger cross-tab sync
          localStorage.setItem('interest_tags_updated', Date.now().toString())
        }
        
        toast.success("Interests updated! Your feed is refreshing now.")
      } else {
        toast.success("Settings saved successfully!")
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to save settings")
    } finally {
      setIsSaving(false)
    }
  }

  // Load privacy data when privacy section is active
  useEffect(() => {
    if (activeSection === "privacy" && user) {
      loadLoginActivity()
      loadBlockedUsers()
    }
  }, [activeSection, user])

  // Load squads when community section is active
  useEffect(() => {
    if (activeSection === "community" && user) {
      loadSquads()
    }
  }, [activeSection, user])

  // Load impact stats and volunteering preferences when legal section is active
  useEffect(() => {
    if (activeSection === "legal" && user) {
      loadImpactStats()
      loadVolunteeringPreferences()
    }
  }, [activeSection, user])

  // Debounce user search
  useEffect(() => {
    if (!blockUserSearch || blockUserSearch.length < 2) {
      setSearchResults([])
      return
    }
    const timeoutId = setTimeout(() => {
      handleSearchUsers(blockUserSearch)
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [blockUserSearch])

  const sections = [
    { id: "account", label: "Account Settings", icon: User },
    { id: "privacy", label: "Privacy & Security", icon: Shield },
    { id: "payments", label: "Payment & Donations", icon: CreditCard },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "personalization", label: "Personalization", icon: Palette },
    { id: "community", label: "Community & Engagement", icon: Users },
    { id: "legal", label: "Legal & Support", icon: FileText },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/feed">
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back to Feed
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <SettingsIcon className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">Settings</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Sidebar Navigation */}
          <div className="w-64 flex-shrink-0">
            <Card className="sticky top-8">
              <CardContent className="p-4">
                <nav className="space-y-2">
                  {sections.map((section) => {
                    const Icon = section.icon
                    return (
                      <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                          activeSection === section.id
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-sm font-medium">{section.label}</span>
                      </button>
                    )
                  })}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="flex-1 space-y-6">
            {/* Account Settings */}
            {activeSection === "account" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-bold text-foreground mb-2">Account Settings</h2>
                  <p className="text-muted-foreground">Manage your profile information and account details</p>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>Update your public profile details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center gap-6">
                      <Avatar className="w-20 h-20">
                        <AvatarImage src={getImageUrl(user?.avatar)} />
                        <AvatarFallback>
                          {isMounted ? (user?.firstName?.[0] || user?.username?.[0] || "U") : "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarSelect}
                          className="hidden"
                          id="avatar-upload"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById("avatar-upload")?.click()}
                        >
                          <Camera className="w-4 h-4 mr-2" />
                          Change Photo
                        </Button>
                        <p className="text-sm text-muted-foreground mt-2">JPG, PNG or GIF. Max size 2MB.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input 
                          id="firstName" 
                          value={profileData.firstName}
                          onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input 
                          id="lastName" 
                          value={profileData.lastName}
                          onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input 
                        id="username" 
                        value={user?.username || ""}
                        disabled
                        className="bg-muted"
                      />
                      <p className="text-xs text-muted-foreground">Username cannot be changed</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea 
                        id="bio" 
                        value={profileData.bio}
                        onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                        placeholder="Tell us about yourself..." 
                        className="min-h-[100px]" 
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input 
                        id="location" 
                        value={profileData.location}
                        onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                        placeholder="City, Country" 
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <Input 
                        id="website" 
                        value={profileData.website}
                        onChange={(e) => setProfileData({ ...profileData, website: e.target.value })}
                        placeholder="https://example.com" 
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                    <CardDescription>Manage your email and phone number</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{isMounted ? (user?.email || "No email") : "No email"}</p>
                          <p className="text-sm text-muted-foreground">Primary email</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setShowEmailDialog(true)}>
                        Change
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Security</CardTitle>
                    <CardDescription>Update your password and security settings</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button
                      variant="outline"
                      className="w-full justify-start bg-transparent"
                      onClick={() => setShowPasswordDialog(true)}
                    >
                      <Lock className="w-4 h-4 mr-2" />
                      Change Password
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="w-full justify-start">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Account
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your account and remove all your
                            data from our servers.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction className="bg-destructive text-destructive-foreground">
                            Delete Account
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Privacy & Security */}
            {activeSection === "privacy" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-bold text-foreground mb-2">Privacy & Security</h2>
                  <p className="text-muted-foreground">Control who can see your activity and secure your account</p>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Activity Visibility</CardTitle>
                    <CardDescription>Choose who can see your donations and activity</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Select
                      value={privacy.activityVisibility}
                      onValueChange={(value) => setPrivacy({ ...privacy, activityVisibility: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">
                          <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4" />
                            Public - Anyone can see
                          </div>
                        </SelectItem>
                        <SelectItem value="friends">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            Friends - Only people you follow
                          </div>
                        </SelectItem>
                        <SelectItem value="private">
                          <div className="flex items-center gap-2">
                            <EyeOff className="w-4 h-4" />
                            Private - Only you can see
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Two-Factor Authentication</CardTitle>
                    <CardDescription>Add an extra layer of security to your account</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Enable 2FA</p>
                        <p className="text-sm text-muted-foreground">
                          Secure your account with SMS or authenticator app
                        </p>
                      </div>
                      <Switch
                        checked={privacy.twoFactor}
                        onCheckedChange={(checked) => setPrivacy({ ...privacy, twoFactor: checked })}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Login Activity</CardTitle>
                    <CardDescription>Monitor your account access</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isLoadingLoginActivity ? (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">Loading login activity...</p>
                      </div>
                    ) : loginActivity.length > 0 ? (
                      <div className="space-y-3">
                        {loginActivity.map((session) => (
                          <div key={session.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                            <div>
                              <p className="font-medium">
                                {session.isCurrentSession ? "Current Session" : "Previous Session"}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {session.device} • {session.location} • {session.timeAgo}
                              </p>
                            </div>
                            {session.isCurrentSession ? (
                              <Badge variant="secondary">Active</Badge>
                            ) : (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleRevokeSession(session.id)}
                              >
                                Revoke
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">No active sessions found</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Blocked Users</CardTitle>
                    <CardDescription>Manage users you've blocked</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Search to block new users */}
                    <div className="space-y-2">
                      <Label>Block a User</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Search by username or name..."
                          value={blockUserSearch}
                          onChange={(e) => setBlockUserSearch(e.target.value)}
                        />
                      </div>
                      {blockUserSearch && searchResults.length > 0 && (
                        <div className="border border-border rounded-lg max-h-60 overflow-y-auto">
                          {searchResults.map((userResult) => (
                            <div key={userResult.id} className="flex items-center justify-between p-3 border-b border-border last:border-b-0 hover:bg-secondary/50">
                              <div className="flex items-center gap-3">
                                <Avatar className="w-8 h-8">
                                  <AvatarImage src={getImageUrl(userResult.avatar)} alt={`${userResult.firstName} ${userResult.lastName}`} />
                                  <AvatarFallback>
                                    {userResult.firstName?.[0] || userResult.username?.[0] || "U"}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium text-sm">{userResult.firstName} {userResult.lastName}</p>
                                  <p className="text-xs text-muted-foreground">@{userResult.username}</p>
                                </div>
                                {userResult.verified && (
                                  <Badge variant="secondary" className="text-xs">Verified</Badge>
                                )}
                              </div>
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => handleBlockFromSearch(userResult.id)}
                              >
                                Block
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                      {blockUserSearch && isSearching && (
                        <p className="text-xs text-muted-foreground">Searching...</p>
                      )}
                      {blockUserSearch && !isSearching && searchResults.length === 0 && blockUserSearch.length >= 2 && (
                        <p className="text-xs text-muted-foreground">No users found</p>
                      )}
                    </div>

                    <Separator />

                    {/* List of blocked users */}
                    {isLoadingBlockedUsers ? (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">Loading blocked users...</p>
                      </div>
                    ) : blockedUsers.length > 0 ? (
                      <div className="space-y-3">
                        <Label>Blocked Users ({blockedUsers.length})</Label>
                        {blockedUsers.map((blocked) => (
                          <div key={blocked.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                            <div className="flex items-center gap-3">
                              <Avatar className="w-10 h-10">
                                <AvatarImage src={getImageUrl(blocked.avatar)} alt={blocked.name} />
                                <AvatarFallback>
                                  {blocked.name?.[0] || blocked.username?.[0] || "U"}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{blocked.name}</p>
                                <p className="text-sm text-muted-foreground">@{blocked.username}</p>
                              </div>
                              {blocked.verified && (
                                <Badge variant="secondary" className="text-xs">Verified</Badge>
                              )}
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleUnblockUser(blocked.userId)}
                            >
                              Unblock
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <UserX className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No blocked users</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Data Export</CardTitle>
                    <CardDescription>Download a copy of your account data</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start bg-transparent"
                      onClick={handleExportData}
                      disabled={isExportingData}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      {isExportingData ? "Exporting..." : "Export Account Data"}
                    </Button>
                    {isExportingData && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Preparing your data export...
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Payment & Donations */}
            {activeSection === "payments" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-bold text-foreground mb-2">Payment & Donations</h2>
                  <p className="text-muted-foreground">Manage your payment methods and donation history</p>
                </div>

                <PaymentMethods />
                <DonationHistory />
                <RecurringDonations />
              </div>
            )}

            {/* Notifications */}
            {activeSection === "notifications" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-bold text-foreground mb-2">Notifications</h2>
                  <p className="text-muted-foreground">Control how and when you receive notifications</p>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Push Notifications</CardTitle>
                    <CardDescription>Choose which activities trigger notifications</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      {
                        key: "donations",
                        label: "Donation Updates",
                        description: "When causes you support post updates",
                        icon: Heart,
                      },
                      {
                        key: "comments",
                        label: "Comments",
                        description: "When someone comments on your posts",
                        icon: MessageSquare,
                      },
                      {
                        key: "awards",
                        label: "Awards & Recognition",
                        description: "When you receive awards or badges",
                        icon: Award,
                      },
                      { key: "mentions", label: "Mentions", description: "When someone mentions you", icon: User },
                      {
                        key: "newCauses",
                        label: "New Causes",
                        description: "Discover new causes matching your interests",
                        icon: Globe,
                      },
                    ].map((item) => {
                      const Icon = item.icon
                      return (
                        <div key={item.key} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Icon className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{item.label}</p>
                              <p className="text-sm text-muted-foreground">{item.description}</p>
                            </div>
                          </div>
                          <Switch
                            checked={notifications[item.key as keyof typeof notifications]}
                            onCheckedChange={(checked) => setNotifications({ ...notifications, [item.key]: checked })}
                          />
                        </div>
                      )
                    })}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Communication Preferences</CardTitle>
                    <CardDescription>Choose how you want to receive notifications</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Email Notifications</p>
                          <p className="text-sm text-muted-foreground">Receive updates via email</p>
                        </div>
                      </div>
                      <Switch
                        checked={notifications.email}
                        onCheckedChange={(checked) => setNotifications({ ...notifications, email: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Smartphone className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">SMS Alerts</p>
                          <p className="text-sm text-muted-foreground">Receive urgent updates via text</p>
                        </div>
                      </div>
                      <Switch
                        checked={notifications.sms}
                        onCheckedChange={(checked) => setNotifications({ ...notifications, sms: checked })}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Personalization */}
            {activeSection === "personalization" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-bold text-foreground mb-2">Personalization</h2>
                  <p className="text-muted-foreground">Customize your experience and preferences</p>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Interests & Tags</CardTitle>
                    <CardDescription>Choose topics that interest you to personalize your feed</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Selected Tags */}
                    {selectedTags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {selectedTags.map((tagId) => {
                          const tag = AVAILABLE_TAGS.find(t => t.id === tagId)
                          if (!tag) return null
                          return (
                            <Badge
                              key={tagId}
                              variant="secondary"
                              className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
                              onClick={() => {
                                const newTags = selectedTags.filter(t => t !== tagId)
                                setSelectedTags(newTags)
                                setPersonalization({ ...personalization, interestTags: newTags })
                              }}
                            >
                              {tag.label}
                              <X className="w-3 h-3 ml-1" />
                            </Badge>
                          )
                        })}
                      </div>
                    )}

                    {/* Available Tags to Add */}
                    {selectedTags.length < AVAILABLE_TAGS.length && (
                      <div className="mb-4">
                        <Label className="text-sm text-muted-foreground mb-2 block">Add more interests:</Label>
                        <div className="flex flex-wrap gap-2">
                          {AVAILABLE_TAGS.filter(tag => !selectedTags.includes(tag.id)).map((tag) => (
                            <Badge
                              key={tag.id}
                              variant="outline"
                              className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                              onClick={() => {
                                const newTags = [...selectedTags, tag.id]
                                setSelectedTags(newTags)
                                setPersonalization({ ...personalization, interestTags: newTags })
                              }}
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              {tag.label}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedTags.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <p className="mb-4">No interests selected yet.</p>
                        <p className="text-sm">Select tags above to personalize your feed.</p>
                      </div>
                    )}

                    {selectedTags.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {selectedTags.length} {selectedTags.length === 1 ? "interest" : "interests"} selected
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Language & Location</CardTitle>
                    <CardDescription>Set your preferred language, country, and region</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Language</Label>
                      <Select 
                        value={personalization.language}
                        onValueChange={(value) => setPersonalization({ ...personalization, language: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="es">Español</SelectItem>
                          <SelectItem value="fr">Français</SelectItem>
                          <SelectItem value="de">Deutsch</SelectItem>
                          <SelectItem value="zh">中文</SelectItem>
                          <SelectItem value="ja">日本語</SelectItem>
                          <SelectItem value="ko">한국어</SelectItem>
                          <SelectItem value="ar">العربية</SelectItem>
                          <SelectItem value="pt">Português</SelectItem>
                          <SelectItem value="ru">Русский</SelectItem>
                          <SelectItem value="hi">हिन्दी</SelectItem>
                          <SelectItem value="tl">Filipino</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Country</Label>
                      <Select 
                        value={personalization.country || "US"}
                        onValueChange={(value) => {
                          const country = getAllCountries().find(c => c.code === value)
                          const regions = country?.regions || []
                          setPersonalization({ 
                            ...personalization, 
                            country: value,
                            region: regions.length > 0 ? "" : value // Reset region if country has regions
                          })
                          setAvailableRegions(regions)
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {getAllCountries().map((country) => (
                            <SelectItem key={country.code} value={country.code}>
                              {country.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {availableRegions.length > 0 && (
                      <div className="space-y-2">
                        <Label>Region/State/Province</Label>
                        <Select 
                          value={personalization.region || ""}
                          onValueChange={(value) => setPersonalization({ ...personalization, region: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a region" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                            {availableRegions.map((region) => (
                              <SelectItem key={region.code} value={region.code}>
                                {region.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          Select your state, province, or region within {getAllCountries().find(c => c.code === personalization.country)?.name}
                        </p>
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label>Currency</Label>
                      <Select 
                        value={personalization.currency || "USD"}
                        onValueChange={(value) => setPersonalization({ ...personalization, currency: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {getAvailableCurrencies().map((currency) => (
                            <SelectItem key={currency.code} value={currency.code}>
                              {currency.symbol} {currency.name} ({currency.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        All donation amounts and event goals will be displayed in this currency
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Theme Settings</CardTitle>
                    <CardDescription>Choose your preferred appearance</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { value: "light", label: "Light", icon: Sun },
                        { value: "dark", label: "Dark", icon: Moon },
                        { value: "system", label: "System", icon: Monitor },
                      ].map((option) => {
                        const Icon = option.icon
                        const isSelected = (theme || currentTheme) === option.value
                        return (
                          <button
                            key={option.value}
                            onClick={async () => {
                              try {
                                // Apply theme immediately and save to backend
                                await setThemeContext(option.value)
                              } catch (error: any) {
                                toast.error(error.message || "Failed to update theme")
                              }
                            }}
                            className={`p-4 border rounded-lg text-center transition-all ${
                              isSelected 
                                ? "border-primary bg-primary/10 shadow-md scale-105" 
                                : "border-border hover:bg-muted hover:border-primary/50"
                            }`}
                          >
                            <Icon className={`w-6 h-6 mx-auto mb-2 ${isSelected ? "text-primary" : ""}`} />
                            <p className={`font-medium ${isSelected ? "text-primary" : ""}`}>{option.label}</p>
                            {isSelected && (
                              <div className="mt-2">
                                <div className="w-2 h-2 bg-primary rounded-full mx-auto" />
                              </div>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Accessibility</CardTitle>
                    <CardDescription>Customize the interface for better accessibility</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Accessibility className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">High Contrast Mode</p>
                          <p className="text-sm text-muted-foreground">Increase contrast for better visibility</p>
                        </div>
                      </div>
                      <Switch 
                        checked={personalization.accessibility.highContrast}
                        onCheckedChange={(checked) => {
                          setPersonalization({
                            ...personalization,
                            accessibility: {
                              ...personalization.accessibility,
                              highContrast: checked,
                            },
                          })
                          // Apply immediately
                          applyAccessibilitySettings({
                            ...personalization.accessibility,
                            highContrast: checked,
                          })
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Volume2 className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Screen Reader Support</p>
                          <p className="text-sm text-muted-foreground">Optimize for screen readers</p>
                        </div>
                      </div>
                      <Switch 
                        checked={personalization.accessibility.screenReader}
                        onCheckedChange={(checked) => {
                          setPersonalization({
                            ...personalization,
                            accessibility: {
                              ...personalization.accessibility,
                              screenReader: checked,
                            },
                          })
                          // Apply immediately
                          applyAccessibilitySettings({
                            ...personalization.accessibility,
                            screenReader: checked,
                          })
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Text Size</Label>
                      <Select 
                        value={personalization.accessibility.textSize}
                        onValueChange={(value) => {
                          const newAccessibility = {
                            ...personalization.accessibility,
                            textSize: value,
                          }
                          setPersonalization({
                            ...personalization,
                            accessibility: newAccessibility,
                          })
                          // Apply immediately
                          applyAccessibilitySettings(newAccessibility)
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="small">Small</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="large">Large</SelectItem>
                          <SelectItem value="extra-large">Extra Large</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Community & Engagement */}
            {activeSection === "community" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-bold text-foreground mb-2">Community & Engagement</h2>
                  <p className="text-muted-foreground">Manage your groups, events, and interaction preferences</p>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>My Squads</CardTitle>
                    <CardDescription>Manage the groups you've created or joined</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingSquads ? (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">Loading your squads...</p>
                      </div>
                    ) : squads.length === 0 ? (
                      <div className="text-center py-8">
                        <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                        <p className="text-muted-foreground mb-4">You haven't joined any squads yet</p>
                        <Button variant="outline" onClick={() => setShowCreateSquadDialog(true)}>
                          <Plus className="w-4 h-4 mr-2" />
                          Create Your First Squad
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-3">
                          {squads.map((squad) => (
                            <div
                              key={squad.id}
                              className="flex items-center justify-between p-3 border border-border rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                {squad.avatar && (
                                  <Avatar className="w-10 h-10">
                                    <AvatarImage src={getImageUrl(squad.avatar)} />
                                    <AvatarFallback>
                                      {squad.name?.[0] || "S"}
                                    </AvatarFallback>
                                  </Avatar>
                                )}
                                <div>
                                  <p className="font-medium">{squad.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {squad.members} {squad.members === 1 ? 'member' : 'members'}
                                    {squad.role && ` • ${squad.role.charAt(0).toUpperCase() + squad.role.slice(1)}`}
                                  </p>
                                </div>
                              </div>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleSquadManage(squad.id)}
                              >
                                Manage
                              </Button>
                            </div>
                          ))}
                        </div>
                        <Button 
                          variant="outline" 
                          className="w-full mt-4 bg-transparent"
                          onClick={() => setShowCreateSquadDialog(true)}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Create New Squad
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Event Participation</CardTitle>
                    <CardDescription>Control how you interact with events</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Auto-join Squad Events</p>
                          <p className="text-sm text-muted-foreground">Automatically join events from your squads</p>
                        </div>
                      </div>
                      <Switch 
                        checked={communityPreferences.autoJoinSquadEvents}
                        onCheckedChange={(checked) => {
                          setCommunityPreferences({ ...communityPreferences, autoJoinSquadEvents: checked })
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Bell className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">RSVP Reminders</p>
                          <p className="text-sm text-muted-foreground">Get reminded to RSVP to events</p>
                        </div>
                      </div>
                      <Switch 
                        checked={communityPreferences.rsvpReminders}
                        onCheckedChange={(checked) => {
                          setCommunityPreferences({ ...communityPreferences, rsvpReminders: checked })
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Interaction Preferences</CardTitle>
                    <CardDescription>Control how others can interact with your content</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Award className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Allow Awards</p>
                          <p className="text-sm text-muted-foreground">
                            Let others give you awards for your contributions
                          </p>
                        </div>
                      </div>
                      <Switch 
                        checked={communityPreferences.allowAwards}
                        onCheckedChange={(checked) => {
                          setCommunityPreferences({ ...communityPreferences, allowAwards: checked })
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <MessageSquare className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Show Feedback Buttons</p>
                          <p className="text-sm text-muted-foreground">
                            Display like and reaction buttons on your posts
                          </p>
                        </div>
                      </div>
                      <Switch 
                        checked={communityPreferences.showFeedbackButtons}
                        onCheckedChange={(checked) => {
                          setCommunityPreferences({ ...communityPreferences, showFeedbackButtons: checked })
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Legal & Support */}
            {activeSection === "legal" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-bold text-foreground mb-2">Legal & Support</h2>
                  <p className="text-muted-foreground">Access legal documents and get help</p>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Legal Documents</CardTitle>
                    <CardDescription>Review our terms, policies, and transparency reports</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      { title: "Terms of Service", description: "Our terms and conditions" },
                      { title: "Privacy Policy", description: "How we handle your data" },
                      {
                        title: "Transparency Report",
                        description: "How donations are handled and platform accountability",
                      },
                      { title: "Community Guidelines", description: "Rules for using CauseConnect" },
                    ].map((doc, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 border border-border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{doc.title}</p>
                          <p className="text-sm text-muted-foreground">{doc.description}</p>
                        </div>
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
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Impact Tracker</CardTitle>
                    <CardDescription>See how your donations and support have helped</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingImpactStats ? (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">Loading impact statistics...</p>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="text-center p-4 bg-muted rounded-lg">
                            <p className="text-2xl font-bold text-primary">
                              ${impactStats.totalDonated.toFixed(2)}
                            </p>
                            <p className="text-sm text-muted-foreground">Total Donated</p>
                          </div>
                          <div className="text-center p-4 bg-muted rounded-lg">
                            <p className="text-2xl font-bold text-primary">
                              {impactStats.causesSupported}
                            </p>
                            <p className="text-sm text-muted-foreground">Causes Supported</p>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          className="w-full bg-transparent"
                          onClick={() => {
                            // Navigate to donation history or impact report page
                            window.location.href = '/settings?section=payments'
                          }}
                        >
                          View Full Impact Report
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Volunteering</CardTitle>
                    <CardDescription>Manage your volunteer preferences and availability</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Available for Volunteering</p>
                        <p className="text-sm text-muted-foreground">Get notified about volunteer opportunities</p>
                      </div>
                      <Switch 
                        checked={volunteeringPreferences.availableForVolunteering}
                        onCheckedChange={(checked) => {
                          setVolunteeringPreferences({
                            ...volunteeringPreferences,
                            availableForVolunteering: checked,
                          })
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Preferred Volunteer Activities</Label>
                      <div className="flex flex-wrap gap-2">
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
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Support & Feedback</CardTitle>
                    <CardDescription>Get help or report issues</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
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
                    <Button 
                      variant="outline" 
                      className="w-full justify-start bg-transparent"
                      onClick={() => {
                        setSupportType('contact')
                        setShowSupportDialog(true)
                      }}
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Contact Support
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start bg-transparent"
                      onClick={() => {
                        setSupportType('report')
                        setShowSupportDialog(true)
                      }}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Report an Issue
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Save Button */}
            <div className="flex justify-end pt-6 border-t border-border">
              <Button 
                size="lg" 
                className="px-8"
                onClick={activeSection === "account" ? handleSaveProfile : handleSaveSettings}
                disabled={isSaving || isLoading}
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Password Change Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>Enter your current password and choose a new one.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="oldPassword">Current Password</Label>
              <Input
                id="oldPassword"
                type="password"
                value={passwordData.oldPassword}
                onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleChangePassword} disabled={isSaving}>
              {isSaving ? "Changing..." : "Change Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email Change Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Email</DialogTitle>
            <DialogDescription>Enter your new email address.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newEmail">New Email</Label>
              <Input
                id="newEmail"
                type="email"
                value={emailData.newEmail}
                onChange={(e) => setEmailData({ newEmail: e.target.value })}
                placeholder={user?.email}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEmailDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                try {
                  setIsSaving(true)
                  await userService.updateProfile({ email: emailData.newEmail })
                  await refreshUser()
                  toast.success("Email updated successfully!")
                  setShowEmailDialog(false)
                  setEmailData({ newEmail: "" })
                } catch (error: any) {
                  toast.error(error.message || "Failed to update email")
                } finally {
                  setIsSaving(false)
                }
              }}
              disabled={isSaving || !emailData.newEmail}
            >
              {isSaving ? "Updating..." : "Update Email"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Avatar Cropper Dialog */}
      {avatarPreview && (
        <ImageCropper
          open={showAvatarDialog}
          onClose={() => {
            setShowAvatarDialog(false)
            setAvatarPreview("")
          }}
          imageSrc={avatarPreview}
          onCropComplete={handleAvatarCrop}
          aspectRatio={1}
          cropShape="round"
        />
      )}

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
            <DialogDescription>
              {selectedLegalDoc === 'terms-of-service' && 'Our terms and conditions for using CauseConnect'}
              {selectedLegalDoc === 'privacy-policy' && 'How we handle your personal data and privacy'}
              {selectedLegalDoc === 'transparency-report' && 'How donations are handled and platform accountability'}
              {selectedLegalDoc === 'community-guidelines' && 'Rules and guidelines for using CauseConnect'}
            </DialogDescription>
          </DialogHeader>
          <div className="prose max-w-none dark:prose-invert">
            {selectedLegalDoc === 'terms-of-service' && (
              <div className="space-y-4">
                <h3>Terms of Service</h3>
                <p>Last updated: {new Date().toLocaleDateString()}</p>
                <p>By using CauseConnect, you agree to these terms and conditions. Please read them carefully.</p>
                <h4>1. Acceptance of Terms</h4>
                <p>By accessing and using CauseConnect, you accept and agree to be bound by the terms and provision of this agreement.</p>
                <h4>2. Use License</h4>
                <p>Permission is granted to temporarily use CauseConnect for personal, non-commercial transitory viewing only.</p>
                <h4>3. User Responsibilities</h4>
                <p>Users are responsible for maintaining the confidentiality of their account credentials and for all activities that occur under their account.</p>
                <p className="text-sm text-muted-foreground">Full terms of service will be available in the production version.</p>
              </div>
            )}
            {selectedLegalDoc === 'privacy-policy' && (
              <div className="space-y-4">
                <h3>Privacy Policy</h3>
                <p>Last updated: {new Date().toLocaleDateString()}</p>
                <p>We respect your privacy and are committed to protecting your personal data.</p>
                <h4>1. Information We Collect</h4>
                <p>We collect information that you provide directly to us, including your name, email address, and payment information.</p>
                <h4>2. How We Use Your Information</h4>
                <p>We use your information to provide, maintain, and improve our services, process transactions, and communicate with you.</p>
                <h4>3. Data Security</h4>
                <p>We implement appropriate security measures to protect your personal information from unauthorized access, alteration, disclosure, or destruction.</p>
                <p className="text-sm text-muted-foreground">Full privacy policy will be available in the production version.</p>
              </div>
            )}
            {selectedLegalDoc === 'transparency-report' && (
              <div className="space-y-4">
                <h3>Transparency Report</h3>
                <p>Last updated: {new Date().toLocaleDateString()}</p>
                <p>We believe in transparency and accountability in how donations are processed and funds are distributed.</p>
                <h4>1. Donation Processing</h4>
                <p>All donations are processed securely through Stripe. CauseConnect charges a small platform fee to cover operational costs.</p>
                <h4>2. Fund Distribution</h4>
                <p>Funds are transferred directly to the cause organizers. We maintain detailed records of all transactions for accountability.</p>
                <h4>3. Financial Transparency</h4>
                <p>We publish quarterly reports on platform fees, donation volumes, and fund distributions to maintain transparency.</p>
                <p className="text-sm text-muted-foreground">Full transparency report will be available in the production version.</p>
              </div>
            )}
            {selectedLegalDoc === 'community-guidelines' && (
              <div className="space-y-4">
                <h3>Community Guidelines</h3>
                <p>Last updated: {new Date().toLocaleDateString()}</p>
                <p>These guidelines help create a safe and welcoming community for everyone on CauseConnect.</p>
                <h4>1. Be Respectful</h4>
                <p>Treat all community members with respect and kindness. Harassment, hate speech, or abusive behavior will not be tolerated.</p>
                <h4>2. Authentic Content</h4>
                <p>Share genuine causes and authentic content. Misleading or fraudulent content is strictly prohibited.</p>
                <h4>3. Privacy and Safety</h4>
                <p>Respect others' privacy and report any content that violates our safety standards.</p>
                <h4>4. Compliance</h4>
                <p>Follow all applicable laws and regulations when creating causes and organizing events.</p>
                <p className="text-sm text-muted-foreground">Full community guidelines will be available in the production version.</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLegalDocDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
              {supportType === 'help' && 'Find answers to common questions and get help using CauseConnect'}
              {supportType === 'contact' && 'Get in touch with our support team'}
              {supportType === 'report' && 'Report a problem or issue you encountered'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {supportType === 'help' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">Frequently Asked Questions</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="font-medium">How do I create a cause?</p>
                      <p className="text-sm text-muted-foreground">
                        Go to the "Create Cause" page and fill in the details about your cause. Make sure to include compelling images and descriptions.
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">How are donations processed?</p>
                      <p className="text-sm text-muted-foreground">
                        Donations are securely processed through Stripe. Funds are transferred directly to the cause organizer.
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Can I donate anonymously?</p>
                      <p className="text-sm text-muted-foreground">
                        Yes, you can choose to make your donation anonymous when completing the donation process.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Need more help? Contact our support team below.
                  </p>
                </div>
              </div>
            )}
            {(supportType === 'contact' || supportType === 'report') && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="support-message">
                    {supportType === 'contact' ? 'Your Message' : 'Describe the Issue'}
                  </Label>
                  <Textarea
                    id="support-message"
                    value={supportMessage}
                    onChange={(e) => setSupportMessage(e.target.value)}
                    placeholder={
                      supportType === 'contact'
                        ? "Describe your question or issue and we'll get back to you as soon as possible..."
                        : "Describe the problem you encountered, including any error messages or steps to reproduce..."
                    }
                    rows={6}
                    className="resize-none"
                  />
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>We typically respond within 24-48 hours.</p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowSupportDialog(false)
                setSupportMessage("")
                setSupportType(null)
              }}
            >
              Cancel
            </Button>
            {(supportType === 'contact' || supportType === 'report') && (
              <Button
                onClick={async () => {
                  if (!supportMessage.trim()) {
                    toast.error("Please enter a message")
                    return
                  }
                  try {
                    // TODO: Implement backend API endpoint to send support messages
                    // For now, just show success message
                    toast.success(
                      supportType === 'contact'
                        ? "Your message has been sent. We'll get back to you soon!"
                        : "Your report has been submitted. Thank you for helping us improve!"
                    )
                    setShowSupportDialog(false)
                    setSupportMessage("")
                    setSupportType(null)
                  } catch (error: any) {
                    toast.error(error.message || "Failed to send message")
                  }
                }}
              >
                {supportType === 'contact' ? 'Send Message' : 'Submit Report'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Squad Dialog */}
      <Dialog open={showCreateSquadDialog} onOpenChange={setShowCreateSquadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Squad</DialogTitle>
            <DialogDescription>
              Create a new group to organize events and collaborate with others.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="squadName">Squad Name *</Label>
              <Input
                id="squadName"
                placeholder="e.g., Environmental Warriors"
                value={createSquadData.name}
                onChange={(e) => setCreateSquadData({ ...createSquadData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="squadDescription">Description</Label>
              <Textarea
                id="squadDescription"
                placeholder="What is this squad about?"
                value={createSquadData.description}
                onChange={(e) => setCreateSquadData({ ...createSquadData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="squadAvatar">Avatar (Optional)</Label>
              <Input
                id="squadAvatar"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    setCreateSquadData({ ...createSquadData, avatar: file })
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateSquadDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateSquad} disabled={isSaving || !createSquadData.name.trim()}>
              {isSaving ? "Creating..." : "Create Squad"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
