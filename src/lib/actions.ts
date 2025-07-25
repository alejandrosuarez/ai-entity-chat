'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import {
  sendOtp,
  verifyOtp,
  getEntities,
  createEntity,
  getCategories,
  uploadEntityImages,
  getAllEntities,
  searchEntities,
  type CreateEntityRequest,
  type Category,
  type SearchParams,
} from './api'

export async function sendOtpAction(email: string) {
  const result = await sendOtp(email)
  return result
}

export async function verifyOtpAction(email: string, otp: string) {
  const result = await verifyOtp(email, otp)

  if (result.success && result.token) {
    // Set the auth token in an httpOnly cookie
    const cookieStore = await cookies()
    cookieStore.set('auth_token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // Changed from strict to lax for production compatibility
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })
  }

  return result
}

export async function getEntitiesAction() {
  return await getEntities()
}

export async function getEntitiesWithImagesAction() {
  const { fetchEntitiesWithImages } = await import('./entityHelpers')
  return await fetchEntitiesWithImages()
}

export async function createEntityAction(data: CreateEntityRequest) {
  const result = await createEntity(data)
  if (result) {
    revalidatePath('/')
  }
  return result
}

export async function logoutAction() {
  const cookieStore = await cookies()
  cookieStore.delete('auth_token')
  revalidatePath('/')
}

export async function getAuthStatusAction() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  
  if (!token) {
    return false
  }
  
  // Validate token with remote API
  try {
    const API_BASE_URL = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "https://multi-tenant-cli-boilerplate-api.vercel.app"
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
    })
    
    if (response.ok) {
      // Token is valid, user is authenticated
      return true
    } else {
      // Token is invalid, clear it
      cookieStore.delete('auth_token')
      return false
    }
  } catch (error) {
    console.error('Auth validation error:', error)
    // On network error, assume user is still authenticated if token exists
    // This prevents logout on temporary network issues
    return true
  }
}

export async function getCurrentUserAction() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  
  if (!token) {
    return null
  }
  
  try {
    const API_BASE_URL = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "https://multi-tenant-cli-boilerplate-api.vercel.app"
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
    })
    
    if (response.ok) {
      const data = await response.json()
      return data.user
    } else {
      // Token is invalid, clear it
      cookieStore.delete('auth_token')
      return null
    }
  } catch (error) {
    console.error('Get current user error:', error)
    return null
  }
}

export async function getCategoriesAction() {
  return await getCategories()
}

export async function getAllEntitiesAction() {
  return await getAllEntities()
}

export async function searchEntitiesAction(params: SearchParams) {
  return await searchEntities(params)
}

export async function uploadEntityImagesAction(
  entityId: string,
  formData: FormData
) {
  const files = formData.getAll('files') as File[]
  const label = formData.get('label') as string | null

  return await uploadEntityImages(entityId, files, label || undefined)
}

export async function fetchEntityWithImagesAction(entityId: string) {
  const { fetchEntityWithImages } = await import('./entityHelpers')
  return await fetchEntityWithImages(entityId)
}
