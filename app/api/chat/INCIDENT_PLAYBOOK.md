# Incident Response Playbook

**Quick reference guide for AI system incidents.**

---

## Quick Reference

### Severity Levels

| Severity | Response Time | Examples |
|----------|---------------|----------|
| 🔴 **P0 - Critical** | < 15 minutes | Safety violations, system failures, data breaches |
| 🟡 **P1 - High** | < 1 hour | Quality degradation, performance issues |
| 🟢 **P2 - Medium** | < 24 hours | Minor quality issues, non-critical errors |
| ⚪ **P3 - Low** | < 1 week | Minor issues, enhancement requests |

---

## Incident Response Flow

```
1. DETECT → 2. ASSESS → 3. CONTAIN → 4. RESOLVE → 5. REVIEW
```

---

## Step 1: Detection

### Detection Sources

- ✅ Automated alerts
- ✅ Customer reports
- ✅ Monitoring dashboards
- ✅ Manual review

### Immediate Actions

1. **Acknowledge incident**
   - Log in incident tracking system
   - Assign incident ID
   - Set severity level

2. **Notify on-call engineer**
   - Send alert via on-call system
   - Include incident ID and severity
   - Provide initial context

3. **Gather initial context**
   - Check monitoring dashboards
   - Review recent logs
   - Check for related incidents

---

## Step 2: Assessment

### Assessment Checklist

- [ ] What happened? (Description)
- [ ] When did it start? (Timestamp)
- [ ] Who is affected? (Users/systems)
- [ ] What is the impact? (Business/technical)
- [ ] What is the root cause? (Initial hypothesis)
- [ ] Is it getting worse? (Trend)

### Information to Gather

**System Information:**
- Error logs
- Performance metrics
- Recent deployments
- Configuration changes

**User Impact:**
- Number of affected users
- Type of impact (errors, slow responses, etc.)
- Customer complaints
- Business metrics

**Context:**
- Related incidents
- Recent changes
- Known issues
- Workarounds available

---

## Step 3: Containment

### Containment Strategies

#### Option 1: Feature Disable
```typescript
// Disable affected feature
if (incidentActive) {
  return redirectToHuman()
}
```

#### Option 2: Redirect to Human
```typescript
// Redirect all traffic to human staff
return NextResponse.json({
  reply: 'ขออภัยค่ะ ระบบกำลังปรับปรุง กรุณาติดต่อ 086-398-6889 หรือ zanhcpe@gmail.com นะคะ',
  handoff: { status: 'requested', reason: 'system_maintenance' }
})
```

#### Option 3: Emergency Shutdown
```bash
# Emergency shutdown procedure
1. Notify CTO/Technical Lead
2. Execute shutdown command
3. Redirect all traffic to human staff
4. Notify stakeholders
```

### Containment Actions

1. **Stop propagation**
   - Disable affected features
   - Block problematic requests
   - Isolate affected systems

2. **Implement workarounds**
   - Use fallback mechanisms
   - Redirect to alternatives
   - Manual intervention

3. **Notify stakeholders**
   - Internal team
   - Customer service
   - Management (if critical)

---

## Step 4: Resolution

### Resolution Process

1. **Identify root cause**
   - Review logs
   - Analyze data
   - Test hypotheses
   - Confirm root cause

2. **Develop fix**
   - Design solution
   - Code fix
   - Test in staging
   - Verify fix

3. **Deploy fix**
   - Deploy to production
   - Monitor deployment
   - Verify resolution
   - Monitor for recurrence

4. **Verify resolution**
   - Check metrics
   - Test functionality
   - Confirm user impact resolved
   - Monitor for 24 hours

---

## Step 5: Post-Incident Review

### Review Timeline

- **Immediate (0-24 hours):** Initial documentation
- **Short-term (1-3 days):** Root cause analysis
- **Long-term (1 week):** Comprehensive review

### Review Deliverables

1. **Incident Report**
   - Timeline
   - Impact assessment
   - Root cause analysis
   - Resolution steps

2. **Action Items**
   - Prevent recurrence
   - Improve processes
   - Update documentation
   - Training needs

3. **Lessons Learned**
   - What went well
   - What could be improved
   - Key takeaways
   - Recommendations

---

## Common Incident Scenarios

### Scenario 1: Forbidden Content Detected

**Symptoms:**
- Safety violation alert
- Forbidden pattern detected in response
- Customer complaint

**Immediate Actions:**
1. Block the response
2. Redirect to human staff
3. Review the response
4. Check for similar responses

**Resolution:**
1. Identify why violation occurred
2. Update detection patterns if needed
3. Review system prompt
4. Add additional controls

**Prevention:**
- Strengthen detection patterns
- Update system prompt
- Add more validation
- Review knowledge base

---

### Scenario 2: System Performance Degradation

**Symptoms:**
- Slow response times
- High error rates
- Timeout errors
- User complaints

**Immediate Actions:**
1. Check system resources
2. Review recent deployments
3. Check for external dependencies
4. Implement rate limiting if needed

**Resolution:**
1. Identify bottleneck
2. Optimize performance
3. Scale resources if needed
4. Fix root cause

**Prevention:**
- Performance monitoring
- Load testing
- Resource planning
- Capacity management

---

### Scenario 3: Knowledge Base Error

**Symptoms:**
- Incorrect information in responses
- Outdated pricing
- Missing information
- Customer complaints

**Immediate Actions:**
1. Identify incorrect information
2. Disable affected knowledge files if needed
3. Update knowledge base
4. Notify stakeholders

**Resolution:**
1. Correct knowledge base
2. Verify accuracy
3. Deploy update
4. Monitor responses

**Prevention:**
- Knowledge base review process
- Version control
- Approval workflow
- Regular audits

---

### Scenario 4: Intent Detection Failure

**Symptoms:**
- Low intent coverage
- Incorrect intent detection
- User complaints
- Quality degradation

**Immediate Actions:**
1. Review intent detection logic
2. Check for new patterns
3. Update intent rules if needed
4. Monitor detection accuracy

**Resolution:**
1. Update intent detection
2. Add new patterns
3. Test improvements
4. Deploy fix

**Prevention:**
- Regular intent review
- Pattern monitoring
- User feedback integration
- Continuous improvement

---

## Emergency Procedures

### Emergency Shutdown

**When to Use:**
- Critical safety violations
- System-wide failures
- Data breaches
- Legal/compliance violations

**Procedure:**
1. **Notify:** CTO/Technical Lead immediately
2. **Execute:** Shutdown command
3. **Redirect:** All traffic to human staff
4. **Notify:** All stakeholders
5. **Document:** Incident details
6. **Begin:** Incident response process

**Authority:** CTO / Technical Lead

**Command:**
```bash
# Emergency shutdown
curl -X POST https://api.example.com/admin/shutdown \
  -H "Authorization: Bearer $EMERGENCY_TOKEN"
```

---

### Emergency Rollback

**When to Use:**
- Recent deployment causing issues
- Quality degradation after deploy
- System failures after deploy

**Procedure:**
1. **Identify:** Last known good version
2. **Execute:** Rollback command
3. **Verify:** System health
4. **Notify:** Stakeholders
5. **Document:** Rollback details
6. **Begin:** Incident response process

**Authority:** AI Operations Team

**Command:**
```bash
# Emergency rollback
git revert HEAD
pnpm deploy --rollback
```

---

## Incident Report Template

```markdown
# Incident Report

**Incident ID:** INC-YYYY-MMDD-XXX
**Date:** [Date]
**Severity:** [P0/P1/P2/P3]
**Status:** [Open/Resolved/Closed]
**Reporter:** [Name]
**Owner:** [Name]

## Summary
[One-sentence description of incident]

## Timeline
- **[Time]** - Incident detected
- **[Time]** - Assessment started
- **[Time]** - Containment implemented
- **[Time]** - Resolution identified
- **[Time]** - Fix deployed
- **[Time]** - Incident resolved

## Impact
- **Affected Systems:** [List systems]
- **Affected Users:** [Number/Description]
- **Duration:** [Time]
- **Business Impact:** [Description]
- **Customer Impact:** [Description]

## Root Cause
[Detailed root cause analysis]

## Resolution
[Steps taken to resolve]

## Action Items
- [ ] [Action 1] - Owner: [Name] - Due: [Date]
- [ ] [Action 2] - Owner: [Name] - Due: [Date]
- [ ] [Action 3] - Owner: [Name] - Due: [Date]

## Prevention
[Measures to prevent recurrence]

## Lessons Learned
[Key takeaways and improvements]

## Sign-Off
- **Reviewed By:** [Name] - [Date]
- **Approved By:** [Name] - [Date]
```

---

## Contact Information

### On-Call Engineer

**Primary:** [Name] - [Phone] - [Email]  
**Secondary:** [Name] - [Phone] - [Email]

**Escalation:**
- **CTO:** [Name] - [Phone] - [Email]
- **Technical Lead:** [Name] - [Phone] - [Email]

### Stakeholders

**Customer Service:**
- Manager: [Name] - [Phone] - [Email]
- Team: [Phone] - [Email]

**Management:**
- Product Manager: [Name] - [Phone] - [Email]
- Executive Team: [Email]

---

## Tools and Resources

### Monitoring Dashboards

- **System Health:** [URL]
- **Quality Metrics:** [URL]
- **Performance:** [URL]
- **Alerts:** [URL]

### Incident Tracking

- **System:** [Tool Name]
- **URL:** [URL]
- **Access:** [Instructions]

### Documentation

- **AI Governance:** `AI_GOVERNANCE.md`
- **Safety Gates:** `SAFETY_GATES.md`
- **Role Prompts:** `ROLE_PROMPTS.md`
- **Chat Log Schema:** `CHAT_LOG_SCHEMA.md`

---

## Checklist: Incident Response

### Detection (0-15 minutes)

- [ ] Incident detected
- [ ] Incident logged
- [ ] Severity classified
- [ ] On-call notified
- [ ] Initial context gathered

### Assessment (15-60 minutes)

- [ ] Impact assessed
- [ ] Root cause identified (or hypothesis)
- [ ] Affected systems/users identified
- [ ] Stakeholders notified (if needed)

### Containment (0-2 hours)

- [ ] Containment strategy chosen
- [ ] Containment implemented
- [ ] Propagation stopped
- [ ] Workarounds in place
- [ ] Stakeholders updated

### Resolution (1-24 hours)

- [ ] Root cause confirmed
- [ ] Fix developed
- [ ] Fix tested
- [ ] Fix deployed
- [ ] Resolution verified
- [ ] Monitoring active

### Post-Incident (1 week)

- [ ] Incident report written
- [ ] Root cause analysis complete
- [ ] Action items created
- [ ] Playbook updated
- [ ] Team review conducted
- [ ] Lessons learned documented

---

*Keep this playbook accessible and up-to-date.*  
*Review and update quarterly.*
