# AI Chat Coverage Dashboard

## Overview

The AI Chat Coverage Dashboard tracks and calculates key metrics for the chatbot system to ensure quality, accuracy, and compliance.

## Metrics

### 1. Intent Coverage
**Definition:** Percentage of user messages correctly mapped to an intent

**Calculation:**
```
Intent Coverage = (Correct Intent Detections / Total Messages) × 100
```

**Breakdown:** Per-intent accuracy (e.g., `company_registration_pricing`, `accounting_pricing`, `hr_pricing`)

---

### 2. Persona Accuracy
**Definition:** Percentage of intents mapped to the correct persona (HR / ACCOUNTING / REGISTRATION)

**Calculation:**
```
Persona Accuracy = (Correct Persona Mappings / Total Messages) × 100
```

**Breakdown:** Per-persona accuracy

---

### 3. Pricing Answer Rate
**Definition:** Percentage of pricing-related questions where the AI answered an actual price

**Calculation:**
```
Pricing Answer Rate = (Pricing Questions with Price / Total Pricing Questions) × 100
```

**Detection:** Uses regex patterns to detect prices (e.g., `\d+.*บาท`, `\d+.*THB`)

---

### 4. Forbidden Response Rate
**Definition:** Percentage of responses that violate rules

**Violation Types:**
- **Legal Explanation:** Explaining legal procedures or step-by-step processes
- **Tax Calculation:** Showing tax calculation formulas or methods
- **Hallucinated URL:** Invented URLs (excluding seansolution.co.th)
- **Placeholder Text:** Using placeholders like `[price]`, `[contact]`
- **AI Claim:** Claiming to be AI/system/platform

**Calculation:**
```
Forbidden Response Rate = (Violations / Total Responses) × 100
```

---

### 5. Golden Response Match Rate
**Definition:** Percentage of responses that match golden response templates

**Calculation:**
```
Golden Response Match Rate = (Matched Responses / Total Golden Responses) × 100
```

**Matching Method:**
- String similarity (Jaccard-like)
- Key phrase matching for pricing responses
- Configurable threshold (default: 0.7)

---

## Data Structure

### ChatLogEntry
```typescript
{
  id: string
  timestamp: Date
  userMessage: string
  detectedIntent: IntentResult
  expectedIntent?: string
  expectedPersona?: Persona
  aiResponse: string
  isPricingQuestion: boolean
  containsPrice: boolean
  goldenResponse?: string
}
```

### MetricsResult
```typescript
{
  intentCoverage: {
    total: number
    correct: number
    percentage: number
    breakdown: Record<string, { correct, total, percentage }>
  }
  personaAccuracy: {
    total: number
    correct: number
    percentage: number
    breakdown: Record<Persona, { correct, total, percentage }>
  }
  pricingAnswerRate: {
    total: number
    answered: number
    percentage: number
  }
  forbiddenResponseRate: {
    total: number
    violations: number
    percentage: number
    breakdown: Record<ViolationType, number>
  }
  goldenResponseMatchRate: {
    total: number
    matched: number
    percentage: number
    threshold: number
  }
}
```

---

## Usage

### Basic Example

```typescript
import { generateDashboardReport, formatReportAsTable } from './dashboard'
import { exampleChatLogs } from './dashboard.test-data'

const report = generateDashboardReport(
  exampleChatLogs,
  new Date('2024-01-01'),
  new Date('2024-01-31')
)

// Output as table
console.log(formatReportAsTable(report))

// Output as JSON
console.log(JSON.stringify(report, null, 2))
```

### Calculate Individual Metrics

```typescript
import { calculateMetrics } from './dashboard'

const metrics = calculateMetrics(chatLogs)

console.log(`Intent Coverage: ${metrics.intentCoverage.percentage}%`)
console.log(`Persona Accuracy: ${metrics.personaAccuracy.percentage}%`)
console.log(`Pricing Answer Rate: ${metrics.pricingAnswerRate.percentage}%`)
```

---

## Example Output

### Table Format
```
Metric                  | Value              | Details
────────────────────────────────────────────────────────────
Intent Coverage         | 87.5%              | 7/8
Persona Accuracy        | 100.0%             | 8/8
Pricing Answer Rate     | 75.0%              | 3/4
Forbidden Response Rate | 10.0%              | 1/10
Golden Response Match   | 80.0%              | 8/10
```

### JSON Format
```json
{
  "timestamp": "2024-01-01T12:00:00Z",
  "period": {
    "start": "2024-01-01T00:00:00Z",
    "end": "2024-01-31T23:59:59Z"
  },
  "sampleSize": 10,
  "metrics": {
    "intentCoverage": {
      "total": 10,
      "correct": 8,
      "percentage": 80.0,
      "breakdown": {
        "company_registration_pricing": {
          "correct": 2,
          "total": 2,
          "percentage": 100.0
        }
      }
    },
    "personaAccuracy": {
      "total": 10,
      "correct": 10,
      "percentage": 100.0,
      "breakdown": {
        "REGISTRATION": {
          "correct": 6,
          "total": 6,
          "percentage": 100.0
        },
        "ACCOUNTING": {
          "correct": 2,
          "total": 2,
          "percentage": 100.0
        },
        "HR": {
          "correct": 2,
          "total": 2,
          "percentage": 100.0
        }
      }
    },
    "pricingAnswerRate": {
      "total": 4,
      "answered": 3,
      "percentage": 75.0
    },
    "forbiddenResponseRate": {
      "total": 10,
      "violations": 1,
      "percentage": 10.0,
      "breakdown": {
        "legal_explanation": 1,
        "tax_calculation": 0,
        "hallucinated_url": 0,
        "placeholder_text": 0,
        "ai_claim": 0
      }
    },
    "goldenResponseMatchRate": {
      "total": 10,
      "matched": 8,
      "percentage": 80.0,
      "threshold": 0.7
    }
  }
}
```

---

## Testing

Run the example calculations:

```bash
# Using ts-node or similar
npx ts-node app/api/chat/dashboard.example.ts

# Or import in your test file
import { exampleGenerateReport } from './dashboard.example'
exampleGenerateReport()
```

---

## Production Integration

### 1. Collect Chat Logs
Store chat interactions in your database with the `ChatLogEntry` structure.

### 2. Generate Reports
Run dashboard calculations periodically (daily/weekly):

```typescript
// Daily report
const logs = await fetchChatLogs(startDate, endDate)
const report = generateDashboardReport(logs, startDate, endDate)

// Store or send report
await saveDashboardReport(report)
```

### 3. Monitor Metrics
Set up alerts for:
- Intent Coverage < 80%
- Persona Accuracy < 90%
- Pricing Answer Rate < 70%
- Forbidden Response Rate > 5%
- Golden Response Match < 75%

---

## Future Enhancements

1. **Semantic Similarity:** Use embeddings for better golden response matching
2. **Real-time Monitoring:** Stream metrics as chats happen
3. **Historical Trends:** Track metrics over time
4. **A/B Testing:** Compare metrics across different prompt versions
5. **Automated Alerts:** Notify when metrics drop below thresholds
