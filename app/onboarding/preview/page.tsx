"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Heart, MessageCircle, Share2, Bookmark, ArrowLeft, CheckCircle, ArrowRight } from "lucide-react"
import Link from "next/link"

const SAMPLE_POSTS = [
  {
    id: 1,
    title: "Clean Water Initiative in Rural Kenya",
    description:
      "Help us bring clean, safe drinking water to 500 families in rural Kenya. Every donation helps build sustainable water systems.",
    image: "/clean-water-well-in-kenya-village.jpg",
    tags: ["Water", "Health", "Africa"],
    supporters: 234,
    goal: 50000,
    raised: 32000,
    organization: "Water for All",
  },
  {
    id: 2,
    title: "Education Scholarships for Underprivileged Youth",
    description:
      "Providing educational opportunities for children who cannot afford school fees. Your support can change a life forever.",
    image: "/children-studying-in-classroom.jpg",
    tags: ["Education", "Youth", "Scholarships"],
    supporters: 156,
    goal: 25000,
    raised: 18500,
    organization: "Future Leaders Foundation",
  },
]

export default function OnboardingPreview() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Progress indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-2 bg-primary rounded-full"></div>
            <div className="w-8 h-2 bg-primary rounded-full"></div>
            <div className="w-8 h-2 bg-primary rounded-full"></div>
            <div className="w-8 h-2 bg-primary rounded-full"></div>
          </div>
        </div>

        {/* Header */}
        <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm mb-8">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">Here's your personalized feed</CardTitle>
            <CardDescription className="text-lg">
              Based on your interests, here are some causes we think you'll care about.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Sample Feed */}
        <div className="space-y-6 mb-8">
          {SAMPLE_POSTS.map((post) => (
            <Card key={post.id} className="border-0 shadow-lg bg-card/80 backdrop-blur-sm overflow-hidden">
              <div className="md:flex">
                <div className="md:w-1/3">
                  <img
                    src={post.image || "/placeholder.svg"}
                    alt={post.title}
                    className="w-full h-48 md:h-full object-cover"
                  />
                </div>
                <div className="md:w-2/3 p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm font-medium text-muted-foreground">{post.organization}</span>
                    <CheckCircle className="w-4 h-4 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">{post.title}</h3>
                  <p className="text-muted-foreground mb-4">{post.description}</p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {post.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  {/* Progress bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">${post.raised.toLocaleString()} raised</span>
                      <span className="text-muted-foreground">${post.goal.toLocaleString()} goal</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{ width: `${(post.raised / post.goal) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-4">
                    <Button size="sm" className="flex items-center gap-2">
                      <Heart className="w-4 h-4" />
                      Support
                    </Button>
                    <Button size="sm" variant="outline" className="flex items-center gap-2 bg-transparent">
                      <MessageCircle className="w-4 h-4" />
                      Comment
                    </Button>
                    <Button size="sm" variant="outline" className="flex items-center gap-2 bg-transparent">
                      <Share2 className="w-4 h-4" />
                      Share
                    </Button>
                    <Button size="sm" variant="outline" className="flex items-center gap-2 bg-transparent">
                      <Bookmark className="w-4 h-4" />
                      Save
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Final CTA */}
        <Card className="border-0 shadow-xl bg-gradient-to-r from-primary/5 to-accent/5 backdrop-blur-sm">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl font-bold text-foreground mb-4">Ready to start making an impact?</h3>
            <p className="text-muted-foreground mb-6">
              Your personalized feed is ready! Start discovering and supporting causes that matter to you.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Button variant="outline" asChild>
                <Link href="/onboarding/preferences">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Link>
              </Button>
              <Button size="lg" asChild>
                <Link href="/feed">
                  Enter CauseConnect
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
