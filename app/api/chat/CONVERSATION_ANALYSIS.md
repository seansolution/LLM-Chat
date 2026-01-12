# Conversation-Level Analysis

## Overview

Analyzes chat conversations at the session level to identify drop-off points, measure conversion metrics, and suggest optimization opportunities for wording, CTAs, and timing.

## Conversation Metrics

### ConversationMetrics

```typescript
{
  // Session Info
  sessionId: string
  userId?: string
  startTime: string
  endTime?: string
  duration: number // Seconds
  
  // Conversation Stats
  totalTurns: number
  totalMessages: number
  averageResponseTime: number
  
  // Outcome
  outcome: 'converted' | 'handoff' | 'dropped_off' | 'ongoing' | 'unknown'
  dropOffPoint: DropOffPoint
  dropOffTurn?: number
  
  // Conversion Metrics
  turnsToConversion?: number
  turnsToHandoff?: number
  conversionTime?: number
  handoffTime?: number
  
  // Intent & Persona
  primaryPersona: Persona
  primaryIntent: Intent
  intentChanges: number
  personaChanges: number
  
  // Engagement
  hasPricingQuestion: boolean
  hasOverviewQuestion: boolean
  pricingTurn?: number
  overviewTurn?: number
  
  // CTA Performance
  ctaShown: boolean
  ctaTurn?: number
  ctaVariant?: 'A' | 'B' | 'none'
  ctaResponseTime?: number
  
  // Handoff
  handoffReason?: HandoffReason
  handoffRequested: boolean
  
  // Drop-off Analysis
  lastUserMessage?: string
  lastAIResponse?: string
  lastResponseType?: string
  timeSinceLastMessage?: number
  
  // Optimization Flags
  optimizationFlags: OptimizationFlag[]
}
```

### Drop-Off Points

- `after_greeting` - User dropped off after first message
- `after_pricing` - User dropped off after pricing question
- `after_overview` - User dropped off after overview question
- `after_cta` - User dropped off after CTA shown
- `after_handoff` - User dropped off after handoff suggested
- `mid_conversation` - User dropped off in middle of conversation
- `none` - No drop-off

## Usage

### 1. Analyze Single Conversation

```typescript
import { analyzeConversation } from './conversation-analysis'

const chatLogs = [
  {
    id: 'chat-1',
    sessionId: 'session-123',
    timestamp: '2024-01-15T10:00:00.000Z',
    userMessage: 'สวัสดีครับ สนใจจดทะเบียนบริษัท',
    aiResponse: 'สวัสดีค่ะ! ยินดีต้อนรับ...',
    intent: { detected: 'greeting' },
    persona: { detected: 'REGISTRATION' },
    responseType: 'greeting',
    // ... other fields
  },
  // ... more logs
]

const metrics = analyzeConversation(chatLogs)

console.log(`Outcome: ${metrics.outcome}`)
console.log(`Drop-off point: ${metrics.dropOffPoint}`)
console.log(`Turns to conversion: ${metrics.turnsToConversion}`)
```

### 2. Analyze Multiple Conversations

```typescript
import { analyzeConversations } from './conversation-analysis'

// Load all conversations
const allConversations = await loadAllConversations()

// Analyze each conversation
const conversationMetrics = allConversations.map(conv => 
  analyzeConversation(conv.chatLogs)
)

// Generate insights
const analysis = analyzeConversations(conversationMetrics)

console.log(`Conversion rate: ${analysis.conversionRate}%`)
console.log(`Drop-off rate: ${analysis.dropOffRate}%`)
console.log(`Average turns to conversion: ${analysis.averageTurnsToConversion}`)
```

## Optimization Recommendations

### Recommendation Types

1. **Wording** - Improve message wording
2. **CTA** - Optimize call-to-action
3. **Timing** - Adjust timing of messages
4. **Intent** - Improve intent detection
5. **Persona** - Optimize persona routing
6. **Handoff** - Improve handoff process

### Example Recommendations

```json
{
  "type": "wording",
  "priority": "high",
  "title": "Improve Greeting Message",
  "description": "35.2% of users drop off after greeting",
  "impact": "Expected to reduce drop-off by 20-30%",
  "effort": "low",
  "abTestCandidate": {
    "testName": "greeting_message",
    "hypothesis": "More engaging greeting will reduce drop-off",
    "variantA": "Current greeting",
    "variantB": "More welcoming, action-oriented greeting",
    "metric": "Drop-off rate after greeting",
    "expectedImpact": "Reduce drop-off by 20%",
    "priority": "high"
  }
}
```

## A/B Test Candidates

### Generated Automatically

The system automatically generates A/B test candidates based on:

1. **High drop-off points** - Where users frequently drop off
2. **Low conversion rates** - Where conversion is below threshold
3. **Long conversion times** - Where it takes too many turns
4. **CTA performance** - Where CTA conversion is low

### Example A/B Test Candidates

```json
[
  {
    "testName": "greeting_message",
    "hypothesis": "More engaging greeting will reduce drop-off",
    "variantA": "Current greeting",
    "variantB": "More welcoming, action-oriented greeting",
    "metric": "Drop-off rate after greeting",
    "expectedImpact": "Reduce drop-off by 20%",
    "priority": "high"
  },
  {
    "testName": "pricing_response",
    "hypothesis": "Better pricing presentation will reduce drop-off",
    "variantA": "Current pricing format",
    "variantB": "Pricing with value proposition and payment options",
    "metric": "Drop-off rate after pricing",
    "expectedImpact": "Reduce drop-off by 15%",
    "priority": "high"
  },
  {
    "testName": "cta_wording",
    "hypothesis": "More compelling CTA will increase conversion",
    "variantA": "Current CTA wording",
    "variantB": "More urgent, value-focused CTA",
    "metric": "CTA conversion rate",
    "expectedImpact": "Increase CTA conversion by 25%",
    "priority": "high"
  }
]
```

## Key Metrics

### Conversion Metrics

- **Conversion Rate** - % of conversations that converted
- **Handoff Rate** - % of conversations that handed off
- **Drop-off Rate** - % of conversations that dropped off
- **Average Turns to Conversion** - Average number of turns before conversion
- **Average Turns to Handoff** - Average number of turns before handoff

### Drop-off Analysis

- **Drop-off Points** - Where users drop off (by point type)
- **Drop-off Percentage** - % of drop-offs at each point
- **Average Turn at Drop-off** - Average turn number where users drop off

### CTA Performance

- **CTA Shown** - Number of conversations with CTA
- **CTA Converted** - Number of conversions after CTA
- **CTA Conversion Rate** - % of CTA views that converted
- **Average CTA Response Time** - Average time from CTA to action

## Example Analysis Output

```json
{
  "totalConversations": 1000,
  "conversionRate": 15.5,
  "handoffRate": 8.2,
  "dropOffRate": 76.3,
  "averageTurnsToConversion": 3.2,
  "averageTurnsToHandoff": 4.1,
  "averageConversationDuration": 180,
  "dropOffPoints": {
    "after_greeting": {
      "count": 350,
      "percentage": 45.9,
      "averageTurn": 1.0
    },
    "after_pricing": {
      "count": 200,
      "percentage": 26.2,
      "averageTurn": 2.5
    },
    "after_cta": {
      "count": 100,
      "percentage": 13.1,
      "averageTurn": 3.8
    }
  },
  "ctaPerformance": {
    "shown": 600,
    "converted": 90,
    "conversionRate": 15.0,
    "averageResponseTime": 45
  },
  "recommendations": [
    {
      "type": "wording",
      "priority": "high",
      "title": "Improve Greeting Message",
      "description": "45.9% of users drop off after greeting",
      "impact": "Expected to reduce drop-off by 20-30%",
      "effort": "low"
    }
  ],
  "abTestCandidates": [
    {
      "testName": "greeting_message",
      "hypothesis": "More engaging greeting will reduce drop-off",
      "variantA": "Current greeting",
      "variantB": "More welcoming, action-oriented greeting",
      "metric": "Drop-off rate after greeting",
      "expectedImpact": "Reduce drop-off by 20%",
      "priority": "high"
    }
  ]
}
```

## SQL Queries

### Drop-off by Point

```sql
SELECT 
  drop_off_point,
  COUNT(*) as count,
  AVG(drop_off_turn) as avg_turn,
  COUNT(*) * 100.0 / SUM(COUNT(*)) OVER () as percentage
FROM conversation_metrics
WHERE outcome = 'dropped_off'
GROUP BY drop_off_point
ORDER BY count DESC;
```

### Conversion by Turn

```sql
SELECT 
  turns_to_conversion as turn,
  COUNT(*) as conversions,
  AVG(conversion_time) as avg_time_seconds
FROM conversation_metrics
WHERE outcome = 'converted'
  AND turns_to_conversion IS NOT NULL
GROUP BY turns_to_conversion
ORDER BY turn;
```

### CTA Performance

```sql
SELECT 
  cta_variant,
  COUNT(*) as shown,
  SUM(CASE WHEN outcome = 'converted' THEN 1 ELSE 0 END) as converted,
  AVG(cta_response_time) as avg_response_time_seconds
FROM conversation_metrics
WHERE cta_shown = true
GROUP BY cta_variant;
```

## Integration

### With Chat Logs

```typescript
// Load conversations by session
const sessions = await loadSessions()

// Analyze each session
const metrics = sessions.map(session => {
  const chatLogs = await loadChatLogsBySession(session.id)
  return analyzeConversation(chatLogs)
})

// Generate insights
const analysis = analyzeConversations(metrics)

// Store recommendations
await storeRecommendations(analysis.recommendations)

// Queue A/B tests
await queueABTests(analysis.abTestCandidates)
```

## Best Practices

1. **Analyze regularly** - Run analysis weekly/monthly
2. **Focus on high-priority recommendations** - Start with high-impact, low-effort
3. **Test recommendations** - Use A/B tests to validate
4. **Monitor trends** - Track metrics over time
5. **Iterate** - Continuously improve based on results

## Testing

```bash
pnpm test conversation-analysis
```

All tests pass ✅
