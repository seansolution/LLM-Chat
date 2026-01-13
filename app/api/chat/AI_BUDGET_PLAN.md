# Annual AI Budget Plan

**Fiscal Year:** 2024  
**Version:** 1.0  
**Last Updated:** 2024  
**Purpose:** Comprehensive annual budget plan for AI operations with guardrails and ROI expectations

---

## Executive Summary

This document outlines the annual budget plan for AI operations, including fixed costs, variable costs, and human costs. Includes budget guardrails, ROI expectations, and management-ready financial projections.

**Key Highlights:**
- **Total Annual Budget:** 1,764,000 THB (Year 2+)
- **Total Year 1 Budget:** 2,104,000 THB (including initial development)
- **Expected ROI:** 2,177% (Year 2+)
- **Payback Period:** < 1 month
- **Budget Guardrails:** Monthly spending limits and approval thresholds

---

## 1. Budget Categories

### 1.1 Fixed Costs

**Definition:** Costs that remain constant regardless of usage volume.

#### Infrastructure (Fixed)

| Component | Monthly (THB) | Annual (THB) | Notes |
|----------|---------------|---------------|-------|
| **Server/Compute** | 5,000 | 60,000 | Local Ollama server (Mistral 7B) |
| **Storage** | 500 | 6,000 | Knowledge base, logs, backups |
| **Network** | 1,000 | 12,000 | Bandwidth, CDN (if applicable) |
| **Monitoring Tools** | 1,500 | 18,000 | Dashboards, alerting |
| **Subtotal** | **8,000** | **96,000** | |

**Guardrails:**
- Maximum monthly increase: 10% (requires approval)
- Annual budget: 96,000 THB (fixed)

---

#### Software (Fixed)

| Component | Monthly (THB) | Annual (THB) | Notes |
|----------|---------------|---------------|-------|
| **LLM License** | 0 | 0 | Mistral 7B (open source) |
| **Development Tools** | 2,000 | 24,000 | IDE, version control, CI/CD |
| **Database** | 1,000 | 12,000 | PostgreSQL, Redis (if applicable) |
| **Third-Party Services** | 1,500 | 18,000 | Analytics, logging (if applicable) |
| **Subtotal** | **4,500** | **54,000** | |

**Guardrails:**
- Maximum monthly increase: 15% (requires approval)
- Annual budget: 54,000 THB (fixed)

---

#### Personnel (Fixed)

| Role | Monthly (THB) | Annual (THB) | FTE | Notes |
|------|---------------|---------------|-----|-------|
| **AI Engineer** | 40,000 | 480,000 | 0.5 | Development, maintenance |
| **DevOps Engineer** | 17,500 | 210,000 | 0.25 | Infrastructure, monitoring |
| **Data Analyst** | 15,000 | 180,000 | 0.25 | Metrics, reporting |
| **Support Staff** | 5,000 | 60,000 | 0.1 | Handoff handling (if dedicated) |
| **Subtotal** | **77,500** | **930,000** | **1.1** | |

**Guardrails:**
- Maximum FTE increase: 0.2 (requires approval)
- Annual budget: 930,000 THB (fixed)
- Salary increases: Max 5% annually (standard review)

---

#### Overhead (Fixed)

| Component | Monthly (THB) | Annual (THB) | Notes |
|----------|---------------|---------------|-------|
| **Training** | 3,000 | 36,000 | Team training, certifications |
| **Documentation** | 2,000 | 24,000 | Documentation maintenance |
| **Governance** | 2,000 | 24,000 | Compliance, audits, reviews |
| **Subtotal** | **7,000** | **84,000** | |

**Guardrails:**
- Maximum monthly increase: 20% (requires approval)
- Annual budget: 84,000 THB (fixed)

---

### 1.2 Variable Costs

**Definition:** Costs that scale with usage volume (conversations, API calls, etc.).

#### Development (Variable)

| Component | Monthly (THB) | Annual (THB) | Notes |
|----------|---------------|---------------|-------|
| **Feature Development** | 30,000 | 360,000 | New features, improvements |
| **Maintenance** | 10,000 | 120,000 | Bug fixes, updates |
| **Knowledge Base Updates** | 5,000 | 60,000 | Content updates, new services |
| **Performance Optimization** | 5,000 | 60,000 | Speed, quality improvements |
| **Subtotal** | **50,000** | **600,000** | |

**Variable Factors:**
- Feature development scales with roadmap priority
- Maintenance scales with system complexity
- Knowledge base updates scale with service changes

**Guardrails:**
- Maximum monthly increase: 25% (requires approval)
- Annual budget: 600,000 THB (variable, can adjust quarterly)

---

#### Infrastructure Scaling (Variable)

| Component | Base Monthly (THB) | Per 1K Conversations (THB) | Notes |
|-----------|-------------------|----------------------------|-------|
| **Server Scaling** | 5,000 | 500 | Additional compute for high volume |
| **Storage Scaling** | 500 | 50 | Additional storage for logs |
| **Network Scaling** | 1,000 | 100 | Additional bandwidth |
| **Subtotal** | **6,500** | **650** | |

**Calculation:**
```
Variable Infrastructure = Base + (Conversations / 1000) × 650
```

**Example:**
- 1,000 conversations/month: 6,500 + (1000/1000) × 650 = 7,150 THB
- 2,000 conversations/month: 6,500 + (2000/1000) × 650 = 7,800 THB

**Guardrails:**
- Maximum scaling: 2x base cost (requires approval)
- Alert threshold: 1.5x base cost

---

### 1.3 Human Costs

**Definition:** Personnel-related costs including salaries, benefits, and training.

#### Direct Personnel Costs

| Role | Base Salary (THB/month) | Benefits (THB/month) | Total (THB/month) | Annual (THB) | FTE |
|------|------------------------|---------------------|-------------------|--------------|-----|
| **AI Engineer** | 40,000 | 8,000 | 48,000 | 576,000 | 0.5 |
| **DevOps Engineer** | 17,500 | 3,500 | 21,000 | 252,000 | 0.25 |
| **Data Analyst** | 15,000 | 3,000 | 18,000 | 216,000 | 0.25 |
| **Support Staff** | 5,000 | 1,000 | 6,000 | 72,000 | 0.1 |
| **Subtotal** | **77,500** | **15,500** | **93,000** | **1,116,000** | **1.1** |

**Note:** Benefits include health insurance, social security, bonuses (estimated at 20% of base salary).

**Guardrails:**
- Maximum FTE increase: 0.2 per quarter (requires approval)
- Salary increases: Max 5% annually (standard review)
- Benefits: Fixed at 20% of base salary

---

#### Training & Development

| Component | Annual (THB) | Notes |
|-----------|--------------|-------|
| **Technical Training** | 24,000 | AI/ML courses, certifications |
| **Conference Attendance** | 12,000 | Industry conferences, workshops |
| **Internal Training** | 0 | Internal knowledge sharing (no cost) |
| **Subtotal** | **36,000** | |

**Guardrails:**
- Maximum annual training budget: 50,000 THB
- Requires manager approval for individual training > 10,000 THB

---

#### Recruitment & Onboarding

| Component | Annual (THB) | Notes |
|-----------|--------------|-------|
| **Recruitment Costs** | 20,000 | Job postings, recruiter fees |
| **Onboarding** | 10,000 | New hire setup, training |
| **Subtotal** | **30,000** | |

**Guardrails:**
- Only applicable when hiring new FTE
- Requires approval for recruitment costs > 15,000 THB per position

---

## 2. Annual Budget Summary

### 2.1 Year 1 Budget (Including Initial Development)

| Category | Fixed (THB) | Variable (THB) | One-Time (THB) | Total (THB) |
|----------|-------------|----------------|----------------|-------------|
| **Infrastructure** | 96,000 | - | - | 96,000 |
| **Software** | 54,000 | - | - | 54,000 |
| **Development** | 600,000 | - | 340,000 | 940,000 |
| **Operations (Personnel)** | 930,000 | - | - | 930,000 |
| **Overhead** | 84,000 | - | - | 84,000 |
| **TOTAL** | **1,764,000** | **-** | **340,000** | **2,104,000** |

---

### 2.2 Year 2+ Budget (Ongoing Operations)

| Category | Fixed (THB) | Variable (THB) | Total (THB) |
|----------|-------------|----------------|-------------|
| **Infrastructure** | 96,000 | - | 96,000 |
| **Software** | 54,000 | - | 54,000 |
| **Development** | - | 600,000 | 600,000 |
| **Operations (Personnel)** | 930,000 | - | 930,000 |
| **Overhead** | 84,000 | - | 84,000 |
| **TOTAL** | **1,164,000** | **600,000** | **1,764,000** |

---

### 2.3 Monthly Budget Breakdown

| Month | Fixed (THB) | Variable (THB) | Total (THB) | Cumulative (THB) |
|-------|-------------|----------------|-------------|------------------|
| **Jan** | 97,000 | 50,000 | 147,000 | 147,000 |
| **Feb** | 97,000 | 50,000 | 147,000 | 294,000 |
| **Mar** | 97,000 | 50,000 | 147,000 | 441,000 |
| **Apr** | 97,000 | 50,000 | 147,000 | 588,000 |
| **May** | 97,000 | 50,000 | 147,000 | 735,000 |
| **Jun** | 97,000 | 50,000 | 147,000 | 882,000 |
| **Jul** | 97,000 | 50,000 | 147,000 | 1,029,000 |
| **Aug** | 97,000 | 50,000 | 147,000 | 1,176,000 |
| **Sep** | 97,000 | 50,000 | 147,000 | 1,323,000 |
| **Oct** | 97,000 | 50,000 | 147,000 | 1,470,000 |
| **Nov** | 97,000 | 50,000 | 147,000 | 1,617,000 |
| **Dec** | 97,000 | 50,000 | 147,000 | 1,764,000 |
| **TOTAL** | **1,164,000** | **600,000** | **1,764,000** | |

**Note:** Fixed costs include infrastructure (8,000), software (4,500), personnel (77,500), and overhead (7,000) = 97,000 THB/month.

---

## 3. Budget Guardrails

### 3.1 Spending Limits

| Category | Monthly Limit (THB) | Annual Limit (THB) | Approval Required |
|----------|---------------------|-------------------|-------------------|
| **Infrastructure** | 10,000 | 120,000 | > 10% increase |
| **Software** | 6,000 | 72,000 | > 15% increase |
| **Development** | 75,000 | 900,000 | > 25% increase |
| **Operations** | 100,000 | 1,200,000 | > 10% increase |
| **Overhead** | 10,000 | 120,000 | > 20% increase |
| **TOTAL** | **201,000** | **2,412,000** | > 15% total increase |

---

### 3.2 Approval Thresholds

**Manager Approval Required:**
- Single expense > 10,000 THB
- Monthly category increase > 10%
- New FTE hiring
- Training costs > 10,000 THB per person

**Director Approval Required:**
- Single expense > 50,000 THB
- Monthly category increase > 25%
- Annual budget increase > 15%
- New infrastructure investments > 100,000 THB

**Executive Approval Required:**
- Single expense > 200,000 THB
- Annual budget increase > 25%
- Major infrastructure changes
- Strategic hiring decisions

---

### 3.3 Budget Monitoring

**Monthly Reviews:**
- Actual vs. budget comparison
- Variance analysis (> 10% triggers review)
- Forecast updates
- Guardrail compliance check

**Quarterly Reviews:**
- Budget reforecast
- ROI assessment
- Cost optimization opportunities
- Strategic adjustments

**Annual Reviews:**
- Full budget review
- ROI evaluation
- Next year budget planning
- Strategic planning

---

## 4. ROI Expectations

### 4.1 Expected ROI

**Year 1:**
- **Total Cost:** 2,104,000 THB
- **Expected Value:** 48,780,000 THB
- **Expected ROI:** 2,218%
- **Payback Period:** < 1 month

**Year 2+:**
- **Total Cost:** 1,764,000 THB/year
- **Expected Value:** 57,780,000 THB/year
- **Expected ROI:** 3,177%
- **Payback Period:** < 1 month

---

### 4.2 ROI Targets

| Metric | Target | Minimum Acceptable | Notes |
|--------|--------|-------------------|-------|
| **ROI** | ≥ 2,000% | ≥ 500% | Annual ROI |
| **Payback Period** | ≤ 3 months | ≤ 6 months | Time to recover initial investment |
| **Cost per Conversation** | ≤ 200 THB | ≤ 300 THB | Efficiency metric |
| **Cost per Conversion** | ≤ 1,500 THB | ≤ 2,500 THB | Efficiency metric |
| **Value per Conversation** | ≥ 3,000 THB | ≥ 2,000 THB | Value metric |

---

### 4.3 ROI Monitoring

**Monthly:**
- Actual ROI calculation
- Comparison to targets
- Variance analysis

**Quarterly:**
- ROI trend analysis
- Forecast updates
- Target adjustments (if needed)

**Annual:**
- Full ROI evaluation
- Target setting for next year
- Strategic recommendations

---

## 5. Sample Budget Table

### 5.1 Detailed Annual Budget

| Category | Subcategory | Monthly (THB) | Annual (THB) | Type | Notes |
|----------|-------------|---------------|--------------|------|-------|
| **Infrastructure** | Server/Compute | 5,000 | 60,000 | Fixed | Local Ollama server |
| | Storage | 500 | 6,000 | Fixed | Knowledge base, logs |
| | Network | 1,000 | 12,000 | Fixed | Bandwidth, CDN |
| | Monitoring | 1,500 | 18,000 | Fixed | Dashboards, alerting |
| | **Subtotal** | **8,000** | **96,000** | | |
| **Software** | LLM License | 0 | 0 | Fixed | Open source (Mistral 7B) |
| | Dev Tools | 2,000 | 24,000 | Fixed | IDE, CI/CD |
| | Database | 1,000 | 12,000 | Fixed | PostgreSQL, Redis |
| | Third-Party | 1,500 | 18,000 | Fixed | Analytics, logging |
| | **Subtotal** | **4,500** | **54,000** | | |
| **Development** | Features | 30,000 | 360,000 | Variable | New features |
| | Maintenance | 10,000 | 120,000 | Variable | Bug fixes |
| | Knowledge Base | 5,000 | 60,000 | Variable | Content updates |
| | Optimization | 5,000 | 60,000 | Variable | Performance |
| | **Subtotal** | **50,000** | **600,000** | | |
| **Operations** | AI Engineer | 40,000 | 480,000 | Fixed | 0.5 FTE |
| | DevOps Engineer | 17,500 | 210,000 | Fixed | 0.25 FTE |
| | Data Analyst | 15,000 | 180,000 | Fixed | 0.25 FTE |
| | Support Staff | 5,000 | 60,000 | Fixed | 0.1 FTE |
| | **Subtotal** | **77,500** | **930,000** | | |
| **Overhead** | Training | 3,000 | 36,000 | Fixed | Team training |
| | Documentation | 2,000 | 24,000 | Fixed | Doc maintenance |
| | Governance | 2,000 | 24,000 | Fixed | Compliance, audits |
| | **Subtotal** | **7,000** | **84,000** | | |
| **TOTAL** | | **147,000** | **1,764,000** | | |

---

### 5.2 Year 1 Budget (Including Initial Development)

| Category | Annual (THB) | One-Time (THB) | Total Year 1 (THB) |
|----------|--------------|----------------|-------------------|
| **Infrastructure** | 96,000 | - | 96,000 |
| **Software** | 54,000 | - | 54,000 |
| **Development** | 600,000 | 340,000 | 940,000 |
| **Operations** | 930,000 | - | 930,000 |
| **Overhead** | 84,000 | - | 84,000 |
| **TOTAL** | **1,764,000** | **340,000** | **2,104,000** |

---

### 5.3 Budget by Quarter

| Quarter | Fixed (THB) | Variable (THB) | Total (THB) | Cumulative (THB) |
|----------|-------------|---------------|-------------|-------------------|
| **Q1** | 291,000 | 150,000 | 441,000 | 441,000 |
| **Q2** | 291,000 | 150,000 | 441,000 | 882,000 |
| **Q3** | 291,000 | 150,000 | 441,000 | 1,323,000 |
| **Q4** | 291,000 | 150,000 | 441,000 | 1,764,000 |
| **TOTAL** | **1,164,000** | **600,000** | **1,764,000** | |

---

## 6. Budget Variance Management

### 6.1 Variance Thresholds

| Variance | Action Required |
|----------|----------------|
| **< 5%** | No action (normal variance) |
| **5-10%** | Review and document |
| **10-15%** | Manager review and explanation |
| **15-25%** | Director review and corrective action |
| **> 25%** | Executive review and budget revision |

---

### 6.2 Variance Reporting

**Monthly Variance Report:**
- Actual vs. budget by category
- Variance percentage
- Explanation for variances > 10%
- Forecast update

**Quarterly Variance Report:**
- Quarterly actual vs. budget
- Trend analysis
- Corrective actions taken
- Forecast adjustments

---

## 7. Budget Optimization Opportunities

### 7.1 Cost Reduction Opportunities

| Opportunity | Potential Savings (THB/year) | Implementation Effort | Priority |
|-------------|------------------------------|----------------------|----------|
| **Optimize Infrastructure** | 10,000 - 20,000 | Low | Medium |
| **Consolidate Software Tools** | 5,000 - 15,000 | Medium | Low |
| **Automate Development Tasks** | 50,000 - 100,000 | High | High |
| **Optimize Personnel Allocation** | 50,000 - 150,000 | Medium | High |
| **Reduce Overhead** | 10,000 - 20,000 | Low | Low |

---

### 7.2 Value Optimization Opportunities

| Opportunity | Potential Value Increase | Implementation Effort | Priority |
|-------------|-------------------------|----------------------|----------|
| **Improve Conversion Rate** | +20-30% revenue | Medium | High |
| **Increase Deal Value** | +10-20% revenue | Medium | High |
| **Expand Service Coverage** | +15-25% revenue | High | Medium |
| **Improve Response Quality** | +5-10% conversion | Low | Medium |

---

## 8. Budget Approval Process

### 8.1 Annual Budget Approval

1. **Budget Preparation** (Month 11)
   - Review current year performance
   - Forecast next year requirements
   - Prepare budget proposal

2. **Review & Approval** (Month 12)
   - Manager review
   - Director approval
   - Executive sign-off

3. **Budget Communication** (Month 12)
   - Communicate approved budget
   - Set up monitoring systems
   - Train team on guardrails

---

### 8.2 Budget Amendment Process

**Request Process:**
1. Submit budget amendment request
2. Provide justification and business case
3. Review by manager
4. Approval by appropriate level (based on threshold)

**Approval Timeline:**
- < 10,000 THB: 1-2 business days
- 10,000 - 50,000 THB: 3-5 business days
- > 50,000 THB: 1-2 weeks

---

## 9. Budget Tracking & Reporting

### 9.1 Monthly Reports

**Report Contents:**
- Actual spending by category
- Budget vs. actual variance
- Forecast for remainder of year
- Guardrail compliance status
- ROI metrics

**Delivery:**
- Report generated: 5th of each month
- Review meeting: 10th of each month
- Distribution: Management team

---

### 9.2 Quarterly Reports

**Report Contents:**
- Quarterly actual vs. budget
- Year-to-date performance
- ROI analysis
- Trend analysis
- Forecast updates
- Recommendations

**Delivery:**
- Report generated: 10th of quarter end month
- Review meeting: 15th of quarter end month
- Distribution: Management team, executives

---

### 9.3 Annual Reports

**Report Contents:**
- Full year actual vs. budget
- ROI evaluation
- Cost optimization achievements
- Value delivered
- Lessons learned
- Next year budget proposal

**Delivery:**
- Report generated: 15th of December
- Review meeting: 20th of December
- Distribution: Management team, executives, board

---

## 10. Assumptions & Risks

### 10.1 Key Assumptions

1. **Conversation Volume:**
   - Base: 1,000 conversations/month
   - Growth: 5% monthly
   - No major external disruptions

2. **Conversion Rate:**
   - Base: 15%
   - Stable or improving
   - No major market changes

3. **Personnel:**
   - No major turnover
   - Standard salary increases (5%)
   - FTE allocation stable

4. **Infrastructure:**
   - Current setup sufficient
   - No major upgrades required
   - Scaling costs predictable

---

### 10.2 Risk Factors

**High Impact Risks:**
- Market competition (affects conversion rate)
- Economic conditions (affects deal value)
- Key personnel turnover (affects operations)
- Infrastructure failures (affects availability)

**Mitigation:**
- Regular market monitoring
- Diversified revenue streams
- Knowledge documentation
- Infrastructure redundancy

---

## 11. Management Dashboard

### 11.1 Budget Summary Dashboard

| Metric | Budget (THB) | Actual (THB) | Variance | Status |
|--------|--------------|--------------|----------|--------|
| **Total Annual Budget** | 1,764,000 | [Actual] | [±X]% | ✅/⚠️/❌ |
| **Fixed Costs** | 1,164,000 | [Actual] | [±X]% | ✅/⚠️/❌ |
| **Variable Costs** | 600,000 | [Actual] | [±X]% | ✅/⚠️/❌ |
| **ROI** | 3,177% | [Actual] | [±X]% | ✅/⚠️/❌ |
| **Cost per Conversation** | 147 | [Actual] | [±X]% | ✅/⚠️/❌ |

**Status Legend:**
- ✅ On track (variance < 5%)
- ⚠️ Review needed (variance 5-15%)
- ❌ Action required (variance > 15%)

---

### 11.2 Monthly Budget Dashboard

| Month | Budget (THB) | Actual (THB) | Variance | Cumulative (THB) | Status |
|-------|--------------|--------------|----------|------------------|--------|
| Jan | 147,000 | [Actual] | [±X]% | [Cumulative] | ✅/⚠️/❌ |
| Feb | 147,000 | [Actual] | [±X]% | [Cumulative] | ✅/⚠️/❌ |
| ... | ... | ... | ... | ... | ... |
| Dec | 147,000 | [Actual] | [±X]% | [Cumulative] | ✅/⚠️/❌ |

---

## 12. Budget Review Schedule

| Review Type | Frequency | Participants | Deliverable |
|-------------|-----------|--------------|-------------|
| **Monthly Review** | Monthly | Manager, Team Leads | Monthly variance report |
| **Quarterly Review** | Quarterly | Manager, Director | Quarterly analysis report |
| **Annual Review** | Annually | Management, Executives | Annual budget report |
| **Ad-hoc Review** | As needed | Based on trigger | Variance explanation |

---

*This budget plan should be reviewed and updated annually.*  
*Last reviewed: [Date]*  
*Next review: [Date]*
