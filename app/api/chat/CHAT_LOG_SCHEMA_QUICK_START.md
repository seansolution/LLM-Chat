# Chat Log Schema - Quick Start

## What It Is

Canonical JSON schema for chat logs used in analytics, testing, and monitoring. All fields are **deterministic** (enums, fixed values).

## Key Features

✅ **Deterministic Fields** - No free text flags, only enums  
✅ **Comprehensive** - Covers intent, persona, context, pricing, safety, handoff  
✅ **Validated** - Built-in validation rules  
✅ **Analytics-Ready** - Structured for easy querying  

## Schema Structure

```json
{
  "id": "chat-001",
  "timestamp": "2024-01-15T10:00:00.000Z",
  "sessionId": "session-123",
  
  "intent": {
    "detected": "company_registration_pricing"
  },
  "persona": {
    "detected": "REGISTRATION",
    "source": "detected"
  },
  "responseType": "pricing",
  
  "userMessage": "จดทะเบียนบจก ราคาเท่าไหร่",
  "aiResponse": "ราคา 25,000 บาท",
  "knowledgeSources": ["services.md"],
  
  "pricing": {
    "questionType": "explicit",
    "containsPrice": true,
    "priceValue": "25,000 บาท"
  },
  
  "safety": {
    "violations": ["none"],
    "violationCount": 0,
    "hasContactInfo": true,
    "responseLength": 50
  },
  
  "handoff": {
    "status": "none",
    "reason": "none"
  },
  
  "abTesting": {
    "variant": "A",
    "responseType": "pricing"
  },
  
  "userActions": {
    "contactMethod": "none",
    "messageCount": 1,
    "conversationEnded": false
  },
  
  "performance": {
    "responseTimeMs": 1000,
    "model": "mistral"
  },
  
  "quality": {
    "intentCorrect": true,
    "personaCorrect": true
  }
}
```

## Enums Reference

### Intent
`company_registration_pricing`, `accounting_pricing`, `hr_pricing`, `company_overview`, `greeting`, `restricted_legal`, `unknown`

### Persona
`REGISTRATION`, `ACCOUNTING`, `HR`

### ResponseType
`greeting`, `overview`, `pricing`, `restricted`, `unknown`

### SafetyViolationType
`legal_explanation`, `tax_calculation`, `hallucinated_url`, `placeholder_text`, `ai_claim`, `missing_contact_info`, `too_long`, `none`

### HandoffStatus
`none`, `requested`, `completed`, `declined`

### HandoffReason
`user_requested`, `complex_question`, `legal_inquiry`, `technical_issue`, `pricing_negotiation`, `none`

### ABTestVariant
`A`, `B`, `none`

### ContactMethod
`phone`, `email`, `click`, `none`

## Usage

### Create Log Entry

```typescript
import { createChatLogEntry } from './chat-log-schema'

const log = createChatLogEntry({
  id: 'chat-001',
  timestamp: new Date(),
  sessionId: 'session-123',
  userMessage: 'จดทะเบียนบจก ราคาเท่าไหร่',
  aiResponse: 'ราคา 25,000 บาท',
  detectedIntent: 'company_registration_pricing',
  detectedPersona: 'REGISTRATION',
  personaSource: 'detected',
  responseType: 'pricing',
  knowledgeSources: ['services.md'],
  isPricingQuestion: true,
  containsPrice: true,
  violations: [],
  hasContactInfo: true,
  handoffStatus: 'none',
  handoffReason: 'none',
  abVariant: 'A',
  abResponseType: 'pricing',
  contactMethod: 'none',
  messageCount: 1,
  conversationEnded: false,
  responseTimeMs: 1000,
  model: 'mistral',
})
```

### Validate Log Entry

```typescript
import { validateChatLog } from './chat-log-schema'

const result = validateChatLog(logEntry)

if (!result.valid) {
  result.errors.forEach(error => {
    console.error(`${error.field}: ${error.message}`)
  })
}
```

## Common Queries

### Intent Distribution

```typescript
const counts = logs.reduce((acc, log) => {
  acc[log.intent.detected] = (acc[log.intent.detected] || 0) + 1
  return acc
}, {})
```

### Pricing Answer Rate

```typescript
const pricing = logs.filter(log => log.pricing.questionType === 'explicit')
const answered = pricing.filter(log => log.pricing.containsPrice)
const rate = (answered.length / pricing.length) * 100
```

### Safety Violation Rate

```typescript
const violations = logs.filter(log => log.safety.violationCount > 0)
const rate = (violations.length / logs.length) * 100
```

### Handoff Rate

```typescript
const handoffs = logs.filter(log => 
  log.handoff.status === 'requested' || log.handoff.status === 'completed'
)
const rate = (handoffs.length / logs.length) * 100
```

## Examples

See `chat-log-examples.json` for complete examples.

## Testing

```bash
pnpm test chat-log-schema
```

All tests pass ✅
