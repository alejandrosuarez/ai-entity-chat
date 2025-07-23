import { NextResponse } from "next/server"
import { cookies } from "next/headers"

const API_BASE_URL = process.env.API_BASE_URL || "https://multi-tenant-cli-boilerplate-api.vercel.app"

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)

    const queryParams = new URLSearchParams({
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
      ...(searchParams.get('entity_id') && { entity_id: searchParams.get('entity_id')! }),
      ...(searchParams.get('notification_type') && { notification_type: searchParams.get('notification_type')! })
    })

    const apiResponse = await fetch(`${API_BASE_URL}/api/notifications/history?${queryParams}`, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
    })

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text()
      console.error('API Error:', apiResponse.status, errorText)
      return NextResponse.json(
        { error: "Failed to fetch notification history" }, 
        { status: apiResponse.status }
      )
    }

    const data = await apiResponse.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Notifications history GET error:', error)
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    )
  }
}

// POST is not supported by the backend API for notifications/history
// Use /api/notifications/send for logging notifications
