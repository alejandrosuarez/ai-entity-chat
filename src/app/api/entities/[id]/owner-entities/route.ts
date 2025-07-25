import { NextResponse } from "next/server"
import { cookies } from "next/headers"

const API_BASE_URL = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "https://multi-tenant-cli-boilerplate-api.vercel.app"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value
    const { id } = await params

    if (!id) {
      return NextResponse.json({ error: "Entity ID is required" }, { status: 400 })
    }

    // First get the current entity to find the owner
    const entityResponse = await fetch(`${API_BASE_URL}/api/entities/${id}`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
        'Content-Type': 'application/json',
      },
    })

    if (!entityResponse.ok) {
      return NextResponse.json({ error: "Failed to fetch entity" }, { status: entityResponse.status })
    }

    const entityData = await entityResponse.json()
    const entity = entityData.entity || entityData

    if (!entity.owner_id) {
      return NextResponse.json({ entities: [] })
    }

    // Get other entities by the same owner
    const searchParams = new URLSearchParams()
    searchParams.append('owner_id', entity.owner_id)
    // Exclude the current entity
    searchParams.append('exclude_id', id)
    searchParams.append('limit', '10')

    const ownerEntitiesResponse = await fetch(`${API_BASE_URL}/api/entities/search?${searchParams}`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
        'Content-Type': 'application/json',
      },
    })

    if (!ownerEntitiesResponse.ok) {
      // If the search endpoint doesn't exist, return empty array
      return NextResponse.json({ entities: [] })
    }

    const ownerEntitiesData = await ownerEntitiesResponse.json()
    return NextResponse.json({ entities: ownerEntitiesData.entities || ownerEntitiesData || [] })
  } catch (error) {
    console.error('Owner entities fetch error:', error)
    // Return empty array instead of error to prevent UI breaking
    return NextResponse.json({ entities: [] })
  }
}
