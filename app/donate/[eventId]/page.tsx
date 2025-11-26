"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Heart, Shield, CreditCard, Banknote, Smartphone, ArrowLeft, CheckCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useRouter, useParams } from "next/navigation"
import { eventService, paymentService } from "@/lib/api/services"
import { toast } from "sonner"
import { useCurrency } from "@/contexts/CurrencyContext"
import { useAuth } from "@/contexts/AuthContext"
import type { PaymentMethod } from "@/lib/api/types"
import { loadStripe, StripeElementsOptions } from "@stripe/stripe-js"
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js"

const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
const stripePromise = STRIPE_PUBLISHABLE_KEY ? loadStripe(STRIPE_PUBLISHABLE_KEY) : null

// Stripe Payment Form Component
function StripePaymentForm({ 
  eventId, 
  amount, 
  paymentMethodId, 
  isAnonymous, 
  message, 
  onSuccess, 
  onCancel 
}: { 
  eventId: string
  amount: number
  paymentMethodId?: string
  isAnonymous: boolean
  message?: string
  onSuccess: () => void
  onCancel: () => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)

  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        const result = await paymentService.createPaymentIntent({
          eventId,
          amount,
          paymentMethodId,
          isAnonymous,
          message,
        })
        setPaymentIntentId(result.paymentIntentId)
        setClientSecret(result.clientSecret)
      } catch (error: any) {
        toast.error(error.message || "Failed to initialize payment")
        onCancel()
      }
    }
    if (amount > 0) {
      createPaymentIntent()
    }
  }, [eventId, amount, paymentMethodId, isAnonymous, message, onCancel])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !clientSecret) {
      return
    }

    setIsProcessing(true)

    try {
      // If using saved payment method, confirm directly without elements
      if (paymentMethodId) {
        const { error } = await stripe.confirmPayment({
          clientSecret,
          confirmParams: {
            return_url: typeof window !== 'undefined' 
              ? `${window.location.origin}/donate/success?eventId=${eventId}&amount=${amount}`
              : undefined,
          },
          redirect: 'if_required',
        })

        if (error) {
          toast.error(error.message || "Payment failed")
          setIsProcessing(false)
          return
        }

        // Payment succeeded
        toast.success("Donation processed successfully!")
        onSuccess()
      } else if (elements) {
        // Using new payment method
        const { error: submitError } = await elements.submit()
        if (submitError) {
          toast.error(submitError.message || "Please check your payment details")
          setIsProcessing(false)
          return
        }

        const { error } = await stripe.confirmPayment({
          elements,
          clientSecret,
          confirmParams: {
            return_url: typeof window !== 'undefined' 
              ? `${window.location.origin}/donate/success?eventId=${eventId}&amount=${amount}`
              : undefined,
          },
          redirect: 'if_required',
        })

        if (error) {
          toast.error(error.message || "Payment failed")
          setIsProcessing(false)
          return
        }

        // Payment succeeded
        toast.success("Donation processed successfully!")
        onSuccess()
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to process donation")
      setIsProcessing(false)
    }
  }

  if (!clientSecret) {
    return <div className="p-4 text-center">Initializing payment...</div>
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!paymentMethodId && elements && <PaymentElement />}
      {paymentMethodId && (
        <div className="p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            Using saved payment method. Click confirm to proceed.
          </p>
        </div>
      )}
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isProcessing} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" disabled={!stripe || isProcessing} className="flex-1">
          {isProcessing ? "Processing..." : `Confirm Donation ${amount.toFixed(2)}`}
        </Button>
      </div>
    </form>
  )
}

export default function DonatePage() {
  const router = useRouter()
  const params = useParams()
  const eventId = params.eventId as string
  const { formatAmountSimple, getSymbol } = useCurrency()
  const { isAuthenticated, user } = useAuth()
  const [amount, setAmount] = useState("")
  const [customAmount, setCustomAmount] = useState("")
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string | null>(null)
  const [paymentMethodType, setPaymentMethodType] = useState<"card" | "paypal" | "new_card">("card")
  const [isRecurring, setIsRecurring] = useState(false)
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [message, setMessage] = useState("")
  const [showStripeForm, setShowStripeForm] = useState(false)
  const [savedPaymentMethods, setSavedPaymentMethods] = useState<PaymentMethod[]>([])
  const [isLoadingPaymentMethods, setIsLoadingPaymentMethods] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const suggestedAmounts = ["10", "25", "50", "100", "250", "500"]

  const [event, setEvent] = useState<{
    id: string
    title: string
    organization: string
    image?: string
    raised: number
    goal: number
    supporters: number
    description: string
  } | null>(null)
  const [isLoadingEvent, setIsLoadingEvent] = useState(true)

  useEffect(() => {
    if (eventId) {
      loadEvent()
    }
    if (isAuthenticated) {
      loadPaymentMethods()
    }
    
  }, [eventId, isAuthenticated])


  const loadEvent = async () => {
    try {
      setIsLoadingEvent(true)
      const eventData = await eventService.getEventById(eventId)
      setEvent({
        id: eventId,
        title: eventData.title,
        organization: eventData.organization.name,
        image: eventData.image,
        raised: eventData.raised,
        goal: eventData.goal,
        supporters: eventData.supporters,
        description: eventData.description,
      })
    } catch (error: any) {
      toast.error(error.message || "Failed to load event")
    } finally {
      setIsLoadingEvent(false)
    }
  }

  const loadPaymentMethods = async () => {
    try {
      setIsLoadingPaymentMethods(true)
      const methods = await paymentService.getPaymentMethods()
      setSavedPaymentMethods(methods)
      // Set default payment method if available
      const defaultMethod = methods.find(m => m.isDefault)
      if (defaultMethod) {
        setSelectedPaymentMethodId(defaultMethod.id)
        setPaymentMethodType(defaultMethod.provider === 'paypal' ? 'paypal' : 'card')
      }
    } catch (error: any) {
      console.error("Failed to load payment methods:", error)
      // Don't show error toast - user can still donate without saved methods
    } finally {
      setIsLoadingPaymentMethods(false)
    }
  }

  if (isLoadingEvent || !event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-orange-50/30 to-peach-50/30">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading event...</p>
          </div>
        </div>
      </div>
    )
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

  const handleDonateClick = async () => {
    const donationAmount = getCurrentAmount()
    if (!donationAmount || Number.parseFloat(donationAmount) <= 0) {
      toast.error("Please enter a valid donation amount")
      return
    }

    const amountNum = Number.parseFloat(donationAmount)

    // Handle recurring donations
    if (isRecurring) {
      try {
        await paymentService.createRecurringDonation({
          eventId,
          amount: amountNum,
          interval: 'month',
          paymentMethodId: selectedPaymentMethodId || undefined,
          isAnonymous,
          message: message || undefined,
        })
        toast.success("Recurring donation created successfully!")
        router.push(`/donate/success?amount=${donationAmount}&event=${encodeURIComponent(event?.title || '')}&recurring=true`)
      } catch (error: any) {
        toast.error(error.message || "Failed to create recurring donation")
      }
      return
    }

    // Handle PayPal payments (simulated - for demonstration only)
    if (paymentMethodType === 'paypal') {
      try {
        setIsProcessing(true)
        await paymentService.simulatePayPalPayment({
          eventId,
          amount: amountNum,
          currency: 'USD',
          paymentMethodId: selectedPaymentMethodId || undefined,
          isAnonymous,
          message: message || undefined,
        })
        toast.success("Donation processed successfully! (PayPal simulation)")
        router.push(`/donate/success?amount=${donationAmount}&event=${encodeURIComponent(event?.title || '')}`)
      } catch (error: any) {
        toast.error(error.message || "Failed to process PayPal payment")
      } finally {
        setIsProcessing(false)
      }
      return
    }

    // Handle Stripe card payments - show Stripe form
    if (paymentMethodType === 'card' || paymentMethodType === 'new_card') {
      setShowStripeForm(true)
      return
    }

    toast.error("Please select a payment method")
  }

  const handleDonationSuccess = () => {
    router.push(`/donate/success?amount=${getCurrentAmount()}&event=${encodeURIComponent(event?.title || '')}`)
  }

  const formatCardNumber = (last4?: string) => {
    return last4 ? `•••• •••• •••• ${last4}` : "•••• •••• •••• ••••"
  }

  const savedCards = savedPaymentMethods.filter(m => m.provider === 'stripe' && m.type === 'card')
  const savedPayPal = savedPaymentMethods.filter(m => m.provider === 'paypal')

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
                      <div className="text-2xl font-bold text-foreground">{formatAmountSimple(event.raised)}</div>
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
                <div className="space-y-6">
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
                          {getSymbol()}{suggestedAmount}
                        </Button>
                      ))}
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                        {getSymbol()}
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
                    
                    {/* Saved Payment Methods */}
                    {isLoadingPaymentMethods ? (
                      <div className="text-sm text-muted-foreground mb-4">Loading payment methods...</div>
                    ) : (
                      <RadioGroup 
                        value={selectedPaymentMethodId || paymentMethodType} 
                        onValueChange={(value) => {
                          if (value === 'new_card' || value === 'paypal') {
                            setSelectedPaymentMethodId(null)
                            setPaymentMethodType(value)
                          } else {
                            // It's a payment method ID
                            const method = [...savedCards, ...savedPayPal].find(m => m.id === value)
                            if (method) {
                              setSelectedPaymentMethodId(method.id)
                              setPaymentMethodType(method.provider === 'paypal' ? 'paypal' : 'card')
                            }
                          }
                        }}
                        className="space-y-3 mb-4"
                      >
                        {/* Saved Cards */}
                        {savedCards.length > 0 && (
                          <div>
                            <Label className="text-sm font-medium mb-2 block text-muted-foreground">Saved Cards</Label>
                            {savedCards.map((method) => (
                              <div
                                key={method.id}
                                className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                                  selectedPaymentMethodId === method.id && paymentMethodType === 'card'
                                    ? 'border-primary bg-primary/5'
                                    : 'border-border hover:border-primary/50'
                                }`}
                                onClick={() => {
                                  setSelectedPaymentMethodId(method.id)
                                  setPaymentMethodType('card')
                                }}
                              >
                                <div className="flex items-center gap-3">
                                  <RadioGroupItem
                                    value={method.id}
                                    id={`card-${method.id}`}
                                  />
                                  <CreditCard className="h-4 w-4" />
                                  <div>
                                    <div className="font-medium">{formatCardNumber(method.cardLast4)}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {method.cardBrand?.toUpperCase()} • Expires {String(method.cardExpMonth).padStart(2, '0')}/{String(method.cardExpYear).slice(-2)}
                                    </div>
                                  </div>
                                </div>
                                {method.isDefault && (
                                  <Badge variant="secondary" className="text-xs">Default</Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Saved PayPal */}
                        {savedPayPal.length > 0 && (
                          <div>
                            <Label className="text-sm font-medium mb-2 block text-muted-foreground">Saved PayPal (Demo)</Label>
                            {savedPayPal.map((method) => (
                              <div
                                key={method.id}
                                className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                                  selectedPaymentMethodId === method.id && paymentMethodType === 'paypal'
                                    ? 'border-primary bg-primary/5'
                                    : 'border-border hover:border-primary/50'
                                }`}
                                onClick={() => {
                                  setSelectedPaymentMethodId(method.id)
                                  setPaymentMethodType('paypal')
                                }}
                              >
                                <div className="flex items-center gap-3">
                                  <RadioGroupItem
                                    value={method.id}
                                    id={`paypal-${method.id}`}
                                  />
                                  <Banknote className="h-4 w-4" />
                                  <div>
                                    <div className="font-medium">{method.paypalEmail || 'PayPal Account'}</div>
                                    <div className="text-xs text-muted-foreground">PayPal (Demo)</div>
                                  </div>
                                </div>
                                {method.isDefault && (
                                  <Badge variant="secondary" className="text-xs">Default</Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Add New Payment Method Options */}
                        <div className="pt-2 border-t">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem 
                              value="new_card" 
                              id="new_card"
                            />
                            <Label htmlFor="new_card" className="flex items-center gap-2 cursor-pointer">
                              <CreditCard className="h-4 w-4" />
                              Use a new card
                            </Label>
                          </div>
                          {savedPayPal.length === 0 && (
                            <div className="flex items-center space-x-2 mt-2">
                              <RadioGroupItem 
                                value="paypal" 
                                id="paypal_new"
                              />
                              <Label htmlFor="paypal_new" className="flex items-center gap-2 cursor-pointer">
                                <Banknote className="h-4 w-4" />
                                PayPal (Demo)
                              </Label>
                            </div>
                          )}
                        </div>
                      </RadioGroup>
                    )}
                  </div>

                  {/* Personal Information - Only show if not using saved payment method or not logged in */}
                  {(!isAuthenticated || selectedPaymentMethodId) && (
                    <div className="space-y-4">
                      {!isAuthenticated && (
                        <>
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
                        </>
                      )}
                    </div>
                  )}

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
                          <span className="text-2xl font-bold text-primary">{getSymbol()}{getCurrentAmount()}</span>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Submit */}
                  <Button
                    type="button"
                    onClick={handleDonateClick}
                    className="w-full h-12 text-lg"
                    disabled={!getCurrentAmount() || Number.parseFloat(getCurrentAmount()) <= 0}
                  >
                    <Heart className="h-5 w-5 mr-2" />
                    Donate {getSymbol()}{getCurrentAmount() || "0"}
                  </Button>

                  <div className="text-xs text-muted-foreground text-center">
                    By donating, you agree to our Terms of Service and Privacy Policy. Your donation is secure and
                    encrypted.
                  </div>
                </div>

                {/* Stripe Payment Form Dialog */}
                {showStripeForm && stripePromise && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <Card className="w-full max-w-md m-4">
                      <CardHeader>
                        <CardTitle>Complete Payment</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Elements
                          stripe={stripePromise}
                          options={{
                            mode: 'payment',
                            amount: Math.round(Number.parseFloat(getCurrentAmount()) * 100),
                            currency: 'usd',
                          }}
                        >
                          <StripePaymentForm
                            eventId={eventId}
                            amount={Number.parseFloat(getCurrentAmount())}
                            paymentMethodId={paymentMethodType === 'card' ? selectedPaymentMethodId || undefined : undefined}
                            isAnonymous={isAnonymous}
                            message={message || undefined}
                            onSuccess={handleDonationSuccess}
                            onCancel={() => setShowStripeForm(false)}
                          />
                        </Elements>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
