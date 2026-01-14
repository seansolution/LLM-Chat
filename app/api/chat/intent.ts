export type Persona = "HR" | "ACCOUNTING" | "REGISTRATION"

export interface IntentResult {
  intent: string;
  persona: Persona;
}

export const INTENT_RULES = [
  // GREETING (highest priority - check first)
  {
    intent: "greeting",
    persona: "REGISTRATION",
    keywords: [
      "สวัสดี",
      "hello",
      "hi",
      "หวัดดี",
      "ดี",
      "สบายดี",
      "hey"
    ],
  },
  
  // REGISTRATION
  {
    intent: "company_registration_pricing",
    persona: "REGISTRATION",
    keywords: [
      "เปิดบริษัท",
      "จดทะเบียน",
      "บจก",
      "บริษัทจำกัด",
      "ค่าใช้จ่าย",
      "ราคา",
      "กี่บาท"
    ],
  },

  // ACCOUNTING
  {
    intent: "accounting_pricing",
    persona: "ACCOUNTING",
    keywords: [
      "ทำบัญชี",
      "บัญชี",
      "ภาษี",
      "ยื่นภาษี",
      "vat",
      "งบการเงิน"
    ],
  },

  // HR
  {
    intent: "hr_pricing",
    persona: "HR",
    keywords: [
      "hr",
      "พนักงาน",
      "เงินเดือน",
      "สลิปเงินเดือน",
      "ประกันสังคม",
      "เลิกจ้าง",
      "สัญญาจ้าง"
    ],
  },
  
  // GENERAL SERVICES (catch-all for service inquiries)
  {
    intent: "services_overview",
    persona: "REGISTRATION",
    keywords: [
      "สนใจ",
      "บริการ",
      "service",
      "มีอะไร",
      "บริการอะไร",
      "ทำอะไร",
      "ช่วยอะไร",
      "ต้องการ",
      "อยากรู้"
    ],
  },
] as const;

export function detectIntent(message: string): IntentResult {
  const text = message.toLowerCase();

  for (const rule of INTENT_RULES) {
    if (rule.keywords.some(k => text.includes(k))) {
      return {
        intent: rule.intent,
        persona: rule.persona,
      };
    }
  }

  return {
    intent: "unknown",
    persona: "REGISTRATION", // default persona (ฝ่ายขาย)
  };
}

export function getSystemPersonaPrompt(persona: Persona): string {
  switch (persona) {
    case "REGISTRATION":
      return "คุณคือแอดมินฝ่ายขายด้านการจดทะเบียนบริษัท";
    case "ACCOUNTING":
      return "คุณคือแอดมินฝ่ายขายด้านบัญชีและภาษี";
    case "HR":
      return "คุณคือแอดมินฝ่ายขายด้าน HR และเงินเดือน";
  }
}
