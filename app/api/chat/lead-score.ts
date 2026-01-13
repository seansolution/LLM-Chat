/**
 * Lead Score Calculation
 * 
 * Calculates lead score (0-100) based on conversation summary data.
 * Used in Agent Console to prioritize handoffs.
 */

import type { ConversationSummary } from './agent-assist'

// ============================================================================
// TYPES
// ============================================================================

export interface LeadScoreBreakdown {
  buyingIntent: number // 0-30
  urgency: number // 0-25
  persona: number // 0-15
  pricing: number // 0-10
  contactRequested: number // 0-10
  estimatedValue: number // 0-10
}

export interface LeadScore {
  score: number // 0-100
  breakdown: LeadScoreBreakdown
  explanation: string
  category: 'hot' | 'warm' | 'cool' | 'cold'
}

// ============================================================================
// CALCULATION
// ============================================================================

/**
 * Calculate lead score from conversation summary
 */
export function calculateLeadScore(summary: ConversationSummary): LeadScore {
  const breakdown: LeadScoreBreakdown = {
    buyingIntent: 0,
    urgency: 0,
    persona: 0,
    pricing: 0,
    contactRequested: 0,
    estimatedValue: 0,
  }

  // Buying Intent (0-30 points)
  const buyingIntentScores: Record<ConversationSummary['buyingIntent'], number> = {
    'ready_to_buy': 30,
    'urgent': 25,
    'price_comparison': 20,
    'problem_solving': 15,
    'information_seeking': 10,
    'exploring': 5,
    'unknown': 0,
  }
  breakdown.buyingIntent = buyingIntentScores[summary.buyingIntent] || 0

  // Urgency (0-25 points)
  const urgencyScores: Record<ConversationSummary['urgencyLevel'], number> = {
    'high': 25,
    'medium': 15,
    'low': 5,
    'unknown': 0,
  }
  breakdown.urgency = urgencyScores[summary.urgencyLevel] || 0

  // Persona Match (0-15 points)
  // REGISTRATION typically higher value deals
  const personaScores: Record<ConversationSummary['persona'], number> = {
    'REGISTRATION': 15,
    'ACCOUNTING': 12,
    'HR': 10,
  }
  breakdown.persona = personaScores[summary.persona] || 0

  // Pricing Discussed (0-10 points)
  if (summary.alreadyAnswered.pricing) {
    breakdown.pricing = 10
  }

  // Contact Requested (0-10 points)
  if (summary.handoffReason === 'user_requested') {
    breakdown.contactRequested = 10
  }

  // Estimated Value (0-10 points)
  if (summary.suggestedAction.estimatedValue) {
    const value = summary.suggestedAction.estimatedValue
    if (value >= 100000) {
      breakdown.estimatedValue = 10
    } else if (value >= 50000) {
      breakdown.estimatedValue = 7
    } else if (value >= 25000) {
      breakdown.estimatedValue = 5
    } else {
      breakdown.estimatedValue = 3
    }
  }

  // Calculate total score
  const score = Math.min(100, 
    breakdown.buyingIntent +
    breakdown.urgency +
    breakdown.persona +
    breakdown.pricing +
    breakdown.contactRequested +
    breakdown.estimatedValue
  )

  // Determine category
  let category: LeadScore['category']
  let explanation: string

  if (score >= 90) {
    category = 'hot'
    explanation = 'Hot lead - Immediate action required'
  } else if (score >= 70) {
    category = 'warm'
    explanation = 'Warm lead - Follow up within 24 hours'
  } else if (score >= 50) {
    category = 'cool'
    explanation = 'Cool lead - Follow up within 3 days'
  } else {
    category = 'cold'
    explanation = 'Cold lead - Follow up when time permits'
  }

  return {
    score,
    breakdown,
    explanation,
    category,
  }
}

/**
 * Format lead score for display
 */
export function formatLeadScore(leadScore: LeadScore): string {
  return `${leadScore.score}/100 (${leadScore.category})`
}

/**
 * Get lead score color class (for UI)
 */
export function getLeadScoreColor(score: number): string {
  if (score >= 90) return 'text-green-600'
  if (score >= 70) return 'text-blue-600'
  if (score >= 50) return 'text-yellow-600'
  return 'text-gray-600'
}

/**
 * Get lead score background color class (for UI)
 */
export function getLeadScoreBgColor(score: number): string {
  if (score >= 90) return 'bg-green-50 border-green-200'
  if (score >= 70) return 'bg-blue-50 border-blue-200'
  if (score >= 50) return 'bg-yellow-50 border-yellow-200'
  return 'bg-gray-50 border-gray-200'
}
