'use server'

import { api } from '../../lib/fetchApi'
import type { components } from '../../lib/api.d'

type EntityList = components['schemas']['EntityList']
type ErrorResponse = components['schemas']['Error']

export interface ListEntitiesResult {
  success: boolean
  data?: EntityList
  error?: string
}

/**
 * Get entities owned by the authenticated user
 * @returns Result object with success status and data or error
 */
export async function listEntities(): Promise<ListEntitiesResult> {
  try {
    const response = await api.get<EntityList>('/api/my/entities')

    return {
      success: true,
      data: response,
    }
  } catch (error) {
    console.error('Error fetching entities:', error)

    // Extract error message from the error object
    let errorMessage = 'Failed to fetch entities. Please try again.'

    if (error instanceof Error) {
      errorMessage = error.message
    }

    return {
      success: false,
      error: errorMessage,
    }
  }
}
