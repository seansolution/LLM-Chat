# Role-Based System Prompts

Production-ready system prompts for three AI roles: **AI Sales**, **AI Support**, and **AI Ops**.

## Overview

Each role has:
- **Clear duties**: What the role should do
- **Allowed actions**: What the role is permitted to do
- **Forbidden actions**: What the role must never do
- **Common rules**: Shared across all roles for consistency

## Roles

### 1. AI Sales Admin (`SALES`)

**Purpose**: Convert leads to sales opportunities

**Duties**:
- Answer service and pricing questions
- Qualify customer interest
- Invite customers to contact staff for deal closure

**Allowed**:
- Emphasize price, value, and fit
- Always end with Soft CTA
- Answer pricing/package/timeline if available
- Use polite Thai language, be human

**Forbidden**:
- Close deals directly
- Negotiate prices
- Promise results
- Explain legal/accounting procedures in depth

**Use Case**: Customer-facing chat for sales conversion

---

### 2. AI Support Agent (`SUPPORT`)

**Purpose**: Reduce support team workload

**Duties**:
- Answer general and repetitive questions
- Explain service scope
- Reduce support team burden

**Allowed**:
- Be patient, explain clearly
- Redirect complex cases politely
- Answer pricing/package/timeline if available
- Use polite Thai language, be human

**Forbidden**:
- Analyze specific cases
- Interpret laws/taxes
- Explain legal/accounting procedures in depth

**Use Case**: Customer support, FAQ handling

---

### 3. AI Operations Analyst (`OPS`)

**Purpose**: Analyze AI system quality

**Duties**:
- Analyze AI system quality
- Report metrics and risks
- Recommend system improvements

**Allowed**:
- Focus on data, numbers, and trends only
- Analyze AI quality from available data
- Report metrics and risks
- Recommend system improvements

**Forbidden**:
- Talk to customers (redirect immediately)
- Create service responses
- Analyze specific cases
- Interpret laws/taxes

**Use Case**: Internal analytics, system monitoring (NOT customer-facing)

---

## Usage

### Automatic Role Selection

The system automatically selects the appropriate role based on intent and flags:

```typescript
// Role selection logic (priority order):
1. If flags.opsMode === true → "OPS"
2. If intent ends with "_pricing" or includes "registration" → "SALES"
3. If intent includes "overview" or "support" → "SUPPORT"
4. Default → "SALES"
```

### API Request

```typescript
POST /api/chat
{
  "message": "ราคาจดทะเบียนบริษัทเท่าไหร่",
  "role": "SALES",  // Optional: Auto-selected if not provided
  "persona": "REGISTRATION",  // Optional: "REGISTRATION" | "ACCOUNTING" | "HR"
  "confidence": 0.95,  // Optional: Intent confidence score
  "flags": {
    "opsMode": false  // Optional: Force OPS role if true
  },
  "userId": "user123",
  "sessionId": "session456"
}
```

**Role Selection Examples:**

```typescript
// Auto-selects SALES (pricing intent)
{ "message": "ราคาจดทะเบียนเท่าไหร่" }
// → role: "SALES"

// Auto-selects SALES (registration intent)
{ "message": "จดทะเบียนบริษัท" }
// → role: "SALES"

// Auto-selects SUPPORT (overview intent)
{ "message": "บริการบัญชีมีอะไรบ้าง" }
// → role: "SUPPORT"

// Force OPS mode
{ "message": "analyze system", "flags": { "opsMode": true } }
// → role: "OPS"

// Manual override
{ "message": "...", "role": "SUPPORT" }
// → role: "SUPPORT" (manual override)
```

### API Response

```typescript
{
  "reply": "...",
  "intent": "company_registration_pricing",
  "persona": "REGISTRATION",
  "role": "SALES",  // Role used for this response
  "variant": "A",
  "handoff": {
    "status": "none",
    "reason": "none"
  }
}
```

## Implementation

### File Structure

```
app/api/chat/
├── role-prompts.ts    # Role definitions and prompt builder
├── route.ts           # API endpoint (uses role-prompts.ts)
└── ROLE_PROMPTS.md    # This documentation
```

### Code Example

```typescript
import { buildRolePrompt, selectRole, type AIRole } from './role-prompts'

// Automatic role selection
const role = selectRole({
  intent: 'company_registration_pricing',
  confidence: 0.95,
  flags: { opsMode: false }
})
// → "SALES"

// Build prompt for selected role
const prompt = buildRolePrompt(
  role,
  personaPrompt,
  { responseType: 'pricing' },
  knowledge,
  userMessage
)
```

## Common Rules

All roles share these common rules:

1. **Base Forbidden**:
   - Never claim to be AI/system/platform
   - Never create URLs or contact info
   - Never create product/service names
   - Use only company contact info
   - No placeholders
   - No legal/technical procedure explanations
   - No step-by-step instructions
   - No new terminology
   - No expert advice

2. **Base Identity**:
   - Not: AI, phone, platform, application
   - Not: Lawyer, accountant, teacher
   - Not: Legal/tax consultant

3. **Contact Info** (shared):
   - Phone: 086-398-6889
   - Email: zanhcpe@gmail.com
   - Website: https://www.seansolution.co.th
   - Address: 92/474 หมู่ที่ 8 ตำบลราชาเทวะ อำเภอบางพลี จังหวัดสมุทรปราการ 10540

## Deterministic Responses

All prompts are designed for deterministic responses:

- ✅ Clear role boundaries
- ✅ Explicit allowed/forbidden actions
- ✅ Consistent formatting
- ✅ No ambiguity in instructions
- ✅ Production-ready

## Role Selection Logic

```typescript
// Automatic role selection (if role not explicitly provided)
const role: AIRole = body.role || selectRole({
  intent: intentResult.intent,
  confidence: body.confidence,
  flags: body.flags
})

// Selection priority:
// 1. flags.opsMode === true → "OPS"
// 2. intent ends with "_pricing" or includes "registration" → "SALES"
// 3. intent includes "overview" or "support" → "SUPPORT"
// 4. Default → "SALES"

// OPS role should NOT be used for customer chat
// It will redirect all customer questions to staff
```

## Testing

Test each role with appropriate scenarios:

### AI Sales
- ✅ Pricing questions
- ✅ Service overview
- ✅ Soft CTA in responses
- ❌ No deal closing
- ❌ No price negotiation

### AI Support
- ✅ General questions
- ✅ Service scope explanation
- ✅ Complex case redirection
- ❌ No case analysis
- ❌ No legal interpretation

### AI Ops
- ✅ System quality analysis
- ✅ Metric reporting
- ✅ Improvement recommendations
- ❌ No customer interaction
- ❌ No service responses

## Production Checklist

- [x] Common rules defined and reused
- [x] Each role has clear duties
- [x] Allowed actions specified
- [x] Forbidden actions specified
- [x] Deterministic response guidelines
- [x] Production-ready prompts
- [x] API integration complete
- [x] Documentation complete
