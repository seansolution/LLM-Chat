# Revenue Attribution System

## Overview

Revenue attribution system that links closed deals back to AI conversations, tracking which persona and intent generated the lead and calculating revenue contribution.

## Data Schema

### Deal Schema

```typescript
{
  id: string                    // Unique deal ID
  customerId?: string          // Customer identifier
  customerName?: string         // Customer name
  customerEmail?: string        // Customer email
  customerPhone?: string        // Customer phone
  
  // Deal Information
  status: 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost' | 'cancelled'
  serviceType: 'registration' | 'accounting' | 'hr' | 'work_permit' | 'multiple' | 'unknown'
  dealValue: number             // Total deal value in THB
  currency: string              // Default: 'THB'
  closedDate?: string          // ISO 8601 timestamp
  createdDate: string          // ISO 8601 timestamp
  
  // Attribution
  attributedConversationId?: string  // Chat log ID
  attributedSessionId?: string      // Session ID
  attributedUserId?: string          // User ID
  attributedIntent?: Intent          // Intent that generated lead
  attributedPersona?: Persona       // Persona that generated lead
  attributedTimestamp?: string       // ISO 8601 timestamp
  
  // Attribution Confidence
  attributionConfidence: number      // 0-1
  attributionMethod: 'direct' | 'session_match' | 'email_match' | 'phone_match' | 'manual' | 'unknown'
  
  // Sales Process
  firstContactDate?: string          // ISO 8601 timestamp
  daysToClose?: number               // Days from conversation to close
  salesRepId?: string                // Sales rep ID
  salesRepName?: string              // Sales rep name
  
  // Metadata
  notes?: string
  source?: string
  metadata?: Record<string, unknown>
}
```

## Attribution Logic

### Attribution Methods (Priority Order)

1. **Direct Match** (`direct`)
   - Deal has `attributedConversationId`
   - Confidence: 1.0

2. **Session Match** (`session_match`)
   - Deal has `attributedSessionId` matching conversation
   - Confidence: 0.9

3. **Email Match** (`email_match`)
   - Deal email matches conversation metadata email
   - Confidence: 0.8

4. **Phone Match** (`phone_match`)
   - Deal phone matches conversation metadata phone
   - Confidence: 0.8

5. **Time-Based Match** (`session_match`)
   - Deal created within 7 days of conversation
   - Uses most recent conversation before deal creation
   - Confidence: 0.6

6. **No Match** (`unknown`)
   - No matching criteria found
   - Confidence: 0

### Attribution Function

```typescript
import { attributeDealToConversation } from './revenue-attribution'

const attribution = attributeDealToConversation(deal, conversations)

if (attribution.conversationId) {
  // Deal successfully attributed
  deal.attributedConversationId = attribution.conversationId
  deal.attributionConfidence = attribution.confidence
  deal.attributionMethod = attribution.method
}
```

## Metrics Calculation

### Key Metrics

1. **Total Revenue**
   - Sum of all closed won deals
   - Formula: `SUM(dealValue WHERE status = 'closed_won')`

2. **Total Deals**
   - Count of closed won deals
   - Formula: `COUNT(WHERE status = 'closed_won')`

3. **Average Deal Value**
   - Average value of closed won deals
   - Formula: `totalRevenue / totalDeals`

4. **Conversion Rate**
   - % of conversations that led to closed deals
   - Formula: `(sessions_with_deals / total_sessions) * 100`

5. **Revenue by Persona**
   - Revenue, deals, average deal value, conversion rate per persona
   - Breakdown: REGISTRATION, ACCOUNTING, HR

6. **Revenue by Intent**
   - Revenue, deals, average deal value, conversion rate per intent
   - Breakdown: All intent types

7. **Revenue by Service Type**
   - Revenue, deals, average deal value per service type
   - Breakdown: registration, accounting, hr, work_permit, multiple, unknown

8. **Average Days to Close**
   - Average days from conversation to deal close
   - Formula: `AVG(daysToClose WHERE daysToClose IS NOT NULL)`

9. **Top Conversations**
   - Top 10 conversations by revenue
   - Includes: conversation ID, persona, intent, revenue, deals

### Calculation Function

```typescript
import { calculateRevenueMetrics } from './revenue-attribution'

const metrics = calculateRevenueMetrics(deals, conversations)

console.log(`Total Revenue: ${metrics.totalRevenue} THB`)
console.log(`Conversion Rate: ${metrics.conversionRate}%`)
console.log(`REGISTRATION Revenue: ${metrics.revenueByPersona.REGISTRATION.revenue} THB`)
```

## Example Reports

### Table Format

```
================================================================================
REVENUE ATTRIBUTION REPORT
================================================================================

SUMMARY
--------------------------------------------------------------------------------
Total Revenue: 280,000 THB
Total Deals: 4
Average Deal Value: 70,000 THB
Conversion Rate: 15.00%
Average Days to Close: 16.5 days

REVENUE BY PERSONA
--------------------------------------------------------------------------------
| Persona        | Revenue (THB)    | Deals | Avg Deal | Conversion |
|----------------|------------------|-------|----------|------------|
| REGISTRATION   |           175,000|     2 |    87,500|       20.00%|
| ACCOUNTING     |            72,000|     1 |    72,000|       10.00%|
| HR             |            33,000|     1 |    33,000|       15.00%|

REVENUE BY INTENT
--------------------------------------------------------------------------------
| Intent                          | Revenue (THB)    | Deals | Avg Deal | Conversion |
|----------------------------------|------------------|-------|----------|------------|
| company_registration_pricing     |           175,000|     2 |    87,500|       25.00%|
| accounting_pricing              |            72,000|     1 |    72,000|       20.00%|
| hr_pricing                       |            33,000|     1 |    33,000|       15.00%|

REVENUE BY SERVICE TYPE
--------------------------------------------------------------------------------
| Service Type  | Revenue (THB)    | Deals | Avg Deal |
|---------------|------------------|-------|----------|
| registration  |           175,000|     2 |    87,500|
| accounting    |            72,000|     1 |    72,000|
| hr            |            33,000|     1 |    33,000|
| multiple      |                 0|     0 |         0|

TOP CONVERSATIONS BY REVENUE
--------------------------------------------------------------------------------
| Conversation ID | Persona        | Intent                          | Revenue (THB)    | Deals |
|-----------------|----------------|----------------------------------|------------------|-------|
| chat-20240115-001| REGISTRATION  | company_registration_pricing     |           150,000|     1 |
| chat-20240116-002| ACCOUNTING    | accounting_pricing              |            72,000|     1 |
================================================================================
```

### JSON Format

```json
{
  "totalRevenue": 280000,
  "totalDeals": 4,
  "averageDealValue": 70000,
  "conversionRate": 15.0,
  "revenueByPersona": {
    "REGISTRATION": {
      "revenue": 175000,
      "deals": 2,
      "averageDealValue": 87500,
      "conversionRate": 20.0
    },
    "ACCOUNTING": {
      "revenue": 72000,
      "deals": 1,
      "averageDealValue": 72000,
      "conversionRate": 10.0
    },
    "HR": {
      "revenue": 33000,
      "deals": 1,
      "averageDealValue": 33000,
      "conversionRate": 15.0
    }
  },
  "revenueByIntent": {
    "company_registration_pricing": {
      "revenue": 175000,
      "deals": 2,
      "averageDealValue": 87500,
      "conversionRate": 25.0
    },
    "accounting_pricing": {
      "revenue": 72000,
      "deals": 1,
      "averageDealValue": 72000,
      "conversionRate": 20.0
    }
  },
  "revenueByServiceType": {
    "registration": {
      "revenue": 175000,
      "deals": 2,
      "averageDealValue": 87500
    },
    "accounting": {
      "revenue": 72000,
      "deals": 1,
      "averageDealValue": 72000
    }
  },
  "averageDaysToClose": 16.5,
  "topConversations": [
    {
      "conversationId": "chat-20240115-001",
      "revenue": 150000,
      "deals": 1,
      "persona": "REGISTRATION",
      "intent": "company_registration_pricing"
    }
  ]
}
```

## Usage

### 1. Attribute Deals to Conversations

```typescript
import { attributeDealToConversation } from './revenue-attribution'

// Load deals and conversations
const deals = await loadDeals()
const conversations = await loadConversations()

// Attribute each deal
const attributedDeals = deals.map(deal => {
  const attribution = attributeDealToConversation(deal, conversations)
  return {
    ...deal,
    attributedConversationId: attribution.conversationId,
    attributionConfidence: attribution.confidence,
    attributionMethod: attribution.method,
  }
})
```

### 2. Calculate Revenue Metrics

```typescript
import { calculateRevenueMetrics } from './revenue-attribution'

const metrics = calculateRevenueMetrics(attributedDeals, conversations)

console.log(`Total Revenue: ${metrics.totalRevenue.toLocaleString()} THB`)
console.log(`Conversion Rate: ${metrics.conversionRate.toFixed(2)}%`)
```

### 3. Generate Reports

```typescript
import { formatRevenueReportAsTable, formatRevenueReportAsJSON } from './revenue-attribution'

// Table format
const table = formatRevenueReportAsTable(metrics)
console.log(table)

// JSON format
const json = formatRevenueReportAsJSON(metrics)
console.log(json)
```

## SQL Queries (PostgreSQL)

### Revenue by Persona

```sql
SELECT 
  d.attributed_persona as persona,
  COUNT(*) as deals,
  SUM(d.deal_value) as revenue,
  AVG(d.deal_value) as avg_deal_value
FROM deals d
WHERE d.status = 'closed_won'
  AND d.attributed_persona IS NOT NULL
GROUP BY d.attributed_persona
ORDER BY revenue DESC;
```

### Revenue by Intent

```sql
SELECT 
  d.attributed_intent as intent,
  COUNT(*) as deals,
  SUM(d.deal_value) as revenue,
  AVG(d.deal_value) as avg_deal_value
FROM deals d
WHERE d.status = 'closed_won'
  AND d.attributed_intent IS NOT NULL
GROUP BY d.attributed_intent
ORDER BY revenue DESC;
```

### Conversion Rate by Persona

```sql
WITH persona_sessions AS (
  SELECT DISTINCT 
    c.persona->>'detected' as persona,
    c.session_id
  FROM chat_logs c
  WHERE c.timestamp >= NOW() - INTERVAL '30 days'
),
persona_deals AS (
  SELECT DISTINCT
    d.attributed_persona as persona,
    c.session_id
  FROM deals d
  JOIN chat_logs c ON c.id = d.attributed_conversation_id
  WHERE d.status = 'closed_won'
    AND d.attributed_persona IS NOT NULL
)
SELECT 
  ps.persona,
  COUNT(DISTINCT ps.session_id) as total_sessions,
  COUNT(DISTINCT pd.session_id) as sessions_with_deals,
  ROUND(
    COUNT(DISTINCT pd.session_id)::numeric / 
    NULLIF(COUNT(DISTINCT ps.session_id), 0)::numeric * 100, 
    2
  ) as conversion_rate
FROM persona_sessions ps
LEFT JOIN persona_deals pd ON ps.persona = pd.persona AND ps.session_id = pd.session_id
GROUP BY ps.persona
ORDER BY conversion_rate DESC;
```

### Average Days to Close

```sql
SELECT 
  AVG(d.days_to_close) as avg_days_to_close,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY d.days_to_close) as median_days_to_close,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY d.days_to_close) as p95_days_to_close
FROM deals d
WHERE d.status = 'closed_won'
  AND d.days_to_close IS NOT NULL;
```

## Integration with Chat Logs

### Update Chat Log Schema

When a deal is closed, update the conversation's attribution:

```typescript
// In chat log schema
{
  // ... existing fields ...
  revenue: {
    attributedDeals: string[], // Deal IDs
    totalAttributedRevenue: number,
    attributionCount: number,
  }
}
```

### Track Attribution in Real-Time

```typescript
// When deal is created/closed
const deal: Deal = {
  // ... deal fields ...
  attributedConversationId: conversationId,
  attributedPersona: persona,
  attributedIntent: intent,
}

// Update conversation log
await updateChatLog(conversationId, {
  revenue: {
    attributedDeals: [...existingDeals, deal.id],
    totalAttributedRevenue: existingRevenue + deal.dealValue,
    attributionCount: existingCount + 1,
  }
})
```

## Best Practices

1. **Attribution Window:** Use 7-30 day window for time-based attribution
2. **Confidence Thresholds:** Only attribute deals with confidence ≥ 0.6
3. **Manual Review:** Review low-confidence attributions manually
4. **Data Quality:** Ensure customer email/phone in conversation metadata
5. **Regular Updates:** Update attributions when deals change status
6. **Audit Trail:** Keep history of attribution changes

## Testing

```bash
pnpm test revenue-attribution
```

All tests pass ✅
