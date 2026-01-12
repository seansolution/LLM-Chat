/**
 * Smart Handoff Detection
 * 
 * Determines when to hand off conversation to human support
 */

import type { IntentResult } from './intent'

export type HandoffReason =
  | 'user_requested'
  | 'complex_question'
  | 'legal_inquiry'
  | 'technical_issue'
  | 'pricing_negotiation'
  | 'low_confidence'
  | 'long_conversation'
  | 'none'

export interface HandoffDecision {
  shouldHandoff: boolean
  reason: HandoffReason
  confidence?: number
}

/**
 * Detect if user is asking to contact/speak with a human
 */
export function userAsksContact(message: string): boolean {
  const contactPatterns = [
    /พูดกับ|คุยกับ|ติดต่อ|โทรหา|พบ|เจอ|พนักงาน|เจ้าหน้าที่|คน|human|staff|agent|representative/i,
    /ต้องการ.*พูด|อยาก.*พูด|ขอ.*พูด|ให้.*ติดต่อ|ให้.*โทร/i,
    /มี.*คน.*ไหม|มี.*เจ้าหน้าที่|มี.*พนักงาน/i,
  ]
  
  return contactPatterns.some(pattern => pattern.test(message))
}

/**
 * Determine handoff decision based on multiple factors
 * Priority order: user_requested > restricted_legal > low_confidence > long_conversation
 */
export function shouldHandoff(params: {
  intent: string
  confidence?: number
  userMessageCount: number
  userMessage: string
}): HandoffDecision {
  const { intent, confidence, userMessageCount, userMessage } = params

  // Condition 1: User asks to contact (highest priority)
  if (userAsksContact(userMessage)) {
    return {
      shouldHandoff: true,
      reason: 'user_requested',
      confidence,
    }
  }

  // Condition 2: Restricted legal intent
  if (intent === 'restricted_legal') {
    return {
      shouldHandoff: true,
      reason: 'legal_inquiry',
      confidence,
    }
  }

  // Condition 3: Low confidence (< 0.6)
  if (confidence !== undefined && confidence < 0.6) {
    return {
      shouldHandoff: true,
      reason: 'low_confidence',
      confidence,
    }
  }

  // Condition 4: Long conversation (>= 4 messages)
  if (userMessageCount >= 4) {
    return {
      shouldHandoff: true,
      reason: 'long_conversation',
      confidence,
    }
  }

  // No handoff needed
  return {
    shouldHandoff: false,
    reason: 'none',
    confidence,
  }
}

/**
 * Generate handoff response message
 */
export function getHandoffResponse(reason: HandoffReason): string {
  const contactInfo = '086-398-6889 หรือ zanhcpe@gmail.com'

  switch (reason) {
    case 'user_requested':
      return `ยินดีค่ะ! เจ้าหน้าที่พร้อมให้คำปรึกษาค่ะ\n\nติดต่อได้ที่:\n- โทร: 086-398-6889\n- อีเมล: zanhcpe@gmail.com\n\nเราจะติดต่อกลับภายใน 24 ชั่วโมงค่ะ 😊`

    case 'legal_inquiry':
      return `กรณีนี้เป็นรายละเอียดเชิงลึก เจ้าหน้าที่จะช่วยแนะนำได้ตรงกับสถานการณ์มากกว่าค่ะ\n\nแนะนำติดต่อ ${contactInfo} นะคะ 😊`

    case 'low_confidence':
      return `ขออภัยค่ะ ยังไม่แน่ใจในคำตอบที่ถูกต้องสำหรับคำถามนี้\n\nเพื่อให้ได้ข้อมูลที่แม่นยำ แนะนำติดต่อ ${contactInfo} ค่ะ\nเจ้าหน้าที่จะช่วยตอบคำถามได้ดีกว่าค่ะ 😊`

    case 'long_conversation':
      return `ดูเหมือนว่าคุณมีคำถามหลายข้อที่ต้องการคำปรึกษาเพิ่มเติม\n\nเพื่อให้ได้คำแนะนำที่ครบถ้วน แนะนำติดต่อ ${contactInfo} ค่ะ\nเจ้าหน้าที่พร้อมให้คำปรึกษาแบบละเอียดค่ะ 😊`

    case 'complex_question':
      return `คำถามนี้ค่อนข้างซับซ้อน เจ้าหน้าที่จะช่วยอธิบายได้ละเอียดกว่าค่ะ\n\nติดต่อ ${contactInfo} เพื่อรับคำปรึกษาแบบเฉพาะเจาะจงค่ะ 😊`

    case 'technical_issue':
      return `ขออภัยค่ะ เกิดปัญหาทางเทคนิค\n\nกรุณาติดต่อ ${contactInfo} เพื่อรับความช่วยเหลือค่ะ`

    case 'pricing_negotiation':
      return `สำหรับการเจรจาราคาและแพ็กเกจที่เหมาะสมกับธุรกิจของคุณ\n\nแนะนำติดต่อ ${contactInfo} ค่ะ\nเจ้าหน้าที่จะช่วยแนะนำแพ็กเกจที่เหมาะกับคุณที่สุดค่ะ 😊`

    default:
      return `กรุณาติดต่อ ${contactInfo} เพื่อรับความช่วยเหลือเพิ่มเติมค่ะ 😊`
  }
}
