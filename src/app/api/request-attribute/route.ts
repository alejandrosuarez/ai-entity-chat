import { NextResponse } from "next/server"
import { cookies } from "next/headers"

const API_BASE_URL = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "https://multi-tenant-cli-boilerplate-api.vercel.app"

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const token = cookieStore.get("auth_token")?.value

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { entityId, attributeName, ownerEmail, entityName } = await request.json()

  // Get requesting user info
  const userResponse = await fetch(`${API_BASE_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  
  if (!userResponse.ok) {
    return NextResponse.json({ error: "Failed to get user info" }, { status: 401 })
  }
  
  const { user } = await userResponse.json()

  // Send email notification
  const emailPayload = {
    email: ownerEmail,
    subject: `Request for information on your entity: ${entityName}`,
    message: `User ${user.email} requested info for "${attributeName}" on entity "${entityName}"`
  }

  try {
    const emailResponse = await fetch(`${API_BASE_URL}/api/test/send-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(emailPayload),
    })

    if (!emailResponse.ok) {
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 })
    }

    // Log the interaction using the correct endpoint
    const logPayload = {
      userId: user?.id || 'unknown',
      eventType: "request_attribute",
      message: `Requested attribute "${attributeName}" for entity "${entityName}"`,
      link: `${process.env.NEXT_PUBLIC_BASE_URL || ''}/#${entityId}`,
      tenantContext: 'default',
      eventPayload: { 
        entityId,
        requested_attribute: attributeName,
        owner_email: ownerEmail,
        requester_email: user.email,
        entity_name: entityName
      }
    }

    // Log to notifications (fire and forget)
    fetch(`${request.url.replace('/request-attribute', '/notifications/log')}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cookie": `auth_token=${token}`,
      },
      body: JSON.stringify(logPayload),
    }).catch(console.error)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error sending request attribute email:', error)
    return NextResponse.json({ error: "Failed to send request" }, { status: 500 })
  }
}
