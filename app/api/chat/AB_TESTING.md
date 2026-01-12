# A/B Testing for Chat Response Wording

## Overview

A/B testing system to optimize chat response wording for better conversion metrics.

## Variants

### Variant A: Current (Baseline)
- **Tone:** Polite, informative, soft CTA
- **CTA:** "สนใจสอบถามเพิ่มเติม ติดต่อ 086-398-6889 หรือ zanhcpe@gmail.com นะคะ 😊"
- **Approach:** Informative, lets user decide

### Variant B: Sales-Oriented
- **Tone:** Direct, benefit-focused, stronger CTA
- **CTA:** "พร้อมเริ่มต้นได้เลยค่ะ! 📞 โทร 086-398-6889 หรือส่งอีเมล zanhcpe@gmail.com\nเราจะติดต่อกลับภายใน 24 ชั่วโมงค่ะ"
- **Approach:** Action-oriented, creates urgency

## Response Types Tested

1. **Pricing Responses**
   - Variant A: "ค่าบริการอยู่ที่ [ราคา]...\nสนใจสอบถามเพิ่มเติม..."
   - Variant B: "ราคา [ราคา]... - ครอบคลุมทุกขั้นตอน\nพร้อมเริ่มต้นได้เลยค่ะ! 📞..."

2. **Service Overview Responses**
   - Variant A: "เหมาะสำหรับ...\nเจ้าหน้าที่ช่วยดูให้ตรงกับธุรกิจของคุณ..."
   - Variant B: "เหมาะสำหรับ...\nต้องการคำแนะนำเฉพาะเจาะจงไหมคะ? 📞..."

3. **CTA Phrasing**
   - Variant A: Soft, polite invitation
   - Variant B: Direct call-to-action with urgency

## Assignment Logic

**Deterministic Hash-Based Assignment**

- Uses `userId` + `responseType` to generate hash
- Same user always gets same variant for same response type
- 50/50 split between variants
- Consistent user experience

```typescript
const variant = assignVariant(userId, responseType)
// Returns 'A' or 'B' deterministically
```

## Metrics Tracked

### 1. Contact Rate
- **Definition:** % of users who contact (phone/email/click)
- **Calculation:** `(users who contacted / total users) * 100`
- **Goal:** Higher is better

### 2. Conversation Continuation Rate
- **Definition:** % of users who send another message
- **Calculation:** `(users who continued / total users) * 100`
- **Goal:** Higher indicates engagement

### 3. Time to Contact
- **Definition:** Average seconds from response to contact
- **Calculation:** `sum(time_to_contact) / count(contacts)`
- **Goal:** Lower indicates faster conversion

### 4. Time to Human Handoff
- **Definition:** Average seconds until user requests human
- **Calculation:** `sum(time_to_handoff) / count(handoffs)`
- **Goal:** Lower indicates better self-service

### 5. Average Message Count
- **Definition:** Average messages per conversation
- **Calculation:** `sum(message_count) / count(conversations)`
- **Goal:** Context-dependent (higher = more engagement, but may indicate confusion)

## Implementation

### 1. Response Modification

The system automatically applies variants to responses:

```typescript
// In route.ts
const variant = assignVariant(userId, intent.responseType)
const finalReply = applyVariantToResponse(reply, intent.responseType, variant, userId)
```

### 2. Metric Tracking

Log A/B test events:

```typescript
// Log response metric
{
  type: 'ab_test_metric',
  variant: 'A' | 'B',
  responseType: 'pricing' | 'overview',
  userId: string,
  intent: string,
  persona: Persona,
  timestamp: Date,
}
```

### 3. Event Tracking

Track user actions:

```typescript
// Contact event
{
  userId: string,
  variant: 'A' | 'B',
  responseType: 'pricing' | 'overview',
  timestamp: Date,
  method: 'phone' | 'email' | 'click',
}

// Conversation event
{
  userId: string,
  variant: 'A' | 'B',
  responseType: 'pricing' | 'overview',
  timestamp: Date,
  event: 'message_sent' | 'conversation_ended' | 'human_requested',
  messageCount: number,
}
```

## Result Evaluation

### Generate Results

```typescript
import { generateABTestResults, formatABTestResults } from './ab-testing'

const results = generateABTestResults(metrics, contacts, conversations, 'pricing')
console.log(formatABTestResults(results, 'pricing'))
```

### Example Output

```
============================================================
A/B TEST RESULTS - PRICING
============================================================

Variant A (Current):
  Total Responses: 150
  Contact Rate: 12.50%
  Continuation Rate: 45.00%
  Avg Time to Contact: 180s
  Avg Time to Handoff: 300s
  Avg Message Count: 2.3

Variant B (Sales-Oriented):
  Total Responses: 148
  Contact Rate: 18.25%
  Continuation Rate: 52.00%
  Avg Time to Contact: 120s
  Avg Time to Handoff: 250s
  Avg Message Count: 2.8

Statistical Significance:
  p-value: 0.0234
  Significant: Yes
  Winner: Variant B
============================================================
```

### Statistical Significance

- Uses chi-square test
- p-value < 0.05 = statistically significant
- Winner determined by higher metric value

## Integration

### API Response

The API now includes `variant` in response:

```json
{
  "reply": "...",
  "intent": "company_registration_pricing",
  "persona": "REGISTRATION",
  "variant": "A" // or "B"
}
```

### Frontend Tracking

Track user actions on frontend:

```typescript
// When user clicks contact info
trackContactEvent({
  userId: sessionId,
  variant: response.variant,
  responseType: 'pricing',
  method: 'click',
})

// When user sends another message
trackConversationEvent({
  userId: sessionId,
  variant: response.variant,
  responseType: 'pricing',
  event: 'message_sent',
  messageCount: messageCount,
})
```

## Best Practices

1. **Sample Size:** Wait for at least 100 responses per variant before evaluating
2. **Duration:** Run test for at least 1-2 weeks to account for day-of-week effects
3. **Segmentation:** Analyze by persona, intent, and time period
4. **Statistical Significance:** Only declare winner if p < 0.05
5. **Consistency:** Same user always gets same variant (deterministic)

## Configuration

### Adjust Variant Split

Edit `assignVariant` function:

```typescript
// 50/50 split (default)
return Math.abs(hash) % 2 === 0 ? 'A' : 'B'

// 70/30 split (A/B)
return Math.abs(hash) % 10 < 7 ? 'A' : 'B'
```

### Add New Variants

1. Define variant in `VARIANT_A` or `VARIANT_B`
2. Update `getVariantCTA` function
3. Add to `applyVariantToResponse` logic

## Future Enhancements

1. **Multi-variant Testing:** Test 3+ variants simultaneously
2. **Contextual Variants:** Different variants for different personas
3. **Real-time Evaluation:** Auto-switch to winning variant
4. **Advanced Statistics:** Bayesian analysis, confidence intervals
5. **Database Storage:** Store metrics in database instead of logs
