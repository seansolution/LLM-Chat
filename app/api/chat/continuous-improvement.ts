/**
 * Continuous Improvement Loop
 * 
 * Level 4 capability: Automatically analyzes A/B test results and updates optimization decisions
 */

import type { AIRole } from './role-prompts'
import type { ResponseType, RoleABTestMetric, RoleABTestContactEvent, RoleABTestConversationEvent } from './role-ab-testing'
import { generateRoleABTestResults } from './role-ab-testing'
import { determineOptimalVariant } from './auto-optimization'
import { storeOptimizationDecision } from './optimization-storage'
import { loadFeedbacks } from './feedback-storage'
import type { UserFeedback } from './feedback'

export interface ImprovementResult {
  role: AIRole
  responseType: ResponseType
  decision: {
    shouldSwitch: boolean
    recommendedVariant: 'A' | 'B' | null
    reason: string
    confidence: number
  }
  metrics: {
    variantA: {
      contactRate: number
      conversionRate: number
      positiveFeedback: number
    }
    variantB: {
      contactRate: number
      conversionRate: number
      positiveFeedback: number
    }
  }
  updated: boolean
}

/**
 * Analyze and update optimization decisions for a role/responseType combination
 */
export function analyzeAndUpdateOptimization(
  role: AIRole,
  responseType: ResponseType,
  metrics: RoleABTestMetric[],
  contacts: RoleABTestContactEvent[],
  conversations: RoleABTestConversationEvent[]
): ImprovementResult {
  // Generate A/B test results
  const results = generateRoleABTestResults(metrics, contacts, conversations, role, responseType)
  
  // Load feedbacks for this role/responseType
  const feedbacks = loadFeedbacks({ role, responseType })
  
  // Determine optimal variant
  const decision = determineOptimalVariant(
    results.variantA,
    results.variantB,
    feedbacks,
    {
      minSampleSize: 100, // Minimum 100 responses before optimization
      significanceThreshold: 0.05,
      minLift: 5, // Minimum 5% lift to switch
      primaryMetric: 'contactRate',
      enableAutoSwitch: true,
    }
  )
  
  // Store optimization decision
  storeOptimizationDecision(role, responseType, decision)
  
  return {
    role,
    responseType,
    decision: {
      shouldSwitch: decision.shouldSwitch,
      recommendedVariant: decision.recommendedVariant,
      reason: decision.reason,
      confidence: decision.confidence,
    },
    metrics: decision.metrics,
    updated: decision.shouldSwitch,
  }
}

/**
 * Run continuous improvement for all role/responseType combinations
 */
export function runContinuousImprovement(
  allMetrics: RoleABTestMetric[],
  allContacts: RoleABTestContactEvent[],
  allConversations: RoleABTestConversationEvent[]
): ImprovementResult[] {
  const roles: AIRole[] = ['SALES', 'SUPPORT', 'OPS']
  const responseTypes: ResponseType[] = ['pricing', 'overview', 'greeting']
  
  const results: ImprovementResult[] = []
  
  for (const role of roles) {
    for (const responseType of responseTypes) {
      // Filter metrics for this role/responseType
      const roleMetrics = allMetrics.filter(
        m => m.role === role && m.responseType === responseType
      )
      const roleContacts = allContacts.filter(
        c => c.role === role && c.responseType === responseType
      )
      const roleConversations = allConversations.filter(
        c => c.role === role && c.responseType === responseType
      )
      
      // Only analyze if we have enough data
      if (roleMetrics.length >= 50) { // Minimum threshold
        const result = analyzeAndUpdateOptimization(
          role,
          responseType,
          roleMetrics,
          roleContacts,
          roleConversations
        )
        results.push(result)
      }
    }
  }
  
  return results
}

/**
 * Format improvement results for logging
 */
export function formatImprovementResults(results: ImprovementResult[]): string {
  if (results.length === 0) {
    return 'No optimization updates (insufficient data)'
  }
  
  let output = '\n'
  output += '='.repeat(80) + '\n'
  output += '🔄 CONTINUOUS IMPROVEMENT RESULTS\n'
  output += '='.repeat(80) + '\n\n'
  
  for (const result of results) {
    output += `Role: ${result.role} | Response Type: ${result.responseType}\n`
    output += `- Recommended Variant: ${result.decision.recommendedVariant || 'None'}\n`
    output += `- Should Switch: ${result.decision.shouldSwitch ? '✅ Yes' : '❌ No'}\n`
    output += `- Reason: ${result.decision.reason}\n`
    output += `- Confidence: ${(result.decision.confidence * 100).toFixed(1)}%\n`
    output += `- Variant A: Contact ${result.metrics.variantA.contactRate.toFixed(1)}%, Conversion ${result.metrics.variantA.conversionRate.toFixed(1)}%, Feedback ${result.metrics.variantA.positiveFeedback.toFixed(1)}%\n`
    output += `- Variant B: Contact ${result.metrics.variantB.contactRate.toFixed(1)}%, Conversion ${result.metrics.variantB.conversionRate.toFixed(1)}%, Feedback ${result.metrics.variantB.positiveFeedback.toFixed(1)}%\n`
    output += `- Updated: ${result.updated ? '✅ Yes' : '❌ No'}\n\n`
  }
  
  output += '='.repeat(80) + '\n'
  
  return output
}
