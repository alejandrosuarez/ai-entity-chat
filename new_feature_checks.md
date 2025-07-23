
## 🔍 Feature Analysis Summary

### 1. Request Info Feature (components/request-attribute-button.tsx:28)

• Purpose: Allows users to request missing information from entity owners
• API: /api/request-attribute → ${API_BASE_URL}/api/test/send-email
• Flow: Button click → API call → Email notification to owner

### 2. Contact Owner Feature (components/contact-owner-button.tsx:48)

• Purpose: Initiates chat between user and entity owner via iframe
• API: /api/notify-owner → ${API_BASE_URL}/api/notifications/chat-request
• Flow: Button click → Generate chat URL → Send push notification → Redirect to chat

### 3. User Interaction Logging (app/api/notifications/history/route.ts:94)

• Purpose: Tracks all user interactions and notifications
• API: /api/notifications/history → ${API_BASE_URL}/api/notifications/history
• Flow: Action → Log to backend → Store in notification history

─────────────────────────────────────────

## 🚀 Implementation Guide for Your Other UI

### 1. Request Info Feature Implementation

// components/RequestInfoButton.tsx
"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"

interface RequestInfoButtonProps {
  entityId: string
  attributeName: string
  ownerEmail: string
  entityName: string
}

export function RequestInfoButton({ entityId, attributeName, ownerEmail, entityName }: RequestInfoButtonProps) {
  const [loading, setLoading] = useState(false)
  const [requested, setRequested] = useState(false)

  const handleRequest = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/request-attribute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entityId, attributeName, ownerEmail, entityName }),
      })

      if (response.ok) {
        setRequested(true)
        // Show success message
      }
    } catch (error) {
      // Handle error
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={handleRequest} disabled={loading || requested}>
      {requested ? "Requested" : "Request Info"}
    </Button>
  )
}

// app/api/request-attribute/route.ts
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

const API_BASE_URL = "https://multi-tenant-cli-boilerplate-api.vercel.app"

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
  const { user } = await userResponse.json()

  // Send email notification
  const emailPayload = {
    email: ownerEmail,
    subject: `Request for information on your entity: ${entityName}`,
    message: `User ${user.email} requested info for "${attributeName}" on entity "${entityName}"`
  }

  const emailResponse = await fetch(`${API_BASE_URL}/api/test/send-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(emailPayload),
  })

  return NextResponse.json({ success: true })
}

### 2. Contact Owner with Chat Integration

// lib/chat-utils.ts
import crypto from 'crypto'

export const generateChatId = (entityId: string): string => {
  return crypto.createHash('sha256').update(entityId).digest('hex')
}

export const generateChatUrl = (chatId: string, userName: string, entityId: string): string => {
  const baseChatUrl = process.env.NEXT_PUBLIC_BASE_CHAT_URL || "https://x.stafa.me"
  return `${baseChatUrl}/request?chatId=${chatId}&name=${userName}&entity=${entityId}`
}

export const generateOwnerChatUrl = (chatId: string, ownerName: string, entityId: string): string => {
  const baseChatUrl = process.env.NEXT_PUBLIC_BASE_CHAT_URL || "https://x.stafa.me"
  return `${baseChatUrl}/request?chatId=${chatId}&name=${ownerName}&entity=${entityId}&role=owner`
}

// components/ContactOwnerButton.tsx
"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { generateChatId, generateChatUrl } from "@/lib/chat-utils"

interface ContactOwnerButtonProps {
  entityId: string
  ownerId: string
  entityName: string
}

export function ContactOwnerButton({ entityId, ownerId, entityName }: ContactOwnerButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleContactOwner = async () => {
    setLoading(true)

    // Generate chat URL for current user
    const chatId = generateChatId(entityId)
    const userName = user?.id || 'guest'
    const chatUrl = generateChatUrl(chatId, userName, entityId)

    // Create notification loader URL
    const loaderUrl = new URL('/notification-loader', window.location.origin)
    loaderUrl.searchParams.set('url', encodeURIComponent(chatUrl))
    loaderUrl.searchParams.set('chatId', chatId)
    loaderUrl.searchParams.set('entityId', entityId)

    // Send notification to owner (background)
    fetch("/api/notify-owner", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entityId, ownerId, entityName }),
    }).catch(console.error)

    // Redirect to chat
    setTimeout(() => {
      window.location.href = loaderUrl.toString()
    }, 500)
  }

  return (
    <Button onClick={handleContactOwner} disabled={loading}>
      {loading ? "Connecting..." : "Contact Owner"}
    </Button>
  )
}

// app/api/notify-owner/route.ts
import { NextResponse } from "next/server"
import { generateChatId, generateOwnerChatUrl } from "@/lib/chat-utils"

const API_BASE_URL = "https://multi-tenant-cli-boilerplate-api.vercel.app"

export async function POST(request: Request) {
  const { entityId, ownerId, entityName } = await request.json()
  const token = cookies().get("auth_token")?.value

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

  // Log notification to history
  await fetch(`${request.url.split('/api')[0]}/api/notifications/history`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cookie": `auth_token=${token}`,
    },
    body: JSON.stringify({
      entity_id: entityId,
      notification_type: "chat_request",
      message: `Chat request for entity: ${entityName}`,
      status: "sent",
      metadata: { chat_url: ownerChatUrl, chat_id: chatId }
    }),
  })

  return NextResponse.json({ success: true })
}

### 3. Notification Loader Page

// app/notification-loader/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function NotificationLoader() {
  const searchParams = useSearchParams()
  const [targetUrl, setTargetUrl] = useState<string | null>(null)

  useEffect(() => {
    const url = searchParams.get('url')
    if (url) {
      setTargetUrl(decodeURIComponent(url))
    }
  }, [searchParams])

  const handleRedirect = () => {
    if (targetUrl) {
      try {
        const url = new URL(targetUrl)
        if (url.origin === window.location.origin) {
          window.location.href = targetUrl
        } else {
          window.open(targetUrl, '_blank', 'noopener,noreferrer')
        }
      } catch {
        window.location.href = targetUrl
      }
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-4">
        <h1>Notification Redirect</h1>
        <p>You're being redirected from a notification.</p>
        <Button onClick={handleRedirect}>Continue to Chat</Button>
      </div>
    </div>
  )
}

### 4. User Interaction Logging System

// app/api/notifications/history/route.ts
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

const API_BASE_URL = "https://multi-tenant-cli-boilerplate-api.vercel.app"

export async function GET(request: Request) {
  const token = cookies().get("auth_token")?.value
  const { searchParams } = new URL(request.url)

  const queryParams = new URLSearchParams({
    page: searchParams.get('page') || '1',
    limit: searchParams.get('limit') || '20',
    ...(searchParams.get('entity_id') && { entity_id: searchParams.get('entity_id')! }),
    ...(searchParams.get('notification_type') && { notification_type: searchParams.get('notification_type')! })
  })

  const apiResponse = await fetch(`${API_BASE_URL}/api/notifications/history?${queryParams}`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  return NextResponse.json(await apiResponse.json())
}

export async function POST(request: Request) {
  const token = cookies().get("auth_token")?.value
  const body = await request.json()

  const apiResponse = await fetch(`${API_BASE_URL}/api/notifications/history`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      entity_id: body.entity_id,
      notification_type: body.notification_type,
      message: body.message,
      status: body.status || 'sent',
      timestamp: new Date().toISOString(),
      metadata: body.metadata
    }),
  })

  return NextResponse.json(await apiResponse.json(), { status: 201 })
}

─────────────────────────────────────────

## 🔧 Key Environment Variables

API_BASE_URL=https://multi-tenant-cli-boilerplate-api.vercel.app // !!!we already have this on our env
NEXT_PUBLIC_BASE_CHAT_URL=https://x.stafa.me
NEXT_PUBLIC_ONESIGNAL_APP_ID=your_onesignal_app_id // we will define these later
ONESIGNAL_REST_API_KEY=your_onesignal_rest_key // we will define these later

─────────────────────────────────────────

## 📋 Integration Checklist

[ ] Set up authentication token management (we already have this right?)
[ ] Configure API base URL and chat URL (we need to setup chat url)
[ ] Implement request info button with email notifications 
[ ] Create contact owner button with chat integration
[ ] Set up notification loader page for iframe redirects
[ ] Implement notification history logging
[ ] Configure push notifications (OneSignal)
[ ] Test chat URL generation and redirection
[ ] Add error handling and loading states