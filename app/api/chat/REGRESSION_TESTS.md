# Regression Tests Documentation

## Overview

Regression tests ensure that the chatbot behavior remains stable over time. These tests are automatically generated from historical chat logs and will fail if behavior changes unexpectedly.

## Test Types

### 1. Intent Detection Tests (`regression-tests.regression.test.ts`)

**Purpose:** Validate that intent detection remains stable

**What it tests:**
- Intent mapping (e.g., "จดทะเบียนบจก" → `company_registration_pricing`)
- Persona mapping (e.g., → `REGISTRATION`)

**What causes failures:**
- Intent changes (e.g., "จดทะเบียน" maps to different intent)
- Persona changes (e.g., maps to `ACCOUNTING` instead of `REGISTRATION`)

**Run:**
```bash
npm test regression-tests.regression
```

---

### 2. Full Regression Tests (`regression-tests.full.test.ts`)

**Purpose:** Validate both intent detection AND AI response behavior

**What it tests:**
- Intent & persona detection
- Pricing answers (must contain price for pricing questions)
- Restricted responses (must redirect, not explain)
- Forbidden patterns (no legal explanations, no tax calculations, etc.)
- Required patterns (contact info, CTA)

**What causes failures:**
- Price disappears from pricing responses
- Forbidden explanations appear (legal steps, tax calculations)
- Missing contact information
- Wrong persona/intent

**Run:**
```bash
# Requires API to be running
npm run dev  # In one terminal
npm test regression-tests.full  # In another terminal
```

---

## Adding New Chat Logs

### Step 1: Export Chat Logs

Export chat logs from your database/API in this format:

```typescript
{
  id: string
  timestamp: string
  userMessage: string
  aiResponse: string
}
```

### Step 2: Add to `chat-logs.ts`

Add your logs to the `historicalChatLogs` array:

```typescript
export const historicalChatLogs: ChatLog[] = [
  // ... existing logs
  {
    id: 'log-011',
    timestamp: '2024-01-20T14:00:00Z',
    userMessage: 'ต้องการจดทะเบียนหจก',
    aiResponse: 'จัดตั้งห้างหุ้นส่วนจำกัด (หจก)\nค่าบริการอยู่ที่ 15,000 บาท (ครั้งเดียว)\n...',
  },
]
```

### Step 3: Generate Tests

Run the generator script:

```bash
npx ts-node scripts/generate-regression-tests.ts
```

Or add to `package.json`:

```json
{
  "scripts": {
    "test:regression:generate": "ts-node scripts/generate-regression-tests.ts"
  }
}
```

Then run:
```bash
npm run test:regression:generate
```

### Step 4: Review Generated Tests

1. Check `regression-tests.regression.test.ts` - Intent detection tests
2. Check `regression-tests.full.test.ts` - Full response tests
3. Verify test names and assertions are correct

### Step 5: Run Tests

```bash
# Test intent detection only
npm test regression-tests.regression

# Test full responses (requires API)
npm test regression-tests.full
```

### Step 6: Commit

Commit both:
- Updated `chat-logs.ts` (source data)
- Generated test files (regression tests)

---

## Test Structure

### Intent Detection Test

```typescript
test("จดทะเบียนบจก ราคาเท่าไหร่", () => {
  const userMessage = "จดทะเบียนบจก ราคาเท่าไหร่";
  const detected = detectIntent(userMessage);
  
  expect(detected.intent).toBe("company_registration_pricing");
  expect(detected.persona).toBe("REGISTRATION");
});
```

### Full Regression Test

```typescript
test("จดทะเบียนบจก ราคาเท่าไหร่", async () => {
  const userMessage = "จดทะเบียนบจก ราคาเท่าไหร่";
  const detected = detectIntent(userMessage);
  
  // Intent & Persona
  expect(detected.intent).toBe("company_registration_pricing");
  expect(detected.persona).toBe("REGISTRATION");
  
  // API call (uncomment when ready)
  // const response = await fetch('/api/chat', {
  //   method: 'POST',
  //   body: JSON.stringify({ message: userMessage })
  // });
  // const { reply } = await response.json();
  
  // Pricing question - must contain price
  // expect(containsPrice(reply)).toBe(true);
  // expect(reply).toMatch(/\d+.*บาท/);
  
  // Forbidden patterns - should NOT appear
  // expect(reply).not.toMatch(/ขั้นตอน.*จดทะเบียน/);
  
  // Required patterns - MUST appear
  // expect(reply).toMatch(/086-398-6889|zanhcpe@gmail.com/);
});
```

---

## Failure Scenarios

### ❌ Intent Changes

**Before:**
```typescript
expect(detected.intent).toBe("company_registration_pricing");
```

**After (if behavior changes):**
```typescript
// Test fails if intent becomes "unknown" or different intent
```

**Action:** Review intent detection logic, update test if change is intentional

---

### ❌ Persona Changes

**Before:**
```typescript
expect(detected.persona).toBe("REGISTRATION");
```

**After (if behavior changes):**
```typescript
// Test fails if persona becomes "ACCOUNTING" or "HR"
```

**Action:** Review persona mapping, update test if change is intentional

---

### ❌ Price Disappears

**Before:**
```typescript
expect(containsPrice(reply)).toBe(true);
```

**After (if AI stops answering prices):**
```typescript
// Test fails if response no longer contains price
```

**Action:** Check system prompt, knowledge base, or LLM behavior

---

### ❌ Forbidden Explanation Appears

**Before:**
```typescript
expect(reply).not.toMatch(/ขั้นตอน.*จดทะเบียน/);
```

**After (if AI explains procedures):**
```typescript
// Test fails if response contains forbidden patterns
```

**Action:** Review system prompt, add stricter rules

---

## Best Practices

1. **Regular Updates:** Add new logs weekly/monthly to catch regressions early
2. **Review Failures:** Don't just update tests - understand why behavior changed
3. **Intentional Changes:** If behavior change is intentional, update both:
   - The test expectation
   - The chat log (if it's now outdated)
4. **Version Control:** Commit both source logs and generated tests
5. **CI Integration:** Run regression tests in CI/CD pipeline

---

## Troubleshooting

### Tests fail after adding new logs

1. Check if new logs have different expected behavior
2. Review the generated test cases
3. Manually verify intent detection for new messages
4. Update `chat-logs.ts` if logs are incorrect

### Generated tests have wrong expectations

1. Review the mapping logic in `regression-test-generator.ts`
2. Check if chat logs are correctly formatted
3. Manually override expectations if needed (but document why)

### Full tests require API but it's slow

1. Use intent-only tests for fast feedback
2. Run full tests separately (e.g., nightly)
3. Consider mocking API responses for faster tests

---

## File Structure

```
app/api/chat/
├── chat-logs.ts                          # Source chat logs
├── regression-test-generator.ts          # Test generation logic
├── regression-tests.regression.test.ts   # Generated: Intent tests
├── regression-tests.full.test.ts         # Generated: Full tests
└── REGRESSION_TESTS.md                   # This file

scripts/
└── generate-regression-tests.ts          # Generator script
```

---

## Example Workflow

```bash
# 1. Add new chat logs
# Edit: app/api/chat/chat-logs.ts

# 2. Generate tests
npm run test:regression:generate

# 3. Review generated tests
# Check: app/api/chat/regression-tests.regression.test.ts

# 4. Run tests
npm test regression-tests.regression

# 5. Commit
git add app/api/chat/chat-logs.ts
git add app/api/chat/regression-tests.*.test.ts
git commit -m "Add regression tests from new chat logs"
```

---

## Questions?

- Check test failures carefully - they indicate real behavior changes
- Review the mapping logic if tests seem incorrect
- Update documentation if you change the generation process
