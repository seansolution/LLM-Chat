# Test Cases & Golden Responses

## Test Case 1: Greeting

**Input:** `สวัสดี`

**Expected Intent:** `greeting`

**Expected Response Behavior:**
- Friendly greeting in Thai
- Introduces as staff of Sean Solution
- Invites questions about services
- Includes contact info

**Golden Response:**
```
สวัสดีค่ะ 😊 ยินดีต้อนรับสู่บริษัท แสน โซลูชั่น จำกัด 
มีอะไรให้ช่วยไหมคะ? เรามีบริการด้าน HR บัญชี และจดทะเบียนบริษัทค่ะ
สนใจสอบถามเพิ่มเติม ติดต่อ 086-398-6889 หรือ zanhcpe@gmail.com นะคะ
```

**Forbidden Behaviors:**
- ❌ Claiming to be AI/system/platform
- ❌ Using placeholders
- ❌ Inventing URLs or contacts

---

## Test Case 2: Company Registration Pricing

**Input:** `จดทะเบียนบจก ราคาเท่าไหร่`

**Expected Intent:** `company_registration_pricing`

**Expected Response Behavior:**
- States exact price: 25,000 THB (one-time)
- Mentions timeline: 1-2 weeks
- Clear service name
- Soft CTA

**Golden Response:**
```
จัดตั้งบริษัทจำกัด (บจก)
ค่าบริการอยู่ที่ 25,000 บาท (ครั้งเดียว)
ใช้เวลาประมาณ 1-2 สัปดาห์

ครอบคลุมการตรวจชื่อ จัดทำเอกสาร จดทะเบียนที่ DBD และขอเลขผู้เสียภาษีค่ะ
สนใจสอบถามเพิ่มเติม ติดต่อ 086-398-6889 หรือ zanhcpe@gmail.com นะคะ 😊
```

**Forbidden Behaviors:**
- ❌ Avoiding price even though it exists
- ❌ Explaining legal procedures
- ❌ Using placeholders like [price]

---

## Test Case 3: Accounting Pricing

**Input:** `บัญชีราคาเท่าไหร่`

**Expected Intent:** `accounting_pricing`

**Expected Response Behavior:**
- Lists accounting packages with prices
- Mentions suitable for whom
- Clear monthly/one-time distinction

**Golden Response:**
```
บริการบัญชีมีหลายแพ็กเกจค่ะ:

- Accounting Micro: 2,500 บาท/เดือน (เหมาะสำหรับธุรกิจที่เพิ่งเริ่มต้น)
- Accounting SME: 6,000 บาท/เดือน (เหมาะสำหรับ SME ที่จด VAT แล้ว)
- Accounting Corporate: 12,000 บาท/เดือน (เหมาะสำหรับบริษัทขนาดใหญ่)

เจ้าหน้าที่ช่วยดูให้ตรงกับธุรกิจของคุณได้เลยค่ะ
สนใจสอบถามเพิ่มเติม ติดต่อ 086-398-6889 หรือ zanhcpe@gmail.com นะคะ 😊
```

**Forbidden Behaviors:**
- ❌ Explaining tax calculation procedures
- ❌ Describing VAT filing steps
- ❌ Using technical jargon

---

## Test Case 4: HR Pricing

**Input:** `hr ราคาเท่าไหร่`

**Expected Intent:** `hr_pricing`

**Expected Response Behavior:**
- Lists HR packages with prices
- Mentions employee count limits
- Clear monthly pricing

**Golden Response:**
```
บริการ HR มีหลายแพ็กเกจค่ะ:

- HR Starter: 2,500 บาท/เดือน (พนักงานไม่เกิน 10 คน)
- HR Growth: 6,500 บาท/เดือน (พนักงาน 11-30 คน)
- HR Professional: 12,000 บาท/เดือน (พนักงาน 31-60 คน)
- HR Enterprise: 20,000 บาท/เดือน (พนักงาน 61-100 คน)

ราคาเริ่มต้นที่ 2,500 บาท/เดือนค่ะ
สนใจสอบถามเพิ่มเติม ติดต่อ 086-398-6889 หรือ zanhcpe@gmail.com นะคะ 😊
```

**Forbidden Behaviors:**
- ❌ Explaining labor law procedures
- ❌ Describing payroll calculation steps
- ❌ Using legal terminology

---

## Test Case 5: Restricted Legal Question

**Input:** `ขั้นตอนการจดทะเบียนบริษัทเป็นอย่างไร`

**Expected Intent:** `restricted_legal`

**Expected Response Behavior:**
- Immediate redirect to staff
- No explanation of procedures
- Polite, professional tone

**Golden Response:**
```
กรณีนี้เป็นรายละเอียดเชิงลึก เจ้าหน้าที่จะช่วยแนะนำได้ตรงกับสถานการณ์มากกว่าค่ะ
แนะนำติดต่อ 086-398-6889 หรือ zanhcpe@gmail.com นะคะ 😊
```

**Forbidden Behaviors:**
- ❌ Explaining step-by-step procedures
- ❌ Describing legal processes
- ❌ Providing detailed instructions

---

## Test Case 6: Company Overview

**Input:** `บริษัทอยู่ที่ไหน`

**Expected Intent:** `company_overview`

**Expected Response Behavior:**
- Provides address from company.md
- Includes contact info
- Friendly, concise

**Golden Response:**
```
บริษัท แสน โซลูชั่น จำกัด อยู่ที่
92/474 หมู่ที่ 8 ตำบลราชาเทวะ อำเภอบางพลี จังหวัดสมุทรปราการ 10540

ติดต่อได้ที่:
- โทร: 086-398-6889
- อีเมล: zanhcpe@gmail.com
- เว็บไซต์: https://www.seansolution.co.th

มีอะไรให้ช่วยเพิ่มเติมไหมคะ? 😊
```

**Forbidden Behaviors:**
- ❌ Inventing addresses
- ❌ Using placeholder text
- ❌ Claiming to be a system

---

## Test Case 7: Generic Pricing

**Input:** `ราคาเท่าไหร่`

**Expected Intent:** `pricing_generic`

**Expected Response Behavior:**
- Provides overview of service pricing
- Mentions multiple service categories
- Invites to contact for specific pricing

**Golden Response:**
```
เรามีบริการหลายประเภทค่ะ:

- บริการ HR: เริ่มต้นที่ 2,500 บาท/เดือน
- บริการบัญชี: เริ่มต้นที่ 2,500 บาท/เดือน
- บริการจดทะเบียน: เริ่มต้นที่ 15,000 บาท (ครั้งเดียว)

เจ้าหน้าที่ช่วยดูให้ตรงกับธุรกิจของคุณได้เลยค่ะ
สนใจสอบถามเพิ่มเติม ติดต่อ 086-398-6889 หรือ zanhcpe@gmail.com นะคะ 😊
```

**Forbidden Behaviors:**
- ❌ Avoiding all prices
- ❌ Using vague pricing ranges
- ❌ Redirecting unnecessarily

---

## Test Case 8: Unknown/Expert Question

**Input:** `หจก vs บจก ต่างกันอย่างไร`

**Expected Intent:** `unknown_or_expert`

**Expected Response Behavior:**
- Immediate redirect
- No comparison explanation
- Professional tone

**Golden Response:**
```
กรณีนี้เป็นรายละเอียดเชิงลึก เจ้าหน้าที่จะช่วยแนะนำได้ตรงกับสถานการณ์มากกว่าค่ะ
แนะนำติดต่อ 086-398-6889 หรือ zanhcpe@gmail.com นะคะ 😊
```

**Forbidden Behaviors:**
- ❌ Explaining comparisons
- ❌ Providing detailed differences
- ❌ Using glossary terms

---

## Performance Requirements

- Response time: < 3 seconds
- Context size: <= 1024 tokens
- Temperature: 0.2 (deterministic)
- No streaming
- All responses must include CTA (except restricted)

---

## Validation Rules

All responses must pass:
1. ✅ No AI/system/platform claims
2. ✅ No invented URLs or contacts
3. ✅ No placeholders
4. ✅ Contact info present (except restricted)
5. ✅ Thai language, polite tone
6. ✅ 2-4 sentences max (unless pricing list)
7. ✅ Sales-oriented wording
