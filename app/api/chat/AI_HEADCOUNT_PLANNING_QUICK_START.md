# AI Headcount Planning - Quick Start

**Quick reference for AI headcount planning framework.**

---

## 5 Phases of AI Adoption

| Phase | Duration | AI Coverage | Key Focus |
|-------|----------|-------------|-----------|
| **Pilot** | 0-3 months | 10-20% | Validate capabilities |
| **Scale** | 3-12 months | 50-70% | Increase coverage |
| **Optimize** | 12-24 months | 70-85% | Maximize efficiency |
| **Transform** | 24-36 months | 85-95% | AI primary interface |
| **Mature** | 36+ months | 95%+ | Continuous innovation |

---

## AI-to-Human Ratios by Phase

### Sales Team

| Phase | AI FTE | Human FTE | Ratio | AI Coverage |
|-------|--------|-----------|-------|-------------|
| Pilot | 0.1-0.2 | 2-5 | 1:10-25 | 10-20% |
| Scale | 0.5-1.0 | 3-8 | 1:3-8 | 50-70% |
| Optimize | 1.0-2.0 | 5-15 | 1:2.5-7.5 | 70-85% |
| Transform | 2.0-4.0 | 10-30 | 1:2.5-7.5 | 85-95% |
| Mature | 4.0-8.0 | 20-50 | 1:2.5-6.25 | 95%+ |

### Support Team

| Phase | AI FTE | Human FTE | Ratio | AI Coverage |
|-------|--------|-----------|-------|-------------|
| Pilot | 0.1-0.2 | 2-5 | 1:10-25 | 10-20% |
| Scale | 0.5-1.0 | 3-8 | 1:3-8 | 50-70% |
| Optimize | 1.0-2.0 | 5-15 | 1:2.5-7.5 | 70-85% |
| Transform | 2.0-4.0 | 8-25 | 1:2-6.25 | 85-95% |
| Mature | 4.0-8.0 | 15-40 | 1:1.875-5 | 95%+ |

### Operations Team

| Phase | AI FTE | Human FTE | Ratio | Primary Focus |
|-------|--------|-----------|-------|---------------|
| Pilot | 0.1 | 1-2 | 1:10-20 | Monitoring |
| Scale | 0.2-0.3 | 2-3 | 1:7-15 | Active monitoring |
| Optimize | 0.3-0.5 | 3-5 | 1:6-17 | Advanced analytics |
| Transform | 0.5-1.0 | 5-10 | 1:5-20 | Predictive analytics |
| Mature | 1.0-2.0 | 10-20 | 1:5-20 | AI governance |

---

## Transition Triggers

### Pilot → Scale
- ✅ AI handles ≥ 20% for 3 months
- ✅ Conversion rate ≥ 10%
- ✅ Response accuracy ≥ 80%
- ✅ No critical incidents for 3 months

### Scale → Optimize
- ✅ AI handles ≥ 70% for 3 months
- ✅ Conversion rate ≥ 15%
- ✅ Response accuracy ≥ 85%
- ✅ Support workload reduction ≥ 30%

### Optimize → Transform
- ✅ AI handles ≥ 85% for 3 months
- ✅ Conversion rate ≥ 20%
- ✅ Response accuracy ≥ 90%
- ✅ Support workload reduction ≥ 50%
- ✅ ROI ≥ 2,000%

### Transform → Mature
- ✅ AI handles ≥ 95% for 6 months
- ✅ Conversion rate ≥ 25%
- ✅ Response accuracy ≥ 95%
- ✅ Support workload reduction ≥ 70%
- ✅ ROI ≥ 3,000%

---

## Usage Example

```typescript
import { generateHeadcountPlan, checkTransitionReadiness } from './headcount-calculator'

// Generate headcount plan for Scale phase
const plan = generateHeadcountPlan('scale', 1000, 0.60) // 60% AI coverage
console.log(formatHeadcountPlan(plan))

// Check transition readiness
const transition = checkTransitionReadiness('scale', 'optimize', {
  aiCoverage: 0.70,
  conversionRate: 0.18,
  responseAccuracy: 0.88,
  workloadReduction: 0.45,
  roi: 2200,
})
console.log(formatTransitionPlan(transition))
```

---

## Example Scenarios

### Small Business (100 conversations/month)
**Phase 1: Pilot**
- AI: 0.3 FTE
- Human: 4 FTE
- Ratio: 1:13

### Medium Business (1,000 conversations/month)
**Phase 2: Scale**
- AI: 1.7 FTE
- Human: 8 FTE
- Ratio: 1:4.7

### Large Business (5,000 conversations/month)
**Phase 3: Optimize**
- AI: 7.5 FTE
- Human: 20 FTE
- Ratio: 1:2.7

### Enterprise (10,000+ conversations/month)
**Phase 4: Transform**
- AI: 17.0 FTE
- Human: 20 FTE
- Ratio: 1:1.2

---

*See `AI_HEADCOUNT_PLANNING.md` for complete documentation.*
