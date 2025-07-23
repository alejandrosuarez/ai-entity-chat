import { NextResponse } from "next/server"
import { cookies } from "next/headers"

const API_BASE_URL = process.env.API_BASE_URL || "https://multi-tenant-cli-boilerplate-api.vercel.app"

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    // Validate required fields for the notification send endpoint
    if (!body.userId || !body.eventType || !body.message) {
      return NextResponse.json(
        { error: "Missing required fields: userId, eventType, message" }, 
        { status: 400 }
      )
    }

    // Map our log request to the notifications/send API format
    const payload = {
      userId: body.userId,
      eventType: body.eventType,
      message: body.message,
      link: body.link || '',
      tenantContext: body.tenantContext || 'default',
      eventPayload: body.eventPayload || {}
    }

    const apiResponse = await fetch(`${API_BASE_URL}/api/notifications/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text()
      console.error('API Error:', apiResponse.status, errorText)
      return NextResponse.json(
        { error: "Failed to send notification" }, 
        { status: apiResponse.status }
      )
    }

    const data = await apiResponse.json()
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Notifications send error:', error)
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    )
  }
}
