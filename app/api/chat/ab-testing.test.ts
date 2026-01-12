/**
 * A/B Testing Tests
 */

import {
  assignVariant,
  getVariantCTA,
  applyVariantToResponse,
  calculateContactRate,
  calculateContinuationRate,
  generateABTestResults,
  type ABTestMetrics,
  type ContactEvent,
  type ConversationEvent,
} from './ab-testing'
import type { Persona } from './intent'

describe('A/B Testing', () => {
  describe('Variant Assignment', () => {
    it('should assign variant deterministically', () => {
      const userId = 'user-123'
      const responseType = 'pricing'
      
      // Same user + response type should always get same variant
      const variant1 = assignVariant(userId, responseType)
      const variant2 = assignVariant(userId, responseType)
      
      expect(variant1).toBe(variant2)
    })
    
    it('should assign different variants for different users', () => {
      const user1 = 'user-123'
      const user2 = 'user-456'
      const responseType = 'pricing'
      
      const variant1 = assignVariant(user1, responseType)
      const variant2 = assignVariant(user2, responseType)
      
      // May be same or different (50/50 split)
      expect(['A', 'B']).toContain(variant1)
      expect(['A', 'B']).toContain(variant2)
    })
    
    it('should assign different variants for different response types', () => {
      const userId = 'user-123'
      
      const variant1 = assignVariant(userId, 'pricing')
      const variant2 = assignVariant(userId, 'overview')
      
      // May be same or different
      expect(['A', 'B']).toContain(variant1)
      expect(['A', 'B']).toContain(variant2)
    })
  })
  
  describe('CTA Generation', () => {
    it('should return variant A CTA for pricing', () => {
      const cta = getVariantCTA('pricing', 'A')
      expect(cta).toContain('สนใจสอบถามเพิ่มเติม')
      expect(cta).toContain('086-398-6889')
    })
    
    it('should return variant B CTA for pricing', () => {
      const cta = getVariantCTA('pricing', 'B')
      expect(cta).toContain('พร้อมเริ่มต้นได้เลย')
      expect(cta).toContain('086-398-6889')
    })
    
    it('should return variant A CTA for overview', () => {
      const cta = getVariantCTA('overview', 'A')
      expect(cta).toContain('เจ้าหน้าที่ช่วยดู')
    })
    
    it('should return variant B CTA for overview', () => {
      const cta = getVariantCTA('overview', 'B')
      expect(cta).toContain('ต้องการคำแนะนำเฉพาะเจาะจง')
    })
  })
  
  describe('Response Application', () => {
    it('should apply variant A to pricing response', () => {
      const original = 'บริการจดทะเบียน\nราคา 25,000 บาท'
      const variant = 'A'
      const userId = 'user-123'
      
      const result = applyVariantToResponse(original, 'pricing', variant, userId)
      
      expect(result).toContain('บริการจดทะเบียน')
      expect(result).toContain('ราคา 25,000 บาท')
      expect(result).toContain('สนใจสอบถามเพิ่มเติม')
    })
    
    it('should apply variant B to pricing response', () => {
      const original = 'บริการจดทะเบียน\nราคา 25,000 บาท'
      const variant = 'B'
      const userId = 'user-123'
      
      const result = applyVariantToResponse(original, 'pricing', variant, userId)
      
      expect(result).toContain('บริการจดทะเบียน')
      expect(result).toContain('ราคา 25,000 บาท')
      expect(result).toContain('พร้อมเริ่มต้นได้เลย')
    })
  })
  
  describe('Metrics Calculation', () => {
    const mockMetrics: ABTestMetrics[] = [
      {
        variant: 'A',
        responseType: 'pricing',
        userId: 'user-1',
        timestamp: new Date('2024-01-01T10:00:00Z'),
        intent: 'company_registration_pricing',
        persona: 'REGISTRATION',
      },
      {
        variant: 'A',
        responseType: 'pricing',
        userId: 'user-2',
        timestamp: new Date('2024-01-01T10:05:00Z'),
        intent: 'company_registration_pricing',
        persona: 'REGISTRATION',
      },
      {
        variant: 'B',
        responseType: 'pricing',
        userId: 'user-3',
        timestamp: new Date('2024-01-01T10:10:00Z'),
        intent: 'company_registration_pricing',
        persona: 'REGISTRATION',
      },
    ]
    
    const mockContacts: ContactEvent[] = [
      {
        userId: 'user-1',
        variant: 'A',
        responseType: 'pricing',
        timestamp: new Date('2024-01-01T10:01:00Z'),
        method: 'phone',
      },
      {
        userId: 'user-3',
        variant: 'B',
        responseType: 'pricing',
        timestamp: new Date('2024-01-01T10:11:00Z'),
        method: 'email',
      },
    ]
    
    const mockConversations: ConversationEvent[] = [
      {
        userId: 'user-1',
        variant: 'A',
        responseType: 'pricing',
        timestamp: new Date('2024-01-01T10:02:00Z'),
        event: 'message_sent',
        messageCount: 2,
      },
      {
        userId: 'user-2',
        variant: 'A',
        responseType: 'pricing',
        timestamp: new Date('2024-01-01T10:06:00Z'),
        event: 'message_sent',
        messageCount: 3,
      },
    ]
    
    it('should calculate contact rate correctly', () => {
      const rateA = calculateContactRate(mockMetrics, mockContacts, 'A', 'pricing')
      const rateB = calculateContactRate(mockMetrics, mockContacts, 'B', 'pricing')
      
      expect(rateA).toBe(50) // 1 out of 2 users contacted
      expect(rateB).toBe(100) // 1 out of 1 user contacted
    })
    
    it('should calculate continuation rate correctly', () => {
      const rateA = calculateContinuationRate(mockMetrics, mockConversations, 'A', 'pricing')
      const rateB = calculateContinuationRate(mockMetrics, mockConversations, 'B', 'pricing')
      
      expect(rateA).toBe(100) // 2 out of 2 users continued
      expect(rateB).toBe(0) // 0 out of 1 user continued
    })
    
    it('should generate comprehensive results', () => {
      const results = generateABTestResults(mockMetrics, mockContacts, mockConversations, 'pricing')
      
      expect(results.variantA.totalResponses).toBe(2)
      expect(results.variantB.totalResponses).toBe(1)
      expect(results.variantA.contactRate).toBe(50)
      expect(results.variantB.contactRate).toBe(100)
    })
  })
})
