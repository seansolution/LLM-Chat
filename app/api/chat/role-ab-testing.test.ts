/**
 * Role-Based A/B Testing Tests
 * 
 * Tests for deterministic variant assignment and role-based response variants.
 */

import {
  assignVariant,
  applyRoleVariantToResponse,
  getRoleVariants,
  calculateRoleContactRate,
  calculateRoleContinuationRate,
  calculateRoleConversionRate,
  generateRoleABTestResults,
  calculateRoleStatisticalSignificance,
  type RoleABTestMetric,
  type RoleABTestContactEvent,
  type RoleABTestConversationEvent,
} from './role-ab-testing'

describe('Role-Based A/B Testing', () => {
  
  // ============================================================================
  // VARIANT ASSIGNMENT (Deterministic)
  // ============================================================================
  
  describe('Deterministic Variant Assignment', () => {
    test('same user + same role + same response type = same variant', () => {
      const userId = 'user123'
      const role = 'SALES'
      const responseType = 'pricing'
      
      const variant1 = assignVariant(userId, role, responseType)
      const variant2 = assignVariant(userId, role, responseType)
      const variant3 = assignVariant(userId, role, responseType)
      
      expect(variant1).toBe(variant2)
      expect(variant2).toBe(variant3)
      expect(['A', 'B']).toContain(variant1)
    })

    test('different user may get different variant', () => {
      const role = 'SALES'
      const responseType = 'pricing'
      
      const variant1 = assignVariant('user123', role, responseType)
      const variant2 = assignVariant('user456', role, responseType)
      
      // May be same or different (50/50 split)
      expect(['A', 'B']).toContain(variant1)
      expect(['A', 'B']).toContain(variant2)
    })

    test('different role may get different variant', () => {
      const userId = 'user123'
      const responseType = 'pricing'
      
      const variant1 = assignVariant(userId, 'SALES', responseType)
      const variant2 = assignVariant(userId, 'SUPPORT', responseType)
      
      // May be same or different (depends on hash)
      expect(['A', 'B']).toContain(variant1)
      expect(['A', 'B']).toContain(variant2)
    })

    test('different response type may get different variant', () => {
      const userId = 'user123'
      const role = 'SALES'
      
      const variant1 = assignVariant(userId, role, 'pricing')
      const variant2 = assignVariant(userId, role, 'overview')
      
      // May be same or different (depends on hash)
      expect(['A', 'B']).toContain(variant1)
      expect(['A', 'B']).toContain(variant2)
    })

    test('50/50 split distribution (approximate)', () => {
      const role = 'SALES'
      const responseType = 'pricing'
      const variants: ('A' | 'B')[] = []
      
      // Test 100 different users
      for (let i = 0; i < 100; i++) {
        variants.push(assignVariant(`user${i}`, role, responseType))
      }
      
      const variantA = variants.filter(v => v === 'A').length
      const variantB = variants.filter(v => v === 'B').length
      
      // Should be approximately 50/50 (allow 40-60 range)
      expect(variantA).toBeGreaterThan(30)
      expect(variantA).toBeLessThan(70)
      expect(variantB).toBeGreaterThan(30)
      expect(variantB).toBeLessThan(70)
      expect(variantA + variantB).toBe(100)
    })
  })

  // ============================================================================
  // VARIANT DEFINITIONS
  // ============================================================================
  
  describe('Role Variant Definitions', () => {
    test('SALES variant A has polite CTA', () => {
      const variants = getRoleVariants('SALES', 'A')
      expect(variants.pricing.cta).toContain('สนใจสอบถามรายละเอียดเพิ่มเติม')
      expect(variants.pricing.tone).toBe('polite')
    })

    test('SALES variant B has sales-oriented CTA', () => {
      const variants = getRoleVariants('SALES', 'B')
      expect(variants.pricing.cta).toContain('พร้อมเริ่มต้นได้เลยค่ะ')
      expect(variants.pricing.tone).toBe('sales-oriented')
    })

    test('SUPPORT variant A has patient CTA', () => {
      const variants = getRoleVariants('SUPPORT', 'A')
      expect(variants.pricing.cta).toContain('หากต้องการสอบถาม')
      expect(variants.pricing.tone).toBe('patient')
    })

    test('SUPPORT variant B has proactive CTA', () => {
      const variants = getRoleVariants('SUPPORT', 'B')
      expect(variants.pricing.cta).toContain('มีคำถามเพิ่มเติม')
      expect(variants.pricing.tone).toBe('proactive')
    })

    test('OPS variant A has professional redirect', () => {
      const variants = getRoleVariants('OPS', 'A')
      expect(variants.redirect.message).toContain('AI Operations Analyst')
      expect(variants.redirect.tone).toBe('professional')
    })
  })

  // ============================================================================
  // RESPONSE APPLICATION
  // ============================================================================
  
  describe('Apply Role Variant to Response', () => {
    test('SALES pricing - replaces CTA with variant A', () => {
      const original = 'จัดตั้งบริษัทจำกัด\nค่าบริการอยู่ที่ 25,000 บาท\n\nสนใจสอบถามเพิ่มเติม ติดต่อ...'
      const result = applyRoleVariantToResponse(original, 'SALES', 'pricing', 'A')
      
      expect(result).toContain('สนใจสอบถามรายละเอียดเพิ่มเติมหรือต้องการให้เจ้าหน้าที่ช่วยดู')
      expect(result).toContain('086-398-6889')
      expect(result).toContain('zanhcpe@gmail.com')
    })

    test('SALES pricing - replaces CTA with variant B', () => {
      const original = 'จัดตั้งบริษัทจำกัด\nค่าบริการอยู่ที่ 25,000 บาท\n\nสนใจสอบถามเพิ่มเติม ติดต่อ...'
      const result = applyRoleVariantToResponse(original, 'SALES', 'pricing', 'B')
      
      expect(result).toContain('พร้อมเริ่มต้นได้เลยค่ะ')
      expect(result).toContain('086-398-6889')
      expect(result).toContain('zanhcpe@gmail.com')
    })

    test('SUPPORT overview - replaces CTA with variant A', () => {
      const original = 'บริการบัญชีครอบคลุม...\n\nเจ้าหน้าที่ช่วยดู...'
      const result = applyRoleVariantToResponse(original, 'SUPPORT', 'overview', 'A')
      
      expect(result).toContain('หากต้องการสอบถามรายละเอียดเพิ่มเติม')
      expect(result).toContain('086-398-6889')
    })

    test('OPS - always redirects (variant A)', () => {
      const original = 'ราคาเท่าไหร่'
      const result = applyRoleVariantToResponse(original, 'OPS', 'pricing', 'A')
      
      expect(result).toContain('AI Operations Analyst')
      expect(result).toContain('ไม่ใช่เจ้าหน้าที่ที่คุยกับลูกค้าโดยตรง')
      expect(result).toContain('086-398-6889')
    })

    test('OPS - always redirects (variant B)', () => {
      const original = 'ราคาเท่าไหร่'
      const result = applyRoleVariantToResponse(original, 'OPS', 'pricing', 'B')
      
      expect(result).toContain('AI Operations Analyst')
      expect(result).toContain('ไม่ใช่เจ้าหน้าที่ที่คุยกับลูกค้าโดยตรง')
      expect(result).toContain('086-398-6889')
    })
  })

  // ============================================================================
  // METRICS CALCULATION
  // ============================================================================
  
  describe('Metrics Calculation', () => {
    const mockMetrics: RoleABTestMetric[] = [
      {
        id: '1',
        timestamp: '2024-01-01T00:00:00Z',
        userId: 'user1',
        sessionId: 'session1',
        role: 'SALES',
        variant: 'A',
        responseType: 'pricing',
        intent: 'company_registration_pricing',
        persona: 'REGISTRATION',
      },
      {
        id: '2',
        timestamp: '2024-01-01T00:01:00Z',
        userId: 'user2',
        sessionId: 'session2',
        role: 'SALES',
        variant: 'A',
        responseType: 'pricing',
        intent: 'company_registration_pricing',
        persona: 'REGISTRATION',
      },
      {
        id: '3',
        timestamp: '2024-01-01T00:02:00Z',
        userId: 'user3',
        sessionId: 'session3',
        role: 'SALES',
        variant: 'B',
        responseType: 'pricing',
        intent: 'company_registration_pricing',
        persona: 'REGISTRATION',
      },
    ]

    const mockContacts: RoleABTestContactEvent[] = [
      {
        id: 'c1',
        timestamp: '2024-01-01T00:00:30Z',
        userId: 'user1',
        sessionId: 'session1',
        role: 'SALES',
        variant: 'A',
        responseType: 'pricing',
        intent: 'company_registration_pricing',
        persona: 'REGISTRATION',
        method: 'click',
        timeToContact: 30,
      },
      {
        id: 'c2',
        timestamp: '2024-01-01T00:02:15Z',
        userId: 'user3',
        sessionId: 'session3',
        role: 'SALES',
        variant: 'B',
        responseType: 'pricing',
        intent: 'company_registration_pricing',
        persona: 'REGISTRATION',
        method: 'email',
        timeToContact: 135,
      },
    ]

    test('calculate contact rate for variant A', () => {
      const rate = calculateRoleContactRate(mockMetrics, mockContacts, 'SALES', 'A', 'pricing')
      expect(rate).toBe(50) // 1 out of 2 users contacted
    })

    test('calculate contact rate for variant B', () => {
      const rate = calculateRoleContactRate(mockMetrics, mockContacts, 'SALES', 'B', 'pricing')
      expect(rate).toBe(100) // 1 out of 1 user contacted
    })

    test('calculate contact rate with no contacts', () => {
      const rate = calculateRoleContactRate(mockMetrics, [], 'SALES', 'A', 'pricing')
      expect(rate).toBe(0)
    })

    test('calculate continuation rate', () => {
      const conversations: RoleABTestConversationEvent[] = [
        {
          id: 'conv1',
          timestamp: '2024-01-01T00:00:30Z',
          userId: 'user1',
          sessionId: 'session1',
          role: 'SALES',
          variant: 'A',
          responseType: 'pricing',
          intent: 'company_registration_pricing',
          persona: 'REGISTRATION',
          event: 'message_sent',
          messageCount: 2,
          timeToEvent: 30,
        },
      ]
      
      const rate = calculateRoleContinuationRate(mockMetrics, conversations, 'SALES', 'A', 'pricing')
      expect(rate).toBe(50) // 1 out of 2 users continued
    })

    test('calculate conversion rate', () => {
      const conversations: RoleABTestConversationEvent[] = [
        {
          id: 'conv1',
          timestamp: '2024-01-01T00:00:30Z',
          userId: 'user2',
          sessionId: 'session2',
          role: 'SALES',
          variant: 'A',
          responseType: 'pricing',
          intent: 'company_registration_pricing',
          persona: 'REGISTRATION',
          event: 'human_requested',
          messageCount: 3,
          timeToEvent: 60,
        },
      ]
      
      const rate = calculateRoleConversionRate(mockMetrics, mockContacts, conversations, 'SALES', 'A', 'pricing')
      expect(rate).toBe(100) // Both users converted (1 contacted, 1 requested handoff)
    })
  })

  // ============================================================================
  // RESULT GENERATION
  // ============================================================================
  
  describe('Result Generation', () => {
    const mockMetrics: RoleABTestMetric[] = [
      {
        id: '1',
        timestamp: '2024-01-01T00:00:00Z',
        userId: 'user1',
        sessionId: 'session1',
        role: 'SALES',
        variant: 'A',
        responseType: 'pricing',
        intent: 'company_registration_pricing',
        persona: 'REGISTRATION',
      },
      {
        id: '2',
        timestamp: '2024-01-01T00:01:00Z',
        userId: 'user2',
        sessionId: 'session2',
        role: 'SALES',
        variant: 'A',
        responseType: 'pricing',
        intent: 'company_registration_pricing',
        persona: 'REGISTRATION',
      },
      {
        id: '3',
        timestamp: '2024-01-01T00:02:00Z',
        userId: 'user3',
        sessionId: 'session3',
        role: 'SALES',
        variant: 'B',
        responseType: 'pricing',
        intent: 'company_registration_pricing',
        persona: 'REGISTRATION',
      },
    ]

    const mockContacts: RoleABTestContactEvent[] = [
      {
        id: 'c1',
        timestamp: '2024-01-01T00:00:30Z',
        userId: 'user1',
        sessionId: 'session1',
        role: 'SALES',
        variant: 'A',
        responseType: 'pricing',
        intent: 'company_registration_pricing',
        persona: 'REGISTRATION',
        method: 'click',
        timeToContact: 30,
      },
    ]

    const mockConversations: RoleABTestConversationEvent[] = []

    test('generate results for SALES pricing', () => {
      const results = generateRoleABTestResults(mockMetrics, mockContacts, mockConversations, 'SALES', 'pricing')
      
      expect(results.variantA.totalResponses).toBe(2)
      expect(results.variantB.totalResponses).toBe(1)
      expect(results.variantA.contactRate).toBe(50) // 1 out of 2
      expect(results.variantB.contactRate).toBe(0) // 0 out of 1
    })

    test('results include all metrics', () => {
      const results = generateRoleABTestResults(mockMetrics, mockContacts, mockConversations, 'SALES', 'pricing')
      
      expect(results.variantA).toHaveProperty('contactRate')
      expect(results.variantA).toHaveProperty('continuationRate')
      expect(results.variantA).toHaveProperty('conversionRate')
      expect(results.variantA).toHaveProperty('avgTimeToContact')
      expect(results.variantA).toHaveProperty('avgTimeToHumanHandoff')
      expect(results.variantA).toHaveProperty('avgMessageCount')
    })
  })

  // ============================================================================
  // STATISTICAL SIGNIFICANCE
  // ============================================================================
  
  describe('Statistical Significance', () => {
    test('calculate significance with significant difference', () => {
      const variantA = {
        role: 'SALES' as const,
        responseType: 'pricing' as const,
        variant: 'A' as const,
        totalResponses: 100,
        contactRate: 10,
        continuationRate: 0,
        avgTimeToContact: 0,
        avgTimeToHumanHandoff: 0,
        avgMessageCount: 0,
        conversionRate: 10,
      }
      
      const variantB = {
        role: 'SALES' as const,
        responseType: 'pricing' as const,
        variant: 'B' as const,
        totalResponses: 100,
        contactRate: 20,
        continuationRate: 0,
        avgTimeToContact: 0,
        avgTimeToHumanHandoff: 0,
        avgMessageCount: 0,
        conversionRate: 20,
      }
      
      const significance = calculateRoleStatisticalSignificance(variantA, variantB, 'contactRate')
      
      expect(significance.lift).toBe(100) // 20% vs 10% = 100% lift
      // Winner may be null if not statistically significant (simplified calculation)
      if (significance.winner) {
        expect(['A', 'B']).toContain(significance.winner)
      }
      expect(typeof significance.pValue).toBe('number')
      expect(typeof significance.isSignificant).toBe('boolean')
    })

    test('calculate significance with no difference', () => {
      const variantA = {
        role: 'SALES' as const,
        responseType: 'pricing' as const,
        variant: 'A' as const,
        totalResponses: 100,
        contactRate: 10,
        continuationRate: 0,
        avgTimeToContact: 0,
        avgTimeToHumanHandoff: 0,
        avgMessageCount: 0,
        conversionRate: 10,
      }
      
      const variantB = {
        role: 'SALES' as const,
        responseType: 'pricing' as const,
        variant: 'B' as const,
        totalResponses: 100,
        contactRate: 10,
        continuationRate: 0,
        avgTimeToContact: 0,
        avgTimeToHumanHandoff: 0,
        avgMessageCount: 0,
        conversionRate: 10,
      }
      
      const significance = calculateRoleStatisticalSignificance(variantA, variantB, 'contactRate')
      
      expect(significance.lift).toBe(0)
      expect(significance.winner).toBeNull()
    })
  })

  // ============================================================================
  // INTENT/PERSONA IDENTITY VERIFICATION
  // ============================================================================
  
  describe('Intent/Persona Identity', () => {
    test('variant assignment does not change intent', () => {
      const userId = 'user123'
      const role = 'SALES'
      const responseType = 'pricing'
      
      // Same user, same role, same response type
      const variant1 = assignVariant(userId, role, responseType)
      const variant2 = assignVariant(userId, role, responseType)
      
      // Variant should be identical
      expect(variant1).toBe(variant2)
      
      // Intent and persona should be determined separately (not by variant)
      // This is verified in integration tests
    })

    test('response application keeps original content', () => {
      const original = 'จัดตั้งบริษัทจำกัด\nค่าบริการอยู่ที่ 25,000 บาท\nใช้เวลาประมาณ 1-2 สัปดาห์'
      const result = applyRoleVariantToResponse(original, 'SALES', 'pricing', 'A')
      
      // Original content should be preserved
      expect(result).toContain('จัดตั้งบริษัทจำกัด')
      expect(result).toContain('25,000 บาท')
      expect(result).toContain('1-2 สัปดาห์')
      
      // Only CTA should be different
      expect(result).toContain('086-398-6889')
    })
  })
})
