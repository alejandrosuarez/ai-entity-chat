import { NextResponse } from "next/server"

const API_BASE_URL = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "https://multi-tenant-cli-boilerplate-api.vercel.app"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    if (!token) {
      return NextResponse.json({ error: "Share token is required" }, { status: 400 })
    }

    // Fetch shared entity from external API (no auth required for public shares)
    const response = await fetch(`${API_BASE_URL}/api/shared/${token}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store' // Ensure fresh data for shared entities
    })

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: "Shared entity not found" }, { status: 404 })
      }
      
      const errorText = await response.text()
      console.error('External API Error:', response.status, errorText)
      return NextResponse.json(
        { error: "Failed to fetch shared entity" }, 
        { status: response.status }
      )
    }

    const data = await response.json()
    
    // Add images to the entity if it has any
    if (data.entity && data.entity.id) {
      try {
        const imagesResponse = await fetch(`${API_BASE_URL}/api/entities/${data.entity.id}/images`, {
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (imagesResponse.ok) {
          const imagesData = await imagesResponse.json()
          data.entity.images = imagesData.images || []
        }
      } catch (error) {
        console.error(`Error fetching images for shared entity ${data.entity.id}:`, error)
        // Continue without images if they fail to load
        data.entity.images = []
      }
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Shared entity fetch error:', error)
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    )
  }
}
