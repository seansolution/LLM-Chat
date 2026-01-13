# Role-Based Dashboards - Quick Start

## Overview

Separate dashboards for **AI Sales**, **AI Support**, and **AI Ops** with role-specific KPIs, targets, and alerts.

## Quick Reference

### AI Sales Dashboard

**Focus**: Sales conversion, pricing accuracy, lead qualification

| KPI | Target | Alert |
|-----|--------|-------|
| Pricing Answer Rate | ≥ 95% | < 90% |
| Soft CTA Rate | ≥ 98% | < 95% |
| Conversion to Contact | ≥ 25% | < 20% |
| Forbidden Violations | ≤ 0% | > 0% (critical) |

**Key Query**:
```sql
SELECT 
  COUNT(*) FILTER (WHERE log_data->'pricing'->>'questionType' = 'explicit' AND (log_data->'pricing'->>'containsPrice')::boolean = true)::numeric / 
  NULLIF(COUNT(*) FILTER (WHERE log_data->'pricing'->>'questionType' = 'explicit'), 0)::numeric * 100 
  as pricing_answer_rate
FROM chat_logs
WHERE timestamp >= NOW() - INTERVAL '24 hours' 
  AND log_data->>'role' = 'SALES';
```

---

### AI Support Dashboard

**Focus**: Support efficiency, question handling, workload reduction

| KPI | Target | Alert |
|-----|--------|-------|
| Question Answer Rate | ≥ 70% | < 60% |
| Handoff Rate | ≤ 30% | > 40% |
| Service Scope Clarity | ≥ 80% | < 70% |
| Forbidden Violations | ≤ 0% | > 0% (critical) |

**Key Query**:
```sql
SELECT 
  COUNT(*) FILTER (WHERE log_data->'handoff'->>'status' = 'none')::numeric / 
  NULLIF(COUNT(*), 0)::numeric * 100 
  as question_answer_rate
FROM chat_logs
WHERE timestamp >= NOW() - INTERVAL '24 hours' 
  AND log_data->>'role' = 'SUPPORT';
```

---

### AI Ops Dashboard

**Focus**: System quality, metrics, risks, improvements

| KPI | Target | Alert |
|-----|--------|-------|
| System Quality Score | ≥ 85 | < 75 |
| Metric Coverage | ≥ 95% | < 90% |
| Risk Detection Rate | ≥ 90% | < 80% |
| Data Quality | ≥ 98% | < 95% |

**Key Query**:
```sql
SELECT 
  ROUND((
    (COUNT(*) FILTER (WHERE (log_data->'quality'->>'intentCorrect')::boolean = true)::numeric / NULLIF(COUNT(*), 0)::numeric * 0.3) +
    (COUNT(*) FILTER (WHERE (log_data->'quality'->>'personaCorrect')::boolean = true)::numeric / NULLIF(COUNT(*), 0)::numeric * 0.3) +
    (COUNT(*) FILTER (WHERE (log_data->'safety'->>'violationCount')::int = 0)::numeric / NULLIF(COUNT(*), 0)::numeric * 0.4)
  ) * 100, 2) as system_quality_score
FROM chat_logs
WHERE timestamp >= NOW() - INTERVAL '24 hours';
```

---

## Setup

### 1. Import Grafana Dashboard

```bash
# Import role-dashboards-grafana.json
# Grafana → Dashboards → Import → Upload JSON
```

### 2. Configure Datasource

```yaml
# PostgreSQL connection
Host: localhost:5432
Database: your_database
User: your_user
Password: your_password
```

### 3. Set Up Alerts

**Critical Alerts** (All Roles):
- Forbidden violations > 0 → Slack + Email

**Warning Alerts**:
- Sales: Pricing answer rate < 90%
- Support: Handoff rate > 40%
- Ops: System quality score < 75

### 4. Customize Time Windows

Default: 24 hours
- Change in Grafana time picker
- Or modify SQL queries: `INTERVAL '24 hours'` → `INTERVAL '7 days'`

---

## Common Queries

### Check Role Distribution

```sql
SELECT 
  log_data->>'role' as role,
  COUNT(*) as count,
  ROUND(COUNT(*)::numeric / NULLIF(SUM(COUNT(*)) OVER (), 0)::numeric * 100, 2) as percentage
FROM chat_logs
WHERE timestamp >= NOW() - INTERVAL '24 hours'
GROUP BY role
ORDER BY count DESC;
```

### Find Violations by Role

```sql
SELECT 
  log_data->>'role' as role,
  COUNT(*) as violation_count,
  array_agg(DISTINCT log_data->'safety'->>'violationType') as violation_types
FROM chat_logs
WHERE timestamp >= NOW() - INTERVAL '24 hours'
  AND (log_data->'safety'->>'violationCount')::int > 0
GROUP BY role;
```

### Compare Response Times by Role

```sql
SELECT 
  log_data->>'role' as role,
  ROUND(AVG((log_data->'performance'->>'responseTimeMs')::numeric), 0) as avg_ms,
  ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY (log_data->'performance'->>'responseTimeMs')::numeric), 0) as median_ms,
  ROUND(MAX((log_data->'performance'->>'responseTimeMs')::numeric), 0) as max_ms
FROM chat_logs
WHERE timestamp >= NOW() - INTERVAL '24 hours'
  AND log_data->'performance'->>'responseTimeMs' IS NOT NULL
GROUP BY role;
```

---

## Alert Configuration

### Grafana Alert Rules

```yaml
# alerts/role-dashboards.yml
groups:
  - name: ai_sales_alerts
    interval: 1m
    rules:
      - uid: sales_pricing_rate
        title: "Sales Pricing Answer Rate Below Target"
        condition: "A < 90"
        data:
          - refId: "A"
            queryType: ""
            relativeTimeRange: {from: 300, to: 0}
            datasourceUid: "postgres"
            model:
              rawSql: "SELECT COUNT(*) FILTER (WHERE log_data->'pricing'->>'questionType' = 'explicit' AND (log_data->'pricing'->>'containsPrice')::boolean = true)::numeric / NULLIF(COUNT(*) FILTER (WHERE log_data->'pricing'->>'questionType' = 'explicit'), 0)::numeric * 100 as value FROM chat_logs WHERE timestamp >= NOW() - INTERVAL '1 hour' AND log_data->>'role' = 'SALES'"
        noDataState: "NoData"
        execErrState: "Alerting"
        for: "5m"
        annotations:
          summary: "Sales pricing answer rate is {{ $value }}% (target: ≥95%)"
        labels:
          severity: "warning"
          role: "sales"
```

---

## Dashboard URLs

- **Sales Dashboard**: `/d/sales-dashboard`
- **Support Dashboard**: `/d/support-dashboard`
- **Ops Dashboard**: `/d/ops-dashboard`
- **Cross-Role Comparison**: `/d/role-comparison`

---

## Troubleshooting

### Query Returns No Data

1. Check time filter: `$__timeFilter(timestamp)` or `timestamp >= NOW() - INTERVAL '24 hours'`
2. Verify role filter: `log_data->>'role' = 'SALES'`
3. Check data exists: `SELECT COUNT(*) FROM chat_logs WHERE log_data->>'role' = 'SALES'`

### Metrics Not Updating

1. Check data freshness: `SELECT MAX(timestamp) FROM chat_logs`
2. Verify role assignment: `SELECT DISTINCT log_data->>'role' FROM chat_logs`
3. Check JSON structure: `SELECT log_data->'quality' FROM chat_logs LIMIT 1`

### Alerts Not Firing

1. Verify alert conditions in Grafana
2. Check notification channels configured
3. Test with manual query: Run alert SQL directly

---

## Next Steps

1. ✅ Import Grafana dashboard JSON
2. ✅ Configure PostgreSQL datasource
3. ✅ Set up alert channels (Slack, email)
4. ✅ Customize thresholds based on business needs
5. ✅ Schedule weekly/monthly reports
6. ✅ Review and adjust targets quarterly
