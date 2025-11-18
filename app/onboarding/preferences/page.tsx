"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowRight, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function OnboardingPreferences() {
  const [feedType, setFeedType] = useState("balanced")
  const [notifications, setNotifications] = useState({
    newCauses: true,
    updates: true,
    messages: false,
    weekly: true,
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-2 bg-primary rounded-full"></div>
            <div className="w-8 h-2 bg-primary rounded-full"></div>
            <div className="w-8 h-2 bg-primary rounded-full"></div>
            <div className="w-8 h-2 bg-muted rounded-full"></div>
          </div>
        </div>

        <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">Customize your experience</CardTitle>
            <CardDescription className="text-lg">
              Tell us how you'd like to discover and engage with causes.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            {/* Feed Preferences */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Feed Preferences</h3>
              <RadioGroup value={feedType} onValueChange={setFeedType}>
                <div className="flex items-center space-x-3 p-4 rounded-lg border border-border hover:bg-secondary/50 transition-colors">
                  <RadioGroupItem value="trending" id="trending" />
                  <Label htmlFor="trending" className="flex-1 cursor-pointer">
                    <div className="font-medium">Trending Causes</div>
                    <div className="text-sm text-muted-foreground">See the most popular and urgent causes</div>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-4 rounded-lg border border-border hover:bg-secondary/50 transition-colors">
                  <RadioGroupItem value="balanced" id="balanced" />
                  <Label htmlFor="balanced" className="flex-1 cursor-pointer">
                    <div className="font-medium">Balanced Mix</div>
                    <div className="text-sm text-muted-foreground">A mix of trending and personalized content</div>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-4 rounded-lg border border-border hover:bg-secondary/50 transition-colors">
                  <RadioGroupItem value="personalized" id="personalized" />
                  <Label htmlFor="personalized" className="flex-1 cursor-pointer">
                    <div className="font-medium">Highly Personalized</div>
                    <div className="text-sm text-muted-foreground">
                      Focus on your selected interests and connections
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Notification Preferences */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Notification Preferences</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="newCauses"
                    checked={notifications.newCauses}
                    onCheckedChange={(checked) =>
                      setNotifications((prev) => ({ ...prev, newCauses: checked as boolean }))
                    }
                  />
                  <Label htmlFor="newCauses" className="flex-1 cursor-pointer">
                    <div className="font-medium">New Causes</div>
                    <div className="text-sm text-muted-foreground">
                      Get notified about new causes in your areas of interest
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="updates"
                    checked={notifications.updates}
                    onCheckedChange={(checked) =>
                      setNotifications((prev) => ({ ...prev, updates: checked as boolean }))
                    }
                  />
                  <Label htmlFor="updates" className="flex-1 cursor-pointer">
                    <div className="font-medium">Cause Updates</div>
                    <div className="text-sm text-muted-foreground">Updates from causes you follow</div>
                  </Label>
                </div>
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="messages"
                    checked={notifications.messages}
                    onCheckedChange={(checked) =>
                      setNotifications((prev) => ({ ...prev, messages: checked as boolean }))
                    }
                  />
                  <Label htmlFor="messages" className="flex-1 cursor-pointer">
                    <div className="font-medium">Direct Messages</div>
                    <div className="text-sm text-muted-foreground">Messages from other supporters</div>
                  </Label>
                </div>
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="weekly"
                    checked={notifications.weekly}
                    onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, weekly: checked as boolean }))}
                  />
                  <Label htmlFor="weekly" className="flex-1 cursor-pointer">
                    <div className="font-medium">Weekly Summary</div>
                    <div className="text-sm text-muted-foreground">
                      Weekly digest of your impact and new opportunities
                    </div>
                  </Label>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4">
              <Button variant="outline" asChild>
                <Link href="/onboarding/tags">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Link>
              </Button>
              <Button asChild>
                <Link href="/onboarding/preview">
                  Preview Feed
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
