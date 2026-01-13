/**
 * Annual AI Budget Calculator
 * 
 * Calculates annual budget, tracks spending, and monitors guardrails.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface BudgetCategory {
  name: string
  monthly: number
  annual: number
  type: 'fixed' | 'variable'
  guardrail?: {
    maxMonthlyIncrease: number // Percentage (0.10 = 10%)
    maxAnnual: number
    approvalThreshold: number // THB
  }
}

export interface BudgetPlan {
  year: number
  categories: BudgetCategory[]
  totalMonthly: number
  totalAnnual: number
  oneTimeCosts?: number
  totalYear1?: number
}

export interface BudgetVariance {
  category: string
  budgeted: number
  actual: number
  variance: number // THB
  variancePercent: number // Percentage
  status: 'on_track' | 'review' | 'action_required'
}

export interface BudgetReport {
  plan: BudgetPlan
  actuals: Record<string, number>
  variances: BudgetVariance[]
  totalVariance: number
  totalVariancePercent: number
  roi?: {
    expected: number
    actual?: number
  }
  guardrailCompliance: {
    compliant: boolean
    violations: Array<{
      category: string
      violation: string
    }>
  }
}

export interface ROITargets {
  roi: number // Percentage (2000 = 2000%)
  paybackPeriodMonths: number
  costPerConversation: number
  costPerConversion: number
  valuePerConversation: number
}

// ============================================================================
// BUDGET CALCULATION
// ============================================================================

/**
 * Create annual budget plan
 */
export function createBudgetPlan(year: number): BudgetPlan {
  const categories: BudgetCategory[] = [
    {
      name: 'Infrastructure',
      monthly: 8000,
      annual: 96000,
      type: 'fixed',
      guardrail: {
        maxMonthlyIncrease: 0.10, // 10%
        maxAnnual: 120000,
        approvalThreshold: 10000,
      },
    },
    {
      name: 'Software',
      monthly: 4500,
      annual: 54000,
      type: 'fixed',
      guardrail: {
        maxMonthlyIncrease: 0.15, // 15%
        maxAnnual: 72000,
        approvalThreshold: 10000,
      },
    },
    {
      name: 'Development',
      monthly: 50000,
      annual: 600000,
      type: 'variable',
      guardrail: {
        maxMonthlyIncrease: 0.25, // 25%
        maxAnnual: 900000,
        approvalThreshold: 50000,
      },
    },
    {
      name: 'Operations',
      monthly: 77500,
      annual: 930000,
      type: 'fixed',
      guardrail: {
        maxMonthlyIncrease: 0.10, // 10%
        maxAnnual: 1200000,
        approvalThreshold: 100000,
      },
    },
    {
      name: 'Overhead',
      monthly: 7000,
      annual: 84000,
      type: 'fixed',
      guardrail: {
        maxMonthlyIncrease: 0.20, // 20%
        maxAnnual: 120000,
        approvalThreshold: 10000,
      },
    },
  ]

  const totalMonthly = categories.reduce((sum, cat) => sum + cat.monthly, 0)
  const totalAnnual = categories.reduce((sum, cat) => sum + cat.annual, 0)

  return {
    year,
    categories,
    totalMonthly,
    totalAnnual,
  }
}

/**
 * Create Year 1 budget (including initial development)
 */
export function createYear1Budget(year: number): BudgetPlan {
  const basePlan = createBudgetPlan(year)
  const oneTimeCosts = 340000 // Initial development

  return {
    ...basePlan,
    oneTimeCosts,
    totalYear1: basePlan.totalAnnual + oneTimeCosts,
  }
}

// ============================================================================
// BUDGET TRACKING
// ============================================================================

/**
 * Calculate budget variance
 */
export function calculateVariance(
  budgeted: number,
  actual: number
): { variance: number; variancePercent: number; status: BudgetVariance['status'] } {
  const variance = actual - budgeted
  const variancePercent = budgeted > 0 ? (variance / budgeted) * 100 : 0

  let status: BudgetVariance['status']
  if (Math.abs(variancePercent) < 5) {
    status = 'on_track'
  } else if (Math.abs(variancePercent) < 15) {
    status = 'review'
  } else {
    status = 'action_required'
  }

  return { variance, variancePercent, status }
}

/**
 * Generate budget report
 */
export function generateBudgetReport(
  plan: BudgetPlan,
  actuals: Record<string, number>
): BudgetReport {
  const variances: BudgetVariance[] = plan.categories.map(cat => {
    const actual = actuals[cat.name] || 0
    const { variance, variancePercent, status } = calculateVariance(cat.annual, actual)

    return {
      category: cat.name,
      budgeted: cat.annual,
      actual,
      variance,
      variancePercent,
      status,
    }
  })

  const totalActual = Object.values(actuals).reduce((sum, val) => sum + val, 0)
  const { variance: totalVariance, variancePercent: totalVariancePercent } = calculateVariance(
    plan.totalAnnual,
    totalActual
  )

  // Check guardrail compliance
  const violations: Array<{ category: string; violation: string }> = []
  plan.categories.forEach(cat => {
    const actual = actuals[cat.name] || 0
    const guardrail = cat.guardrail

    if (guardrail) {
      // Check annual limit
      if (actual > guardrail.maxAnnual) {
        violations.push({
          category: cat.name,
          violation: `Exceeded annual limit: ${actual.toLocaleString('th-TH')} > ${guardrail.maxAnnual.toLocaleString('th-TH')} THB`,
        })
      }

      // Check monthly increase (if applicable)
      const monthlyActual = actual / 12
      const maxMonthly = cat.monthly * (1 + guardrail.maxMonthlyIncrease)
      if (monthlyActual > maxMonthly) {
        violations.push({
          category: cat.name,
          violation: `Exceeded monthly increase limit: ${monthlyActual.toLocaleString('th-TH')} > ${maxMonthly.toLocaleString('th-TH')} THB`,
        })
      }
    }
  })

  return {
    plan,
    actuals,
    variances,
    totalVariance,
    totalVariancePercent,
    guardrailCompliance: {
      compliant: violations.length === 0,
      violations,
    },
  }
}

// ============================================================================
// GUARDRAIL CHECKS
// ============================================================================

/**
 * Check if spending requires approval
 */
export function requiresApproval(
  category: BudgetCategory,
  proposedAmount: number,
  currentSpending: number = 0
): {
  requiresApproval: boolean
  approvalLevel: 'manager' | 'director' | 'executive' | 'none'
  reason?: string
} {
  const guardrail = category.guardrail
  if (!guardrail) {
    return { requiresApproval: false, approvalLevel: 'none' }
  }

  // Check single expense threshold
  if (proposedAmount > guardrail.approvalThreshold) {
    if (proposedAmount > 200000) {
      return {
        requiresApproval: true,
        approvalLevel: 'executive',
        reason: `Single expense exceeds executive approval threshold: ${proposedAmount.toLocaleString('th-TH')} THB`,
      }
    } else if (proposedAmount > 50000) {
      return {
        requiresApproval: true,
        approvalLevel: 'director',
        reason: `Single expense exceeds director approval threshold: ${proposedAmount.toLocaleString('th-TH')} THB`,
      }
    } else {
      return {
        requiresApproval: true,
        approvalLevel: 'manager',
        reason: `Single expense exceeds manager approval threshold: ${proposedAmount.toLocaleString('th-TH')} THB`,
      }
    }
  }

  // Check monthly increase
  const currentMonthly = currentSpending / 12
  const proposedMonthly = proposedAmount / 12
  const maxIncrease = currentMonthly * guardrail.maxMonthlyIncrease
  const increase = proposedMonthly - currentMonthly

  if (increase > maxIncrease) {
    return {
      requiresApproval: true,
      approvalLevel: increase > maxIncrease * 2 ? 'director' : 'manager',
      reason: `Monthly increase exceeds limit: ${increase.toLocaleString('th-TH')} THB > ${maxIncrease.toLocaleString('th-TH')} THB`,
    }
  }

  // Check annual limit
  if (proposedAmount > guardrail.maxAnnual) {
    return {
      requiresApproval: true,
      approvalLevel: 'executive',
      reason: `Proposed amount exceeds annual limit: ${proposedAmount.toLocaleString('th-TH')} THB > ${guardrail.maxAnnual.toLocaleString('th-TH')} THB`,
    }
  }

  return { requiresApproval: false, approvalLevel: 'none' }
}

// ============================================================================
// ROI TARGETS
// ============================================================================

/**
 * Define ROI targets
 */
export function getROITargets(): ROITargets {
  return {
    roi: 2000, // 2000%
    paybackPeriodMonths: 3,
    costPerConversation: 200,
    costPerConversion: 1500,
    valuePerConversation: 3000,
  }
}

/**
 * Check ROI against targets
 */
export function checkROITargets(
  actualROI: number,
  actualPaybackMonths: number,
  actualCostPerConversation: number,
  actualCostPerConversion: number,
  actualValuePerConversation: number
): {
  roi: { target: number; actual: number; met: boolean }
  paybackPeriod: { target: number; actual: number; met: boolean }
  costPerConversation: { target: number; actual: number; met: boolean }
  costPerConversion: { target: number; actual: number; met: boolean }
  valuePerConversation: { target: number; actual: number; met: boolean }
  overall: 'met' | 'partial' | 'not_met'
} {
  const targets = getROITargets()

  const roi = {
    target: targets.roi,
    actual: actualROI,
    met: actualROI >= targets.roi,
  }

  const paybackPeriod = {
    target: targets.paybackPeriodMonths,
    actual: actualPaybackMonths,
    met: actualPaybackMonths <= targets.paybackPeriodMonths,
  }

  const costPerConversation = {
    target: targets.costPerConversation,
    actual: actualCostPerConversation,
    met: actualCostPerConversation <= targets.costPerConversation,
  }

  const costPerConversion = {
    target: targets.costPerConversion,
    actual: actualCostPerConversion,
    met: actualCostPerConversion <= targets.costPerConversion,
  }

  const valuePerConversation = {
    target: targets.valuePerConversation,
    actual: actualValuePerConversation,
    met: actualValuePerConversation >= targets.valuePerConversation,
  }

  const metCount = [
    roi.met,
    paybackPeriod.met,
    costPerConversation.met,
    costPerConversion.met,
    valuePerConversation.met,
  ].filter(Boolean).length

  let overall: 'met' | 'partial' | 'not_met'
  if (metCount === 5) {
    overall = 'met'
  } else if (metCount >= 3) {
    overall = 'partial'
  } else {
    overall = 'not_met'
  }

  return {
    roi,
    paybackPeriod,
    costPerConversation,
    costPerConversion,
    valuePerConversation,
    overall,
  }
}

// ============================================================================
// FORMATTING
// ============================================================================

/**
 * Format budget plan for display
 */
export function formatBudgetPlan(plan: BudgetPlan): string {
  let output = '\n'
  output += '='.repeat(80) + '\n'
  output += `ANNUAL AI BUDGET PLAN - ${plan.year}\n`
  output += '='.repeat(80) + '\n\n'

  output += 'BUDGET BY CATEGORY\n'
  output += '-'.repeat(80) + '\n'
  output += 'Category'.padEnd(20) + 'Monthly (THB)'.padStart(15) + 'Annual (THB)'.padStart(15) + 'Type'.padStart(10) + '\n'
  output += '-'.repeat(80) + '\n'

  plan.categories.forEach(cat => {
    output += cat.name.padEnd(20) +
      cat.monthly.toLocaleString('th-TH').padStart(15) +
      cat.annual.toLocaleString('th-TH').padStart(15) +
      cat.type.padStart(10) + '\n'
  })

  output += '-'.repeat(80) + '\n'
  output += 'TOTAL'.padEnd(20) +
    plan.totalMonthly.toLocaleString('th-TH').padStart(15) +
    plan.totalAnnual.toLocaleString('th-TH').padStart(15) + '\n'

  if (plan.oneTimeCosts) {
    output += '\nOne-Time Costs: ' + plan.oneTimeCosts.toLocaleString('th-TH') + ' THB\n'
    output += 'Total Year 1: ' + (plan.totalYear1 || 0).toLocaleString('th-TH') + ' THB\n'
  }

  output += '='.repeat(80) + '\n'

  return output
}

/**
 * Format budget report for display
 */
export function formatBudgetReport(report: BudgetReport): string {
  let output = '\n'
  output += '='.repeat(80) + '\n'
  output += 'BUDGET REPORT\n'
  output += '='.repeat(80) + '\n\n'

  output += 'VARIANCE ANALYSIS\n'
  output += '-'.repeat(80) + '\n'
  output += 'Category'.padEnd(20) +
    'Budgeted'.padStart(15) +
    'Actual'.padStart(15) +
    'Variance'.padStart(15) +
    'Status'.padStart(15) + '\n'
  output += '-'.repeat(80) + '\n'

  report.variances.forEach(v => {
    const statusIcon = v.status === 'on_track' ? '✅' : v.status === 'review' ? '⚠️' : '❌'
    output += v.category.padEnd(20) +
      v.budgeted.toLocaleString('th-TH').padStart(15) +
      v.actual.toLocaleString('th-TH').padStart(15) +
      `${v.variance > 0 ? '+' : ''}${v.variance.toLocaleString('th-TH')} (${v.variancePercent > 0 ? '+' : ''}${v.variancePercent.toFixed(1)}%)`.padStart(15) +
      `${statusIcon} ${v.status}`.padStart(15) + '\n'
  })

  output += '-'.repeat(80) + '\n'
  const totalStatusIcon = Math.abs(report.totalVariancePercent) < 5 ? '✅' : Math.abs(report.totalVariancePercent) < 15 ? '⚠️' : '❌'
  output += 'TOTAL'.padEnd(20) +
    report.plan.totalAnnual.toLocaleString('th-TH').padStart(15) +
    Object.values(report.actuals).reduce((sum, val) => sum + val, 0).toLocaleString('th-TH').padStart(15) +
    `${report.totalVariance > 0 ? '+' : ''}${report.totalVariance.toLocaleString('th-TH')} (${report.totalVariancePercent > 0 ? '+' : ''}${report.totalVariancePercent.toFixed(1)}%)`.padStart(15) +
    `${totalStatusIcon}`.padStart(15) + '\n'

  if (report.guardrailCompliance.violations.length > 0) {
    output += '\nGUARDRAIL VIOLATIONS\n'
    output += '-'.repeat(80) + '\n'
    report.guardrailCompliance.violations.forEach(v => {
      output += `❌ ${v.category}: ${v.violation}\n`
    })
  } else {
    output += '\n✅ All guardrails compliant\n'
  }

  output += '='.repeat(80) + '\n'

  return output
}
