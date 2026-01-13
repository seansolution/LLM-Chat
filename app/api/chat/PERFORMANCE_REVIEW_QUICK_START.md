# Monthly AI Performance Review - Quick Start

## Overview

Monthly performance review framework for AI Sales, Support, and Ops roles with KPI tables, insights, and action items.

---

## Files

- **`MONTHLY_PERFORMANCE_REVIEW.md`** - Complete review template with all sections
- **`PERFORMANCE_REVIEW_TEMPLATE.md`** - Quick reference template and SQL queries
- **`PERFORMANCE_REVIEW_QUICK_START.md`** - This file

---

## Quick Reference

### Review Structure

1. **Executive Summary** - Overall score, highlights, critical issues
2. **AI Sales Admin** - Sales KPIs, metrics, insights, actions
3. **AI Support Agent** - Support KPIs, metrics, insights, actions
4. **AI Operations Analyst** - Ops KPIs, metrics, insights, actions
5. **Cross-Role Analysis** - System-wide metrics, role distribution
6. **Business Impact** - Revenue, cost, satisfaction
7. **Key Insights & Recommendations** - Top insights and strategic recommendations
8. **Action Plan** - Immediate, short-term, long-term actions
9. **Next Month Goals** - Specific, measurable goals
10. **Appendix** - Data sources, calculations, notes

---

## Key KPIs by Role

### AI Sales Admin

| KPI | Target |
|-----|--------|
| Pricing Answer Rate | ≥ 95% |
| Soft CTA Rate | ≥ 98% |
| Conversion to Contact | ≥ 25% |
| Forbidden Violations | ≤ 0% |

### AI Support Agent

| KPI | Target |
|-----|--------|
| Question Answer Rate | ≥ 70% |
| Handoff Rate | ≤ 30% |
| Service Scope Clarity | ≥ 80% |
| Forbidden Violations | ≤ 0% |

### AI Operations Analyst

| KPI | Target |
|-----|--------|
| System Quality Score | ≥ 85 |
| Metric Coverage | ≥ 95% |
| Risk Detection Rate | ≥ 90% |
| System Uptime | ≥ 99.5% |

---

## Quick Fill Steps

### Step 1: Extract Data

Run SQL queries from `PERFORMANCE_REVIEW_TEMPLATE.md` to get:
- KPI values for each role
- Volume metrics (conversations, questions, etc.)
- Quality metrics (answer rates, violations, etc.)
- Performance metrics (response times, etc.)

### Step 2: Fill KPI Tables

For each role, fill in:
- **Target** - From role dashboards
- **Actual** - From SQL queries
- **Status** - 🟢 Exceeding | 🟡 Meeting | 🔴 Below
- **Trend** - ↑ Improving | ↓ Declining | → Stable

### Step 3: Calculate Scores

**Overall Performance Score:**
```
Score = (KPIs Meeting Target / Total KPIs) × 100
```

**Role-Specific Score:**
```
Score = Weighted average of role KPIs
```

### Step 4: Identify Insights

**Strengths:**
- What's working well?
- Which KPIs exceed targets?
- What improvements were made?

**Weaknesses:**
- What's not working?
- Which KPIs are below targets?
- What issues need attention?

**Trends:**
- Month-over-month changes
- Improving or declining metrics
- Seasonal patterns

### Step 5: Create Action Items

**Priority Levels:**
- 🔴 High - Critical, fix immediately
- 🟡 Medium - Important, fix this month
- 🟢 Low - Nice to have, fix when possible

**Action Item Format:**
- Clear description
- Assigned owner
- Due date
- Status tracking

### Step 6: Set Next Month Goals

**SMART Goals:**
- Specific - Clear and well-defined
- Measurable - Can be quantified
- Achievable - Realistic and attainable
- Relevant - Aligned with business objectives
- Time-bound - Has a deadline

---

## Example Review Timeline

### Week 1: Data Collection
- [ ] Run SQL queries
- [ ] Extract metrics
- [ ] Calculate KPIs

### Week 2: Analysis
- [ ] Fill KPI tables
- [ ] Identify insights
- [ ] Compare trends

### Week 3: Review Draft
- [ ] Write insights
- [ ] Create action items
- [ ] Set next month goals

### Week 4: Finalize
- [ ] Review with stakeholders
- [ ] Get sign-offs
- [ ] Publish review

---

## Common Metrics to Track

### Volume Metrics
- Total conversations
- Questions by type
- Handoffs
- Contacts

### Quality Metrics
- Answer rates
- Accuracy rates
- Violation counts
- Clarity scores

### Performance Metrics
- Response times
- Uptime
- Error rates
- System health

### Business Metrics
- Conversion rates
- Revenue attribution
- Cost per conversion
- Customer satisfaction

---

## Tips for Effective Reviews

1. **Be Specific:** Use exact numbers, not approximations
2. **Show Trends:** Always compare to previous month
3. **Explain Why:** Don't just report metrics, explain causes
4. **Prioritize:** Focus on high-impact improvements
5. **Actionable:** Every insight should lead to an action
6. **Track Progress:** Follow up on previous action items

---

## Status Indicators

### KPI Status
- 🟢 **Exceeding** - Above target
- 🟡 **Meeting** - At or near target
- 🔴 **Below Target** - Needs attention

### Trend Indicators
- ↑ **Improving** - Better than last month
- ↓ **Declining** - Worse than last month
- → **Stable** - Same as last month

### Priority Levels
- 🔴 **High** - Critical, fix immediately
- 🟡 **Medium** - Important, fix this month
- 🟢 **Low** - Nice to have, fix when possible

### Action Status
- ⏳ **In Progress** - Currently working on
- 📋 **Planned** - Scheduled but not started
- ✅ **Complete** - Finished
- ❌ **Blocked** - Cannot proceed

---

## Review Checklist

Before finalizing:

- [ ] All KPI tables filled with actual data
- [ ] Status indicators are accurate
- [ ] Trends calculated correctly
- [ ] Insights are specific and actionable
- [ ] Action items have owners and due dates
- [ ] Next month goals are SMART
- [ ] All critical issues documented
- [ ] Recommendations prioritized
- [ ] Data sources documented
- [ ] Review signed off

---

## SQL Query Quick Reference

### Get Sales KPIs
```sql
SELECT 
  COUNT(*) FILTER (WHERE log_data->'pricing'->>'questionType' = 'explicit' AND (log_data->'pricing'->>'containsPrice')::boolean = true)::numeric / 
  NULLIF(COUNT(*) FILTER (WHERE log_data->'pricing'->>'questionType' = 'explicit'), 0)::numeric * 100 as pricing_answer_rate
FROM chat_logs
WHERE timestamp >= DATE_TRUNC('month', CURRENT_DATE)
  AND log_data->>'role' = 'SALES';
```

### Get Support KPIs
```sql
SELECT 
  COUNT(*) FILTER (WHERE log_data->'handoff'->>'status' = 'none')::numeric / 
  NULLIF(COUNT(*), 0)::numeric * 100 as question_answer_rate
FROM chat_logs
WHERE timestamp >= DATE_TRUNC('month', CURRENT_DATE)
  AND log_data->>'role' = 'SUPPORT';
```

### Get Overall Metrics
```sql
SELECT 
  COUNT(*) as total_conversations,
  COUNT(*) FILTER (WHERE log_data->'userActions'->>'contactMethod' != 'none')::numeric / 
  NULLIF(COUNT(*), 0)::numeric * 100 as conversion_rate
FROM chat_logs
WHERE timestamp >= DATE_TRUNC('month', CURRENT_DATE);
```

---

*See `MONTHLY_PERFORMANCE_REVIEW.md` for complete template.*  
*See `PERFORMANCE_REVIEW_TEMPLATE.md` for SQL queries and formulas.*
