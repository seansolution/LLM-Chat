# Agent Console UI - Summary

**Complete UI design for sales and support team handoff management.**

---

## Overview

Agent Console UI for sales and support teams to handle AI chat handoffs with intelligent summaries, lead scoring, and suggested actions.

**Key Features:**
- Conversation summary
- Persona and intent display
- Lead score calculation (0-100)
- Suggested next actions
- Do not ask warnings
- Full conversation history

---

## Documents

1. **`AGENT_CONSOLE_UI.md`** - Complete design
   - Layout design
   - Component specifications
   - Data requirements
   - API endpoints
   - UI/UX guidelines

2. **`AGENT_CONSOLE_COMPONENTS.md`** - Component list
   - Component hierarchy
   - Props and data types
   - API integration hooks
   - Styling guidelines

3. **`lead-score.ts`** - Lead score calculation
   - Score calculation function
   - Breakdown factors
   - Category determination
   - Formatting utilities

4. **`AGENT_CONSOLE_QUICK_START.md`** - Quick reference
   - Layout overview
   - Core components
   - Data flow
   - MVP checklist

---

## Layout Structure

```
Header
├── Logo
├── Title
├── User Menu
└── Notifications

Sidebar
├── Filters (Priority, Persona, Status, Date)
└── Quick Stats (Pending, High Priority, Completed)

Main Content
├── Handoff Queue (List of cards)
└── Conversation Detail View
    ├── Customer Info
    ├── Summary
    ├── Lead Score
    ├── Action Card
    ├── Suggested Script
    ├── Do Not Ask
    └── Conversation History
```

---

## Core Components (13 Components)

1. **Header** - Navigation and user controls
2. **Sidebar** - Filters and quick stats
3. **HandoffQueue** - List of pending handoffs
4. **HandoffCard** - Quick view card in queue
5. **ConversationDetailView** - Full detail view
6. **CustomerInfoCard** - Customer contact info
7. **ConversationSummaryCard** - Summary and key points
8. **LeadScoreCard** - Lead score with breakdown
9. **ActionCard** - Suggested next action
10. **SuggestedScriptCard** - Opening script
11. **DoNotAskCard** - Warnings to prevent repetition
12. **ConversationHistoryCard** - Full transcript
13. **ActionButtons** - Take, Complete, Escalate actions

---

## Lead Score Calculation

**Formula:**
```
Lead Score = 
  Buying Intent (0-30) +
  Urgency (0-25) +
  Persona (0-15) +
  Pricing (0-10) +
  Contact Requested (0-10) +
  Estimated Value (0-10)
```

**Categories:**
- **90-100:** Hot lead (immediate action)
- **70-89:** Warm lead (within 24h)
- **50-69:** Cool lead (within 3 days)
- **0-49:** Cold lead (when time permits)

---

## Data Requirements

### HandoffSummary (Queue)
- handoffId, priority, timestamp
- customer, persona, intent
- summary, leadScore
- suggestedAction

### AgentAssistOutput (Detail)
- Full conversation summary
- Customer info
- Intent and persona
- Buying intent and urgency
- Already answered flags
- Suggested action and script
- Conversation history

---

## API Endpoints

1. `GET /api/agent/handoffs` - Get handoff queue
2. `GET /api/agent/handoffs/:id` - Get handoff details
3. `POST /api/agent/handoffs/:id/take` - Take handoff
4. `POST /api/agent/handoffs/:id/complete` - Complete handoff
5. `POST /api/agent/handoffs/:id/lead-score` - Calculate lead score

---

## MVP Scope

### Must Have
- ✅ Handoff queue list
- ✅ Handoff card component
- ✅ Conversation detail view
- ✅ Lead score calculation
- ✅ Suggested actions
- ✅ Do not ask warnings
- ✅ Conversation history
- ✅ Take/Complete actions

### Post-MVP
- ⏳ Real-time updates
- ⏳ Agent assignment
- ⏳ Notes/annotations
- ⏳ Deal tracking
- ⏳ Analytics dashboard

---

## Key Metrics

- **Time to First Action:** < 30 seconds
- **Completion Rate:** ≥ 80%
- **Response Time:** < 1 hour (high priority)
- **Agent Satisfaction:** ≥ 4.0/5.0

---

*Ready for MVP implementation.*  
*See individual documents for detailed specifications.*
