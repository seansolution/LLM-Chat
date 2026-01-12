# Safety Gates - Quick Start

## What Are Safety Gates?

Fail-fast tests that **block deployment** if quality metrics don't meet thresholds.

## Thresholds

| Gate | Threshold | Failure Condition |
|------|-----------|-------------------|
| Intent Coverage | ≥ 90% | < 90% |
| Persona Accuracy | ≥ 95% | < 95% |
| Pricing Answer Rate | ≥ 95% | < 95% |
| Forbidden Response Rate | ≤ 0% | > 0% |
| Golden Response Match | ≥ 90% | < 90% |

## Running Safety Gates

```bash
# Run safety gates only
pnpm run test:safety-gates

# Run all tests + safety gates (CI simulation)
pnpm run test:ci
```

## CI Integration

### GitHub Actions

```yaml
- run: pnpm install
- run: pnpm run test:ci  # Fails build if gates don't pass
- run: pnpm build
```

### Exit Codes

- **0** = All gates passed ✅
- **1** = One or more gates failed ❌ (build blocked)

## Example Output

### ✅ Pass

```
============================================================
SAFETY GATES - DEPLOYMENT CHECKS
============================================================

✓ Intent Coverage: 100.0% (threshold: 90%)
✓ Persona Accuracy: 100.0% (threshold: 95%)
✓ Pricing Answer Rate: 100.0% (threshold: 95%)
✓ Forbidden Response Rate: 0.0% (threshold: <= 0%)
✓ Golden Response Match Rate: 90.0% (threshold: 90%)

------------------------------------------------------------
Summary: 5/5 gates passed

✅ ALL SAFETY GATES PASSED - Deployment approved
============================================================
```

### ❌ Fail

```
============================================================
SAFETY GATES - DEPLOYMENT CHECKS
============================================================

✗ Intent Coverage: 60.0% < 90% (FAILED)
✗ Persona Accuracy: 80.0% < 95% (FAILED)
...

❌ SAFETY GATES FAILED - Deployment blocked
============================================================
```

**Build fails with exit code 1**

## Configuration

Edit thresholds in `app/api/chat/safety-gates.ts`:

```typescript
export const SAFETY_GATE_THRESHOLDS = {
  intentCoverage: 90,
  personaAccuracy: 95,
  pricingAnswerRate: 95,
  forbiddenResponseRate: 0,  // Zero tolerance
  goldenResponseMatchRate: 90,
}
```

## Notes

- Uses `exampleChatLogs` by default
- In production, load real chat logs from database
- Never bypass gates - fix the issues instead
