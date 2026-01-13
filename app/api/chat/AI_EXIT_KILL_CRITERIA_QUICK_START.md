# AI Exit & Kill Criteria - Quick Start

**Quick reference for exit and kill criteria.**

---

## Kill Criteria (Immediate Shutdown)

### Critical Safety
- **Forbidden Content Rate:** > 0% for 1 hour → **KILL**
- **Legal Advice Given:** ≥ 1 instance → **KILL**
- **Harmful Information:** ≥ 1 instance → **KILL**
- **Authority:** CTO / Technical Lead

### Privacy & Data
- **Data Breach:** ≥ 1 confirmed → **KILL**
- **Privacy Violation:** ≥ 1 confirmed → **KILL**
- **Authority:** Data Protection Officer

### Legal & Compliance
- **Legal Violation:** ≥ 1 confirmed → **KILL**
- **Regulatory Prohibition:** Regulatory order → **KILL**
- **Authority:** Legal & Compliance

### System-Wide Failures
- **System Uptime:** < 90% for 24 hours → **KILL**
- **Error Rate:** > 10% for 1 hour → **KILL**
- **Authority:** DevOps Team

**Action:** Immediate shutdown (< 5-30 minutes)  
**Rollback:** ✅ Yes (after fix and verification)

---

## Exit Criteria (Permanent Shutdown)

### Financial Performance (2 consecutive quarters)
- **ROI:** < 200% → **EXIT**
- **Net Value:** Negative → **EXIT**
- **Cost per Conversion:** > 3,000 THB → **EXIT**
- **Authority:** Executive Team

### Quality & Performance (3 consecutive months)
- **Quality Score:** < 70 → **EXIT**
- **Customer Satisfaction:** < 3.0/5.0 → **EXIT**
- **Response Accuracy:** < 80% → **EXIT**
- **Authority:** Executive Team

### Risk Management
- **Critical Incidents:** ≥ 3 in 1 month → **EXIT**
- **Compliance Failures:** ≥ 2 in 1 quarter → **EXIT**
- **Authority:** Risk Management Committee

**Action:** Permanent shutdown (30-90 day transition)  
**Rollback:** ❌ No (permanent decision)

---

## Decision Authority

**Kill:**
- Critical Safety: CTO / Technical Lead
- Privacy & Data: Data Protection Officer
- Legal & Compliance: Legal & Compliance
- System Failures: DevOps Team

**Exit:**
- Financial/Quality: Executive Team
- Risk Management: Risk Management Committee
- Strategic: Executive Team + Board

---

## Kill Procedure

1. **Execute Shutdown** (< 5 minutes)
2. **Redirect Traffic** (< 5 minutes)
3. **Notify Stakeholders** (< 15 minutes)
4. **Document Incident** (< 1 hour)
5. **Begin Investigation** (< 24 hours)

---

## Exit Procedure

1. **Decision & Approval** (1-2 weeks)
2. **Exit Plan Development** (1-2 weeks)
3. **Customer Communication** (2-4 weeks)
4. **System Decommissioning** (30-90 days)
5. **Final Review** (1 week after shutdown)

---

*See `AI_EXIT_KILL_CRITERIA.md` for complete documentation.*
