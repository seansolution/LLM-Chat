# Agent Console UI - Quick Start

**Quick reference for Agent Console UI design and components.**

---

## Layout Overview

```
┌─────────────────────────────────────────────────┐
│ HEADER                                          │
├──────────────┬──────────────────────────────────┤
│ SIDEBAR      │ MAIN CONTENT                     │
│              │                                  │
│ [Filters]    │ [Handoff Queue]                 │
│ [Stats]      │ [Detail View]                   │
└──────────────┴──────────────────────────────────┘
```

---

## Core Components

### 1. HandoffCard (Queue Item)

**Displays:**
- Priority badge
- Customer info
- Persona & Intent
- Summary
- Lead score
- Suggested action

**Actions:**
- View Details
- Take Handoff

---

### 2. ConversationDetailView

**Sections:**
1. **Customer Info** - Name, email, phone
2. **Summary** - Key points, persona, intent
3. **Lead Score** - 0-100 with breakdown
4. **Action Card** - Suggested next action
5. **Script** - Suggested opening script
6. **Do Not Ask** - Warnings
7. **History** - Full conversation

---

## Lead Score

**Calculation:**
- Buying Intent: 0-30 points
- Urgency: 0-25 points
- Persona: 0-15 points
- Pricing: 0-10 points
- Contact Requested: 0-10 points
- Estimated Value: 0-10 points

**Categories:**
- **90-100:** Hot (immediate action)
- **70-89:** Warm (within 24h)
- **50-69:** Cool (within 3 days)
- **0-49:** Cold (when time permits)

---

## Data Flow

```
1. Load Queue → GET /api/agent/handoffs
2. Select Handoff → GET /api/agent/handoffs/:id
3. Calculate Score → POST /api/agent/handoffs/:id/lead-score
4. Take Handoff → POST /api/agent/handoffs/:id/take
5. Complete → POST /api/agent/handoffs/:id/complete
```

---

## Component Props Summary

### HandoffCard
```typescript
{
  handoffId: string
  priority: 'high' | 'medium' | 'low'
  customer: string
  persona: Persona
  intent: string
  summary: string
  leadScore: number
  suggestedAction: { type, timeline }
}
```

### ConversationDetailView
```typescript
{
  handoff: AgentAssistOutput
  leadScore: LeadScore
  onTakeHandoff: () => void
  onComplete: (outcome: string) => void
}
```

---

## Key Features

✅ **Conversation Summary** - 1-2 sentence summary  
✅ **Persona** - REGISTRATION / ACCOUNTING / HR  
✅ **Intent** - Human-readable intent label  
✅ **Lead Score** - 0-100 with breakdown  
✅ **Suggested Actions** - Call, Email, Schedule, etc.  
✅ **Do Not Ask** - Prevents repeating questions  
✅ **Full History** - Complete conversation transcript  

---

## MVP Checklist

- [ ] Header with user menu
- [ ] Sidebar with filters
- [ ] Handoff queue list
- [ ] Handoff card component
- [ ] Detail view
- [ ] Lead score calculation
- [ ] Action card
- [ ] Script card
- [ ] Do not ask card
- [ ] Conversation history
- [ ] API integration

---

*See `AGENT_CONSOLE_UI.md` for complete design.*  
*See `AGENT_CONSOLE_COMPONENTS.md` for component specs.*
