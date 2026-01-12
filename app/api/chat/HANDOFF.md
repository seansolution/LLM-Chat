# Smart Handoff System

## Overview

Intelligent handoff detection that automatically routes conversations to human support when needed.

## Handoff Conditions

Handoff is triggered if **ANY** of the following conditions are true:

1. **Restricted Legal Intent** (`intent === "restricted_legal"`)
   - User asks about legal procedures or complex legal questions
   - Reason: `legal_inquiry`

2. **Low Confidence** (`confidence < 0.6`)
   - Intent detection confidence is below 60%
   - Reason: `low_confidence`

3. **Long Conversation** (`user_message_count >= 4`)
   - User has sent 4 or more messages
   - Reason: `long_conversation`

4. **User Requests Contact** (`user_asks_contact === true`)
   - User explicitly asks to speak with a human
   - Reason: `user_requested`
   - **Priority:** Highest (checked first)

## Priority Order

Handoff conditions are checked in this order (highest priority first):

1. `user_requested` - User explicitly asks for human
2. `legal_inquiry` - Restricted legal intent
3. `low_confidence` - Low confidence score
4. `long_conversation` - 4+ messages

## Implementation

### Handoff Detection Function

```typescript
import { shouldHandoff } from './handoff'

const decision = shouldHandoff({
  intent: 'restricted_legal',
  confidence: 0.5,
  userMessageCount: 4,
  userMessage: 'อยากพูดกับเจ้าหน้าที่',
})

if (decision.shouldHandoff) {
  // Return handoff response
}
```

### API Request

```typescript
// POST /api/chat
{
  "message": "อยากพูดกับเจ้าหน้าที่",
  "sessionId": "session-123",
  "messageCount": 4,  // Current message count
  "confidence": 0.5   // Optional: intent confidence
}
```

### API Response

```typescript
{
  "reply": "ยินดีค่ะ! เจ้าหน้าที่พร้อมให้คำปรึกษาค่ะ...",
  "intent": "unknown",
  "persona": "REGISTRATION",
  "handoff": {
    "status": "requested",
    "reason": "user_requested",
    "requestedAt": "2024-01-15T10:00:00.000Z"
  },
  "variant": "none"
}
```

## Handoff Reasons

| Reason | Trigger | Response Message |
|--------|---------|------------------|
| `user_requested` | User asks to contact | "ยินดีค่ะ! เจ้าหน้าที่พร้อมให้คำปรึกษาค่ะ..." |
| `legal_inquiry` | Restricted legal intent | "กรณีนี้เป็นรายละเอียดเชิงลึก..." |
| `low_confidence` | Confidence < 0.6 | "ขออภัยค่ะ ยังไม่แน่ใจในคำตอบ..." |
| `long_conversation` | Message count >= 4 | "ดูเหมือนว่าคุณมีคำถามหลายข้อ..." |
| `complex_question` | Complex question detected | "คำถามนี้ค่อนข้างซับซ้อน..." |
| `technical_issue` | Technical problem | "ขออภัยค่ะ เกิดปัญหาทางเทคนิค..." |
| `pricing_negotiation` | Pricing discussion | "สำหรับการเจรจาราคา..." |

## User Contact Detection

The system detects when users ask to contact/speak with someone using these patterns:

- `พูดกับ|คุยกับ|ติดต่อ|โทรหา|พบ|เจอ`
- `พนักงาน|เจ้าหน้าที่|คน|human|staff|agent`
- `ต้องการ.*พูด|อยาก.*พูด|ขอ.*พูด`
- `ให้.*ติดต่อ|ให้.*โทร`
- `มี.*คน.*ไหม|มี.*เจ้าหน้าที่`

## Examples

### Example 1: User Requests Contact

**Request:**
```json
{
  "message": "อยากพูดกับเจ้าหน้าที่",
  "sessionId": "session-123",
  "messageCount": 1
}
```

**Response:**
```json
{
  "reply": "ยินดีค่ะ! เจ้าหน้าที่พร้อมให้คำปรึกษาค่ะ...",
  "handoff": {
    "status": "requested",
    "reason": "user_requested"
  }
}
```

### Example 2: Long Conversation

**Request:**
```json
{
  "message": "มีคำถามเพิ่มเติม",
  "sessionId": "session-123",
  "messageCount": 4
}
```

**Response:**
```json
{
  "reply": "ดูเหมือนว่าคุณมีคำถามหลายข้อที่ต้องการคำปรึกษาเพิ่มเติม...",
  "handoff": {
    "status": "requested",
    "reason": "long_conversation"
  }
}
```

### Example 3: Low Confidence

**Request:**
```json
{
  "message": "คำถามที่ไม่ชัดเจน",
  "sessionId": "session-123",
  "messageCount": 1,
  "confidence": 0.4
}
```

**Response:**
```json
{
  "reply": "ขออภัยค่ะ ยังไม่แน่ใจในคำตอบที่ถูกต้องสำหรับคำถามนี้...",
  "handoff": {
    "status": "requested",
    "reason": "low_confidence"
  }
}
```

### Example 4: Restricted Legal

**Request:**
```json
{
  "message": "ขั้นตอนการจดทะเบียนบริษัทเป็นอย่างไร",
  "sessionId": "session-123",
  "messageCount": 1
}
```

**Response:**
```json
{
  "reply": "กรณีนี้เป็นรายละเอียดเชิงลึก เจ้าหน้าที่จะช่วยแนะนำได้ตรงกับสถานการณ์มากกว่าค่ะ...",
  "handoff": {
    "status": "requested",
    "reason": "legal_inquiry"
  }
}
```

## Testing

```bash
pnpm test handoff
```

All tests pass ✅

## Integration with Chat Log Schema

Handoff information is automatically included in chat logs:

```typescript
{
  handoff: {
    status: 'requested' | 'none' | 'completed' | 'declined',
    reason: HandoffReason,
    requestedAt: string, // ISO 8601 timestamp
    completedAt?: string,
    timeToRequest?: number // Seconds
  }
}
```

## Metrics

Track handoff metrics in the quality dashboard:

- **Handoff Rate:** % of conversations requiring handoff
- **Handoff by Reason:** Breakdown by reason type
- **Time to Handoff:** Average time until handoff request
- **Handoff Success Rate:** % of handoffs that result in contact

## Best Practices

1. **Track Message Count:** Frontend should track and send `messageCount` in each request
2. **Confidence Scores:** If using semantic intent detection, include confidence scores
3. **User Experience:** Handoff should be seamless and helpful
4. **Monitoring:** Track handoff rates and reasons for optimization
