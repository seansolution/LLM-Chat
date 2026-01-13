# Role-Based A/B Testing

## Overview

Role-based A/B testing for AI responses. **Intent and persona remain IDENTICAL** across variants - only wording differs.

## Key Principles

✅ **Intent Identical**: Same intent detection for both variants  
✅ **Persona Identical**: Same persona assignment for both variants  
✅ **Wording Only**: Only CTA phrasing and emphasis differ  
✅ **Deterministic**: Same user + same role + same response type = same variant  
✅ **Role-Specific**: Different variants per role (Sales, Support, Ops)

---

## Variant Definitions

### AI Sales Admin (SALES)

#### Variant A: Baseline (Polite, Informative)
- **Tone:** Polite, informative, soft CTA
- **Approach:** Informative, lets user decide
- **CTA:** "สนใจสอบถามรายละเอียดเพิ่มเติมหรือต้องการให้เจ้าหน้าที่ช่วยดูให้ตรงกับธุรกิจของคุณ ติดต่อ 086-398-6889 หรือ zanhcpe@gmail.com นะคะ 😊"

#### Variant B: Sales-Oriented (Direct, Action-Focused)
- **Tone:** Direct, benefit-focused, stronger CTA
- **Approach:** Action-oriented, creates urgency
- **CTA:** "พร้อมเริ่มต้นได้เลยค่ะ! 📞 โทร 086-398-6889 หรือส่งอีเมล zanhcpe@gmail.com\nเราจะติดต่อกลับภายใน 24 ชั่วโมงค่ะ"

### AI Support Agent (SUPPORT)

#### Variant A: Baseline (Patient, Clear)
- **Tone:** Patient, clear, helpful
- **Approach:** Helpful, explains clearly
- **CTA:** "หากต้องการสอบถามรายละเอียดเพิ่มเติมหรือมีคำถามเฉพาะ ติดต่อ 086-398-6889 หรือ zanhcpe@gmail.com นะคะ 😊"

#### Variant B: Proactive (More Proactive)
- **Tone:** Proactive, offers additional help
- **Approach:** More proactive, offers help
- **CTA:** "มีคำถามเพิ่มเติมหรือต้องการคำแนะนำเฉพาะเจาะจงไหมคะ? 📞 โทร 086-398-6889 หรืออีเมล zanhcpe@gmail.com\nเจ้าหน้าที่พร้อมช่วยเหลือค่ะ"

### AI Operations Analyst (OPS)

#### Variant A: Baseline (Professional Redirect)
- **Message:** "ขออภัยค่ะ ฉันเป็น AI Operations Analyst ที่วิเคราะห์คุณภาพระบบ ไม่ใช่เจ้าหน้าที่ที่คุยกับลูกค้าโดยตรง"
- **Closing:** "เจ้าหน้าที่จะช่วยตอบคำถามและให้บริการได้ตรงกับความต้องการของคุณค่ะ 😊"

#### Variant B: Alternative (Slightly Different Wording)
- **Message:** "ขออภัยค่ะ ฉันเป็น AI Operations Analyst ที่วิเคราะห์คุณภาพระบบ ไม่ใช่เจ้าหน้าที่ที่คุยกับลูกค้าโดยตรง"
- **Closing:** "เจ้าหน้าที่ของเราพร้อมช่วยเหลือคุณค่ะ 😊"

---

## Deterministic Assignment

### Assignment Logic

```typescript
variant = assignVariant(userId, role, responseType)
```

**Hash Input:** `userId:role:responseType`

**Example:**
- User "user123" + Role "SALES" + ResponseType "pricing" → Always gets same variant
- User "user123" + Role "SUPPORT" + ResponseType "pricing" → May get different variant (different role)
- User "user456" + Role "SALES" + ResponseType "pricing" → May get different variant (different user)

**50/50 Split:** Each variant gets ~50% of traffic

---

## Metrics

### 1. Contact Rate
**Definition:** % of users who contact (phone/email/click)

**Formula:**
```
Contact Rate = (Users who contacted / Total users) × 100
```

**Goal:** Higher is better

### 2. Conversation Continuation Rate
**Definition:** % of users who send another message

**Formula:**
```
Continuation Rate = (Users who continued / Total users) × 100
```

**Goal:** Higher indicates engagement

### 3. Conversion Rate
**Definition:** % of conversations leading to contact or handoff

**Formula:**
```
Conversion Rate = (Users who contacted OR requested handoff / Total users) × 100
```

**Goal:** Higher is better

### 4. Average Time to Contact
**Definition:** Average seconds from response to contact

**Formula:**
```
Avg Time to Contact = sum(time_to_contact) / count(contacts)
```

**Goal:** Lower indicates faster conversion

### 5. Average Time to Human Handoff
**Definition:** Average seconds until user requests human

**Formula:**
```
Avg Time to Handoff = sum(time_to_handoff) / count(handoffs)
```

**Goal:** Context-dependent (lower = better self-service, but may indicate confusion)

### 6. Average Message Count
**Definition:** Average messages per conversation

**Formula:**
```
Avg Message Count = sum(message_count) / count(conversations)
```

**Goal:** Context-dependent (higher = more engagement, but may indicate confusion)

---

## Tracking Fields

### Chat Log Schema

```typescript
{
  abTesting: {
    variant: 'A' | 'B' | 'none',
    role: 'SALES' | 'SUPPORT' | 'OPS' | 'none',
    responseType: 'pricing' | 'overview' | 'greeting' | 'restricted' | 'none',
    ctaVariant?: 'standard' | 'urgent' | 'soft'
  },
  intent: {
    detected: Intent, // IDENTICAL across variants
    confidence?: number
  },
  persona: {
    detected: Persona, // IDENTICAL across variants
    source: 'explicit' | 'detected' | 'default'
  }
}
```

### Metric Event Schema

```typescript
{
  id: string,
  timestamp: string,
  userId: string,
  sessionId: string,
  role: 'SALES' | 'SUPPORT' | 'OPS',
  variant: 'A' | 'B',
  responseType: 'pricing' | 'overview' | 'greeting',
  intent: string, // IDENTICAL across variants
  persona: Persona, // IDENTICAL across variants
}
```

### Contact Event Schema

```typescript
{
  id: string,
  timestamp: string,
  userId: string,
  sessionId: string,
  role: 'SALES' | 'SUPPORT' | 'OPS',
  variant: 'A' | 'B',
  responseType: 'pricing' | 'overview' | 'greeting',
  intent: string, // IDENTICAL across variants
  persona: Persona, // IDENTICAL across variants
  method: 'phone' | 'email' | 'click',
  timeToContact: number // Seconds
}
```

---

## Evaluation

### Generate Results

```typescript
import { generateRoleABTestResults, formatRoleABTestResults } from './role-ab-testing'

const results = generateRoleABTestResults(
  metrics,
  contacts,
  conversations,
  'SALES',
  'pricing'
)

console.log(formatRoleABTestResults(results, 'SALES', 'pricing'))
```

### Example Output

```
======================================================================
ROLE-BASED A/B TEST RESULTS - SALES / PRICING
======================================================================

Variant A (Baseline):
  Total Responses: 150
  Contact Rate: 12.50%
  Continuation Rate: 45.00%
  Conversion Rate: 18.00%
  Avg Time to Contact: 180s
  Avg Time to Handoff: 300s
  Avg Message Count: 2.3

Variant B (Alternative):
  Total Responses: 148
  Contact Rate: 18.25%
  Continuation Rate: 52.00%
  Conversion Rate: 22.00%
  Avg Time to Contact: 120s
  Avg Time to Handoff: 250s
  Avg Message Count: 2.8

Statistical Significance:
  p-value: 0.0234
  Significant: Yes
  Winner: Variant B
  Lift: 46.00%

Note: Intent and Persona are IDENTICAL across variants.
Only wording (CTA, emphasis) differs.
======================================================================
```

### Statistical Significance

- **Method:** Chi-square test
- **Threshold:** p < 0.05 = statistically significant
- **Winner:** Higher metric value (if significant)
- **Lift:** % improvement over baseline

---

## Implementation

### API Integration

```typescript
// In route.ts
import { assignVariant, applyRoleVariantToResponse } from './role-ab-testing'

// Assign variant (deterministic)
const variant = assignVariant(userId, selectedRole, responseType)

// Apply variant (only changes wording)
const finalReply = applyRoleVariantToResponse(
  reply,
  selectedRole,
  responseType,
  variant
)

// Log metric
console.log(JSON.stringify({
  type: 'role_ab_test_metric',
  role: selectedRole,
  variant,
  responseType,
  userId,
  intent: intentResult.intent, // IDENTICAL
  persona: detectedPersona, // IDENTICAL
}))
```

### Frontend Tracking

```typescript
// Track contact event
trackContactEvent({
  userId: sessionId,
  role: response.role,
  variant: response.variant,
  responseType: 'pricing',
  intent: response.intent, // IDENTICAL
  persona: response.persona, // IDENTICAL
  method: 'click',
  timeToContact: secondsSinceResponse
})

// Track conversation event
trackConversationEvent({
  userId: sessionId,
  role: response.role,
  variant: response.variant,
  responseType: 'pricing',
  intent: response.intent, // IDENTICAL
  persona: response.persona, // IDENTICAL
  event: 'message_sent',
  messageCount: messageCount,
  timeToEvent: secondsSinceResponse
})
```

---

## Best Practices

1. **Sample Size:** Wait for at least 100 responses per variant before evaluating
2. **Duration:** Run test for at least 1-2 weeks to account for day-of-week effects
3. **Segmentation:** Analyze by role, response type, and time period
4. **Statistical Significance:** Only declare winner if p < 0.05
5. **Consistency:** Same user always gets same variant (deterministic)
6. **Intent/Persona Identity:** Verify intent and persona are identical across variants
7. **Wording Only:** Ensure only CTA and emphasis differ, not content

---

## Validation Rules

### Must Verify

- ✅ Intent is identical across variants (same detection)
- ✅ Persona is identical across variants (same assignment)
- ✅ Only wording differs (CTA, emphasis, tone)
- ✅ Variant assignment is deterministic
- ✅ Sample sizes are balanced (50/50 split)

### Must Not Do

- ❌ Change intent detection based on variant
- ❌ Change persona assignment based on variant
- ❌ Change knowledge base content based on variant
- ❌ Change response content (only CTA/emphasis)
- ❌ Use non-deterministic assignment

---

## Configuration

### Adjust Variant Split

```typescript
// In assignVariant function
// 50/50 split (default)
return Math.abs(hash) % 2 === 0 ? 'A' : 'B'

// 70/30 split (A/B)
return Math.abs(hash) % 10 < 7 ? 'A' : 'B'
```

### Add New Variants

1. Define variant in role-specific variant definitions
2. Update `getRoleVariants` function
3. Update `applyRoleVariantToResponse` logic
4. Add to tracking schema

---

## SQL Queries for Analysis

### Compare Variants by Role

```sql
SELECT 
  ab_testing->>'role' as role,
  ab_testing->>'variant' as variant,
  ab_testing->>'responseType' as response_type,
  COUNT(*) as total_responses,
  COUNT(*) FILTER (WHERE user_actions->>'contactMethod' != 'none')::numeric / NULLIF(COUNT(*), 0)::numeric * 100 as contact_rate
FROM chat_logs
WHERE timestamp >= NOW() - INTERVAL '7 days'
  AND ab_testing->>'variant' IN ('A', 'B')
GROUP BY role, variant, response_type
ORDER BY role, response_type, variant;
```

### Verify Intent/Persona Identity

```sql
-- Verify intent is identical across variants
SELECT 
  ab_testing->>'variant' as variant,
  intent->>'detected' as intent,
  COUNT(*) as count
FROM chat_logs
WHERE timestamp >= NOW() - INTERVAL '7 days'
  AND ab_testing->>'role' = 'SALES'
  AND ab_testing->>'responseType' = 'pricing'
GROUP BY variant, intent
ORDER BY variant, intent;

-- Should show same intents for both variants
```

---

*Last Updated: 2024*
*Version: 1.0*
