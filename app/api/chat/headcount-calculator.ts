/**
 * AI Headcount Planning Calculator
 * 
 * Calculates AI and human headcount by phase, conversation volume, and coverage.
 */

// ============================================================================
// TYPES
// ============================================================================

export type Phase = 'pilot' | 'scale' | 'optimize' | 'transform' | 'mature'

export type AIRoleType = 'SALES' | 'SUPPORT' | 'OPS'

export interface PhaseConfig {
  phase: Phase
  aiCoverage: {
    min: number // Percentage (0.10 = 10%)
    max: number // Percentage (0.95 = 95%)
  }
  conversationsPerAIFTE: {
    min: number
    max: number
  }
  conversationsPerHumanFTE: {
    min: number
    max: number
  }
  successCriteria: {
    conversionRate: number // Minimum (0.10 = 10%)
    responseAccuracy: number // Minimum (0.80 = 80%)
    workloadReduction?: number // Minimum (0.30 = 30%)
    roi?: number // Minimum (2000 = 2000%)
  }
}

export interface HeadcountPlan {
  phase: Phase
  monthlyConversations: number
  aiHeadcount: {
    sales: number
    support: number
    ops: number
    total: number
  }
  humanHeadcount: {
    sales: number
    support: number
    ops: number
    total: number
  }
  ratios: {
    sales: { ai: number; human: number; ratio: string }
    support: { ai: number; human: number; ratio: string }
    ops: { ai: number; human: number; ratio: string }
  }
  aiCoverage: {
    sales: number // Percentage
    support: number // Percentage
  }
}

export interface TransitionPlan {
  fromPhase: Phase
  toPhase: Phase
  currentMetrics: {
    aiCoverage: number
    conversionRate: number
    responseAccuracy: number
    workloadReduction?: number
    roi?: number
  }
  ready: boolean
  missingCriteria: string[]
  timeline: string
  actions: string[]
}

// ============================================================================
// PHASE CONFIGURATIONS
// ============================================================================

export const PHASE_CONFIGS: Record<Phase, PhaseConfig> = {
  pilot: {
    phase: 'pilot',
    aiCoverage: { min: 0.10, max: 0.20 },
    conversationsPerAIFTE: { min: 500, max: 1000 },
    conversationsPerHumanFTE: { min: 50, max: 100 },
    successCriteria: {
      conversionRate: 0.10,
      responseAccuracy: 0.80,
    },
  },
  scale: {
    phase: 'scale',
    aiCoverage: { min: 0.50, max: 0.70 },
    conversationsPerAIFTE: { min: 500, max: 1000 },
    conversationsPerHumanFTE: { min: 50, max: 100 },
    successCriteria: {
      conversionRate: 0.15,
      responseAccuracy: 0.85,
      workloadReduction: 0.30,
    },
  },
  optimize: {
    phase: 'optimize',
    aiCoverage: { min: 0.70, max: 0.85 },
    conversationsPerAIFTE: { min: 500, max: 1000 },
    conversationsPerHumanFTE: { min: 50, max: 100 },
    successCriteria: {
      conversionRate: 0.20,
      responseAccuracy: 0.90,
      workloadReduction: 0.50,
      roi: 2000,
    },
  },
  transform: {
    phase: 'transform',
    aiCoverage: { min: 0.85, max: 0.95 },
    conversationsPerAIFTE: { min: 500, max: 1000 },
    conversationsPerHumanFTE: { min: 50, max: 100 },
    successCriteria: {
      conversionRate: 0.25,
      responseAccuracy: 0.95,
      workloadReduction: 0.70,
      roi: 3000,
    },
  },
  mature: {
    phase: 'mature',
    aiCoverage: { min: 0.95, max: 0.99 },
    conversationsPerAIFTE: { min: 500, max: 1000 },
    conversationsPerHumanFTE: { min: 50, max: 100 },
    successCriteria: {
      conversionRate: 0.30,
      responseAccuracy: 0.98,
      workloadReduction: 0.80,
      roi: 4000,
    },
  },
}

// ============================================================================
// HEADCOUNT CALCULATION
// ============================================================================

/**
 * Calculate AI headcount for a role
 */
export function calculateAIHeadcount(
  monthlyConversations: number,
  aiCoverage: number, // 0-1
  conversationsPerAIFTE: number
): number {
  const aiConversations = monthlyConversations * aiCoverage
  return Math.max(0.1, aiConversations / conversationsPerAIFTE) // Minimum 0.1 FTE
}

/**
 * Calculate human headcount for a role
 */
export function calculateHumanHeadcount(
  monthlyConversations: number,
  aiCoverage: number, // 0-1
  conversationsPerHumanFTE: number
): number {
  const humanConversations = monthlyConversations * (1 - aiCoverage)
  return Math.max(1, humanConversations / conversationsPerHumanFTE) // Minimum 1 FTE
}

/**
 * Calculate AI Ops headcount
 */
export function calculateAIOpsHeadcount(
  phase: Phase,
  systemComplexity: number = 5 // 1-10 scale
): number {
  const opsByPhase: Record<Phase, number> = {
    pilot: 0.1,
    scale: 0.25,
    optimize: 0.4,
    transform: 0.75,
    mature: 1.5,
  }
  
  const baseOps = opsByPhase[phase]
  return baseOps * (systemComplexity / 5) // Scale by complexity
}

/**
 * Calculate human Ops headcount
 */
export function calculateHumanOpsHeadcount(
  phase: Phase,
  systemComplexity: number = 5 // 1-10 scale
): number {
  const opsByPhase: Record<Phase, number> = {
    pilot: 1.5,
    scale: 2.5,
    optimize: 4,
    transform: 7.5,
    mature: 15,
  }
  
  const baseOps = opsByPhase[phase]
  return baseOps * (systemComplexity / 5) // Scale by complexity
}

/**
 * Generate headcount plan for a phase
 */
export function generateHeadcountPlan(
  phase: Phase,
  monthlyConversations: number,
  aiCoverage?: number // Optional, uses phase default if not provided
): HeadcountPlan {
  const config = PHASE_CONFIGS[phase]
  
  // Use provided coverage or phase average
  const coverage = aiCoverage ?? (config.aiCoverage.min + config.aiCoverage.max) / 2
  
  // Use average conversations per FTE
  const avgConversationsPerAIFTE = (config.conversationsPerAIFTE.min + config.conversationsPerAIFTE.max) / 2
  const avgConversationsPerHumanFTE = (config.conversationsPerHumanFTE.min + config.conversationsPerHumanFTE.max) / 2
  
  // Calculate AI headcount
  const aiSales = calculateAIHeadcount(monthlyConversations, coverage, avgConversationsPerAIFTE)
  const aiSupport = calculateAIHeadcount(monthlyConversations, coverage, avgConversationsPerAIFTE)
  const aiOps = calculateAIOpsHeadcount(phase)
  const aiTotal = aiSales + aiSupport + aiOps
  
  // Calculate human headcount
  const humanSales = calculateHumanHeadcount(monthlyConversations, coverage, avgConversationsPerHumanFTE)
  const humanSupport = calculateHumanHeadcount(monthlyConversations, coverage, avgConversationsPerHumanFTE)
  const humanOps = calculateHumanOpsHeadcount(phase)
  const humanTotal = humanSales + humanSupport + humanOps
  
  // Calculate ratios
  const salesRatio = formatRatio(aiSales, humanSales)
  const supportRatio = formatRatio(aiSupport, humanSupport)
  const opsRatio = formatRatio(aiOps, humanOps)
  
  return {
    phase,
    monthlyConversations,
    aiHeadcount: {
      sales: Math.round(aiSales * 10) / 10,
      support: Math.round(aiSupport * 10) / 10,
      ops: Math.round(aiOps * 10) / 10,
      total: Math.round(aiTotal * 10) / 10,
    },
    humanHeadcount: {
      sales: Math.round(humanSales * 10) / 10,
      support: Math.round(humanSupport * 10) / 10,
      ops: Math.round(humanOps * 10) / 10,
      total: Math.round(humanTotal * 10) / 10,
    },
    ratios: {
      sales: { ai: aiSales, human: humanSales, ratio: salesRatio },
      support: { ai: aiSupport, human: humanSupport, ratio: supportRatio },
      ops: { ai: aiOps, human: humanOps, ratio: opsRatio },
    },
    aiCoverage: {
      sales: coverage * 100,
      support: coverage * 100,
    },
  }
}

/**
 * Format ratio as string (e.g., "1:5")
 */
function formatRatio(ai: number, human: number): string {
  if (human === 0) return 'N/A'
  const ratio = ai / human
  return `1:${(human / ai).toFixed(1)}`
}

// ============================================================================
// TRANSITION PLANNING
// ============================================================================

/**
 * Check if ready to transition to next phase
 */
export function checkTransitionReadiness(
  fromPhase: Phase,
  toPhase: Phase,
  currentMetrics: {
    aiCoverage: number
    conversionRate: number
    responseAccuracy: number
    workloadReduction?: number
    roi?: number
  }
): TransitionPlan {
  const toConfig = PHASE_CONFIGS[toPhase]
  const missingCriteria: string[] = []
  
  // Check AI coverage
  if (currentMetrics.aiCoverage < toConfig.aiCoverage.min) {
    missingCriteria.push(`AI coverage ${(currentMetrics.aiCoverage * 100).toFixed(0)}% < ${(toConfig.aiCoverage.min * 100).toFixed(0)}%`)
  }
  
  // Check conversion rate
  if (currentMetrics.conversionRate < toConfig.successCriteria.conversionRate) {
    missingCriteria.push(`Conversion rate ${(currentMetrics.conversionRate * 100).toFixed(0)}% < ${(toConfig.successCriteria.conversionRate * 100).toFixed(0)}%`)
  }
  
  // Check response accuracy
  if (currentMetrics.responseAccuracy < toConfig.successCriteria.responseAccuracy) {
    missingCriteria.push(`Response accuracy ${(currentMetrics.responseAccuracy * 100).toFixed(0)}% < ${(toConfig.successCriteria.responseAccuracy * 100).toFixed(0)}%`)
  }
  
  // Check workload reduction (if required)
  if (toConfig.successCriteria.workloadReduction && currentMetrics.workloadReduction) {
    if (currentMetrics.workloadReduction < toConfig.successCriteria.workloadReduction) {
      missingCriteria.push(`Workload reduction ${(currentMetrics.workloadReduction * 100).toFixed(0)}% < ${(toConfig.successCriteria.workloadReduction * 100).toFixed(0)}%`)
    }
  }
  
  // Check ROI (if required)
  if (toConfig.successCriteria.roi && currentMetrics.roi) {
    if (currentMetrics.roi < toConfig.successCriteria.roi) {
      missingCriteria.push(`ROI ${currentMetrics.roi}% < ${toConfig.successCriteria.roi}%`)
    }
  }
  
  const ready = missingCriteria.length === 0
  
  // Determine timeline
  const timeline = getTransitionTimeline(fromPhase, toPhase)
  
  // Determine actions
  const actions = getTransitionActions(fromPhase, toPhase)
  
  return {
    fromPhase,
    toPhase,
    currentMetrics,
    ready,
    missingCriteria,
    timeline,
    actions,
  }
}

/**
 * Get transition timeline
 */
function getTransitionTimeline(fromPhase: Phase, toPhase: Phase): string {
  const timelines: Record<string, string> = {
    'pilot-scale': '3-6 months',
    'scale-optimize': '6-12 months',
    'optimize-transform': '12-18 months',
    'transform-mature': '18-24 months',
  }
  
  const key = `${fromPhase}-${toPhase}`
  return timelines[key] || '3-6 months'
}

/**
 * Get transition actions
 */
function getTransitionActions(fromPhase: Phase, toPhase: Phase): string[] {
  const actions: Record<string, string[]> = {
    'pilot-scale': [
      'Increase AI conversation allocation to 50-70%',
      'Expand knowledge base',
      'Implement automated monitoring',
      'Train human team on handoff best practices',
      'Set up regular performance reviews',
    ],
    'scale-optimize': [
      'Increase AI conversation allocation to 70-85%',
      'Implement A/B testing',
      'Advanced analytics and optimization',
      'Continuous improvement processes',
      'Human team focuses on high-value activities',
    ],
    'optimize-transform': [
      'Increase AI conversation allocation to 85-95%',
      'Implement predictive analytics',
      'Advanced personalization',
      'Strategic initiatives',
      'Human team restructured for high-value activities',
    ],
    'transform-mature': [
      'Increase AI conversation allocation to 95%+',
      'Implement AI governance',
      'Innovation and new capabilities',
      'Strategic partnerships',
      'Continuous improvement culture',
    ],
  }
  
  const key = `${fromPhase}-${toPhase}`
  return actions[key] || []
}

// ============================================================================
// FORMATTING
// ============================================================================

/**
 * Format headcount plan for display
 */
export function formatHeadcountPlan(plan: HeadcountPlan): string {
  let output = '\n'
  output += '='.repeat(80) + '\n'
  output += `AI HEADCOUNT PLAN - ${plan.phase.toUpperCase()} PHASE\n`
  output += '='.repeat(80) + '\n\n'
  
  output += `Monthly Conversations: ${plan.monthlyConversations.toLocaleString('th-TH')}\n`
  output += `AI Coverage: ${plan.aiCoverage.sales.toFixed(0)}%\n\n`
  
  output += 'AI HEADCOUNT\n'
  output += '-'.repeat(80) + '\n'
  output += `Sales: ${plan.aiHeadcount.sales.toFixed(1)} FTE\n`
  output += `Support: ${plan.aiHeadcount.support.toFixed(1)} FTE\n`
  output += `Operations: ${plan.aiHeadcount.ops.toFixed(1)} FTE\n`
  output += `TOTAL: ${plan.aiHeadcount.total.toFixed(1)} FTE\n\n`
  
  output += 'HUMAN HEADCOUNT\n'
  output += '-'.repeat(80) + '\n'
  output += `Sales: ${plan.humanHeadcount.sales.toFixed(1)} FTE\n`
  output += `Support: ${plan.humanHeadcount.support.toFixed(1)} FTE\n`
  output += `Operations: ${plan.humanHeadcount.ops.toFixed(1)} FTE\n`
  output += `TOTAL: ${plan.humanHeadcount.total.toFixed(1)} FTE\n\n`
  
  output += 'AI-TO-HUMAN RATIOS\n'
  output += '-'.repeat(80) + '\n'
  output += `Sales: ${plan.ratios.sales.ratio} (${plan.ratios.sales.ai.toFixed(1)} AI : ${plan.ratios.sales.human.toFixed(1)} Human)\n`
  output += `Support: ${plan.ratios.support.ratio} (${plan.ratios.support.ai.toFixed(1)} AI : ${plan.ratios.support.human.toFixed(1)} Human)\n`
  output += `Operations: ${plan.ratios.ops.ratio} (${plan.ratios.ops.ai.toFixed(1)} AI : ${plan.ratios.ops.human.toFixed(1)} Human)\n`
  
  output += '='.repeat(80) + '\n'
  
  return output
}

/**
 * Format transition plan for display
 */
export function formatTransitionPlan(plan: TransitionPlan): string {
  let output = '\n'
  output += '='.repeat(80) + '\n'
  output += `TRANSITION PLAN: ${plan.fromPhase.toUpperCase()} → ${plan.toPhase.toUpperCase()}\n`
  output += '='.repeat(80) + '\n\n'
  
  output += `Status: ${plan.ready ? '✅ READY' : '⚠️ NOT READY'}\n`
  output += `Timeline: ${plan.timeline}\n\n`
  
  if (plan.missingCriteria.length > 0) {
    output += 'MISSING CRITERIA:\n'
    output += '-'.repeat(80) + '\n'
    plan.missingCriteria.forEach(criteria => {
      output += `❌ ${criteria}\n`
    })
    output += '\n'
  }
  
  output += 'TRANSITION ACTIONS:\n'
  output += '-'.repeat(80) + '\n'
  plan.actions.forEach((action, index) => {
    output += `${index + 1}. ${action}\n`
  })
  
  output += '='.repeat(80) + '\n'
  
  return output
}
