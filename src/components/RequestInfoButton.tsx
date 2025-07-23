"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from '@/hooks/use-toast';

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
        toast({ title: 'Success', description: `Request for ${attributeName} sent to owner.`, variant: 'default' })
      } else {
        toast({ title: 'Error', description: 'Failed to send request.', variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to send request.', variant: 'destructive' })
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
