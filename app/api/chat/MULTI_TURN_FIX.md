# Multi-turn Conversation Fix

## ปัญหาที่พบ

1. **AI ตอบเหมือนกันทั้งสองครั้ง** - "กรณีนี้แนะนำให้ติดต่อเจ้าหน้าที่..."
2. **Context retention ไม่ทำงาน** - ไม่ได้ใช้ conversation history
3. **Intent detection ไม่เจอ** - "สนใจบริการ" detect เป็น "unknown"

## การแก้ไข

### 1. เพิ่ม Intent Detection สำหรับ "สนใจบริการ"

**File:** `app/api/chat/intent.ts`

เพิ่ม intent rule:
```typescript
{
  intent: "services_overview",
  persona: "REGISTRATION",
  keywords: [
    "สนใจ",
    "บริการ",
    "service",
    "มีอะไร",
    "บริการอะไร",
    ...
  ],
}
```

**File:** `app/api/chat/route.ts`

เพิ่ม intent taxonomy:
```typescript
{
  id: 'services_overview',
  description: 'General service inquiries',
  keywords: [/สนใจ.*บริการ|บริการ.*อะไร|มี.*บริการ|ต้องการ.*บริการ|อยากรู้.*บริการ|service/i],
  allowedFiles: ['company.md', 'services.md'],
  maxKnowledgeLength: 800,
  allowPricing: true,
  responseType: 'overview',
  priority: 5
}
```

### 2. ปรับปรุง Conversation Context

**File:** `app/api/chat/conversation-storage.ts`

- Exclude current user message จาก context (เพราะมันจะถูก include ใน prompt แล้ว)
- เพิ่ม note เพื่อบอก LLM ให้ใช้ context

```typescript
export function getConversationContext(
  sessionId: string,
  maxMessages: number = 10
): string {
  const history = getConversationHistory(sessionId, maxMessages)
  
  // Exclude current user message (last message)
  const contextMessages = history.slice(0, -1)
  
  if (contextMessages.length === 0) {
    return ''
  }
  
  const formatted = contextMessages.map((msg, index) => {
    const role = msg.role === 'user' ? 'ผู้ใช้' : 'AI'
    return `${index + 1}. ${role}: ${msg.content}`
  }).join('\n')
  
  return `\n\n=== บทสนทนาก่อนหน้า ===\n${formatted}\n=== จบบทสนทนาก่อนหน้า ===\n\nหมายเหตุ: ใช้บริบทจากบทสนทนาก่อนหน้าเพื่อตอบคำถามปัจจุบันให้สอดคล้องและต่อเนื่อง`
}
```

### 3. ปรับปรุง Handoff Logic

**File:** `app/api/chat/route.ts`

- ใช้ actual message count จาก conversation history
- Handoff เฉพาะกรณี `user_requested` หรือ `legal_inquiry` เท่านั้น
- สำหรับ `low_confidence` ให้ LLM ลองตอบก่อน (ด้วย conversation context)
- เก็บ handoff response ใน conversation history

### 4. ปรับปรุง Message Storage

**File:** `app/api/chat/route.ts`

- เก็บ user message ก่อน detect intent
- เก็บ assistant response หลังจากได้ reply จาก LLM
- Update conversation history เมื่อมี variant (A/B testing)

## ผลลัพธ์ที่คาดหวัง

1. **"สวัสดี"** → Detect เป็น `greeting` → Load `company.md` → ตอบทักทาย
2. **"สนใจบริการ"** → Detect เป็น `services_overview` → Load `company.md` + `services.md` → Include conversation context → ตอบเกี่ยวกับบริการ

## Testing

ทดสอบด้วย:
1. ส่ง "สวัสดี" → ควรได้คำตอบทักทาย
2. ส่ง "สนใจบริการ" → ควรได้คำตอบเกี่ยวกับบริการ (ไม่ใช่ handoff message)
3. ส่ง "ราคาเท่าไหร่" → ควรได้คำตอบเกี่ยวกับราคา (ใช้ context จากข้อความก่อนหน้า)
