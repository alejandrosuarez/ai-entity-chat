'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { verifyOtpAction } from '@/lib/actions'
import { useToast } from '@/hooks/use-toast'

interface OtpFormProps {
  email: string
  onSuccess: () => void
  onBack: () => void
}

export function OtpForm({ email, onSuccess, onBack }: OtpFormProps) {
  const [otp, setOtp] = useState('')
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!otp || otp.length !== 6) {
      toast({
        title: 'Invalid OTP',
        description: 'Please enter the 6-digit code from your email.',
        variant: 'destructive',
      })
      return
    }

    startTransition(async () => {
      try {
        const result = await verifyOtpAction(email, otp)

        if (result.success) {
          toast({
            title: 'Success!',
            description: 'You have been successfully authenticated.',
          })
          onSuccess()
        } else {
          toast({
            title: 'Invalid OTP',
            description: result.message,
            variant: 'destructive',
          })
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Something went wrong. Please try again.',
          variant: 'destructive',
        })
      }
    })
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Enter Verification Code</CardTitle>
        <p className="text-sm text-muted-foreground">
          We sent a 6-digit code to {email}
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="otp">Verification Code</Label>
            <Input
              id="otp"
              type="text"
              placeholder="Enter 6-digit code"
              value={otp}
              onChange={(e) =>
                setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
              }
              disabled={isPending}
              maxLength={6}
              required
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              disabled={isPending}
              className="flex-1"
            >
              Back
            </Button>
            <Button type="submit" disabled={isPending} className="flex-1">
              {isPending ? 'Verifying...' : 'Verify'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
