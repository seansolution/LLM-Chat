/**
 * AI Compensation Model Calculator
 * 
 * Calculates cost vs value, ROI, and key metrics for AI system.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface CostComponents {
  infrastructure: {
    monthly: number
  }
  software: {
    monthly: number
  }
  development: {
    initial: number
    monthly: number
  }
  operations: {
    monthly: number
  }
  overhead: {
    monthly: number
  }
}

export interface ValueComponents {
  revenue: {
    monthlyConversations: number
    conversionRate: number // 0-1
    averageDealValue: number
  }
  revenueGrowth: {
    newCustomers: number
    upsell: number
    retention: number
  }
  costSavings: {
    labor: number
    operational: number
  }
  efficiency: {
    timeSavings: number
  }
  quality: {
    errorReduction: number
    responseTime: number
    consistency: number
  }
}

export interface CompensationMetrics {
  // Costs
  totalMonthlyCost: number
  totalAnnualCost: number
  totalYear1Cost: number
  
  // Value
  totalMonthlyValue: number
  totalAnnualValue: number
  
  // Metrics
  roi: number // Percentage
  paybackPeriodMonths: number
  costPerConversation: number
  costPerConversion: number
  valuePerConversation: number
  netValuePerConversation: number
  
  // Break-even
  breakEvenConversations: number
  breakEvenConversionRate: number // 0-1
  breakEvenDealValue: number
}

// ============================================================================
// CALCULATION FUNCTIONS
// ============================================================================

/**
 * Calculate total monthly cost
 */
export function calculateMonthlyCost(costs: CostComponents): number {
  return (
    costs.infrastructure.monthly +
    costs.software.monthly +
    costs.development.monthly +
    costs.operations.monthly +
    costs.overhead.monthly
  )
}

/**
 * Calculate total annual cost (ongoing)
 */
export function calculateAnnualCost(costs: CostComponents): number {
  return calculateMonthlyCost(costs) * 12
}

/**
 * Calculate total Year 1 cost (including initial development)
 */
export function calculateYear1Cost(costs: CostComponents): number {
  return costs.development.initial + calculateAnnualCost(costs)
}

/**
 * Calculate monthly revenue
 */
export function calculateMonthlyRevenue(value: ValueComponents): number {
  const conversions = value.revenue.monthlyConversations * value.revenue.conversionRate
  return conversions * value.revenue.averageDealValue
}

/**
 * Calculate total monthly value
 */
export function calculateMonthlyValue(value: ValueComponents): number {
  const revenue = calculateMonthlyRevenue(value)
  const revenueGrowth = value.revenueGrowth.newCustomers + value.revenueGrowth.upsell + value.revenueGrowth.retention
  const costSavings = value.costSavings.labor + value.costSavings.operational
  const efficiency = value.efficiency.timeSavings
  const quality = value.quality.errorReduction + value.quality.responseTime + value.quality.consistency
  
  return revenue + revenueGrowth + costSavings + efficiency + quality
}

/**
 * Calculate ROI
 */
export function calculateROI(totalValue: number, totalCost: number): number {
  if (totalCost === 0) return Infinity
  return ((totalValue - totalCost) / totalCost) * 100
}

/**
 * Calculate payback period in months
 */
export function calculatePaybackPeriod(
  initialInvestment: number,
  monthlyNetValue: number
): number {
  if (monthlyNetValue <= 0) return Infinity
  return initialInvestment / monthlyNetValue
}

/**
 * Calculate cost per conversation
 */
export function calculateCostPerConversation(
  monthlyCost: number,
  monthlyConversations: number
): number {
  if (monthlyConversations === 0) return 0
  return monthlyCost / monthlyConversations
}

/**
 * Calculate cost per conversion
 */
export function calculateCostPerConversion(
  monthlyCost: number,
  monthlyConversations: number,
  conversionRate: number
): number {
  const conversions = monthlyConversations * conversionRate
  if (conversions === 0) return 0
  return monthlyCost / conversions
}

/**
 * Calculate value per conversation
 */
export function calculateValuePerConversation(
  monthlyValue: number,
  monthlyConversations: number
): number {
  if (monthlyConversations === 0) return 0
  return monthlyValue / monthlyConversations
}

/**
 * Calculate break-even conversations
 */
export function calculateBreakEvenConversations(
  monthlyCost: number,
  conversionRate: number,
  averageDealValue: number
): number {
  const valuePerConversation = conversionRate * averageDealValue
  if (valuePerConversation === 0) return Infinity
  return monthlyCost / valuePerConversation
}

/**
 * Calculate break-even conversion rate
 */
export function calculateBreakEvenConversionRate(
  monthlyCost: number,
  monthlyConversations: number,
  averageDealValue: number
): number {
  if (monthlyConversations === 0 || averageDealValue === 0) return 0
  return monthlyCost / (monthlyConversations * averageDealValue)
}

/**
 * Calculate break-even deal value
 */
export function calculateBreakEvenDealValue(
  monthlyCost: number,
  monthlyConversations: number,
  conversionRate: number
): number {
  const conversions = monthlyConversations * conversionRate
  if (conversions === 0) return 0
  return monthlyCost / conversions
}

/**
 * Calculate all compensation metrics
 */
export function calculateCompensationMetrics(
  costs: CostComponents,
  value: ValueComponents
): CompensationMetrics {
  const monthlyCost = calculateMonthlyCost(costs)
  const annualCost = calculateAnnualCost(costs)
  const year1Cost = calculateYear1Cost(costs)
  
  const monthlyValue = calculateMonthlyValue(value)
  const annualValue = monthlyValue * 12
  
  const monthlyConversations = value.revenue.monthlyConversations
  const conversionRate = value.revenue.conversionRate
  const averageDealValue = value.revenue.averageDealValue
  
  const roi = calculateROI(annualValue, annualCost)
  const monthlyNetValue = monthlyValue - monthlyCost
  const paybackPeriod = calculatePaybackPeriod(costs.development.initial, monthlyNetValue)
  
  const costPerConversation = calculateCostPerConversation(monthlyCost, monthlyConversations)
  const costPerConversion = calculateCostPerConversion(monthlyCost, monthlyConversations, conversionRate)
  const valuePerConversation = calculateValuePerConversation(monthlyValue, monthlyConversations)
  const netValuePerConversation = valuePerConversation - costPerConversation
  
  const breakEvenConversations = calculateBreakEvenConversations(monthlyCost, conversionRate, averageDealValue)
  const breakEvenConversionRate = calculateBreakEvenConversionRate(monthlyCost, monthlyConversations, averageDealValue)
  const breakEvenDealValue = calculateBreakEvenDealValue(monthlyCost, monthlyConversations, conversionRate)
  
  return {
    totalMonthlyCost: monthlyCost,
    totalAnnualCost: annualCost,
    totalYear1Cost: year1Cost,
    totalMonthlyValue: monthlyValue,
    totalAnnualValue: annualValue,
    roi,
    paybackPeriodMonths: paybackPeriod,
    costPerConversation,
    costPerConversion,
    valuePerConversation,
    netValuePerConversation,
    breakEvenConversations,
    breakEvenConversionRate,
    breakEvenDealValue,
  }
}

// ============================================================================
// EXAMPLE CALCULATIONS
// ============================================================================

/**
 * Example: Year 1 calculation
 */
export function exampleYear1Calculation(): CompensationMetrics {
  const costs: CostComponents = {
    infrastructure: { monthly: 8000 },
    software: { monthly: 4500 },
    development: { initial: 340000, monthly: 50000 },
    operations: { monthly: 77500 },
    overhead: { monthly: 7000 },
  }
  
  const value: ValueComponents = {
    revenue: {
      monthlyConversations: 1000,
      conversionRate: 0.15, // 15%
      averageDealValue: 25000,
    },
    revenueGrowth: {
      newCustomers: 500000,
      upsell: 200000,
      retention: 300000,
    },
    costSavings: {
      labor: 90000,
      operational: 8000,
    },
    efficiency: {
      timeSavings: 147500,
    },
    quality: {
      errorReduction: 10000,
      responseTime: 5000,
      consistency: 5000,
    },
  }
  
  return calculateCompensationMetrics(costs, value)
}

/**
 * Example: Year 2+ calculation (no initial development)
 */
export function exampleYear2Calculation(): CompensationMetrics {
  const costs: CostComponents = {
    infrastructure: { monthly: 8000 },
    software: { monthly: 4500 },
    development: { initial: 0, monthly: 50000 },
    operations: { monthly: 77500 },
    overhead: { monthly: 7000 },
  }
  
  const value: ValueComponents = {
    revenue: {
      monthlyConversations: 1200, // 20% growth
      conversionRate: 0.15, // 15%
      averageDealValue: 25000,
    },
    revenueGrowth: {
      newCustomers: 600000,
      upsell: 240000,
      retention: 360000,
    },
    costSavings: {
      labor: 90000,
      operational: 8000,
    },
    efficiency: {
      timeSavings: 147500,
    },
    quality: {
      errorReduction: 10000,
      responseTime: 5000,
      consistency: 5000,
    },
  }
  
  return calculateCompensationMetrics(costs, value)
}

// ============================================================================
// FORMATTING
// ============================================================================

/**
 * Format metrics for display
 */
export function formatMetrics(metrics: CompensationMetrics): string {
  return `
AI Compensation Metrics
========================

COSTS
-----
Monthly Cost: ${metrics.totalMonthlyCost.toLocaleString('th-TH')} THB
Annual Cost: ${metrics.totalAnnualCost.toLocaleString('th-TH')} THB
Year 1 Cost: ${metrics.totalYear1Cost.toLocaleString('th-TH')} THB

VALUE
-----
Monthly Value: ${metrics.totalMonthlyValue.toLocaleString('th-TH')} THB
Annual Value: ${metrics.totalAnnualValue.toLocaleString('th-TH')} THB

METRICS
-------
ROI: ${metrics.roi.toFixed(2)}%
Payback Period: ${metrics.paybackPeriodMonths.toFixed(2)} months
Cost per Conversation: ${metrics.costPerConversation.toFixed(2)} THB
Cost per Conversion: ${metrics.costPerConversion.toFixed(2)} THB
Value per Conversation: ${metrics.valuePerConversation.toFixed(2)} THB
Net Value per Conversation: ${metrics.netValuePerConversation.toFixed(2)} THB

BREAK-EVEN
----------
Break-Even Conversations: ${metrics.breakEvenConversations.toFixed(0)}/month
Break-Even Conversion Rate: ${(metrics.breakEvenConversionRate * 100).toFixed(2)}%
Break-Even Deal Value: ${metrics.breakEvenDealValue.toFixed(2)} THB
`
}
