import React from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Wifi, RefreshCw } from 'lucide-react'

interface NetworkErrorProps {
  onRetry: () => void
  error?: string
  isRetrying?: boolean
}

export function NetworkError({
  onRetry,
  error,
  isRetrying = false,
}: NetworkErrorProps) {
  return (
    <div className="flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/20">
            <Wifi className="h-6 w-6 text-orange-600 dark:text-orange-400" />
          </div>
          <CardTitle className="text-xl">Network Error</CardTitle>
          <CardDescription>
            Unable to connect to the server. Please check your internet
            connection and try again.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md bg-gray-50 dark:bg-gray-900 p-3">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {error}
              </p>
            </div>
          )}
          <Button onClick={onRetry} disabled={isRetrying} className="w-full">
            {isRetrying ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Retrying...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
