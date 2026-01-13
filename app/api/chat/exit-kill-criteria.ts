/**
 * AI Exit & Kill Criteria Checker
 * 
 * Checks if exit or kill criteria are met based on system metrics.
 */

// ============================================================================
// TYPES
// ============================================================================

export type KillCategory = 
  | 'critical_safety'
  | 'privacy_data'
  | 'legal_compliance'
  | 'system_failure'

export type ExitCategory =
  | 'financial_performance'
  | 'quality_performance'
  | 'risk_management'
  | 'business_strategic'

export interface KillCriteria {
  category: KillCategory
  criteria: string
  threshold: number | string | boolean
  measurement: string
  authority: string
  actionTime: string // e.g., "< 5 minutes"
  rollbackAvailable: boolean
}

export interface ExitCriteria {
  category: ExitCategory
  criteria: string
  threshold: number | string | boolean
  measurement: string
  duration: string // e.g., "2 consecutive quarters"
  authority: string
  rollbackAvailable: boolean
}

export interface SystemMetrics {
  // Safety metrics
  forbiddenResponseRate: number // 0-1 (0% = 0, 100% = 1)
  legalAdviceCount: number
  harmfulInfoCount: number
  hallucinatedCriticalInfoCount: number
  
  // Privacy & data metrics
  dataBreachCount: number
  privacyViolationCount: number
  unauthorizedAccessCount: number
  dataLeakageCount: number
  
  // Legal & compliance metrics
  legalViolationCount: number
  regulatoryProhibition: boolean
  complianceFailureCount: number
  courtOrder: boolean
  
  // System metrics
  systemUptime: number // 0-1 (90% = 0.9)
  errorRate: number // 0-1 (10% = 0.1)
  averageResponseTime: number // milliseconds
  dataLossCount: number
  
  // Financial metrics (quarterly)
  roi: number // percentage (200% = 200)
  netValue: number // THB
  costPerConversion: number // THB
  revenueAttributionPercent: number // 0-1 (5% = 0.05)
  
  // Quality metrics (monthly)
  qualityScore: number // 0-100
  customerSatisfaction: number // 0-5
  responseAccuracy: number // 0-1 (80% = 0.8)
  intentCoverage: number // 0-1 (70% = 0.7)
  
  // Risk metrics
  criticalIncidentCount: number // per month
  complianceRate: number // 0-1 (95% = 0.95)
  riskScore: number // 0-100
}

export interface KillDecision {
  shouldKill: boolean
  criteria: KillCriteria[]
  metCriteria: KillCriteria[]
  authority: string
  actionTime: string
  rollbackAvailable: boolean
}

export interface ExitDecision {
  shouldExit: boolean
  criteria: ExitCriteria[]
  metCriteria: ExitCriteria[]
  authority: string
  warningIssued: boolean
  rollbackAvailable: boolean
}

// ============================================================================
// KILL CRITERIA DEFINITIONS
// ============================================================================

export const KILL_CRITERIA: KillCriteria[] = [
  // Critical Safety
  {
    category: 'critical_safety',
    criteria: 'Forbidden Content Rate',
    threshold: 0.01, // > 0% for 1 hour
    measurement: '(Forbidden responses / Total responses) × 100',
    authority: 'CTO / Technical Lead',
    actionTime: '< 5 minutes',
    rollbackAvailable: true,
  },
  {
    category: 'critical_safety',
    criteria: 'Legal Advice Given',
    threshold: 1, // ≥ 1 instance
    measurement: 'Count of responses containing legal advice',
    authority: 'CTO / Technical Lead',
    actionTime: '< 5 minutes',
    rollbackAvailable: true,
  },
  {
    category: 'critical_safety',
    criteria: 'Harmful Information',
    threshold: 1, // ≥ 1 instance causing harm
    measurement: 'Customer harm reported',
    authority: 'CTO / Technical Lead',
    actionTime: '< 5 minutes',
    rollbackAvailable: true,
  },
  {
    category: 'critical_safety',
    criteria: 'Hallucinated Critical Info',
    threshold: 1, // ≥ 1 instance
    measurement: 'Count of hallucinated critical information',
    authority: 'CTO / Technical Lead',
    actionTime: '< 5 minutes',
    rollbackAvailable: true,
  },
  
  // Privacy & Data
  {
    category: 'privacy_data',
    criteria: 'Data Breach',
    threshold: 1, // ≥ 1 confirmed breach
    measurement: 'Unauthorized access to customer data',
    authority: 'Data Protection Officer',
    actionTime: '< 15 minutes',
    rollbackAvailable: true,
  },
  {
    category: 'privacy_data',
    criteria: 'Privacy Violation',
    threshold: 1, // ≥ 1 confirmed violation
    measurement: 'PDPA or privacy regulation violation',
    authority: 'Data Protection Officer',
    actionTime: '< 15 minutes',
    rollbackAvailable: true,
  },
  {
    category: 'privacy_data',
    criteria: 'Unauthorized Data Access',
    threshold: 1, // ≥ 1 confirmed access
    measurement: 'Unauthorized system access',
    authority: 'Data Protection Officer',
    actionTime: '< 15 minutes',
    rollbackAvailable: true,
  },
  {
    category: 'privacy_data',
    criteria: 'Data Leakage',
    threshold: 1, // ≥ 1 confirmed leak
    measurement: 'Customer data exposed',
    authority: 'Data Protection Officer',
    actionTime: '< 15 minutes',
    rollbackAvailable: true,
  },
  
  // Legal & Compliance
  {
    category: 'legal_compliance',
    criteria: 'Legal Violation',
    threshold: 1, // ≥ 1 confirmed violation
    measurement: 'Legal liability or violation',
    authority: 'Legal & Compliance',
    actionTime: '< 1 hour',
    rollbackAvailable: false, // Conditional
  },
  {
    category: 'legal_compliance',
    criteria: 'Regulatory Prohibition',
    threshold: true, // Regulatory order
    measurement: 'Official regulatory order',
    authority: 'Legal & Compliance',
    actionTime: '< 1 hour',
    rollbackAvailable: false, // Conditional
  },
  {
    category: 'legal_compliance',
    criteria: 'Compliance Failure',
    threshold: 1, // Critical compliance breach
    measurement: 'Critical compliance violation',
    authority: 'Legal & Compliance',
    actionTime: '< 1 hour',
    rollbackAvailable: false, // Conditional
  },
  {
    category: 'legal_compliance',
    criteria: 'Court Order',
    threshold: true, // Court order
    measurement: 'Legal court order',
    authority: 'Legal & Compliance',
    actionTime: '< 1 hour',
    rollbackAvailable: false, // Conditional
  },
  
  // System-Wide Failures
  {
    category: 'system_failure',
    criteria: 'System Uptime',
    threshold: 0.90, // < 90% for 24 hours
    measurement: '(Uptime / Total time) × 100',
    authority: 'DevOps Team',
    actionTime: '< 30 minutes',
    rollbackAvailable: true,
  },
  {
    category: 'system_failure',
    criteria: 'Error Rate',
    threshold: 0.10, // > 10% for 1 hour
    measurement: '(Errors / Total requests) × 100',
    authority: 'DevOps Team',
    actionTime: '< 30 minutes',
    rollbackAvailable: true,
  },
  {
    category: 'system_failure',
    criteria: 'Response Time',
    threshold: 10000, // > 10 seconds average for 1 hour
    measurement: 'Average response time (ms)',
    authority: 'DevOps Team',
    actionTime: '< 30 minutes',
    rollbackAvailable: true,
  },
  {
    category: 'system_failure',
    criteria: 'Data Loss',
    threshold: 1, // ≥ 1 confirmed data loss
    measurement: 'Loss of customer data or logs',
    authority: 'DevOps Team',
    actionTime: '< 30 minutes',
    rollbackAvailable: true,
  },
]

// ============================================================================
// EXIT CRITERIA DEFINITIONS
// ============================================================================

export const EXIT_CRITERIA: ExitCriteria[] = [
  // Financial Performance (2 consecutive quarters)
  {
    category: 'financial_performance',
    criteria: 'ROI',
    threshold: 200, // < 200% for 2 quarters
    measurement: '((Value - Cost) / Cost) × 100',
    duration: '2 consecutive quarters',
    authority: 'Executive Team',
    rollbackAvailable: false,
  },
  {
    category: 'financial_performance',
    criteria: 'Net Value',
    threshold: 0, // Negative for 2 quarters
    measurement: 'Value - Cost',
    duration: '2 consecutive quarters',
    authority: 'Executive Team',
    rollbackAvailable: false,
  },
  {
    category: 'financial_performance',
    criteria: 'Cost per Conversion',
    threshold: 3000, // > 3,000 THB for 2 quarters
    measurement: 'Monthly cost / Conversions',
    duration: '2 consecutive quarters',
    authority: 'Executive Team',
    rollbackAvailable: false,
  },
  {
    category: 'financial_performance',
    criteria: 'Revenue Attribution',
    threshold: 0.05, // < 5% of total sales for 2 quarters
    measurement: '(AI revenue / Total revenue) × 100',
    duration: '2 consecutive quarters',
    authority: 'Executive Team',
    rollbackAvailable: false,
  },
  
  // Quality & Performance (3 consecutive months)
  {
    category: 'quality_performance',
    criteria: 'Quality Score',
    threshold: 70, // < 70 for 3 months
    measurement: 'Weighted quality metrics (0-100)',
    duration: '3 consecutive months',
    authority: 'Executive Team',
    rollbackAvailable: false,
  },
  {
    category: 'quality_performance',
    criteria: 'Customer Satisfaction',
    threshold: 3.0, // < 3.0/5.0 for 3 months
    measurement: 'Average customer satisfaction',
    duration: '3 consecutive months',
    authority: 'Executive Team',
    rollbackAvailable: false,
  },
  {
    category: 'quality_performance',
    criteria: 'Response Accuracy',
    threshold: 0.80, // < 80% for 3 months
    measurement: '(Accurate responses / Total) × 100',
    duration: '3 consecutive months',
    authority: 'Executive Team',
    rollbackAvailable: false,
  },
  {
    category: 'quality_performance',
    criteria: 'Intent Coverage',
    threshold: 0.70, // < 70% for 3 months
    measurement: '(Covered intents / Total intents) × 100',
    duration: '3 consecutive months',
    authority: 'Executive Team',
    rollbackAvailable: false,
  },
  
  // Risk Management
  {
    category: 'risk_management',
    criteria: 'Critical Incidents',
    threshold: 3, // ≥ 3 in 1 month
    measurement: 'Count of P0 incidents',
    duration: '1 month',
    authority: 'Risk Management Committee',
    rollbackAvailable: false,
  },
  {
    category: 'risk_management',
    criteria: 'Compliance Failures',
    threshold: 2, // ≥ 2 in 1 quarter
    measurement: 'Count of compliance violations',
    duration: '1 quarter',
    authority: 'Risk Management Committee',
    rollbackAvailable: false,
  },
  {
    category: 'risk_management',
    criteria: 'Regulatory Action',
    threshold: true, // Regulatory order
    measurement: 'Official regulatory action',
    duration: 'Immediate',
    authority: 'Risk Management Committee',
    rollbackAvailable: false,
  },
  {
    category: 'risk_management',
    criteria: 'Risk Score',
    threshold: 50, // > 50 (Critical) for 1 month
    measurement: 'Weighted risk score (0-100)',
    duration: '1 month',
    authority: 'Risk Management Committee',
    rollbackAvailable: false,
  },
]

// ============================================================================
// KILL CRITERIA CHECKING
// ============================================================================

/**
 * Check if kill criteria are met
 */
export function checkKillCriteria(metrics: SystemMetrics): KillDecision {
  const metCriteria: KillCriteria[] = []
  
  // Critical Safety
  if (metrics.forbiddenResponseRate > 0.01) {
    metCriteria.push(KILL_CRITERIA.find(c => c.criteria === 'Forbidden Content Rate')!)
  }
  if (metrics.legalAdviceCount >= 1) {
    metCriteria.push(KILL_CRITERIA.find(c => c.criteria === 'Legal Advice Given')!)
  }
  if (metrics.harmfulInfoCount >= 1) {
    metCriteria.push(KILL_CRITERIA.find(c => c.criteria === 'Harmful Information')!)
  }
  if (metrics.hallucinatedCriticalInfoCount >= 1) {
    metCriteria.push(KILL_CRITERIA.find(c => c.criteria === 'Hallucinated Critical Info')!)
  }
  
  // Privacy & Data
  if (metrics.dataBreachCount >= 1) {
    metCriteria.push(KILL_CRITERIA.find(c => c.criteria === 'Data Breach')!)
  }
  if (metrics.privacyViolationCount >= 1) {
    metCriteria.push(KILL_CRITERIA.find(c => c.criteria === 'Privacy Violation')!)
  }
  if (metrics.unauthorizedAccessCount >= 1) {
    metCriteria.push(KILL_CRITERIA.find(c => c.criteria === 'Unauthorized Data Access')!)
  }
  if (metrics.dataLeakageCount >= 1) {
    metCriteria.push(KILL_CRITERIA.find(c => c.criteria === 'Data Leakage')!)
  }
  
  // Legal & Compliance
  if (metrics.legalViolationCount >= 1) {
    metCriteria.push(KILL_CRITERIA.find(c => c.criteria === 'Legal Violation')!)
  }
  if (metrics.regulatoryProhibition) {
    metCriteria.push(KILL_CRITERIA.find(c => c.criteria === 'Regulatory Prohibition')!)
  }
  if (metrics.complianceFailureCount >= 1) {
    metCriteria.push(KILL_CRITERIA.find(c => c.criteria === 'Compliance Failure')!)
  }
  if (metrics.courtOrder) {
    metCriteria.push(KILL_CRITERIA.find(c => c.criteria === 'Court Order')!)
  }
  
  // System-Wide Failures
  if (metrics.systemUptime < 0.90) {
    metCriteria.push(KILL_CRITERIA.find(c => c.criteria === 'System Uptime')!)
  }
  if (metrics.errorRate > 0.10) {
    metCriteria.push(KILL_CRITERIA.find(c => c.criteria === 'Error Rate')!)
  }
  if (metrics.averageResponseTime > 10000) {
    metCriteria.push(KILL_CRITERIA.find(c => c.criteria === 'Response Time')!)
  }
  if (metrics.dataLossCount >= 1) {
    metCriteria.push(KILL_CRITERIA.find(c => c.criteria === 'Data Loss')!)
  }
  
  const shouldKill = metCriteria.length > 0
  
  // Determine authority (highest priority)
  let authority = 'Unknown'
  let actionTime = 'Unknown'
  let rollbackAvailable = false
  
  if (metCriteria.length > 0) {
    // Priority: Critical Safety > Privacy > Legal > System
    const criticalSafety = metCriteria.find(c => c.category === 'critical_safety')
    const privacyData = metCriteria.find(c => c.category === 'privacy_data')
    const legalCompliance = metCriteria.find(c => c.category === 'legal_compliance')
    const systemFailure = metCriteria.find(c => c.category === 'system_failure')
    
    if (criticalSafety) {
      authority = criticalSafety.authority
      actionTime = criticalSafety.actionTime
      rollbackAvailable = criticalSafety.rollbackAvailable
    } else if (privacyData) {
      authority = privacyData.authority
      actionTime = privacyData.actionTime
      rollbackAvailable = privacyData.rollbackAvailable
    } else if (legalCompliance) {
      authority = legalCompliance.authority
      actionTime = legalCompliance.actionTime
      rollbackAvailable = legalCompliance.rollbackAvailable
    } else if (systemFailure) {
      authority = systemFailure.authority
      actionTime = systemFailure.actionTime
      rollbackAvailable = systemFailure.rollbackAvailable
    }
  }
  
  return {
    shouldKill,
    criteria: KILL_CRITERIA,
    metCriteria,
    authority,
    actionTime,
    rollbackAvailable,
  }
}

// ============================================================================
// EXIT CRITERIA CHECKING
// ============================================================================

/**
 * Check if exit criteria are met (requires historical data)
 */
export function checkExitCriteria(
  currentMetrics: SystemMetrics,
  historicalMetrics: Array<{ period: string; metrics: SystemMetrics }> // e.g., [{ period: 'Q1', metrics: {...} }, ...]
): ExitDecision {
  const metCriteria: ExitCriteria[] = []
  
  // Financial Performance (2 consecutive quarters)
  const financialCriteria = EXIT_CRITERIA.filter(c => c.category === 'financial_performance')
  const quarterlyMetrics = historicalMetrics.filter(m => m.period.startsWith('Q'))
  
  if (quarterlyMetrics.length >= 2) {
    const last2Quarters = quarterlyMetrics.slice(-2)
    
    // Check ROI
    const roiCriteria = financialCriteria.find(c => c.criteria === 'ROI')
    if (roiCriteria && last2Quarters.every(q => q.metrics.roi < 200)) {
      metCriteria.push(roiCriteria)
    }
    
    // Check Net Value
    const netValueCriteria = financialCriteria.find(c => c.criteria === 'Net Value')
    if (netValueCriteria && last2Quarters.every(q => q.metrics.netValue < 0)) {
      metCriteria.push(netValueCriteria)
    }
    
    // Check Cost per Conversion
    const costPerConversionCriteria = financialCriteria.find(c => c.criteria === 'Cost per Conversion')
    if (costPerConversionCriteria && last2Quarters.every(q => q.metrics.costPerConversion > 3000)) {
      metCriteria.push(costPerConversionCriteria)
    }
    
    // Check Revenue Attribution
    const revenueAttributionCriteria = financialCriteria.find(c => c.criteria === 'Revenue Attribution')
    if (revenueAttributionCriteria && last2Quarters.every(q => q.metrics.revenueAttributionPercent < 0.05)) {
      metCriteria.push(revenueAttributionCriteria)
    }
  }
  
  // Quality & Performance (3 consecutive months)
  const qualityCriteria = EXIT_CRITERIA.filter(c => c.category === 'quality_performance')
  const monthlyMetrics = historicalMetrics.filter(m => m.period.match(/^\d{4}-\d{2}$/)) // YYYY-MM format
  
  if (monthlyMetrics.length >= 3) {
    const last3Months = monthlyMetrics.slice(-3)
    
    // Check Quality Score
    const qualityScoreCriteria = qualityCriteria.find(c => c.criteria === 'Quality Score')
    if (qualityScoreCriteria && last3Months.every(m => m.metrics.qualityScore < 70)) {
      metCriteria.push(qualityScoreCriteria)
    }
    
    // Check Customer Satisfaction
    const customerSatisfactionCriteria = qualityCriteria.find(c => c.criteria === 'Customer Satisfaction')
    if (customerSatisfactionCriteria && last3Months.every(m => m.metrics.customerSatisfaction < 3.0)) {
      metCriteria.push(customerSatisfactionCriteria)
    }
    
    // Check Response Accuracy
    const responseAccuracyCriteria = qualityCriteria.find(c => c.criteria === 'Response Accuracy')
    if (responseAccuracyCriteria && last3Months.every(m => m.metrics.responseAccuracy < 0.80)) {
      metCriteria.push(responseAccuracyCriteria)
    }
    
    // Check Intent Coverage
    const intentCoverageCriteria = qualityCriteria.find(c => c.criteria === 'Intent Coverage')
    if (intentCoverageCriteria && last3Months.every(m => m.metrics.intentCoverage < 0.70)) {
      metCriteria.push(intentCoverageCriteria)
    }
  }
  
  // Risk Management
  const riskCriteria = EXIT_CRITERIA.filter(c => c.category === 'risk_management')
  
  // Check Critical Incidents (≥ 3 in 1 month)
  const criticalIncidentsCriteria = riskCriteria.find(c => c.criteria === 'Critical Incidents')
  if (criticalIncidentsCriteria && currentMetrics.criticalIncidentCount >= 3) {
    metCriteria.push(criticalIncidentsCriteria)
  }
  
  // Check Compliance Failures (≥ 2 in 1 quarter)
  const complianceFailuresCriteria = riskCriteria.find(c => c.criteria === 'Compliance Failures')
  if (complianceFailuresCriteria && currentMetrics.complianceFailureCount >= 2) {
    metCriteria.push(complianceFailuresCriteria)
  }
  
  // Check Regulatory Action
  const regulatoryActionCriteria = riskCriteria.find(c => c.criteria === 'Regulatory Action')
  if (regulatoryActionCriteria && currentMetrics.regulatoryProhibition) {
    metCriteria.push(regulatoryActionCriteria)
  }
  
  // Check Risk Score (> 50 for 1 month)
  const riskScoreCriteria = riskCriteria.find(c => c.criteria === 'Risk Score')
  if (riskScoreCriteria && currentMetrics.riskScore > 50) {
    metCriteria.push(riskScoreCriteria)
  }
  
  const shouldExit = metCriteria.length > 0
  
  // Determine authority
  let authority = 'Unknown'
  let rollbackAvailable = false
  
  if (metCriteria.length > 0) {
    // Priority: Risk > Financial > Quality
    const risk = metCriteria.find(c => c.category === 'risk_management')
    const financial = metCriteria.find(c => c.category === 'financial_performance')
    const quality = metCriteria.find(c => c.category === 'quality_performance')
    
    if (risk) {
      authority = risk.authority
      rollbackAvailable = risk.rollbackAvailable
    } else if (financial) {
      authority = financial.authority
      rollbackAvailable = financial.rollbackAvailable
    } else if (quality) {
      authority = quality.authority
      rollbackAvailable = quality.rollbackAvailable
    }
  }
  
  // Warning issued if 1 period below threshold (for financial/quality)
  const warningIssued = 
    (quarterlyMetrics.length >= 1 && financialCriteria.some(c => {
      const lastQuarter = quarterlyMetrics[quarterlyMetrics.length - 1]
      if (c.criteria === 'ROI' && lastQuarter.metrics.roi < 200) return true
      if (c.criteria === 'Net Value' && lastQuarter.metrics.netValue < 0) return true
      if (c.criteria === 'Cost per Conversion' && lastQuarter.metrics.costPerConversion > 3000) return true
      if (c.criteria === 'Revenue Attribution' && lastQuarter.metrics.revenueAttributionPercent < 0.05) return true
      return false
    })) ||
    (monthlyMetrics.length >= 1 && qualityCriteria.some(c => {
      const lastMonth = monthlyMetrics[monthlyMetrics.length - 1]
      if (c.criteria === 'Quality Score' && lastMonth.metrics.qualityScore < 70) return true
      if (c.criteria === 'Customer Satisfaction' && lastMonth.metrics.customerSatisfaction < 3.0) return true
      if (c.criteria === 'Response Accuracy' && lastMonth.metrics.responseAccuracy < 0.80) return true
      if (c.criteria === 'Intent Coverage' && lastMonth.metrics.intentCoverage < 0.70) return true
      return false
    }))
  
  return {
    shouldExit,
    criteria: EXIT_CRITERIA,
    metCriteria,
    authority,
    warningIssued,
    rollbackAvailable,
  }
}

// ============================================================================
// FORMATTING
// ============================================================================

/**
 * Format kill decision for display
 */
export function formatKillDecision(decision: KillDecision): string {
  if (!decision.shouldKill) {
    return '✅ No kill criteria met - System operating normally'
  }
  
  let output = '\n'
  output += '='.repeat(80) + '\n'
  output += '🚨 KILL CRITERIA MET - IMMEDIATE SHUTDOWN REQUIRED\n'
  output += '='.repeat(80) + '\n\n'
  
  output += `Authority: ${decision.authority}\n`
  output += `Action Time: ${decision.actionTime}\n`
  output += `Rollback Available: ${decision.rollbackAvailable ? '✅ Yes' : '❌ No'}\n\n`
  
  output += 'MET CRITERIA:\n'
  output += '-'.repeat(80) + '\n'
  decision.metCriteria.forEach(criteria => {
    output += `❌ ${criteria.criteria}\n`
    output += `   Category: ${criteria.category}\n`
    output += `   Threshold: ${criteria.threshold}\n`
    output += `   Measurement: ${criteria.measurement}\n\n`
  })
  
  output += 'IMMEDIATE ACTIONS REQUIRED:\n'
  output += '-'.repeat(80) + '\n'
  output += '1. Execute emergency shutdown\n'
  output += '2. Redirect all traffic to human staff\n'
  output += '3. Notify ' + decision.authority + '\n'
  output += '4. Begin incident response\n'
  output += '5. Document incident\n'
  
  output += '='.repeat(80) + '\n'
  
  return output
}

/**
 * Format exit decision for display
 */
export function formatExitDecision(decision: ExitDecision): string {
  if (!decision.shouldExit) {
    return '✅ No exit criteria met - System operating normally'
  }
  
  let output = '\n'
  output += '='.repeat(80) + '\n'
  output += '⚠️ EXIT CRITERIA MET - PERMANENT SHUTDOWN CONSIDERATION\n'
  output += '='.repeat(80) + '\n\n'
  
  output += `Authority: ${decision.authority}\n`
  output += `Warning Issued: ${decision.warningIssued ? '✅ Yes' : '❌ No'}\n`
  output += `Rollback Available: ${decision.rollbackAvailable ? '✅ Yes' : '❌ No'}\n\n`
  
  output += 'MET CRITERIA:\n'
  output += '-'.repeat(80) + '\n'
  decision.metCriteria.forEach(criteria => {
    output += `⚠️ ${criteria.criteria}\n`
    output += `   Category: ${criteria.category}\n`
    output += `   Threshold: ${criteria.threshold}\n`
    output += `   Duration: ${criteria.duration}\n`
    output += `   Measurement: ${criteria.measurement}\n\n`
  })
  
  output += 'REQUIRED ACTIONS:\n'
  output += '-'.repeat(80) + '\n'
  output += '1. Executive team review\n'
  output += '2. Board approval (if required)\n'
  output += '3. Exit plan development\n'
  output += '4. Customer communication\n'
  output += '5. System decommissioning (30-90 days)\n'
  
  output += '='.repeat(80) + '\n'
  
  return output
}
