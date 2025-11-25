"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Heart, Trash2, Calendar } from "lucide-react"
import { paymentService } from "@/lib/api/services"
import { toast } from "sonner"
import type { RecurringDonation } from "@/lib/api/types"
import { formatDistanceToNow } from "date-fns"
import { getImageUrl } from "@/lib/utils"
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

interface RecurringDonationsProps {
  onUpdate?: () => void
}

export function RecurringDonations({ onUpdate }: RecurringDonationsProps) {
  const [recurring, setRecurring] = useState<RecurringDonation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [cancelingId, setCancelingId] = useState<string | null>(null)

  useEffect(() => {
    loadRecurringDonations()
  }, [])

  const loadRecurringDonations = async () => {
    try {
      setIsLoading(true)
      const donations = await paymentService.getRecurringDonations()
      setRecurring(donations)
    } catch (error: any) {
      console.error("Failed to load recurring donations:", error)
      toast.error(error.message || "Failed to load recurring donations")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = async (recurringDonationId: string) => {
    try {
      setCancelingId(recurringDonationId)
      await paymentService.cancelRecurringDonation(recurringDonationId)
      toast.success("Recurring donation canceled")
      loadRecurringDonations()
      onUpdate?.()
    } catch (error: any) {
      toast.error(error.message || "Failed to cancel recurring donation")
    } finally {
      setCancelingId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Active</Badge>
      case 'canceled':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Canceled</Badge>
      case 'paused':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Paused</Badge>
      case 'expired':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Expired</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const formatInterval = (interval: string) => {
    switch (interval) {
      case 'month':
        return 'Monthly'
      case 'week':
        return 'Weekly'
      case 'year':
        return 'Yearly'
      default:
        return interval
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recurring Donations</CardTitle>
        <CardDescription>Manage your monthly subscriptions</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading recurring donations...</p>
          </div>
        ) : recurring.length > 0 ? (
          <div className="space-y-3">
            {recurring.map((donation) => (
              <div
                key={donation.id}
                className="flex items-center justify-between p-4 border border-border rounded-lg"
              >
                <div className="flex items-center gap-3 flex-1">
                  {donation.event?.image && (
                    <img
                      src={getImageUrl(donation.event.image)}
                      alt={donation.event.title}
                      className="w-12 h-12 rounded object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-medium">{donation.event?.title || 'Unknown Event'}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-sm text-muted-foreground">
                        ${donation.amount.toFixed(2)} {formatInterval(donation.interval)}
                      </p>
                      {getStatusBadge(donation.status)}
                    </div>
                    {donation.currentPeriodEnd && donation.status === 'active' && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Next payment: {formatDistanceToNow(new Date(donation.currentPeriodEnd), { addSuffix: true })}
                      </p>
                    )}
                  </div>
                </div>
                {donation.status === 'active' && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" disabled={cancelingId === donation.id}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        {cancelingId === donation.id ? "Canceling..." : "Cancel"}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Cancel Recurring Donation</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to cancel your ${donation.amount.toFixed(2)} {formatInterval(donation.interval)} donation to "{donation.event?.title}"?
                          This will stop all future payments.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Keep Donation</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleCancel(donation.id)}
                          className="bg-destructive text-destructive-foreground"
                        >
                          Cancel Donation
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No recurring donations set up</p>
            <p className="text-sm text-muted-foreground mt-2">
              Set up recurring donations to support causes automatically every month.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

