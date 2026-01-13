# Agent Console UI Design

**Purpose:** Internal console for sales and support teams to handle AI chat handoffs  
**Target Users:** Sales agents, Support agents  
**MVP Scope:** Core handoff management and agent assist features

---

## Overview

The Agent Console provides sales and support teams with intelligent conversation summaries, lead scoring, and suggested next actions when taking over AI chat conversations. **Key goal: Enable agents to continue conversations seamlessly without repeating questions.**

---

## Layout Design

### Main Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│ HEADER                                                           │
│ [Logo] Agent Console                    [User] [Notifications] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ┌──────────────────────┐  ┌──────────────────────────────────┐ │
│ │ SIDEBAR              │  │ MAIN CONTENT AREA                 │ │
│ │                      │  │                                   │ │
│ │ [Filters]            │  │ ┌──────────────────────────────┐ │ │
│ │ - Priority           │  │ │ HANDOFF QUEUE                │ │ │
│ │ - Persona            │  │ │ (List of handoff cards)      │ │ │
│ │ - Status             │  │ │                              │ │ │
│ │                      │  │ │ [Handoff Card 1]              │ │ │
│ │ [Quick Stats]        │  │ │ [Handoff Card 2]              │ │ │
│ │ - Pending: 5         │  │ │ [Handoff Card 3]              │ │ │
│ │ - High Priority: 2   │  │ │                              │ │ │
│ │                      │  │ └──────────────────────────────┘ │ │
│ │                      │  │                                   │ │
│ │                      │  │ ┌──────────────────────────────┐ │ │
│ │                      │  │ │ CONVERSATION DETAIL VIEW     │ │ │
│ │                      │  │ │ (When card selected)         │ │ │
│ │                      │  │ │                              │ │ │
│ │                      │  │ │ [Summary]                    │ │ │
│ │                      │  │ │ [Action Card]                │ │ │
│ │                      │  │ │ [Conversation History]       │ │ │
│ │                      │  │ │                              │ │ │
│ │                      │  │ └──────────────────────────────┘ │ │
│ └──────────────────────┘  └──────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component List (MVP)

### 1. Header Component

**Purpose:** Navigation and user controls

**Components:**
- Logo/Brand
- Page title: "Agent Console"
- User menu (profile, settings, logout)
- Notification badge (pending handoffs count)

**Data:**
- User info
- Notification count

---

### 2. Sidebar Component

**Purpose:** Filters and quick stats

**Components:**
- **Filter Section:**
  - Priority filter (All / High / Medium / Low)
  - Persona filter (All / REGISTRATION / ACCOUNTING / HR)
  - Status filter (All / Pending / In Progress / Completed)
  - Date range filter

- **Quick Stats Section:**
  - Pending handoffs count
  - High priority count
  - Today's completed count
  - Average response time

**Data:**
- Handoff counts by filter
- Stats data

---

### 3. Handoff Queue Component

**Purpose:** List of pending handoffs

**Layout:** Vertical list of handoff cards

**Components:**
- Handoff Card (see below)
- Empty state (when no handoffs)
- Loading state
- Pagination (if needed)

**Data:**
- Array of handoff summaries

---

### 4. Handoff Card Component

**Purpose:** Quick view of handoff in queue

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│ 🔴 HIGH PRIORITY                    [2 min ago]     │
├─────────────────────────────────────────────────────┤
│ Customer: customer@example.com                      │
│ Persona: REGISTRATION  |  Intent: จดทะเบียนบริษัท  │
│                                                      │
│ Summary:                                            │
│ ลูกค้าสนใจการจดทะเบียนบริษัท และได้สอบถามราคาแล้ว... │
│                                                      │
│ Lead Score: 85/100  [Ready to Buy]                  │
│                                                      │
│ Suggested Action: 📞 Call within 1 hour            │
│                                                      │
│ [View Details] [Take Handoff]                        │
└─────────────────────────────────────────────────────┘
```

**Components:**
- Priority badge (🔴 High / 🟡 Medium / 🟢 Low)
- Timestamp (relative: "2 min ago")
- Customer info (name/email)
- Persona badge
- Intent label
- Summary text (truncated)
- Lead score (with visual indicator)
- Suggested action (icon + text)
- Action buttons

**Data:**
- `quickSummary` from AgentAssistOutput
- `priority`
- `timestamp`
- Lead score (calculated)

**Interactions:**
- Click card → Open detail view
- Click "Take Handoff" → Assign to current agent
- Hover → Show more details

---

### 5. Conversation Detail View Component

**Purpose:** Full conversation details when handoff is selected

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│ CONVERSATION DETAIL                                 │
│ [Back to Queue]                                     │
├─────────────────────────────────────────────────────┤
│                                                      │
│ ┌────────────────────────────────────────────────┐ │
│ │ CUSTOMER INFO                                  │ │
│ │ Name: customer@example.com                     │ │
│ │ Email: customer@example.com                    │ │
│ │ Phone: 081-234-5678                            │ │
│ │ Company: [Optional]                            │ │
│ └────────────────────────────────────────────────┘ │
│                                                      │
│ ┌────────────────────────────────────────────────┐ │
│ │ CONVERSATION SUMMARY                           │ │
│ │                                                 │ │
│ │ Summary: ลูกค้าสนใจการจดทะเบียนบริษัท...        │ │
│ │                                                 │ │
│ │ Key Points:                                     │ │
│ │ • สนใจจดทะเบียนบริษัท                           │ │
│ │ • สอบถามราคาแล้ว                                │ │
│ │ • ลูกค้าขอคุยกับเจ้าหน้าที่                      │ │
│ │                                                 │ │
│ │ Persona: REGISTRATION                           │ │
│ │ Intent: company_registration_pricing           │ │
│ │ Buying Intent: ready_to_buy                     │ │
│ │ Urgency: High                                   │ │
│ └────────────────────────────────────────────────┘ │
│                                                      │
│ ┌────────────────────────────────────────────────┐ │
│ │ LEAD SCORE                                      │ │
│ │                                                 │ │
│ │ Score: 85/100                                   │ │
│ │ [Progress bar: 85%]                            │ │
│ │                                                 │ │
│ │ Factors:                                        │ │
│ │ • Buying Intent: +30 (ready_to_buy)            │ │
│ │ • Urgency: +25 (high)                          │ │
│ │ • Persona Match: +15 (REGISTRATION)             │ │
│ │ • Pricing Discussed: +10                        │ │
│ │ • Contact Requested: +5                         │ │
│ └────────────────────────────────────────────────┘ │
│                                                      │
│ ┌────────────────────────────────────────────────┐ │
│ │ ACTION CARD                                     │ │
│ │                                                 │ │
│ │ 📞 Suggested Action: Call                       │ │
│ │ Priority: High                                  │ │
│ │ Timeline: ภายใน 1 ชั่วโมง                       │ │
│ │ Estimated Value: 25,000 THB                     │ │
│ │                                                 │ │
│ │ Reason: ลูกค้าพร้อมซื้อและมีความเร่งด่วน          │ │
│ │                                                 │ │
│ │ [Call Now] [Schedule Call] [Send Email]         │ │
│ └────────────────────────────────────────────────┘ │
│                                                      │
│ ┌────────────────────────────────────────────────┐ │
│ │ SUGGESTED SCRIPT                                │ │
│ │                                                 │ │
│ │ สวัสดีคุณcustomer ฉันเป็นเจ้าหน้าที่...         │ │
│ │                                                 │ │
│ │ [Copy Script] [Edit]                            │ │
│ └────────────────────────────────────────────────┘ │
│                                                      │
│ ┌────────────────────────────────────────────────┐ │
│ │ ⚠️ DO NOT ASK                                   │ │
│ │                                                 │ │
│ │ ❌ อย่าถามราคา (ลูกค้าทราบแล้ว)                  │ │
│ │ ❌ อย่าถามระยะเวลา (ลูกค้าทราบแล้ว)              │ │
│ │ ❌ อย่าถามเอกสารที่ต้องใช้ (ลูกค้าทราบแล้ว)      │ │
│ └────────────────────────────────────────────────┘ │
│                                                      │
│ ┌────────────────────────────────────────────────┐ │
│ │ CONVERSATION HISTORY                            │ │
│ │ [Collapsible]                                   │ │
│ │                                                 │ │
│ │ [10:00] User: สวัสดีครับ สนใจจดทะเบียน...      │ │
│ │ [10:00] AI: สวัสดีค่ะ! สำหรับการจดทะเบียน...   │ │
│ │ [10:01] User: ราคาเท่าไหร่ครับ                  │ │
│ │ [10:01] AI: ค่าบริการอยู่ที่ 25,000 บาท...      │ │
│ │ [10:02] User: อยากคุยกับเจ้าหน้าที่หน่อยครับ    │ │
│ │ [10:02] AI: ยินดีค่ะ! เจ้าหน้าที่พร้อม...        │ │
│ └────────────────────────────────────────────────┘ │
│                                                      │
│ [Mark as Completed] [Assign to Me] [Escalate]       │
└─────────────────────────────────────────────────────┘
```

**Components:**
- Customer Info Card
- Conversation Summary Card
- Lead Score Card
- Action Card
- Suggested Script Card
- Do Not Ask Card
- Conversation History Card
- Action Buttons

**Data:**
- Full `AgentAssistOutput` object
- Conversation history
- Lead score calculation

---

### 6. Customer Info Card Component

**Purpose:** Display customer contact information

**Components:**
- Customer name/email
- Phone number (clickable)
- Email (clickable)
- Company (if available)
- Copy to clipboard buttons

**Data:**
- `customerName`
- `customerEmail`
- `customerPhone`
- `customerCompany`

---

### 7. Conversation Summary Card Component

**Purpose:** Display conversation summary and key points

**Components:**
- Summary text
- Key points list (bullet points)
- Persona badge
- Intent label
- Buying intent badge
- Urgency indicator

**Data:**
- `summary.summary`
- `summary.keyPoints`
- `summary.persona`
- `summary.primaryIntent`
- `summary.buyingIntent`
- `summary.urgencyLevel`

---

### 8. Lead Score Card Component

**Purpose:** Display calculated lead score with breakdown

**Components:**
- Lead score (0-100) with visual indicator
- Score breakdown (factors contributing to score)
- Score explanation

**Calculation:**
```typescript
function calculateLeadScore(summary: ConversationSummary): number {
  let score = 0
  
  // Buying Intent (0-30 points)
  const buyingIntentScores = {
    'ready_to_buy': 30,
    'urgent': 25,
    'price_comparison': 20,
    'problem_solving': 15,
    'information_seeking': 10,
    'exploring': 5,
    'unknown': 0,
  }
  score += buyingIntentScores[summary.buyingIntent] || 0
  
  // Urgency (0-25 points)
  const urgencyScores = {
    'high': 25,
    'medium': 15,
    'low': 5,
    'unknown': 0,
  }
  score += urgencyScores[summary.urgencyLevel] || 0
  
  // Persona Match (0-15 points)
  // REGISTRATION typically higher value deals
  const personaScores = {
    'REGISTRATION': 15,
    'ACCOUNTING': 12,
    'HR': 10,
  }
  score += personaScores[summary.persona] || 0
  
  // Pricing Discussed (0-10 points)
  if (summary.alreadyAnswered.pricing) {
    score += 10
  }
  
  // Contact Requested (0-10 points)
  if (summary.handoffReason === 'user_requested') {
    score += 10
  }
  
  // Estimated Value (0-10 points)
  if (summary.suggestedAction.estimatedValue) {
    const value = summary.suggestedAction.estimatedValue
    if (value >= 100000) score += 10
    else if (value >= 50000) score += 7
    else if (value >= 25000) score += 5
    else score += 3
  }
  
  return Math.min(100, score)
}
```

**Data:**
- Calculated lead score
- Score breakdown factors

---

### 9. Action Card Component

**Purpose:** Display suggested next action prominently

**Components:**
- Action type icon (📞 Call / ✉️ Email / 📅 Schedule / 📄 Proposal)
- Action type label
- Priority badge
- Timeline
- Estimated value (if available)
- Reason text
- Action buttons (Call Now, Schedule, Send Email, etc.)

**Data:**
- `actionCard.suggestedAction`
- `actionCard.suggestedScript`

**Interactions:**
- Click "Call Now" → Initiate call (if phone integration)
- Click "Schedule" → Open calendar/scheduler
- Click "Send Email" → Open email composer
- Click "Send Proposal" → Open proposal template

---

### 10. Suggested Script Card Component

**Purpose:** Display suggested opening script for agent

**Components:**
- Script text (readable format)
- Copy button
- Edit button (opens editor)

**Data:**
- `actionCard.suggestedScript`

**Interactions:**
- Copy → Copy to clipboard
- Edit → Open inline editor

---

### 11. Do Not Ask Card Component

**Purpose:** Prevent agents from repeating questions

**Components:**
- Warning icon
- List of items NOT to ask
- Each item with explanation

**Data:**
- `actionCard.doNotAsk` array

**Styling:**
- Red/warning color scheme
- Prominent display
- Clear icons (❌)

---

### 12. Conversation History Card Component

**Purpose:** Display full conversation transcript

**Components:**
- Collapsible section
- Message list (chronological)
- Each message shows:
  - Timestamp
  - User message (right-aligned, distinct style)
  - AI response (left-aligned, distinct style)
  - Intent badge (if applicable)

**Data:**
- `conversationHistory` array

**Interactions:**
- Expand/collapse
- Scroll to specific message
- Search within history

---

### 13. Action Buttons Component

**Purpose:** Agent actions on handoff

**Components:**
- "Take Handoff" / "Assign to Me" button
- "Mark as Completed" button
- "Escalate" button
- "Close" button

**Interactions:**
- Take Handoff → Assigns handoff to current agent, marks as "In Progress"
- Mark as Completed → Marks handoff as completed, records outcome
- Escalate → Escalates to supervisor/manager
- Close → Closes detail view, returns to queue

---

## Data Requirements

### API Endpoints

#### 1. Get Handoff Queue
```
GET /api/agent/handoffs
Query params:
  - priority?: 'high' | 'medium' | 'low'
  - persona?: 'REGISTRATION' | 'ACCOUNTING' | 'HR'
  - status?: 'pending' | 'in_progress' | 'completed'
  - limit?: number
  - offset?: number

Response:
{
  handoffs: AgentAssistOutput[]
  total: number
  stats: {
    pending: number
    highPriority: number
    completedToday: number
  }
}
```

#### 2. Get Handoff Details
```
GET /api/agent/handoffs/:handoffId

Response:
AgentAssistOutput (full object)
```

#### 3. Take Handoff
```
POST /api/agent/handoffs/:handoffId/take

Response:
{
  success: boolean
  handoff: AgentAssistOutput
}
```

#### 4. Complete Handoff
```
POST /api/agent/handoffs/:handoffId/complete

Body:
{
  outcome: 'contacted' | 'no_response' | 'not_interested' | 'closed_deal'
  notes?: string
  dealValue?: number
}

Response:
{
  success: boolean
}
```

#### 5. Calculate Lead Score
```
POST /api/agent/handoffs/:handoffId/lead-score

Response:
{
  score: number // 0-100
  breakdown: {
    buyingIntent: number
    urgency: number
    persona: number
    pricing: number
    contactRequested: number
    estimatedValue: number
  }
}
```

---

## Component Specifications

### Lead Score Calculation

**Formula:**
```
Lead Score = 
  Buying Intent Score (0-30) +
  Urgency Score (0-25) +
  Persona Score (0-15) +
  Pricing Discussed (0-10) +
  Contact Requested (0-10) +
  Estimated Value Score (0-10)
```

**Scoring:**
- **90-100:** Hot lead, immediate action required
- **70-89:** Warm lead, follow up within 24 hours
- **50-69:** Cool lead, follow up within 3 days
- **0-49:** Cold lead, follow up when time permits

---

## MVP Scope

### Phase 1: Core Features (MVP)

**Must Have:**
- ✅ Handoff queue list
- ✅ Handoff card (quick view)
- ✅ Conversation detail view
- ✅ Customer info display
- ✅ Conversation summary
- ✅ Lead score calculation and display
- ✅ Suggested action card
- ✅ Suggested script
- ✅ Do not ask list
- ✅ Conversation history
- ✅ Take handoff action
- ✅ Mark as completed action

**Nice to Have (Post-MVP):**
- ⏳ Real-time updates (WebSocket)
- ⏳ Agent assignment
- ⏳ Notes/annotations
- ⏳ Deal tracking integration
- ⏳ Analytics dashboard
- ⏳ Bulk actions

---

## UI/UX Guidelines

### Design Principles

1. **Speed:** Agents need to act quickly, minimize clicks
2. **Clarity:** Information hierarchy, clear labels
3. **Context:** Show all relevant info without overwhelming
4. **Action-Oriented:** Prominent CTAs, suggested actions
5. **Prevent Errors:** Clear "do not ask" warnings

### Color Scheme

- **Priority High:** Red (#ef4444)
- **Priority Medium:** Orange (#f97316)
- **Priority Low:** Green (#22c55e)
- **Persona REGISTRATION:** Blue (#3b82f6)
- **Persona ACCOUNTING:** Purple (#a855f7)
- **Persona HR:** Teal (#14b8a6)
- **Lead Score:**
  - 90-100: Green
  - 70-89: Blue
  - 50-69: Yellow
  - 0-49: Gray

### Typography

- **Headers:** Bold, 18-24px
- **Body:** Regular, 14-16px
- **Labels:** Medium, 12-14px
- **Script:** Monospace or readable font, 14px

### Spacing

- **Card padding:** 16-24px
- **Section spacing:** 24-32px
- **Component spacing:** 12-16px

---

## Technical Stack (Recommendations)

### Frontend
- **Framework:** Next.js (React)
- **UI Library:** Tailwind CSS + shadcn/ui
- **State Management:** React Query / SWR
- **Real-time:** WebSocket (post-MVP)

### Components
- Use existing shadcn/ui components:
  - `Card` for containers
  - `Badge` for labels
  - `Button` for actions
  - `Avatar` for customer
  - `ScrollArea` for history
  - `Dialog` for modals

---

## Example Data Flow

```
1. Agent opens console
   → GET /api/agent/handoffs
   → Display handoff queue

2. Agent clicks handoff card
   → GET /api/agent/handoffs/:id
   → Display detail view
   → Calculate lead score

3. Agent clicks "Take Handoff"
   → POST /api/agent/handoffs/:id/take
   → Update status to "in_progress"
   → Assign to agent

4. Agent contacts customer
   → (External: phone/email)

5. Agent marks as completed
   → POST /api/agent/handoffs/:id/complete
   → Record outcome
   → Update stats
```

---

## Success Metrics

- **Time to First Action:** < 30 seconds from handoff to agent action
- **Completion Rate:** ≥ 80% of handoffs completed
- **Response Time:** < 1 hour for high priority
- **Agent Satisfaction:** ≥ 4.0/5.0
- **Deal Conversion:** Track deals closed from handoffs

---

*This design is ready for MVP implementation.*  
*Last Updated: 2024*
