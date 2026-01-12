/**
 * Handoff Detection Tests
 */

import { shouldHandoff, userAsksContact, getHandoffResponse, type HandoffDecision } from './handoff'

describe('Handoff Detection', () => {
  describe('userAsksContact', () => {
    it('should detect when user asks to speak with someone', () => {
      expect(userAsksContact('อยากพูดกับเจ้าหน้าที่')).toBe(true)
      expect(userAsksContact('มีคนให้คุยไหม')).toBe(true)
      expect(userAsksContact('ขอติดต่อพนักงาน')).toBe(true)
      expect(userAsksContact('ต้องการ human agent')).toBe(true)
    })

    it('should not detect contact request in normal messages', () => {
      expect(userAsksContact('ราคาเท่าไหร่')).toBe(false)
      expect(userAsksContact('จดทะเบียนบริษัท')).toBe(false)
      expect(userAsksContact('สวัสดี')).toBe(false)
    })
  })

  describe('shouldHandoff', () => {
    it('should handoff for restricted_legal intent', () => {
      const decision = shouldHandoff({
        intent: 'restricted_legal',
        confidence: 0.9,
        userMessageCount: 1,
        userMessage: 'ขั้นตอนการจดทะเบียน',
      })

      expect(decision.shouldHandoff).toBe(true)
      expect(decision.reason).toBe('legal_inquiry')
    })

    it('should handoff for low confidence', () => {
      const decision = shouldHandoff({
        intent: 'unknown',
        confidence: 0.5, // < 0.6
        userMessageCount: 1,
        userMessage: 'คำถามที่ไม่ชัดเจน',
      })

      expect(decision.shouldHandoff).toBe(true)
      expect(decision.reason).toBe('low_confidence')
    })

    it('should handoff for long conversation (>= 4 messages)', () => {
      const decision = shouldHandoff({
        intent: 'company_registration_pricing',
        confidence: 0.9,
        userMessageCount: 4, // >= 4
        userMessage: 'คำถามที่ 4',
      })

      expect(decision.shouldHandoff).toBe(true)
      expect(decision.reason).toBe('long_conversation')
    })

    it('should handoff when user asks to contact', () => {
      const decision = shouldHandoff({
        intent: 'company_overview',
        confidence: 0.9,
        userMessageCount: 1,
        userMessage: 'อยากพูดกับเจ้าหน้าที่',
      })

      expect(decision.shouldHandoff).toBe(true)
      expect(decision.reason).toBe('user_requested')
    })

    it('should not handoff for normal conversation', () => {
      const decision = shouldHandoff({
        intent: 'company_registration_pricing',
        confidence: 0.9,
        userMessageCount: 2,
        userMessage: 'ราคาเท่าไหร่',
      })

      expect(decision.shouldHandoff).toBe(false)
      expect(decision.reason).toBe('none')
    })

    it('should prioritize user_requested over other conditions', () => {
      const decision = shouldHandoff({
        intent: 'company_registration_pricing',
        confidence: 0.9,
        userMessageCount: 4, // Would trigger long_conversation
        userMessage: 'อยากพูดกับเจ้าหน้าที่', // But user_requested takes priority
      })

      expect(decision.shouldHandoff).toBe(true)
      expect(decision.reason).toBe('user_requested')
    })
  })

  describe('getHandoffResponse', () => {
    it('should return appropriate response for user_requested', () => {
      const response = getHandoffResponse('user_requested')
      expect(response).toContain('086-398-6889')
      expect(response).toContain('zanhcpe@gmail.com')
      expect(response).toContain('เจ้าหน้าที่')
    })

    it('should return appropriate response for legal_inquiry', () => {
      const response = getHandoffResponse('legal_inquiry')
      expect(response).toContain('รายละเอียดเชิงลึก')
      expect(response).toContain('086-398-6889')
    })

    it('should return appropriate response for low_confidence', () => {
      const response = getHandoffResponse('low_confidence')
      expect(response).toContain('ไม่แน่ใจ')
      expect(response).toContain('086-398-6889')
    })

    it('should return appropriate response for long_conversation', () => {
      const response = getHandoffResponse('long_conversation')
      expect(response).toContain('คำถามหลายข้อ')
      expect(response).toContain('086-398-6889')
    })
  })
})
