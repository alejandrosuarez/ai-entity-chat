"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { generateChatId, generateChatUrl } from "@/lib/chat-utils"
import { toast } from '@/hooks/use-toast';

interface ContactOwnerButtonProps {
  entityId: string
  ownerId: string
  entityName: string
}

export function ContactOwnerButton({ entityId, ownerId, entityName }: ContactOwnerButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleContactOwner = async () => {
    setLoading(true)

    try {
      // Generate chat URL for current user
      const chatId = generateChatId(entityId)
      const userName = 'guest' // We could get this from auth context if available
      const chatUrl = generateChatUrl(chatId, userName, entityId)

      // Create notification loader URL
      const loaderUrl = new URL('/notification-loader', window.location.origin)
      loaderUrl.searchParams.set('url', encodeURIComponent(chatUrl))
      loaderUrl.searchParams.set('chatId', chatId)
      loaderUrl.searchParams.set('entityId', entityId)

      // Send notification to owner (background)
      const notifyResponse = await fetch("/api/notify-owner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entityId, ownerId, entityName }),
      })

      if (notifyResponse.ok) {
        toast({ 
          title: 'Chat Request Sent', 
          description: 'Owner has been notified. Redirecting to chat...', 
          variant: 'default' 
        })
        
        // Redirect to chat after a short delay using multiple approaches
        setTimeout(() => {
          // Try Next.js router first (for dev mode stability)
          try {
            const searchParams = new URLSearchParams({
              url: encodeURIComponent(chatUrl),
              chatId: chatId,
              entityId: entityId
            })
            router.push(`/notification-loader?${searchParams.toString()}`)
          } catch (routerError) {
            // Fallback to window.location.href
            console.log('Router navigation failed, using window.location.href:', routerError)
            window.location.href = loaderUrl.toString()
          }
        }, 1500)
      } else {
        toast({ 
          title: 'Error', 
          description: 'Failed to contact owner. Please try again.', 
          variant: 'destructive' 
        })
        setLoading(false)
      }
    } catch (error) {
      console.error('Error contacting owner:', error)
      toast({ 
        title: 'Error', 
        description: 'Failed to contact owner. Please try again.', 
        variant: 'destructive' 
      })
      setLoading(false)
    }
  }

  return (
    <Button onClick={handleContactOwner} disabled={loading} className="w-full">
      {loading ? "Connecting..." : "Contact Owner"}
    </Button>
  )
}
