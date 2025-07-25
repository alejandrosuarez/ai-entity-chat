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
    const limit = searchParams.get('limit') || '10'
    const excludeId = searchParams.get('exclude_id')

    // Fetch user's entities from external API
    const response = await fetch(`${API_BASE_URL}/api/my/entities?limit=${limit}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      if (response.status === 401) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
      
      const errorText = await response.text()
      console.error('External API Error:', response.status, errorText)
      return NextResponse.json(
        { error: "Failed to fetch entities" }, 
        { status: response.status }
      )
    }

    const data = await response.json()
    let entities = data.entities || data || []

    // Filter out excluded entity if specified
    if (excludeId) {
      entities = entities.filter((entity: any) => entity.id !== excludeId)
    }

    return NextResponse.json({ entities })
  } catch (error) {
    console.error('My entities fetch error:', error)
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    )
  }
}
