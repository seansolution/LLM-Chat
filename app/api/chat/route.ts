import { NextResponse } from 'next/server'
import { detectIntent, getSystemPersonaPrompt, type Persona, type IntentResult } from './intent'
import { buildRolePrompt, selectRole, type AIRole } from './role-prompts'

export type { Persona, IntentResult, AIRole }

type ReqBody = {
  message?: string
  persona?: Persona
  role?: AIRole // AI role: SALES, SUPPORT, or OPS (optional - will be auto-selected if not provided)
  userId?: string // For A/B testing
  sessionId?: string // For A/B testing
  messageCount?: number // For handoff detection (current message count in conversation)
  confidence?: number // Intent confidence score (0-1, optional)
  flags?: {
    opsMode?: boolean // Enable OPS mode (forces OPS role)
    [key: string]: unknown // Allow other flags
  }
}

type Intent = {
  id: string
  description: string
  keywords: RegExp[]
  allowedFiles: string[]
  maxKnowledgeLength: number
  allowPricing: boolean
  responseType: 'greeting' | 'overview' | 'pricing' | 'restricted' | 'unknown'
  extractSection?: string
  priority: number
}

const INTENT_TAXONOMY: Intent[] = [
  {
    id: 'greeting',
    description: 'Greeting or casual conversation',
    keywords: [/^สวัสดี|^hello|^hi|^หวัดดี|^ดี|^สบายดี/i],
    allowedFiles: ['company.md'],
    maxKnowledgeLength: 200,
    allowPricing: false,
    responseType: 'greeting',
    priority: 10
  },
  {
    id: 'company_overview',
    description: 'Company information, contact, location',
    keywords: [/บริษัท|company|เกี่ยวกับ|about|เรา|ที่ไหน|ติดต่อ|contact|โทร|email|ที่อยู่|address|เบอร์|โทรศัพท์|สำนักงาน|website/i],
    allowedFiles: ['company.md'],
    maxKnowledgeLength: 400,
    allowPricing: false,
    responseType: 'overview',
    priority: 8
  },
  {
    id: 'company_registration_pricing',
    description: 'Company registration pricing questions',
    keywords: [/เปิดบริษัท.*ราคา|จดทะเบียน.*ราคา|บจก.*ราคา|หจก.*ราคา|ค่าใช้จ่าย.*จด|ราคา.*จด|กี่บาท.*จด|จด.*ราคา|จด.*ค่าใช้จ่าย|จด.*กี่บาท|เปิดบริษัท.*เท่าไหร่|จดทะเบียน.*เท่าไหร่/i],
    allowedFiles: ['services.md'],
    maxKnowledgeLength: 1200,
    allowPricing: true,
    responseType: 'pricing',
    extractSection: 'จดทะเบียน',
    priority: 9
  },
  {
    id: 'company_registration_overview',
    description: 'Company registration service overview',
    keywords: [/จดทะเบียน|registration|บจก|หจก|dbd|จัดตั้งบริษัท|เปิดบริษัท/i],
    allowedFiles: ['services.md'],
    maxKnowledgeLength: 800,
    allowPricing: true,
    responseType: 'overview',
    extractSection: 'จดทะเบียน',
    priority: 7
  },
  {
    id: 'accounting_pricing',
    description: 'Accounting service pricing questions',
    keywords: [/บัญชี.*ราคา|accounting.*ราคา|บัญชี.*เท่าไหร่|บัญชี.*กี่บาท|vat.*ราคา|ภาษี.*ราคา|ยื่นภาษี.*ราคา/i],
    allowedFiles: ['services.md'],
    maxKnowledgeLength: 1000,
    allowPricing: true,
    responseType: 'pricing',
    extractSection: 'บัญชี',
    priority: 9
  },
  {
    id: 'accounting_overview',
    description: 'Accounting service overview',
    keywords: [/บัญชี|accounting|ภาษี|tax|vat|ภ\.พ\.30|ภ\.ง\.ด\.|ยื่นภาษี|ปิดงบ/i],
    allowedFiles: ['services.md'],
    maxKnowledgeLength: 800,
    allowPricing: true,
    responseType: 'overview',
    extractSection: 'บัญชี',
    priority: 6
  },
  {
    id: 'hr_pricing',
    description: 'HR service pricing questions',
    keywords: [/hr.*ราคา|ทรัพยากร.*ราคา|เงินเดือน.*ราคา|payroll.*ราคา|hr.*เท่าไหร่|hr.*กี่บาท|เงินเดือน.*เท่าไหร่/i],
    allowedFiles: ['services.md'],
    maxKnowledgeLength: 1000,
    allowPricing: true,
    responseType: 'pricing',
    extractSection: 'HR',
    priority: 9
  },
  {
    id: 'hr_overview',
    description: 'HR service overview',
    keywords: [/hr|ทรัพยากรบุคคล|เงินเดือน|payroll|ประกันสังคม|สลิป|hr service/i],
    allowedFiles: ['services.md'],
    maxKnowledgeLength: 800,
    allowPricing: true,
    responseType: 'overview',
    extractSection: 'HR',
    priority: 6
  },
  {
    id: 'payroll_overview',
    description: 'Payroll service overview',
    keywords: [/payroll|เงินเดือน|สลิป|คำนวณเงินเดือน/i],
    allowedFiles: ['services.md'],
    maxKnowledgeLength: 600,
    allowPricing: true,
    responseType: 'overview',
    extractSection: 'เงินเดือน',
    priority: 5
  },
  {
    id: 'pricing_generic',
    description: 'Generic pricing questions',
    keywords: [/ราคา|price|แพ็กเกจ|package|ค่าใช้จ่าย|cost|เท่าไหร่|แพง|กี่บาท|บาท|thb|fee|ค่าบริการ/i],
    allowedFiles: ['services.md', 'th/packages-and-pricing.md'],
    maxKnowledgeLength: 1500,
    allowPricing: true,
    responseType: 'pricing',
    priority: 4
  },
  {
    id: 'work_permit_overview',
    description: 'Work permit service overview',
    keywords: [/work permit|workpermit|วีซ่า|visa|ใบอนุญาตทำงาน/i],
    allowedFiles: ['services.md'],
    maxKnowledgeLength: 600,
    allowPricing: true,
    responseType: 'overview',
    extractSection: 'ใบอนุญาต',
    priority: 5
  },
  {
    id: 'restricted_legal',
    description: 'Legal procedures, deep technical questions',
    keywords: [/ขั้นตอน|วิธีการ|procedure|process|กฎหมาย|legal|compliance|ระเบียบ|ข้อกำหนด|คำนวณ|ตีความ|เชิงลึก|ซับซ้อน/i],
    allowedFiles: [],
    maxKnowledgeLength: 0,
    allowPricing: false,
    responseType: 'restricted',
    priority: 3
  },
  {
    id: 'unknown_or_expert',
    description: 'Unknown or expert-only questions',
    keywords: [/เปรียบเทียบ|comparison|คำศัพท์|glossary|terminology|หจก vs บจก|borjor|horjor/i],
    allowedFiles: [],
    maxKnowledgeLength: 0,
    allowPricing: false,
    responseType: 'restricted',
    priority: 2
  }
]


function getIntentConfig(intentId: string): Intent {
  const matchedIntent = INTENT_TAXONOMY.find(i => i.id === intentId)
  
  if (matchedIntent) {
    return matchedIntent
  }
  
  // Default unknown intent
  return {
    id: 'unknown',
    description: 'Unknown intent',
    keywords: [],
    allowedFiles: ['company.md'],
    maxKnowledgeLength: 400,
    allowPricing: false,
    responseType: 'unknown',
    priority: 1
  }
}

function extractSection(content: string, sectionTitle: string): string {
  const lines = content.split('\n')
  let inSection = false
  let sectionLines: string[] = []
  let sectionStart = -1
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.startsWith('## ') && line.includes(sectionTitle)) {
      inSection = true
      sectionStart = i
      sectionLines.push(line)
      continue
    }
    if (inSection) {
      if (line.startsWith('## ') && i > sectionStart) {
        break
      }
      sectionLines.push(line)
    }
  }
  
  return sectionLines.join('\n')
}

function buildSystemPrompt(
  intent: Intent, 
  knowledge: string, 
  userMessage: string, 
  persona: Persona,
  role: AIRole = 'SALES'
): string {
  const personaPrompt = getSystemPersonaPrompt(persona)
  
  return buildRolePrompt(
    role,
    personaPrompt,
    { responseType: intent.responseType },
    knowledge,
    userMessage
  )
}

export async function POST(req: Request) {
  try {
    const body: ReqBody = await req.json().catch(() => ({}))
    const userMessage = (body.message || '').trim()
    const explicitPersona = body.persona

    if (!userMessage) {
      return NextResponse.json({ 
        reply: 'สวัสดีค่ะ 😊 ยินดีต้อนรับสู่บริษัท แสน โซลูชั่น จำกัด มีอะไรให้ช่วยไหมคะ?' 
      }, { status: 400 })
    }

    const intentResult = detectIntent(userMessage)
    const detectedPersona = explicitPersona || intentResult.persona
    
    // ============================================================================
    // DETERMINISTIC ROLE SELECTION (BEFORE LLM CALL)
    // ============================================================================
    // Role MUST be selected before:
    // - Knowledge loading
    // - System prompt building
    // - LLM invocation
    // Uses: intent, confidence, flags only (deterministic)
    // ============================================================================
    const selectedRole: AIRole = body.role || selectRole({
      intent: intentResult.intent,
      confidence: body.confidence,
      flags: body.flags
    })
    
    // Map intent string to full Intent config for knowledge loading
    const intent = getIntentConfig(intentResult.intent)
    
    // Smart Handoff Detection
    const { shouldHandoff, getHandoffResponse } = await import('./handoff')
    const userMessageCount = body.messageCount || 1
    const confidence = body.confidence
    
    const handoffDecision = shouldHandoff({
      intent: intentResult.intent,
      confidence,
      userMessageCount,
      userMessage,
    })
    
    // If handoff is needed, return handoff response immediately
    if (handoffDecision.shouldHandoff) {
      const handoffResponse = getHandoffResponse(handoffDecision.reason)
      return NextResponse.json({
        reply: handoffResponse,
        intent: intentResult.intent,
        persona: detectedPersona,
        handoff: {
          status: 'requested',
          reason: handoffDecision.reason,
          requestedAt: new Date().toISOString(),
        },
        variant: 'none',
      })
    }
    
    // Legacy restricted check (keep for backward compatibility)
    if (intent.responseType === 'restricted') {
      return NextResponse.json({ 
        reply: 'กรณีนี้เป็นรายละเอียดเชิงลึก เจ้าหน้าที่จะช่วยแนะนำได้ตรงกับสถานการณ์มากกว่าค่ะ\nแนะนำติดต่อ 086-398-6889 หรือ zanhcpe@gmail.com นะคะ 😊',
        intent: intentResult.intent,
        persona: detectedPersona,
        handoff: {
          status: 'requested',
          reason: 'legal_inquiry',
          requestedAt: new Date().toISOString(),
        },
        variant: 'none',
      })
    }

    const fs = await import('fs/promises')
    const path = await import('path')
    const knowledgeDir = path.resolve(process.cwd(), 'app', 'knowledge')
    
    const knowledgeParts: string[] = []
    
    for (const filename of intent.allowedFiles) {
      try {
        const filePath = path.join(knowledgeDir, filename)
        const content = await fs.readFile(filePath, 'utf-8')
        if (content.trim()) {
          if (intent.extractSection) {
            const extracted = extractSection(content, intent.extractSection)
            if (extracted.trim()) {
              knowledgeParts.push(extracted.trim())
            }
          } else {
            knowledgeParts.push(content.trim())
          }
        }
      } catch (err) {
        console.error(`Error loading ${filename}:`, err)
      }
    }
    
    if (knowledgeParts.length === 0) {
      return NextResponse.json({ 
        reply: 'สวัสดีค่ะ มีอะไรให้ช่วยไหมคะ? กรุณาติดต่อ 086-398-6889 หรือ zanhcpe@gmail.com' 
      }, { status: 500 })
    }
    
    const knowledge = knowledgeParts.join('\n\n---\n\n')
    
    let trimmedKnowledge = knowledge
    if (knowledge.length > intent.maxKnowledgeLength) {
      trimmedKnowledge = knowledge.substring(0, intent.maxKnowledgeLength)
      const lastSection = trimmedKnowledge.lastIndexOf('\n##')
      if (lastSection > intent.maxKnowledgeLength * 0.5) {
        trimmedKnowledge = trimmedKnowledge.substring(0, lastSection)
      }
    }

    const systemPrompt = buildSystemPrompt(intent, trimmedKnowledge, userMessage, detectedPersona, selectedRole)

    const ollamaUrl = 'http://localhost:11434/api/generate'
    const payload = {
      model: 'mistral',
      prompt: systemPrompt,
      options: { 
        stream: false, 
        num_ctx: 1024,
        temperature: 0.2
      }
    }

    const res = await fetch(ollamaUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      console.error('Ollama error', res.status, text)
      return NextResponse.json({ reply: 'ขออภัยค่ะ เกิดข้อผิดพลาดจากระบบ กรุณาติดต่อ 086-398-6889 หรือ zanhcpe@gmail.com นะคะ' }, { status: 500 })
    }

    let reply = ''
    try {
      const responseText = await res.text()
      
      const lines = responseText.trim().split('\n').filter(line => line.trim())
      let finalResponse = ''
      let lastCompleteData: any = null
      
      for (const line of lines) {
        try {
          const data = JSON.parse(line.trim())
          if (data && typeof data === 'object') {
            if (data.response && typeof data.response === 'string') {
              finalResponse += data.response
            }
            if (data.done === true || data.done === false) {
              lastCompleteData = data
            }
          }
        } catch (parseError) {
          continue
        }
      }
      
      if (finalResponse) {
        reply = finalResponse.trim()
      } else if (lastCompleteData) {
        if (lastCompleteData.response && typeof lastCompleteData.response === 'string') {
          reply = lastCompleteData.response.trim()
        } else if (lastCompleteData.text && typeof lastCompleteData.text === 'string') {
          reply = lastCompleteData.text.trim()
        }
      }
      
      if (!reply && lines.length > 0) {
        try {
          const singleData = JSON.parse(lines[lines.length - 1].trim())
          if (singleData.response && typeof singleData.response === 'string') {
            reply = singleData.response.trim()
          }
        } catch (e) {
        }
      }
      
      if (!reply) {
        console.error('Could not extract reply from Ollama response. Lines:', lines.length)
        return NextResponse.json({ reply: 'ขออภัยค่ะ เกิดข้อผิดพลาดในการอ่านคำตอบ กรุณาติดต่อ 086-398-6889 หรือ zanhcpe@gmail.com นะคะ' }, { status: 500 })
      }
    } catch (e) {
      console.error('Error parsing Ollama response:', e)
      return NextResponse.json({ reply: 'ขออภัยค่ะ เกิดข้อผิดพลาด กรุณาติดต่อ 086-398-6889 หรือ zanhcpe@gmail.com นะคะ' }, { status: 500 })
    }

    if (!reply || reply.trim().length === 0) {
      console.error('Empty reply from Ollama')
      return NextResponse.json({ reply: 'ขออภัยค่ะ ไม่ได้รับคำตอบ กรุณาลองใหม่อีกครั้ง หรือติดต่อ 086-398-6889 นะคะ' }, { status: 500 })
    }

    const invalidPatterns = [
      /ฉันเป็นระบบ|ฉันเป็น AI|ฉันเป็นโทรศัพท์|ฉันเป็นแพลตฟอร์ม|ฉันเป็นแอป|ฉันเป็น[^ก-๙]*system|ฉันเป็น[^ก-๙]*platform/i,
      /https?:\/\/[^\s]+(?!seansolution\.co\.th)/i,
      /www\.[^\s]+(?!seansolution\.co\.th)/i,
      /\[website\]|\[contact\]|\[price\]|\[.*?\]/i,
      /placeholder|place holder/i
    ]
    
    for (const pattern of invalidPatterns) {
      if (pattern.test(reply)) {
        console.error('Detected invalid content in reply, redirecting')
        return NextResponse.json({ 
          reply: 'กรณีนี้แนะนำให้ติดต่อเจ้าหน้าที่ของบริษัทโดยตรงนะคะ โทร 086-398-6889 หรืออีเมล zanhcpe@gmail.com' 
        })
      }
    }

    const hasContactInfo = /086-398-6889|zanhcpe@gmail.com|ติดต่อ|โทร/i.test(reply)
    if (!hasContactInfo && reply.length > 15 && intent.responseType !== 'restricted') {
      reply += '\n\nสนใจสอบถามเพิ่มเติม ติดต่อ 086-398-6889 หรือ zanhcpe@gmail.com นะคะ 😊'
    }

    // ============================================================================
    // ROLE-BASED A/B TESTING
    // ============================================================================
    // Intent and persona remain IDENTICAL across variants
    // Only wording (CTA, emphasis) differs
    // ============================================================================
    let finalReply = reply
    let variant: 'A' | 'B' = 'A'
    
    if (intent.responseType === 'pricing' || intent.responseType === 'overview' || intent.responseType === 'greeting') {
      // Get user ID from request (session ID, user ID, or generate from IP)
      const userId = body.userId || body.sessionId || req.headers.get('x-forwarded-for') || 'anonymous'
      
      // Import role-based A/B testing functions
      const { assignVariant, applyRoleVariantToResponse } = await import('./role-ab-testing')
      
      // Assign variant deterministically (same user + same role + same response type = same variant)
      variant = assignVariant(userId, selectedRole, intent.responseType as 'pricing' | 'overview' | 'greeting')
      
      // Apply role-based variant to response (only changes wording, keeps intent/persona identical)
      finalReply = applyRoleVariantToResponse(reply, selectedRole, intent.responseType as 'pricing' | 'overview' | 'greeting', variant)
      
      // Log role-based A/B test metric (in production, store in database)
      console.log(JSON.stringify({
        type: 'role_ab_test_metric',
        role: selectedRole,
        variant,
        responseType: intent.responseType,
        userId,
        sessionId: body.sessionId,
        intent: intentResult.intent,
        persona: detectedPersona,
        // Intent and persona are IDENTICAL across variants
        timestamp: new Date().toISOString(),
      }))
    }

    return NextResponse.json({ 
      reply: finalReply,
      intent: intentResult.intent,
      persona: detectedPersona,
      role: selectedRole, // Include role in response for tracking
      variant: variant, // Include variant in response for tracking
      handoff: {
        status: 'none',
        reason: 'none',
      },
      confidence: confidence, // Include confidence if provided
    })
  } catch (err) {
    console.error('Unexpected error in /api/chat', err)
    return NextResponse.json({ reply: 'ขออภัยค่ะ เกิดข้อผิดพลาด กรุณาติดต่อ 086-398-6889 หรือ zanhcpe@gmail.com นะคะ' }, { status: 500 })
  }
}
