import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { generateChatId, generateOwnerChatUrl } from "@/lib/chat-utils"

const API_BASE_URL = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "https://multi-tenant-cli-boilerplate-api.vercel.app"

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const token = cookieStore.get("auth_token")?.value

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { entityId, ownerId, entityName } = await request.json()
  
  try {
    // Generate owner chat URL
    const chatId = generateChatId(entityId)
    const ownerChatUrl = generateOwnerChatUrl(chatId, ownerId, entityId)

    // Send push notification to owner
    const apiResponse = await fetch(`${API_BASE_URL}/api/notifications/chat-request`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        entityId,
        chatUrl: ownerChatUrl,
        url: ownerChatUrl
      }),
    })

    if (!apiResponse.ok) {
      console.error('Failed to send notification:', await apiResponse.text())
      return NextResponse.json({ error: "Failed to notify owner" }, { status: 500 })
    }

    // Get current user info for logging
    const userResponse = await fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const { user } = await userResponse.json()

    // Log notification using the correct endpoint (fire and forget)
    const logPayload = {
      userId: user?.id || 'unknown',
      eventType: "chat_request",
      message: `Chat request sent for entity: ${entityName}`,
      link: ownerChatUrl,
      tenantContext: 'default',
      eventPayload: { 
        entityId,
        chat_url: ownerChatUrl, 
        chat_id: chatId,
        owner_id: ownerId,
        entity_name: entityName
      }
    }

    fetch(`${API_BASE_URL}/api/notifications/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(logPayload),
    }).catch(console.error)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in notify-owner:', error)
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 })
  }
}
