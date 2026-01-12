/**
 * Chat Log Schema Validation Tests
 */

import { validateChatLog, createChatLogEntry, type ChatLogSchema } from './chat-log-schema'

describe('Chat Log Schema Validation', () => {
  describe('validateChatLog', () => {
    it('should validate a complete valid log entry', () => {
      const log: ChatLogSchema = {
        id: 'chat-001',
        timestamp: '2024-01-15T10:00:00.000Z',
        sessionId: 'session-123',
        intent: {
          detected: 'company_registration_pricing',
        },
        persona: {
          detected: 'REGISTRATION',
          source: 'detected',
        },
        responseType: 'pricing',
        userMessage: 'จดทะเบียนบจก ราคาเท่าไหร่',
        aiResponse: 'ราคา 25,000 บาท',
        knowledgeSources: ['services.md'],
        pricing: {
          questionType: 'explicit',
          containsPrice: true,
        },
        safety: {
          violations: ['none'],
          violationCount: 0,
          hasContactInfo: true,
          responseLength: 50,
        },
        handoff: {
          status: 'none',
          reason: 'none',
        },
        abTesting: {
          variant: 'A',
          responseType: 'pricing',
        },
        userActions: {
          contactMethod: 'none',
          messageCount: 1,
          conversationEnded: false,
        },
        performance: {
          responseTimeMs: 1000,
          model: 'mistral',
        },
        quality: {
          intentCorrect: true,
          personaCorrect: true,
        },
      }
      
      const result = validateChatLog(log)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
    
    it('should reject log with missing required fields', () => {
      const log = {
        id: 'chat-001',
        // Missing timestamp, sessionId, etc.
      }
      
      const result = validateChatLog(log)
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })
    
    it('should reject invalid intent', () => {
      const log = {
        id: 'chat-001',
        timestamp: '2024-01-15T10:00:00.000Z',
        sessionId: 'session-123',
        intent: {
          detected: 'invalid_intent', // Invalid
        },
        persona: {
          detected: 'REGISTRATION',
          source: 'detected',
        },
        responseType: 'pricing',
        userMessage: 'test',
        aiResponse: 'test',
        knowledgeSources: ['services.md'],
        pricing: {
          questionType: 'explicit',
          containsPrice: true,
        },
        safety: {
          violations: ['none'],
          violationCount: 0,
          hasContactInfo: true,
          responseLength: 50,
        },
        handoff: {
          status: 'none',
          reason: 'none',
        },
        abTesting: {
          variant: 'A',
          responseType: 'pricing',
        },
        userActions: {
          contactMethod: 'none',
          messageCount: 1,
          conversationEnded: false,
        },
        performance: {
          responseTimeMs: 1000,
          model: 'mistral',
        },
      }
      
      const result = validateChatLog(log)
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.field === 'intent.detected')).toBe(true)
    })
    
    it('should reject invalid persona', () => {
      const log = {
        id: 'chat-001',
        timestamp: '2024-01-15T10:00:00.000Z',
        sessionId: 'session-123',
        intent: {
          detected: 'company_registration_pricing',
        },
        persona: {
          detected: 'INVALID', // Invalid
          source: 'detected',
        },
        responseType: 'pricing',
        userMessage: 'test',
        aiResponse: 'test',
        knowledgeSources: ['services.md'],
        pricing: {
          questionType: 'explicit',
          containsPrice: true,
        },
        safety: {
          violations: ['none'],
          violationCount: 0,
          hasContactInfo: true,
          responseLength: 50,
        },
        handoff: {
          status: 'none',
          reason: 'none',
        },
        abTesting: {
          variant: 'A',
          responseType: 'pricing',
        },
        userActions: {
          contactMethod: 'none',
          messageCount: 1,
          conversationEnded: false,
        },
        performance: {
          responseTimeMs: 1000,
          model: 'mistral',
        },
      }
      
      const result = validateChatLog(log)
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.field === 'persona.detected')).toBe(true)
    })
    
    it('should reject invalid timestamp format', () => {
      const log = {
        id: 'chat-001',
        timestamp: 'invalid-date', // Invalid
        sessionId: 'session-123',
        intent: {
          detected: 'company_registration_pricing',
        },
        persona: {
          detected: 'REGISTRATION',
          source: 'detected',
        },
        responseType: 'pricing',
        userMessage: 'test',
        aiResponse: 'test',
        knowledgeSources: ['services.md'],
        pricing: {
          questionType: 'explicit',
          containsPrice: true,
        },
        safety: {
          violations: ['none'],
          violationCount: 0,
          hasContactInfo: true,
          responseLength: 50,
        },
        handoff: {
          status: 'none',
          reason: 'none',
        },
        abTesting: {
          variant: 'A',
          responseType: 'pricing',
        },
        userActions: {
          contactMethod: 'none',
          messageCount: 1,
          conversationEnded: false,
        },
        performance: {
          responseTimeMs: 1000,
          model: 'mistral',
        },
      }
      
      const result = validateChatLog(log)
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.field === 'timestamp')).toBe(true)
    })
    
    it('should reject invalid safety violations', () => {
      const log = {
        id: 'chat-001',
        timestamp: '2024-01-15T10:00:00.000Z',
        sessionId: 'session-123',
        intent: {
          detected: 'company_registration_pricing',
        },
        persona: {
          detected: 'REGISTRATION',
          source: 'detected',
        },
        responseType: 'pricing',
        userMessage: 'test',
        aiResponse: 'test',
        knowledgeSources: ['services.md'],
        pricing: {
          questionType: 'explicit',
          containsPrice: true,
        },
        safety: {
          violations: ['invalid_violation'], // Invalid
          violationCount: 1,
          hasContactInfo: true,
          responseLength: 50,
        },
        handoff: {
          status: 'none',
          reason: 'none',
        },
        abTesting: {
          variant: 'A',
          responseType: 'pricing',
        },
        userActions: {
          contactMethod: 'none',
          messageCount: 1,
          conversationEnded: false,
        },
        performance: {
          responseTimeMs: 1000,
          model: 'mistral',
        },
      }
      
      const result = validateChatLog(log)
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.field === 'safety.violations')).toBe(true)
    })
  })
  
  describe('createChatLogEntry', () => {
    it('should create a valid chat log entry', () => {
      const log = createChatLogEntry({
        id: 'chat-001',
        timestamp: new Date('2024-01-15T10:00:00.000Z'),
        sessionId: 'session-123',
        userId: 'user-456',
        userMessage: 'จดทะเบียนบจก ราคาเท่าไหร่',
        aiResponse: 'ราคา 25,000 บาท',
        detectedIntent: 'company_registration_pricing',
        detectedPersona: 'REGISTRATION',
        personaSource: 'detected',
        responseType: 'pricing',
        knowledgeSources: ['services.md'],
        isPricingQuestion: true,
        containsPrice: true,
        priceValue: '25,000 บาท',
        violations: [],
        hasContactInfo: true,
        handoffStatus: 'none',
        handoffReason: 'none',
        abVariant: 'A',
        abResponseType: 'pricing',
        contactMethod: 'none',
        messageCount: 1,
        conversationEnded: false,
        responseTimeMs: 1000,
        model: 'mistral',
        expectedIntent: 'company_registration_pricing',
        expectedPersona: 'REGISTRATION',
      })
      
      expect(log.id).toBe('chat-001')
      expect(log.intent.detected).toBe('company_registration_pricing')
      expect(log.persona.detected).toBe('REGISTRATION')
      expect(log.pricing.containsPrice).toBe(true)
      expect(log.quality.intentCorrect).toBe(true)
      expect(log.quality.personaCorrect).toBe(true)
      
      const validation = validateChatLog(log)
      expect(validation.valid).toBe(true)
    })
  })
})
