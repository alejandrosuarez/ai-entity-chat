'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { logoutAction } from '@/lib/actions'
import { clearToken } from '@/lib/auth-cookie'
import { useTransition } from 'react'

interface CommandButtonsProps {
  onListEntities: () => void
  onCreateEntity: () => void
  onExploreEntities?: () => void
  onLogout?: () => void
}

export function CommandButtons({
  onListEntities,
  onCreateEntity,
  onExploreEntities,
  onLogout,
}: CommandButtonsProps) {
  const [isPending, startTransition] = useTransition()

  const handleLogout = () => {
    startTransition(async () => {
      try {
        await logoutAction()
        // Clear token and reset FSM to unauth
        if (onLogout) {
          onLogout()
        } else {
          window.location.reload()
        }
      } catch (error) {
        console.error('Error during logout:', error)
        window.location.reload()
      }
    })
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Welcome back! 🎉</CardTitle>
        <p className="text-sm text-muted-foreground">
          What would you like to do today?
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button
          onClick={onListEntities}
          className="w-full justify-start"
          variant="outline"
        >
          📋 List My Entities
        </Button>
        <Button
          onClick={onCreateEntity}
          className="w-full justify-start"
          variant="outline"
        >
          ➕ Create New Entity
        </Button>
        {onExploreEntities && (
          <Button
            onClick={onExploreEntities}
            className="w-full justify-start"
            variant="outline"
          >
            🔍 Explore All Entities
          </Button>
        )}
        <Button
          onClick={handleLogout}
          variant="destructive"
          className="w-full justify-start"
          disabled={isPending}
        >
          🚪 {isPending ? 'Logging out...' : 'Logout'}
        </Button>
      </CardContent>
    </Card>
  )
}
