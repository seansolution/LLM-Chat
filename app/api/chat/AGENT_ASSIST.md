# Agent Assist System

## Overview

Agent Assist system provides sales agents with intelligent summaries, persona identification, buying intent detection, and next best action suggestions when taking over AI chat conversations. **Key feature: Avoids repeating questions already answered by the AI.**

## Summary Schema

### ConversationSummary

```typescript
{
  // Core Summary
  summary: string                    // 1-2 sentence summary
  keyPoints: string[]                // Key points (max 5)
  
  // Customer Context
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  customerCompany?: string
  
  // Intent & Persona
  persona: Persona                   // REGISTRATION | ACCOUNTING | HR
  primaryIntent: Intent              // Detected intent
  buyingIntent: BuyingIntent        // ready_to_buy | price_comparison | information_seeking | ...
  urgencyLevel: UrgencyLevel        // high | medium | low | unknown
  
  // Conversation Context
  messageCount: number
  conversationDuration: number      // Seconds
  topicsDiscussed: string[]
  questionsAsked: string[]
  pricesMentioned: string[]
  
  // Handoff Context
  handoffReason: HandoffReason
  handoffTimestamp: string
  
  // What NOT to Ask (Critical!)
  alreadyAnswered: {
    pricing: boolean                 // Price already discussed
    timeline: boolean                // Timeline already discussed
    requirements: boolean            // Requirements already discussed
    contactInfo: boolean             // Contact info already shared
    serviceDetails: boolean          // Service details already explained
  }
  
  // Next Best Action
  suggestedAction: SuggestedAction
  suggestedScript?: string           // Opening script for agent
}
```

### BuyingIntent Types

- `ready_to_buy` - Customer is ready to purchase
- `price_comparison` - Comparing prices/options
- `information_seeking` - Gathering information
- `problem_solving` - Has a specific problem to solve
- `exploring` - Just exploring options
- `urgent` - Needs immediate solution
- `unknown` - Cannot determine

### SuggestedAction Types

- `call` - Call customer immediately
- `email` - Send email with details
- `schedule` - Schedule a meeting
- `send_proposal` - Send proposal/quote
- `follow_up` - Follow up later
- `qualify` - Qualify the lead first
- `close` - Attempt to close the deal

## Usage

### 1. Generate Summary from Chat Logs

```typescript
import { generateConversationSummary } from './agent-assist'

const chatLogs = [
  {
    id: 'chat-1',
    sessionId: 'session-123',
    timestamp: '2024-01-15T10:00:00.000Z',
    userMessage: 'สวัสดีครับ สนใจจดทะเบียนบริษัท ราคาเท่าไหร่ครับ',
    aiResponse: 'สวัสดีค่ะ! สำหรับการจดทะเบียนบริษัท ราคาเริ่มต้นที่ 25,000 บาท...',
    intent: { detected: 'company_registration_pricing' },
    persona: { detected: 'REGISTRATION' },
    responseType: 'pricing',
    pricing: {
      questionType: 'explicit',
      containsPrice: true,
      priceValue: '25,000 บาท',
    },
    handoff: {
      reason: 'user_requested',
      requestedAt: '2024-01-15T10:02:00.000Z',
    },
    metadata: {
      userEmail: 'customer@example.com',
      userPhone: '081-234-5678',
    },
  },
  // ... more logs
]

const summary = generateConversationSummary(chatLogs)

console.log(summary.summary)
// "ลูกค้าสนใจการจดทะเบียนบริษัท และได้สอบถามราคาแล้ว มีการสนทนา 3 ข้อความ"

console.log(summary.alreadyAnswered)
// {
//   pricing: true,
//   timeline: true,
//   requirements: true,
//   contactInfo: true,
//   serviceDetails: true
// }
```

### 2. Format for Agent Display

```typescript
import { formatAgentAssistOutput } from './agent-assist'

const output = formatAgentAssistOutput(summary, chatLogs)

// Display to agent
console.log(output.actionCard.suggestedScript)
console.log(output.actionCard.doNotAsk)
// [
//   "❌ อย่าถามราคา (ลูกค้าทราบแล้ว)",
//   "❌ อย่าถามระยะเวลา (ลูกค้าทราบแล้ว)",
//   ...
// ]
```

## Agent-Facing Output Format

### JSON Structure

```json
{
  "handoffId": "chat-20240115-001",
  "timestamp": "2024-01-15T10:02:00.000Z",
  "priority": "high",
  "quickSummary": {
    "customer": "customer@example.com",
    "persona": "REGISTRATION",
    "intent": "สอบถามราคาจดทะเบียนบริษัท",
    "buyingIntent": "ready_to_buy",
    "urgency": "high"
  },
  "summary": {
    "summary": "ลูกค้าสนใจการจดทะเบียนบริษัท และได้สอบถามราคาแล้ว...",
    "keyPoints": ["สนใจจดทะเบียนบริษัท", "สอบถามราคาแล้ว", ...],
    "persona": "REGISTRATION",
    "buyingIntent": "ready_to_buy",
    "urgencyLevel": "high",
    "alreadyAnswered": {
      "pricing": true,
      "timeline": true,
      "requirements": true,
      "contactInfo": true,
      "serviceDetails": true
    },
    "suggestedAction": {
      "type": "call",
      "priority": "high",
      "reason": "ลูกค้าพร้อมซื้อและมีความเร่งด่วน",
      "timeline": "ภายใน 1 ชั่วโมง",
      "estimatedValue": 25000
    },
    "suggestedScript": "สวัสดีคุณcustomer ฉันเป็นเจ้าหน้าที่..."
  },
  "actionCard": {
    "suggestedAction": { ... },
    "suggestedScript": "...",
    "doNotAsk": [
      "❌ อย่าถามราคา (ลูกค้าทราบแล้ว)",
      "❌ อย่าถามระยะเวลา (ลูกค้าทราบแล้ว)"
    ]
  },
  "conversationHistory": [
    {
      "timestamp": "2024-01-15T10:00:00.000Z",
      "userMessage": "สวัสดีครับ สนใจจดทะเบียนบริษัท ราคาเท่าไหร่ครับ",
      "aiResponse": "สวัสดีค่ะ! สำหรับการจดทะเบียนบริษัท...",
      "intent": "company_registration_pricing"
    }
  ]
}
```

## Suggestion Examples

### Example 1: Ready to Buy (High Priority)

**Scenario:** Customer asked about pricing, timeline, and requested to speak with agent.

**Output:**
```json
{
  "buyingIntent": "ready_to_buy",
  "urgencyLevel": "high",
  "suggestedAction": {
    "type": "call",
    "priority": "high",
    "reason": "ลูกค้าพร้อมซื้อและมีความเร่งด่วน",
    "timeline": "ภายใน 1 ชั่วโมง",
    "estimatedValue": 25000
  },
  "suggestedScript": "สวัสดีคุณcustomer ฉันเป็นเจ้าหน้าที่จากบริษัท ABC จำกัด\n\nเห็นว่าคุณสนใจการจดทะเบียนบริษัท และได้คุยกับแอดมินไปแล้ว\n\nเข้าใจว่าคุณได้ทราบราคาแล้ว และทราบระยะเวลาแล้ว \n\nคุณพร้อมที่จะเริ่มได้เลยไหมคะ? เราสามารถช่วยคุณได้ทันทีค่ะ",
  "doNotAsk": [
    "❌ อย่าถามราคา (ลูกค้าทราบแล้ว)",
    "❌ อย่าถามระยะเวลา (ลูกค้าทราบแล้ว)",
    "❌ อย่าถามเอกสารที่ต้องใช้ (ลูกค้าทราบแล้ว)"
  ]
}
```

### Example 2: Price Comparison (Medium Priority)

**Scenario:** Customer asked about multiple pricing options.

**Output:**
```json
{
  "buyingIntent": "price_comparison",
  "urgencyLevel": "medium",
  "suggestedAction": {
    "type": "send_proposal",
    "priority": "high",
    "reason": "ลูกค้ากำลังเปรียบเทียบราคา ควรส่ง proposal เร็ว",
    "timeline": "ภายใน 24 ชั่วโมง",
    "estimatedValue": 180000
  },
  "suggestedScript": "สวัสดีค่ะ ฉันเป็นเจ้าหน้าที่จากบริษัท ABC จำกัด\n\nเห็นว่าคุณสนใจบริการบัญชีและภาษี และได้คุยกับแอดมินไปแล้ว\n\nเข้าใจว่าคุณได้ทราบราคาแล้ว \n\nมีคำถามเพิ่มเติมเกี่ยวกับแพ็กเกจหรือราคาไหมคะ?",
  "doNotAsk": [
    "❌ อย่าถามราคา (ลูกค้าทราบแล้ว)"
  ]
}
```

### Example 3: Information Seeking (Low Priority)

**Scenario:** Customer asked general questions, no pricing mentioned.

**Output:**
```json
{
  "buyingIntent": "information_seeking",
  "urgencyLevel": "low",
  "suggestedAction": {
    "type": "email",
    "priority": "medium",
    "reason": "ลูกค้ากำลังหาข้อมูล ควรส่งรายละเอียดเพิ่มเติม",
    "timeline": "ภายใน 24 ชั่วโมง"
  },
  "suggestedScript": "สวัสดีค่ะ ฉันเป็นเจ้าหน้าที่จากบริษัท ABC จำกัด\n\nเห็นว่าคุณสนใจบริการ HR และเงินเดือน และได้คุยกับแอดมินไปแล้ว\n\nมีอะไรให้ช่วยเพิ่มเติมไหมคะ?",
  "doNotAsk": []
}
```

## Integration with Handoff System

### In route.ts

```typescript
import { generateConversationSummary, formatAgentAssistOutput } from './agent-assist'

// When handoff is triggered
if (handoffDecision.shouldHandoff) {
  // Load conversation history
  const conversationHistory = await loadConversationHistory(sessionId)
  
  // Generate summary
  const summary = generateConversationSummary(conversationHistory)
  
  // Format for agent
  const agentOutput = formatAgentAssistOutput(summary, conversationHistory)
  
  // Store in handoff queue
  await storeHandoff({
    handoffId: summary.metadata.conversationId,
    agentOutput,
    priority: summary.suggestedAction.priority,
  })
  
  // Return handoff response to user
  return NextResponse.json({
    reply: getHandoffResponse(handoffDecision.reason),
    handoff: {
      status: 'requested',
      reason: handoffDecision.reason,
      handoffId: summary.metadata.conversationId,
    },
  })
}
```

## UI Display Suggestions

### Dashboard Card

```
┌─────────────────────────────────────────────────┐
│ 🚨 HIGH PRIORITY - Call within 1 hour          │
├─────────────────────────────────────────────────┤
│ Customer: customer@example.com                  │
│ Persona: REGISTRATION                           │
│ Intent: ready_to_buy                            │
│                                                 │
│ Summary:                                        │
│ ลูกค้าสนใจการจดทะเบียนบริษัท และได้สอบถามราคาแล้ว│
│                                                 │
│ ⚠️ DO NOT ASK:                                  │
│ ❌ อย่าถามราคา (ลูกค้าทราบแล้ว)                  │
│ ❌ อย่าถามระยะเวลา (ลูกค้าทราบแล้ว)               │
│                                                 │
│ 💬 Suggested Script:                            │
│ สวัสดีคุณcustomer ฉันเป็นเจ้าหน้าที่...         │
│                                                 │
│ [View Full Conversation] [Call Now]              │
└─────────────────────────────────────────────────┘
```

## Best Practices

1. **Always check `alreadyAnswered`** before asking questions
2. **Use `suggestedScript`** as starting point, customize as needed
3. **Follow `suggestedAction.timeline`** for response time
4. **Review `conversationHistory`** for full context
5. **Update handoff status** after contacting customer

## Testing

```bash
pnpm test agent-assist
```

All tests pass ✅
