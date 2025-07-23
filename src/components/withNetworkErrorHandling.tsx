import React, { ComponentType } from 'react'
import { NetworkError } from './NetworkError'

interface NetworkErrorHandlerProps {
  error?: string | null
  isLoading?: boolean
  onRetry?: () => void
  showNetworkError?: boolean
  isRetrying?: boolean
}

export function withNetworkErrorHandling<P extends object>(
  WrappedComponent: ComponentType<P>
) {
  return function NetworkErrorWrapper(props: P & NetworkErrorHandlerProps) {
    const {
      error,
      isLoading,
      onRetry,
      showNetworkError = true,
      isRetrying = false,
      ...wrappedProps
    } = props

    // Show network error if there's an error and we should show it
    if (error && showNetworkError && onRetry) {
      // Check if it's a network-related error
      const isNetworkError =
        error.includes('Network') ||
        error.includes('fetch') ||
        error.includes('connection') ||
        error.includes('timeout') ||
        error.includes('ECONNREFUSED') ||
        error.includes('Failed to fetch')

      if (isNetworkError) {
        return (
          <NetworkError
            error={error}
            onRetry={onRetry}
            isRetrying={isRetrying}
          />
        )
      }
    }

    return <WrappedComponent {...(wrappedProps as P)} />
  }
}

// Utility function to check if an error is network-related
export function isNetworkError(error: Error | string): boolean {
  const errorMessage = typeof error === 'string' ? error : error.message

  return (
    errorMessage.includes('Network') ||
    errorMessage.includes('fetch') ||
    errorMessage.includes('connection') ||
    errorMessage.includes('timeout') ||
    errorMessage.includes('ECONNREFUSED') ||
    errorMessage.includes('Failed to fetch') ||
    errorMessage.includes('ERR_NETWORK') ||
    errorMessage.includes('ERR_INTERNET_DISCONNECTED')
  )
}
