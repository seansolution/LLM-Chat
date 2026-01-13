/**
 * Canonical Chat Log Schema
 * 
 * JSON-based schema for analytics, testing, and monitoring.
 * All fields are deterministic (enums, fixed values) - no free text flags.
 */

// ============================================================================
// ENUMS & TYPES (Deterministic)
// ============================================================================

export type Persona = 'REGISTRATION' | 'ACCOUNTING' | 'HR'

export type Intent =
  | 'company_registration_pricing'
  | 'company_registration_overview'
  | 'accounting_pricing'
  | 'accounting_overview'
  | 'hr_pricing'
  | 'hr_overview'
  | 'work_permit_overview'
  | 'company_overview'
  | 'greeting'
  | 'pricing_generic'
  | 'restricted_legal'
  | 'unknown'

export type ResponseType = 'greeting' | 'overview' | 'pricing' | 'restricted' | 'unknown'

export type PricingQuestionType = 'explicit' | 'implicit' | 'none'

export type SafetyViolationType =
  | 'legal_explanation'
  | 'tax_calculation'
  | 'hallucinated_url'
  | 'placeholder_text'
  | 'ai_claim'
  | 'missing_contact_info'
  | 'too_long'
  | 'none'

export type HandoffReason =
  | 'user_requested'
  | 'complex_question'
  | 'legal_inquiry'
  | 'technical_issue'
  | 'pricing_negotiation'
  | 'none'

export type HandoffStatus = 'none' | 'requested' | 'completed' | 'declined'

export type ABTestVariant = 'A' | 'B' | 'none'

export type ContactMethod = 'phone' | 'email' | 'click' | 'none'

export type KnowledgeSource = 'company.md' | 'services.md' | 'th/packages-and-pricing.md' | 'th/company-registration.md' | 'th/accounting.md' | 'th/hr.md' | 'none'

// ============================================================================
// CANONICAL SCHEMA
// ============================================================================

export interface ChatLogSchema {
  // ===== METADATA =====
  id: string // Unique log ID (UUID or deterministic hash)
  timestamp: string // ISO 8601 timestamp
  sessionId: string // Session identifier
  userId?: string // Optional user identifier (if authenticated)
  
  // ===== INTENT & PERSONA =====
  intent: {
    detected: Intent // Detected intent
    confidence?: number // 0-1 confidence score (optional)
    keywords?: string[] // Keywords that triggered intent (optional)
  }
  persona: {
    detected: Persona // Detected persona
    source: 'explicit' | 'detected' | 'default' // How persona was determined
  }
  responseType: ResponseType // Type of response generated
  
  // ===== CONTEXT =====
  userMessage: string // Original user message
  aiResponse: string // AI-generated response
  knowledgeSources: KnowledgeSource[] // Which knowledge files were loaded
  knowledgeLength?: number // Total characters of knowledge used
  systemPromptLength?: number // Total characters of system prompt
  
  // ===== PRICING =====
  pricing: {
    questionType: PricingQuestionType // Was this a pricing question?
    containsPrice: boolean // Does response contain a price?
    priceValue?: string // Extracted price value (e.g., "25,000 บาท")
    priceType?: 'one_time' | 'monthly' | 'both' | 'unknown' // Price type if detected
    timeline?: string // Estimated timeline if mentioned
  }
  
  // ===== SAFETY =====
  safety: {
    violations: SafetyViolationType[] // List of detected violations
    violationCount: number // Total number of violations
    hasContactInfo: boolean // Does response contain contact info?
    responseLength: number // Character count of response
    sentenceCount?: number // Number of sentences (optional)
  }
  
  // ===== HANDOFF =====
  handoff: {
    status: HandoffStatus // Current handoff status
    reason: HandoffReason // Reason for handoff (if applicable)
    requestedAt?: string // ISO 8601 timestamp when handoff was requested
    completedAt?: string // ISO 8601 timestamp when handoff was completed
    timeToRequest?: number // Seconds from response to handoff request
  }
  
  // ===== A/B TESTING =====
  abTesting: {
    variant: ABTestVariant // A/B test variant assigned (A or B)
    role: 'SALES' | 'SUPPORT' | 'OPS' | 'none' // AI role for this response
    responseType: 'pricing' | 'overview' | 'greeting' | 'restricted' | 'none' // Response type tested
    ctaVariant?: 'standard' | 'urgent' | 'soft' // CTA variant used
    // Note: Intent and persona MUST be identical across variants
    // Only wording (CTA, emphasis) differs
  }
  
  // ===== USER ACTIONS =====
  userActions: {
    contactMethod: ContactMethod // How user contacted (if applicable)
    contactedAt?: string // ISO 8601 timestamp when user contacted
    timeToContact?: number // Seconds from response to contact
    messageCount: number // Total messages in conversation
    conversationEnded: boolean // Did conversation end?
    conversationEndedAt?: string // ISO 8601 timestamp when conversation ended
  }
  
  // ===== USER FEEDBACK (Level 4) =====
  feedback?: {
    type: 'thumbs_up' | 'thumbs_down' | 'rating' | 'comment' | 'none'
    rating?: number // 1-5 if type is 'rating'
    comment?: string // Optional text feedback
    submittedAt?: string // ISO 8601 timestamp when feedback was submitted
    timeToFeedback?: number // Seconds from response to feedback submission
  }
  
  // ===== PERFORMANCE =====
  performance: {
    responseTimeMs: number // Time to generate response (milliseconds)
    tokenCount?: number // Total tokens used (if available)
    model: string // Model used (e.g., "mistral")
    temperature?: number // Temperature setting used
    numCtx?: number // Context window size used
  }
  
  // ===== QUALITY METRICS =====
  quality: {
    goldenResponseMatch?: boolean // Does response match golden template?
    goldenResponseSimilarity?: number // Similarity score 0-1 (if applicable)
    expectedIntent?: Intent // Expected intent (for testing)
    expectedPersona?: Persona // Expected persona (for testing)
    intentCorrect: boolean // Was detected intent correct? (requires expectedIntent)
    personaCorrect: boolean // Was detected persona correct? (requires expectedPersona)
  }
  
  // ===== METADATA (Optional) =====
  metadata?: {
    userAgent?: string // Browser user agent
    ipAddress?: string // IP address (hashed for privacy)
    referrer?: string // Referrer URL
    language?: string // Detected language
    [key: string]: unknown // Additional custom fields
  }
}

// ============================================================================
// VALIDATION RULES
// ============================================================================

export interface ValidationError {
  field: string
  message: string
  value?: unknown
}

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
}

/**
 * Validate a chat log entry against the canonical schema
 */
export function validateChatLog(log: unknown): ValidationResult {
  const errors: ValidationError[] = []
  
  if (typeof log !== 'object' || log === null) {
    return {
      valid: false,
      errors: [{ field: 'root', message: 'Log must be an object' }],
    }
  }
  
  const entry = log as Record<string, unknown>
  
  // Required string fields
  const requiredStrings = ['id', 'timestamp', 'sessionId', 'userMessage', 'aiResponse']
  for (const field of requiredStrings) {
    if (typeof entry[field] !== 'string' || entry[field] === '') {
      errors.push({ field, message: `${field} must be a non-empty string`, value: entry[field] })
    }
  }
  
  // Validate timestamp format (ISO 8601)
  if (entry.timestamp && typeof entry.timestamp === 'string') {
    const date = new Date(entry.timestamp)
    if (isNaN(date.getTime())) {
      errors.push({ field: 'timestamp', message: 'timestamp must be valid ISO 8601 format', value: entry.timestamp })
    }
  }
  
  // Validate intent
  if (!entry.intent || typeof entry.intent !== 'object') {
    errors.push({ field: 'intent', message: 'intent must be an object' })
  } else {
    const intent = entry.intent as Record<string, unknown>
    const validIntents: Intent[] = [
      'company_registration_pricing',
      'company_registration_overview',
      'accounting_pricing',
      'accounting_overview',
      'hr_pricing',
      'hr_overview',
      'work_permit_overview',
      'company_overview',
      'greeting',
      'pricing_generic',
      'restricted_legal',
      'unknown',
    ]
    if (!intent.detected || !validIntents.includes(intent.detected as Intent)) {
      errors.push({ field: 'intent.detected', message: `intent.detected must be one of: ${validIntents.join(', ')}`, value: intent.detected })
    }
  }
  
  // Validate persona
  if (!entry.persona || typeof entry.persona !== 'object') {
    errors.push({ field: 'persona', message: 'persona must be an object' })
  } else {
    const persona = entry.persona as Record<string, unknown>
    const validPersonas: Persona[] = ['REGISTRATION', 'ACCOUNTING', 'HR']
    if (!persona.detected || !validPersonas.includes(persona.detected as Persona)) {
      errors.push({ field: 'persona.detected', message: `persona.detected must be one of: ${validPersonas.join(', ')}`, value: persona.detected })
    }
    const validSources = ['explicit', 'detected', 'default']
    if (!persona.source || !validSources.includes(persona.source as string)) {
      errors.push({ field: 'persona.source', message: `persona.source must be one of: ${validSources.join(', ')}`, value: persona.source })
    }
  }
  
  // Validate responseType
  const validResponseTypes: ResponseType[] = ['greeting', 'overview', 'pricing', 'restricted', 'unknown']
  if (!entry.responseType || !validResponseTypes.includes(entry.responseType as ResponseType)) {
    errors.push({ field: 'responseType', message: `responseType must be one of: ${validResponseTypes.join(', ')}`, value: entry.responseType })
  }
  
  // Validate pricing
  if (!entry.pricing || typeof entry.pricing !== 'object') {
    errors.push({ field: 'pricing', message: 'pricing must be an object' })
  } else {
    const pricing = entry.pricing as Record<string, unknown>
    const validQuestionTypes: PricingQuestionType[] = ['explicit', 'implicit', 'none']
    if (!pricing.questionType || !validQuestionTypes.includes(pricing.questionType as PricingQuestionType)) {
      errors.push({ field: 'pricing.questionType', message: `pricing.questionType must be one of: ${validQuestionTypes.join(', ')}`, value: pricing.questionType })
    }
    if (typeof pricing.containsPrice !== 'boolean') {
      errors.push({ field: 'pricing.containsPrice', message: 'pricing.containsPrice must be a boolean', value: pricing.containsPrice })
    }
  }
  
  // Validate safety
  if (!entry.safety || typeof entry.safety !== 'object') {
    errors.push({ field: 'safety', message: 'safety must be an object' })
  } else {
    const safety = entry.safety as Record<string, unknown>
    const validViolations: SafetyViolationType[] = [
      'legal_explanation',
      'tax_calculation',
      'hallucinated_url',
      'placeholder_text',
      'ai_claim',
      'missing_contact_info',
      'too_long',
      'none',
    ]
    if (!Array.isArray(safety.violations)) {
      errors.push({ field: 'safety.violations', message: 'safety.violations must be an array', value: safety.violations })
    } else {
      for (const violation of safety.violations as unknown[]) {
        if (!validViolations.includes(violation as SafetyViolationType)) {
          errors.push({ field: 'safety.violations', message: `safety.violations must only contain: ${validViolations.join(', ')}`, value: violation })
        }
      }
    }
    if (typeof safety.violationCount !== 'number' || safety.violationCount < 0) {
      errors.push({ field: 'safety.violationCount', message: 'safety.violationCount must be a non-negative number', value: safety.violationCount })
    }
    if (typeof safety.hasContactInfo !== 'boolean') {
      errors.push({ field: 'safety.hasContactInfo', message: 'safety.hasContactInfo must be a boolean', value: safety.hasContactInfo })
    }
  }
  
  // Validate handoff
  if (!entry.handoff || typeof entry.handoff !== 'object') {
    errors.push({ field: 'handoff', message: 'handoff must be an object' })
  } else {
    const handoff = entry.handoff as Record<string, unknown>
    const validStatuses: HandoffStatus[] = ['none', 'requested', 'completed', 'declined']
    if (!handoff.status || !validStatuses.includes(handoff.status as HandoffStatus)) {
      errors.push({ field: 'handoff.status', message: `handoff.status must be one of: ${validStatuses.join(', ')}`, value: handoff.status })
    }
    const validReasons: HandoffReason[] = ['user_requested', 'complex_question', 'legal_inquiry', 'technical_issue', 'pricing_negotiation', 'none']
    if (!handoff.reason || !validReasons.includes(handoff.reason as HandoffReason)) {
      errors.push({ field: 'handoff.reason', message: `handoff.reason must be one of: ${validReasons.join(', ')}`, value: handoff.reason })
    }
  }
  
  // Validate abTesting
  if (!entry.abTesting || typeof entry.abTesting !== 'object') {
    errors.push({ field: 'abTesting', message: 'abTesting must be an object' })
  } else {
    const abTesting = entry.abTesting as Record<string, unknown>
    const validVariants: ABTestVariant[] = ['A', 'B', 'none']
    if (!abTesting.variant || !validVariants.includes(abTesting.variant as ABTestVariant)) {
      errors.push({ field: 'abTesting.variant', message: `abTesting.variant must be one of: ${validVariants.join(', ')}`, value: abTesting.variant })
    }
  }
  
  // Validate userActions
  if (!entry.userActions || typeof entry.userActions !== 'object') {
    errors.push({ field: 'userActions', message: 'userActions must be an object' })
  } else {
    const userActions = entry.userActions as Record<string, unknown>
    const validMethods: ContactMethod[] = ['phone', 'email', 'click', 'none']
    if (!userActions.contactMethod || !validMethods.includes(userActions.contactMethod as ContactMethod)) {
      errors.push({ field: 'userActions.contactMethod', message: `userActions.contactMethod must be one of: ${validMethods.join(', ')}`, value: userActions.contactMethod })
    }
    if (typeof userActions.messageCount !== 'number' || userActions.messageCount < 1) {
      errors.push({ field: 'userActions.messageCount', message: 'userActions.messageCount must be a positive number', value: userActions.messageCount })
    }
    if (typeof userActions.conversationEnded !== 'boolean') {
      errors.push({ field: 'userActions.conversationEnded', message: 'userActions.conversationEnded must be a boolean', value: userActions.conversationEnded })
    }
  }
  
  // Validate performance
  if (!entry.performance || typeof entry.performance !== 'object') {
    errors.push({ field: 'performance', message: 'performance must be an object' })
  } else {
    const performance = entry.performance as Record<string, unknown>
    if (typeof performance.responseTimeMs !== 'number' || performance.responseTimeMs < 0) {
      errors.push({ field: 'performance.responseTimeMs', message: 'performance.responseTimeMs must be a non-negative number', value: performance.responseTimeMs })
    }
    if (typeof performance.model !== 'string' || performance.model === '') {
      errors.push({ field: 'performance.model', message: 'performance.model must be a non-empty string', value: performance.model })
    }
  }
  
  // Validate quality
  if (entry.quality && typeof entry.quality === 'object') {
    const quality = entry.quality as Record<string, unknown>
    if (quality.goldenResponseMatch !== undefined && typeof quality.goldenResponseMatch !== 'boolean') {
      errors.push({ field: 'quality.goldenResponseMatch', message: 'quality.goldenResponseMatch must be a boolean', value: quality.goldenResponseMatch })
    }
    if (quality.goldenResponseSimilarity !== undefined) {
      if (typeof quality.goldenResponseSimilarity !== 'number' || quality.goldenResponseSimilarity < 0 || quality.goldenResponseSimilarity > 1) {
        errors.push({ field: 'quality.goldenResponseMatch', message: 'quality.goldenResponseSimilarity must be a number between 0 and 1', value: quality.goldenResponseSimilarity })
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Create a canonical chat log entry from API response and context
 */
export function createChatLogEntry(params: {
  id: string
  timestamp: Date
  sessionId: string
  userId?: string
  userMessage: string
  aiResponse: string
  detectedIntent: Intent
  detectedPersona: Persona
  personaSource: 'explicit' | 'detected' | 'default'
  responseType: ResponseType
  knowledgeSources: KnowledgeSource[]
  isPricingQuestion: boolean
  containsPrice: boolean
  priceValue?: string
  violations: SafetyViolationType[]
  hasContactInfo: boolean
  handoffStatus: HandoffStatus
  handoffReason: HandoffReason
  abVariant: ABTestVariant
  abResponseType: 'pricing' | 'overview' | 'none'
  contactMethod: ContactMethod
  messageCount: number
  conversationEnded: boolean
  responseTimeMs: number
  model: string
  expectedIntent?: Intent
  expectedPersona?: Persona
}): ChatLogSchema {
  return {
    id: params.id,
    timestamp: params.timestamp.toISOString(),
    sessionId: params.sessionId,
    userId: params.userId,
    
    intent: {
      detected: params.detectedIntent,
    },
    persona: {
      detected: params.detectedPersona,
      source: params.personaSource,
    },
    responseType: params.responseType,
    
    userMessage: params.userMessage,
    aiResponse: params.aiResponse,
    knowledgeSources: params.knowledgeSources,
    
    pricing: {
      questionType: params.isPricingQuestion ? 'explicit' : 'none',
      containsPrice: params.containsPrice,
      priceValue: params.priceValue,
    },
    
    safety: {
      violations: params.violations.length > 0 ? params.violations : ['none'],
      violationCount: params.violations.length,
      hasContactInfo: params.hasContactInfo,
      responseLength: params.aiResponse.length,
    },
    
    handoff: {
      status: params.handoffStatus,
      reason: params.handoffReason,
    },
    
    abTesting: {
      variant: params.abVariant,
      responseType: params.abResponseType,
    },
    
    userActions: {
      contactMethod: params.contactMethod,
      messageCount: params.messageCount,
      conversationEnded: params.conversationEnded,
    },
    
    performance: {
      responseTimeMs: params.responseTimeMs,
      model: params.model,
    },
    
    quality: {
      expectedIntent: params.expectedIntent,
      expectedPersona: params.expectedPersona,
      intentCorrect: params.expectedIntent ? params.detectedIntent === params.expectedIntent : false,
      personaCorrect: params.expectedPersona ? params.detectedPersona === params.expectedPersona : false,
    },
  }
}
