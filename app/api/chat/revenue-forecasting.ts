/**
 * Revenue Forecasting Model
 * 
 * Forecasts revenue based on qualified leads, conversion rates, and deal sizes.
 * Supports scenario analysis and monthly projections.
 */

import type { ConversationSummary } from './agent-assist'
import { calculateLeadScore } from './lead-score'

// ============================================================================
// TYPES
// ============================================================================

export interface ForecastInputs {
  // Base inputs
  startMonth: string // YYYY-MM format
  months: number // Number of months to forecast
  
  // Conversation volume
  baseConversations: number // Starting monthly conversations
  growthRate: number // Monthly growth rate (0.05 = 5%)
  
  // Qualification
  qualificationRate: number // Overall qualification rate (0.45 = 45%)
  qualificationRateByPersona?: {
    REGISTRATION: number
    ACCOUNTING: number
    HR: number
  }
  
  // Conversion
  conversionRate: number // Overall conversion rate (0.20 = 20%)
  conversionRateByPersona?: {
    REGISTRATION: number
    ACCOUNTING: number
    HR: number
  }
  conversionRateByIntent?: {
    ready_to_buy: number
    price_comparison: number
    urgent: number
    information_seeking: number
    problem_solving: number
    exploring: number
  }
  
  // Deal size
  averageDealValue: number // Overall average deal value
  dealValueByPersona?: {
    REGISTRATION: number // One-time
    ACCOUNTING: number // Annual (monthly × 12)
    HR: number // Annual (monthly × 12)
  }
  
  // Persona mix (optional, defaults to equal)
  personaMix?: {
    REGISTRATION: number // 0-1, proportion of conversations
    ACCOUNTING: number
    HR: number
  }
}

export interface MonthlyForecast {
  month: string // YYYY-MM
  conversations: number
  qualifiedLeads: number
  conversions: number
  revenue: number
  cumulativeRevenue: number
}

export interface PersonaForecast {
  persona: 'REGISTRATION' | 'ACCOUNTING' | 'HR'
  monthly: MonthlyForecast[]
  totalRevenue: number
  totalConversions: number
}

export interface RevenueForecast {
  inputs: ForecastInputs
  baseCase: {
    monthly: MonthlyForecast[]
    totalRevenue: number
    totalConversions: number
    byPersona: PersonaForecast[]
  }
  bestCase?: {
    monthly: MonthlyForecast[]
    totalRevenue: number
    totalConversions: number
  }
  worstCase?: {
    monthly: MonthlyForecast[]
    totalRevenue: number
    totalConversions: number
  }
}

export interface ScenarioAdjustments {
  qualificationMultiplier: number // 1.10 = +10%
  conversionMultiplier: number // 1.20 = +20%
  dealValueMultiplier: number // 1.15 = +15%
  growthRateAdjustment: number // 0.05 = +5% to growth rate
}

// ============================================================================
// QUALIFIED LEADS IDENTIFICATION
// ============================================================================

/**
 * Check if conversation is a qualified lead
 */
export function isQualifiedLead(conversation: ConversationSummary): boolean {
  // Buying intent qualification
  const qualifiedIntents: ConversationSummary['buyingIntent'][] = [
    'ready_to_buy',
    'price_comparison',
    'urgent',
  ]
  if (qualifiedIntents.includes(conversation.buyingIntent)) {
    return true
  }
  
  // Contact requested
  if (conversation.handoffReason === 'user_requested') {
    return true
  }
  
  // Pricing discussed
  if (conversation.alreadyAnswered.pricing) {
    return true
  }
  
  // Lead score ≥ 50
  const leadScore = calculateLeadScore(conversation)
  if (leadScore.score >= 50) {
    return true
  }
  
  return false
}

/**
 * Calculate qualification rate from historical data
 */
export function calculateQualificationRate(
  conversations: ConversationSummary[]
): number {
  if (conversations.length === 0) return 0
  
  const qualified = conversations.filter(isQualifiedLead).length
  return qualified / conversations.length
}

/**
 * Calculate qualification rate by persona
 */
export function calculateQualificationRateByPersona(
  conversations: ConversationSummary[]
): Record<'REGISTRATION' | 'ACCOUNTING' | 'HR', number> {
  const rates: Record<'REGISTRATION' | 'ACCOUNTING' | 'HR', { total: number; qualified: number }> = {
    REGISTRATION: { total: 0, qualified: 0 },
    ACCOUNTING: { total: 0, qualified: 0 },
    HR: { total: 0, qualified: 0 },
  }
  
  conversations.forEach(conv => {
    const persona = conv.persona
    rates[persona].total++
    if (isQualifiedLead(conv)) {
      rates[persona].qualified++
    }
  })
  
  return {
    REGISTRATION: rates.REGISTRATION.total > 0 
      ? rates.REGISTRATION.qualified / rates.REGISTRATION.total 
      : 0,
    ACCOUNTING: rates.ACCOUNTING.total > 0 
      ? rates.ACCOUNTING.qualified / rates.ACCOUNTING.total 
      : 0,
    HR: rates.HR.total > 0 
      ? rates.HR.qualified / rates.HR.total 
      : 0,
  }
}

// ============================================================================
// CONVERSION RATE CALCULATION
// ============================================================================

/**
 * Calculate conversion rate from historical data
 */
export function calculateConversionRate(
  qualifiedLeads: number,
  closedDeals: number
): number {
  if (qualifiedLeads === 0) return 0
  return closedDeals / qualifiedLeads
}

/**
 * Calculate conversion rate by persona
 */
export function calculateConversionRateByPersona(
  deals: Array<{ persona: 'REGISTRATION' | 'ACCOUNTING' | 'HR'; dealValue: number }>,
  qualifiedLeadsByPersona: Record<'REGISTRATION' | 'ACCOUNTING' | 'HR', number>
): Record<'REGISTRATION' | 'ACCOUNTING' | 'HR', number> {
  const dealsByPersona: Record<'REGISTRATION' | 'ACCOUNTING' | 'HR', number> = {
    REGISTRATION: 0,
    ACCOUNTING: 0,
    HR: 0,
  }
  
  deals.forEach(deal => {
    dealsByPersona[deal.persona]++
  })
  
  return {
    REGISTRATION: calculateConversionRate(
      qualifiedLeadsByPersona.REGISTRATION,
      dealsByPersona.REGISTRATION
    ),
    ACCOUNTING: calculateConversionRate(
      qualifiedLeadsByPersona.ACCOUNTING,
      dealsByPersona.ACCOUNTING
    ),
    HR: calculateConversionRate(
      qualifiedLeadsByPersona.HR,
      dealsByPersona.HR
    ),
  }
}

// ============================================================================
// DEAL SIZE CALCULATION
// ============================================================================

/**
 * Calculate average deal value from historical data
 */
export function calculateAverageDealValue(
  deals: Array<{ dealValue: number }>
): number {
  if (deals.length === 0) return 0
  return deals.reduce((sum, deal) => sum + deal.dealValue, 0) / deals.length
}

/**
 * Calculate average deal value by persona
 */
export function calculateAverageDealValueByPersona(
  deals: Array<{ persona: 'REGISTRATION' | 'ACCOUNTING' | 'HR'; dealValue: number }>
): Record<'REGISTRATION' | 'ACCOUNTING' | 'HR', number> {
  const valuesByPersona: Record<'REGISTRATION' | 'ACCOUNTING' | 'HR', { sum: number; count: number }> = {
    REGISTRATION: { sum: 0, count: 0 },
    ACCOUNTING: { sum: 0, count: 0 },
    HR: { sum: 0, count: 0 },
  }
  
  deals.forEach(deal => {
    valuesByPersona[deal.persona].sum += deal.dealValue
    valuesByPersona[deal.persona].count++
  })
  
  return {
    REGISTRATION: valuesByPersona.REGISTRATION.count > 0
      ? valuesByPersona.REGISTRATION.sum / valuesByPersona.REGISTRATION.count
      : 0,
    ACCOUNTING: valuesByPersona.ACCOUNTING.count > 0
      ? valuesByPersona.ACCOUNTING.sum / valuesByPersona.ACCOUNTING.count
      : 0,
    HR: valuesByPersona.HR.count > 0
      ? valuesByPersona.HR.sum / valuesByPersona.HR.count
      : 0,
  }
}

// ============================================================================
// FORECAST GENERATION
// ============================================================================

/**
 * Generate monthly forecast for a single month
 */
export function generateMonthlyForecast(
  month: string,
  monthIndex: number,
  inputs: ForecastInputs,
  cumulativeRevenue: number = 0
): MonthlyForecast {
  // Calculate conversations with growth
  const conversations = inputs.baseConversations * Math.pow(1 + inputs.growthRate, monthIndex)
  
  // Calculate qualified leads
  const qualifiedLeads = Math.round(conversations * inputs.qualificationRate)
  
  // Calculate conversions
  const conversions = Math.round(qualifiedLeads * inputs.conversionRate)
  
  // Calculate revenue
  const revenue = conversions * inputs.averageDealValue
  
  // Cumulative revenue
  const newCumulativeRevenue = cumulativeRevenue + revenue
  
  return {
    month,
    conversations: Math.round(conversations),
    qualifiedLeads,
    conversions,
    revenue: Math.round(revenue),
    cumulativeRevenue: Math.round(newCumulativeRevenue),
  }
}

/**
 * Generate forecast by persona
 */
export function generatePersonaForecast(
  persona: 'REGISTRATION' | 'ACCOUNTING' | 'HR',
  inputs: ForecastInputs,
  startDate: Date
): PersonaForecast {
  const monthly: MonthlyForecast[] = []
  let cumulativeRevenue = 0
  
  // Get persona-specific rates
  const qualificationRate = inputs.qualificationRateByPersona?.[persona] || inputs.qualificationRate
  const conversionRate = inputs.conversionRateByPersona?.[persona] || inputs.conversionRate
  const dealValue = inputs.dealValueByPersona?.[persona] || inputs.averageDealValue
  const personaMix = inputs.personaMix?.[persona] || (1 / 3) // Default: equal split
  
  for (let i = 0; i < inputs.months; i++) {
    const monthDate = new Date(startDate)
    monthDate.setMonth(startDate.getMonth() + i)
    const month = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`
    
    // Calculate conversations (with persona mix)
    const totalConversations = inputs.baseConversations * Math.pow(1 + inputs.growthRate, i)
    const conversations = Math.round(totalConversations * personaMix)
    
    // Calculate qualified leads
    const qualifiedLeads = Math.round(conversations * qualificationRate)
    
    // Calculate conversions
    const conversions = Math.round(qualifiedLeads * conversionRate)
    
    // Calculate revenue
    const revenue = conversions * dealValue
    
    // Cumulative
    cumulativeRevenue += revenue
    
    monthly.push({
      month,
      conversations,
      qualifiedLeads,
      conversions,
      revenue: Math.round(revenue),
      cumulativeRevenue: Math.round(cumulativeRevenue),
    })
  }
  
  return {
    persona,
    monthly,
    totalRevenue: Math.round(cumulativeRevenue),
    totalConversions: monthly.reduce((sum, m) => sum + m.conversions, 0),
  }
}

/**
 * Generate complete revenue forecast
 */
export function generateRevenueForecast(inputs: ForecastInputs): RevenueForecast {
  const startDate = new Date(inputs.startMonth + '-01')
  const monthly: MonthlyForecast[] = []
  let cumulativeRevenue = 0
  
  // Generate monthly forecasts
  for (let i = 0; i < inputs.months; i++) {
    const monthDate = new Date(startDate)
    monthDate.setMonth(startDate.getMonth() + i)
    const month = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`
    
    const forecast = generateMonthlyForecast(month, i, inputs, cumulativeRevenue)
    monthly.push(forecast)
    cumulativeRevenue = forecast.cumulativeRevenue
  }
  
  // Generate persona forecasts
  const byPersona: PersonaForecast[] = [
    generatePersonaForecast('REGISTRATION', inputs, startDate),
    generatePersonaForecast('ACCOUNTING', inputs, startDate),
    generatePersonaForecast('HR', inputs, startDate),
  ]
  
  const totalRevenue = monthly[monthly.length - 1].cumulativeRevenue
  const totalConversions = monthly.reduce((sum, m) => sum + m.conversions, 0)
  
  return {
    inputs,
    baseCase: {
      monthly,
      totalRevenue,
      totalConversions,
      byPersona,
    },
  }
}

// ============================================================================
// SCENARIO ANALYSIS
// ============================================================================

/**
 * Generate scenario forecast (best case or worst case)
 */
export function generateScenarioForecast(
  baseForecast: RevenueForecast,
  adjustments: ScenarioAdjustments
): RevenueForecast['baseCase'] {
  const inputs = baseForecast.inputs
  const adjustedInputs: ForecastInputs = {
    ...inputs,
    qualificationRate: inputs.qualificationRate * adjustments.qualificationMultiplier,
    conversionRate: inputs.conversionRate * adjustments.conversionMultiplier,
    averageDealValue: inputs.averageDealValue * adjustments.dealValueMultiplier,
    growthRate: inputs.growthRate + adjustments.growthRateAdjustment,
  }
  
  // Adjust persona-specific rates if provided
  if (inputs.qualificationRateByPersona) {
    adjustedInputs.qualificationRateByPersona = {
      REGISTRATION: inputs.qualificationRateByPersona.REGISTRATION * adjustments.qualificationMultiplier,
      ACCOUNTING: inputs.qualificationRateByPersona.ACCOUNTING * adjustments.qualificationMultiplier,
      HR: inputs.qualificationRateByPersona.HR * adjustments.qualificationMultiplier,
    }
  }
  
  if (inputs.conversionRateByPersona) {
    adjustedInputs.conversionRateByPersona = {
      REGISTRATION: inputs.conversionRateByPersona.REGISTRATION * adjustments.conversionMultiplier,
      ACCOUNTING: inputs.conversionRateByPersona.ACCOUNTING * adjustments.conversionMultiplier,
      HR: inputs.conversionRateByPersona.HR * adjustments.conversionMultiplier,
    }
  }
  
  if (inputs.dealValueByPersona) {
    adjustedInputs.dealValueByPersona = {
      REGISTRATION: inputs.dealValueByPersona.REGISTRATION * adjustments.dealValueMultiplier,
      ACCOUNTING: inputs.dealValueByPersona.ACCOUNTING * adjustments.dealValueMultiplier,
      HR: inputs.dealValueByPersona.HR * adjustments.dealValueMultiplier,
    }
  }
  
  const scenarioForecast = generateRevenueForecast(adjustedInputs)
  return scenarioForecast.baseCase
}

/**
 * Generate all scenarios (base, best, worst)
 */
export function generateScenarios(
  baseForecast: RevenueForecast,
  scenarioAdjustments: {
    bestCase: ScenarioAdjustments
    worstCase: ScenarioAdjustments
  }
): RevenueForecast {
  const bestCase = generateScenarioForecast(baseForecast, scenarioAdjustments.bestCase)
  const worstCase = generateScenarioForecast(baseForecast, scenarioAdjustments.worstCase)
  
  return {
    ...baseForecast,
    bestCase,
    worstCase,
  }
}

// ============================================================================
// FORECAST ACCURACY
// ============================================================================

/**
 * Calculate forecast accuracy metrics
 */
export function calculateForecastAccuracy(
  forecast: MonthlyForecast[],
  actual: Array<{ month: string; revenue: number }>
): {
  mae: number // Mean Absolute Error
  mape: number // Mean Absolute Percentage Error
  rmse: number // Root Mean Square Error
} {
  if (actual.length === 0) {
    return { mae: 0, mape: 0, rmse: 0 }
  }
  
  const errors: number[] = []
  const percentageErrors: number[] = []
  const squaredErrors: number[] = []
  
  forecast.forEach(fc => {
    const actualData = actual.find(a => a.month === fc.month)
    if (actualData) {
      const error = Math.abs(fc.revenue - actualData.revenue)
      errors.push(error)
      
      if (actualData.revenue > 0) {
        percentageErrors.push((error / actualData.revenue) * 100)
      }
      
      squaredErrors.push(error * error)
    }
  })
  
  const mae = errors.length > 0 ? errors.reduce((a, b) => a + b, 0) / errors.length : 0
  const mape = percentageErrors.length > 0 
    ? percentageErrors.reduce((a, b) => a + b, 0) / percentageErrors.length 
    : 0
  const rmse = squaredErrors.length > 0
    ? Math.sqrt(squaredErrors.reduce((a, b) => a + b, 0) / squaredErrors.length)
    : 0
  
  return { mae, mape, rmse }
}

// ============================================================================
// FORMATTING
// ============================================================================

/**
 * Format forecast for display
 */
export function formatForecast(forecast: RevenueForecast): string {
  let output = '\n'
  output += '='.repeat(70) + '\n'
  output += 'REVENUE FORECAST\n'
  output += '='.repeat(70) + '\n\n'
  
  output += 'BASE CASE\n'
  output += '-'.repeat(70) + '\n'
  output += `Total Revenue (${forecast.inputs.months} months): ${forecast.baseCase.totalRevenue.toLocaleString('th-TH')} THB\n`
  output += `Total Conversions: ${forecast.baseCase.totalConversions}\n\n`
  
  output += 'Monthly Breakdown:\n'
  output += 'Month       | Conversations | Qualified | Conversions | Revenue (THB)\n'
  output += '-'.repeat(70) + '\n'
  
  forecast.baseCase.monthly.forEach(m => {
    output += `${m.month.padEnd(12)} | ${String(m.conversations).padStart(13)} | ${String(m.qualifiedLeads).padStart(9)} | ${String(m.conversions).padStart(11)} | ${m.revenue.toLocaleString('th-TH').padStart(15)}\n`
  })
  
  if (forecast.bestCase) {
    output += '\nBEST CASE\n'
    output += '-'.repeat(70) + '\n'
    output += `Total Revenue: ${forecast.bestCase.totalRevenue.toLocaleString('th-TH')} THB\n`
    output += `Total Conversions: ${forecast.bestCase.totalConversions}\n`
  }
  
  if (forecast.worstCase) {
    output += '\nWORST CASE\n'
    output += '-'.repeat(70) + '\n'
    output += `Total Revenue: ${forecast.worstCase.totalRevenue.toLocaleString('th-TH')} THB\n`
    output += `Total Conversions: ${forecast.worstCase.totalConversions}\n`
  }
  
  output += '='.repeat(70) + '\n'
  
  return output
}
