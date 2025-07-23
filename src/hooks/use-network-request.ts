import { useState, useCallback } from 'react'

interface NetworkRequestState<T> {
  data: T | null
  error: string | null
  isLoading: boolean
  isRetrying: boolean
}

interface UseNetworkRequestOptions {
  onSuccess?: (data: any) => void
  onError?: (error: Error) => void
  retryAttempts?: number
  retryDelay?: number
}

export function useNetworkRequest<T = any>(
  requestFn: () => Promise<T>,
  options: UseNetworkRequestOptions = {}
) {
  const { onSuccess, onError, retryAttempts = 3, retryDelay = 1000 } = options

  const [state, setState] = useState<NetworkRequestState<T>>({
    data: null,
    error: null,
    isLoading: false,
    isRetrying: false,
  })

  const [attemptCount, setAttemptCount] = useState(0)

  const execute = useCallback(
    async (isRetry = false) => {
      setState((prev) => ({
        ...prev,
        isLoading: !isRetry,
        isRetrying: isRetry,
        error: isRetry ? prev.error : null,
      }))

      try {
        const data = await requestFn()
        setState({
          data,
          error: null,
          isLoading: false,
          isRetrying: false,
        })
        setAttemptCount(0)
        onSuccess?.(data)
        return data
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred'

        setState({
          data: null,
          error: errorMessage,
          isLoading: false,
          isRetrying: false,
        })

        onError?.(error instanceof Error ? error : new Error(errorMessage))
        throw error
      }
    },
    [requestFn, onSuccess, onError]
  )

  const retry = useCallback(async () => {
    if (attemptCount >= retryAttempts) {
      return
    }

    setAttemptCount((prev) => prev + 1)

    // Add delay before retry
    if (retryDelay > 0) {
      await new Promise((resolve) => setTimeout(resolve, retryDelay))
    }

    return execute(true)
  }, [execute, attemptCount, retryAttempts, retryDelay])

  const reset = useCallback(() => {
    setState({
      data: null,
      error: null,
      isLoading: false,
      isRetrying: false,
    })
    setAttemptCount(0)
  }, [])

  return {
    ...state,
    execute,
    retry,
    reset,
    canRetry: attemptCount < retryAttempts,
    attemptCount,
  }
}
