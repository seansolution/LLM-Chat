/**
 * User Feedback Collection & Integration
 * 
 * Level 4 capability: Feedback loops for continuous improvement
 */

export type FeedbackType = 'thumbs_up' | 'thumbs_down' | 'rating' | 'comment'

export interface UserFeedback {
  sessionId: string
  userId?: string
  logId: string // Chat log ID this feedback relates to
  feedbackType: FeedbackType
  rating?: number // 1-5 if feedbackType is 'rating'
  comment?: string // Optional text feedback
  timestamp: string // ISO 8601
  role?: 'SALES' | 'SUPPORT' | 'OPS'
  variant?: 'A' | 'B' | 'none'
  responseType?: 'pricing' | 'overview' | 'greeting' | 'restricted' | 'none'
}

/**
 * Store user feedback (in production, store in database)
 * Now integrated with feedback-storage.ts
 */
export function storeFeedback(feedback: UserFeedback): void {
  // Use feedback storage (in-memory for now, ready for database)
  // Dynamic import to avoid circular dependency
  import('./feedback-storage').then(({ storeFeedback: storeFeedbackInStorage }) => {
    storeFeedbackInStorage(feedback)
  }).catch(err => {
    console.error('Error storing feedback:', err)
    // Fallback: log to console
    console.log(JSON.stringify({
      type: 'user_feedback',
      ...feedback,
    }))
  })
}

/**
 * Calculate feedback metrics for a variant
 */
export function calculateFeedbackMetrics(
  feedbacks: UserFeedback[],
  variant: 'A' | 'B',
  role: 'SALES' | 'SUPPORT' | 'OPS',
  responseType: 'pricing' | 'overview' | 'greeting'
): {
  totalFeedback: number
  thumbsUp: number
  thumbsDown: number
  averageRating: number
  positiveRate: number // (thumbs_up + rating >= 4) / total
} {
  const variantFeedbacks = feedbacks.filter(
    f => f.variant === variant && f.role === role && f.responseType === responseType
  )
  
  if (variantFeedbacks.length === 0) {
    return {
      totalFeedback: 0,
      thumbsUp: 0,
      thumbsDown: 0,
      averageRating: 0,
      positiveRate: 0,
    }
  }
  
  const thumbsUp = variantFeedbacks.filter(f => f.feedbackType === 'thumbs_up').length
  const thumbsDown = variantFeedbacks.filter(f => f.feedbackType === 'thumbs_down').length
  const ratings = variantFeedbacks
    .filter(f => f.feedbackType === 'rating' && f.rating !== undefined)
    .map(f => f.rating!)
  
  const averageRating = ratings.length > 0
    ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
    : 0
  
  const positiveCount = thumbsUp + ratings.filter(r => r >= 4).length
  const positiveRate = (positiveCount / variantFeedbacks.length) * 100
  
  return {
    totalFeedback: variantFeedbacks.length,
    thumbsUp,
    thumbsDown,
    averageRating,
    positiveRate,
  }
}
