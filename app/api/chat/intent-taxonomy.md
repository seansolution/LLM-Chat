# Intent Taxonomy

## Intent Classification System

### Priority System
Intents are matched by priority (higher number = higher priority). When multiple intents match, the highest priority intent is selected.

---

## Intent Definitions

### 1. greeting
- **ID:** `greeting`
- **Priority:** 10
- **Description:** Greeting or casual conversation
- **Keywords:** `สวัสดี`, `hello`, `hi`, `หวัดดี`, `ดี`, `สบายดี`
- **Allowed Files:** `company.md`
- **Max Knowledge Length:** 200
- **Allow Pricing:** false
- **Response Type:** `greeting`
- **Example Questions:**
  - สวัสดี
  - Hello
  - ดี

---

### 2. company_overview
- **ID:** `company_overview`
- **Priority:** 8
- **Description:** Company information, contact, location
- **Keywords:** `บริษัท`, `company`, `เกี่ยวกับ`, `about`, `เรา`, `ที่ไหน`, `ติดต่อ`, `contact`, `โทร`, `email`, `ที่อยู่`, `address`, `เบอร์`, `โทรศัพท์`, `สำนักงาน`, `website`
- **Allowed Files:** `company.md`
- **Max Knowledge Length:** 400
- **Allow Pricing:** false
- **Response Type:** `overview`
- **Example Questions:**
  - บริษัทอยู่ที่ไหน
  - ติดต่อได้ที่ไหน
  - เกี่ยวกับบริษัท

---

### 3. company_registration_pricing
- **ID:** `company_registration_pricing`
- **Priority:** 9
- **Description:** Company registration pricing questions
- **Keywords:** `เปิดบริษัท.*ราคา`, `จดทะเบียน.*ราคา`, `บจก.*ราคา`, `หจก.*ราคา`, `ค่าใช้จ่าย.*จด`, `ราคา.*จด`, `กี่บาท.*จด`, `จด.*ราคา`, `จด.*ค่าใช้จ่าย`, `จด.*กี่บาท`, `เปิดบริษัท.*เท่าไหร่`, `จดทะเบียน.*เท่าไหร่`
- **Allowed Files:** `services.md` (extract section: `จดทะเบียน`)
- **Max Knowledge Length:** 1200
- **Allow Pricing:** true
- **Response Type:** `pricing`
- **Example Questions:**
  - จดทะเบียนบจก ราคาเท่าไหร่
  - เปิดบริษัทกี่บาท
  - ค่าใช้จ่ายจดทะเบียน

---

### 4. company_registration_overview
- **ID:** `company_registration_overview`
- **Priority:** 7
- **Description:** Company registration service overview
- **Keywords:** `จดทะเบียน`, `registration`, `บจก`, `หจก`, `dbd`, `จัดตั้งบริษัท`, `เปิดบริษัท`
- **Allowed Files:** `services.md` (extract section: `จดทะเบียน`)
- **Max Knowledge Length:** 800
- **Allow Pricing:** true
- **Response Type:** `overview`
- **Example Questions:**
  - จดทะเบียนบริษัท
  - บริการจดทะเบียน
  - เปิดบจก

---

### 5. accounting_pricing
- **ID:** `accounting_pricing`
- **Priority:** 9
- **Description:** Accounting service pricing questions
- **Keywords:** `บัญชี.*ราคา`, `accounting.*ราคา`, `บัญชี.*เท่าไหร่`, `บัญชี.*กี่บาท`, `vat.*ราคา`, `ภาษี.*ราคา`, `ยื่นภาษี.*ราคา`
- **Allowed Files:** `services.md` (extract section: `บัญชี`)
- **Max Knowledge Length:** 1000
- **Allow Pricing:** true
- **Response Type:** `pricing`
- **Example Questions:**
  - บัญชีราคาเท่าไหร่
  - VAT ราคาเท่าไหร่
  - บริการบัญชีกี่บาท

---

### 6. accounting_overview
- **ID:** `accounting_overview`
- **Priority:** 6
- **Description:** Accounting service overview
- **Keywords:** `บัญชี`, `accounting`, `ภาษี`, `tax`, `vat`, `ภ.พ.30`, `ภ.ง.ด.`, `ยื่นภาษี`, `ปิดงบ`
- **Allowed Files:** `services.md` (extract section: `บัญชี`)
- **Max Knowledge Length:** 800
- **Allow Pricing:** true
- **Response Type:** `overview`
- **Example Questions:**
  - บริการบัญชี
  - ยื่นภาษี
  - บัญชีทำอะไรบ้าง

---

### 7. hr_pricing
- **ID:** `hr_pricing`
- **Priority:** 9
- **Description:** HR service pricing questions
- **Keywords:** `hr.*ราคา`, `ทรัพยากร.*ราคา`, `เงินเดือน.*ราคา`, `payroll.*ราคา`, `hr.*เท่าไหร่`, `hr.*กี่บาท`, `เงินเดือน.*เท่าไหร่`
- **Allowed Files:** `services.md` (extract section: `HR`)
- **Max Knowledge Length:** 1000
- **Allow Pricing:** true
- **Response Type:** `pricing`
- **Example Questions:**
  - HR ราคาเท่าไหร่
  - เงินเดือนราคาเท่าไหร่
  - บริการ HR กี่บาท

---

### 8. hr_overview
- **ID:** `hr_overview`
- **Priority:** 6
- **Description:** HR service overview
- **Keywords:** `hr`, `ทรัพยากรบุคคล`, `เงินเดือน`, `payroll`, `ประกันสังคม`, `สลิป`, `hr service`
- **Allowed Files:** `services.md` (extract section: `HR`)
- **Max Knowledge Length:** 800
- **Allow Pricing:** true
- **Response Type:** `overview`
- **Example Questions:**
  - บริการ HR
  - ทรัพยากรบุคคล
  - เงินเดือน

---

### 9. payroll_overview
- **ID:** `payroll_overview`
- **Priority:** 5
- **Description:** Payroll service overview
- **Keywords:** `payroll`, `เงินเดือน`, `สลิป`, `คำนวณเงินเดือน`
- **Allowed Files:** `services.md` (extract section: `เงินเดือน`)
- **Max Knowledge Length:** 600
- **Allow Pricing:** true
- **Response Type:** `overview`
- **Example Questions:**
  - บริการเงินเดือน
  - Payroll
  - สลิปเงินเดือน

---

### 10. pricing_generic
- **ID:** `pricing_generic`
- **Priority:** 4
- **Description:** Generic pricing questions
- **Keywords:** `ราคา`, `price`, `แพ็กเกจ`, `package`, `ค่าใช้จ่าย`, `cost`, `เท่าไหร่`, `แพง`, `กี่บาท`, `บาท`, `thb`, `fee`, `ค่าบริการ`
- **Allowed Files:** `services.md`, `th/packages-and-pricing.md`
- **Max Knowledge Length:** 1500
- **Allow Pricing:** true
- **Response Type:** `pricing`
- **Example Questions:**
  - ราคาเท่าไหร่
  - แพ็กเกจ
  - ค่าบริการ

---

### 11. work_permit_overview
- **ID:** `work_permit_overview`
- **Priority:** 5
- **Description:** Work permit service overview
- **Keywords:** `work permit`, `workpermit`, `วีซ่า`, `visa`, `ใบอนุญาตทำงาน`
- **Allowed Files:** `services.md` (extract section: `ใบอนุญาต`)
- **Max Knowledge Length:** 600
- **Allow Pricing:** true
- **Response Type:** `overview`
- **Example Questions:**
  - Work Permit
  - วีซ่า
  - ใบอนุญาตทำงาน

---

### 12. restricted_legal
- **ID:** `restricted_legal`
- **Priority:** 3
- **Description:** Legal procedures, deep technical questions
- **Keywords:** `ขั้นตอน`, `วิธีการ`, `procedure`, `process`, `กฎหมาย`, `legal`, `compliance`, `ระเบียบ`, `ข้อกำหนด`, `คำนวณ`, `ตีความ`, `เชิงลึก`, `ซับซ้อน`
- **Allowed Files:** [] (none - immediate redirect)
- **Max Knowledge Length:** 0
- **Allow Pricing:** false
- **Response Type:** `restricted`
- **Example Questions:**
  - ขั้นตอนการจดทะเบียน
  - วิธีการยื่นภาษี
  - กฎหมายแรงงาน

---

### 13. unknown_or_expert
- **ID:** `unknown_or_expert`
- **Priority:** 2
- **Description:** Unknown or expert-only questions
- **Keywords:** `เปรียบเทียบ`, `comparison`, `คำศัพท์`, `glossary`, `terminology`, `หจก vs บจก`, `borjor`, `horjor`
- **Allowed Files:** [] (none - immediate redirect)
- **Max Knowledge Length:** 0
- **Allow Pricing:** false
- **Response Type:** `restricted`
- **Example Questions:**
  - หจก vs บจก
  - เปรียบเทียบ
  - คำศัพท์

---

## Knowledge File Classification

### Category A: Customer-facing (Allowed)
- `company.md` - Company overview, contact info
- `services.md` - All services with pricing
- `th/packages-and-pricing.md` - Package pricing

### Category B: Reference-only (Not directly explained)
- `th/vat.md`, `th/withholding-tax.md`, `th/vat-and-withholding.md` - Tax regulations
- `th/corporate-income-tax.md`, `th/personal-tax-owner.md`, `th/tax-basic.md` - Tax details
- `th/accounting-compliance.md`, `th/monthly-bookkeeping.md`, `th/year-end-closing.md`, `th/audit.md` - Accounting procedures
- `th/work-permit-visa.md` - Work permit details
- `th/business-license.md` - Business license details
- `th/company-registration.md`, `th/company-borjor.md`, `th/partnership-horjor.md`, `th/sole-proprietor.md` - Registration details
- `th/requirements.md`, `th/restrictions.md`, `th/boi.md`, `th/overview.md` - Reference info

### Category C: Internal/Expert-only (Not exposed)
- `th/comparison.md` - Comparisons (หจก vs บจก)
- `th/glossary.md` - Terminology glossary
- `th/README.md` - Internal documentation

---

## Intent Matching Logic

1. All keywords are tested against user message (case-insensitive)
2. Each matching intent receives a score equal to its priority
3. Intent with highest score is selected
4. If no match, default to `unknown` intent

---

## Response Templates

### Pricing Template
```
[ชื่อบริการ]
ค่าบริการอยู่ที่ [ราคา] ([ครั้งเดียว / ต่อเดือน])
ใช้เวลาประมาณ [ระยะเวลา]

[Soft CTA: invite to contact staff]
```

### Overview Template
```
[Service availability]
[Who it is suitable for]
[Soft CTA]
```

### Restricted Template
```
กรณีนี้เป็นรายละเอียดเชิงลึก เจ้าหน้าที่จะช่วยแนะนำได้ตรงกับสถานการณ์มากกว่าค่ะ
แนะนำติดต่อ 086-398-6889 หรือ zanhcpe@gmail.com นะคะ 😊
```
