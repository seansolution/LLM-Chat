# Role-Based A/B Testing - Implementation Summary

## ✅ Implementation Complete

Role-based A/B testing system where **intent and persona remain IDENTICAL** across variants. Only wording differs.

---

## Files Created/Updated

### 1. `app/api/chat/role-ab-testing.ts` (New)
- Role-specific variant definitions (Sales, Support, Ops)
- Deterministic variant assignment
- Response application logic
- Metrics calculation functions
- Statistical significance evaluation
- Result formatting

### 2. `app/api/chat/role-ab-testing.test.ts` (New)
- 26 test cases covering:
  - Deterministic assignment
  - Variant definitions
  - Response application
  - Metrics calculation
  - Statistical significance
  - Intent/persona identity verification

### 3. `app/api/chat/ROLE_AB_TESTING.md` (New)
- Complete documentation
- Variant definitions
- Metrics definitions
- Evaluation guide
- SQL queries

### 4. `app/api/chat/ROLE_AB_TESTING_QUICK_START.md` (New)
- Quick reference guide
- Usage examples
- Validation checklist

### 5. `app/api/chat/route.ts` (Updated)
- Integrated role-based A/B testing
- Applies variants before returning response
- Logs metrics with role, variant, intent, persona

### 6. `app/api/chat/chat-log-schema.ts` (Updated)
- Added `role` field to `abTesting` schema
- Added comment: Intent and persona MUST be identical

---

## Variant Definitions

### AI Sales Admin (SALES)

| Variant | CTA Style | Tone |
|---------|-----------|------|
| **A** | "สนใจสอบถามรายละเอียดเพิ่มเติมหรือต้องการให้เจ้าหน้าที่ช่วยดู..." | Polite, informative |
| **B** | "พร้อมเริ่มต้นได้เลยค่ะ! 📞 โทร 086-398-6889..." | Direct, action-focused |

### AI Support Agent (SUPPORT)

| Variant | CTA Style | Tone |
|---------|-----------|------|
| **A** | "หากต้องการสอบถามรายละเอียดเพิ่มเติมหรือมีคำถามเฉพาะ..." | Patient, clear |
| **B** | "มีคำถามเพิ่มเติมหรือต้องการคำแนะนำเฉพาะเจาะจงไหมคะ? 📞..." | Proactive, helpful |

### AI Operations Analyst (OPS)

| Variant | Redirect Message | Tone |
|---------|------------------|------|
| **A** | "เจ้าหน้าที่จะช่วยตอบคำถามและให้บริการได้ตรงกับความต้องการของคุณค่ะ 😊" | Professional |
| **B** | "เจ้าหน้าที่ของเราพร้อมช่วยเหลือคุณค่ะ 😊" | Professional |

---

## Deterministic Assignment

**Formula:** `hash(userId:role:responseType) % 2`

**Guarantees:**
- Same user + same role + same response type = same variant
- 50/50 split across all users
- No randomness

**Example:**
```typescript
assignVariant('user123', 'SALES', 'pricing') // Always returns same variant
assignVariant('user123', 'SUPPORT', 'pricing') // May return different variant
```

---

## Metrics Tracked

1. **Contact Rate** - % who contacted (phone/email/click)
2. **Continuation Rate** - % who sent another message
3. **Conversion Rate** - % who contacted or requested handoff
4. **Avg Time to Contact** - Average seconds until contact
5. **Avg Time to Handoff** - Average seconds until handoff
6. **Avg Message Count** - Average messages per conversation

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
    detected: Intent // IDENTICAL across variants
  },
  persona: {
    detected: Persona // IDENTICAL across variants
  }
}
```

---

## Key Guarantees

✅ **Intent Identical**: Same intent detection for both variants  
✅ **Persona Identical**: Same persona assignment for both variants  
✅ **Wording Only**: Only CTA phrasing and emphasis differ  
✅ **Deterministic**: Same user + role + response type = same variant  
✅ **Role-Specific**: Different variants per role

---

## Test Results

```
✅ 26 tests passing
✅ All scenarios covered
✅ Deterministic behavior verified
✅ Intent/persona identity verified
```

---

## Usage Example

```typescript
// In route.ts
const variant = assignVariant(userId, selectedRole, responseType)
const finalReply = applyRoleVariantToResponse(
  reply,
  selectedRole,
  responseType,
  variant
)

// Log metric
{
  type: 'role_ab_test_metric',
  role: 'SALES',
  variant: 'A',
  responseType: 'pricing',
  intent: 'company_registration_pricing', // IDENTICAL
  persona: 'REGISTRATION', // IDENTICAL
}
```

---

## Next Steps

1. ✅ Variant definitions complete
2. ✅ Deterministic assignment implemented
3. ✅ Metrics calculation ready
4. ✅ Statistical evaluation ready
5. ✅ Tests passing
6. ⏭️ Deploy and collect data
7. ⏭️ Analyze results after 1-2 weeks
8. ⏭️ Declare winner if statistically significant

---

*Implementation complete and ready for production use.*
