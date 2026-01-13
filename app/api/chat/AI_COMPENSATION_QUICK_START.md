# AI Compensation Model - Quick Start

**Quick reference for cost vs value analysis.**

---

## Quick Formulas

### ROI
```
ROI = ((Total Value - Total Cost) / Total Cost) × 100
```

### Payback Period
```
Payback Period (months) = Initial Investment / Monthly Net Value
```

### Cost per Conversation
```
Cost per Conversation = Monthly Cost / Monthly Conversations
```

### Cost per Conversion
```
Cost per Conversion = Monthly Cost / Monthly Conversions
```

### Value per Conversation
```
Value per Conversation = Monthly Value / Monthly Conversations
```

---

## Cost Components

### Monthly Costs

| Category | Typical Range (THB) |
|----------|---------------------|
| **Infrastructure** | 5,000 - 15,000 |
| **Software** | 2,000 - 10,000 |
| **Development** | 30,000 - 100,000 |
| **Operations** | 50,000 - 150,000 |
| **Overhead** | 5,000 - 15,000 |
| **TOTAL** | **92,000 - 290,000** |

### One-Time Costs

| Category | Typical Range (THB) |
|----------|---------------------|
| **Initial Development** | 200,000 - 500,000 |
| **Setup & Deployment** | 50,000 - 150,000 |
| **TOTAL** | **250,000 - 650,000** |

---

## Value Components

### Monthly Value

| Category | Typical Range (THB) |
|----------|---------------------|
| **Direct Revenue** | 1,000,000 - 10,000,000 |
| **Cost Savings** | 50,000 - 200,000 |
| **Efficiency Gains** | 50,000 - 200,000 |
| **TOTAL** | **1,100,000 - 10,400,000** |

---

## Example Calculation

### Inputs
- Monthly Conversations: 1,000
- Conversion Rate: 15%
- Average Deal Value: 25,000 THB
- Monthly Cost: 147,000 THB

### Calculations
- Conversions: 1,000 × 15% = 150
- Monthly Revenue: 150 × 25,000 = 3,750,000 THB
- Monthly Value: 3,750,000 + 147,500 (savings) = 3,897,500 THB
- Net Value: 3,897,500 - 147,000 = 3,750,500 THB
- **ROI: ((3,897,500 - 147,000) / 147,000) × 100 = 2,551%**

### Metrics
- Cost per Conversation: 147 THB
- Cost per Conversion: 980 THB
- Value per Conversation: 3,898 THB
- Net Value per Conversation: 3,751 THB

---

## Break-Even Analysis

### Break-Even Conversations
```
Break-Even = Monthly Cost / (Conversion Rate × Deal Value)
Example: 147,000 / (0.15 × 25,000) = 39 conversations/month
```

### Break-Even Conversion Rate
```
Break-Even = Monthly Cost / (Conversations × Deal Value)
Example: 147,000 / (1,000 × 25,000) = 0.59%
```

### Break-Even Deal Value
```
Break-Even = Monthly Cost / (Conversations × Conversion Rate)
Example: 147,000 / (1,000 × 0.15) = 980 THB
```

---

## Decision Framework

### ✅ Invest If:
- ROI > 200%
- Payback period < 6 months
- Cost per conversion < 1,500 THB
- Value per conversation > 2,000 THB

### ⚠️ Optimize If:
- ROI < 200%
- Cost per conversation > 200 THB
- Conversion rate < 10%

### ❌ Discontinue If:
- ROI < 50%
- Payback period > 24 months
- Negative net value

---

## Key Metrics Dashboard

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| **ROI** | > 200% | [XX]% | ✅/⚠️/❌ |
| **Payback Period** | < 6 months | [X] months | ✅/⚠️/❌ |
| **Cost per Conversation** | < 200 THB | [XXX] THB | ✅/⚠️/❌ |
| **Cost per Conversion** | < 1,500 THB | [X,XXX] THB | ✅/⚠️/❌ |
| **Value per Conversation** | > 2,000 THB | [X,XXX] THB | ✅/⚠️/❌ |

---

*See `AI_COMPENSATION_MODEL.md` for complete model.*
