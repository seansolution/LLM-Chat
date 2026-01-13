# Role-Based A/B Testing - Quick Start

## Overview

Role-based A/B testing where **intent and persona remain IDENTICAL** across variants. Only wording (CTA, emphasis) differs.

## Key Principles

✅ **Intent Identical**: Same intent for both variants  
✅ **Persona Identical**: Same persona for both variants  
✅ **Wording Only**: Only CTA and emphasis differ  
✅ **Deterministic**: Same user + role + response type = same variant

## Variant Definitions

### AI Sales Admin

**Variant A (Baseline):**
- CTA: "สนใจสอบถามรายละเอียดเพิ่มเติมหรือต้องการให้เจ้าหน้าที่ช่วยดูให้ตรงกับธุรกิจของคุณ..."
- Tone: Polite, informative

**Variant B (Sales-Oriented):**
- CTA: "พร้อมเริ่มต้นได้เลยค่ะ! 📞 โทร 086-398-6889..."
- Tone: Direct, action-focused

### AI Support Agent

**Variant A (Baseline):**
- CTA: "หากต้องการสอบถามรายละเอียดเพิ่มเติมหรือมีคำถามเฉพาะ..."
- Tone: Patient, clear

**Variant B (Proactive):**
- CTA: "มีคำถามเพิ่มเติมหรือต้องการคำแนะนำเฉพาะเจาะจงไหมคะ? 📞..."
- Tone: Proactive, helpful

## Usage

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
```

### Tracking

```typescript
// Log metric
{
  type: 'role_ab_test_metric',
  role: 'SALES',
  variant: 'A',
  responseType: 'pricing',
  userId: 'user123',
  intent: 'company_registration_pricing', // IDENTICAL
  persona: 'REGISTRATION', // IDENTICAL
}
```

## Metrics

| Metric | Definition | Goal |
|--------|------------|------|
| **Contact Rate** | % who contacted | Higher |
| **Continuation Rate** | % who sent another message | Higher |
| **Conversion Rate** | % who contacted or requested handoff | Higher |
| **Time to Contact** | Avg seconds to contact | Lower |
| **Time to Handoff** | Avg seconds to handoff | Context-dependent |

## Evaluation

```typescript
import { generateRoleABTestResults, formatRoleABTestResults } from './role-ab-testing'

const results = generateRoleABTestResults(metrics, contacts, conversations, 'SALES', 'pricing')
console.log(formatRoleABTestResults(results, 'SALES', 'pricing'))
```

## Validation

**Must Verify:**
- ✅ Intent identical across variants
- ✅ Persona identical across variants
- ✅ Only wording differs
- ✅ Deterministic assignment

**Must Not:**
- ❌ Change intent based on variant
- ❌ Change persona based on variant
- ❌ Change content (only CTA/emphasis)

---

*See `ROLE_AB_TESTING.md` for complete documentation.*
