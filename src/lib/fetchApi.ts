import { getToken, clearToken } from './auth-cookie'
import { toast } from '@/hooks/use-toast'

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://multi-tenant-cli-boilerplate-api.vercel.app'

interface FetchApiOptions extends Omit<RequestInit, 'body'> {
  body?: any
}

/**
 * Central request wrapper that handles JSON, throws on non-2xx,
 * and automatically includes Authorization header when token is present
 */
export async function fetchApi<T = any>(
  endpoint: string,
  options: FetchApiOptions = {}
): Promise<T> {
  const { body, headers = {}, ...restOptions } = options

  // Get the token from cookies
  const token = await getToken()

  // Prepare headers
  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string>),
  }

  // Add Authorization header if token exists
  if (token) {
    requestHeaders['Authorization'] = `Bearer ${token}`
  }

  // Prepare the request URL
  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE_URL}${endpoint}`

  // Prepare the request options
  const requestOptions: RequestInit = {
    ...restOptions,
    headers: requestHeaders,
  }

  // Add body if provided
  if (body !== undefined) {
    requestOptions.body = JSON.stringify(body)
  }

  try {
    const response = await fetch(url, requestOptions)

    // Throw error for non-2xx responses
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`

      try {
        const errorBody = await response.text()
        if (errorBody) {
          // Try to parse as JSON for better error details
          try {
            const parsedError = JSON.parse(errorBody)
            errorMessage =
              parsedError.message || parsedError.error || errorMessage
          } catch {
            // If not JSON, use the text as is
            errorMessage = errorBody
          }
        }
      } catch {
        // If we can't read the body, use the default message
      }

      if (response.status === 401) {
        clearToken()
        toast({
          title: 'Session Expired',
          description: 'Your session has expired. Please log in again.',
          variant: 'destructive',
        })
        // Force page reload to clear state and redirect to login
        setTimeout(() => {
          window.location.reload()
        }, 1000)
        throw new Error('Session expired')
      }

      const error = new Error(errorMessage)
      ;(error as any).status = response.status
      ;(error as any).statusText = response.statusText
      throw error
    }

    // Handle empty responses
    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      // If it's not JSON, return the text or empty object
      const text = await response.text()
      return (text ? text : {}) as T
    }

    // Parse and return JSON response
    return (await response.json()) as T
  } catch (error) {
    // Re-throw fetch errors and our custom errors
    if (error instanceof Error) {
      throw error
    }

    // Handle unknown errors
    throw new Error('Network request failed')
  }
}

/**
 * Convenience methods for common HTTP verbs
 */
export const api = {
  get: <T = any>(endpoint: string, options?: Omit<FetchApiOptions, 'method'>) =>
    fetchApi<T>(endpoint, { ...options, method: 'GET' }),

  post: <T = any>(
    endpoint: string,
    body?: any,
    options?: Omit<FetchApiOptions, 'method' | 'body'>
  ) => fetchApi<T>(endpoint, { ...options, method: 'POST', body }),

  put: <T = any>(
    endpoint: string,
    body?: any,
    options?: Omit<FetchApiOptions, 'method' | 'body'>
  ) => fetchApi<T>(endpoint, { ...options, method: 'PUT', body }),

  patch: <T = any>(
    endpoint: string,
    body?: any,
    options?: Omit<FetchApiOptions, 'method' | 'body'>
  ) => fetchApi<T>(endpoint, { ...options, method: 'PATCH', body }),

  delete: <T = any>(
    endpoint: string,
    options?: Omit<FetchApiOptions, 'method'>
  ) => fetchApi<T>(endpoint, { ...options, method: 'DELETE' }),
}
