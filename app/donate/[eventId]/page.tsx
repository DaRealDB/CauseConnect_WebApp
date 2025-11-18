"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Heart, Shield, CreditCard, Banknote, Smartphone, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

export default function DonatePage({ params }: { params: { eventId: string } }) {
  const router = useRouter()
  const [amount, setAmount] = useState("")
  const [customAmount, setCustomAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("card")
  const [isRecurring, setIsRecurring] = useState(false)
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [message, setMessage] = useState("")
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")

  const suggestedAmounts = ["10", "25", "50", "100", "250", "500"]

  // Mock event data
  const event = {
    id: params.eventId,
    title: "Clean Water Initiative for Rural Kenya",
    organization: "Water for Life Foundation",
    image: "/clean-water-well-in-kenya-village.jpg",
    raised: 37500,
    goal: 50000,
    supporters: 234,
    description:
      "Help us bring clean, safe drinking water to rural communities in Kenya by building sustainable wells and water purification systems.",
  }

  const progress = (event.raised / event.goal) * 100

  const handleAmountSelect = (selectedAmount: string) => {
    setAmount(selectedAmount)
    setCustomAmount("")
  }

  const handleCustomAmount = (value: string) => {
    setCustomAmount(value)
    setAmount("")
  }

  const getCurrentAmount = () => {
    return customAmount || amount
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const donationAmount = getCurrentAmount()
    if (!donationAmount || Number.parseFloat(donationAmount) <= 0) return

    console.log("[v0] Processing donation:", {
      eventId: params.eventId,
      amount: donationAmount,
      paymentMethod,
      isRecurring,
      isAnonymous,
      message,
      email,
      name,
    })

    // Simulate payment processing
    setTimeout(() => {
      router.push(`/donate/success?amount=${donationAmount}&event=${encodeURIComponent(event.title)}`)
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-orange-50/30 to-peach-50/30">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => router.back()} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Event
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Event Summary */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="aspect-video rounded-lg overflow-hidden mb-4">
                  <img
                    src={event.image || "/placeholder.svg"}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-2">{event.title}</h1>
                <p className="text-muted-foreground mb-4">by {event.organization}</p>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{Math.round(progress)}% funded</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-foreground">${event.raised.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">raised</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-foreground">{event.supporters}</div>
                      <div className="text-sm text-muted-foreground">supporters</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-500" />
                  Secure Donation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>SSL encrypted and secure</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>100% of your donation goes to the cause</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Tax-deductible receipt provided</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Donation Form */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-red-500" />
                  Make a Donation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Amount Selection */}
                  <div>
                    <Label className="text-base font-medium mb-4 block">Choose Amount</Label>
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      {suggestedAmounts.map((suggestedAmount) => (
                        <Button
                          key={suggestedAmount}
                          type="button"
                          variant={amount === suggestedAmount ? "default" : "outline"}
                          onClick={() => handleAmountSelect(suggestedAmount)}
                          className="h-12"
                        >
                          ${suggestedAmount}
                        </Button>
                      ))}
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                        $
                      </span>
                      <Input
                        type="number"
                        placeholder="Custom amount"
                        value={customAmount}
                        onChange={(e) => handleCustomAmount(e.target.value)}
                        className="pl-8"
                        min="1"
                        step="0.01"
                      />
                    </div>
                  </div>

                  {/* Recurring Donation */}
                  <div className="flex items-center space-x-2">
                    <Checkbox id="recurring" checked={isRecurring} onCheckedChange={setIsRecurring} />
                    <Label htmlFor="recurring" className="text-sm">
                      Make this a monthly recurring donation
                    </Label>
                  </div>

                  {/* Payment Method */}
                  <div>
                    <Label className="text-base font-medium mb-4 block">Payment Method</Label>
                    <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="card" id="card" />
                        <Label htmlFor="card" className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          Credit/Debit Card
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="paypal" id="paypal" />
                        <Label htmlFor="paypal" className="flex items-center gap-2">
                          <Banknote className="h-4 w-4" />
                          PayPal
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="apple" id="apple" />
                        <Label htmlFor="apple" className="flex items-center gap-2">
                          <Smartphone className="h-4 w-4" />
                          Apple Pay
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Personal Information */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your full name"
                        required={!isAnonymous}
                        disabled={isAnonymous}
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        required
                      />
                    </div>
                  </div>

                  {/* Anonymous Donation */}
                  <div className="flex items-center space-x-2">
                    <Checkbox id="anonymous" checked={isAnonymous} onCheckedChange={setIsAnonymous} />
                    <Label htmlFor="anonymous" className="text-sm">
                      Make this donation anonymous
                    </Label>
                  </div>

                  {/* Message */}
                  <div>
                    <Label htmlFor="message">Message (Optional)</Label>
                    <Textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Leave a message of support..."
                      rows={3}
                    />
                  </div>

                  {/* Total */}
                  {getCurrentAmount() && (
                    <Card className="bg-primary/5 border-primary/20">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{isRecurring ? "Monthly Donation" : "One-time Donation"}</span>
                          <span className="text-2xl font-bold text-primary">${getCurrentAmount()}</span>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Submit */}
                  <Button
                    type="submit"
                    className="w-full h-12 text-lg"
                    disabled={!getCurrentAmount() || Number.parseFloat(getCurrentAmount()) <= 0}
                  >
                    <Heart className="h-5 w-5 mr-2" />
                    Donate ${getCurrentAmount() || "0"}
                  </Button>

                  <div className="text-xs text-muted-foreground text-center">
                    By donating, you agree to our Terms of Service and Privacy Policy. Your donation is secure and
                    encrypted.
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
