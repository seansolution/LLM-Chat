/**
 * Role Selection Tests
 * 
 * Tests for deterministic role switching logic.
 * Ensures role is selected correctly based on intent, confidence, and flags.
 */

import { selectRole, type AIRole } from './role-prompts'

describe('Role Selection - Deterministic Logic', () => {
  
  // ============================================================================
  // PRIORITY 1: Flags (highest priority)
  // ============================================================================
  
  describe('Flags Priority (OPS Mode)', () => {
    test('opsMode flag overrides pricing intent → OPS', () => {
      const role = selectRole({
        intent: 'company_registration_pricing',
        confidence: 0.95,
        flags: { opsMode: true }
      })
      expect(role).toBe('OPS')
    })

    test('opsMode flag overrides overview intent → OPS', () => {
      const role = selectRole({
        intent: 'company_registration_overview',
        flags: { opsMode: true }
      })
      expect(role).toBe('OPS')
    })

    test('opsMode flag overrides low confidence → OPS', () => {
      const role = selectRole({
        intent: 'unknown_intent',
        confidence: 0.3,
        flags: { opsMode: true }
      })
      expect(role).toBe('OPS')
    })

    test('opsMode false does not force OPS', () => {
      const role = selectRole({
        intent: 'company_registration_pricing',
        flags: { opsMode: false }
      })
      expect(role).toBe('SALES')
    })

    test('missing opsMode flag does not force OPS', () => {
      const role = selectRole({
        intent: 'company_registration_pricing',
        flags: {}
      })
      expect(role).toBe('SALES')
    })
  })

  // ============================================================================
  // PRIORITY 2: Intent-based selection
  // ============================================================================
  
  describe('Intent-based Selection - SALES', () => {
    test('pricing intent → SALES', () => {
      const role = selectRole({
        intent: 'company_registration_pricing'
      })
      expect(role).toBe('SALES')
    })

    test('accounting pricing intent → SALES', () => {
      const role = selectRole({
        intent: 'accounting_pricing'
      })
      expect(role).toBe('SALES')
    })

    test('hr pricing intent → SALES', () => {
      const role = selectRole({
        intent: 'hr_pricing'
      })
      expect(role).toBe('SALES')
    })

    test('registration intent → SALES', () => {
      const role = selectRole({
        intent: 'company_registration_overview'
      })
      expect(role).toBe('SALES')
    })

    test('registration in intent name → SALES', () => {
      const role = selectRole({
        intent: 'registration_service'
      })
      expect(role).toBe('SALES')
    })
  })

  describe('Intent-based Selection - SUPPORT', () => {
    test('overview intent → SUPPORT', () => {
      const role = selectRole({
        intent: 'accounting_overview'
      })
      expect(role).toBe('SUPPORT')
    })

    test('support intent → SUPPORT', () => {
      const role = selectRole({
        intent: 'customer_support'
      })
      expect(role).toBe('SUPPORT')
    })

    test('restricted_legal intent → SUPPORT', () => {
      const role = selectRole({
        intent: 'restricted_legal'
      })
      expect(role).toBe('SUPPORT')
    })

    test('restricted in intent name → SUPPORT', () => {
      const role = selectRole({
        intent: 'restricted_tax_advice'
      })
      expect(role).toBe('SUPPORT')
    })
  })

  // ============================================================================
  // PRIORITY 3: Confidence-based selection
  // ============================================================================
  
  describe('Confidence-based Selection', () => {
    test('low confidence (< 0.5) → SUPPORT', () => {
      const role = selectRole({
        intent: 'unknown_intent',
        confidence: 0.3
      })
      expect(role).toBe('SUPPORT')
    })

    test('very low confidence (0.1) → SUPPORT', () => {
      const role = selectRole({
        intent: 'greeting',
        confidence: 0.1
      })
      expect(role).toBe('SUPPORT')
    })

    test('high confidence (>= 0.5) → SALES (default)', () => {
      const role = selectRole({
        intent: 'unknown_intent',
        confidence: 0.7
      })
      expect(role).toBe('SALES')
    })

    test('confidence exactly 0.5 → SALES (default)', () => {
      const role = selectRole({
        intent: 'unknown_intent',
        confidence: 0.5
      })
      expect(role).toBe('SALES')
    })

    test('missing confidence → SALES (default)', () => {
      const role = selectRole({
        intent: 'unknown_intent'
      })
      expect(role).toBe('SALES')
    })
  })

  // ============================================================================
  // DEFAULT: SALES
  // ============================================================================
  
  describe('Default Selection', () => {
    test('unknown intent without confidence → SALES', () => {
      const role = selectRole({
        intent: 'unknown_intent'
      })
      expect(role).toBe('SALES')
    })

    test('greeting intent → SALES (default)', () => {
      const role = selectRole({
        intent: 'greeting'
      })
      expect(role).toBe('SALES')
    })

    test('empty intent string → SALES (fallback)', () => {
      const role = selectRole({
        intent: ''
      })
      expect(role).toBe('SALES')
    })
  })

  // ============================================================================
  // DETERMINISTIC BEHAVIOR TESTS
  // ============================================================================
  
  describe('Deterministic Behavior', () => {
    test('same inputs produce same output (pricing)', () => {
      const params = {
        intent: 'company_registration_pricing',
        confidence: 0.9
      }
      const role1 = selectRole(params)
      const role2 = selectRole(params)
      const role3 = selectRole(params)
      
      expect(role1).toBe(role2)
      expect(role2).toBe(role3)
      expect(role1).toBe('SALES')
    })

    test('same inputs produce same output (overview)', () => {
      const params = {
        intent: 'accounting_overview',
        confidence: 0.8
      }
      const role1 = selectRole(params)
      const role2 = selectRole(params)
      
      expect(role1).toBe(role2)
      expect(role1).toBe('SUPPORT')
    })

    test('same inputs produce same output (ops mode)', () => {
      const params = {
        intent: 'any_intent',
        flags: { opsMode: true }
      }
      const role1 = selectRole(params)
      const role2 = selectRole(params)
      
      expect(role1).toBe(role2)
      expect(role1).toBe('OPS')
    })
  })

  // ============================================================================
  // EDGE CASES
  // ============================================================================
  
  describe('Edge Cases', () => {
    test('pricing intent with low confidence → SALES (intent priority)', () => {
      const role = selectRole({
        intent: 'company_registration_pricing',
        confidence: 0.3 // Low confidence
      })
      expect(role).toBe('SALES') // Intent takes priority
    })

    test('overview intent with high confidence → SUPPORT (intent priority)', () => {
      const role = selectRole({
        intent: 'accounting_overview',
        confidence: 0.95 // High confidence
      })
      expect(role).toBe('SUPPORT') // Intent takes priority
    })

    test('registration in pricing intent → SALES', () => {
      const role = selectRole({
        intent: 'company_registration_pricing'
      })
      expect(role).toBe('SALES')
    })

    test('multiple flags, opsMode wins', () => {
      const role = selectRole({
        intent: 'company_registration_pricing',
        flags: {
          opsMode: true,
          otherFlag: true
        }
      })
      expect(role).toBe('OPS')
    })
  })

  // ============================================================================
  // INTEGRATION SCENARIOS
  // ============================================================================
  
  describe('Real-world Scenarios', () => {
    test('customer asks pricing → SALES', () => {
      const role = selectRole({
        intent: 'company_registration_pricing',
        confidence: 0.95
      })
      expect(role).toBe('SALES')
    })

    test('customer asks overview → SUPPORT', () => {
      const role = selectRole({
        intent: 'accounting_overview',
        confidence: 0.85
      })
      expect(role).toBe('SUPPORT')
    })

    test('uncertain intent → SUPPORT', () => {
      const role = selectRole({
        intent: 'greeting',
        confidence: 0.3
      })
      expect(role).toBe('SUPPORT')
    })

    test('internal ops analysis → OPS', () => {
      const role = selectRole({
        intent: 'any_intent',
        flags: { opsMode: true }
      })
      expect(role).toBe('OPS')
    })
  })
})
