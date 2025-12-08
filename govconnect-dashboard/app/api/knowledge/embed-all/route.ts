import { NextRequest, NextResponse } from 'next/server'
import { ai, API_BASE_URL } from '@/lib/api-client'

/**
 * POST /api/knowledge/embed-all
 * Trigger embedding generation for all knowledge items
 */
export async function POST(request: NextRequest) {
  try {
    // Call AI service to embed all knowledge
    const response = await ai.embedAllKnowledge()

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'AI service error')
    }

    const result = await response.json()

    return NextResponse.json({
      success: true,
      message: `Processed ${result.processed} knowledge items`,
      processed: result.processed,
      failed: result.failed,
      total: result.total,
    })
  } catch (error: any) {
    console.error('Error triggering embedding:', error)
    
    // Better error message for connection refused
    if (error.cause?.code === 'ECONNREFUSED' || error.message?.includes('fetch failed')) {
      return NextResponse.json(
        { 
          error: 'AI Service is not running', 
          details: `Cannot connect to AI Service at ${API_BASE_URL}/ai. Please start the AI Service first.`,
          hint: 'Run: cd govconnect-ai-service && pnpm run dev'
        },
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to trigger embedding', details: error.message },
      { status: 500 }
    )
  }
}
