-- ============================================================================
-- AI Chat Quality Dashboard - SQL Queries
-- ============================================================================
-- Database: PostgreSQL (with JSONB) or MySQL (with JSON)
-- Schema: chat_logs table with log_data JSON column
-- ============================================================================

-- ============================================================================
-- 1. INTENT COVERAGE
-- ============================================================================

-- Overall Intent Coverage (last 24 hours)
SELECT 
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE (log_data->'quality'->>'intentCorrect')::boolean = true) as correct,
  ROUND(
    COUNT(*) FILTER (WHERE (log_data->'quality'->>'intentCorrect')::boolean = true)::numeric 
    / NULLIF(COUNT(*) FILTER (WHERE log_data->'quality'->>'expectedIntent' IS NOT NULL), 0)::numeric * 100, 
    2
  ) as percentage
FROM chat_logs
WHERE timestamp >= NOW() - INTERVAL '24 hours'
  AND log_data->'quality'->>'expectedIntent' IS NOT NULL;

-- Intent Coverage by Intent (last 24 hours)
SELECT 
  log_data->'intent'->>'detected' as intent,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE (log_data->'quality'->>'intentCorrect')::boolean = true) as correct,
  ROUND(
    COUNT(*) FILTER (WHERE (log_data->'quality'->>'intentCorrect')::boolean = true)::numeric 
    / NULLIF(COUNT(*), 0)::numeric * 100, 
    2
  ) as percentage
FROM chat_logs
WHERE timestamp >= NOW() - INTERVAL '24 hours'
  AND log_data->'quality'->>'expectedIntent' IS NOT NULL
GROUP BY log_data->'intent'->>'detected'
ORDER BY percentage DESC, total DESC;

-- Intent Coverage Over Time (last 7 days, hourly)
SELECT 
  DATE_TRUNC('hour', timestamp) as hour,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE (log_data->'quality'->>'intentCorrect')::boolean = true) as correct,
  ROUND(
    COUNT(*) FILTER (WHERE (log_data->'quality'->>'intentCorrect')::boolean = true)::numeric 
    / NULLIF(COUNT(*), 0)::numeric * 100, 
    2
  ) as percentage
FROM chat_logs
WHERE timestamp >= NOW() - INTERVAL '7 days'
  AND log_data->'quality'->>'expectedIntent' IS NOT NULL
GROUP BY DATE_TRUNC('hour', timestamp)
ORDER BY hour;

-- ============================================================================
-- 2. PERSONA ACCURACY
-- ============================================================================

-- Overall Persona Accuracy (last 24 hours)
SELECT 
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE (log_data->'quality'->>'personaCorrect')::boolean = true) as correct,
  ROUND(
    COUNT(*) FILTER (WHERE (log_data->'quality'->>'personaCorrect')::boolean = true)::numeric 
    / NULLIF(COUNT(*) FILTER (WHERE log_data->'quality'->>'expectedPersona' IS NOT NULL), 0)::numeric * 100, 
    2
  ) as percentage
FROM chat_logs
WHERE timestamp >= NOW() - INTERVAL '24 hours'
  AND log_data->'quality'->>'expectedPersona' IS NOT NULL;

-- Persona Accuracy by Persona (last 24 hours)
SELECT 
  log_data->'persona'->>'detected' as persona,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE (log_data->'quality'->>'personaCorrect')::boolean = true) as correct,
  ROUND(
    COUNT(*) FILTER (WHERE (log_data->'quality'->>'personaCorrect')::boolean = true)::numeric 
    / NULLIF(COUNT(*), 0)::numeric * 100, 
    2
  ) as percentage
FROM chat_logs
WHERE timestamp >= NOW() - INTERVAL '24 hours'
  AND log_data->'quality'->>'expectedPersona' IS NOT NULL
GROUP BY log_data->'persona'->>'detected'
ORDER BY percentage DESC;

-- ============================================================================
-- 3. PRICING ANSWER RATE
-- ============================================================================

-- Pricing Answer Rate (last 24 hours)
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

-- Pricing Answer Rate Over Time (last 7 days, hourly)
SELECT 
  DATE_TRUNC('hour', timestamp) as hour,
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
WHERE timestamp >= NOW() - INTERVAL '7 days'
GROUP BY DATE_TRUNC('hour', timestamp)
ORDER BY hour;

-- ============================================================================
-- 4. FORBIDDEN RESPONSE RATE (ALERTING)
-- ============================================================================

-- Overall Forbidden Response Rate (last 24 hours)
SELECT 
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE (log_data->'safety'->>'violationCount')::int > 0) as violations,
  ROUND(
    COUNT(*) FILTER (WHERE (log_data->'safety'->>'violationCount')::int > 0)::numeric 
    / NULLIF(COUNT(*), 0)::numeric * 100, 
    2
  ) as percentage
FROM chat_logs
WHERE timestamp >= NOW() - INTERVAL '24 hours';

-- Forbidden Response Rate by Violation Type (last 24 hours)
SELECT 
  violation_type,
  COUNT(*) as count,
  ROUND(
    COUNT(*)::numeric 
    / (SELECT COUNT(*) FROM chat_logs WHERE timestamp >= NOW() - INTERVAL '24 hours')::numeric * 100, 
    2
  ) as percentage
FROM chat_logs,
  jsonb_array_elements_text(log_data->'safety'->'violations') as violation_type
WHERE timestamp >= NOW() - INTERVAL '24 hours'
  AND violation_type != 'none'
GROUP BY violation_type
ORDER BY count DESC;

-- Recent Violations (for alerting - last 1 hour)
SELECT 
  id,
  timestamp,
  session_id,
  log_data->'intent'->>'detected' as intent,
  log_data->'persona'->>'detected' as persona,
  log_data->'safety'->'violations' as violations,
  log_data->'safety'->>'violationCount' as violation_count,
  log_data->>'userMessage' as user_message,
  LEFT(log_data->>'aiResponse', 200) as ai_response_preview
FROM chat_logs
WHERE timestamp >= NOW() - INTERVAL '1 hour'
  AND (log_data->'safety'->>'violationCount')::int > 0
ORDER BY timestamp DESC
LIMIT 50;

-- Violation Rate Over Time (last 7 days, hourly)
SELECT 
  DATE_TRUNC('hour', timestamp) as hour,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE (log_data->'safety'->>'violationCount')::int > 0) as violations,
  ROUND(
    COUNT(*) FILTER (WHERE (log_data->'safety'->>'violationCount')::int > 0)::numeric 
    / NULLIF(COUNT(*), 0)::numeric * 100, 
    2
  ) as percentage
FROM chat_logs
WHERE timestamp >= NOW() - INTERVAL '7 days'
GROUP BY DATE_TRUNC('hour', timestamp)
ORDER BY hour;

-- ============================================================================
-- 5. HANDOFF RATE
-- ============================================================================

-- Handoff Rate (last 24 hours)
SELECT 
  COUNT(*) as total,
  COUNT(*) FILTER (
    WHERE log_data->'handoff'->>'status' IN ('requested', 'completed')
  ) as handoffs,
  ROUND(
    COUNT(*) FILTER (
      WHERE log_data->'handoff'->>'status' IN ('requested', 'completed')
    )::numeric 
    / NULLIF(COUNT(*), 0)::numeric * 100, 
    2
  ) as percentage
FROM chat_logs
WHERE timestamp >= NOW() - INTERVAL '24 hours';

-- Handoff Rate by Reason (last 24 hours)
SELECT 
  log_data->'handoff'->>'reason' as reason,
  COUNT(*) as count,
  ROUND(
    COUNT(*)::numeric 
    / NULLIF((SELECT COUNT(*) FROM chat_logs WHERE timestamp >= NOW() - INTERVAL '24 hours'), 0)::numeric * 100, 
    2
  ) as percentage
FROM chat_logs
WHERE timestamp >= NOW() - INTERVAL '24 hours'
  AND log_data->'handoff'->>'status' IN ('requested', 'completed')
GROUP BY log_data->'handoff'->>'reason'
ORDER BY count DESC;

-- ============================================================================
-- 6. PERFORMANCE METRICS
-- ============================================================================

-- Average Response Time (last 24 hours)
SELECT 
  AVG((log_data->'performance'->>'responseTimeMs')::int) as avg_response_time_ms,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY (log_data->'performance'->>'responseTimeMs')::int) as median_response_time_ms,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY (log_data->'performance'->>'responseTimeMs')::int) as p95_response_time_ms,
  PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY (log_data->'performance'->>'responseTimeMs')::int) as p99_response_time_ms,
  MIN((log_data->'performance'->>'responseTimeMs')::int) as min_response_time_ms,
  MAX((log_data->'performance'->>'responseTimeMs')::int) as max_response_time_ms
FROM chat_logs
WHERE timestamp >= NOW() - INTERVAL '24 hours';

-- Response Time Over Time (last 24 hours, hourly)
SELECT 
  DATE_TRUNC('hour', timestamp) as hour,
  AVG((log_data->'performance'->>'responseTimeMs')::int) as avg_response_time_ms,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY (log_data->'performance'->>'responseTimeMs')::int) as p95_response_time_ms,
  COUNT(*) as request_count
FROM chat_logs
WHERE timestamp >= NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', timestamp)
ORDER BY hour;

-- ============================================================================
-- 7. CONTACT RATE
-- ============================================================================

-- Contact Rate (last 24 hours)
SELECT 
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE log_data->'userActions'->>'contactMethod' != 'none') as contacts,
  ROUND(
    COUNT(*) FILTER (WHERE log_data->'userActions'->>'contactMethod' != 'none')::numeric 
    / NULLIF(COUNT(*), 0)::numeric * 100, 
    2
  ) as percentage
FROM chat_logs
WHERE timestamp >= NOW() - INTERVAL '24 hours';

-- Contact Rate by Method (last 24 hours)
SELECT 
  log_data->'userActions'->>'contactMethod' as contact_method,
  COUNT(*) as count,
  ROUND(
    COUNT(*)::numeric 
    / NULLIF((SELECT COUNT(*) FROM chat_logs WHERE timestamp >= NOW() - INTERVAL '24 hours'), 0)::numeric * 100, 
    2
  ) as percentage
FROM chat_logs
WHERE timestamp >= NOW() - INTERVAL '24 hours'
  AND log_data->'userActions'->>'contactMethod' != 'none'
GROUP BY log_data->'userActions'->>'contactMethod'
ORDER BY count DESC;

-- ============================================================================
-- 8. CONVERSATION CONTINUATION RATE
-- ============================================================================

-- Conversation Continuation Rate (last 24 hours)
SELECT 
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE (log_data->'userActions'->>'messageCount')::int > 1) as continued,
  ROUND(
    COUNT(*) FILTER (WHERE (log_data->'userActions'->>'messageCount')::int > 1)::numeric 
    / NULLIF(COUNT(*), 0)::numeric * 100, 
    2
  ) as percentage
FROM chat_logs
WHERE timestamp >= NOW() - INTERVAL '24 hours';

-- ============================================================================
-- 9. COMPREHENSIVE METRICS SUMMARY
-- ============================================================================

-- All Key Metrics (last 24 hours)
SELECT 
  -- Intent Coverage
  ROUND(
    COUNT(*) FILTER (WHERE (log_data->'quality'->>'intentCorrect')::boolean = true)::numeric 
    / NULLIF(COUNT(*) FILTER (WHERE log_data->'quality'->>'expectedIntent' IS NOT NULL), 0)::numeric * 100, 
    2
  ) as intent_coverage_percentage,
  
  -- Persona Accuracy
  ROUND(
    COUNT(*) FILTER (WHERE (log_data->'quality'->>'personaCorrect')::boolean = true)::numeric 
    / NULLIF(COUNT(*) FILTER (WHERE log_data->'quality'->>'expectedPersona' IS NOT NULL), 0)::numeric * 100, 
    2
  ) as persona_accuracy_percentage,
  
  -- Pricing Answer Rate
  ROUND(
    COUNT(*) FILTER (
      WHERE log_data->'pricing'->>'questionType' = 'explicit' 
      AND (log_data->'pricing'->>'containsPrice')::boolean = true
    )::numeric 
    / NULLIF(COUNT(*) FILTER (WHERE log_data->'pricing'->>'questionType' = 'explicit'), 0)::numeric * 100, 
    2
  ) as pricing_answer_rate_percentage,
  
  -- Forbidden Response Rate
  ROUND(
    COUNT(*) FILTER (WHERE (log_data->'safety'->>'violationCount')::int > 0)::numeric 
    / NULLIF(COUNT(*), 0)::numeric * 100, 
    2
  ) as forbidden_response_rate_percentage,
  
  -- Handoff Rate
  ROUND(
    COUNT(*) FILTER (
      WHERE log_data->'handoff'->>'status' IN ('requested', 'completed')
    )::numeric 
    / NULLIF(COUNT(*), 0)::numeric * 100, 
    2
  ) as handoff_rate_percentage,
  
  -- Total Logs
  COUNT(*) as total_logs,
  
  -- Average Response Time
  AVG((log_data->'performance'->>'responseTimeMs')::int) as avg_response_time_ms
  
FROM chat_logs
WHERE timestamp >= NOW() - INTERVAL '24 hours';
