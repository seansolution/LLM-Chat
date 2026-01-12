# A/B Testing - Quick Start

## What It Does

Tests two wording variants to optimize conversion:
- **Variant A:** Current polite wording (baseline)
- **Variant B:** Sales-oriented wording (test)

## Variants

### Pricing Response

**Variant A:**
```
ค่าบริการอยู่ที่ [ราคา] ([ครั้งเดียว / ต่อเดือน])
ใช้เวลาประมาณ [ระยะเวลา]

สนใจสอบถามเพิ่มเติม ติดต่อ 086-398-6889 หรือ zanhcpe@gmail.com นะคะ 😊
```

**Variant B:**
```
ราคา [ราคา] ([ครั้งเดียว / ต่อเดือน]) - ครอบคลุมทุกขั้นตอน
ใช้เวลาเพียง [ระยะเวลา]

พร้อมเริ่มต้นได้เลยค่ะ! 📞 โทร 086-398-6889 หรือส่งอีเมล zanhcpe@gmail.com
เราจะติดต่อกลับภายใน 24 ชั่วโมงค่ะ
```

### Service Overview

**Variant A:**
```
เหมาะสำหรับ [กลุ่มเป้าหมาย]
ราคาเริ่มต้นที่ [ราคา]

เจ้าหน้าที่ช่วยดูให้ตรงกับธุรกิจของคุณได้เลยค่ะ
สนใจสอบถามเพิ่มเติม ติดต่อ 086-398-6889 หรือ zanhcpe@gmail.com นะคะ 😊
```

**Variant B:**
```
เหมาะสำหรับ [กลุ่มเป้าหมาย]
ราคาเริ่มต้นที่ [ราคา] - คุ้มค่ากับการลงทุน

ต้องการคำแนะนำเฉพาะเจาะจงไหมคะ? 📞 โทร 086-398-6889 หรือส่งอีเมล zanhcpe@gmail.com
เจ้าหน้าที่พร้อมให้คำปรึกษาฟรีค่ะ
```

## How It Works

1. **Deterministic Assignment:** Same user always gets same variant
2. **Hash-Based:** Uses `userId + responseType` to assign
3. **50/50 Split:** Equal distribution between variants
4. **Only CTA Changes:** Main response content stays the same

## Metrics Tracked

| Metric | Definition | Goal |
|--------|------------|------|
| Contact Rate | % who contact (phone/email/click) | Higher |
| Continuation Rate | % who send another message | Higher |
| Time to Contact | Avg seconds until contact | Lower |
| Time to Handoff | Avg seconds until human requested | Lower |
| Message Count | Avg messages per conversation | Context-dependent |

## Usage

### API Response

The API now includes `variant`:

```json
{
  "reply": "...",
  "intent": "company_registration_pricing",
  "persona": "REGISTRATION",
  "variant": "A"  // or "B"
}
```

### Track Events

```typescript
// Contact event
trackContactEvent({
  userId: sessionId,
  variant: response.variant,
  responseType: 'pricing',
  method: 'click', // 'phone' | 'email' | 'click'
})

// Conversation event
trackConversationEvent({
  userId: sessionId,
  variant: response.variant,
  responseType: 'pricing',
  event: 'message_sent', // 'message_sent' | 'conversation_ended' | 'human_requested'
  messageCount: 2,
})
```

### Evaluate Results

```typescript
import { generateABTestResults, formatABTestResults } from './ab-testing'

const results = generateABTestResults(metrics, contacts, conversations, 'pricing')
console.log(formatABTestResults(results, 'pricing'))
```

## Example Results

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

## Best Practices

1. **Sample Size:** Wait for 100+ responses per variant
2. **Duration:** Run for 1-2 weeks minimum
3. **Significance:** Only declare winner if p < 0.05
4. **Consistency:** Same user = same variant (deterministic)

## Configuration

### Adjust Split Ratio

Edit `assignVariant` in `ab-testing.ts`:

```typescript
// 50/50 (default)
return Math.abs(hash) % 2 === 0 ? 'A' : 'B'

// 70/30 (A/B)
return Math.abs(hash) % 10 < 7 ? 'A' : 'B'
```

## Testing

```bash
pnpm test ab-testing
```

All tests pass ✅
