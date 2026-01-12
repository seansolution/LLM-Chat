/**
 * Agent Assist System
 * 
 * Provides sales agents with conversation summaries, persona identification,
 * buying intent detection, and next best action suggestions to avoid
 * repeating questions to customers.
 */

import type { Persona, Intent } from './chat-log-schema'
import type { HandoffReason } from './handoff'

// ============================================================================
// DATA SCHEMA
// ============================================================================

export type BuyingIntent = 
  | 'ready_to_buy'      // Customer is ready to purchase
  | 'price_comparison'  // Comparing prices/options
  | 'information_seeking' // Gathering information
  | 'problem_solving'   // Has a specific problem to solve
  | 'exploring'         // Just exploring options
  | 'urgent'            // Needs immediate solution
  | 'unknown'           // Cannot determine

export type UrgencyLevel = 'high' | 'medium' | 'low' | 'unknown'

export interface ConversationSummary {
  // Core Summary
  summary: string // 1-2 sentence summary of conversation
  keyPoints: string[] // Key points discussed (max 5)
  
  // Customer Context
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  customerCompany?: string
  
  // Intent & Persona
  persona: Persona
  primaryIntent: Intent
  buyingIntent: BuyingIntent
  urgencyLevel: UrgencyLevel
  
  // Conversation Context
  messageCount: number
  conversationDuration: number // Seconds
  topicsDiscussed: string[] // Topics mentioned
  questionsAsked: string[] // Questions customer asked
  pricesMentioned: string[] // Prices mentioned in conversation
  
  // Handoff Context
  handoffReason: HandoffReason
  handoffTimestamp: string // ISO 8601
  
  // What NOT to Ask (to avoid repetition)
  alreadyAnswered: {
    pricing: boolean // Price already discussed
    timeline: boolean // Timeline already discussed
    requirements: boolean // Requirements already discussed
    contactInfo: boolean // Contact info already shared
    serviceDetails: boolean // Service details already explained
  }
  
  // Next Best Action
  suggestedAction: SuggestedAction
  suggestedScript?: string // Suggested opening script for agent
  
  // Additional Context
  metadata?: {
    sessionId: string
    conversationId: string
    firstMessage?: string
    lastMessage?: string
    [key: string]: unknown
  }
}

export interface SuggestedAction {
  type: 'call' | 'email' | 'schedule' | 'send_proposal' | 'follow_up' | 'qualify' | 'close'
  priority: 'high' | 'medium' | 'low'
  reason: string // Why this action is suggested
  estimatedValue?: number // Estimated deal value in THB
  timeline?: string // Suggested timeline (e.g., "within 24 hours")
}

// ============================================================================
// SUMMARY GENERATION
// ============================================================================

/**
 * Generate conversation summary from chat logs
 */
export function generateConversationSummary(
  chatLogs: Array<{
    id: string
    sessionId: string
    timestamp: string
    userMessage: string
    aiResponse: string
    intent: { detected: Intent }
    persona: { detected: Persona }
    responseType: string
    pricing?: {
      questionType: string
      containsPrice: boolean
      priceValue?: string
    }
    handoff?: {
      reason: HandoffReason
      requestedAt?: string
    }
    metadata?: {
      userEmail?: string
      userPhone?: string
      userCompany?: string
    }
  }>
): ConversationSummary {
  if (chatLogs.length === 0) {
    throw new Error('Cannot generate summary from empty conversation')
  }

  // Sort by timestamp
  const sortedLogs = [...chatLogs].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  )

  const firstLog = sortedLogs[0]
  const lastLog = sortedLogs[sortedLogs.length - 1]
  const handoffLog = sortedLogs.find(log => log.handoff?.reason && log.handoff.reason !== 'none')

  // Calculate duration
  const startTime = new Date(firstLog.timestamp).getTime()
  const endTime = new Date(lastLog.timestamp).getTime()
  const duration = Math.floor((endTime - startTime) / 1000)

  // Extract customer info
  const customerEmail = firstLog.metadata?.userEmail || lastLog.metadata?.userEmail
  const customerPhone = firstLog.metadata?.userPhone || lastLog.metadata?.userPhone
  const customerCompany = firstLog.metadata?.userCompany || lastLog.metadata?.userCompany

  // Determine primary persona (most common)
  const personaCounts = new Map<Persona, number>()
  sortedLogs.forEach(log => {
    const persona = log.persona.detected
    personaCounts.set(persona, (personaCounts.get(persona) || 0) + 1)
  })
  const primaryPersona = Array.from(personaCounts.entries())
    .sort((a, b) => b[1] - a[1])[0][0]

  // Determine primary intent (first pricing/overview, or most common)
  const pricingOrOverviewLog = sortedLogs.find(
    log => log.responseType === 'pricing' || log.responseType === 'overview'
  )
  const primaryIntent = pricingOrOverviewLog
    ? pricingOrOverviewLog.intent.detected
    : sortedLogs[0].intent.detected

  // Extract topics, questions, prices
  const topicsDiscussed = extractTopics(sortedLogs)
  const questionsAsked = extractQuestions(sortedLogs)
  const pricesMentioned = extractPrices(sortedLogs)

  // Generate summary (1-2 sentences)
  const summary = generateSummaryText(sortedLogs, primaryPersona, primaryIntent)

  // Extract key points (max 5)
  const keyPoints = extractKeyPoints(sortedLogs, topicsDiscussed, questionsAsked)

  // Determine buying intent
  const buyingIntent = detectBuyingIntent(sortedLogs, questionsAsked, pricesMentioned)

  // Determine urgency
  const urgencyLevel = detectUrgency(sortedLogs, buyingIntent)

  // Determine what's already been answered
  const alreadyAnswered = determineAlreadyAnswered(sortedLogs, pricesMentioned)

  // Determine handoff reason
  const handoffReason = handoffLog?.handoff?.reason || 'none'
  const handoffTimestamp = handoffLog?.handoff?.requestedAt || lastLog.timestamp

  // Generate suggested action
  const suggestedAction = generateSuggestedAction(
    primaryPersona,
    primaryIntent,
    buyingIntent,
    urgencyLevel,
    alreadyAnswered,
    pricesMentioned
  )

  // Generate suggested script
  const customerName = customerEmail?.split('@')[0] || undefined
  const suggestedScript = generateSuggestedScript(
    primaryPersona,
    buyingIntent,
    alreadyAnswered,
    customerName
  )

  return {
    summary,
    keyPoints,
    customerName: customerEmail?.split('@')[0] || undefined,
    customerEmail,
    customerPhone,
    customerCompany,
    persona: primaryPersona,
    primaryIntent,
    buyingIntent,
    urgencyLevel,
    messageCount: sortedLogs.length,
    conversationDuration: duration,
    topicsDiscussed,
    questionsAsked,
    pricesMentioned,
    handoffReason,
    handoffTimestamp,
    alreadyAnswered,
    suggestedAction,
    suggestedScript,
    metadata: {
      sessionId: firstLog.sessionId,
      conversationId: firstLog.id,
      firstMessage: firstLog.userMessage,
      lastMessage: lastLog.userMessage,
    },
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateSummaryText(
  logs: typeof chatLogs,
  persona: Persona,
  intent: Intent
): string {
  const firstMessage = logs[0].userMessage
  const lastMessage = logs[logs.length - 1].userMessage
  const hasPricing = logs.some(log => log.pricing?.containsPrice || log.responseType === 'pricing')
  const messageCount = logs.length

  // Persona-specific summary
  const personaLabels: Record<Persona, string> = {
    REGISTRATION: 'การจดทะเบียนบริษัท',
    ACCOUNTING: 'บริการบัญชีและภาษี',
    HR: 'บริการ HR และเงินเดือน',
  }

  const personaLabel = personaLabels[persona]

  // Build summary
  let summary = `ลูกค้าสนใจ${personaLabel}`
  
  if (hasPricing) {
    summary += ` และได้สอบถามราคาแล้ว`
  }
  
  if (messageCount > 1) {
    summary += ` มีการสนทนา ${messageCount} ข้อความ`
  }
  
  // Add last message context if relevant
  if (lastMessage.length < 100 && lastMessage !== firstMessage) {
    const lastMessageSummary = lastMessage.length > 50 
      ? lastMessage.substring(0, 50) + '...'
      : lastMessage
    summary += ` คำถามล่าสุด: "${lastMessageSummary}"`
  }

  return summary
}

function extractTopics(logs: typeof chatLogs): string[] {
  const topics = new Set<string>()
  
  const topicKeywords: Record<string, string[]> = {
    'จดทะเบียนบริษัท': ['จดทะเบียน', 'เปิดบริษัท', 'บจก', 'บริษัทจำกัด'],
    'บัญชี': ['บัญชี', 'ทำบัญชี', 'งบการเงิน'],
    'ภาษี': ['ภาษี', 'ยื่นภาษี', 'vat', 'หัก ณ ที่จ่าย'],
    'HR': ['hr', 'พนักงาน', 'เงินเดือน', 'สลิป', 'ประกันสังคม'],
    'วีซ่า': ['วีซ่า', 'work permit', 'ใบอนุญาตทำงาน'],
    'ราคา': ['ราคา', 'ค่าใช้จ่าย', 'กี่บาท', 'เท่าไหร่'],
    'ระยะเวลา': ['ใช้เวลา', 'นานเท่าไหร่', 'กี่วัน', 'กี่สัปดาห์'],
  }

  logs.forEach(log => {
    const text = (log.userMessage + ' ' + log.aiResponse).toLowerCase()
    Object.entries(topicKeywords).forEach(([topic, keywords]) => {
      if (keywords.some(keyword => text.includes(keyword))) {
        topics.add(topic)
      }
    })
  })

  return Array.from(topics).slice(0, 5)
}

function extractQuestions(logs: typeof chatLogs): string[] {
  const questions: string[] = []
  
  logs.forEach(log => {
    // Extract questions (Thai question words)
    const questionPatterns = [
      /(.+?)(?:หรือ|ไหม|หรือไม่|อย่างไร|เท่าไหร่|กี่บาท|กี่วัน|กี่สัปดาห์|กี่เดือน)\s*[?？]?/i,
      /(.+?)(?:คืออะไร|คือ|หมายถึง|คืออย่างไร)/i,
    ]
    
    questionPatterns.forEach(pattern => {
      const match = log.userMessage.match(pattern)
      if (match && match[1]) {
        const question = match[1].trim()
        if (question.length > 10 && question.length < 100) {
          questions.push(question)
        }
      }
    })
  })

  return questions.slice(0, 5)
}

function extractPrices(logs: typeof chatLogs): string[] {
  const prices: string[] = []
  
  logs.forEach(log => {
    if (log.pricing?.priceValue) {
      prices.push(log.pricing.priceValue)
    }
    
    // Extract prices from text
    const pricePattern = /(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*(?:บาท|THB|baht)/gi
    const text = log.userMessage + ' ' + log.aiResponse
    const matches = text.matchAll(pricePattern)
    
    for (const match of matches) {
      if (match[1]) {
        prices.push(`${match[1]} บาท`)
      }
    }
  })

  return Array.from(new Set(prices)).slice(0, 5)
}

function extractKeyPoints(
  logs: typeof chatLogs,
  topics: string[],
  questions: string[]
): string[] {
  const keyPoints: string[] = []
  
  // Add primary topic
  if (topics.length > 0) {
    keyPoints.push(`สนใจ${topics[0]}`)
  }
  
  // Add pricing if mentioned
  const hasPricing = logs.some(log => log.pricing?.containsPrice || log.responseType === 'pricing')
  if (hasPricing) {
    keyPoints.push('สอบถามราคาแล้ว')
  }
  
  // Add first question if relevant
  if (questions.length > 0 && questions[0].length < 60) {
    keyPoints.push(`ถาม: ${questions[0]}`)
  }
  
  // Add handoff reason if applicable
  const handoffLog = logs.find(log => log.handoff?.reason && log.handoff.reason !== 'none')
  if (handoffLog) {
    const reasonLabels: Record<HandoffReason, string> = {
      user_requested: 'ลูกค้าขอคุยกับเจ้าหน้าที่',
      legal_inquiry: 'คำถามเชิงกฎหมาย',
      low_confidence: 'คำถามซับซ้อน',
      long_conversation: 'สนทนายาว',
      complex_question: 'คำถามซับซ้อน',
      technical_issue: 'ปัญหาทางเทคนิค',
      pricing_negotiation: 'เจรจาราคา',
      none: '',
    }
    const label = reasonLabels[handoffLog.handoff!.reason]
    if (label) {
      keyPoints.push(label)
    }
  }

  return keyPoints.slice(0, 5)
}

function detectBuyingIntent(
  logs: typeof chatLogs,
  questions: string[],
  prices: string[]
): BuyingIntent {
  const allText = logs.map(log => log.userMessage + ' ' + log.aiResponse).join(' ').toLowerCase()
  
  // Ready to buy signals
  const readyToBuySignals = [
    'พร้อม', 'ต้องการ', 'อยากเริ่ม', 'เริ่มได้เลย', 'เมื่อไหร่เริ่มได้',
    'ready', 'want to start', 'when can we start',
  ]
  if (readyToBuySignals.some(signal => allText.includes(signal))) {
    return 'ready_to_buy'
  }

  // Urgent signals
  const urgentSignals = [
    'ด่วน', 'เร่ง', 'เร็วที่สุด', 'เร็วๆ', 'ทันที', 'asap', 'urgent', 'immediately',
  ]
  if (urgentSignals.some(signal => allText.includes(signal))) {
    return 'urgent'
  }

  // Price comparison signals
  if (prices.length >= 2 || allText.includes('เปรียบเทียบ') || allText.includes('compare')) {
    return 'price_comparison'
  }

  // Problem solving signals
  const problemSignals = [
    'ปัญหา', 'ต้องการแก้', 'มีปัญหา', 'ไม่ทราบ', 'ไม่รู้', 'problem', 'issue', 'need help',
  ]
  if (problemSignals.some(signal => allText.includes(signal))) {
    return 'problem_solving'
  }

  // Information seeking (has pricing question)
  if (logs.some(log => log.responseType === 'pricing' || log.pricing?.questionType === 'explicit')) {
    return 'information_seeking'
  }

  // Exploring (just browsing)
  if (logs.length === 1 && logs[0].responseType === 'overview') {
    return 'exploring'
  }

  return 'unknown'
}

function detectUrgency(
  logs: typeof chatLogs,
  buyingIntent: BuyingIntent
): UrgencyLevel {
  if (buyingIntent === 'urgent') {
    return 'high'
  }

  if (buyingIntent === 'ready_to_buy') {
    return 'high'
  }

  const allText = logs.map(log => log.userMessage).join(' ').toLowerCase()
  const urgentKeywords = ['ด่วน', 'เร่ง', 'เร็ว', 'urgent', 'asap']
  
  if (urgentKeywords.some(keyword => allText.includes(keyword))) {
    return 'high'
  }

  if (buyingIntent === 'price_comparison' || buyingIntent === 'problem_solving') {
    return 'medium'
  }

  if (buyingIntent === 'exploring') {
    return 'low'
  }

  return 'unknown'
}

function determineAlreadyAnswered(
  logs: typeof chatLogs,
  prices: string[]
): ConversationSummary['alreadyAnswered'] {
  const allText = logs.map(log => log.aiResponse).join(' ').toLowerCase()
  
  return {
    pricing: prices.length > 0 || logs.some(log => log.pricing?.containsPrice),
    timeline: /(?:ใช้เวลา|ระยะเวลา|ประมาณ|ประมาณ|within|within|days|weeks|months)/i.test(allText),
    requirements: /(?:ต้อง|ต้องการ|requirement|document|เอกสาร)/i.test(allText),
    contactInfo: /(?:086-398-6889|zanhcpe@gmail.com|ติดต่อ|โทร|อีเมล)/i.test(allText),
    serviceDetails: logs.some(log => log.responseType === 'overview' || log.responseType === 'pricing'),
  }
}

function generateSuggestedAction(
  persona: Persona,
  intent: Intent,
  buyingIntent: BuyingIntent,
  urgency: UrgencyLevel,
  alreadyAnswered: ConversationSummary['alreadyAnswered'],
  prices: string[]
): SuggestedAction {
  // High urgency + ready to buy = call immediately
  if (urgency === 'high' && buyingIntent === 'ready_to_buy') {
    return {
      type: 'call',
      priority: 'high',
      reason: 'ลูกค้าพร้อมซื้อและมีความเร่งด่วน',
      timeline: 'ภายใน 1 ชั่วโมง',
      estimatedValue: estimateDealValue(persona, prices),
    }
  }

  // Price comparison = send proposal
  if (buyingIntent === 'price_comparison' && prices.length > 0) {
    return {
      type: 'send_proposal',
      priority: 'high',
      reason: 'ลูกค้ากำลังเปรียบเทียบราคา ควรส่ง proposal เร็ว',
      timeline: 'ภายใน 24 ชั่วโมง',
      estimatedValue: estimateDealValue(persona, prices),
    }
  }

  // Urgent = call
  if (urgency === 'high') {
    return {
      type: 'call',
      priority: 'high',
      reason: 'ลูกค้ามีความเร่งด่วน',
      timeline: 'ภายใน 2 ชั่วโมง',
      estimatedValue: estimateDealValue(persona, prices),
    }
  }

  // Information seeking = email with details
  if (buyingIntent === 'information_seeking' && !alreadyAnswered.serviceDetails) {
    return {
      type: 'email',
      priority: 'medium',
      reason: 'ลูกค้ากำลังหาข้อมูล ควรส่งรายละเอียดเพิ่มเติม',
      timeline: 'ภายใน 24 ชั่วโมง',
    }
  }

  // Problem solving = qualify first
  if (buyingIntent === 'problem_solving') {
    return {
      type: 'qualify',
      priority: 'medium',
      reason: 'ลูกค้ามีปัญหาเฉพาะ ควรสอบถามรายละเอียดเพิ่มเติม',
      timeline: 'ภายใน 48 ชั่วโมง',
    }
  }

  // Default = follow up
  return {
    type: 'follow_up',
    priority: 'low',
    reason: 'ติดตามผลการสนทนา',
    timeline: 'ภายใน 3 วัน',
  }
}

function estimateDealValue(persona: Persona, prices: string[]): number | undefined {
  if (prices.length === 0) {
    return undefined
  }

  // Extract numeric value from first price
  const priceText = prices[0]
  const match = priceText.match(/(\d{1,3}(?:,\d{3})*(?:\.\d+)?)/)
  if (match) {
    const value = parseFloat(match[1].replace(/,/g, ''))
    
    // Estimate annual value for monthly services
    if (persona === 'ACCOUNTING' || persona === 'HR') {
      return value * 12 // Monthly to annual
    }
    
    return value
  }

  return undefined
}

function generateSuggestedScript(
  persona: Persona,
  buyingIntent: BuyingIntent,
  alreadyAnswered: ConversationSummary['alreadyAnswered'],
  customerName?: string
): string {
  const greeting = customerName 
    ? `สวัสดีคุณ${customerName}`
    : 'สวัสดีค่ะ'

  const personaLabels: Record<Persona, string> = {
    REGISTRATION: 'การจดทะเบียนบริษัท',
    ACCOUNTING: 'บริการบัญชีและภาษี',
    HR: 'บริการ HR และเงินเดือน',
  }

  const personaLabel = personaLabels[persona]

  let script = `${greeting} ฉันเป็นเจ้าหน้าที่จากบริษัท แสน โซลูชั่น จำกัด\n\n`
  script += `เห็นว่าคุณสนใจ${personaLabel} และได้คุยกับแอดมินไปแล้ว\n\n`

  // Avoid repeating what's already answered
  if (alreadyAnswered.pricing) {
    script += `เข้าใจว่าคุณได้ทราบราคาแล้ว `
  }
  if (alreadyAnswered.timeline) {
    script += `และทราบระยะเวลาแล้ว `
  }

  // Buying intent specific script
  if (buyingIntent === 'ready_to_buy') {
    script += `\n\nคุณพร้อมที่จะเริ่มได้เลยไหมคะ? เราสามารถช่วยคุณได้ทันทีค่ะ`
  } else if (buyingIntent === 'price_comparison') {
    script += `\n\nมีคำถามเพิ่มเติมเกี่ยวกับแพ็กเกจหรือราคาไหมคะ?`
  } else if (buyingIntent === 'problem_solving') {
    script += `\n\nมีปัญหาหรือคำถามเฉพาะที่ต้องการความช่วยเหลือเพิ่มเติมไหมคะ?`
  } else {
    script += `\n\nมีอะไรให้ช่วยเพิ่มเติมไหมคะ?`
  }

  return script
}

// ============================================================================
// AGENT-FACING OUTPUT FORMAT
// ============================================================================

export interface AgentAssistOutput {
  // Header
  handoffId: string
  timestamp: string
  priority: 'high' | 'medium' | 'low'
  
  // Quick Summary (for dashboard)
  quickSummary: {
    customer: string // Name or email
    persona: Persona
    intent: string // Human-readable intent
    buyingIntent: BuyingIntent
    urgency: UrgencyLevel
  }
  
  // Full Summary
  summary: ConversationSummary
  
  // Action Card (prominent display)
  actionCard: {
    suggestedAction: SuggestedAction
    suggestedScript: string
    doNotAsk: string[] // Things NOT to ask
  }
  
  // Conversation History (collapsible)
  conversationHistory: Array<{
    timestamp: string
    userMessage: string
    aiResponse: string
    intent: Intent
  }>
}

/**
 * Format summary for agent-facing display
 */
export function formatAgentAssistOutput(
  summary: ConversationSummary,
  conversationHistory: Array<{
    timestamp: string
    userMessage: string
    aiResponse: string
    intent: { detected: Intent }
  }>
): AgentAssistOutput {
  const doNotAsk: string[] = []
  
  if (summary.alreadyAnswered.pricing) {
    doNotAsk.push('❌ อย่าถามราคา (ลูกค้าทราบแล้ว)')
  }
  if (summary.alreadyAnswered.timeline) {
    doNotAsk.push('❌ อย่าถามระยะเวลา (ลูกค้าทราบแล้ว)')
  }
  if (summary.alreadyAnswered.requirements) {
    doNotAsk.push('❌ อย่าถามเอกสารที่ต้องใช้ (ลูกค้าทราบแล้ว)')
  }
  if (summary.alreadyAnswered.contactInfo) {
    doNotAsk.push('❌ อย่าให้ข้อมูลติดต่อซ้ำ (ลูกค้ามีแล้ว)')
  }

  const intentLabels: Record<Intent, string> = {
    company_registration_pricing: 'สอบถามราคาจดทะเบียนบริษัท',
    company_registration_overview: 'สอบถามข้อมูลจดทะเบียนบริษัท',
    accounting_pricing: 'สอบถามราคาบริการบัญชี',
    accounting_overview: 'สอบถามข้อมูลบริการบัญชี',
    hr_pricing: 'สอบถามราคาบริการ HR',
    hr_overview: 'สอบถามข้อมูลบริการ HR',
    work_permit_overview: 'สอบถามข้อมูลวีซ่า',
    company_overview: 'สอบถามข้อมูลบริษัท',
    greeting: 'ทักทาย',
    pricing_generic: 'สอบถามราคา',
    restricted_legal: 'คำถามเชิงกฎหมาย',
    unknown: 'ไม่ทราบ',
  }

  return {
    handoffId: summary.metadata?.conversationId || 'unknown',
    timestamp: summary.handoffTimestamp,
    priority: summary.suggestedAction.priority,
    quickSummary: {
      customer: summary.customerName || summary.customerEmail || 'ไม่ระบุ',
      persona: summary.persona,
      intent: intentLabels[summary.primaryIntent] || summary.primaryIntent,
      buyingIntent: summary.buyingIntent,
      urgency: summary.urgencyLevel,
    },
    summary,
    actionCard: {
      suggestedAction: summary.suggestedAction,
      suggestedScript: summary.suggestedScript || '',
      doNotAsk,
    },
    conversationHistory: conversationHistory.map(log => ({
      timestamp: log.timestamp,
      userMessage: log.userMessage,
      aiResponse: log.aiResponse,
      intent: log.intent.detected,
    })),
  }
}
