# Monthly AI Performance Review - Template

**Quick reference template for monthly performance reviews.**

---

## Template Structure

```
1. Executive Summary
2. AI Sales Admin Performance
3. AI Support Agent Performance
4. AI Operations Analyst Performance
5. Cross-Role Analysis
6. Business Impact
7. Key Insights & Recommendations
8. Action Plan
9. Next Month Goals
10. Appendix
```

---

## Quick Fill Guide

### 1. Executive Summary

**Copy this section and fill in:**

```markdown
## Executive Summary

### Overall Performance Score: [XX]/100

**Status:** 🟢 **Exceeding** | 🟡 **Meeting** | 🔴 **Below Target**

### Key Highlights

- **Total Conversations:** [X,XXX] (↑/↓ [X]% vs previous month)
- **Overall Conversion Rate:** [XX]% (Target: ≥15%)
- **System Uptime:** [XX]% (Target: ≥99.5%)
- **Forbidden Violations:** [X] (Target: 0)

### Critical Issues

- [ ] [Issue 1: Description]
- [ ] [Issue 2: Description]

### Recommendations

1. [Recommendation 1]
2. [Recommendation 2]
3. [Recommendation 3]
```

### 2. KPI Tables

**For each role, copy this table:**

```markdown
| KPI | Target | Actual | Status | Trend |
|-----|--------|--------|--------|-------|
| **KPI Name** | ≥ XX% | [XX]% | 🟢/🟡/🔴 | ↑/↓ |
```

**Status Legend:**
- 🟢 = Exceeding target
- 🟡 = Meeting target
- 🔴 = Below target

**Trend Legend:**
- ↑ = Improving
- ↓ = Declining
- → = Stable

### 3. Insights Section

**Use this structure:**

```markdown
### Insights

#### Strengths
- ✅ [Strength 1: Specific example with data]
- ✅ [Strength 2: Specific example with data]

#### Weaknesses
- ⚠️ [Weakness 1: Specific issue with impact]
- ⚠️ [Weakness 2: Specific issue with impact]

#### Trends
- 📈 [Trend 1: Description with comparison to previous month]
- 📉 [Trend 2: Description with comparison to previous month]
```

### 4. Action Items Table

**Copy this table:**

```markdown
| Priority | Action Item | Owner | Due Date | Status |
|----------|------------|-------|----------|--------|
| 🔴 High | [Action 1: Description] | [Owner] | [Date] | ⏳ In Progress |
| 🟡 Medium | [Action 2: Description] | [Owner] | [Date] | 📋 Planned |
| 🟢 Low | [Action 3: Description] | [Owner] | [Date] | 📋 Planned |
```

**Priority Legend:**
- 🔴 High = Critical, must fix immediately
- 🟡 Medium = Important, fix this month
- 🟢 Low = Nice to have, fix when possible

**Status Legend:**
- ⏳ In Progress = Currently working on
- 📋 Planned = Scheduled but not started
- ✅ Complete = Finished
- ❌ Blocked = Cannot proceed

---

## SQL Queries for Data Extraction

### Sales KPIs

```sql
-- Pricing Answer Rate
SELECT 
  COUNT(*) FILTER (
    WHERE log_data->'pricing'->>'questionType' = 'explicit' 
    AND (log_data->'pricing'->>'containsPrice')::boolean = true
  )::numeric / 
  NULLIF(COUNT(*) FILTER (
    WHERE log_data->'pricing'->>'questionType' = 'explicit'
  ), 0)::numeric * 100 as pricing_answer_rate
FROM chat_logs
WHERE timestamp >= DATE_TRUNC('month', CURRENT_DATE)
  AND timestamp < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
  AND log_data->>'role' = 'SALES';

-- Conversion to Contact
SELECT 
  COUNT(*) FILTER (
    WHERE log_data->'userActions'->>'contactMethod' != 'none'
  )::numeric / 
  NULLIF(COUNT(*), 0)::numeric * 100 as conversion_rate
FROM chat_logs
WHERE timestamp >= DATE_TRUNC('month', CURRENT_DATE)
  AND timestamp < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
  AND log_data->>'role' = 'SALES';
```

### Support KPIs

```sql
-- Question Answer Rate
SELECT 
  COUNT(*) FILTER (
    WHERE log_data->'handoff'->>'status' = 'none'
  )::numeric / 
  NULLIF(COUNT(*), 0)::numeric * 100 as question_answer_rate
FROM chat_logs
WHERE timestamp >= DATE_TRUNC('month', CURRENT_DATE)
  AND timestamp < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
  AND log_data->>'role' = 'SUPPORT';

-- Handoff Rate
SELECT 
  COUNT(*) FILTER (
    WHERE log_data->'handoff'->>'status' IN ('requested', 'completed')
  )::numeric / 
  NULLIF(COUNT(*), 0)::numeric * 100 as handoff_rate
FROM chat_logs
WHERE timestamp >= DATE_TRUNC('month', CURRENT_DATE)
  AND timestamp < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
  AND log_data->>'role' = 'SUPPORT';
```

### Ops KPIs

```sql
-- System Quality Score (Composite)
SELECT 
  ROUND((
    (intent_coverage * 0.25) +
    (persona_accuracy * 0.25) +
    (pricing_answer_rate * 0.20) +
    (CASE WHEN safety_violations = 0 THEN 100 ELSE 0 END * 0.20) +
    (CASE WHEN avg_response_time < 2000 THEN 100 ELSE 0 END * 0.10)
  ), 2) as system_quality_score
FROM (
  SELECT 
    -- Intent Coverage
    COUNT(*) FILTER (WHERE log_data->'intent'->>'detected' != 'unknown')::numeric / 
    NULLIF(COUNT(*), 0)::numeric * 100 as intent_coverage,
    -- Persona Accuracy (if expected persona exists)
    COUNT(*) FILTER (
      WHERE log_data->'quality'->>'personaCorrect' = 'true'
    )::numeric / 
    NULLIF(COUNT(*) FILTER (WHERE log_data->'quality'->>'expectedPersona' IS NOT NULL), 0)::numeric * 100 as persona_accuracy,
    -- Pricing Answer Rate
    COUNT(*) FILTER (
      WHERE log_data->'pricing'->>'questionType' = 'explicit' 
      AND (log_data->'pricing'->>'containsPrice')::boolean = true
    )::numeric / 
    NULLIF(COUNT(*) FILTER (WHERE log_data->'pricing'->>'questionType' = 'explicit'), 0)::numeric * 100 as pricing_answer_rate,
    -- Safety Violations
    COUNT(*) FILTER (
      WHERE (log_data->'safety'->>'violationCount')::int > 0
    ) as safety_violations,
    -- Average Response Time
    AVG((log_data->'performance'->>'responseTimeMs')::numeric) as avg_response_time
  FROM chat_logs
  WHERE timestamp >= DATE_TRUNC('month', CURRENT_DATE)
    AND timestamp < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
) metrics;
```

### Cross-Role Metrics

```sql
-- Overall Conversion Rate
SELECT 
  COUNT(*) FILTER (
    WHERE log_data->'userActions'->>'contactMethod' != 'none'
  )::numeric / 
  NULLIF(COUNT(*), 0)::numeric * 100 as overall_conversion_rate
FROM chat_logs
WHERE timestamp >= DATE_TRUNC('month', CURRENT_DATE)
  AND timestamp < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month';

-- Role Distribution
SELECT 
  log_data->>'role' as role,
  COUNT(*) as conversations,
  ROUND(COUNT(*)::numeric / NULLIF((SELECT COUNT(*) FROM chat_logs WHERE timestamp >= DATE_TRUNC('month', CURRENT_DATE) AND timestamp < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'), 0)::numeric * 100, 2) as percentage
FROM chat_logs
WHERE timestamp >= DATE_TRUNC('month', CURRENT_DATE)
  AND timestamp < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
GROUP BY role
ORDER BY conversations DESC;
```

---

## Calculation Formulas

### Pricing Answer Rate
```
Pricing Answer Rate = (Pricing Questions with Price / Total Pricing Questions) × 100
```

### Conversion Rate
```
Conversion Rate = (Conversations with Contact / Total Conversations) × 100
```

### System Quality Score
```
System Quality Score = 
  (Intent Coverage × 0.25) +
  (Persona Accuracy × 0.25) +
  (Pricing Answer Rate × 0.20) +
  (Safety Score × 0.20) +
  (Response Time Score × 0.10)
```

### Support Workload Reduction
```
Workload Reduction = (1 - Handoff Rate) × 100
```

---

## Best Practices

1. **Be Data-Driven:** Always include specific numbers and percentages
2. **Compare Trends:** Show month-over-month changes
3. **Identify Root Causes:** Don't just report metrics, explain why
4. **Prioritize Actions:** Focus on high-impact improvements
5. **Set Clear Goals:** Make next month's goals specific and measurable
6. **Track Progress:** Follow up on action items from previous reviews

---

## Review Checklist

Before finalizing the review, ensure:

- [ ] All KPI tables are filled with actual data
- [ ] Status indicators (🟢/🟡/🔴) are accurate
- [ ] Trends (↑/↓) are calculated correctly
- [ ] Insights are specific and actionable
- [ ] Action items have owners and due dates
- [ ] Next month goals are specific and measurable
- [ ] All critical issues are documented
- [ ] Recommendations are prioritized
- [ ] Data sources are documented
- [ ] Review is signed off by stakeholders

---

*Use this template as a starting point. Customize sections as needed for your organization.*
