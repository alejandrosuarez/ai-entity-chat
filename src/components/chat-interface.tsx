'use client'

import { useState, useEffect, useRef } from 'react'
import { useUIState } from 'ai/rsc'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { EmailForm } from './email-form'
import { OtpForm } from './otp-form'
import { CommandButtons } from './command-buttons'
import { EntityList } from './entity-list'
import { EntityForm } from './entity-form'
import { EntityExplorer } from './entity-explorer'
import { EntityListSkeleton } from './entity-skeleton'
import { getEntitiesAction, getEntitiesWithImagesAction, getAuthStatusAction } from '@/lib/actions'
import { useToast } from '@/hooks/use-toast'
import { type AI } from '@/lib/ai'
import { submitUserMessage } from '@/lib/ai-actions'
import { type Entity } from '@/lib/api'
import { type EntityWithImages } from '@/lib/entityHelpers'
import { ThemeToggle } from './theme-toggle'

// Counter to ensure unique message IDs
let messageIdCounter = 0
const generateMessageId = () => {
  messageIdCounter += 1
  return `msg-${Date.now()}-${messageIdCounter}`
}

type AppState =
  | 'loading'
  | 'unauthenticated'
  | 'awaiting_otp'
  | 'authenticated'
  | 'list_entities'
  | 'create_entity'

export function ChatInterface() {
  const [conversation, setConversation] = useUIState<typeof AI>()
  const [appState, setAppState] = useState<AppState>('loading')
  const [userEmail, setUserEmail] = useState('')
  const [entities, setEntities] = useState<EntityWithImages[]>([])
  const [entitiesLoading, setEntitiesLoading] = useState(false)
  const [input, setInput] = useState('')
  const [currentView, setCurrentView] = useState<'none' | 'email' | 'otp' | 'commands' | 'list' | 'create' | 'explore'>('none')
  const [statusLog, setStatusLog] = useState<string[]>([])
  const [persistentMessages, setPersistentMessages] = useState<Array<{id: string, content: React.ReactNode, type: 'user' | 'system'}>>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    checkAuthStatus()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversation])

  // Helper functions for status log management
  const addToStatusLog = (message: string) => {
    setStatusLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }
  
  const clearStatusLog = () => {
    setStatusLog([])
  }

  const resetToUnauth = () => {
    setAppState('unauthenticated')
    setCurrentView('email')
    addToStatusLog('Logged out successfully')
    toast({
      title: 'Logged out',
      description: 'You have been logged out successfully.',
      variant: 'default',
    })
  }

  const checkAuthStatus = async () => {
    try {
      const isAuthenticated = await getAuthStatusAction()
      if (isAuthenticated) {
        setAppState('authenticated')
        setCurrentView('commands')
        addToStatusLog('Authentication verified')
      } else {
        setAppState('unauthenticated')
        setCurrentView('email')
        addToStatusLog('Please sign in to continue')
      }
    } catch (error) {
      setAppState('unauthenticated')
      setCurrentView('email')
      addToStatusLog('Authentication check failed')
    }
  }


  const handleListEntities = async () => {
    try {
      setCurrentView('list')
      setEntitiesLoading(true)
      setEntities([]) // Clear previous entities
      addToStatusLog('Loading entities...')
      
      const entitiesWithImages = await getEntitiesWithImagesAction()
      
      if (entitiesWithImages) {
        setEntities(entitiesWithImages)
        addToStatusLog(`Found ${entitiesWithImages.length} entities`)
      } else {
        addToStatusLog('Failed to load entities')
        toast({
          title: 'Error',
          description: 'Failed to load entities. Please try again.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      addToStatusLog('Error loading entities')
      toast({
        title: 'Error',
        description: 'Something went wrong while loading entities.',
        variant: 'destructive',
      })
    } finally {
      setEntitiesLoading(false)
    }
  }

  const handleCreateEntity = () => {
    setCurrentView('create')
    addToStatusLog('Opening entity creation form')
  }
  
  const handleBackToCommands = () => {
    setCurrentView('commands')
    addToStatusLog('Returned to main menu')
  }
  
  const handleEntityCreated = () => {
    addToStatusLog('Entity created successfully!')
    setCurrentView('commands')
  }
  
  const handleExploreEntities = () => {
    setCurrentView('explore')
    addToStatusLog('Opening entity explorer')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    // Add user message to persistent messages
    const userMessage = {
      id: generateMessageId(),
      content: (
        <div className="flex justify-end animate-message-out">
          <Card className="max-w-[80%] bg-primary text-primary-foreground rounded-2xl shadow-sm">
            <CardContent className="p-3">
              <p className="text-sm">{input}</p>
            </CardContent>
          </Card>
        </div>
      ),
      type: 'user' as const
    }

    setPersistentMessages(prev => [...prev, userMessage])
    addToStatusLog(`User: ${input}`)
    setInput('')

    try {
      const response = await submitUserMessage(input)
      // Add AI response to persistent messages
      const aiMessage = {
        id: generateMessageId(),
        content: response.display,
        type: 'system' as const
      }
      setPersistentMessages(prev => [...prev, aiMessage])
      addToStatusLog('AI responded')
    } catch (error) {
      addToStatusLog('Error getting AI response')
    }
  }

  if (appState === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse text-lg">Loading...</div>
      </div>
    )
  }

  // Render current view content
  const renderCurrentView = () => {
    switch (currentView) {
      case 'email':
        return (
          <div className="mb-4">
            <div className="p-4 bg-muted rounded-lg mb-4">
              <p className="font-medium">
                Welcome to the Multi-Tenant API Chat! 👋
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Let&apos;s get you signed in to start managing your entities.
              </p>
            </div>
            <EmailForm
              onSuccess={(email) => {
                setUserEmail(email)
                setAppState('awaiting_otp')
                setCurrentView('otp')
                addToStatusLog(`OTP sent to ${email}`)
              }}
            />
          </div>
        )
      
      case 'otp':
        return (
          <div className="mb-4">
            <div className="p-4 bg-muted rounded-lg mb-4">
              <p className="font-medium">OTP Sent! 📧</p>
              <p className="text-sm text-muted-foreground mt-1">
                Please check your email and enter the 6-digit verification code.
              </p>
            </div>
            <OtpForm
              email={userEmail}
              onSuccess={() => {
                setAppState('authenticated')
                setCurrentView('commands')
                addToStatusLog('Authentication successful!')
              }}
              onBack={() => {
                setAppState('unauthenticated')
                setCurrentView('email')
                addToStatusLog('Returned to email form')
              }}
            />
          </div>
        )
      
      case 'commands':
        return (
          <div className="mb-4">
            <div className="p-4 bg-muted rounded-lg mb-4">
              <p className="font-medium">Welcome back! 🎉</p>
              <p className="text-sm text-muted-foreground mt-1">
                You&apos;re ready to manage your entities. What would you like to do?
              </p>
            </div>
            <CommandButtons
              onListEntities={handleListEntities}
              onCreateEntity={handleCreateEntity}
              onExploreEntities={handleExploreEntities}
              onLogout={resetToUnauth}
            />
          </div>
        )
      
      case 'list':
        return (
          <div className="mb-4">
            {!entitiesLoading && (
              <div className="p-4 bg-muted rounded-lg mb-4">
                <p>
                  {entities.length === 0
                    ? 'I found no entities in your account yet. Would you like to create your first entity to get started?'
                    : `Great! I found ${entities.length} entit${entities.length === 1 ? 'y' : 'ies'} in your account. Click on any entity card to view its details in a modal.`}
                </p>
              </div>
            )}
            
            {entitiesLoading ? (
              <div>
                <div className="p-4 bg-muted rounded-lg mb-4">
                  <p>Loading your entities...</p>
                </div>
                <EntityListSkeleton count={4} />
              </div>
            ) : (
              <EntityList
                entities={entities}
                onBack={handleBackToCommands}
              />
            )}
          </div>
        )
      
      case 'create':
        return (
          <div className="mb-4">
            <div className="p-4 bg-muted rounded-lg mb-4">
              <p>
                Perfect! Let&apos;s create a new entity. Please fill out the form below
                with your entity details.
              </p>
            </div>
            <EntityForm
              onSuccess={handleEntityCreated}
              onBack={handleBackToCommands}
            />
          </div>
        )
      
      case 'explore':
        return (
          <EntityExplorer
            onBack={handleBackToCommands}
          />
        )
      
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col mobile-vh bg-background">
      <div className="border-b p-4 bg-card flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Multi-Tenant API Chat</h1>
            <p className="text-sm text-muted-foreground">
              Conversational interface for managing your entities
            </p>
          </div>
          <ThemeToggle />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 mobile-scroll">
        {renderCurrentView()}
        
        {/* Status Log */}
        {statusLog.length > 0 && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg border">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-muted-foreground">Status Log</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearStatusLog}
                className="text-xs h-6 px-2"
              >
                Clear
              </Button>
            </div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {statusLog.slice(-5).map((log, index) => (
                <p key={index} className="text-xs text-muted-foreground italic">
                  {log}
                </p>
              ))}
            </div>
          </div>
        )}
        
        {/* Persistent messages for regular chat (if any) */}
        {persistentMessages.map((message, index) => (
          <div
            key={message.id}
            className="animate-slide-up"
            style={{
              animationDelay: `${index * 50}ms`,
              animationFillMode: 'both',
            }}
          >
            {message.content}
          </div>
        ))}
        
        <div ref={messagesEndRef} />
      </div>

      {appState === 'authenticated' && (
        <div className="border-t p-4 bg-card flex-shrink-0 keyboard-adjust">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message here..."
              className="flex-1 min-h-[44px]" // Ensure touch-friendly minimum height
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
            />
            <Button
              type="submit"
              disabled={!input.trim()}
              className="min-h-[44px] px-6" // Ensure touch-friendly size
            >
              Send
            </Button>
          </form>
        </div>
      )}
    </div>
  )
}
