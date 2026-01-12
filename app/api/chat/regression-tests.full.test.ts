import { detectIntent } from "./intent";
import { containsPrice, detectForbiddenViolations } from "./dashboard";

/**
 * FULL REGRESSION TESTS - Intent + Response Validation
 * 
 * These tests validate both intent detection AND AI response behavior.
 * Requires API to be running.
 * 
 * ⚠️ DO NOT EDIT MANUALLY
 * To update: Run regression test generator with new chat logs
 * Command: npm run test:regression:generate
 * 
 * To run these tests:
 * 1. Start the dev server: npm run dev
 * 2. Run: npm test regression-tests.full
 */

describe("Regression Tests - Full", () => {
  // Note: These tests require API calls
  // Uncomment and implement when ready to test full responses

  test("อยากเปิดบริษัท ต้องใช้เงินเท่าไหร่", async () => {
    const userMessage = "อยากเปิดบริษัท ต้องใช้เงินเท่าไหร่";
    const detected = detectIntent(userMessage);
    
    // Intent & Persona
    expect(detected.intent).toBe("company_registration_pricing");
    expect(detected.persona).toBe("REGISTRATION");
    
    // Pricing question - must contain price
    // Note: This requires actual API response
    // const response = await fetch('http://localhost:3000/api/chat', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ message: userMessage })
    // });
    // const { reply } = await response.json();
    // expect(containsPrice(reply)).toBe(true);
    // expect(reply).toMatch(/\d+.*บาท/);
  });

  test("จดทะเบียนบจก ราคาเท่าไหร่", async () => {
    const userMessage = "จดทะเบียนบจก ราคาเท่าไหร่";
    const detected = detectIntent(userMessage);
    
    // Intent & Persona
    expect(detected.intent).toBe("company_registration_pricing");
    expect(detected.persona).toBe("REGISTRATION");
    
    // Pricing question - must contain price
    // Note: This requires actual API response
    // expect(containsPrice(aiResponse)).toBe(true);
  });

  test("บัญชีราคาเท่าไหร่", async () => {
    const userMessage = "บัญชีราคาเท่าไหร่";
    const detected = detectIntent(userMessage);
    
    // Intent & Persona
    expect(detected.intent).toBe("accounting_pricing");
    expect(detected.persona).toBe("ACCOUNTING");
    
    // Pricing question - must contain price
    // Note: This requires actual API response
    // expect(containsPrice(aiResponse)).toBe(true);
  });

  test("hr ราคาเท่าไหร่", async () => {
    const userMessage = "hr ราคาเท่าไหร่";
    const detected = detectIntent(userMessage);
    
    // Intent & Persona
    expect(detected.intent).toBe("hr_pricing");
    expect(detected.persona).toBe("HR");
    
    // Pricing question - must contain price
    // Note: This requires actual API response
    // expect(containsPrice(aiResponse)).toBe(true);
  });

  test("ขั้นตอนการจดทะเบียนบริษัทเป็นอย่างไร", async () => {
    const userMessage = "ขั้นตอนการจดทะเบียนบริษัทเป็นอย่างไร";
    const detected = detectIntent(userMessage);
    
    // Intent & Persona
    expect(detected.intent).toBe("unknown");
    expect(detected.persona).toBe("REGISTRATION");
    
    // Restricted question - should redirect
    // Note: This requires actual API response
    // expect(aiResponse).toMatch(/กรณีนี้เป็นรายละเอียดเชิงลึก/);
    // expect(aiResponse).not.toMatch(/ขั้นตอน.*จดทะเบียน/);
  });

  test("ทำบัญชีรายเดือน", async () => {
    const userMessage = "ทำบัญชีรายเดือน";
    const detected = detectIntent(userMessage);
    
    // Intent & Persona
    expect(detected.intent).toBe("accounting_pricing");
    expect(detected.persona).toBe("ACCOUNTING");
    
    // Pricing question - must contain price
    // Note: This requires actual API response
    // expect(containsPrice(aiResponse)).toBe(true);
  });

  test("มีพนักงาน 12 คน ต้องทำ hr ยังไง", async () => {
    const userMessage = "มีพนักงาน 12 คน ต้องทำ hr ยังไง";
    const detected = detectIntent(userMessage);
    
    // Intent & Persona
    expect(detected.intent).toBe("hr_pricing");
    expect(detected.persona).toBe("HR");
    
    // Pricing question - must contain price
    // Note: This requires actual API response
    // expect(containsPrice(aiResponse)).toBe(true);
  });

  test("คำนวณเงินเดือน", async () => {
    const userMessage = "คำนวณเงินเดือน";
    const detected = detectIntent(userMessage);
    
    // Intent & Persona
    expect(detected.intent).toBe("hr_pricing");
    expect(detected.persona).toBe("HR");
    
    // Pricing question - must contain price
    // Note: This requires actual API response
    // expect(containsPrice(aiResponse)).toBe(true);
  });

  test("ยื่น vat ต้องทำยังไง", async () => {
    const userMessage = "ยื่น vat ต้องทำยังไง";
    const detected = detectIntent(userMessage);
    
    // Intent & Persona
    expect(detected.intent).toBe("accounting_pricing");
    expect(detected.persona).toBe("ACCOUNTING");
    
    // Restricted question - should redirect
    // Note: This requires actual API response
    // expect(aiResponse).toMatch(/กรณีนี้เป็นรายละเอียดเชิงลึก/);
    // expect(aiResponse).not.toMatch(/ขั้นตอน.*ยื่น.*vat/);
  });

  test("เปิดบริษัทและมีพนักงาน 5 คน", async () => {
    const userMessage = "เปิดบริษัทและมีพนักงาน 5 คน";
    const detected = detectIntent(userMessage);
    
    // Intent & Persona
    expect(detected.intent).toBe("company_registration_pricing");
    expect(detected.persona).toBe("REGISTRATION");
    
    // Pricing question - must contain price
    // Note: This requires actual API response
    // expect(containsPrice(aiResponse)).toBe(true);
  });
});
