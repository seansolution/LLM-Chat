# AI Chat Quality Dashboard

## Overview

Comprehensive dashboard for monitoring AI chat quality metrics using the canonical chat log schema. Supports both simple table views and Grafana dashboards.

## Metrics Definitions

### 1. Intent Coverage
**Definition:** Percentage of messages with correctly detected intent

**Formula:**
```
Intent Coverage = (Logs with intentCorrect = true / Total Logs) × 100
```

**Threshold:** ≥ 90% (from safety gates)

**Breakdown:** Per-intent accuracy

---

### 2. Persona Accuracy
**Definition:** Percentage of messages with correctly detected persona

**Formula:**
```
Persona Accuracy = (Logs with personaCorrect = true / Total Logs) × 100
```

**Threshold:** ≥ 95% (from safety gates)

**Breakdown:** Per-persona accuracy (REGISTRATION, ACCOUNTING, HR)

---

### 3. Pricing Answer Rate
**Definition:** Percentage of pricing questions that received price answers

**Formula:**
```
Pricing Answer Rate = (
  Logs where pricing.questionType = 'explicit' AND pricing.containsPrice = true
  / 
  Logs where pricing.questionType = 'explicit'
) × 100
```

**Threshold:** ≥ 95% (from safety gates)

---

### 4. Forbidden Response Rate
**Definition:** Percentage of responses with safety violations

**Formula:**
```
Forbidden Response Rate = (
  Logs where safety.violationCount > 0
  /
  Total Logs
) × 100
```

**Threshold:** ≤ 0% (zero tolerance)

**Alerting:** Alert when > 0%

**Breakdown:** Per violation type

---

### 5. Handoff Rate
**Definition:** Percentage of conversations that required human handoff

**Formula:**
```
Handoff Rate = (
  Logs where handoff.status IN ('requested', 'completed')
  /
  Total Logs
) × 100
```

**Breakdown:** Per handoff reason

---

### 6. Average Response Time
**Definition:** Average time to generate AI response

**Formula:**
```
Avg Response Time = AVG(performance.responseTimeMs)
```

**Unit:** Milliseconds

---

### 7. Contact Rate
**Definition:** Percentage of conversations where user contacted

**Formula:**
```
Contact Rate = (
  Logs where userActions.contactMethod != 'none'
  /
  Total Logs
) × 100
```

**Breakdown:** Per contact method (phone, email, click)

---

### 8. Conversation Continuation Rate
**Definition:** Percentage of conversations with multiple messages

**Formula:**
```
Continuation Rate = (
  Logs where userActions.messageCount > 1
  /
  Total Logs
) × 100
```

---

## Database Schema

Assuming chat logs are stored in a JSON column or normalized tables:

### Option 1: JSON Column (PostgreSQL/MySQL)

```sql
CREATE TABLE chat_logs (
  id VARCHAR(255) PRIMARY KEY,
  timestamp TIMESTAMP NOT NULL,
  session_id VARCHAR(255) NOT NULL,
  user_id VARCHAR(255),
  log_data JSONB NOT NULL,  -- PostgreSQL
  -- log_data JSON NOT NULL,  -- MySQL
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_timestamp (timestamp),
  INDEX idx_session_id (session_id),
  INDEX idx_user_id (user_id)
);
```

### Option 2: Normalized Tables

```sql
CREATE TABLE chat_logs (
  id VARCHAR(255) PRIMARY KEY,
  timestamp TIMESTAMP NOT NULL,
  session_id VARCHAR(255) NOT NULL,
  user_id VARCHAR(255),
  user_message TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  detected_intent VARCHAR(100) NOT NULL,
  detected_persona VARCHAR(50) NOT NULL,
  response_type VARCHAR(50) NOT NULL,
  expected_intent VARCHAR(100),
  expected_persona VARCHAR(50),
  intent_correct BOOLEAN,
  persona_correct BOOLEAN,
  pricing_question_type VARCHAR(50) NOT NULL,
  pricing_contains_price BOOLEAN NOT NULL,
  safety_violation_count INT NOT NULL DEFAULT 0,
  safety_has_contact_info BOOLEAN NOT NULL,
  handoff_status VARCHAR(50) NOT NULL,
  handoff_reason VARCHAR(50) NOT NULL,
  ab_variant VARCHAR(10) NOT NULL,
  contact_method VARCHAR(50) NOT NULL,
  message_count INT NOT NULL,
  conversation_ended BOOLEAN NOT NULL,
  response_time_ms INT NOT NULL,
  model VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_timestamp (timestamp),
  INDEX idx_session_id (session_id),
  INDEX idx_detected_intent (detected_intent),
  INDEX idx_detected_persona (detected_persona),
  INDEX idx_handoff_status (handoff_status),
  INDEX idx_safety_violation_count (safety_violation_count)
);
```

---

## SQL Queries

### PostgreSQL (JSONB)

#### 1. Intent Coverage

```sql
-- Overall Intent Coverage
SELECT 
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE (log_data->'quality'->>'intentCorrect')::boolean = true) as correct,
  ROUND(
    COUNT(*) FILTER (WHERE (log_data->'quality'->>'intentCorrect')::boolean = true)::numeric 
    / COUNT(*)::numeric * 100, 
    2
  ) as percentage
FROM chat_logs
WHERE timestamp >= NOW() - INTERVAL '24 hours'
  AND log_data->'quality'->>'expectedIntent' IS NOT NULL;

-- Intent Coverage by Intent
SELECT 
  log_data->'intent'->>'detected' as intent,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE (log_data->'quality'->>'intentCorrect')::boolean = true) as correct,
  ROUND(
    COUNT(*) FILTER (WHERE (log_data->'quality'->>'intentCorrect')::boolean = true)::numeric 
    / COUNT(*)::numeric * 100, 
    2
  ) as percentage
FROM chat_logs
WHERE timestamp >= NOW() - INTERVAL '24 hours'
  AND log_data->'quality'->>'expectedIntent' IS NOT NULL
GROUP BY log_data->'intent'->>'detected'
ORDER BY percentage DESC;
```

#### 2. Persona Accuracy

```sql
-- Overall Persona Accuracy
SELECT 
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE (log_data->'quality'->>'personaCorrect')::boolean = true) as correct,
  ROUND(
    COUNT(*) FILTER (WHERE (log_data->'quality'->>'personaCorrect')::boolean = true)::numeric 
    / COUNT(*)::numeric * 100, 
    2
  ) as percentage
FROM chat_logs
WHERE timestamp >= NOW() - INTERVAL '24 hours'
  AND log_data->'quality'->>'expectedPersona' IS NOT NULL;

-- Persona Accuracy by Persona
SELECT 
  log_data->'persona'->>'detected' as persona,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE (log_data->'quality'->>'personaCorrect')::boolean = true) as correct,
  ROUND(
    COUNT(*) FILTER (WHERE (log_data->'quality'->>'personaCorrect')::boolean = true)::numeric 
    / COUNT(*)::numeric * 100, 
    2
  ) as percentage
FROM chat_logs
WHERE timestamp >= NOW() - INTERVAL '24 hours'
  AND log_data->'quality'->>'expectedPersona' IS NOT NULL
GROUP BY log_data->'persona'->>'detected'
ORDER BY percentage DESC;
```

#### 3. Pricing Answer Rate

```sql
-- Pricing Answer Rate
SELECT 
  COUNT(*) FILTER (WHERE log_data->'pricing'->>'questionType' = 'explicit') as total_pricing_questions,
  COUNT(*) FILTER (
    WHERE log_data->'pricing'->>'questionType' = 'explicit' 
    AND (log_data->'pricing'->>'containsPrice')::boolean = true
  ) as answered_with_price,
  ROUND(
    COUNT(*) FILTER (
      WHERE log_data->'pricing'->>'questionType' = 'explicit' 
      AND (log_data->'pricing'->>'containsPrice')::boolean = true
    )::numeric 
    / NULLIF(COUNT(*) FILTER (WHERE log_data->'pricing'->>'questionType' = 'explicit'), 0)::numeric * 100, 
    2
  ) as percentage
FROM chat_logs
WHERE timestamp >= NOW() - INTERVAL '24 hours';
```

#### 4. Forbidden Response Rate

```sql
-- Overall Forbidden Response Rate
SELECT 
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE (log_data->'safety'->>'violationCount')::int > 0) as violations,
  ROUND(
    COUNT(*) FILTER (WHERE (log_data->'safety'->>'violationCount')::int > 0)::numeric 
    / COUNT(*)::numeric * 100, 
    2
  ) as percentage
FROM chat_logs
WHERE timestamp >= NOW() - INTERVAL '24 hours';

-- Forbidden Response Rate by Violation Type
SELECT 
  violation_type,
  COUNT(*) as count
FROM chat_logs,
  jsonb_array_elements_text(log_data->'safety'->'violations') as violation_type
WHERE timestamp >= NOW() - INTERVAL '24 hours'
  AND violation_type != 'none'
GROUP BY violation_type
ORDER BY count DESC;

-- Recent Violations (for alerting)
SELECT 
  id,
  timestamp,
  session_id,
  log_data->'intent'->>'detected' as intent,
  log_data->'safety'->'violations' as violations,
  log_data->'userMessage' as user_message,
  LEFT(log_data->>'aiResponse', 200) as ai_response_preview
FROM chat_logs
WHERE timestamp >= NOW() - INTERVAL '1 hour'
  AND (log_data->'safety'->>'violationCount')::int > 0
ORDER BY timestamp DESC
LIMIT 50;
```

#### 5. Handoff Rate

```sql
-- Handoff Rate
SELECT 
  COUNT(*) as total,
  COUNT(*) FILTER (
    WHERE log_data->'handoff'->>'status' IN ('requested', 'completed')
  ) as handoffs,
  ROUND(
    COUNT(*) FILTER (
      WHERE log_data->'handoff'->>'status' IN ('requested', 'completed')
    )::numeric 
    / COUNT(*)::numeric * 100, 
    2
  ) as percentage
FROM chat_logs
WHERE timestamp >= NOW() - INTERVAL '24 hours';

-- Handoff Rate by Reason
SELECT 
  log_data->'handoff'->>'reason' as reason,
  COUNT(*) as count,
  ROUND(
    COUNT(*)::numeric 
    / (SELECT COUNT(*) FROM chat_logs WHERE timestamp >= NOW() - INTERVAL '24 hours')::numeric * 100, 
    2
  ) as percentage
FROM chat_logs
WHERE timestamp >= NOW() - INTERVAL '24 hours'
  AND log_data->'handoff'->>'status' IN ('requested', 'completed')
GROUP BY log_data->'handoff'->>'reason'
ORDER BY count DESC;
```

#### 6. Average Response Time

```sql
-- Average Response Time (last 24 hours)
SELECT 
  AVG((log_data->'performance'->>'responseTimeMs')::int) as avg_response_time_ms,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY (log_data->'performance'->>'responseTimeMs')::int) as median_response_time_ms,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY (log_data->'performance'->>'responseTimeMs')::int) as p95_response_time_ms,
  PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY (log_data->'performance'->>'responseTimeMs')::int) as p99_response_time_ms
FROM chat_logs
WHERE timestamp >= NOW() - INTERVAL '24 hours';

-- Response Time by Hour
SELECT 
  DATE_TRUNC('hour', timestamp) as hour,
  AVG((log_data->'performance'->>'responseTimeMs')::int) as avg_response_time_ms,
  COUNT(*) as request_count
FROM chat_logs
WHERE timestamp >= NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', timestamp)
ORDER BY hour;
```

#### 7. Contact Rate

```sql
-- Contact Rate
SELECT 
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE log_data->'userActions'->>'contactMethod' != 'none') as contacts,
  ROUND(
    COUNT(*) FILTER (WHERE log_data->'userActions'->>'contactMethod' != 'none')::numeric 
    / COUNT(*)::numeric * 100, 
    2
  ) as percentage
FROM chat_logs
WHERE timestamp >= NOW() - INTERVAL '24 hours';

-- Contact Rate by Method
SELECT 
  log_data->'userActions'->>'contactMethod' as contact_method,
  COUNT(*) as count,
  ROUND(
    COUNT(*)::numeric 
    / (SELECT COUNT(*) FROM chat_logs WHERE timestamp >= NOW() - INTERVAL '24 hours')::numeric * 100, 
    2
  ) as percentage
FROM chat_logs
WHERE timestamp >= NOW() - INTERVAL '24 hours'
  AND log_data->'userActions'->>'contactMethod' != 'none'
GROUP BY log_data->'userActions'->>'contactMethod'
ORDER BY count DESC;
```

#### 8. Conversation Continuation Rate

```sql
-- Conversation Continuation Rate
SELECT 
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE (log_data->'userActions'->>'messageCount')::int > 1) as continued,
  ROUND(
    COUNT(*) FILTER (WHERE (log_data->'userActions'->>'messageCount')::int > 1)::numeric 
    / COUNT(*)::numeric * 100, 
    2
  ) as percentage
FROM chat_logs
WHERE timestamp >= NOW() - INTERVAL '24 hours';
```

### MySQL (JSON)

```sql
-- Intent Coverage (MySQL)
SELECT 
  COUNT(*) as total,
  SUM(JSON_EXTRACT(log_data, '$.quality.intentCorrect') = true) as correct,
  ROUND(
    SUM(JSON_EXTRACT(log_data, '$.quality.intentCorrect') = true) 
    / COUNT(*) * 100, 
    2
  ) as percentage
FROM chat_logs
WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
  AND JSON_EXTRACT(log_data, '$.quality.expectedIntent') IS NOT NULL;
```

---

## Simple Table Dashboard

### HTML/JavaScript Example

```html
<!DOCTYPE html>
<html>
<head>
  <title>AI Chat Quality Dashboard</title>
  <style>
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
    .metric-good { color: green; }
    .metric-warning { color: orange; }
    .metric-bad { color: red; }
  </style>
</head>
<body>
  <h1>AI Chat Quality Dashboard</h1>
  <div id="metrics"></div>
  
  <script>
    async function loadMetrics() {
      const response = await fetch('/api/dashboard/metrics?period=24h');
      const data = await response.json();
      
      const html = `
        <table>
          <tr>
            <th>Metric</th>
            <th>Value</th>
            <th>Threshold</th>
            <th>Status</th>
          </tr>
          <tr>
            <td>Intent Coverage</td>
            <td>${data.intentCoverage.percentage.toFixed(2)}%</td>
            <td>≥ 90%</td>
            <td class="${data.intentCoverage.percentage >= 90 ? 'metric-good' : 'metric-bad'}">
              ${data.intentCoverage.percentage >= 90 ? '✓' : '✗'}
            </td>
          </tr>
          <tr>
            <td>Persona Accuracy</td>
            <td>${data.personaAccuracy.percentage.toFixed(2)}%</td>
            <td>≥ 95%</td>
            <td class="${data.personaAccuracy.percentage >= 95 ? 'metric-good' : 'metric-bad'}">
              ${data.personaAccuracy.percentage >= 95 ? '✓' : '✗'}
            </td>
          </tr>
          <tr>
            <td>Pricing Answer Rate</td>
            <td>${data.pricingAnswerRate.percentage.toFixed(2)}%</td>
            <td>≥ 95%</td>
            <td class="${data.pricingAnswerRate.percentage >= 95 ? 'metric-good' : 'metric-bad'}">
              ${data.pricingAnswerRate.percentage >= 95 ? '✓' : '✗'}
            </td>
          </tr>
          <tr>
            <td>Forbidden Response Rate</td>
            <td>${data.forbiddenResponseRate.percentage.toFixed(2)}%</td>
            <td>≤ 0%</td>
            <td class="${data.forbiddenResponseRate.percentage === 0 ? 'metric-good' : 'metric-bad'}">
              ${data.forbiddenResponseRate.percentage === 0 ? '✓' : '✗ ALERT'}
            </td>
          </tr>
        </table>
      `;
      
      document.getElementById('metrics').innerHTML = html;
    }
    
    loadMetrics();
    setInterval(loadMetrics, 60000); // Refresh every minute
  </script>
</body>
</html>
```

---

## Grafana Dashboard Configuration

### Panel 1: Intent Coverage Gauge

```json
{
  "title": "Intent Coverage",
  "type": "gauge",
  "targets": [
    {
      "expr": "SELECT COUNT(*) FILTER (WHERE (log_data->'quality'->>'intentCorrect')::boolean = true)::numeric / COUNT(*)::numeric * 100 FROM chat_logs WHERE timestamp >= NOW() - INTERVAL '24 hours' AND log_data->'quality'->>'expectedIntent' IS NOT NULL",
      "format": "table",
      "rawSql": true
    }
  ],
  "fieldConfig": {
    "defaults": {
      "min": 0,
      "max": 100,
      "thresholds": {
        "mode": "absolute",
        "steps": [
          { "value": 0, "color": "red" },
          { "value": 90, "color": "green" }
        ]
      },
      "unit": "percent"
    }
  },
  "options": {
    "orientation": "auto",
    "reduceOptions": {
      "values": false,
      "calcs": ["lastNotNull"]
    }
  }
}
```

### Panel 2: Persona Accuracy Gauge

```json
{
  "title": "Persona Accuracy",
  "type": "gauge",
  "targets": [
    {
      "expr": "SELECT COUNT(*) FILTER (WHERE (log_data->'quality'->>'personaCorrect')::boolean = true)::numeric / COUNT(*)::numeric * 100 FROM chat_logs WHERE timestamp >= NOW() - INTERVAL '24 hours' AND log_data->'quality'->>'expectedPersona' IS NOT NULL",
      "format": "table",
      "rawSql": true
    }
  ],
  "fieldConfig": {
    "defaults": {
      "min": 0,
      "max": 100,
      "thresholds": {
        "mode": "absolute",
        "steps": [
          { "value": 0, "color": "red" },
          { "value": 95, "color": "green" }
        ]
      },
      "unit": "percent"
    }
  }
}
```

### Panel 3: Pricing Answer Rate Gauge

```json
{
  "title": "Pricing Answer Rate",
  "type": "gauge",
  "targets": [
    {
      "expr": "SELECT COUNT(*) FILTER (WHERE log_data->'pricing'->>'questionType' = 'explicit' AND (log_data->'pricing'->>'containsPrice')::boolean = true)::numeric / NULLIF(COUNT(*) FILTER (WHERE log_data->'pricing'->>'questionType' = 'explicit'), 0)::numeric * 100 FROM chat_logs WHERE timestamp >= NOW() - INTERVAL '24 hours'",
      "format": "table",
      "rawSql": true
    }
  ],
  "fieldConfig": {
    "defaults": {
      "min": 0,
      "max": 100,
      "thresholds": {
        "mode": "absolute",
        "steps": [
          { "value": 0, "color": "red" },
          { "value": 95, "color": "green" }
        ]
      },
      "unit": "percent"
    }
  }
}
```

### Panel 4: Forbidden Response Rate (Alert Panel)

```json
{
  "title": "Forbidden Response Rate",
  "type": "stat",
  "targets": [
    {
      "expr": "SELECT COUNT(*) FILTER (WHERE (log_data->'safety'->>'violationCount')::int > 0)::numeric / COUNT(*)::numeric * 100 FROM chat_logs WHERE timestamp >= NOW() - INTERVAL '24 hours'",
      "format": "table",
      "rawSql": true
    }
  ],
  "fieldConfig": {
    "defaults": {
      "thresholds": {
        "mode": "absolute",
        "steps": [
          { "value": 0, "color": "green" },
          { "value": 0.01, "color": "red" }
        ]
      },
      "unit": "percent"
    }
  },
  "options": {
    "colorMode": "value",
    "graphMode": "area"
  },
  "alert": {
    "conditions": [
      {
        "evaluator": {
          "params": [0],
          "type": "gt"
        },
        "operator": {
          "type": "and"
        },
        "query": {
          "params": ["A", "5m", "now"]
        },
        "reducer": {
          "params": [],
          "type": "last"
        },
        "type": "query"
      }
    ],
    "executionErrorState": "alerting",
    "for": "5m",
    "frequency": "10s",
    "handler": 1,
    "name": "Forbidden Response Detected",
    "noDataState": "no_data",
    "notifications": ["slack", "email"]
  }
}
```

### Panel 5: Violation Breakdown (Bar Chart)

```json
{
  "title": "Violation Breakdown",
  "type": "barchart",
  "targets": [
    {
      "expr": "SELECT violation_type, COUNT(*) as count FROM chat_logs, jsonb_array_elements_text(log_data->'safety'->'violations') as violation_type WHERE timestamp >= NOW() - INTERVAL '24 hours' AND violation_type != 'none' GROUP BY violation_type ORDER BY count DESC",
      "format": "table",
      "rawSql": true
    }
  ],
  "fieldConfig": {
    "defaults": {
      "color": {
        "mode": "palette-classic"
      }
    }
  },
  "options": {
    "orientation": "horizontal",
    "legend": {
      "displayMode": "list",
      "placement": "bottom"
    }
  }
}
```

### Panel 6: Intent Coverage Over Time (Time Series)

```json
{
  "title": "Intent Coverage Over Time",
  "type": "timeseries",
  "targets": [
    {
      "expr": "SELECT DATE_TRUNC('hour', timestamp) as time, COUNT(*) FILTER (WHERE (log_data->'quality'->>'intentCorrect')::boolean = true)::numeric / COUNT(*)::numeric * 100 as coverage FROM chat_logs WHERE timestamp >= NOW() - INTERVAL '7 days' AND log_data->'quality'->>'expectedIntent' IS NOT NULL GROUP BY DATE_TRUNC('hour', timestamp) ORDER BY time",
      "format": "table",
      "rawSql": true
    }
  ],
  "fieldConfig": {
    "defaults": {
      "min": 0,
      "max": 100,
      "thresholds": {
        "mode": "absolute",
        "steps": [
          { "value": 0, "color": "red" },
          { "value": 90, "color": "green" }
        ]
      },
      "unit": "percent"
    }
  }
}
```

### Panel 7: Response Time (Time Series)

```json
{
  "title": "Average Response Time",
  "type": "timeseries",
  "targets": [
    {
      "expr": "SELECT DATE_TRUNC('hour', timestamp) as time, AVG((log_data->'performance'->>'responseTimeMs')::int) as avg_response_time_ms FROM chat_logs WHERE timestamp >= NOW() - INTERVAL '24 hours' GROUP BY DATE_TRUNC('hour', timestamp) ORDER BY time",
      "format": "table",
      "rawSql": true
    }
  ],
  "fieldConfig": {
    "defaults": {
      "unit": "ms"
    }
  }
}
```

### Panel 8: Recent Violations Table

```json
{
  "title": "Recent Violations",
  "type": "table",
  "targets": [
    {
      "expr": "SELECT timestamp, session_id, log_data->'intent'->>'detected' as intent, log_data->'safety'->'violations' as violations, LEFT(log_data->>'userMessage', 50) as user_message, LEFT(log_data->>'aiResponse', 100) as ai_response FROM chat_logs WHERE timestamp >= NOW() - INTERVAL '1 hour' AND (log_data->'safety'->>'violationCount')::int > 0 ORDER BY timestamp DESC LIMIT 20",
      "format": "table",
      "rawSql": true
    }
  ]
}
```

---

## Alerting Rules

### Grafana Alert Rules

```yaml
# Forbidden Response Alert
- uid: forbidden-response-alert
  title: "Forbidden Response Detected"
  condition: A
  data:
    - refId: A
      queryType: ""
      relativeTimeRange:
        from: 300
        to: 0
      datasourceUid: postgres
      model:
        rawSql: |
          SELECT COUNT(*) FILTER (WHERE (log_data->'safety'->>'violationCount')::int > 0)::numeric / COUNT(*)::numeric * 100 as violation_rate
          FROM chat_logs
          WHERE timestamp >= NOW() - INTERVAL '5 minutes'
        format: table
  noDataState: NoData
  execErrState: Alerting
  for: 5m
  annotations:
    summary: "Forbidden response detected in chat logs"
    description: "Violation rate: {{ $values.A }}%"
  labels:
    severity: critical
  notifications:
    - uid: slack
    - uid: email
```

### Prometheus Alert Rules (if using Prometheus)

```yaml
groups:
  - name: chat_quality
    interval: 30s
    rules:
      - alert: ForbiddenResponseDetected
        expr: chat_forbidden_response_rate > 0
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Forbidden response detected"
          description: "Forbidden response rate is {{ $value }}%"
```

---

## Dashboard Layout

### Recommended Panel Order

1. **Top Row (Gauges):**
   - Intent Coverage
   - Persona Accuracy
   - Pricing Answer Rate
   - Forbidden Response Rate (Alert)

2. **Second Row (Charts):**
   - Intent Coverage Over Time
   - Persona Accuracy Over Time
   - Pricing Answer Rate Over Time
   - Response Time Over Time

3. **Third Row (Breakdowns):**
   - Intent Coverage by Intent (Bar Chart)
   - Persona Accuracy by Persona (Bar Chart)
   - Violation Breakdown (Bar Chart)
   - Handoff Rate by Reason (Pie Chart)

4. **Bottom Row (Tables):**
   - Recent Violations
   - Recent Handoffs
   - Top Intents
   - Performance Summary

---

## API Endpoint Example

```typescript
// app/api/dashboard/metrics/route.ts
import { NextResponse } from 'next/server'
import { queryDatabase } from './db'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const period = searchParams.get('period') || '24h'
  
  const metrics = await queryDatabase(`
    SELECT 
      -- Intent Coverage
      COUNT(*) FILTER (WHERE (log_data->'quality'->>'intentCorrect')::boolean = true)::numeric 
      / NULLIF(COUNT(*) FILTER (WHERE log_data->'quality'->>'expectedIntent' IS NOT NULL), 0)::numeric * 100 as intent_coverage,
      
      -- Persona Accuracy
      COUNT(*) FILTER (WHERE (log_data->'quality'->>'personaCorrect')::boolean = true)::numeric 
      / NULLIF(COUNT(*) FILTER (WHERE log_data->'quality'->>'expectedPersona' IS NOT NULL), 0)::numeric * 100 as persona_accuracy,
      
      -- Pricing Answer Rate
      COUNT(*) FILTER (WHERE log_data->'pricing'->>'questionType' = 'explicit' AND (log_data->'pricing'->>'containsPrice')::boolean = true)::numeric 
      / NULLIF(COUNT(*) FILTER (WHERE log_data->'pricing'->>'questionType' = 'explicit'), 0)::numeric * 100 as pricing_answer_rate,
      
      -- Forbidden Response Rate
      COUNT(*) FILTER (WHERE (log_data->'safety'->>'violationCount')::int > 0)::numeric 
      / COUNT(*)::numeric * 100 as forbidden_response_rate
      
    FROM chat_logs
    WHERE timestamp >= NOW() - INTERVAL '${period}'
  `)
  
  return NextResponse.json(metrics)
}
```

---

## Best Practices

1. **Refresh Interval:** 1-5 minutes for real-time monitoring
2. **Retention:** Keep logs for at least 90 days for trend analysis
3. **Alerting:** Set up alerts for forbidden responses (zero tolerance)
4. **Dashboards:** Create separate dashboards for:
   - Real-time monitoring (last 1 hour)
   - Daily review (last 24 hours)
   - Weekly review (last 7 days)
   - Monthly review (last 30 days)
5. **Export:** Export metrics to CSV/JSON for external analysis
