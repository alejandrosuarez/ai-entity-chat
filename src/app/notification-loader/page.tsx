'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

function NotificationLoaderContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [targetUrl, setTargetUrl] = useState<string | null>(null)
  const [chatId, setChatId] = useState<string | null>(null)
  const [entityId, setEntityId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [autoRedirect, setAutoRedirect] = useState(false)

  useEffect(() => {
    // Prevent multiple executions during Fast Refresh
    let mounted = true
    
    const initializeParams = () => {
      const url = searchParams.get('url')
      const chatIdParam = searchParams.get('chatId')
      const entityIdParam = searchParams.get('entityId')
      const autoParam = searchParams.get('auto') // Optional auto-redirect parameter
      
      if (!mounted) return
      
      if (url) {
        setTargetUrl(decodeURIComponent(url))
      }
      if (chatIdParam) {
        setChatId(chatIdParam)
      }
      if (entityIdParam) {
        setEntityId(entityIdParam)
      }
      if (autoParam === 'true') {
        setAutoRedirect(true)
      }
      
      setIsLoading(false)
    }

    // Small delay to ensure params are ready
    const timeoutId = setTimeout(initializeParams, 100)
    
    return () => {
      mounted = false
      clearTimeout(timeoutId)
    }
  }, [searchParams])

  // Auto-redirect with delay if auto=true parameter is present
  useEffect(() => {
    if (autoRedirect && targetUrl && !isLoading) {
      const redirectTimer = setTimeout(() => {
        handleFullScreenRedirect()
      }, 2000) // 2 second delay for auto-redirect
      
      return () => clearTimeout(redirectTimer)
    }
  }, [autoRedirect, targetUrl, isLoading])

  const handleFullScreenRedirect = () => {
    if (targetUrl) {
      try {
        window.open(targetUrl, '_blank', 'noopener,noreferrer')
      } catch {
        // Fallback for invalid URLs
        window.location.href = targetUrl
      }
    }
  }

  const handleCancel = () => {
    // Go back to the main page
    window.location.href = '/'
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white p-6 rounded-t-lg shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.955 8.955 0 01-4.126-.98L3 20l1.98-5.874A8.955 8.955 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Chat Session</h1>
                <p className="text-gray-600 text-sm">You've been invited to join a chat</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={handleFullScreenRedirect} 
                variant="outline"
                className="flex items-center gap-2"
                disabled={!targetUrl}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Open Full Screen
              </Button>
              <Button 
                onClick={handleCancel} 
                variant="outline"
              >
                Close
              </Button>
            </div>
          </div>
          
          {chatId && (
            <div className="mt-4 text-sm text-gray-500 bg-gray-50 p-3 rounded flex justify-between">
              <span><strong>Chat ID:</strong> {chatId.substring(0, 16)}...</span>
              {entityId && <span><strong>Entity:</strong> {entityId}</span>}
            </div>
          )}
        </div>

        {/* Chat iframe */}
        <div className="bg-white rounded-b-lg shadow-md">
          {targetUrl ? (
            <iframe
              src={targetUrl}
              title="Chat Interface"
              className="w-full h-[600px] border-0 rounded-b-lg"
              allow="microphone; camera; clipboard-read; clipboard-write"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
            />
          ) : (
            <div className="flex items-center justify-center h-[600px] text-gray-500">
              <div className="text-center">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-lg font-medium mb-2">No chat URL provided</p>
                <p className="text-sm">Please use a valid notification link to access the chat.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md text-center space-y-4 max-w-md">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-gray-900">Loading...</h1>
        <p className="text-gray-600">Preparing your chat session</p>
      </div>
    </div>
  )
}

export default function NotificationLoader() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <NotificationLoaderContent />
    </Suspense>
  )
}

// Development helper: Disable Fast Refresh for this component to prevent conflicts
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // @ts-ignore
  NotificationLoader.__hmrId = 'notification-loader-stable'
}
