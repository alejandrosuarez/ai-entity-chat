import { createAI } from 'ai/rsc'
import { ReactNode } from 'react'
import { submitUserMessage } from './ai-actions'

export interface AIState {
  chatId: string
  messages: {
    id: string
    role: 'user' | 'assistant'
    content: string
  }[]
  authState: 'unauthenticated' | 'awaiting_otp' | 'authenticated'
  userEmail?: string
}

export type UIState = {
  id: string
  display: ReactNode
}[]

const initialAIState: AIState = {
  chatId: Date.now().toString(),
  messages: [],
  authState: 'unauthenticated',
}

const initialUIState: UIState = []

export const AI = createAI<AIState, UIState>({
  actions: {
    submitUserMessage,
  },
  initialUIState,
  initialAIState,
})
