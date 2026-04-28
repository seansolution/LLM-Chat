/**
 * Role-Based A/B Testing
 * 
 * Tests different wording variants per role while keeping intent and persona identical.
 * Only wording differs - same intent, same persona, different phrasing.
 * 
 * Metrics:
 * - Contact rate (phone/email/click)
 * - Conversation continuation rate
 * - Time to contact
 * - Time to human handoff
 * - Conversion rate
 */

import type { Persona } from './intent'
import type { AIRole } from './role-prompts'

// ============================================================================
// TYPES
// ============================================================================

export type Variant = 'A' | 'B'
export type ResponseType = 'pricing' | 'overview' | 'greeting' | 'restricted'

// ============================================================================
// ROLE-BASED VARIANT DEFINITIONS
// ============================================================================

/**
 * AI Sales Admin - Variant A (Baseline)
 * Polite, informative, soft CTA
 */
export const SALES_VARIANT_A = {
  pricing: {
    cta: 'สนใจสอบถามรายละเอียดเพิ่มเติมหรือต้องการให้เจ้าหน้าที่ช่วยดูให้ตรงกับธุรกิจของคุณ ติดต่อ 086-398-6889 หรือ zanhcpe@gmail.com นะคะ 😊',
    valueEmphasis: 'ครอบคลุมการตรวจชื่อ จัดทำเอกสาร จดทะเบียนที่ DBD และขอเลขผู้เสียภาษีค่ะ',
    tone: 'polite',
    approach: 'informative'
  },
  overview: {
    cta: 'เจ้าหน้าที่ช่วยดูให้ตรงกับธุรกิจของคุณได้เลยค่ะ\nสนใจสอบถามรายละเอียดเพิ่มเติม ติดต่อ 086-398-6889 หรือ zanhcpe@gmail.com นะคะ 😊',
    valueEmphasis: 'เหมาะสำหรับผู้ที่ต้องการเริ่มต้นธุรกิจอย่างถูกต้องตามกฎหมายค่ะ',
    tone: 'polite',
    approach: 'informative'
  },
  greeting: {
    introduction: 'สวัสดีค่ะ 😊 ยินดีต้อนรับสู่บริษัท ABC จำกัด (สำนักงานใหญ่)',
    invitation: 'มีอะไรให้ช่วยไหมคะ? เรามีบริการด้าน HR บัญชี และจดทะเบียนบริษัทค่ะ',
    cta: 'สนใจสอบถามเพิ่มเติม ติดต่อ 086-398-6889 หรือ zanhcpe@gmail.com นะคะ',
    tone: 'polite'
  }
} as const

/**
 * AI Sales Admin - Variant B (Sales-Oriented)
 * Direct, benefit-focused, stronger CTA
 */
export const SALES_VARIANT_B = {
  pricing: {
    cta: 'พร้อมเริ่มต้นได้เลยค่ะ! 📞 โทร 086-398-6889 หรือส่งอีเมล zanhcpe@gmail.com\nเราจะติดต่อกลับภายใน 24 ชั่วโมงค่ะ',
    valueEmphasis: 'ครอบคลุมทุกขั้นตอน - ตรวจชื่อ จัดทำเอกสาร จดทะเบียน และขอเลขผู้เสียภาษี',
    tone: 'sales-oriented',
    approach: 'action-oriented'
  },
  overview: {
    cta: 'ต้องการคำแนะนำเฉพาะเจาะจงไหมคะ? 📞 โทร 086-398-6889 หรือส่งอีเมล zanhcpe@gmail.com\nเจ้าหน้าที่พร้อมให้คำปรึกษาฟรีค่ะ',
    valueEmphasis: 'เหมาะสำหรับผู้ที่ต้องการเริ่มต้นธุรกิจอย่างถูกต้อง - คุ้มค่ากับการลงทุน',
    tone: 'sales-oriented',
    approach: 'action-oriented'
  },
  greeting: {
    introduction: 'สวัสดีค่ะ 😊 ยินดีต้อนรับสู่บริษัท ABC จำกัด (สำนักงานใหญ่)',
    invitation: 'มีอะไรให้ช่วยไหมคะ? เรามีบริการด้าน HR บัญชี และจดทะเบียนบริษัทค่ะ',
    cta: 'พร้อมเริ่มต้นได้เลยค่ะ! 📞 โทร 086-398-6889 หรือส่งอีเมล zanhcpe@gmail.com',
    tone: 'sales-oriented'
  }
} as const

/**
 * AI Support Agent - Variant A (Baseline)
 * Patient, clear, helpful
 */
export const SUPPORT_VARIANT_A = {
  pricing: {
    cta: 'หากต้องการสอบถามรายละเอียดเพิ่มเติมหรือมีคำถามเฉพาะ ติดต่อ 086-398-6889 หรือ zanhcpe@gmail.com นะคะ 😊',
    scopeExplanation: 'อธิบายขอบเขตบริการอย่างชัดเจน',
    tone: 'patient',
    approach: 'helpful'
  },
  overview: {
    cta: 'หากต้องการสอบถามรายละเอียดเพิ่มเติม ติดต่อเจ้าหน้าที่ได้เลยค่ะ\nโทร 086-398-6889 หรืออีเมล zanhcpe@gmail.com',
    scopeExplanation: 'อธิบายขอบเขตบริการอย่างชัดเจน',
    tone: 'patient',
    approach: 'helpful'
  },
  greeting: {
    introduction: 'สวัสดีค่ะ 😊 ยินดีต้อนรับสู่บริษัท ABC จำกัด (สำนักงานใหญ่)',
    invitation: 'มีอะไรให้ช่วยไหมคะ? เรามีบริการด้าน HR บัญชี และจดทะเบียนบริษัทค่ะ',
    cta: 'หากต้องการความช่วยเหลือเพิ่มเติม ติดต่อ 086-398-6889 หรือ zanhcpe@gmail.com นะคะ',
    tone: 'patient'
  }
} as const

/**
 * AI Support Agent - Variant B (Proactive)
 * More proactive, offers additional help
 */
export const SUPPORT_VARIANT_B = {
  pricing: {
    cta: 'มีคำถามเพิ่มเติมหรือต้องการคำแนะนำเฉพาะเจาะจงไหมคะ? 📞 โทร 086-398-6889 หรืออีเมล zanhcpe@gmail.com\nเจ้าหน้าที่พร้อมช่วยเหลือค่ะ',
    scopeExplanation: 'อธิบายขอบเขตบริการอย่างละเอียดและชัดเจน',
    tone: 'proactive',
    approach: 'helpful'
  },
  overview: {
    cta: 'ต้องการความช่วยเหลือเพิ่มเติมไหมคะ? 📞 โทร 086-398-6889 หรืออีเมล zanhcpe@gmail.com\nเจ้าหน้าที่พร้อมตอบคำถามและให้คำแนะนำค่ะ',
    scopeExplanation: 'อธิบายขอบเขตบริการอย่างละเอียดและชัดเจน',
    tone: 'proactive',
    approach: 'helpful'
  },
  greeting: {
    introduction: 'สวัสดีค่ะ 😊 ยินดีต้อนรับสู่บริษัท ABC จำกัด (สำนักงานใหญ่)',
    invitation: 'มีอะไรให้ช่วยไหมคะ? เรามีบริการด้าน HR บัญชี และจดทะเบียนบริษัทค่ะ',
    cta: 'ต้องการความช่วยเหลือเพิ่มเติมไหมคะ? 📞 โทร 086-398-6889 หรืออีเมล zanhcpe@gmail.com',
    tone: 'proactive'
  }
} as const

/**
 * AI Operations Analyst - Variant A (Baseline)
 * Redirects all customer questions
 */
export const OPS_VARIANT_A = {
  redirect: {
    message: 'ขออภัยค่ะ ฉันเป็น AI Operations Analyst ที่วิเคราะห์คุณภาพระบบ ไม่ใช่เจ้าหน้าที่ที่คุยกับลูกค้าโดยตรง',
    contactInfo: 'กรุณาติดต่อเจ้าหน้าที่ของบริษัท:\n- โทรศัพท์: 086-398-6889\n- อีเมล: zanhcpe@gmail.com',
    closing: 'เจ้าหน้าที่จะช่วยตอบคำถามและให้บริการได้ตรงกับความต้องการของคุณค่ะ 😊',
    tone: 'professional'
  }
} as const

/**
 * AI Operations Analyst - Variant B (Alternative)
 * Slightly different redirect wording
 */
export const OPS_VARIANT_B = {
  redirect: {
    message: 'ขออภัยค่ะ ฉันเป็น AI Operations Analyst ที่วิเคราะห์คุณภาพระบบ ไม่ใช่เจ้าหน้าที่ที่คุยกับลูกค้าโดยตรง',
    contactInfo: 'กรุณาติดต่อเจ้าหน้าที่ของบริษัท:\n- โทรศัพท์: 086-398-6889\n- อีเมล: zanhcpe@gmail.com',
    closing: 'เจ้าหน้าที่ของเราพร้อมช่วยเหลือคุณค่ะ 😊',
    tone: 'professional'
  }
} as const

// ============================================================================
// VARIANT SELECTION
// ============================================================================

/**
 * Get role-specific variant definitions
 */
export function getRoleVariants(role: AIRole, variant: Variant) {
  switch (role) {
    case 'SALES':
      return variant === 'A' ? SALES_VARIANT_A : SALES_VARIANT_B
    case 'SUPPORT':
      return variant === 'A' ? SUPPORT_VARIANT_A : SUPPORT_VARIANT_B
    case 'OPS':
      return variant === 'A' ? OPS_VARIANT_A : OPS_VARIANT_B
  }
}

/**
 * Deterministic variant assignment
 * Same user + same role + same response type = same variant
 * 
 * @param userId - Unique user identifier
 * @param role - AI role (SALES, SUPPORT, OPS)
 * @param responseType - Type of response
 * @returns Variant A or B
 */
export function assignVariant(
  userId: string,
  role: AIRole,
  responseType: ResponseType
): Variant {
  // Create hash from userId + role + responseType for deterministic assignment
  const hashInput = `${userId}:${role}:${responseType}`
  
  // djb2 hash algorithm
  let hash = 5381
  for (let i = 0; i < hashInput.length; i++) {
    hash = ((hash << 5) + hash) + hashInput.charCodeAt(i)
    hash = hash & hash // Convert to 32-bit integer
  }
  
  // 50/50 split (can be adjusted)
  return Math.abs(hash) % 2 === 0 ? 'A' : 'B'
}

/**
 * Apply role-based variant to response
 * Only changes wording (CTA, emphasis) - keeps intent and persona identical
 */
export function applyRoleVariantToResponse(
  originalResponse: string,
  role: AIRole,
  responseType: ResponseType,
  variant: Variant
): string {
  const roleVariants = getRoleVariants(role, variant)
  
  // Check if response already has a CTA
  const hasCTA = /สนใจสอบถาม.*(รายละเอียด|เพิ่มเติม|เจ้าหน้าที่ช่วยดู)/i.test(originalResponse) ||
                 /ต้องการให้เจ้าหน้าที่ช่วยดูให้ตรง/i.test(originalResponse) ||
                 /พร้อมเริ่มต้นได้เลย/i.test(originalResponse) ||
                 /ต้องการคำแนะนำเฉพาะเจาะจง/i.test(originalResponse)
  
  // Remove existing CTA patterns only if we're going to add a new one
  const ctaPatterns = [
    /สนใจสอบถาม.*zanhcpe@gmail\.com.*😊/i,
    /ติดต่อ.*086-398-6889.*zanhcpe@gmail\.com/i,
    /เจ้าหน้าที่ช่วยดูให้ตรงกับธุรกิจของคุณ/i,
    /พร้อมเริ่มต้นได้เลยค่ะ.*zanhcpe@gmail\.com/i,
    /ต้องการคำแนะนำเฉพาะเจาะจง.*zanhcpe@gmail\.com/i,
    /หากต้องการสอบถาม.*zanhcpe@gmail\.com/i,
    /มีคำถามเพิ่มเติม.*zanhcpe@gmail\.com/i,
  ]
  
  let cleanedResponse = originalResponse
  // Only remove CTA if we're going to add a new variant CTA
  if (!hasCTA) {
    for (const pattern of ctaPatterns) {
      cleanedResponse = cleanedResponse.replace(pattern, '').trim()
    }
  } else {
    // Response already has CTA, return as-is
    return originalResponse
  }
  
  // Get variant-specific CTA based on role and response type
  let variantCTA = ''
  
  if (role === 'SALES') {
    const salesVariant = roleVariants as typeof SALES_VARIANT_A
    if (responseType === 'pricing') {
      variantCTA = salesVariant.pricing.cta
    } else if (responseType === 'overview') {
      variantCTA = salesVariant.overview.cta
    } else if (responseType === 'greeting') {
      variantCTA = salesVariant.greeting.cta
    }
  } else if (role === 'SUPPORT') {
    const supportVariant = roleVariants as typeof SUPPORT_VARIANT_A
    if (responseType === 'pricing') {
      variantCTA = supportVariant.pricing.cta
    } else if (responseType === 'overview') {
      variantCTA = supportVariant.overview.cta
    } else if (responseType === 'greeting') {
      variantCTA = supportVariant.greeting.cta
    }
  } else if (role === 'OPS') {
    // OPS always redirects - use redirect message
    const opsVariant = roleVariants as typeof OPS_VARIANT_A
    return `${opsVariant.redirect.message}\n\n${opsVariant.redirect.contactInfo}\n\n${opsVariant.redirect.closing}`
  }
  
  // Append variant CTA
  return variantCTA ? `${cleanedResponse}\n\n${variantCTA}`.trim() : cleanedResponse
}

// ============================================================================
// METRICS & TRACKING
// ============================================================================

export interface RoleABTestMetric {
  id: string
  timestamp: string
  userId: string
  sessionId: string
  role: AIRole
  variant: Variant
  responseType: ResponseType
  intent: string
  persona: Persona
  // Intent and persona MUST be identical across variants
  // Only wording differs
}

export interface RoleABTestContactEvent {
  id: string
  timestamp: string
  userId: string
  sessionId: string
  role: AIRole
  variant: Variant
  responseType: ResponseType
  intent: string
  persona: Persona
  method: 'phone' | 'email' | 'click'
  timeToContact: number // Seconds from response to contact
}

export interface RoleABTestConversationEvent {
  id: string
  timestamp: string
  userId: string
  sessionId: string
  role: AIRole
  variant: Variant
  responseType: ResponseType
  intent: string
  persona: Persona
  event: 'message_sent' | 'conversation_ended' | 'human_requested'
  messageCount: number
  timeToEvent: number // Seconds from response to event
}

export interface RoleABTestResult {
  role: AIRole
  responseType: ResponseType
  variant: Variant
  totalResponses: number
  contactRate: number // % of users who contacted
  continuationRate: number // % of users who sent another message
  avgTimeToContact: number // Average seconds until contact
  avgTimeToHumanHandoff: number // Average seconds until human requested
  avgMessageCount: number // Average messages per conversation
  conversionRate: number // % of conversations leading to contact or handoff
}

// ============================================================================
// METRICS CALCULATION
// ============================================================================

/**
 * Calculate contact rate for a role/variant combination
 */
export function calculateRoleContactRate(
  metrics: RoleABTestMetric[],
  contacts: RoleABTestContactEvent[],
  role: AIRole,
  variant: Variant,
  responseType: ResponseType
): number {
  const variantMetrics = metrics.filter(
    m => m.role === role && m.variant === variant && m.responseType === responseType
  )
  
  if (variantMetrics.length === 0) return 0
  
  const uniqueUsers = new Set(variantMetrics.map(m => m.userId))
  const contactedUsers = new Set(
    contacts
      .filter(c => c.role === role && c.variant === variant && c.responseType === responseType)
      .map(c => c.userId)
  )
  
  return (contactedUsers.size / uniqueUsers.size) * 100
}

/**
 * Calculate conversation continuation rate
 */
export function calculateRoleContinuationRate(
  metrics: RoleABTestMetric[],
  conversations: RoleABTestConversationEvent[],
  role: AIRole,
  variant: Variant,
  responseType: ResponseType
): number {
  const variantMetrics = metrics.filter(
    m => m.role === role && m.variant === variant && m.responseType === responseType
  )
  
  if (variantMetrics.length === 0) return 0
  
  const uniqueUsers = new Set(variantMetrics.map(m => m.userId))
  const continuedUsers = new Set(
    conversations
      .filter(c => c.role === role && c.variant === variant && c.responseType === responseType && c.event === 'message_sent')
      .map(c => c.userId)
  )
  
  return (continuedUsers.size / uniqueUsers.size) * 100
}

/**
 * Calculate average time to contact
 */
export function calculateRoleAvgTimeToContact(
  contacts: RoleABTestContactEvent[],
  role: AIRole,
  variant: Variant,
  responseType: ResponseType
): number {
  const variantContacts = contacts.filter(
    c => c.role === role && c.variant === variant && c.responseType === responseType
  )
  
  if (variantContacts.length === 0) return 0
  
  const times = variantContacts.map(c => c.timeToContact)
  return times.reduce((a, b) => a + b, 0) / times.length
}

/**
 * Calculate average time to human handoff
 */
export function calculateRoleAvgTimeToHandoff(
  conversations: RoleABTestConversationEvent[],
  role: AIRole,
  variant: Variant,
  responseType: ResponseType
): number {
  const handoffs = conversations.filter(
    c => c.role === role && 
         c.variant === variant && 
         c.responseType === responseType &&
         c.event === 'human_requested'
  )
  
  if (handoffs.length === 0) return 0
  
  const times = handoffs.map(c => c.timeToEvent)
  return times.reduce((a, b) => a + b, 0) / times.length
}

/**
 * Calculate conversion rate (contact or handoff)
 */
export function calculateRoleConversionRate(
  metrics: RoleABTestMetric[],
  contacts: RoleABTestContactEvent[],
  conversations: RoleABTestConversationEvent[],
  role: AIRole,
  variant: Variant,
  responseType: ResponseType
): number {
  const variantMetrics = metrics.filter(
    m => m.role === role && m.variant === variant && m.responseType === responseType
  )
  
  if (variantMetrics.length === 0) return 0
  
  const uniqueUsers = new Set(variantMetrics.map(m => m.userId))
  
  const convertedUsers = new Set([
    ...contacts
      .filter(c => c.role === role && c.variant === variant && c.responseType === responseType)
      .map(c => c.userId),
    ...conversations
      .filter(c => c.role === role && c.variant === variant && c.responseType === responseType && c.event === 'human_requested')
      .map(c => c.userId)
  ])
  
  return (convertedUsers.size / uniqueUsers.size) * 100
}

/**
 * Generate comprehensive role-based AB test results
 */
export function generateRoleABTestResults(
  metrics: RoleABTestMetric[],
  contacts: RoleABTestContactEvent[],
  conversations: RoleABTestConversationEvent[],
  role: AIRole,
  responseType: ResponseType
): { variantA: RoleABTestResult; variantB: RoleABTestResult } {
  const variantA: RoleABTestResult = {
    role,
    responseType,
    variant: 'A',
    totalResponses: metrics.filter(m => m.role === role && m.variant === 'A' && m.responseType === responseType).length,
    contactRate: calculateRoleContactRate(metrics, contacts, role, 'A', responseType),
    continuationRate: calculateRoleContinuationRate(metrics, conversations, role, 'A', responseType),
    avgTimeToContact: calculateRoleAvgTimeToContact(contacts, role, 'A', responseType),
    avgTimeToHumanHandoff: calculateRoleAvgTimeToHandoff(conversations, role, 'A', responseType),
    avgMessageCount: conversations
      .filter(c => c.role === role && c.variant === 'A' && c.responseType === responseType)
      .reduce((sum, c) => sum + c.messageCount, 0) / 
      Math.max(1, conversations.filter(c => c.role === role && c.variant === 'A' && c.responseType === responseType).length),
    conversionRate: calculateRoleConversionRate(metrics, contacts, conversations, role, 'A', responseType),
  }
  
  const variantB: RoleABTestResult = {
    role,
    responseType,
    variant: 'B',
    totalResponses: metrics.filter(m => m.role === role && m.variant === 'B' && m.responseType === responseType).length,
    contactRate: calculateRoleContactRate(metrics, contacts, role, 'B', responseType),
    continuationRate: calculateRoleContinuationRate(metrics, conversations, role, 'B', responseType),
    avgTimeToContact: calculateRoleAvgTimeToContact(contacts, role, 'B', responseType),
    avgTimeToHumanHandoff: calculateRoleAvgTimeToHandoff(conversations, role, 'B', responseType),
    avgMessageCount: conversations
      .filter(c => c.role === role && c.variant === 'B' && c.responseType === responseType)
      .reduce((sum, c) => sum + c.messageCount, 0) / 
      Math.max(1, conversations.filter(c => c.role === role && c.variant === 'B' && c.responseType === responseType).length),
    conversionRate: calculateRoleConversionRate(metrics, contacts, conversations, role, 'B', responseType),
  }
  
  return { variantA, variantB }
}

// ============================================================================
// STATISTICAL EVALUATION
// ============================================================================

/**
 * Calculate statistical significance using chi-square test
 */
export function calculateRoleStatisticalSignificance(
  variantA: RoleABTestResult,
  variantB: RoleABTestResult,
  metric: 'contactRate' | 'continuationRate' | 'conversionRate'
): { pValue: number; isSignificant: boolean; winner: Variant | null; lift: number } {
  const aValue = variantA[metric]
  const bValue = variantB[metric]
  const aTotal = variantA.totalResponses
  const bTotal = variantB.totalResponses
  
  if (aTotal === 0 || bTotal === 0) {
    return { pValue: 1, isSignificant: false, winner: null, lift: 0 }
  }
  
  // Chi-square calculation
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
  const pValue = chiSquare > 3.84 ? 0.05 : 0.5 // Simplified
  const isSignificant = pValue < 0.05
  
  const winner = isSignificant 
    ? (aValue > bValue ? 'A' : 'B')
    : null
  
  // Calculate lift (% improvement)
  const lift = aValue > 0 
    ? ((bValue - aValue) / aValue) * 100 
    : (bValue > 0 ? 100 : 0)
  
  return { pValue, isSignificant, winner, lift }
}

// ============================================================================
// RESULT FORMATTING
// ============================================================================

export function formatRoleABTestResults(
  results: { variantA: RoleABTestResult; variantB: RoleABTestResult },
  role: AIRole,
  responseType: ResponseType
): string {
  const { variantA, variantB } = results
  const significance = calculateRoleStatisticalSignificance(variantA, variantB, 'contactRate')
  
  let output = `\n${'='.repeat(70)}\n`
  output += `ROLE-BASED A/B TEST RESULTS - ${role} / ${responseType.toUpperCase()}\n`
  output += `${'='.repeat(70)}\n\n`
  
  output += `Variant A (Baseline):\n`
  output += `  Total Responses: ${variantA.totalResponses}\n`
  output += `  Contact Rate: ${variantA.contactRate.toFixed(2)}%\n`
  output += `  Continuation Rate: ${variantA.continuationRate.toFixed(2)}%\n`
  output += `  Conversion Rate: ${variantA.conversionRate.toFixed(2)}%\n`
  output += `  Avg Time to Contact: ${variantA.avgTimeToContact.toFixed(0)}s\n`
  output += `  Avg Time to Handoff: ${variantA.avgTimeToHumanHandoff.toFixed(0)}s\n`
  output += `  Avg Message Count: ${variantA.avgMessageCount.toFixed(1)}\n\n`
  
  output += `Variant B (Alternative):\n`
  output += `  Total Responses: ${variantB.totalResponses}\n`
  output += `  Contact Rate: ${variantB.contactRate.toFixed(2)}%\n`
  output += `  Continuation Rate: ${variantB.continuationRate.toFixed(2)}%\n`
  output += `  Conversion Rate: ${variantB.conversionRate.toFixed(2)}%\n`
  output += `  Avg Time to Contact: ${variantB.avgTimeToContact.toFixed(0)}s\n`
  output += `  Avg Time to Handoff: ${variantB.avgTimeToHumanHandoff.toFixed(0)}s\n`
  output += `  Avg Message Count: ${variantB.avgMessageCount.toFixed(1)}\n\n`
  
  output += `Statistical Significance:\n`
  output += `  p-value: ${significance.pValue.toFixed(4)}\n`
  output += `  Significant: ${significance.isSignificant ? 'Yes' : 'No'}\n`
  if (significance.winner) {
    output += `  Winner: Variant ${significance.winner}\n`
    output += `  Lift: ${significance.lift.toFixed(2)}%\n`
  }
  
  output += `\nNote: Intent and Persona are IDENTICAL across variants.\n`
  output += `Only wording (CTA, emphasis) differs.\n`
  output += `${'='.repeat(70)}\n`
  
  return output
}
