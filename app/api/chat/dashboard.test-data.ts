import type { ChatLogEntry } from './dashboard'
import { detectIntent } from './intent'
import { containsPrice } from './dashboard'

/**
 * Example test data based on test cases
 * This simulates real chat logs for dashboard calculation
 */
export const exampleChatLogs: ChatLogEntry[] = [
  // Test Case 1: Greeting
  {
    id: '1',
    timestamp: new Date('2024-01-01T10:00:00Z'),
    userMessage: 'สวัสดี',
    detectedIntent: detectIntent('สวัสดี'),
    expectedIntent: 'unknown', // Greeting maps to unknown in current system
    expectedPersona: 'REGISTRATION',
    aiResponse: 'สวัสดีค่ะ 😊 ยินดีต้อนรับสู่บริษัท ABC จำกัด มีอะไรให้ช่วยไหมคะ?',
    isPricingQuestion: false,
    containsPrice: containsPrice('สวัสดีค่ะ 😊 ยินดีต้อนรับสู่บริษัท ABC จำกัด มีอะไรให้ช่วยไหมคะ?'),
    goldenResponse: 'สวัสดีค่ะ 😊 ยินดีต้อนรับสู่บริษัท ABC จำกัด\nมีอะไรให้ช่วยไหมคะ? เรามีบริการด้าน HR บัญชี และจดทะเบียนบริษัทค่ะ\nสนใจสอบถามเพิ่มเติม ติดต่อ 086-398-6889 หรือ zanhcpe@gmail.com นะคะ',
  },

  // Test Case 2: Company Registration Pricing
  {
    id: '2',
    timestamp: new Date('2024-01-01T10:05:00Z'),
    userMessage: 'จดทะเบียนบจก ราคาเท่าไหร่',
    detectedIntent: detectIntent('จดทะเบียนบจก ราคาเท่าไหร่'),
    expectedIntent: 'company_registration_pricing',
    expectedPersona: 'REGISTRATION',
    aiResponse: 'จัดตั้งบริษัทจำกัด (บจก)\nค่าบริการอยู่ที่ 25,000 บาท (ครั้งเดียว)\nใช้เวลาประมาณ 1-2 สัปดาห์\n\nสนใจสอบถามเพิ่มเติม ติดต่อ 086-398-6889 หรือ zanhcpe@gmail.com นะคะ 😊',
    isPricingQuestion: true,
    containsPrice: containsPrice('จัดตั้งบริษัทจำกัด (บจก)\nค่าบริการอยู่ที่ 25,000 บาท (ครั้งเดียว)\nใช้เวลาประมาณ 1-2 สัปดาห์\n\nสนใจสอบถามเพิ่มเติม ติดต่อ 086-398-6889 หรือ zanhcpe@gmail.com นะคะ 😊'),
    goldenResponse: 'จัดตั้งบริษัทจำกัด (บจก)\nค่าบริการอยู่ที่ 25,000 บาท (ครั้งเดียว)\nใช้เวลาประมาณ 1-2 สัปดาห์\n\nครอบคลุมการตรวจชื่อ จัดทำเอกสาร จดทะเบียนที่ DBD และขอเลขผู้เสียภาษีค่ะ\nสนใจสอบถามเพิ่มเติม ติดต่อ 086-398-6889 หรือ zanhcpe@gmail.com นะคะ 😊',
  },

  // Test Case 3: Accounting Pricing
  {
    id: '3',
    timestamp: new Date('2024-01-01T10:10:00Z'),
    userMessage: 'บัญชีราคาเท่าไหร่',
    detectedIntent: detectIntent('บัญชีราคาเท่าไหร่'),
    expectedIntent: 'accounting_pricing',
    expectedPersona: 'ACCOUNTING',
    aiResponse: 'บริการบัญชีมีหลายแพ็กเกจค่ะ:\n\n- Accounting Micro: 2,500 บาท/เดือน\n- Accounting SME: 6,000 บาท/เดือน\n- Accounting Corporate: 12,000 บาท/เดือน\n\nสนใจสอบถามเพิ่มเติม ติดต่อ 086-398-6889 หรือ zanhcpe@gmail.com นะคะ 😊',
    isPricingQuestion: true,
    containsPrice: containsPrice('บริการบัญชีมีหลายแพ็กเกจค่ะ:\n\n- Accounting Micro: 2,500 บาท/เดือน\n- Accounting SME: 6,000 บาท/เดือน\n- Accounting Corporate: 12,000 บาท/เดือน\n\nสนใจสอบถามเพิ่มเติม ติดต่อ 086-398-6889 หรือ zanhcpe@gmail.com นะคะ 😊'),
    goldenResponse: 'บริการบัญชีมีหลายแพ็กเกจค่ะ:\n\n- Accounting Micro: 2,500 บาท/เดือน (เหมาะสำหรับธุรกิจที่เพิ่งเริ่มต้น)\n- Accounting SME: 6,000 บาท/เดือน (เหมาะสำหรับ SME ที่จด VAT แล้ว)\n- Accounting Corporate: 12,000 บาท/เดือน (เหมาะสำหรับบริษัทขนาดใหญ่)\n\nเจ้าหน้าที่ช่วยดูให้ตรงกับธุรกิจของคุณได้เลยค่ะ\nสนใจสอบถามเพิ่มเติม ติดต่อ 086-398-6889 หรือ zanhcpe@gmail.com นะคะ 😊',
  },

  // Test Case 4: HR Pricing
  {
    id: '4',
    timestamp: new Date('2024-01-01T10:15:00Z'),
    userMessage: 'hr ราคาเท่าไหร่',
    detectedIntent: detectIntent('hr ราคาเท่าไหร่'),
    expectedIntent: 'hr_pricing',
    expectedPersona: 'HR',
    aiResponse: 'บริการ HR มีหลายแพ็กเกจค่ะ:\n\n- HR Starter: 2,500 บาท/เดือน\n- HR Growth: 6,500 บาท/เดือน\n- HR Professional: 12,000 บาท/เดือน\n\nสนใจสอบถามเพิ่มเติม ติดต่อ 086-398-6889 หรือ zanhcpe@gmail.com นะคะ 😊',
    isPricingQuestion: true,
    containsPrice: containsPrice('บริการ HR มีหลายแพ็กเกจค่ะ:\n\n- HR Starter: 2,500 บาท/เดือน\n- HR Growth: 6,500 บาท/เดือน\n- HR Professional: 12,000 บาท/เดือน\n\nสนใจสอบถามเพิ่มเติม ติดต่อ 086-398-6889 หรือ zanhcpe@gmail.com นะคะ 😊'),
    goldenResponse: 'บริการ HR มีหลายแพ็กเกจค่ะ:\n\n- HR Starter: 2,500 บาท/เดือน (พนักงานไม่เกิน 10 คน)\n- HR Growth: 6,500 บาท/เดือน (พนักงาน 11-30 คน)\n- HR Professional: 12,000 บาท/เดือน (พนักงาน 31-60 คน)\n- HR Enterprise: 20,000 บาท/เดือน (พนักงาน 61-100 คน)\n\nราคาเริ่มต้นที่ 2,500 บาท/เดือนค่ะ\nสนใจสอบถามเพิ่มเติม ติดต่อ 086-398-6889 หรือ zanhcpe@gmail.com นะคะ 😊',
  },

  // Test Case 5: Restricted Legal (should redirect)
  {
    id: '5',
    timestamp: new Date('2024-01-01T10:20:00Z'),
    userMessage: 'ขั้นตอนการจดทะเบียนบริษัทเป็นอย่างไร',
    detectedIntent: detectIntent('ขั้นตอนการจดทะเบียนบริษัทเป็นอย่างไร'),
    expectedIntent: 'unknown', // Should be restricted but maps to unknown
    expectedPersona: 'REGISTRATION',
    aiResponse: 'กรณีนี้เป็นรายละเอียดเชิงลึก เจ้าหน้าที่จะช่วยแนะนำได้ตรงกับสถานการณ์มากกว่าค่ะ\nแนะนำติดต่อ 086-398-6889 หรือ zanhcpe@gmail.com นะคะ 😊',
    isPricingQuestion: false,
    containsPrice: containsPrice('กรณีนี้เป็นรายละเอียดเชิงลึก เจ้าหน้าที่จะช่วยแนะนำได้ตรงกับสถานการณ์มากกว่าค่ะ\nแนะนำติดต่อ 086-398-6889 หรือ zanhcpe@gmail.com นะคะ 😊'),
    goldenResponse: 'กรณีนี้เป็นรายละเอียดเชิงลึก เจ้าหน้าที่จะช่วยแนะนำได้ตรงกับสถานการณ์มากกว่าค่ะ\nแนะนำติดต่อ 086-398-6889 หรือ zanhcpe@gmail.com นะคะ 😊',
  },

  // Test Case 6: Company Overview
  {
    id: '6',
    timestamp: new Date('2024-01-01T10:25:00Z'),
    userMessage: 'บริษัทอยู่ที่ไหน',
    detectedIntent: detectIntent('บริษัทอยู่ที่ไหน'),
    expectedIntent: 'unknown', // Should be company_overview
    expectedPersona: 'REGISTRATION',
    aiResponse: 'บริษัท ABC จำกัด อยู่ที่\n92/474 หมู่ที่ 8 ตำบลราชาเทวะ อำเภอบางพลี จังหวัดสมุทรปราการ 10540\n\nติดต่อได้ที่:\n- โทร: 086-398-6889\n- อีเมล: zanhcpe@gmail.com',
    isPricingQuestion: false,
    containsPrice: containsPrice('บริษัท ABC จำกัด อยู่ที่\n92/474 หมู่ที่ 8 ตำบลราชาเทวะ อำเภอบางพลี จังหวัดสมุทรปราการ 10540\n\nติดต่อได้ที่:\n- โทร: 086-398-6889\n- อีเมล: zanhcpe@gmail.com'),
    goldenResponse: 'บริษัท ABC จำกัด อยู่ที่\n92/474 หมู่ที่ 8 ตำบลราชาเทวะ อำเภอบางพลี จังหวัดสมุทรปราการ 10540\n\nติดต่อได้ที่:\n- โทร: 086-398-6889\n- อีเมล: zanhcpe@gmail.com\n- เว็บไซต์: https://www.seansolution.co.th\n\nมีอะไรให้ช่วยเพิ่มเติมไหมคะ? 😊',
  },

  // Test Case 7: Generic Pricing
  {
    id: '7',
    timestamp: new Date('2024-01-01T10:30:00Z'),
    userMessage: 'ราคาเท่าไหร่',
    detectedIntent: detectIntent('ราคาเท่าไหร่'),
    expectedIntent: 'company_registration_pricing', // Generic pricing, but keyword "ราคา" matches REGISTRATION
    expectedPersona: 'REGISTRATION',
    aiResponse: 'เรามีบริการหลายประเภทค่ะ:\n\n- บริการ HR: เริ่มต้นที่ 2,500 บาท/เดือน\n- บริการบัญชี: เริ่มต้นที่ 2,500 บาท/เดือน\n- บริการจดทะเบียน: เริ่มต้นที่ 15,000 บาท (ครั้งเดียว)',
    isPricingQuestion: true,
    containsPrice: containsPrice('เรามีบริการหลายประเภทค่ะ:\n\n- บริการ HR: เริ่มต้นที่ 2,500 บาท/เดือน\n- บริการบัญชี: เริ่มต้นที่ 2,500 บาท/เดือน\n- บริการจดทะเบียน: เริ่มต้นที่ 15,000 บาท (ครั้งเดียว)'),
    goldenResponse: 'เรามีบริการหลายประเภทค่ะ:\n\n- บริการ HR: เริ่มต้นที่ 2,500 บาท/เดือน\n- บริการบัญชี: เริ่มต้นที่ 2,500 บาท/เดือน\n- บริการจดทะเบียน: เริ่มต้นที่ 15,000 บาท (ครั้งเดียว)\n\nเจ้าหน้าที่ช่วยดูให้ตรงกับธุรกิจของคุณได้เลยค่ะ\nสนใจสอบถามเพิ่มเติม ติดต่อ 086-398-6889 หรือ zanhcpe@gmail.com นะคะ 😊',
  },

  // Test Case 8: Unknown/Expert Question
  {
    id: '8',
    timestamp: new Date('2024-01-01T10:35:00Z'),
    userMessage: 'หจก vs บจก ต่างกันอย่างไร',
    detectedIntent: detectIntent('หจก vs บจก ต่างกันอย่างไร'),
    expectedIntent: 'unknown',
    expectedPersona: 'REGISTRATION',
    aiResponse: 'กรณีนี้เป็นรายละเอียดเชิงลึก เจ้าหน้าที่จะช่วยแนะนำได้ตรงกับสถานการณ์มากกว่าค่ะ\nแนะนำติดต่อ 086-398-6889 หรือ zanhcpe@gmail.com นะคะ 😊',
    isPricingQuestion: false,
    containsPrice: containsPrice('กรณีนี้เป็นรายละเอียดเชิงลึก เจ้าหน้าที่จะช่วยแนะนำได้ตรงกับสถานการณ์มากกว่าค่ะ\nแนะนำติดต่อ 086-398-6889 หรือ zanhcpe@gmail.com นะคะ 😊'),
    goldenResponse: 'กรณีนี้เป็นรายละเอียดเชิงลึก เจ้าหน้าที่จะช่วยแนะนำได้ตรงกับสถานการณ์มากกว่าค่ะ\nแนะนำติดต่อ 086-398-6889 หรือ zanhcpe@gmail.com นะคะ 😊',
  },

  // Example: Pricing question without price (FAILURE CASE)
  {
    id: '9',
    timestamp: new Date('2024-01-01T10:40:00Z'),
    userMessage: 'เปิดบริษัทกี่บาท',
    detectedIntent: detectIntent('เปิดบริษัทกี่บาท'),
    expectedIntent: 'company_registration_pricing',
    expectedPersona: 'REGISTRATION',
    aiResponse: 'กรุณาติดต่อเจ้าหน้าที่เพื่อสอบถามราคาค่ะ', // Missing price - failure
    isPricingQuestion: true,
    containsPrice: containsPrice('กรุณาติดต่อเจ้าหน้าที่เพื่อสอบถามราคาค่ะ'),
    goldenResponse: 'จัดตั้งบริษัทจำกัด (บจก)\nค่าบริการอยู่ที่ 25,000 บาท (ครั้งเดียว)',
  },

  // Example: Forbidden violation - legal explanation
  {
    id: '10',
    timestamp: new Date('2024-01-01T10:45:00Z'),
    userMessage: 'ยื่นภาษียังไง',
    detectedIntent: detectIntent('ยื่นภาษียังไง'),
    expectedIntent: 'accounting_pricing',
    expectedPersona: 'ACCOUNTING',
    aiResponse: 'ขั้นตอนการยื่นภาษีมีดังนี้:\n1. เตรียมเอกสาร\n2. ยื่นที่สรรพากร\n3. รอผล', // Forbidden: legal explanation
    isPricingQuestion: false,
    containsPrice: containsPrice('ขั้นตอนการยื่นภาษีมีดังนี้:\n1. เตรียมเอกสาร\n2. ยื่นที่สรรพากร\n3. รอผล'),
    goldenResponse: 'กรณีนี้เป็นรายละเอียดเชิงลึก เจ้าหน้าที่จะช่วยแนะนำได้ตรงกับสถานการณ์มากกว่าค่ะ',
  },
]
