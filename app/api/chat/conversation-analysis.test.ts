/**
 * Conversation Analysis Tests
 */

import {
  analyzeConversation,
  analyzeConversations,
  type ConversationMetrics,
} from './conversation-analysis'

describe('Conversation Analysis', () => {
  const mockChatLogs = [
    {
      id: 'chat-1',
      sessionId: 'session-123',
      timestamp: '2024-01-15T10:00:00.000Z',
      userMessage: 'สวัสดีครับ สนใจจดทะเบียนบริษัท',
      aiResponse: 'สวัสดีค่ะ! ยินดีต้อนรับสู่บริษัท แสน โซลูชั่น จำกัด',
      intent: { detected: 'greeting' as const },
      persona: { detected: 'REGISTRATION' as const },
      responseType: 'greeting' as const,
      pricing: {
        questionType: 'none',
        containsPrice: false,
      },
      performance: {
        responseTimeMs: 1500,
      },
    },
    {
      id: 'chat-2',
      sessionId: 'session-123',
      timestamp: '2024-01-15T10:01:00.000Z',
      userMessage: 'ราคาเท่าไหร่ครับ',
      aiResponse: 'ราคาเริ่มต้นที่ 25,000 บาท (ครั้งเดียว) ใช้เวลาประมาณ 7-14 วันทำการค่ะ',
      intent: { detected: 'company_registration_pricing' as const },
      persona: { detected: 'REGISTRATION' as const },
      responseType: 'pricing' as const,
      pricing: {
        questionType: 'explicit',
        containsPrice: true,
      },
      performance: {
        responseTimeMs: 1200,
      },
    },
    {
      id: 'chat-3',
      sessionId: 'session-123',
      timestamp: '2024-01-15T10:02:00.000Z',
      userMessage: 'ใช้เอกสารอะไรบ้าง',
      aiResponse: 'ต้องใช้เอกสารดังนี้: 1. สำเนาบัตรประชาชน 2. สำเนาทะเบียนบ้าน...',
      intent: { detected: 'company_registration_overview' as const },
      persona: { detected: 'REGISTRATION' as const },
      responseType: 'overview' as const,
      pricing: {
        questionType: 'none',
        containsPrice: false,
      },
      performance: {
        responseTimeMs: 1100,
      },
    },
  ]

  describe('analyzeConversation', () => {
    it('should analyze conversation metrics', () => {
      const metrics = analyzeConversation(mockChatLogs)

      expect(metrics.sessionId).toBe('session-123')
      expect(metrics.totalTurns).toBe(3)
      expect(metrics.totalMessages).toBe(3)
      expect(metrics.primaryPersona).toBe('REGISTRATION')
      expect(metrics.primaryIntent).toBe('greeting')
      expect(metrics.hasPricingQuestion).toBe(true)
      expect(metrics.pricingTurn).toBe(2)
      expect(metrics.hasOverviewQuestion).toBe(true)
      expect(metrics.overviewTurn).toBe(3)
    })

    it('should detect drop-off point', () => {
      const metrics = analyzeConversation(mockChatLogs)

      // Since no contact or handoff, should be dropped_off or ongoing
      expect(['dropped_off', 'ongoing']).toContain(metrics.outcome)
    })

    it('should detect conversion', () => {
      const logsWithContact = [
        ...mockChatLogs,
        {
          id: 'chat-4',
          sessionId: 'session-123',
          timestamp: '2024-01-15T10:03:00.000Z',
          userMessage: 'ขอบคุณครับ',
          aiResponse: 'ยินดีค่ะ',
          intent: { detected: 'greeting' as const },
          persona: { detected: 'REGISTRATION' as const },
          responseType: 'greeting' as const,
          userActions: {
            contactMethod: 'phone',
            contactedAt: '2024-01-15T10:03:30.000Z',
          },
        },
      ]

      const metrics = analyzeConversation(logsWithContact)

      expect(metrics.outcome).toBe('converted')
      expect(metrics.turnsToConversion).toBe(4)
    })

    it('should detect handoff', () => {
      const logsWithHandoff = [
        ...mockChatLogs,
        {
          id: 'chat-4',
          sessionId: 'session-123',
          timestamp: '2024-01-15T10:03:00.000Z',
          userMessage: 'อยากคุยกับเจ้าหน้าที่',
          aiResponse: 'ยินดีค่ะ! เจ้าหน้าที่พร้อมให้คำปรึกษาค่ะ',
          intent: { detected: 'greeting' as const },
          persona: { detected: 'REGISTRATION' as const },
          responseType: 'greeting' as const,
          handoff: {
            reason: 'user_requested' as const,
            requestedAt: '2024-01-15T10:03:00.000Z',
          },
        },
      ]

      const metrics = analyzeConversation(logsWithHandoff)

      expect(metrics.outcome).toBe('handoff')
      expect(metrics.turnsToHandoff).toBe(4)
      expect(metrics.handoffRequested).toBe(true)
    })

    it('should detect CTA', () => {
      const logsWithCTA = [
        ...mockChatLogs,
        {
          id: 'chat-4',
          sessionId: 'session-123',
          timestamp: '2024-01-15T10:03:00.000Z',
          userMessage: 'ขอบคุณครับ',
          aiResponse: 'สนใจสอบถามเพิ่มเติม ติดต่อ 086-398-6889 หรือ zanhcpe@gmail.com นะคะ 😊',
          intent: { detected: 'greeting' as const },
          persona: { detected: 'REGISTRATION' as const },
          responseType: 'greeting' as const,
          abTesting: {
            variant: 'A' as const,
          },
        },
      ]

      const metrics = analyzeConversation(logsWithCTA)

      expect(metrics.ctaShown).toBe(true)
      expect(metrics.ctaTurn).toBe(4)
      expect(metrics.ctaVariant).toBe('A')
    })

    it('should generate optimization flags', () => {
      const metrics = analyzeConversation(mockChatLogs)

      expect(metrics.optimizationFlags).toBeDefined()
      expect(Array.isArray(metrics.optimizationFlags)).toBe(true)
    })

    it('should throw error for empty conversation', () => {
      expect(() => analyzeConversation([])).toThrow()
    })
  })

  describe('analyzeConversations', () => {
    it('should analyze multiple conversations', () => {
      const conversations: ConversationMetrics[] = [
        analyzeConversation(mockChatLogs),
        analyzeConversation([
          {
            id: 'chat-5',
            sessionId: 'session-456',
            timestamp: '2024-01-16T10:00:00.000Z',
            userMessage: 'สวัสดี',
            aiResponse: 'สวัสดีค่ะ',
            intent: { detected: 'greeting' as const },
            persona: { detected: 'ACCOUNTING' as const },
            responseType: 'greeting' as const,
            pricing: {
              questionType: 'none',
              containsPrice: false,
            },
          },
        ]),
      ]

      const analysis = analyzeConversations(conversations)

      expect(analysis.totalConversations).toBe(2)
      expect(analysis.conversionRate).toBeGreaterThanOrEqual(0)
      expect(analysis.dropOffRate).toBeGreaterThanOrEqual(0)
      expect(analysis.recommendations).toBeDefined()
      expect(analysis.abTestCandidates).toBeDefined()
    })

    it('should calculate drop-off points', () => {
      const conversations: ConversationMetrics[] = [
        analyzeConversation(mockChatLogs),
      ]

      const analysis = analyzeConversations(conversations)

      expect(analysis.dropOffPoints).toBeDefined()
      expect(analysis.dropOffPoints.after_greeting).toBeDefined()
      expect(analysis.dropOffPoints.after_pricing).toBeDefined()
    })

    it('should generate recommendations', () => {
      const conversations: ConversationMetrics[] = [
        analyzeConversation(mockChatLogs),
      ]

      const analysis = analyzeConversations(conversations)

      expect(analysis.recommendations).toBeDefined()
      expect(Array.isArray(analysis.recommendations)).toBe(true)
    })

    it('should extract A/B test candidates', () => {
      const conversations: ConversationMetrics[] = [
        analyzeConversation(mockChatLogs),
      ]

      const analysis = analyzeConversations(conversations)

      expect(analysis.abTestCandidates).toBeDefined()
      expect(Array.isArray(analysis.abTestCandidates)).toBe(true)
    })
  })
})
