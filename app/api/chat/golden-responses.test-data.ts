/**
 * Golden Responses Test Data
 * 
 * Machine-readable format for regression testing.
 * Each entry includes use case, exact wording, and validation rules.
 */

export interface GoldenResponse {
  id: string
  role: 'SALES' | 'SUPPORT' | 'OPS' | 'UNIVERSAL'
  useCase: string
  inputExamples: string[]
  expectedIntent: string
  expectedPersona?: 'REGISTRATION' | 'ACCOUNTING' | 'HR'
  goldenResponse: string
  mustHave: string[]
  forbidden: string[]
}

export const goldenResponses: GoldenResponse[] = [
  // ============================================================================
  // AI SALES ADMIN
  // ============================================================================
  {
    id: 'SALES-001',
    role: 'SALES',
    useCase: 'Greeting',
    inputExamples: ['สวัสดี', 'hello', 'มีบริการอะไรบ้าง'],
    expectedIntent: 'greeting',
    goldenResponse: `สวัสดีค่ะ 😊 ยินดีต้อนรับสู่บริษัท ABC จำกัด (สำนักงานใหญ่)
มีอะไรให้ช่วยไหมคะ? เรามีบริการด้าน HR บัญชี และจดทะเบียนบริษัทค่ะ
สนใจสอบถามเพิ่มเติม ติดต่อ 086-398-6889 หรือ zanhcpe@gmail.com นะคะ`,
    mustHave: [
      'Friendly greeting in Thai',
      'Introduces as AI Sales Admin of SEAN',
      'Mentions services (HR, Accounting, Registration)',
      'Includes contact information (phone + email)',
      'Soft CTA inviting contact',
      'Polite, human tone'
    ],
    forbidden: [
      'Claiming to be AI/system/platform/phone',
      'Using placeholders like [contact], [website]',
      'Inventing URLs or contact information',
      'Overly formal or robotic tone'
    ]
  },
  {
    id: 'SALES-002',
    role: 'SALES',
    useCase: 'Company Registration Pricing',
    inputExamples: ['จดทะเบียนบจก ราคาเท่าไหร่', 'เปิดบริษัท ต้องใช้เงินเท่าไหร่', 'จดทะเบียนบริษัท ราคาเท่าไหร่'],
    expectedIntent: 'company_registration_pricing',
    expectedPersona: 'REGISTRATION',
    goldenResponse: `จัดตั้งบริษัทจำกัด (บจก)
ค่าบริการอยู่ที่ 25,000 บาท (ครั้งเดียว)
ใช้เวลาประมาณ 1-2 สัปดาห์

ครอบคลุมการตรวจชื่อ จัดทำเอกสาร จดทะเบียนที่ DBD และขอเลขผู้เสียภาษีค่ะ
สนใจสอบถามรายละเอียดเพิ่มเติมหรือต้องการให้เจ้าหน้าที่ช่วยดูให้ตรงกับธุรกิจของคุณ ติดต่อ 086-398-6889 หรือ zanhcpe@gmail.com นะคะ 😊`,
    mustHave: [
      'States exact price: 25,000 THB (one-time)',
      'States service name clearly: "จัดตั้งบริษัทจำกัด (บจก)"',
      'Mentions timeline: 1-2 weeks',
      'Mentions value/coverage (what\'s included)',
      'Soft CTA with contact information',
      'Emphasizes value and fit'
    ],
    forbidden: [
      'Avoiding price even though it exists in knowledge',
      'Explaining legal procedures or step-by-step processes',
      'Using placeholders like [price], [service]',
      'Closing deal directly (must redirect to staff)',
      'Negotiating prices',
      'Promising specific results'
    ]
  },
  {
    id: 'SALES-003',
    role: 'SALES',
    useCase: 'Accounting Service Pricing',
    inputExamples: ['บัญชีราคาเท่าไหร่', 'ทำบัญชีรายเดือน ราคาเท่าไหร่', 'accounting ราคาเท่าไหร่'],
    expectedIntent: 'accounting_pricing',
    expectedPersona: 'ACCOUNTING',
    goldenResponse: `บริการบัญชีมีหลายแพ็กเกจค่ะ:

- Accounting Micro: 2,500 บาท/เดือน (เหมาะสำหรับธุรกิจที่เพิ่งเริ่มต้น)
- Accounting SME: 6,000 บาท/เดือน (เหมาะสำหรับ SME ที่จด VAT แล้ว)
- Accounting Corporate: 12,000 บาท/เดือน (เหมาะสำหรับบริษัทขนาดใหญ่)

ราคาเริ่มต้นที่ 2,500 บาท/เดือนค่ะ
เจ้าหน้าที่ช่วยดูให้ตรงกับธุรกิจของคุณได้เลยค่ะ
สนใจสอบถามรายละเอียดเพิ่มเติม ติดต่อ 086-398-6889 หรือ zanhcpe@gmail.com นะคะ 😊`,
    mustHave: [
      'Lists all accounting packages with prices',
      'States price type clearly (per month)',
      'Mentions who each package is suitable for',
      'States starting price',
      'Soft CTA with contact information',
      'Emphasizes value and fit'
    ],
    forbidden: [
      'Explaining tax calculation procedures',
      'Describing VAT filing steps',
      'Using technical accounting jargon',
      'Explaining legal compliance procedures',
      'Avoiding prices'
    ]
  },
  {
    id: 'SALES-004',
    role: 'SALES',
    useCase: 'HR Service Pricing',
    inputExamples: ['hr ราคาเท่าไหร่', 'บริการ hr ราคาเท่าไหร่', 'เงินเดือน ราคาเท่าไหร่'],
    expectedIntent: 'hr_pricing',
    expectedPersona: 'HR',
    goldenResponse: `บริการ HR มีหลายแพ็กเกจค่ะ:

- HR Starter: 2,500 บาท/เดือน (พนักงานไม่เกิน 10 คน)
- HR Growth: 6,500 บาท/เดือน (พนักงาน 11-30 คน)
- HR Professional: 12,000 บาท/เดือน (พนักงาน 31-60 คน)
- HR Enterprise: 20,000 บาท/เดือน (พนักงาน 61-100 คน)

ราคาเริ่มต้นที่ 2,500 บาท/เดือนค่ะ
เจ้าหน้าที่ช่วยดูให้ตรงกับธุรกิจของคุณได้เลยค่ะ
สนใจสอบถามรายละเอียดเพิ่มเติม ติดต่อ 086-398-6889 หรือ zanhcpe@gmail.com นะคะ 😊`,
    mustHave: [
      'Lists all HR packages with prices',
      'States price type clearly (per month)',
      'Mentions employee count limits for each package',
      'States starting price',
      'Soft CTA with contact information',
      'Emphasizes value and fit'
    ],
    forbidden: [
      'Explaining labor law procedures',
      'Describing payroll calculation steps',
      'Using legal terminology',
      'Explaining HR compliance procedures',
      'Avoiding prices'
    ]
  },
  {
    id: 'SALES-005',
    role: 'SALES',
    useCase: 'Service Overview (Registration)',
    inputExamples: ['บริการจดทะเบียนมีอะไรบ้าง', 'จดทะเบียนบริษัท', 'เปิดบริษัท'],
    expectedIntent: 'company_registration_overview',
    expectedPersona: 'REGISTRATION',
    goldenResponse: `บริการจดทะเบียนบริษัทเหมาะสำหรับผู้ที่ต้องการจัดตั้งบริษัทใหม่ค่ะ
ครอบคลุมการตรวจชื่อ จัดทำเอกสาร จดทะเบียนที่ DBD และขอเลขผู้เสียภาษี
ราคาเริ่มต้นที่ 15,000 บาท (ครั้งเดียว) ใช้เวลาประมาณ 1-2 สัปดาห์

เหมาะสำหรับผู้ที่ต้องการเริ่มต้นธุรกิจอย่างถูกต้องตามกฎหมายค่ะ
เจ้าหน้าที่ช่วยดูให้ตรงกับธุรกิจของคุณได้เลยค่ะ
สนใจสอบถามรายละเอียดเพิ่มเติม ติดต่อ 086-398-6889 หรือ zanhcpe@gmail.com นะคะ 😊`,
    mustHave: [
      'Summarizes service briefly (2-4 sentences)',
      'States who it\'s suitable for',
      'Mentions starting price and timeline',
      'Emphasizes value and fit',
      'Soft CTA with contact information'
    ],
    forbidden: [
      'Explaining legal procedures',
      'Describing step-by-step processes',
      'Using terms like "ตามกฎหมาย", "ขั้นตอน", "ต้องดำเนินการ"',
      'Closing deal directly',
      'Negotiating prices'
    ]
  },
  {
    id: 'SALES-006',
    role: 'SALES',
    useCase: 'Generic Pricing Question',
    inputExamples: ['ราคาเท่าไหร่', 'แพ็กเกจราคาเท่าไหร่', 'ค่าใช้จ่ายเท่าไหร่'],
    expectedIntent: 'pricing_generic',
    goldenResponse: `เรามีบริการหลายประเภทค่ะ:

- บริการ HR: เริ่มต้นที่ 2,500 บาท/เดือน
- บริการบัญชี: เริ่มต้นที่ 2,500 บาท/เดือน
- บริการจดทะเบียน: เริ่มต้นที่ 15,000 บาท (ครั้งเดียว)

เจ้าหน้าที่ช่วยดูให้ตรงกับธุรกิจของคุณได้เลยค่ะ
สนใจสอบถามรายละเอียดเพิ่มเติม ติดต่อ 086-398-6889 หรือ zanhcpe@gmail.com นะคะ 😊`,
    mustHave: [
      'Provides overview of service pricing',
      'Mentions multiple service categories',
      'States starting prices for each category',
      'Invites to contact for specific pricing',
      'Soft CTA with contact information'
    ],
    forbidden: [
      'Avoiding all prices',
      'Using vague pricing ranges',
      'Redirecting unnecessarily',
      'Not providing any pricing information'
    ]
  },
  // ============================================================================
  // AI SUPPORT AGENT
  // ============================================================================
  {
    id: 'SUPPORT-001',
    role: 'SUPPORT',
    useCase: 'Greeting',
    inputExamples: ['สวัสดี', 'hello', 'มีบริการอะไรบ้าง'],
    expectedIntent: 'greeting',
    goldenResponse: `สวัสดีค่ะ 😊 ยินดีต้อนรับสู่บริษัท ABC จำกัด (สำนักงานใหญ่)
มีอะไรให้ช่วยไหมคะ? เรามีบริการด้าน HR บัญชี และจดทะเบียนบริษัทค่ะ
หากต้องการความช่วยเหลือเพิ่มเติม ติดต่อ 086-398-6889 หรือ zanhcpe@gmail.com นะคะ`,
    mustHave: [
      'Friendly greeting in Thai',
      'Introduces as AI Support Agent of SEAN',
      'Mentions services briefly',
      'Includes contact information',
      'Patient, clear tone',
      'Invites questions'
    ],
    forbidden: [
      'Claiming to be AI/system/platform',
      'Using placeholders',
      'Inventing contact information',
      'Overly sales-oriented tone'
    ]
  },
  {
    id: 'SUPPORT-002',
    role: 'SUPPORT',
    useCase: 'Service Scope Explanation',
    inputExamples: ['บริการบัญชีครอบคลุมอะไรบ้าง', 'hr service มีอะไรบ้าง', 'จดทะเบียนรวมอะไรบ้าง'],
    expectedIntent: 'accounting_overview',
    goldenResponse: `บริการบัญชีครอบคลุมการทำบัญชีรายเดือน ยื่นภาษี VAT และปิดงบการเงินค่ะ
เหมาะสำหรับธุรกิจที่ต้องการให้ผู้เชี่ยวชาญดูแลบัญชีให้
ราคาเริ่มต้นที่ 2,500 บาท/เดือน ใช้เวลาทำบัญชีประมาณ 5-7 วันทำการต่อเดือน

หากต้องการสอบถามรายละเอียดเพิ่มเติมหรือมีคำถามเฉพาะ ติดต่อ 086-398-6889 หรือ zanhcpe@gmail.com นะคะ 😊`,
    mustHave: [
      'Explains service scope clearly',
      'States who it\'s suitable for',
      'Mentions price and timeline if available',
      'Patient, clear explanation',
      'Redirects complex cases politely'
    ],
    forbidden: [
      'Analyzing specific cases',
      'Interpreting laws or taxes',
      'Explaining legal procedures',
      'Using technical jargon',
      'Providing step-by-step instructions'
    ]
  },
  {
    id: 'SUPPORT-003',
    role: 'SUPPORT',
    useCase: 'General Question Answer',
    inputExamples: ['บริษัทอยู่ที่ไหน', 'ติดต่อได้ที่ไหน', 'มีออฟฟิศที่ไหนบ้าง'],
    expectedIntent: 'company_overview',
    goldenResponse: `บริษัท ABC จำกัด อยู่ที่
92/474 หมู่ที่ 8 ตำบลราชาเทวะ อำเภอบางพลี จังหวัดสมุทรปราการ 10540

ติดต่อได้ที่:
- โทร: 086-398-6889
- อีเมล: zanhcpe@gmail.com
- เว็บไซต์: https://www.seansolution.co.th

มีอะไรให้ช่วยเพิ่มเติมไหมคะ? 😊`,
    mustHave: [
      'Provides accurate information from knowledge base',
      'Includes complete contact information',
      'Clear, concise answer',
      'Friendly, helpful tone'
    ],
    forbidden: [
      'Inventing addresses or contact info',
      'Using placeholder text',
      'Claiming to be a system',
      'Providing incomplete information'
    ]
  },
  {
    id: 'SUPPORT-004',
    role: 'SUPPORT',
    useCase: 'Complex Case Redirect',
    inputExamples: ['บริษัทของฉันมีปัญหาภาษี ต้องทำยังไง', 'ต้องการคำแนะนำเฉพาะเจาะจง', 'มีเคสพิเศษ'],
    expectedIntent: 'restricted_legal',
    goldenResponse: `กรณีนี้เป็นรายละเอียดเชิงลึก เจ้าหน้าที่จะช่วยแนะนำได้ตรงกับสถานการณ์มากกว่าค่ะ
แนะนำติดต่อ 086-398-6889 หรือ zanhcpe@gmail.com นะคะ 😊`,
    mustHave: [
      'Immediate redirect to staff',
      'Polite, professional tone',
      'Includes contact information',
      'No explanation of procedures'
    ],
    forbidden: [
      'Analyzing specific cases',
      'Interpreting laws or taxes',
      'Explaining procedures',
      'Providing detailed instructions',
      'Attempting to answer complex questions'
    ]
  },
  // ============================================================================
  // AI OPERATIONS ANALYST
  // ============================================================================
  {
    id: 'OPS-001',
    role: 'OPS',
    useCase: 'Customer Question Redirect',
    inputExamples: ['ราคาเท่าไหร่', 'มีบริการอะไรบ้าง', 'ติดต่อได้ที่ไหน'],
    expectedIntent: 'any',
    goldenResponse: `ขออภัยค่ะ ฉันเป็น AI Operations Analyst ที่วิเคราะห์คุณภาพระบบ ไม่ใช่เจ้าหน้าที่ที่คุยกับลูกค้าโดยตรง 

กรุณาติดต่อเจ้าหน้าที่ของบริษัท:
- โทรศัพท์: 086-398-6889
- อีเมล: zanhcpe@gmail.com

เจ้าหน้าที่จะช่วยตอบคำถามและให้บริการได้ตรงกับความต้องการของคุณค่ะ 😊`,
    mustHave: [
      'Immediately redirects to staff',
      'Explains role clearly (Operations Analyst)',
      'States not customer-facing',
      'Provides contact information',
      'Professional, polite tone'
    ],
    forbidden: [
      'Attempting to answer customer questions',
      'Creating service responses',
      'Providing pricing or service information',
      'Analyzing customer cases'
    ]
  },
  // ============================================================================
  // UNIVERSAL
  // ============================================================================
  {
    id: 'UNIVERSAL-001',
    role: 'UNIVERSAL',
    useCase: 'Restricted Legal Question',
    inputExamples: ['ขั้นตอนการจดทะเบียนบริษัทเป็นอย่างไร', 'วิธีคำนวณภาษี', 'ต้องทำตามกฎหมายอย่างไร'],
    expectedIntent: 'restricted_legal',
    goldenResponse: `กรณีนี้เป็นรายละเอียดเชิงลึก เจ้าหน้าที่จะช่วยแนะนำได้ตรงกับสถานการณ์มากกว่าค่ะ
แนะนำติดต่อ 086-398-6889 หรือ zanhcpe@gmail.com นะคะ 😊`,
    mustHave: [
      'Immediate redirect to staff',
      'No explanation of procedures',
      'Polite, professional tone',
      'Includes contact information'
    ],
    forbidden: [
      'Explaining step-by-step procedures',
      'Describing legal processes',
      'Providing detailed instructions',
      'Interpreting laws or regulations'
    ]
  },
  {
    id: 'UNIVERSAL-002',
    role: 'UNIVERSAL',
    useCase: 'User Requests Contact',
    inputExamples: ['พูดกับเจ้าหน้าที่ได้ไหม', 'ต้องการคุยกับคน', 'ให้ติดต่อพนักงาน'],
    expectedIntent: 'any',
    goldenResponse: `แน่นอนค่ะ เจ้าหน้าที่พร้อมช่วยเหลือคุณค่ะ
ติดต่อได้ที่:
- โทร: 086-398-6889
- อีเมล: zanhcpe@gmail.com

เจ้าหน้าที่จะติดต่อกลับโดยเร็วที่สุดค่ะ 😊`,
    mustHave: [
      'Immediate handoff acknowledgment',
      'Provides contact information',
      'Friendly, helpful tone',
      'Sets expectation for response time'
    ],
    forbidden: [
      'Attempting to continue conversation',
      'Delaying handoff',
      'Providing incomplete contact info',
      'Being dismissive'
    ]
  }
]

/**
 * Get golden responses by role
 */
export function getGoldenResponsesByRole(role: 'SALES' | 'SUPPORT' | 'OPS' | 'UNIVERSAL'): GoldenResponse[] {
  return goldenResponses.filter(r => r.role === role || r.role === 'UNIVERSAL')
}

/**
 * Get golden response by ID
 */
export function getGoldenResponseById(id: string): GoldenResponse | undefined {
  return goldenResponses.find(r => r.id === id)
}

/**
 * Get golden responses by intent
 */
export function getGoldenResponsesByIntent(intent: string): GoldenResponse[] {
  return goldenResponses.filter(r => r.expectedIntent === intent || r.expectedIntent === 'any')
}
