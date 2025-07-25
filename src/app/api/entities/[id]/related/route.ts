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

    // First get the current entity to find related ones
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

    // Get related entities based on category and entity_type
    let relatedEntities: any[] = []
    
    // First try: Search by category ID if available
    if (entity.mtcli_entity_categories?.id) {
      const categoryParams = new URLSearchParams()
      categoryParams.append('category_id', entity.mtcli_entity_categories.id)
      categoryParams.append('exclude_id', id)
      categoryParams.append('limit', '10')

      const categoryResponse = await fetch(`${API_BASE_URL}/api/entities/search?${categoryParams}`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
          'Content-Type': 'application/json',
        },
      })

      if (categoryResponse.ok) {
        const categoryData = await categoryResponse.json()
        relatedEntities = categoryData.entities || []
      }
    }

    // Second try: If not enough results, search by entity_type
    if (relatedEntities.length < 5 && entity.entity_type) {
      const typeParams = new URLSearchParams()
      typeParams.append('entity_type', entity.entity_type)
      typeParams.append('exclude_id', id)
      typeParams.append('limit', '10')

      const typeResponse = await fetch(`${API_BASE_URL}/api/entities/search?${typeParams}`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
          'Content-Type': 'application/json',
        },
      })

      if (typeResponse.ok) {
        const typeData = await typeResponse.json()
        const typeEntities = typeData.entities || []
        
        // Merge results, avoiding duplicates
        const existingIds = new Set(relatedEntities.map((e: any) => e.id))
        const newEntities = typeEntities.filter((e: any) => !existingIds.has(e.id))
        relatedEntities = [...relatedEntities, ...newEntities].slice(0, 10)
      }
    }

    // Third try: If still not enough, find entities with similar attributes
    if (relatedEntities.length < 3 && entity.attributes) {
      const allParams = new URLSearchParams()
      allParams.append('exclude_id', id)
      allParams.append('limit', '20')

      const allResponse = await fetch(`${API_BASE_URL}/api/entities/search?${allParams}`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
          'Content-Type': 'application/json',
        },
      })

      if (allResponse.ok) {
        const allData = await allResponse.json()
        const allEntities = allData.entities || []
        
        // Score entities based on attribute similarity
        const scoredEntities = allEntities
          .filter((e: any) => e.id !== id)
          .map((e: any) => {
            let score = 0
            if (e.attributes && entity.attributes) {
              // Count matching non-null attribute values
              Object.keys(entity.attributes).forEach(key => {
                if (entity.attributes[key] && e.attributes[key] && 
                    String(entity.attributes[key]).toLowerCase() === String(e.attributes[key]).toLowerCase()) {
                  score += 1
                }
              })
            }
            return { ...e, similarity_score: score }
          })
          .filter((e: any) => e.similarity_score > 0)
          .sort((a: any, b: any) => b.similarity_score - a.similarity_score)
          .slice(0, 5)

        // Merge with existing results
        const existingIds = new Set(relatedEntities.map((e: any) => e.id))
        const newSimilarEntities = scoredEntities.filter((e: any) => !existingIds.has(e.id))
        relatedEntities = [...relatedEntities, ...newSimilarEntities].slice(0, 10)
      }
    }

    return NextResponse.json({ entities: relatedEntities })
  } catch (error) {
    console.error('Related entities fetch error:', error)
    // Return empty array instead of error to prevent UI breaking
    return NextResponse.json({ entities: [] })
  }
}
