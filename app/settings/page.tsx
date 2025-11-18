"use client"

import { useState } from "react"
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

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState("account")
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
    activityVisibility: "friends",
    twoFactor: false,
  })
  const [theme, setTheme] = useState("system")

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
                        <AvatarImage src="/user-profile-illustration.png" />
                        <AvatarFallback>JD</AvatarFallback>
                      </Avatar>
                      <div>
                        <Button variant="outline" size="sm">
                          <Camera className="w-4 h-4 mr-2" />
                          Change Photo
                        </Button>
                        <p className="text-sm text-muted-foreground mt-2">JPG, PNG or GIF. Max size 2MB.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input id="firstName" defaultValue="John" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input id="lastName" defaultValue="Doe" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input id="username" defaultValue="johndoe" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea id="bio" placeholder="Tell us about yourself..." className="min-h-[100px]" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input id="location" placeholder="City, Country" />
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
                          <p className="font-medium">john.doe@example.com</p>
                          <p className="text-sm text-muted-foreground">Primary email</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Change
                      </Button>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Smartphone className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">+1 (555) 123-4567</p>
                          <p className="text-sm text-muted-foreground">Phone number</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
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
                    <Button variant="outline" className="w-full justify-start bg-transparent">
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
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                        <div>
                          <p className="font-medium">Current Session</p>
                          <p className="text-sm text-muted-foreground">Chrome on MacOS • San Francisco, CA</p>
                        </div>
                        <Badge variant="secondary">Active</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                        <div>
                          <p className="font-medium">Mobile App</p>
                          <p className="text-sm text-muted-foreground">iPhone • 2 hours ago</p>
                        </div>
                        <Button variant="outline" size="sm">
                          Revoke
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Blocked Users</CardTitle>
                    <CardDescription>Manage users you've blocked</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <UserX className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No blocked users</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Data Export</CardTitle>
                    <CardDescription>Download a copy of your account data</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      <Download className="w-4 h-4 mr-2" />
                      Export Account Data
                    </Button>
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

                <Card>
                  <CardHeader>
                    <CardTitle>Payment Methods</CardTitle>
                    <CardDescription>Manage your saved payment methods</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-6 bg-primary rounded flex items-center justify-center">
                          <span className="text-xs font-bold text-primary-foreground">VISA</span>
                        </div>
                        <div>
                          <p className="font-medium">•••• •••• •••• 4242</p>
                          <p className="text-sm text-muted-foreground">Expires 12/25</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="secondary">Default</Badge>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Payment Method
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Donation History</CardTitle>
                    <CardDescription>View your past donations and receipts</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        { cause: "Clean Water Initiative", amount: "$50", date: "Dec 15, 2024", status: "Completed" },
                        { cause: "Education for All", amount: "$25", date: "Dec 10, 2024", status: "Completed" },
                        { cause: "Food Bank Support", amount: "$100", date: "Dec 5, 2024", status: "Completed" },
                      ].map((donation, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 border border-border rounded-lg"
                        >
                          <div>
                            <p className="font-medium">{donation.cause}</p>
                            <p className="text-sm text-muted-foreground">{donation.date}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{donation.amount}</p>
                            <Badge variant="secondary" className="text-xs">
                              {donation.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recurring Donations</CardTitle>
                    <CardDescription>Manage your monthly subscriptions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No recurring donations set up</p>
                      <Button variant="outline" className="mt-4 bg-transparent">
                        Set Up Recurring Donation
                      </Button>
                    </div>
                  </CardContent>
                </Card>
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
                    <div className="flex flex-wrap gap-2 mb-4">
                      {[
                        "Education",
                        "Environment",
                        "Health",
                        "Poverty",
                        "Animals",
                        "Human Rights",
                        "Disaster Relief",
                        "Community",
                      ].map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                        >
                          {tag}
                          <X className="w-3 h-3 ml-1" />
                        </Badge>
                      ))}
                    </div>
                    <Button variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Interest
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Language & Region</CardTitle>
                    <CardDescription>Set your preferred language and location</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Language</Label>
                      <Select defaultValue="en">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="es">Español</SelectItem>
                          <SelectItem value="fr">Français</SelectItem>
                          <SelectItem value="de">Deutsch</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Region</Label>
                      <Select defaultValue="us">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="us">United States</SelectItem>
                          <SelectItem value="ca">Canada</SelectItem>
                          <SelectItem value="uk">United Kingdom</SelectItem>
                          <SelectItem value="au">Australia</SelectItem>
                        </SelectContent>
                      </Select>
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
                        return (
                          <button
                            key={option.value}
                            onClick={() => setTheme(option.value)}
                            className={`p-4 border border-border rounded-lg text-center transition-colors ${
                              theme === option.value ? "border-primary bg-primary/5" : "hover:bg-muted"
                            }`}
                          >
                            <Icon className="w-6 h-6 mx-auto mb-2" />
                            <p className="font-medium">{option.label}</p>
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
                      <Switch />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Volume2 className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Screen Reader Support</p>
                          <p className="text-sm text-muted-foreground">Optimize for screen readers</p>
                        </div>
                      </div>
                      <Switch />
                    </div>
                    <div className="space-y-2">
                      <Label>Text Size</Label>
                      <Select defaultValue="medium">
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
                    <div className="space-y-3">
                      {[
                        { name: "Environmental Warriors", members: 156, role: "Admin" },
                        { name: "Education Advocates", members: 89, role: "Member" },
                        { name: "Local Food Bank", members: 234, role: "Moderator" },
                      ].map((squad, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 border border-border rounded-lg"
                        >
                          <div>
                            <p className="font-medium">{squad.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {squad.members} members • {squad.role}
                            </p>
                          </div>
                          <Button variant="outline" size="sm">
                            Manage
                          </Button>
                        </div>
                      ))}
                    </div>
                    <Button variant="outline" className="w-full mt-4 bg-transparent">
                      <Plus className="w-4 h-4 mr-2" />
                      Create New Squad
                    </Button>
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
                      <Switch />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Bell className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">RSVP Reminders</p>
                          <p className="text-sm text-muted-foreground">Get reminded to RSVP to events</p>
                        </div>
                      </div>
                      <Switch defaultChecked />
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
                      <Switch defaultChecked />
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
                      <Switch defaultChecked />
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
                        <Button variant="outline" size="sm">
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
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <p className="text-2xl font-bold text-primary">$275</p>
                        <p className="text-sm text-muted-foreground">Total Donated</p>
                      </div>
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <p className="text-2xl font-bold text-primary">12</p>
                        <p className="text-sm text-muted-foreground">Causes Supported</p>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full bg-transparent">
                      View Full Impact Report
                    </Button>
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
                      <Switch />
                    </div>
                    <div className="space-y-2">
                      <Label>Preferred Volunteer Activities</Label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          "Event Organization",
                          "Fundraising",
                          "Community Outreach",
                          "Administrative",
                          "Hands-on Work",
                        ].map((activity) => (
                          <Badge
                            key={activity}
                            variant="outline"
                            className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
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
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      <HelpCircle className="w-4 h-4 mr-2" />
                      Help Center
                    </Button>
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Contact Support
                    </Button>
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Report an Issue
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Save Button */}
            <div className="flex justify-end pt-6 border-t border-border">
              <Button size="lg" className="px-8">
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
