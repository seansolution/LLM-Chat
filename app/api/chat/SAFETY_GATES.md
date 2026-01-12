# Safety Gates - Deployment Checks

## Overview

Safety gates are **fail-fast tests** that MUST pass before deployment. If any gate fails, the build is blocked.

## Gates

### 1. Intent Coverage ≥ 90%
**Purpose:** Ensure intent detection remains accurate

**Failure:** If < 90% of messages are correctly mapped to intents

**Action:** Review intent detection logic, check for new message patterns

---

### 2. Persona Accuracy ≥ 95%
**Purpose:** Ensure persona mapping remains accurate

**Failure:** If < 95% of intents are mapped to correct persona

**Action:** Review persona detection, check keyword matching

---

### 3. Pricing Answer Rate ≥ 95%
**Purpose:** Ensure pricing questions get answered

**Failure:** If < 95% of pricing questions contain actual prices

**Action:** Check system prompt, knowledge base, LLM behavior

---

### 4. Forbidden Response Rate ≤ 0%
**Purpose:** Zero tolerance for forbidden content

**Failure:** If ANY response contains:
- Legal explanations
- Tax calculations
- Hallucinated URLs
- Placeholder text
- AI/system claims

**Action:** Review system prompt, add stricter rules

---

### 5. Golden Response Match Rate ≥ 90%
**Purpose:** Ensure responses match expected quality

**Failure:** If < 90% of responses match golden templates

**Action:** Review response quality, update golden responses if needed

---

## Running Safety Gates

### Local Development

```bash
# Run safety gates only
npm run test:safety-gates

# Run all tests + safety gates (CI simulation)
npm run test:ci
```

### CI/CD Integration

#### GitHub Actions Example

```yaml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - run: pnpm install
      - run: pnpm test:ci  # Runs tests + safety gates
      
      # Build only if tests pass
      - run: pnpm build
```

#### GitLab CI Example

```yaml
test:
  stage: test
  script:
    - pnpm install
    - pnpm test:ci
  only:
    - merge_requests
    - main
```

#### CircleCI Example

```yaml
version: 2.1
jobs:
  test:
    docker:
      - image: node:18
    steps:
      - checkout
      - run: pnpm install
      - run: pnpm test:ci
```

---

## Threshold Configuration

Edit `app/api/chat/safety-gates.ts`:

```typescript
export const SAFETY_GATE_THRESHOLDS: SafetyGateThresholds = {
  intentCoverage: 90,        // Adjust as needed
  personaAccuracy: 95,       // Adjust as needed
  pricingAnswerRate: 95,     // Adjust as needed
  forbiddenResponseRate: 0,   // Zero tolerance (do not change)
  goldenResponseMatchRate: 90, // Adjust as needed
}
```

---

## Example Output

### ✅ All Gates Passed

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

### ❌ Gates Failed

```
============================================================
SAFETY GATES - DEPLOYMENT CHECKS
============================================================

✓ Intent Coverage: 100.0% (threshold: 90%)
✓ Persona Accuracy: 100.0% (threshold: 95%)
✗ Pricing Answer Rate: 80.0% < 95% (FAILED)
✓ Forbidden Response Rate: 0.0% (threshold: <= 0%)
✓ Golden Response Match Rate: 90.0% (threshold: 90%)

------------------------------------------------------------
Summary: 4/5 gates passed

❌ SAFETY GATES FAILED - Deployment blocked

Failed gates:
  - Pricing Answer Rate: 80.0% < 95%

============================================================

❌ Safety gates failed. Deployment blocked.
```

**Exit Code:** 1 (build fails)

---

## Integration with Existing Tests

Safety gates use the same metrics system as the dashboard:

1. Load chat logs (from `dashboard.test-data.ts` or database)
2. Calculate metrics using `calculateMetrics()`
3. Check against thresholds
4. Exit with code 1 if any gate fails

---

## Custom Data Sources

To use production chat logs instead of test data:

```typescript
// scripts/run-safety-gates.ts
import { fetchChatLogsFromDatabase } from './your-db-module'

async function main() {
  const logs = await fetchChatLogsFromDatabase(
    startDate,
    endDate
  )
  
  runSafetyGates(logs)
}
```

---

## Troubleshooting

### Gates fail but metrics look good

1. Check threshold values
2. Verify chat log data is correct
3. Review metric calculation logic

### Gates pass but production has issues

1. Update chat logs with recent production data
2. Review threshold values (may be too lenient)
3. Add more test cases

### Need to temporarily bypass gates

**⚠️ NOT RECOMMENDED**

If absolutely necessary (e.g., emergency hotfix):

```bash
# Skip safety gates (use with caution)
npm test  # Run tests only, skip safety gates
```

**Better approach:** Lower thresholds temporarily, then fix issues

---

## Best Practices

1. **Never bypass gates** - Fix the issues instead
2. **Update thresholds carefully** - Document why
3. **Use production data** - Test with real chat logs
4. **Monitor trends** - Track metrics over time
5. **Fail fast** - Catch issues before deployment

---

## Exit Codes

- **0** - All gates passed, deployment approved
- **1** - One or more gates failed, deployment blocked

CI systems will automatically fail the build on exit code 1.
