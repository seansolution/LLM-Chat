# Deterministic Role Selection

## Overview

The role selection system automatically chooses the appropriate AI role (`SALES`, `SUPPORT`, or `OPS`) **BEFORE** calling the LLM. This ensures deterministic behavior and consistent responses.

## Selection Priority

The role is selected in the following priority order:

### 1. Flags (Highest Priority)
- `flags.opsMode === true` → **OPS**
- Overrides all other conditions

### 2. Intent-based Selection
- Intent ends with `"_pricing"` → **SALES**
- Intent includes `"registration"` → **SALES**
- Intent includes `"overview"` → **SUPPORT**
- Intent includes `"support"` → **SUPPORT**
- Intent is `"restricted_legal"` or includes `"restricted"` → **SUPPORT**

### 3. Confidence-based Selection
- `confidence < 0.5` → **SUPPORT** (low confidence = redirect to support)
- `confidence >= 0.5` → Continue to default

### 4. Default
- **SALES** (ฝ่ายขาย)

## Deterministic Guarantees

✅ **Same inputs = Same output**: Given identical `intent`, `confidence`, and `flags`, the function always returns the same role.

✅ **No randomness**: The selection logic is purely deterministic, no random factors.

✅ **No external dependencies**: Selection uses only the provided parameters, no API calls or external state.

✅ **Executed before LLM**: Role is selected before knowledge loading, prompt building, and LLM invocation.

## Code Location

- **Function**: `selectRole()` in `app/api/chat/role-prompts.ts`
- **Usage**: `app/api/chat/route.ts` (line ~254)
- **Tests**: `app/api/chat/role-selection.test.ts`

## Usage

```typescript
import { selectRole } from './role-prompts'

// Automatic selection
const role = selectRole({
  intent: 'company_registration_pricing',
  confidence: 0.95,
  flags: { opsMode: false }
})
// → 'SALES'

// Force OPS mode
const role = selectRole({
  intent: 'any_intent',
  flags: { opsMode: true }
})
// → 'OPS'
```

## API Integration

The role is automatically selected in the API route:

```typescript
// Role selection happens BEFORE LLM call
const selectedRole: AIRole = body.role || selectRole({
  intent: intentResult.intent,
  confidence: body.confidence,
  flags: body.flags
})

// ... knowledge loading ...

// ... system prompt building (uses selectedRole) ...

// ... LLM call (uses prompt with selectedRole) ...
```

## Test Coverage

**33 test cases** covering:
- ✅ Flags priority (5 tests)
- ✅ Intent-based SALES selection (5 tests)
- ✅ Intent-based SUPPORT selection (4 tests)
- ✅ Confidence-based selection (5 tests)
- ✅ Default selection (3 tests)
- ✅ Deterministic behavior (3 tests)
- ✅ Edge cases (4 tests)
- ✅ Real-world scenarios (4 tests)

Run tests:
```bash
pnpm test role-selection
```

## Selection Examples

| Intent | Confidence | Flags | Selected Role | Reason |
|--------|-----------|-------|---------------|--------|
| `company_registration_pricing` | 0.95 | `{}` | `SALES` | Pricing intent |
| `accounting_overview` | 0.85 | `{}` | `SUPPORT` | Overview intent |
| `unknown_intent` | 0.3 | `{}` | `SUPPORT` | Low confidence |
| `any_intent` | 0.9 | `{opsMode: true}` | `OPS` | OPS flag |
| `greeting` | - | `{}` | `SALES` | Default |
| `restricted_legal` | 0.8 | `{}` | `SUPPORT` | Restricted intent |

## Important Notes

⚠️ **Role selection happens BEFORE LLM call**: This ensures the correct system prompt is used.

⚠️ **Manual override supported**: If `body.role` is provided, it takes precedence over automatic selection.

⚠️ **Deterministic only**: The function uses only `intent`, `confidence`, and `flags` - no external state or randomness.

## Implementation Details

### Function Signature

```typescript
export function selectRole(params: {
  intent: string
  confidence?: number
  flags?: {
    opsMode?: boolean
    [key: string]: unknown
  }
}): AIRole
```

### Return Type

```typescript
type AIRole = 'SALES' | 'SUPPORT' | 'OPS'
```

### Validation

- Empty or invalid `intent` → Defaults to `SALES`
- Missing `confidence` → Treated as high confidence (continues to default)
- Missing `flags` → Treated as `{}` (no flags)

## Production Readiness

✅ **Deterministic**: Same inputs always produce same output  
✅ **Tested**: 33 comprehensive test cases  
✅ **Documented**: Clear priority order and examples  
✅ **Type-safe**: Full TypeScript support  
✅ **Integrated**: Used in production API route  
✅ **Before LLM**: Executed before LLM invocation  
