/**
 * Optimization Decision Storage
 * 
 * Stores and retrieves optimization decisions for auto-optimization.
 * Uses in-memory cache for development, ready for database integration.
 */

import type { OptimizationDecision } from './auto-optimization'
import type { AIRole } from './role-prompts'
import type { ResponseType } from './role-ab-testing'

// In-memory cache (in production, replace with database/Redis)
const optimizationCache = new Map<string, OptimizationDecision & { updatedAt: string }>()

/**
 * Generate cache key for optimization decision
 */
function getCacheKey(role: AIRole, responseType: ResponseType): string {
  return `${role}:${responseType}`
}

/**
 * Store optimization decision
 */
export function storeOptimizationDecision(
  role: AIRole,
  responseType: ResponseType,
  decision: OptimizationDecision
): void {
  const key = getCacheKey(role, responseType)
  optimizationCache.set(key, {
    ...decision,
    updatedAt: new Date().toISOString(),
  })
  
  // In production: Store in database
  // await db.optimizationDecisions.upsert({ role, responseType, decision })
  
  console.log(JSON.stringify({
    type: 'optimization_decision_stored',
    role,
    responseType,
    decision: {
      shouldSwitch: decision.shouldSwitch,
      recommendedVariant: decision.recommendedVariant,
      reason: decision.reason,
      confidence: decision.confidence,
    },
    timestamp: new Date().toISOString(),
  }))
}

/**
 * Load optimization decision
 */
export async function loadOptimizationDecision(
  role: AIRole,
  responseType: ResponseType
): Promise<OptimizationDecision | null> {
  const key = getCacheKey(role, responseType)
  const cached = optimizationCache.get(key)
  
  if (cached) {
    // Remove updatedAt before returning
    const { updatedAt, ...decision } = cached
    return decision
  }
  
  // In production: Load from database
  // const decision = await db.optimizationDecisions.findOne({ role, responseType })
  // return decision || null
  
  return null
}

/**
 * Clear optimization decision (for testing or reset)
 */
export function clearOptimizationDecision(
  role: AIRole,
  responseType: ResponseType
): void {
  const key = getCacheKey(role, responseType)
  optimizationCache.delete(key)
}

/**
 * Get all optimization decisions (for monitoring)
 */
export function getAllOptimizationDecisions(): Array<{
  role: AIRole
  responseType: ResponseType
  decision: OptimizationDecision
  updatedAt: string
}> {
  const decisions: Array<{
    role: AIRole
    responseType: ResponseType
    decision: OptimizationDecision
    updatedAt: string
  }> = []
  
  // Convert Map entries to array for iteration
  const entries = Array.from(optimizationCache.entries())
  for (const [key, value] of entries) {
    const [role, responseType] = key.split(':') as [AIRole, ResponseType]
    const { updatedAt, ...decision } = value
    decisions.push({
      role,
      responseType,
      decision,
      updatedAt,
    })
  }
  
  return decisions
}
