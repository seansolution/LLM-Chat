import type { Persona, IntentResult } from './intent'
import { detectIntent } from './intent'

// ============================================================================
// METRICS DEFINITIONS
// ============================================================================

export interface ChatLogEntry {
  id: string
  timestamp: Date
  userMessage: string
  detectedIntent: IntentResult
  expectedIntent?: string
  expectedPersona?: Persona
  aiResponse: string
  isPricingQuestion: boolean
  containsPrice: boolean
  goldenResponse?: string
}

export interface ForbiddenViolation {
  type: 'legal_explanation' | 'tax_calculation' | 'hallucinated_url' | 'placeholder_text' | 'ai_claim'
  detected: boolean
  evidence?: string
}

export interface MetricsResult {
  intentCoverage: {
    total: number
    correct: number
    percentage: number
    breakdown: Record<string, { correct: number; total: number; percentage: number }>
  }
  personaAccuracy: {
    total: number
    correct: number
    percentage: number
    breakdown: Record<Persona, { correct: number; total: number; percentage: number }>
  }
  pricingAnswerRate: {
    total: number
    answered: number
    percentage: number
  }
  forbiddenResponseRate: {
    total: number
    violations: number
    percentage: number
    breakdown: Record<ForbiddenViolation['type'], number>
  }
  goldenResponseMatchRate: {
    total: number
    matched: number
    percentage: number
    threshold: number // semantic similarity threshold (0-1)
  }
}

export interface DashboardReport {
  timestamp: Date
  period: {
    start: Date
    end: Date
  }
  metrics: MetricsResult
  sampleSize: number
}

// ============================================================================
// CALCULATION FUNCTIONS
// ============================================================================

/**
 * Detects forbidden violations in AI response
 */
export function detectForbiddenViolations(response: string): ForbiddenViolation[] {
  const violations: ForbiddenViolation[] = []

  // Legal explanation patterns
  const legalPatterns = [
    /ขั้นตอน.*จดทะเบียน|วิธีการ.*จดทะเบียน|กระบวนการ.*จดทะเบียน/i,
    /ขั้นตอน.*ยื่นภาษี|วิธีการ.*ยื่นภาษี|กระบวนการ.*ยื่นภาษี/i,
    /ขั้นตอน.*เลิกจ้าง|วิธีการ.*เลิกจ้าง|กระบวนการ.*เลิกจ้าง/i,
    /ต้อง.*ดำเนินการ|ต้อง.*ทำตาม|ต้อง.*ปฏิบัติ/i,
  ]
  if (legalPatterns.some(p => p.test(response))) {
    const match = response.match(legalPatterns.find(p => p.test(response))!)
    violations.push({ type: 'legal_explanation', detected: true, evidence: match ? match[0] : undefined })
  }

  // Tax calculation patterns
  const taxPatterns = [
    /คำนวณ.*ภาษี|วิธีคำนวณ|สูตรคำนวณ|คำนวณ.*vat|คำนวณ.*หัก ณ ที่จ่าย/i,
    /\d+%\s*[x×]\s*\d+|คำนวณ.*\d+.*บาท/i,
  ]
  if (taxPatterns.some(p => p.test(response))) {
    const match = response.match(taxPatterns.find(p => p.test(response))!)
    violations.push({ type: 'tax_calculation', detected: true, evidence: match ? match[0] : undefined })
  }

  // Hallucinated URL patterns (excluding seansolution.co.th)
  const urlPattern = /https?:\/\/[^\s]+(?!seansolution\.co\.th)|www\.[^\s]+(?!seansolution\.co\.th)/i
  if (urlPattern.test(response)) {
    const match = response.match(urlPattern)
    violations.push({ type: 'hallucinated_url', detected: true, evidence: match ? match[0] : undefined })
  }

  // Placeholder text patterns
  const placeholderPatterns = [
    /\[website\]|\[contact\]|\[price\]|\[.*?\]/i,
    /placeholder|place holder|\[.*\]/i,
  ]
  if (placeholderPatterns.some(p => p.test(response))) {
    const match = response.match(placeholderPatterns.find(p => p.test(response))!)
    violations.push({ type: 'placeholder_text', detected: true, evidence: match ? match[0] : undefined })
  }

  // AI/system/platform claims
  const aiClaimPatterns = [
    /ฉันเป็นระบบ|ฉันเป็น AI|ฉันเป็นโทรศัพท์|ฉันเป็นแพลตฟอร์ม|ฉันเป็นแอป/i,
    /ฉันเป็น.*system|ฉันเป็น.*platform|ฉันเป็น.*application/i,
  ]
  if (aiClaimPatterns.some(p => p.test(response))) {
    const match = response.match(aiClaimPatterns.find(p => p.test(response))!)
    violations.push({ type: 'ai_claim', detected: true, evidence: match ? match[0] : undefined })
  }

  return violations
}

/**
 * Checks if response contains an actual price
 */
export function containsPrice(response: string): boolean {
  // Pattern: number followed by บาท or THB
  const pricePatterns = [
    /\d{1,3}(?:,\d{3})*(?:\.\d+)?\s*(?:บาท|THB|baht)/i,
    /ราคา.*\d{1,3}(?:,\d{3})*(?:\.\d+)?/i,
    /\d{1,3}(?:,\d{3})*(?:\.\d+)?\s*(?:บาท|THB).*(?:ต่อเดือน|ครั้งเดียว|\/เดือน)/i,
  ]
  return pricePatterns.some(p => p.test(response))
}

/**
 * Checks if response matches golden response template
 * Uses simple string similarity (Levenshtein-like) for now
 * Can be enhanced with semantic similarity (embeddings) later
 */
export function matchesGoldenResponse(response: string, goldenResponse: string, threshold: number = 0.7): boolean {
  if (!goldenResponse) return false

  // Normalize: remove whitespace, convert to lowercase
  const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, '').trim()
  const normalizedResponse = normalize(response)
  const normalizedGolden = normalize(goldenResponse)

  // Simple similarity: check if key phrases exist
  const keyPhrases = [
    /ราคา.*\d+.*บาท/i,
    /086-398-6889|zanhcpe@gmail.com/i,
    /สนใจสอบถาม|ติดต่อ/i,
  ]

  const goldenHasKeyPhrases = keyPhrases.filter(p => p.test(goldenResponse)).length
  const responseHasKeyPhrases = keyPhrases.filter(p => p.test(response)).length

  if (goldenHasKeyPhrases === 0) {
    // For non-pricing responses, use simple substring matching
    const similarity = calculateSimpleSimilarity(normalizedResponse, normalizedGolden)
    return similarity >= threshold
  }

  // For pricing responses, check if key phrases match
  const phraseMatchRate = goldenHasKeyPhrases > 0 
    ? responseHasKeyPhrases / goldenHasKeyPhrases 
    : 0

  return phraseMatchRate >= threshold
}

/**
 * Simple string similarity (Jaccard-like)
 */
function calculateSimpleSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1.0
  if (str1.length === 0 || str2.length === 0) return 0.0

  // Check substring overlap
  const longer = str1.length > str2.length ? str1 : str2
  const shorter = str1.length > str2.length ? str2 : str1

  if (longer.includes(shorter)) {
    return shorter.length / longer.length
  }

  // Simple character overlap
  const set1 = new Set(str1.split(''))
  const set2 = new Set(str2.split(''))
  const intersection = new Set([...set1].filter(x => set2.has(x)))
  const union = new Set([...set1, ...set2])

  return intersection.size / union.size
}

/**
 * Calculate all metrics from chat logs
 */
export function calculateMetrics(logs: ChatLogEntry[]): MetricsResult {
  const total = logs.length

  // 1. Intent Coverage
  const intentBreakdown: Record<string, { correct: number; total: number }> = {}
  let intentCorrect = 0

  logs.forEach(log => {
    const intent = log.detectedIntent.intent
    if (!intentBreakdown[intent]) {
      intentBreakdown[intent] = { correct: 0, total: 0 }
    }
    intentBreakdown[intent].total++

    if (log.expectedIntent && log.detectedIntent.intent === log.expectedIntent) {
      intentBreakdown[intent].correct++
      intentCorrect++
    }
  })

  const intentCoverage = {
    total,
    correct: intentCorrect,
    percentage: total > 0 ? (intentCorrect / total) * 100 : 0,
    breakdown: Object.fromEntries(
      Object.entries(intentBreakdown).map(([intent, data]) => [
        intent,
        {
          ...data,
          percentage: data.total > 0 ? (data.correct / data.total) * 100 : 0,
        },
      ])
    ),
  }

  // 2. Persona Accuracy
  const personaBreakdown: Record<Persona, { correct: number; total: number }> = {
    HR: { correct: 0, total: 0 },
    ACCOUNTING: { correct: 0, total: 0 },
    REGISTRATION: { correct: 0, total: 0 },
  }
  let personaCorrect = 0

  logs.forEach(log => {
    const persona = log.detectedIntent.persona
    personaBreakdown[persona].total++

    if (log.expectedPersona && log.detectedIntent.persona === log.expectedPersona) {
      personaBreakdown[persona].correct++
      personaCorrect++
    }
  })

  const personaAccuracy = {
    total,
    correct: personaCorrect,
    percentage: total > 0 ? (personaCorrect / total) * 100 : 0,
    breakdown: Object.fromEntries(
      Object.entries(personaBreakdown).map(([persona, data]) => [
        persona,
        {
          ...data,
          percentage: data.total > 0 ? (data.correct / data.total) * 100 : 0,
        },
      ])
    ) as Record<Persona, { correct: number; total: number; percentage: number }>,
  }

  // 3. Pricing Answer Rate
  const pricingQuestions = logs.filter(log => log.isPricingQuestion)
  const pricingAnswered = pricingQuestions.filter(log => log.containsPrice)

  const pricingAnswerRate = {
    total: pricingQuestions.length,
    answered: pricingAnswered.length,
    percentage: pricingQuestions.length > 0 ? (pricingAnswered.length / pricingQuestions.length) * 100 : 0,
  }

  // 4. Forbidden Response Rate
  const violations: ForbiddenViolation[] = []
  logs.forEach(log => {
    violations.push(...detectForbiddenViolations(log.aiResponse))
  })

  const violationBreakdown: Record<ForbiddenViolation['type'], number> = {
    legal_explanation: 0,
    tax_calculation: 0,
    hallucinated_url: 0,
    placeholder_text: 0,
    ai_claim: 0,
  }

  violations.forEach(v => {
    violationBreakdown[v.type]++
  })

  const forbiddenResponseRate = {
    total,
    violations: violations.length,
    percentage: total > 0 ? (violations.length / total) * 100 : 0,
    breakdown: violationBreakdown,
  }

  // 5. Golden Response Match Rate
  const goldenResponses = logs.filter(log => log.goldenResponse)
  const matchedResponses = goldenResponses.filter(log =>
    matchesGoldenResponse(log.aiResponse, log.goldenResponse!, 0.7)
  )

  const goldenResponseMatchRate = {
    total: goldenResponses.length,
    matched: matchedResponses.length,
    percentage: goldenResponses.length > 0 ? (matchedResponses.length / goldenResponses.length) * 100 : 0,
    threshold: 0.7,
  }

  return {
    intentCoverage,
    personaAccuracy,
    pricingAnswerRate,
    forbiddenResponseRate,
    goldenResponseMatchRate,
  }
}

/**
 * Generate dashboard report
 */
export function generateDashboardReport(
  logs: ChatLogEntry[],
  periodStart: Date,
  periodEnd: Date
): DashboardReport {
  const metrics = calculateMetrics(logs)

  return {
    timestamp: new Date(),
    period: {
      start: periodStart,
      end: periodEnd,
    },
    metrics,
    sampleSize: logs.length,
  }
}

/**
 * Format report as table (for console output)
 */
export function formatReportAsTable(report: DashboardReport): string {
  const { metrics } = report

  const rows = [
    ['Metric', 'Value', 'Details'],
    ['─'.repeat(50), '─'.repeat(20), '─'.repeat(30)],
    [
      'Intent Coverage',
      `${metrics.intentCoverage.percentage.toFixed(1)}%`,
      `${metrics.intentCoverage.correct}/${metrics.intentCoverage.total}`,
    ],
    [
      'Persona Accuracy',
      `${metrics.personaAccuracy.percentage.toFixed(1)}%`,
      `${metrics.personaAccuracy.correct}/${metrics.personaAccuracy.total}`,
    ],
    [
      'Pricing Answer Rate',
      `${metrics.pricingAnswerRate.percentage.toFixed(1)}%`,
      `${metrics.pricingAnswerRate.answered}/${metrics.pricingAnswerRate.total}`,
    ],
    [
      'Forbidden Response Rate',
      `${metrics.forbiddenResponseRate.percentage.toFixed(1)}%`,
      `${metrics.forbiddenResponseRate.violations}/${metrics.forbiddenResponseRate.total}`,
    ],
    [
      'Golden Response Match',
      `${metrics.goldenResponseMatchRate.percentage.toFixed(1)}%`,
      `${metrics.goldenResponseMatchRate.matched}/${metrics.goldenResponseMatchRate.total}`,
    ],
  ]

  return rows.map(row => row.join(' | ')).join('\n')
}
