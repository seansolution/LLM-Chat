/**
 * Revenue Attribution System
 * 
 * Attributes closed deals back to AI conversations, tracking which persona
 * and intent generated the lead and calculating revenue contribution.
 */

import type { Persona, Intent } from './chat-log-schema'

// ============================================================================
// DATA SCHEMA
// ============================================================================

export type DealStatus = 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost' | 'cancelled'

export type ServiceType = 'registration' | 'accounting' | 'hr' | 'work_permit' | 'multiple' | 'unknown'

export interface Deal {
  id: string // Unique deal ID
  customerId?: string // Customer identifier (if available)
  customerName?: string // Customer name
  customerEmail?: string // Customer email
  customerPhone?: string // Customer phone
  
  // Deal Information
  status: DealStatus
  serviceType: ServiceType
  dealValue: number // Total deal value in THB
  currency: string // Default: 'THB'
  closedDate?: string // ISO 8601 timestamp when deal closed
  createdDate: string // ISO 8601 timestamp when deal created
  
  // Attribution
  attributedConversationId?: string // Chat log ID that generated this lead
  attributedSessionId?: string // Session ID that generated this lead
  attributedUserId?: string // User ID from conversation
  attributedIntent?: Intent // Intent that generated the lead
  attributedPersona?: Persona // Persona that generated the lead
  attributedTimestamp?: string // ISO 8601 timestamp of attributed conversation
  
  // Attribution Confidence
  attributionConfidence: number // 0-1, how confident we are in attribution
  attributionMethod: 'direct' | 'session_match' | 'email_match' | 'phone_match' | 'manual' | 'unknown'
  
  // Sales Process
  firstContactDate?: string // ISO 8601 timestamp of first human contact
  daysToClose?: number // Days from conversation to deal close
  salesRepId?: string // Sales representative ID
  salesRepName?: string // Sales representative name
  
  // Metadata
  notes?: string // Additional notes
  source?: string // Lead source (e.g., 'chat', 'website', 'referral')
  metadata?: Record<string, unknown> // Additional custom fields
}

export interface ConversationAttribution {
  conversationId: string
  sessionId: string
  userId?: string
  timestamp: string
  intent: Intent
  persona: Persona
  primaryIntent: Intent // The main intent that drove the conversation
  primaryPersona: Persona // The main persona that handled the conversation
  dealIds: string[] // Deals attributed to this conversation
  totalAttributedRevenue: number // Sum of deal values
  attributionCount: number // Number of deals attributed
}

// ============================================================================
// ATTRIBUTION LOGIC
// ============================================================================

/**
 * Attribute a deal to a conversation based on matching criteria
 */
export function attributeDealToConversation(
  deal: Deal,
  conversations: Array<{
    id: string
    sessionId: string
    userId?: string
    timestamp: string
    intent: { detected: Intent }
    persona: { detected: Persona }
    userActions?: {
      contactMethod: string
      contactedAt?: string
    }
    metadata?: {
      userEmail?: string
      userPhone?: string
    }
  }>
): {
  conversationId?: string
  confidence: number
  method: Deal['attributionMethod']
} {
  // Method 1: Direct match (deal has conversation ID)
  if (deal.attributedConversationId) {
    const conversation = conversations.find(c => c.id === deal.attributedConversationId)
    if (conversation) {
      return {
        conversationId: conversation.id,
        confidence: 1.0,
        method: 'direct',
      }
    }
  }

  // Method 2: Session match (deal has session ID)
  if (deal.attributedSessionId) {
    const conversation = conversations.find(c => c.sessionId === deal.attributedSessionId)
    if (conversation) {
      return {
        conversationId: conversation.id,
        confidence: 0.9,
        method: 'session_match',
      }
    }
  }

  // Method 3: Email match
  if (deal.customerEmail) {
    const conversation = conversations.find(
      c => c.metadata?.userEmail?.toLowerCase() === deal.customerEmail?.toLowerCase()
    )
    if (conversation) {
      return {
        conversationId: conversation.id,
        confidence: 0.8,
        method: 'email_match',
      }
    }
  }

  // Method 4: Phone match
  if (deal.customerPhone) {
    const conversation = conversations.find(
      c => c.metadata?.userPhone === deal.customerPhone
    )
    if (conversation) {
      return {
        conversationId: conversation.id,
        confidence: 0.8,
        method: 'phone_match',
      }
    }
  }

  // Method 5: Time-based match (deal created within 7 days of conversation)
  if (deal.createdDate) {
    const dealDate = new Date(deal.createdDate)
    const matchingConversations = conversations
      .filter(c => {
        const convDate = new Date(c.timestamp)
        const daysDiff = (dealDate.getTime() - convDate.getTime()) / (1000 * 60 * 60 * 24)
        return daysDiff >= 0 && daysDiff <= 7 // Within 7 days
      })
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

    if (matchingConversations.length > 0) {
      // Use the most recent conversation before deal creation
      const conversation = matchingConversations[matchingConversations.length - 1]
      return {
        conversationId: conversation.id,
        confidence: 0.6,
        method: 'session_match', // Time-based is a form of session matching
      }
    }
  }

  // No match found
  return {
    conversationId: undefined,
    confidence: 0,
    method: 'unknown',
  }
}

/**
 * Determine primary intent and persona from a conversation
 * (For conversations with multiple messages, use the first pricing/overview intent)
 */
export function getPrimaryIntentAndPersona(conversations: Array<{
  intent: { detected: Intent }
  persona: { detected: Persona }
  responseType: string
}>): {
  primaryIntent: Intent
  primaryPersona: Persona
} {
  // Find first pricing or overview intent
  const pricingOrOverview = conversations.find(
    c => c.responseType === 'pricing' || c.responseType === 'overview'
  )

  if (pricingOrOverview) {
    return {
      primaryIntent: pricingOrOverview.intent.detected,
      primaryPersona: pricingOrOverview.persona.detected,
    }
  }

  // Fallback to first intent
  if (conversations.length > 0) {
    return {
      primaryIntent: conversations[0].intent.detected,
      primaryPersona: conversations[0].persona.detected,
    }
  }

  // Default
  return {
    primaryIntent: 'unknown',
    primaryPersona: 'REGISTRATION',
  }
}

// ============================================================================
// METRICS CALCULATION
// ============================================================================

export interface RevenueMetrics {
  totalRevenue: number
  totalDeals: number
  averageDealValue: number
  conversionRate: number // % of conversations that led to closed deals
  revenueByPersona: Record<Persona, {
    revenue: number
    deals: number
    averageDealValue: number
    conversionRate: number
  }>
  revenueByIntent: Record<string, {
    revenue: number
    deals: number
    averageDealValue: number
    conversionRate: number
  }>
  revenueByServiceType: Record<ServiceType, {
    revenue: number
    deals: number
    averageDealValue: number
  }>
  averageDaysToClose: number
  topConversations: Array<{
    conversationId: string
    revenue: number
    deals: number
    persona: Persona
    intent: Intent
  }>
}

/**
 * Calculate revenue metrics from deals and conversations
 */
export function calculateRevenueMetrics(
  deals: Deal[],
  conversations: Array<{
    id: string
    sessionId: string
    userId?: string
    intent: { detected: Intent }
    persona: { detected: Persona }
    responseType: string
    timestamp: string
    userActions?: {
      contactMethod: string
      contactedAt?: string
    }
    metadata?: {
      userEmail?: string
      userPhone?: string
    }
  }>
): RevenueMetrics {
  // Filter to closed won deals only
  const closedDeals = deals.filter(d => d.status === 'closed_won')

  // Group conversations by session
  const sessions = new Map<string, typeof conversations>()
  conversations.forEach(conv => {
    if (!sessions.has(conv.sessionId)) {
      sessions.set(conv.sessionId, [])
    }
    sessions.get(conv.sessionId)!.push(conv)
  })

  // Attribute deals to conversations
  const attributedDeals = closedDeals.map(deal => {
    const attribution = attributeDealToConversation(deal, conversations)
    return {
      ...deal,
      attributedConversationId: attribution.conversationId,
      attributionConfidence: attribution.confidence,
      attributionMethod: attribution.method,
    }
  })

  // Calculate total revenue
  const totalRevenue = attributedDeals.reduce((sum, deal) => sum + deal.dealValue, 0)
  const totalDeals = attributedDeals.length
  const averageDealValue = totalDeals > 0 ? totalRevenue / totalDeals : 0

  // Calculate conversion rate
  const uniqueSessions = new Set(conversations.map(c => c.sessionId))
  const sessionsWithDeals = new Set(
    attributedDeals
      .filter(d => d.attributedConversationId)
      .map(d => {
        const conv = conversations.find(c => c.id === d.attributedConversationId)
        return conv?.sessionId
      })
      .filter(Boolean) as string[]
  )
  const conversionRate = uniqueSessions.size > 0
    ? (sessionsWithDeals.size / uniqueSessions.size) * 100
    : 0

  // Revenue by Persona
  const revenueByPersona: Record<Persona, {
    revenue: number
    deals: number
    averageDealValue: number
    conversionRate: number
  }> = {
    REGISTRATION: { revenue: 0, deals: 0, averageDealValue: 0, conversionRate: 0 },
    ACCOUNTING: { revenue: 0, deals: 0, averageDealValue: 0, conversionRate: 0 },
    HR: { revenue: 0, deals: 0, averageDealValue: 0, conversionRate: 0 },
  }

  attributedDeals.forEach(deal => {
    if (deal.attributedPersona && deal.attributedPersona in revenueByPersona) {
      const persona = deal.attributedPersona as Persona
      revenueByPersona[persona].revenue += deal.dealValue
      revenueByPersona[persona].deals += 1
    }
  })

  Object.keys(revenueByPersona).forEach(persona => {
    const p = persona as Persona
    if (revenueByPersona[p].deals > 0) {
      revenueByPersona[p].averageDealValue = revenueByPersona[p].revenue / revenueByPersona[p].deals
    }
    const personaSessions = new Set(
      conversations.filter(c => c.persona.detected === p).map(c => c.sessionId)
    )
    const personaSessionsWithDeals = new Set(
      attributedDeals
        .filter(d => d.attributedPersona === p && d.attributedConversationId)
        .map(d => {
          const conv = conversations.find(c => c.id === d.attributedConversationId)
          return conv?.sessionId
        })
        .filter(Boolean) as string[]
    )
    revenueByPersona[p].conversionRate = personaSessions.size > 0
      ? (personaSessionsWithDeals.size / personaSessions.size) * 100
      : 0
  })

  // Revenue by Intent
  const revenueByIntent: Record<string, {
    revenue: number
    deals: number
    averageDealValue: number
    conversionRate: number
  }> = {}

  attributedDeals.forEach(deal => {
    if (deal.attributedIntent) {
      if (!revenueByIntent[deal.attributedIntent]) {
        revenueByIntent[deal.attributedIntent] = {
          revenue: 0,
          deals: 0,
          averageDealValue: 0,
          conversionRate: 0,
        }
      }
      revenueByIntent[deal.attributedIntent].revenue += deal.dealValue
      revenueByIntent[deal.attributedIntent].deals += 1
    }
  })

  Object.keys(revenueByIntent).forEach(intent => {
    if (revenueByIntent[intent].deals > 0) {
      revenueByIntent[intent].averageDealValue =
        revenueByIntent[intent].revenue / revenueByIntent[intent].deals
    }
    const intentSessions = new Set(
      conversations.filter(c => c.intent.detected === intent).map(c => c.sessionId)
    )
    const intentSessionsWithDeals = new Set(
      attributedDeals
        .filter(d => d.attributedIntent === intent && d.attributedConversationId)
        .map(d => {
          const conv = conversations.find(c => c.id === d.attributedConversationId)
          return conv?.sessionId
        })
        .filter(Boolean) as string[]
    )
    revenueByIntent[intent].conversionRate = intentSessions.size > 0
      ? (intentSessionsWithDeals.size / intentSessions.size) * 100
      : 0
  })

  // Revenue by Service Type
  const revenueByServiceType: Record<ServiceType, {
    revenue: number
    deals: number
    averageDealValue: number
  }> = {
    registration: { revenue: 0, deals: 0, averageDealValue: 0 },
    accounting: { revenue: 0, deals: 0, averageDealValue: 0 },
    hr: { revenue: 0, deals: 0, averageDealValue: 0 },
    work_permit: { revenue: 0, deals: 0, averageDealValue: 0 },
    multiple: { revenue: 0, deals: 0, averageDealValue: 0 },
    unknown: { revenue: 0, deals: 0, averageDealValue: 0 },
  }

  attributedDeals.forEach(deal => {
    if (deal.serviceType in revenueByServiceType) {
      revenueByServiceType[deal.serviceType].revenue += deal.dealValue
      revenueByServiceType[deal.serviceType].deals += 1
    }
  })

  Object.keys(revenueByServiceType).forEach(serviceType => {
    const st = serviceType as ServiceType
    if (revenueByServiceType[st].deals > 0) {
      revenueByServiceType[st].averageDealValue =
        revenueByServiceType[st].revenue / revenueByServiceType[st].deals
    }
  })

  // Average days to close
  const dealsWithDays = attributedDeals.filter(d => d.daysToClose !== undefined)
  const averageDaysToClose = dealsWithDays.length > 0
    ? dealsWithDays.reduce((sum, d) => sum + (d.daysToClose || 0), 0) / dealsWithDays.length
    : 0

  // Top conversations by revenue
  const conversationRevenue = new Map<string, { revenue: number; deals: number; persona: Persona; intent: Intent }>()
  
  attributedDeals.forEach(deal => {
    if (deal.attributedConversationId) {
      const conv = conversations.find(c => c.id === deal.attributedConversationId)
      if (conv) {
        const existing = conversationRevenue.get(deal.attributedConversationId)
        if (existing) {
          existing.revenue += deal.dealValue
          existing.deals += 1
        } else {
          conversationRevenue.set(deal.attributedConversationId, {
            revenue: deal.dealValue,
            deals: 1,
            persona: conv.persona.detected,
            intent: conv.intent.detected,
          })
        }
      }
    }
  })

  const topConversations = Array.from(conversationRevenue.entries())
    .map(([conversationId, data]) => ({ conversationId, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)

  return {
    totalRevenue,
    totalDeals,
    averageDealValue,
    conversionRate,
    revenueByPersona,
    revenueByIntent,
    revenueByServiceType,
    averageDaysToClose,
    topConversations,
  }
}

// ============================================================================
// REPORT FORMATTING
// ============================================================================

/**
 * Format revenue metrics as a table
 */
export function formatRevenueReportAsTable(metrics: RevenueMetrics): string {
  let table = '='.repeat(80) + '\n'
  table += 'REVENUE ATTRIBUTION REPORT\n'
  table += '='.repeat(80) + '\n\n'

  // Summary
  table += 'SUMMARY\n'
  table += '-'.repeat(80) + '\n'
  table += `Total Revenue: ${metrics.totalRevenue.toLocaleString('th-TH')} THB\n`
  table += `Total Deals: ${metrics.totalDeals}\n`
  table += `Average Deal Value: ${metrics.averageDealValue.toLocaleString('th-TH')} THB\n`
  table += `Conversion Rate: ${metrics.conversionRate.toFixed(2)}%\n`
  table += `Average Days to Close: ${metrics.averageDaysToClose.toFixed(1)} days\n\n`

  // Revenue by Persona
  table += 'REVENUE BY PERSONA\n'
  table += '-'.repeat(80) + '\n'
  table += '| Persona        | Revenue (THB)    | Deals | Avg Deal | Conversion |\n'
  table += '|----------------|------------------|-------|----------|------------|\n'
  
  Object.entries(metrics.revenueByPersona).forEach(([persona, data]) => {
    table += `| ${persona.padEnd(14)} | ${data.revenue.toLocaleString('th-TH').padStart(16)} | ${String(data.deals).padStart(5)} | ${data.averageDealValue.toLocaleString('th-TH').padStart(8)} | ${data.conversionRate.toFixed(2).padStart(10)}% |\n`
  })
  table += '\n'

  // Revenue by Intent
  table += 'REVENUE BY INTENT\n'
  table += '-'.repeat(80) + '\n'
  table += '| Intent                          | Revenue (THB)    | Deals | Avg Deal | Conversion |\n'
  table += '|----------------------------------|------------------|-------|----------|------------|\n'
  
  Object.entries(metrics.revenueByIntent)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .forEach(([intent, data]) => {
      const intentName = intent.length > 32 ? intent.substring(0, 29) + '...' : intent
      table += `| ${intentName.padEnd(32)} | ${data.revenue.toLocaleString('th-TH').padStart(16)} | ${String(data.deals).padStart(5)} | ${data.averageDealValue.toLocaleString('th-TH').padStart(8)} | ${data.conversionRate.toFixed(2).padStart(10)}% |\n`
    })
  table += '\n'

  // Revenue by Service Type
  table += 'REVENUE BY SERVICE TYPE\n'
  table += '-'.repeat(80) + '\n'
  table += '| Service Type  | Revenue (THB)    | Deals | Avg Deal |\n'
  table += '|---------------|------------------|-------|----------|\n'
  
  Object.entries(metrics.revenueByServiceType)
    .filter(([_, data]) => data.deals > 0)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .forEach(([serviceType, data]) => {
      table += `| ${serviceType.padEnd(13)} | ${data.revenue.toLocaleString('th-TH').padStart(16)} | ${String(data.deals).padStart(5)} | ${data.averageDealValue.toLocaleString('th-TH').padStart(8)} |\n`
    })
  table += '\n'

  // Top Conversations
  if (metrics.topConversations.length > 0) {
    table += 'TOP CONVERSATIONS BY REVENUE\n'
    table += '-'.repeat(80) + '\n'
    table += '| Conversation ID | Persona        | Intent                          | Revenue (THB)    | Deals |\n'
    table += '|-----------------|----------------|----------------------------------|------------------|-------|\n'
    
    metrics.topConversations.forEach(conv => {
      const intentName = conv.intent.length > 32 ? conv.intent.substring(0, 29) + '...' : conv.intent
      table += `| ${conv.conversationId.padEnd(15)} | ${conv.persona.padEnd(14)} | ${intentName.padEnd(32)} | ${conv.revenue.toLocaleString('th-TH').padStart(16)} | ${String(conv.deals).padStart(5)} |\n`
    })
    table += '\n'
  }

  table += '='.repeat(80) + '\n'

  return table
}

/**
 * Format revenue metrics as JSON
 */
export function formatRevenueReportAsJSON(metrics: RevenueMetrics): string {
  return JSON.stringify(metrics, null, 2)
}
