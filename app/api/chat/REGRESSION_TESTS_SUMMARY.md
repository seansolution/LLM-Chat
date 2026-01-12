# Regression Tests - Quick Reference

## What Are Regression Tests?

Regression tests capture the **current behavior** of the chatbot and ensure it doesn't change unexpectedly. They are generated from historical chat logs.

## Test Files

1. **`regression-tests.regression.test.ts`** - Intent detection tests (fast, no API needed)
2. **`regression-tests.full.test.ts`** - Full response tests (requires API)

## Running Tests

```bash
# Intent detection only (fast)
npm test regression-tests.regression

# Full tests (requires API running)
npm run dev  # Terminal 1
npm test regression-tests.full  # Terminal 2
```

## Adding New Logs

1. Add to `chat-logs.ts`:
```typescript
{
  id: 'log-XXX',
  timestamp: '2024-XX-XX',
  userMessage: '...',
  aiResponse: '...',
}
```

2. Generate tests:
```bash
npm run test:regression:generate
```

3. Review and commit generated test files

## What Causes Test Failures?

- ✅ **Intent changes** - Different intent detected
- ✅ **Persona changes** - Different persona detected  
- ✅ **Price disappears** - Pricing question no longer has price
- ✅ **Forbidden content** - Legal explanations, tax calculations appear
- ✅ **Missing required patterns** - Contact info, CTA missing

## Current Test Coverage

- **10 test cases** from historical logs
- **3 intent groups**: REGISTRATION, ACCOUNTING, HR
- **All tests passing** ✅

## Important Notes

⚠️ **Tests document CURRENT behavior, not ideal behavior**

If tests fail:
1. Check if behavior change is intentional
2. If intentional: Update test expectations
3. If unintentional: Fix the bug, tests should pass

---

See `REGRESSION_TESTS.md` for full documentation.
