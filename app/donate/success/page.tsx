"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Heart, Share2, Download, ArrowRight } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

export default function DonationSuccessPage() {
  const searchParams = useSearchParams()
  const [amount, setAmount] = useState("")
  const [eventTitle, setEventTitle] = useState("")

  useEffect(() => {
    setAmount(searchParams.get("amount") || "0")
    setEventTitle(searchParams.get("event") || "Unknown Event")
  }, [searchParams])

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: "I just donated to a great cause!",
        text: `I donated $${amount} to ${eventTitle} on CauseConnect. Join me in making a difference!`,
        url: window.location.origin,
      })
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(
        `I donated $${amount} to ${eventTitle} on CauseConnect. Join me in making a difference! ${window.location.origin}`,
      )
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-orange-50/30 to-peach-50/30 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-8">
        {/* Success Message */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Thank You!</h1>
          <p className="text-lg text-muted-foreground">Your donation has been successfully processed</p>
        </div>

        {/* Donation Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              Donation Confirmation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-foreground mb-2">Amount Donated</h3>
                <div className="text-3xl font-bold text-primary">${amount}</div>
              </div>
              <div>
                <h3 className="font-medium text-foreground mb-2">Cause Supported</h3>
                <p className="text-muted-foreground">{eventTitle}</p>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="font-medium text-foreground mb-4">What happens next?</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-primary">1</span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Receipt sent</p>
                    <p className="text-sm text-muted-foreground">
                      A tax-deductible receipt has been sent to your email
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-primary">2</span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Funds transferred</p>
                    <p className="text-sm text-muted-foreground">
                      Your donation will be transferred to the organization within 2-3 business days
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-primary">3</span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Updates provided</p>
                    <p className="text-sm text-muted-foreground">
                      You'll receive updates on how your donation is making an impact
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button onClick={handleShare} variant="outline" className="h-12 bg-transparent">
            <Share2 className="h-4 w-4 mr-2" />
            Share Your Impact
          </Button>
          <Button variant="outline" className="h-12 bg-transparent">
            <Download className="h-4 w-4 mr-2" />
            Download Receipt
          </Button>
        </div>

        {/* Next Steps */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-medium text-foreground mb-4">Continue Making a Difference</h3>
            <div className="space-y-3">
              <Button asChild className="w-full justify-between">
                <Link href="/feed">
                  Discover More Causes
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full justify-between bg-transparent">
                <Link href="/profile">
                  View Your Impact
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Achievement Badge */}
        <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
          <CardContent className="p-6 text-center">
            <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
              <Heart className="h-8 w-8 text-yellow-600" />
            </div>
            <h3 className="font-medium text-foreground mb-2">Achievement Unlocked!</h3>
            <p className="text-sm text-muted-foreground mb-4">
              You've earned the "Generous Heart" badge for your donation
            </p>
            <Badge className="bg-yellow-500 hover:bg-yellow-600">Generous Heart</Badge>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
