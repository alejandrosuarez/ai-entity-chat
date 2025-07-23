import { NextResponse } from "next/server"
import { cookies } from "next/headers"

const API_BASE_URL = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "https://multi-tenant-cli-boilerplate-api.vercel.app"

export async function POST(request: Request) {
  const { action, testToken } = await request.json()
  const cookieStore = await cookies()

  if (action === 'set') {
    // Set a test token
    cookieStore.set('auth_token', testToken || 'test-token-12345', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })
    return NextResponse.json({ success: true, message: 'Token set' })
  }
  
  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}

export async function GET() {
  const cookieStore = await cookies()
  const token = cookieStore.get("auth_token")?.value

  console.log('test-auth: checking authentication')
  console.log('test-auth: token exists?', !!token)
  console.log('test-auth: API_BASE_URL:', API_BASE_URL)

  if (!token) {
    return NextResponse.json({ 
      authenticated: false, 
      error: "No auth token found in cookies",
      cookies: Object.fromEntries(cookieStore.getAll().map(c => [c.name, '***']))
    })
  }

  // Test the external API with this token
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    console.log('test-auth: auth/me response status:', response.status)

    if (response.ok) {
      const { user } = await response.json()
      return NextResponse.json({ 
        authenticated: true, 
        user: user,
        api_base_url: API_BASE_URL
      })
    } else {
      const errorText = await response.text()
      console.log('test-auth: auth/me error:', errorText)
      return NextResponse.json({ 
        authenticated: false, 
        token_exists: true,
        api_error: errorText,
        api_status: response.status,
        api_base_url: API_BASE_URL
      })
    }
  } catch (error) {
    console.error('test-auth: fetch error:', error)
    return NextResponse.json({ 
      authenticated: false, 
      token_exists: true,
      fetch_error: error instanceof Error ? error.message : 'Unknown error',
      api_base_url: API_BASE_URL
    })
  }
}
