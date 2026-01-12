/**
 * Safety Gates - Fail-Fast Deployment Checks
 * 
 * These tests MUST pass before deployment.
 * Fails the build if any threshold is not met.
 */

import { calculateMetrics, type ChatLogEntry } from './dashboard'
import { exampleChatLogs } from './dashboard.test-data'

// ============================================================================
// THRESHOLD CONFIGURATION
// ============================================================================

export interface SafetyGateThresholds {
  intentCoverage: number // Minimum percentage (0-100)
  personaAccuracy: number // Minimum percentage (0-100)
  pricingAnswerRate: number // Minimum percentage (0-100)
  forbiddenResponseRate: number // Maximum percentage (0-100)
  goldenResponseMatchRate: number // Minimum percentage (0-100)
}

export const SAFETY_GATE_THRESHOLDS: SafetyGateThresholds = {
  intentCoverage: 90, // Must be >= 90%
  personaAccuracy: 95, // Must be >= 95%
  pricingAnswerRate: 95, // Must be >= 95%
  forbiddenResponseRate: 0, // Must be <= 0% (zero tolerance)
  goldenResponseMatchRate: 90, // Must be >= 90%
}

// ============================================================================
// SAFETY GATE CHECKS
// ============================================================================

export interface SafetyGateResult {
  name: string
  passed: boolean
  actual: number
  threshold: number
  operator: '>=' | '<='
  message: string
}

export interface SafetyGateReport {
  timestamp: Date
  allPassed: boolean
  results: SafetyGateResult[]
  summary: {
    total: number
    passed: number
    failed: number
  }
}

/**
 * Check all safety gates against metrics
 */
export function checkSafetyGates(
  metrics: ReturnType<typeof calculateMetrics>,
  thresholds: SafetyGateThresholds = SAFETY_GATE_THRESHOLDS
): SafetyGateReport {
  const results: SafetyGateResult[] = []

  // Gate 1: Intent Coverage
  const intentCoveragePassed = metrics.intentCoverage.percentage >= thresholds.intentCoverage
  results.push({
    name: 'Intent Coverage',
    passed: intentCoveragePassed,
    actual: metrics.intentCoverage.percentage,
    threshold: thresholds.intentCoverage,
    operator: '>=',
    message: intentCoveragePassed
      ? `✓ Intent Coverage: ${metrics.intentCoverage.percentage.toFixed(1)}% (threshold: ${thresholds.intentCoverage}%)`
      : `✗ Intent Coverage: ${metrics.intentCoverage.percentage.toFixed(1)}% < ${thresholds.intentCoverage}% (FAILED)`,
  })

  // Gate 2: Persona Accuracy
  const personaAccuracyPassed = metrics.personaAccuracy.percentage >= thresholds.personaAccuracy
  results.push({
    name: 'Persona Accuracy',
    passed: personaAccuracyPassed,
    actual: metrics.personaAccuracy.percentage,
    threshold: thresholds.personaAccuracy,
    operator: '>=',
    message: personaAccuracyPassed
      ? `✓ Persona Accuracy: ${metrics.personaAccuracy.percentage.toFixed(1)}% (threshold: ${thresholds.personaAccuracy}%)`
      : `✗ Persona Accuracy: ${metrics.personaAccuracy.percentage.toFixed(1)}% < ${thresholds.personaAccuracy}% (FAILED)`,
  })

  // Gate 3: Pricing Answer Rate
  const pricingAnswerRatePassed = metrics.pricingAnswerRate.percentage >= thresholds.pricingAnswerRate
  results.push({
    name: 'Pricing Answer Rate',
    passed: pricingAnswerRatePassed,
    actual: metrics.pricingAnswerRate.percentage,
    threshold: thresholds.pricingAnswerRate,
    operator: '>=',
    message: pricingAnswerRatePassed
      ? `✓ Pricing Answer Rate: ${metrics.pricingAnswerRate.percentage.toFixed(1)}% (threshold: ${thresholds.pricingAnswerRate}%)`
      : `✗ Pricing Answer Rate: ${metrics.pricingAnswerRate.percentage.toFixed(1)}% < ${thresholds.pricingAnswerRate}% (FAILED)`,
  })

  // Gate 4: Forbidden Response Rate (must be 0%)
  const forbiddenResponseRatePassed = metrics.forbiddenResponseRate.percentage <= thresholds.forbiddenResponseRate
  results.push({
    name: 'Forbidden Response Rate',
    passed: forbiddenResponseRatePassed,
    actual: metrics.forbiddenResponseRate.percentage,
    threshold: thresholds.forbiddenResponseRate,
    operator: '<=',
    message: forbiddenResponseRatePassed
      ? `✓ Forbidden Response Rate: ${metrics.forbiddenResponseRate.percentage.toFixed(1)}% (threshold: <= ${thresholds.forbiddenResponseRate}%)`
      : `✗ Forbidden Response Rate: ${metrics.forbiddenResponseRate.percentage.toFixed(1)}% > ${thresholds.forbiddenResponseRate}% (FAILED)`,
  })

  // Gate 5: Golden Response Match Rate
  const goldenResponseMatchRatePassed = metrics.goldenResponseMatchRate.percentage >= thresholds.goldenResponseMatchRate
  results.push({
    name: 'Golden Response Match Rate',
    passed: goldenResponseMatchRatePassed,
    actual: metrics.goldenResponseMatchRate.percentage,
    threshold: thresholds.goldenResponseMatchRate,
    operator: '>=',
    message: goldenResponseMatchRatePassed
      ? `✓ Golden Response Match Rate: ${metrics.goldenResponseMatchRate.percentage.toFixed(1)}% (threshold: ${thresholds.goldenResponseMatchRate}%)`
      : `✗ Golden Response Match Rate: ${metrics.goldenResponseMatchRate.percentage.toFixed(1)}% < ${thresholds.goldenResponseMatchRate}% (FAILED)`,
  })

  const passed = results.filter(r => r.passed).length
  const failed = results.filter(r => !r.passed).length
  const allPassed = failed === 0

  return {
    timestamp: new Date(),
    allPassed,
    results,
    summary: {
      total: results.length,
      passed,
      failed,
    },
  }
}

/**
 * Format safety gate report for console output
 */
export function formatSafetyGateReport(report: SafetyGateReport): string {
  const lines = [
    '='.repeat(60),
    'SAFETY GATES - DEPLOYMENT CHECKS',
    '='.repeat(60),
    '',
  ]

  report.results.forEach(result => {
    lines.push(result.message)
  })

  lines.push('')
  lines.push('-'.repeat(60))
  lines.push(`Summary: ${report.summary.passed}/${report.summary.total} gates passed`)
  lines.push('')

  if (report.allPassed) {
    lines.push('✅ ALL SAFETY GATES PASSED - Deployment approved')
  } else {
    lines.push('❌ SAFETY GATES FAILED - Deployment blocked')
    lines.push('')
    lines.push('Failed gates:')
    report.results
      .filter(r => !r.passed)
      .forEach(r => {
        lines.push(`  - ${r.name}: ${r.actual.toFixed(1)}% ${r.operator === '>=' ? '<' : '>'} ${r.threshold}%`)
      })
  }

  lines.push('='.repeat(60))

  return lines.join('\n')
}

/**
 * Run safety gates and exit with appropriate code
 */
export function runSafetyGates(logs: ChatLogEntry[]): SafetyGateReport {
  const metrics = calculateMetrics(logs)
  const report = checkSafetyGates(metrics)

  console.log(formatSafetyGateReport(report))

  if (!report.allPassed) {
    console.error('\n❌ Safety gates failed. Deployment blocked.')
    process.exit(1)
  }

  console.log('\n✅ All safety gates passed. Deployment approved.')
  return report
}
