# Revenue Forecasting - Quick Start

**Quick reference for revenue forecasting model.**

---

## Core Formula

```
Monthly Revenue = Qualified Leads × Conversion Rate × Average Deal Value
```

---

## Key Components

### 1. Qualified Leads

**Definition:** Conversations with buying intent
- `ready_to_buy`
- `price_comparison`
- `urgent`
- Contact requested
- Pricing discussed
- Lead score ≥ 50

**Calculation:**
```
Qualified Leads = Total Conversations × Qualification Rate
```

---

### 2. Conversion Rate

**Definition:** % of qualified leads that close deals

**By Persona (typical):**
- REGISTRATION: 20-30%
- ACCOUNTING: 15-25%
- HR: 10-20%

**Calculation:**
```
Conversion Rate = (Closed Deals / Qualified Leads) × 100
```

---

### 3. Deal Size

**By Persona (typical):**
- REGISTRATION: 25,000-50,000 THB (one-time)
- ACCOUNTING: 2,500-12,000 THB/month (30,000-144,000/year)
- HR: 2,500-20,000 THB/month (30,000-240,000/year)

---

## Scenario Definitions

### Base Case
- Historical averages
- Normal operations
- No significant changes

### Best Case (+20% conversion, +15% deal value, +10% leads)
- Improved conversion rates
- Higher deal values
- More qualified leads
- Faster growth

### Worst Case (-20% conversion, -15% deal value, -10% leads)
- Lower conversion rates
- Lower deal values
- Fewer qualified leads
- Slower growth

---

## Usage Example

```typescript
import { generateRevenueForecast, generateScenarios } from './revenue-forecasting'

// Base forecast
const forecast = generateRevenueForecast({
  startMonth: '2024-01',
  months: 6,
  baseConversations: 1000,
  growthRate: 0.05, // 5% monthly
  qualificationRate: 0.45, // 45%
  conversionRate: 0.20, // 20%
  averageDealValue: 30000,
})

// Add scenarios
const scenarios = generateScenarios(forecast, {
  bestCase: {
    qualificationMultiplier: 1.10,
    conversionMultiplier: 1.20,
    dealValueMultiplier: 1.15,
    growthRateAdjustment: 0.05,
  },
  worstCase: {
    qualificationMultiplier: 0.90,
    conversionMultiplier: 0.80,
    dealValueMultiplier: 0.85,
    growthRateAdjustment: -0.05,
  },
})

console.log(formatForecast(scenarios))
```

---

## Example Output

```
BASE CASE
Total Revenue (6 months): 18,362,279 THB
Total Conversions: 591

Monthly Breakdown:
Month       | Conversations | Qualified | Conversions | Revenue (THB)
----------------------------------------------------------------------
2024-01     |          1,000 |       450 |          90 |     2,700,000
2024-02     |          1,050 |       473 |          95 |     2,835,000
2024-03     |          1,103 |       496 |          99 |     2,976,300
2024-04     |          1,158 |       521 |         104 |     3,124,815
2024-05     |          1,216 |       547 |         109 |     3,281,056
2024-06     |          1,277 |       575 |         115 |     3,445,108
```

---

## Forecast Accuracy Targets

- **MAPE:** < 15% (good forecast)
- **MAE:** < 10% of average revenue
- **RMSE:** < 15% of average revenue

---

## Update Frequency

- **Monthly:** Update with actual results
- **Quarterly:** Review and adjust assumptions
- **Annually:** Comprehensive forecast review

---

*See `REVENUE_FORECASTING.md` for complete documentation.*
