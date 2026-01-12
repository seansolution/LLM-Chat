# AI Chat Quality Dashboard - Quick Start

## Overview

Comprehensive dashboard for monitoring AI chat quality metrics using the canonical chat log schema.

## Key Metrics

| Metric | Threshold | Alert |
|--------|-----------|-------|
| **Intent Coverage** | ≥ 90% | No |
| **Persona Accuracy** | ≥ 95% | No |
| **Pricing Answer Rate** | ≥ 95% | No |
| **Forbidden Response Rate** | ≤ 0% | **YES** (critical) |
| **Handoff Rate** | Monitor | No |
| **Response Time** | < 2000ms | No |

## Quick SQL Queries

### All Metrics Summary (Last 24 Hours)

```sql
SELECT 
  ROUND(COUNT(*) FILTER (WHERE (log_data->'quality'->>'intentCorrect')::boolean = true)::numeric / NULLIF(COUNT(*) FILTER (WHERE log_data->'quality'->>'expectedIntent' IS NOT NULL), 0)::numeric * 100, 2) as intent_coverage,
  ROUND(COUNT(*) FILTER (WHERE (log_data->'quality'->>'personaCorrect')::boolean = true)::numeric / NULLIF(COUNT(*) FILTER (WHERE log_data->'quality'->>'expectedPersona' IS NOT NULL), 0)::numeric * 100, 2) as persona_accuracy,
  ROUND(COUNT(*) FILTER (WHERE log_data->'pricing'->>'questionType' = 'explicit' AND (log_data->'pricing'->>'containsPrice')::boolean = true)::numeric / NULLIF(COUNT(*) FILTER (WHERE log_data->'pricing'->>'questionType' = 'explicit'), 0)::numeric * 100, 2) as pricing_answer_rate,
  ROUND(COUNT(*) FILTER (WHERE (log_data->'safety'->>'violationCount')::int > 0)::numeric / NULLIF(COUNT(*), 0)::numeric * 100, 2) as forbidden_response_rate
FROM chat_logs
WHERE timestamp >= NOW() - INTERVAL '24 hours';
```

### Check for Violations (Alert Query)

```sql
SELECT COUNT(*) as violation_count
FROM chat_logs
WHERE timestamp >= NOW() - INTERVAL '5 minutes'
  AND (log_data->'safety'->>'violationCount')::int > 0;
```

**Alert:** If `violation_count > 0`, trigger alert.

## Grafana Setup

### 1. Import Dashboard

1. Open Grafana
2. Go to Dashboards → Import
3. Upload `quality-dashboard-grafana.json`
4. Configure PostgreSQL datasource

### 2. Configure Datasource

```yaml
# datasources/postgres.yaml
apiVersion: 1
datasources:
  - name: PostgreSQL
    type: postgres
    url: localhost:5432
    database: your_database
    user: your_user
    secureJsonData:
      password: your_password
```

### 3. Set Up Alerting

1. Go to Alerting → Alert Rules
2. Create rule: "Forbidden Response Detected"
3. Condition: `violation_count > 0`
4. Notification channels: Slack, Email

## Simple Table Dashboard

### HTML Example

```html
<!DOCTYPE html>
<html>
<head>
  <title>AI Chat Quality Dashboard</title>
  <style>
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    .good { color: green; }
    .bad { color: red; }
  </style>
</head>
<body>
  <h1>AI Chat Quality Dashboard</h1>
  <div id="metrics"></div>
  <script>
    async function loadMetrics() {
      const response = await fetch('/api/dashboard/metrics?period=24h');
      const data = await response.json();
      document.getElementById('metrics').innerHTML = `
        <table>
          <tr><th>Metric</th><th>Value</th><th>Status</th></tr>
          <tr>
            <td>Intent Coverage</td>
            <td>${data.intent_coverage}%</td>
            <td class="${data.intent_coverage >= 90 ? 'good' : 'bad'}">
              ${data.intent_coverage >= 90 ? '✓' : '✗'}
            </td>
          </tr>
          <tr>
            <td>Persona Accuracy</td>
            <td>${data.persona_accuracy}%</td>
            <td class="${data.persona_accuracy >= 95 ? 'good' : 'bad'}">
              ${data.persona_accuracy >= 95 ? '✓' : '✗'}
            </td>
          </tr>
          <tr>
            <td>Pricing Answer Rate</td>
            <td>${data.pricing_answer_rate}%</td>
            <td class="${data.pricing_answer_rate >= 95 ? 'good' : 'bad'}">
              ${data.pricing_answer_rate >= 95 ? '✓' : '✗'}
            </td>
          </tr>
          <tr>
            <td>Forbidden Response Rate</td>
            <td>${data.forbidden_response_rate}%</td>
            <td class="${data.forbidden_response_rate === 0 ? 'good' : 'bad'}">
              ${data.forbidden_response_rate === 0 ? '✓' : '✗ ALERT'}
            </td>
          </tr>
        </table>
      `;
    }
    loadMetrics();
    setInterval(loadMetrics, 60000);
  </script>
</body>
</html>
```

## Files

- **`quality-dashboard.md`** - Complete documentation
- **`quality-dashboard-queries.sql`** - All SQL queries
- **`quality-dashboard-grafana.json`** - Grafana dashboard config

## Next Steps

1. Set up database with chat logs
2. Import Grafana dashboard
3. Configure alerting for forbidden responses
4. Set up automated monitoring
