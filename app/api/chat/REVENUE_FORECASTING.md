# Revenue Forecasting Model

**Version:** 1.0  
**Last Updated:** 2024  
**Purpose:** Forecast revenue based on AI chat data with scenario analysis

---

## Executive Summary

This model forecasts revenue based on qualified leads from AI conversations, conversion rates, and deal sizes. Supports scenario analysis (best case, base case, worst case) and monthly projections.

**Key Components:**
- Qualified leads identification
- Conversion rate estimation
- Deal size estimation
- Monthly revenue projections
- Scenario analysis

---

## 1. Forecasting Framework

### 1.1 Core Formula

```
Monthly Revenue = Qualified Leads × Conversion Rate × Average Deal Value
```

**Where:**
- **Qualified Leads:** Conversations with buying intent (ready_to_buy, price_comparison, urgent)
- **Conversion Rate:** % of qualified leads that close deals
- **Average Deal Value:** Average revenue per closed deal

---

### 1.2 Forecasting Process

```
1. Historical Data Analysis
   ↓
2. Qualified Leads Identification
   ↓
3. Conversion Rate Calculation
   ↓
4. Deal Size Estimation
   ↓
5. Monthly Projections
   ↓
6. Scenario Analysis
```

---

## 2. Qualified Leads Identification

### 2.1 Lead Qualification Criteria

**Qualified Lead Definition:**
A conversation is considered a qualified lead if it meets **ANY** of the following:

1. **Buying Intent:**
   - `ready_to_buy` - Customer is ready to purchase
   - `price_comparison` - Comparing prices/options
   - `urgent` - Needs immediate solution

2. **Contact Requested:**
   - User explicitly requested contact
   - Handoff reason: `user_requested`

3. **Pricing Discussed:**
   - Pricing question asked and answered
   - Price mentioned in conversation

4. **Lead Score:**
   - Lead score ≥ 50 (warm/cool/hot leads)

### 2.2 Qualification Formula

```typescript
function isQualifiedLead(conversation: ConversationSummary): boolean {
  // Buying intent qualification
  const qualifiedIntents = ['ready_to_buy', 'price_comparison', 'urgent']
  if (qualifiedIntents.includes(conversation.buyingIntent)) {
    return true
  }
  
  // Contact requested
  if (conversation.handoffReason === 'user_requested') {
    return true
  }
  
  // Pricing discussed
  if (conversation.alreadyAnswered.pricing) {
    return true
  }
  
  // Lead score ≥ 50
  const leadScore = calculateLeadScore(conversation)
  if (leadScore.score >= 50) {
    return true
  }
  
  return false
}
```

### 2.3 Qualified Leads by Persona

**Historical Data:**
- REGISTRATION: [XX]% of conversations are qualified
- ACCOUNTING: [XX]% of conversations are qualified
- HR: [XX]% of conversations are qualified

**Projection:**
```
Qualified Leads (Month) = Total Conversations (Month) × Qualification Rate
```

---

## 3. Conversion Rate Estimation

### 3.1 Historical Conversion Rates

**Overall Conversion Rate:**
```
Conversion Rate = (Closed Deals / Qualified Leads) × 100
```

**By Persona:**
- REGISTRATION: [XX]% (typically 20-30%)
- ACCOUNTING: [XX]% (typically 15-25%)
- HR: [XX]% (typically 10-20%)

**By Buying Intent:**
- `ready_to_buy`: [XX]% (typically 40-60%)
- `price_comparison`: [XX]% (typically 20-40%)
- `urgent`: [XX]% (typically 30-50%)
- `information_seeking`: [XX]% (typically 5-15%)
- `problem_solving`: [XX]% (typically 10-20%)
- `exploring`: [XX]% (typically 2-10%)

**By Lead Score:**
- Hot (90-100): [XX]% (typically 50-70%)
- Warm (70-89): [XX]% (typically 30-50%)
- Cool (50-69): [XX]% (typically 10-30%)
- Cold (0-49): [XX]% (typically 2-10%)

### 3.2 Conversion Rate Projection

**Method 1: Historical Average**
```
Projected Conversion Rate = Average(Historical Conversion Rates)
```

**Method 2: Weighted by Persona**
```
Projected Conversion Rate = 
  Σ(Persona Conversion Rate × Persona Lead Share) for all personas
```

**Method 3: Trend-Based**
```
Projected Conversion Rate = 
  Historical Average + (Trend × Months Ahead)
```

---

## 4. Deal Size Estimation

### 4.1 Historical Deal Sizes

**Overall Average:**
```
Average Deal Value = Total Revenue / Total Deals
```

**By Persona:**
- REGISTRATION: [XX,XXX] THB (typically 25,000-50,000)
- ACCOUNTING: [XX,XXX] THB/month (typically 2,500-12,000/month = 30,000-144,000/year)
- HR: [XX,XXX] THB/month (typically 2,500-20,000/month = 30,000-240,000/year)

**By Service Type:**
- Company Registration: [XX,XXX] THB (one-time)
- Accounting Monthly: [X,XXX] THB/month
- HR Monthly: [X,XXX] THB/month

### 4.2 Deal Size Projection

**Method 1: Historical Average**
```
Projected Deal Value = Average(Historical Deal Values)
```

**Method 2: Persona-Weighted**
```
Projected Deal Value = 
  Σ(Persona Avg Deal × Persona Lead Share) for all personas
```

**Method 3: Service Mix**
```
Projected Deal Value = 
  Σ(Service Avg Deal × Service Mix %) for all services
```

---

## 5. Monthly Revenue Projections

### 5.1 Base Case Projection

**Formula:**
```
Monthly Revenue = 
  Σ(Qualified Leads (Persona) × Conversion Rate (Persona) × Avg Deal Value (Persona))
  for all personas
```

**Example:**
```
REGISTRATION:
  Qualified Leads: 200
  Conversion Rate: 25%
  Conversions: 200 × 25% = 50
  Avg Deal Value: 25,000 THB
  Revenue: 50 × 25,000 = 1,250,000 THB

ACCOUNTING:
  Qualified Leads: 150
  Conversion Rate: 20%
  Conversions: 150 × 20% = 30
  Avg Deal Value: 6,000 THB/month × 12 = 72,000 THB (annualized)
  Revenue: 30 × 72,000 = 2,160,000 THB

HR:
  Qualified Leads: 100
  Conversion Rate: 15%
  Conversions: 100 × 15% = 15
  Avg Deal Value: 6,500 THB/month × 12 = 78,000 THB (annualized)
  Revenue: 15 × 78,000 = 1,170,000 THB

Total Monthly Revenue: 4,580,000 THB
```

### 5.2 Multi-Month Projection

**With Growth:**
```
Month N Revenue = Base Revenue × (1 + Growth Rate) ^ (N - 1)
```

**Example (5% monthly growth):**
- Month 1: 4,580,000 THB
- Month 2: 4,580,000 × 1.05 = 4,809,000 THB
- Month 3: 4,580,000 × 1.05² = 5,049,450 THB
- Month 4: 4,580,000 × 1.05³ = 5,301,923 THB
- Month 5: 4,580,000 × 1.05⁴ = 5,567,019 THB
- Month 6: 4,580,000 × 1.05⁵ = 5,845,370 THB

---

## 6. Scenario Analysis

### 6.1 Scenario Definitions

#### Base Case
**Assumptions:**
- Historical averages for all metrics
- No significant changes
- Normal business operations

**Inputs:**
- Qualified Lead Rate: Historical average
- Conversion Rate: Historical average
- Deal Value: Historical average
- Growth Rate: Historical trend

#### Best Case (Optimistic)
**Assumptions:**
- Improved conversion rates (+20%)
- Higher deal values (+15%)
- More qualified leads (+10%)
- Faster growth (+5% monthly)

**Inputs:**
- Qualified Lead Rate: Base × 1.10
- Conversion Rate: Base × 1.20
- Deal Value: Base × 1.15
- Growth Rate: Base + 5%

#### Worst Case (Pessimistic)
**Assumptions:**
- Lower conversion rates (-20%)
- Lower deal values (-15%)
- Fewer qualified leads (-10%)
- Slower growth (-5% monthly)

**Inputs:**
- Qualified Lead Rate: Base × 0.90
- Conversion Rate: Base × 0.80
- Deal Value: Base × 0.85
- Growth Rate: Base - 5%

### 6.2 Scenario Calculation

**Formula:**
```
Scenario Revenue = 
  Qualified Leads (scenario) × 
  Conversion Rate (scenario) × 
  Deal Value (scenario) × 
  Growth Factor (scenario)
```

---

## 7. Example Forecasts

### 7.1 Base Case: 6-Month Forecast

**Assumptions:**
- Monthly Conversations: 1,000 (growing 5% monthly)
- Qualification Rate: 45%
- Conversion Rate: 20%
- Average Deal Value: 30,000 THB

**Projection:**

| Month | Conversations | Qualified Leads | Conversions | Revenue (THB) | Cumulative |
|-------|---------------|-----------------|-------------|---------------|------------|
| 1 | 1,000 | 450 | 90 | 2,700,000 | 2,700,000 |
| 2 | 1,050 | 473 | 95 | 2,835,000 | 5,535,000 |
| 3 | 1,103 | 496 | 99 | 2,976,300 | 8,511,300 |
| 4 | 1,158 | 521 | 104 | 3,124,815 | 11,636,115 |
| 5 | 1,216 | 547 | 109 | 3,281,056 | 14,917,171 |
| 6 | 1,277 | 575 | 115 | 3,445,108 | 18,362,279 |

**6-Month Total: 18,362,279 THB**

---

### 7.2 Best Case: 6-Month Forecast

**Assumptions:**
- Monthly Conversations: 1,000 (growing 10% monthly)
- Qualification Rate: 45% × 1.10 = 49.5%
- Conversion Rate: 20% × 1.20 = 24%
- Average Deal Value: 30,000 × 1.15 = 34,500 THB

**Projection:**

| Month | Conversations | Qualified Leads | Conversions | Revenue (THB) | Cumulative |
|-------|---------------|-----------------|-------------|---------------|------------|
| 1 | 1,000 | 495 | 119 | 4,105,500 | 4,105,500 |
| 2 | 1,100 | 545 | 131 | 4,519,500 | 8,625,000 |
| 3 | 1,210 | 599 | 144 | 4,968,000 | 13,593,000 |
| 4 | 1,331 | 659 | 158 | 5,451,000 | 19,044,000 |
| 5 | 1,464 | 725 | 174 | 6,003,000 | 25,047,000 |
| 6 | 1,610 | 797 | 191 | 6,589,500 | 31,636,500 |

**6-Month Total: 31,636,500 THB**

---

### 7.3 Worst Case: 6-Month Forecast

**Assumptions:**
- Monthly Conversations: 1,000 (growing 0% monthly)
- Qualification Rate: 45% × 0.90 = 40.5%
- Conversion Rate: 20% × 0.80 = 16%
- Average Deal Value: 30,000 × 0.85 = 25,500 THB

**Projection:**

| Month | Conversations | Qualified Leads | Conversions | Revenue (THB) | Cumulative |
|-------|---------------|-----------------|-------------|---------------|------------|
| 1 | 1,000 | 405 | 65 | 1,657,500 | 1,657,500 |
| 2 | 1,000 | 405 | 65 | 1,657,500 | 3,315,000 |
| 3 | 1,000 | 405 | 65 | 1,657,500 | 4,972,500 |
| 4 | 1,000 | 405 | 65 | 1,657,500 | 6,630,000 |
| 5 | 1,000 | 405 | 65 | 1,657,500 | 8,287,500 |
| 6 | 1,000 | 405 | 65 | 1,657,500 | 9,945,000 |

**6-Month Total: 9,945,000 THB**

---

## 8. Forecast by Persona

### 8.1 REGISTRATION Forecast

**Assumptions:**
- Monthly Conversations: 400
- Qualification Rate: 50%
- Conversion Rate: 25%
- Average Deal Value: 25,000 THB (one-time)

**Base Case (6 months):**

| Month | Qualified | Conversions | Revenue (THB) |
|-------|-----------|-------------|---------------|
| 1 | 200 | 50 | 1,250,000 |
| 2 | 210 | 53 | 1,312,500 |
| 3 | 221 | 55 | 1,378,125 |
| 4 | 232 | 58 | 1,447,031 |
| 5 | 243 | 61 | 1,519,381 |
| 6 | 255 | 64 | 1,595,350 |

**6-Month Total: 8,500,387 THB**

---

### 8.2 ACCOUNTING Forecast

**Assumptions:**
- Monthly Conversations: 400
- Qualification Rate: 40%
- Conversion Rate: 20%
- Average Deal Value: 6,000 THB/month (72,000 THB annualized)

**Base Case (6 months):**

| Month | Qualified | Conversions | Revenue (THB) |
|-------|-----------|-------------|---------------|
| 1 | 160 | 32 | 2,304,000 |
| 2 | 168 | 34 | 2,419,200 |
| 3 | 176 | 35 | 2,540,160 |
| 4 | 185 | 37 | 2,667,168 |
| 5 | 194 | 39 | 2,800,522 |
| 6 | 204 | 41 | 2,940,548 |

**6-Month Total: 15,671,598 THB**

---

### 8.3 HR Forecast

**Assumptions:**
- Monthly Conversations: 200
- Qualification Rate: 45%
- Conversion Rate: 15%
- Average Deal Value: 6,500 THB/month (78,000 THB annualized)

**Base Case (6 months):**

| Month | Qualified | Conversions | Revenue (THB) |
|-------|-----------|-------------|---------------|
| 1 | 90 | 14 | 1,092,000 |
| 2 | 95 | 14 | 1,146,600 |
| 3 | 99 | 15 | 1,203,930 |
| 4 | 104 | 16 | 1,264,127 |
| 5 | 109 | 16 | 1,327,329 |
| 6 | 115 | 17 | 1,393,691 |

**6-Month Total: 7,425,677 THB**

---

## 9. Forecast Accuracy Metrics

### 9.1 Forecast vs Actual

**Metrics:**
- **Mean Absolute Error (MAE):** Average absolute difference
- **Mean Absolute Percentage Error (MAPE):** Average % difference
- **Root Mean Square Error (RMSE):** Square root of average squared differences

**Formulas:**
```
MAE = (1/n) × Σ|Forecast - Actual|
MAPE = (1/n) × Σ|(Forecast - Actual) / Actual| × 100
RMSE = √((1/n) × Σ(Forecast - Actual)²)
```

### 9.2 Accuracy Targets

- **MAPE:** < 15% (good forecast)
- **MAE:** < 10% of average revenue
- **RMSE:** < 15% of average revenue

---

## 10. Management Dashboard

### 10.1 Forecast Summary Table

| Scenario | 3-Month | 6-Month | 12-Month | Notes |
|----------|---------|---------|----------|-------|
| **Best Case** | [X,XXX,XXX] | [X,XXX,XXX] | [X,XXX,XXX] | Optimistic assumptions |
| **Base Case** | [X,XXX,XXX] | [X,XXX,XXX] | [X,XXX,XXX] | Historical averages |
| **Worst Case** | [X,XXX,XXX] | [X,XXX,XXX] | [X,XXX,XXX] | Conservative assumptions |

---

### 10.2 Monthly Projection Table

| Month | Base Case | Best Case | Worst Case | Actual | Variance |
|-------|-----------|-----------|-------------|--------|---------|
| Jan | [X,XXX,XXX] | [X,XXX,XXX] | [X,XXX,XXX] | [X,XXX,XXX] | [±X]% |
| Feb | [X,XXX,XXX] | [X,XXX,XXX] | [X,XXX,XXX] | [X,XXX,XXX] | [±X]% |
| ... | ... | ... | ... | ... | ... |

---

### 10.3 Persona Breakdown

| Persona | Qualified Leads | Conversion Rate | Avg Deal | Monthly Revenue |
|---------|------------------|-----------------|----------|-----------------|
| REGISTRATION | [XXX] | [XX]% | [XX,XXX] | [X,XXX,XXX] |
| ACCOUNTING | [XXX] | [XX]% | [XX,XXX] | [X,XXX,XXX] |
| HR | [XXX] | [XX]% | [XX,XXX] | [X,XXX,XXX] |
| **TOTAL** | **[XXX]** | **[XX]%** | **[XX,XXX]** | **[X,XXX,XXX]** |

---

## 11. Risk Factors and Assumptions

### 11.1 Key Assumptions

1. **Conversation Volume:**
   - Assumes consistent or growing conversation volume
   - Does not account for external factors (seasonality, competition)

2. **Conversion Rates:**
   - Based on historical data
   - Assumes no significant changes in sales process
   - Does not account for market changes

3. **Deal Sizes:**
   - Based on historical averages
   - Assumes consistent service mix
   - Does not account for pricing changes

4. **Qualification Criteria:**
   - Based on current definition
   - May change with business strategy

### 11.2 Risk Factors

**High Impact:**
- Market competition
- Economic conditions
- Service pricing changes
- Sales team capacity

**Medium Impact:**
- Conversion rate changes
- Deal size variations
- Qualification criteria changes

**Low Impact:**
- Seasonal variations
- Minor process changes

---

## 12. Forecast Updates

### 12.1 Update Frequency

- **Monthly:** Update with actual results
- **Quarterly:** Review and adjust assumptions
- **Annually:** Comprehensive forecast review

### 12.2 Update Process

1. **Collect Actual Data:**
   - Actual conversations
   - Actual qualified leads
   - Actual conversions
   - Actual revenue

2. **Compare to Forecast:**
   - Calculate variance
   - Identify trends
   - Analyze deviations

3. **Adjust Assumptions:**
   - Update conversion rates
   - Update deal sizes
   - Update qualification rates
   - Update growth rates

4. **Revise Forecast:**
   - Recalculate projections
   - Update scenarios
   - Communicate changes

---

## 13. Usage Examples

### 13.1 Generate 6-Month Forecast

```typescript
import { generateRevenueForecast } from './revenue-forecasting'

const forecast = generateRevenueForecast({
  startMonth: '2024-01',
  months: 6,
  baseConversations: 1000,
  growthRate: 0.05, // 5% monthly
  qualificationRate: 0.45, // 45%
  conversionRate: 0.20, // 20%
  averageDealValue: 30000,
})

console.log(forecast.baseCase.totalRevenue) // 18,362,279 THB
```

### 13.2 Scenario Analysis

```typescript
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
```

---

## 14. SQL Queries for Data Extraction

### 14.1 Historical Qualified Leads

```sql
-- Count qualified leads by month
SELECT 
  DATE_TRUNC('month', timestamp) as month,
  COUNT(*) FILTER (
    WHERE log_data->'summary'->>'buyingIntent' IN ('ready_to_buy', 'price_comparison', 'urgent')
    OR log_data->'handoff'->>'reason' = 'user_requested'
    OR (log_data->'summary'->'alreadyAnswered'->>'pricing')::boolean = true
  ) as qualified_leads,
  COUNT(*) as total_conversations
FROM chat_logs
WHERE timestamp >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '12 months'
GROUP BY month
ORDER BY month;
```

### 14.2 Historical Conversion Rates

```sql
-- Calculate conversion rate by persona
SELECT 
  log_data->'summary'->>'persona' as persona,
  COUNT(DISTINCT session_id) FILTER (
    WHERE EXISTS (
      SELECT 1 FROM deals 
      WHERE deals.attributed_session_id = chat_logs.session_id
      AND deals.status = 'closed_won'
    )
  )::numeric / 
  NULLIF(COUNT(DISTINCT session_id), 0)::numeric * 100 as conversion_rate
FROM chat_logs
WHERE timestamp >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '6 months'
GROUP BY persona;
```

### 14.3 Historical Deal Sizes

```sql
-- Average deal value by persona
SELECT 
  deals.service_type,
  AVG(deals.deal_value) as avg_deal_value,
  COUNT(*) as deal_count
FROM deals
WHERE deals.status = 'closed_won'
  AND deals.closed_date >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '6 months'
GROUP BY deals.service_type;
```

---

*This model should be updated monthly with actual results.*  
*Last reviewed: [Date]*  
*Next review: [Date]*
