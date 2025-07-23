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
    cookieStore.set('auth-token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
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
  cookieStore.delete('auth-token')
  revalidatePath('/')
}

export async function getAuthStatusAction() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  return !!token
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
