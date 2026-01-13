# Golden Responses - Quick Start

## Overview

Role-based golden responses for regression testing and quality assurance. Each response includes use case, exact wording, and validation rules.

## Files

- **`golden-responses.md`** - Human-readable documentation
- **`golden-responses.test-data.ts`** - Machine-readable test data

## Quick Reference

### AI Sales Admin (SALES)

| ID | Use Case | Intent |
|----|----------|--------|
| SALES-001 | Greeting | `greeting` |
| SALES-002 | Company Registration Pricing | `company_registration_pricing` |
| SALES-003 | Accounting Service Pricing | `accounting_pricing` |
| SALES-004 | HR Service Pricing | `hr_pricing` |
| SALES-005 | Service Overview (Registration) | `company_registration_overview` |
| SALES-006 | Generic Pricing Question | `pricing_generic` |

### AI Support Agent (SUPPORT)

| ID | Use Case | Intent |
|----|----------|--------|
| SUPPORT-001 | Greeting | `greeting` |
| SUPPORT-002 | Service Scope Explanation | `accounting_overview` |
| SUPPORT-003 | General Question Answer | `company_overview` |
| SUPPORT-004 | Complex Case Redirect | `restricted_legal` |

### AI Operations Analyst (OPS)

| ID | Use Case | Intent |
|----|----------|--------|
| OPS-001 | Customer Question Redirect | `any` |

### Universal

| ID | Use Case | Intent |
|----|----------|--------|
| UNIVERSAL-001 | Restricted Legal Question | `restricted_legal` |
| UNIVERSAL-002 | User Requests Contact | `any` |

## Usage in Tests

### Import Test Data

```typescript
import { goldenResponses, getGoldenResponsesByRole } from './golden-responses.test-data'

// Get all Sales golden responses
const salesResponses = getGoldenResponsesByRole('SALES')

// Get specific golden response
const response = goldenResponses.find(r => r.id === 'SALES-002')
```

### Example Test

```typescript
import { goldenResponses } from './golden-responses.test-data'
import { matchesGoldenResponse } from './dashboard'

test('Company Registration Pricing matches golden response', () => {
  const golden = goldenResponses.find(r => r.id === 'SALES-002')
  const actualResponse = "จัดตั้งบริษัทจำกัด (บจก)\nค่าบริการอยู่ที่ 25,000 บาท..."
  
  expect(matchesGoldenResponse(actualResponse, golden!.goldenResponse, 0.7)).toBe(true)
})
```

## Validation Rules

### Must-Have (All Roles)
- ✅ Uses polite Thai language
- ✅ Human, friendly tone
- ✅ Includes contact information (phone + email)
- ✅ 2-4 sentences (unless pricing list)
- ✅ No placeholders
- ✅ No invented information
- ✅ No AI/system/platform claims

### Forbidden (All Roles)
- ❌ Claiming to be AI, system, phone, platform, or application
- ❌ Creating URLs, contact info, or product names
- ❌ Using placeholders like `[website]`, `[contact]`, `[price]`
- ❌ Explaining legal/accounting procedures in depth
- ❌ Explaining step-by-step processes
- ❌ Creating new terminology
- ❌ Giving expert advice or deep consultation

## Matching Criteria

**Similarity Threshold:** 0.7 (70%)

**Key Phrase Matching:**
- Price patterns: `\d+.*บาท`
- Contact info: `086-398-6889|zanhcpe@gmail.com`
- CTA phrases: `สนใจสอบถาม|ติดต่อ`

## Running Regression Tests

```bash
# Test golden response matching
pnpm test golden-responses

# Full regression tests
pnpm test regression-tests.full
```

## Adding New Golden Responses

1. Add to `golden-responses.md` (documentation)
2. Add to `golden-responses.test-data.ts` (test data)
3. Update test cases
4. Run regression tests

---

*See `golden-responses.md` for complete documentation.*
