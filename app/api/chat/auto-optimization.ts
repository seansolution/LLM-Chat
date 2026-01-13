/**
 * Auto-Optimization System
 * 
 * Level 4 capability: Automatic variant selection based on performance metrics
 * Automatically switches to winning variant when statistically significant
 */

import type { AIRole } from './role-prompts'
import type { ResponseType } from './role-ab-testing'
import type { RoleABTestResult } from './role-ab-testing'
import { calculateRoleStatisticalSignificance } from './role-ab-testing'
import type { UserFeedback } from './feedback'
import { calculateFeedbackMetrics } from './feedback'

export interface OptimizationConfig {
  minSampleSize: number // Minimum responses before auto-optimization (default: 100)
  significanceThreshold: number // p-value threshold (default: 0.05)
  minLift: number // Minimum lift % to switch (default: 5%)
  primaryMetric: 'contactRate' | 'conversionRate' | 'positiveFeedback' // Primary metric for optimization
  enableAutoSwitch: boolean // Enable automatic variant switching (default: true)
}

const DEFAULT_CONFIG: OptimizationConfig = {
  minSampleSize: 100,
  significanceThreshold: 0.05,
  minLift: 5,
  primaryMetric: 'contactRate',
  enableAutoSwitch: true,
}

export interface OptimizationDecision {
  shouldSwitch: boolean
  currentVariant: 'A' | 'B'
  recommendedVariant: 'A' | 'B' | null
  reason: string
  confidence: number // 0-1
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
  statisticalSignificance: {
    contactRate: { pValue: number; isSignificant: boolean; winner: 'A' | 'B' | null; lift: number }
    conversionRate: { pValue: number; isSignificant: boolean; winner: 'A' | 'B' | null; lift: number }
  }
}

/**
 * Determine optimal variant based on A/B test results and feedback
 */
export function determineOptimalVariant(
  variantA: RoleABTestResult,
  variantB: RoleABTestResult,
  feedbacks: UserFeedback[],
  config: Partial<OptimizationConfig> = {}
): OptimizationDecision {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }
  
  // Calculate feedback metrics (only for testable response types)
  const testableResponseType = variantA.responseType === 'pricing' || variantA.responseType === 'overview' || variantA.responseType === 'greeting'
    ? variantA.responseType as 'pricing' | 'overview' | 'greeting'
    : 'pricing' // fallback
  
  const feedbackA = calculateFeedbackMetrics(
    feedbacks,
    'A',
    variantA.role,
    testableResponseType
  )
  const feedbackB = calculateFeedbackMetrics(
    feedbacks,
    'B',
    variantB.role,
    testableResponseType
  )
  
  // Check minimum sample size
  const totalResponses = variantA.totalResponses + variantB.totalResponses
  if (totalResponses < finalConfig.minSampleSize) {
    return {
      shouldSwitch: false,
      currentVariant: 'A', // Default
      recommendedVariant: null,
      reason: `Insufficient sample size: ${totalResponses} < ${finalConfig.minSampleSize}`,
      confidence: 0,
      metrics: {
        variantA: {
          contactRate: variantA.contactRate,
          conversionRate: variantA.conversionRate,
          positiveFeedback: feedbackA.positiveRate,
        },
        variantB: {
          contactRate: variantB.contactRate,
          conversionRate: variantB.conversionRate,
          positiveFeedback: feedbackB.positiveRate,
        },
      },
      statisticalSignificance: {
        contactRate: calculateRoleStatisticalSignificance(variantA, variantB, 'contactRate'),
        conversionRate: calculateRoleStatisticalSignificance(variantA, variantB, 'conversionRate'),
      },
    }
  }
  
  // Calculate statistical significance
  const contactSignificance = calculateRoleStatisticalSignificance(variantA, variantB, 'contactRate')
  const conversionSignificance = calculateRoleStatisticalSignificance(variantA, variantB, 'conversionRate')
  
  // Determine winner based on primary metric
  let winner: 'A' | 'B' | null = null
  let shouldSwitch = false
  let reason = ''
  let confidence = 0
  
  if (finalConfig.primaryMetric === 'contactRate') {
    if (contactSignificance.isSignificant && contactSignificance.winner) {
      winner = contactSignificance.winner
      const lift = Math.abs(contactSignificance.lift)
      if (lift >= finalConfig.minLift) {
        shouldSwitch = finalConfig.enableAutoSwitch
        reason = `Variant ${winner} has ${lift.toFixed(1)}% higher contact rate (p < ${finalConfig.significanceThreshold})`
        confidence = 1 - contactSignificance.pValue
      } else {
        reason = `Variant ${winner} wins but lift (${lift.toFixed(1)}%) is below threshold (${finalConfig.minLift}%)`
      }
    } else {
      reason = 'No statistically significant difference in contact rate'
    }
  } else if (finalConfig.primaryMetric === 'conversionRate') {
    if (conversionSignificance.isSignificant && conversionSignificance.winner) {
      winner = conversionSignificance.winner
      const lift = Math.abs(conversionSignificance.lift)
      if (lift >= finalConfig.minLift) {
        shouldSwitch = finalConfig.enableAutoSwitch
        reason = `Variant ${winner} has ${lift.toFixed(1)}% higher conversion rate (p < ${finalConfig.significanceThreshold})`
        confidence = 1 - conversionSignificance.pValue
      } else {
        reason = `Variant ${winner} wins but lift (${lift.toFixed(1)}%) is below threshold (${finalConfig.minLift}%)`
      }
    } else {
      reason = 'No statistically significant difference in conversion rate'
    }
  } else if (finalConfig.primaryMetric === 'positiveFeedback') {
    const feedbackDiff = feedbackB.positiveRate - feedbackA.positiveRate
    if (Math.abs(feedbackDiff) >= finalConfig.minLift) {
      winner = feedbackDiff > 0 ? 'B' : 'A'
      shouldSwitch = finalConfig.enableAutoSwitch
      reason = `Variant ${winner} has ${Math.abs(feedbackDiff).toFixed(1)}% higher positive feedback rate`
      confidence = Math.min(0.9, Math.abs(feedbackDiff) / 50) // Simplified confidence
    } else {
      reason = 'No significant difference in feedback'
    }
  }
  
  return {
    shouldSwitch,
    currentVariant: 'A', // Would be tracked in production
    recommendedVariant: winner,
    reason,
    confidence,
    metrics: {
      variantA: {
        contactRate: variantA.contactRate,
        conversionRate: variantA.conversionRate,
        positiveFeedback: feedbackA.positiveRate,
      },
      variantB: {
        contactRate: variantB.contactRate,
        conversionRate: variantB.conversionRate,
        positiveFeedback: feedbackB.positiveRate,
      },
    },
    statisticalSignificance: {
      contactRate: contactSignificance,
      conversionRate: conversionSignificance,
    },
  }
}

/**
 * Get optimized variant for a user (uses winning variant if available)
 * Falls back to deterministic assignment if no winner yet
 */
export async function getOptimizedVariant(
  userId: string,
  role: AIRole,
  responseType: 'pricing' | 'overview' | 'greeting',
  optimizationDecision: OptimizationDecision | null
): Promise<'A' | 'B'> {
  // If optimization recommends a switch and it's enabled, use recommended variant
  if (optimizationDecision?.shouldSwitch && optimizationDecision.recommendedVariant) {
    return optimizationDecision.recommendedVariant
  }
  
  // Otherwise, use deterministic assignment (existing behavior)
  const { assignVariant } = await import('./role-ab-testing')
  return assignVariant(userId, role, responseType)
}
