/**
 * Conversation-Level Analysis
 * 
 * Analyzes chat conversations at the session level to:
 * - Identify where users drop off
 * - Measure turns before conversion or handoff
 * - Suggest optimization points (wording, CTA, timing)
 * - Generate A/B test candidates
 */

import type { Persona, Intent } from './chat-log-schema'
import type { HandoffReason } from './handoff'

// ============================================================================
// DATA SCHEMA
// ============================================================================

export type ConversationOutcome = 
  | 'converted'        // User contacted (phone/email/click)
  | 'handoff'          // Handed off to human
  | 'dropped_off'      // User stopped responding
  | 'ongoing'          // Conversation still active
  | 'unknown'

export type DropOffPoint = 
  | 'after_greeting'      // After first message
  | 'after_pricing'       // After pricing question
  | 'after_overview'      // After overview question
  | 'after_cta'           // After CTA shown
  | 'after_handoff'       // After handoff suggested
  | 'mid_conversation'    // In middle of conversation
  | 'none'                // No drop-off

export interface ConversationMetrics {
  // Session Info
  sessionId: string
  userId?: string
  startTime: string // ISO 8601
  endTime?: string // ISO 8601
  duration: number // Seconds
  
  // Conversation Stats
  totalTurns: number // Total message pairs (user + AI)
  totalMessages: number // Total messages (user only)
  averageResponseTime: number // Average AI response time (ms)
  
  // Outcome
  outcome: ConversationOutcome
  dropOffPoint: DropOffPoint
  dropOffTurn?: number // Turn number where user dropped off
  
  // Conversion Metrics
  turnsToConversion?: number // Turns before user contacted
  turnsToHandoff?: number // Turns before handoff
  conversionTime?: number // Seconds to conversion
  handoffTime?: number // Seconds to handoff
  
  // Intent & Persona
  primaryPersona: Persona
  primaryIntent: Intent
  intentChanges: number // Number of intent changes
  personaChanges: number // Number of persona changes
  
  // Engagement Metrics
  hasPricingQuestion: boolean
  hasOverviewQuestion: boolean
  pricingTurn?: number // Turn where pricing was asked
  overviewTurn?: number // Turn where overview was asked
  
  // CTA Performance
  ctaShown: boolean
  ctaTurn?: number // Turn where CTA was shown
  ctaVariant?: 'A' | 'B' | 'none'
  ctaResponseTime?: number // Seconds from CTA to user action
  
  // Handoff Metrics
  handoffReason?: HandoffReason
  handoffRequested: boolean
  
  // Drop-off Analysis
  lastUserMessage?: string
  lastAIResponse?: string
  lastResponseType?: 'greeting' | 'overview' | 'pricing' | 'restricted' | 'unknown'
  timeSinceLastMessage?: number // Seconds since last message
  
  // Optimization Flags
  optimizationFlags: OptimizationFlag[]
}

export interface OptimizationFlag {
  type: 'wording' | 'cta' | 'timing' | 'intent' | 'persona' | 'handoff'
  severity: 'high' | 'medium' | 'low'
  description: string
  suggestion: string
  abTestCandidate?: ABTestCandidate
}

export interface ABTestCandidate {
  testName: string
  hypothesis: string
  variantA: string // Current
  variantB: string // Proposed
  metric: string // What to measure
  expectedImpact: string // Expected improvement
  priority: 'high' | 'medium' | 'low'
}

export interface ConversationAnalysis {
  // Overall Metrics
  totalConversations: number
  conversionRate: number // % converted
  handoffRate: number // % handed off
  dropOffRate: number // % dropped off
  averageTurnsToConversion: number
  averageTurnsToHandoff: number
  averageConversationDuration: number
  
  // Drop-off Analysis
  dropOffPoints: Record<DropOffPoint, {
    count: number
    percentage: number
    averageTurn: number
  }>
  
  // Turn Analysis
  turnDistribution: Record<number, number> // Turn number -> count
  conversionByTurn: Record<number, number> // Turn number -> conversion count
  
  // CTA Performance
  ctaPerformance: {
    shown: number
    converted: number
    conversionRate: number
    averageResponseTime: number
  }
  
  // Optimization Recommendations
  recommendations: OptimizationRecommendation[]
  
  // A/B Test Candidates
  abTestCandidates: ABTestCandidate[]
}

export interface OptimizationRecommendation {
  type: 'wording' | 'cta' | 'timing' | 'intent' | 'persona' | 'handoff'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  impact: string // Expected impact
  effort: 'low' | 'medium' | 'high'
  abTestCandidate?: ABTestCandidate
}

// ============================================================================
// CONVERSATION ANALYSIS
// ============================================================================

/**
 * Analyze a single conversation (session)
 */
export function analyzeConversation(
  chatLogs: Array<{
    id: string
    sessionId: string
    userId?: string
    timestamp: string
    userMessage: string
    aiResponse: string
    intent: { detected: Intent }
    persona: { detected: Persona }
    responseType: 'greeting' | 'overview' | 'pricing' | 'restricted' | 'unknown'
    pricing?: {
      questionType: string
      containsPrice: boolean
    }
    handoff?: {
      reason: HandoffReason
      requestedAt?: string
    }
    userActions?: {
      contactMethod: string
      contactedAt?: string
    }
    abTesting?: {
      variant: 'A' | 'B' | 'none'
    }
    performance?: {
      responseTimeMs: number
    }
  }>
): ConversationMetrics {
  if (chatLogs.length === 0) {
    throw new Error('Cannot analyze empty conversation')
  }

  // Sort by timestamp
  const sortedLogs = [...chatLogs].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  )

  const firstLog = sortedLogs[0]
  const lastLog = sortedLogs[sortedLogs.length - 1]
  const startTime = new Date(firstLog.timestamp).getTime()
  const endTime = new Date(lastLog.timestamp).getTime()
  const duration = Math.floor((endTime - startTime) / 1000)

  // Calculate turns (each user message = 1 turn)
  const totalTurns = sortedLogs.length
  const totalMessages = sortedLogs.length

  // Average response time
  const responseTimes = sortedLogs
    .map(log => log.performance?.responseTimeMs || 0)
    .filter(time => time > 0)
  const averageResponseTime = responseTimes.length > 0
    ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
    : 0

  // Determine outcome
  const hasContact = sortedLogs.some(log => log.userActions?.contactMethod && log.userActions.contactMethod !== 'none')
  const hasHandoff = sortedLogs.some(log => log.handoff?.reason && log.handoff.reason !== 'none')
  
  let outcome: ConversationOutcome = 'unknown'
  if (hasContact) {
    outcome = 'converted'
  } else if (hasHandoff) {
    outcome = 'handoff'
  } else {
    // Check if conversation ended (no activity for > 5 minutes)
    const now = Date.now()
    const timeSinceLastMessage = Math.floor((now - endTime) / 1000)
    if (timeSinceLastMessage > 300) { // 5 minutes
      outcome = 'dropped_off'
    } else {
      outcome = 'ongoing'
    }
  }

  // Determine drop-off point
  const dropOffPoint = determineDropOffPoint(sortedLogs, outcome)
  const dropOffTurn = outcome === 'dropped_off' ? totalTurns : undefined

  // Turns to conversion/handoff
  const conversionTurn = sortedLogs.findIndex(log => 
    log.userActions?.contactMethod && log.userActions.contactMethod !== 'none'
  )
  const turnsToConversion = conversionTurn >= 0 ? conversionTurn + 1 : undefined
  
  const handoffTurn = sortedLogs.findIndex(log => 
    log.handoff?.reason && log.handoff.reason !== 'none'
  )
  const turnsToHandoff = handoffTurn >= 0 ? handoffTurn + 1 : undefined

  // Conversion/handoff time
  const conversionLog = sortedLogs[conversionTurn]
  const conversionTime = conversionLog && conversionLog.userActions?.contactedAt
    ? Math.floor((new Date(conversionLog.userActions.contactedAt).getTime() - startTime) / 1000)
    : undefined

  const handoffLog = sortedLogs[handoffTurn]
  const handoffTime = handoffLog && handoffLog.handoff?.requestedAt
    ? Math.floor((new Date(handoffLog.handoff.requestedAt).getTime() - startTime) / 1000)
    : undefined

  // Primary persona and intent
  const personaCounts = new Map<Persona, number>()
  const intentCounts = new Map<Intent, number>()
  sortedLogs.forEach(log => {
    personaCounts.set(log.persona.detected, (personaCounts.get(log.persona.detected) || 0) + 1)
    intentCounts.set(log.intent.detected, (intentCounts.get(log.intent.detected) || 0) + 1)
  })
  const primaryPersona = Array.from(personaCounts.entries())
    .sort((a, b) => b[1] - a[1])[0][0]
  const primaryIntent = Array.from(intentCounts.entries())
    .sort((a, b) => b[1] - a[1])[0][0]

  // Intent/persona changes
  let intentChanges = 0
  let personaChanges = 0
  for (let i = 1; i < sortedLogs.length; i++) {
    if (sortedLogs[i].intent.detected !== sortedLogs[i - 1].intent.detected) {
      intentChanges++
    }
    if (sortedLogs[i].persona.detected !== sortedLogs[i - 1].persona.detected) {
      personaChanges++
    }
  }

  // Pricing/overview questions
  const pricingTurn = sortedLogs.findIndex(log => 
    log.responseType === 'pricing' || log.pricing?.questionType === 'explicit'
  )
  const hasPricingQuestion = pricingTurn >= 0
  const pricingTurnNumber = pricingTurn >= 0 ? pricingTurn + 1 : undefined

  const overviewTurn = sortedLogs.findIndex(log => log.responseType === 'overview')
  const hasOverviewQuestion = overviewTurn >= 0
  const overviewTurnNumber = overviewTurn >= 0 ? overviewTurn + 1 : undefined

  // CTA performance
  const ctaLog = sortedLogs.find(log => 
    log.aiResponse.includes('ติดต่อ') || log.aiResponse.includes('086-398-6889')
  )
  const ctaShown = !!ctaLog
  const ctaTurn = ctaLog ? sortedLogs.indexOf(ctaLog) + 1 : undefined
  const ctaVariant = ctaLog?.abTesting?.variant || 'none'
  
  const ctaResponseTime = ctaLog && conversionLog
    ? Math.floor((new Date(conversionLog.timestamp).getTime() - new Date(ctaLog.timestamp).getTime()) / 1000)
    : undefined

  // Handoff
  const handoffReason = handoffLog?.handoff?.reason
  const handoffRequested = hasHandoff

  // Drop-off analysis
  const lastUserMessage = lastLog.userMessage
  const lastAIResponse = lastLog.aiResponse
  const lastResponseType = lastLog.responseType
  const now = Date.now()
  const timeSinceLastMessage = Math.floor((now - endTime) / 1000)

  // Optimization flags
  const optimizationFlags = generateOptimizationFlags(
    sortedLogs,
    outcome,
    dropOffPoint,
    turnsToConversion,
    turnsToHandoff,
    ctaShown,
    ctaTurn,
    pricingTurnNumber,
    overviewTurnNumber
  )

  return {
    sessionId: firstLog.sessionId,
    userId: firstLog.userId,
    startTime: firstLog.timestamp,
    endTime: lastLog.timestamp,
    duration,
    totalTurns,
    totalMessages,
    averageResponseTime,
    outcome,
    dropOffPoint,
    dropOffTurn,
    turnsToConversion,
    turnsToHandoff,
    conversionTime,
    handoffTime,
    primaryPersona,
    primaryIntent,
    intentChanges,
    personaChanges,
    hasPricingQuestion,
    hasOverviewQuestion,
    pricingTurn: pricingTurnNumber,
    overviewTurn: overviewTurnNumber,
    ctaShown,
    ctaTurn,
    ctaVariant,
    ctaResponseTime,
    handoffReason,
    handoffRequested,
    lastUserMessage,
    lastAIResponse,
    lastResponseType,
    timeSinceLastMessage,
    optimizationFlags,
  }
}

// ============================================================================
// BATCH ANALYSIS
// ============================================================================

/**
 * Analyze multiple conversations and generate insights
 */
export function analyzeConversations(
  conversations: Array<ConversationMetrics>
): ConversationAnalysis {
  const totalConversations = conversations.length

  // Outcome rates
  const converted = conversations.filter(c => c.outcome === 'converted').length
  const handedOff = conversations.filter(c => c.outcome === 'handoff').length
  const droppedOff = conversations.filter(c => c.outcome === 'dropped_off').length
  
  const conversionRate = totalConversations > 0 ? (converted / totalConversations) * 100 : 0
  const handoffRate = totalConversations > 0 ? (handedOff / totalConversations) * 100 : 0
  const dropOffRate = totalConversations > 0 ? (droppedOff / totalConversations) * 100 : 0

  // Average turns
  const conversionsWithTurns = conversations.filter(c => c.turnsToConversion !== undefined)
  const averageTurnsToConversion = conversionsWithTurns.length > 0
    ? conversionsWithTurns.reduce((sum, c) => sum + (c.turnsToConversion || 0), 0) / conversionsWithTurns.length
    : 0

  const handoffsWithTurns = conversations.filter(c => c.turnsToHandoff !== undefined)
  const averageTurnsToHandoff = handoffsWithTurns.length > 0
    ? handoffsWithTurns.reduce((sum, c) => sum + (c.turnsToHandoff || 0), 0) / handoffsWithTurns.length
    : 0

  const averageConversationDuration = conversations.length > 0
    ? conversations.reduce((sum, c) => sum + c.duration, 0) / conversations.length
    : 0

  // Drop-off points
  const dropOffPoints: Record<DropOffPoint, { count: number; percentage: number; averageTurn: number }> = {
    after_greeting: { count: 0, percentage: 0, averageTurn: 0 },
    after_pricing: { count: 0, percentage: 0, averageTurn: 0 },
    after_overview: { count: 0, percentage: 0, averageTurn: 0 },
    after_cta: { count: 0, percentage: 0, averageTurn: 0 },
    after_handoff: { count: 0, percentage: 0, averageTurn: 0 },
    mid_conversation: { count: 0, percentage: 0, averageTurn: 0 },
    none: { count: 0, percentage: 0, averageTurn: 0 },
  }

  const dropOffConversations = conversations.filter(c => c.outcome === 'dropped_off')
  dropOffConversations.forEach(conv => {
    const point = conv.dropOffPoint
    dropOffPoints[point].count++
    if (conv.dropOffTurn) {
      dropOffPoints[point].averageTurn = 
        (dropOffPoints[point].averageTurn * (dropOffPoints[point].count - 1) + conv.dropOffTurn) / dropOffPoints[point].count
    }
  })

  Object.keys(dropOffPoints).forEach(point => {
    const p = point as DropOffPoint
    dropOffPoints[p].percentage = dropOffConversations.length > 0
      ? (dropOffPoints[p].count / dropOffConversations.length) * 100
      : 0
  })

  // Turn distribution
  const turnDistribution: Record<number, number> = {}
  conversations.forEach(conv => {
    const turns = conv.totalTurns
    turnDistribution[turns] = (turnDistribution[turns] || 0) + 1
  })

  // Conversion by turn
  const conversionByTurn: Record<number, number> = {}
  conversionsWithTurns.forEach(conv => {
    const turn = conv.turnsToConversion || 0
    conversionByTurn[turn] = (conversionByTurn[turn] || 0) + 1
  })

  // CTA performance
  const ctaShown = conversations.filter(c => c.ctaShown).length
  const ctaConverted = conversations.filter(c => c.ctaShown && c.outcome === 'converted').length
  const ctaConversionRate = ctaShown > 0 ? (ctaConverted / ctaShown) * 100 : 0
  
  const ctaResponseTimes = conversations
    .filter(c => c.ctaResponseTime !== undefined)
    .map(c => c.ctaResponseTime || 0)
  const averageCtaResponseTime = ctaResponseTimes.length > 0
    ? ctaResponseTimes.reduce((sum, time) => sum + time, 0) / ctaResponseTimes.length
    : 0

  // Optimization recommendations
  const recommendations = generateRecommendations(conversations, dropOffPoints)

  // A/B test candidates
  const abTestCandidates = extractABTestCandidates(conversations, recommendations)

  return {
    totalConversations,
    conversionRate,
    handoffRate,
    dropOffRate,
    averageTurnsToConversion,
    averageTurnsToHandoff,
    averageConversationDuration,
    dropOffPoints,
    turnDistribution,
    conversionByTurn,
    ctaPerformance: {
      shown: ctaShown,
      converted: ctaConverted,
      conversionRate: ctaConversionRate,
      averageResponseTime: averageCtaResponseTime,
    },
    recommendations,
    abTestCandidates,
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function determineDropOffPoint(
  logs: typeof chatLogs,
  outcome: ConversationOutcome
): DropOffPoint {
  if (outcome !== 'dropped_off') {
    return 'none'
  }

  if (logs.length === 1) {
    return 'after_greeting'
  }

  const lastLog = logs[logs.length - 1]
  
  if (lastLog.responseType === 'pricing') {
    return 'after_pricing'
  }
  
  if (lastLog.responseType === 'overview') {
    return 'after_overview'
  }
  
  if (lastLog.aiResponse.includes('ติดต่อ') || lastLog.aiResponse.includes('086-398-6889')) {
    return 'after_cta'
  }
  
  if (lastLog.handoff?.reason && lastLog.handoff.reason !== 'none') {
    return 'after_handoff'
  }
  
  return 'mid_conversation'
}

function generateOptimizationFlags(
  logs: typeof chatLogs,
  outcome: ConversationOutcome,
  dropOffPoint: DropOffPoint,
  turnsToConversion?: number,
  turnsToHandoff?: number,
  ctaShown?: boolean,
  ctaTurn?: number,
  pricingTurn?: number,
  overviewTurn?: number
): OptimizationFlag[] {
  const flags: OptimizationFlag[] = []

  // High drop-off after greeting
  if (dropOffPoint === 'after_greeting') {
    flags.push({
      type: 'wording',
      severity: 'high',
      description: 'User dropped off after greeting - first message may not be engaging',
      suggestion: 'Improve greeting message to be more welcoming and action-oriented',
      abTestCandidate: {
        testName: 'greeting_message',
        hypothesis: 'More engaging greeting will reduce drop-off',
        variantA: 'Current greeting',
        variantB: 'More welcoming, action-oriented greeting',
        metric: 'Drop-off rate after greeting',
        expectedImpact: 'Reduce drop-off by 20%',
        priority: 'high',
      },
    })
  }

  // High drop-off after pricing
  if (dropOffPoint === 'after_pricing' && pricingTurn) {
    flags.push({
      type: 'wording',
      severity: 'high',
      description: `User dropped off after pricing question at turn ${pricingTurn}`,
      suggestion: 'Pricing response may be too expensive or unclear - consider adding value proposition',
      abTestCandidate: {
        testName: 'pricing_response',
        hypothesis: 'Better pricing presentation will reduce drop-off',
        variantA: 'Current pricing format',
        variantB: 'Pricing with value proposition and payment options',
        metric: 'Drop-off rate after pricing',
        expectedImpact: 'Reduce drop-off by 15%',
        priority: 'high',
      },
    })
  }

  // CTA not shown or shown too late
  if (!ctaShown && outcome === 'dropped_off') {
    flags.push({
      type: 'cta',
      severity: 'medium',
      description: 'User dropped off without seeing CTA',
      suggestion: 'Show CTA earlier in conversation (turn 2-3)',
      abTestCandidate: {
        testName: 'cta_timing',
        hypothesis: 'Earlier CTA will increase conversion',
        variantA: 'CTA shown after pricing/overview',
        variantB: 'CTA shown in turn 2-3',
        metric: 'Conversion rate',
        expectedImpact: 'Increase conversion by 10%',
        priority: 'medium',
      },
    })
  } else if (ctaShown && ctaTurn && ctaTurn > 3 && outcome === 'dropped_off') {
    flags.push({
      type: 'cta',
      severity: 'medium',
      description: `CTA shown too late (turn ${ctaTurn})`,
      suggestion: 'Show CTA earlier in conversation',
      abTestCandidate: {
        testName: 'cta_timing',
        hypothesis: 'Earlier CTA will increase conversion',
        variantA: `CTA at turn ${ctaTurn}`,
        variantB: 'CTA at turn 2-3',
        metric: 'Conversion rate',
        expectedImpact: 'Increase conversion by 10%',
        priority: 'medium',
      },
    })
  }

  // Long time to conversion
  if (turnsToConversion && turnsToConversion > 5) {
    flags.push({
      type: 'timing',
      severity: 'low',
      description: `Conversion took ${turnsToConversion} turns - may be too long`,
      suggestion: 'Optimize conversation flow to reduce turns to conversion',
      priority: 'low',
    })
  }

  // High drop-off after CTA
  if (dropOffPoint === 'after_cta') {
    flags.push({
      type: 'cta',
      severity: 'high',
      description: 'User dropped off after seeing CTA - CTA may not be compelling',
      suggestion: 'Improve CTA wording to be more urgent and value-focused',
      abTestCandidate: {
        testName: 'cta_wording',
        hypothesis: 'More compelling CTA will increase conversion',
        variantA: 'Current CTA wording',
        variantB: 'More urgent, value-focused CTA',
        metric: 'CTA conversion rate',
        expectedImpact: 'Increase CTA conversion by 25%',
        priority: 'high',
      },
    })
  }

  return flags
}

function generateRecommendations(
  conversations: ConversationMetrics[],
  dropOffPoints: Record<DropOffPoint, { count: number; percentage: number; averageTurn: number }>
): OptimizationRecommendation[] {
  const recommendations: OptimizationRecommendation[] = []

  // High drop-off after greeting
  if (dropOffPoints.after_greeting.percentage > 30) {
    recommendations.push({
      type: 'wording',
      priority: 'high',
      title: 'Improve Greeting Message',
      description: `${dropOffPoints.after_greeting.percentage.toFixed(1)}% of users drop off after greeting`,
      impact: 'Expected to reduce drop-off by 20-30%',
      effort: 'low',
      abTestCandidate: {
        testName: 'greeting_message',
        hypothesis: 'More engaging greeting will reduce drop-off',
        variantA: 'Current greeting',
        variantB: 'More welcoming, action-oriented greeting',
        metric: 'Drop-off rate after greeting',
        expectedImpact: 'Reduce drop-off by 20%',
        priority: 'high',
      },
    })
  }

  // High drop-off after pricing
  if (dropOffPoints.after_pricing.percentage > 25) {
    recommendations.push({
      type: 'wording',
      priority: 'high',
      title: 'Optimize Pricing Response',
      description: `${dropOffPoints.after_pricing.percentage.toFixed(1)}% of users drop off after pricing question`,
      impact: 'Expected to reduce drop-off by 15-25%',
      effort: 'medium',
      abTestCandidate: {
        testName: 'pricing_response',
        hypothesis: 'Better pricing presentation will reduce drop-off',
        variantA: 'Current pricing format',
        variantB: 'Pricing with value proposition and payment options',
        metric: 'Drop-off rate after pricing',
        expectedImpact: 'Reduce drop-off by 15%',
        priority: 'high',
      },
    })
  }

  // High drop-off after CTA
  if (dropOffPoints.after_cta.percentage > 20) {
    recommendations.push({
      type: 'cta',
      priority: 'high',
      title: 'Improve CTA Wording',
      description: `${dropOffPoints.after_cta.percentage.toFixed(1)}% of users drop off after seeing CTA`,
      impact: 'Expected to increase CTA conversion by 25-35%',
      effort: 'low',
      abTestCandidate: {
        testName: 'cta_wording',
        hypothesis: 'More compelling CTA will increase conversion',
        variantA: 'Current CTA wording',
        variantB: 'More urgent, value-focused CTA',
        metric: 'CTA conversion rate',
        expectedImpact: 'Increase CTA conversion by 25%',
        priority: 'high',
      },
    })
  }

  // Low CTA conversion rate
  const ctaConversations = conversations.filter(c => c.ctaShown)
  const ctaConversionRate = ctaConversations.length > 0
    ? (ctaConversations.filter(c => c.outcome === 'converted').length / ctaConversations.length) * 100
    : 0

  if (ctaConversionRate < 10 && ctaConversations.length > 10) {
    recommendations.push({
      type: 'cta',
      priority: 'medium',
      title: 'Optimize CTA Performance',
      description: `CTA conversion rate is only ${ctaConversionRate.toFixed(1)}%`,
      impact: 'Expected to increase conversion by 15-20%',
      effort: 'medium',
      abTestCandidate: {
        testName: 'cta_optimization',
        hypothesis: 'Better CTA will increase conversion',
        variantA: 'Current CTA',
        variantB: 'Improved CTA with urgency and value',
        metric: 'CTA conversion rate',
        expectedImpact: 'Increase conversion by 20%',
        priority: 'medium',
      },
    })
  }

  // Long average turns to conversion
  const conversions = conversations.filter(c => c.turnsToConversion !== undefined)
  const avgTurns = conversions.length > 0
    ? conversions.reduce((sum, c) => sum + (c.turnsToConversion || 0), 0) / conversions.length
    : 0

  if (avgTurns > 4 && conversions.length > 10) {
    recommendations.push({
      type: 'timing',
      priority: 'medium',
      title: 'Reduce Turns to Conversion',
      description: `Average ${avgTurns.toFixed(1)} turns to conversion - may be too long`,
      impact: 'Expected to reduce friction and increase conversion',
      effort: 'high',
    })
  }

  return recommendations
}

function extractABTestCandidates(
  conversations: ConversationMetrics[],
  recommendations: OptimizationRecommendation[]
): ABTestCandidate[] {
  const candidates: ABTestCandidate[] = []

  // Extract from recommendations
  recommendations.forEach(rec => {
    if (rec.abTestCandidate) {
      candidates.push(rec.abTestCandidate)
    }
  })

  // Extract from optimization flags
  conversations.forEach(conv => {
    conv.optimizationFlags.forEach(flag => {
      if (flag.abTestCandidate && !candidates.find(c => c.testName === flag.abTestCandidate!.testName)) {
        candidates.push(flag.abTestCandidate)
      }
    })
  })

  // Deduplicate and sort by priority
  const uniqueCandidates = Array.from(
    new Map(candidates.map(c => [c.testName, c])).values()
  ).sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 }
    return priorityOrder[b.priority] - priorityOrder[a.priority]
  })

  return uniqueCandidates
}
