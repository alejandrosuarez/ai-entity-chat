import { cookies } from 'next/headers'

const TOKEN_COOKIE_NAME = 'auth_token'

/**
 * Get the authentication token from cookies
 * @returns The JWT token or null if not present
 */
export async function getToken(): Promise<string | null> {
  const cookieStore = await cookies()
  const tokenCookie = cookieStore.get(TOKEN_COOKIE_NAME)
  return tokenCookie?.value || null
}

/**
 * Set the authentication token in cookies
 * @param jwt - The JWT token to store
 */
export async function setToken(jwt: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(TOKEN_COOKIE_NAME, jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  })
}

/**
 * Clear the authentication token from cookies
 */
export async function clearToken(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(TOKEN_COOKIE_NAME)
}
