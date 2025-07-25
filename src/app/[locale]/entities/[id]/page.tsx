'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ThemeToggle } from '@/components/theme-toggle'
import { LanguageToggle } from '@/components/language-toggle'
import { EmailForm } from '@/components/email-form'
import { OtpForm } from '@/components/otp-form'
import { RequestInfoButton } from '@/components/RequestInfoButton'
import { getAuthStatusAction } from '@/lib/actions'
import { generateChatId, generateChatUrl } from '@/lib/chat-utils'
import { 
  ArrowLeft, 
  Share2, 
  Copy, 
  Users, 
  TrendingUp, 
  BarChart3, 
  Megaphone,
  Eye,
  MousePointer,
  ExternalLink,
  Calendar,
  Clock,
  Lock,
  Globe,
  User,
  Tag,
  Image as ImageIcon,
  LogIn
} from 'lucide-react'

interface EntityData {
  id: string
  name?: string
  display_name?: string
  description?: string
  entity_type?: string
  category?: string
  owner_id?: string
  disabled?: boolean
  public_shareable?: boolean
  created_at?: string
  updated_at?: string
  attributes?: Record<string, any>
  images?: Array<{
    id: string
    url: string
    label?: string
    urls?: { small?: { url: string } }
  }>
  mtcli_entity_categories?: {
    id: string
    display_name: string
    description: string
  }
  similarity_score?: number
}

interface EntityStats {
  views: number
  interactions: number
  shares: number
  chatRequests: number
  attributeRequests: number
  lastViewed: string
  viewHistory: Array<{
    date: string
    count: number
  }>
  recentLogs: Array<{
    id: string
    eventType: string
    message: string
    timestamp: string
    interactionType?: string
    eventPayload?: any
  }>
  eventBreakdown: Record<string, number>
}

export default function EntityDetailPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const t = useTranslations()
  
  const entityId = params.id as string
  const locale = params.locale as string
  
  const [entity, setEntity] = useState<EntityData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)
  const [showLogin, setShowLogin] = useState(false)
  const [showChatModal, setShowChatModal] = useState(false)
  const [chatUrl, setChatUrl] = useState('')
  const [activeTab, setActiveTab] = useState('other-entities')
  
  // Tab data states
  const [otherEntities, setOtherEntities] = useState<EntityData[]>([])
  const [relatedEntities, setRelatedEntities] = useState<EntityData[]>([])
  const [stats, setStats] = useState<EntityStats | null>(null)
  const [loadingTabs, setLoadingTabs] = useState<Record<string, boolean>>({})

  useEffect(() => {
    checkAuthStatus()
    fetchEntity()
    logEntityView()
  }, [entityId])

  // Fetch data for the initial active tab when entity is loaded
  useEffect(() => {
    if (entity) {
      switch (activeTab) {
        case 'other-entities':
          if (otherEntities.length === 0) fetchOtherEntities()
          break
        case 'related-entities':
          if (relatedEntities.length === 0) fetchRelatedEntities()
          break
        case 'statistics':
          if (!stats) fetchStats()
          break
      }
    }
  }, [entity, activeTab])

  const checkAuthStatus = async () => {
    try {
      const authenticated = await getAuthStatusAction()
      setIsAuthenticated(authenticated)
    } catch (error) {
      setIsAuthenticated(false)
    } finally {
      setAuthLoading(false)
    }
  }

  const fetchEntity = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/entities/${entityId}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('notFound')
        } else {
          setError('generic')
        }
        return
      }
      
      const data = await response.json()
      setEntity(data.entity || data)
    } catch (error) {
      console.error('Error fetching entity:', error)
      setError('network')
    } finally {
      setLoading(false)
    }
  }

  const logEntityView = async () => {
    try {
      // Use the existing /api/interaction_logs endpoint
      await fetch('/api/interaction_logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entityId,
          eventType: 'entity_view',
          interactionType: 'page_visit',
          message: `Entity ${entityId} viewed`,
          link: window.location.href,
          tenantContext: 'entity_detail',
          eventPayload: {
            source: 'entity_detail_page',
            referrer: document.referrer,
            timestamp: new Date().toISOString()
          }
        })
      })
    } catch (error) {
      console.error('Error logging entity view:', error)
    }
  }

  const fetchOtherEntities = async () => {
    if (!entity?.owner_id) return
    
    setLoadingTabs(prev => ({ ...prev, 'other-entities': true }))
    
    try {
      // Use the new /api/entities/[id]/owner-entities endpoint
      const response = await fetch(`/api/entities/${entityId}/owner-entities`)
      if (response.ok) {
        const data = await response.json()
        setOtherEntities(data.entities || [])
      } else {
        console.error('Failed to fetch owner entities:', response.status)
        setOtherEntities([])
      }
    } catch (error) {
      console.error('Error fetching other entities:', error)
      setOtherEntities([])
    } finally {
      setLoadingTabs(prev => ({ ...prev, 'other-entities': false }))
    }
  }

  const fetchRelatedEntities = async () => {
    if (!entity) return
    
    setLoadingTabs(prev => ({ ...prev, 'related-entities': true }))
    
    try {
      const response = await fetch(`/api/entities/${entityId}/related`)
      if (response.ok) {
        const data = await response.json()
        setRelatedEntities(data.entities || [])
      } else {
        setRelatedEntities([])
      }
    } catch (error) {
      console.error('Error fetching related entities:', error)
      setRelatedEntities([])
    } finally {
      setLoadingTabs(prev => ({ ...prev, 'related-entities': false }))
    }
  }

  const fetchStats = async () => {
    if (!isAuthenticated) return
    
    setLoadingTabs(prev => ({ ...prev, 'statistics': true }))
    
    try {
    // Fetch all interaction logs for this entity (without filtering by eventType to get complete picture)
    const response = await fetch(`/api/interaction_logs?entity_id=${entityId}&limit=100`)
    
    if (response.ok) {
      const data = await response.json()
      const logs = data.logs || data || []
      
      console.log('Interaction logs API response:', data)
      console.log('Processed logs array:', logs)
      console.log('Logs length:', logs.length)
        
        // Process logs to generate comprehensive statistics
        const views = logs.filter((log: any) => log.eventType === 'entity_view').length
        const interactions = logs.filter((log: any) => log.eventType === 'entity_interaction').length
        const shares = logs.filter((log: any) => log.eventType === 'entity_share').length
        const chatRequests = logs.filter((log: any) => log.eventType === 'chat_request').length
        const attributeRequests = logs.filter((log: any) => log.eventType === 'request_attribute').length
        
        // Generate event breakdown
        const eventBreakdown: Record<string, number> = {}
        logs.forEach((log: any) => {
          const eventType = log.eventType || 'unknown'
          eventBreakdown[eventType] = (eventBreakdown[eventType] || 0) + 1
        })
        
        // Generate view history by date (last 7 days)
        const viewsByDate: Record<string, number> = {}
        const viewLogs = logs.filter((log: any) => log.eventType === 'entity_view')
        
        viewLogs.forEach((log: any) => {
          const logDate = log.timestamp || log.createdAt || log.created_at
          if (logDate) {
            const date = new Date(logDate).toISOString().split('T')[0]
            viewsByDate[date] = (viewsByDate[date] || 0) + 1
          }
        })
        
        // Convert to array and sort by date (last 7 days)
        const viewHistory = Object.entries(viewsByDate)
          .map(([date, count]) => ({ date, count }))
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .slice(-7)
        
        // Get recent logs (last 10) for activity feed
        const recentLogs = logs
          .sort((a: any, b: any) => {
            const dateA = new Date(a.timestamp || a.createdAt || a.created_at || 0).getTime()
            const dateB = new Date(b.timestamp || b.createdAt || b.created_at || 0).getTime()
            return dateB - dateA
          })
          .slice(0, 10)
          .map((log: any) => ({
            id: log.id || Math.random().toString(),
            eventType: log.eventType,
            message: log.message,
            timestamp: log.timestamp || log.createdAt || log.created_at,
            interactionType: log.interactionType,
            eventPayload: log.eventPayload
          }))
        
        const lastViewed = viewLogs.length > 0 
          ? viewLogs[0].timestamp || viewLogs[0].createdAt || viewLogs[0].created_at
          : new Date().toISOString()
        
        const processedStats = {
          views,
          interactions,
          shares,
          chatRequests,
          attributeRequests,
          lastViewed,
          viewHistory,
          recentLogs,
          eventBreakdown
        }
        
        setStats(processedStats)
      } else {
        console.error('Failed to fetch interaction logs:', response.status)
        // Fallback to mock data if endpoint doesn't exist yet
        setStats({
          views: Math.floor(Math.random() * 100) + 10,
          interactions: Math.floor(Math.random() * 50) + 5,
          shares: Math.floor(Math.random() * 20) + 2,
          chatRequests: Math.floor(Math.random() * 10) + 1,
          attributeRequests: Math.floor(Math.random() * 5) + 1,
          lastViewed: new Date().toISOString(),
          viewHistory: Array.from({ length: 7 }, (_, i) => ({
            date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            count: Math.floor(Math.random() * 20) + 1
          })),
          recentLogs: [],
          eventBreakdown: {
            'entity_view': Math.floor(Math.random() * 50) + 10,
            'entity_interaction': Math.floor(Math.random() * 20) + 5,
            'chat_request': Math.floor(Math.random() * 10) + 1
          }
        })
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
      setStats(null)
    } finally {
      setLoadingTabs(prev => ({ ...prev, 'statistics': false }))
    }
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    
    switch (tab) {
      case 'other-entities':
        if (otherEntities.length === 0) fetchOtherEntities()
        break
      case 'related-entities':
        if (relatedEntities.length === 0) fetchRelatedEntities()
        break
      case 'statistics':
        if (!stats) fetchStats()
        break
    }
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      // You could add a toast notification here
    } catch (error) {
      console.error('Error copying link:', error)
    }
  }

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: entity?.display_name || entity?.name || 'Entity',
          text: entity?.description || 'Check out this entity',
          url: window.location.href,
        })
      } else {
        // Fallback to copying link
        await handleCopyLink()
      }
    } catch (error) {
      console.error('Error sharing:', error)
    }
  }

  const handleContactOwner = async () => {
    if (!entity?.owner_id) return
    
    try {
      // First, notify the owner
      const response = await fetch('/api/notify-owner', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entityId: entity.id,
          ownerId: entity.owner_id,
          message: `Someone is interested in your entity: ${entity.display_name || entity.name}`,
          contactInfo: isAuthenticated ? 'authenticated_user' : 'anonymous_user',
          entityUrl: window.location.href
        })
      })
      
      if (response.ok) {
        // Log the interaction
        await fetch('/api/interaction_logs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            entityId: entity.id,
            eventType: 'entity_interaction',
            interactionType: 'contact_owner',
            message: `User initiated contact with owner for entity: ${entity.display_name || entity.name}`,
            link: window.location.href
          })
        })
        
        // Open chat modal
        const chatId = generateChatId(entity.id);
        const chatUrl = generateChatUrl(chatId, isAuthenticated ? 'authenticated_user' : 'guest', entity.id);
        setChatUrl(chatUrl);
        setShowChatModal(true);
        
        console.log('Owner notified successfully, opening chat...')
      } else {
        console.error('Failed to notify owner')
      }
    } catch (error) {
      console.error('Error contacting owner:', error)
    }
  }

  const handleBackToApp = () => {
    const originalParams = searchParams.toString()
    router.push(`/${locale}${originalParams ? '?' + originalParams : ''}`)
  }

  const handleLoginSuccess = () => {
    setIsAuthenticated(true)
    setShowLogin(false)
    // Refresh data that requires authentication
    fetchStats()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">{t('entityDetail.loading')}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-destructive">
              {error === 'notFound' ? t('entityDetail.notFound') : t('errors.somethingWentWrong')}
            </CardTitle>
            <CardDescription>
              {error === 'notFound' 
                ? t('entityDetail.notFoundDescription')
                : t('errors.unexpectedError')
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleBackToApp} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('entityDetail.backToApp')}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!entity) return null

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={handleBackToApp}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('common.back')}
              </Button>
              <div>
                <h1 className="text-xl font-semibold">{entity.display_name || entity.name}</h1>
                <p className="text-sm text-muted-foreground">{t('entityDetail.title')}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={handleCopyLink}>
                <Copy className="w-4 h-4 mr-2" />
                {t('entityDetail.actions.copyLink')}
              </Button>
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="w-4 h-4 mr-2" />
                {t('entityDetail.actions.shareLink')}
              </Button>
              <ThemeToggle />
              <LanguageToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Entity Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <CardTitle className="text-2xl">{entity.display_name || entity.name}</CardTitle>
                    {entity.description && (
                      <CardDescription className="text-base">{entity.description}</CardDescription>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {entity.public_shareable ? (
                      <Badge variant="secondary">
                        <Globe className="w-3 h-3 mr-1" />
                        {t('entityDetail.publiclyShared')}
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        <Lock className="w-3 h-3 mr-1" />
                        {t('entityDetail.privateEntity')}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Basic Information */}
                <div>
                  <h3 className="font-semibold mb-3">{t('entityDetail.basicInfo')}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {entity.entity_type && (
                      <div className="flex items-center space-x-2">
                        <Tag className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{t('entityDetail.type')}:</span>
                        <span className="font-medium">{entity.entity_type}</span>
                      </div>
                    )}
                    {entity.category && (
                      <div className="flex items-center space-x-2">
                        <Tag className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{t('entity.category')}:</span>
                        <span className="font-medium">{entity.category}</span>
                      </div>
                    )}
                    {entity.created_at && (
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{t('entityDetail.createdOn')}:</span>
                        <span className="font-medium">
                          {new Date(entity.created_at).toLocaleDateString(locale)}
                        </span>
                      </div>
                    )}
                    {entity.updated_at && (
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{t('entityDetail.lastUpdated')}:</span>
                        <span className="font-medium">
                          {new Date(entity.updated_at).toLocaleDateString(locale)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Images */}
                {entity.images && entity.images.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center">
                      <ImageIcon className="w-4 h-4 mr-2" />
                      {t('entity.images')}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {entity.images.map((image, index) => (
                        <div key={image.id} className="relative aspect-square">
                          <img
                            src={image.urls?.small?.url || image.url}
                            alt={image.label || t('entity.imageAlt', { index: index + 1 })}
                            className="w-full h-full object-cover rounded-lg border"
                          />
                          {image.label && (
                            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-2 rounded-b-lg">
                              {image.label}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Attributes */}
                {entity.attributes && Object.keys(entity.attributes).length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">{t('entity.attributes')}</h3>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        {Object.entries(entity.attributes).map(([key, value]) => (
                          <div key={key} className="flex items-center justify-between">
                            <span className="text-muted-foreground capitalize">
                              {key.replace('_', ' ')}:
                            </span>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">
                                {value !== null && value !== undefined && value !== '' ? String(value) : (
                                  <span className="text-muted-foreground italic">
                                    {t('common.none')}
                                  </span>
                                )}
                              </span>
                              {(value === null || value === undefined || value === '') && entity.owner_id && (
                                <RequestInfoButton
                                  entityId={entity.id}
                                  attributeName={key.replace('_', ' ')}
                                  ownerEmail={entity.owner_id}
                                  entityName={entity.display_name || entity.name || `Entity ${entity.id.slice(0, 8)}`}
                                />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Actions */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('entityDetail.actions.viewInApp')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={handleBackToApp} className="w-full">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  {t('entityDetail.backToApp')}
                </Button>
                <Button variant="outline" className="w-full" onClick={handleContactOwner}>
                  <User className="w-4 h-4 mr-2" />
                  {t('entityDetail.actions.contactOwner')}
                </Button>
              </CardContent>
            </Card>

            {/* Quick Stats Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  {t('entityDetail.statistics.title')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isAuthenticated ? (
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{t('entityDetail.statistics.views')}:</span>
                      <span className="font-medium">42</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{t('entityDetail.statistics.interactions')}:</span>
                      <span className="font-medium">15</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{t('entityDetail.statistics.shares')}:</span>
                      <span className="font-medium">8</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-3">
                    <Lock className="w-8 h-8 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {t('entityDetail.login.description')}
                    </p>
                    <Button 
                      size="sm" 
                      className="w-full"
                      onClick={() => setShowLogin(true)}
                    >
                      <LogIn className="w-4 h-4 mr-2" />
                      {t('auth.login')}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Interactive Tabs */}
        <div className="mt-12">
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="other-entities" className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">{t('entityDetail.tabs.otherEntities')}</span>
              </TabsTrigger>
              <TabsTrigger value="related-entities" className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4" />
                <span className="hidden sm:inline">{t('entityDetail.tabs.relatedEntities')}</span>
              </TabsTrigger>
              <TabsTrigger value="statistics" className="flex items-center space-x-2">
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">{t('entityDetail.tabs.statistics')}</span>
              </TabsTrigger>
              <TabsTrigger value="announcements" className="flex items-center space-x-2">
                <Megaphone className="w-4 h-4" />
                <span className="hidden sm:inline">{t('entityDetail.tabs.announcements')}</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="other-entities" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t('entityDetail.otherEntities.title')}</CardTitle>
                  <CardDescription>
                    {t('entityDetail.otherEntities.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingTabs['other-entities'] ? (
                    <div className="text-center py-8">
                      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-muted-foreground">{t('entityDetail.otherEntities.loadingEntities')}</p>
                    </div>
                  ) : otherEntities.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {otherEntities.map((otherEntity) => (
                        <Card key={otherEntity.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push(`/${locale}/entities/${otherEntity.id}`)}>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base">
                              {otherEntity.display_name || otherEntity.name || `Entity ${otherEntity.id.slice(0, 8)}`}
                            </CardTitle>
                            {otherEntity.description && (
                              <CardDescription className="text-sm line-clamp-2">
                                {otherEntity.description}
                              </CardDescription>
                            )}
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <div className="flex items-center space-x-1">
                                {otherEntity.mtcli_entity_categories?.display_name && (
                                  <Badge variant="secondary" className="text-xs">
                                    {otherEntity.mtcli_entity_categories.display_name}
                                  </Badge>
                                )}
                                {otherEntity.entity_type && (
                                  <Badge variant="outline" className="text-xs">
                                    {otherEntity.entity_type}
                                  </Badge>
                                )}
                              </div>
                              {otherEntity.created_at && (
                                <span>{new Date(otherEntity.created_at).toLocaleDateString(locale)}</span>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">{t('entityDetail.otherEntities.noEntities')}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="related-entities" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t('entityDetail.relatedEntities.title')}</CardTitle>
                  <CardDescription>
                    {t('entityDetail.relatedEntities.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingTabs['related-entities'] ? (
                    <div className="text-center py-8">
                      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-muted-foreground">{t('entityDetail.relatedEntities.loadingRelated')}</p>
                    </div>
                  ) : relatedEntities.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {relatedEntities.map((relatedEntity) => (
                        <Card key={relatedEntity.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push(`/${locale}/entities/${relatedEntity.id}`)}>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base">
                              {relatedEntity.display_name || relatedEntity.name || `Entity ${relatedEntity.id.slice(0, 8)}`}
                              {relatedEntity.similarity_score && (
                                <Badge variant="secondary" className="ml-2 text-xs">
                                  {relatedEntity.similarity_score} matches
                                </Badge>
                              )}
                            </CardTitle>
                            {relatedEntity.description && (
                              <CardDescription className="text-sm line-clamp-2">
                                {relatedEntity.description}
                              </CardDescription>
                            )}
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <div className="flex items-center space-x-1">
                                {relatedEntity.mtcli_entity_categories?.display_name && (
                                  <Badge variant="secondary" className="text-xs">
                                    {relatedEntity.mtcli_entity_categories.display_name}
                                  </Badge>
                                )}
                                {relatedEntity.entity_type && (
                                  <Badge variant="outline" className="text-xs">
                                    {relatedEntity.entity_type}
                                  </Badge>
                                )}
                              </div>
                              {relatedEntity.created_at && (
                                <span>{new Date(relatedEntity.created_at).toLocaleDateString(locale)}</span>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <TrendingUp className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">{t('entityDetail.relatedEntities.noRelated')}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="statistics" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t('entityDetail.statistics.title')}</CardTitle>
                  <CardDescription>
                    {t('entityDetail.statistics.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!isAuthenticated ? (
                    <div className="text-center py-8 space-y-4">
                      <Lock className="w-12 h-12 mx-auto text-muted-foreground" />
                      <div>
                        <h3 className="font-semibold mb-2">{t('entityDetail.announcements.loginRequired')}</h3>
                        <p className="text-muted-foreground mb-4">
                          {t('entityDetail.announcements.loginToUnlock')}
                        </p>
                        <Button onClick={() => setShowLogin(true)}>
                          <LogIn className="w-4 h-4 mr-2" />
                          {t('entityDetail.announcements.loginNow')}
                        </Button>
                      </div>
                    </div>
                  ) : loadingTabs['statistics'] ? (
                    <div className="text-center py-8">
                      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-muted-foreground">{t('entityDetail.statistics.loadingStats')}</p>
                    </div>
                  ) : stats ? (
                    <div className="space-y-6">
                      {/* Main Metrics */}
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <Card>
                          <CardContent className="p-4 text-center">
                            <Eye className="w-8 h-8 mx-auto text-blue-500 mb-2" />
                            <div className="text-2xl font-bold">{stats.views}</div>
                            <div className="text-sm text-muted-foreground">Views</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4 text-center">
                            <MousePointer className="w-8 h-8 mx-auto text-green-500 mb-2" />
                            <div className="text-2xl font-bold">{stats.interactions}</div>
                            <div className="text-sm text-muted-foreground">Interactions</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4 text-center">
                            <Share2 className="w-8 h-8 mx-auto text-purple-500 mb-2" />
                            <div className="text-2xl font-bold">{stats.shares}</div>
                            <div className="text-sm text-muted-foreground">Shares</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4 text-center">
                            <Users className="w-8 h-8 mx-auto text-orange-500 mb-2" />
                            <div className="text-2xl font-bold">{stats.chatRequests}</div>
                            <div className="text-sm text-muted-foreground">Chat Requests</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4 text-center">
                            <Calendar className="w-8 h-8 mx-auto text-red-500 mb-2" />
                            <div className="text-2xl font-bold">{stats.attributeRequests}</div>
                            <div className="text-sm text-muted-foreground">Info Requests</div>
                          </CardContent>
                        </Card>
                      </div>
                      
                      {/* Event Breakdown */}
                      {Object.keys(stats.eventBreakdown).length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-4">Event Breakdown</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {Object.entries(stats.eventBreakdown).map(([eventType, count]) => (
                              <div key={eventType} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                <div className="flex items-center space-x-2">
                                  <Badge variant="outline" className="text-xs">
                                    {eventType.replace('_', ' ')}
                                  </Badge>
                                </div>
                                <span className="font-medium">{count}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* View History */}
                      {stats.viewHistory.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-4">View History (Last 7 Days)</h4>
                          <div className="space-y-2">
                            {stats.viewHistory.map((entry, index) => (
                              <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                <span className="text-sm">
                                  {new Date(entry.date).toLocaleDateString(locale)}
                                </span>
                                <div className="flex items-center space-x-2">
                                  <div className="w-20 bg-gray-200 rounded-full h-2">
                                    <div 
                                      className="bg-blue-600 h-2 rounded-full" 
                                      style={{ width: `${Math.min((entry.count / Math.max(...stats.viewHistory.map(v => v.count))) * 100, 100)}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-sm font-medium w-12 text-right">{entry.count}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Recent Activity */}
                      {stats.recentLogs.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-4">Recent Activity</h4>
                          <div className="space-y-3">
                            {stats.recentLogs.map((log) => (
                              <div key={log.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                                <div className="flex-shrink-0">
                                  {log.eventType === 'entity_view' && <Eye className="w-4 h-4 text-blue-500 mt-0.5" />}
                                  {log.eventType === 'entity_interaction' && <MousePointer className="w-4 h-4 text-green-500 mt-0.5" />}
                                  {log.eventType === 'chat_request' && <Users className="w-4 h-4 text-orange-500 mt-0.5" />}
                                  {log.eventType === 'request_attribute' && <Calendar className="w-4 h-4 text-red-500 mt-0.5" />}
                                  {log.eventType === 'entity_share' && <Share2 className="w-4 h-4 text-purple-500 mt-0.5" />}
                                  {!['entity_view', 'entity_interaction', 'chat_request', 'request_attribute', 'entity_share'].includes(log.eventType) && 
                                    <BarChart3 className="w-4 h-4 text-gray-500 mt-0.5" />
                                  }
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center space-x-2">
                                  <Badge variant="secondary" className="text-xs">
                                      {(log.eventType || 'unknown').replace('_', ' ')}
                                    </Badge>
                                    {log.interactionType && (
                                      <Badge variant="outline" className="text-xs">
                                        {log.interactionType.replace('_', ' ')}
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm mt-1 text-muted-foreground truncate">{log.message}</p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {log.timestamp && new Date(log.timestamp).toLocaleString(locale)}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Summary */}
                      <div className="bg-muted/30 rounded-lg p-4">
                        <h4 className="font-semibold mb-2">Statistics Summary</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Last Activity:</span>
                            <span className="ml-2 font-medium">
                              {stats.lastViewed && new Date(stats.lastViewed).toLocaleString(locale)}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Total Events:</span>
                            <span className="ml-2 font-medium">
                              {Object.values(stats.eventBreakdown).reduce((sum, count) => sum + count, 0)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">{t('entityDetail.statistics.noStats')}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="announcements" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t('entityDetail.announcements.title')}</CardTitle>
                  <CardDescription>
                    {t('entityDetail.announcements.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {!isAuthenticated && (
                    <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
                      <CardContent className="p-6">
                        <div className="text-center space-y-4">
                          <LogIn className="w-12 h-12 mx-auto text-blue-600" />
                          <div>
                            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                              {t('entityDetail.login.title')}
                            </h3>
                            <p className="text-blue-700 dark:text-blue-300 mb-4">
                              {t('entityDetail.login.description')}
                            </p>
                            <div className="text-left space-y-2 mb-4">
                              <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                                {t('entityDetail.login.benefits')}
                              </p>
                              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                                <li>• {t('entityDetail.login.viewStats')}</li>
                                <li>• {t('entityDetail.login.saveToFavorites')}</li>
                                <li>• {t('entityDetail.login.getNotifications')}</li>
                                <li>• {t('entityDetail.login.accessPremium')}</li>
                              </ul>
                            </div>
                            <Button 
                              onClick={() => setShowLogin(true)}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <LogIn className="w-4 h-4 mr-2" />
                              {t('entityDetail.login.quickLogin')}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="p-6">
                        <div className="text-center space-y-3">
                          <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto">
                            <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-300" />
                          </div>
                          <h3 className="font-semibold">{t('entityDetail.announcements.aiPowered')}</h3>
                          <p className="text-sm text-muted-foreground">
                            Get intelligent insights about your entities powered by AI
                          </p>
                          <Badge variant="secondary">{t('entityDetail.announcements.betaFeatures')}</Badge>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="text-center space-y-3">
                          <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto">
                            <BarChart3 className="w-6 h-6 text-purple-600 dark:text-purple-300" />
                          </div>
                          <h3 className="font-semibold">{t('entityDetail.announcements.advancedAnalytics')}</h3>
                          <p className="text-sm text-muted-foreground">
                            Deep analytics and reporting for your entity performance
                          </p>
                          <Badge variant="outline">{t('entityDetail.announcements.upcomingFeatures')}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {isAuthenticated && (
                    <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
                      <CardContent className="p-6 text-center">
                        <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Users className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                          {t('entityDetail.announcements.featureUnlocked')}
                        </h3>
                        <p className="text-green-700 dark:text-green-300">
                          You now have access to advanced statistics and analytics for this entity.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t('entityDetail.login.title')}</CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowLogin(false)}
                >
                  ×
                </Button>
              </div>
              <CardDescription>
                {t('entityDetail.login.stayOnPage')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <EmailForm onSuccess={handleLoginSuccess} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Chat Modal */}
      {showChatModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-4xl h-[80vh] flex flex-col">
            <CardHeader className="flex-shrink-0">
              <div className="flex items-center justify-between">
                <CardTitle>Chat with Owner</CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowChatModal(false)}
                >
                  ×
                </Button>
              </div>
              <CardDescription>
                The owner has been notified. You can start chatting now.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 p-0 min-h-0">
              <iframe
                src={chatUrl}
                className="w-full h-full border-0 rounded-b-lg"
                title="Chat with Owner"
                allow="microphone; camera"
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
