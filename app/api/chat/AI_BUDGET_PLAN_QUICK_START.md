# Annual AI Budget Plan - Quick Start

**Quick reference for annual AI budget planning.**

---

## Budget Summary

### Year 1 (Including Initial Development)
- **Total:** 2,104,000 THB
- **One-Time:** 340,000 THB
- **Annual:** 1,764,000 THB

### Year 2+ (Ongoing Operations)
- **Total:** 1,764,000 THB/year
- **Monthly:** 147,000 THB

---

## Budget Breakdown

| Category | Monthly (THB) | Annual (THB) | Type |
|----------|---------------|--------------|------|
| **Infrastructure** | 8,000 | 96,000 | Fixed |
| **Software** | 4,500 | 54,000 | Fixed |
| **Development** | 50,000 | 600,000 | Variable |
| **Operations** | 77,500 | 930,000 | Fixed |
| **Overhead** | 7,000 | 84,000 | Fixed |
| **TOTAL** | **147,000** | **1,764,000** | |

---

## Guardrails

### Spending Limits

| Category | Monthly Limit | Annual Limit | Approval Threshold |
|----------|---------------|--------------|-------------------|
| Infrastructure | 10,000 | 120,000 | > 10% increase |
| Software | 6,000 | 72,000 | > 15% increase |
| Development | 75,000 | 900,000 | > 25% increase |
| Operations | 100,000 | 1,200,000 | > 10% increase |
| Overhead | 10,000 | 120,000 | > 20% increase |

### Approval Thresholds

- **Manager:** Single expense > 10,000 THB, Monthly increase > 10%
- **Director:** Single expense > 50,000 THB, Monthly increase > 25%
- **Executive:** Single expense > 200,000 THB, Annual increase > 15%

---

## ROI Expectations

### Targets

| Metric | Target | Minimum |
|--------|--------|---------|
| ROI | ≥ 2,000% | ≥ 500% |
| Payback Period | ≤ 3 months | ≤ 6 months |
| Cost per Conversation | ≤ 200 THB | ≤ 300 THB |
| Cost per Conversion | ≤ 1,500 THB | ≤ 2,500 THB |
| Value per Conversation | ≥ 3,000 THB | ≥ 2,000 THB |

### Expected Performance

- **Year 1 ROI:** 2,218%
- **Year 2+ ROI:** 3,177%
- **Payback Period:** < 1 month

---

## Variance Management

| Variance | Action |
|----------|--------|
| < 5% | No action (normal) |
| 5-10% | Review and document |
| 10-15% | Manager review |
| 15-25% | Director review |
| > 25% | Executive review |

---

## Usage Example

```typescript
import { createBudgetPlan, generateBudgetReport, requiresApproval } from './budget-calculator'

// Create budget plan
const plan = createBudgetPlan(2024)
console.log(formatBudgetPlan(plan))

// Track actual spending
const actuals = {
  Infrastructure: 95000,
  Software: 52000,
  Development: 580000,
  Operations: 940000,
  Overhead: 82000,
}

// Generate report
const report = generateBudgetReport(plan, actuals)
console.log(formatBudgetReport(report))

// Check approval requirement
const category = plan.categories.find(c => c.name === 'Development')
if (category) {
  const approval = requiresApproval(category, 60000)
  if (approval.requiresApproval) {
    console.log(`Approval required: ${approval.approvalLevel} - ${approval.reason}`)
  }
}
```

---

## Budget Review Schedule

- **Monthly:** Actual vs. budget comparison
- **Quarterly:** Budget reforecast, ROI assessment
- **Annual:** Full budget review, next year planning

---

*See `AI_BUDGET_PLAN.md` for complete documentation.*
