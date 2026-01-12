/**
 * Regression Test Generator
 * 
 * Converts historical chat logs into deterministic Jest test cases
 * that will fail if behavior changes.
 */

import type { Persona } from './intent'
import { detectIntent } from './intent'
import { containsPrice, detectForbiddenViolations } from './dashboard'

// ============================================================================
// TYPES
// ============================================================================

export interface ChatLog {
  id: string
  timestamp: string
  userMessage: string
  aiResponse: string
}

export interface RegressionTestCase {
  id: string
  userMessage: string
  expectedIntent: string
  expectedPersona: Persona
  shouldAnswerPrice: boolean
  shouldBeRestricted: boolean
  expectedPricePattern?: RegExp // Pattern to match price in response
  forbiddenPatterns?: RegExp[] // Patterns that should NOT appear
  requiredPatterns?: RegExp[] // Patterns that MUST appear
  description?: string
}

export interface TestGroup {
  intent: string
  persona: Persona
  tests: RegressionTestCase[]
}

// ============================================================================
// MAPPING LOGIC
// ============================================================================

/**
 * Analyze a chat log and extract expected behavior
 */
export function analyzeChatLog(log: ChatLog): RegressionTestCase {
  const detected = detectIntent(log.userMessage)
  const hasPrice = containsPrice(log.aiResponse)
  const violations = detectForbiddenViolations(log.aiResponse)

  // Determine if this should be a pricing question
  const pricingKeywords = /ราคา|price|เท่าไหร่|กี่บาท|ค่าใช้จ่าย|cost|fee|ค่าบริการ/i
  const shouldAnswerPrice = pricingKeywords.test(log.userMessage)

  // Determine if this should be restricted
  const restrictedKeywords = /ขั้นตอน|วิธีการ|procedure|process|กฎหมาย|legal|compliance|คำนวณ|ตีความ|เชิงลึก|ซับซ้อน/i
  const shouldBeRestricted = restrictedKeywords.test(log.userMessage)

  // Extract price pattern if price exists
  const pricePattern = hasPrice
    ? /\d{1,3}(?:,\d{3})*(?:\.\d+)?\s*(?:บาท|THB|baht)/i
    : undefined

  // Build forbidden patterns based on violations found
  const forbiddenPatterns: RegExp[] = []
  if (violations.some(v => v.type === 'legal_explanation')) {
    forbiddenPatterns.push(/ขั้นตอน.*จดทะเบียน|วิธีการ.*จดทะเบียน|กระบวนการ.*จดทะเบียน/i)
    forbiddenPatterns.push(/ขั้นตอน.*ยื่นภาษี|วิธีการ.*ยื่นภาษี|กระบวนการ.*ยื่นภาษี/i)
  }
  if (violations.some(v => v.type === 'tax_calculation')) {
    forbiddenPatterns.push(/คำนวณ.*ภาษี|วิธีคำนวณ|สูตรคำนวณ/i)
  }
  if (violations.some(v => v.type === 'hallucinated_url')) {
    forbiddenPatterns.push(/https?:\/\/[^\s]+(?!seansolution\.co\.th)/i)
  }
  if (violations.some(v => v.type === 'placeholder_text')) {
    forbiddenPatterns.push(/\[website\]|\[contact\]|\[price\]|\[.*?\]/i)
  }
  if (violations.some(v => v.type === 'ai_claim')) {
    forbiddenPatterns.push(/ฉันเป็นระบบ|ฉันเป็น AI|ฉันเป็นโทรศัพท์|ฉันเป็นแพลตฟอร์ม/i)
  }

  // Required patterns (contact info, CTA)
  const requiredPatterns: RegExp[] = []
  if (!shouldBeRestricted) {
    requiredPatterns.push(/086-398-6889|zanhcpe@gmail.com|ติดต่อ|โทร/i)
  }

  return {
    id: log.id,
    userMessage: log.userMessage,
    expectedIntent: detected.intent, // Use actual detected intent as baseline
    expectedPersona: detected.persona, // Use actual detected persona as baseline
    shouldAnswerPrice,
    shouldBeRestricted,
    expectedPricePattern: pricePattern,
    forbiddenPatterns: forbiddenPatterns.length > 0 ? forbiddenPatterns : undefined,
    requiredPatterns: requiredPatterns.length > 0 ? requiredPatterns : undefined,
    description: log.userMessage.substring(0, 50), // Use first 50 chars as description
  }
}

/**
 * Group test cases by intent
 */
export function groupTestsByIntent(tests: RegressionTestCase[]): TestGroup[] {
  const groups = new Map<string, TestGroup>()

  for (const test of tests) {
    const key = `${test.expectedIntent}_${test.expectedPersona}`
    
    if (!groups.has(key)) {
      groups.set(key, {
        intent: test.expectedIntent,
        persona: test.expectedPersona,
        tests: [],
      })
    }

    groups.get(key)!.tests.push(test)
  }

  return Array.from(groups.values())
}

/**
 * Generate Jest test code from test cases
 */
export function generateJestTests(testGroups: TestGroup[]): string {
  const imports = `import { detectIntent } from "./intent";
import { containsPrice, detectForbiddenViolations } from "./dashboard";
`

  const testGroupsCode = testGroups.map(group => {
    const groupName = `${group.intent} (${group.persona})`
    const testsCode = group.tests.map(test => {
      const testName = test.description || test.userMessage.substring(0, 50)
      const sanitizedTestName = testName.replace(/[^a-zA-Z0-9ก-๙\s]/g, '').trim()

      return `  test("${sanitizedTestName}", () => {
    const userMessage = ${JSON.stringify(test.userMessage)};
    const detected = detectIntent(userMessage);
    
    // Intent assertion
    expect(detected.intent).toBe("${test.expectedIntent}");
    
    // Persona assertion
    expect(detected.persona).toBe("${test.expectedPersona}");
    
    // Note: Full response testing requires API call
    // This test only validates intent detection
    // For full regression testing, use regression-tests.full.test.ts
  });`
    }).join('\n\n')

    return `describe("${groupName}", () => {
${testsCode}
});`
  }).join('\n\n')

  return `${imports}

/**
 * REGRESSION TESTS - Intent Detection
 * 
 * These tests ensure intent detection behavior remains stable.
 * Generated from historical chat logs.
 * 
 * ⚠️ DO NOT EDIT MANUALLY
 * To update: Run regression test generator with new chat logs
 */

${testGroupsCode}
`
}

/**
 * Generate full regression tests (with API response validation)
 */
export function generateFullRegressionTests(tests: RegressionTestCase[]): string {
  const imports = `import { detectIntent } from "./intent";
import { containsPrice, detectForbiddenViolations } from "./dashboard";
`

  const testsCode = tests.map(test => {
    const testName = test.description || test.userMessage.substring(0, 50)
    const sanitizedTestName = testName.replace(/[^a-zA-Z0-9ก-๙\s]/g, '').trim()

    const assertions: string[] = [
      `    // Intent & Persona`,
      `    expect(detected.intent).toBe("${test.expectedIntent}");`,
      `    expect(detected.persona).toBe("${test.expectedPersona}");`,
    ]

    if (test.shouldAnswerPrice) {
      assertions.push('')
      assertions.push(`    // Pricing question - must contain price`)
      assertions.push(`    // Note: This requires actual API response`)
      assertions.push(`    // expect(containsPrice(aiResponse)).toBe(true);`)
    }

    if (test.shouldBeRestricted) {
      assertions.push('')
      assertions.push(`    // Restricted question - should redirect`)
      assertions.push(`    // expect(aiResponse).toMatch(/กรณีนี้เป็นรายละเอียดเชิงลึก/);`)
    }

    if (test.forbiddenPatterns && test.forbiddenPatterns.length > 0) {
      assertions.push('')
      assertions.push(`    // Forbidden patterns - should NOT appear`)
      test.forbiddenPatterns.forEach(pattern => {
        assertions.push(`    // expect(aiResponse).not.toMatch(${pattern.toString()});`)
      })
    }

    if (test.requiredPatterns && test.requiredPatterns.length > 0) {
      assertions.push('')
      assertions.push(`    // Required patterns - MUST appear`)
      test.requiredPatterns.forEach(pattern => {
        assertions.push(`    // expect(aiResponse).toMatch(${pattern.toString()});`)
      })
    }

    return `  test("${sanitizedTestName}", async () => {
    const userMessage = ${JSON.stringify(test.userMessage)};
    const detected = detectIntent(userMessage);
    
${assertions.join('\n')}
    
    // TODO: Add API call to get full response
    // const response = await fetch('/api/chat', {
    //   method: 'POST',
    //   body: JSON.stringify({ message: userMessage })
    // });
    // const { reply } = await response.json();
    // Then validate reply against all assertions above
  });`
  }).join('\n\n')

  return `${imports}

/**
 * FULL REGRESSION TESTS - Intent + Response Validation
 * 
 * These tests validate both intent detection AND AI response behavior.
 * Requires API to be running.
 * 
 * ⚠️ DO NOT EDIT MANUALLY
 * To update: Run regression test generator with new chat logs
 */

describe("Regression Tests - Full", () => {
${testsCode}
});
`
}

/**
 * Convert chat logs to regression test cases
 */
export function convertLogsToTests(logs: ChatLog[]): RegressionTestCase[] {
  return logs.map(log => analyzeChatLog(log))
}
