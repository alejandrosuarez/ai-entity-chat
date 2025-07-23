'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { EntityWithImages } from '@/lib/entityHelpers'

interface EntityCardsProps {
  entities: EntityWithImages[]
  onEntityClick?: (entity: EntityWithImages) => void
}

export function EntityCards({ entities, onEntityClick }: EntityCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {entities.map((entity) => (
        <Card
          key={entity.id}
          className="border cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onEntityClick?.(entity)}
        >
          <CardContent className="p-4">
            {/* Entity image or placeholder */}
            <div className="w-full h-32 bg-gray-200 rounded-md mb-3 flex items-center justify-center overflow-hidden">
              {entity.images && entity.images.length > 0 ? (
                <img
                  src={(entity.images[0] as any)?.url || (entity.images[0] as any)?.thumbnail_url}
                  alt={`${entity.name} image`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to placeholder on image load error
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                    target.nextElementSibling!.classList.remove('hidden')
                  }}
                />
              ) : null}
              <div className={`text-gray-500 text-2xl ${entity.images && entity.images.length > 0 ? 'hidden' : ''}`}>
                📄
              </div>
            </div>
            <h3 className="font-bold text-lg mb-1">{entity.name}</h3>
            <p className="text-sm text-muted-foreground mb-2">
              {entity.category}
            </p>
            <p className="text-xs text-gray-600 line-clamp-2">
              {entity.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
