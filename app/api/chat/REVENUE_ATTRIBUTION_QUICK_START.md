# Revenue Attribution - Quick Start

## Overview

Link closed deals back to AI conversations to track which persona and intent generated revenue.

## Data Schema

### Deal

```typescript
{
  id: "deal-001",
  status: "closed_won",
  serviceType: "registration",
  dealValue: 25000,
  currency: "THB",
  createdDate: "2024-01-20T10:00:00.000Z",
  closedDate: "2024-01-25T10:00:00.000Z",
  
  // Attribution
  attributedConversationId: "chat-20240115-001",
  attributedPersona: "REGISTRATION",
  attributedIntent: "company_registration_pricing",
  attributionConfidence: 1.0,
  attributionMethod: "direct",
  
  // Customer
  customerEmail: "customer@example.com",
  customerPhone: "081-234-5678",
}
```

## Attribution Methods

| Method | Confidence | Description |
|--------|------------|-------------|
| `direct` | 1.0 | Deal has conversation ID |
| `session_match` | 0.9 | Deal has session ID match |
| `email_match` | 0.8 | Customer email matches |
| `phone_match` | 0.8 | Customer phone matches |
| `unknown` | 0.0 | No match found |

## Usage

### 1. Attribute Deal

```typescript
import { attributeDealToConversation } from './revenue-attribution'

const attribution = attributeDealToConversation(deal, conversations)

if (attribution.conversationId) {
  deal.attributedConversationId = attribution.conversationId
  deal.attributionConfidence = attribution.confidence
  deal.attributionMethod = attribution.method
}
```

### 2. Calculate Metrics

```typescript
import { calculateRevenueMetrics } from './revenue-attribution'

const metrics = calculateRevenueMetrics(deals, conversations)

console.log(`Total Revenue: ${metrics.totalRevenue} THB`)
console.log(`Conversion Rate: ${metrics.conversionRate}%`)
console.log(`REGISTRATION Revenue: ${metrics.revenueByPersona.REGISTRATION.revenue} THB`)
```

### 3. Generate Report

```typescript
import { formatRevenueReportAsTable } from './revenue-attribution'

const table = formatRevenueReportAsTable(metrics)
console.log(table)
```

## Example Metrics

```
Total Revenue: 280,000 THB
Total Deals: 4
Average Deal Value: 70,000 THB
Conversion Rate: 15.00%

REVENUE BY PERSONA
| Persona        | Revenue (THB)    | Deals | Conversion |
|----------------|------------------|-------|------------|
| REGISTRATION   |           175,000|     2 |       20.00%|
| ACCOUNTING     |            72,000|     1 |       10.00%|
| HR             |            33,000|     1 |       15.00%|
```

## SQL Queries

### Revenue by Persona

```sql
SELECT 
  attributed_persona,
  COUNT(*) as deals,
  SUM(deal_value) as revenue,
  AVG(deal_value) as avg_deal_value
FROM deals
WHERE status = 'closed_won'
GROUP BY attributed_persona;
```

## Files

- **`revenue-attribution.ts`** - Main module
- **`revenue-attribution.test.ts`** - Tests
- **`revenue-attribution-examples.json`** - Example deals
- **`REVENUE_ATTRIBUTION.md`** - Complete documentation
