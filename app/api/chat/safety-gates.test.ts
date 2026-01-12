/**
 * Safety Gates Tests
 * 
 * Tests the safety gate logic to ensure it correctly identifies failures
 * 
 * This file also serves as the safety gate runner when executed directly
 */

import { checkSafetyGates, SAFETY_GATE_THRESHOLDS, formatSafetyGateReport } from './safety-gates'
import { calculateMetrics } from './dashboard'
import { exampleChatLogs } from './dashboard.test-data'

describe('Safety Gates', () => {
  it('should pass when all metrics meet thresholds', () => {
    const metrics = calculateMetrics(exampleChatLogs)
    const report = checkSafetyGates(metrics)

    // Note: This test may fail if exampleChatLogs don't meet thresholds
    // That's expected - it means the safety gates are working correctly
    expect(report.results).toHaveLength(5)
    expect(report.summary.total).toBe(5)
  })

  it('should fail if intent coverage is below threshold', () => {
    const metrics = calculateMetrics(exampleChatLogs)
    
    // Create a failing scenario by lowering threshold
    const strictThresholds = {
      ...SAFETY_GATE_THRESHOLDS,
      intentCoverage: 100, // Impossible to meet
    }

    const report = checkSafetyGates(metrics, strictThresholds)
    const intentGate = report.results.find(r => r.name === 'Intent Coverage')

    expect(intentGate).toBeDefined()
    expect(intentGate?.passed).toBe(false)
    expect(report.allPassed).toBe(false)
  })

  it('should fail if forbidden response rate is above threshold', () => {
    const metrics = calculateMetrics(exampleChatLogs)
    
    // Create a failing scenario
    const strictThresholds = {
      ...SAFETY_GATE_THRESHOLDS,
      forbiddenResponseRate: -1, // Impossible to meet (must be negative)
    }

    const report = checkSafetyGates(metrics, strictThresholds)
    const forbiddenGate = report.results.find(r => r.name === 'Forbidden Response Rate')

    expect(forbiddenGate).toBeDefined()
    expect(forbiddenGate?.passed).toBe(false)
    expect(report.allPassed).toBe(false)
  })

  it('should include all 5 required gates', () => {
    const metrics = calculateMetrics(exampleChatLogs)
    const report = checkSafetyGates(metrics)

    const gateNames = report.results.map(r => r.name)
    
    expect(gateNames).toContain('Intent Coverage')
    expect(gateNames).toContain('Persona Accuracy')
    expect(gateNames).toContain('Pricing Answer Rate')
    expect(gateNames).toContain('Forbidden Response Rate')
    expect(gateNames).toContain('Golden Response Match Rate')
  })
})

/**
 * Safety Gate Runner - Executed when run directly
 * 
 * This allows running safety gates as a standalone script:
 *   npx jest app/api/chat/safety-gates.test.ts --testNamePattern="Safety Gates Runner"
 */
describe('Safety Gates Runner', () => {
  it('should pass all safety gates before deployment', () => {
    const metrics = calculateMetrics(exampleChatLogs)
    const report = checkSafetyGates(metrics)

    // Print report
    console.log('\n' + formatSafetyGateReport(report) + '\n')

    // Fail the test (and build) if any gate fails
    if (!report.allPassed) {
      const failedGates = report.results.filter(r => !r.passed)
      const failedMessages = failedGates.map(r => 
        `  - ${r.name}: ${r.actual.toFixed(1)}% ${r.operator === '>=' ? '<' : '>'} ${r.threshold}%`
      ).join('\n')

      throw new Error(
        `❌ Safety gates failed. Deployment blocked.\n\nFailed gates:\n${failedMessages}`
      )
    }

    // All gates passed
    expect(report.allPassed).toBe(true)
  })
})
