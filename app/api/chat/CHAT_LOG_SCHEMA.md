# Canonical Chat Log Schema

## Overview

JSON-based schema for chat logs used in analytics, testing, and monitoring. All fields are **deterministic** (enums, fixed values) - no free text flags.

## Schema Structure

```typescript
{
  // ===== METADATA =====
  id: string                    // Unique log ID (UUID or deterministic hash)
  timestamp: string             // ISO 8601 timestamp
  sessionId: string            // Session identifier
  userId?: string              // Optional user identifier (if authenticated)
  
  // ===== INTENT & PERSONA =====
  intent: {
    detected: Intent           // Detected intent (enum)
    confidence?: number        // 0-1 confidence score (optional)
    keywords?: string[]        // Keywords that triggered intent (optional)
  }
  persona: {
    detected: Persona          // Detected persona (enum)
    source: 'explicit' | 'detected' | 'default'
  }
  responseType: ResponseType   // Type of response generated
  
  // ===== CONTEXT =====
  userMessage: string         // Original user message
  aiResponse: string           // AI-generated response
  knowledgeSources: KnowledgeSource[]  // Which knowledge files were loaded
  knowledgeLength?: number     // Total characters of knowledge used
  systemPromptLength?: number  // Total characters of system prompt
  
  // ===== PRICING =====
  pricing: {
    questionType: 'explicit' | 'implicit' | 'none'
    containsPrice: boolean
    priceValue?: string        // Extracted price value
    priceType?: 'one_time' | 'monthly' | 'both' | 'unknown'
    timeline?: string          // Estimated timeline if mentioned
  }
  
  // ===== SAFETY =====
  safety: {
    violations: SafetyViolationType[]  // List of detected violations
    violationCount: number
    hasContactInfo: boolean
    responseLength: number
    sentenceCount?: number
  }
  
  // ===== HANDOFF =====
  handoff: {
    status: 'none' | 'requested' | 'completed' | 'declined'
    reason: HandoffReason
    requestedAt?: string       // ISO 8601 timestamp
    completedAt?: string       // ISO 8601 timestamp
    timeToRequest?: number    // Seconds from response to handoff request
  }
  
  // ===== A/B TESTING =====
  abTesting: {
    variant: 'A' | 'B' | 'none'
    responseType: 'pricing' | 'overview' | 'none'
    ctaVariant?: 'standard' | 'urgent' | 'soft'
  }
  
  // ===== USER ACTIONS =====
  userActions: {
    contactMethod: 'phone' | 'email' | 'click' | 'none'
    contactedAt?: string      // ISO 8601 timestamp
    timeToContact?: number    // Seconds from response to contact
    messageCount: number
    conversationEnded: boolean
    conversationEndedAt?: string
  }
  
  // ===== PERFORMANCE =====
  performance: {
    responseTimeMs: number
    tokenCount?: number
    model: string
    temperature?: number
    numCtx?: number
  }
  
  // ===== QUALITY METRICS =====
  quality: {
    goldenResponseMatch?: boolean
    goldenResponseSimilarity?: number  // 0-1
    expectedIntent?: Intent
    expectedPersona?: Persona
    intentCorrect: boolean
    personaCorrect: boolean
  }
  
  // ===== METADATA (Optional) =====
  metadata?: {
    userAgent?: string
    ipAddress?: string
    referrer?: string
    language?: string
    [key: string]: unknown
  }
}
```

## Enums

### Intent
```typescript
'company_registration_pricing'
'company_registration_overview'
'accounting_pricing'
'accounting_overview'
'hr_pricing'
'hr_overview'
'work_permit_overview'
'company_overview'
'greeting'
'pricing_generic'
'restricted_legal'
'unknown'
```

### Persona
```typescript
'REGISTRATION'
'ACCOUNTING'
'HR'
```

### ResponseType
```typescript
'greeting'
'overview'
'pricing'
'restricted'
'unknown'
```

### SafetyViolationType
```typescript
'legal_explanation'
'tax_calculation'
'hallucinated_url'
'placeholder_text'
'ai_claim'
'missing_contact_info'
'too_long'
'none'
```

### HandoffReason
```typescript
'user_requested'
'complex_question'
'legal_inquiry'
'technical_issue'
'pricing_negotiation'
'none'
```

### HandoffStatus
```typescript
'none'
'requested'
'completed'
'declined'
```

### ABTestVariant
```typescript
'A'
'B'
'none'
```

### ContactMethod
```typescript
'phone'
'email'
'click'
'none'
```

### KnowledgeSource
```typescript
'company.md'
'services.md'
'th/packages-and-pricing.md'
'th/company-registration.md'
'th/accounting.md'
'th/hr.md'
'none'
```

## Validation Rules

### Required Fields
- `id`, `timestamp`, `sessionId`, `userMessage`, `aiResponse`
- `intent.detected`, `persona.detected`, `persona.source`
- `responseType`, `pricing`, `safety`, `handoff`, `abTesting`, `userActions`, `performance`

### Type Constraints
- `timestamp`: Valid ISO 8601 format
- `intent.detected`: Must be valid Intent enum
- `persona.detected`: Must be valid Persona enum
- `safety.violations`: Array of valid SafetyViolationType
- `performance.responseTimeMs`: Non-negative number
- `userActions.messageCount`: Positive integer

### Validation Function

```typescript
import { validateChatLog } from './chat-log-schema'

const result = validateChatLog(logEntry)

if (!result.valid) {
  console.error('Validation errors:', result.errors)
}
```

## Example Log Entry

See `chat-log-examples.json` for complete examples.

### Minimal Example

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
    "containsPrice": true
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

## Usage

### Creating Log Entries

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

### Validating Log Entries

```typescript
import { validateChatLog } from './chat-log-schema'

const result = validateChatLog(logEntry)

if (result.valid) {
  // Log is valid, proceed
} else {
  // Handle validation errors
  result.errors.forEach(error => {
    console.error(`${error.field}: ${error.message}`)
  })
}
```

## Analytics Queries

### Intent Distribution

```typescript
const intentCounts = logs.reduce((acc, log) => {
  acc[log.intent.detected] = (acc[log.intent.detected] || 0) + 1
  return acc
}, {})
```

### Pricing Answer Rate

```typescript
const pricingQuestions = logs.filter(log => 
  log.pricing.questionType === 'explicit'
)
const answered = pricingQuestions.filter(log => 
  log.pricing.containsPrice
)
const rate = (answered.length / pricingQuestions.length) * 100
```

### Safety Violation Rate

```typescript
const violations = logs.filter(log => 
  log.safety.violationCount > 0
)
const rate = (violations.length / logs.length) * 100
```

### Handoff Rate

```typescript
const handoffs = logs.filter(log => 
  log.handoff.status === 'requested' || log.handoff.status === 'completed'
)
const rate = (handoffs.length / logs.length) * 100
```

### A/B Test Comparison

```typescript
const variantA = logs.filter(log => log.abTesting.variant === 'A')
const variantB = logs.filter(log => log.abTesting.variant === 'B')

const contactRateA = variantA.filter(log => 
  log.userActions.contactMethod !== 'none'
).length / variantA.length

const contactRateB = variantB.filter(log => 
  log.userActions.contactMethod !== 'none'
).length / variantB.length
```

## Testing

### Unit Tests

```bash
pnpm test chat-log-schema
```

### Example Test

```typescript
import { validateChatLog } from './chat-log-schema'

test('validates complete log entry', () => {
  const log = { /* ... */ }
  const result = validateChatLog(log)
  expect(result.valid).toBe(true)
})
```

## Best Practices

1. **Always validate** logs before storing/processing
2. **Use enums** - never use free text for categorical fields
3. **ISO 8601 timestamps** - consistent time format
4. **Deterministic IDs** - use UUIDs or deterministic hashes
5. **Optional fields** - mark truly optional fields with `?`
6. **Metadata** - use `metadata` object for custom/extensible fields

## Schema Versioning

When updating the schema:

1. **Add new fields** as optional initially
2. **Deprecate old fields** gradually
3. **Maintain backward compatibility** for analytics
4. **Update validation** rules
5. **Update examples** and documentation

## Integration

### API Route Integration

```typescript
// In route.ts
import { createChatLogEntry } from './chat-log-schema'

// After generating response
const log = createChatLogEntry({
  id: generateId(),
  timestamp: new Date(),
  sessionId: body.sessionId,
  // ... other fields
})

// Store log (database, file, etc.)
await storeLog(log)
```

### Dashboard Integration

```typescript
// Load logs
const logs = await loadLogs(startDate, endDate)

// Validate
const validLogs = logs.filter(log => {
  const result = validateChatLog(log)
  return result.valid
})

// Calculate metrics
const metrics = calculateMetrics(validLogs)
```
