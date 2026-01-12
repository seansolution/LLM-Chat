/**
 * Historical Chat Logs
 * 
 * Source data for regression test generation.
 * 
 * To add new logs:
 * 1. Export chat logs from your database/API
 * 2. Format as ChatLog[] array
 * 3. Add to this file
 * 4. Run: npm run test:regression:generate
 */

import type { ChatLog } from './regression-test-generator'

/**
 * Example chat logs from production/historical data
 * Replace with actual logs from your system
 */
export const historicalChatLogs: ChatLog[] = [
  {
    id: 'log-001',
    timestamp: '2024-01-15T10:00:00Z',
    userMessage: 'อยากเปิดบริษัท ต้องใช้เงินเท่าไหร่',
    aiResponse: 'จัดตั้งบริษัทจำกัด (บจก)\nค่าบริการอยู่ที่ 25,000 บาท (ครั้งเดียว)\nใช้เวลาประมาณ 1-2 สัปดาห์\n\nสนใจสอบถามเพิ่มเติม ติดต่อ 086-398-6889 หรือ zanhcpe@gmail.com นะคะ 😊',
  },
  {
    id: 'log-002',
    timestamp: '2024-01-15T10:05:00Z',
    userMessage: 'จดทะเบียนบจก ราคาเท่าไหร่',
    aiResponse: 'จัดตั้งบริษัทจำกัด (บจก)\nค่าบริการอยู่ที่ 25,000 บาท (ครั้งเดียว)\nใช้เวลาประมาณ 1-2 สัปดาห์\n\nครอบคลุมการตรวจชื่อ จัดทำเอกสาร จดทะเบียนที่ DBD และขอเลขผู้เสียภาษีค่ะ\nสนใจสอบถามเพิ่มเติม ติดต่อ 086-398-6889 หรือ zanhcpe@gmail.com นะคะ 😊',
  },
  {
    id: 'log-003',
    timestamp: '2024-01-15T10:10:00Z',
    userMessage: 'บัญชีราคาเท่าไหร่',
    aiResponse: 'บริการบัญชีมีหลายแพ็กเกจค่ะ:\n\n- Accounting Micro: 2,500 บาท/เดือน\n- Accounting SME: 6,000 บาท/เดือน\n- Accounting Corporate: 12,000 บาท/เดือน\n\nเจ้าหน้าที่ช่วยดูให้ตรงกับธุรกิจของคุณได้เลยค่ะ\nสนใจสอบถามเพิ่มเติม ติดต่อ 086-398-6889 หรือ zanhcpe@gmail.com นะคะ 😊',
  },
  {
    id: 'log-004',
    timestamp: '2024-01-15T10:15:00Z',
    userMessage: 'hr ราคาเท่าไหร่',
    aiResponse: 'บริการ HR มีหลายแพ็กเกจค่ะ:\n\n- HR Starter: 2,500 บาท/เดือน (พนักงานไม่เกิน 10 คน)\n- HR Growth: 6,500 บาท/เดือน (พนักงาน 11-30 คน)\n- HR Professional: 12,000 บาท/เดือน (พนักงาน 31-60 คน)\n\nราคาเริ่มต้นที่ 2,500 บาท/เดือนค่ะ\nสนใจสอบถามเพิ่มเติม ติดต่อ 086-398-6889 หรือ zanhcpe@gmail.com นะคะ 😊',
  },
  {
    id: 'log-005',
    timestamp: '2024-01-15T10:20:00Z',
    userMessage: 'ขั้นตอนการจดทะเบียนบริษัทเป็นอย่างไร',
    aiResponse: 'กรณีนี้เป็นรายละเอียดเชิงลึก เจ้าหน้าที่จะช่วยแนะนำได้ตรงกับสถานการณ์มากกว่าค่ะ\nแนะนำติดต่อ 086-398-6889 หรือ zanhcpe@gmail.com นะคะ 😊',
  },
  {
    id: 'log-006',
    timestamp: '2024-01-15T10:25:00Z',
    userMessage: 'ทำบัญชีรายเดือน',
    aiResponse: 'บริการบัญชีมีหลายแพ็กเกจค่ะ:\n\n- Accounting Micro: 2,500 บาท/เดือน (เหมาะสำหรับธุรกิจที่เพิ่งเริ่มต้น)\n- Accounting SME: 6,000 บาท/เดือน (เหมาะสำหรับ SME ที่จด VAT แล้ว)\n- Accounting Corporate: 12,000 บาท/เดือน (เหมาะสำหรับบริษัทขนาดใหญ่)\n\nเจ้าหน้าที่ช่วยดูให้ตรงกับธุรกิจของคุณได้เลยค่ะ\nสนใจสอบถามเพิ่มเติม ติดต่อ 086-398-6889 หรือ zanhcpe@gmail.com นะคะ 😊',
  },
  {
    id: 'log-007',
    timestamp: '2024-01-15T10:30:00Z',
    userMessage: 'มีพนักงาน 12 คน ต้องทำ hr ยังไง',
    aiResponse: 'บริการ HR มีหลายแพ็กเกจค่ะ:\n\n- HR Starter: 2,500 บาท/เดือน (พนักงานไม่เกิน 10 คน)\n- HR Growth: 6,500 บาท/เดือน (พนักงาน 11-30 คน)\n\nเหมาะสำหรับบริษัทที่มีพนักงาน 11-30 คน ต้องการระบบ HR ที่ครบถ้วนค่ะ\nสนใจสอบถามเพิ่มเติม ติดต่อ 086-398-6889 หรือ zanhcpe@gmail.com นะคะ 😊',
  },
  {
    id: 'log-008',
    timestamp: '2024-01-15T10:35:00Z',
    userMessage: 'คำนวณเงินเดือน',
    aiResponse: 'บริการ HR มีหลายแพ็กเกจที่ครอบคลุมการคำนวณเงินเดือนค่ะ:\n\n- HR Starter: 2,500 บาท/เดือน (พนักงานไม่เกิน 10 คน)\n- HR Growth: 6,500 บาท/เดือน (พนักงาน 11-30 คน)\n\nสนใจสอบถามเพิ่มเติม ติดต่อ 086-398-6889 หรือ zanhcpe@gmail.com นะคะ 😊',
  },
  {
    id: 'log-009',
    timestamp: '2024-01-15T10:40:00Z',
    userMessage: 'ยื่น vat ต้องทำยังไง',
    aiResponse: 'กรณีนี้เป็นรายละเอียดเชิงลึก เจ้าหน้าที่จะช่วยแนะนำได้ตรงกับสถานการณ์มากกว่าค่ะ\nแนะนำติดต่อ 086-398-6889 หรือ zanhcpe@gmail.com นะคะ 😊',
  },
  {
    id: 'log-010',
    timestamp: '2024-01-15T10:45:00Z',
    userMessage: 'เปิดบริษัทและมีพนักงาน 5 คน',
    aiResponse: 'จัดตั้งบริษัทจำกัด (บจก)\nค่าบริการอยู่ที่ 25,000 บาท (ครั้งเดียว)\nใช้เวลาประมาณ 1-2 สัปดาห์\n\nหลังจากจดทะเบียนแล้ว หากต้องการบริการ HR สำหรับพนักงาน 5 คน มีแพ็กเกจ HR Starter ราคา 2,500 บาท/เดือนค่ะ\nสนใจสอบถามเพิ่มเติม ติดต่อ 086-398-6889 หรือ zanhcpe@gmail.com นะคะ 😊',
  },
]
