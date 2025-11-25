"use client"

import { Card, CardContent } from "@/components/ui/card"
import { FeedHeader } from "@/components/feed-header"
import { Plus, Rss } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function FeedsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10">
      <FeedHeader />

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Rss className="w-6 h-6 text-foreground" />
            <h1 className="text-2xl font-bold text-foreground">Custom Feeds</h1>
          </div>

          <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <Rss className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No custom feeds yet</h3>
              <p className="text-muted-foreground mb-4">
                Create custom feeds to organize events and posts by your interests.
              </p>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Custom Feed
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}






