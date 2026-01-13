# Role-Based Dashboards

## Overview

Separate dashboards for each AI role (Sales, Support, Ops) with role-specific KPIs, targets, and alerts.

---

## 1. AI Sales Dashboard

### Purpose
Monitor sales conversion, pricing accuracy, and lead qualification.

### KPIs

| KPI | Definition | Target | Alert Threshold |
|-----|------------|--------|-----------------|
| **Pricing Answer Rate** | % of pricing questions with price answers | ≥ 95% | < 90% |
| **Soft CTA Rate** | % of responses with soft CTA | ≥ 98% | < 95% |
| **Lead Qualification Rate** | % of conversations with buying intent detected | ≥ 60% | < 50% |
| **Conversion to Contact** | % of conversations leading to contact | ≥ 25% | < 20% |
| **Average Response Time** | Avg time to generate response | < 2000ms | > 3000ms |
| **Forbidden Response Rate** | % of responses with violations | ≤ 0% | > 0% (critical) |
| **Intent Accuracy (Pricing)** | % of pricing intents correctly detected | ≥ 95% | < 90% |
| **Registration Intent Coverage** | % of registration questions detected | ≥ 90% | < 85% |

### Table Format

```sql
-- AI Sales Dashboard Summary (Last 24 Hours)
SELECT 
  'AI Sales' as role,
  COUNT(*) FILTER (WHERE log_data->>'role' = 'SALES') as total_conversations,
  ROUND(COUNT(*) FILTER (
    WHERE log_data->>'role' = 'SALES' 
    AND log_data->'pricing'->>'questionType' = 'explicit' 
    AND (log_data->'pricing'->>'containsPrice')::boolean = true
  )::numeric / NULLIF(COUNT(*) FILTER (
    WHERE log_data->>'role' = 'SALES' 
    AND log_data->'pricing'->>'questionType' = 'explicit'
  ), 0)::numeric * 100, 2) as pricing_answer_rate,
  ROUND(COUNT(*) FILTER (
    WHERE log_data->>'role' = 'SALES' 
    AND log_data->'aiResponse' ~* '(ติดต่อ|โทร|email|086-398-6889)'
  )::numeric / NULLIF(COUNT(*) FILTER (WHERE log_data->>'role' = 'SALES'), 0)::numeric * 100, 2) as soft_cta_rate,
  ROUND(COUNT(*) FILTER (
    WHERE log_data->>'role' = 'SALES' 
    AND log_data->'handoff'->>'status' IN ('requested', 'completed')
  )::numeric / NULLIF(COUNT(*) FILTER (WHERE log_data->>'role' = 'SALES'), 0)::numeric * 100, 2) as conversion_to_contact,
  ROUND(AVG((log_data->'performance'->>'responseTimeMs')::numeric) FILTER (WHERE log_data->>'role' = 'SALES'), 0) as avg_response_time_ms,
  COUNT(*) FILTER (
    WHERE log_data->>'role' = 'SALES' 
    AND (log_data->'safety'->>'violationCount')::int > 0
  ) as forbidden_violations
FROM chat_logs
WHERE timestamp >= NOW() - INTERVAL '24 hours'
  AND log_data->>'role' = 'SALES';
```

### Grafana Panels

#### Panel 1: Pricing Answer Rate (Gauge)
```json
{
  "title": "Pricing Answer Rate",
  "type": "gauge",
  "targets": [{
    "rawSql": "SELECT COUNT(*) FILTER (WHERE log_data->'pricing'->>'questionType' = 'explicit' AND (log_data->'pricing'->>'containsPrice')::boolean = true)::numeric / NULLIF(COUNT(*) FILTER (WHERE log_data->'pricing'->>'questionType' = 'explicit'), 0)::numeric * 100 as value FROM chat_logs WHERE timestamp >= NOW() - INTERVAL '24 hours' AND log_data->>'role' = 'SALES'",
    "format": "table"
  }],
  "thresholds": {
    "steps": [
      {"value": 0, "color": "red"},
      {"value": 90, "color": "yellow"},
      {"value": 95, "color": "green"}
    ]
  },
  "alert": {
    "conditions": [{"evaluator": {"params": [90], "type": "lt"}}]
  }
}
```

#### Panel 2: Conversion to Contact (Time Series)
```json
{
  "title": "Conversion to Contact Rate (24h)",
  "type": "graph",
  "targets": [{
    "rawSql": "SELECT time_bucket('1 hour', timestamp) as time, COUNT(*) FILTER (WHERE log_data->'handoff'->>'status' IN ('requested', 'completed'))::numeric / NULLIF(COUNT(*), 0)::numeric * 100 as rate FROM chat_logs WHERE timestamp >= NOW() - INTERVAL '24 hours' AND log_data->>'role' = 'SALES' GROUP BY time ORDER BY time",
    "format": "time_series"
  }],
  "yaxes": [{"format": "percent", "max": 100}]
}
```

#### Panel 3: Intent Breakdown (Pie Chart)
```json
{
  "title": "Intent Distribution (Sales)",
  "type": "piechart",
  "targets": [{
    "rawSql": "SELECT log_data->'intent'->>'detected' as intent, COUNT(*) as count FROM chat_logs WHERE timestamp >= NOW() - INTERVAL '24 hours' AND log_data->>'role' = 'SALES' GROUP BY intent",
    "format": "table"
  }]
}
```

#### Panel 4: Forbidden Violations Alert (Stat)
```json
{
  "title": "Forbidden Violations",
  "type": "stat",
  "targets": [{
    "rawSql": "SELECT COUNT(*) as value FROM chat_logs WHERE timestamp >= NOW() - INTERVAL '1 hour' AND log_data->>'role' = 'SALES' AND (log_data->'safety'->>'violationCount')::int > 0",
    "format": "table"
  }],
  "colorMode": "value",
  "thresholds": {
    "steps": [
      {"value": 0, "color": "green"},
      {"value": 1, "color": "red"}
    ]
  },
  "alert": {
    "conditions": [{"evaluator": {"params": [0], "type": "gt"}}]
  }
}
```

---

## 2. AI Support Dashboard

### Purpose
Monitor support efficiency, question handling, and workload reduction.

### KPIs

| KPI | Definition | Target | Alert Threshold |
|-----|------------|--------|-----------------|
| **Question Answer Rate** | % of questions answered without handoff | ≥ 70% | < 60% |
| **Handoff Rate** | % of conversations requiring human handoff | ≤ 30% | > 40% |
| **Average Response Time** | Avg time to generate response | < 2000ms | > 3000ms |
| **Service Scope Clarity** | % of responses explaining service scope | ≥ 80% | < 70% |
| **Forbidden Response Rate** | % of responses with violations | ≤ 0% | > 0% (critical) |
| **Intent Accuracy (Overview)** | % of overview intents correctly detected | ≥ 90% | < 85% |
| **Complex Case Redirect Rate** | % of complex cases redirected | ≥ 95% | < 90% |
| **Support Workload Reduction** | % reduction vs manual support | ≥ 50% | < 40% |

### Table Format

```sql
-- AI Support Dashboard Summary (Last 24 Hours)
SELECT 
  'AI Support' as role,
  COUNT(*) FILTER (WHERE log_data->>'role' = 'SUPPORT') as total_conversations,
  ROUND(COUNT(*) FILTER (
    WHERE log_data->>'role' = 'SUPPORT' 
    AND log_data->'handoff'->>'status' = 'none'
  )::numeric / NULLIF(COUNT(*) FILTER (WHERE log_data->>'role' = 'SUPPORT'), 0)::numeric * 100, 2) as question_answer_rate,
  ROUND(COUNT(*) FILTER (
    WHERE log_data->>'role' = 'SUPPORT' 
    AND log_data->'handoff'->>'status' IN ('requested', 'completed')
  )::numeric / NULLIF(COUNT(*) FILTER (WHERE log_data->>'role' = 'SUPPORT'), 0)::numeric * 100, 2) as handoff_rate,
  ROUND(AVG((log_data->'performance'->>'responseTimeMs')::numeric) FILTER (WHERE log_data->>'role' = 'SUPPORT'), 0) as avg_response_time_ms,
  ROUND(COUNT(*) FILTER (
    WHERE log_data->>'role' = 'SUPPORT' 
    AND log_data->'aiResponse' ~* '(ขอบเขต|ครอบคลุม|เหมาะสำหรับ)'
  )::numeric / NULLIF(COUNT(*) FILTER (WHERE log_data->>'role' = 'SUPPORT'), 0)::numeric * 100, 2) as service_scope_clarity,
  COUNT(*) FILTER (
    WHERE log_data->>'role' = 'SUPPORT' 
    AND (log_data->'safety'->>'violationCount')::int > 0
  ) as forbidden_violations,
  ROUND(COUNT(*) FILTER (
    WHERE log_data->>'role' = 'SUPPORT' 
    AND log_data->'handoff'->>'reason' = 'complex_case'
  )::numeric / NULLIF(COUNT(*) FILTER (
    WHERE log_data->>'role' = 'SUPPORT' 
    AND log_data->'handoff'->>'status' IN ('requested', 'completed')
  ), 0)::numeric * 100, 2) as complex_case_redirect_rate
FROM chat_logs
WHERE timestamp >= NOW() - INTERVAL '24 hours'
  AND log_data->>'role' = 'SUPPORT';
```

### Grafana Panels

#### Panel 1: Question Answer Rate (Gauge)
```json
{
  "title": "Question Answer Rate (No Handoff)",
  "type": "gauge",
  "targets": [{
    "rawSql": "SELECT COUNT(*) FILTER (WHERE log_data->'handoff'->>'status' = 'none')::numeric / NULLIF(COUNT(*), 0)::numeric * 100 as value FROM chat_logs WHERE timestamp >= NOW() - INTERVAL '24 hours' AND log_data->>'role' = 'SUPPORT'",
    "format": "table"
  }],
  "thresholds": {
    "steps": [
      {"value": 0, "color": "red"},
      {"value": 60, "color": "yellow"},
      {"value": 70, "color": "green"}
    ]
  }
}
```

#### Panel 2: Handoff Rate Trend (Time Series)
```json
{
  "title": "Handoff Rate Trend",
  "type": "graph",
  "targets": [{
    "rawSql": "SELECT time_bucket('1 hour', timestamp) as time, COUNT(*) FILTER (WHERE log_data->'handoff'->>'status' IN ('requested', 'completed'))::numeric / NULLIF(COUNT(*), 0)::numeric * 100 as rate FROM chat_logs WHERE timestamp >= NOW() - INTERVAL '24 hours' AND log_data->>'role' = 'SUPPORT' GROUP BY time ORDER BY time",
    "format": "time_series"
  }],
  "yaxes": [{"format": "percent", "max": 100}],
  "alert": {
    "conditions": [{"evaluator": {"params": [40], "type": "gt"}}]
  }
}
```

#### Panel 3: Handoff Reasons (Bar Chart)
```json
{
  "title": "Handoff Reasons Breakdown",
  "type": "bargauge",
  "targets": [{
    "rawSql": "SELECT log_data->'handoff'->>'reason' as reason, COUNT(*) as count FROM chat_logs WHERE timestamp >= NOW() - INTERVAL '24 hours' AND log_data->>'role' = 'SUPPORT' AND log_data->'handoff'->>'status' IN ('requested', 'completed') GROUP BY reason",
    "format": "table"
  }]
}
```

#### Panel 4: Support Workload Reduction (Stat)
```json
{
  "title": "Support Workload Reduction",
  "type": "stat",
  "targets": [{
    "rawSql": "SELECT (1 - COUNT(*) FILTER (WHERE log_data->'handoff'->>'status' IN ('requested', 'completed'))::numeric / NULLIF(COUNT(*), 0)::numeric) * 100 as value FROM chat_logs WHERE timestamp >= NOW() - INTERVAL '24 hours' AND log_data->>'role' = 'SUPPORT'",
    "format": "table"
  }],
  "thresholds": {
    "steps": [
      {"value": 0, "color": "red"},
      {"value": 40, "color": "yellow"},
      {"value": 50, "color": "green"}
    ]
  }
}
```

---

## 3. AI Ops Dashboard

### Purpose
Monitor system quality, metrics, risks, and improvement recommendations.

### KPIs

| KPI | Definition | Target | Alert Threshold |
|-----|------------|--------|-----------------|
| **System Quality Score** | Overall system health (0-100) | ≥ 85 | < 75 |
| **Metric Coverage** | % of metrics successfully tracked | ≥ 95% | < 90% |
| **Risk Detection Rate** | % of risks identified and reported | ≥ 90% | < 80% |
| **Improvement Recommendations** | # of actionable recommendations | ≥ 5/week | < 3/week |
| **Data Quality** | % of logs with complete data | ≥ 98% | < 95% |
| **Anomaly Detection** | # of anomalies detected | Monitor | > 10/day |
| **Role Selection Accuracy** | % of correct role assignments | ≥ 98% | < 95% |
| **System Uptime** | % of time system is operational | ≥ 99.5% | < 99% |

### Table Format

```sql
-- AI Ops Dashboard Summary (Last 24 Hours)
SELECT 
  'AI Ops' as role,
  -- System Quality Score (composite)
  ROUND((
    (COUNT(*) FILTER (WHERE (log_data->'quality'->>'intentCorrect')::boolean = true)::numeric / NULLIF(COUNT(*), 0)::numeric * 0.3) +
    (COUNT(*) FILTER (WHERE (log_data->'quality'->>'personaCorrect')::boolean = true)::numeric / NULLIF(COUNT(*), 0)::numeric * 0.3) +
    (COUNT(*) FILTER (WHERE (log_data->'safety'->>'violationCount')::int = 0)::numeric / NULLIF(COUNT(*), 0)::numeric * 0.4)
  ) * 100, 2) as system_quality_score,
  -- Metric Coverage
  ROUND(COUNT(*) FILTER (
    WHERE log_data->'performance'->>'responseTimeMs' IS NOT NULL
    AND log_data->'quality'->>'intentCorrect' IS NOT NULL
    AND log_data->'safety'->>'violationCount' IS NOT NULL
  )::numeric / NULLIF(COUNT(*), 0)::numeric * 100, 2) as metric_coverage,
  -- Risk Detection
  COUNT(*) FILTER (
    WHERE (log_data->'safety'->>'violationCount')::int > 0
    OR (log_data->'quality'->>'intentCorrect')::boolean = false
    OR (log_data->'quality'->>'personaCorrect')::boolean = false
  ) as risks_detected,
  -- Data Quality
  ROUND(COUNT(*) FILTER (
    WHERE log_data->'intent' IS NOT NULL
    AND log_data->'persona' IS NOT NULL
    AND log_data->'timestamp' IS NOT NULL
  )::numeric / NULLIF(COUNT(*), 0)::numeric * 100, 2) as data_quality,
  -- Role Selection Accuracy
  ROUND(COUNT(*) FILTER (
    WHERE log_data->>'role' IN ('SALES', 'SUPPORT', 'OPS')
  )::numeric / NULLIF(COUNT(*), 0)::numeric * 100, 2) as role_selection_accuracy,
  -- Total logs analyzed
  COUNT(*) as total_logs_analyzed
FROM chat_logs
WHERE timestamp >= NOW() - INTERVAL '24 hours';
```

### Grafana Panels

#### Panel 1: System Quality Score (Gauge)
```json
{
  "title": "System Quality Score",
  "type": "gauge",
  "targets": [{
    "rawSql": "SELECT ROUND(((COUNT(*) FILTER (WHERE (log_data->'quality'->>'intentCorrect')::boolean = true)::numeric / NULLIF(COUNT(*), 0)::numeric * 0.3) + (COUNT(*) FILTER (WHERE (log_data->'quality'->>'personaCorrect')::boolean = true)::numeric / NULLIF(COUNT(*), 0)::numeric * 0.3) + (COUNT(*) FILTER (WHERE (log_data->'safety'->>'violationCount')::int = 0)::numeric / NULLIF(COUNT(*), 0)::numeric * 0.4)) * 100, 2) as value FROM chat_logs WHERE timestamp >= NOW() - INTERVAL '24 hours'",
    "format": "table"
  }],
  "thresholds": {
    "steps": [
      {"value": 0, "color": "red"},
      {"value": 75, "color": "yellow"},
      {"value": 85, "color": "green"}
    ]
  },
  "alert": {
    "conditions": [{"evaluator": {"params": [75], "type": "lt"}}]
  }
}
```

#### Panel 2: Risk Detection Timeline (Time Series)
```json
{
  "title": "Risk Detection Timeline",
  "type": "graph",
  "targets": [{
    "rawSql": "SELECT time_bucket('1 hour', timestamp) as time, COUNT(*) FILTER (WHERE (log_data->'safety'->>'violationCount')::int > 0 OR (log_data->'quality'->>'intentCorrect')::boolean = false) as risks FROM chat_logs WHERE timestamp >= NOW() - INTERVAL '24 hours' GROUP BY time ORDER BY time",
    "format": "time_series"
  }],
  "alert": {
    "conditions": [{"evaluator": {"params": [10], "type": "gt"}}]
  }
}
```

#### Panel 3: Role Distribution (Pie Chart)
```json
{
  "title": "Role Distribution",
  "type": "piechart",
  "targets": [{
    "rawSql": "SELECT log_data->>'role' as role, COUNT(*) as count FROM chat_logs WHERE timestamp >= NOW() - INTERVAL '24 hours' GROUP BY role",
    "format": "table"
  }]
}
```

#### Panel 4: Metric Coverage (Stat)
```json
{
  "title": "Metric Coverage",
  "type": "stat",
  "targets": [{
    "rawSql": "SELECT ROUND(COUNT(*) FILTER (WHERE log_data->'performance'->>'responseTimeMs' IS NOT NULL AND log_data->'quality'->>'intentCorrect' IS NOT NULL)::numeric / NULLIF(COUNT(*), 0)::numeric * 100, 2) as value FROM chat_logs WHERE timestamp >= NOW() - INTERVAL '24 hours'",
    "format": "table"
  }],
  "thresholds": {
    "steps": [
      {"value": 0, "color": "red"},
      {"value": 90, "color": "yellow"},
      {"value": 95, "color": "green"}
    ]
  }
}
```

---

## Cross-Role Comparison Dashboard

### Purpose
Compare performance across all roles.

### Table Format

```sql
-- Cross-Role Comparison (Last 24 Hours)
SELECT 
  log_data->>'role' as role,
  COUNT(*) as total_conversations,
  ROUND(AVG((log_data->'performance'->>'responseTimeMs')::numeric), 0) as avg_response_time_ms,
  ROUND(COUNT(*) FILTER (WHERE (log_data->'safety'->>'violationCount')::int > 0)::numeric / NULLIF(COUNT(*), 0)::numeric * 100, 2) as forbidden_rate,
  ROUND(COUNT(*) FILTER (WHERE (log_data->'quality'->>'intentCorrect')::boolean = true)::numeric / NULLIF(COUNT(*), 0)::numeric * 100, 2) as intent_accuracy,
  ROUND(COUNT(*) FILTER (WHERE log_data->'handoff'->>'status' IN ('requested', 'completed'))::numeric / NULLIF(COUNT(*), 0)::numeric * 100, 2) as handoff_rate
FROM chat_logs
WHERE timestamp >= NOW() - INTERVAL '24 hours'
  AND log_data->>'role' IN ('SALES', 'SUPPORT', 'OPS')
GROUP BY role
ORDER BY role;
```

---

## Alert Configuration

### Critical Alerts (All Roles)

```yaml
# alerts.yml
alerts:
  - name: "Forbidden Response Detected"
    condition: "forbidden_violations > 0"
    severity: "critical"
    roles: ["SALES", "SUPPORT", "OPS"]
    notification: ["slack", "email"]
    
  - name: "System Quality Score Below Threshold"
    condition: "system_quality_score < 75"
    severity: "warning"
    roles: ["OPS"]
    notification: ["slack"]
    
  - name: "Pricing Answer Rate Below Target"
    condition: "pricing_answer_rate < 90"
    severity: "warning"
    roles: ["SALES"]
    notification: ["slack"]
    
  - name: "Handoff Rate Above Threshold"
    condition: "handoff_rate > 40"
    severity: "warning"
    roles: ["SUPPORT"]
    notification: ["slack"]
```

---

## Implementation Notes

1. **Data Source**: All queries assume PostgreSQL with JSONB `log_data` column
2. **Time Buckets**: Use `time_bucket()` function (TimescaleDB) or equivalent
3. **Role Filter**: Always filter by `log_data->>'role' = 'ROLE_NAME'`
4. **Time Windows**: Default to 24 hours, configurable
5. **Alerting**: Integrate with Grafana Alerting or external systems (PagerDuty, Slack)

---

## Quick Start

1. **Import Grafana Dashboard**: Use provided JSON configurations
2. **Configure Datasource**: PostgreSQL connection to chat_logs table
3. **Set Up Alerts**: Configure alert channels (Slack, email, PagerDuty)
4. **Customize Thresholds**: Adjust targets based on business needs
5. **Schedule Reports**: Export dashboard data for weekly/monthly reviews
