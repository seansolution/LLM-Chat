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
    id: 'services_overview',
    description: 'General service inquiries',
    keywords: [/สนใจ.*บริการ|บริการ.*อะไร|มี.*บริการ|ต้องการ.*บริการ|อยากรู้.*บริการ|service/i],
    allowedFiles: ['company.md', 'services.md'],
    maxKnowledgeLength: 800,
    allowPricing: true,
    responseType: 'overview',
    priority: 5
  },
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
  role: AIRole = 'SALES',
  conversationContext?: string
): string {
  const personaPrompt = getSystemPersonaPrompt(persona)
  
  return buildRolePrompt(
    role,
    personaPrompt,
    { responseType: intent.responseType },
    knowledge,
    userMessage,
    conversationContext
  )
}

export async function POST(req: Request) {
  const startTime = Date.now()
  try {
    const body: ReqBody = await req.json().catch(() => ({}))
    const userMessage = (body.message || '').trim()
    const explicitPersona = body.persona
    
    // Level 3: Get session ID for conversation tracking
    const sessionId = body.sessionId || req.headers.get('x-session-id') || `session-${Date.now()}`
    const userId = body.userId || req.headers.get('x-user-id')
    
    // Performance: Log request start
    console.log('[Performance] Request started', {
      sessionId,
      userMessage: userMessage.substring(0, 50),
      timestamp: new Date().toISOString(),
    })

    if (!userMessage) {
      return NextResponse.json({ 
        reply: 'สวัสดีค่ะ 😊 ยินดีต้อนรับสู่บริษัท แสน โซลูชั่น จำกัด มีอะไรให้ช่วยไหมคะ?' 
      }, { status: 400 })
    }

    // Level 3: Load conversation history
    const { 
      getConversation, 
      createConversation, 
      addMessage, 
      getConversationContext,
      summarizeConversation 
    } = await import('./conversation-storage')
    
    let conversation = getConversation(sessionId)
    if (!conversation) {
      conversation = createConversation(sessionId, userId)
    }
    
    // Level 3: Add user message to conversation history
    addMessage(sessionId, {
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString(),
    })

    const intentResult = detectIntent(userMessage)
    const detectedPersona = explicitPersona || intentResult.persona
    
    // Debug: Log intent detection
    console.log('[Intent Detection]', {
      userMessage,
      detectedIntent: intentResult.intent,
      persona: detectedPersona,
    })
    
    // Level 3: Get actual message count from conversation history
    const actualUserMessageCount = conversation.messages.filter(m => m.role === 'user').length
    
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
      confidence: body.confidence, // May be undefined, that's OK
      flags: body.flags
    })
    
    // Map intent string to full Intent config for knowledge loading
    const intent = getIntentConfig(intentResult.intent)
    
    // Debug: Log intent config
    console.log('[Intent Config]', {
      intentId: intent.id,
      responseType: intent.responseType,
      allowedFiles: intent.allowedFiles,
      maxKnowledgeLength: intent.maxKnowledgeLength,
    })
    
    // Smart Handoff Detection (use actual conversation history)
    // Skip handoff for greeting - always let LLM respond
    // Define confidence variable for later use
    const confidence = body.confidence // detectIntent doesn't return confidence
    
    if (intentResult.intent === 'greeting') {
      // Skip handoff check for greeting
    } else {
      const { shouldHandoff, getHandoffResponse } = await import('./handoff')
      
      const handoffDecision = shouldHandoff({
        intent: intentResult.intent,
        confidence,
        userMessageCount: actualUserMessageCount, // Use actual count from conversation
        userMessage,
      })
      
      // Debug: Log handoff decision
      console.log('[Handoff Decision]', {
        shouldHandoff: handoffDecision.shouldHandoff,
        reason: handoffDecision.reason,
        intent: intentResult.intent,
        confidence,
        userMessageCount: actualUserMessageCount,
      })
      
      // Only handoff immediately for user_requested or restricted_legal
      // For low_confidence, let LLM try first with conversation context
      if (handoffDecision.shouldHandoff && 
          (handoffDecision.reason === 'user_requested' || handoffDecision.reason === 'legal_inquiry')) {
        const handoffResponse = getHandoffResponse(handoffDecision.reason)
        
        // Level 3: Store handoff response in conversation history
        addMessage(sessionId, {
          role: 'assistant',
          content: handoffResponse,
          timestamp: new Date().toISOString(),
          intent: intentResult.intent,
          persona: detectedPersona,
          metadata: {
            role: selectedRole,
            handoff: true,
          },
        })
        
        return NextResponse.json({
          reply: handoffResponse,
          intent: intentResult.intent,
          persona: detectedPersona,
          role: selectedRole,
          handoff: {
            status: 'requested',
            reason: handoffDecision.reason,
            requestedAt: new Date().toISOString(),
          },
          variant: 'none',
          sessionId: sessionId,
          messageCount: conversation.messages.length,
        })
      }
    }
    
    // Legacy restricted check (keep for backward compatibility)
    // Skip for greeting - always let LLM respond
    if (intent.responseType === 'restricted' && intentResult.intent !== 'greeting') {
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
        sessionId: sessionId,
        messageCount: conversation.messages.length,
      })
    }

    // Performance: Log before knowledge loading
    const knowledgeStartTime = Date.now()
    
    const fs = await import('fs/promises')
    const path = await import('path')
    const knowledgeDir = path.resolve(process.cwd(), 'app', 'knowledge')
    
    // Load knowledge files in parallel for better performance
    const fileReadPromises = intent.allowedFiles.map(async (filename) => {
      try {
        const filePath = path.join(knowledgeDir, filename)
        const content = await fs.readFile(filePath, 'utf-8')
        if (content.trim()) {
          if (intent.extractSection) {
            const extracted = extractSection(content, intent.extractSection)
            if (extracted.trim()) {
              return extracted.trim()
            }
          } else {
            return content.trim()
          }
        }
        return null
      } catch (err) {
        console.error(`Error loading ${filename}:`, err)
        return null
      }
    })
    
    // Wait for all files to load in parallel
    const loadedContents = await Promise.all(fileReadPromises)
    const knowledgeParts = loadedContents.filter((content): content is string => content !== null)
    
    // Performance: Log knowledge loading time
    const knowledgeLoadTime = Date.now() - knowledgeStartTime
    console.log('[Performance] Knowledge loaded', {
      loadTime: `${knowledgeLoadTime}ms`,
      filesLoaded: knowledgeParts.length,
      totalLength: knowledgeParts.join('\n\n---\n\n').length,
    })
    
    // Debug: Log knowledge loading
    console.log('[Knowledge Loading]', {
      intent: intent.id,
      allowedFiles: intent.allowedFiles,
      loadedFiles: knowledgeParts.length,
      knowledgeLength: knowledgeParts.join('\n\n---\n\n').length,
    })
    
    if (knowledgeParts.length === 0) {
      console.error('[Knowledge Error] No knowledge files loaded for intent:', intent.id)
      // For greeting, return friendly message instead of error
      if (intent.id === 'greeting') {
        return NextResponse.json({ 
          reply: 'สวัสดีค่ะ 😊 ยินดีต้อนรับสู่บริษัท แสน โซลูชั่น จำกัด มีอะไรให้ช่วยไหมคะ?',
          intent: intentResult.intent,
          persona: detectedPersona,
          role: selectedRole,
          sessionId: sessionId,
          messageCount: conversation.messages.length,
        })
      }
      return NextResponse.json({ 
        reply: 'สวัสดีค่ะ มีอะไรให้ช่วยไหมคะ? กรุณาติดต่อ 086-398-6889 หรือ zanhcpe@gmail.com' 
      }, { status: 500 })
    }
    
    const knowledge = knowledgeParts.join('\n\n---\n\n')
    
    // Performance: Trim knowledge more aggressively for faster processing
    let trimmedKnowledge = knowledge
    if (knowledge.length > intent.maxKnowledgeLength) {
      // Trim to 90% of max length for faster LLM processing
      const targetLength = Math.floor(intent.maxKnowledgeLength * 0.9)
      trimmedKnowledge = knowledge.substring(0, targetLength)
      const lastSection = trimmedKnowledge.lastIndexOf('\n##')
      if (lastSection > targetLength * 0.5) {
        trimmedKnowledge = trimmedKnowledge.substring(0, lastSection)
      }
    }

    // Level 3: Get conversation context
    const conversationContext = getConversationContext(sessionId, 10) // Last 10 messages
    
    // Level 3: Check if conversation is too long and needs summarization
    const summary = summarizeConversation(sessionId, 20)
    const contextToUse = summary 
      ? `\n\n=== สรุปบทสนทนาก่อนหน้า ===\n${summary.summary}\n=== จบสรุป ===\n${getConversationContext(sessionId, 10)}`
      : conversationContext
    
    // Debug: Log conversation context
    console.log('[Conversation Context]', {
      hasContext: contextToUse.length > 0,
      contextLength: contextToUse.length,
      messageCount: conversation.messages.length,
    })
    
    const systemPrompt = buildSystemPrompt(intent, trimmedKnowledge, userMessage, detectedPersona, selectedRole, contextToUse)

    const ollamaUrl = 'http://localhost:11434/api/generate'
    const payload = {
      model: 'mistral',
      prompt: systemPrompt,
      options: { 
        stream: false, 
        num_ctx: 1024,
        temperature: 0.2,
        // Performance optimizations
        num_predict: 200, // Limit response length to ~200 tokens (faster)
        top_p: 0.9, // Nucleus sampling (faster than top_k)
        repeat_penalty: 1.1, // Prevent repetition
      }
    }

    // Performance: Log before Ollama call
    const ollamaStartTime = Date.now()
    console.log('[Performance] Calling Ollama API', {
      intent: intentResult.intent,
      promptLength: systemPrompt.length,
      timestamp: new Date().toISOString(),
    })
    
    // Add timeout to Ollama API call (30 seconds)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout
    
    const res = await fetch(ollamaUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    }).finally(() => {
      clearTimeout(timeoutId)
    })
    
    // Performance: Log Ollama response time
    const ollamaResponseTime = Date.now() - ollamaStartTime
    console.log('[Performance] Ollama API response', {
      responseTime: `${ollamaResponseTime}ms`,
      status: res.status,
      timestamp: new Date().toISOString(),
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
      
      // Debug: Log raw reply from LLM
      console.log('[LLM Reply]', {
        intent: intentResult.intent,
        replyLength: reply.length,
        replyPreview: reply.substring(0, 200),
      })
      
      // Level 3: Add assistant response to conversation history
      addMessage(sessionId, {
        role: 'assistant',
        content: reply,
        timestamp: new Date().toISOString(),
        intent: intentResult.intent,
        persona: detectedPersona,
        metadata: {
          role: selectedRole,
          variant: 'A', // Will be updated after A/B testing
        },
      })
    } catch (e) {
      console.error('Error parsing Ollama response:', e)
      return NextResponse.json({ reply: 'ขออภัยค่ะ เกิดข้อผิดพลาด กรุณาติดต่อ 086-398-6889 หรือ zanhcpe@gmail.com นะคะ' }, { status: 500 })
    }

    if (!reply || reply.trim().length === 0) {
      console.error('Empty reply from Ollama')
      return NextResponse.json({ reply: 'ขออภัยค่ะ ไม่ได้รับคำตอบ กรุณาลองใหม่อีกครั้ง หรือติดต่อ 086-398-6889 นะคะ' }, { status: 500 })
    }

    // Level 3: Update assistant response in conversation history (if not already updated)
    const lastMessage = conversation.messages[conversation.messages.length - 1]
    if (lastMessage && lastMessage.role === 'assistant' && lastMessage.content === reply) {
      // Already updated, skip
    } else {
      // Update or add assistant response
      if (lastMessage && lastMessage.role === 'assistant') {
        lastMessage.content = reply
      } else {
        addMessage(sessionId, {
          role: 'assistant',
          content: reply,
          timestamp: new Date().toISOString(),
          intent: intentResult.intent,
          persona: detectedPersona,
          metadata: {
            role: selectedRole,
            variant: 'A',
          },
        })
      }
    }

    const invalidPatterns = [
      /ฉันเป็นระบบ|ฉันเป็น AI|ฉันเป็นโทรศัพท์|ฉันเป็นแพลตฟอร์ม|ฉันเป็นแอป|ฉันเป็น[^ก-๙]*system|ฉันเป็น[^ก-๙]*platform/i,
      /https?:\/\/[^\s]+(?!seansolution\.co\.th)/i,
      /www\.[^\s]+(?!seansolution\.co\.th)/i,
      /\[website\]|\[contact\]|\[price\]|\[.*?\]/i,
      /placeholder|place holder/i
    ]
    
    // Check for incorrect company name
    const incorrectCompanyNames = [
      /ซีแอนซ์.*สนลูชั่น/i,
      /Sean Solution/i,
      /ซีแอนซ์.*Sean/i,
      /ซีแอนซ์ สนลูชั่น.*Sean Solution/i,
    ]
    
    for (const pattern of incorrectCompanyNames) {
      if (pattern.test(reply)) {
        console.warn('[Company Name Check] Detected incorrect company name', {
          matchedPattern: pattern.toString(),
          replyPreview: reply.substring(0, 200),
        })
        // Replace incorrect company names with correct one
        reply = reply.replace(/ซีแอนซ์.*?สนลูชั่น.*?Sean Solution/gi, 'บริษัท แสน โซลูชั่น จำกัด')
        reply = reply.replace(/ซีแอนซ์.*?สนลูชั่น/gi, 'บริษัท แสน โซลูชั่น จำกัด')
        reply = reply.replace(/Sean Solution/gi, 'บริษัท แสน โซลูชั่น จำกัด')
        console.log('[Company Name Check] Fixed company name to "บริษัท แสน โซลูชั่น จำกัด"')
      }
    }
    
    // Check if reply contains English (should be Thai only if user asked in Thai)
    const hasEnglish = /[A-Za-z]{3,}/.test(reply) && !/THB|VAT|DBD|BOI|HR/i.test(reply)
    const userAskedInThai = /[ก-๙]/.test(userMessage)
    
    if (hasEnglish && userAskedInThai) {
      console.warn('[Language Check] Reply contains English but user asked in Thai', {
        replyPreview: reply.substring(0, 200),
        userMessage,
      })
      // Remove English sentences and keep only Thai
      const thaiOnlyReply = reply
        .split(/\n+/)
        .filter(line => {
          // Keep line if it's mostly Thai or contains contact info
          const thaiChars = (line.match(/[ก-๙]/g) || []).length
          const totalChars = line.replace(/\s/g, '').length
          return thaiChars > totalChars * 0.3 || /086-398-6889|zanhcpe@gmail\.com|ติดต่อ|โทร/i.test(line)
        })
        .join('\n')
        .trim()
      
      if (thaiOnlyReply.length > 20) {
        reply = thaiOnlyReply
        console.log('[Language Check] Fixed reply to Thai only')
      }
    }
    
    for (const pattern of invalidPatterns) {
      if (pattern.test(reply)) {
        console.error('[Safety Gate] Detected invalid content in reply', {
          pattern: pattern.toString(),
          reply: reply.substring(0, 200),
          intent: intentResult.intent,
          matchedPattern: pattern.toString(),
        })
        // For greeting and services_overview, always fix instead of redirecting
        if (intentResult.intent === 'greeting') {
          console.log('[Safety Gate] Greeting intent - fixing reply instead of redirecting')
          reply = 'สวัสดีค่ะ 😊 ยินดีต้อนรับสู่บริษัท แสน โซลูชั่น จำกัด มีอะไรให้ช่วยไหมคะ?'
          // Update conversation history with fixed reply
          const lastMessage = conversation.messages[conversation.messages.length - 1]
          if (lastMessage && lastMessage.role === 'assistant') {
            lastMessage.content = reply
          }
        } else if (intentResult.intent === 'services_overview' || intentResult.intent === 'company_overview') {
          console.log('[Safety Gate] Services/company overview intent - fixing reply instead of redirecting')
          // Remove invalid URLs and fix reply
          reply = reply.replace(/https?:\/\/[^\s]+/gi, '').replace(/www\.[^\s]+/gi, '').trim()
          
          // Extract service information from knowledge (prefer services.md content)
          const servicesContent = knowledge.includes('บริการ HR') || knowledge.includes('บริการด้าน') 
            ? knowledge.split(/บริการ[^ก-๙]*/i)[1]?.substring(0, 500) || ''
            : ''
          
          if (servicesContent.length > 100) {
            // Use knowledge content if available
            reply = `บริษัท แสน โซลูชั่น จำกัด มีบริการดังนี้:\n\n${servicesContent}\n\nสนใจสอบถามรายละเอียดเพิ่มเติม ติดต่อ 086-398-6889 หรือ zanhcpe@gmail.com นะคะ 😊`
          } else if (reply.length < 100 || /Seansolution|seansolution/i.test(reply)) {
            // Default fallback if reply is too short or contains incorrect company name
            reply = 'บริษัท แสน โซลูชั่น จำกัด มีบริการดังนี้:\n\n- บริการจดทะเบียนบริษัท (ราคาเริ่มต้น 25,000 บาท)\n- บริการบัญชีและภาษี (ราคาเริ่มต้น 2,500 บาท/เดือน)\n- บริการ HR และเงินเดือน (ราคาเริ่มต้น 2,500 บาท/เดือน)\n\nสนใจสอบถามรายละเอียดเพิ่มเติม ติดต่อ 086-398-6889 หรือ zanhcpe@gmail.com นะคะ 😊'
          }
          // Ensure reply ends with contact info if not present
          if (!/086-398-6889|zanhcpe@gmail\.com/.test(reply)) {
            reply += '\n\nสนใจสอบถามรายละเอียดเพิ่มเติม ติดต่อ 086-398-6889 หรือ zanhcpe@gmail.com นะคะ 😊'
          }
          // Update conversation history with fixed reply
          const lastMessage = conversation.messages[conversation.messages.length - 1]
          if (lastMessage && lastMessage.role === 'assistant') {
            lastMessage.content = reply
          }
        } else {
          return NextResponse.json({ 
            reply: 'กรณีนี้แนะนำให้ติดต่อเจ้าหน้าที่ของบริษัทโดยตรงนะคะ โทร 086-398-6889 หรืออีเมล zanhcpe@gmail.com',
            intent: intentResult.intent,
            persona: detectedPersona,
            role: selectedRole,
            sessionId: sessionId,
            messageCount: conversation.messages.length,
          })
        }
      }
    }
    
    // Check if reply contains handoff message (LLM shouldn't generate this for services_overview)
    const handoffPatterns = [
      /กรณีนี้แนะนำให้ติดต่อเจ้าหน้าที่ของบริษัทโดยตรง/i,
      /กรณีนี้เป็นรายละเอียดเชิงลึก.*เจ้าหน้าที่จะช่วยแนะนำ/i,
      /ขออภัย.*ยังไม่แน่ใจ.*คำตอบ.*ถูกต้อง/i,
    ]
    
    for (const pattern of handoffPatterns) {
      if (pattern.test(reply)) {
        console.warn('[Handoff Check] LLM generated handoff message for non-handoff intent', {
          intent: intentResult.intent,
          replyPreview: reply.substring(0, 200),
        })
        // For services_overview and company_overview, regenerate response instead of keeping handoff
        if (intentResult.intent === 'services_overview' || intentResult.intent === 'company_overview') {
          console.log('[Handoff Check] Services/company overview intent - fixing reply to list services')
          // Try to extract service information from knowledge
          const servicesMatch = knowledge.match(/บริการ[^ก-๙]*([ก-๙]{20,300})/i)
          if (servicesMatch && servicesMatch[1]) {
            reply = `บริษัท แสน โซลูชั่น จำกัด มีบริการดังนี้:\n\n${servicesMatch[1].substring(0, 400)}\n\nสนใจสอบถามรายละเอียดเพิ่มเติม ติดต่อ 086-398-6889 หรือ zanhcpe@gmail.com นะคะ 😊`
          } else {
            // Default fallback
            reply = 'บริษัท แสน โซลูชั่น จำกัด มีบริการดังนี้:\n\n- บริการจดทะเบียนบริษัท (ราคาเริ่มต้น 25,000 บาท)\n- บริการบัญชีและภาษี (ราคาเริ่มต้น 2,500 บาท/เดือน)\n- บริการ HR และเงินเดือน (ราคาเริ่มต้น 2,500 บาท/เดือน)\n\nสนใจสอบถามรายละเอียดเพิ่มเติม ติดต่อ 086-398-6889 หรือ zanhcpe@gmail.com นะคะ 😊'
          }
          // Update conversation history with fixed reply
          const lastMessage = conversation.messages[conversation.messages.length - 1]
          if (lastMessage && lastMessage.role === 'assistant') {
            lastMessage.content = reply
          }
        }
      }
    }

    // Check if reply already has CTA (not just contact info, but actual CTA phrase)
    const hasCTA = /สนใจสอบถาม|ต้องการให้เจ้าหน้าที่ช่วย|พร้อมเริ่มต้น|ต้องการคำแนะนำเฉพาะ|มีคำถามเพิ่มเติม|หากต้องการสอบถาม/i.test(reply)
    const hasContactInfo = /086-398-6889|zanhcpe@gmail.com|ติดต่อ|โทร/i.test(reply)
    
    // Only add CTA if:
    // 1. Reply doesn't already have a CTA phrase
    // 2. Reply doesn't have contact info
    // 3. Reply is longer than 15 chars
    // 4. Not a restricted response
    if (!hasCTA && !hasContactInfo && reply.length > 15 && intent.responseType !== 'restricted') {
      reply += '\n\nสนใจสอบถามเพิ่มเติม ติดต่อ 086-398-6889 หรือ zanhcpe@gmail.com นะคะ 😊'
    }

    // ============================================================================
    // ROLE-BASED A/B TESTING + AUTO-OPTIMIZATION (Level 4)
    // ============================================================================
    // Intent and persona remain IDENTICAL across variants
    // Only wording (CTA, emphasis) differs
    // Level 4: Auto-optimization selects winning variant automatically
    // ============================================================================
    let finalReply = reply
    let variant: 'A' | 'B' = 'A'
    
    if (intent.responseType === 'pricing' || intent.responseType === 'overview' || intent.responseType === 'greeting') {
      // Get user ID from request (session ID, user ID, or generate from IP)
      const userId = body.userId || body.sessionId || req.headers.get('x-forwarded-for') || 'anonymous'
      const sessionId = body.sessionId || userId
      
      // Import role-based A/B testing and auto-optimization functions
      const { assignVariant, applyRoleVariantToResponse } = await import('./role-ab-testing')
      const { getOptimizedVariant } = await import('./auto-optimization')
      const { loadOptimizationDecision } = await import('./optimization-storage')
      
      // Level 4: Load optimization decision (auto-optimization)
      const optimizationDecision = await loadOptimizationDecision(
        selectedRole,
        intent.responseType as 'pricing' | 'overview' | 'greeting'
      )
      
      // Level 4: Get optimized variant (uses winning variant if available)
      variant = await getOptimizedVariant(
        userId,
        selectedRole,
        intent.responseType as 'pricing' | 'overview' | 'greeting',
        optimizationDecision
      )
      
      // Apply role-based variant to response (only changes wording, keeps intent/persona identical)
      finalReply = applyRoleVariantToResponse(reply, selectedRole, intent.responseType as 'pricing' | 'overview' | 'greeting', variant)
      
      // Level 3: Update conversation history with final reply (including variant)
      const conversation = getConversation(sessionId)
      if (conversation && conversation.messages.length > 0) {
        const lastMessage = conversation.messages[conversation.messages.length - 1]
        if (lastMessage.role === 'assistant') {
          lastMessage.content = finalReply
          lastMessage.metadata = {
            ...lastMessage.metadata,
            variant,
            role: selectedRole,
          }
        }
      }
      
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

    // Generate log ID for feedback collection
    const userIdForLog = body.userId || body.sessionId || req.headers.get('x-forwarded-for') || 'anonymous'
    const sessionIdForLog = body.sessionId || userIdForLog
    const logId = `${sessionIdForLog}-${Date.now()}`
    
    // Level 3: Get conversation message count (reuse conversation variable from line 265)
    const messageCount = conversation?.messages.length || 0
    
      // Performance: Log total response time
      const totalTime = Date.now() - startTime
      console.log('[Performance] Request completed', {
        totalTime: `${totalTime}ms`,
        intent: intentResult.intent,
        sessionId,
        timestamp: new Date().toISOString(),
      })
      
      // Level 4: Include feedback collection info in response
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
      // Level 3: Multi-turn conversation support
      sessionId: sessionId, // Return session ID for frontend to use
      messageCount: messageCount, // Current message count in conversation
      // Level 4: Feedback collection support
      feedbackEnabled: true, // Indicate feedback is available
      feedbackEndpoint: '/api/chat/feedback', // Feedback API endpoint
      logId: logId, // Log ID for feedback collection
      // Performance metrics
      _performance: {
        totalTime: `${totalTime}ms`,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (err) {
    console.error('Unexpected error in /api/chat', err)
    return NextResponse.json({ reply: 'ขออภัยค่ะ เกิดข้อผิดพลาด กรุณาติดต่อ 086-398-6889 หรือ zanhcpe@gmail.com นะคะ' }, { status: 500 })
  }
}
