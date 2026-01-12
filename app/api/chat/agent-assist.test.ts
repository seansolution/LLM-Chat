/**
 * Agent Assist Tests
 */

import {
  generateConversationSummary,
  formatAgentAssistOutput,
  type ConversationSummary,
} from './agent-assist'

describe('Agent Assist', () => {
  const mockChatLogs = [
    {
      id: 'chat-1',
      sessionId: 'session-123',
      timestamp: '2024-01-15T10:00:00.000Z',
      userMessage: 'สวัสดีครับ สนใจจดทะเบียนบริษัท ราคาเท่าไหร่ครับ',
      aiResponse: 'สวัสดีค่ะ! สำหรับการจดทะเบียนบริษัท ราคาเริ่มต้นที่ 25,000 บาท (ครั้งเดียว) ใช้เวลาประมาณ 7-14 วันทำการค่ะ',
      intent: { detected: 'company_registration_pricing' as const },
      persona: { detected: 'REGISTRATION' as const },
      responseType: 'pricing',
      pricing: {
        questionType: 'explicit',
        containsPrice: true,
        priceValue: '25,000 บาท',
      },
      handoff: {
        reason: 'user_requested' as const,
        requestedAt: '2024-01-15T10:05:00.000Z',
      },
      metadata: {
        userEmail: 'customer@example.com',
        userPhone: '081-234-5678',
      },
    },
    {
      id: 'chat-2',
      sessionId: 'session-123',
      timestamp: '2024-01-15T10:01:00.000Z',
      userMessage: 'ใช้เอกสารอะไรบ้างครับ',
      aiResponse: 'ต้องใช้เอกสารดังนี้: 1. สำเนาบัตรประชาชน 2. สำเนาทะเบียนบ้าน 3. หนังสือยินยอม 4. ชื่อบริษัทที่ต้องการจดทะเบียนค่ะ',
      intent: { detected: 'company_registration_overview' as const },
      persona: { detected: 'REGISTRATION' as const },
      responseType: 'overview',
      pricing: {
        questionType: 'none',
        containsPrice: false,
      },
    },
    {
      id: 'chat-3',
      sessionId: 'session-123',
      timestamp: '2024-01-15T10:02:00.000Z',
      userMessage: 'อยากคุยกับเจ้าหน้าที่หน่อยครับ',
      aiResponse: 'ยินดีค่ะ! เจ้าหน้าที่พร้อมให้คำปรึกษาค่ะ ติดต่อได้ที่ 086-398-6889 หรือ zanhcpe@gmail.com',
      intent: { detected: 'company_registration_pricing' as const },
      persona: { detected: 'REGISTRATION' as const },
      responseType: 'pricing',
      handoff: {
        reason: 'user_requested' as const,
        requestedAt: '2024-01-15T10:02:00.000Z',
      },
    },
  ]

  describe('generateConversationSummary', () => {
    it('should generate summary from chat logs', () => {
      const summary = generateConversationSummary(mockChatLogs)

      expect(summary).toBeDefined()
      expect(summary.summary).toBeTruthy()
      expect(summary.summary.length).toBeGreaterThan(0)
      expect(summary.persona).toBe('REGISTRATION')
      expect(summary.primaryIntent).toBe('company_registration_pricing')
      expect(summary.messageCount).toBe(3)
      expect(summary.customerEmail).toBe('customer@example.com')
      expect(summary.customerPhone).toBe('081-234-5678')
    })

    it('should detect buying intent correctly', () => {
      const summary = generateConversationSummary(mockChatLogs)
      
      // Should detect information_seeking or ready_to_buy based on content
      expect(['ready_to_buy', 'information_seeking', 'price_comparison']).toContain(summary.buyingIntent)
    })

    it('should identify what is already answered', () => {
      const summary = generateConversationSummary(mockChatLogs)

      expect(summary.alreadyAnswered.pricing).toBe(true)
      expect(summary.alreadyAnswered.timeline).toBe(true)
      expect(summary.alreadyAnswered.requirements).toBe(true)
      expect(summary.alreadyAnswered.contactInfo).toBe(true)
    })

    it('should extract key points', () => {
      const summary = generateConversationSummary(mockChatLogs)

      expect(summary.keyPoints.length).toBeGreaterThan(0)
      expect(summary.keyPoints.length).toBeLessThanOrEqual(5)
    })

    it('should extract prices mentioned', () => {
      const summary = generateConversationSummary(mockChatLogs)

      expect(summary.pricesMentioned.length).toBeGreaterThan(0)
      expect(summary.pricesMentioned[0]).toContain('25,000')
    })

    it('should generate suggested action', () => {
      const summary = generateConversationSummary(mockChatLogs)

      expect(summary.suggestedAction).toBeDefined()
      expect(summary.suggestedAction.type).toBeDefined()
      expect(summary.suggestedAction.priority).toBeDefined()
      expect(summary.suggestedAction.reason).toBeTruthy()
    })

    it('should generate suggested script', () => {
      const summary = generateConversationSummary(mockChatLogs)

      expect(summary.suggestedScript).toBeDefined()
      expect(summary.suggestedScript.length).toBeGreaterThan(0)
    })

    it('should throw error for empty conversation', () => {
      expect(() => generateConversationSummary([])).toThrow()
    })
  })

  describe('formatAgentAssistOutput', () => {
    it('should format output for agent display', () => {
      const summary = generateConversationSummary(mockChatLogs)
      const output = formatAgentAssistOutput(summary, mockChatLogs)

      expect(output.handoffId).toBeDefined()
      expect(output.priority).toBeDefined()
      expect(output.quickSummary).toBeDefined()
      expect(output.actionCard).toBeDefined()
      expect(output.conversationHistory.length).toBe(3)
    })

    it('should include do not ask list', () => {
      const summary = generateConversationSummary(mockChatLogs)
      const output = formatAgentAssistOutput(summary, mockChatLogs)

      expect(output.actionCard.doNotAsk.length).toBeGreaterThan(0)
      expect(output.actionCard.doNotAsk.some(item => item.includes('ราคา'))).toBe(true)
    })

    it('should include suggested script', () => {
      const summary = generateConversationSummary(mockChatLogs)
      const output = formatAgentAssistOutput(summary, mockChatLogs)

      expect(output.actionCard.suggestedScript).toBeTruthy()
      expect(output.actionCard.suggestedScript.length).toBeGreaterThan(0)
    })
  })
})
