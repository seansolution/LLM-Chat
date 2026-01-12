import { detectIntent } from "./intent";

describe("Intent Detection", () => {

  // ===== REGISTRATION =====
  test("เปิดบริษัท → REGISTRATION pricing", () => {
    const res = detectIntent("อยากเปิดบริษัท ต้องใช้เงินเท่าไหร่");
    expect(res.intent).toBe("company_registration_pricing");
    expect(res.persona).toBe("REGISTRATION");
  });

  test("จดทะเบียนบริษัท ราคาเท่าไหร่", () => {
    const res = detectIntent("จดทะเบียนบริษัท ราคาเท่าไหร่");
    expect(res.persona).toBe("REGISTRATION");
  });

  // ===== ACCOUNTING =====
  test("ทำบัญชีรายเดือน → ACCOUNTING", () => {
    const res = detectIntent("อยากทำบัญชีรายเดือน");
    expect(res.intent).toBe("accounting_pricing");
    expect(res.persona).toBe("ACCOUNTING");
  });

  test("ยื่น VAT ต้องทำยังไง", () => {
    const res = detectIntent("ยื่น vat ต้องทำยังไง");
    expect(res.persona).toBe("ACCOUNTING");
  });

  // ===== HR =====
  test("พนักงาน 12 คน ต้องทำ HR ยังไง", () => {
    const res = detectIntent("มีพนักงาน 12 คน ต้องทำ hr ยังไง");
    expect(res.intent).toBe("hr_pricing");
    expect(res.persona).toBe("HR");
  });

  test("คำนวณเงินเดือน", () => {
    const res = detectIntent("คำนวณเงินเดือน");
    expect(res.persona).toBe("HR");
  });

  // ===== PROTECTION TESTS =====
  test("เปิดบริษัท + พนักงาน → REGISTRATION ต้องชนะ", () => {
    const res = detectIntent("เปิดบริษัทและมีพนักงาน 5 คน");
    expect(res.persona).toBe("REGISTRATION");
  });

  test("unknown question → default REGISTRATION", () => {
    const res = detectIntent("สวัสดีครับ");
    expect(res.intent).toBe("unknown");
    expect(res.persona).toBe("REGISTRATION");
  });

});
