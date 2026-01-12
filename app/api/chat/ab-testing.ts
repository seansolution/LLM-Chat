/**
 * A/B Testing for Chat Response Wording
 * 
 * Tests different wording variants to optimize:
 * - Pricing responses
 * - Service overview responses
 * - CTA phrasing
 * 
 * Metrics:
 * - Click/contact rate
 * - Conversation continuation rate
 * - Time-to-human handoff
 */

import type { Persona } from './intent'

// ============================================================================
// VARIANT DEFINITIONS
// ============================================================================

export type Variant = 'A' | 'B'
export type ResponseType = 'pricing' | 'overview' | 'cta'

/**
 * Variant A: Current wording (baseline)
 * - Polite, informative, soft CTA
 */
export const VARIANT_A = {
  pricing: {
    template: `[ชื่อบริการ]
ค่าบริการอยู่ที่ [ราคา] ([ครั้งเดียว / ต่อเดือน])
ใช้เวลาประมาณ [ระยะเวลา]

สนใจสอบถามเพิ่มเติม ติดต่อ 086-398-6889 หรือ zanhcpe@gmail.com นะคะ 😊`,
    cta: 'สนใจสอบถามเพิ่มเติม ติดต่อ 086-398-6889 หรือ zanhcpe@gmail.com นะคะ 😊',
    tone: 'polite',
  },
  overview: {
    template: `[สรุปบริการแบบสั้นๆ]
เหมาะสำหรับ [กลุ่มเป้าหมาย]
ราคาเริ่มต้นที่ [ราคา]

เจ้าหน้าที่ช่วยดูให้ตรงกับธุรกิจของคุณได้เลยค่ะ
สนใจสอบถามเพิ่มเติม ติดต่อ 086-398-6889 หรือ zanhcpe@gmail.com นะคะ 😊`,
    cta: 'เจ้าหน้าที่ช่วยดูให้ตรงกับธุรกิจของคุณได้เลยค่ะ\nสนใจสอบถามเพิ่มเติม ติดต่อ 086-398-6889 หรือ zanhcpe@gmail.com นะคะ 😊',
    tone: 'polite',
  },
  cta: {
    standard: 'สนใจสอบถามเพิ่มเติม ติดต่อ 086-398-6889 หรือ zanhcpe@gmail.com นะคะ 😊',
    urgent: 'มีคำถามเพิ่มเติมไหมคะ? ติดต่อ 086-398-6889 หรือ zanhcpe@gmail.com นะคะ',
    soft: 'เจ้าหน้าที่ช่วยดูให้ตรงกับธุรกิจของคุณได้เลยค่ะ',
  },
} as const

/**
 * Variant B: More sales-oriented wording
 * - Direct, benefit-focused, stronger CTA
 */
export const VARIANT_B = {
  pricing: {
    template: `[ชื่อบริการ]
ราคา [ราคา] ([ครั้งเดียว / ต่อเดือน]) - ครอบคลุมทุกขั้นตอน
ใช้เวลาเพียง [ระยะเวลา]

พร้อมเริ่มต้นได้เลยค่ะ! 📞 โทร 086-398-6889 หรือส่งอีเมล zanhcpe@gmail.com
เราจะติดต่อกลับภายใน 24 ชั่วโมงค่ะ`,
    cta: 'พร้อมเริ่มต้นได้เลยค่ะ! 📞 โทร 086-398-6889 หรือส่งอีเมล zanhcpe@gmail.com\nเราจะติดต่อกลับภายใน 24 ชั่วโมงค่ะ',
    tone: 'sales-oriented',
  },
  overview: {
    template: `[สรุปบริการแบบสั้นๆ]
เหมาะสำหรับ [กลุ่มเป้าหมาย]
ราคาเริ่มต้นที่ [ราคา] - คุ้มค่ากับการลงทุน

ต้องการคำแนะนำเฉพาะเจาะจงไหมคะ? 📞 โทร 086-398-6889 หรือส่งอีเมล zanhcpe@gmail.com
เจ้าหน้าที่พร้อมให้คำปรึกษาฟรีค่ะ`,
    cta: 'ต้องการคำแนะนำเฉพาะเจาะจงไหมคะ? 📞 โทร 086-398-6889 หรือส่งอีเมล zanhcpe@gmail.com\nเจ้าหน้าที่พร้อมให้คำปรึกษาฟรีค่ะ',
    tone: 'sales-oriented',
  },
  cta: {
    standard: 'พร้อมเริ่มต้นได้เลยค่ะ! 📞 โทร 086-398-6889 หรือส่งอีเมล zanhcpe@gmail.com\nเราจะติดต่อกลับภายใน 24 ชั่วโมงค่ะ',
    urgent: 'ต้องการคำแนะนำเฉพาะเจาะจงไหมคะ? 📞 โทร 086-398-6889 หรือส่งอีเมล zanhcpe@gmail.com\nเจ้าหน้าที่พร้อมให้คำปรึกษาฟรีค่ะ',
    soft: 'ต้องการคำแนะนำเฉพาะเจาะจงไหมคะ? เจ้าหน้าที่พร้อมให้คำปรึกษาฟรีค่ะ',
  },
} as const

// ============================================================================
// VARIANT ASSIGNMENT (Deterministic)
// ============================================================================

/**
 * Deterministic variant assignment based on user identifier
 * Uses hash-based assignment for consistent user experience
 * 
 * @param userId - Unique user identifier (session ID, user ID, etc.)
 * @param responseType - Type of response (pricing, overview, cta)
 * @returns Variant A or B
 */
export function assignVariant(userId: string, responseType: ResponseType): Variant {
  // Create a hash from userId + responseType for deterministic assignment
  const hashInput = `${userId}:${responseType}`
  
  // Simple hash function (djb2 algorithm)
  let hash = 5381
  for (let i = 0; i < hashInput.length; i++) {
    hash = ((hash << 5) + hash) + hashInput.charCodeAt(i)
    hash = hash & hash // Convert to 32-bit integer
  }
  
  // 50/50 split (can be adjusted for different splits)
  return Math.abs(hash) % 2 === 0 ? 'A' : 'B'
}

/**
 * Get variant-specific CTA based on response type and variant
 */
export function getVariantCTA(responseType: ResponseType, variant: Variant, urgency: 'standard' | 'urgent' | 'soft' = 'standard'): string {
  const variantData = variant === 'A' ? VARIANT_A : VARIANT_B
  
  if (responseType === 'pricing') {
    return variantData.pricing.cta
  } else if (responseType === 'overview') {
    return variantData.overview.cta
  } else {
    return variantData.cta[urgency]
  }
}

/**
 * Apply variant to response by replacing CTA
 * Keeps the main response content, only changes CTA phrasing
 */
export function applyVariantToResponse(
  originalResponse: string,
  responseType: ResponseType,
  variant: Variant,
  userId: string
): string {
  // Remove existing CTA patterns
  const ctaPatterns = [
    /สนใจสอบถามเพิ่มเติม.*zanhcpe@gmail\.com.*😊/i,
    /ติดต่อ.*086-398-6889.*zanhcpe@gmail\.com/i,
    /เจ้าหน้าที่ช่วยดูให้ตรงกับธุรกิจของคุณ/i,
    /พร้อมเริ่มต้นได้เลยค่ะ.*zanhcpe@gmail\.com/i,
    /ต้องการคำแนะนำเฉพาะเจาะจง.*zanhcpe@gmail\.com/i,
  ]
  
  let cleanedResponse = originalResponse
  for (const pattern of ctaPatterns) {
    cleanedResponse = cleanedResponse.replace(pattern, '').trim()
  }
  
  // Get variant CTA
  const variantCTA = getVariantCTA(responseType, variant)
  
  // Append variant CTA
  return `${cleanedResponse}\n\n${variantCTA}`.trim()
}

// ============================================================================
// METRICS DEFINITIONS
// ============================================================================

export interface ABTestMetrics {
  variant: Variant
  responseType: ResponseType
  userId: string
  timestamp: Date
  intent: string
  persona: Persona
}

export interface ContactEvent {
  userId: string
  variant: Variant
  responseType: ResponseType
  timestamp: Date
  method: 'phone' | 'email' | 'click' // How user contacted
}

export interface ConversationEvent {
  userId: string
  variant: Variant
  responseType: ResponseType
  timestamp: Date
  event: 'message_sent' | 'conversation_ended' | 'human_requested'
  messageCount: number
}

export interface ABTestResult {
  variant: Variant
  responseType: ResponseType
  totalResponses: number
  contactRate: number // % of users who contacted
  continuationRate: number // % of users who sent another message
  avgTimeToContact: number // Average seconds until contact
  avgTimeToHumanHandoff: number // Average seconds until human requested
  avgMessageCount: number // Average messages per conversation
}

// ============================================================================
// METRICS CALCULATION
// ============================================================================

/**
 * Calculate contact rate for a variant
 */
export function calculateContactRate(
  metrics: ABTestMetrics[],
  contacts: ContactEvent[],
  variant: Variant,
  responseType: ResponseType
): number {
  const variantMetrics = metrics.filter(
    m => m.variant === variant && m.responseType === responseType
  )
  
  if (variantMetrics.length === 0) return 0
  
  const uniqueUsers = new Set(variantMetrics.map(m => m.userId))
  const contactedUsers = new Set(
    contacts
      .filter(c => c.variant === variant && c.responseType === responseType)
      .map(c => c.userId)
  )
  
  return (contactedUsers.size / uniqueUsers.size) * 100
}

/**
 * Calculate conversation continuation rate
 */
export function calculateContinuationRate(
  metrics: ABTestMetrics[],
  conversations: ConversationEvent[],
  variant: Variant,
  responseType: ResponseType
): number {
  const variantMetrics = metrics.filter(
    m => m.variant === variant && m.responseType === responseType
  )
  
  if (variantMetrics.length === 0) return 0
  
  const uniqueUsers = new Set(variantMetrics.map(m => m.userId))
  const continuedUsers = new Set(
    conversations
      .filter(c => c.variant === variant && c.responseType === responseType && c.event === 'message_sent')
      .map(c => c.userId)
  )
  
  return (continuedUsers.size / uniqueUsers.size) * 100
}

/**
 * Calculate average time to contact
 */
export function calculateAvgTimeToContact(
  metrics: ABTestMetrics[],
  contacts: ContactEvent[],
  variant: Variant,
  responseType: ResponseType
): number {
  const variantMetrics = metrics.filter(
    m => m.variant === variant && m.responseType === responseType
  )
  
  const timeDiffs: number[] = []
  
  for (const metric of variantMetrics) {
    const contact = contacts.find(
      c => c.userId === metric.userId && 
           c.variant === variant && 
           c.responseType === responseType
    )
    
    if (contact) {
      const diff = (contact.timestamp.getTime() - metric.timestamp.getTime()) / 1000 // seconds
      timeDiffs.push(diff)
    }
  }
  
  if (timeDiffs.length === 0) return 0
  return timeDiffs.reduce((a, b) => a + b, 0) / timeDiffs.length
}

/**
 * Calculate average time to human handoff
 */
export function calculateAvgTimeToHumanHandoff(
  metrics: ABTestMetrics[],
  conversations: ConversationEvent[],
  variant: Variant,
  responseType: ResponseType
): number {
  const variantMetrics = metrics.filter(
    m => m.variant === variant && m.responseType === responseType
  )
  
  const timeDiffs: number[] = []
  
  for (const metric of variantMetrics) {
    const handoff = conversations.find(
      c => c.userId === metric.userId && 
           c.variant === variant && 
           c.responseType === responseType &&
           c.event === 'human_requested'
    )
    
    if (handoff) {
      const diff = (handoff.timestamp.getTime() - metric.timestamp.getTime()) / 1000 // seconds
      timeDiffs.push(diff)
    }
  }
  
  if (timeDiffs.length === 0) return 0
  return timeDiffs.reduce((a, b) => a + b, 0) / timeDiffs.length
}

/**
 * Calculate average message count per conversation
 */
export function calculateAvgMessageCount(
  conversations: ConversationEvent[],
  variant: Variant,
  responseType: ResponseType
): number {
  const variantConversations = conversations.filter(
    c => c.variant === variant && c.responseType === responseType
  )
  
  if (variantConversations.length === 0) return 0
  
  const messageCounts = variantConversations.map(c => c.messageCount)
  return messageCounts.reduce((a, b) => a + b, 0) / messageCounts.length
}

/**
 * Generate comprehensive AB test results
 */
export function generateABTestResults(
  metrics: ABTestMetrics[],
  contacts: ContactEvent[],
  conversations: ConversationEvent[],
  responseType: ResponseType
): { variantA: ABTestResult; variantB: ABTestResult } {
  const variantA: ABTestResult = {
    variant: 'A',
    responseType,
    totalResponses: metrics.filter(m => m.variant === 'A' && m.responseType === responseType).length,
    contactRate: calculateContactRate(metrics, contacts, 'A', responseType),
    continuationRate: calculateContinuationRate(metrics, conversations, 'A', responseType),
    avgTimeToContact: calculateAvgTimeToContact(metrics, contacts, 'A', responseType),
    avgTimeToHumanHandoff: calculateAvgTimeToHumanHandoff(metrics, conversations, 'A', responseType),
    avgMessageCount: calculateAvgMessageCount(conversations, 'A', responseType),
  }
  
  const variantB: ABTestResult = {
    variant: 'B',
    responseType,
    totalResponses: metrics.filter(m => m.variant === 'B' && m.responseType === responseType).length,
    contactRate: calculateContactRate(metrics, contacts, 'B', responseType),
    continuationRate: calculateContinuationRate(metrics, conversations, 'B', responseType),
    avgTimeToContact: calculateAvgTimeToContact(metrics, contacts, 'B', responseType),
    avgTimeToHumanHandoff: calculateAvgTimeToHumanHandoff(metrics, conversations, 'B', responseType),
    avgMessageCount: calculateAvgMessageCount(conversations, 'B', responseType),
  }
  
  return { variantA, variantB }
}

// ============================================================================
// STATISTICAL SIGNIFICANCE
// ============================================================================

/**
 * Calculate statistical significance using chi-square test
 * Returns p-value (probability that difference is due to chance)
 * p < 0.05 is considered statistically significant
 */
export function calculateStatisticalSignificance(
  variantA: ABTestResult,
  variantB: ABTestResult,
  metric: 'contactRate' | 'continuationRate'
): { pValue: number; isSignificant: boolean; winner: Variant | null } {
  const aValue = variantA[metric]
  const bValue = variantB[metric]
  const aTotal = variantA.totalResponses
  const bTotal = variantB.totalResponses
  
  if (aTotal === 0 || bTotal === 0) {
    return { pValue: 1, isSignificant: false, winner: null }
  }
  
  // Simplified chi-square calculation
  // In production, use a proper statistical library
  const aSuccess = (aValue / 100) * aTotal
  const bSuccess = (bValue / 100) * bTotal
  const aFailure = aTotal - aSuccess
  const bFailure = bTotal - bSuccess
  
  const totalSuccess = aSuccess + bSuccess
  const totalFailure = aFailure + bFailure
  const total = aTotal + bTotal
  
  const expectedASuccess = (totalSuccess * aTotal) / total
  const expectedBSuccess = (totalSuccess * bTotal) / total
  const expectedAFailure = (totalFailure * aTotal) / total
  const expectedBFailure = (totalFailure * bTotal) / total
  
  const chiSquare = 
    Math.pow(aSuccess - expectedASuccess, 2) / expectedASuccess +
    Math.pow(bSuccess - expectedBSuccess, 2) / expectedBSuccess +
    Math.pow(aFailure - expectedAFailure, 2) / expectedAFailure +
    Math.pow(bFailure - expectedBFailure, 2) / expectedBFailure
  
  // For 1 degree of freedom, chi-square > 3.84 means p < 0.05
  // Simplified: p-value approximation
  const pValue = chiSquare > 3.84 ? 0.05 : 0.5 // Simplified
  const isSignificant = pValue < 0.05
  
  const winner = isSignificant 
    ? (aValue > bValue ? 'A' : 'B')
    : null
  
  return { pValue, isSignificant, winner }
}

// ============================================================================
// RESULT FORMATTING
// ============================================================================

export function formatABTestResults(
  results: { variantA: ABTestResult; variantB: ABTestResult },
  responseType: ResponseType
): string {
  const { variantA, variantB } = results
  const significance = calculateStatisticalSignificance(variantA, variantB, 'contactRate')
  
  let output = `\n${'='.repeat(60)}\n`
  output += `A/B TEST RESULTS - ${responseType.toUpperCase()}\n`
  output += `${'='.repeat(60)}\n\n`
  
  output += `Variant A (Current):\n`
  output += `  Total Responses: ${variantA.totalResponses}\n`
  output += `  Contact Rate: ${variantA.contactRate.toFixed(2)}%\n`
  output += `  Continuation Rate: ${variantA.continuationRate.toFixed(2)}%\n`
  output += `  Avg Time to Contact: ${variantA.avgTimeToContact.toFixed(0)}s\n`
  output += `  Avg Time to Handoff: ${variantA.avgTimeToHumanHandoff.toFixed(0)}s\n`
  output += `  Avg Message Count: ${variantA.avgMessageCount.toFixed(1)}\n\n`
  
  output += `Variant B (Sales-Oriented):\n`
  output += `  Total Responses: ${variantB.totalResponses}\n`
  output += `  Contact Rate: ${variantB.contactRate.toFixed(2)}%\n`
  output += `  Continuation Rate: ${variantB.continuationRate.toFixed(2)}%\n`
  output += `  Avg Time to Contact: ${variantB.avgTimeToContact.toFixed(0)}s\n`
  output += `  Avg Time to Handoff: ${variantB.avgTimeToHumanHandoff.toFixed(0)}s\n`
  output += `  Avg Message Count: ${variantB.avgMessageCount.toFixed(1)}\n\n`
  
  output += `Statistical Significance:\n`
  output += `  p-value: ${significance.pValue.toFixed(4)}\n`
  output += `  Significant: ${significance.isSignificant ? 'Yes' : 'No'}\n`
  if (significance.winner) {
    output += `  Winner: Variant ${significance.winner}\n`
  }
  
  output += `${'='.repeat(60)}\n`
  
  return output
}
