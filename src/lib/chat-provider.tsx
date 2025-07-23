'use client'

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react'
import { ChatFSM, FSMState } from './chat-fsm'
import { AIState } from './ai'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

export interface UINode {
  type: 'emailForm' | 'otpForm' | 'entityList' | 'entityForm' | null
  props?: any
}

export interface ChatContextType {
  // State
  messages: Message[]
  uiNode: UINode
  fsm: ChatFSM

  // Actions
  sendUserMessage: (content: string) => void
  dispatchBotMessage: (content: string) => void
  transition: (state: FSMState, payload?: any) => void
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export interface ChatProviderProps {
  children: ReactNode
  initialState?: FSMState
}

export function ChatProvider({
  children,
  initialState = 'unauth',
}: ChatProviderProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [uiNode, setUINode] = useState<UINode>({ type: null })
  const [fsm] = useState(() => new ChatFSM(initialState))

  const sendUserMessage = useCallback((content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
    }
    setMessages((prev) => [...prev, newMessage])
  }, [])

  const dispatchBotMessage = useCallback((content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content,
    }
    setMessages((prev) => [...prev, newMessage])
  }, [])

  const transition = useCallback(
    (state: FSMState, payload?: any) => {
      fsm.transition(state)
      console.log(`Transitioning to: ${state}`)

      // Update UI node based on state
      switch (state) {
        case 'unauth':
          setUINode({ type: null })
          break
        case 'emailForm':
          dispatchBotMessage('Welcome! Please enter your email.')
          setUINode({ type: 'emailForm', props: payload })
          break
        case 'otpForm':
          dispatchBotMessage('Please enter the OTP sent to your email.')
          setUINode({ type: 'otpForm', props: payload })
          break
        case 'authenticated':
          dispatchBotMessage('Welcome back! You are now authenticated.')
          setUINode({ type: null })
          break
        case 'listing':
          setUINode({ type: 'entityList', props: payload })
          break
        case 'creating':
          setUINode({ type: 'entityForm', props: payload })
          break
        default:
          setUINode({ type: null })
      }
    },
    [fsm]
  )

  const contextValue: ChatContextType = {
    messages,
    uiNode,
    fsm,
    sendUserMessage,
    dispatchBotMessage,
    transition,
  }

  return (
    <ChatContext.Provider value={contextValue}>{children}</ChatContext.Provider>
  )
}

export function useChatContext() {
  const context = useContext(ChatContext)
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider')
  }
  return context
}
