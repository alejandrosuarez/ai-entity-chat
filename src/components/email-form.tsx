'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { sendOtpAction } from '@/lib/actions'
import { useToast } from '@/hooks/use-toast'

interface EmailFormProps {
  onSuccess: (email: string) => void
}

export function EmailForm({ onSuccess }: EmailFormProps) {
  const [email, setEmail] = useState('')
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !email.includes('@')) {
      toast({
        title: 'Invalid Email',
        description: 'Please enter a valid email address.',
        variant: 'destructive',
      })
      return
    }

    startTransition(async () => {
      try {
        const result = await sendOtpAction(email)

        if (result.success) {
          // Store email in localStorage for marketing purposes
          if (typeof window !== 'undefined') {
            localStorage.setItem('user-email', email)
          }
          
          toast({
            title: 'OTP Sent',
            description: 'Check your email for the verification code.',
          })
          onSuccess(email)
        } else {
          toast({
            title: 'Error',
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
        <CardTitle>Welcome! Let&apos;s get you signed in</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isPending}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? 'Sending...' : 'Send OTP'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
