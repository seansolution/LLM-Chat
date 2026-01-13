/**
 * Continuous Improvement API Endpoint
 * 
 * POST /api/chat/improvement
 * 
 * Triggers continuous improvement analysis manually
 * In production, this would run automatically via cron/scheduler
 */

import { NextResponse } from 'next/server'
import { triggerImprovementAnalysis } from '../improvement-scheduler'

export async function POST(req: Request) {
  try {
    const result = await triggerImprovementAnalysis()
    
    return NextResponse.json({
      success: true,
      message: result,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    console.error('Error triggering improvement analysis:', err)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to run improvement analysis',
        message: err instanceof Error ? err.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET endpoint for status check
export async function GET() {
  return NextResponse.json({
    status: 'active',
    endpoint: '/api/chat/improvement',
    description: 'Continuous improvement analysis endpoint',
    usage: 'POST to trigger analysis',
  })
}
