/**
 * User Feedback API Endpoint
 * 
 * POST /api/chat/feedback
 * 
 * Level 4 capability: Collect user feedback for continuous improvement
 */

import { NextResponse } from 'next/server'
import type { UserFeedback } from '../feedback'
import { storeFeedback as storeFeedbackInStorage } from '../feedback-storage'

type ReqBody = {
  sessionId: string
  userId?: string
  logId: string // Chat log ID this feedback relates to
  feedbackType: 'thumbs_up' | 'thumbs_down' | 'rating' | 'comment'
  rating?: number // 1-5 if feedbackType is 'rating'
  comment?: string // Optional text feedback
  role?: 'SALES' | 'SUPPORT' | 'OPS'
  variant?: 'A' | 'B' | 'none'
  responseType?: 'pricing' | 'overview' | 'greeting' | 'restricted' | 'none'
}

export async function POST(req: Request) {
  try {
    const body: ReqBody = await req.json().catch(() => ({}))
    
    // Validate required fields
    if (!body.sessionId || !body.logId || !body.feedbackType) {
      return NextResponse.json(
        { error: 'Missing required fields: sessionId, logId, feedbackType' },
        { status: 400 }
      )
    }
    
    // Validate rating if feedbackType is 'rating'
    if (body.feedbackType === 'rating') {
      if (!body.rating || body.rating < 1 || body.rating > 5) {
        return NextResponse.json(
          { error: 'Rating must be between 1 and 5' },
          { status: 400 }
        )
      }
    }
    
    // Create feedback object
    const feedback: UserFeedback = {
      sessionId: body.sessionId,
      userId: body.userId,
      logId: body.logId,
      feedbackType: body.feedbackType,
      rating: body.rating,
      comment: body.comment,
      timestamp: new Date().toISOString(),
      role: body.role,
      variant: body.variant,
      responseType: body.responseType,
    }
    
    // Store feedback using feedback storage (in-memory for now, ready for database)
    storeFeedbackInStorage(feedback)
    
    return NextResponse.json({
      success: true,
      message: 'Feedback received. Thank you!',
      feedbackId: feedback.logId,
    })
  } catch (err) {
    console.error('Error processing feedback:', err)
    return NextResponse.json(
      { error: 'Failed to process feedback' },
      { status: 500 }
    )
  }
}
