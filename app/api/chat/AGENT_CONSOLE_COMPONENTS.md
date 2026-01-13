# Agent Console - Component List (MVP)

**Concise component list for MVP implementation.**

---

## Component Hierarchy

```
AgentConsole (Main Layout)
├── Header
│   ├── Logo
│   ├── Title
│   ├── UserMenu
│   └── NotificationBadge
├── Sidebar
│   ├── Filters
│   │   ├── PriorityFilter
│   │   ├── PersonaFilter
│   │   ├── StatusFilter
│   │   └── DateRangeFilter
│   └── QuickStats
│       ├── PendingCount
│       ├── HighPriorityCount
│       ├── CompletedTodayCount
│       └── AvgResponseTime
├── MainContent
│   ├── HandoffQueue
│   │   └── HandoffCard[] (List)
│   └── ConversationDetailView (When selected)
│       ├── CustomerInfoCard
│       ├── ConversationSummaryCard
│       ├── LeadScoreCard
│       ├── ActionCard
│       ├── SuggestedScriptCard
│       ├── DoNotAskCard
│       ├── ConversationHistoryCard
│       └── ActionButtons
```

---

## Component List

### 1. Header

**Props:**
- `userName: string`
- `notificationCount: number`

**Components:**
- Logo
- Title: "Agent Console"
- UserMenu (dropdown)
- NotificationBadge

---

### 2. Sidebar

**Props:**
- `filters: FilterState`
- `stats: QuickStats`

**Components:**
- **Filters:**
  - PriorityFilter (dropdown)
  - PersonaFilter (dropdown)
  - StatusFilter (dropdown)
  - DateRangeFilter (date picker)

- **QuickStats:**
  - PendingCount (number)
  - HighPriorityCount (number)
  - CompletedTodayCount (number)
  - AvgResponseTime (time)

---

### 3. HandoffQueue

**Props:**
- `handoffs: HandoffSummary[]`
- `onSelect: (handoffId: string) => void`
- `onTakeHandoff: (handoffId: string) => void`

**Components:**
- HandoffCard[] (mapped list)
- EmptyState (when no handoffs)
- LoadingState

---

### 4. HandoffCard

**Props:**
- `handoff: HandoffSummary`
- `onClick: () => void`
- `onTakeHandoff: () => void`

**Display:**
- Priority badge
- Timestamp
- Customer info
- Persona badge
- Intent label
- Summary (truncated)
- Lead score
- Suggested action
- Action buttons

**Data:**
```typescript
interface HandoffSummary {
  handoffId: string
  priority: 'high' | 'medium' | 'low'
  timestamp: string
  customer: string
  persona: Persona
  intent: string
  summary: string
  leadScore: number
  suggestedAction: {
    type: string
    timeline: string
  }
}
```

---

### 5. ConversationDetailView

**Props:**
- `handoff: AgentAssistOutput`
- `leadScore: LeadScore`
- `onTakeHandoff: () => void`
- `onComplete: (outcome: string) => void`
- `onClose: () => void`

**Components:**
- CustomerInfoCard
- ConversationSummaryCard
- LeadScoreCard
- ActionCard
- SuggestedScriptCard
- DoNotAskCard
- ConversationHistoryCard
- ActionButtons

---

### 6. CustomerInfoCard

**Props:**
- `customerName?: string`
- `customerEmail?: string`
- `customerPhone?: string`
- `customerCompany?: string`

**Components:**
- Name/Email display
- Phone (clickable)
- Email (clickable)
- Company (if available)
- Copy buttons

---

### 7. ConversationSummaryCard

**Props:**
- `summary: string`
- `keyPoints: string[]`
- `persona: Persona`
- `intent: Intent`
- `buyingIntent: BuyingIntent`
- `urgency: UrgencyLevel`

**Components:**
- Summary text
- Key points list
- Persona badge
- Intent label
- Buying intent badge
- Urgency indicator

---

### 8. LeadScoreCard

**Props:**
- `score: number` // 0-100
- `breakdown: LeadScoreBreakdown`

**Components:**
- Score display (large number)
- Progress bar
- Breakdown list
- Score explanation

**Data:**
```typescript
interface LeadScoreBreakdown {
  buyingIntent: number
  urgency: number
  persona: number
  pricing: number
  contactRequested: number
  estimatedValue: number
}
```

---

### 9. ActionCard

**Props:**
- `suggestedAction: SuggestedAction`
- `onCall: () => void`
- `onSchedule: () => void`
- `onEmail: () => void`
- `onSendProposal: () => void`

**Components:**
- Action type icon
- Action type label
- Priority badge
- Timeline
- Estimated value
- Reason text
- Action buttons

---

### 10. SuggestedScriptCard

**Props:**
- `script: string`
- `onCopy: () => void`
- `onEdit: (newScript: string) => void`

**Components:**
- Script text (readable)
- Copy button
- Edit button

---

### 11. DoNotAskCard

**Props:**
- `doNotAsk: string[]`

**Components:**
- Warning icon
- List of items (with ❌ icons)

---

### 12. ConversationHistoryCard

**Props:**
- `history: ConversationMessage[]`
- `collapsed?: boolean`

**Components:**
- Collapse/expand button
- Message list
- Each message:
  - Timestamp
  - User message (right-aligned)
  - AI response (left-aligned)
  - Intent badge

**Data:**
```typescript
interface ConversationMessage {
  timestamp: string
  userMessage: string
  aiResponse: string
  intent: Intent
}
```

---

### 13. ActionButtons

**Props:**
- `handoffId: string`
- `status: 'pending' | 'in_progress' | 'completed'`
- `onTakeHandoff: () => void`
- `onComplete: (outcome: string) => void`
- `onEscalate: () => void`
- `onClose: () => void`

**Components:**
- Take Handoff button (if pending)
- Mark as Completed button (if in progress)
- Escalate button
- Close button

---

## Data Types

### HandoffSummary (Quick View)

```typescript
interface HandoffSummary {
  handoffId: string
  timestamp: string
  priority: 'high' | 'medium' | 'low'
  quickSummary: {
    customer: string
    persona: Persona
    intent: string
    buyingIntent: BuyingIntent
    urgency: UrgencyLevel
  }
  summary: string // Truncated
  leadScore: number
  suggestedAction: {
    type: string
    timeline: string
  }
}
```

### LeadScore

```typescript
interface LeadScore {
  score: number // 0-100
  breakdown: {
    buyingIntent: number
    urgency: number
    persona: number
    pricing: number
    contactRequested: number
    estimatedValue: number
  }
  explanation: string
}
```

---

## API Integration

### Hooks/Queries

```typescript
// Get handoff queue
const { data: handoffs } = useQuery({
  queryKey: ['handoffs', filters],
  queryFn: () => fetchHandoffs(filters)
})

// Get handoff details
const { data: handoff } = useQuery({
  queryKey: ['handoff', handoffId],
  queryFn: () => fetchHandoffDetails(handoffId)
})

// Calculate lead score
const { data: leadScore } = useQuery({
  queryKey: ['leadScore', handoffId],
  queryFn: () => calculateLeadScore(handoffId)
})

// Take handoff
const takeHandoff = useMutation({
  mutationFn: (handoffId: string) => takeHandoff(handoffId)
})

// Complete handoff
const completeHandoff = useMutation({
  mutationFn: ({ handoffId, outcome }: CompleteParams) => 
    completeHandoff(handoffId, outcome)
})
```

---

## Styling Guidelines

### Priority Colors
- High: `bg-red-50 border-red-200 text-red-700`
- Medium: `bg-orange-50 border-orange-200 text-orange-700`
- Low: `bg-green-50 border-green-200 text-green-700`

### Persona Colors
- REGISTRATION: `bg-blue-100 text-blue-700`
- ACCOUNTING: `bg-purple-100 text-purple-700`
- HR: `bg-teal-100 text-teal-700`

### Lead Score Colors
- 90-100: `text-green-600`
- 70-89: `text-blue-600`
- 50-69: `text-yellow-600`
- 0-49: `text-gray-600`

---

## Implementation Checklist

### Phase 1: MVP

- [ ] Header component
- [ ] Sidebar with filters
- [ ] Handoff queue list
- [ ] Handoff card component
- [ ] Conversation detail view
- [ ] Customer info card
- [ ] Conversation summary card
- [ ] Lead score calculation
- [ ] Lead score card
- [ ] Action card
- [ ] Suggested script card
- [ ] Do not ask card
- [ ] Conversation history card
- [ ] Action buttons
- [ ] API integration
- [ ] Responsive design

---

*See `AGENT_CONSOLE_UI.md` for complete design documentation.*
