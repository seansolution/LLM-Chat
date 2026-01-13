/**
 * Feedback Storage
 * 
 * Stores and retrieves user feedback.
 * Uses in-memory storage for development, ready for database integration.
 */

import type { UserFeedback } from './feedback'

// In-memory storage (in production, replace with database)
const feedbackStorage: UserFeedback[] = []

/**
 * Store user feedback
 */
export function storeFeedback(feedback: UserFeedback): void {
  feedbackStorage.push(feedback)
  
  // In production: Store in database
  // await db.feedbacks.insert(feedback)
  
  console.log(JSON.stringify({
    type: 'user_feedback_stored',
    ...feedback,
  }))
}

/**
 * Load feedbacks by filters
 */
export function loadFeedbacks(filters?: {
  role?: 'SALES' | 'SUPPORT' | 'OPS'
  variant?: 'A' | 'B' | 'none'
  responseType?: 'pricing' | 'overview' | 'greeting' | 'restricted' | 'none'
  sessionId?: string
  userId?: string
  startDate?: string
  endDate?: string
}): UserFeedback[] {
  let filtered = [...feedbackStorage]
  
  if (filters) {
    if (filters.role) {
      filtered = filtered.filter(f => f.role === filters.role)
    }
    if (filters.variant) {
      filtered = filtered.filter(f => f.variant === filters.variant)
    }
    if (filters.responseType) {
      filtered = filtered.filter(f => f.responseType === filters.responseType)
    }
    if (filters.sessionId) {
      filtered = filtered.filter(f => f.sessionId === filters.sessionId)
    }
    if (filters.userId) {
      filtered = filtered.filter(f => f.userId === filters.userId)
    }
    if (filters.startDate) {
      filtered = filtered.filter(f => f.timestamp >= filters.startDate!)
    }
    if (filters.endDate) {
      filtered = filtered.filter(f => f.timestamp <= filters.endDate!)
    }
  }
  
  return filtered
}

/**
 * Get feedback count
 */
export function getFeedbackCount(filters?: Parameters<typeof loadFeedbacks>[0]): number {
  return loadFeedbacks(filters).length
}
