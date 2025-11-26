"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Edit, CreditCard, CheckCircle } from "lucide-react"
import { paymentService } from "@/lib/api/services"
import { toast } from "sonner"
import type { PaymentMethod } from "@/lib/api/types"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { loadStripe, StripeElementsOptions } from "@stripe/stripe-js"
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { useAuth } from "@/contexts/AuthContext"

const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
const stripePromise = STRIPE_PUBLISHABLE_KEY ? loadStripe(STRIPE_PUBLISHABLE_KEY) : null

interface PaymentMethodsProps {
  onUpdate?: () => void
}

function AddPaymentMethodForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [setupIntentId, setSetupIntentId] = useState<string | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)

  useEffect(() => {
    const createSetupIntent = async () => {
      try {
        const result = await paymentService.createSetupIntent()
        setSetupIntentId(result.setupIntentId)
        setClientSecret(result.clientSecret)
      } catch (error: any) {
        console.error("Failed to create setup intent:", error)
        const errorMessage = error.message || error.response?.data?.message || "Failed to initialize payment method form"
        if (errorMessage.includes("not configured") || errorMessage.includes("Stripe is not configured")) {
          toast.error("Stripe is not configured on the server. Please set STRIPE_SECRET_KEY in your backend .env file.")
        } else {
          toast.error(errorMessage)
        }
        onCancel()
      }
    }
    createSetupIntent()
  }, [onCancel])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements || !setupIntentId) {
      return
    }

    setIsProcessing(true)

    try {
      const { error: submitError } = await elements.submit()
      if (submitError) {
        toast.error(submitError.message || "Please check your payment details")
        setIsProcessing(false)
        return
      }

      const { error, setupIntent } = await stripe.confirmSetup({
        elements,
        clientSecret: clientSecret!,
        redirect: 'if_required',
        confirmParams: {
          return_url: typeof window !== 'undefined' 
            ? `${window.location.origin}/settings?section=payments`
            : undefined,
        },
      })

      if (error) {
        toast.error(error.message || "Failed to add payment method")
        setIsProcessing(false)
        return
      }

      if (setupIntent?.status === 'succeeded' && setupIntent.payment_method) {
        // Add payment method to database
        await paymentService.addPaymentMethod(
          setupIntentId,
          typeof setupIntent.payment_method === 'string' ? setupIntent.payment_method : setupIntent.payment_method.id,
          false
        )
        toast.success("Payment method added successfully!")
        onSuccess()
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to add payment method")
    } finally {
      setIsProcessing(false)
    }
  }

  if (!clientSecret) {
    return <div className="p-4">Loading payment form...</div>
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isProcessing}>
          Cancel
        </Button>
        <Button type="submit" disabled={!stripe || isProcessing}>
          {isProcessing ? "Processing..." : "Add Payment Method"}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function PaymentMethods({ onUpdate }: PaymentMethodsProps) {
  const { isAuthenticated } = useAuth()
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showAddPayPalDialog, setShowAddPayPalDialog] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    if (isAuthenticated) {
      loadPaymentMethods()
    }
  }, [isAuthenticated])

  const loadPaymentMethods = async () => {
    try {
      setIsLoading(true)
      const methods = await paymentService.getPaymentMethods()
      setPaymentMethods(methods)
    } catch (error: any) {
      console.error("Failed to load payment methods:", error)
      toast.error(error.message || "Failed to load payment methods")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddSuccess = () => {
    setShowAddDialog(false)
    loadPaymentMethods()
    onUpdate?.()
  }

  const handleSetDefault = async (paymentMethodId: string) => {
    try {
      await paymentService.setDefaultPaymentMethod(paymentMethodId)
      toast.success("Default payment method updated")
      loadPaymentMethods()
      onUpdate?.()
    } catch (error: any) {
      toast.error(error.message || "Failed to set default payment method")
    }
  }

  const handleDelete = async (paymentMethodId: string) => {
    if (!confirm("Are you sure you want to remove this payment method?")) {
      return
    }

    try {
      setDeletingId(paymentMethodId)
      await paymentService.removePaymentMethod(paymentMethodId)
      toast.success("Payment method removed")
      loadPaymentMethods()
      onUpdate?.()
    } catch (error: any) {
      toast.error(error.message || "Failed to remove payment method")
    } finally {
      setDeletingId(null)
    }
  }

  const getCardBrandIcon = (brand?: string) => {
    if (!brand) return <CreditCard className="w-6 h-6" />
    return <CreditCard className="w-6 h-6" />
  }

  const formatCardNumber = (last4?: string) => {
    return last4 ? `•••• •••• •••• ${last4}` : "•••• •••• •••• ••••"
  }

  const formatExpiry = (month?: number, year?: number) => {
    if (!month || !year) return "Expires N/A"
    return `Expires ${String(month).padStart(2, '0')}/${String(year).slice(-2)}`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Methods</CardTitle>
        <CardDescription>Manage your saved payment methods</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading payment methods...</p>
          </div>
        ) : paymentMethods.length > 0 ? (
          <div className="space-y-3">
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                className="flex items-center justify-between p-4 border border-border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-6 bg-primary rounded flex items-center justify-center">
                    <span className="text-xs font-bold text-primary-foreground">
                      {method.cardBrand?.toUpperCase().slice(0, 4) || 'CARD'}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">
                      {formatCardNumber(method.cardLast4)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatExpiry(method.cardExpMonth, method.cardExpYear)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {method.isDefault && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Default
                    </Badge>
                  )}
                  {!method.isDefault && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetDefault(method.id)}
                    >
                      Set Default
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(method.id)}
                    disabled={deletingId === method.id}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No payment methods saved</p>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Button
            variant="outline"
            className="w-full justify-start bg-transparent"
            onClick={() => {
              if (!stripePromise) {
                toast.error("Stripe is not configured. Please set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in your environment variables.")
                return
              }
              setShowAddDialog(true)
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Credit/Debit Card
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start bg-transparent"
            onClick={() => setShowAddPayPalDialog(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add PayPal Account (Demo)
          </Button>
        </div>

        {!stripePromise && (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg mt-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Stripe is not configured.</strong> To enable payment methods, please set <code className="bg-yellow-100 dark:bg-yellow-900 px-1 rounded">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> in your environment variables.
            </p>
          </div>
        )}

        <Dialog open={showAddDialog && !!stripePromise} onOpenChange={(open) => {
          if (!stripePromise && open) {
            toast.error("Stripe is not configured. Please set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in your .env.local file.")
            return
          }
          setShowAddDialog(open)
        }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Payment Method</DialogTitle>
              <DialogDescription>
                Add a new credit or debit card to your account
              </DialogDescription>
            </DialogHeader>
            {showAddDialog && stripePromise ? (
              <Elements
                stripe={stripePromise}
                options={{
                  mode: 'setup',
                  currency: 'usd',
                }}
              >
                <AddPaymentMethodForm
                  onSuccess={handleAddSuccess}
                  onCancel={() => setShowAddDialog(false)}
                />
              </Elements>
            ) : (
              <div className="p-4 text-center">
                <p className="text-muted-foreground">Stripe is not configured. Please configure Stripe keys to add payment methods.</p>
                <Button variant="outline" className="mt-4" onClick={() => setShowAddDialog(false)}>
                  Close
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Add PayPal Dialog (Simulation Only) */}
        <Dialog open={showAddPayPalDialog} onOpenChange={setShowAddPayPalDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add PayPal Account (Demo Only)</DialogTitle>
              <DialogDescription>
                This is a simulation for demonstration purposes. No real PayPal account verification is performed.
              </DialogDescription>
            </DialogHeader>
            <AddPayPalForm
              onSuccess={() => {
                setShowAddPayPalDialog(false)
                loadPaymentMethods()
                onUpdate?.()
              }}
              onCancel={() => setShowAddPayPalDialog(false)}
            />
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}

function AddPayPalForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const [paypalEmail, setPaypalEmail] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!paypalEmail || !paypalEmail.includes('@')) {
      toast.error('Please enter a valid email address')
      return
    }

    setIsProcessing(true)

    try {
      await paymentService.addPayPalPaymentMethod(paypalEmail, false)
      toast.success('PayPal account added successfully! (Demo mode)')
      onSuccess()
    } catch (error: any) {
      toast.error(error.message || 'Failed to add PayPal account')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-xs text-blue-800 dark:text-blue-200">
          <strong>Demo Mode:</strong> This PayPal payment method is for demonstration only. No real PayPal account verification is performed.
        </p>
      </div>
      <div>
        <label htmlFor="paypalEmail" className="block text-sm font-medium mb-2">
          PayPal Email Address
        </label>
        <input
          id="paypalEmail"
          type="email"
          value={paypalEmail}
          onChange={(e) => setPaypalEmail(e.target.value)}
          placeholder="your.email@example.com"
          className="w-full px-3 py-2 border border-border rounded-md"
          required
          disabled={isProcessing}
        />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isProcessing}>
          Cancel
        </Button>
        <Button type="submit" disabled={isProcessing}>
          {isProcessing ? 'Adding...' : 'Add PayPal Account'}
        </Button>
      </DialogFooter>
    </form>
  )
}


