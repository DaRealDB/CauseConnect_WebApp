"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { paymentService } from "@/lib/api/services"
import { toast } from "sonner"
import type { DonationHistoryItem } from "@/lib/api/types"
import { formatDistanceToNow } from "date-fns"
import { getImageUrl } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface DonationHistoryProps {
  onUpdate?: () => void
}

export function DonationHistory({ onUpdate }: DonationHistoryProps) {
  const [donations, setDonations] = useState<DonationHistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    loadDonationHistory()
  }, [page])

  const loadDonationHistory = async () => {
    try {
      setIsLoading(true)
      const response = await paymentService.getDonationHistory({ page, limit: 10 })
      setDonations(response.data)
      setTotalPages(response.pagination.totalPages)
    } catch (error: any) {
      console.error("Failed to load donation history:", error)
      toast.error(error.message || "Failed to load donation history")
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Completed</Badge>
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case 'failed':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Failed</Badge>
      case 'refunded':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Refunded</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Donation History</CardTitle>
        <CardDescription>View your past donations and receipts</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading donation history...</p>
          </div>
        ) : donations.length > 0 ? (
          <div className="space-y-3">
            {donations.map((donation) => (
              <div
                key={donation.id}
                className="flex items-center justify-between p-3 border border-border rounded-lg"
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
                    <p className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(donation.createdAt), { addSuffix: true })}
                      {donation.isRecurring && (
                        <span className="ml-2">
                          • <Badge variant="outline" className="text-xs">Recurring</Badge>
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">${donation.amount.toFixed(2)}</p>
                  <div className="mt-1">
                    {getStatusBadge(donation.status)}
                  </div>
                </div>
              </div>
            ))}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No donations yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Your donation history will appear here once you make your first donation.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}











