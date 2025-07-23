import { cookies } from 'next/headers'
import type { components } from './api.d'

const API_BASE_URL = 'https://multi-tenant-cli-boilerplate-api.vercel.app'

export interface EntityWithImages {
  id: string
  name: string
  category: string
  description?: string
  entity_type?: string
  attributes?: Record<string, any>
  public_shareable?: boolean
  created_at?: string
  updated_at?: string
  images: any[]
}

// Fetch entities and their associated images
export async function fetchEntitiesWithImages(): Promise<EntityWithImages[]> {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value

  if (!token) {
    throw new Error('No authentication token found')
  }

  // First fetch entities
  const entitiesResponse = await fetch(`${API_BASE_URL}/api/my/entities`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!entitiesResponse.ok) {
    throw new Error(`HTTP error! status: ${entitiesResponse.status}`)
  }

  const entitiesData = await entitiesResponse.json()
  const entities = entitiesData.entities

  const entitiesWithImages: EntityWithImages[] = []

  // Fetch images for each entity
  for (const entity of entities) {
    try {
      const imagesResponse = await fetch(`${API_BASE_URL}/api/entities/${entity.id}/images`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      let images: any[] = []
      if (imagesResponse.ok) {
        const imagesData = await imagesResponse.json()
        images = imagesData.images || []
      }

      entitiesWithImages.push({
        ...entity,
        images
      })
    } catch (error) {
      console.error(`Error fetching images for entity ${entity.id}:`, error)
      // Include entity even if images fail to load
      entitiesWithImages.push({
        ...entity,
        images: []
      })
    }
  }

  return entitiesWithImages
}

// Fetch a single entity with its images
export async function fetchEntityWithImages(entityId: string): Promise<EntityWithImages | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value

  if (!token) {
    throw new Error('No authentication token found')
  }

  try {
    // First fetch the entity
    const entityResponse = await fetch(`${API_BASE_URL}/api/entities/${entityId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!entityResponse.ok) {
      throw new Error(`HTTP error! status: ${entityResponse.status}`)
    }

    const entity = await entityResponse.json()

    // Fetch images for the entity
    let images: any[] = []
    try {
      const imagesResponse = await fetch(`${API_BASE_URL}/api/entities/${entityId}/images`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (imagesResponse.ok) {
        const imagesData = await imagesResponse.json()
        images = imagesData.images || []
      }
    } catch (error) {
      console.error(`Error fetching images for entity ${entityId}:`, error)
    }

    return {
      ...entity,
      images
    }
  } catch (error) {
    console.error(`Error fetching entity ${entityId}:`, error)
    return null
  }
}
