"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Heart, ArrowLeft, Mail } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { authService } from "@/lib/api/services"
import { toast } from "sonner"

export default function VerifyResetCodePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''
  
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [isVerified, setIsVerified] = useState(false)

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  useEffect(() => {
    if (!email) {
      router.push('/forgot-password')
    }
  }, [email, router])

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return
    if (!/^\d*$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`)
      nextInput?.focus()
    }

    if (newOtp.every(digit => digit !== '') && newOtp.length === 6) {
      handleVerify(newOtp.join(''))
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`)
      prevInput?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').slice(0, 6)
    if (/^\d{6}$/.test(pastedData)) {
      const newOtp = pastedData.split('')
      setOtp(newOtp)
      document.getElementById(`otp-5`)?.focus()
      handleVerify(pastedData)
    }
  }

  const handleVerify = async (otpCode?: string) => {
    if (!email) {
      toast.error('Email is required')
      return
    }

    const code = otpCode || otp.join('')
    if (code.length !== 6) {
      toast.error('Please enter all 6 digits')
      return
    }

    setIsLoading(true)

    try {
      const result = await authService.verifyPasswordResetCode(email, code)
      if (result.success) {
        setIsVerified(true)
        toast.success('Reset code verified!')
        setTimeout(() => {
          router.push(`/forgot-password/reset?email=${encodeURIComponent(email)}&otp=${code}`)
        }, 1000)
      }
    } catch (error: any) {
      toast.error(error.message || 'Invalid reset code. Please try again.')
      setOtp(['', '', '', '', '', ''])
      document.getElementById('otp-0')?.focus()
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    if (resendCooldown > 0 || !email) return

    setIsResending(true)

    try {
      await authService.sendPasswordResetCode(email)
      toast.success('Reset code sent! Please check your email.')
      setResendCooldown(30)
    } catch (error: any) {
      toast.success('If the email exists, a reset code has been sent.')
      setResendCooldown(30)
    } finally {
      setIsResending(false)
    }
  }

  if (isVerified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-0 shadow-xl bg-card/80 backdrop-blur-sm">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-green-600 fill-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Code Verified!</h2>
            <p className="text-muted-foreground">Redirecting to reset password...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <Heart className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="text-3xl font-bold text-foreground">CauseConnect</span>
        </div>

        <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Verify Reset Code</CardTitle>
            <CardDescription>
              Enter the 6-digit code sent to
              <br />
              <span className="font-medium text-foreground">{email}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => { e.preventDefault(); handleVerify() }} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="otp">Enter Verification Code</Label>
                <div className="flex gap-2 justify-center" onPaste={handlePaste}>
                  {otp.map((digit, index) => (
                    <Input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className="w-12 h-14 text-center text-2xl font-bold"
                      autoFocus={index === 0}
                      disabled={isLoading}
                    />
                  ))}
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || otp.some(d => d === '')}
              >
                {isLoading ? "Verifying..." : "Verify Code"}
              </Button>

              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Didn't receive the code?
                </p>
                <Button
                  type="button"
                  variant="link"
                  onClick={handleResend}
                  disabled={isResending || resendCooldown > 0}
                  className="text-primary"
                >
                  {resendCooldown > 0
                    ? `Resend code in ${resendCooldown}s`
                    : isResending
                    ? 'Sending...'
                    : 'Resend Code'}
                </Button>
              </div>

              <div className="pt-4 border-t">
                <Link href="/forgot-password">
                  <Button type="button" variant="ghost" className="w-full">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}







