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
  const [entityData, setEntityData] = useState<any>(null)
  const [showEntityDetails, setShowEntityDetails] = useState(false)
  const [loadingEntity, setLoadingEntity] = useState(false)

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
    const originalParams = searchParams.toString();
    if (entityId) {
      // Redirect to entity detail page with locale and preserved query parameters
      const redirect = `/es/entities/${entityId}${originalParams ? '?' + originalParams : ''}`;
      router.push(redirect);
    } else {
      // Fallback to root if no entityId
      router.push('/');
    }
  }

  // Fetch entity data when entityId is available
  const fetchEntityData = async (id: string) => {
    setLoadingEntity(true)
    try {
      const response = await fetch(`/api/entities/${id}`)
      if (response.ok) {
        const data = await response.json()
        setEntityData(data.entity || data)
      } else {
        console.error('Failed to fetch entity data')
      }
    } catch (error) {
      console.error('Error fetching entity:', error)
    } finally {
      setLoadingEntity(false)
    }
  }

  const toggleEntityDetails = () => {
    if (!showEntityDetails && entityId && !entityData && !loadingEntity) {
      fetchEntityData(entityId)
    }
    setShowEntityDetails(!showEntityDetails)
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
            <div className="mt-4 text-sm text-gray-500 bg-gray-50 p-3 rounded">
              <div className="flex justify-between items-center">
                <div className="flex gap-4">
                  <span><strong>Chat ID:</strong> {chatId.substring(0, 16)}...</span>
                  {entityId && <span><strong>Entity:</strong> {entityId}</span>}
                </div>
                {entityId && (
                  <Button
                    onClick={toggleEntityDetails}
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2 text-xs"
                  >
                    <svg 
                      className={`w-4 h-4 transition-transform ${showEntityDetails ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    Entity Details
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Collapsible Entity Details */}
        {showEntityDetails && (
          <div className="bg-white border-l border-r border-gray-200 px-6 py-4 animate-in slide-in-from-top-2 duration-300">
            <div className="border-b border-gray-100 pb-4 mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V6a2 2 0 012-2h6a2 2 0 012 2v1M7 7v4" />
                </svg>
                Entity Information
              </h3>
            </div>
            
            {loadingEntity ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center gap-3 text-gray-500">
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading entity details...
                </div>
              </div>
            ) : entityData ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Entity Basic Info */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Basic Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium">{entityData.display_name || entityData.name || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span className="font-medium">{entityData.entity_type || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        entityData.disabled ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {entityData.disabled ? 'Disabled' : 'Active'}
                      </span>
                    </div>
                    {entityData.description && (
                      <div className="pt-2">
                        <span className="text-gray-600 block mb-1">Description:</span>
                        <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{entityData.description}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Entity Images */}
                {entityData.images && entityData.images.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">Images</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {entityData.images.slice(0, 4).map((image: any, index: number) => (
                        <div key={index} className="relative aspect-square">
                          <img
                            src={image.urls?.small?.url || image.url}
                            alt={image.label || `Image ${index + 1}`}
                            className="w-full h-full object-cover rounded border"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                          {image.label && (
                            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 rounded-b">
                              {image.label}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Entity Attributes */}
                {entityData.attributes && Object.keys(entityData.attributes).length > 0 && (
                  <div className="space-y-3 md:col-span-2">
                    <h4 className="font-medium text-gray-900">Attributes</h4>
                    <div className="bg-gray-50 p-3 rounded max-h-32 overflow-y-auto">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-sm">
                        {Object.entries(entityData.attributes).map(([key, value]) => (
                          <div key={key} className="flex justify-between py-1 border-b border-gray-200 last:border-b-0">
                            <span className="text-gray-600 capitalize">{key.replace('_', ' ')}:</span>
                            <span className="font-medium text-right">
                              {value !== null && value !== undefined ? String(value) : (
                                <span className="text-gray-400 italic">not set</span>
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p>Unable to load entity details</p>
              </div>
            )}
          </div>
        )}

        {/* Chat iframe */}
        <div className={`bg-white ${showEntityDetails ? 'rounded-b-lg' : 'rounded-b-lg'} shadow-md`}>
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
