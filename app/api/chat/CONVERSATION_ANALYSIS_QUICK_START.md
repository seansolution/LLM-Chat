# Conversation Analysis - Quick Start

## Overview

Analyzes conversations at the session level to identify drop-off points, measure conversion metrics, and suggest optimization opportunities.

## Quick Usage

```typescript
import { analyzeConversation, analyzeConversations } from './conversation-analysis'

// 1. Analyze single conversation
const metrics = analyzeConversation(chatLogs)

console.log(`Outcome: ${metrics.outcome}`)
console.log(`Drop-off point: ${metrics.dropOffPoint}`)
console.log(`Turns to conversion: ${metrics.turnsToConversion}`)

// 2. Analyze multiple conversations
const allMetrics = conversations.map(conv => analyzeConversation(conv.chatLogs))
const analysis = analyzeConversations(allMetrics)

console.log(`Conversion rate: ${analysis.conversionRate}%`)
console.log(`Drop-off rate: ${analysis.dropOffRate}%`)
```

## Key Metrics

### Conversation Outcomes

- `converted` - User contacted (phone/email/click)
- `handoff` - Handed off to human
- `dropped_off` - User stopped responding
- `ongoing` - Conversation still active

### Drop-Off Points

- `after_greeting` - After first message
- `after_pricing` - After pricing question
- `after_overview` - After overview question
- `after_cta` - After CTA shown
- `after_handoff` - After handoff suggested
- `mid_conversation` - In middle of conversation

## Optimization Recommendations

### High Priority

```json
{
  "type": "wording",
  "priority": "high",
  "title": "Improve Greeting Message",
  "description": "45.9% of users drop off after greeting",
  "impact": "Expected to reduce drop-off by 20-30%",
  "effort": "low"
}
```

## A/B Test Candidates

Automatically generated based on drop-off patterns:

```json
{
  "testName": "greeting_message",
  "hypothesis": "More engaging greeting will reduce drop-off",
  "variantA": "Current greeting",
  "variantB": "More welcoming, action-oriented greeting",
  "metric": "Drop-off rate after greeting",
  "expectedImpact": "Reduce drop-off by 20%",
  "priority": "high"
}
```

## Example Output

```
Total Conversations: 1000
Conversion Rate: 15.5%
Drop-off Rate: 76.3%
Average Turns to Conversion: 3.2

Drop-off Points:
- After greeting: 45.9% (350 conversations)
- After pricing: 26.2% (200 conversations)
- After CTA: 13.1% (100 conversations)

CTA Performance:
- Shown: 600
- Converted: 90
- Conversion Rate: 15.0%

Recommendations:
1. [HIGH] Improve Greeting Message (45.9% drop-off)
2. [HIGH] Optimize Pricing Response (26.2% drop-off)
3. [HIGH] Improve CTA Wording (13.1% drop-off)
```

## Files

- **`conversation-analysis.ts`** - Main module
- **`conversation-analysis.test.ts`** - Tests
- **`CONVERSATION_ANALYSIS.md`** - Complete documentation
