'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ExternalLink, User, Calendar, Tag } from 'lucide-react'
import Link from 'next/link'

interface Entity {
  id: string
  entity_type: string
  owner_id: string
  attributes: Record<string, any>
  share_token: string
  public_shareable: boolean
  created_at: string
  updated_at: string
  mtcli_entity_categories?: {
    id: string
    display_name: string
    description: string
  }
}

interface OwnerEntitiesTabProps {
  entityId: string
  currentOwnerName?: string
}

export default function OwnerEntitiesTab({ entityId, currentOwnerName }: OwnerEntitiesTabProps) {
  const params = useParams()
  const locale = params.locale as string || 'en' // Default to 'en' if not available
  
  const [entities, setEntities] = useState<Entity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchOwnerEntities = async () => {
      try {
        console.log('🔍 Fetching owner entities for entityId:', entityId)
        setLoading(true)
        setError(null)
        
        const url = `/api/entities/${entityId}/owner-entities`
        console.log('🌐 Making request to:', url)
        
        // Add timeout to prevent infinite loading
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
        
        const response = await fetch(url, {
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)
        console.log('📡 Response status:', response.status, response.statusText)
        
        if (!response.ok) {
          const errorText = await response.text()
          console.error('❌ Response not ok:', errorText)
          throw new Error(`Failed to fetch owner entities: ${response.status} ${response.statusText}`)
        }
        
        const data = await response.json()
        console.log('✅ Received data:', data)
        
        setEntities(data.entities || [])
        console.log('📊 Set entities count:', (data.entities || []).length)
      } catch (err) {
        console.error('💥 Error fetching owner entities:', err)
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
        setError(`Failed to load other entities by this owner: ${errorMessage}`)
      } finally {
        console.log('🏁 Finished loading')
        setLoading(false)
      }
    }

    if (entityId) {
      console.log('🚀 Starting fetch for entityId:', entityId)
      fetchOwnerEntities()
    } else {
      console.warn('⚠️ No entityId provided')
    }
  }, [entityId])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getDisplayValue = (value: any) => {
    if (value === null || value === undefined || value === '') return 'Not specified'
    return String(value)
  }

  const getMainAttributes = (attributes: Record<string, any>) => {
    // Return the first few non-null attributes for display
    const nonNullAttrs = Object.entries(attributes)
      .filter(([_, value]) => value !== null && value !== undefined && value !== '')
      .slice(0, 3)
    
    return nonNullAttrs
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <User className="h-5 w-5" />
          <h3 className="text-lg font-semibold">More from this owner</h3>
        </div>
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <User className="h-5 w-5" />
          <h3 className="text-lg font-semibold">More from this owner</h3>
        </div>
        <Card>
          <CardContent className="p-4">
            <p className="text-gray-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (entities.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <User className="h-5 w-5" />
          <h3 className="text-lg font-semibold">
            More from {currentOwnerName ? currentOwnerName : 'this owner'}
          </h3>
        </div>
        <Card>
          <CardContent className="p-4">
            <p className="text-gray-600">No other entities found from this owner.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <User className="h-5 w-5" />
        <h3 className="text-lg font-semibold">
          More from {currentOwnerName ? currentOwnerName : 'this owner'}
        </h3>
        <Badge variant="secondary">{entities.length}</Badge>
      </div>
      
      <div className="grid gap-4">
        {entities.map((entity) => (
          <Card key={entity.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-base">
                    {entity.mtcli_entity_categories?.display_name || entity.entity_type}
                  </CardTitle>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>Created {formatDate(entity.created_at)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    <Tag className="h-3 w-3 mr-1" />
                    {entity.entity_type}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              {/* Display main attributes */}
              <div className="space-y-2 mb-4">
                {getMainAttributes(entity.attributes).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="text-gray-600 capitalize">
                      {key.replace(/_/g, ' ')}:
                    </span>
                    <span className="font-medium">{getDisplayValue(value)}</span>
                  </div>
                ))}
                
                {Object.keys(entity.attributes).length === 0 && (
                  <p className="text-sm text-gray-500 italic">No additional details available</p>
                )}
              </div>
              
              {/* Action buttons */}
              <div className="flex gap-2">
                <Button asChild size="sm" variant="outline" className="flex-1">
                  <Link href={`/${locale}/entities/${entity.id}`}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Details
                  </Link>
                </Button>
                
                {entity.public_shareable && (
                  <Button asChild size="sm" variant="ghost">
                    <Link href={`/shared/${entity.share_token}`} target="_blank">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Public View
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {entities.length >= 10 && (
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-gray-600">
              Showing first 10 entities. There may be more from this owner.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
