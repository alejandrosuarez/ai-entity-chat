'use server'

import { api } from '../../lib/fetchApi'
import type { components } from '../../lib/api.d'

type EntityCreate = components['schemas']['EntityCreate']
type Entity = components['schemas']['Entity']
type ErrorResponse = components['schemas']['Error']

export interface CreateEntityResult {
  success: boolean
  data?: Entity
  error?: string
}

/**
 * Create a new entity
 * @param body - Entity creation data
 * @returns Result object with success status and data or error
 */
export async function createEntity(
  body: EntityCreate
): Promise<CreateEntityResult> {
  try {
    const response = await api.post<Entity>('/api/entities', body)

    return {
      success: true,
      data: response,
    }
  } catch (error) {
    console.error('Error creating entity:', error)

    // Extract error message from the error object
    let errorMessage = 'Failed to create entity. Please try again.'

    if (error instanceof Error) {
      errorMessage = error.message
    }

    return {
      success: false,
      error: errorMessage,
    }
  }
}
