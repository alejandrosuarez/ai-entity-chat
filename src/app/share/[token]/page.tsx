import { redirect } from 'next/navigation'

const API_BASE_URL = process.env.API_BASE_URL || "https://multi-tenant-cli-boilerplate-api.vercel.app"

interface SharePageProps {
  params: Promise<{
    token: string
  }>
}

async function getSharedEntity(token: string) {
  try {
    // Use the local API route which handles the external API call
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/shared/${token}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store' // Ensure fresh data for shared entities
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch shared entity: ${response.status}`)
    }

    return response.json()
  } catch (error) {
    console.error('Error fetching shared entity:', error)
    return null
  }
}

export default async function SharePage({ params }: SharePageProps) {
  const { token } = await params
  const entityData = await getSharedEntity(token)

  if (!entityData || !entityData.entity) {
    // Show error page instead of redirect for better UX
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Entity Not Found</h1>
          <p className="text-gray-600 mb-4">The shared entity you're looking for doesn't exist or is no longer available.</p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Go to Main App
          </a>
        </div>
      </div>
    )
  }

  const entity = entityData.entity

  // Show error if entity not shareable instead of redirect
  if (!entity.public_shareable || entity.disabled) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 0h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Access Restricted</h1>
          <p className="text-gray-600 mb-4">This entity is not publicly shareable or has been disabled.</p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Go to Main App
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Shared Entity</h1>
            <div className="text-sm text-gray-500">
              Public Share
            </div>
          </div>

          {/* Entity Header */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h2 className="text-lg font-medium text-blue-900 mb-2">
              {entity.display_name || entity.id}
            </h2>
            {entity.description && (
              <p className="text-blue-700 text-sm">{entity.description}</p>
            )}
            <div className="flex items-center gap-4 mt-3 text-xs text-blue-600">
              <span>Type: {entity.entity_type}</span>
              <span>•</span>
              <span>Created: {new Date(entity.created_at).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Entity Details */}
          <div className="space-y-6">
            {/* Images */}
            {entity.images && entity.images.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-medium text-sm text-gray-700">Images</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {entity.images.map((image: any, index: number) => (
                    <div key={index} className="relative">
                      <img
                        src={image.urls?.medium?.url || image.url}
                        alt={image.label || `Image ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                      {image.label && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 rounded-b-lg">
                          {image.label}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Attributes */}
            <div className="space-y-2">
              <h3 className="font-medium text-sm text-gray-700">Attributes</h3>
              <div className="space-y-1">
                {entity.attributes && Object.keys(entity.attributes).length > 0 ? (
                  Object.entries(entity.attributes).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center text-sm border-b pb-2 gap-2">
                      <span className="font-medium capitalize text-gray-600 min-w-0">
                        {key.replace('_', ' ')}:
                      </span>
                      <span className="text-right break-words text-gray-900">
                        {value !== null && value !== undefined ? String(value) : (
                          <span className="text-gray-400 italic">not set</span>
                        )}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 italic">No attributes available</p>
                )}
              </div>
            </div>

            {/* Category Info */}
            {entity.mtcli_entity_categories && (
              <div className="space-y-2">
                <h3 className="font-medium text-sm text-gray-700">Category</h3>
                <div className="text-sm space-y-1 bg-gray-50 p-3 rounded">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Name:</span>
                    <span className="text-gray-900">{entity.mtcli_entity_categories.display_name}</span>
                  </div>
                  {entity.mtcli_entity_categories.description && (
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Description:</span>
                      <span className="text-right max-w-[60%] text-gray-900">
                        {entity.mtcli_entity_categories.description}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Public Notice */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium text-green-800">This is a publicly shared entity</span>
              </div>
              <p className="text-xs text-green-600 mt-1">
                This entity has been made publicly accessible by its owner.
              </p>
            </div>

            {/* Navigation */}
            <div className="flex justify-center pt-4">
              <a
                href="/"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Main App
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Generate metadata for better SEO
export async function generateMetadata({ params }: SharePageProps) {
  const { token } = await params
  const entityData = await getSharedEntity(token)
  
  if (!entityData || !entityData.entity) {
    return {
      title: 'Entity Not Found',
      description: 'The requested shared entity could not be found.'
    }
  }

  const entity = entityData.entity
  
  return {
    title: `Shared Entity: ${entity.display_name || entity.id}`,
    description: entity.description || `View details for shared entity ${entity.display_name || entity.id}`,
    openGraph: {
      title: `Shared Entity: ${entity.display_name || entity.id}`,
      description: entity.description || `View details for shared entity ${entity.display_name || entity.id}`,
      type: 'website',
    },
  }
}
