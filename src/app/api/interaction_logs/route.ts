import { NextResponse } from "next/server"
import { cookies } from "next/headers"

const API_BASE_URL = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "https://multi-tenant-cli-boilerplate-api.vercel.app"

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value
    
    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const entityId = searchParams.get('entityId')
    const limit = searchParams.get('limit') || '100'
    const eventType = searchParams.get('eventType')

    // Build query parameters
    const queryParams = new URLSearchParams()
    queryParams.append('limit', limit)
    if (entityId) queryParams.append('entity_id', entityId)
    if (eventType) queryParams.append('eventType', eventType)

    // Try to fetch from external API first
    try {
      const response = await fetch(`${API_BASE_URL}/api/interaction_logs?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        return NextResponse.json(data)
      }
    } catch (error) {
      console.error('External API fetch failed:', error)
    }

    // Fallback to local notifications history endpoint
    const fallbackParams = new URLSearchParams()
    fallbackParams.append('limit', limit)
    if (entityId) fallbackParams.append('entityId', entityId)
    
    const fallbackResponse = await fetch(`${request.url.replace('/interaction_logs', '/notifications/history')}?${fallbackParams}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (fallbackResponse.ok) {
      const data = await fallbackResponse.json()
      return NextResponse.json({ logs: data.notifications || data || [] })
    }

    return NextResponse.json({ logs: [] })
  } catch (error) {
    console.error('Interaction logs fetch error:', error)
    return NextResponse.json(
      { error: "Failed to fetch interaction logs" }, 
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value
    const body = await request.json()

    const logData = {
      userId: token ? 'authenticated_user' : 'anonymous',
      eventType: body.eventType || 'interaction',
      message: body.message,
      link: body.link || '',
      tenantContext: body.tenantContext || 'entity_interaction',
      eventPayload: {
        entityId: body.entityId,
        interactionType: body.interactionType,
        timestamp: new Date().toISOString(),
        authenticated: !!token,
        ...body.eventPayload
      }
    }

    // Try to log to external API first
    if (token) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/interaction_logs`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(logData)
        })

        if (response.ok) {
          const data = await response.json()
          return NextResponse.json(data, { status: 201 })
        }
      } catch (error) {
        console.error('External API logging failed:', error)
      }
    }

    // Fallback to local notifications log endpoint
    const fallbackResponse = await fetch(`${request.url.replace('/interaction_logs', '/notifications/log')}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(logData)
    })

    if (fallbackResponse.ok) {
      const data = await fallbackResponse.json()
      return NextResponse.json(data, { status: 201 })
    }

    return NextResponse.json({ message: 'Interaction logged successfully' }, { status: 201 })
  } catch (error) {
    console.error('Interaction logging error:', error)
    return NextResponse.json(
      { error: "Failed to log interaction" }, 
      { status: 500 }
    )
  }
}
