'use client'

import { useState, useEffect } from 'react'
import { Modal } from './modal'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, ExternalLink, Info, User, Share, Settings } from 'lucide-react'
import { fetchEntityWithImagesAction } from '@/lib/actions'
import { useToast } from '@/hooks/use-toast'
import { type SearchEntity } from '@/lib/api'
import { type EntityWithImages } from '@/lib/entityHelpers'
import { RequestInfoButton } from './RequestInfoButton'
import { ContactOwnerButton } from './ContactOwnerButton'
import OwnerEntitiesTab from './entity/OwnerEntitiesTab'

interface EntityDetailModalProps {
  isOpen: boolean
  onClose: () => void
  entity: SearchEntity | null
}

export function EntityDetailModal({ isOpen, onClose, entity }: EntityDetailModalProps) {
  const [entityDetails, setEntityDetails] = useState<EntityWithImages | null>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen && entity) {
      loadEntityDetails()
    }
  }, [isOpen, entity])

  const loadEntityDetails = async () => {
    if (!entity) return

    setLoading(true)
    try {
      const details = await fetchEntityWithImagesAction(entity.id)
      setEntityDetails(details)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load entity details',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setEntityDetails(null)
    onClose()
  }

  if (!entity) return null

  const entityName = entity.attributes?.name || entity.attributes?.title || `${entity.entity_type} #${entity.id.slice(-8)}`
  const categoryDisplay = entity.mtcli_entity_categories?.display_name || entity.entity_type

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={entityName}
    >
      <Tabs defaultValue="info" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="info"><Info className="mr-2 h-4 w-4" />Info</TabsTrigger>
          <TabsTrigger value="owner"><User className="mr-2 h-4 w-4" />Owner</TabsTrigger>
          <TabsTrigger value="share"><Share className="mr-2 h-4 w-4" />Share</TabsTrigger> 
          <TabsTrigger value="settings"><Settings className="mr-2 h-4 w-4" />Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{categoryDisplay}</Badge>
                <span className="text-xs text-muted-foreground">
                  {new Date(entity.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {entity.attributes?.description || entity.attributes?.address || 'No description available'}
              </p>
              <p className="text-xs text-muted-foreground">
                Owner: {entity.owner_id}
              </p>
            </div>

            {/* Images */}
            {entityDetails?.images && entityDetails.images.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-medium text-sm">Images</h3>
                <div className="grid grid-cols-2 gap-2">
                  {entityDetails.images.map((image, index) => (
                    <div key={image.id || index} className="relative">
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

            {/* All Attributes */}
            <div className="space-y-2">
              <h3 className="font-medium text-sm">All Attributes</h3>
              <div className="space-y-1">
                {entity.attributes && Object.keys(entity.attributes).length > 0 ? (
                  Object.entries(entity.attributes).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center text-xs border-b pb-1 gap-2">
                      <span className="font-medium capitalize text-muted-foreground min-w-0">
                        {key.replace('_', ' ')}:
                      </span>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-right break-words">
                          {value !== null && value !== undefined ? String(value) : (
                            <span className="text-muted-foreground italic">not set</span>
                          )}
                        </span>
                        {(value === null || value === undefined || value === '') && (
                          <RequestInfoButton 
                            entityId={entity.id}
                            attributeName={key.replace('_', ' ')}
                            ownerEmail={entity.owner_id}
                            entityName={entityName}
                          />
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground italic">No attributes available</p>
                )}
              </div>
            </div>
            
            {/* Contact Owner */}
            <div className="space-y-2 border-t pt-4">
              <h3 className="font-medium text-sm">Contact Owner</h3>
              <ContactOwnerButton 
                entityId={entity.id} 
                ownerId={entity.owner_id} 
                entityName={entityName} 
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="owner">
          <OwnerEntitiesTab entityId={entity.id} currentOwnerName={entity.owner_id} />
        </TabsContent>

        <TabsContent value="share">
          {entity.public_shareable && entity.share_token && (
            <div className="space-y-2 border-t pt-4">
              <h3 className="font-medium text-sm">Sharing</h3>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  const shareUrl = `${window.location.origin}/share/${entity.share_token}`
                  navigator.clipboard.writeText(shareUrl)
                  toast({
                    title: 'Copied!',
                    description: 'Share link copied to clipboard',
                  })
                }}
              >
                <ExternalLink className="h-3 w-3 mr-2" />
                Copy Share Link
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="settings">
          <div className="space-y-6">
            {/* Category Schema Info */}
            {entity.mtcli_entity_categories && (
              <div className="space-y-2">
                <h3 className="font-medium text-sm">Category</h3>
                <div className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="font-medium text-muted-foreground">Name:</span>
                    <span>{entity.mtcli_entity_categories.display_name}</span>
                  </div>
                  {entity.mtcli_entity_categories.description && (
                    <div className="flex justify-between">
                      <span className="font-medium text-muted-foreground">Description:</span>
                      <span className="text-right max-w-[60%]">{entity.mtcli_entity_categories.description}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Technical Details */}
            <div className="space-y-2 border-t pt-4">
              <h3 className="font-medium text-sm">Technical Details</h3>
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="font-medium text-muted-foreground">Entity ID:</span>
                  <span className="font-mono text-xs">{entity.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-muted-foreground">Type:</span>
                  <span>{entity.entity_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-muted-foreground">Public:</span>
                  <span>{entity.public_shareable ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-muted-foreground">Status:</span>
                  <span>{entity.disabled ? 'Disabled' : 'Active'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-muted-foreground">Created:</span>
                  <span>{new Date(entity.created_at).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-muted-foreground">Updated:</span>
                  <span>{new Date(entity.updated_at).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </Modal>
  )
}
