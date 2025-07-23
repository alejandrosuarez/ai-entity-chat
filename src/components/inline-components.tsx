'use client'

import { useState, useTransition, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import {
  sendOtpAction,
  verifyOtpAction,
  createEntityAction,
  logoutAction,
} from '@/lib/actions'
import { useToast } from '@/hooks/use-toast'
import { Entity } from '@/lib/api'
import { Modal } from './modal'

// Inline Email Form - Single input + "Send OTP" button
interface InlineEmailFormProps {
  onTransition: (state: string, data?: any) => void
}

export function InlineEmailForm({ onTransition }: InlineEmailFormProps) {
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
          toast({
            title: 'OTP Sent',
            description: 'Check your email for the verification code.',
          })
          onTransition('otpForm', { email })
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
    <div className="inline-block max-w-sm w-full">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isPending}
          required
          className="flex-1"
        />
        <Button type="submit" disabled={isPending} size="sm">
          {isPending ? 'Sending...' : 'Send OTP'}
        </Button>
      </form>
    </div>
  )
}

// Inline OTP Form - 6-digit input
interface InlineOtpFormProps {
  email: string
  onTransition: (state: string, data?: any) => void
}

export function InlineOtpForm({ email, onTransition }: InlineOtpFormProps) {
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
          onTransition('authenticated')
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
    <div className="inline-block max-w-sm w-full">
      <div className="text-sm text-muted-foreground mb-2">
        Enter the 6-digit code sent to {email}
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          type="text"
          placeholder="000000"
          value={otp}
          onChange={(e) =>
            setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
          }
          disabled={isPending}
          maxLength={6}
          required
          className="flex-1 font-mono text-center"
        />
        <Button type="submit" disabled={isPending} size="sm">
          {isPending ? 'Verifying...' : 'Verify'}
        </Button>
      </form>
    </div>
  )
}

// Inline Command Buttons - "List My Entities", "Create New Entity", "Logout"
interface InlineCommandButtonsProps {
  onTransition: (state: string, data?: any) => void
}

export function InlineCommandButtons({
  onTransition,
}: InlineCommandButtonsProps) {
  const [isPending, startTransition] = useTransition()

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAction()
      onTransition('unauth')
    })
  }

  return (
    <div className="flex flex-col gap-2 max-w-xs">
      <Button
        onClick={() => onTransition('listing')}
        variant="outline"
        size="sm"
        className="justify-start"
      >
        📋 List My Entities
      </Button>
      <Button
        onClick={() => onTransition('creating')}
        variant="outline"
        size="sm"
        className="justify-start"
      >
        ➕ Create New Entity
      </Button>
      <Button
        onClick={handleLogout}
        variant="destructive"
        size="sm"
        className="justify-start"
        disabled={isPending}
      >
        🚪 {isPending ? 'Logging out...' : 'Logout'}
      </Button>
    </div>
  )
}

// Inline Entity Cards - Grid list with image, name, category
interface InlineEntityCardsProps {
  entities: Entity[]
  onTransition: (state: string, data?: any) => void
}

export function InlineEntityCards({
  entities,
  onTransition,
}: InlineEntityCardsProps) {
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null)

  const handleEntityClick = (entity: Entity) => {
    setSelectedEntity(entity)
  }

  const closeModal = () => {
    setSelectedEntity(null)
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-lg">
        {entities.map((entity) => (
          <Card
            key={entity.id}
            className="border cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleEntityClick(entity)}
          >
            <CardContent className="p-3">
              {/* Placeholder for image */}
              <div className="w-full h-20 bg-gray-200 rounded-md mb-2 flex items-center justify-center">
                <div className="text-gray-500 text-lg">📄</div>
              </div>
              <h4 className="font-semibold text-sm mb-1 truncate">
                {entity.name}
              </h4>
              <p className="text-xs text-muted-foreground truncate">
                {entity.category}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Entity Detail Modal */}
      <Modal
        isOpen={!!selectedEntity}
        onClose={closeModal}
        title={selectedEntity?.name || ''}
      >
        {selectedEntity && (
          <div className="space-y-3">
            <div>
              <Label className="text-sm font-medium">Category</Label>
              <p className="text-sm text-muted-foreground">
                {selectedEntity.category}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium">Description</Label>
              <p className="text-sm text-muted-foreground">
                {selectedEntity.description}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium">Created</Label>
              <p className="text-sm text-muted-foreground">
                {new Date(selectedEntity.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}

// Inline Entity Form - Fields: name, category (select), description
interface InlineEntityFormProps {
  onTransition: (state: string, data?: any) => void
}

export function InlineEntityForm({ onTransition }: InlineEntityFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
  })
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (
      !formData.name.trim() ||
      !formData.category.trim() ||
      !formData.description.trim()
    ) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all fields.',
        variant: 'destructive',
      })
      return
    }

    startTransition(async () => {
      try {
        const result = await createEntityAction({
          name: formData.name.trim(),
          entity_type: formData.category.trim(),
          description: formData.description.trim(),
        })

        if (result) {
          toast({
            title: 'Success!',
            description: `Entity "${result.name}" has been created successfully.`,
          })
          setFormData({ name: '', category: '', description: '' })
          onTransition('authenticated')
        } else {
          toast({
            title: 'Error',
            description: 'Failed to create entity. Please try again.',
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
    <div className="max-w-sm">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <Label htmlFor="name" className="text-sm">
            Name
          </Label>
          <Input
            id="name"
            type="text"
            placeholder="Entity name"
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }
            disabled={isPending}
            required
            className="h-9"
          />
        </div>

        <div>
          <Label htmlFor="category" className="text-sm">
            Category
          </Label>
          <select
            id="category"
            value={formData.category}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, category: e.target.value }))
            }
            disabled={isPending}
            required
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Select category...</option>
            <option value="person">Person</option>
            <option value="place">Place</option>
            <option value="thing">Thing</option>
            <option value="organization">Organization</option>
            <option value="event">Event</option>
            <option value="concept">Concept</option>
          </select>
        </div>

        <div>
          <Label htmlFor="description" className="text-sm">
            Description
          </Label>
          <Input
            id="description"
            type="text"
            placeholder="Description"
            value={formData.description}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, description: e.target.value }))
            }
            disabled={isPending}
            required
            className="h-9"
          />
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onTransition('authenticated')}
            disabled={isPending}
            size="sm"
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isPending}
            size="sm"
            className="flex-1"
          >
            {isPending ? 'Creating...' : 'Create'}
          </Button>
        </div>
      </form>
    </div>
  )
}
