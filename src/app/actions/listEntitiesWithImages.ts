'use server'

import { fetchEntitiesWithImages, type EntityWithImages } from '../../lib/entityHelpers'

export interface ListEntitiesWithImagesResult {
  success: boolean
  data?: EntityWithImages[]
  error?: string
}

/**
 * Get entities owned by the authenticated user with their images
 * @returns Result object with success status and data or error
 */
export async function listEntitiesWithImages(): Promise<ListEntitiesWithImagesResult> {
  try {
    const entitiesWithImages = await fetchEntitiesWithImages()

    return {
      success: true,
      data: entitiesWithImages,
    }
  } catch (error) {
    console.error('Error fetching entities with images:', error)

    // Extract error message from the error object
    let errorMessage = 'Failed to fetch entities with images. Please try again.'

    if (error instanceof Error) {
      errorMessage = error.message
    }

    return {
      success: false,
      error: errorMessage,
    }
  }
}
