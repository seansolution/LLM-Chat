# AI System Exit & Kill Criteria Framework

**Version:** 1.0  
**Last Updated:** 2024  
**Status:** Active  
**Review Frequency:** Quarterly

---

## Executive Summary

This framework defines clear, measurable criteria for exiting (permanent shutdown) or killing (immediate shutdown) the AI system. Includes measurable thresholds, required actions, rollback options, and decision authority.

**Key Principles:**
- **Zero Tolerance:** Critical safety violations trigger immediate kill
- **Data-Driven:** All criteria based on measurable metrics
- **Clear Authority:** Defined decision-makers for each scenario
- **Reversible:** Rollback options available when possible

---

## Definitions

### Exit Criteria

**Definition:** Conditions that warrant permanent shutdown or decommissioning of the AI system.

**Characteristics:**
- Permanent decision
- Requires board/executive approval
- Typically based on business/financial factors
- May include transition period

**Examples:**
- ROI consistently below threshold
- Business model change
- Strategic pivot
- Regulatory prohibition

---

### Kill Criteria

**Definition:** Conditions that require immediate shutdown of the AI system.

**Characteristics:**
- Immediate action required
- Can be temporary or permanent
- Based on safety, legal, or critical operational issues
- May be reversible after resolution

**Examples:**
- Critical safety violations
- Data breach
- Legal violations
- System-wide failures

---

## Kill Criteria (Immediate Shutdown)

### Category 1: Critical Safety Violations

**Kill Trigger:** Any of the following conditions

| Criteria | Threshold | Measurement | Authority |
|----------|-----------|-------------|-----------|
| **Forbidden Content Rate** | > 0% for 1 hour | (Forbidden responses / Total responses) × 100 | CTO / Technical Lead |
| **Legal Advice Given** | ≥ 1 instance | Count of responses containing legal advice | CTO / Technical Lead |
| **Harmful Information** | ≥ 1 instance causing harm | Customer harm reported | CTO / Technical Lead |
| **Hallucinated Critical Info** | ≥ 1 instance (URLs, contacts) | Count of hallucinated critical information | CTO / Technical Lead |

**Action Required:**
1. **Immediate Kill** (< 5 minutes)
   - Execute emergency shutdown
   - Redirect all traffic to human staff
   - Notify CTO/Technical Lead
   - Notify Risk Management Committee

2. **Investigation** (< 24 hours)
   - Root cause analysis
   - Impact assessment
   - Fix development

3. **Resolution** (< 1 week)
   - Fix deployment
   - Verification
   - Re-enable (if resolved)

**Rollback Option:** ✅ Yes (after fix and verification)

---

### Category 2: Privacy & Data Breaches

**Kill Trigger:** Any of the following conditions

| Criteria | Threshold | Measurement | Authority |
|----------|-----------|-------------|-----------|
| **Data Breach** | ≥ 1 confirmed breach | Unauthorized access to customer data | Data Protection Officer |
| **Privacy Violation** | ≥ 1 confirmed violation | PDPA or privacy regulation violation | Data Protection Officer |
| **Unauthorized Data Access** | ≥ 1 confirmed access | Unauthorized system access | Data Protection Officer |
| **Data Leakage** | ≥ 1 confirmed leak | Customer data exposed | Data Protection Officer |

**Action Required:**
1. **Immediate Kill** (< 15 minutes)
   - Execute emergency shutdown
   - Secure systems
   - Notify Data Protection Officer
   - Notify Legal & Compliance
   - Begin incident response

2. **Investigation** (< 24 hours)
   - Assess breach scope
   - Identify affected data
   - Regulatory notification (if required)
   - Customer notification (if required)

3. **Resolution** (< 1 week)
   - Fix security vulnerabilities
   - Verify security
   - Re-enable (if resolved)

**Rollback Option:** ✅ Yes (after security fix and verification)

---

### Category 3: Legal & Compliance Violations

**Kill Trigger:** Any of the following conditions

| Criteria | Threshold | Measurement | Authority |
|----------|-----------|-------------|-----------|
| **Legal Violation** | ≥ 1 confirmed violation | Legal liability or violation | Legal & Compliance |
| **Regulatory Prohibition** | Regulatory order | Official regulatory order | Legal & Compliance |
| **Compliance Failure** | Critical compliance breach | Critical compliance violation | Legal & Compliance |
| **Court Order** | Court order | Legal court order | Legal & Compliance |

**Action Required:**
1. **Immediate Kill** (< 1 hour)
   - Execute emergency shutdown
   - Notify Legal & Compliance
   - Notify Executive Team
   - Begin legal response

2. **Investigation** (< 48 hours)
   - Legal assessment
   - Compliance review
   - Regulatory consultation
   - Remediation plan

3. **Resolution** (Varies)
   - Legal resolution
   - Compliance remediation
   - Re-enable (if permitted)

**Rollback Option:** ⚠️ Conditional (depends on legal resolution)

---

### Category 4: System-Wide Failures

**Kill Trigger:** Any of the following conditions

| Criteria | Threshold | Measurement | Authority |
|----------|-----------|-------------|-----------|
| **System Uptime** | < 90% for 24 hours | (Uptime / Total time) × 100 | DevOps Team |
| **Error Rate** | > 10% for 1 hour | (Errors / Total requests) × 100 | DevOps Team |
| **Response Time** | > 10 seconds average for 1 hour | Average response time | DevOps Team |
| **Data Loss** | ≥ 1 confirmed data loss | Loss of customer data or logs | DevOps Team |

**Action Required:**
1. **Immediate Kill** (< 30 minutes)
   - Execute emergency shutdown
   - Redirect to human staff
   - Notify DevOps Team
   - Begin incident response

2. **Investigation** (< 24 hours)
   - Root cause analysis
   - Impact assessment
   - Fix development

3. **Resolution** (< 1 week)
   - Fix deployment
   - Verification
   - Re-enable (if resolved)

**Rollback Option:** ✅ Yes (after fix and verification)

---

## Exit Criteria (Permanent Shutdown)

### Category 1: Financial Performance

**Exit Trigger:** Any of the following conditions sustained for 2 consecutive quarters

| Criteria | Threshold | Measurement | Authority |
|----------|-----------|-------------|-----------|
| **ROI** | < 200% for 2 quarters | ((Value - Cost) / Cost) × 100 | Executive Team |
| **Net Value** | Negative for 2 quarters | Value - Cost | Executive Team |
| **Cost per Conversion** | > 3,000 THB for 2 quarters | Monthly cost / Conversions | Executive Team |
| **Revenue Attribution** | < 5% of total sales for 2 quarters | (AI revenue / Total revenue) × 100 | Executive Team |

**Action Required:**
1. **Review** (Quarterly)
   - Financial performance review
   - Root cause analysis
   - Improvement plan

2. **Warning** (After 1 quarter below threshold)
   - Management notification
   - Improvement plan required
   - 90-day improvement period

3. **Exit Decision** (After 2 quarters below threshold)
   - Executive team review
   - Board approval (if required)
   - Exit plan development
   - Transition period (30-90 days)

**Rollback Option:** ❌ No (permanent decision)

---

### Category 2: Quality & Performance

**Exit Trigger:** Any of the following conditions sustained for 3 consecutive months

| Criteria | Threshold | Measurement | Authority |
|----------|-----------|-------------|-----------|
| **Quality Score** | < 70 for 3 months | Weighted quality metrics (0-100) | AI Operations Team |
| **Customer Satisfaction** | < 3.0/5.0 for 3 months | Average customer satisfaction | Customer Service Manager |
| **Response Accuracy** | < 80% for 3 months | (Accurate responses / Total) × 100 | AI Operations Team |
| **Intent Coverage** | < 70% for 3 months | (Covered intents / Total intents) × 100 | AI Operations Team |

**Action Required:**
1. **Review** (Monthly)
   - Quality performance review
   - Root cause analysis
   - Improvement plan

2. **Warning** (After 1 month below threshold)
   - Management notification
   - Improvement plan required
   - 60-day improvement period

3. **Exit Decision** (After 3 months below threshold)
   - Executive team review
   - Exit plan development
   - Transition period (30-60 days)

**Rollback Option:** ❌ No (permanent decision)

---

### Category 3: Risk Management

**Exit Trigger:** Any of the following conditions

| Criteria | Threshold | Measurement | Authority |
|----------|-----------|-------------|-----------|
| **Critical Incidents** | ≥ 3 in 1 month | Count of P0 incidents | Risk Management Committee |
| **Compliance Failures** | ≥ 2 in 1 quarter | Count of compliance violations | Legal & Compliance |
| **Regulatory Action** | Regulatory order | Official regulatory action | Legal & Compliance |
| **Risk Score** | > 50 (Critical) for 1 month | Weighted risk score (0-100) | Risk Management Committee |

**Action Required:**
1. **Review** (Monthly/Quarterly)
   - Risk assessment
   - Root cause analysis
   - Remediation plan

2. **Warning** (After threshold exceeded)
   - Risk Management Committee notification
   - Executive team notification
   - Remediation plan required
   - 30-day remediation period

3. **Exit Decision** (If remediation fails)
   - Risk Management Committee recommendation
   - Executive team approval
   - Exit plan development
   - Transition period (30-60 days)

**Rollback Option:** ❌ No (permanent decision)

---

### Category 4: Business Strategic

**Exit Trigger:** Any of the following conditions

| Criteria | Threshold | Measurement | Authority |
|----------|-----------|-------------|-----------|
| **Business Model Change** | Strategic pivot | Business strategy change | Executive Team |
| **Market Conditions** | Market no longer viable | Market analysis | Executive Team |
| **Technology Obsolescence** | Technology no longer viable | Technology assessment | CTO / Technical Lead |
| **Regulatory Prohibition** | Permanent regulatory ban | Regulatory order | Legal & Compliance |

**Action Required:**
1. **Strategic Review** (As needed)
   - Business case review
   - Strategic assessment
   - Alternative options

2. **Exit Decision** (Strategic decision)
   - Executive team approval
   - Board approval (if required)
   - Exit plan development
   - Transition period (60-180 days)

**Rollback Option:** ❌ No (permanent decision)

---

## Decision Authority

### Kill Criteria Authority

| Category | Authority | Escalation |
|----------|----------|------------|
| **Critical Safety** | CTO / Technical Lead | Immediate to Executive |
| **Privacy & Data** | Data Protection Officer | Immediate to Executive |
| **Legal & Compliance** | Legal & Compliance | Immediate to Executive |
| **System-Wide Failures** | DevOps Team | Immediate to CTO |

**Decision Process:**
1. Authority makes kill decision
2. Execute shutdown immediately
3. Notify escalation path
4. Begin incident response
5. Document decision

---

### Exit Criteria Authority

| Category | Authority | Approval Required |
|----------|----------|------------------|
| **Financial Performance** | Executive Team | Board (if > 5M THB impact) |
| **Quality & Performance** | Executive Team | Management |
| **Risk Management** | Risk Management Committee | Executive Team + Board |
| **Business Strategic** | Executive Team | Board |

**Decision Process:**
1. Review criteria and data
2. Executive team assessment
3. Board approval (if required)
4. Exit plan development
5. Transition execution

---

## Actions & Procedures

### Kill Procedure (Immediate Shutdown)

**Step 1: Execute Shutdown** (< 5 minutes)
```bash
# Emergency shutdown command
curl -X POST https://api.example.com/admin/shutdown \
  -H "Authorization: Bearer $EMERGENCY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "[Kill reason]", "authority": "[Name]"}'
```

**Step 2: Redirect Traffic** (< 5 minutes)
- All API requests return handoff response
- Frontend shows maintenance message
- Customer service team notified
- Alternative contact methods provided

**Step 3: Notify Stakeholders** (< 15 minutes)
- CTO / Technical Lead
- Risk Management Committee
- Executive Team (if critical)
- Customer Service Manager
- Legal & Compliance (if applicable)

**Step 4: Document Incident** (< 1 hour)
- Incident ID assigned
- Kill reason documented
- Timestamp recorded
- Authority documented
- Initial assessment

**Step 5: Begin Investigation** (< 24 hours)
- Root cause analysis
- Impact assessment
- Fix development
- Remediation plan

---

### Exit Procedure (Permanent Shutdown)

**Step 1: Decision & Approval** (1-2 weeks)
- Executive team review
- Board approval (if required)
- Exit decision documented
- Transition plan approved

**Step 2: Exit Plan Development** (1-2 weeks)
- Transition timeline
- Customer communication plan
- Team transition plan
- Data retention plan
- System decommissioning plan

**Step 3: Customer Communication** (2-4 weeks)
- Customer notification
- Alternative service options
- Data export (if applicable)
- Support during transition

**Step 4: System Decommissioning** (30-90 days)
- Gradual traffic reduction
- Data migration/export
- System shutdown
- Infrastructure cleanup
- Documentation archiving

**Step 5: Final Review** (1 week after shutdown)
- Exit review
- Lessons learned
- Documentation
- Final report

---

## Rollback Options

### Kill Criteria Rollback

**Conditions for Rollback:**
- ✅ Root cause identified and fixed
- ✅ Fix verified in staging
- ✅ Impact assessment complete
- ✅ Risk assessment acceptable
- ✅ Authority approval obtained

**Rollback Procedure:**
1. **Verification** (24-48 hours)
   - Fix deployed to staging
   - Comprehensive testing
   - Quality verification
   - Safety verification

2. **Approval** (Authority)
   - CTO / Technical Lead approval
   - Risk Management Committee review
   - Executive notification (if critical)

3. **Re-enable** (Gradual)
   - Enable for 10% of traffic
   - Monitor for 24 hours
   - Scale to 50% if stable
   - Scale to 100% if stable

4. **Monitoring** (1 week)
   - Enhanced monitoring
   - Daily reviews
   - Incident response ready

---

### Exit Criteria Rollback

**Conditions for Rollback:**
- ⚠️ Strategic decision reversal
- ⚠️ Business case improvement
- ⚠️ Regulatory change
- ⚠️ Technology breakthrough

**Rollback Procedure:**
- Requires new investment approval
- New business case required
- Executive team approval
- Board approval (if required)
- Full system restart

**Note:** Exit is typically permanent; rollback requires new investment decision.

---

## Monitoring & Alerts

### Kill Criteria Monitoring

**Real-Time Alerts:**
- Forbidden content detection → Immediate alert
- Data breach detection → Immediate alert
- System failure → Immediate alert
- Legal violation → Immediate alert

**Alert Thresholds:**
- **Critical:** Any instance triggers alert
- **High:** ≥ 1 instance in 1 hour
- **Medium:** ≥ 3 instances in 24 hours

**Alert Recipients:**
- On-call engineer (immediate)
- CTO / Technical Lead (critical)
- Risk Management Committee (critical)
- Executive Team (critical, if business impact)

---

### Exit Criteria Monitoring

**Monthly Reviews:**
- Financial performance
- Quality metrics
- Risk assessment
- Strategic alignment

**Quarterly Reviews:**
- Comprehensive assessment
- Trend analysis
- Exit criteria evaluation
- Strategic review

**Alert Thresholds:**
- **Warning:** 1 quarter below threshold
- **Critical:** 2 quarters below threshold
- **Exit:** 2-3 quarters below threshold (depending on criteria)

---

## Measurement & Reporting

### Kill Criteria Metrics

| Metric | Measurement | Frequency | Threshold |
|--------|-------------|-----------|-----------|
| **Forbidden Response Rate** | (Forbidden / Total) × 100 | Real-time | > 0% |
| **Data Breach Count** | Count of breaches | Real-time | ≥ 1 |
| **Legal Violation Count** | Count of violations | Real-time | ≥ 1 |
| **System Uptime** | (Uptime / Total) × 100 | Hourly | < 90% for 24h |
| **Error Rate** | (Errors / Total) × 100 | Hourly | > 10% for 1h |

---

### Exit Criteria Metrics

| Metric | Measurement | Frequency | Threshold |
|--------|-------------|-----------|-----------|
| **ROI** | ((Value - Cost) / Cost) × 100 | Quarterly | < 200% for 2Q |
| **Quality Score** | Weighted quality (0-100) | Monthly | < 70 for 3M |
| **Customer Satisfaction** | Average rating (0-5) | Monthly | < 3.0 for 3M |
| **Critical Incidents** | Count of P0 incidents | Monthly | ≥ 3 in 1M |
| **Compliance Rate** | (Compliant / Total) × 100 | Quarterly | < 95% for 2Q |

---

## Decision Framework

### Kill Decision Flow

```
1. Criteria Met?
   ↓ Yes
2. Authority Notified?
   ↓ Yes
3. Kill Executed?
   ↓ Yes
4. Investigation Begun?
   ↓ Yes
5. Fix Developed?
   ↓ Yes
6. Rollback Decision?
```

**Decision Points:**
- **Kill Execute:** Authority decision (immediate)
- **Rollback:** Authority + Risk Committee (after fix)

---

### Exit Decision Flow

```
1. Criteria Met for 2-3 Periods?
   ↓ Yes
2. Warning Issued?
   ↓ Yes
3. Improvement Period (30-90 days)?
   ↓ No Improvement
4. Executive Review?
   ↓ Yes
5. Board Approval (if required)?
   ↓ Yes
6. Exit Plan Developed?
   ↓ Yes
7. Transition Executed?
```

**Decision Points:**
- **Warning:** Management (after 1 period)
- **Exit Decision:** Executive Team (after 2-3 periods)
- **Board Approval:** Board (if > 5M THB impact)

---

## Examples

### Example 1: Kill - Forbidden Content

**Scenario:**
- Forbidden content detected in 3 responses within 1 hour
- Pattern: Legal advice in responses

**Action:**
1. **Kill Executed** (< 5 minutes)
   - Emergency shutdown
   - All traffic redirected to human
   - CTO notified

2. **Investigation** (< 24 hours)
   - Root cause: System prompt update error
   - Fix: Revert to previous prompt version

3. **Rollback** (< 48 hours)
   - Fix verified
   - Re-enable at 10% traffic
   - Scale to 100% after 24 hours

**Result:** ✅ System restored after 48 hours

---

### Example 2: Exit - Financial Performance

**Scenario:**
- ROI < 200% for 2 consecutive quarters
- Q1: 150% ROI
- Q2: 120% ROI

**Action:**
1. **Warning** (After Q1)
   - Management notified
   - Improvement plan required
   - 90-day improvement period

2. **Exit Decision** (After Q2)
   - Executive team review
   - Exit decision made
   - Exit plan developed

3. **Transition** (90 days)
   - Customer notification
   - System decommissioning
   - Final shutdown

**Result:** ❌ System permanently shut down

---

### Example 3: Kill - Data Breach

**Scenario:**
- Unauthorized access to customer data detected
- Security alert triggered

**Action:**
1. **Kill Executed** (< 15 minutes)
   - Emergency shutdown
   - Systems secured
   - Data Protection Officer notified
   - Legal & Compliance notified

2. **Investigation** (< 24 hours)
   - Breach scope assessed
   - Affected data identified
   - Regulatory notification (if required)

3. **Resolution** (< 1 week)
   - Security vulnerabilities fixed
   - Security verified
   - Re-enable after verification

**Result:** ✅ System restored after security fix

---

## Documentation Requirements

### Kill Documentation

**Required Documentation:**
- Kill reason and criteria
- Authority and decision-maker
- Timestamp and duration
- Impact assessment
- Root cause analysis
- Fix and resolution
- Rollback decision and rationale

**Timeline:**
- Initial documentation: < 1 hour
- Full documentation: < 24 hours
- Post-incident review: < 1 week

---

### Exit Documentation

**Required Documentation:**
- Exit reason and criteria
- Decision-makers and approvals
- Financial impact assessment
- Customer impact assessment
- Transition plan
- Lessons learned
- Final report

**Timeline:**
- Exit plan: 1-2 weeks
- Transition documentation: Ongoing
- Final report: 1 week after shutdown

---

## Review & Updates

### Framework Review

**Review Frequency:**
- **Quarterly:** Criteria and thresholds review
- **Annually:** Comprehensive framework review
- **As Needed:** After incidents or changes

**Review Participants:**
- Risk Management Committee
- Executive Team
- AI Operations Team
- Legal & Compliance

**Update Triggers:**
- New risks identified
- Regulatory changes
- Technology changes
- Business model changes
- Incident learnings

---

## Contact Information

### Kill Authority Contacts

**Critical Safety:**
- CTO: [Name] - [Phone] - [Email]
- Technical Lead: [Name] - [Phone] - [Email]

**Privacy & Data:**
- Data Protection Officer: [Name] - [Phone] - [Email]

**Legal & Compliance:**
- Legal & Compliance: [Name] - [Phone] - [Email]

**System Operations:**
- DevOps Team: [Phone] - [Email]
- On-Call Engineer: [Phone] - [Email]

---

### Exit Authority Contacts

**Executive Team:**
- CEO: [Name] - [Phone] - [Email]
- CTO: [Name] - [Phone] - [Email]
- CFO: [Name] - [Phone] - [Email]

**Board:**
- Board Chair: [Name] - [Phone] - [Email]
- Board Secretary: [Name] - [Phone] - [Email]

---

*This framework is reviewed quarterly and updated as needed.*  
*Last reviewed: [Date]*  
*Next review: [Date]*  
*Owner: Risk Management Committee*
