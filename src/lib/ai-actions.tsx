'use server'

import { getMutableAIState } from 'ai/rsc'
import { ReactNode } from 'react'
import { type AI, type AIState } from './ai'

export async function submitUserMessage(content: string): Promise<{
  id: string
  display: ReactNode
}> {
  const aiState = getMutableAIState<typeof AI>()

  aiState.update((currentState: AIState) => ({
    ...currentState,
    messages: [
      ...currentState.messages,
      {
        id: Date.now().toString(),
        role: 'user',
        content: content,
      },
    ],
  }))

  // Simple response logic based on current state and input
  let responseContent = 'I understand. How can I help you with that?'

  const lowerContent = content.toLowerCase()

  if (lowerContent.includes('help') || lowerContent.includes('?')) {
    responseContent =
      "I'm here to help! You can use the buttons above to navigate, or feel free to ask me questions about managing your entities."
  } else if (
    lowerContent.includes('entity') ||
    lowerContent.includes('entities')
  ) {
    responseContent =
      'Great! You can use the "List My Entities" button to see your current entities, or "Create New Entity" to add a new one.'
  } else if (lowerContent.includes('thank')) {
    responseContent =
      "You're welcome! Is there anything else I can help you with?"
  }

  const currentState = aiState.get()
  aiState.done({
    ...currentState,
    messages: [
      ...currentState.messages,
      {
        id: Date.now().toString(),
        role: 'assistant',
        content: responseContent,
      },
    ],
  })

  return {
    id: Date.now().toString(),
    display: (
      <div className="flex justify-start animate-message-in">
        <div className="max-w-[80%] p-4 bg-muted rounded-2xl shadow-sm">
          <p className="text-sm">{responseContent}</p>
        </div>
      </div>
    ),
  }
}
