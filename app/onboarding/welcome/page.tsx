"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Heart, ArrowRight, Users, Globe, Star } from "lucide-react"
import Link from "next/link"

export default function OnboardingWelcome() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-2 bg-primary rounded-full"></div>
            <div className="w-8 h-2 bg-muted rounded-full"></div>
            <div className="w-8 h-2 bg-muted rounded-full"></div>
            <div className="w-8 h-2 bg-muted rounded-full"></div>
          </div>
        </div>

        <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm text-center">
          <CardContent className="p-12">
            {/* Logo */}
            <div className="flex items-center justify-center gap-2 mb-8">
              <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center">
                <Heart className="w-8 h-8 text-primary-foreground" />
              </div>
            </div>

            <h1 className="text-4xl font-bold text-foreground mb-4">Welcome to CauseConnect!</h1>
            <p className="text-xl text-muted-foreground mb-12 max-w-lg mx-auto">
              You're about to join a community of changemakers. Let's personalize your experience to help you discover
              causes that matter to you.
            </p>

            {/* Features preview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-3">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">Connect</h3>
                <p className="text-sm text-muted-foreground">Find like-minded supporters</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mb-3">
                  <Globe className="w-6 h-6 text-accent" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">Discover</h3>
                <p className="text-sm text-muted-foreground">Explore impactful causes</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-3">
                  <Star className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">Impact</h3>
                <p className="text-sm text-muted-foreground">Make a real difference</p>
              </div>
            </div>

            <Button size="lg" className="text-lg px-8" asChild>
              <Link href="/onboarding/tags">
                Let's Get Started
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
