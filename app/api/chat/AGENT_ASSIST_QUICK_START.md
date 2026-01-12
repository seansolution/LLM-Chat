# Agent Assist - Quick Start

## Overview

Agent Assist provides sales agents with conversation summaries, buying intent detection, and next best action suggestions when taking over AI chat conversations. **Key feature: Prevents repeating questions already answered.**

## Quick Usage

```typescript
import { generateConversationSummary, formatAgentAssistOutput } from './agent-assist'

// 1. Load conversation history
const chatLogs = await loadConversationHistory(sessionId)

// 2. Generate summary
const summary = generateConversationSummary(chatLogs)

// 3. Format for agent display
const agentOutput = formatAgentAssistOutput(summary, chatLogs)

// 4. Display to agent
console.log(agentOutput.actionCard.suggestedScript)
console.log(agentOutput.actionCard.doNotAsk)
```

## Summary Schema

```typescript
{
  summary: string                    // 1-2 sentence summary
  persona: Persona                   // REGISTRATION | ACCOUNTING | HR
  buyingIntent: BuyingIntent        // ready_to_buy | price_comparison | ...
  urgencyLevel: UrgencyLevel        // high | medium | low
  alreadyAnswered: {
    pricing: boolean                 // ⚠️ Don't ask price again!
    timeline: boolean                // ⚠️ Don't ask timeline again!
    requirements: boolean            // ⚠️ Don't ask requirements again!
    contactInfo: boolean             // ⚠️ Don't share contact again!
  }
  suggestedAction: {
    type: 'call' | 'email' | 'send_proposal' | ...
    priority: 'high' | 'medium' | 'low'
    timeline: string                 // "ภายใน 1 ชั่วโมง"
  }
  suggestedScript: string           // Opening script for agent
}
```

## Example Output

### High Priority - Ready to Buy

```json
{
  "priority": "high",
  "quickSummary": {
    "customer": "customer@example.com",
    "persona": "REGISTRATION",
    "buyingIntent": "ready_to_buy",
    "urgency": "high"
  },
  "actionCard": {
    "suggestedAction": {
      "type": "call",
      "priority": "high",
      "reason": "ลูกค้าพร้อมซื้อและมีความเร่งด่วน",
      "timeline": "ภายใน 1 ชั่วโมง"
    },
    "suggestedScript": "สวัสดีคุณcustomer ฉันเป็นเจ้าหน้าที่...",
    "doNotAsk": [
      "❌ อย่าถามราคา (ลูกค้าทราบแล้ว)",
      "❌ อย่าถามระยะเวลา (ลูกค้าทราบแล้ว)"
    ]
  }
}
```

## Buying Intent Types

| Intent | Description | Suggested Action |
|--------|-------------|------------------|
| `ready_to_buy` | Customer ready to purchase | Call immediately |
| `price_comparison` | Comparing prices | Send proposal |
| `information_seeking` | Gathering information | Email with details |
| `problem_solving` | Has specific problem | Qualify first |
| `urgent` | Needs immediate solution | Call within 1 hour |
| `exploring` | Just exploring | Follow up later |

## Integration

### With Handoff System

```typescript
// In route.ts
if (handoffDecision.shouldHandoff) {
  const conversationHistory = await loadConversationHistory(sessionId)
  const summary = generateConversationSummary(conversationHistory)
  const agentOutput = formatAgentAssistOutput(summary, conversationHistory)
  
  // Store in handoff queue
  await storeHandoff({
    handoffId: summary.metadata.conversationId,
    agentOutput,
    priority: summary.suggestedAction.priority,
  })
}
```

## Best Practices

1. ✅ **Always check `alreadyAnswered`** before asking questions
2. ✅ **Use `suggestedScript`** as starting point
3. ✅ **Follow `timeline`** for response time
4. ✅ **Review `conversationHistory`** for full context
5. ❌ **Never repeat questions** listed in `doNotAsk`

## Files

- **`agent-assist.ts`** - Main module
- **`agent-assist.test.ts`** - Tests
- **`agent-assist-examples.json`** - Example outputs
- **`AGENT_ASSIST.md`** - Complete documentation
