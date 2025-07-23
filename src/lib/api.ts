import { cookies } from 'next/headers'

const API_BASE_URL = 'https://multi-tenant-cli-boilerplate-api.vercel.app'

export interface SendOtpResponse {
  success: boolean
  message: string
}

export interface VerifyOtpResponse {
  success: boolean
  token?: string
  message: string
}

export interface Entity {
  id: string
  name: string
  category: string
  description: string
  createdAt: string
  updatedAt: string
}

export interface EntitiesResponse {
  entities: Entity[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface CreateEntityRequest {
  name: string
  entity_type: string
  description: string
  attributes?: Record<string, any>
  public_shareable?: boolean
  tenantId?: string
}

export async function sendOtp(email: string): Promise<SendOtpResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/send-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error sending OTP:', error)
    return {
      success: false,
      message: 'Failed to send OTP. Please try again.',
    }
  }
}

export async function verifyOtp(
  email: string,
  otp: string
): Promise<VerifyOtpResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, otp }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error verifying OTP:', error)
    return {
      success: false,
      message: 'Failed to verify OTP. Please try again.',
    }
  }
}

export async function getEntities(): Promise<EntitiesResponse | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value

    if (!token) {
      throw new Error('No authentication token found')
    }

    const response = await fetch(`${API_BASE_URL}/api/my/entities`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching entities:', error)
    return null
  }
}

export async function createEntity(
  data: CreateEntityRequest
): Promise<Entity | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value

    if (!token) {
      throw new Error('No authentication token found')
    }

    console.log('Creating entity with payload:', JSON.stringify(data, null, 2))

    const response = await fetch(`${API_BASE_URL}/api/entities`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      })
      throw new Error(`HTTP error! status: ${response.status}, response: ${errorText}`)
    }

    const result = await response.json()
    console.log('Entity creation successful:', result)
    return result
  } catch (error) {
    console.error('Error creating entity:', error)
    return null
  }
}

export async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get('auth-token')?.value || null
}

export async function setAuthToken(token: string) {
  const cookieStore = await cookies()
  cookieStore.set('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  })
}

export async function clearAuthToken() {
  const cookieStore = await cookies()
  cookieStore.delete('auth-token')
}

export interface Category {
  id: string
  name: string
  display_name: string
  description: string
  base_schema: Record<string, any>
  active: boolean
  created_at: string
}

export interface CategoriesResponse {
  categories: Category[]
  total: number
}

export interface ImageUploadResult {
  id: string
  urls: {
    thumbnail: { url: string; path: string; size: number }
    small: { url: string; path: string; size: number }
    medium: { url: string; path: string; size: number }
    large: { url: string; path: string; size: number }
  }
  metadata: {
    originalName: string
    label: string
    entityId: string
    tenantId: string
    uploadedBy: string
    createdAt: string
  }
}

export interface ImageUploadResponse {
  success: boolean
  message: string
  images: ImageUploadResult[]
}

export async function getCategories(): Promise<CategoriesResponse | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/categories`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching categories:', error)
    return null
  }
}

export interface SearchFilter {
  [key: string]: string | number | { min?: number; max?: number }
}

export interface SearchParams {
  category?: string
  filters?: SearchFilter
  q?: string
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  include_images?: boolean
  page?: number
  limit?: number
}

export interface FilterMetadata {
  [key: string]: {
    type: 'range' | 'select' | 'boolean'
    min?: number
    max?: number
    options?: string[]
  }
}

// Interface for entities returned from search API (different structure)
export interface SearchEntity {
  id: string
  entity_type: string
  tenant_id: string
  owner_id: string
  attributes: Record<string, any>
  share_token: string
  public_shareable: boolean
  disabled: boolean
  created_at: string
  updated_at: string
  mtcli_entity_categories?: {
    id: string
    description: string
    display_name: string
  }
  images?: Array<{
    id: string
    url: string | null
    label: string | null
  }>
}

export interface SearchResponse {
  entities: SearchEntity[]
  pagination: {
    page: number
    limit: number
    total: number
    has_more: boolean
  }
  availableFilters?: FilterMetadata
  search?: {
    category?: string
    filters?: Record<string, any>
    sort?: {
      by: string
      order: string
    }
    include_images?: string
  }
}

export async function getAllEntities(): Promise<EntitiesResponse | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value

    if (!token) {
      throw new Error('No authentication token found')
    }

    const response = await fetch(`${API_BASE_URL}/api/entities`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching all entities:', error)
    return null
  }
}

export async function searchEntities(params: SearchParams): Promise<SearchResponse | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value

    if (!token) {
      throw new Error('No authentication token found')
    }

    // Build query parameters
    const searchParams = new URLSearchParams()
    
    if (params.category) {
      searchParams.append('category', params.category)
    }
    
    if (params.q) {
      searchParams.append('q', params.q)
    }
    
    if (params.sort_by) {
      searchParams.append('sort_by', params.sort_by)
    }
    
    if (params.sort_order) {
      searchParams.append('sort_order', params.sort_order)
    }
    
    if (params.include_images) {
      searchParams.append('include_images', 'true')
    }
    
    if (params.page) {
      searchParams.append('page', params.page.toString())
    }
    
    if (params.limit) {
      searchParams.append('limit', params.limit.toString())
    }
    
    // Add filters
    if (params.filters) {
      Object.entries(params.filters).forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
          // Range filter
          if ('min' in value && value.min !== undefined) {
            searchParams.append(`${key}[min]`, value.min.toString())
          }
          if ('max' in value && value.max !== undefined) {
            searchParams.append(`${key}[max]`, value.max.toString())
          }
        } else {
          // Exact match filter
          searchParams.append(key, value.toString())
        }
      })
    }

    const response = await fetch(`${API_BASE_URL}/api/entities/search?${searchParams.toString()}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error searching entities:', error)
    return null
  }
}

export async function uploadEntityImages(
  entityId: string,
  files: File[],
  label?: string
): Promise<ImageUploadResponse | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value

    if (!token) {
      throw new Error('No authentication token found')
    }

    const formData = new FormData()
    files.forEach((file) => {
      formData.append('files', file)
    })

    if (label) {
      formData.append('label', label)
    }

    const response = await fetch(
      `${API_BASE_URL}/api/entities/${entityId}/images`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      }
    )

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error uploading images:', error)
    return null
  }
}
