'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EntityCards } from './entity-cards'
import { Modal } from './modal'
import { type EntityWithImages } from '@/lib/entityHelpers'

interface EntityListProps {
  entities: EntityWithImages[]
  onBack: () => void
}

export function EntityList({ entities, onBack }: EntityListProps) {
  const [selectedEntity, setSelectedEntity] = useState<EntityWithImages | null>(null)

  const handleEntityClick = (entity: EntityWithImages) => {
    setSelectedEntity(entity)
  }

  const handleCloseModal = () => {
    setSelectedEntity(null)
  }

  if (entities.length === 0) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Your Entities</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground mb-4">
            You don't have any entities yet. Create your first one to get
            started!
          </p>
          <Button onClick={onBack}>Back to Menu</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Your Entities ({entities.length})</CardTitle>
          <Button variant="outline" onClick={onBack}>
            Back to Menu
          </Button>
        </CardHeader>
        <CardContent>
          <EntityCards entities={entities} onEntityClick={handleEntityClick} />
        </CardContent>
      </Card>

      {/* Entity Details Modal */}
      <Modal
        isOpen={!!selectedEntity}
        onClose={handleCloseModal}
        title={selectedEntity?.name || 'Entity Details'}
        actions={<Button onClick={handleCloseModal}>Close</Button>}
      >
        {selectedEntity && (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Category
              </h4>
              <p className="mt-1">{selectedEntity.category}</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Description
              </h4>
              <p className="mt-1">{selectedEntity.description}</p>
            </div>
            {selectedEntity.images && selectedEntity.images.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Images ({selectedEntity.images.length})
                </h4>
                <div className="mt-2 flex gap-2 overflow-x-auto">
                  {selectedEntity.images.map((image, index) => (
                    <img
                      key={index}
                      src={(image as any)?.url || (image as any)?.thumbnail_url}
                      alt={`Image ${index + 1}`}
                      className="w-24 h-24 object-cover rounded border"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Created
                </h4>
                <p className="mt-1 text-sm">
                  {selectedEntity.created_at ? new Date(selectedEntity.created_at).toLocaleString() : 'N/A'}
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Updated
                </h4>
                <p className="mt-1 text-sm">
                  {selectedEntity.updated_at ? new Date(selectedEntity.updated_at).toLocaleString() : 'N/A'}
                </p>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                ID
              </h4>
              <p className="mt-1 text-xs font-mono bg-muted px-2 py-1 rounded">
                {selectedEntity.id}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
