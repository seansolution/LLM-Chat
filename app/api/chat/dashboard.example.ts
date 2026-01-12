/**
 * AI Chat Coverage Dashboard - Example Usage
 * 
 * This file demonstrates how to use the dashboard metrics system
 * with example calculations and report generation.
 */

import { generateDashboardReport, formatReportAsTable, calculateMetrics } from './dashboard'
import { exampleChatLogs } from './dashboard.test-data'

// ============================================================================
// EXAMPLE 1: Generate Full Dashboard Report
// ============================================================================

export function exampleGenerateReport() {
  const periodStart = new Date('2024-01-01T00:00:00Z')
  const periodEnd = new Date('2024-01-01T23:59:59Z')

  const report = generateDashboardReport(exampleChatLogs, periodStart, periodEnd)

  // Output as JSON
  console.log('=== Dashboard Report (JSON) ===')
  console.log(JSON.stringify(report, null, 2))

  // Output as Table
  console.log('\n=== Dashboard Report (Table) ===')
  console.log(formatReportAsTable(report))

  return report
}

// ============================================================================
// EXAMPLE 2: Calculate Individual Metrics
// ============================================================================

export function exampleCalculateMetrics() {
  const metrics = calculateMetrics(exampleChatLogs)

  console.log('=== Metrics Breakdown ===')
  console.log(`Intent Coverage: ${metrics.intentCoverage.percentage.toFixed(1)}%`)
  console.log(`Persona Accuracy: ${metrics.personaAccuracy.percentage.toFixed(1)}%`)
  console.log(`Pricing Answer Rate: ${metrics.pricingAnswerRate.percentage.toFixed(1)}%`)
  console.log(`Forbidden Response Rate: ${metrics.forbiddenResponseRate.percentage.toFixed(1)}%`)
  console.log(`Golden Response Match: ${metrics.goldenResponseMatchRate.percentage.toFixed(1)}%`)

  // Detailed breakdowns
  console.log('\n=== Intent Coverage Breakdown ===')
  Object.entries(metrics.intentCoverage.breakdown).forEach(([intent, data]) => {
    console.log(`${intent}: ${data.percentage.toFixed(1)}% (${data.correct}/${data.total})`)
  })

  console.log('\n=== Persona Accuracy Breakdown ===')
  Object.entries(metrics.personaAccuracy.breakdown).forEach(([persona, data]) => {
    console.log(`${persona}: ${data.percentage.toFixed(1)}% (${data.correct}/${data.total})`)
  })

  console.log('\n=== Forbidden Violations Breakdown ===')
  Object.entries(metrics.forbiddenResponseRate.breakdown).forEach(([type, count]) => {
    if (count > 0) {
      console.log(`${type}: ${count} violations`)
    }
  })

  return metrics
}

// ============================================================================
// EXAMPLE 3: JSON Schema Export
// ============================================================================

export const dashboardJsonSchema = {
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "AI Chat Coverage Dashboard Report",
  "type": "object",
  "properties": {
    "timestamp": {
      "type": "string",
      "format": "date-time",
      "description": "Report generation timestamp"
    },
    "period": {
      "type": "object",
      "properties": {
        "start": { "type": "string", "format": "date-time" },
        "end": { "type": "string", "format": "date-time" }
      }
    },
    "sampleSize": {
      "type": "number",
      "description": "Total number of chat log entries analyzed"
    },
    "metrics": {
      "type": "object",
      "properties": {
        "intentCoverage": {
          "type": "object",
          "properties": {
            "total": { "type": "number" },
            "correct": { "type": "number" },
            "percentage": { "type": "number", "minimum": 0, "maximum": 100 },
            "breakdown": {
              "type": "object",
              "additionalProperties": {
                "type": "object",
                "properties": {
                  "correct": { "type": "number" },
                  "total": { "type": "number" },
                  "percentage": { "type": "number" }
                }
              }
            }
          }
        },
        "personaAccuracy": {
          "type": "object",
          "properties": {
            "total": { "type": "number" },
            "correct": { "type": "number" },
            "percentage": { "type": "number", "minimum": 0, "maximum": 100 },
            "breakdown": {
              "type": "object",
              "properties": {
                "HR": { "$ref": "#/definitions/personaBreakdown" },
                "ACCOUNTING": { "$ref": "#/definitions/personaBreakdown" },
                "REGISTRATION": { "$ref": "#/definitions/personaBreakdown" }
              }
            }
          }
        },
        "pricingAnswerRate": {
          "type": "object",
          "properties": {
            "total": { "type": "number" },
            "answered": { "type": "number" },
            "percentage": { "type": "number", "minimum": 0, "maximum": 100 }
          }
        },
        "forbiddenResponseRate": {
          "type": "object",
          "properties": {
            "total": { "type": "number" },
            "violations": { "type": "number" },
            "percentage": { "type": "number", "minimum": 0, "maximum": 100 },
            "breakdown": {
              "type": "object",
              "properties": {
                "legal_explanation": { "type": "number" },
                "tax_calculation": { "type": "number" },
                "hallucinated_url": { "type": "number" },
                "placeholder_text": { "type": "number" },
                "ai_claim": { "type": "number" }
              }
            }
          }
        },
        "goldenResponseMatchRate": {
          "type": "object",
          "properties": {
            "total": { "type": "number" },
            "matched": { "type": "number" },
            "percentage": { "type": "number", "minimum": 0, "maximum": 100 },
            "threshold": { "type": "number", "minimum": 0, "maximum": 1 }
          }
        }
      }
    }
  },
  "definitions": {
    "personaBreakdown": {
      "type": "object",
      "properties": {
        "correct": { "type": "number" },
        "total": { "type": "number" },
        "percentage": { "type": "number" }
      }
    }
  }
}

// ============================================================================
// EXAMPLE 4: Run Examples
// ============================================================================

if (require.main === module) {
  console.log('Running AI Chat Coverage Dashboard Examples...\n')
  
  exampleGenerateReport()
  console.log('\n')
  exampleCalculateMetrics()
  
  console.log('\n=== JSON Schema ===')
  console.log(JSON.stringify(dashboardJsonSchema, null, 2))
}
